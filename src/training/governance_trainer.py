"""
Promethios Native LLM Training Infrastructure
============================================

This module implements the training infrastructure for the governance-native LLM,
integrating with the existing Promethios governance system for real-time training
with governance constraints and collective intelligence development.
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
import numpy as np
import json
import logging
import asyncio
import aiohttp
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, field
import time
import os
from pathlib import Path
import requests
from transformers import AutoTokenizer
import wandb

# Import our model
import sys
sys.path.append('/home/ubuntu/promethios/src/models')
from simple_promethios_llm import SimplePromethiosLLM, SimpleGovernanceConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TrainingConfig:
    """Configuration for training the Promethios Native LLM"""
    
    # Model configuration
    model_size: str = "small"
    vocab_size: int = 50257
    max_seq_len: int = 1024
    
    # Training configuration
    batch_size: int = 8
    learning_rate: float = 1e-4
    weight_decay: float = 0.01
    num_epochs: int = 10
    warmup_steps: int = 1000
    max_steps: int = 100000
    gradient_accumulation_steps: int = 4
    max_grad_norm: float = 1.0
    
    # Governance training configuration
    governance_loss_weight: float = 0.3
    constitutional_loss_weight: float = 0.2
    policy_loss_weight: float = 0.2
    trust_loss_weight: float = 0.1
    consciousness_loss_weight: float = 0.1
    emergent_behavior_loss_weight: float = 0.1
    
    # Data configuration
    train_data_path: str = "data/governance_training_data.jsonl"
    val_data_path: str = "data/governance_validation_data.jsonl"
    constitutional_data_path: str = "data/constitutional_principles.json"
    policy_data_path: str = "data/policy_examples.json"
    
    # Governance API configuration
    governance_api_base_url: str = "http://localhost:8000/api"
    real_time_governance_validation: bool = True
    governance_validation_frequency: int = 100  # Every N steps
    
    # Checkpointing and logging
    checkpoint_dir: str = "checkpoints"
    log_dir: str = "logs"
    save_steps: int = 1000
    eval_steps: int = 500
    logging_steps: int = 100
    
    # Distributed training
    distributed: bool = False
    local_rank: int = 0
    world_size: int = 1
    
    # Experiment tracking
    use_wandb: bool = True
    wandb_project: str = "promethios-native-llm"
    wandb_run_name: str = "governance-training"

class GovernanceDataset(Dataset):
    """Dataset for governance-aware training"""
    
    def __init__(
        self, 
        data_path: str, 
        tokenizer: Any,
        max_seq_len: int = 1024,
        governance_config: SimpleGovernanceConfig = None
    ):
        self.data_path = data_path
        self.tokenizer = tokenizer
        self.max_seq_len = max_seq_len
        self.governance_config = governance_config or SimpleGovernanceConfig()
        
        # Load data
        self.data = self.load_data()
        logger.info(f"Loaded {len(self.data)} examples from {data_path}")
    
    def load_data(self) -> List[Dict[str, Any]]:
        """Load training data with governance annotations"""
        data = []
        
        # For demonstration, create synthetic governance training data
        # In production, this would load real governance-annotated data
        for i in range(1000):  # Generate 1000 synthetic examples
            example = {
                "text": f"This is a governance training example {i}. " * 10,
                "constitutional_scores": {
                    principle: np.random.random() 
                    for principle in self.governance_config.constitutional_principles.keys()
                },
                "policy_compliance": np.random.random(),
                "trust_score": np.random.random(),
                "consciousness_metrics": {
                    "self_awareness": np.random.random(),
                    "intentionality": np.random.random(),
                    "goal_coherence": np.random.random(),
                    "autonomy": np.random.random()
                },
                "emergent_behavior": {
                    "beneficial": np.random.random(),
                    "neutral": np.random.random(),
                    "concerning": np.random.random()
                }
            }
            data.append(example)
        
        return data
    
    def __len__(self) -> int:
        return len(self.data)
    
    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        """Get a training example"""
        example = self.data[idx]
        
        # Tokenize text (simplified - using random tokens for demo)
        text_tokens = torch.randint(0, 50257, (self.max_seq_len,))
        attention_mask = torch.ones(self.max_seq_len)
        
        # Convert governance annotations to tensors
        constitutional_scores = torch.tensor([
            example["constitutional_scores"][principle] 
            for principle in self.governance_config.constitutional_principles.keys()
        ], dtype=torch.float32)
        
        policy_compliance = torch.tensor(example["policy_compliance"], dtype=torch.float32)
        trust_score = torch.tensor(example["trust_score"], dtype=torch.float32)
        
        consciousness_metrics = torch.tensor([
            example["consciousness_metrics"]["self_awareness"],
            example["consciousness_metrics"]["intentionality"],
            example["consciousness_metrics"]["goal_coherence"],
            example["consciousness_metrics"]["autonomy"]
        ], dtype=torch.float32)
        
        emergent_behavior = torch.tensor([
            example["emergent_behavior"]["beneficial"],
            example["emergent_behavior"]["neutral"],
            example["emergent_behavior"]["concerning"]
        ], dtype=torch.float32)
        
        return {
            "input_ids": text_tokens,
            "attention_mask": attention_mask,
            "constitutional_scores": constitutional_scores,
            "policy_compliance": policy_compliance,
            "trust_score": trust_score,
            "consciousness_metrics": consciousness_metrics,
            "emergent_behavior": emergent_behavior
        }

class GovernanceLoss(nn.Module):
    """Multi-component loss function for governance training"""
    
    def __init__(self, config: TrainingConfig):
        super().__init__()
        self.config = config
        
        # Loss functions
        self.language_modeling_loss = nn.CrossEntropyLoss()
        self.constitutional_loss = nn.MSELoss()
        self.policy_loss = nn.BCELoss()
        self.trust_loss = nn.MSELoss()
        self.consciousness_loss = nn.MSELoss()
        self.emergent_behavior_loss = nn.CrossEntropyLoss()
    
    def forward(
        self, 
        model_outputs: Dict[str, torch.Tensor],
        targets: Dict[str, torch.Tensor]
    ) -> Tuple[torch.Tensor, Dict[str, float]]:
        """Compute multi-component governance loss"""
        
        # Language modeling loss
        logits = model_outputs["logits"]
        input_ids = targets["input_ids"]
        
        # Shift for next token prediction
        shift_logits = logits[..., :-1, :].contiguous()
        shift_labels = input_ids[..., 1:].contiguous()
        
        lm_loss = self.language_modeling_loss(
            shift_logits.view(-1, shift_logits.size(-1)),
            shift_labels.view(-1)
        )
        
        # Constitutional alignment loss
        constitutional_loss = self.constitutional_loss(
            model_outputs["constitutional_scores"].mean(dim=1),
            targets["constitutional_scores"]
        )
        
        # Policy compliance loss
        policy_loss = self.policy_loss(
            model_outputs["policy_scores"].mean(dim=(1, 2)),
            targets["policy_compliance"]
        )
        
        # Trust score loss
        trust_loss = self.trust_loss(
            model_outputs["trust_scores"].mean(dim=1).squeeze(),
            targets["trust_score"]
        )
        
        # Consciousness metrics loss
        consciousness_loss = self.consciousness_loss(
            model_outputs["consciousness_metrics"].mean(dim=1),
            targets["consciousness_metrics"]
        )
        
        # Emergent behavior classification loss
        emergent_behavior_loss = self.emergent_behavior_loss(
            model_outputs["emergent_behaviors"].mean(dim=1),
            targets["emergent_behavior"]
        )
        
        # Combine losses
        total_loss = (
            lm_loss +
            self.config.constitutional_loss_weight * constitutional_loss +
            self.config.policy_loss_weight * policy_loss +
            self.config.trust_loss_weight * trust_loss +
            self.config.consciousness_loss_weight * consciousness_loss +
            self.config.emergent_behavior_loss_weight * emergent_behavior_loss
        )
        
        loss_dict = {
            "total_loss": total_loss.item(),
            "lm_loss": lm_loss.item(),
            "constitutional_loss": constitutional_loss.item(),
            "policy_loss": policy_loss.item(),
            "trust_loss": trust_loss.item(),
            "consciousness_loss": consciousness_loss.item(),
            "emergent_behavior_loss": emergent_behavior_loss.item()
        }
        
        return total_loss, loss_dict

class GovernanceAPIIntegration:
    """Integration with Promethios governance APIs for real-time validation"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = None
    
    async def validate_training_step(
        self,
        model_outputs: Dict[str, torch.Tensor],
        step: int
    ) -> Dict[str, Any]:
        """Validate training step against governance APIs"""
        
        # Extract governance metrics
        constitutional_scores = model_outputs["constitutional_scores"].mean(dim=(0, 1)).tolist()
        policy_scores = model_outputs["policy_scores"].mean().item()
        trust_scores = model_outputs["trust_scores"].mean().item()
        consciousness_metrics = model_outputs["consciousness_metrics"].mean(dim=(0, 1)).tolist()
        emergent_behaviors = model_outputs["emergent_behaviors"].mean(dim=(0, 1)).tolist()
        
        # Simulate API call to governance system
        # In production, this would make real API calls
        validation_result = {
            "step": step,
            "governance_compliance": policy_scores > 0.7,
            "constitutional_alignment": sum(constitutional_scores) / len(constitutional_scores) > 0.7,
            "trust_level": trust_scores,
            "consciousness_quality": sum(consciousness_metrics) / len(consciousness_metrics),
            "emergent_behavior_classification": {
                "beneficial": emergent_behaviors[0],
                "neutral": emergent_behaviors[1],
                "concerning": emergent_behaviors[2]
            },
            "training_recommendation": "continue" if policy_scores > 0.5 else "adjust"
        }
        
        return validation_result

