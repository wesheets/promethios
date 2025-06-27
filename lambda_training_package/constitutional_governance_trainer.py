#!/usr/bin/env python3
"""
Constitutional Governance Specialized Trainer
Trains a focused model on constitutional governance principles and legal frameworks
"""

import json
import os
import torch
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import Dataset
import wandb
from typing import Dict, List, Any

class ConstitutionalGovernanceTrainer:
    """Specialized trainer for constitutional governance"""
    
    def __init__(self):
        self.model_name = "codellama/CodeLlama-7b-Instruct-hf"
        self.output_dir = "./constitutional_governance_llm"
        self.dataset_file = "constitutional_governance_dataset.json"
        
        # Training configuration optimized for single H100
        self.training_config = {
            "per_device_train_batch_size": 1,
            "per_device_eval_batch_size": 1,
            "gradient_accumulation_steps": 4,
            "num_train_epochs": 3,
            "learning_rate": 2e-4,
            "max_grad_norm": 1.0,
            "warmup_steps": 100,
            "logging_steps": 10,
            "save_steps": 500,
            "eval_steps": 500,
            "eval_strategy": "steps",
            "save_strategy": "steps",
            "load_best_model_at_end": True,
            "metric_for_best_model": "eval_loss",
            "greater_is_better": False,
            "dataloader_num_workers": 4,
            "remove_unused_columns": False,
        }
        
        # LoRA configuration for memory efficiency
        self.lora_config = LoraConfig(
            r=16,
            lora_alpha=32,
            target_modules=["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            lora_dropout=0.1,
            bias="none",
            task_type="CAUSAL_LM"
        )
    
    def load_dataset(self) -> Dataset:
        """Load constitutional governance dataset"""
        print(f"📋 Loading Constitutional Governance dataset from {self.dataset_file}")
        
        with open(self.dataset_file, 'r') as f:
            data = json.load(f)
        
        print(f"✅ Loaded {len(data)} constitutional governance examples")
        
        # Convert to HuggingFace dataset format
        dataset = Dataset.from_list(data)
        
        # Split into train/eval (90/10 split)
        dataset = dataset.train_test_split(test_size=0.1, seed=42)
        
        print(f"📊 Train examples: {len(dataset['train'])}")
        print(f"📊 Eval examples: {len(dataset['test'])}")
        
        return dataset
    
    def setup_tokenizer(self):
        """Setup tokenizer with constitutional governance tokens"""
        print("🔤 Setting up tokenizer for constitutional governance...")
        
        tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        
        # Add constitutional governance tokens
        special_tokens = [
            "[CONSTITUTIONAL]", "[LEGAL_ANALYSIS]", "[POLICY_FRAMEWORK]",
            "[COMPLIANCE_CHECK]", "[STAKEHOLDER_RIGHTS]", "[REGULATORY_REVIEW]",
            "[PRECEDENT_ANALYSIS]", "[CONSTITUTIONAL_PRINCIPLE]", "[GOVERNANCE_DECISION]",
            "[LEGAL_REASONING]", "[POLICY_IMPLEMENTATION]", "[CONSTITUTIONAL_REVIEW]"
        ]
        
        tokenizer.add_special_tokens({"additional_special_tokens": special_tokens})
        tokenizer.pad_token = tokenizer.eos_token
        
        print(f"✅ Added {len(special_tokens)} constitutional governance tokens")
        return tokenizer
    
    def setup_model(self, tokenizer):
        """Setup model with LoRA adapters and quantization"""
        print("🤖 Loading model with constitutional governance optimizations...")
        
        # Load model with 8-bit quantization for memory efficiency
        model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            load_in_8bit=True,
            device_map="auto",
            offload_folder="./offload",
            torch_dtype=torch.float16,
            trust_remote_code=True
        )
        
        # Resize token embeddings for new constitutional tokens
        model.resize_token_embeddings(len(tokenizer))
        
        # Prepare model for k-bit training
        model = prepare_model_for_kbit_training(model)
        
        # Apply LoRA adapters
        model = get_peft_model(model, self.lora_config)
        
        # Print trainable parameters
        model.print_trainable_parameters()
        
        print("✅ Constitutional Governance model setup complete")
        return model
    
    def preprocess_function(self, examples, tokenizer):
        """Preprocess constitutional governance examples"""
        inputs = []
        targets = []
        
        for i in range(len(examples['input'])):
            # Format constitutional governance prompt
            prompt = f"""<s>[INST] Constitutional Governance Analysis Required:

{examples['input'][i]}

Please provide a comprehensive constitutional governance analysis following these principles:
1. Constitutional framework assessment
2. Legal compliance evaluation  
3. Stakeholder rights analysis
4. Policy implementation guidance
5. Regulatory compliance review

[/INST] {examples['output'][i]}</s>"""
            
            inputs.append(prompt)
            targets.append(examples['output'][i])
        
        # Tokenize
        model_inputs = tokenizer(
            inputs,
            max_length=self.training_config["max_length"],
            truncation=True,
            padding=False,
            return_tensors=None
        )
        
        # Set labels for language modeling
        model_inputs["labels"] = model_inputs["input_ids"].copy()
        
        return model_inputs
    
    def train(self):
        """Train constitutional governance model"""
        print("🏛️ Starting Constitutional Governance LLM Training...")
        
        # Initialize wandb
        wandb.init(
            project="constitutional-governance-llm",
            name="constitutional-governance-training",
            config=self.training_config
        )
        
        # Setup tokenizer and model
        tokenizer = self.setup_tokenizer()
        model = self.setup_model(tokenizer)
        
        # Load and preprocess dataset
        dataset = self.load_dataset()
        
        # Preprocess datasets
        train_dataset = dataset['train'].map(
            lambda x: self.preprocess_function(x, tokenizer),
            batched=True,
            remove_columns=dataset['train'].column_names
        )
        
        eval_dataset = dataset['test'].map(
            lambda x: self.preprocess_function(x, tokenizer),
            batched=True,
            remove_columns=dataset['test'].column_names
        )
        
        # Setup data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=tokenizer,
            mlm=False,
            pad_to_multiple_of=8
        )
        
        # Setup training arguments
        training_args = TrainingArguments(
            output_dir=self.output_dir,
            overwrite_output_dir=True,
            **self.training_config,
            report_to="wandb",
            run_name="constitutional-governance-training"
        )
        
        # Initialize trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            data_collator=data_collator,
            tokenizer=tokenizer,
        )
        
        print("🚀 Starting constitutional governance training...")
        
        # Train the model
        trainer.train()
        
        # Save final model
        trainer.save_model()
        tokenizer.save_pretrained(self.output_dir)
        
        print("✅ Constitutional Governance LLM training completed!")
        print(f"💾 Model saved to: {self.output_dir}")
        
        # Finish wandb run
        wandb.finish()

def main():
    """Main training function"""
    trainer = ConstitutionalGovernanceTrainer()
    trainer.train()

if __name__ == "__main__":
    main()

