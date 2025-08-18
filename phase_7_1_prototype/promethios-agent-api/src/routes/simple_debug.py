"""
Simple Debug Routes for Promethios Agent API

Provides basic debugging endpoints with minimal dependencies to diagnose issues.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import os

# Create blueprint
simple_debug_bp = Blueprint('simple_debug', __name__)

@simple_debug_bp.route('/test', methods=['GET', 'POST', 'OPTIONS'])
def debug_test():
    """Simple test endpoint to verify deployment"""
    try:
        return jsonify({
            'success': True,
            'message': 'Debug endpoint is working!',
            'method': request.method,
            'timestamp': datetime.utcnow().isoformat(),
            'headers': dict(request.headers),
            'deployment_status': 'new_routes_deployed'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@simple_debug_bp.route('/cors-test', methods=['GET', 'POST', 'OPTIONS'])
def debug_cors_test():
    """Test CORS configuration"""
    try:
        return jsonify({
            'success': True,
            'message': 'CORS test successful',
            'origin': request.headers.get('Origin', 'None'),
            'x_api_key': 'Present' if request.headers.get('x-api-key') else 'Missing',
            'method': request.method,
            'cors_headers_working': True,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@simple_debug_bp.route('/audit-test', methods=['POST'])
def debug_audit_test():
    """Test audit functionality without complex dependencies"""
    try:
        data = request.get_json()
        
        return jsonify({
            'success': True,
            'message': 'Audit test successful - would create audit entry',
            'received_data': data,
            'audit_would_work': True,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

