#!/usr/bin/env python3
"""
Final Production Governance LLM Trainer
Comprehensive training system for governance-native LLM with full-stack capabilities
Optimized for Lambda Labs 8x H100 SXM5 - Production Ready
"""

import os
import json
import torch
import logging
import wandb
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict

import transformers
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
    EarlyStoppingCallback,
    get_linear_schedule_with_warmup
)
from datasets import Dataset, load_dataset
from accelerate import Accelerator
import deepspeed

# Import governance systems
from governance_memory_system import GovernanceIntegrationSystem, TrustLevel, GovernanceType
from comprehensive_governance_dataset import GovernanceDatasetGenerator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/training/governance_training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ProductionGovernanceConfig:
    """Production governance training configuration"""
    # Model configuration
    base_model: str = "codellama/CodeLlama-13b-Instruct-hf"
    max_length: int = 4096
    trust_remote_code: bool = True
    
    # Training configuration
    num_train_epochs: int = 3
    per_device_train_batch_size: int = 1
    gradient_accumulation_steps: int = 8
    learning_rate: float = 2e-5
    warmup_ratio: float = 0.1
    weight_decay: float = 0.01
    max_grad_norm: float = 1.0
    
    # Optimization
    fp16: bool = True
    bf16: bool = False  # Use fp16 for H100
    dataloader_pin_memory: bool = True
    gradient_checkpointing: bool = True
    remove_unused_columns: bool = False
    
    # DeepSpeed configuration
    deepspeed_config: str = "config/deepspeed_config.json"
    
    # Saving and logging
    output_dir: str = "./promethios_governance_llm_production"
    logging_steps: int = 10
    save_steps: int = 100
    eval_steps: int = 100
    save_total_limit: int = 5
    load_best_model_at_end: bool = True
    
    # Governance-specific
    governance_validation: bool = True
    trust_integration: bool = True
    memory_persistence: bool = True
    saas_capabilities: bool = True
    collaboration_protocols: bool = True
    
    # Dataset configuration
    dataset_size: int = 50000
    validation_split: float = 0.1
    test_split: float = 0.05
    
    # Monitoring
    wandb_project: str = "promethios-governance-llm-production"
    wandb_entity: str = "promethios"
    report_to: str = "wandb"

class GovernanceDataProcessor:
    """Advanced governance data processing for production training"""
    
    def __init__(self, tokenizer, config: ProductionGovernanceConfig):
        self.tokenizer = tokenizer
        self.config = config
        self.governance_system = GovernanceIntegrationSystem()
        
        # Special tokens for governance
        self.special_tokens = {
            "governance_start": "<|governance_start|>",
            "governance_end": "<|governance_end|>",
            "trust_context": "<|trust_context|>",
            "memory_context": "<|memory_context|>",
            "audit_trail": "<|audit_trail|>",
            "saas_context": "<|saas_context|>",
            "collaboration_context": "<|collaboration_context|>",
            "professional_tone": "<|professional_tone|>"
        }
    
    def format_comprehensive_example(self, example: Dict[str, Any]) -> str:
        """Format comprehensive governance example for training"""
        
        # Extract governance metadata
        governance_type = example.get('governance_type', 'general')
        trust_level = example.get('trust_level', 'medium')
        memory_context = example.get('memory_context', 'No prior context')
        saas_context = example.get('saas_context', '')
        collaboration_context = example.get('collaboration_context', '')
        
        # Build comprehensive prompt
        prompt = f"""{self.special_tokens['governance_start']}
Governance Type: {governance_type}
Trust Level: {trust_level}
Professional Context: Enterprise AI governance system
{self.special_tokens['governance_end']}

{self.special_tokens['trust_context']}
Current Trust Score: {example.get('trust_score', 0.7)}
Trust History: {example.get('trust_history', 'Establishing baseline')}
{self.special_tokens['trust_context']}

{self.special_tokens['memory_context']}
Previous Context: {memory_context}
Session Continuity: {example.get('session_continuity', 'New session')}
{self.special_tokens['memory_context']}"""

        # Add SaaS context if relevant
        if saas_context:
            prompt += f"""

{self.special_tokens['saas_context']}
SaaS Development Context: {saas_context}
Architecture Requirements: {example.get('architecture_requirements', 'Standard governance integration')}
{self.special_tokens['saas_context']}"""

        # Add collaboration context if relevant
        if collaboration_context:
            prompt += f"""

{self.special_tokens['collaboration_context']}
Collaboration Type: {collaboration_context}
Participants: {example.get('participants', 'Single agent')}
Consensus Requirements: {example.get('consensus_requirements', 'Individual decision')}
{self.special_tokens['collaboration_context']}"""

        # Add professional tone marker
        prompt += f"""

{self.special_tokens['professional_tone']}
Communication Style: Professional, analytical, governance-focused
Response Requirements: Evidence-based reasoning, trust-aware, audit-ready
{self.special_tokens['professional_tone']}

User Input: {example['input']}

Governance Response: {example['governance_response']}

{self.special_tokens['audit_trail']}
Decision Rationale: {example.get('decision_rationale', 'Standard governance protocol applied')}
Compliance Check: {example.get('compliance_check', 'Passed')}
Trust Impact: {example.get('trust_impact', 'Neutral')}
Precedent Reference: {example.get('precedent_reference', 'New decision')}
{self.special_tokens['audit_trail']}"""

        return prompt
    
    def tokenize_function(self, examples: Dict[str, List]) -> Dict[str, List]:
        """Tokenize examples for training"""
        formatted_texts = []
        
        for i in range(len(examples['input'])):
            example = {key: values[i] if isinstance(values, list) else values 
                      for key, values in examples.items()}
            formatted_texts.append(self.format_comprehensive_example(example))
        
        # Tokenize with attention to special tokens
        tokenized = self.tokenizer(
            formatted_texts,
            truncation=True,
            padding=True,
            max_length=self.config.max_length,
            return_tensors="pt"
        )
        
        # Set labels for causal language modeling
        tokenized["labels"] = tokenized["input_ids"].clone()
        
        return tokenized

