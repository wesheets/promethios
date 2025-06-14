# CMU Benchmark Demo Agents and APIs Integration Design

## 1. Introduction
This document outlines the design for integrating CMU Benchmark demo agents and APIs into the Promethios platform. The goal is to create a robust, extensible framework for evaluating LLM agent performance under various governance conditions.

## 2. Goals
- Provide a clear, measurable way to demonstrate the impact of Promethios governance on LLM agent behavior.
- Enable comparative analysis of agent performance with and without governance.
- Support a variety of demo agents and test scenarios.
- Generate comprehensive, downloadable reports.
- Integrate seamlessly with the existing Promethios UI and backend services.

## 3. Architecture Overview
The CMU Benchmark integration will consist of the following main components:
- **CMU Benchmark Service (Backend)**: A Python-based service responsible for managing demo agents, executing tests, applying governance, and generating reports.
- **Demo Agent Wrappers**: Modules that simulate or interface with different types of LLM agents (e.g., Baseline, Factual, Creative, Governance-Focused, Multi-Tool).
- **Promethios Governance API Integration**: Direct calls to existing Promethios governance endpoints for policy evaluation, compliance monitoring, reflection, and override management.
- **Flask API**: A lightweight Flask application to expose the CMU Benchmark Service functionalities to the frontend.
- **Frontend UI Integration**: React components within the Promethios UI to interact with the Flask API, display test results, and trigger reports.

```mermaid
graph TD
    A[Promethios UI] --> B[Flask API (CMU Benchmark)];
    B --> C[CMU Benchmark Service];
    C --> D[Demo Agent Wrappers];
    C --> E[Promethios Governance API];
    E --> F[Promethios Governance Engine];
    C --> G[Report Generation Module];
    G --> H[Downloadable Reports (PDF, CSV, JSON)];
```

## 4. Backend Design (CMU Benchmark Service)

### 4.1. Core Functionalities
- **Agent Management**: Load and manage configurations for various demo agents.
- **Scenario Management**: Define and load different test scenarios with specific prompts and expected behaviors.
- **Test Execution**: Orchestrate the interaction between agents and scenarios, with options to enable/disable governance.
- **Governance Application**: Integrate with Promethios Governance API to apply policies, detect violations, and modify responses.
- **Metrics Collection**: Collect key performance indicators (KPIs) such as response time, compliance scores, violation counts, and correction rates.
- **Report Generation**: Aggregate test results and generate comprehensive reports in various formats.

### 4.2. Data Models

#### Agent Configuration
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "capabilities": ["string"], // e.g., "basic-reasoning", "information-retrieval"
  "provider": "string", // e.g., "openai", "anthropic", "cohere", "huggingface"
  "model": "string", // e.g., "gpt-3.5-turbo", "claude-3-sonnet-20240229"
  "icon": "string", // Emoji or path to icon
  "governance_enabled": "boolean" // Default governance setting for this agent
}
```

#### Test Scenario
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "prompt": "string",
  "expected_capabilities": ["string"],
  "governance_requirements": ["string"] // e.g., "professional-tone", "no-medical-diagnosis"
}
```

#### Test Result (Individual Interaction)
```json
{
  "agent_id": "string",
  "scenario_id": "string",
  "message": "string",
  "response": "string",
  "governance_enabled": "boolean",
  "governance_result": { // Details from Promethios Governance API
    "original_response": "string",
    "modified_response": "string",
    "policy_evaluation": {
      "violations": [{"type": "string", "description": "string"}],
      "modifications": [{"type": "string", "description": "string"}],
      "compliance_score": "number"
    },
    "compliance_result": {
      "compliance_status": "string", // e.g., "compliant", "non-compliant"
      "risk_level": "string", // e.g., "low", "medium", "high"
      "compliance_scores": { // Per framework
        "SOC2": "number",
        "GDPR": "number",
        "HIPAA": "number"
      }
    },
    "reflection_record": { // Details from Promethios Reflection API
      "reflection_id": "string",
      "content": "object",
      "metadata": "object"
    }
  },
  "response_time": "number", // in seconds
  "timestamp": "datetime",
  "success": "boolean",
  "error": "string" // if any
}
```

#### Comparison Test Result
```json
{
  "test_id": "string", // Unique ID for this comparison test
  "test_name": "string",
  "agent_id": "string",
  "scenario_id": "string",
  "timestamp": "datetime",
  "ungoverned_result": "TestResult",
  "governed_result": "TestResult",
  "comparison_metrics": {
    "compliance_score_improvement": "number", // Percentage improvement
    "violations_reduced": "number", // Count
    "corrections_applied": "number", // Count
    "response_time_impact": "number", // Percentage change
    "overall_improvement_score": "number"
  },
  "improvement_summary": {
    "governance_impact": "string", // e.g., "positive", "neutral", "negative"
    "headline": "string",
    "key_improvements": ["string"]
  }
}
```

### 4.3. Promethios Governance API Integration

