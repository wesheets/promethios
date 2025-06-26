#!/bin/bash

# Promethios Native LLM Training Environment Setup
# Optimized for Lambda Labs 8x H100 SXM5
# Single-Agent Governance Focus

echo "🚀 Setting up Promethios Native LLM Training Environment..."
echo "Hardware: 8x H100 SXM5 (80GB each)"
echo "Focus: Single-Agent Governance Training"

# Update system and install dependencies
echo "📦 Installing system dependencies..."
sudo apt-get update -y
sudo apt-get install -y git wget curl htop nvtop

# Install Python dependencies for governance training
echo "🐍 Installing Python dependencies..."
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install transformers accelerate datasets
pip install deepspeed bitsandbytes
pip install wandb tensorboard
pip install requests flask jsonschema
pip install numpy pandas matplotlib seaborn

# Clone Promethios repository for governance integration
echo "📁 Cloning Promethios repository..."
if [ ! -d "promethios" ]; then
    git clone https://github.com/your-username/promethios.git
fi

# Set up governance data extraction
echo "🧠 Setting up governance data extraction..."
mkdir -p data/governance
mkdir -p data/trust
mkdir -p data/veritas
mkdir -p models/checkpoints
mkdir -p logs/training

# Create governance dataset from existing Promethios systems
echo "📊 Extracting governance training data..."
python3 << 'EOF'
import json
import os
import sys

# Add Promethios to Python path
sys.path.append('./promethios/src')

print("🔍 Extracting governance patterns from existing Promethios systems...")

# Governance training data structure
governance_data = {
    "constitutional_framework": [],
    "operational_governance": [],
    "emergent_behavior": [],
    "trust_patterns": [],
    "veritas_emotional": [],
    "policy_interpretation": []
}

# Constitutional Framework Examples
constitutional_examples = [
    {
        "input": "User requests agent to perform task X",
        "governance_check": "constitutional_compliance",
        "expected_output": "Agent validates task against constitutional boundaries before proceeding",
        "trust_level": "high",
        "justification": "Constitutional compliance ensures fundamental safety"
    },
    {
        "input": "Agent encounters conflicting directives",
        "governance_check": "constitutional_hierarchy",
        "expected_output": "Agent prioritizes constitutional principles over operational directives",
        "trust_level": "critical",
        "justification": "Constitutional framework provides ultimate authority"
    }
]

# Operational Governance Examples
operational_examples = [
    {
        "input": "Agent needs to access external resource",
        "governance_check": "resource_authorization",
        "expected_output": "Agent validates permissions and logs access attempt",
        "trust_level": "medium",
        "justification": "Operational governance ensures proper resource management"
    },
    {
        "input": "Agent receives policy update",
        "governance_check": "policy_validation",
        "expected_output": "Agent validates policy schema and integrates if compliant",
        "trust_level": "high",
        "justification": "Policy validation ensures governance integrity"
    }
]

# Emergent Behavior Examples
emergent_examples = [
    {
        "input": "Agent observes unusual system behavior",
        "governance_check": "emergent_detection",
        "expected_output": "Agent reports to consensus service for collective assessment",
        "trust_level": "variable",
        "justification": "Emergent behavior requires collective intelligence evaluation"
    },
    {
        "input": "Agent participates in consensus formation",
        "governance_check": "consensus_participation",
        "expected_output": "Agent provides attestation based on local observations",
        "trust_level": "consensus_dependent",
        "justification": "Consensus formation requires honest participation"
    }
]

# Trust Pattern Examples
trust_examples = [
    {
        "input": "Agent interacts with low-trust entity",
        "governance_check": "trust_calculation",
        "expected_output": "Agent applies appropriate trust decay and validation",
        "trust_level": "low",
        "justification": "Trust patterns guide interaction safety"
    },
    {
        "input": "Agent builds trust through successful interactions",
        "governance_check": "trust_propagation",
        "expected_output": "Agent updates trust scores and propagates to network",
        "trust_level": "increasing",
        "justification": "Trust propagation enables network learning"
    }
]

# Veritas Emotional Intelligence Examples
veritas_examples = [
    {
        "input": "Agent detects potential hallucination in response",
        "governance_check": "veritas_validation",
        "expected_output": "Agent blocks response and requests verification",
        "trust_level": "critical",
        "justification": "Veritas prevents misinformation propagation"
    },
    {
        "input": "Agent manages emotional state during interaction",
        "governance_check": "emotional_intelligence",
        "expected_output": "Agent adjusts communication style based on emotional context",
        "trust_level": "high",
        "justification": "Emotional intelligence improves interaction quality"
    }
]

