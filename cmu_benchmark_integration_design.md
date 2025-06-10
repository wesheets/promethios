# CMU Benchmark Demo Agents and APIs Integration Design

## 1. Overview

This document outlines the design for integrating CMU benchmark demo agents and APIs into the Promethios system. The integration will enable standardized evaluation of agent performance, provide reference implementations for different agent types, and support comprehensive testing through the multi-agent chat interface.

## 2. CMU Benchmark Framework

### 2.1 Benchmark Components

The CMU benchmark framework consists of the following components:

```typescript
interface CMUBenchmarkFramework {
  // Core benchmark engine
  engine: BenchmarkEngine;
  
  // Demo agents for testing
  demoAgents: DemoAgent[];
  
  // Evaluation metrics
  metrics: BenchmarkMetric[];
  
  // Test scenarios
  scenarios: TestScenario[];
  
  // Results storage and analysis
  resultsManager: ResultsManager;
}

interface BenchmarkEngine {
  // Initialize the benchmark engine
  initialize(config: BenchmarkConfig): Promise<boolean>;
  
  // Run a benchmark test
  runTest(testConfig: TestConfig): Promise<TestResult>;
  
  // Compare multiple agents
  compareAgents(agentIds: string[], scenarioId: string): Promise<ComparisonResult>;
  
  // Generate a benchmark report
  generateReport(testId: string): Promise<BenchmarkReport>;
}

interface DemoAgent {
  // Agent ID
  id: string;
  
  // Agent name
  name: string;
  
  // Agent description
  description: string;
  
  // Agent capabilities
  capabilities: string[];
  
  // Agent provider
  provider: string;
  
  // Agent configuration
  config: Record<string, any>;
  
  // Agent implementation
  implementation: AgentImplementation;
}

interface BenchmarkMetric {
  // Metric ID
  id: string;
  
  // Metric name
  name: string;
  
  // Metric description
  description: string;
  
  // Metric calculation function
  calculate: (testResult: TestResult) => number;
  
  // Metric interpretation
  interpretation: {
    direction: 'higher_is_better' | 'lower_is_better';
    thresholds: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
  };
}

interface TestScenario {
  // Scenario ID
  id: string;
  
  // Scenario name
  name: string;
  
  // Scenario description
  description: string;
  
  // Scenario inputs
  inputs: ScenarioInput[];
  
  // Expected outputs or evaluation criteria
  evaluationCriteria: EvaluationCriterion[];
}

interface ResultsManager {
  // Save test results
  saveResults(testResult: TestResult): Promise<string>;
  
  // Get test results
  getResults(testId: string): Promise<TestResult>;
  
  // List all test results
  listResults(filters?: ResultFilters): Promise<TestResultSummary[]>;
  
  // Export results
  exportResults(testIds: string[], format: 'json' | 'csv' | 'pdf'): Promise<string>;
}
```

### 2.2 Demo Agents

The integration will include the following demo agents from the CMU benchmark:

1. **Baseline Agent**: A simple rule-based agent for baseline comparison
2. **Factual Agent**: Specialized in factual accuracy and information retrieval
3. **Creative Agent**: Focused on creative and diverse responses
4. **Governance-Focused Agent**: Emphasizes compliance with governance rules
5. **Multi-Tool Agent**: Demonstrates tool use across various domains

Each demo agent will be wrapped using the Promethios agent wrapping system and made available through the multi-agent chat interface.

### 2.3 Benchmark Metrics

The integration will support the following benchmark metrics:

1. **Response Quality**: Measures the overall quality of agent responses
2. **Factual Accuracy**: Evaluates the factual correctness of information
3. **Task Completion**: Assesses the agent's ability to complete assigned tasks
4. **Governance Compliance**: Measures adherence to governance rules
5. **Efficiency**: Evaluates response time and resource usage
6. **Robustness**: Tests performance under various input conditions
7. **Tool Use Effectiveness**: Measures appropriate and effective tool usage

## 3. Integration Components

### 3.1 CMUBenchmarkService

The `CMUBenchmarkService` will manage the integration with the CMU benchmark framework:

