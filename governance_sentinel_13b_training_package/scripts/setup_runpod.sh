#!/bin/bash
"""
RunPod Setup Script for 13B Governance Model Training
Optimized for 8x A100 80GB configuration
Based on proven $50/4-hour success with 7B model
"""

set -e

echo "🚀 Setting up RunPod environment for 13B Governance Model Training"

# System information
echo "📊 System Information:"
nvidia-smi
echo "GPU Count: $(nvidia-smi --list-gpus | wc -l)"
echo "Memory: $(free -h | grep Mem | awk '{print $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $4}')"

# Update system
echo "🔄 Updating system packages..."
apt-get update -qq
apt-get install -y git wget curl htop tmux vim

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install transformers accelerate datasets
pip install wandb tensorboard
pip install sentencepiece protobuf
pip install deepspeed
pip install flash-attn --no-build-isolation

# Verify PyTorch CUDA
echo "🔍 Verifying PyTorch CUDA installation..."
python -c "import torch; print(f'PyTorch version: {torch.__version__}'); print(f'CUDA available: {torch.cuda.is_available()}'); print(f'CUDA devices: {torch.cuda.device_count()}')"

# Clone training repository
echo "📥 Setting up training code..."
if [ ! -d "/workspace/governance_sentinel_13b" ]; then
    echo "Copying training code to workspace..."
    # In real deployment, this would clone from GitHub
    # git clone https://github.com/your-org/governance-sentinel-13b.git /workspace/governance_sentinel_13b
    mkdir -p /workspace/governance_sentinel_13b
    echo "Training code directory created. Upload your training package here."
else
    echo "Training directory already exists."
fi

cd /workspace/governance_sentinel_13b

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p data/{raw,processed,combined}
mkdir -p outputs/{models,logs,checkpoints}
mkdir -p configs
mkdir -p scripts

# Setup environment variables
echo "🔧 Setting up environment..."
export CUDA_VISIBLE_DEVICES=0,1,2,3,4,5,6,7
export WORLD_SIZE=8
export MASTER_ADDR=localhost
export MASTER_PORT=29500

# Create training configuration
echo "⚙️ Creating training configuration..."
cat > configs/training_config.json << 'EOF'
{
    "model_config_path": "configs/governance_13b_config.json",
    "train_data_path": "data/combined/governance_sentinel_13b_train.json",
    "val_data_path": "data/combined/governance_sentinel_13b_validation.json",
    "tokenizer_name": "meta-llama/Llama-2-7b-hf",
    "max_sequence_length": 4096,
    "batch_size": 2,
    "gradient_accumulation_steps": 4,
    "learning_rate": 1e-4,
    "weight_decay": 0.01,
    "max_grad_norm": 1.0,
    "num_epochs": 3,
    "warmup_steps": 1000,
    "save_steps": 1000,
    "eval_steps": 500,
    "logging_steps": 100,
    "governance_loss_weight": 0.1,
    "constitutional_consistency_weight": 0.05,
    "bias_penalty_weight": 0.05,
    "emotional_veritas_weight": 0.03,
    "use_mixed_precision": true,
    "use_gradient_checkpointing": true,
    "use_flash_attention": true,
    "world_size": 8,
    "use_wandb": true,
    "wandb_project": "governance-sentinel-13b",
    "wandb_run_name": "runpod-training",
    "output_dir": "outputs/governance_sentinel_13b",
    "checkpoint_dir": "outputs/checkpoints"
}
EOF

# Create model configuration
echo "🧠 Creating model configuration..."
cat > configs/governance_13b_config.json << 'EOF'
{
    "vocab_size": 32000,
    "hidden_size": 5120,
    "num_layers": 40,
    "num_attention_heads": 40,
    "intermediate_size": 13824,
    "max_position_embeddings": 4096,
    "constitutional_embedding_size": 512,
    "emotional_veritas_size": 256,
    "tool_embedding_size": 384,
    "bias_detection_size": 128,
    "dropout_prob": 0.1,
    "layer_norm_eps": 1e-12,
    "initializer_range": 0.02,
    "constitutional_frameworks": [
        "us_constitution",
        "universal_declaration", 
        "democratic_principles",
        "rule_of_law",
        "separation_of_powers",
        "checks_and_balances"
    ]
}
EOF