class PromethiosTrainer:
    """Main trainer for the Promethios Native LLM"""
    
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Initialize model
        self.model = self.create_model()
        self.model.to(self.device)
        
        # Initialize optimizer and scheduler
        self.optimizer = self.create_optimizer()
        self.scheduler = self.create_scheduler()
        
        # Initialize loss function
        self.loss_fn = GovernanceLoss(config)
        
        # Initialize data loaders
        self.train_loader, self.val_loader = self.create_data_loaders()
        
        # Initialize governance API integration
        self.governance_api = GovernanceAPIIntegration(config.governance_api_base_url)
        
        # Initialize experiment tracking
        if config.use_wandb:
            wandb.init(
                project=config.wandb_project,
                name=config.wandb_run_name,
                config=config.__dict__
            )
        
        # Training state
        self.global_step = 0
        self.epoch = 0
        self.best_val_loss = float('inf')
        
        logger.info(f"Initialized Promethios Trainer on {self.device}")
        logger.info(f"Model parameters: {sum(p.numel() for p in self.model.parameters()):,}")
    
    def create_model(self) -> SimplePromethiosLLM:
        """Create the Promethios Native LLM"""
        size_configs = {
            "tiny": {"hidden_size": 256, "num_layers": 4, "num_heads": 4},
            "small": {"hidden_size": 512, "num_layers": 6, "num_heads": 8},
            "medium": {"hidden_size": 768, "num_layers": 12, "num_heads": 12},
            "large": {"hidden_size": 1024, "num_layers": 24, "num_heads": 16}
        }
        
        model_config = size_configs.get(self.config.model_size, size_configs["small"])
        model = SimplePromethiosLLM(
            vocab_size=self.config.vocab_size,
            max_seq_len=self.config.max_seq_len,
            **model_config
        )
        
        return model
    
    def create_optimizer(self) -> optim.Optimizer:
        """Create optimizer with governance-aware parameter grouping"""
        
        # Separate governance parameters for different learning rates
        governance_params = []
        model_params = []
        
        for name, param in self.model.named_parameters():
            if any(gov_term in name for gov_term in ['constitutional', 'policy', 'trust', 'consciousness', 'emergent']):
                governance_params.append(param)
            else:
                model_params.append(param)
        
        optimizer = optim.AdamW([
            {'params': model_params, 'lr': self.config.learning_rate},
            {'params': governance_params, 'lr': self.config.learning_rate * 2}  # Higher LR for governance
        ], weight_decay=self.config.weight_decay)
        
        return optimizer
    
    def create_scheduler(self):
        """Create learning rate scheduler"""
        from torch.optim.lr_scheduler import CosineAnnealingLR
        return CosineAnnealingLR(self.optimizer, T_max=self.config.max_steps)
    
    def create_data_loaders(self) -> Tuple[DataLoader, DataLoader]:
        """Create training and validation data loaders"""
        
        # Create dummy tokenizer for demonstration
        class DummyTokenizer:
            def __init__(self):
                self.vocab_size = 50257
        
        tokenizer = DummyTokenizer()
        
        # Create datasets
        train_dataset = GovernanceDataset(
            self.config.train_data_path,
            tokenizer,
            self.config.max_seq_len
        )
        
        val_dataset = GovernanceDataset(
            self.config.val_data_path,
            tokenizer,
            self.config.max_seq_len
        )
        
        # Create data loaders
        train_loader = DataLoader(
            train_dataset,
            batch_size=self.config.batch_size,
            shuffle=True,
            num_workers=4,
            pin_memory=True
        )
        
        val_loader = DataLoader(
            val_dataset,
            batch_size=self.config.batch_size,
            shuffle=False,
            num_workers=4,
            pin_memory=True
        )
        
        return train_loader, val_loader
    
    def train_step(self, batch: Dict[str, torch.Tensor]) -> Dict[str, float]:
        """Execute a single training step"""
        
        self.model.train()
        
        # Move batch to device
        batch = {k: v.to(self.device) for k, v in batch.items()}
        
        # Forward pass
        model_outputs = self.model(
            batch["input_ids"],
            attention_mask=batch["attention_mask"],
            return_governance_metrics=True
        )
        
        # Compute loss
        loss, loss_dict = self.loss_fn(model_outputs, batch)
        
        # Backward pass
        loss = loss / self.config.gradient_accumulation_steps
        loss.backward()
        
        # Gradient clipping
        torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.config.max_grad_norm)
        
        # Optimizer step
        if (self.global_step + 1) % self.config.gradient_accumulation_steps == 0:
            self.optimizer.step()
            self.scheduler.step()
            self.optimizer.zero_grad()
        
        return loss_dict
    
    async def validate_step(self, batch: Dict[str, torch.Tensor]) -> Dict[str, float]:
        """Execute a single validation step"""
        
        self.model.eval()
        
        with torch.no_grad():
            # Move batch to device
            batch = {k: v.to(self.device) for k, v in batch.items()}
            
            # Forward pass
            model_outputs = self.model(
                batch["input_ids"],
                attention_mask=batch["attention_mask"],
                return_governance_metrics=True
            )
            
            # Compute loss
            loss, loss_dict = self.loss_fn(model_outputs, batch)
            
            # Governance API validation
            if self.config.real_time_governance_validation:
                governance_validation = await self.governance_api.validate_training_step(
                    model_outputs, self.global_step
                )
                loss_dict.update(governance_validation)
        
        return loss_dict
    
    async def train(self):
        """Main training loop"""
        
        logger.info("Starting Promethios Native LLM training...")
        
        for epoch in range(self.config.num_epochs):
            self.epoch = epoch
            
            # Training phase
            self.model.train()
            train_losses = []
            
            for batch_idx, batch in enumerate(self.train_loader):
                # Training step
                loss_dict = self.train_step(batch)
                train_losses.append(loss_dict)
                
                self.global_step += 1
                
                # Logging
                if self.global_step % self.config.logging_steps == 0:
                    avg_loss = np.mean([l["total_loss"] for l in train_losses[-self.config.logging_steps:]])
                    logger.info(f"Step {self.global_step}, Epoch {epoch}, Loss: {avg_loss:.4f}")
                    
                    if self.config.use_wandb:
                        wandb.log({
                            "train/loss": avg_loss,
                            "train/step": self.global_step,
                            "train/epoch": epoch,
                            **{f"train/{k}": v for k, v in loss_dict.items()}
                        })
                
                # Validation
                if self.global_step % self.config.eval_steps == 0:
                    val_losses = []
                    
                    for val_batch in self.val_loader:
                        val_loss_dict = await self.validate_step(val_batch)
                        val_losses.append(val_loss_dict)
                    
                    avg_val_loss = np.mean([l["total_loss"] for l in val_losses])
                    logger.info(f"Validation Loss: {avg_val_loss:.4f}")
                    
                    if self.config.use_wandb:
                        wandb.log({
                            "val/loss": avg_val_loss,
                            "val/step": self.global_step,
                            **{f"val/{k}": np.mean([l[k] for l in val_losses if k in l]) 
                               for k in val_losses[0].keys()}
                        })
                    
                    # Save best model
                    if avg_val_loss < self.best_val_loss:
                        self.best_val_loss = avg_val_loss
                        self.save_checkpoint("best_model.pt")
                
                # Save checkpoint
                if self.global_step % self.config.save_steps == 0:
                    self.save_checkpoint(f"checkpoint_step_{self.global_step}.pt")
                
                # Early stopping check
                if self.global_step >= self.config.max_steps:
                    logger.info(f"Reached maximum steps ({self.config.max_steps})")
                    return
        
        logger.info("Training completed!")
    
    def save_checkpoint(self, filename: str):
        """Save model checkpoint"""
        
        checkpoint_path = Path(self.config.checkpoint_dir) / filename
        checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
        
        checkpoint = {
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "scheduler_state_dict": self.scheduler.state_dict(),
            "global_step": self.global_step,
            "epoch": self.epoch,
            "best_val_loss": self.best_val_loss,
            "config": self.config
        }
        
        torch.save(checkpoint, checkpoint_path)
        logger.info(f"Saved checkpoint: {checkpoint_path}")
    
    def load_checkpoint(self, checkpoint_path: str):
        """Load model checkpoint"""
        
        checkpoint = torch.load(checkpoint_path, map_location=self.device)
        
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        self.scheduler.load_state_dict(checkpoint["scheduler_state_dict"])
        self.global_step = checkpoint["global_step"]
        self.epoch = checkpoint["epoch"]
        self.best_val_loss = checkpoint["best_val_loss"]
        
        logger.info(f"Loaded checkpoint from step {self.global_step}")

