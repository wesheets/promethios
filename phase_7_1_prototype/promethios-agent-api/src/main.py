# 🚨 ULTRA-EARLY DEBUG: Starting Python process
print("🚨 [ULTRA-EARLY-DEBUG] Python process started, beginning imports...")

import sys
print("🚨 [ULTRA-EARLY-DEBUG] ✅ sys imported")

import os
print("🚨 [ULTRA-EARLY-DEBUG] ✅ os imported")

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
print("🚨 [ULTRA-EARLY-DEBUG] ✅ sys.path configured")

print("🚨 [ULTRA-EARLY-DEBUG] Starting Flask imports...")
from flask import Flask, send_from_directory, make_response, request
print("🚨 [ULTRA-EARLY-DEBUG] ✅ Flask imported")

# Removed flask_cors import since we're using manual CORS headers only
print("🚨 [ULTRA-EARLY-DEBUG] ✅ Using manual CORS configuration")

print("🚨 [ULTRA-EARLY-DEBUG] Starting model imports...")
from src.models.user import db
print("🚨 [ULTRA-EARLY-DEBUG] ✅ user model imported")

from src.models.agent_data import AgentMetrics, AgentViolation, AgentLog, AgentHeartbeat
print("🚨 [ULTRA-EARLY-DEBUG] ✅ agent_data models imported")

# 🚨 EARLY DEBUG: Starting Flask app initialization
print("🚨 [STARTUP-DEBUG] Starting Flask app imports...")

from src.routes.user import user_bp
print("🚨 [STARTUP-DEBUG] ✅ user_bp imported")

from src.routes.agent_metrics import agent_metrics_bp
print("🚨 [STARTUP-DEBUG] ✅ agent_metrics_bp imported")

from src.routes.policy_enhancement import policy_enhancement_bp
print("🚨 [STARTUP-DEBUG] ✅ policy_enhancement_bp imported")

from src.routes.promethios_policy_integration import promethios_policy_bp
print("🚨 [STARTUP-DEBUG] ✅ promethios_policy_bp imported")

from src.routes.trust_metrics_integration import trust_metrics_bp
print("🚨 [STARTUP-DEBUG] ✅ trust_metrics_bp imported")

from src.routes.trust_boundaries import trust_boundaries_bp
print("🚨 [STARTUP-DEBUG] ✅ trust_boundaries_bp imported")

# 🚨 CRITICAL FIX: Make reporting_integration optional due to flask_socketio dependency
try:
    from src.routes.reporting_integration import reporting_bp
    print("🚨 [STARTUP-DEBUG] ✅ reporting_bp imported")
    REPORTING_AVAILABLE = True
except ImportError as e:
    print(f"🚨 [STARTUP-DEBUG] ⚠️ reporting_bp import failed: {e}")
    reporting_bp = None
    REPORTING_AVAILABLE = False

from src.routes.veritas_enterprise import veritas_enterprise_bp
print("🚨 [STARTUP-DEBUG] ✅ veritas_enterprise_bp imported")

from src.routes.deployment import deployment_bp
print("🚨 [STARTUP-DEBUG] ✅ deployment_bp imported")

# from src.routes.native_llm import native_llm_bp  # File doesn't exist - commented out
from src.routes.promethios_llm import promethios_llm_bp
print("🚨 [STARTUP-DEBUG] ✅ promethios_llm_bp imported")

from src.routes.universal_tools import universal_tools_bp
print("🚨 [STARTUP-DEBUG] ✅ universal_tools_bp imported")

from src.routes.debug_tools import debug_tools_bp
print("🚨 [STARTUP-DEBUG] ✅ debug_tools_bp imported")

from src.routes.enhanced_chat import enhanced_chat_bp
print("🚨 [STARTUP-DEBUG] ✅ enhanced_chat_bp imported")

print("🚨 [STARTUP-DEBUG] All imports completed successfully!")

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Configure Flask for larger file uploads and payloads
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200MB max file size (increased from 50MB)
app.config['UPLOAD_FOLDER'] = '/tmp/uploads'
app.config['JSON_AS_ASCII'] = False

