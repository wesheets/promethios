"""
Universal Tools API Routes

Provides REST API endpoints for the Universal Tools Service,
following the established governance adapter pattern.
"""

from flask import Blueprint, request, jsonify
import logging
import asyncio
from datetime import datetime

# Import the Universal Tools Service
from ..services.universal_tools_service import universal_tools_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
universal_tools_bp = Blueprint('universal_tools', __name__)

@universal_tools_bp.route('/api/tools/execute', methods=['POST'])
def execute_tool():
    """
    Execute a tool with governance integration
    
    Expected payload:
    {
        "tool_id": "web_search",
        "parameters": {"query": "search term"},
        "user_message": "Please search for information about...",
        "governance_context": {...}
    }
    """
    try:
        # Parse request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        # Extract required fields
        tool_id = data.get('tool_id')
        parameters = data.get('parameters', {})
        user_message = data.get('user_message', '')
        governance_context = data.get('governance_context', {})
        
        if not tool_id:
            return jsonify({
                'success': False,
                'error': 'tool_id is required'
            }), 400
        
        logger.info(f"🛠️ [UniversalToolsAPI] Executing tool: {tool_id}")
        
        # Execute tool asynchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(
                universal_tools_service.execute_tool(
                    tool_id=tool_id,
                    parameters=parameters,
                    user_message=user_message,
                    governance_context=governance_context
                )
            )
        finally:
            loop.close()
        
        # Return result
        if result['success']:
            logger.info(f"✅ [UniversalToolsAPI] Tool '{tool_id}' executed successfully")
            return jsonify(result), 200
        else:
            logger.error(f"❌ [UniversalToolsAPI] Tool '{tool_id}' execution failed: {result.get('error')}")
            return jsonify(result), 500
            
    except Exception as e:
        logger.error(f"❌ [UniversalToolsAPI] API error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@universal_tools_bp.route('/api/tools/available', methods=['GET'])
def get_available_tools():
    """
    Get list of available tools and their configurations
    """
    try:
        logger.info("📋 [UniversalToolsAPI] Fetching available tools")
        
        result = universal_tools_service.get_available_tools()
        
        logger.info(f"✅ [UniversalToolsAPI] Returned {result['total_tools']} available tools")
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"❌ [UniversalToolsAPI] Error fetching tools: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@universal_tools_bp.route('/api/tools/<tool_id>/capabilities', methods=['GET'])
def get_tool_capabilities(tool_id):
    """
    Get detailed capabilities for a specific tool
    """
    try:
        logger.info(f"🔍 [UniversalToolsAPI] Fetching capabilities for tool: {tool_id}")
        
        result = universal_tools_service.get_tool_capabilities(tool_id)
        
        if 'error' in result:
            logger.warning(f"⚠️ [UniversalToolsAPI] Tool not found: {tool_id}")
            return jsonify(result), 404
        
        logger.info(f"✅ [UniversalToolsAPI] Returned capabilities for tool: {tool_id}")
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"❌ [UniversalToolsAPI] Error fetching tool capabilities: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@universal_tools_bp.route('/api/tools/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for the Universal Tools Service
    """
    try:
        # Get basic service status
        available_tools = universal_tools_service.get_available_tools()
        
        health_status = {
            'status': 'healthy',
            'service': 'universal_tools_service',
            'timestamp': datetime.utcnow().isoformat(),
            'tools_available': available_tools['total_tools'],
            'tools_enabled': available_tools['enabled_tools'],
            'governance_framework': 'promethios_universal',
            'version': '1.0.0'
        }
        
        logger.info("💚 [UniversalToolsAPI] Health check passed")
        return jsonify(health_status), 200
        
    except Exception as e:
        logger.error(f"❌ [UniversalToolsAPI] Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'service': 'universal_tools_service',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# Error handlers
@universal_tools_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'timestamp': datetime.utcnow().isoformat()
    }), 404

@universal_tools_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'success': False,
        'error': 'Method not allowed',
        'timestamp': datetime.utcnow().isoformat()
    }), 405

@universal_tools_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'timestamp': datetime.utcnow().isoformat()
    }), 500

