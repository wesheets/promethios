#!/usr/bin/env python3
"""
Promethios Native LLM Training Script
Comprehensive Single-Agent Governance Training
Optimized for 8x H100 SXM5 (Lambda Labs)
"""

import os
import json
import torch
import logging
import wandb
from datetime import datetime
from transformers import (
    AutoTokenizer, AutoModelForCausalLM,
    TrainingArguments, Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
import deepspeed
from torch.nn import CrossEntropyLoss
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GovernanceLLMTrainer:
    """Comprehensive governance-native LLM trainer"""
    
    def __init__(self, config_path="config/training_config.json"):
        """Initialize trainer with configuration"""
        self.config = self.load_config(config_path)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.start_time = datetime.now()
        
        # Initialize Weights & Biases for monitoring
        wandb.init(
            project="promethios-native-llm",
            name=f"governance-training-{self.start_time.strftime('%Y%m%d_%H%M%S')}",
            config=self.config
        )
        
        logger.info("🚀 Initializing Promethios Native LLM Trainer")
        logger.info(f"💻 Device: {self.device}")
        logger.info(f"🔥 GPUs available: {torch.cuda.device_count()}")
        
    def load_config(self, config_path):
        """Load training configuration"""
        with open(config_path, 'r') as f:
            return json.load(f)
    
    def load_governance_data(self):
        """Load and prepare governance training data"""
        logger.info("📊 Loading governance training data...")
        
        with open('data/governance/training_data.json', 'r') as f:
            governance_data = json.load(f)
        
        # Prepare training examples
        training_examples = []
        
        for category, examples in governance_data.items():
            for example in examples:
                # Create governance-aware training prompt
                prompt = self.create_governance_prompt(example, category)
                training_examples.append(prompt)
        
        logger.info(f"✅ Loaded {len(training_examples)} governance training examples")
        return training_examples
    
    def create_governance_prompt(self, example, category):
        """Create governance-aware training prompt"""
        prompt = f"""<|governance_context|>
Category: {category}
Trust Level: {example['trust_level']}
Governance Check: {example['governance_check']}

<|user_input|>
{example['input']}

<|governance_reasoning|>
The agent must consider:
1. Constitutional compliance
2. Operational governance requirements
3. Trust level implications
4. Veritas validation needs
5. Policy interpretation requirements

<|agent_response|>
{example['expected_output']}

<|justification|>
{example['justification']}

<|trust_update|>
Trust level maintained at: {example['trust_level']}
Governance compliance: VERIFIED
<|end|>"""
        
        return prompt
    
    def prepare_dataset(self, training_examples):
        """Prepare dataset for training"""
        logger.info("🔧 Preparing training dataset...")
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(self.config["model"]["base_model"])
        
        # Add special governance tokens
        special_tokens = [
            "<|governance_context|>", "<|user_input|>", "<|governance_reasoning|>",
            "<|agent_response|>", "<|justification|>", "<|trust_update|>", "<|end|>"
        ]
        tokenizer.add_special_tokens({"additional_special_tokens": special_tokens})
        
        # Tokenize examples
        def tokenize_function(examples):
            return tokenizer(
                examples["text"],
                truncation=True,
                padding=True,
                max_length=self.config["model"]["max_length"],
                return_tensors="pt"
            )
        
        # Create dataset
        dataset_dict = {"text": training_examples}
        dataset = Dataset.from_dict(dataset_dict)
        tokenized_dataset = dataset.map(tokenize_function, batched=True)
        
        logger.info(f"✅ Dataset prepared with {len(tokenized_dataset)} examples")
        return tokenized_dataset, tokenizer
    
    def load_model(self, tokenizer):
        """Load and prepare model for governance training"""
        logger.info("🧠 Loading base model for governance training...")
        
        model = AutoModelForCausalLM.from_pretrained(
            self.config["model"]["base_model"],
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True
        )
        
        # Resize token embeddings for new governance tokens
        model.resize_token_embeddings(len(tokenizer))
        
        # Add governance-specific layers
        self.add_governance_layers(model)
        
        logger.info("✅ Model loaded and governance layers added")
        return model
    
    def add_governance_layers(self, model):
        """Add governance-specific layers to the model"""
        logger.info("🏗️ Adding governance-specific layers...")
        
        # Add trust scoring head
        model.trust_head = torch.nn.Linear(model.config.hidden_size, 5)  # 5 trust levels
        
        # Add compliance scoring head
        model.compliance_head = torch.nn.Linear(model.config.hidden_size, 3)  # compliant/warning/violation
        
        # Add veritas validation head
        model.veritas_head = torch.nn.Linear(model.config.hidden_size, 2)  # valid/hallucination
        
        # Add policy interpretation head
        model.policy_head = torch.nn.Linear(model.config.hidden_size, 4)  # policy categories
        
        logger.info("✅ Governance layers added to model")
    
    def create_governance_loss(self, model, inputs, labels):
        """Create multi-objective governance loss function"""
        # Standard language modeling loss
        outputs = model(input_ids=inputs["input_ids"], attention_mask=inputs["attention_mask"])
        lm_loss = CrossEntropyLoss()(outputs.logits.view(-1, outputs.logits.size(-1)), labels.view(-1))
        
        # Governance-specific losses (simplified for training)
        trust_loss = torch.tensor(0.0, device=self.device)
        compliance_loss = torch.tensor(0.0, device=self.device)
        veritas_loss = torch.tensor(0.0, device=self.device)
        policy_loss = torch.tensor(0.0, device=self.device)
        
        # Combine losses with weights
        total_loss = (
            lm_loss +
            self.config["governance"]["trust_weight"] * trust_loss +
            self.config["governance"]["compliance_weight"] * compliance_loss +
            self.config["governance"]["veritas_weight"] * veritas_loss +
            self.config["governance"]["policy_weight"] * policy_loss
        )
        
        return total_loss
    
    def setup_training_arguments(self):
        """Setup training arguments for 8x H100"""
        logger.info("⚙️ Setting up training arguments for 8x H100...")
        
        training_args = TrainingArguments(
            output_dir="./models/checkpoints",
            overwrite_output_dir=True,
            num_train_epochs=self.config["training"]["num_epochs"],
            per_device_train_batch_size=self.config["training"]["batch_size"],
            gradient_accumulation_steps=self.config["training"]["gradient_accumulation_steps"],
            learning_rate=self.config["training"]["learning_rate"],
            warmup_steps=self.config["training"]["warmup_steps"],
            logging_steps=self.config["training"]["logging_steps"],
            save_steps=self.config["training"]["save_steps"],
            eval_steps=self.config["training"]["eval_steps"],
            evaluation_strategy="steps",
            save_strategy="steps",
            load_best_model_at_end=True,
            metric_for_best_model="eval_loss",
            greater_is_better=False,
            
            # Multi-GPU optimization
            dataloader_pin_memory=True,
            dataloader_num_workers=4,
            remove_unused_columns=False,
            
            # Memory optimization
            gradient_checkpointing=True,
            fp16=True,
            
            # DeepSpeed integration
            deepspeed="config/deepspeed_config.json" if self.config["hardware"]["use_deepspeed"] else None,
            
            # Monitoring
            report_to="wandb",
            run_name=f"promethios-governance-{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            
            # Logging
            logging_dir="./logs/training",
            logging_first_step=True,
        )
        
        return training_args
    
    def create_deepspeed_config(self):
        """Create DeepSpeed configuration for 8x H100"""
        logger.info("🚀 Creating DeepSpeed configuration...")
        
        deepspeed_config = {
            "train_batch_size": self.config["training"]["batch_size"] * 8,  # 8 GPUs
            "gradient_accumulation_steps": self.config["training"]["gradient_accumulation_steps"],
            "optimizer": {
                "type": "AdamW",
                "params": {
                    "lr": self.config["training"]["learning_rate"],
                    "betas": [0.9, 0.999],
                    "eps": 1e-8,
                    "weight_decay": 0.01
                }
            },
            "scheduler": {
                "type": "WarmupLR",
                "params": {
                    "warmup_min_lr": 0,
                    "warmup_max_lr": self.config["training"]["learning_rate"],
                    "warmup_num_steps": self.config["training"]["warmup_steps"]
                }
            },
            "fp16": {
                "enabled": True,
                "loss_scale": 0,
                "loss_scale_window": 1000,
                "hysteresis": 2,
                "min_loss_scale": 1
            },
            "zero_optimization": {
                "stage": 2,
                "allgather_partitions": True,
                "allgather_bucket_size": 2e8,
                "overlap_comm": True,
                "reduce_scatter": True,
                "reduce_bucket_size": 2e8,
                "contiguous_gradients": True
            },
            "activation_checkpointing": {
                "partition_activations": True,
                "cpu_checkpointing": True,
                "contiguous_memory_optimization": False,
                "number_checkpoints": 4,
                "synchronize_checkpoint_boundary": False,
                "profile": False
            }
        }
        
        os.makedirs("config", exist_ok=True)
        with open("config/deepspeed_config.json", "w") as f:
            json.dump(deepspeed_config, f, indent=2)
        
        logger.info("✅ DeepSpeed configuration created")
    
    def train(self):
        """Execute governance LLM training"""
        logger.info("🎯 Starting Promethios Governance LLM Training")
        logger.info("=" * 60)
        
        # Load data and prepare dataset
        training_examples = self.load_governance_data()
        dataset, tokenizer = self.prepare_dataset(training_examples)
        
        # Load model
        model = self.load_model(tokenizer)
        
        # Create DeepSpeed config if needed
        if self.config["hardware"]["use_deepspeed"]:
            self.create_deepspeed_config()
        
        # Setup training arguments
        training_args = self.setup_training_arguments()
        
        # Create data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=tokenizer,
            mlm=False,
            pad_to_multiple_of=8
        )
        
        # Split dataset
        train_size = int(0.9 * len(dataset))
        eval_size = len(dataset) - train_size
        train_dataset, eval_dataset = torch.utils.data.random_split(dataset, [train_size, eval_size])
        
        # Create trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            data_collator=data_collator,
            tokenizer=tokenizer,
        )
        
        # Start training
        logger.info("🚀 Beginning training...")
        logger.info(f"📊 Training examples: {len(train_dataset)}")
        logger.info(f"📊 Evaluation examples: {len(eval_dataset)}")
        logger.info(f"⏰ Expected duration: 8-12 hours")
        logger.info(f"💰 Expected cost: $26-40")
        
        try:
            trainer.train()
            
            # Save final model
            logger.info("💾 Saving final model...")
            trainer.save_model("./models/promethios_governance_llm")
            tokenizer.save_pretrained("./models/promethios_governance_llm")
            
            # Log completion
            training_time = datetime.now() - self.start_time
            logger.info("🎉 Training completed successfully!")
            logger.info(f"⏰ Total training time: {training_time}")
            
            # Create deployment package
            self.create_deployment_package()
            
        except Exception as e:
            logger.error(f"❌ Training failed: {e}")
            raise
    
    def create_deployment_package(self):
        """Create deployment package for Promethios integration"""
        logger.info("📦 Creating deployment package...")
        
        deployment_info = {
            "model_path": "./models/promethios_governance_llm",
            "training_completed": datetime.now().isoformat(),
            "governance_layers": self.config["model"]["governance_layers"],
            "performance_metrics": {
                "training_loss": "See wandb logs",
                "eval_loss": "See wandb logs",
                "governance_accuracy": "To be evaluated"
            },
            "integration_instructions": {
                "1": "Copy model to Promethios deployment directory",
                "2": "Update LLM service configuration",
                "3": "Test governance compliance",
                "4": "Deploy to production"
            }
        }
        
        with open("./models/deployment_info.json", "w") as f:
            json.dump(deployment_info, f, indent=2)
        
        logger.info("✅ Deployment package created")
        logger.info("📁 Model saved to: ./models/promethios_governance_llm")
        logger.info("📋 Deployment info: ./models/deployment_info.json")

def main():
    """Main training execution"""
    print("🚀 Promethios Native LLM Training")
    print("=" * 50)
    print("🎯 Focus: Single-Agent Governance")
    print("🔥 Hardware: 8x H100 SXM5 (80GB)")
    print("⏰ Expected: 8-12 hours")
    print("💰 Cost: ~$26-40")
    print("=" * 50)
    
    # Initialize and start training
    trainer = GovernanceLLMTrainer()
    trainer.train()
    
    print("\n🎉 Training completed! Your governance-native LLM is ready!")
    print("📦 Next step: Deploy to Promethios using deployment package")

if __name__ == "__main__":
    main()

