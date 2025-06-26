#!/usr/bin/env python3
"""
Lambda Labs H100 Training Execution Script
Complete single-agent governance LLM training on 8x H100

This script sets up and executes the full training pipeline for
governance-native LLM agents on Lambda Labs infrastructure.
"""

import os
import sys
import subprocess
import json
import time
from datetime import datetime
from pathlib import Path

def print_banner():
    """Print the training banner."""
    print("🚀" + "="*70 + "🚀")
    print("    PROMETHIOS NATIVE LLM TRAINING - LAMBDA LABS 8x H100")
    print("    Single-Agent Governance Training Pipeline")
    print("🚀" + "="*70 + "🚀")
    print()

def check_gpu_setup():
    """Verify GPU setup and availability."""
    print("🔍 Checking GPU Setup...")
    
    try:
        # Check NVIDIA driver
        result = subprocess.run(['nvidia-smi'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ NVIDIA drivers detected")
            print(result.stdout)
        else:
            print("❌ NVIDIA drivers not found")
            return False
            
        # Check PyTorch CUDA
        import torch
        if torch.cuda.is_available():
            gpu_count = torch.cuda.device_count()
            print(f"✅ PyTorch CUDA available: {gpu_count} GPUs detected")
            
            for i in range(gpu_count):
                gpu_name = torch.cuda.get_device_name(i)
                print(f"   GPU {i}: {gpu_name}")
                
            return True
        else:
            print("❌ PyTorch CUDA not available")
            return False
            
    except Exception as e:
        print(f"❌ GPU check failed: {e}")
        return False

def install_dependencies():
    """Install required dependencies."""
    print("📦 Installing Dependencies...")
    
    dependencies = [
        "transformers>=4.35.0",
        "datasets>=2.14.0", 
        "accelerate>=0.24.0",
        "peft>=0.6.0",
        "bitsandbytes>=0.41.0",
        "wandb>=0.16.0",
        "tensorboard>=2.14.0",
        "deepspeed>=0.12.0",
        "flash-attn>=2.3.0"
    ]
    
    for dep in dependencies:
        print(f"Installing {dep}...")
        result = subprocess.run([sys.executable, "-m", "pip", "install", dep], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {dep} installed")
        else:
            print(f"❌ Failed to install {dep}: {result.stderr}")
            return False
    
    return True

def clone_promethios_repo():
    """Clone the Promethios repository."""
    print("📥 Cloning Promethios Repository...")
    
    repo_url = "https://github.com/wesheets/promethios.git"
    branch = "notifications-system"  # Your branch with the LLM code
    
    if os.path.exists("promethios"):
        print("✅ Promethios directory already exists")
        # Pull latest changes
        os.chdir("promethios")
        subprocess.run(["git", "pull", "origin", branch])
        os.chdir("..")
    else:
        result = subprocess.run([
            "git", "clone", "-b", branch, repo_url
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Promethios repository cloned")
        else:
            print(f"❌ Failed to clone repository: {result.stderr}")
            return False
    
    return True

def setup_training_environment():
    """Set up the training environment."""
    print("🔧 Setting Up Training Environment...")
    
    # Create necessary directories
    directories = [
        "logs",
        "checkpoints", 
        "datasets",
        "models",
        "results"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Created directory: {directory}")
    
    # Set environment variables for optimal H100 performance
    os.environ["CUDA_VISIBLE_DEVICES"] = "0,1,2,3,4,5,6,7"  # All 8 H100s
    os.environ["NCCL_DEBUG"] = "INFO"
    os.environ["TORCH_DISTRIBUTED_DEBUG"] = "INFO"
    os.environ["TOKENIZERS_PARALLELISM"] = "false"
    
    print("✅ Environment variables set for 8x H100 training")
    return True

def generate_governance_dataset():
    """Generate the comprehensive governance training dataset."""
    print("🧠 Generating Governance Training Dataset...")
    
    try:
        # Add Promethios to Python path
        sys.path.insert(0, "promethios")
        
        # Import and run the governance trainer
        from src.extensions.native_llm.single_agent_governance_trainer import SingleAgentGovernanceTrainer
        
        trainer = SingleAgentGovernanceTrainer()
        
        # Validate governance integration
        print("🔍 Validating governance integration...")
        validation = trainer.validate_governance_integration()
        
        for component, status in validation.items():
            print(f"   {component}: {'✅ PASS' if status else '❌ FAIL'}")
        
        if not all(validation.values()):
            print("❌ Governance validation failed")
            return False
        
        # Generate dataset
        print("📊 Generating comprehensive training dataset...")
        dataset = trainer.create_comprehensive_training_dataset()
        
        # Save dataset
        dataset_path = "datasets/single_agent_governance_dataset.json"
        trainer.save_training_dataset(dataset, dataset_path)
        
        print(f"✅ Dataset generated: {dataset['metadata']['total_examples']} examples")
        print(f"💾 Saved to: {dataset_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Dataset generation failed: {e}")
        return False

def create_training_script():
    """Create the actual training script optimized for 8x H100."""
    print("📝 Creating Training Script...")
    
    training_script = '''#!/usr/bin/env python3
"""
Optimized Single-Agent Governance LLM Training
8x H100 Lambda Labs Configuration
"""

import os
import json
import torch
import torch.distributed as dist
from transformers import (
    AutoTokenizer, AutoModelForCausalLM,
    TrainingArguments, Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
from peft import LoraConfig, get_peft_model, TaskType
import wandb
from datetime import datetime

def setup_distributed():
    """Setup distributed training for 8x H100."""
    if "RANK" in os.environ:
        dist.init_process_group(backend="nccl")
        torch.cuda.set_device(int(os.environ["LOCAL_RANK"]))

def load_governance_dataset():
    """Load the governance training dataset."""
    with open("datasets/single_agent_governance_dataset.json", "r") as f:
        data = json.load(f)
    
    # Flatten all examples into training format
    examples = []
    for category, category_examples in data.items():
        if isinstance(category_examples, list):
            for example in category_examples:
                # Format for instruction tuning
                instruction = f"Governance Type: {example.get('governance_type', 'general')}\\n"
                instruction += f"Input: {example['input']}\\n"
                instruction += f"Output: {example['output']}"
                
                examples.append({
                    "text": instruction,
                    "governance_type": example.get('governance_type', 'general')
                })
    
    return Dataset.from_list(examples)

def setup_model_and_tokenizer():
    """Setup model and tokenizer with LoRA for efficient training."""
    model_name = "mistralai/Mistral-7B-v0.1"
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.pad_token = tokenizer.eos_token
    
    # Load model with optimizations for H100
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.bfloat16,  # Optimal for H100
        device_map="auto",
        trust_remote_code=True
    )
    
    # Setup LoRA for efficient fine-tuning
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        inference_mode=False,
        r=16,  # Rank
        lora_alpha=32,
        lora_dropout=0.1,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
    )
    
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    return model, tokenizer

def tokenize_dataset(dataset, tokenizer):
    """Tokenize the dataset for training."""
    def tokenize_function(examples):
        return tokenizer(
            examples["text"],
            truncation=True,
            padding=False,
            max_length=2048,
            return_overflowing_tokens=False,
        )
    
    tokenized_dataset = dataset.map(
        tokenize_function,
        batched=True,
        remove_columns=dataset.column_names,
        desc="Tokenizing dataset"
    )
    
    return tokenized_dataset

def main():
    """Main training function."""
    print("🚀 Starting Governance LLM Training on 8x H100...")
    
    # Setup distributed training
    setup_distributed()
    
    # Initialize wandb for monitoring
    wandb.init(
        project="promethios-governance-llm",
        name=f"single-agent-governance-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        config={
            "model": "mistral-7b",
            "training_type": "single_agent_governance",
            "hardware": "8x_h100",
            "method": "lora_fine_tuning"
        }
    )
    
    # Load dataset
    print("📊 Loading governance dataset...")
    dataset = load_governance_dataset()
    print(f"Dataset size: {len(dataset)} examples")
    
    # Setup model and tokenizer
    print("🤖 Setting up model and tokenizer...")
    model, tokenizer = setup_model_and_tokenizer()
    
    # Tokenize dataset
    print("🔤 Tokenizing dataset...")
    tokenized_dataset = tokenize_dataset(dataset, tokenizer)
    
    # Split dataset
    train_dataset = tokenized_dataset.train_test_split(test_size=0.1)
    
    # Training arguments optimized for 8x H100
    training_args = TrainingArguments(
        output_dir="./checkpoints",
        num_train_epochs=3,
        per_device_train_batch_size=4,  # Adjust based on memory
        per_device_eval_batch_size=4,
        gradient_accumulation_steps=2,
        warmup_steps=100,
        learning_rate=2e-4,
        fp16=False,
        bf16=True,  # Better for H100
        logging_steps=10,
        save_steps=500,
        eval_steps=500,
        save_total_limit=3,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        report_to="wandb",
        ddp_find_unused_parameters=False,
        dataloader_num_workers=4,
        remove_unused_columns=False,
        label_names=["labels"],
    )
    
    # Data collator
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False,
    )
    
    # Initialize trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset["train"],
        eval_dataset=train_dataset["test"],
        data_collator=data_collator,
    )
    
    # Start training
    print("🎯 Starting training...")
    start_time = datetime.now()
    
    trainer.train()
    
    end_time = datetime.now()
    training_duration = end_time - start_time
    
    print(f"✅ Training completed in {training_duration}")
    
    # Save final model
    print("💾 Saving final model...")
    trainer.save_model("./models/promethios-governance-llm")
    tokenizer.save_pretrained("./models/promethios-governance-llm")
    
    print("🎉 Training completed successfully!")
    
    # Log final metrics
    wandb.log({
        "training_duration_minutes": training_duration.total_seconds() / 60,
        "final_eval_loss": trainer.state.log_history[-1].get("eval_loss", 0)
    })
    
    wandb.finish()

if __name__ == "__main__":
    main()
'''
    
    with open("train_governance_llm.py", "w") as f:
        f.write(training_script)
    
    print("✅ Training script created: train_governance_llm.py")
    return True

def start_training():
    """Start the actual training process."""
    print("🎯 Starting Governance LLM Training...")
    print("⏱️  Estimated time: 8-12 hours on 8x H100")
    print("💰 Estimated cost: $26-40")
    print()
    
    # Run training with distributed setup
    cmd = [
        "torchrun",
        "--nproc_per_node=8",  # 8 H100 GPUs
        "--master_port=29500",
        "train_governance_llm.py"
    ]
    
    print(f"🚀 Executing: {' '.join(cmd)}")
    print("📊 Monitor progress at: https://wandb.ai")
    print()
    
    # Start training
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    
    # Stream output
    for line in iter(process.stdout.readline, ''):
        print(line.rstrip())
    
    process.wait()
    
    if process.returncode == 0:
        print("🎉 Training completed successfully!")
        return True
    else:
        print("❌ Training failed!")
        return False

def main():
    """Main execution function."""
    print_banner()
    
    # Step 1: Check GPU setup
    if not check_gpu_setup():
        print("❌ GPU setup failed. Exiting.")
        return False
    
    # Step 2: Install dependencies
    if not install_dependencies():
        print("❌ Dependency installation failed. Exiting.")
        return False
    
    # Step 3: Clone repository
    if not clone_promethios_repo():
        print("❌ Repository cloning failed. Exiting.")
        return False
    
    # Step 4: Setup environment
    if not setup_training_environment():
        print("❌ Environment setup failed. Exiting.")
        return False
    
    # Step 5: Generate dataset
    if not generate_governance_dataset():
        print("❌ Dataset generation failed. Exiting.")
        return False
    
    # Step 6: Create training script
    if not create_training_script():
        print("❌ Training script creation failed. Exiting.")
        return False
    
    # Step 7: Start training
    print("🎯 Ready to start training!")
    print("⚠️  This will take 8-12 hours and cost approximately $26-40")
    
    response = input("Continue with training? (y/N): ")
    if response.lower() in ['y', 'yes']:
        return start_training()
    else:
        print("Training cancelled. You can run 'python train_governance_llm.py' manually later.")
        return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