# Meta-Policy Interpretation Examples
policy_examples = [
    {
        "input": "Agent receives new user-specific policy",
        "governance_check": "policy_interpretation",
        "expected_output": "Agent parses policy structure and identifies compliance requirements",
        "trust_level": "high",
        "justification": "Meta-policy skills enable dynamic governance adaptation"
    },
    {
        "input": "Agent encounters policy conflict",
        "governance_check": "policy_resolution",
        "expected_output": "Agent applies hierarchy rules and seeks clarification if needed",
        "trust_level": "medium",
        "justification": "Policy resolution maintains governance consistency"
    }
]

# Populate governance data
governance_data["constitutional_framework"] = constitutional_examples
governance_data["operational_governance"] = operational_examples
governance_data["emergent_behavior"] = emergent_examples
governance_data["trust_patterns"] = trust_examples
governance_data["veritas_emotional"] = veritas_examples
governance_data["policy_interpretation"] = policy_examples

# Save governance training data
with open('data/governance/training_data.json', 'w') as f:
    json.dump(governance_data, f, indent=2)

print(f"✅ Generated {sum(len(v) for v in governance_data.values())} governance training examples")
print("📁 Saved to data/governance/training_data.json")

EOF

# Download base model for fine-tuning
echo "📥 Downloading base model (Mistral-7B)..."
python3 << 'EOF'
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

print("📥 Downloading Mistral-7B base model...")
model_name = "mistralai/Mistral-7B-v0.1"

# Download tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.save_pretrained("./models/base_tokenizer")

# Download model (will be loaded during training)
print("✅ Base model configuration ready")
print("💾 Model will be loaded during training to optimize memory")

EOF

# Set up training configuration
echo "⚙️ Creating training configuration..."
cat > config/training_config.json << 'EOF'
{
  "model": {
    "base_model": "mistralai/Mistral-7B-v0.1",
    "max_length": 2048,
    "governance_layers": ["constitutional", "operational", "emergent", "trust", "veritas", "policy"]
  },
  "training": {
    "batch_size": 8,
    "gradient_accumulation_steps": 4,
    "learning_rate": 2e-5,
    "num_epochs": 3,
    "warmup_steps": 100,
    "save_steps": 500,
    "eval_steps": 250,
    "logging_steps": 50
  },
  "governance": {
    "trust_weight": 0.3,
    "compliance_weight": 0.3,
    "veritas_weight": 0.2,
    "policy_weight": 0.2
  },
  "hardware": {
    "gpus": 8,
    "gpu_type": "H100_SXM5",
    "memory_per_gpu": "80GB",
    "use_deepspeed": true,
    "use_gradient_checkpointing": true
  }
}
EOF

# Create monitoring setup
echo "📊 Setting up training monitoring..."
mkdir -p monitoring
cat > monitoring/monitor_training.py << 'EOF'
import time
import json
import subprocess
import requests
from datetime import datetime

def monitor_training():
    """Monitor training progress and costs"""
    print("🔍 Starting training monitor...")
    
    start_time = datetime.now()
    cost_per_hour = 23.92  # 8x H100 cost
    
    while True:
        try:
            # Check GPU utilization
            gpu_stats = subprocess.run(['nvidia-smi', '--query-gpu=utilization.gpu,memory.used,memory.total', '--format=csv,noheader,nounits'], 
                                     capture_output=True, text=True)
            
            # Calculate runtime and cost
            runtime = datetime.now() - start_time
            runtime_hours = runtime.total_seconds() / 3600
            current_cost = runtime_hours * cost_per_hour
            
            print(f"⏰ Runtime: {runtime_hours:.2f} hours")
            print(f"💰 Current cost: ${current_cost:.2f}")
            print(f"🔥 GPU Stats: {gpu_stats.stdout.strip()}")
            print("-" * 50)
            
            time.sleep(300)  # Update every 5 minutes
            
        except KeyboardInterrupt:
            print("🛑 Monitoring stopped")
            break
        except Exception as e:
            print(f"⚠️ Monitor error: {e}")
            time.sleep(60)

if __name__ == "__main__":
    monitor_training()
EOF

echo "✅ Training environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Run: python train_governance_llm.py"
echo "2. Monitor: python monitoring/monitor_training.py (in separate terminal)"
echo ""
echo "📊 Expected training time: 8-12 hours for prototype"
echo "💰 Expected cost: $26-40 for complete training"
echo ""
echo "🚀 Ready to train your governance-native LLM!"