```typescript
class CMUBenchmarkService {
  // Initialize the benchmark service
  initialize(config: CMUBenchmarkConfig): Promise<boolean>;
  
  // Get available demo agents
  getDemoAgents(): Promise<DemoAgent[]>;
  
  // Get available test scenarios
  getTestScenarios(): Promise<TestScenario[]>;
  
  // Run a benchmark test
  runBenchmarkTest(testConfig: BenchmarkTestConfig): Promise<string>;
  
  // Get test results
  getTestResults(testId: string): Promise<BenchmarkTestResult>;
  
  // Compare agents
  compareAgents(agentIds: string[], scenarioId: string): Promise<AgentComparisonResult>;
  
  // Generate a benchmark report
  generateBenchmarkReport(testId: string): Promise<BenchmarkReport>;
  
  // Register a custom metric
  registerMetric(metric: BenchmarkMetric): Promise<boolean>;
  
  // Register a custom test scenario
  registerTestScenario(scenario: TestScenario): Promise<boolean>;
}

interface CMUBenchmarkConfig {
  // API endpoint for CMU benchmark service
  apiEndpoint: string;
  
  // API key for authentication
  apiKey: string;
  
  // Default test configuration
  defaultTestConfig?: Partial<BenchmarkTestConfig>;
  
  // Result storage configuration
  resultStorage?: {
    location: string;
    format: 'json' | 'csv' | 'sqlite';
  };
}

interface BenchmarkTestConfig {
  // Agents to test
  agentIds: string[];
  
  // Test scenario
  scenarioId: string;
  
  // Metrics to evaluate
  metricIds: string[];
  
  // Test parameters
  parameters?: Record<string, any>;
  
  // Number of test iterations
  iterations?: number;
}

interface BenchmarkTestResult {
  // Test ID
  id: string;
  
  // Test configuration
  config: BenchmarkTestConfig;
  
  // Test start time
  startTime: number;
  
  // Test end time
  endTime: number;
  
  // Agent results
  agentResults: {
    [agentId: string]: {
      // Overall score
      overallScore: number;
      
      // Metric scores
      metricScores: {
        [metricId: string]: number;
      };
      
      // Response data
      responses: AgentResponse[];
    };
  };
  
  // Test status
  status: 'completed' | 'failed' | 'in_progress';
  
  // Error message, if any
  error?: string;
}

interface AgentComparisonResult {
  // Comparison ID
  id: string;
  
  // Agents compared
  agentIds: string[];
  
  // Scenario used
  scenarioId: string;
  
  // Comparison results
  results: {
    [agentId: string]: {
      // Overall rank
      rank: number;
      
      // Overall score
      score: number;
      
      // Metric scores
      metricScores: {
        [metricId: string]: {
          score: number;
          rank: number;
        };
      };
    };
  };
  
  // Strengths and weaknesses analysis
  analysis: {
    [agentId: string]: {
      strengths: string[];
      weaknesses: string[];
    };
  };
}

interface BenchmarkReport {
  // Report ID
  id: string;
  
  // Report title
  title: string;
  
  // Report generation time
  generationTime: number;
  
  // Test results
  testResults: BenchmarkTestResult;
  
  // Summary statistics
  summary: {
    topPerformer: string;
    averageScore: number;
    scoreDistribution: Record<string, number>;
  };
  
  // Detailed analysis
  analysis: {
    [agentId: string]: {
      strengths: string[];
      weaknesses: string[];
      improvementSuggestions: string[];
    };
  };
  
  // Visualizations
  visualizations: {
    [vizId: string]: {
      type: 'bar' | 'line' | 'radar' | 'table';
      data: any;
      config: any;
    };
  };
}
```

### 3.2 DemoAgentWrapper

The `DemoAgentWrapper` will wrap CMU demo agents to make them compatible with the Promethios agent wrapping system:

```typescript
class DemoAgentWrapper implements AgentWrapper {
  // Wrapper ID
  id: string;
  
  // Wrapper name
  name: string;
  
  // Wrapper description
  description: string;
  
  // Wrapper version
  version: string;
  
  // Supported providers
  supportedProviders: string[];
  
  // Input schema
  inputSchema: Schema;
  
  // Output schema
  outputSchema: Schema;
  
  // Demo agent being wrapped
  demoAgent: DemoAgent;
  
  // Wrap an API call
  async wrap(request: any, context: WrapperContext): Promise<any> {
    // Implementation details
    return transformedRequest;
  }
  
  // Unwrap an API response
  async unwrap(response: any, context: WrapperContext): Promise<any> {
    // Implementation details
    return transformedResponse;
  }
  
  // Initialize the wrapper
  async initialize(): Promise<boolean> {
    // Implementation details
    return true;
  }
  
  // Clean up the wrapper
  async cleanup(): Promise<boolean> {
    // Implementation details
    return true;
  }
}
```

### 3.3 BenchmarkTestRunner

The `BenchmarkTestRunner` will manage the execution of benchmark tests:

```typescript
class BenchmarkTestRunner {
  // Initialize the test runner
  initialize(config: TestRunnerConfig): Promise<boolean>;
  
  // Run a test
  runTest(testConfig: BenchmarkTestConfig): Promise<string>;
  
  // Get test status
  getTestStatus(testId: string): Promise<TestStatus>;
  
  // Cancel a running test
  cancelTest(testId: string): Promise<boolean>;
  
  // Get test results
  getTestResults(testId: string): Promise<BenchmarkTestResult>;
  
  // Register a test listener
  registerTestListener(listener: TestListener): string;
  
  // Deregister a test listener
  deregisterTestListener(listenerId: string): boolean;
}

interface TestRunnerConfig {
  // Maximum concurrent tests
  maxConcurrentTests: number;
  
  // Test timeout (ms)
  testTimeout: number;
  
  // Result storage configuration
  resultStorage: {
    location: string;
    format: 'json' | 'csv' | 'sqlite';
  };
}

interface TestStatus {
  // Test ID
  id: string;
  
  // Test status
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  
  // Progress (0-100)
  progress: number;
  
  // Current operation
  currentOperation?: string;
  
  // Start time
  startTime?: number;
  
  // End time
  endTime?: number;
  
  // Error message, if any
  error?: string;
}

interface TestListener {
  // Called when test status changes
  onStatusChange?: (testId: string, status: TestStatus) => void;
  
  // Called when test completes
  onTestComplete?: (testId: string, result: BenchmarkTestResult) => void;
  
  // Called when test fails
  onTestFail?: (testId: string, error: string) => void;
}
```

## 4. UI Components

### 4.1 BenchmarkDashboard

The main dashboard for the CMU benchmark integration:

```typescript
interface BenchmarkDashboardProps {
  // Initial test configuration
  initialTestConfig?: Partial<BenchmarkTestConfig>;
}

class BenchmarkDashboard extends React.Component<BenchmarkDashboardProps, BenchmarkDashboardState> {
  componentDidMount() {
    // Register with extension system
    ExtensionRegistry.registerUIComponent({
      id: 'benchmark-dashboard',
      component: this,
      extensionPoints: ['benchmark-view']
    });
    
    // Initialize benchmark service
    this.initializeBenchmarkService();
  }
  
  componentWillUnmount() {
    // Unregister from extension system
    ExtensionRegistry.unregisterUIComponent('benchmark-dashboard');
  }
  
  initializeBenchmarkService = async () => {
    try {
      const benchmarkService = new CMUBenchmarkService();
      await benchmarkService.initialize({
        apiEndpoint: '/api/cmu-benchmark',
        apiKey: 'your-api-key'
      });
      
      const demoAgents = await benchmarkService.getDemoAgents();
      const testScenarios = await benchmarkService.getTestScenarios();
      
      this.setState({
        benchmarkService,
        demoAgents,
        testScenarios,
        loading: false
      });
    } catch (error) {
      this.setState({
        error: error.message,
        loading: false
      });
    }
  };
  
  handleRunTest = async () => {
    const { benchmarkService, testConfig } = this.state;
    
    if (!benchmarkService || !testConfig) {
      return;
    }
    
    this.setState({ running: true });
    
    try {
      const testId = await benchmarkService.runBenchmarkTest(testConfig);
      
      this.setState({
        currentTestId: testId,
        running: false
      });
      
      // Poll for test status
      this.pollTestStatus(testId);
    } catch (error) {
      this.setState({
        error: error.message,
        running: false
      });
    }
  };
  
  pollTestStatus = async (testId: string) => {
    const { benchmarkService } = this.state;
    
    if (!benchmarkService) {
      return;
    }
    
    const testRunner = new BenchmarkTestRunner();
    await testRunner.initialize({
      maxConcurrentTests: 1,
      testTimeout: 300000,
      resultStorage: {
        location: '/tmp/benchmark-results',
        format: 'json'
      }
    });
    
    const listenerId = testRunner.registerTestListener({
      onStatusChange: this.handleTestStatusChange,
      onTestComplete: this.handleTestComplete,
      onTestFail: this.handleTestFail
    });
    
    this.setState({
      testRunner,
      testListenerId: listenerId
    });
  };
  
  handleTestStatusChange = (testId: string, status: TestStatus) => {
    this.setState({ testStatus: status });
  };
  
  handleTestComplete = async (testId: string, result: BenchmarkTestResult) => {
    const { benchmarkService } = this.state;
    
    if (!benchmarkService) {
      return;
    }
    
    try {
      const report = await benchmarkService.generateBenchmarkReport(testId);
      
      this.setState({
        testResult: result,
        benchmarkReport: report
      });
    } catch (error) {
      this.setState({
        error: error.message
      });
    }
  };
  
  handleTestFail = (testId: string, error: string) => {
    this.setState({
      error,
      testStatus: {
        ...this.state.testStatus,
        status: 'failed',
        error
      }
    });
  };
  
  handleConfigChange = (config: Partial<BenchmarkTestConfig>) => {
    this.setState(prevState => ({
      testConfig: {
        ...prevState.testConfig,
        ...config
      }
    }));
  };
  
  render() {
    const {
      demoAgents,
      testScenarios,
      testConfig,
      running,
      testStatus,
      testResult,
      benchmarkReport,
      error,
      loading
    } = this.state;
    
    if (loading) {
      return <LoadingIndicator />;
    }
    
    if (error) {
      return <ErrorDisplay message={error} onRetry={this.initializeBenchmarkService} />;
    }
    
    return (
      <div className="benchmark-dashboard">
        <div className="dashboard-header">
          <h1>CMU Benchmark</h1>
          <p>Test and compare agent performance using standardized benchmarks</p>
        </div>
        
        <div className="dashboard-content">
          <div className="test-configuration">
            <h2>Test Configuration</h2>
            <BenchmarkTestConfigForm
              demoAgents={demoAgents || []}
              testScenarios={testScenarios || []}
              config={testConfig}
              onChange={this.handleConfigChange}
              onRunTest={this.handleRunTest}
              disabled={running || !!testStatus && testStatus.status === 'running'}
            />
          </div>
          
          {testStatus && (
            <div className="test-status">
              <h2>Test Status</h2>
              <TestStatusDisplay status={testStatus} />
            </div>
          )}
          
          {testResult && (
            <div className="test-results">
              <h2>Test Results</h2>
              <TestResultsDisplay result={testResult} />
            </div>
          )}
          
          {benchmarkReport && (
            <div className="benchmark-report">
              <h2>Benchmark Report</h2>
              <BenchmarkReportDisplay report={benchmarkReport} />
            </div>
          )}
        </div>
      </div>
    );
  }
}
```