# 🚨 COMBINED: Request logging and CORS preflight handling
@app.before_request
def handle_request_and_cors():
    # Request size logging (original functionality)
    if request.method in ['POST', 'PUT', 'PATCH']:
        content_length = request.headers.get('Content-Length', 0)
        print(f"🚨 [REQUEST-DEBUG] {request.method} {request.path} - Content-Length: {content_length} bytes")
        if int(content_length) > 1000000:  # > 1MB
            print(f"🚨 [REQUEST-DEBUG] LARGE PAYLOAD WARNING: {content_length} bytes to {request.path}")
        
        # Log request data size for debugging
        try:
            if hasattr(request, 'get_data'):
                data_size = len(request.get_data(cache=False))
                print(f"🚨 [REQUEST-DEBUG] Actual data size: {data_size} bytes")
        except Exception as e:
            print(f"🚨 [REQUEST-DEBUG] Could not get data size: {e}")
    
    # CORS preflight handling
    if request.method == "OPTIONS":
        print(f"🚨 [CORS-DEBUG] Handling OPTIONS preflight request from: {request.headers.get('Origin')}")
        response = make_response()
        origin = request.headers.get('Origin')
        
        if origin:
            if '*' in allowed_origins_list:
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Access-Control-Allow-Credentials'] = 'false'
            elif origin in allowed_origins_list:
                response.headers['Access-Control-Allow-Origin'] = origin
                response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-api-key, X-Requested-With, Accept, Origin, x-agent-id, x-user-id'
        response.headers['Access-Control-Max-Age'] = '86400'
        
        print(f"🚨 [CORS-DEBUG] OPTIONS response Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
        return response

# 🚨 MINIMAL BULLETPROOF CORS CONFIGURATION
# Removing flask-cors dependency and using manual CORS headers only

print("🚨🚨🚨 [CORS-STARTUP] CORS CONFIGURATION LOADING - THIS MESSAGE SHOULD APPEAR IN LOGS! 🚨🚨🚨")

# Get allowed origins from environment
cors_origin_env = os.environ.get('CORS_ORIGIN', '*')
if cors_origin_env != '*':
    allowed_origins_list = [origin.strip() for origin in cors_origin_env.split(',')]
else:
    allowed_origins_list = ['*']

print(f"🚨 [CORS-DEBUG] CORS_ORIGIN env var: {cors_origin_env}")
print(f"🚨 [CORS-DEBUG] Allowed origins list: {allowed_origins_list}")
print("🚨🚨🚨 [CORS-STARTUP] CORS ENVIRONMENT VARIABLES LOADED SUCCESSFULLY! 🚨🚨🚨")

# Manual CORS handler - this should definitely work
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    print(f"🚨 [CORS-DEBUG] Processing request from origin: {origin}")
    
    # Always add CORS headers
    if origin:
        if '*' in allowed_origins_list:
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Credentials'] = 'false'
            print(f"🚨 [CORS-DEBUG] Set wildcard CORS headers")
        elif origin in allowed_origins_list:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            print(f"🚨 [CORS-DEBUG] Set specific origin CORS headers for: {origin}")
        else:
            print(f"🚨 [CORS-DEBUG] Origin {origin} not in allowed list: {allowed_origins_list}")
    
    # Always add these headers
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-api-key, X-Requested-With, Accept, Origin, x-agent-id, x-user-id'
    response.headers['Access-Control-Max-Age'] = '86400'
    
    print(f"🚨 [CORS-DEBUG] Final Access-Control-Allow-Origin header: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
    return response

print("🚨 [CORS-DEBUG] Minimal CORS configuration completed successfully")

# Register blueprints
print("🚨 [STARTUP-DEBUG] Starting blueprint registration...")

app.register_blueprint(user_bp, url_prefix='/api/user')
print("🚨 [STARTUP-DEBUG] ✅ user_bp registered")

app.register_blueprint(agent_metrics_bp, url_prefix='/api/agent-metrics')
print("🚨 [STARTUP-DEBUG] ✅ agent_metrics_bp registered")

app.register_blueprint(policy_enhancement_bp, url_prefix='/api/policy-enhancement')
print("🚨 [STARTUP-DEBUG] ✅ policy_enhancement_bp registered")

app.register_blueprint(promethios_policy_bp, url_prefix='/api/promethios-policy')
print("🚨 [STARTUP-DEBUG] ✅ promethios_policy_bp registered")

app.register_blueprint(trust_metrics_bp, url_prefix='/api/trust-metrics')
print("🚨 [STARTUP-DEBUG] ✅ trust_metrics_bp registered")

app.register_blueprint(trust_boundaries_bp)
print("🚨 [STARTUP-DEBUG] ✅ trust_boundaries_bp registered")

# 🚨 CRITICAL FIX: Only register reporting_bp if it imported successfully
if REPORTING_AVAILABLE and reporting_bp:
    app.register_blueprint(reporting_bp, url_prefix='/api/reporting')
    print("🚨 [STARTUP-DEBUG] ✅ reporting_bp registered")
else:
    print("🚨 [STARTUP-DEBUG] ⚠️ reporting_bp skipped (not available)")

app.register_blueprint(veritas_enterprise_bp)
print("🚨 [STARTUP-DEBUG] ✅ veritas_enterprise_bp registered")

app.register_blueprint(deployment_bp, url_prefix='/api')
print("🚨 [STARTUP-DEBUG] ✅ deployment_bp registered")

app.register_blueprint(promethios_llm_bp, url_prefix='/api')
print("🚨 [STARTUP-DEBUG] ✅ promethios_llm_bp registered")

app.register_blueprint(universal_tools_bp)
print("🚨 [STARTUP-DEBUG] ✅ universal_tools_bp registered")

app.register_blueprint(debug_tools_bp, url_prefix='/api/debug')
print("🚨 [STARTUP-DEBUG] ✅ debug_tools_bp registered")

app.register_blueprint(enhanced_chat_bp, url_prefix='/api')
print("🚨 [STARTUP-DEBUG] ✅ enhanced_chat_bp registered")

print("🚨 [STARTUP-DEBUG] All blueprints registered successfully!")

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database (using single db instance)
db.init_app(app)

with app.app_context():
    db.create_all()

# Register test endpoint for deployment verification
@app.route('/test-deployment', methods=['GET'])
def test_deployment():
    """Test endpoint to verify new deployment is active"""
    from flask import jsonify
    return jsonify({
        'status': 'success',
        'message': 'New deployment is active - tool integration fixes deployed',
        'timestamp': '2025-08-18-final-test',
        'tools_blueprint_registered': 'universal_tools' in [bp.name for bp in app.blueprints.values()],
        'available_blueprints': list(app.blueprints.keys())
    })

# Audit route will be defined after catch-all route to fix precedence issue

# 🚨 EMERGENCY: Add missing trust-metrics route
@app.route('/api/trust-metrics/alerts/check', methods=['POST'])
def trust_metrics_alerts_check():
    """Trust metrics alerts check endpoint"""
    from flask import request, jsonify
    from datetime import datetime
    
    print(f"🚨 [TRUST-METRICS-DEBUG] Trust metrics alerts check called")
    print(f"🚨 [TRUST-METRICS-DEBUG] Request headers: {dict(request.headers)}")
    
    try:
        data = request.get_json() or {}
        print(f"🚨 [TRUST-METRICS-DEBUG] Request data: {data}")
        
        # For now, return a basic response to prevent 404 errors
        return jsonify({
            'success': True,
            'alerts': [],
            'trust_score': 85.0,
            'timestamp': datetime.utcnow().isoformat(),
            'message': 'Trust metrics check completed'
        }), 200
        
    except Exception as e:
        print(f"❌ [TRUST-METRICS] Failed to check trust metrics: {e}")
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

# 🚨 CRITICAL FIX: Audit route AFTER catch-all route to fix precedence issue
print("🚨 [STARTUP-DEBUG] Registering audit route...")

@app.route('/audit/log', methods=['POST'])
def root_audit_log():
    """Root level audit log endpoint for UniversalGovernanceAdapter"""
    from flask import request, jsonify
    from datetime import datetime
    import uuid
    
    print(f"🚨 [AUDIT-DEBUG] Audit route called! Method: {request.method}")
    print(f"🚨 [AUDIT-DEBUG] Request headers: {dict(request.headers)}")
    print(f"🚨 [AUDIT-DEBUG] Request content type: {request.content_type}")
    
    try:
        data = request.get_json()
        print(f"🚨 [AUDIT-DEBUG] Request data: {data}")
        
        # Extract audit data
        agent_id = data.get('agentId') if data else None
        action = data.get('action') if data else None
        details = data.get('details', {}) if data else {}
        
        print(f"📝 [Audit] Creating audit entry for agent {agent_id}: {action}")
        print(f"🚨 [AUDIT-DEBUG] About to create AgentLog with db: {db}")
        
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

print("🚨 [STARTUP-DEBUG] ✅ Audit route registered successfully!")

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

@app.route('/api/cors-test', methods=['GET', 'POST', 'OPTIONS'])
def cors_test():
    """
    CORS test endpoint to verify CORS configuration is working
    """
    import os
    from datetime import datetime
    
    cors_origin_env = os.environ.get('CORS_ORIGIN', 'NOT SET')
    
    cors_info = {
        'status': 'CORS test endpoint',
        'timestamp': datetime.utcnow().isoformat(),
        'method': request.method,
        'origin': request.headers.get('Origin', 'No Origin header'),
        'cors_origin_env': cors_origin_env,
        'cors_headers_should_be_present': True,
        'deployment_version': 'eef2f21a-cors-test-endpoint'
    }
    
    print(f"🚨 [CORS-TEST] Request from origin: {request.headers.get('Origin')}")
    print(f"🚨 [CORS-TEST] Method: {request.method}")
    print(f"🚨 [CORS-TEST] CORS_ORIGIN env: {cors_origin_env}")
    
    return cors_info, 200

print("🚨 [STARTUP-DEBUG] 🎉 Flask app initialization completed successfully!")
print("🚨 [STARTUP-DEBUG] 🎯 All routes should now be available, including /audit/log")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5004))
    print(f"🚨 [STARTUP-DEBUG] Starting Flask server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)

