"""
Enhanced Veritas 2 API Documentation

Comprehensive API documentation generator for all Enhanced Veritas 2 endpoints.
Provides OpenAPI/Swagger specifications, interactive documentation,
and integration examples.
"""

from flask import Flask, render_template_string, jsonify
from flask_restx import Api, Resource, fields, Namespace
import json

def create_api_documentation(app: Flask) -> Api:
    """Create comprehensive API documentation for Enhanced Veritas 2."""
    
    api = Api(
        app,
        version='2.0',
        title='Enhanced Veritas 2 API',
        description='''
        Enhanced Veritas 2 provides revolutionary AI governance capabilities through:
        - Multidimensional uncertainty analysis
        - Human-in-the-loop collaboration
        - Multi-agent orchestration
        - Quantum uncertainty modeling
        - Real-time monitoring and control
        
        This API provides comprehensive access to all Enhanced Veritas 2 capabilities
        with backward compatibility to existing Promethios systems.
        ''',
        doc='/api/v2/docs/',
        prefix='/api/v2'
    )
    
    # ========================================================================
    # UNCERTAINTY ANALYSIS NAMESPACE
    # ========================================================================
    
    uncertainty_ns = Namespace('uncertainty', description='Uncertainty Analysis Operations')
    
    uncertainty_analysis_model = api.model('UncertaintyAnalysis', {
        'epistemic': fields.Float(description='Epistemic uncertainty (0.0-1.0)', example=0.65),
        'aleatoric': fields.Float(description='Aleatoric uncertainty (0.0-1.0)', example=0.42),
        'confidence': fields.Float(description='Confidence uncertainty (0.0-1.0)', example=0.78),
        'contextual': fields.Float(description='Contextual uncertainty (0.0-1.0)', example=0.55),
        'temporal': fields.Float(description='Temporal uncertainty (0.0-1.0)', example=0.38),
        'social': fields.Float(description='Social uncertainty (0.0-1.0)', example=0.62),
        'overall_uncertainty': fields.Float(description='Overall uncertainty score (0.0-1.0)', example=0.57)
    })
    
    uncertainty_request_model = api.model('UncertaintyRequest', {
        'content': fields.String(required=True, description='Content to analyze for uncertainty'),
        'context': fields.String(description='Optional context for analysis'),
        'agent_id': fields.String(description='Optional agent identifier'),
        'session_id': fields.String(description='Optional session identifier')
    })
    
    uncertainty_response_model = api.model('UncertaintyResponse', {
        'session_id': fields.String(description='Unique session identifier'),
        'uncertainty_analysis': fields.Nested(uncertainty_analysis_model),
        'uncertainty_sources': fields.List(fields.String, description='Identified uncertainty sources'),
        'clarification_needed': fields.Boolean(description='Whether clarification is needed'),
        'recommended_actions': fields.List(fields.String, description='Recommended actions'),
        'hitl_trigger': fields.Boolean(description='Whether HITL collaboration should be triggered'),
        'quantum_analysis': fields.Raw(description='Quantum uncertainty analysis (if enabled)'),
        'timestamp': fields.DateTime(description='Analysis timestamp')
    })
    
    @uncertainty_ns.route('/analyze')
    class UncertaintyAnalysis(Resource):
        @uncertainty_ns.expect(uncertainty_request_model)
        @uncertainty_ns.marshal_with(uncertainty_response_model)
        @uncertainty_ns.doc('analyze_uncertainty')
        def post(self):
            """Analyze uncertainty in content or agent responses."""
            pass
    
    @uncertainty_ns.route('/session/<string:session_id>')
    class UncertaintySession(Resource):
        @uncertainty_ns.marshal_with(uncertainty_response_model)
        @uncertainty_ns.doc('get_uncertainty_session')
        def get(self, session_id):
            """Get uncertainty analysis session data."""
            pass
    
    @uncertainty_ns.route('/sessions')
    class UncertaintySessions(Resource):
        @uncertainty_ns.doc('list_uncertainty_sessions')
        def get(self):
            """List all active uncertainty analysis sessions."""
            pass
    
    # ========================================================================
    # HITL COLLABORATION NAMESPACE
    # ========================================================================
    
    hitl_ns = Namespace('hitl', description='Human-in-the-Loop Collaboration Operations')
    
    expert_match_model = api.model('ExpertMatch', {
        'expert_id': fields.String(description='Expert identifier'),
        'expert_name': fields.String(description='Expert name'),
        'domain_expertise': fields.List(fields.String, description='Expert domain expertise'),
        'match_score': fields.Float(description='Match score (0.0-1.0)'),
        'availability': fields.String(description='Expert availability status'),
        'estimated_response_time': fields.Integer(description='Estimated response time in minutes')
    })
    
    collaboration_request_model = api.model('CollaborationRequest', {
        'session_id': fields.String(required=True, description='Uncertainty session ID'),
        'domain': fields.String(description='Optional domain expertise required'),
        'urgency': fields.String(description='Urgency level: low|medium|high', enum=['low', 'medium', 'high']),
        'collaboration_type': fields.String(description='Collaboration type: progressive|direct|contextual', enum=['progressive', 'direct', 'contextual'])
    })
    
    collaboration_response_model = api.model('CollaborationResponse', {
        'collaboration_id': fields.String(description='Unique collaboration identifier'),
        'expert_match': fields.Nested(expert_match_model),
        'estimated_duration': fields.Integer(description='Estimated duration in minutes'),
        'collaboration_strategy': fields.Raw(description='Collaboration strategy details'),
        'status': fields.String(description='Collaboration status')
    })
    
    question_request_model = api.model('QuestionRequest', {
        'question_text': fields.String(required=True, description='The question to ask'),
        'question_type': fields.String(description='Question type: open_ended|scale|multiple_choice', enum=['open_ended', 'scale', 'multiple_choice']),
        'uncertainty_target': fields.String(description='Target uncertainty dimension', enum=['epistemic', 'aleatoric', 'confidence', 'contextual', 'temporal', 'social']),
        'options': fields.List(fields.String, description='Options for multiple choice questions')
    })
    
    response_request_model = api.model('ResponseRequest', {
        'question_id': fields.String(required=True, description='Question identifier'),
        'response': fields.String(required=True, description='Expert response'),
        'confidence': fields.Float(description='Expert confidence (0.0-1.0)'),
        'additional_context': fields.String(description='Optional additional context')
    })
    
    @hitl_ns.route('/start_collaboration')
    class StartCollaboration(Resource):
        @hitl_ns.expect(collaboration_request_model)
        @hitl_ns.marshal_with(collaboration_response_model)
        @hitl_ns.doc('start_hitl_collaboration')
        def post(self):
            """Start a human-in-the-loop collaboration session."""
            pass
    
    @hitl_ns.route('/collaboration/<string:collaboration_id>/question')
    class AskQuestion(Resource):
        @hitl_ns.expect(question_request_model)
        @hitl_ns.doc('ask_clarification_question')
        def post(self, collaboration_id):
            """Ask a clarification question in a HITL collaboration."""
            pass
    
    @hitl_ns.route('/collaboration/<string:collaboration_id>/response')
    class SubmitResponse(Resource):
        @hitl_ns.expect(response_request_model)
        @hitl_ns.doc('submit_expert_response')
        def post(self, collaboration_id):
            """Submit an expert response to a clarification question."""
            pass
    
    @hitl_ns.route('/collaborations')
    class ListCollaborations(Resource):
        @hitl_ns.doc('list_hitl_collaborations')
        def get(self):
            """List all active HITL collaborations."""
            pass
    
    # ========================================================================
    # MULTI-AGENT ORCHESTRATION NAMESPACE
    # ========================================================================
    
    orchestration_ns = Namespace('orchestration', description='Multi-Agent Orchestration Operations')
    
    agent_model = api.model('Agent', {
        'agent_id': fields.String(description='Agent identifier'),
        'agent_name': fields.String(description='Agent name'),
        'agent_type': fields.String(description='Agent type'),
        'specialization': fields.List(fields.String, description='Agent specializations'),
        'trust_score': fields.Float(description='Trust score (0.0-1.0)'),
        'status': fields.String(description='Agent status', enum=['active', 'idle', 'busy', 'offline'])
    })
    
    network_request_model = api.model('NetworkRequest', {
        'network_name': fields.String(description='Network name'),
        'agent_ids': fields.List(fields.String, required=True, description='List of agent IDs'),
        'collaboration_pattern': fields.String(description='Collaboration pattern', enum=['round_table', 'innovation_lab', 'hierarchical', 'dynamic']),
        'uncertainty_context': fields.Raw(description='Uncertainty context for orchestration'),
        'auto_optimize': fields.Boolean(description='Enable automatic optimization')
    })
    
    network_response_model = api.model('NetworkResponse', {
        'network_id': fields.String(description='Network identifier'),
        'network_name': fields.String(description='Network name'),
        'agents': fields.List(fields.Nested(agent_model)),
        'collaboration_pattern': fields.String(description='Collaboration pattern'),
        'network_efficiency': fields.Float(description='Network efficiency (0.0-1.0)'),
        'status': fields.String(description='Network status')
    })
    
    @orchestration_ns.route('/create_network')
    class CreateNetwork(Resource):
        @orchestration_ns.expect(network_request_model)
        @orchestration_ns.marshal_with(network_response_model)
        @orchestration_ns.doc('create_agent_network')
        def post(self):
            """Create a multi-agent collaboration network."""
            pass
    
    @orchestration_ns.route('/networks')
    class ListNetworks(Resource):
        @orchestration_ns.doc('list_agent_networks')
        def get(self):
            """List all active agent networks."""
            pass
    
    @orchestration_ns.route('/network/<string:network_id>/optimize')
    class OptimizeNetwork(Resource):
        @orchestration_ns.doc('optimize_agent_network')
        def post(self, network_id):
            """Optimize an agent network based on performance metrics."""
            pass
    
    # ========================================================================
    # QUANTUM UNCERTAINTY NAMESPACE
    # ========================================================================
    
    quantum_ns = Namespace('quantum', description='Quantum Uncertainty Analysis Operations')
    
    quantum_state_model = api.model('QuantumState', {
        'state_id': fields.String(description='Quantum state identifier'),
        'amplitude': fields.Float(description='Quantum amplitude'),
        'phase': fields.Float(description='Quantum phase'),
        'coherence': fields.Float(description='Quantum coherence (0.0-1.0)'),
        'entanglement': fields.Float(description='Entanglement strength (0.0-1.0)')
    })
    
    quantum_analysis_model = api.model('QuantumAnalysis', {
        'quantum_advantage': fields.Float(description='Quantum advantage over classical (0.0-1.0)'),
        'quantum_states': fields.List(fields.Nested(quantum_state_model)),
        'entanglements': fields.List(fields.Raw, description='Quantum entanglements'),
        'coherence_time': fields.Float(description='Coherence time in milliseconds'),
        'prediction_accuracy': fields.Float(description='Quantum prediction accuracy (0.0-1.0)')
    })
    
    quantum_request_model = api.model('QuantumRequest', {
        'uncertainty_analysis': fields.Raw(required=True, description='Base uncertainty analysis'),
        'content': fields.String(description='Content for quantum analysis'),
        'context': fields.String(description='Context for quantum analysis'),
        'quantum_config': fields.Raw(description='Quantum configuration parameters')
    })
    
    @quantum_ns.route('/analyze')
    class QuantumAnalysis(Resource):
        @quantum_ns.expect(quantum_request_model)
        @quantum_ns.marshal_with(quantum_analysis_model)
        @quantum_ns.doc('analyze_quantum_uncertainty')
        def post(self):
            """Perform quantum uncertainty analysis."""
            pass
    
    @quantum_ns.route('/entanglements')
    class QuantumEntanglements(Resource):
        @quantum_ns.doc('get_quantum_entanglements')
        def get(self):
            """Get current quantum entanglements."""
            pass
    
    # ========================================================================
    # SYSTEM MANAGEMENT NAMESPACE
    # ========================================================================
    
    system_ns = Namespace('system', description='System Management Operations')
    
    system_status_model = api.model('SystemStatus', {
        'uncertainty_engine': fields.String(description='Uncertainty engine status', enum=['healthy', 'warning', 'error']),
        'hitl_system': fields.String(description='HITL system status', enum=['healthy', 'warning', 'error']),
        'orchestration_engine': fields.String(description='Orchestration engine status', enum=['healthy', 'warning', 'error']),
        'quantum_integration': fields.String(description='Quantum integration status', enum=['healthy', 'warning', 'error']),
        'bridge_services': fields.String(description='Bridge services status', enum=['healthy', 'warning', 'error'])
    })
    
    system_metrics_model = api.model('SystemMetrics', {
        'total_sessions': fields.Integer(description='Total uncertainty analysis sessions'),
        'active_collaborations': fields.Integer(description='Active HITL collaborations'),
        'active_networks': fields.Integer(description='Active agent networks'),
        'uncertainty_reduction_rate': fields.Float(description='Average uncertainty reduction rate'),
        'collaboration_success_rate': fields.Float(description='HITL collaboration success rate'),
        'quantum_advantage': fields.Float(description='Average quantum advantage'),
        'system_uptime': fields.Float(description='System uptime in hours')
    })
    
    @system_ns.route('/status')
    class SystemStatus(Resource):
        @system_ns.marshal_with(system_status_model)
        @system_ns.doc('get_system_status')
        def get(self):
            """Get Enhanced Veritas 2 system status."""
            pass
    
    @system_ns.route('/metrics')
    class SystemMetrics(Resource):
        @system_ns.marshal_with(system_metrics_model)
        @system_ns.doc('get_system_metrics')
        def get(self):
            """Get Enhanced Veritas 2 system metrics."""
            pass
    
    @system_ns.route('/config')
    class SystemConfig(Resource):
        @system_ns.doc('get_system_config')
        def get(self):
            """Get Enhanced Veritas 2 configuration."""
            pass
        
        @system_ns.doc('update_system_config')
        def post(self):
            """Update Enhanced Veritas 2 configuration."""
            pass
    
    # Add namespaces to API
    api.add_namespace(uncertainty_ns)
    api.add_namespace(hitl_ns)
    api.add_namespace(orchestration_ns)
    api.add_namespace(quantum_ns)
    api.add_namespace(system_ns)
    
    return api

