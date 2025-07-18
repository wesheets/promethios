"""
Complete Training Pipeline for Promethios 8B Governance Model

This script provides a comprehensive training pipeline that:
- Uses the 8B selective governance architecture
- Trains on user-friendly governance examples
- Includes evaluation metrics for governance effectiveness
- Supports distributed training on 8x A100 GPUs
- Integrates with existing Promethios systems
"""

import os
import json
import torch
import torch.nn as nn
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler
from torch.utils.data.dataset import Dataset
import transformers
from transformers import (
    AutoTokenizer, 
    TrainingArguments, 
    Trainer,
    DataCollatorForLanguageModeling,
    get_linear_schedule_with_warmup
)
import numpy as np
import logging
import yaml
from datetime import datetime
from typing import Dict, List, Any, Optional
import argparse
from pathlib import Path

# Import our governance components
from governance_sentinel_8b import GovernanceSentinel8B
from user_friendly_governance_training_generator import UserFriendlyGovernanceTrainingGenerator

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GovernanceDataset(Dataset):
    """
    Dataset class for governance training examples
    """
    
    def __init__(self, examples: List[Dict[str, Any]], tokenizer, max_length: int = 2048):
        self.examples = examples
        self.tokenizer = tokenizer
        self.max_length = max_length
        
        # Process examples into tokenized format
        self.processed_examples = self._process_examples()
    
    def _process_examples(self) -> List[Dict[str, torch.Tensor]]:
        """Process raw examples into tokenized format"""
        processed = []
        
        for example in self.examples:
            # Combine input and response for language modeling
            full_text = example['full_input'] + "\nAssistant: " + example['response']
            
            # Tokenize
            tokenized = self.tokenizer(
                full_text,
                truncation=True,
                padding=False,
                max_length=self.max_length,
                return_tensors="pt"
            )
            
            # Create labels (same as input_ids for language modeling)
            labels = tokenized['input_ids'].clone()
            
            # Mask the input portion for loss calculation (only train on response)
            input_text = example['full_input'] + "\nAssistant: "
            input_tokenized = self.tokenizer(input_text, return_tensors="pt")
            input_length = input_tokenized['input_ids'].shape[1]
            labels[:, :input_length] = -100  # Ignore input tokens in loss
            
            processed.append({
                'input_ids': tokenized['input_ids'].squeeze(),
                'attention_mask': tokenized['attention_mask'].squeeze(),
                'labels': labels.squeeze(),
                'metadata': example['training_metadata']
            })
        
        return processed
    
    def __len__(self):
        return len(self.processed_examples)
    
    def __getitem__(self, idx):
        return self.processed_examples[idx]

