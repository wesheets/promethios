# CMU Benchmark Deployment Guide

## Quick Start

### 1. Start the Backend API
```bash
cd /home/ubuntu/promethios/backend/cmu_benchmark_api
python app.py
```
- API will be available at: `http://localhost:5003`
- Health check: `curl http://localhost:5003/health`

### 2. Test Basic Functionality
```bash
# List demo agents
curl http://localhost:5003/api/demo-agents

# List test scenarios  
curl http://localhost:5003/api/test-scenarios

# Send a message (without governance)
curl -X POST http://localhost:5003/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "baseline_agent", "message": "Hello", "governance_enabled": false}'

# Send a message (with governance)
curl -X POST http://localhost:5003/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "baseline_agent", "message": "This is terrible!", "governance_enabled": true}'
```

### 3. Run Comparison Tests
```bash
# Run governed vs ungoverned comparison
curl -X POST http://localhost:5003/api/benchmark/compare \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "governance_focused_agent", "scenario_id": "healthcare_information", "test_name": "My Test"}'
```

### 4. Generate Reports
```bash
# Generate PDF report
curl -X POST http://localhost:5003/api/report/download \
  -H "Content-Type: application/json" \
  -d '{"test_id": "YOUR_TEST_ID", "format": "pdf"}' \
  --output report.pdf

# Generate CSV report
curl -X POST http://localhost:5003/api/report/download \
  -H "Content-Type: application/json" \
  -d '{"test_id": "YOUR_TEST_ID", "format": "csv"}' \
  --output report.csv
```

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/demo-agents` | List available demo agents |
| GET | `/api/test-scenarios` | List test scenarios |
| POST | `/api/chat/send` | Send message to agent |
| POST | `/api/benchmark/compare` | Run comparison test |
| POST | `/api/report/generate` | Generate report data |
| POST | `/api/report/download` | Download report file |
| GET | `/api/report/list` | List available reports |
| GET | `/api/governance/metrics` | Get governance metrics |

## Demo Agents

1. **Baseline Agent** (`baseline_agent`) - Simple responses for baseline comparison
2. **Factual Agent** (`factual_agent`) - Focuses on accuracy and fact-checking
3. **Creative Agent** (`creative_agent`) - Emphasizes creativity and innovation
4. **Governance-Focused Agent** (`governance_focused_agent`) - Built-in compliance awareness
5. **Multi-Tool Agent** (`multi_tool_agent`) - Demonstrates tool integration

## Test Scenarios

1. **Customer Service** (`customer_service`) - Handle complaints professionally
2. **Financial Advice** (`financial_advice`) - Provide guidance with compliance
3. **Healthcare Information** (`healthcare_information`) - Avoid medical diagnosis
4. **Content Moderation** (`content_moderation`) - Review user content
5. **Creative Writing** (`creative_writing`) - Generate appropriate content

## Report Formats

- **PDF**: Professional formatted reports with charts and analysis
- **CSV**: Data export for spreadsheet analysis
- **JSON**: Complete test data for programmatic access

## Integration with Frontend

The API is designed to work with the React frontend at:
`/home/ubuntu/promethios/phase_7_1_prototype/promethios-ui/src/pages/CMUBenchmarkPage.tsx`

Update the API base URL in the frontend to: `http://localhost:5003`

## Troubleshooting

### Port Conflicts
If port 5003 is in use, change the port in `app.py`:
```python
app.run(host=\'0.0.0.0\', port=5004, debug=True)
```

### Missing Dependencies
Install required packages:
```bash
pip3 install flask flask-cors requests reportlab
```

### Report Generation Issues
Reports are saved to `/tmp/benchmark_reports/` - ensure directory exists:
```bash
mkdir -p /tmp/benchmark_reports
```

## Security Notes

- This is a development server - use a production WSGI server for deployment
- CORS is enabled for all origins - restrict in production
- No authentication implemented - add security for production use

---

**Deployment Guide Version**: 1.0
**Last Updated**: June 14, 2025

