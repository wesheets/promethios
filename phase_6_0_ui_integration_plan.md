# Phase 6.0: UI Integration Plan for Enhanced Testing and Validation

## Executive Summary

This document outlines the integration plan for extending the existing Promethios UI Justification Surface to support the enhanced features proposed in the Phase 6.0 implementation plan. Based on a thorough review of the current UI codebase and Perplexity's expert feedback, this plan maps specific enhancements to concrete UI components and provides a technical roadmap for implementation.

## 1. Current UI Architecture Overview

The Promethios UI Justification Surface is a Flask-based web application with the following structure:

```
promethios_ui_surface/
├── src/
│   ├── __init__.py
│   ├── config.py
│   ├── main.py
│   ├── models/
│   ├── routes/
│   ├── static/
│   ├── templates/
│   └── utils/
│       └── log_parser.py
└── sample_logs/
```

The UI currently provides four main features:
1. **Emotion Telemetry Logs**: Viewing and filtering emotion telemetry log entries
2. **Justification Logs**: Viewing and filtering justification log entries
3. **Log Integrity Check**: Verifying the integrity of log files using SHA256 hashes
4. **Manual Replay**: Initiating deterministic replays of specific scenarios

## 2. Proposed UI Extensions

### 2.1 New UI Sections

Based on Perplexity's feedback and the enhanced Phase 6.0 plan, the following new UI sections will be added:

1. **Override Management**
   - View and manage override requests
   - Review and resolve pending overrides
   - View override history and justifications

2. **Audit Export**
   - Export audit logs and trust events
   - Configure export parameters (time range, format)
   - Verify Merkle seals for exported data

3. **Adversarial Testing Dashboard**
   - Configure and launch adversarial test scenarios
   - View results of prompt injections, schema violations, etc.
   - Compare system behavior with and without governance

4. **Governance Impact Summary**
   - View side-by-side comparisons of governed vs. non-governed runs
   - Visualize metrics differences (performance, trust, errors)
   - Generate and export governance impact reports

5. **Codex Contract Dashboard**
   - Visualize governance contracts and their relationships
   - Monitor contract enforcement and compliance
   - Track contract version history and changes

### 2.2 Extensions to Existing UI Sections

1. **Emotion Telemetry Logs**
   - Add visualization of emotion trends over time
   - Enhance filtering capabilities for adversarial scenarios
   - Add comparison view for baseline vs. governed runs

2. **Justification Logs**
   - Add visualization of decision patterns
   - Enhance filtering for override-related events
   - Add links to related governance contracts

3. **Log Integrity Check**
   - Extend to support Merkle-sealed logs
   - Add visualization of the Merkle chain
   - Add export capabilities for verification reports

4. **Manual Replay**
   - Add support for adversarial scenario replay
   - Add side-by-side comparison of replay results
   - Add governance impact calculation for replays

## 3. Technical Implementation Plan

### 3.1 Backend Extensions

#### 3.1.1 New Routes and Controllers

```python
# New routes to be added to main.py or routes/ directory

@app.route('/override_management')
def override_management():
    # Implementation for override management UI
    pass

@app.route('/override_management/request', methods=['POST'])
def request_override():
    # Implementation for requesting an override
    pass

@app.route('/override_management/resolve/<request_id>', methods=['POST'])
def resolve_override(request_id):
    # Implementation for resolving an override
    pass

@app.route('/audit_export')
def audit_export():
    # Implementation for audit export UI
    pass

@app.route('/audit_export/download', methods=['POST'])
def download_audit_export():
    # Implementation for downloading audit export
    pass

@app.route('/adversarial_testing')
def adversarial_testing():
    # Implementation for adversarial testing dashboard
    pass

@app.route('/adversarial_testing/launch', methods=['POST'])
def launch_adversarial_test():
    # Implementation for launching an adversarial test
    pass

@app.route('/governance_impact')
def governance_impact():
    # Implementation for governance impact summary
    pass

@app.route('/governance_impact/generate', methods=['POST'])
def generate_governance_impact():
    # Implementation for generating a governance impact report
    pass

@app.route('/codex_dashboard')
def codex_dashboard():
    # Implementation for codex contract dashboard
    pass
```

#### 3.1.2 New Models

```python
# New models to be added to models/ directory

class OverrideRequest:
    """Model for override requests."""
    pass

class AuditExport:
    """Model for audit exports."""
    pass

class AdversarialTest:
    """Model for adversarial tests."""
    pass

class GovernanceImpact:
    """Model for governance impact summaries."""
    pass

class CodexContract:
    """Model for codex contracts."""
    pass
```

