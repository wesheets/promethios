#!/bin/bash

# Promethios Comprehensive Governance LLM - Production Deployment Script
# Optimized for Lambda Labs 8x H100 SXM5 Infrastructure
# Estimated Training Time: 12-18 hours
# Estimated Cost: $720 USD

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
TRAINING_DIR="./promethios_governance_llm_production"
LOGS_DIR="./logs"
CONFIG_DIR="./config"
MONITORING_DIR="./monitoring"
VALIDATION_DIR="./validation"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_header "🔍 CHECKING PREREQUISITES"
    echo "=============================================="
    
    # Check GPU availability
    print_status "Checking GPU availability..."
    if ! command -v nvidia-smi &> /dev/null; then
        print_error "nvidia-smi not found. NVIDIA drivers not installed."
        exit 1
    fi
    
    GPU_COUNT=$(nvidia-smi --query-gpu=name --format=csv,noheader,nounits | wc -l)
    print_status "Found $GPU_COUNT GPUs"
    
    if [ "$GPU_COUNT" -lt 8 ]; then
        print_warning "Expected 8 GPUs, found $GPU_COUNT. Training may be slower."
    fi
    
    # Check GPU memory
    TOTAL_MEMORY=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | awk '{sum+=$1} END {print sum}')
    print_status "Total GPU Memory: ${TOTAL_MEMORY}MB"
    
    if [ "$TOTAL_MEMORY" -lt 600000 ]; then
        print_warning "Expected 640GB+ GPU memory, found ${TOTAL_MEMORY}MB. May need to reduce batch size."
    fi
    
    # Check Python and packages
    print_status "Checking Python environment..."
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 not found."
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_status "Python version: $PYTHON_VERSION"
    
    # Check PyTorch
    if ! python3 -c "import torch" &> /dev/null; then
        print_error "PyTorch not installed."
        exit 1
    fi
    
    TORCH_VERSION=$(python3 -c "import torch; print(torch.__version__)")
    CUDA_AVAILABLE=$(python3 -c "import torch; print(torch.cuda.is_available())")
    print_status "PyTorch version: $TORCH_VERSION"
    print_status "CUDA available: $CUDA_AVAILABLE"
    
    if [ "$CUDA_AVAILABLE" != "True" ]; then
        print_error "CUDA not available in PyTorch."
        exit 1
    fi
    
    print_success "Prerequisites check completed successfully!"
    echo
}

# Function to setup directories
setup_directories() {
    print_header "📁 SETTING UP DIRECTORIES"
    echo "=============================================="
    
    # Create necessary directories
    mkdir -p "$TRAINING_DIR"
    mkdir -p "$LOGS_DIR/training"
    mkdir -p "$LOGS_DIR/tensorboard"
    mkdir -p "$LOGS_DIR/monitoring"
    mkdir -p "$LOGS_DIR/validation"
    
    print_success "Directories created successfully!"
    echo
}

# Function to generate comprehensive dataset
generate_dataset() {
    print_header "📊 GENERATING COMPREHENSIVE GOVERNANCE DATASET"
    echo "=============================================="
    
    print_status "Generating 50,000+ governance training examples..."
    python3 enhanced_governance_dataset.py \
        --output_file comprehensive_governance_dataset.json \
        --dataset_size 50000 \
        --include_constitutional true \
        --include_operational true \
        --include_trust_management true \
        --include_saas_development true \
        --include_collaboration true \
        --include_professional_communication true \
        --include_memory_integration true \
        --validation_split 0.1 \
        --test_split 0.05
    
    if [ $? -eq 0 ]; then
        print_success "Comprehensive governance dataset generated successfully!"
    else
        print_error "Dataset generation failed!"
        exit 1
    fi
    echo
}

# Function to start monitoring
start_monitoring() {
    print_header "📊 STARTING COMPREHENSIVE MONITORING"
    echo "=============================================="
    
    print_status "Launching monitoring dashboard..."
    nohup python3 monitoring/comprehensive_training_monitor.py \
        --wandb_project promethios-governance-llm-production \
        --update_interval 30 \
        > "$LOGS_DIR/monitoring/monitor.log" 2>&1 &
    
    MONITOR_PID=$!
    echo $MONITOR_PID > "$LOGS_DIR/monitoring/monitor.pid"
    
    print_success "Monitoring started (PID: $MONITOR_PID)"
    print_status "Monitor logs: $LOGS_DIR/monitoring/monitor.log"
    echo
}

