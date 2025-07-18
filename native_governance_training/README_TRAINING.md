# Promethios 8B Governance Model Training

## 🎯 Overview

This directory contains the complete training pipeline for the world's first native governance LLM - the Promethios 8B Governance Model. Unlike wrapped models that have governance applied externally, this model is trained from the ground up to understand and respond to governance metrics.

## 🏗️ Architecture

### Model Specifications
- **Parameters**: ~8 billion (manageable for 8x A100 GPUs)
- **Layers**: 24 transformer layers
- **Hidden Size**: 4096
- **Attention Heads**: 32
- **Context Length**: 2048 tokens

### Governance Components
- **Constitutional Anchoring**: Layers 8, 16, 24 (legal, ethical, safety frameworks)
- **Emotional Veritas**: Layers 18-24 (6-dimensional uncertainty analysis, self-questioning)
- **Tool Cognition**: Layers 20-24 (tool-aware reasoning)
- **Bias Detection**: Classifier head (6 bias categories)

## 📊 Training Data

### Dataset Composition
- **10,000 governance examples** with real Promethios metrics
- **User-friendly responses** (no raw metrics exposed to users)
- **Natural HITL escalation** when uncertainty is high

### Distribution
- **30% High Confidence**: Decisive, helpful responses
- **40% Medium Confidence**: Thoughtful, balanced guidance
- **20% Low Confidence HITL**: Humble expert consultation
- **10% Uncertain Emotional HITL**: Honest collaborative requests

### Governance Metrics Integration
Examples include real Promethios telemetry:
```
<gov:trust=0.72><gov:emotion=FOCUSED><gov:intensity=0.8>
<gov:verify=0.85><gov:attest=0.90><gov:bound=0.75>
<gov:decision=PENDING><gov:model=CONSENSUS>
```

## 🚀 Quick Start

### Prerequisites
- RunPod instance with 8x A100 GPUs (40GB each)
- CUDA 11.8+
- Python 3.8+
- All dependencies from `requirements.txt`

### Training Commands

**Option 1: Simple Training**
```bash
./run_training.sh
```

**Option 2: Manual Training**
```bash
# Generate training data
python user_friendly_governance_training_generator.py

# Start distributed training
torchrun --nproc_per_node=8 train_governance_model.py \
    --config config_8b_governance.yaml \
    --output_dir ./models/promethios-governance-8b
```

**Option 3: Resume from Checkpoint**
```bash
torchrun --nproc_per_node=8 train_governance_model.py \
    --config config_8b_governance.yaml \
    --output_dir ./models/promethios-governance-8b \
    --resume_from_checkpoint ./models/promethios-governance-8b/checkpoint-1000
```

## 📁 File Structure

```
native_governance_training/
├── train_governance_model.py          # Main training script
├── governance_sentinel_8b.py          # 8B model architecture
├── config_8b_governance.yaml          # Training configuration
├── user_friendly_governance_training_generator.py  # Data generator
├── governance_evaluation.py           # Evaluation framework
├── enhanced_emotional_veritas_integration.py       # Veritas integration
├── promethios_governance_inference_wrapper.py      # Inference wrapper
├── governance_ontology.py             # Governance value hierarchies
├── run_training.sh                    # Training execution script
├── requirements.txt                   # Dependencies
└── README_TRAINING.md                 # This file
```

## ⚙️ Configuration

### Key Parameters (config_8b_governance.yaml)

**Model Architecture:**
```yaml
model:
  hidden_size: 4096
  num_layers: 24
  num_attention_heads: 32
  governance_layers: [8, 16, 24]
```

**Training Settings:**
```yaml
training:
  epochs: 3
  batch_size: 1  # Per device
  gradient_accumulation_steps: 32  # Effective batch = 256
  learning_rate: 5e-5
  fp16: true
  gradient_checkpointing: true
```

**Governance Parameters:**
```yaml
governance:
  hitl_escalation_threshold: 0.4
  domain_trust_requirements:
    healthcare: 0.75
    legal: 0.8
    finance: 0.7
```

## 📈 Evaluation

### Governance Metrics
- **HITL Accuracy**: How well model predicts when to escalate
- **Confidence Calibration**: Alignment between response confidence and governance state
- **Domain Compliance**: Adherence to domain-specific requirements
- **Conflict Resolution**: Handling of conflicting governance signals

### Running Evaluation
```bash
python governance_evaluation.py \
    --model_path ./models/promethios-governance-8b \
    --num_examples 1000 \
    --output_path evaluation_report.json
```

