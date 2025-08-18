import os
import sys
import os
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, make_response, request
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
from src.routes.universal_tools import universal_tools_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Configure Flask for larger file uploads and payloads
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
app.config['UPLOAD_FOLDER'] = '/tmp/uploads'
app.config['JSON_AS_ASCII'] = False

# Enable CORS for all routes to allow frontend communication
# Include x-api-key header for tools integration API access
CORS(app, 
     origins="*", 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "x-api-key", "X-Requested-With"],
     supports_credentials=True,
     max_age=86400)  # Cache preflight for 24 hours

# Add explicit OPTIONS handler for preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,x-api-key,X-Requested-With")
        response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
        return response

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
app.register_blueprint(universal_tools_bp)

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

# Chat History Persistence Endpoints
@app.route('/api/chat/history', methods=['GET', 'POST'])
def chat_history():
    """Chat history persistence endpoint"""
    from flask import request, jsonify
    from datetime import datetime
    import json
    
    if request.method == 'GET':
        # Get chat history for an agent
        agent_id = request.args.get('agent_id')
        session_id = request.args.get('session_id')
        
        if not agent_id:
            return jsonify({'error': 'agent_id is required'}), 400
        
        try:
            # Query chat logs for the agent
            logs = AgentLog.query.filter_by(
                agent_id=agent_id,
                log_type='chat_message'
            ).order_by(AgentLog.timestamp.desc()).limit(100).all()
            
            chat_history = []
            for log in logs:
                chat_history.append({
                    'id': log.id,
                    'message': log.message,
                    'metadata': log.metadata,
                    'timestamp': log.timestamp.isoformat()
                })
            
            return jsonify({
                'success': True,
                'agent_id': agent_id,
                'session_id': session_id,
                'history': chat_history
            }), 200
            
        except Exception as e:
            print(f"❌ [ChatHistory] Failed to get chat history: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    elif request.method == 'POST':
        # Save chat message to history
        try:
            data = request.get_json()
            
            agent_id = data.get('agent_id')
            session_id = data.get('session_id')
            message_data = data.get('message_data', {})
            
            if not agent_id:
                return jsonify({'error': 'agent_id is required'}), 400
            
            # Create chat log entry
            chat_log = AgentLog(
                agent_id=agent_id,
                log_type='chat_message',
                message=message_data.get('content', ''),
                metadata={
                    'session_id': session_id,
                    'role': message_data.get('role', 'user'),
                    'timestamp': message_data.get('timestamp'),
                    'attachments': message_data.get('attachments', []),
                    'governance_data': message_data.get('governance_data', {})
                },
                timestamp=datetime.utcnow()
            )
            
            db.session.add(chat_log)
            db.session.commit()
            
            print(f"✅ [ChatHistory] Chat message saved for agent {agent_id}")
            
            return jsonify({
                'success': True,
                'message_id': chat_log.id,
                'timestamp': chat_log.timestamp.isoformat()
            }), 200
            
        except Exception as e:
            print(f"❌ [ChatHistory] Failed to save chat message: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

@app.route('/api/chat/sessions', methods=['GET', 'POST'])
def chat_sessions():
    """Chat session management endpoint"""
    from flask import request, jsonify
    from datetime import datetime
    import uuid
    
    if request.method == 'GET':
        # Get chat sessions for an agent
        agent_id = request.args.get('agent_id')
        
        if not agent_id:
            return jsonify({'error': 'agent_id is required'}), 400
        
        try:
            # Get unique session IDs from chat logs
            sessions = db.session.query(AgentLog.metadata).filter(
                AgentLog.agent_id == agent_id,
                AgentLog.log_type == 'chat_message'
            ).distinct().all()
            
            session_list = []
            for session in sessions:
                if session.metadata and 'session_id' in session.metadata:
                    session_list.append({
                        'session_id': session.metadata['session_id'],
                        'agent_id': agent_id
                    })
            
            return jsonify({
                'success': True,
                'agent_id': agent_id,
                'sessions': session_list
            }), 200
            
        except Exception as e:
            print(f"❌ [ChatSessions] Failed to get chat sessions: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    elif request.method == 'POST':
        # Create new chat session
        try:
            data = request.get_json()
            agent_id = data.get('agent_id')
            
            if not agent_id:
                return jsonify({'error': 'agent_id is required'}), 400
            
            session_id = f"session_{int(datetime.now().timestamp())}_{str(uuid.uuid4())[:8]}"
            
            # Create session start log
            session_log = AgentLog(
                agent_id=agent_id,
                log_type='chat_session',
                message=f"Chat session started: {session_id}",
                metadata={
                    'session_id': session_id,
                    'action': 'session_start'
                },
                timestamp=datetime.utcnow()
            )
            
            db.session.add(session_log)
            db.session.commit()
            
            print(f"✅ [ChatSessions] New chat session created: {session_id}")
            
            return jsonify({
                'success': True,
                'session_id': session_id,
                'agent_id': agent_id,
                'timestamp': session_log.timestamp.isoformat()
            }), 200
            
        except Exception as e:
            print(f"❌ [ChatSessions] Failed to create chat session: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

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