# ============================================================================
# WEBSOCKET DOCUMENTATION
# ============================================================================

WEBSOCKET_DOCUMENTATION = {
    "websocket_events": {
        "client_to_server": {
            "connect": {
                "description": "Establish WebSocket connection",
                "payload": None
            },
            "join_session": {
                "description": "Join a specific uncertainty analysis session for real-time updates",
                "payload": {
                    "session_id": "string - Session identifier"
                }
            },
            "join_collaboration": {
                "description": "Join a specific HITL collaboration for real-time updates",
                "payload": {
                    "collaboration_id": "string - Collaboration identifier"
                }
            },
            "join_orchestration": {
                "description": "Join orchestration room for multi-agent network updates",
                "payload": None
            },
            "join_system": {
                "description": "Join system room for system-wide updates",
                "payload": None
            }
        },
        "server_to_client": {
            "uncertainty_analysis_update": {
                "description": "Real-time uncertainty analysis updates",
                "payload": {
                    "session_id": "string",
                    "uncertainty_analysis": "object",
                    "quantum_analysis": "object"
                }
            },
            "hitl_collaboration_started": {
                "description": "HITL collaboration session started",
                "payload": {
                    "collaboration_id": "string",
                    "expert_match": "object",
                    "collaboration_strategy": "object"
                }
            },
            "clarification_question_asked": {
                "description": "New clarification question asked",
                "payload": {
                    "collaboration_id": "string",
                    "question": "object"
                }
            },
            "expert_response_received": {
                "description": "Expert response received",
                "payload": {
                    "collaboration_id": "string",
                    "response_analysis": "object",
                    "collaboration_status": "string"
                }
            },
            "agent_network_created": {
                "description": "New agent network created",
                "payload": {
                    "network": "object"
                }
            },
            "network_optimized": {
                "description": "Agent network optimized",
                "payload": {
                    "network_id": "string",
                    "optimization_result": "object"
                }
            },
            "system_config_updated": {
                "description": "System configuration updated",
                "payload": {
                    "config": "object"
                }
            }
        }
    }
}

