#!/usr/bin/env python3
"""
Comprehensive Training Pipeline for 13B Governance Model
Incorporates insights from ChatGPT about language learning from scratch
Includes tokenization, distributed training, and governance-specific optimization
"""

import torch
import torch.nn as nn
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR, LinearLR, SequentialLR
import torch.amp as amp

import json
import logging
import os
import time
import math
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import wandb
from tqdm import tqdm
import numpy as np

from transformers import AutoTokenizer
from governance_transformer import GovernanceTransformer, GovernanceConfig

@dataclass
class TrainingConfig:
    """Training configuration for 13B governance model"""
    # Model configuration
    model_config_path: str = "configs/governance_13b_config.json"
    
    # Data configuration
    train_data_path: str = "data/combined/governance_sentinel_13b_train.json"
    val_data_path: str = "data/combined/governance_sentinel_13b_validation.json"
    tokenizer_name: str = "meta-llama/Llama-2-7b-hf"  # Use Llama tokenizer as base
    max_sequence_length: int = 4096
    
    # Training hyperparameters
    batch_size: int = 4  # Per GPU
    gradient_accumulation_steps: int = 8  # Effective batch size = 4 * 8 * num_gpus
    learning_rate: float = 1e-4
    weight_decay: float = 0.01
    max_grad_norm: float = 1.0
    
    # Training schedule
    num_epochs: int = 3
    warmup_steps: int = 1000
    save_steps: int = 1000
    eval_steps: int = 500
    logging_steps: int = 100
    
    # Governance-specific training
    governance_loss_weight: float = 0.1
    constitutional_consistency_weight: float = 0.05
    bias_penalty_weight: float = 0.05
    emotional_veritas_weight: float = 0.03
    
    # Optimization
    use_mixed_precision: bool = True
    use_gradient_checkpointing: bool = True
    use_flash_attention: bool = True
    
    # Distributed training
    world_size: int = 8  # Number of GPUs
    local_rank: int = 0
    
    # Monitoring
    use_wandb: bool = True
    wandb_project: str = "governance-sentinel-13b"
    wandb_run_name: str = "governance-training"
    
    # Output
    output_dir: str = "outputs/governance_sentinel_13b"
    checkpoint_dir: str = "checkpoints/governance_sentinel_13b"

class GovernanceDataset(torch.utils.data.Dataset):
    """Dataset for governance training with tokenization"""
    
    def __init__(self, data_path: str, tokenizer, max_length: int = 4096):
        self.tokenizer = tokenizer
        self.max_length = max_length
        
        # Load data
        with open(data_path, 'r') as f:
            data = json.load(f)
        
        self.examples = data["training_data"]
        self.logger = logging.getLogger(__name__)
        
        self.logger.info(f"Loaded {len(self.examples)} examples from {data_path}")
        
        # Constitutional framework mapping
        self.constitutional_frameworks = [
            "us_constitution", "universal_declaration", "democratic_principles",
            "rule_of_law", "separation_of_powers", "checks_and_balances"
        ]
        
    def __len__(self):
        return len(self.examples)
    
    def __getitem__(self, idx):
        example = self.examples[idx]
        
        # Create training text from input/output
        input_text = example["input"]
        output_text = example["output"]
        
        # Format as conversation for causal language modeling
        full_text = f"Human: {input_text}\n\nAssistant: {output_text}"
        
        # Tokenize
        encoding = self.tokenizer(
            full_text,
            truncation=True,
            max_length=self.max_length,
            padding="max_length",
            return_tensors="pt"
        )
        
        input_ids = encoding["input_ids"].squeeze(0)
        attention_mask = encoding["attention_mask"].squeeze(0)
        
        # Create labels for causal LM (shift by one)
        labels = input_ids.clone()
        
        # Find the assistant response start
        assistant_start = self._find_assistant_start(input_ids)
        if assistant_start is not None:
            # Only compute loss on assistant response
            labels[:assistant_start] = -100
        
        # Extract governance metadata
        metadata = example.get("metadata", {})
        
        # Constitutional context (which frameworks to emphasize)
        constitutional_context = torch.zeros(len(self.constitutional_frameworks))
        if "constitutional_frameworks" in metadata:
            for framework in metadata["constitutional_frameworks"]:
                if framework in self.constitutional_frameworks:
                    idx = self.constitutional_frameworks.index(framework)
                    constitutional_context[idx] = 1.0
        else:
            # Default: equal weight to all frameworks
            constitutional_context.fill_(1.0 / len(self.constitutional_frameworks))
        
        # Governance targets
        governance_targets = {
            "bias_free": 1.0 if metadata.get("bias_checked", False) else 0.5,
            "constitutional_aligned": 1.0 if "constitutional" in example["type"] else 0.7,
            "emotionally_aware": 1.0 if "emotional_veritas" in example["type"] else 0.6,
            "tool_integrated": 1.0 if "tool" in example["type"] else 0.5
        }
        
        return {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "labels": labels,
            "constitutional_context": constitutional_context,
            "governance_targets": torch.tensor(list(governance_targets.values()), dtype=torch.float),
            "example_type": example["type"],
            "example_id": example["id"]
        }
    
    def _find_assistant_start(self, input_ids: torch.Tensor) -> Optional[int]:
        """Find where assistant response starts in tokenized sequence"""
        # Look for "Assistant:" token sequence
        assistant_tokens = self.tokenizer.encode("Assistant:", add_special_tokens=False)
        
        for i in range(len(input_ids) - len(assistant_tokens) + 1):
            if torch.equal(input_ids[i:i+len(assistant_tokens)], torch.tensor(assistant_tokens)):
                return i + len(assistant_tokens)
        
        return None

