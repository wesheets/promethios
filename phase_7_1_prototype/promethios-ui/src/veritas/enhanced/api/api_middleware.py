"""
Enhanced Veritas 2 API Middleware

Middleware components for seamless integration with existing Promethios APIs.
Provides backward compatibility, request/response transformation,
and automatic Enhanced Veritas 2 capability injection.
"""

from flask import Flask, request, jsonify, g
from functools import wraps
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional, Callable
import logging

# Import Enhanced Veritas 2 services
from ..bridges.enhanced_veritas_bridge import EnhancedVeritasBridge
from ..uncertaintyEngine import UncertaintyAnalysisEngine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedVeritasMiddleware:
    """
    Middleware for integrating Enhanced Veritas 2 capabilities
    with existing Promethios APIs.
    """
    
    def __init__(self, app: Flask = None):
        self.app = app
        self.bridge = EnhancedVeritasBridge()
        self.uncertainty_engine = UncertaintyAnalysisEngine()
        self.config = {
            'auto_uncertainty_analysis': True,
            'auto_hitl_trigger': True,
            'uncertainty_threshold': 0.7,
            'response_enhancement': True,
            'logging_enabled': True
        }
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Initialize middleware with Flask app."""
        self.app = app
        
        # Register middleware hooks
        app.before_request(self.before_request)
        app.after_request(self.after_request)
        
        # Register error handlers
        app.errorhandler(500)(self.handle_error)
        
        logger.info("Enhanced Veritas 2 Middleware initialized")
    
    def before_request(self):
        """Process request before routing."""
        g.start_time = time.time()
        g.enhanced_veritas_data = {}
        
        # Skip middleware for certain paths
        if self.should_skip_middleware():
            return
        
        # Log request if enabled
        if self.config['logging_enabled']:
            logger.info(f"Enhanced Veritas 2 processing: {request.method} {request.path}")
        
        # Analyze request for uncertainty if enabled
        if self.config['auto_uncertainty_analysis'] and request.is_json:
            self.analyze_request_uncertainty()
    
    def after_request(self, response):
        """Process response after routing."""
        # Skip middleware for certain paths
        if self.should_skip_middleware():
            return response
        
        # Enhance response if enabled
        if self.config['response_enhancement'] and response.is_json:
            response = self.enhance_response(response)
        
        # Add Enhanced Veritas 2 headers
        response.headers['X-Enhanced-Veritas-Version'] = '2.0'
        response.headers['X-Processing-Time'] = f"{(time.time() - g.start_time) * 1000:.2f}ms"
        
        # Log response if enabled
        if self.config['logging_enabled']:
            processing_time = (time.time() - g.start_time) * 1000
            logger.info(f"Enhanced Veritas 2 completed: {request.path} ({processing_time:.2f}ms)")
        
        return response
    
    def should_skip_middleware(self) -> bool:
        """Determine if middleware should be skipped for this request."""
        skip_paths = [
            '/api/v2/docs',
            '/static',
            '/favicon.ico',
            '/health',
            '/ping'
        ]
        
        return any(request.path.startswith(path) for path in skip_paths)
    
    def analyze_request_uncertainty(self):
        """Analyze request content for uncertainty."""
        try:
            request_data = request.get_json()
            if not request_data:
                return
            
            # Extract content for analysis
            content = self.extract_content_for_analysis(request_data)
            if not content:
                return
            
            # Perform uncertainty analysis
            uncertainty_analysis = self.uncertainty_engine.analyze_uncertainty(
                content=content,
                context=f"{request.method} {request.path}",
                agent_id=request_data.get('agent_id')
            )
            
            # Store analysis in request context
            g.enhanced_veritas_data['uncertainty_analysis'] = uncertainty_analysis
            g.enhanced_veritas_data['content'] = content
            
            # Check if HITL should be triggered
            if (self.config['auto_hitl_trigger'] and 
                uncertainty_analysis['overall_uncertainty'] > self.config['uncertainty_threshold']):
                g.enhanced_veritas_data['hitl_recommended'] = True
            
        except Exception as e:
            logger.error(f"Error in request uncertainty analysis: {str(e)}")
    
    def extract_content_for_analysis(self, request_data: Dict[str, Any]) -> Optional[str]:
        """Extract content from request data for uncertainty analysis."""
        # Common content fields to analyze
        content_fields = [
            'content', 'message', 'text', 'query', 'prompt',
            'response', 'answer', 'description', 'summary'
        ]
        
        for field in content_fields:
            if field in request_data and isinstance(request_data[field], str):
                return request_data[field]
        
        # If no direct content field, try to extract from nested objects
        for key, value in request_data.items():
            if isinstance(value, dict):
                nested_content = self.extract_content_for_analysis(value)
                if nested_content:
                    return nested_content
        
        return None
    
    def enhance_response(self, response):
        """Enhance response with Enhanced Veritas 2 capabilities."""
        try:
            response_data = response.get_json()
            if not response_data:
                return response
            
            # Add Enhanced Veritas 2 metadata
            enhanced_data = response_data.copy()
            enhanced_data['enhanced_veritas'] = {
                'version': '2.0',
                'processing_time': f"{(time.time() - g.start_time) * 1000:.2f}ms",
                'timestamp': datetime.now().isoformat()
            }
            
            # Add uncertainty analysis if available
            if hasattr(g, 'enhanced_veritas_data') and 'uncertainty_analysis' in g.enhanced_veritas_data:
                enhanced_data['enhanced_veritas']['uncertainty_analysis'] = g.enhanced_veritas_data['uncertainty_analysis']
                
                # Add HITL recommendation if applicable
                if g.enhanced_veritas_data.get('hitl_recommended'):
                    enhanced_data['enhanced_veritas']['hitl_recommended'] = True
                    enhanced_data['enhanced_veritas']['hitl_reason'] = 'High uncertainty detected'
            
            # Update response
            response.data = json.dumps(enhanced_data)
            response.headers['Content-Length'] = len(response.data)
            
        except Exception as e:
            logger.error(f"Error in response enhancement: {str(e)}")
        
        return response
    
    def handle_error(self, error):
        """Handle errors with Enhanced Veritas 2 context."""
        logger.error(f"Enhanced Veritas 2 error: {str(error)}")
        
        return jsonify({
            'error': 'Internal server error',
            'enhanced_veritas': {
                'version': '2.0',
                'error_handled': True,
                'timestamp': datetime.now().isoformat()
            }
        }), 500

# ============================================================================
# DECORATOR FUNCTIONS
# ============================================================================

def with_uncertainty_analysis(threshold: float = 0.7, auto_hitl: bool = True):
    """
    Decorator to automatically add uncertainty analysis to API endpoints.
    
    Args:
        threshold: Uncertainty threshold for HITL triggering
        auto_hitl: Whether to automatically suggest HITL collaboration
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get request data
            request_data = request.get_json() if request.is_json else {}
            
            # Extract content for analysis
            content = None
            content_fields = ['content', 'message', 'text', 'query', 'prompt']
            for field in content_fields:
                if field in request_data:
                    content = request_data[field]
                    break
            
            # Perform uncertainty analysis if content found
            uncertainty_analysis = None
            if content:
                uncertainty_engine = UncertaintyAnalysisEngine()
                uncertainty_analysis = uncertainty_engine.analyze_uncertainty(
                    content=content,
                    context=f"{request.method} {request.path}",
                    agent_id=request_data.get('agent_id')
                )
            
            # Call original function
            result = func(*args, **kwargs)
            
            # Enhance result with uncertainty analysis
            if uncertainty_analysis and isinstance(result, tuple) and len(result) >= 1:
                response_data = result[0] if isinstance(result[0], dict) else {}
                response_data['uncertainty_analysis'] = uncertainty_analysis
                
                # Add HITL recommendation if threshold exceeded
                if (auto_hitl and 
                    uncertainty_analysis['overall_uncertainty'] > threshold):
                    response_data['hitl_recommended'] = True
                    response_data['hitl_threshold_exceeded'] = True
                
                # Return enhanced result
                if len(result) == 1:
                    return response_data
                else:
                    return (response_data,) + result[1:]
            
            return result
        
        return wrapper
    return decorator

