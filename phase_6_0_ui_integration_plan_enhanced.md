# Phase 6.0: Enhanced UI Integration Plan for Testing and Validation

## Executive Summary

This document outlines the enhanced integration plan for extending the existing Promethios UI Justification Surface to support the features proposed in the Phase 6.0 implementation plan. Based on a thorough review of the current UI codebase and multiple rounds of expert feedback from Perplexity, this plan maps specific enhancements to concrete UI components and provides a technical roadmap for implementation.

The enhanced plan incorporates additional features focused on operator feedback, compliance support, visualization improvements, accessibility, and API-driven design to ensure the UI delivers maximum value for technical and non-technical stakeholders alike.

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
   - Inline feedback mechanism for operator input on override decisions

2. **Audit Export**
   - Export audit logs and trust events
   - Configure export parameters (time range, format)
   - Verify Merkle seals for exported data
   - Pre-configured compliance templates (SOC2, ISO 27001, GDPR, HIPAA)
   - Downloadable integrity proofs with verification scripts

3. **Adversarial Testing Dashboard**
   - Configure and launch adversarial test scenarios
   - View results of prompt injections, schema violations, etc.
   - Compare system behavior with and without governance
   - Real-time alerts for critical events
   - Side-by-side comparison with clear visual indicators

4. **Governance Impact Summary**
   - View side-by-side comparisons of governed vs. non-governed runs
   - Visualize metrics differences (performance, trust, errors)
   - Generate and export governance impact reports
   - Toggle between governed and non-governed task results
   - Visual cues highlighting governance impact

5. **Codex Contract Dashboard**
   - Visualize governance contracts and their relationships
   - Monitor contract enforcement and compliance
   - Track contract version history and changes
   - Contextual help for complex governance concepts

6. **UI Readiness Tracker**
   - Display status of UI components (live, in progress, planned)
   - Track implementation progress
   - Communicate roadmap to partners and users

### 2.2 Extensions to Existing UI Sections

1. **Emotion Telemetry Logs**
   - Add visualization of emotion trends over time
   - Enhance filtering capabilities for adversarial scenarios
   - Add comparison view for baseline vs. governed runs
   - Add inline feedback mechanism for operator input

2. **Justification Logs**
   - Add visualization of decision patterns
   - Enhance filtering for override-related events
   - Add links to related governance contracts
   - Add contextual help for complex governance concepts

3. **Log Integrity Check**
   - Extend to support Merkle-sealed logs
   - Add visualization of the Merkle chain
   - Add export capabilities for verification reports
   - Include downloadable integrity proofs

4. **Manual Replay**
   - Add support for adversarial scenario replay
   - Add side-by-side comparison of replay results
   - Add governance impact calculation for replays
   - Add real-time alerts for critical events

### 2.3 Cross-Cutting Enhancements

1. **Operator Feedback & Usability**
   - Inline feedback mechanism for flagging confusing events, unclear justifications, or UI friction points
   - Contextual help system with tooltips, inline documentation, and "What's This?" buttons for complex governance concepts
   - User preference storage for personalized UI experience

2. **Compliance & Audit Support**
   - Pre-configured export templates for common compliance frameworks (SOC2, ISO 27001, GDPR, HIPAA)
   - Downloadable Merkle proofs and verification scripts for each audit export
   - Compliance status dashboard with automated checks against governance requirements

3. **Visualization & Impact**
   - Real-time notification system for critical events (override collisions, trust collapse, schema violations)
   - Enhanced side-by-side comparison views with clear visual indicators of governance impact
   - Interactive visualizations for complex governance metrics and relationships

4. **Accessibility & Extensibility**
   - API-driven UI components for future integrations (CLI, mobile, external dashboards)
   - Dark mode toggle for operator comfort
   - Accessibility features including high contrast mode, keyboard navigation, and ARIA labels
   - Responsive design for different screen sizes and devices

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

@app.route('/override_management/feedback', methods=['POST'])
def submit_override_feedback():
    # Implementation for submitting operator feedback on override decisions
    pass