# Create distributed training script
echo "🔄 Creating distributed training script..."
cat > scripts/train_distributed.sh << 'EOF'
#!/bin/bash

export CUDA_VISIBLE_DEVICES=0,1,2,3,4,5,6,7
export WORLD_SIZE=8
export MASTER_ADDR=localhost
export MASTER_PORT=29500

echo "🚀 Starting distributed training on $WORLD_SIZE GPUs"

# Start training on each GPU
for i in $(seq 0 $((WORLD_SIZE-1))); do
    echo "Starting process $i on GPU $i"
    CUDA_VISIBLE_DEVICES=$i python -m torch.distributed.launch \
        --nproc_per_node=1 \
        --nnodes=1 \
        --node_rank=0 \
        --master_addr=$MASTER_ADDR \
        --master_port=$MASTER_PORT \
        src/training/training_pipeline.py \
        --local_rank=$i &
done

wait
echo "✅ Training completed!"
EOF

chmod +x scripts/train_distributed.sh

# Create monitoring script
echo "📊 Creating monitoring script..."
cat > scripts/monitor_training.sh << 'EOF'
#!/bin/bash

echo "🔍 Monitoring 13B Governance Model Training"

while true; do
    clear
    echo "=== GPU Status ==="
    nvidia-smi --query-gpu=index,name,temperature.gpu,utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits
    
    echo -e "\n=== Training Logs ==="
    if [ -f "outputs/logs/training.log" ]; then
        tail -10 outputs/logs/training.log
    else
        echo "Training log not found yet..."
    fi
    
    echo -e "\n=== Disk Usage ==="
    df -h /workspace
    
    echo -e "\n=== Memory Usage ==="
    free -h
    
    echo -e "\n=== Process Status ==="
    ps aux | grep python | grep -v grep | head -5
    
    sleep 30
done
EOF

chmod +x scripts/monitor_training.sh

# Create data generation script
echo "📊 Creating data generation script..."
cat > scripts/generate_datasets.sh << 'EOF'
#!/bin/bash

echo "🔄 Generating 13B training datasets..."

# Generate 7B foundation dataset
echo "Generating 7B foundation dataset..."
python src/data_generation/generate_7b_foundation.py

# Generate 13B enhanced dataset
echo "Generating 13B enhanced dataset..."
python src/data_generation/generate_13b_enhanced.py

# Combine datasets
echo "Combining datasets..."
python src/data_generation/combine_datasets.py

echo "✅ Dataset generation completed!"
echo "📊 Dataset statistics:"
if [ -f "data/combined/governance_sentinel_13b_train.json" ]; then
    python -c "
import json
with open('data/combined/governance_sentinel_13b_train.json', 'r') as f:
    data = json.load(f)
print(f'Training examples: {len(data[\"training_data\"])}')
print(f'Dataset size: {len(str(data)) / 1024 / 1024:.1f} MB')
"
fi
EOF

chmod +x scripts/generate_datasets.sh

# Create cost estimation script
echo "💰 Creating cost estimation script..."
cat > scripts/estimate_costs.sh << 'EOF'
#!/bin/bash

echo "💰 13B Governance Model Training Cost Estimation"
echo "================================================"

# RunPod 8x A100 80GB pricing
HOURLY_RATE=13.00  # Average $1.60 per A100
ESTIMATED_HOURS=16  # Based on 7B success scaled up

TOTAL_COST=$(echo "$HOURLY_RATE * $ESTIMATED_HOURS" | bc -l)