# Function to start training
start_training() {
    print_header "🚀 STARTING COMPREHENSIVE GOVERNANCE LLM TRAINING"
    echo "=============================================="
    
    print_status "Training Configuration:"
    print_status "  Base Model: CodeLlama-34B-Instruct"
    print_status "  Dataset Size: 50,000+ examples"
    print_status "  Hardware: 8x H100 SXM5 (640GB total)"
    print_status "  Estimated Time: 12-18 hours"
    print_status "  Estimated Cost: $720 USD"
    echo
    
    print_status "Starting comprehensive governance training..."
    python3 final_production_trainer.py \
        --config config/production_governance_config.json \
        --deepspeed config/deepspeed_production_config.json \
        --output_dir "$TRAINING_DIR" \
        --logging_dir "$LOGS_DIR/training" \
        --monitoring_enabled true \
        --validation_enabled true \
        --wandb_project promethios-governance-llm-production \
        --run_name "comprehensive-governance-production-$(date +%Y%m%d-%H%M%S)"
    
    TRAINING_EXIT_CODE=$?
    
    if [ $TRAINING_EXIT_CODE -eq 0 ]; then
        print_success "Training completed successfully!"
    else
        print_error "Training failed with exit code: $TRAINING_EXIT_CODE"
        return 1
    fi
    echo
}

# Function to validate model
validate_model() {
    print_header "🧪 VALIDATING GOVERNANCE CAPABILITIES"
    echo "=============================================="
    
    if [ ! -d "$TRAINING_DIR" ]; then
        print_error "Training directory not found. Training may have failed."
        return 1
    fi
    
    print_status "Running comprehensive governance validation..."
    python3 validation/comprehensive_governance_validator.py \
        --model_path "$TRAINING_DIR" \
        --output_path "$LOGS_DIR/validation/validation_report.json"
    
    VALIDATION_EXIT_CODE=$?
    
    if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
        print_success "Validation completed successfully!"
        print_status "Validation report: $LOGS_DIR/validation/validation_report.json"
    else
        print_error "Validation failed with exit code: $VALIDATION_EXIT_CODE"
        return 1
    fi
    echo
}

# Function to stop monitoring
stop_monitoring() {
    print_header "🛑 STOPPING MONITORING"
    echo "=============================================="
    
    if [ -f "$LOGS_DIR/monitoring/monitor.pid" ]; then
        MONITOR_PID=$(cat "$LOGS_DIR/monitoring/monitor.pid")
        if ps -p $MONITOR_PID > /dev/null; then
            kill $MONITOR_PID
            print_success "Monitoring stopped (PID: $MONITOR_PID)"
        else
            print_warning "Monitor process not running"
        fi
        rm -f "$LOGS_DIR/monitoring/monitor.pid"
    else
        print_warning "Monitor PID file not found"
    fi
    echo
}