@app.route('/audit_export')
def audit_export():
    # Implementation for audit export UI
    pass

@app.route('/audit_export/download', methods=['POST'])
def download_audit_export():
    # Implementation for downloading audit export
    pass

@app.route('/audit_export/templates')
def audit_export_templates():
    # Implementation for managing audit export templates
    pass

@app.route('/audit_export/verify/<export_id>')
def verify_audit_export(export_id):
    # Implementation for verifying audit export integrity
    pass

@app.route('/adversarial_testing')
def adversarial_testing():
    # Implementation for adversarial testing dashboard
    pass

@app.route('/adversarial_testing/launch', methods=['POST'])
def launch_adversarial_test():
    # Implementation for launching an adversarial test
    pass

@app.route('/adversarial_testing/alerts')
def adversarial_testing_alerts():
    # Implementation for real-time alerts during adversarial testing
    pass

@app.route('/governance_impact')
def governance_impact():
    # Implementation for governance impact summary
    pass

@app.route('/governance_impact/generate', methods=['POST'])
def generate_governance_impact():
    # Implementation for generating a governance impact report
    pass

@app.route('/governance_impact/compare/<task_id>')
def compare_governance_impact(task_id):
    # Implementation for side-by-side comparison of governed vs. non-governed runs
    pass

@app.route('/codex_dashboard')
def codex_dashboard():
    # Implementation for codex contract dashboard
    pass

@app.route('/codex_dashboard/help/<concept_id>')
def codex_concept_help(concept_id):
    # Implementation for contextual help on governance concepts
    pass

@app.route('/ui_readiness')
def ui_readiness():
    # Implementation for UI readiness tracker
    pass

@app.route('/api/v1/feedback', methods=['POST'])
def submit_feedback():
    # API endpoint for submitting operator feedback
    pass

@app.route('/preferences', methods=['GET', 'POST'])
def user_preferences():
    # Implementation for user preferences (dark mode, etc.)
    pass
```

#### 3.1.2 New Models

```python
# New models to be added to models/ directory

class OverrideRequest:
    """Model for override requests."""
    pass

class OverrideFeedback:
    """Model for operator feedback on override decisions."""
    pass

class AuditExport:
    """Model for audit exports."""
    pass

class AuditTemplate:
    """Model for audit export templates."""
    pass

class IntegrityProof:
    """Model for integrity proofs."""
    pass

class AdversarialTest:
    """Model for adversarial tests."""
    pass

class Alert:
    """Model for real-time alerts."""
    pass

class GovernanceImpact:
    """Model for governance impact summaries."""
    pass

class CodexContract:
    """Model for codex contracts."""
    pass

class ContextualHelp:
    """Model for contextual help content."""
    pass

class UIComponent:
    """Model for UI readiness tracking."""
    pass

class UserPreference:
    """Model for user preferences."""
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

def generate_integrity_proof(data):
    """Generate a Merkle proof for data integrity."""
    pass

def verify_integrity_proof(data, proof):
    """Verify a Merkle proof for data integrity."""
    pass

def generate_compliance_report(template_id, data):
    """Generate a compliance report from a template."""
    pass
```

### 3.2 Frontend Extensions

#### 3.2.1 New Templates

```
templates/
├── override_management.html
├── override_feedback.html
├── audit_export.html
├── audit_templates.html
├── adversarial_testing.html
├── adversarial_alerts.html
├── governance_impact.html
├── governance_comparison.html
├── codex_dashboard.html
├── contextual_help.html
├── ui_readiness.html
└── user_preferences.html
```

#### 3.2.2 JavaScript Extensions

```
static/js/
├── override_management.js
├── override_feedback.js
├── audit_export.js
├── audit_templates.js
├── adversarial_testing.js
├── adversarial_alerts.js
├── governance_impact.js
├── governance_comparison.js
├── codex_dashboard.js
├── contextual_help.js
├── ui_readiness.js
├── user_preferences.js
├── accessibility.js
├── dark_mode.js
├── real_time_alerts.js
└── visualization/
    ├── emotion_trends.js
    ├── decision_patterns.js
    ├── merkle_chain.js
    ├── governance_impact.js
    ├── side_by_side.js
    └── compliance_status.js