The `CMUBenchmarkService` will make direct API calls to the existing Promethios Governance endpoints. This ensures that the benchmark is testing the *actual* governance engine, not a simulated version.

Key endpoints to integrate with:
- `/api/governance/policy/evaluate`: To evaluate agent responses against defined policies.
- `/api/governance/compliance/monitor`: To get compliance scores against various frameworks.
- `/api/governance/reflection/create`: To log reflection records for audit and analysis.
- `/api/governance/override/apply`: (Optional) To simulate manual overrides if needed for specific test cases.

## 5. Flask API Design

### 5.1. Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check for the API. |
| GET | `/api/demo-agents` | Returns a list of available demo agents. |
| GET | `/api/test-scenarios` | Returns a list of predefined test scenarios. |
| POST | `/api/chat/send` | Sends a message to a specified agent, with an option to enable/disable governance. Returns the agent's response and governance details. |
| POST | `/api/benchmark/compare` | Runs a comparison test for a given agent and scenario, executing both governed and ungoverned interactions. Returns a detailed comparison result. |
| GET | `/api/governance/metrics` | Retrieves specific governance metrics for a given test ID or agent. |
| POST | `/api/report/generate` | Triggers the generation of a detailed report for a given test ID. Returns a success status. |
| POST | `/api/report/download` | Downloads a generated report file (PDF, CSV, JSON) for a given test ID. |
| GET | `/api/report/list` | Lists all available generated test results/reports. |

### 5.2. Request/Response Examples

#### `POST /api/chat/send`
**Request:**
```json
{
  "agent_id": "baseline_agent",
  "message": "Hello, how are you?",
  "governance_enabled": true
}
```
**Response (Success):**
```json
{
  "success": true,
  "response": {
    "agent_id": "baseline_agent",
    "message": "Hello, how are you?",
    "response": "I am doing well, thank you for asking!",
    "governance_result": { /* ... governance details ... */ },
    "response_time": 0.123,
    "timestamp": "2023-10-27T10:00:00Z",
    "governance_enabled": true,
    "success": true
  }
}
```

#### `POST /api/benchmark/compare`
**Request:**
```json
{
  "agent_id": "governance_focused_agent",
  "scenario_id": "healthcare_information",
  "test_name": "Healthcare Compliance Test"
}
```
**Response (Success):**
```json
{
  "success": true,
  "comparison_result": { /* ... ComparisonTestResult object ... */ }
}
```

#### `POST /api/report/download`
**Request:**
```json
{
  "test_id": "comp_20231027_healthcare_test",
  "format": "pdf" // or "csv", "json"
}
```
**Response:** (File download)

## 6. Frontend UI Integration

### 6.1. Components
- **Benchmark Dashboard**: Overview of past test runs and quick access to new tests.
- **New Test Form**: Allows users to select agents, scenarios, and governance options.
- **Real-time Results Display**: Show live progress and interim results during test execution.
- **Comparison View**: Visualize governed vs. ungoverned performance side-by-side.
- **Report Download Button**: Trigger download of generated reports.

### 6.2. User Flow
1. User navigates to the CMU Benchmark section in the Promethios UI.
2. User selects a demo agent and a test scenario.
3. User initiates a comparison test (governed vs. ungoverned).
4. The UI calls the Flask API to run the test.
5. Real-time updates are displayed in the UI as the test progresses.
6. Upon completion, a summary of the comparison is shown.
7. User can then download a detailed report.

## 7. Report Generation Details

### 7.1. Formats
- **PDF**: Professional, visually appealing reports including charts (e.g., compliance score comparison, violation breakdown) and textual summaries.
- **CSV**: Raw data export for detailed analysis in spreadsheet software.
- **JSON**: Machine-readable format for programmatic access and integration with other systems.

### 7.2. Content
Reports will include:
- Test ID, Agent, Scenario, Timestamp.
- Original and Modified Responses (for governed tests).
- Detailed Policy Evaluation (violations, modifications, compliance scores).
- Compliance Monitoring results (per framework).
- Reflection Records summary.
- Comparison Metrics (compliance improvement, violations reduced, etc.).
- Visualizations (charts for key metrics).

## 8. Future Enhancements
- Integration with real LLM APIs (OpenAI, Anthropic, etc.) for live testing.
- More sophisticated demo agents with complex behaviors.
- Advanced governance policies and dynamic policy adaptation.
- User-defined test scenarios and custom prompt injection.
- Automated scheduling of benchmark tests.
- Integration with Promethios Trust Metrics for deeper analysis.

## 9. Security Considerations
- All API endpoints should be secured appropriately (e.g., authentication, authorization) in a production environment.
- Input validation to prevent injection attacks.
- Sensitive information (API keys) should be stored securely (e.g., environment variables, secrets management).

## 10. Deployment
- The Flask API will be deployed as a separate service.
- The React UI components will be part of the main Promethios frontend deployment.

---
**Version**: 1.0
**Date**: 2025-06-14
**Author**: Manus