# ============================================================================
# INTEGRATION EXAMPLES
# ============================================================================

INTEGRATION_EXAMPLES = {
    "python": {
        "uncertainty_analysis": '''
import requests

# Analyze uncertainty in agent response
response = requests.post('http://localhost:5000/api/v2/uncertainty/analyze', json={
    "content": "I think the solution might work, but I'm not entirely sure about the performance implications.",
    "context": "Technical system design discussion",
    "agent_id": "agent-001"
})

uncertainty_data = response.json()
print(f"Overall uncertainty: {uncertainty_data['uncertainty_analysis']['overall_uncertainty']}")

# Check if HITL collaboration is needed
if uncertainty_data['hitl_trigger']:
    # Start HITL collaboration
    collab_response = requests.post('http://localhost:5000/api/v2/hitl/start_collaboration', json={
        "session_id": uncertainty_data['session_id'],
        "domain": "technical",
        "urgency": "medium"
    })
    print(f"HITL collaboration started: {collab_response.json()['collaboration_id']}")
        ''',
        "websocket_client": '''
import socketio

# Create WebSocket client
sio = socketio.Client()

@sio.event
def connect():
    print('Connected to Enhanced Veritas 2')
    # Join session for real-time updates
    sio.emit('join_session', {'session_id': 'your-session-id'})

@sio.event
def uncertainty_analysis_update(data):
    print(f"Uncertainty update: {data['uncertainty_analysis']['overall_uncertainty']}")

@sio.event
def hitl_collaboration_started(data):
    print(f"HITL collaboration started with expert: {data['expert_match']['expert_name']}")

# Connect to server
sio.connect('http://localhost:5000')
sio.wait()
        '''
    },
    "javascript": {
        "uncertainty_analysis": '''
// Analyze uncertainty in agent response
const analyzeUncertainty = async (content, context, agentId) => {
    const response = await fetch('http://localhost:5000/api/v2/uncertainty/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: content,
            context: context,
            agent_id: agentId
        })
    });
    
    const uncertaintyData = await response.json();
    console.log(`Overall uncertainty: ${uncertaintyData.uncertainty_analysis.overall_uncertainty}`);
    
    // Check if HITL collaboration is needed
    if (uncertaintyData.hitl_trigger) {
        const collabResponse = await fetch('http://localhost:5000/api/v2/hitl/start_collaboration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: uncertaintyData.session_id,
                domain: 'technical',
                urgency: 'medium'
            })
        });
        
        const collabData = await collabResponse.json();
        console.log(`HITL collaboration started: ${collabData.collaboration_id}`);
    }
};
        ''',
        "websocket_client": '''
// WebSocket client for real-time updates
const socket = io('http://localhost:5000');

socket.on('connect', () => {
    console.log('Connected to Enhanced Veritas 2');
    // Join session for real-time updates
    socket.emit('join_session', { session_id: 'your-session-id' });
});

socket.on('uncertainty_analysis_update', (data) => {
    console.log(`Uncertainty update: ${data.uncertainty_analysis.overall_uncertainty}`);
});

socket.on('hitl_collaboration_started', (data) => {
    console.log(`HITL collaboration started with expert: ${data.expert_match.expert_name}`);
});
        '''
    }
}

def get_api_documentation():
    """Get complete API documentation."""
    return {
        "api_version": "2.0",
        "title": "Enhanced Veritas 2 API",
        "description": "Revolutionary AI governance capabilities through uncertainty analysis, HITL collaboration, multi-agent orchestration, and quantum uncertainty modeling.",
        "base_url": "http://localhost:5000/api/v2",
        "websocket_url": "ws://localhost:5000",
        "documentation_url": "http://localhost:5000/api/v2/docs/",
        "websocket_events": WEBSOCKET_DOCUMENTATION,
        "integration_examples": INTEGRATION_EXAMPLES,
        "authentication": {
            "type": "none",
            "note": "Authentication will be added in production deployment"
        },
        "rate_limiting": {
            "enabled": False,
            "note": "Rate limiting will be configured based on deployment requirements"
        },
        "cors": {
            "enabled": True,
            "origins": "*",
            "note": "CORS is enabled for all origins in development"
        }
    }