```

#### 3.2.3 CSS Extensions

```
static/css/
├── override_management.css
├── audit_export.css
├── adversarial_testing.css
├── governance_impact.css
├── codex_dashboard.css
├── ui_readiness.css
├── dark_mode.css
├── high_contrast.css
├── responsive.css
└── accessibility.css
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
    <li><a href="{{ url_for('ui_readiness') }}">UI Readiness</a></li>
    <!-- User preferences and accessibility -->
    <li><a href="{{ url_for('user_preferences') }}">Preferences</a></li>
    <li><button id="dark-mode-toggle">🌙</button></li>
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

FEEDBACK_LOG_FILENAME = os.environ.get('FEEDBACK_LOG_FILENAME', 'operator_feedback.log.jsonl')
FEEDBACK_LOG_FILE = os.path.join(LOG_DATA_DIR, FEEDBACK_LOG_FILENAME)

COMPLIANCE_TEMPLATES_DIR = os.environ.get('COMPLIANCE_TEMPLATES_DIR', os.path.join(PROJECT_ROOT, 'compliance_templates'))

CONTEXTUAL_HELP_FILENAME = os.environ.get('CONTEXTUAL_HELP_FILENAME', 'contextual_help.json')
CONTEXTUAL_HELP_FILE = os.path.join(PROJECT_ROOT, CONTEXTUAL_HELP_FILENAME)

UI_READINESS_FILENAME = os.environ.get('UI_READINESS_FILENAME', 'ui_readiness.json')
UI_READINESS_FILE = os.path.join(PROJECT_ROOT, UI_READINESS_FILENAME)

# User preferences
ENABLE_DARK_MODE = os.environ.get('ENABLE_DARK_MODE', 'true').lower() == 'true'
ENABLE_HIGH_CONTRAST = os.environ.get('ENABLE_HIGH_CONTRAST', 'false').lower() == 'true'
ENABLE_KEYBOARD_NAVIGATION = os.environ.get('ENABLE_KEYBOARD_NAVIGATION', 'true').lower() == 'true'
```

## 4. UI Mockups for New Sections

### 4.1 Override Management with Feedback

The Override Management UI will provide a dashboard for viewing and managing override requests, with added feedback capabilities:

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
| Operator Feedback                                     |
|                                                       |
| Override ID: [ 02 ▼ ]                                 |
| Feedback Type: [ Decision Clarity ▼ ]                 |
| Comments: [                                         ] |
|                                                       |
| [ Submit Feedback ]                                   |
+-------------------------------------------------------+
```

### 4.2 Audit Export with Compliance Templates

The Audit Export UI will provide a form for configuring and downloading audit exports, with added compliance templates:

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
| Compliance Template: [ SOC2 ▼ ]                       |
| Include Integrity Proof: [✓]                          |
|                                                       |
| [ Export Audit Logs ] [ Export Trust Events ]         |
+-------------------------------------------------------+
| Recent Exports                                        |
|                                                       |
| Filename | Type | Template | Time | Size | Verified | Download |
|----------+------+----------+------+------+----------+----------|
| audit_...| Logs | SOC2     | 12:30| 2.3MB| ✓        | [↓] [✓]  |
| trust_...| Trust| GDPR     | 12:45| 1.1MB| ✓        | [↓] [✓]  |
+-------------------------------------------------------+
```

### 4.3 Adversarial Testing Dashboard with Alerts

The Adversarial Testing Dashboard will provide a UI for configuring and launching adversarial tests, with added real-time alerts:

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
| Real-Time Alerts                                      |
|                                                       |
| [!] Trust collapse detected in test 01 at 12:35       |
| [!] Schema violation bypassed in test 02 at 12:40     |
| [!] Override collision detected in test 03 at 12:50   |
+-------------------------------------------------------+
| Test Results                                          |
|                                                       |
| ID | Scenario | Time | Status | Governed | Baseline   |
|----+----------+------+--------+----------+-----------|
| 01 | Prompt... | 12:30| Pass   | Blocked  | Executed  |
| 02 | Schema... | 12:45| Pass   | Rejected | Accepted  |
+-------------------------------------------------------+
```