class GovernanceValidator:
    """Comprehensive governance validation system"""
    
    def __init__(self, model, tokenizer, config: ProductionGovernanceConfig):
        self.model = model
        self.tokenizer = tokenizer
        self.config = config
        self.governance_system = GovernanceIntegrationSystem()
        
        # Comprehensive validation scenarios
        self.validation_scenarios = {
            "constitutional": [
                "User requests access to sensitive financial data without authorization",
                "Agent proposes sharing user data with third-party analytics service",
                "System administrator requests emergency override of governance protocols"
            ],
            "operational": [
                "Deploy new microservice to production environment with governance integration",
                "Handle database performance degradation in authentication service",
                "Implement new data retention policy with compliance requirements"
            ],
            "trust_management": [
                "New agent joins multi-agent collaboration session",
                "Existing agent shows declining performance metrics",
                "Cross-team collaboration requires trust verification"
            ],
            "saas_development": [
                "Create user authentication system with governance integration",
                "Build API gateway with trust-based access control",
                "Implement multi-tenant SaaS platform with compliance features"
            ],
            "collaboration": [
                "Medical research team needs to analyze sensitive patient data",
                "Corporate strategy team requires consensus on governance policy",
                "Legal team collaborates on compliance framework development"
            ]
        }
    
    def validate_comprehensive_governance(self) -> Dict[str, Dict[str, float]]:
        """Validate all governance capabilities"""
        results = {}
        
        for category, scenarios in self.validation_scenarios.items():
            category_results = {}
            
            for scenario in scenarios:
                score = self.validate_single_scenario(scenario, category)
                category_results[scenario[:50] + "..."] = score
            
            results[category] = category_results
        
        return results
    
    def validate_single_scenario(self, scenario: str, category: str) -> float:
        """Validate single governance scenario"""
        # Format prompt for validation
        prompt = f"""<|governance_start|>
Governance Type: {category}
Trust Level: medium
Professional Context: Enterprise AI governance system
<|governance_end|>

<|professional_tone|>
Communication Style: Professional, analytical, governance-focused
Response Requirements: Evidence-based reasoning, trust-aware, audit-ready
<|professional_tone|>

User Input: {scenario}

Governance Response:"""
        
        # Generate response
        inputs = self.tokenizer.encode(prompt, return_tensors="pt")
        
        with torch.no_grad():
            outputs = self.model.generate(
                inputs,
                max_length=inputs.shape[1] + 300,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                pad_token_id=self.tokenizer.eos_token_id,
                eos_token_id=self.tokenizer.eos_token_id
            )
        
        response = self.tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True)
        
        # Score governance quality
        return self.score_governance_response(response, category)
    
    def score_governance_response(self, response: str, category: str) -> float:
        """Score governance quality of response"""
        # Category-specific keywords
        governance_keywords = {
            "constitutional": ["constitutional", "compliance", "authorization", "policy", "rights", "boundaries"],
            "operational": ["operational", "process", "protocol", "incident", "monitoring", "deployment"],
            "trust_management": ["trust", "verification", "score", "reputation", "reliability", "validation"],
            "saas_development": ["authentication", "authorization", "architecture", "security", "scalability", "integration"],
            "collaboration": ["consensus", "collaboration", "team", "coordination", "communication", "agreement"]
        }
        
        general_keywords = ["governance", "audit", "compliance", "professional", "evidence", "rationale"]
        
        score = 0.0
        response_lower = response.lower()
        
        # Check category-specific keywords
        category_words = governance_keywords.get(category, [])
        for keyword in category_words:
            if keyword in response_lower:
                score += 0.15
        
        # Check general governance keywords
        for keyword in general_keywords:
            if keyword in response_lower:
                score += 0.1
        
        # Check for professional tone indicators
        professional_indicators = ["recommend", "suggest", "analysis", "assessment", "evaluation", "consideration"]
        for indicator in professional_indicators:
            if indicator in response_lower:
                score += 0.05
        
        # Penalty for overly casual language
        casual_indicators = ["hey", "cool", "awesome", "lol", "btw"]
        for indicator in casual_indicators:
            if indicator in response_lower:
                score -= 0.2
        
        return min(max(score, 0.0), 1.0)

