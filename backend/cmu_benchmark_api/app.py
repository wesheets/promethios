import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import asyncio

from cmu_benchmark_service.cmu_benchmark_service import CMUBenchmarkService
from demo_agent_wrapper import DemoAgentWrapper

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize services
# In a real scenario, these would be properly configured and potentially injected
benchmark_service = CMUBenchmarkService()

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "CMU Benchmark API is running"})

@app.route("/api/demo-agents", methods=["GET"])
def get_demo_agents():
    agents = [
        {"id": "baseline_agent", "name": "Baseline Agent", "description": "A standard agent for baseline comparisons."},
        {"id": "factual_agent", "name": "Factual Agent", "description": "An agent focused on providing accurate and factual information."},
        {"id": "creative_agent", "name": "Creative Agent", "description": "An agent designed for creative and imaginative tasks."},
        {"id": "governance_focused_agent", "name": "Governance-Focused Agent", "description": "An agent with built-in awareness of governance policies."},
        {"id": "multi_tool_agent", "name": "Multi-Tool Agent", "description": "An agent capable of using multiple external tools."}
    ]
    return jsonify(agents)

@app.route("/api/test-scenarios", methods=["GET"])
def get_test_scenarios():
    scenarios = [
        {"id": "customer_service", "name": "Customer Service", "description": "Scenario for handling customer inquiries and complaints."},
        {"id": "financial_advice", "name": "Financial Advice", "description": "Scenario for providing financial guidance with compliance."},
        {"id": "healthcare_information", "name": "Healthcare Information", "description": "Scenario for providing health-related information without medical diagnosis."},
        {"id": "content_moderation", "name": "Content Moderation", "description": "Scenario for moderating user-generated content."},
        {"id": "creative_writing", "name": "Creative Writing", "description": "Scenario for generating creative text while adhering to guidelines."}
    ]
    return jsonify(scenarios)

@app.route("/api/chat/send", methods=["POST"])
async def send_chat_message():
    data = request.get_json()
    agent_id = data.get("agent_id")
    message = data.get("message")
    governance_enabled = data.get("governance_enabled", False)

    if not agent_id or not message:
        return jsonify({"success": False, "error": "agent_id and message are required"}), 400

    try:
        response = await benchmark_service.run_agent_interaction(
            agent_id=agent_id,
            message=message,
            governance_enabled=governance_enabled
        )
        return jsonify({"success": True, "response": response})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/benchmark/compare", methods=["POST"])
async def run_comparison():
    data = request.get_json()
    agent_id = data.get("agent_id")
    scenario_id = data.get("scenario_id")
    test_name = data.get("test_name", f"Comparison Test for {agent_id} in {scenario_id}")

    if not agent_id or not scenario_id:
        return jsonify({"success": False, "error": "agent_id and scenario_id are required"}), 400

    try:
        comparison_result = await benchmark_service.run_comparison_test(
            agent_id=agent_id,
            scenario_id=scenario_id,
            test_name=test_name
        )
        return jsonify({"success": True, "comparison_result": comparison_result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/governance/metrics", methods=["GET"])
def get_governance_metrics():
    try:
        test_id = request.args.get("test_id")
        agent_id = request.args.get("agent_id")
        
        metrics = benchmark_service.get_governance_metrics(test_id=test_id, agent_id=agent_id)
        return jsonify({"success": True, "metrics": metrics})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/report/download", methods=["POST"])
def download_report():
    """Generate and download a report file"""
    try:
        data = request.get_json()
        test_id = data.get("test_id")
        format_type = data.get("format", "pdf")
        
        if not test_id:
            return jsonify({"success": False, "error": "test_id is required"}), 400
        
        # Generate report file
        report_path = benchmark_service.generate_report(test_id, format_type)
        
        if not report_path:
            return jsonify({"success": False, "error": "Report generation failed or test not found"}), 404
        
        # Return file for download
        from flask import send_file
        import os
        
        if os.path.exists(report_path):
            return send_file(
                report_path,
                as_attachment=True,
                download_name=f"benchmark_report_{test_id}.{format_type}",
                mimetype="application/octet-stream"
            )
        else:
            return jsonify({"success": False, "error": "Report file not found"}), 404
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/report/list", methods=["GET"])
def list_reports():
    """List all available test results"""
    try:
        test_results = benchmark_service.list_test_results()
        return jsonify({"success": True, "test_results": test_results})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    # Ensure the app listens on all interfaces for external access
    app.run(host="0.0.0.0", port=5003, debug=True)