### 4.2 BenchmarkTestConfigForm

A form for configuring benchmark tests:

```typescript
interface BenchmarkTestConfigFormProps {
  // Available demo agents
  demoAgents: DemoAgent[];
  
  // Available test scenarios
  testScenarios: TestScenario[];
  
  // Current configuration
  config?: Partial<BenchmarkTestConfig>;
  
  // Change handler
  onChange: (config: Partial<BenchmarkTestConfig>) => void;
  
  // Run test handler
  onRunTest: () => void;
  
  // Whether the form is disabled
  disabled?: boolean;
}

class BenchmarkTestConfigForm extends React.Component<BenchmarkTestConfigFormProps> {
  handleAgentSelectionChange = (agentIds: string[]) => {
    const { onChange } = this.props;
    onChange({ agentIds });
  };
  
  handleScenarioChange = (scenarioId: string) => {
    const { onChange } = this.props;
    onChange({ scenarioId });
  };
  
  handleMetricsChange = (metricIds: string[]) => {
    const { onChange } = this.props;
    onChange({ metricIds });
  };
  
  handleIterationsChange = (iterations: number) => {
    const { onChange } = this.props;
    onChange({ iterations });
  };
  
  handleParameterChange = (key: string, value: any) => {
    const { onChange, config } = this.props;
    onChange({
      parameters: {
        ...(config?.parameters || {}),
        [key]: value
      }
    });
  };
  
  render() {
    const { demoAgents, testScenarios, config, onRunTest, disabled } = this.props;
    
    const selectedScenario = config?.scenarioId
      ? testScenarios.find(s => s.id === config.scenarioId)
      : undefined;
    
    return (
      <div className="benchmark-test-config-form">
        <div className="form-section">
          <h3>Select Agents</h3>
          <div className="agent-selection">
            {demoAgents.map(agent => (
              <label key={agent.id} className="agent-checkbox">
                <input
                  type="checkbox"
                  checked={config?.agentIds?.includes(agent.id) || false}
                  onChange={e => {
                    const agentIds = config?.agentIds || [];
                    if (e.target.checked) {
                      this.handleAgentSelectionChange([...agentIds, agent.id]);
                    } else {
                      this.handleAgentSelectionChange(agentIds.filter(id => id !== agent.id));
                    }
                  }}
                  disabled={disabled}
                />
                <span className="agent-name">{agent.name}</span>
                <span className="agent-description">{agent.description}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="form-section">
          <h3>Select Test Scenario</h3>
          <div className="scenario-selection">
            <select
              value={config?.scenarioId || ''}
              onChange={e => this.handleScenarioChange(e.target.value)}
              disabled={disabled}
            >
              <option value="">Select a scenario</option>
              {testScenarios.map(scenario => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
            
            {selectedScenario && (
              <div className="scenario-description">
                {selectedScenario.description}
              </div>
            )}
          </div>
        </div>
        
        <div className="form-section">
          <h3>Test Parameters</h3>
          <div className="test-parameters">
            <div className="parameter">
              <label>Iterations</label>
              <input
                type="number"
                min="1"
                max="100"
                value={config?.iterations || 1}
                onChange={e => this.handleIterationsChange(parseInt(e.target.value, 10))}
                disabled={disabled}
              />
            </div>
            
            {selectedScenario?.parameters?.map(param => (
              <div key={param.id} className="parameter">
                <label>{param.name}</label>
                <input
                  type={param.type === 'number' ? 'number' : 'text'}
                  value={config?.parameters?.[param.id] || param.defaultValue}
                  onChange={e => this.handleParameterChange(param.id, e.target.value)}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-actions">
          <button
            className="run-test-button"
            onClick={onRunTest}
            disabled={
              disabled ||
              !config?.agentIds?.length ||
              !config?.scenarioId
            }
          >
            Run Benchmark Test
          </button>
        </div>
      </div>
    );
  }
}
```