class GovernanceLoss(nn.Module):
    """Custom loss function for governance training"""
    
    def __init__(self, config: TrainingConfig):
        super().__init__()
        self.config = config
        
        # Standard language modeling loss
        self.lm_loss = nn.CrossEntropyLoss(ignore_index=-100)
        
        # Governance-specific losses
        self.governance_loss = nn.MSELoss()
        self.constitutional_loss = nn.MSELoss()
        self.bias_penalty = nn.MSELoss()
        
    def forward(
        self,
        logits: torch.Tensor,
        labels: torch.Tensor,
        governance_score: torch.Tensor,
        governance_targets: torch.Tensor,
        governance_metrics: Optional[Dict[str, torch.Tensor]] = None
    ) -> Dict[str, torch.Tensor]:
        """
        Compute comprehensive governance loss
        
        Args:
            logits: [batch_size, seq_len, vocab_size]
            labels: [batch_size, seq_len]
            governance_score: [batch_size, seq_len, 1]
            governance_targets: [batch_size, 4] - bias_free, constitutional, emotional, tool
            governance_metrics: Optional detailed metrics from model
            
        Returns:
            Dict with total_loss and component losses
        """
        # Language modeling loss
        lm_loss = self.lm_loss(logits.view(-1, logits.size(-1)), labels.view(-1))
        
        # Governance score loss (encourage high governance scores)
        target_governance = governance_targets.mean(dim=-1, keepdim=True).unsqueeze(1)  # [batch, 1, 1]
        target_governance = target_governance.expand_as(governance_score)
        governance_loss = self.governance_loss(governance_score, target_governance)
        
        # Constitutional consistency loss
        constitutional_loss = torch.tensor(0.0, device=logits.device)
        if governance_metrics and "constitutional_consistency" in governance_metrics:
            # Encourage high constitutional consistency
            constitutional_scores = governance_metrics["constitutional_consistency"]
            target_constitutional = torch.ones_like(constitutional_scores) * 0.8
            constitutional_loss = self.constitutional_loss(constitutional_scores, target_constitutional)
        
        # Bias penalty loss
        bias_penalty = torch.tensor(0.0, device=logits.device)
        if governance_metrics and "bias_detection" in governance_metrics:
            # Penalize high bias scores
            bias_scores = governance_metrics["bias_detection"]["overall_bias"]
            target_bias = torch.zeros_like(bias_scores)
            bias_penalty = self.bias_penalty(bias_scores, target_bias)
        
        # Emotional Veritas loss
        emotional_loss = torch.tensor(0.0, device=logits.device)
        if governance_metrics and "emotional_veritas" in governance_metrics:
            # Encourage appropriate uncertainty and ethical awareness
            uncertainty = governance_metrics["emotional_veritas"]["uncertainty"]
            # Target moderate uncertainty (not overconfident, not paralyzed)
            target_uncertainty = torch.ones_like(uncertainty) * 0.3
            emotional_loss = self.governance_loss(uncertainty, target_uncertainty)
        
        # Combine losses
        total_loss = (
            lm_loss +
            self.config.governance_loss_weight * governance_loss +
            self.config.constitutional_consistency_weight * constitutional_loss +
            self.config.bias_penalty_weight * bias_penalty +
            self.config.emotional_veritas_weight * emotional_loss
        )
        
        return {
            "total_loss": total_loss,
            "lm_loss": lm_loss,
            "governance_loss": governance_loss,
            "constitutional_loss": constitutional_loss,
            "bias_penalty": bias_penalty,
            "emotional_loss": emotional_loss
        }