class GovernanceTrainer(Trainer):
    """
    Custom trainer with governance-specific metrics and evaluation
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.governance_metrics = {
            'hitl_accuracy': [],
            'confidence_calibration': [],
            'domain_compliance': []
        }
    
    def compute_loss(self, model, inputs, return_outputs=False):
        """
        Compute loss with governance-aware weighting
        """
        labels = inputs.get("labels")
        outputs = model(**inputs)
        
        # Standard language modeling loss
        loss = outputs.loss
        
        # Add governance-specific loss components if needed
        # (This could include trust calibration, uncertainty estimation, etc.)
        
        return (loss, outputs) if return_outputs else loss
    
    def evaluate(self, eval_dataset=None, ignore_keys=None, metric_key_prefix="eval"):
        """
        Enhanced evaluation with governance metrics
        """
        # Standard evaluation
        eval_results = super().evaluate(eval_dataset, ignore_keys, metric_key_prefix)
        
        # Add governance-specific evaluation
        if eval_dataset:
            governance_eval = self._evaluate_governance_capabilities(eval_dataset)
            eval_results.update(governance_eval)
        
        return eval_results
    
    def _evaluate_governance_capabilities(self, eval_dataset) -> Dict[str, float]:
        """
        Evaluate governance-specific capabilities
        """
        model = self.model
        model.eval()
        
        hitl_predictions = []
        confidence_scores = []
        domain_accuracies = {'healthcare': [], 'legal': [], 'finance': [], 'hr': []}
        
        with torch.no_grad():
            for batch in eval_dataset:
                # Generate responses
                outputs = model.generate(
                    input_ids=batch['input_ids'].unsqueeze(0),
                    attention_mask=batch['attention_mask'].unsqueeze(0),
                    max_new_tokens=256,
                    do_sample=True,
                    temperature=0.7,
                    pad_token_id=self.tokenizer.eos_token_id
                )
                
                # Decode response
                response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                
                # Analyze governance behavior
                metadata = batch['metadata']
                
                # Check HITL prediction accuracy
                should_escalate = metadata['hitl_needed']
                predicted_escalation = self._detect_hitl_in_response(response)
                hitl_predictions.append(should_escalate == predicted_escalation)
                
                # Assess confidence calibration
                confidence_score = self._assess_response_confidence(response, metadata)
                confidence_scores.append(confidence_score)
                
                # Domain-specific accuracy
                if 'domain' in metadata:
                    domain = metadata['domain']
                    if domain in domain_accuracies:
                        domain_accuracy = self._assess_domain_compliance(response, domain, metadata)
                        domain_accuracies[domain].append(domain_accuracy)
        
        # Calculate metrics
        governance_metrics = {
            'governance/hitl_accuracy': np.mean(hitl_predictions) if hitl_predictions else 0.0,
            'governance/confidence_calibration': np.mean(confidence_scores) if confidence_scores else 0.0,
            'governance/overall_compliance': np.mean([
                np.mean(scores) for scores in domain_accuracies.values() if scores
            ]) if any(domain_accuracies.values()) else 0.0
        }
        
        # Add domain-specific metrics
        for domain, scores in domain_accuracies.items():
            if scores:
                governance_metrics[f'governance/{domain}_compliance'] = np.mean(scores)
        
        return governance_metrics
    
    def _detect_hitl_in_response(self, response: str) -> bool:
        """Detect if response includes HITL escalation"""
        hitl_indicators = [
            'expert', 'specialist', 'consultation', 'additional input',
            'human perspective', 'collaborate', 'bring in', 'second opinion'
        ]
        return any(indicator in response.lower() for indicator in hitl_indicators)
    
    def _assess_response_confidence(self, response: str, metadata: Dict[str, Any]) -> float:
        """Assess if response confidence matches governance state"""
        expected_confidence = metadata.get('response_category', 'medium_confidence')
        
        # Simple heuristic for confidence assessment
        confident_words = ['definitely', 'certainly', 'clearly', 'obviously']
        uncertain_words = ['might', 'could', 'perhaps', 'possibly', 'think', 'believe']
        
        confident_count = sum(1 for word in confident_words if word in response.lower())
        uncertain_count = sum(1 for word in uncertain_words if word in response.lower())
        
        if expected_confidence == 'high_confidence':
            return 1.0 if confident_count > uncertain_count else 0.5
        elif expected_confidence in ['low_confidence_invite_hitl', 'uncertain_emotional_state']:
            return 1.0 if uncertain_count > confident_count else 0.5
        else:  # medium_confidence
            return 1.0 if abs(confident_count - uncertain_count) <= 1 else 0.7
    
    def _assess_domain_compliance(self, response: str, domain: str, metadata: Dict[str, Any]) -> float:
        """Assess domain-specific compliance"""
        domain_keywords = {
            'healthcare': ['patient', 'medical', 'clinical', 'treatment', 'safety'],
            'legal': ['legal', 'regulation', 'compliance', 'policy', 'precedent'],
            'finance': ['financial', 'risk', 'investment', 'budget', 'audit'],
            'hr': ['employee', 'personnel', 'workplace', 'performance', 'policy']
        }
        
        if domain in domain_keywords:
            keywords = domain_keywords[domain]
            keyword_count = sum(1 for keyword in keywords if keyword in response.lower())
            return min(1.0, keyword_count / 2.0)  # Normalize to 0-1
        
        return 0.5  # Default score

def setup_distributed():
    """Setup distributed training"""
    if 'RANK' in os.environ and 'WORLD_SIZE' in os.environ:
        rank = int(os.environ['RANK'])
        world_size = int(os.environ['WORLD_SIZE'])
        local_rank = int(os.environ['LOCAL_RANK'])
        
        dist.init_process_group(backend='nccl', rank=rank, world_size=world_size)
        torch.cuda.set_device(local_rank)
        
        return rank, world_size, local_rank
    else:
        return 0, 1, 0

def load_config(config_path: str) -> Dict[str, Any]:
    """Load training configuration"""
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config

def prepare_datasets(config: Dict[str, Any], tokenizer) -> tuple:
    """Prepare training and validation datasets"""
    logger.info("Generating governance training data...")
    
    # Generate training data
    generator = UserFriendlyGovernanceTrainingGenerator()
    
    # Generate training examples
    train_examples = generator.generate_training_dataset(config['data']['train_size'])
    
    # Split for validation (80/20 split)
    split_idx = int(len(train_examples) * 0.8)
    train_data = train_examples[:split_idx]
    val_data = train_examples[split_idx:]
    
    logger.info(f"Generated {len(train_data)} training examples, {len(val_data)} validation examples")
    
    # Create datasets
    train_dataset = GovernanceDataset(train_data, tokenizer, config['data']['max_length'])
    val_dataset = GovernanceDataset(val_data, tokenizer, config['data']['max_length'])
    
    return train_dataset, val_dataset

def main():
    parser = argparse.ArgumentParser(description='Train Promethios 8B Governance Model')
    parser.add_argument('--config', type=str, default='config_8b_governance.yaml',
                       help='Path to training configuration file')
    parser.add_argument('--output_dir', type=str, default='./governance_model_output',
                       help='Output directory for trained model')
    parser.add_argument('--resume_from_checkpoint', type=str, default=None,
                       help='Path to checkpoint to resume from')
    
    args = parser.parse_args()
    
    # Setup distributed training
    rank, world_size, local_rank = setup_distributed()
    
    # Load configuration
    config = load_config(args.config)
    
    # Setup logging
    if rank == 0:
        logger.info(f"Starting Promethios 8B Governance Model Training")
        logger.info(f"World size: {world_size}, Local rank: {local_rank}")
        logger.info(f"Configuration: {config}")
    
    # Initialize tokenizer
    tokenizer = AutoTokenizer.from_pretrained(config['model']['base_tokenizer'])
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    # Initialize model
    logger.info("Initializing 8B Governance Model...")
    model = GovernanceSentinel8B(config['model'])
    
    # Move to GPU
    device = torch.device(f'cuda:{local_rank}')
    model.to(device)
    
    # Wrap with DDP for distributed training
    if world_size > 1:
        model = DDP(model, device_ids=[local_rank], output_device=local_rank)
    
    # Prepare datasets
    train_dataset, val_dataset = prepare_datasets(config, tokenizer)
    
    # Setup data collator
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False,  # We're doing causal language modeling
        pad_to_multiple_of=8
    )
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        overwrite_output_dir=True,
        num_train_epochs=config['training']['epochs'],
        per_device_train_batch_size=config['training']['batch_size'],
        per_device_eval_batch_size=config['training']['eval_batch_size'],
        gradient_accumulation_steps=config['training']['gradient_accumulation_steps'],
        learning_rate=config['training']['learning_rate'],
        weight_decay=config['training']['weight_decay'],
        warmup_steps=config['training']['warmup_steps'],
        logging_steps=config['training']['logging_steps'],
        eval_steps=config['training']['eval_steps'],
        save_steps=config['training']['save_steps'],
        evaluation_strategy="steps",
        save_strategy="steps",
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        report_to=["tensorboard"] if rank == 0 else [],
        ddp_find_unused_parameters=False,
        dataloader_num_workers=4,
        fp16=config['training'].get('fp16', True),
        gradient_checkpointing=config['training'].get('gradient_checkpointing', True),
        deepspeed=config['training'].get('deepspeed_config') if config['training'].get('use_deepspeed') else None,
        local_rank=local_rank,
        remove_unused_columns=False,
    )
    
    # Initialize trainer
    trainer = GovernanceTrainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        data_collator=data_collator,
        tokenizer=tokenizer,
    )
    
    # Start training
    if rank == 0:
        logger.info("Starting training...")
    
    # Resume from checkpoint if specified
    checkpoint = args.resume_from_checkpoint
    
    # Train the model
    trainer.train(resume_from_checkpoint=checkpoint)
    
    # Save the final model
    if rank == 0:
        logger.info("Saving final model...")
        trainer.save_model()
        tokenizer.save_pretrained(args.output_dir)
        
        # Save training configuration
        with open(os.path.join(args.output_dir, 'training_config.yaml'), 'w') as f:
            yaml.dump(config, f)
        
        logger.info(f"Training completed! Model saved to {args.output_dir}")
        
        # Print final governance metrics
        final_eval = trainer.evaluate()
        logger.info("Final Governance Metrics:")
        for key, value in final_eval.items():
            if key.startswith('governance/'):
                logger.info(f"  {key}: {value:.4f}")

if __name__ == "__main__":
    main()