# Function to generate final report
generate_final_report() {
    print_header "📋 GENERATING FINAL DEPLOYMENT REPORT"
    echo "=============================================="
    
    REPORT_FILE="$LOGS_DIR/final_deployment_report.txt"
    
    cat > "$REPORT_FILE" << EOF
Promethios Comprehensive Governance LLM - Deployment Report
===========================================================

Deployment Date: $(date)
Training Duration: $(cat "$LOGS_DIR/training/training_duration.txt" 2>/dev/null || echo "Unknown")
Total Cost: $(cat "$LOGS_DIR/training/total_cost.txt" 2>/dev/null || echo "Unknown")

Model Information:
- Base Model: CodeLlama-34B-Instruct
- Training Dataset: 50,000+ governance examples
- Output Directory: $TRAINING_DIR
- Model Size: $(du -sh "$TRAINING_DIR" 2>/dev/null | cut -f1 || echo "Unknown")

Hardware Configuration:
- GPUs: $GPU_COUNT
- Total GPU Memory: ${TOTAL_MEMORY}MB
- Python Version: $PYTHON_VERSION
- PyTorch Version: $TORCH_VERSION

Governance Capabilities:
- Constitutional Governance: ✓ Trained
- Operational Excellence: ✓ Trained  
- Trust Management: ✓ Trained
- Memory Integration: ✓ Trained
- SaaS Development: ✓ Trained
- Collaboration Protocols: ✓ Trained
- Professional Communication: ✓ Trained

Validation Results:
$(cat "$LOGS_DIR/validation/validation_report.json" 2>/dev/null | jq -r '.validation_summary | "- Overall Pass Rate: \(.overall_pass_rate * 100 | round)%\n- Average Score: \(.overall_average_score | . * 100 | round)%\n- Total Tests: \(.total_tests)\n- Tests Passed: \(.total_passed)"' 2>/dev/null || echo "Validation report not available")

Files Generated:
- Model: $TRAINING_DIR/
- Training Logs: $LOGS_DIR/training/
- Validation Report: $LOGS_DIR/validation/validation_report.json
- Monitoring Logs: $LOGS_DIR/monitoring/

Next Steps:
1. Review validation report for governance capability assessment
2. Test model with sample governance scenarios
3. Deploy to staging environment for integration testing
4. Proceed with production deployment when ready

For support and documentation, see:
- COMPREHENSIVE_PRODUCTION_DEPLOYMENT_GUIDE.md
- Technical support: support@promethios.ai
- Documentation: https://docs.promethios.ai

EOF

    print_success "Final deployment report generated: $REPORT_FILE"
    echo
}

# Function to display final status
display_final_status() {
    print_header "🎉 DEPLOYMENT COMPLETE"
    echo "=============================================="
    
    print_success "Comprehensive Governance LLM training completed successfully!"
    echo
    print_status "📁 Model Location: $TRAINING_DIR"
    print_status "📊 Validation Report: $LOGS_DIR/validation/validation_report.json"
    print_status "📋 Final Report: $LOGS_DIR/final_deployment_report.txt"
    print_status "📝 Training Logs: $LOGS_DIR/training/"
    echo
    print_status "🎯 Governance Capabilities Trained:"
    print_status "   ✓ Constitutional Governance"
    print_status "   ✓ Operational Excellence"
    print_status "   ✓ Trust Management"
    print_status "   ✓ Memory Integration"
    print_status "   ✓ SaaS Development"
    print_status "   ✓ Collaboration Protocols"
    print_status "   ✓ Professional Communication"
    echo
    print_status "🚀 Ready for production deployment!"
    print_status "📖 See COMPREHENSIVE_PRODUCTION_DEPLOYMENT_GUIDE.md for next steps"
    echo
}

# Function to handle cleanup on exit
cleanup() {
    print_warning "Deployment interrupted. Cleaning up..."
    stop_monitoring
    exit 1
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution flow
main() {
    print_header "🚀 PROMETHIOS COMPREHENSIVE GOVERNANCE LLM DEPLOYMENT"
    print_header "======================================================"
    print_status "Starting comprehensive governance-native LLM training..."
    print_status "Optimized for Lambda Labs 8x H100 SXM5 infrastructure"
    print_status "Estimated completion: 12-18 hours"
    print_status "Estimated cost: $720 USD"
    echo
    
    # Record start time
    START_TIME=$(date +%s)
    echo $START_TIME > "$LOGS_DIR/start_time.txt"
    
    # Execute deployment steps
    check_prerequisites
    setup_directories
    generate_dataset
    start_monitoring
    
    # Start training (this is the main time-consuming step)
    if start_training; then
        # Training successful, proceed with validation
        validate_model
        stop_monitoring
        
        # Calculate duration and cost
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        HOURS=$(echo "scale=2; $DURATION / 3600" | bc)
        COST=$(echo "scale=2; $HOURS * 20" | bc)  # $20/hour for 8x H100
        
        echo "$HOURS hours" > "$LOGS_DIR/training/training_duration.txt"
        echo "\$$COST USD" > "$LOGS_DIR/training/total_cost.txt"
        
        generate_final_report
        display_final_status
        
        print_success "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉"
        print_status "Training Duration: $HOURS hours"
        print_status "Total Cost: \$$COST USD"
        
    else
        # Training failed
        stop_monitoring
        print_error "❌ DEPLOYMENT FAILED DURING TRAINING"
        print_status "Check logs in $LOGS_DIR/training/ for details"
        exit 1
    fi
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Script is being executed directly
    main "$@"
fi

