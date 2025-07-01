import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.models.agent_data import AgentMetrics, AgentViolation, AgentLog, AgentHeartbeat
from src.routes.user import user_bp
from src.routes.agent_metrics import agent_metrics_bp
from src.routes.policy_enhancement import policy_enhancement_bp
from src.routes.promethios_policy_integration import promethios_policy_bp
from src.routes.trust_metrics_integration import trust_metrics_bp
from src.routes.reporting_integration import reporting_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes to allow frontend communication
CORS(app, origins="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api/user')
app.register_blueprint(agent_metrics_bp, url_prefix='/api/agent-metrics')
app.register_blueprint(policy_enhancement_bp, url_prefix='/api/policy-enhancement')
app.register_blueprint(promethios_policy_bp, url_prefix='/api/promethios-policy')
app.register_blueprint(trust_metrics_bp, url_prefix='/api/trust-metrics')
app.register_blueprint(reporting_bp, url_prefix='/api/reporting')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database (using single db instance)
db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Main health check endpoint
    """
    return {
        'status': 'healthy',
        'service': 'promethios-agent-api',
        'version': '1.0.0',
        'endpoints': {
            'agent_metrics': '/api/agents/metrics',
            'agent_violations': '/api/agents/violations', 
            'agent_logs': '/api/agents/logs',
            'agent_heartbeat': '/api/agents/heartbeat',
            'agent_status': '/api/agents/status/<agent_id>'
        }
    }, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004, debug=True)