def with_quantum_enhancement(enabled: bool = True):
    """
    Decorator to add quantum uncertainty analysis to API endpoints.
    
    Args:
        enabled: Whether quantum enhancement is enabled
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Call original function
            result = func(*args, **kwargs)
            
            # Add quantum enhancement if enabled
            if enabled and isinstance(result, tuple) and len(result) >= 1:
                response_data = result[0] if isinstance(result[0], dict) else {}
                
                # Add quantum analysis if uncertainty analysis exists
                if 'uncertainty_analysis' in response_data:
                    try:
                        from ..quantum.quantum_uncertainty_engine import QuantumUncertaintyEngine
                        quantum_engine = QuantumUncertaintyEngine()
                        
                        quantum_analysis = quantum_engine.analyze_quantum_uncertainty(
                            uncertainty_analysis=response_data['uncertainty_analysis'],
                            content=request.get_json().get('content', '') if request.is_json else '',
                            context=f"{request.method} {request.path}"
                        )
                        
                        response_data['quantum_analysis'] = quantum_analysis
                        
                    except Exception as e:
                        logger.error(f"Quantum enhancement error: {str(e)}")
                        response_data['quantum_analysis'] = {'error': 'Quantum analysis unavailable'}
                
                # Return enhanced result
                if len(result) == 1:
                    return response_data
                else:
                    return (response_data,) + result[1:]
            
            return result
        
        return wrapper
    return decorator

def with_multi_agent_orchestration(auto_trigger: bool = True, min_agents: int = 2):
    """
    Decorator to add multi-agent orchestration capabilities to API endpoints.
    
    Args:
        auto_trigger: Whether to automatically trigger orchestration
        min_agents: Minimum number of agents required for orchestration
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Call original function
            result = func(*args, **kwargs)
            
            # Add orchestration capabilities if conditions met
            if (auto_trigger and isinstance(result, tuple) and len(result) >= 1):
                response_data = result[0] if isinstance(result[0], dict) else {}
                
                # Check if orchestration should be triggered
                should_orchestrate = False
                if 'uncertainty_analysis' in response_data:
                    uncertainty = response_data['uncertainty_analysis']['overall_uncertainty']
                    should_orchestrate = uncertainty > 0.6  # Orchestration threshold
                
                if should_orchestrate:
                    try:
                        from ..multiAgent.intelligentOrchestration import IntelligentOrchestrationEngine
                        orchestration_engine = IntelligentOrchestrationEngine()
                        
                        # Get available agents
                        available_agents = orchestration_engine.get_available_agents()
                        
                        if len(available_agents) >= min_agents:
                            orchestration_recommendation = {
                                'orchestration_recommended': True,
                                'available_agents': len(available_agents),
                                'recommended_pattern': 'dynamic',
                                'estimated_improvement': 0.3,
                                'reason': 'High uncertainty detected - multi-agent collaboration recommended'
                            }
                            
                            response_data['orchestration_recommendation'] = orchestration_recommendation
                        
                    except Exception as e:
                        logger.error(f"Orchestration enhancement error: {str(e)}")
                
                # Return enhanced result
                if len(result) == 1:
                    return response_data
                else:
                    return (response_data,) + result[1:]
            
            return result
        
        return wrapper
    return decorator