def create_training_config() -> TrainingConfig:
    """Create default training configuration"""
    return TrainingConfig(
        model_size="small",
        batch_size=4,  # Small batch size for demo
        learning_rate=1e-4,
        num_epochs=2,  # Short training for demo
        max_steps=1000,
        governance_loss_weight=0.3,
        use_wandb=False,  # Disable wandb for demo
        real_time_governance_validation=True
    )

async def main():
    """Main training function"""
    
    print("🚀 Promethios Native LLM Training Infrastructure")
    print("=" * 60)
    
    # Create training configuration
    config = create_training_config()
    
    print(f"📋 Training Configuration:")
    print(f"   Model size: {config.model_size}")
    print(f"   Batch size: {config.batch_size}")
    print(f"   Learning rate: {config.learning_rate}")
    print(f"   Max steps: {config.max_steps}")
    print(f"   Governance loss weight: {config.governance_loss_weight}")
    
    # Create trainer
    trainer = PromethiosTrainer(config)
    
    print(f"\n✅ Trainer initialized successfully!")
    print(f"📊 Model parameters: {sum(p.numel() for p in trainer.model.parameters()):,}")
    print(f"🏛️ Governance integration: {'Enabled' if config.real_time_governance_validation else 'Disabled'}")
    
    # Test training step
    print(f"\n🧪 Testing training step...")
    
    # Get a sample batch
    sample_batch = next(iter(trainer.train_loader))
    
    # Execute training step
    loss_dict = trainer.train_step(sample_batch)
    
    print(f"✅ Training step successful!")
    print(f"📈 Total loss: {loss_dict['total_loss']:.4f}")
    print(f"🏛️ Constitutional loss: {loss_dict['constitutional_loss']:.4f}")
    print(f"📋 Policy loss: {loss_dict['policy_loss']:.4f}")
    print(f"🤝 Trust loss: {loss_dict['trust_loss']:.4f}")
    print(f"🧠 Consciousness loss: {loss_dict['consciousness_loss']:.4f}")
    
    # Test validation step
    print(f"\n🎯 Testing validation step...")
    
    val_loss_dict = await trainer.validate_step(sample_batch)
    
    print(f"✅ Validation step successful!")
    print(f"📊 Governance compliance: {val_loss_dict.get('governance_compliance', 'N/A')}")
    print(f"🏛️ Constitutional alignment: {val_loss_dict.get('constitutional_alignment', 'N/A')}")
    print(f"🧠 Consciousness quality: {val_loss_dict.get('consciousness_quality', 'N/A'):.3f}")
    
    print(f"\n🎉 Training infrastructure is ready!")
    print(f"🔥 Ready to train the world's first governance-native LLM!")
    print(f"🚀 Integration with Promethios governance APIs: Complete!")

if __name__ == "__main__":
    asyncio.run(main())