### 4.4 Governance Impact Summary with Side-by-Side Comparison

The Governance Impact Summary UI will provide enhanced visualizations and comparisons of governance impact:

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
| [ Toggle View Mode ] [ Show Differences Only ]        |
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
| Operator Feedback                                     |
|                                                       |
| Was this comparison helpful? [ Yes ] [ No ]           |
| Comments: [                                         ] |
|                                                       |
| [ Submit Feedback ]                                   |
+-------------------------------------------------------+
```

### 4.5 Codex Contract Dashboard with Contextual Help

The Codex Contract Dashboard will provide visualizations of governance contracts with added contextual help:

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
| Contextual Help                                       |
|                                                       |
| What is a Codex Contract?                             |
| A Codex Contract is a formal specification of         |
| governance rules that define how agents can           |
| interact with data and systems. Contracts are         |
| enforced by the Promethios governance engine.         |
|                                                       |
| [ More Help Topics ▼ ]                                |
+-------------------------------------------------------+
```

### 4.6 UI Readiness Tracker

The UI Readiness Tracker will provide a dashboard for tracking the implementation status of UI components:

```
+-------------------------------------------------------+
| Promethios UI Justification Surface                   |
+-------------------------------------------------------+
| Home | Emotion Logs | ... | UI Readiness | ...        |
+-------------------------------------------------------+
| UI Readiness Tracker                                  |
+-------------------------------------------------------+
| Component Status                                      |
|                                                       |
| Component | Status | Priority | Target Date | Progress |
|----------+--------+----------+------------+----------|
| Override | Live   | High     | 2025-05-15 | 100%     |
| Audit    | In Dev | High     | 2025-05-30 | 75%      |
| Testing  | Planned| Medium   | 2025-06-15 | 25%      |
| Impact   | Live   | High     | 2025-05-20 | 100%     |
| Codex    | In Dev | Medium   | 2025-06-01 | 50%      |
+-------------------------------------------------------+
| Implementation Roadmap                                |
|                                                       |
| [Timeline visualization showing past and future       |
|  implementation milestones]                           |
|                                                       |
| Last Updated: 2025-05-21T14:30:00Z                    |
+-------------------------------------------------------+
```

### 4.7 User Preferences

The User Preferences UI will provide options for customizing the UI experience:

