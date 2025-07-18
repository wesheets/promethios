#!/bin/bash

# Promethios 8B Governance Model Training Script
# For RunPod with 8x A100 GPUs

set -e  # Exit on any error

echo "🚀 Starting Promethios 8B Governance Model Training"
echo "=================================================="

# Configuration
export CUDA_VISIBLE_DEVICES=0,1,2,3,4,5,6,7
export WORLD_SIZE=8
export MASTER_ADDR=localhost
export MASTER_PORT=12355

# Training parameters
MODEL_NAME="promethios-governance-8b"
OUTPUT_DIR="./models/${MODEL_NAME}"
CONFIG_FILE="config_8b_governance.yaml"
LOG_FILE="training_$(date +%Y%m%d_%H%M%S).log"

# Create output directory
mkdir -p "${OUTPUT_DIR}"
mkdir -p "./logs"

echo "📋 Training Configuration:"
echo "  Model: ${MODEL_NAME}"
echo "  Output: ${OUTPUT_DIR}"
echo "  Config: ${CONFIG_FILE}"
echo "  GPUs: ${WORLD_SIZE}"
echo "  Log: ${LOG_FILE}"
echo ""

# Check GPU availability
echo "🔍 Checking GPU availability..."
nvidia-smi
echo ""

# Check dependencies
echo "📦 Checking dependencies..."
python -c "import torch; print(f'PyTorch: {torch.__version__}')"
python -c "import transformers; print(f'Transformers: {transformers.__version__}')"
echo ""

# Generate training data if not exists
if [ ! -f "governance_training_dataset.json" ]; then
    echo "📊 Generating governance training dataset..."
    python user_friendly_governance_training_generator.py
    echo "✅ Training dataset generated"
else
    echo "✅ Training dataset already exists"
fi

# Start distributed training
echo "🎯 Starting distributed training..."
echo "Command: torchrun --nproc_per_node=8 --master_port=12355 train_governance_model.py --config ${CONFIG_FILE} --output_dir ${OUTPUT_DIR}"
echo ""

# Run training with logging
torchrun \
    --nproc_per_node=8 \
    --master_port=12355 \
    train_governance_model.py \
    --config "${CONFIG_FILE}" \
    --output_dir "${OUTPUT_DIR}" \
    2>&1 | tee "./logs/${LOG_FILE}"

# Check if training completed successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Training completed successfully!"
    echo "📁 Model saved to: ${OUTPUT_DIR}"
    
    # Run evaluation
    echo ""
    echo "🔍 Running governance evaluation..."
    python governance_evaluation.py \
        --model_path "${OUTPUT_DIR}" \
        --num_examples 500 \
        --output_path "./logs/evaluation_$(date +%Y%m%d_%H%M%S).json"
    
    echo "✅ Evaluation completed!"
    
    # Display final model info
    echo ""
    echo "📊 Final Model Information:"
    echo "  Location: ${OUTPUT_DIR}"
    echo "  Size: $(du -sh ${OUTPUT_DIR} | cut -f1)"
    echo "  Files:"
    ls -la "${OUTPUT_DIR}"
    
else
    echo ""
    echo "❌ Training failed! Check logs for details."
    echo "📄 Log file: ./logs/${LOG_FILE}"
    exit 1
fi

echo ""
echo "🎉 Promethios 8B Governance Model Training Complete!"
echo "=================================================="