### 4.3 TestResultsDisplay

A component to display test results:

```typescript
interface TestResultsDisplayProps {
  // Test result to display
  result: BenchmarkTestResult;
}

class TestResultsDisplay extends React.Component<TestResultsDisplayProps> {
  render() {
    const { result } = this.props;
    
    return (
      <div className="test-results-display">
        <div className="results-summary">
          <div className="summary-item">
            <span className="label">Test ID:</span>
            <span className="value">{result.id}</span>
          </div>
          <div className="summary-item">
            <span className="label">Duration:</span>
            <span className="value">
              {((result.endTime - result.startTime) / 1000).toFixed(2)}s
            </span>
          </div>
          <div className="summary-item">
            <span className="label">Status:</span>
            <span className={`value status-${result.status}`}>
              {result.status}
            </span>
          </div>
        </div>
        
        <div className="agent-results">
          <h3>Agent Results</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Overall Score</th>
                {Object.keys(Object.values(result.agentResults)[0]?.metricScores || {}).map(metricId => (
                  <th key={metricId}>{metricId}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.agentResults).map(([agentId, agentResult]) => (
                <tr key={agentId}>
                  <td>{agentId}</td>
                  <td>{agentResult.overallScore.toFixed(2)}</td>
                  {Object.entries(agentResult.metricScores).map(([metricId, score]) => (
                    <td key={metricId}>{score.toFixed(2)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="response-details">
          <h3>Response Details</h3>
          <div className="response-tabs">
            {Object.entries(result.agentResults).map(([agentId, agentResult]) => (
              <div key={agentId} className="agent-responses">
                <h4>{agentId} Responses</h4>
                {agentResult.responses.map((response, index) => (
                  <div key={index} className="response-item">
                    <div className="response-prompt">
                      <strong>Prompt:</strong>
                      <div className="prompt-text">{response.prompt}</div>
                    </div>
                    <div className="response-content">
                      <strong>Response:</strong>
                      <div className="response-text">{response.content}</div>
                    </div>
                    <div className="response-metrics">
                      {Object.entries(response.metrics || {}).map(([metricId, value]) => (
                        <div key={metricId} className="response-metric">
                          <span className="metric-name">{metricId}:</span>
                          <span className="metric-value">{value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
```

### 4.4 BenchmarkReportDisplay

A component to display benchmark reports:

```typescript
interface BenchmarkReportDisplayProps {
  // Benchmark report to display
  report: BenchmarkReport;
}

class BenchmarkReportDisplay extends React.Component<BenchmarkReportDisplayProps> {
  render() {
    const { report } = this.props;
    
    return (
      <div className="benchmark-report-display">
        <div className="report-header">
          <h3>{report.title}</h3>
          <div className="report-meta">
            <span className="report-id">ID: {report.id}</span>
            <span className="report-date">
              Generated: {new Date(report.generationTime).toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="report-summary">
          <h4>Summary</h4>
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="label">Top Performer:</span>
              <span className="value">{report.summary.topPerformer}</span>
            </div>
            <div className="summary-stat">
              <span className="label">Average Score:</span>
              <span className="value">{report.summary.averageScore.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="report-visualizations">
          <h4>Visualizations</h4>
          <div className="visualization-grid">
            {Object.entries(report.visualizations).map(([vizId, viz]) => (
              <div key={vizId} className={`visualization ${viz.type}`}>
                <BenchmarkVisualization
                  type={viz.type}
                  data={viz.data}
                  config={viz.config}
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="report-analysis">
          <h4>Analysis</h4>
          {Object.entries(report.analysis).map(([agentId, analysis]) => (
            <div key={agentId} className="agent-analysis">
              <h5>{agentId}</h5>
              <div className="analysis-section">
                <h6>Strengths</h6>
                <ul>
                  {analysis.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
              <div className="analysis-section">
                <h6>Weaknesses</h6>
                <ul>
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index}>{weakness}</li>
                  ))}
                </ul>
              </div>
              <div className="analysis-section">
                <h6>Improvement Suggestions</h6>
                <ul>
                  {analysis.improvementSuggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        
        <div className="report-actions">
          <button className="export-button">Export Report</button>
          <button className="share-button">Share Report</button>
        </div>
      </div>
    );
  }
}
```

