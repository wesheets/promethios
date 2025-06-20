# Multi-Agent Coordination Test Suite

This directory contains comprehensive tests for the Promethios Multi-Agent Coordination Module.

## Test Structure

### Python Tests (`test_multi_agent_coordination.py`)
- **API Endpoint Tests**: Validates all FastAPI endpoints
- **Governance Integration Tests**: Tests multi-agent governance features
- **Frontend Integration Tests**: Validates TypeScript/React integration
- **End-to-End Tests**: Complete workflow testing

### Node.js Tests (`test_coordination.js`)
- **Module Initialization Tests**: Validates Node.js module loading
- **Context Management Tests**: Tests context creation and management
- **Message Handling Tests**: Validates agent-to-agent communication
- **Governance Integration Tests**: Tests governance compliance and trust scores
- **Collaboration Model Tests**: Validates different collaboration patterns
- **Metrics and Monitoring Tests**: Tests performance and governance metrics
- **Error Handling Tests**: Validates error scenarios and recovery

### Test Utilities (`test_utils.py`)
- **TestConfig**: Configuration constants and test data
- **MockServices**: Mock implementations for testing without dependencies
- **TestUtilities**: Helper functions for test setup and cleanup
- **TestDataGenerator**: Generates realistic test data

## Running Tests

### Python Tests
```bash
# Run all Python tests
cd /home/ubuntu/promethios
python -m pytest tests/multi_agent_coordination/test_multi_agent_coordination.py -v

# Run specific test class
python -m pytest tests/multi_agent_coordination/test_multi_agent_coordination.py::TestMultiAgentCoordination -v

# Run with coverage
python -m pytest tests/multi_agent_coordination/test_multi_agent_coordination.py --cov=src.api.multi_agent --cov-report=html
```

### Node.js Tests
```bash
# Install test dependencies
cd tests/multi_agent_coordination
npm install

# Run Node.js tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Integration Tests
```bash
# Start the API server first
cd /home/ubuntu/promethios
python -m uvicorn src.api_server:app --host 0.0.0.0 --port 8001 --reload &

# Run integration tests
python -m pytest tests/multi_agent_coordination/test_multi_agent_coordination.py::TestEndToEndIntegration -v
```

## Test Categories

### Unit Tests
- Individual component testing
- Mock external dependencies
- Fast execution
- High coverage

### Integration Tests  
- Component interaction testing
- Real API calls
- Database/storage integration
- Moderate execution time

### End-to-End Tests
- Complete workflow testing
- Full system integration
- Real user scenarios
- Slower execution

## Test Data

### Sample Contexts
- **Basic Context**: Simple 2-agent shared context
- **Complex Context**: Multi-agent with governance
- **Governance Context**: High-security governance policies
- **Performance Context**: Large-scale agent coordination

### Sample Messages
- **User Messages**: Human-initiated conversations
- **Agent Responses**: AI agent communications
- **System Messages**: Internal coordination messages
- **Governance Messages**: Policy and compliance notifications

### Sample Metrics
- **Collaboration Effectiveness**: 0.85 (85%)
- **Average Response Time**: 1200ms
- **Task Completion Rate**: 0.92 (92%)
- **Trust Scores**: 0.75-0.95 range
- **Compliance Rate**: 0.95 (95%)

## Mock Services

### Schema Registry Mock
- Validates request/response schemas
- Returns mock validation results
- Simulates schema loading

### Coordination Mock
- Simulates multi-agent coordination
- Returns realistic test data
- Handles all API operations

### Governance Mock
- Simulates governance decisions
- Returns trust scores and compliance data
- Generates audit logs

## Test Configuration

### Environment Variables
- `TEST_MODE=true`: Enables test mode
- `API_BASE_URL`: Override API server URL
- `NODE_TIMEOUT`: Node.js operation timeout
- `SKIP_INTEGRATION`: Skip integration tests

### Test Flags
- `--skip-node`: Skip Node.js dependent tests
- `--skip-integration`: Skip integration tests
- `--mock-only`: Use only mock services
- `--verbose`: Detailed test output

## Continuous Integration

### GitHub Actions
```yaml
name: Multi-Agent Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: pip install -r requirements.txt
      - run: cd tests/multi_agent_coordination && npm install
      - run: python -m pytest tests/multi_agent_coordination/ -v
      - run: cd tests/multi_agent_coordination && npm test
```

### Test Coverage Goals
- **Python Code**: >90% coverage
- **Node.js Code**: >85% coverage  
- **API Endpoints**: 100% coverage
- **Error Scenarios**: >80% coverage

## Debugging Tests

### Common Issues
1. **Node.js Module Not Found**: Install dependencies with `npm install`
2. **API Server Not Running**: Start server before integration tests
3. **Timeout Errors**: Increase timeout values in test config
4. **Mock Data Issues**: Check test_utils.py for data generation

### Debug Commands
```bash
# Debug Python tests
python -m pytest tests/multi_agent_coordination/test_multi_agent_coordination.py -v -s --pdb

# Debug Node.js tests
cd tests/multi_agent_coordination
npm test -- --grep "specific test name"

# Check API server status
curl http://localhost:8001/

# Validate Node.js syntax
node --check ../../src/modules/multi_agent_coordination/index.js
```

## Contributing

### Adding New Tests
1. Follow existing test patterns
2. Use descriptive test names
3. Include both positive and negative test cases
4. Add appropriate mocks for external dependencies
5. Update this README with new test categories

### Test Naming Convention
- `test_<functionality>_<scenario>`: Descriptive test names
- `TestClassName`: PascalCase for test classes
- `mock_<service>`: Lowercase for mock functions

### Best Practices
- Keep tests independent and isolated
- Use appropriate assertions
- Clean up resources after tests
- Mock external dependencies
- Test error conditions
- Maintain test data consistency