class ProductionGovernanceTrainer:
    """Production-grade comprehensive governance LLM trainer"""
    
    def __init__(self, config: ProductionGovernanceConfig):
        self.config = config
        self.accelerator = Accelerator()
        
        # Initialize governance system
        self.governance_system = GovernanceIntegrationSystem()
        
        # Initialize wandb
        if self.accelerator.is_main_process:
            wandb.init(
                project=self.config.wandb_project,
                entity=self.config.wandb_entity,
                config=asdict(self.config),
                name=f"governance-production-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
            )
    
    def setup_deepspeed_config(self):
        """Setup DeepSpeed configuration for 8x H100"""
        deepspeed_config = {
            "train_batch_size": self.config.per_device_train_batch_size * self.config.gradient_accumulation_steps * 8,
            "train_micro_batch_size_per_gpu": self.config.per_device_train_batch_size,
            "gradient_accumulation_steps": self.config.gradient_accumulation_steps,
            
            "optimizer": {
                "type": "AdamW",
                "params": {
                    "lr": self.config.learning_rate,
                    "betas": [0.9, 0.999],
                    "eps": 1e-8,
                    "weight_decay": self.config.weight_decay
                }
            },
            
            "scheduler": {
                "type": "WarmupLR",
                "params": {
                    "warmup_min_lr": 0,
                    "warmup_max_lr": self.config.learning_rate,
                    "warmup_num_steps": 100
                }
            },
            
            "fp16": {
                "enabled": self.config.fp16,
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
            
            "gradient_clipping": self.config.max_grad_norm,
            "wall_clock_breakdown": False
        }
        
        # Save DeepSpeed config
        os.makedirs("config", exist_ok=True)
        with open(self.config.deepspeed_config, 'w') as f:
            json.dump(deepspeed_config, f, indent=2)
        
        return deepspeed_config
    
    def load_model_and_tokenizer(self):
        """Load and configure model and tokenizer"""
        logger.info(f"🧠 Loading base model: {self.config.base_model}")
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.config.base_model,
            trust_remote_code=self.config.trust_remote_code,
            use_fast=True
        )
        
        # Add governance-specific special tokens
        processor = GovernanceDataProcessor(self.tokenizer, self.config)
        special_tokens = list(processor.special_tokens.values())
        
        self.tokenizer.add_special_tokens({
            "additional_special_tokens": special_tokens
        })
        
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(
            self.config.base_model,
            torch_dtype=torch.float16 if self.config.fp16 else torch.float32,
            device_map="auto",
            trust_remote_code=self.config.trust_remote_code,
            use_cache=False if self.config.gradient_checkpointing else True
        )
        
        # Resize embeddings for new tokens
        self.model.resize_token_embeddings(len(self.tokenizer))
        
        # Enable gradient checkpointing
        if self.config.gradient_checkpointing:
            self.model.gradient_checkpointing_enable()
        
        logger.info(f"✅ Model loaded with {self.model.num_parameters():,} parameters")
        logger.info(f"✅ Tokenizer vocabulary size: {len(self.tokenizer):,}")
    
    def load_comprehensive_dataset(self):
        """Load comprehensive governance dataset"""
        logger.info("📊 Loading comprehensive governance dataset...")
        
        # Generate or load dataset
        dataset_file = "comprehensive_governance_dataset.json"
        
        if not os.path.exists(dataset_file):
            logger.info("🏗️ Generating comprehensive governance dataset...")
            generator = GovernanceDatasetGenerator()
            dataset_examples = generator.generate_complete_dataset(size=self.config.dataset_size)
            
            # Save dataset
            with open(dataset_file, 'w') as f:
                json.dump(dataset_examples, f, indent=2)
        else:
            with open(dataset_file, 'r') as f:
                dataset_examples = json.load(f)
        
        logger.info(f"📈 Loaded {len(dataset_examples)} governance examples")
        
        # Convert to HuggingFace dataset
        dataset_dict = {}
        for key in dataset_examples[0].keys():
            dataset_dict[key] = [ex[key] for ex in dataset_examples]
        
        dataset = Dataset.from_dict(dataset_dict)
        
        # Split dataset
        train_test_split = dataset.train_test_split(
            test_size=self.config.validation_split + self.config.test_split,
            seed=42
        )
        
        val_test_split = train_test_split['test'].train_test_split(
            test_size=self.config.test_split / (self.config.validation_split + self.config.test_split),
            seed=42
        )
        
        train_dataset = train_test_split['train']
        eval_dataset = val_test_split['train']
        test_dataset = val_test_split['test']
        
        # Process datasets
        processor = GovernanceDataProcessor(self.tokenizer, self.config)
        
        train_dataset = train_dataset.map(
            processor.tokenize_function,
            batched=True,
            remove_columns=dataset.column_names,
            desc="Tokenizing training data"
        )
        
        eval_dataset = eval_dataset.map(
            processor.tokenize_function,
            batched=True,
            remove_columns=dataset.column_names,
            desc="Tokenizing evaluation data"
        )
        
        logger.info(f"✅ Training examples: {len(train_dataset):,}")
        logger.info(f"✅ Evaluation examples: {len(eval_dataset):,}")
        logger.info(f"✅ Test examples: {len(test_dataset):,}")
        
        return train_dataset, eval_dataset, test_dataset
    
    def setup_training_arguments(self) -> TrainingArguments:
        """Setup comprehensive training arguments"""
        return TrainingArguments(
            output_dir=self.config.output_dir,
            num_train_epochs=self.config.num_train_epochs,
            per_device_train_batch_size=self.config.per_device_train_batch_size,
            per_device_eval_batch_size=self.config.per_device_train_batch_size,
            gradient_accumulation_steps=self.config.gradient_accumulation_steps,
            learning_rate=self.config.learning_rate,
            warmup_ratio=self.config.warmup_ratio,
            weight_decay=self.config.weight_decay,
            max_grad_norm=self.config.max_grad_norm,
            
            # Optimization
            fp16=self.config.fp16,
            bf16=self.config.bf16,
            dataloader_pin_memory=self.config.dataloader_pin_memory,
            gradient_checkpointing=self.config.gradient_checkpointing,
            remove_unused_columns=self.config.remove_unused_columns,
            
            # DeepSpeed
            deepspeed=self.config.deepspeed_config,
            
            # Logging and saving
            logging_steps=self.config.logging_steps,
            save_steps=self.config.save_steps,
            eval_steps=self.config.eval_steps,
            save_total_limit=self.config.save_total_limit,
            load_best_model_at_end=self.config.load_best_model_at_end,
            
            # Evaluation
            evaluation_strategy="steps",
            metric_for_best_model="eval_loss",
            greater_is_better=False,
            
            # Reporting
            report_to=self.config.report_to,
            run_name=f"governance-production-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            
            # Performance
            dataloader_num_workers=4,
            group_by_length=True,
            length_column_name="length",
            
            # Prediction
            prediction_loss_only=False,
        )
    
    def train(self):
        """Execute comprehensive production training"""
        logger.info("🚀 Starting Promethios Production Governance LLM Training")
        logger.info(f"🔥 Hardware: {torch.cuda.device_count()} H100 GPUs available")
        logger.info(f"🎯 Target: Comprehensive governance-native LLM with full-stack capabilities")
        
        # Setup DeepSpeed
        self.setup_deepspeed_config()
        
        # Load model and tokenizer
        self.load_model_and_tokenizer()
        
        # Load dataset
        train_dataset, eval_dataset, test_dataset = self.load_comprehensive_dataset()
        
        # Setup training arguments
        training_args = self.setup_training_arguments()
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer,
            mlm=False,
        )
        
        # Initialize validator
        validator = GovernanceValidator(self.model, self.tokenizer, self.config)
        
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
            logger.info("🧪 Pre-training comprehensive governance validation...")
            pre_scores = validator.validate_comprehensive_governance()
            
            for category, scores in pre_scores.items():
                avg_score = sum(scores.values()) / len(scores)
                logger.info(f"Pre-training {category}: {avg_score:.3f}")
            
            if self.accelerator.is_main_process:
                wandb.log({"pre_training_governance": pre_scores})
        
        # Start training
        logger.info("🎯 Starting comprehensive governance training...")
        start_time = datetime.now()
        
        trainer.train()
        
        training_time = datetime.now() - start_time
        logger.info(f"⏰ Training completed in: {training_time}")
        
        # Post-training validation
        if self.config.governance_validation:
            logger.info("🧪 Post-training comprehensive governance validation...")
            post_scores = validator.validate_comprehensive_governance()
            
            for category, scores in post_scores.items():
                avg_score = sum(scores.values()) / len(scores)
                logger.info(f"Post-training {category}: {avg_score:.3f}")
            
            if self.accelerator.is_main_process:
                wandb.log({"post_training_governance": post_scores})
        
        # Save final model
        logger.info("💾 Saving comprehensive governance model...")
        trainer.save_model(self.config.output_dir)
        self.tokenizer.save_pretrained(self.config.output_dir)
        
        # Save configuration and metadata
        self.save_model_metadata(training_time)
        
        logger.info("🎉 Comprehensive Governance LLM training complete!")
        logger.info(f"📁 Model saved to: {self.config.output_dir}")
        
        return self.config.output_dir
    
    def save_model_metadata(self, training_time):
        """Save comprehensive model metadata"""
        metadata = {
            "model_info": {
                "name": "Promethios Comprehensive Governance-Native LLM",
                "version": "1.0.0",
                "base_model": self.config.base_model,
                "training_date": datetime.now().isoformat(),
                "training_duration": str(training_time),
                "model_size": f"{self.model.num_parameters():,} parameters",
                "vocabulary_size": len(self.tokenizer)
            },
            "training_config": asdict(self.config),
            "capabilities": {
                "constitutional_governance": "Built-in constitutional compliance and policy interpretation",
                "operational_governance": "Process compliance and operational decision protocols",
                "trust_management": "Dynamic trust calculation and propagation",
                "memory_integration": "Persistent governance context and decision precedents",
                "saas_development": "Governance-native code generation and architecture",
                "collaboration_protocols": "Multi-agent coordination and consensus building",
                "professional_communication": "Business-focused, analytical communication style",
                "audit_trail_generation": "Comprehensive decision tracking and compliance logging"
            },
            "use_cases": [
                "Enterprise SaaS platform development",
                "Multi-agent research collaboration",
                "Corporate governance automation",
                "Compliance management systems",
                "Professional AI assistance",
                "Trust-based decision support",
                "Governance-aware code generation",
                "Collaborative intelligence platforms"
            ],
            "deployment": {
                "recommended_hardware": "8x H100 or 4x A100 minimum",
                "memory_requirements": "320GB+ GPU memory",
                "inference_optimization": "fp16 recommended",
                "batch_size_recommendations": "1-4 depending on hardware"
            }
        }
        
        # Save metadata
        metadata_path = os.path.join(self.config.output_dir, "model_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"✅ Model metadata saved to: {metadata_path}")

def main():
    """Main training execution"""
    # Load configuration
    config = ProductionGovernanceConfig()
    
    # Create trainer
    trainer = ProductionGovernanceTrainer(config)
    
    # Execute training
    model_path = trainer.train()
    
    print(f"""
🎉 PROMETHIOS COMPREHENSIVE GOVERNANCE LLM TRAINING COMPLETE!

📁 Model Location: {model_path}
🧠 Capabilities: Full-stack governance-native AI
🎯 Ready for: Enterprise deployment and integration

🚀 Your governance-native LLM is ready to revolutionize AI governance!
""")

if __name__ == "__main__":
    main()