## 5. Chat Interface Integration

### 5.1 Demo Agent Integration in Chat

The CMU benchmark demo agents will be integrated into the chat interface:

```typescript
// Register demo agents with the agent selection component
function registerDemoAgentsWithChat() {
  const benchmarkService = new CMUBenchmarkService();
  benchmarkService.initialize({
    apiEndpoint: '/api/cmu-benchmark',
    apiKey: 'your-api-key'
  }).then(() => {
    benchmarkService.getDemoAgents().then(demoAgents => {
      // Register each demo agent with the agent provider registry
      demoAgents.forEach(demoAgent => {
        const wrapper = new DemoAgentWrapper({
          id: `demo-${demoAgent.id}`,
          name: demoAgent.name,
          description: demoAgent.description,
          version: '1.0.0',
          supportedProviders: ['cmu-benchmark'],
          inputSchema: {
            // Input schema definition
          },
          outputSchema: {
            // Output schema definition
          },
          demoAgent
        });
        
        // Register the wrapper with the agent wrapping system
        AgentWrapperRegistry.registerWrapper(wrapper);
        
        // Register the agent with the agent provider registry
        AgentProviderRegistry.registerAgent({
          id: `demo-${demoAgent.id}`,
          name: demoAgent.name,
          description: demoAgent.description,
          capabilities: demoAgent.capabilities,
          provider: 'cmu-benchmark',
          wrapperId: `demo-${demoAgent.id}`
        });
      });
    });
  });
}
```

### 5.2 Document Upload for Agent Testing

The chat interface will be enhanced to support document upload for testing agents:

```typescript
interface DocumentUploadProps {
  // Callback for document upload
  onDocumentUpload: (document: UploadedDocument) => void;
  
  // Supported file types
  supportedTypes?: string[];
  
  // Maximum file size (bytes)
  maxSize?: number;
}

class DocumentUpload extends React.Component<DocumentUploadProps> {
  fileInputRef = React.createRef<HTMLInputElement>();
  
  handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { onDocumentUpload, maxSize = 10 * 1024 * 1024 } = this.props;
    
    const files = e.target.files;
    
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    if (maxSize && file.size > maxSize) {
      alert(`File size exceeds maximum allowed size (${maxSize / 1024 / 1024}MB)`);
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = () => {
      const content = reader.result as string;
      
      onDocumentUpload({
        name: file.name,
        type: file.type,
        size: file.size,
        content,
        uploadTime: Date.now()
      });
    };
    
    reader.readAsText(file);
  };
  
  handleButtonClick = () => {
    if (this.fileInputRef.current) {
      this.fileInputRef.current.click();
    }
  };
  
  render() {
    const { supportedTypes = ['.txt', '.md', '.json', '.csv', '.html', '.pdf'] } = this.props;
    
    return (
      <div className="document-upload">
        <input
          type="file"
          ref={this.fileInputRef}
          style={{ display: 'none' }}
          onChange={this.handleFileSelect}
          accept={supportedTypes.join(',')}
        />
        <button
          className="upload-button"
          onClick={this.handleButtonClick}
        >
          Upload Document
        </button>
      </div>
    );
  }
}

interface UploadedDocument {
  // Document name
  name: string;
  
  // Document type
  type: string;
  
  // Document size (bytes)
  size: number;
  
  // Document content
  content: string;
  
  // Upload timestamp
  uploadTime: number;
}
```

### 5.3 Website Link Input for Agent Testing

The chat interface will also support website link input for testing agents:

```typescript
interface WebsiteLinkInputProps {
  // Callback for link submission
  onLinkSubmit: (link: string) => void;
}

class WebsiteLinkInput extends React.Component<WebsiteLinkInputProps, { link: string }> {
  state = {
    link: ''
  };
  
  handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ link: e.target.value });
  };
  
  handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { link } = this.state;
    const { onLinkSubmit } = this.props;
    
    if (!link) {
      return;
    }
    
    // Validate URL
    try {
      const url = new URL(link);
      onLinkSubmit(url.toString());
      this.setState({ link: '' });
    } catch (error) {
      alert('Please enter a valid URL');
    }
  };
  
  render() {
    const { link } = this.state;
    
    return (
      <form className="website-link-input" onSubmit={this.handleSubmit}>
        <input
          type="text"
          value={link}
          onChange={this.handleLinkChange}
          placeholder="Enter website URL"
        />
        <button type="submit" disabled={!link}>
          Submit
        </button>
      </form>
    );
  }
}
```

## 6. Extension Points

### 6.1 Benchmark Extension Points

