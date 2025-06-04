#!/bin/bash
# Script to run the comprehensive end-to-end test suite

echo "===== Promethios CMU Interactive Playground: Comprehensive End-to-End Tests ====="
echo "Starting tests at $(date)"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to run the tests."
    exit 1
fi

# Navigate to the project directory
cd /home/ubuntu/promethios/phase_7_1_prototype/promethios-ui || exit 1

# Install required dependencies
echo "Installing test dependencies..."
npm install puppeteer node-fetch@2 --save-dev

# Create a .env file for testing
echo "Creating test environment variables..."
cat > .env << EOL
# Test environment variables
API_BASE_URL=http://localhost:3000/api
# Add dummy API keys for testing - these are not real keys
OPENAI_API_KEY=sk-test-dummy-key-for-testing-purposes-only
ANTHROPIC_API_KEY=sk-ant-test-dummy-key-for-testing
HUGGINGFACE_API_KEY=hf_test-dummy-key-for-testing-purposes-only
COHERE_API_KEY=co-test-dummy-key-for-testing-purposes-only
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4
FEATURE_FLAGS_DEFAULT={"USE_LLM_AGENTS":false,"SHOW_DEVELOPER_PANEL":true,"ENABLE_GOVERNANCE":true}
EOL

# Run the end-to-end test suite
echo "Running comprehensive end-to-end tests..."
node test/end_to_end_test_suite.js

# Capture the exit code
TEST_EXIT_CODE=$?

# Report results
echo
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All end-to-end tests passed successfully!"
    echo "The system is ready for staging deployment."
else
    echo "❌ Some tests failed. Please check the output above for details."
    echo "Fix the issues before proceeding with staging deployment."
fi

echo
echo "Testing completed at $(date)"
echo "===== End of Testing ====="

exit $TEST_EXIT_CODE