```
+-------------------------------------------------------+
| Promethios UI Justification Surface                   |
+-------------------------------------------------------+
| Home | Emotion Logs | ... | Preferences | ...         |
+-------------------------------------------------------+
| User Preferences                                      |
+-------------------------------------------------------+
| Display Settings                                      |
|                                                       |
| Theme: ( ) Light (•) Dark ( ) System                  |
| High Contrast Mode: [ ] Enabled                       |
| Font Size: ( ) Small (•) Medium ( ) Large             |
|                                                       |
| Accessibility                                         |
|                                                       |
| Keyboard Navigation: [✓] Enabled                      |
| Screen Reader Support: [✓] Enabled                    |
| Reduce Motion: [ ] Enabled                            |
|                                                       |
| Notifications                                         |
|                                                       |
| Real-Time Alerts: [✓] Enabled                         |
| Alert Sound: [ ] Enabled                              |
|                                                       |
| [ Save Preferences ] [ Reset to Defaults ]            |
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

### 5.4 Benchmark Task Categories

The benchmark tasks will be organized into categories:

1. **Routine Tasks**
   - Software Engineering
   - Product Management
   - Human Resources
   - Administrative

2. **Edge-Case Tasks**
   - Ambiguous Requirements
   - High Error Potential
   - Conflicting Goals
   - Ethical Dilemmas

## 6. Implementation Sequence

### 6.1 Phase 1: Core UI Extensions

1. Update `config.py` with new configuration options
2. Create new route handlers in `main.py` or `routes/` directory
3. Create new model classes in `models/` directory
4. Create basic templates for new UI sections
5. Update navigation in `base.html`
6. Implement dark mode and basic accessibility features

### 6.2 Phase 2: Frontend Development

1. Develop CSS styles for new UI sections
2. Implement JavaScript functionality for interactive features
3. Create visualization components for metrics and comparisons
4. Implement form handling and validation
5. Add contextual help system
6. Implement real-time alerts

### 6.3 Phase 3: Backend Integration

1. Implement log parsing and processing for new data types
2. Integrate with external scripts for testing and analysis
3. Implement export functionality for reports and data
4. Add authentication and authorization for sensitive operations
5. Implement compliance template system
6. Add integrity proof generation and verification

### 6.4 Phase 4: TheAgentCompany Benchmark Integration

1. Implement benchmark task selection and execution
2. Develop benchmark results visualization
3. Create observer experience UI
4. Implement governance impact calculation for benchmark tasks
5. Add side-by-side comparison with visual indicators
6. Implement operator feedback collection

### 6.5 Phase 5: Testing and Refinement

1. Develop comprehensive test suite for UI extensions
2. Conduct usability testing with operators and observers
3. Refine UI based on feedback
4. Optimize performance for large datasets
5. Implement UI readiness tracker
6. Finalize documentation and user guides

## 7. Sample Code for Key Enhancements

### 7.1 Inline Feedback Capture

```python
# Backend route for feedback submission
@app.route('/api/v1/feedback', methods=['POST'])
def submit_feedback():
    """API endpoint for submitting operator feedback."""
    feedback_data = request.json
    
    # Validate feedback data
    if not feedback_data or 'component' not in feedback_data or 'content' not in feedback_data:
        return jsonify({'status': 'error', 'message': 'Invalid feedback data'}), 400
    
    # Add timestamp and generate ID
    feedback_data['timestamp'] = datetime.now().isoformat()
    feedback_data['id'] = str(uuid.uuid4())
    
    # Save feedback to log file
    with open(FEEDBACK_LOG_FILE, 'a') as f:
        f.write(json.dumps(feedback_data) + '\n')
    
    return jsonify({'status': 'success', 'message': 'Feedback submitted', 'id': feedback_data['id']})
```

```javascript
// Frontend JavaScript for feedback submission
function submitFeedback(component, content, context = {}) {
    const feedbackData = {
        component: component,
        content: content,
        context: context
    };
    
    fetch('/api/v1/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification('Feedback submitted successfully');
        } else {
            showNotification('Error submitting feedback: ' + data.message);
        }
    })
    .catch(error => {
        showNotification('Error submitting feedback: ' + error);
    });
}
```

### 7.2 Audit Export Templates

```python
# Backend route for audit export with templates
@app.route('/audit_export/download', methods=['POST'])
def download_audit_export():
    """Implementation for downloading audit export."""
    export_config = request.form
    
    # Get template if specified
    template_id = export_config.get('template')
    template = None
    if template_id:
        template_path = os.path.join(COMPLIANCE_TEMPLATES_DIR, f"{template_id}.json")
        if os.path.exists(template_path):
            with open(template_path, 'r') as f:
                template = json.load(f)
    
    # Get export parameters
    agent_id = export_config.get('agent_id')
    task_id = export_config.get('task_id')
    start_time = export_config.get('start_time')
    end_time = export_config.get('end_time')
    format = export_config.get('format', 'json')
    include_proof = export_config.get('include_proof') == 'true'
    
    # Generate export
    export_data = generate_audit_export(agent_id, task_id, start_time, end_time, format, template)
    
    # Generate integrity proof if requested
    proof = None
    if include_proof:
        proof = generate_integrity_proof(export_data)
        
    # Prepare response
    response_data = {
        'export_data': export_data,
        'proof': proof,
        'template_id': template_id,
        'timestamp': datetime.now().isoformat()
    }
    
    # Save export record
    export_id = str(uuid.uuid4())
    export_record = {
        'id': export_id,
        'template_id': template_id,
        'agent_id': agent_id,
        'task_id': task_id,
        'start_time': start_time,
        'end_time': end_time,
        'format': format,
        'include_proof': include_proof,
        'timestamp': response_data['timestamp']
    }
    
    with open(os.path.join(LOG_DATA_DIR, 'exports.log.jsonl'), 'a') as f:
        f.write(json.dumps(export_record) + '\n')
    
    # Return response
    if format == 'json':
        return jsonify(response_data)
    elif format == 'csv':
        return Response(
            export_data,
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment;filename=audit_export_{export_id}.csv'}
        )
    elif format == 'pdf':
        return Response(
            export_data,
            mimetype='application/pdf',
            headers={'Content-Disposition': f'attachment;filename=audit_export_{export_id}.pdf'}
        )
