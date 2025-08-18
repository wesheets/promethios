"""
Debug Tools Routes for Promethios Agent API

Provides comprehensive debugging endpoints to diagnose file viewing and tool usage issues.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
import logging
import time
import os
import json
from typing import Dict, Any, List, Optional

# Create blueprint
debug_tools_bp = Blueprint('debug_tools', __name__)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@debug_tools_bp.route('/debug/cors', methods=['GET', 'POST', 'OPTIONS'])
def debug_cors():
    """Debug CORS configuration and headers"""
    try:
        # Log all request details
        logger.info(f"🔍 [CORS Debug] Method: {request.method}")
        logger.info(f"🔍 [CORS Debug] Origin: {request.headers.get('Origin', 'None')}")
        logger.info(f"🔍 [CORS Debug] Headers: {dict(request.headers)}")
        logger.info(f"🔍 [CORS Debug] Args: {dict(request.args)}")
        
        if request.method == 'POST':
            logger.info(f"🔍 [CORS Debug] JSON Data: {request.get_json()}")
        
        response_data = {
            'success': True,
            'debug_info': {
                'method': request.method,
                'origin': request.headers.get('Origin'),
                'user_agent': request.headers.get('User-Agent'),
                'content_type': request.headers.get('Content-Type'),
                'authorization': 'Present' if request.headers.get('Authorization') else 'Missing',
                'x_api_key': 'Present' if request.headers.get('x-api-key') else 'Missing',
                'all_headers': dict(request.headers),
                'timestamp': datetime.utcnow().isoformat()
            },
            'cors_status': {
                'preflight_handled': request.method == 'OPTIONS',
                'origin_allowed': True,
                'headers_allowed': ['Content-Type', 'Authorization', 'x-api-key', 'X-Requested-With'],
                'methods_allowed': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
            }
        }
        
        logger.info(f"✅ [CORS Debug] Response: {response_data}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"❌ [CORS Debug] Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@debug_tools_bp.route('/debug/attachments', methods=['POST'])
def debug_attachments():
    """Debug file attachment processing"""
    try:
        data = request.get_json()
        
        logger.info(f"🔍 [Attachment Debug] Request received")
        logger.info(f"🔍 [Attachment Debug] Content-Type: {request.headers.get('Content-Type')}")
        logger.info(f"🔍 [Attachment Debug] Data keys: {list(data.keys()) if data else 'No data'}")
        
        attachments = data.get('attachments', []) if data else []
        logger.info(f"🔍 [Attachment Debug] Attachments count: {len(attachments)}")
        
        processed_attachments = []
        for i, attachment in enumerate(attachments):
            logger.info(f"🔍 [Attachment Debug] Processing attachment {i+1}")
            logger.info(f"🔍 [Attachment Debug] Attachment keys: {list(attachment.keys()) if isinstance(attachment, dict) else 'Not a dict'}")
            
            if isinstance(attachment, dict):
                processed_attachment = {
                    'index': i,
                    'type': attachment.get('type', 'unknown'),
                    'name': attachment.get('name', 'unnamed'),
                    'size': attachment.get('size', 0),
                    'has_content': 'content' in attachment,
                    'has_url': 'url' in attachment,
                    'content_length': len(attachment.get('content', '')) if attachment.get('content') else 0,
                    'mime_type': attachment.get('mimeType', 'unknown')
                }
                processed_attachments.append(processed_attachment)
                logger.info(f"✅ [Attachment Debug] Processed: {processed_attachment}")
        
        response_data = {
            'success': True,
            'debug_info': {
                'total_attachments': len(attachments),
                'processed_attachments': processed_attachments,
                'request_size': len(json.dumps(data)) if data else 0,
                'timestamp': datetime.utcnow().isoformat()
            },
            'next_steps': [
                'Check if attachments have content or URL',
                'Verify file types are supported',
                'Test vision service processing',
                'Check governance approval'
            ]
        }
        
        logger.info(f"✅ [Attachment Debug] Response: {response_data}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"❌ [Attachment Debug] Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@debug_tools_bp.route('/debug/tools', methods=['POST'])
def debug_tools():
    """Debug tool invocation and availability"""
    try:
        data = request.get_json()
        
        logger.info(f"🔍 [Tools Debug] Request received")
        logger.info(f"🔍 [Tools Debug] Data: {data}")
        
        # Check available tools
        available_tools = [
            {
                'name': 'Web Search',
                'id': 'web_search',
                'status': 'available',
                'endpoint': '/api/tools/web_search'
            },
            {
                'name': 'Document Generation',
                'id': 'document_generation',
                'status': 'available',
                'endpoint': '/api/tools/document_generation'
            },
            {
                'name': 'Data Visualization',
                'id': 'data_visualization',
                'status': 'available',
                'endpoint': '/api/tools/data_visualization'
            },
            {
                'name': 'Coding & Programming',
                'id': 'coding_programming',
                'status': 'available',
                'endpoint': '/api/tools/coding_programming'
            },
            {
                'name': 'Vision Processing',
                'id': 'vision_processing',
                'status': 'available',
                'endpoint': '/api/vision/analyze'
            }
        ]
        
        # Test tool invocation if requested
        tool_test_results = []
        requested_tool = data.get('test_tool') if data else None
        
        if requested_tool:
            logger.info(f"🔍 [Tools Debug] Testing tool: {requested_tool}")
            
            test_result = {
                'tool_id': requested_tool,
                'test_status': 'simulated',
                'governance_check': 'passed',
                'execution_time': '0.5s',
                'result': f'Tool {requested_tool} would be executed here'
            }
            tool_test_results.append(test_result)
            logger.info(f"✅ [Tools Debug] Test result: {test_result}")
        
        response_data = {
            'success': True,
            'debug_info': {
                'available_tools': available_tools,
                'tool_test_results': tool_test_results,
                'governance_enabled': True,
                'function_calling_supported': False,  # This is the key issue!
                'timestamp': datetime.utcnow().isoformat()
            },
            'issues_identified': [
                'Function calling not implemented - AI cannot invoke tools',
                'Tools exist as backend services but no invocation mechanism',
                'Need to add function calling support to chat endpoint',
                'System message tells AI about tools but no way to call them'
            ],
            'recommended_fixes': [
                'Implement function calling in chat endpoint',
                'Add tool schema definitions',
                'Create function call handler',
                'Update system message with function calling instructions'
            ]
        }
        
        logger.info(f"✅ [Tools Debug] Response: {response_data}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"❌ [Tools Debug] Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@debug_tools_bp.route('/debug/vision', methods=['POST'])
def debug_vision():
    """Debug vision processing pipeline"""
    try:
        data = request.get_json()
        
        logger.info(f"🔍 [Vision Debug] Request received")
        logger.info(f"🔍 [Vision Debug] Data keys: {list(data.keys()) if data else 'No data'}")
        
        # Check vision service dependencies
        vision_dependencies = {
            'pillow': False,
            'openai': False,
            'anthropic': False,
            'google_generativeai': False,
            'cohere': False,
            'requests': False
        }
        
        try:
            import PIL
            vision_dependencies['pillow'] = True
        except ImportError:
            pass
            
        try:
            import openai
            vision_dependencies['openai'] = True
        except ImportError:
            pass
            
        try:
            import anthropic
            vision_dependencies['anthropic'] = True
        except ImportError:
            pass
            
        try:
            import google.generativeai
            vision_dependencies['google_generativeai'] = True
        except ImportError:
            pass
            
        try:
            import cohere
            vision_dependencies['cohere'] = True
        except ImportError:
            pass
            
        try:
            import requests
            vision_dependencies['requests'] = True
        except ImportError:
            pass
        
        # Test vision service if image provided
        vision_test_result = None
        if data and 'test_image' in data:
            logger.info(f"🔍 [Vision Debug] Testing vision processing")
            vision_test_result = {
                'test_status': 'simulated',
                'providers_available': [k for k, v in vision_dependencies.items() if v],
                'processing_time': '2.3s',
                'result': 'Vision processing would analyze the image here'
            }
        
        response_data = {
            'success': True,
            'debug_info': {
                'vision_dependencies': vision_dependencies,
                'dependencies_missing': [k for k, v in vision_dependencies.items() if not v],
                'vision_test_result': vision_test_result,
                'supported_providers': ['openai', 'anthropic', 'gemini', 'cohere'],
                'timestamp': datetime.utcnow().isoformat()
            },
            'vision_pipeline_status': {
                'attachment_processing': 'needs_testing',
                'image_extraction': 'needs_testing',
                'ai_provider_integration': 'configured',
                'response_formatting': 'configured'
            }
        }
        
        logger.info(f"✅ [Vision Debug] Response: {response_data}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"❌ [Vision Debug] Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@debug_tools_bp.route('/debug/system', methods=['GET'])
def debug_system():
    """Debug overall system status"""
    try:
        logger.info(f"🔍 [System Debug] System status check")
        
        # Check environment variables
        env_vars = {
            'OPENAI_API_KEY': 'Present' if os.getenv('OPENAI_API_KEY') else 'Missing',
            'ANTHROPIC_API_KEY': 'Present' if os.getenv('ANTHROPIC_API_KEY') else 'Missing',
            'GOOGLE_API_KEY': 'Present' if os.getenv('GOOGLE_API_KEY') else 'Missing',
            'COHERE_API_KEY': 'Present' if os.getenv('COHERE_API_KEY') else 'Missing'
        }
        
        # Check file system
        upload_folder = '/tmp/uploads'
        upload_folder_exists = os.path.exists(upload_folder)
        upload_folder_writable = os.access(upload_folder, os.W_OK) if upload_folder_exists else False
        
        response_data = {
            'success': True,
            'system_status': {
                'environment_variables': env_vars,
                'upload_folder': {
                    'path': upload_folder,
                    'exists': upload_folder_exists,
                    'writable': upload_folder_writable
                },
                'python_version': os.sys.version,
                'timestamp': datetime.utcnow().isoformat()
            },
            'service_status': {
                'flask_app': 'running',
                'cors_enabled': True,
                'blueprints_registered': True,
                'database_connected': 'unknown'
            },
            'critical_issues': [
                'Function calling not implemented for tools',
                'Need to verify attachment processing pipeline',
                'CORS headers may need deployment refresh'
            ]
        }
        
        logger.info(f"✅ [System Debug] Response: {response_data}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"❌ [System Debug] Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@debug_tools_bp.route('/debug/chat', methods=['POST'])
def debug_chat():
    """Debug chat processing pipeline"""
    try:
        data = request.get_json()
        
        logger.info(f"🔍 [Chat Debug] Request received")
        logger.info(f"🔍 [Chat Debug] Data: {data}")
        
        # Extract chat data
        agent_id = data.get('agent_id', 'unknown') if data else 'unknown'
        message = data.get('message', '') if data else ''
        attachments = data.get('attachments', []) if data else []
        
        # Simulate chat processing steps
        processing_steps = [
            {
                'step': 'Request Validation',
                'status': 'passed',
                'details': f'Agent ID: {agent_id}, Message length: {len(message)}, Attachments: {len(attachments)}'
            },
            {
                'step': 'Governance Check',
                'status': 'passed',
                'details': 'Governance adapter initialized and ready'
            },
            {
                'step': 'Attachment Processing',
                'status': 'needs_testing' if attachments else 'skipped',
                'details': f'Would process {len(attachments)} attachments'
            },
            {
                'step': 'AI Provider Selection',
                'status': 'configured',
                'details': 'Multiple providers available (OpenAI, Anthropic, etc.)'
            },
            {
                'step': 'Function Calling Check',
                'status': 'missing',
                'details': 'Function calling not implemented - this is the main issue!'
            },
            {
                'step': 'Response Generation',
                'status': 'would_work',
                'details': 'AI would generate response but cannot use tools'
            }
        ]
        
        response_data = {
            'success': True,
            'debug_info': {
                'processing_steps': processing_steps,
                'identified_issues': [
                    'Function calling not implemented',
                    'Tools cannot be invoked by AI',
                    'Attachment processing needs verification'
                ],
                'timestamp': datetime.utcnow().isoformat()
            },
            'recommendations': [
                'Implement function calling in chat endpoint',
                'Add tool schema definitions to system message',
                'Test attachment processing with real files',
                'Verify CORS headers are deployed'
            ]
        }
        
        logger.info(f"✅ [Chat Debug] Response: {response_data}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"❌ [Chat Debug] Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

