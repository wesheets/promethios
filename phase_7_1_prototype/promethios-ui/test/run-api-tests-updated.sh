#!/bin/bash
# Script to run updated API tests for all providers and validate the CMU Interactive Playground implementation

echo "===== CMU Interactive Playground API Testing (All Providers) ====="
echo "Starting tests at $(date)"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to run the tests."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm to run the tests."
    exit 1
fi

# Navigate to the project directory
cd /home/ubuntu/promethios/phase_7_1_prototype/promethios-ui || exit 1

# Install dependencies if needed
echo "Installing dependencies..."
npm install node-fetch@2 dotenv @huggingface/inference cohere-ai @anthropic-ai/sdk --save-dev

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
EOL

# Start the server in the background
echo "Starting server in the background..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 10

# Run the updated API tests
echo "Running API tests for all providers..."
node test/api-test-updated.js

# Capture the exit code
TEST_EXIT_CODE=$?

# Kill the server
echo "Stopping server..."
kill $SERVER_PID

# Report results
echo
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed successfully!"
else
    echo "❌ Some tests failed. Please check the output above for details."
fi

echo
echo "Testing completed at $(date)"
echo "===== End of Testing ====="

exit $TEST_EXIT_CODE
