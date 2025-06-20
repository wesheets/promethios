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
    """Get list of available demo agents from the benchmark service"""
    try:
        agents = benchmark_service.get_demo_agents()
        return jsonify({"success": True, "agents": agents})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/test-scenarios", methods=["GET"])
def get_test_scenarios():
    """Get list of available test scenarios from the benchmark service"""
    try:
        scenarios = benchmark_service.get_test_scenarios()
        return jsonify({"success": True, "scenarios": scenarios})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/chat/send", methods=["POST"])
async def send_chat_message():
    """Send a message to an agent and get response with optional governance"""
    data = request.get_json()
    agent_id = data.get("agent_id")
    message = data.get("message")
    governance_enabled = data.get("governance_enabled", False)
    scenario_id = data.get("scenario_id")

    if not agent_id or not message:
        return jsonify({"success": False, "error": "agent_id and message are required"}), 400

    try:
        response = await benchmark_service.send_message_to_agent(
            agent_id=agent_id,
            message=message,
            governance_enabled=governance_enabled,
            scenario_id=scenario_id
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