#### 3.1.3 Utility Extensions

```python
# Extensions to utils/log_parser.py

def parse_override_requests(file_path):
    """Parse override request logs."""
    pass

def parse_audit_logs(file_path, start_time=None, end_time=None):
    """Parse audit logs with time filtering."""
    pass

def calculate_governance_impact(baseline_logs, governed_logs):
    """Calculate governance impact metrics."""
    pass

def parse_codex_contracts(file_path):
    """Parse codex contract definitions."""
    pass
```

### 3.2 Frontend Extensions

#### 3.2.1 New Templates

```
templates/
├── override_management.html
├── audit_export.html
├── adversarial_testing.html
├── governance_impact.html
└── codex_dashboard.html
```

#### 3.2.2 JavaScript Extensions

```
static/js/
├── override_management.js
├── audit_export.js
├── adversarial_testing.js
├── governance_impact.js
├── codex_dashboard.js
└── visualization/
    ├── emotion_trends.js
    ├── decision_patterns.js
    ├── merkle_chain.js
    └── governance_impact.js
```

#### 3.2.3 CSS Extensions

```
static/css/
├── override_management.css
├── audit_export.css
├── adversarial_testing.css
├── governance_impact.css
└── codex_dashboard.css
```

### 3.3 Integration with Existing UI

#### 3.3.1 Navigation Updates

The existing navigation bar in `templates/base.html` will be updated to include the new sections:

```html
<nav>
  <ul>
    <li><a href="{{ url_for('index') }}">Home</a></li>
    <li><a href="{{ url_for('emotion_logs') }}">Emotion Telemetry Logs</a></li>
    <li><a href="{{ url_for('justification_logs') }}">Justification Logs</a></li>
    <li><a href="{{ url_for('integrity_check') }}">Log Integrity Check</a></li>
    <li><a href="{{ url_for('replay') }}">Manual Replay</a></li>
    <!-- New navigation items -->
    <li><a href="{{ url_for('override_management') }}">Override Management</a></li>
    <li><a href="{{ url_for('audit_export') }}">Audit Export</a></li>
    <li><a href="{{ url_for('adversarial_testing') }}">Adversarial Testing</a></li>
    <li><a href="{{ url_for('governance_impact') }}">Governance Impact</a></li>
    <li><a href="{{ url_for('codex_dashboard') }}">Codex Dashboard</a></li>
  </ul>
</nav>
```

#### 3.3.2 Configuration Updates

The `config.py` file will be updated to include new configuration options:

```python
# New configuration options
OVERRIDE_LOG_FILENAME = os.environ.get('OVERRIDE_LOG_FILENAME', 'override.log.jsonl')
OVERRIDE_LOG_FILE = os.path.join(LOG_DATA_DIR, OVERRIDE_LOG_FILENAME)

AUDIT_LOG_FILENAME = os.environ.get('AUDIT_LOG_FILENAME', 'audit.log.jsonl')
AUDIT_LOG_FILE = os.path.join(LOG_DATA_DIR, AUDIT_LOG_FILENAME)

ADVERSARIAL_TEST_SCRIPT_NAME = os.environ.get('ADVERSARIAL_TEST_SCRIPT_NAME', 'test_adversarial.py')
ADVERSARIAL_TEST_SCRIPT_PATH = os.path.join(PROJECT_ROOT, ADVERSARIAL_TEST_SCRIPT_NAME)

GOVERNANCE_IMPACT_SCRIPT_NAME = os.environ.get('GOVERNANCE_IMPACT_SCRIPT_NAME', 'calculate_governance_impact.py')
GOVERNANCE_IMPACT_SCRIPT_PATH = os.path.join(PROJECT_ROOT, GOVERNANCE_IMPACT_SCRIPT_NAME)

CODEX_CONTRACT_FILENAME = os.environ.get('CODEX_CONTRACT_FILENAME', 'codex_contracts.json')
CODEX_CONTRACT_FILE = os.path.join(LOG_DATA_DIR, CODEX_CONTRACT_FILENAME)
```

## 4. UI Mockups for New Sections

### 4.1 Override Management

The Override Management UI will provide a dashboard for viewing and managing override requests:

```
+-------------------------------------------------------+
| Promethios UI Justification Surface                   |
+-------------------------------------------------------+
| Home | Emotion Logs | ... | Override Management | ... |
+-------------------------------------------------------+
| Override Management                                   |
+-------------------------------------------------------+
| Filters: [ Status: All ▼ ] [ Agent: All ▼ ] [ Apply ] |
+-------------------------------------------------------+
| ID | Agent | Task | Action | Reason | Status | Time   |
|----+-------+------+--------+--------+--------+--------|
| 01 | A123  | T456 | Write  | Policy | Pending| 12:30  |
| 02 | A456  | T789 | Access | Trust  | Denied | 12:45  |
| 03 | A789  | T012 | Delete | Safety | Approved| 13:00 |
+-------------------------------------------------------+
| [ Request Override ] [ Refresh ] [ Export ]           |
+-------------------------------------------------------+
```

### 4.2 Audit Export

The Audit Export UI will provide a form for configuring and downloading audit exports:

```
+-------------------------------------------------------+
| Promethios UI Justification Surface                   |
+-------------------------------------------------------+
| Home | Emotion Logs | ... | Audit Export | ...        |
+-------------------------------------------------------+
| Audit Export                                          |
+-------------------------------------------------------+
| Export Configuration                                  |
|                                                       |
| Agent ID: [ All Agents ▼ ]                            |
| Task ID: [ All Tasks ▼ ]                              |
| Start Time: [ 2025-05-01T00:00 ]                      |
| End Time: [ 2025-05-21T23:59 ]                        |
| Format: ( ) JSON (•) CSV ( ) PDF                      |
|                                                       |
| [ Export Audit Logs ] [ Export Trust Events ]         |
+-------------------------------------------------------+
| Recent Exports                                        |
|                                                       |
| Filename | Type | Time | Size | Verified | Download   |
|----------+------+------+------+----------+-----------|
| audit_... | Logs | 12:30| 2.3MB| ✓       | [↓]       |
| trust_... | Trust| 12:45| 1.1MB| ✓       | [↓]       |
+-------------------------------------------------------+
```

### 4.3 Adversarial Testing Dashboard

The Adversarial Testing Dashboard will provide a UI for configuring and launching adversarial tests:

```
+-------------------------------------------------------+
| Promethios UI Justification Surface                   |
+-------------------------------------------------------+
| Home | Emotion Logs | ... | Adversarial Testing | ... |
+-------------------------------------------------------+
| Adversarial Testing Dashboard                         |
+-------------------------------------------------------+
| Test Scenarios                                        |
|                                                       |
| Category: [ All Categories ▼ ]                        |
|                                                       |
| ID | Name | Category | Description | Run | Compare    |
|----+------+----------+-------------+-----+-----------|
| 01 | Prompt Injection | Attack | Attempt to... | [▶] | [≡] |
| 02 | Schema Violation | Boundary | Invalid... | [▶] | [≡] |
| 03 | Forced Override | Policy | Try to... | [▶] | [≡] |
+-------------------------------------------------------+
| Test Results                                          |
|                                                       |
| ID | Scenario | Time | Status | Governed | Baseline   |
|----+----------+------+--------+----------+-----------|
| 01 | Prompt... | 12:30| Pass   | Blocked  | Executed  |
| 02 | Schema... | 12:45| Pass   | Rejected | Accepted  |
+-------------------------------------------------------+
```

### 4.4 Governance Impact Summary

The Governance Impact Summary UI will provide visualizations and comparisons of governance impact:

```
+-------------------------------------------------------+
| Promethios UI Justification Surface                   |
+-------------------------------------------------------+
| Home | Emotion Logs | ... | Governance Impact | ...   |
+-------------------------------------------------------+
| Governance Impact Summary                             |
+-------------------------------------------------------+
| Task Selection: [ Task T123: File Access ▼ ]          |
+-------------------------------------------------------+
| Comparison View                                       |
|                                                       |
| +-------------------+  +----------------------+       |
| | Baseline Run      |  | Governed Run         |       |
| | Success: Yes      |  | Success: Yes         |       |
| | Steps: 12         |  | Steps: 14 (+2)       |       |
| | Tokens: 1,234     |  | Tokens: 1,356 (+122) |       |
| | Errors: 2         |  | Errors: 0 (-2)       |       |
| +-------------------+  +----------------------+       |
|                                                       |
| +-----------------------------------------------+     |
| | Governance Metrics                            |     |
| | Policy Enforcements: 8                        |     |
| | Allowed Actions: 12                           |     |
| | Blocked Actions: 3                            |     |
| | Trust Score: 0.92                             |     |
| | Reflections: 5                                |     |
| +-----------------------------------------------+     |
|                                                       |
| [ Generate Report ] [ Export Data ]                   |
+-------------------------------------------------------+
```

### 4.5 Codex Contract Dashboard

