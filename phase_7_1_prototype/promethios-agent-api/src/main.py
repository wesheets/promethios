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
from src.routes.trust_boundaries import trust_boundaries_bp
from src.routes.reporting_integration import reporting_bp
from src.routes.veritas_enterprise import veritas_enterprise_bp
from src.routes.deployment import deployment_bp
# from src.routes.native_llm import native_llm_bp  # File doesn't exist - commented out
from src.routes.promethios_llm import promethios_llm_bp

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
app.register_blueprint(trust_boundaries_bp)
app.register_blueprint(reporting_bp, url_prefix='/api/reporting')
app.register_blueprint(veritas_enterprise_bp)
app.register_blueprint(deployment_bp, url_prefix='/api')
app.register_blueprint(promethios_llm_bp, url_prefix='/api')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database (using single db instance)
db.init_app(app)

with app.app_context():
    db.create_all()

# Register audit endpoint at root level for UniversalGovernanceAdapter (after DB init)
@app.route('/audit/log', methods=['POST'])
def root_audit_log():
    """Root level audit log endpoint for UniversalGovernanceAdapter"""
    from flask import request, jsonify
    from datetime import datetime
    import uuid
    
    try:
        data = request.get_json()
        
        # Extract audit data
        agent_id = data.get('agentId')
        action = data.get('action')
        details = data.get('details', {})
        
        print(f"📝 [Audit] Creating audit entry for agent {agent_id}: {action}")
        
        # Create audit log entry using existing models
        audit_log = AgentLog(
            agent_id=agent_id,
            log_type='governance_audit',
            message=f"Governance action: {action}",
            metadata=details,
            timestamp=datetime.utcnow()
        )
        
        db.session.add(audit_log)
        db.session.commit()
        
        print(f"✅ [Audit] Audit entry created successfully")
        
        return jsonify({
            'success': True,
            'audit_id': audit_log.id,
            'timestamp': audit_log.timestamp.isoformat()
        }), 200
        
    except Exception as e:
        print(f"❌ [Audit] Failed to create audit entry: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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
    port = int(os.environ.get('PORT', 5004))
    app.run(host='0.0.0.0', port=port, debug=False)

