#!/bin/bash

# Comprehensive Promethios Agent & Governance Testing Script
# This script runs the complete test suite for deployed agents and governance UI

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
UI_BASE_URL="${UI_BASE_URL:-https://promethios-ui.vercel.app}"
API_BASE_URL="${API_BASE_URL:-https://promethios-api.vercel.app}"
AGENT_ENDPOINT="${AGENT_ENDPOINT:-}"
API_KEY="${API_KEY:-}"
TEST_DIR="$(dirname "$0")"
RESULTS_DIR="${TEST_DIR}/results"

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo
    echo "=================================================================="
    print_status $BLUE "$1"
    echo "=================================================================="
}

print_success() {
    print_status $GREEN "✅ $1"
}

print_error() {
    print_status $RED "❌ $1"
}

print_warning() {
    print_status $YELLOW "⚠️  $1"
}

# Function to check if required tools are installed
check_dependencies() {
    print_header "Checking Dependencies"
    
    local missing_deps=()
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("python3")
    fi
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        missing_deps+=("pip3")
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    # Check if Chrome/Chromium is available for Selenium
    if ! command -v google-chrome &> /dev/null && ! command -v chromium-browser &> /dev/null; then
        missing_deps+=("google-chrome or chromium-browser")
    fi
    
    if [ ${#missing_deps[@]} -eq 0 ]; then
        print_success "All dependencies are installed"
        return 0
    else
        print_error "Missing dependencies: ${missing_deps[*]}"
        echo "Please install the missing dependencies and try again."
        return 1
    fi
}

# Function to install Python dependencies
install_python_deps() {
    print_header "Installing Python Dependencies"
    
    # Create requirements.txt if it doesn't exist
    cat > "${TEST_DIR}/requirements.txt" << EOF
requests>=2.25.0
selenium>=4.0.0
webdriver-manager>=3.8.0
beautifulsoup4>=4.9.0
pytest>=6.0.0
pytest-html>=3.0.0
EOF
    
    if pip3 install -r "${TEST_DIR}/requirements.txt"; then
        print_success "Python dependencies installed"
        return 0
    else
        print_error "Failed to install Python dependencies"
        return 1
    fi
}

# Function to run basic connectivity tests
test_connectivity() {
    print_header "Testing Basic Connectivity"
    
    # Test UI connectivity
    if curl -s --head "$UI_BASE_URL" | head -n 1 | grep -q "200 OK"; then
        print_success "UI endpoint is accessible: $UI_BASE_URL"
    else
        print_error "UI endpoint is not accessible: $UI_BASE_URL"
        return 1
    fi
    
    # Test API connectivity
    if curl -s --head "$API_BASE_URL" | head -n 1 | grep -qE "(200|404)"; then
        print_success "API endpoint is accessible: $API_BASE_URL"
    else
        print_error "API endpoint is not accessible: $API_BASE_URL"
        return 1
    fi
    
    # Test agent endpoint if provided
    if [ -n "$AGENT_ENDPOINT" ]; then
        if curl -s --head "$AGENT_ENDPOINT" | head -n 1 | grep -qE "(200|404)"; then
            print_success "Agent endpoint is accessible: $AGENT_ENDPOINT"
        else
            print_warning "Agent endpoint may not be accessible: $AGENT_ENDPOINT"
        fi
    fi
}

# Function to run governance UI tests
run_governance_ui_tests() {
    print_header "Running Governance UI Tests"
    
    local test_script="${TEST_DIR}/governance_ui_tester.py"
    local results_file="${RESULTS_DIR}/governance_ui_results_$(date +%Y%m%d_%H%M%S).json"
    
    if [ ! -f "$test_script" ]; then
        print_error "Governance UI test script not found: $test_script"
        return 1
    fi
    
    # Run the governance UI tests
    if [ -n "$AGENT_ENDPOINT" ] && [ -n "$API_KEY" ]; then
        print_status $BLUE "Running with agent-specific tests..."
        python3 "$test_script" "$UI_BASE_URL" "$API_BASE_URL" "$AGENT_ENDPOINT" "$API_KEY"
    else
        print_status $BLUE "Running basic governance UI tests..."
        python3 "$test_script" "$UI_BASE_URL" "$API_BASE_URL"
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "Governance UI tests completed successfully"
    else
        print_error "Governance UI tests failed"
    fi
    
    return $exit_code
}

# Function to run agent functionality tests
run_agent_tests() {
    if [ -z "$AGENT_ENDPOINT" ] || [ -z "$API_KEY" ]; then
        print_warning "Agent endpoint or API key not provided - skipping agent tests"
        return 0
    fi
    
    print_header "Running Agent Functionality Tests"
    
    local test_script="${TEST_DIR}/basic_agent_test.py"
    
    if [ ! -f "$test_script" ]; then
        print_error "Agent test script not found: $test_script"
        return 1
    fi
    
    # Run the agent tests
    if python3 "$test_script" "$AGENT_ENDPOINT" "$API_KEY"; then
        print_success "Agent functionality tests completed successfully"
        return 0
    else
        print_error "Agent functionality tests failed"
        return 1
    fi
}

# Function to run Postman collection tests
run_postman_tests() {
    if [ -z "$AGENT_ENDPOINT" ] || [ -z "$API_KEY" ]; then
        print_warning "Agent endpoint or API key not provided - skipping Postman tests"
        return 0
    fi
    
    print_header "Running Postman Collection Tests"
    
    local collection_file="${TEST_DIR}/postman_collection.json"
    
    if [ ! -f "$collection_file" ]; then
        print_warning "Postman collection not found: $collection_file"
        print_status $BLUE "You can import the collection manually into Postman for testing"
        return 0
    fi
    
    # Check if Newman (Postman CLI) is available
    if command -v newman &> /dev/null; then
        print_status $BLUE "Running Postman collection with Newman..."
        
        # Create environment file for Newman
        local env_file="${RESULTS_DIR}/postman_env.json"
        cat > "$env_file" << EOF
{
  "id": "test-environment",
  "name": "Promethios Test Environment",
  "values": [
    {
      "key": "agent_endpoint",
      "value": "$AGENT_ENDPOINT",
      "enabled": true
    },
    {
      "key": "api_key", 
      "value": "$API_KEY",
      "enabled": true
    }
  ]
}
EOF
        
        # Run Newman
        if newman run "$collection_file" -e "$env_file" --reporters cli,html --reporter-html-export "${RESULTS_DIR}/postman_results.html"; then
            print_success "Postman tests completed successfully"
            return 0
        else
            print_error "Postman tests failed"
            return 1
        fi
    else
        print_warning "Newman not installed - skipping automated Postman tests"
        print_status $BLUE "Install Newman with: npm install -g newman"
        print_status $BLUE "Or import ${collection_file} into Postman manually"
        return 0
    fi
}

# Function to generate test report
generate_report() {
    print_header "Generating Test Report"
    
    local report_file="${RESULTS_DIR}/test_report_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# Promethios Comprehensive Test Report

**Test Date:** $(date)
**UI Base URL:** $UI_BASE_URL
**API Base URL:** $API_BASE_URL
**Agent Endpoint:** ${AGENT_ENDPOINT:-"Not provided"}

## Test Configuration

- **Dependencies Check:** $DEPS_STATUS
- **Connectivity Test:** $CONNECTIVITY_STATUS
- **Governance UI Tests:** $GOVERNANCE_STATUS
- **Agent Functionality Tests:** $AGENT_STATUS
- **Postman Collection Tests:** $POSTMAN_STATUS

## Test Results Summary

### Governance UI Tests
$GOVERNANCE_DETAILS

### Agent Functionality Tests
$AGENT_DETAILS

### Postman Collection Tests
$POSTMAN_DETAILS

## Recommendations

### If Tests Failed:
1. Check network connectivity to all endpoints
2. Verify agent is properly deployed and accessible
3. Confirm API key is valid and has proper permissions
4. Review browser console for JavaScript errors
5. Check server logs for backend issues

### If Tests Passed:
1. Agent deployment is working correctly
2. Governance UI is displaying data properly
3. Data flow from agent to UI is functional
4. Ready for production use

## Next Steps

1. **Monitor deployed agents** in the governance dashboard
2. **Set up alerts** for trust score violations
3. **Review performance metrics** regularly
4. **Test with real user scenarios**
5. **Scale testing** with multiple agents

## Files Generated

- Test results: \`${RESULTS_DIR}/\`
- Governance UI results: \`governance_ui_results_*.json\`
- Postman results: \`postman_results.html\` (if Newman was used)

EOF

    print_success "Test report generated: $report_file"
}

# Function to display usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -u, --ui-url URL          UI base URL (default: https://promethios-ui.vercel.app)"
    echo "  -a, --api-url URL         API base URL (default: https://promethios-api.vercel.app)"
    echo "  -e, --agent-endpoint URL  Agent endpoint URL for testing"
    echo "  -k, --api-key KEY         API key for agent authentication"
    echo "  -h, --help                Show this help message"
    echo
    echo "Environment Variables:"
    echo "  UI_BASE_URL               UI base URL"
    echo "  API_BASE_URL              API base URL"
    echo "  AGENT_ENDPOINT            Agent endpoint URL"
    echo "  API_KEY                   API key for agent"
    echo
    echo "Examples:"
    echo "  # Basic governance UI tests only"
    echo "  $0"
    echo
    echo "  # Full tests with agent"
    echo "  $0 -e https://deployed-agent-xyz.promethios.ai -k promethios_abc_123"
    echo
    echo "  # Custom URLs"
    echo "  $0 -u https://my-ui.com -a https://my-api.com"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--ui-url)
            UI_BASE_URL="$2"
            shift 2
            ;;
        -a|--api-url)
            API_BASE_URL="$2"
            shift 2
            ;;
        -e|--agent-endpoint)
            AGENT_ENDPOINT="$2"
            shift 2
            ;;
        -k|--api-key)
            API_KEY="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_header "Promethios Comprehensive Testing Suite"
    echo "UI URL: $UI_BASE_URL"
    echo "API URL: $API_BASE_URL"
    if [ -n "$AGENT_ENDPOINT" ]; then
        echo "Agent Endpoint: $AGENT_ENDPOINT"
        echo "API Key: ${API_KEY:0:20}..."
    else
        echo "Agent Endpoint: Not provided (governance UI tests only)"
    fi
    echo
    
    # Initialize status variables
    DEPS_STATUS="❌ Failed"
    CONNECTIVITY_STATUS="❌ Failed"
    GOVERNANCE_STATUS="❌ Failed"
    AGENT_STATUS="⚠️ Skipped"
    POSTMAN_STATUS="⚠️ Skipped"
    
    # Run tests
    if check_dependencies; then
        DEPS_STATUS="✅ Passed"
        
        if install_python_deps; then
            if test_connectivity; then
                CONNECTIVITY_STATUS="✅ Passed"
                
                if run_governance_ui_tests; then
                    GOVERNANCE_STATUS="✅ Passed"
                fi
                
                if run_agent_tests; then
                    AGENT_STATUS="✅ Passed"
                fi
                
                if run_postman_tests; then
                    POSTMAN_STATUS="✅ Passed"
                fi
            fi
        fi
    fi
    
    # Generate report
    GOVERNANCE_DETAILS="See detailed results in JSON files"
    AGENT_DETAILS="Basic functionality and API tests"
    POSTMAN_DETAILS="Comprehensive API endpoint testing"
    
    generate_report
    
    # Final summary
    print_header "Test Execution Complete"
    echo "Dependencies: $DEPS_STATUS"
    echo "Connectivity: $CONNECTIVITY_STATUS"
    echo "Governance UI: $GOVERNANCE_STATUS"
    echo "Agent Tests: $AGENT_STATUS"
    echo "Postman Tests: $POSTMAN_STATUS"
    echo
    echo "Results saved to: $RESULTS_DIR"
    
    # Determine exit code
    if [[ "$GOVERNANCE_STATUS" == *"Passed"* ]]; then
        print_success "Core governance UI tests passed - system is functional!"
        exit 0
    else
        print_error "Core tests failed - please review results and fix issues"
        exit 1
    fi
}

# Run main function
main "$@"