```typescript
// Register a benchmark metric
ExtensionRegistry.registerExtensionPoint('benchmark:metric', {
  register: (metric: BenchmarkMetric) => BenchmarkMetricRegistry.registerMetric(metric),
  deregister: (metricId: string) => BenchmarkMetricRegistry.deregisterMetric(metricId)
});

// Register a test scenario
ExtensionRegistry.registerExtensionPoint('benchmark:scenario', {
  register: (scenario: TestScenario) => TestScenarioRegistry.registerScenario(scenario),
  deregister: (scenarioId: string) => TestScenarioRegistry.deregisterScenario(scenarioId)
});

// Register a benchmark visualization
ExtensionRegistry.registerExtensionPoint('benchmark:visualization', {
  register: (visualization: BenchmarkVisualization) => BenchmarkVisualizationRegistry.registerVisualization(visualization),
  deregister: (visualizationId: string) => BenchmarkVisualizationRegistry.deregisterVisualization(visualizationId)
});
```

### 6.2 Demo Agent Extension Points

```typescript
// Register a demo agent
ExtensionRegistry.registerExtensionPoint('benchmark:demoAgent', {
  register: (agent: DemoAgent) => DemoAgentRegistry.registerAgent(agent),
  deregister: (agentId: string) => DemoAgentRegistry.deregisterAgent(agentId)
});
```

## 7. Integration with Other Systems

### 7.1 Agent Wrapping Integration

The CMU benchmark demo agents will be wrapped using the Promethios agent wrapping system:

```typescript
// Register demo agents with the agent wrapping system
function registerDemoAgentsWithWrapping() {
  const benchmarkService = new CMUBenchmarkService();
  benchmarkService.initialize({
    apiEndpoint: '/api/cmu-benchmark',
    apiKey: 'your-api-key'
  }).then(() => {
    benchmarkService.getDemoAgents().then(demoAgents => {
      demoAgents.forEach(demoAgent => {
        const wrapper = new DemoAgentWrapper({
          id: `demo-${demoAgent.id}`,
          name: demoAgent.name,
          description: demoAgent.description,
          version: '1.0.0',
          supportedProviders: ['cmu-benchmark'],
          inputSchema: {
            // Input schema definition
          },
          outputSchema: {
            // Output schema definition
          },
          demoAgent
        });
        
        // Register the wrapper with the agent wrapping system
        AgentWrapperRegistry.registerWrapper(wrapper);
      });
    });
  });
}
```

### 7.2 Agent Scorecard Integration

The benchmark results will be integrated with the agent scorecard system:

```typescript
// Register benchmark metrics with the scorecard system
function registerBenchmarkMetricsWithScorecard() {
  const benchmarkService = new CMUBenchmarkService();
  benchmarkService.initialize({
    apiEndpoint: '/api/cmu-benchmark',
    apiKey: 'your-api-key'
  }).then(() => {
    // Get benchmark metrics
    const metrics = [
      {
        id: 'response-quality',
        name: 'Response Quality',
        description: 'Measures the overall quality of agent responses',
        category: 'Performance',
        valueType: 'percentage',
        calculate: async (agentId, context) => {
          // Implementation details
          return 0.85;
        },
        interpretationRule: {
          direction: 'higher_is_better',
          thresholds: {
            warning: 0.6,
            critical: 0.4
          }
        },
        visualizationHint: 'gauge',
        weight: 0.3
      },
      // Other metrics...
    ];
    
    // Register each metric with the scorecard system
    metrics.forEach(metric => {
      ScorecardMetricRegistry.registerMetric(metric);
    });
  });
}
```

### 7.3 Chat Interface Integration

The benchmark results will be available in the chat interface:

```typescript
// Add benchmark results to chat context
function addBenchmarkResultsToChatContext(chatContext: ChatContext, agentId: string) {
  const benchmarkService = new CMUBenchmarkService();
  benchmarkService.initialize({
    apiEndpoint: '/api/cmu-benchmark',
    apiKey: 'your-api-key'
  }).then(() => {
    // Get latest benchmark results for the agent
    benchmarkService.getLatestResultsForAgent(agentId).then(results => {
      // Add results to chat context
      chatContext.agentContext = {
        ...chatContext.agentContext,
        benchmarkResults: results
      };
    });
  });
}
```

## 8. State Management

### 8.1 Benchmark State

```typescript
interface BenchmarkState {
  // Available demo agents
  demoAgents: DemoAgent[];
  
  // Available test scenarios
  testScenarios: TestScenario[];
  
  // Available metrics
  metrics: BenchmarkMetric[];
  
  // Test results
  testResults: {
    [testId: string]: BenchmarkTestResult;
  };
  
  // Benchmark reports
  benchmarkReports: {
    [reportId: string]: BenchmarkReport;
  };
  
  // Current test status
  currentTestStatus?: TestStatus;
}
```

### 8.2 Persistence