## 🔧 Hardware Requirements

### Minimum Requirements
- **8x A100 GPUs (40GB each)** - 320GB total GPU memory
- **128GB+ RAM** - For data loading and preprocessing
- **1TB+ SSD** - For model checkpoints and datasets
- **High-bandwidth interconnect** - For distributed training

### Memory Usage
- **Model Parameters**: ~26GB (FP16)
- **Gradients**: ~26GB
- **Optimizer States**: ~52GB
- **Activations**: ~50GB
- **Total**: ~154GB (fits comfortably in 320GB)

## ⏱️ Training Timeline

### Expected Duration
- **Model Initialization**: 5-10 minutes
- **Data Generation**: 2-3 minutes
- **Training (3 epochs)**: 12-16 hours
- **Evaluation**: 30-60 minutes
- **Total**: ~16-20 hours

### Cost Estimation
- **RunPod 8x A100**: ~$20-25/hour
- **Total Training Cost**: $320-500
- **vs. Industry Standard**: $75K-200K (99% cost reduction!)

## 🎯 Revolutionary Features

### Native Governance
- **Self-aware**: Model sees its own trust scores and emotional state
- **Metric-conditioned**: Adjusts behavior based on live telemetry
- **Domain-specific**: Different trust requirements for healthcare vs. finance
- **Self-questioning**: Progressive uncertainty reduction like Claude

### User Experience
- **Friendly & Professional**: Warm, approachable tone
- **Appropriate Confidence**: Never overconfident when uncertain
- **Natural HITL**: Graceful escalation without exposing raw metrics
- **Domain-aware**: Understands context and stakes

### Technical Innovation
- **Selective Governance**: Governance modules only where needed
- **Real Metrics**: Trained on actual Promethios telemetry
- **Conflict Resolution**: Handles competing governance signals
- **Continuous Learning**: Can improve from HITL interactions

## 🔍 Troubleshooting

### Common Issues

**Out of Memory Error:**
```bash
# Reduce batch size in config
per_device_train_batch_size: 1
gradient_accumulation_steps: 64
```

**Slow Training:**
```bash
# Enable optimizations
fp16: true
gradient_checkpointing: true
dataloader_num_workers: 4
```

**Import Errors:**
```bash
# Install dependencies
pip install -r requirements.txt
export PYTHONPATH=/workspace/promethios/native_governance_training:$PYTHONPATH
```

### Monitoring Training

**Check GPU Usage:**
```bash
watch -n 1 nvidia-smi
```

**Monitor Training Progress:**
```bash
tail -f logs/training_*.log
```

**TensorBoard:**
```bash
tensorboard --logdir ./logs
```

## 📊 Expected Results

### Governance Effectiveness
- **HITL Accuracy**: >85% (correctly identifies when to escalate)
- **Confidence Calibration**: >80% (confidence matches governance state)
- **Domain Compliance**: >75% (meets domain-specific requirements)
- **Overall Governance Score**: >80%

### Comparison with Wrapped Models
- **Better Integration**: Native understanding vs. external constraints
- **Lower Latency**: No external governance API calls
- **Consistent Behavior**: Governance is part of the model, not added on
- **Cost Effective**: No ongoing API costs for governance

## 🌟 Next Steps

### After Training
1. **Deploy Inference Wrapper**: Connect to live Promethios metrics
2. **A/B Test**: Compare with wrapped GPT-4/Claude
3. **Collect Feedback**: Log HITL interactions for improvement
4. **Iterate**: Retrain with real-world governance data

### Future Enhancements
- **Larger Models**: Scale to 13B, 30B parameters
- **More Domains**: Add specialized governance for new industries
- **Real-time Learning**: Continuous improvement from usage
- **Multi-modal**: Extend governance to images, audio, video

## 📞 Support

For questions or issues:
1. Check the logs in `./logs/`
2. Review the configuration in `config_8b_governance.yaml`
3. Run evaluation to diagnose governance behavior
4. Consult the Promethios governance documentation

## 🏆 Success Criteria

**Training is successful when:**
- ✅ Model completes 3 epochs without errors
- ✅ HITL accuracy > 80%
- ✅ Confidence calibration > 75%
- ✅ Domain compliance > 70%
- ✅ Natural, user-friendly responses
- ✅ Appropriate escalation behavior

**This represents the world's first native governance LLM - a model that doesn't just follow governance rules, but truly understands and embodies governance principles!** 🚀