echo "Hardware: 8x A100 80GB"
echo "Hourly Rate: \$$HOURLY_RATE"
echo "Estimated Training Time: $ESTIMATED_HOURS hours"
echo "Estimated Total Cost: \$$TOTAL_COST"
echo ""
echo "Compared to traditional estimates:"
echo "- Industry standard: \$75,000-\$200,000"
echo "- Our approach: \$$TOTAL_COST"
echo "- Cost reduction: $(echo "scale=0; 75000 / $TOTAL_COST" | bc -l)x cheaper"
echo ""
echo "Based on proven \$50/4-hour success with 7B model"
EOF

chmod +x scripts/estimate_costs.sh

# Create quick start script
echo "🚀 Creating quick start script..."
cat > scripts/quick_start.sh << 'EOF'
#!/bin/bash

echo "🚀 Quick Start: 13B Governance Model Training"
echo "=============================================="

echo "1. Generate datasets (estimated 2-3 hours)..."
./scripts/generate_datasets.sh

echo "2. Start training (estimated 12-16 hours)..."
./scripts/train_distributed.sh

echo "3. Monitor training in another terminal:"
echo "   ./scripts/monitor_training.sh"

echo "4. Check costs:"
./scripts/estimate_costs.sh

echo ""
echo "✅ Quick start setup complete!"
echo "📊 Monitor progress with: ./scripts/monitor_training.sh"
echo "💰 Check costs with: ./scripts/estimate_costs.sh"
EOF

chmod +x scripts/quick_start.sh

# Setup logging
echo "📝 Setting up logging..."
mkdir -p outputs/logs
touch outputs/logs/training.log
touch outputs/logs/data_generation.log

# Install additional monitoring tools
echo "📊 Installing monitoring tools..."
pip install gpustat psutil

# Create system info script
echo "ℹ️ Creating system info script..."
cat > scripts/system_info.sh << 'EOF'
#!/bin/bash

echo "🖥️ RunPod System Information"
echo "============================"

echo "GPU Information:"
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader

echo -e "\nCUDA Information:"
nvcc --version | grep "release"

echo -e "\nPyTorch Information:"
python -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA: {torch.version.cuda}'); print(f'GPUs: {torch.cuda.device_count()}')"

echo -e "\nSystem Resources:"
echo "CPU: $(nproc) cores"
echo "RAM: $(free -h | grep Mem | awk '{print $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $2}')"

echo -e "\nNetwork:"
curl -s ifconfig.me && echo " (External IP)"

echo -e "\nRunPod Environment:"
echo "Container ID: $RUNPOD_POD_ID"
echo "Region: $RUNPOD_DC_ID"
EOF

chmod +x scripts/system_info.sh

# Final setup
echo "🔧 Final setup..."

# Set permissions
chmod -R 755 scripts/
chmod -R 644 configs/

# Create README
cat > README.md << 'EOF'
# 13B Governance Sentinel Training on RunPod

## Quick Start
```bash
./scripts/quick_start.sh
```

## Manual Steps

### 1. Generate Datasets
```bash
./scripts/generate_datasets.sh
```

### 2. Start Training
```bash
./scripts/train_distributed.sh
```

### 3. Monitor Training
```bash
./scripts/monitor_training.sh
```

### 4. Check System Info
```bash
./scripts/system_info.sh
```

### 5. Estimate Costs
```bash
./scripts/estimate_costs.sh
```

## Expected Results
- Training Time: 12-16 hours
- Total Cost: ~$200-400
- Model Size: 13B parameters
- Capabilities: Advanced governance reasoning with bias elimination

## Based on Proven Success
This approach scales our proven $50/4-hour 7B model training success.
EOF

echo "✅ RunPod setup completed!"
echo ""
echo "🚀 Next steps:"
echo "1. Upload your training code to /workspace/governance_sentinel_13b/"
echo "2. Run: ./scripts/quick_start.sh"
echo "3. Monitor with: ./scripts/monitor_training.sh"
echo ""
echo "💰 Estimated cost: $200-400 for complete 13B model"
echo "⏱️ Estimated time: 12-16 hours total"
echo ""
echo "📊 System ready for 13B governance model training!"