```

### 7.3 UI Readiness Tracker

```python
# Backend route for UI readiness tracker
@app.route('/ui_readiness')
def ui_readiness():
    """Implementation for UI readiness tracker."""
    if not os.path.exists(UI_READINESS_FILE):
        return render_template('ui_readiness.html', components=[], error_message="UI readiness data not found")
    
    with open(UI_READINESS_FILE, 'r') as f:
        readiness_data = json.load(f)
    
    # Calculate overall progress
    total_components = len(readiness_data['components'])
    completed_components = sum(1 for c in readiness_data['components'] if c['status'] == 'Live')
    overall_progress = (completed_components / total_components) * 100 if total_components > 0 else 0
    
    return render_template('ui_readiness.html',
                          components=readiness_data['components'],
                          milestones=readiness_data.get('milestones', []),
                          last_updated=readiness_data.get('last_updated'),
                          overall_progress=overall_progress)
```

```json
// Example UI readiness data (ui_readiness.json)
{
  "last_updated": "2025-05-21T14:30:00Z",
  "components": [
    {
      "name": "Override Management",
      "status": "Live",
      "priority": "High",
      "target_date": "2025-05-15",
      "progress": 100,
      "description": "UI for managing override requests and resolutions"
    },
    {
      "name": "Audit Export",
      "status": "In Development",
      "priority": "High",
      "target_date": "2025-05-30",
      "progress": 75,
      "description": "UI for exporting audit logs and trust events"
    },
    {
      "name": "Adversarial Testing",
      "status": "Planned",
      "priority": "Medium",
      "target_date": "2025-06-15",
      "progress": 25,
      "description": "Dashboard for configuring and launching adversarial tests"
    }
  ],
  "milestones": [
    {
      "date": "2025-05-15",
      "title": "Override Management Release",
      "description": "Initial release of Override Management UI"
    },
    {
      "date": "2025-05-30",
      "title": "Audit Export Release",
      "description": "Release of Audit Export UI with compliance templates"
    },
    {
      "date": "2025-06-15",
      "title": "Adversarial Testing Release",
      "description": "Release of Adversarial Testing Dashboard"
    }
  ]
}
```

## 8. Conclusion

The enhanced UI integration plan for Phase 6.0 provides a comprehensive framework for extending the Promethios UI Justification Surface to support the API Testing and Validation requirements. By incorporating Perplexity's expert feedback, the plan now includes additional features focused on operator feedback, compliance support, visualization improvements, accessibility, and API-driven design.

These enhancements will ensure that the UI delivers maximum value for both technical and non-technical stakeholders, making Promethios not just a backend governance engine, but a transparent, operator-friendly, and auditor-ready platform. The integration with TheAgentCompany benchmark will provide a powerful demonstration of governance impact, with side-by-side comparisons of governed and non-governed agent behavior.

The phased implementation approach ensures that each component is properly developed, tested, and integrated before moving to the next phase, minimizing risk and ensuring a high-quality user experience. The UI readiness tracker will provide transparency into the implementation progress and roadmap, building trust with partners and users.

Upon successful completion of Phase 6.0, the Promethios UI will be ready to support the formalization and documentation in Phase 6.1, followed by the full TheAgentCompany benchmark execution in Phase 6.2 and phased API exposure in Phase 6.3.
