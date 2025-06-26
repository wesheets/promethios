# Promethios Native LLM Training - Lambda Labs Execution Guide

## 🚀 Complete Step-by-Step Training Guide

### **Prerequisites**
- ✅ Lambda Labs 8x H100 SXM5 instance running
- ✅ JupyterLab interface accessible
- ✅ Training package uploaded to instance

---

## **Phase 1: Setup and Preparation**

### **Step 1: Open Terminal in JupyterLab**
1. In your JupyterLab interface, look for the "Other" section
2. Click on the **"Terminal"** icon (black box with `$_` symbol)
3. A new terminal tab will open

### **Step 2: Navigate to Training Directory**
```bash
# Navigate to the training package
cd promethios-native-llm-training

# Verify you're in the right directory
ls -la
```

**Expected output:** You should see files like `setup_training_environment.sh`, `train_governance_llm.py`, etc.

### **Step 3: Make Scripts Executable**
```bash
# Make setup script executable
chmod +x setup_training_environment.sh
chmod +x train_governance_llm.py
```

---

## **Phase 2: Environment Setup**

### **Step 4: Run Environment Setup**
```bash
# Run the comprehensive setup script
./setup_training_environment.sh
```

**What this does:**
- ✅ Installs all Python dependencies (PyTorch, Transformers, DeepSpeed)
- ✅ Downloads Mistral-7B base model configuration
- ✅ Generates governance training data from Promethios systems
- ✅ Creates training configuration files
- ✅ Sets up monitoring infrastructure

**Expected duration:** 10-15 minutes

**Expected output:** You'll see progress messages for each step, ending with:
```
✅ Training environment setup complete!
🚀 Ready to train your governance-native LLM!
```

---

## **Phase 3: Training Execution**

### **Step 5: Start Governance LLM Training**
```bash
# Begin the main training process
python train_governance_llm.py
```

**What this does:**
- 🧠 Loads Mistral-7B base model
- 📊 Prepares governance training dataset
- 🔥 Utilizes all 8x H100 GPUs with DeepSpeed
- 📈 Trains with multi-objective governance loss
- 💾 Saves checkpoints every 500 steps
- 📊 Logs to Weights & Biases for monitoring

**Expected duration:** 8-12 hours
**Expected cost:** $26-40 total

### **Step 6: Monitor Training (Optional but Recommended)**

**Open a second terminal:**
1. Click the "+" button in JupyterLab to open a new launcher
2. Click "Terminal" again to open a second terminal
3. Navigate to the training directory:
```bash
cd promethios-native-llm-training
python monitoring/monitor_training.py
```

**Monitoring output:**
```
⏰ Runtime: 2.5 hours
💰 Current cost: $8.32
🔥 GPU Stats: 95% utilization across all 8 H100s
```

---

## **Phase 4: Training Progress Indicators**

### **What You'll See During Training:**

**Initial Setup (First 30 minutes):**
```
🚀 Initializing Promethios Native LLM Trainer
💻 Device: cuda
🔥 GPUs available: 8
📊 Loading governance training data...
✅ Loaded 12 governance training examples
🧠 Loading base model for governance training...
```

**Training Progress (Every 50 steps):**
```
Step 50/1500 | Loss: 3.245 | LR: 1.8e-5 | GPU Util: 95%
Step 100/1500 | Loss: 2.891 | LR: 2.0e-5 | GPU Util: 96%
Step 150/1500 | Loss: 2.634 | LR: 2.0e-5 | GPU Util: 94%
```

**Checkpoint Saves (Every 500 steps):**
```
💾 Saving checkpoint at step 500...
✅ Checkpoint saved to ./models/checkpoints/checkpoint-500
```

**Training Completion:**
```
🎉 Training completed successfully!
⏰ Total training time: 9 hours 23 minutes
💾 Saving final model...
📦 Creating deployment package...
✅ Deployment package created
```

---

## **Phase 5: Troubleshooting**

### **Common Issues and Solutions:**

**Issue: "CUDA out of memory"**
```bash
# Reduce batch size in config
nano config/training_config.json
# Change "batch_size" from 8 to 4
```

**Issue: "Permission denied"**
```bash
# Make scripts executable
chmod +x setup_training_environment.sh
chmod +x train_governance_llm.py
```

**Issue: "Module not found"**
```bash
# Re-run setup
./setup_training_environment.sh
```

**Issue: Training seems stuck**
```bash
# Check GPU utilization
nvidia-smi
# Should show 90%+ utilization on all 8 GPUs
```

---

## **Phase 6: Completion and Next Steps**

### **Training Complete Indicators:**
- ✅ Final model saved to `./models/promethios_governance_llm`
- ✅ Deployment info created at `./models/deployment_info.json`
- ✅ Training logs available in `./logs/training`
- ✅ Weights & Biases dashboard shows completion

### **Download Your Trained Model:**
```bash
# Create a compressed archive of your trained model
tar -czf promethios_governance_llm.tar.gz ./models/promethios_governance_llm

# The file will be available for download from JupyterLab
```

### **Integration with Promethios:**
1. Download the trained model files
2. Upload to your Promethios deployment environment
3. Update the LLM service configuration
4. Test governance compliance
5. Deploy to production

---

## **Cost Tracking**

**Real-time cost calculation:**
- **8x H100 SXM5:** $23.92/hour
- **Expected training time:** 8-12 hours
- **Total expected cost:** $191-287

**Cost optimization tips:**
- Monitor training progress regularly
- Stop training early if convergence is achieved
- Use the monitoring script to track costs in real-time

---

## **Support and Monitoring**

**Weights & Biases Dashboard:**
- Automatically created during training
- Real-time loss curves and metrics
- GPU utilization tracking
- Training progress visualization

**Log Files:**
- Training logs: `./logs/training/`
- Error logs: Check terminal output
- Model checkpoints: `./models/checkpoints/`

**Need Help?**
- Check the troubleshooting section above
- Monitor GPU utilization with `nvidia-smi`
- Review training logs for error messages

---

🎯 **Your governance-native LLM will be ready for deployment to Promethios after successful training completion!**