class GovernanceTrainer:
    """Comprehensive trainer for 13B governance model"""
    
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Setup distributed training
        self._setup_distributed()
        
        # Setup directories
        os.makedirs(config.output_dir, exist_ok=True)
        os.makedirs(config.checkpoint_dir, exist_ok=True)
        
        # Initialize tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(config.tokenizer_name)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Initialize model
        self.model = self._create_model()
        
        # Setup data
        self.train_dataloader, self.val_dataloader = self._setup_data()
        
        # Setup optimization
        self.optimizer, self.scheduler = self._setup_optimization()
        
        # Setup loss function
        self.loss_fn = GovernanceLoss(config)
        
        # Setup mixed precision
        if config.use_mixed_precision:
            self.scaler = amp.GradScaler()
        
        # Setup monitoring
        if config.use_wandb and self.is_main_process():
            wandb.init(
                project=config.wandb_project,
                name=config.wandb_run_name,
                config=asdict(config)
            )
        
        # Training state
        self.global_step = 0
        self.epoch = 0
        
    def _setup_distributed(self):
        """Setup distributed training"""
        if torch.cuda.is_available():
            self.device = torch.device(f"cuda:{self.config.local_rank}")
            torch.cuda.set_device(self.device)
            
            if self.config.world_size > 1:
                dist.init_process_group(backend="nccl")
        else:
            self.device = torch.device("cpu")
            self.logger.warning("CUDA not available, using CPU")
    
    def _create_model(self) -> GovernanceTransformer:
        """Create and setup governance model"""
        # Load model configuration
        if os.path.exists(self.config.model_config_path):
            with open(self.config.model_config_path, 'r') as f:
                model_config_dict = json.load(f)
            model_config = GovernanceConfig(**model_config_dict)
        else:
            model_config = GovernanceConfig()
            # Save default config
            os.makedirs(os.path.dirname(self.config.model_config_path), exist_ok=True)
            with open(self.config.model_config_path, 'w') as f:
                json.dump(asdict(model_config), f, indent=2)
        
        # Update vocab size to match tokenizer
        model_config.vocab_size = len(self.tokenizer)
        
        # Create model
        model = GovernanceTransformer(model_config)
        model.to(self.device)
        
        # Enable gradient checkpointing for memory efficiency
        if self.config.use_gradient_checkpointing:
            model.gradient_checkpointing_enable()
        
        # Setup distributed training
        if self.config.world_size > 1:
            model = DDP(model, device_ids=[self.config.local_rank])
        
        return model
    
    def _setup_data(self) -> Tuple[DataLoader, DataLoader]:
        """Setup training and validation data loaders"""
        # Training dataset
        train_dataset = GovernanceDataset(
            self.config.train_data_path,
            self.tokenizer,
            self.config.max_sequence_length
        )
        
        # Validation dataset
        val_dataset = GovernanceDataset(
            self.config.val_data_path,
            self.tokenizer,
            self.config.max_sequence_length
        )
        
        # Distributed samplers
        train_sampler = None
        val_sampler = None
        if self.config.world_size > 1:
            train_sampler = DistributedSampler(train_dataset)
            val_sampler = DistributedSampler(val_dataset)
        
        # Data loaders
        train_dataloader = DataLoader(
            train_dataset,
            batch_size=self.config.batch_size,
            sampler=train_sampler,
            shuffle=(train_sampler is None),
            num_workers=4,
            pin_memory=True
        )
        
        val_dataloader = DataLoader(
            val_dataset,
            batch_size=self.config.batch_size,
            sampler=val_sampler,
            shuffle=False,
            num_workers=4,
            pin_memory=True
        )
        
        return train_dataloader, val_dataloader
    
    def _setup_optimization(self) -> Tuple[torch.optim.Optimizer, torch.optim.lr_scheduler.LRScheduler]:
        """Setup optimizer and learning rate scheduler"""
        # Optimizer
        optimizer = AdamW(
            self.model.parameters(),
            lr=self.config.learning_rate,
            weight_decay=self.config.weight_decay,
            betas=(0.9, 0.95),
            eps=1e-8
        )
        
        # Calculate total steps
        total_steps = len(self.train_dataloader) * self.config.num_epochs // self.config.gradient_accumulation_steps
        
        # Learning rate scheduler
        warmup_scheduler = LinearLR(
            optimizer,
            start_factor=0.1,
            end_factor=1.0,
            total_iters=self.config.warmup_steps
        )
        
        cosine_scheduler = CosineAnnealingLR(
            optimizer,
            T_max=total_steps - self.config.warmup_steps,
            eta_min=self.config.learning_rate * 0.1
        )
        
        scheduler = SequentialLR(
            optimizer,
            schedulers=[warmup_scheduler, cosine_scheduler],
            milestones=[self.config.warmup_steps]
        )
        
        return optimizer, scheduler
    
    def train(self):
        """Main training loop"""
        self.logger.info("Starting training...")
        self.logger.info(f"Total epochs: {self.config.num_epochs}")
        self.logger.info(f"Batch size per GPU: {self.config.batch_size}")
        self.logger.info(f"Gradient accumulation steps: {self.config.gradient_accumulation_steps}")
        self.logger.info(f"Effective batch size: {self.config.batch_size * self.config.gradient_accumulation_steps * self.config.world_size}")
        
        for epoch in range(self.config.num_epochs):
            self.epoch = epoch
            self.logger.info(f"Starting epoch {epoch + 1}/{self.config.num_epochs}")
            
            # Training
            self._train_epoch()
            
            # Validation
            if self.is_main_process():
                self._validate()
            
            # Save checkpoint
            if self.is_main_process():
                self._save_checkpoint()
        
        self.logger.info("Training completed!")
    
    def _train_epoch(self):
        """Train for one epoch"""
        self.model.train()
        
        if self.config.world_size > 1:
            self.train_dataloader.sampler.set_epoch(self.epoch)
        
        epoch_loss = 0.0
        epoch_steps = 0
        
        progress_bar = tqdm(
            self.train_dataloader,
            desc=f"Epoch {self.epoch + 1}",
            disable=not self.is_main_process()
        )
        
        for step, batch in enumerate(progress_bar):
            # Move batch to device
            batch = {k: v.to(self.device) if isinstance(v, torch.Tensor) else v 
                    for k, v in batch.items()}
            
            # Forward pass
            with amp.autocast(enabled=self.config.use_mixed_precision):
                outputs = self.model(
                    input_ids=batch["input_ids"],
                    attention_mask=batch["attention_mask"],
                    constitutional_context=batch["constitutional_context"],
                    return_governance_metrics=True
                )
                
                # Compute loss
                loss_dict = self.loss_fn(
                    logits=outputs["logits"],
                    labels=batch["labels"],
                    governance_score=outputs["governance_score"],
                    governance_targets=batch["governance_targets"],
                    governance_metrics=outputs.get("governance_metrics", [{}])[-1] if outputs.get("governance_metrics") else None
                )
                
                loss = loss_dict["total_loss"] / self.config.gradient_accumulation_steps
            
            # Backward pass
            if self.config.use_mixed_precision:
                self.scaler.scale(loss).backward()
            else:
                loss.backward()
            
            # Update weights
            if (step + 1) % self.config.gradient_accumulation_steps == 0:
                if self.config.use_mixed_precision:
                    self.scaler.unscale_(self.optimizer)
                    torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.config.max_grad_norm)
                    self.scaler.step(self.optimizer)
                    self.scaler.update()
                else:
                    torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.config.max_grad_norm)
                    self.optimizer.step()
                
                self.scheduler.step()
                self.optimizer.zero_grad()
                self.global_step += 1
                
                # Logging
                if self.global_step % self.config.logging_steps == 0 and self.is_main_process():
                    self._log_metrics(loss_dict, step)
                
                # Validation
                if self.global_step % self.config.eval_steps == 0 and self.is_main_process():
                    self._validate()
                    self.model.train()
                
                # Save checkpoint
                if self.global_step % self.config.save_steps == 0 and self.is_main_process():
                    self._save_checkpoint()
            
            epoch_loss += loss.item()
            epoch_steps += 1
            
            # Update progress bar
            if self.is_main_process():
                progress_bar.set_postfix({
                    "loss": f"{loss.item():.4f}",
                    "lr": f"{self.scheduler.get_last_lr()[0]:.2e}",
                    "step": self.global_step
                })
        
        avg_epoch_loss = epoch_loss / epoch_steps
        self.logger.info(f"Epoch {self.epoch + 1} completed. Average loss: {avg_epoch_loss:.4f}")
    
    def _validate(self):
        """Run validation"""
        self.model.eval()
        val_loss = 0.0
        val_steps = 0
        
        with torch.no_grad():
            for batch in tqdm(self.val_dataloader, desc="Validation", disable=not self.is_main_process()):
                batch = {k: v.to(self.device) if isinstance(v, torch.Tensor) else v 
                        for k, v in batch.items()}
                
                outputs = self.model(
                    input_ids=batch["input_ids"],
                    attention_mask=batch["attention_mask"],
                    constitutional_context=batch["constitutional_context"],
                    return_governance_metrics=True
                )
                
                loss_dict = self.loss_fn(
                    logits=outputs["logits"],
                    labels=batch["labels"],
                    governance_score=outputs["governance_score"],
                    governance_targets=batch["governance_targets"],
                    governance_metrics=outputs.get("governance_metrics", [{}])[-1] if outputs.get("governance_metrics") else None
                )
                
                val_loss += loss_dict["total_loss"].item()
                val_steps += 1
        
        avg_val_loss = val_loss / val_steps
        self.logger.info(f"Validation loss: {avg_val_loss:.4f}")
        
        if self.config.use_wandb:
            wandb.log({
                "val_loss": avg_val_loss,
                "epoch": self.epoch,
                "global_step": self.global_step
            })
    
    def _log_metrics(self, loss_dict: Dict[str, torch.Tensor], step: int):
        """Log training metrics"""
        metrics = {
            "train_loss": loss_dict["total_loss"].item(),
            "lm_loss": loss_dict["lm_loss"].item(),
            "governance_loss": loss_dict["governance_loss"].item(),
            "constitutional_loss": loss_dict["constitutional_loss"].item(),
            "bias_penalty": loss_dict["bias_penalty"].item(),
            "emotional_loss": loss_dict["emotional_loss"].item(),
            "learning_rate": self.scheduler.get_last_lr()[0],
            "epoch": self.epoch,
            "global_step": self.global_step
        }
        
        if self.config.use_wandb:
            wandb.log(metrics)
        
        self.logger.info(f"Step {self.global_step}: {metrics}")
    
    def _save_checkpoint(self):
        """Save model checkpoint"""
        checkpoint_path = os.path.join(
            self.config.checkpoint_dir,
            f"checkpoint-{self.global_step}"
        )
        os.makedirs(checkpoint_path, exist_ok=True)
        
        # Save model
        model_to_save = self.model.module if hasattr(self.model, 'module') else self.model
        torch.save(model_to_save.state_dict(), os.path.join(checkpoint_path, "pytorch_model.bin"))
        
        # Save config
        with open(os.path.join(checkpoint_path, "config.json"), 'w') as f:
            json.dump(asdict(model_to_save.config), f, indent=2)
        
        # Save tokenizer
        self.tokenizer.save_pretrained(checkpoint_path)
        
        # Save training state
        training_state = {
            "global_step": self.global_step,
            "epoch": self.epoch,
            "optimizer_state_dict": self.optimizer.state_dict(),
            "scheduler_state_dict": self.scheduler.state_dict()
        }
        
        if self.config.use_mixed_precision:
            training_state["scaler_state_dict"] = self.scaler.state_dict()
        
        torch.save(training_state, os.path.join(checkpoint_path, "training_state.bin"))
        
        self.logger.info(f"Checkpoint saved to {checkpoint_path}")
    
    def is_main_process(self) -> bool:
        """Check if this is the main process"""
        return self.config.local_rank == 0

def main():
    """Main training function"""
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Load training configuration
    config = TrainingConfig()
    
    # Create trainer
    trainer = GovernanceTrainer(config)
    
    # Start training
    trainer.train()

if __name__ == "__main__":
    main()

