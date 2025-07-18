#!/bin/bash
"""
Validation Script for 13B Governance Sentinel
Runs comprehensive testing of trained model
"""

set -e

echo "🧪 Starting 13B Governance Model Validation"
echo "=========================================="

# Check if model exists
MODEL_PATH="outputs/governance_sentinel_13b"
CONFIG_PATH="configs/governance_13b_config.json"

if [ ! -d "$MODEL_PATH" ]; then
    echo "❌ Error: Model not found at $MODEL_PATH"
    echo "Please train the model first with: ./scripts/train_distributed.sh"
    exit 1
fi

if [ ! -f "$CONFIG_PATH" ]; then
    echo "❌ Error: Config not found at $CONFIG_PATH"
    echo "Please ensure configuration file exists"
    exit 1
fi

# Create validation output directory
mkdir -p outputs/validation

# Run validation framework
echo "🔍 Running comprehensive validation tests..."
python src/testing/validation_framework.py \
    --model_path "$MODEL_PATH" \
    --config_path "$CONFIG_PATH"

VALIDATION_EXIT_CODE=$?

# Check validation results
if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ VALIDATION SUCCESSFUL!"
    echo "🎉 The 13B Governance Sentinel passed all tests"
    echo "📊 Check outputs/validation_report.json for detailed results"
    echo ""
    echo "🚀 Model is ready for deployment!"
    echo "Next steps:"
    echo "  1. Export model: ./scripts/export_model.sh"
    echo "  2. Deploy API: ./scripts/deploy_api.sh"
    echo "  3. Test governance scenarios: python src/testing/interactive_test.py"
else
    echo ""
    echo "❌ VALIDATION FAILED"
    echo "Some tests did not pass the required thresholds"
    echo "📊 Check outputs/validation_report.json for detailed analysis"
    echo ""
    echo "🔧 Recommended actions:"
    echo "  1. Review failed test details in validation report"
    echo "  2. Adjust training parameters if needed"
    echo "  3. Generate additional training data for weak areas"
    echo "  4. Retrain model with improvements"
fi

echo ""
echo "📋 Validation Summary:"
echo "  - Constitutional Reasoning: Check validation report"
echo "  - Bias Elimination: Check validation report"  
echo "  - Governance Capabilities: Check validation report"
echo "  - Emotional Veritas: Check validation report"
echo "  - Tool Integration: Check validation report"

exit $VALIDATION_EXIT_CODE

