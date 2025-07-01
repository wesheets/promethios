"""
Agent Metrics API Routes
Receives metrics, violations, logs, and heartbeats from deployed governance wrappers
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import os
from src.models.agent_data import db, AgentMetrics, AgentViolation, AgentLog, AgentHeartbeat
from functools import wraps

agent_metrics_bp = Blueprint('agent_metrics', __name__)

# API Key validation decorator
def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({'error': 'API key required'}), 401
        
        # Validate API key (in production, this would check against a database)
        # For now, we'll accept any key that starts with 'promethios_'
        if not api_key.startswith('promethios_'):
            return jsonify({'error': 'Invalid API key'}), 401
        
        # Extract agent ID from API key (format: promethios_{userId}_{agentId}_{timestamp})
        try:
            parts = api_key.split('_')
            if len(parts) >= 4:
                # For key like 'promethios_test_user_123_test_agent_456_1672531200'
                # We need to reconstruct the user_id and agent_id from multiple parts
                user_parts = []
                agent_parts = []
                timestamp_part = parts[-1]  # Last part is timestamp
                
                # Find where 'agent' appears to split user and agent parts
                agent_index = -1
                for i, part in enumerate(parts[1:-1], 1):  # Skip 'promethios' and timestamp
                    if part == 'agent':
                        agent_index = i
                        break
                
                if agent_index > 0:
                    # Everything before 'agent' is user_id
                    user_parts = parts[1:agent_index]
                    # Everything from 'agent' to before timestamp is agent_id
                    agent_parts = parts[agent_index:-1]
                    
                    request.user_id = '_'.join(user_parts)
                    request.agent_id = '_'.join(agent_parts)
                else:
                    # Fallback: assume format is promethios_userId_agentId_timestamp
                    request.user_id = parts[1]
                    request.agent_id = parts[2]
            else:
                return jsonify({'error': 'Invalid API key format'}), 401
        except:
            return jsonify({'error': 'Invalid API key format'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

@agent_metrics_bp.route('/heartbeat', methods=['POST'])
@require_api_key
def receive_heartbeat():
    """
    Receive heartbeat from deployed governance wrapper
    """
    try:
        data = request.get_json()
        print(f"DEBUG: Received heartbeat data: {data}")
        print(f"DEBUG: Agent ID: {request.agent_id}, User ID: {request.user_id}")
        
        # Create heartbeat record
        heartbeat = AgentHeartbeat(
            agent_id=request.agent_id,
            user_id=request.user_id,
            deployment_id=data.get('deployment_id'),
            status=data.get('status', 'online'),
            version=data.get('version'),
            environment=data.get('environment'),
            system_info=json.dumps(data.get('system_info', {})),
            timestamp=datetime.utcnow()
        )
        
        print(f"DEBUG: Created heartbeat object: {heartbeat}")
        
        db.session.add(heartbeat)
        db.session.commit()
        
        print("DEBUG: Heartbeat saved successfully")
        
        return jsonify({
            'status': 'success',
            'message': 'Heartbeat received',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        print(f"ERROR in heartbeat: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@agent_metrics_bp.route('/metrics', methods=['POST'])
@require_api_key
def receive_metrics():
    """
    Receive governance and performance metrics from deployed wrapper
    """
    try:
        data = request.get_json()
        print(f"DEBUG: Received metrics data: {data}")
        
        # Create metrics record
        metrics = AgentMetrics(
            agent_id=request.agent_id,
            user_id=request.user_id,
            deployment_id=data.get('deployment_id'),
            
            # Governance metrics (from wrapper)
            trust_score=data.get('governance_metrics', {}).get('trust_score', 0.0),
            compliance_rate=data.get('governance_metrics', {}).get('compliance_rate', 0.0),
            violation_count=data.get('governance_metrics', {}).get('violation_count', 0),
            policy_violations=json.dumps(data.get('governance_metrics', {}).get('policy_violations', [])),
            
            # Performance metrics (from agent + wrapper)
            response_time=data.get('performance_metrics', {}).get('response_time', 0.0),
            throughput=data.get('performance_metrics', {}).get('throughput', 0.0),
            error_rate=data.get('performance_metrics', {}).get('error_rate', 0.0),
            uptime=data.get('performance_metrics', {}).get('uptime', 0.0),
            
            # System metrics (from wrapper monitoring)
            cpu_usage=data.get('system_metrics', {}).get('cpu_usage', 0.0),
            memory_usage=data.get('system_metrics', {}).get('memory_usage', 0.0),
            disk_usage=data.get('system_metrics', {}).get('disk_usage', 0.0),
            network_io=data.get('system_metrics', {}).get('network_io', 0.0),
            
            # Business metrics (from agent + wrapper)
            request_count=data.get('business_metrics', {}).get('request_count', 0),
            user_interactions=data.get('business_metrics', {}).get('user_interactions', 0),
            success_rate=data.get('business_metrics', {}).get('success_rate', 0.0),
            revenue=data.get('business_metrics', {}).get('revenue'),
            
            timestamp=datetime.utcnow()
        )
        
        print(f"DEBUG: Created metrics object: {metrics}")
        
        db.session.add(metrics)
        db.session.commit()
        
        print("DEBUG: Metrics saved successfully")
        
        return jsonify({
            'status': 'success',
            'message': 'Metrics received',
            'metrics_id': metrics.id,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        print(f"ERROR in metrics: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@agent_metrics_bp.route('/violations', methods=['POST'])
@require_api_key
def receive_violations():
    """
    Receive policy violations from deployed governance wrapper
    """
    try:
        data = request.get_json()
        print(f"DEBUG: Received violation data: {data}")
        
        # Handle both single violation and batch violations
        violations_data = data if isinstance(data, list) else [data]
        
        created_violations = []
        
        for violation_data in violations_data:
            print(f"DEBUG: Processing violation: {violation_data}")
            violation = AgentViolation(
                agent_id=request.agent_id,
                user_id=request.user_id,
                deployment_id=violation_data.get('deployment_id'),
                violation_type=violation_data.get('type'),
                severity=violation_data.get('severity', 'medium'),
                policy_id=violation_data.get('policy_id'),
                policy_name=violation_data.get('policy_name'),
                description=violation_data.get('description'),
                context=json.dumps(violation_data.get('context', {})),
                remediation_suggested=violation_data.get('remediation_suggested'),
                timestamp=datetime.utcnow()
            )
            
            print(f"DEBUG: Created violation object: {violation}")
            db.session.add(violation)
            created_violations.append(violation)
        
        db.session.commit()
        print("DEBUG: Violations saved successfully")
        
        return jsonify({
            'status': 'success',
            'message': f'{len(created_violations)} violation(s) received',
            'violation_ids': [v.id for v in created_violations],
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        print(f"ERROR in violations: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@agent_metrics_bp.route('/logs', methods=['POST'])
@require_api_key
def receive_logs():
    """
    Receive logs from deployed governance wrapper
    """
    try:
        data = request.get_json()
        
        # Handle both single log and batch logs
        logs_data = data if isinstance(data, list) else [data]
        
        created_logs = []
        
        for log_data in logs_data:
            log_entry = AgentLog(
                agent_id=request.agent_id,
                user_id=request.user_id,
                deployment_id=log_data.get('deployment_id'),
                level=log_data.get('level', 'info'),
                category=log_data.get('category', 'general'),
                source=log_data.get('source', 'wrapper'),
                message=log_data.get('message'),
                log_metadata=json.dumps(log_data.get('metadata', {})),
                timestamp=datetime.utcnow()
            )
            
            db.session.add(log_entry)
            created_logs.append(log_entry)
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': f'{len(created_logs)} log(s) received',
            'log_ids': [l.id for l in created_logs],
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agent_metrics_bp.route('/status/<agent_id>', methods=['GET'])
def get_agent_status(agent_id):
    """
    Get current status of a deployed agent (public endpoint for monitoring)
    """
    try:
        # Get latest heartbeat
        latest_heartbeat = AgentHeartbeat.query.filter_by(
            agent_id=agent_id
        ).order_by(AgentHeartbeat.timestamp.desc()).first()
        
        if not latest_heartbeat:
            return jsonify({
                'agent_id': agent_id,
                'status': 'unknown',
                'message': 'No heartbeat data available'
            }), 404
        
        # Check if agent is online (heartbeat within last 5 minutes)
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        is_online = latest_heartbeat.timestamp > five_minutes_ago
        
        # Get latest metrics
        latest_metrics = AgentMetrics.query.filter_by(
            agent_id=agent_id
        ).order_by(AgentMetrics.timestamp.desc()).first()
        
        # Get recent violations (last 24 hours)
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        recent_violations = AgentViolation.query.filter(
            AgentViolation.agent_id == agent_id,
            AgentViolation.timestamp > twenty_four_hours_ago
        ).count()
        
        return jsonify({
            'agent_id': agent_id,
            'status': 'online' if is_online else 'offline',
            'last_heartbeat': latest_heartbeat.timestamp.isoformat(),
            'deployment_id': latest_heartbeat.deployment_id,
            'version': latest_heartbeat.version,
            'environment': latest_heartbeat.environment,
            'governance_metrics': {
                'trust_score': latest_metrics.trust_score if latest_metrics else None,
                'compliance_rate': latest_metrics.compliance_rate if latest_metrics else None,
                'recent_violations': recent_violations
            } if latest_metrics else None,
            'last_metrics_update': latest_metrics.timestamp.isoformat() if latest_metrics else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agent_metrics_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for the API
    """
    return jsonify({
        'status': 'healthy',
        'service': 'promethios-agent-api',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    }), 200

# Error handlers
@agent_metrics_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@agent_metrics_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@agent_metrics_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@agent_metrics_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

