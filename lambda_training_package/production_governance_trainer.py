#!/usr/bin/env python3
"""
Production Governance LLM Trainer
Comprehensive training script for governance-native LLM
Optimized for Lambda Labs 8x H100 SXM5
"""

import os
import json
import torch
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

import transformers
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
    EarlyStoppingCallback
)
from datasets import Dataset
import wandb
from accelerate import Accelerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class GovernanceTrainingConfig:
    """Configuration for governance LLM training"""
    # Model configuration
    base_model: str = "codellama/CodeLlama-34b-Instruct-hf"  # Large model for comprehensive capabilities
    max_length: int = 4096  # Longer context for complex governance scenarios
    
    # Training configuration
    num_train_epochs: int = 3
    per_device_train_batch_size: int = 1  # Large model requires smaller batch size
    gradient_accumulation_steps: int = 8  # Effective batch size = 8 per device
    learning_rate: float = 2e-5
    warmup_ratio: float = 0.1
    weight_decay: float = 0.01
    
    # Optimization
    fp16: bool = True  # Mixed precision for H100
    dataloader_pin_memory: bool = True
    gradient_checkpointing: bool = True  # Memory optimization
    
    # Saving and logging
    output_dir: str = "./promethios_governance_llm"
    logging_steps: int = 10
    save_steps: int = 100
    eval_steps: int = 100
    save_total_limit: int = 5
    
    # Governance-specific
    governance_validation: bool = True
    trust_integration: bool = True
    memory_persistence: bool = True

class GovernanceDataProcessor:
    """Process governance training data for optimal training"""
    
    def __init__(self, tokenizer, max_length: int = 4096):
        self.tokenizer = tokenizer
        self.max_length = max_length
        
    def format_governance_example(self, example: Dict[str, Any]) -> str:
        """Format governance example for training"""
        # Create structured prompt format
        prompt = f"""<|governance_context|>
Type: {example.get('governance_type', 'general')}
Trust Level: {example.get('trust_level', 'medium')}
Memory Context: {example.get('memory_context', 'No prior context')}
<|governance_context|>

<|user_input|>
{example['input']}
<|user_input|>

<|governance_response|>
{example['governance_response']}
<|governance_response|>

<|audit_trail|>
{example.get('audit_trail', 'No audit information')}
<|audit_trail|>"""
        
        return prompt
    
    def tokenize_function(self, examples: Dict[str, List]) -> Dict[str, List]:
        """Tokenize examples for training"""
        # Format all examples
        formatted_texts = []
        for i in range(len(examples['input'])):
            example = {
                'input': examples['input'][i],
                'governance_response': examples['governance_response'][i],
                'governance_type': examples.get('governance_type', ['general'] * len(examples['input']))[i],
                'trust_level': examples.get('trust_level', ['medium'] * len(examples['input']))[i],
                'memory_context': examples.get('memory_context', ['No prior context'] * len(examples['input']))[i],
                'audit_trail': examples.get('audit_trail', ['No audit information'] * len(examples['input']))[i]
            }
            formatted_texts.append(self.format_governance_example(example))
        
        # Tokenize
        tokenized = self.tokenizer(
            formatted_texts,
            truncation=True,
            padding=True,
            max_length=self.max_length,
            return_tensors="pt"
        )
        
        # Set labels for causal language modeling
        tokenized["labels"] = tokenized["input_ids"].clone()
        
        return tokenized

class GovernanceValidator:
    """Validate governance capabilities during training"""
    
    def __init__(self, model, tokenizer):
        self.model = model
        self.tokenizer = tokenizer
        self.validation_prompts = [
            "User requests unauthorized access to sensitive data",
            "Multi-agent team needs to reach consensus on policy decision",
            "Create SaaS authentication system with governance integration",
            "Analyze trust implications of new agent joining collaboration"
        ]
    
    def validate_governance_responses(self) -> Dict[str, float]:
        """Validate model's governance capabilities"""
        results = {}
        
        for prompt in self.validation_prompts:
            # Format prompt
            formatted_prompt = f"""<|governance_context|>
Type: validation
Trust Level: medium
Memory Context: Validation test
<|governance_context|>

<|user_input|>
{prompt}
<|user_input|>

<|governance_response|>"""
            
            # Generate response
            inputs = self.tokenizer.encode(formatted_prompt, return_tensors="pt")
            
            with torch.no_grad():
                outputs = self.model.generate(
                    inputs,
                    max_length=inputs.shape[1] + 200,
                    do_sample=True,
                    temperature=0.7,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            response = self.tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True)
            
            # Simple governance validation (can be enhanced)
            governance_score = self.score_governance_response(response)
            results[prompt[:50] + "..."] = governance_score
        
        return results
    
    def score_governance_response(self, response: str) -> float:
        """Score governance quality of response"""
        governance_keywords = [
            "constitutional", "trust", "audit", "compliance", "governance",
            "policy", "authorization", "verification", "protocol", "framework"
        ]
        
        score = 0.0
        for keyword in governance_keywords:
            if keyword.lower() in response.lower():
                score += 0.1
        
        return min(score, 1.0)