- Benchmark results will be persisted to allow historical comparison
- Agent performance metrics will be stored for trending analysis
- Test configurations can be saved as templates for reuse

## 9. API Integration

### 9.1 Benchmark API

```typescript
// Get available demo agents
GET /api/cmu-benchmark/agents

// Get available test scenarios
GET /api/cmu-benchmark/scenarios

// Get available metrics
GET /api/cmu-benchmark/metrics

// Run a benchmark test
POST /api/cmu-benchmark/tests
{
  "agentIds": ["baseline-agent", "factual-agent"],
  "scenarioId": "information-retrieval",
  "metricIds": ["response-quality", "factual-accuracy"],
  "iterations": 5
}

// Get test status
GET /api/cmu-benchmark/tests/:testId/status

// Get test results
GET /api/cmu-benchmark/tests/:testId/results

// Generate a benchmark report
POST /api/cmu-benchmark/reports
{
  "testId": "test-123"
}

// Get a benchmark report
GET /api/cmu-benchmark/reports/:reportId
```

### 9.2 Demo Agent API

```typescript
// Get demo agent details
GET /api/cmu-benchmark/agents/:agentId

// Send message to demo agent
POST /api/cmu-benchmark/agents/:agentId/messages
{
  "content": "Hello, how can you help me?",
  "context": {
    "conversation": [
      {
        "role": "user",
        "content": "Hello, how can you help me?"
      }
    ]
  }
}

// Upload document to demo agent
POST /api/cmu-benchmark/agents/:agentId/documents
{
  "name": "document.txt",
  "content": "Document content...",
  "type": "text/plain"
}

// Send website link to demo agent
POST /api/cmu-benchmark/agents/:agentId/links
{
  "url": "https://example.com"
}
```

## 10. UI Design for Chat Interface

### 10.1 Full-Width Chat Layout

The chat interface will use a full-width layout with no border:

```css
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: #f9f9f9;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.chat-input-container {
  padding: 20px;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
}
```

### 10.2 Chat Input at Bottom

The chat input will be positioned at the bottom of the screen:

```css
.chat-input {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.chat-input textarea {
  flex: 1;
  border: none;
  resize: none;
  padding: 8px;
  font-size: 16px;
  min-height: 24px;
  max-height: 150px;
  outline: none;
}

.chat-input-actions {
  display: flex;
  align-items: center;
}
```

### 10.3 Document Upload and Link Input

The chat input will include document upload and link input functionality:

```css
.chat-input-actions .upload-button,
.chat-input-actions .link-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #666;
  transition: color 0.2s;
}

.chat-input-actions .upload-button:hover,
.chat-input-actions .link-button:hover {
  color: #0066cc;
}

.document-upload-modal,
.link-input-modal {
  position: absolute;
  bottom: 80px;
  right: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  width: 300px;
}
```

### 10.4 Right Sidebar for Metrics

The right sidebar will display metrics and agent information:

```css
.chat-container {
  display: flex;
  height: 100vh;
}

.chat-main {
  flex: 3;
  display: flex;
  flex-direction: column;
}

.chat-sidebar {
  flex: 1;
  border-left: 1px solid #e0e0e0;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f5f5;
}

.agent-metrics {
  margin-bottom: 24px;
}

.agent-metrics h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

.metric-item {
  margin-bottom: 12px;
}

.metric-name {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 20px;
  font-weight: 500;
}
```

## 11. Implementation Plan

### 11.1 Phase 1: Core Benchmark Integration

1. Implement `CMUBenchmarkService` for interacting with the CMU benchmark API
2. Implement `DemoAgentWrapper` for wrapping CMU demo agents
3. Implement `BenchmarkTestRunner` for running benchmark tests

### 11.2 Phase 2: Demo Agent Integration

1. Register demo agents with the agent wrapping system
2. Integrate demo agents with the multi-agent chat interface
3. Implement document upload and website link input for agent testing

### 11.3 Phase 3: Benchmark UI

1. Implement `BenchmarkDashboard` for running and viewing benchmark tests
2. Implement `BenchmarkTestConfigForm` for configuring tests
3. Implement `TestResultsDisplay` and `BenchmarkReportDisplay` for viewing results

### 11.4 Phase 4: Chat UI Enhancements

1. Update chat interface to use full-width layout with no border
2. Position chat input at the bottom of the screen
3. Add document upload and website link input functionality
4. Implement right sidebar for metrics and agent information

### 11.5 Phase 5: Integration and Testing

1. Integrate benchmark results with agent scorecard system
2. Test all components and integrations
3. Optimize performance and user experience

## 12. Next Steps

1. Begin implementation of `CMUBenchmarkService` and `DemoAgentWrapper`
2. Register demo agents with the agent wrapping system
3. Update chat interface layout according to new requirements
4. Implement document upload and website link input functionality