# ============================================================================
# INTEGRATION HELPERS
# ============================================================================

class APIIntegrationHelper:
    """Helper class for integrating Enhanced Veritas 2 with existing APIs."""
    
    @staticmethod
    def enhance_existing_endpoint(app: Flask, endpoint_path: str, 
                                uncertainty_analysis: bool = True,
                                quantum_enhancement: bool = False,
                                orchestration: bool = False):
        """
        Enhance an existing API endpoint with Enhanced Veritas 2 capabilities.
        
        Args:
            app: Flask application
            endpoint_path: Path of the endpoint to enhance
            uncertainty_analysis: Enable uncertainty analysis
            quantum_enhancement: Enable quantum enhancement
            orchestration: Enable orchestration recommendations
        """
        
        # Get the original endpoint function
        endpoint_func = None
        for rule in app.url_map.iter_rules():
            if rule.rule == endpoint_path:
                endpoint_func = app.view_functions[rule.endpoint]
                break
        
        if not endpoint_func:
            logger.error(f"Endpoint not found: {endpoint_path}")
            return
        
        # Create enhanced wrapper
        @wraps(endpoint_func)
        def enhanced_wrapper(*args, **kwargs):
            # Call original function
            result = endpoint_func(*args, **kwargs)
            
            # Apply enhancements based on configuration
            if uncertainty_analysis:
                result = with_uncertainty_analysis()(lambda: result)()
            
            if quantum_enhancement:
                result = with_quantum_enhancement()(lambda: result)()
            
            if orchestration:
                result = with_multi_agent_orchestration()(lambda: result)()
            
            return result
        
        # Replace the original endpoint
        app.view_functions[endpoint_func.__name__] = enhanced_wrapper
        logger.info(f"Enhanced endpoint: {endpoint_path}")
    
    @staticmethod
    def create_enhanced_blueprint(name: str, import_name: str) -> 'Blueprint':
        """Create a Flask Blueprint with Enhanced Veritas 2 capabilities."""
        from flask import Blueprint
        
        blueprint = Blueprint(name, import_name)
        
        # Add Enhanced Veritas 2 middleware to blueprint
        @blueprint.before_request
        def before_request():
            g.enhanced_veritas_enabled = True
        
        return blueprint

# ============================================================================
# CONFIGURATION MANAGEMENT
# ============================================================================

class EnhancedVeritasConfig:
    """Configuration management for Enhanced Veritas 2 middleware."""
    
    DEFAULT_CONFIG = {
        'auto_uncertainty_analysis': True,
        'auto_hitl_trigger': True,
        'uncertainty_threshold': 0.7,
        'quantum_enhancement': True,
        'orchestration_recommendations': True,
        'response_enhancement': True,
        'logging_enabled': True,
        'performance_monitoring': True
    }
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = self.DEFAULT_CONFIG.copy()
        if config:
            self.config.update(config)
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value."""
        return self.config.get(key, default)
    
    def set(self, key: str, value: Any):
        """Set configuration value."""
        self.config[key] = value
    
    def update(self, config: Dict[str, Any]):
        """Update configuration with new values."""
        self.config.update(config)
    
    def to_dict(self) -> Dict[str, Any]:
        """Get configuration as dictionary."""
        return self.config.copy()

# Global configuration instance
enhanced_veritas_config = EnhancedVeritasConfig()