class ProductionGovernanceTrainer:
    """Production-grade governance LLM trainer"""
    
    def __init__(self, config: GovernanceTrainingConfig):
        self.config = config
        self.accelerator = Accelerator()
        
        # Initialize wandb for monitoring
        if self.accelerator.is_main_process:
            wandb.init(
                project="promethios-governance-llm",
                config=config.__dict__,
                name=f"governance-training-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
            )
    
    def load_model_and_tokenizer(self):
        """Load base model and tokenizer"""
        logger.info(f"🧠 Loading base model: {self.config.base_model}")
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.config.base_model,
            trust_remote_code=True
        )
        
        # Add special tokens for governance
        special_tokens = [
            "<|governance_context|>",
            "<|user_input|>", 
            "<|governance_response|>",
            "<|audit_trail|>"
        ]
        
        self.tokenizer.add_special_tokens({"additional_special_tokens": special_tokens})
        
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(
            self.config.base_model,
            torch_dtype=torch.float16 if self.config.fp16 else torch.float32,
            device_map="auto",
            trust_remote_code=True
        )
        
        # Resize embeddings for new tokens
        self.model.resize_token_embeddings(len(self.tokenizer))
        
        logger.info(f"✅ Model loaded with {self.model.num_parameters():,} parameters")
    
    def load_governance_dataset(self) -> Dataset:
        """Load and process governance training dataset"""
        logger.info("📊 Loading governance training dataset...")
        
        # Generate dataset if not exists
        dataset_file = "comprehensive_governance_dataset.json"
        if not os.path.exists(dataset_file):
            logger.info("🏗️ Generating governance dataset...")
            from comprehensive_governance_dataset import GovernanceDatasetGenerator
            generator = GovernanceDatasetGenerator()
            dataset_examples = generator.generate_complete_dataset()
        else:
            with open(dataset_file, 'r') as f:
                dataset_examples = json.load(f)
        
        logger.info(f"📈 Loaded {len(dataset_examples)} governance examples")
        
        # Convert to HuggingFace dataset format
        dataset_dict = {
            'input': [ex['input'] for ex in dataset_examples],
            'governance_response': [ex['governance_response'] for ex in dataset_examples],
            'governance_type': [ex.get('governance_type', 'general') for ex in dataset_examples],
            'trust_level': [ex.get('trust_level', 'medium') for ex in dataset_examples],
            'memory_context': [ex.get('memory_context', 'No prior context') for ex in dataset_examples],
            'audit_trail': [ex.get('audit_trail', 'No audit information') for ex in dataset_examples]
        }
        
        dataset = Dataset.from_dict(dataset_dict)
        
        # Split dataset
        train_test_split = dataset.train_test_split(test_size=0.1, seed=42)
        train_dataset = train_test_split['train']
        eval_dataset = train_test_split['test']
        
        # Process datasets
        processor = GovernanceDataProcessor(self.tokenizer, self.config.max_length)
        
        train_dataset = train_dataset.map(
            processor.tokenize_function,
            batched=True,
            remove_columns=dataset.column_names
        )
        
        eval_dataset = eval_dataset.map(
            processor.tokenize_function,
            batched=True,
            remove_columns=dataset.column_names
        )
        
        logger.info(f"✅ Processed {len(train_dataset)} training examples")
        logger.info(f"✅ Processed {len(eval_dataset)} evaluation examples")
        
        return train_dataset, eval_dataset
    
    def setup_training_arguments(self) -> TrainingArguments:
        """Setup training arguments"""
        return TrainingArguments(
            output_dir=self.config.output_dir,
            num_train_epochs=self.config.num_train_epochs,
            per_device_train_batch_size=self.config.per_device_train_batch_size,
            per_device_eval_batch_size=self.config.per_device_train_batch_size,
            gradient_accumulation_steps=self.config.gradient_accumulation_steps,
            learning_rate=self.config.learning_rate,
            warmup_ratio=self.config.warmup_ratio,
            weight_decay=self.config.weight_decay,
            
            # Optimization
            fp16=self.config.fp16,
            dataloader_pin_memory=self.config.dataloader_pin_memory,
            gradient_checkpointing=self.config.gradient_checkpointing,
            
            # Logging and saving
            logging_steps=self.config.logging_steps,
            save_steps=self.config.save_steps,
            eval_steps=self.config.eval_steps,
            save_total_limit=self.config.save_total_limit,
            
            # Evaluation
            evaluation_strategy="steps",
            load_best_model_at_end=True,
            metric_for_best_model="eval_loss",
            greater_is_better=False,
            
            # Reporting
            report_to="wandb" if self.accelerator.is_main_process else None,
            run_name=f"governance-llm-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            
            # Memory optimization
            remove_unused_columns=False,
            dataloader_num_workers=4,
        )
    
    def train(self):
        """Execute training"""
        logger.info("🚀 Starting Promethios Governance LLM Training")
        logger.info(f"🔥 Hardware: {torch.cuda.device_count()} GPUs available")
        
        # Load model and tokenizer
        self.load_model_and_tokenizer()
        
        # Load dataset
        train_dataset, eval_dataset = self.load_governance_dataset()
        
        # Setup training arguments
        training_args = self.setup_training_arguments()
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer,
            mlm=False,
        )
        
        # Initialize validator
        validator = GovernanceValidator(self.model, self.tokenizer)
        
        # Create trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            data_collator=data_collator,
            tokenizer=self.tokenizer,
            callbacks=[EarlyStoppingCallback(early_stopping_patience=3)]
        )
        
        # Pre-training validation
        if self.config.governance_validation:
            logger.info("🧪 Pre-training governance validation...")
            pre_scores = validator.validate_governance_responses()
            logger.info(f"Pre-training governance scores: {pre_scores}")
            
            if self.accelerator.is_main_process:
                wandb.log({"pre_training_governance_scores": pre_scores})
        
        # Start training
        logger.info("🎯 Starting training...")
        trainer.train()
        
        # Post-training validation
        if self.config.governance_validation:
            logger.info("🧪 Post-training governance validation...")
            post_scores = validator.validate_governance_responses()
            logger.info(f"Post-training governance scores: {post_scores}")
            
            if self.accelerator.is_main_process:
                wandb.log({"post_training_governance_scores": post_scores})
        
        # Save final model
        logger.info("💾 Saving final governance model...")
        trainer.save_model(self.config.output_dir)
        self.tokenizer.save_pretrained(self.config.output_dir)
        
        # Save training configuration
        config_path = os.path.join(self.config.output_dir, "training_config.json")
        with open(config_path, 'w') as f:
            json.dump(self.config.__dict__, f, indent=2)
        
        logger.info("🎉 Governance LLM training complete!")
        logger.info(f"📁 Model saved to: {self.config.output_dir}")
        
        # Generate model summary
        self.generate_model_summary()
    
    def generate_model_summary(self):
        """Generate comprehensive model summary"""
        summary = {
            "model_name": "Promethios Governance-Native LLM",
            "base_model": self.config.base_model,
            "training_date": datetime.now().isoformat(),
            "model_size": f"{self.model.num_parameters():,} parameters",
            "training_config": self.config.__dict__,
            "capabilities": [
                "Constitutional governance reasoning",
                "Operational governance protocols",
                "Trust management and propagation",
                "Memory-persistent interactions",
                "SaaS development with governance",
                "Multi-agent collaboration",
                "Professional communication",
                "Audit trail generation"
            ],
            "use_cases": [
                "Enterprise SaaS development",
                "Multi-agent research teams",
                "Corporate governance systems",
                "Compliance automation",
                "Trust-based collaboration platforms"
            ],
            "governance_features": [
                "Built-in constitutional compliance",
                "Trust-aware decision making",
                "Comprehensive audit logging",
                "Memory-persistent governance context",
                "Professional governance communication"
            ]
        }
        
        summary_path = os.path.join(self.config.output_dir, "model_summary.json")
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"📋 Model summary saved to: {summary_path}")

def main():
    """Main training function"""
    # Configuration
    config = GovernanceTrainingConfig()
    
    # Initialize trainer
    trainer = ProductionGovernanceTrainer(config)
    
    # Execute training
    trainer.train()

if __name__ == "__main__":
    main()