The Codex Contract Dashboard will provide visualizations of governance contracts:

```
+-------------------------------------------------------+
| Promethios UI Justification Surface                   |
+-------------------------------------------------------+
| Home | Emotion Logs | ... | Codex Dashboard | ...     |
+-------------------------------------------------------+
| Codex Contract Dashboard                              |
+-------------------------------------------------------+
| Contract Type: [ All Types ▼ ]                        |
+-------------------------------------------------------+
| Contract Visualization                                |
|                                                       |
| +-------------------+       +-------------------+     |
| | Data Access       |------>| Data Processing   |     |
| +-------------------+       +-------------------+     |
|         |                           |                 |
|         v                           v                 |
| +-------------------+       +-------------------+     |
| | Data Storage      |<------| Data Retention    |     |
| +-------------------+       +-------------------+     |
|                                                       |
| Contract Details                                      |
|                                                       |
| Name: Data Access                                     |
| Version: 1.2                                          |
| Status: Active                                        |
| Enforcements: 128                                     |
| Last Updated: 2025-05-15T14:30:00Z                    |
|                                                       |
| [ View Contract ] [ View History ] [ Export ]         |
+-------------------------------------------------------+
```

## 5. Integration with TheAgentCompany Benchmark

The UI extensions will support the TheAgentCompany benchmark integration as follows:

### 5.1 Task Selection and Execution

A new section will be added to the UI for selecting and executing benchmark tasks:

```python
@app.route('/benchmark')
def benchmark():
    """UI for TheAgentCompany benchmark tasks."""
    return render_template('benchmark.html')

@app.route('/benchmark/execute', methods=['POST'])
def execute_benchmark():
    """Execute a benchmark task."""
    task_id = request.form.get('task_id')
    governance_enabled = request.form.get('governance_enabled') == 'true'
    
    # Execute the task
    result = execute_benchmark_task(task_id, governance_enabled)
    
    return jsonify(result)
```

### 5.2 Benchmark Results Visualization

The Governance Impact Summary UI will be extended to support benchmark results:

```python
@app.route('/benchmark/results/<task_id>')
def benchmark_results(task_id):
    """View benchmark results for a specific task."""
    baseline_results = get_benchmark_results(task_id, governance_enabled=False)
    governed_results = get_benchmark_results(task_id, governance_enabled=True)
    
    impact = calculate_governance_impact(baseline_results, governed_results)
    
    return render_template('benchmark_results.html',
                          task_id=task_id,
                          baseline_results=baseline_results,
                          governed_results=governed_results,
                          impact=impact)
```

### 5.3 Observer Experience

The UI will provide a dedicated observer experience for the benchmark:

```python
@app.route('/benchmark/observer')
def benchmark_observer():
    """Observer view for benchmark execution."""
    return render_template('benchmark_observer.html')
```

## 6. Implementation Sequence

### 6.1 Phase 1: Core UI Extensions

1. Update `config.py` with new configuration options
2. Create new route handlers in `main.py` or `routes/` directory
3. Create new model classes in `models/` directory
4. Create basic templates for new UI sections
5. Update navigation in `base.html`

### 6.2 Phase 2: Frontend Development

1. Develop CSS styles for new UI sections
2. Implement JavaScript functionality for interactive features
3. Create visualization components for metrics and comparisons
4. Implement form handling and validation

### 6.3 Phase 3: Backend Integration

1. Implement log parsing and processing for new data types
2. Integrate with external scripts for testing and analysis
3. Implement export functionality for reports and data
4. Add authentication and authorization for sensitive operations

### 6.4 Phase 4: TheAgentCompany Benchmark Integration

1. Implement benchmark task selection and execution
2. Develop benchmark results visualization
3. Create observer experience UI
4. Implement governance impact calculation for benchmark tasks

### 6.5 Phase 5: Testing and Refinement

1. Develop comprehensive test suite for UI extensions
2. Conduct usability testing with operators and observers
3. Refine UI based on feedback
4. Optimize performance for large datasets

## 7. Conclusion

The proposed UI extensions will significantly enhance the Promethios UI Justification Surface to support the Phase 6.0 API Testing and Validation requirements. By leveraging the existing UI architecture and extending it with new features, we can provide a comprehensive interface for testing, validating, and demonstrating the Promethios governance capabilities.

The integration with TheAgentCompany benchmark will provide a powerful demonstration of governance impact, with side-by-side comparisons of governed and non-governed agent behavior. The enhanced UI will support both technical and business stakeholders in understanding and evaluating the value of Promethios governance.
