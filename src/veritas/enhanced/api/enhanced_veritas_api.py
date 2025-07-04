"""
Enhanced Veritas 2 API Service

Comprehensive RESTful API service that exposes all Enhanced Veritas 2 capabilities:
- Uncertainty Analysis APIs
- HITL Collaboration APIs  
- Multi-Agent Orchestration APIs
- Quantum Uncertainty APIs
- Real-time WebSocket APIs
- Integration with existing Promethios systems
"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import json
import uuid
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import asyncio
import threading

# Import Enhanced Veritas 2 services
from ..bridges.enhanced_veritas_bridge import EnhancedVeritasBridge
from ..uncertaintyEngine import UncertaintyAnalysisEngine
from ..hitl.expert_matching_system import ExpertMatchingSystem
from ..hitl.progressive_clarification_engine import ProgressiveClarificationEngine
from ..multiAgent.intelligentOrchestration import IntelligentOrchestrationEngine
from ..quantum.quantum_uncertainty_engine import QuantumUncertaintyEngine

# Import existing Promethios services for integration
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../..'))

app = Flask(__name__)
app.config['SECRET_KEY'] = 'enhanced-veritas-2-secret-key'
CORS(app, origins="*")  # Allow all origins for development
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize Enhanced Veritas 2 services
enhanced_veritas_bridge = EnhancedVeritasBridge()
uncertainty_engine = UncertaintyAnalysisEngine()
expert_matching = ExpertMatchingSystem()
clarification_engine = ProgressiveClarificationEngine()
orchestration_engine = IntelligentOrchestrationEngine()
quantum_engine = QuantumUncertaintyEngine()

# Global state management
active_sessions = {}
active_collaborations = {}
websocket_connections = {}

# ============================================================================
# UNCERTAINTY ANALYSIS APIs
# ============================================================================

@app.route('/api/v2/uncertainty/analyze', methods=['POST'])
def analyze_uncertainty():
    """
    Analyze uncertainty in agent responses or decisions.
    
    Request Body:
    {
        "content": "text to analyze",
        "context": "optional context",
        "agent_id": "optional agent identifier",
        "session_id": "optional session identifier"
    }
    
    Returns:
    {
        "uncertainty_analysis": {
            "epistemic": float,
            "aleatoric": float,
            "confidence": float,
            "contextual": float,
            "temporal": float,
            "social": float
        },
        "uncertainty_sources": [...],
        "clarification_needed": bool,
        "recommended_actions": [...],
        "hitl_trigger": bool,
        "quantum_analysis": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({'error': 'Content is required'}), 400
        
        content = data['content']
        context = data.get('context', '')
        agent_id = data.get('agent_id')
        session_id = data.get('session_id', str(uuid.uuid4()))
        
        # Perform uncertainty analysis
        uncertainty_analysis = uncertainty_engine.analyze_uncertainty(
            content=content,
            context=context,
            agent_id=agent_id
        )
        
        # Check if quantum analysis is enabled
        quantum_analysis = None
        if enhanced_veritas_bridge.config.get('quantum_enabled', True):
            quantum_analysis = quantum_engine.analyze_quantum_uncertainty(
                uncertainty_analysis=uncertainty_analysis,
                content=content,
                context=context
            )
        
        # Determine if HITL collaboration is needed
        hitl_trigger = uncertainty_analysis['overall_uncertainty'] > enhanced_veritas_bridge.config.get('hitl_threshold', 0.7)
        
        # Store session data
        active_sessions[session_id] = {
            'session_id': session_id,
            'agent_id': agent_id,
            'uncertainty_analysis': uncertainty_analysis,
            'quantum_analysis': quantum_analysis,
            'hitl_trigger': hitl_trigger,
            'created_time': datetime.now().isoformat(),
            'last_updated': datetime.now().isoformat()
        }
        
        # Emit real-time update
        socketio.emit('uncertainty_analysis_update', {
            'session_id': session_id,
            'uncertainty_analysis': uncertainty_analysis,
            'quantum_analysis': quantum_analysis
        }, room=f'session_{session_id}')
        
        return jsonify({
            'session_id': session_id,
            'uncertainty_analysis': uncertainty_analysis,
            'quantum_analysis': quantum_analysis,
            'hitl_trigger': hitl_trigger,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v2/uncertainty/session/<session_id>', methods=['GET'])
def get_uncertainty_session(session_id):
    """Get uncertainty analysis session data."""
    try:
        if session_id not in active_sessions:
            return jsonify({'error': 'Session not found'}), 404
        
        session_data = active_sessions[session_id]
        return jsonify(session_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v2/uncertainty/sessions', methods=['GET'])
def list_uncertainty_sessions():
    """List all active uncertainty analysis sessions."""
    try:
        sessions = list(active_sessions.values())
        return jsonify({
            'sessions': sessions,
            'total_count': len(sessions)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# HITL COLLABORATION APIs
# ============================================================================

@app.route('/api/v2/hitl/start_collaboration', methods=['POST'])
def start_hitl_collaboration():
    """
    Start a human-in-the-loop collaboration session.
    
    Request Body:
    {
        "session_id": "uncertainty session id",
        "domain": "optional domain expertise required",
        "urgency": "low|medium|high",
        "collaboration_type": "progressive|direct|contextual"
    }
    
    Returns:
    {
        "collaboration_id": "unique collaboration id",
        "expert_match": {...},
        "estimated_duration": int,
        "collaboration_strategy": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'session_id' not in data:
            return jsonify({'error': 'Session ID is required'}), 400
        
        session_id = data['session_id']
        domain = data.get('domain')
        urgency = data.get('urgency', 'medium')
        collaboration_type = data.get('collaboration_type', 'progressive')
        
        # Get uncertainty session
        if session_id not in active_sessions:
            return jsonify({'error': 'Uncertainty session not found'}), 404
        
        uncertainty_session = active_sessions[session_id]
        
        # Find expert match
        expert_match = expert_matching.find_expert_match(
            uncertainty_analysis=uncertainty_session['uncertainty_analysis'],
            domain=domain,
            urgency=urgency,
            quantum_analysis=uncertainty_session.get('quantum_analysis')
        )
        
        # Create collaboration session
        collaboration_id = str(uuid.uuid4())
        collaboration_strategy = clarification_engine.create_collaboration_strategy(
            uncertainty_analysis=uncertainty_session['uncertainty_analysis'],
            expert_profile=expert_match,
            collaboration_type=collaboration_type
        )
        
        # Store collaboration data
        active_collaborations[collaboration_id] = {
            'collaboration_id': collaboration_id,
            'session_id': session_id,
            'expert_match': expert_match,
            'collaboration_strategy': collaboration_strategy,
            'collaboration_type': collaboration_type,
            'status': 'active',
            'created_time': datetime.now().isoformat(),
            'last_activity': datetime.now().isoformat(),
            'questions_asked': 0,
            'questions_answered': 0,
            'uncertainty_reduction': 0.0,
            'expert_satisfaction': 0.0
        }
        
        # Emit real-time update
        socketio.emit('hitl_collaboration_started', {
            'collaboration_id': collaboration_id,
            'expert_match': expert_match,
            'collaboration_strategy': collaboration_strategy
        }, room=f'session_{session_id}')
        
        return jsonify({
            'collaboration_id': collaboration_id,
            'expert_match': expert_match,
            'estimated_duration': collaboration_strategy.get('estimated_duration', 30),
            'collaboration_strategy': collaboration_strategy,
            'status': 'active'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v2/hitl/collaboration/<collaboration_id>/question', methods=['POST'])
def ask_clarification_question(collaboration_id):
    """
    Ask a clarification question in a HITL collaboration.
    
    Request Body:
    {
        "question_text": "the question to ask",
        "question_type": "open_ended|scale|multiple_choice",
        "uncertainty_target": "epistemic|aleatoric|confidence|contextual|temporal|social",
        "options": ["option1", "option2"] // for multiple_choice
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'question_text' not in data:
            return jsonify({'error': 'Question text is required'}), 400
        
        if collaboration_id not in active_collaborations:
            return jsonify({'error': 'Collaboration not found'}), 404
        
        collaboration = active_collaborations[collaboration_id]
        
        # Generate clarification question
        question = clarification_engine.generate_clarification_question(
            collaboration_strategy=collaboration['collaboration_strategy'],
            question_text=data['question_text'],
            question_type=data.get('question_type', 'open_ended'),
            uncertainty_target=data.get('uncertainty_target', 'epistemic'),
            options=data.get('options', [])
        )
        
        # Update collaboration state
        collaboration['questions_asked'] += 1
        collaboration['last_activity'] = datetime.now().isoformat()
        
        # Emit real-time update
        socketio.emit('clarification_question_asked', {
            'collaboration_id': collaboration_id,
            'question': question
        }, room=f'collaboration_{collaboration_id}')
        
        return jsonify({
            'question_id': question['question_id'],
            'question': question,
            'collaboration_status': collaboration['status']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v2/hitl/collaboration/<collaboration_id>/response', methods=['POST'])
def submit_expert_response(collaboration_id):
    """
    Submit an expert response to a clarification question.
    
    Request Body:
    {
        "question_id": "question identifier",
        "response": "expert response",
        "confidence": float, // 0.0 to 1.0
        "additional_context": "optional additional context"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'question_id' not in data or 'response' not in data:
            return jsonify({'error': 'Question ID and response are required'}), 400
        
        if collaboration_id not in active_collaborations:
            return jsonify({'error': 'Collaboration not found'}), 404
        
        collaboration = active_collaborations[collaboration_id]
        
        # Process expert response
        response_analysis = clarification_engine.process_expert_response(
            collaboration_strategy=collaboration['collaboration_strategy'],
            question_id=data['question_id'],
            response=data['response'],
            confidence=data.get('confidence', 0.8),
            additional_context=data.get('additional_context', '')
        )
        
        # Update collaboration state
        collaboration['questions_answered'] += 1
        collaboration['uncertainty_reduction'] = response_analysis.get('uncertainty_reduction', 0.0)
        collaboration['expert_satisfaction'] = response_analysis.get('expert_satisfaction', 0.8)
        collaboration['last_activity'] = datetime.now().isoformat()
        
        # Check if collaboration should continue
        if response_analysis.get('collaboration_complete', False):
            collaboration['status'] = 'completed'
        
        # Emit real-time update
        socketio.emit('expert_response_received', {
            'collaboration_id': collaboration_id,
            'response_analysis': response_analysis,
            'collaboration_status': collaboration['status']
        }, room=f'collaboration_{collaboration_id}')
        
        return jsonify({
            'response_analysis': response_analysis,
            'collaboration_status': collaboration['status'],
            'uncertainty_reduction': collaboration['uncertainty_reduction']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v2/hitl/collaborations', methods=['GET'])
def list_hitl_collaborations():
    """List all active HITL collaborations."""
    try:
        collaborations = list(active_collaborations.values())
        return jsonify({
            'collaborations': collaborations,
            'total_count': len(collaborations)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# MULTI-AGENT ORCHESTRATION APIs
# ============================================================================

@app.route('/api/v2/orchestration/create_network', methods=['POST'])
def create_agent_network():
    """
    Create a multi-agent collaboration network.
    
    Request Body:
    {
        "network_name": "network name",
        "agent_ids": ["agent1", "agent2", "agent3"],
        "collaboration_pattern": "round_table|innovation_lab|hierarchical|dynamic",
        "uncertainty_context": {...},
        "auto_optimize": bool
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'agent_ids' not in data:
            return jsonify({'error': 'Agent IDs are required'}), 400
        
        network_name = data.get('network_name', f'Network-{int(time.time())}')
        agent_ids = data['agent_ids']
        collaboration_pattern = data.get('collaboration_pattern', 'dynamic')
        uncertainty_context = data.get('uncertainty_context', {})
        auto_optimize = data.get('auto_optimize', True)
        
        # Create agent network
        network = orchestration_engine.create_agent_network(
            network_name=network_name,
            agent_ids=agent_ids,
            collaboration_pattern=collaboration_pattern,
            uncertainty_context=uncertainty_context,
            auto_optimize=auto_optimize
        )
        
        # Emit real-time update
        socketio.emit('agent_network_created', {
            'network': network
        }, room='orchestration')
        
        return jsonify({
            'network': network,
            'status': 'created'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v2/orchestration/networks', methods=['GET'])
def list_agent_networks():
    """List all active agent networks."""
    try:
        networks = orchestration_engine.get_active_networks()
        return jsonify({
            'networks': networks,
            'total_count': len(networks)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v2/orchestration/network/<network_id>/optimize', methods=['POST'])
def optimize_agent_network(network_id):
    """Optimize an agent network based on performance metrics."""
    try:
        optimization_result = orchestration_engine.optimize_network(network_id)
        
        # Emit real-time update
        socketio.emit('network_optimized', {
            'network_id': network_id,
            'optimization_result': optimization_result
        }, room='orchestration')
        
        return jsonify({
            'optimization_result': optimization_result,
            'status': 'optimized'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# QUANTUM UNCERTAINTY APIs
# ============================================================================

@app.route('/api/v2/quantum/analyze', methods=['POST'])
def analyze_quantum_uncertainty():
    """
    Perform quantum uncertainty analysis.
    
    Request Body:
    {
        "uncertainty_analysis": {...},
        "content": "text content",
        "context": "optional context",
        "quantum_config": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'uncertainty_analysis' not in data:
            return jsonify({'error': 'Uncertainty analysis is required'}), 400
        
        uncertainty_analysis = data['uncertainty_analysis']
        content = data.get('content', '')
        context = data.get('context', '')
        quantum_config = data.get('quantum_config', {})
        
        # Perform quantum analysis
        quantum_analysis = quantum_engine.analyze_quantum_uncertainty(
            uncertainty_analysis=uncertainty_analysis,
            content=content,
            context=context,
            config=quantum_config
        )
        
        return jsonify({
            'quantum_analysis': quantum_analysis,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v2/quantum/entanglements', methods=['GET'])
def get_quantum_entanglements():
    """Get current quantum entanglements."""
    try:
        entanglements = quantum_engine.get_active_entanglements()
        return jsonify({
            'entanglements': entanglements,
            'total_count': len(entanglements)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# SYSTEM MANAGEMENT APIs
# ============================================================================

@app.route('/api/v2/system/status', methods=['GET'])
def get_system_status():
    """Get Enhanced Veritas 2 system status."""
    try:
        status = enhanced_veritas_bridge.get_system_status()
        return jsonify(status)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v2/system/metrics', methods=['GET'])
def get_system_metrics():
    """Get Enhanced Veritas 2 system metrics."""
    try:
        metrics = enhanced_veritas_bridge.get_system_metrics()
        return jsonify(metrics)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v2/system/config', methods=['GET', 'POST'])
def manage_system_config():
    """Get or update Enhanced Veritas 2 configuration."""
    try:
        if request.method == 'GET':
            config = enhanced_veritas_bridge.get_configuration()
            return jsonify(config)
        
        elif request.method == 'POST':
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Configuration data is required'}), 400
            
            updated_config = enhanced_veritas_bridge.update_configuration(data)
            
            # Emit real-time update
            socketio.emit('system_config_updated', {
                'config': updated_config
            }, room='system')
            
            return jsonify({
                'config': updated_config,
                'status': 'updated'
            })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# WEBSOCKET EVENT HANDLERS
# ============================================================================

@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection."""
    print(f'Client connected: {request.sid}')
    websocket_connections[request.sid] = {
        'connected_time': datetime.now().isoformat(),
        'rooms': []
    }

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection."""
    print(f'Client disconnected: {request.sid}')
    if request.sid in websocket_connections:
        del websocket_connections[request.sid]

@socketio.on('join_session')
def handle_join_session(data):
    """Join a specific session room for real-time updates."""
    session_id = data.get('session_id')
    if session_id:
        room = f'session_{session_id}'
        join_room(room)
        websocket_connections[request.sid]['rooms'].append(room)
        emit('joined_session', {'session_id': session_id, 'room': room})

@socketio.on('join_collaboration')
def handle_join_collaboration(data):
    """Join a specific collaboration room for real-time updates."""
    collaboration_id = data.get('collaboration_id')
    if collaboration_id:
        room = f'collaboration_{collaboration_id}'
        join_room(room)
        websocket_connections[request.sid]['rooms'].append(room)
        emit('joined_collaboration', {'collaboration_id': collaboration_id, 'room': room})

@socketio.on('join_orchestration')
def handle_join_orchestration():
    """Join orchestration room for real-time updates."""
    room = 'orchestration'
    join_room(room)
    websocket_connections[request.sid]['rooms'].append(room)
    emit('joined_orchestration', {'room': room})

@socketio.on('join_system')
def handle_join_system():
    """Join system room for real-time updates."""
    room = 'system'
    join_room(room)
    websocket_connections[request.sid]['rooms'].append(room)
    emit('joined_system', {'room': room})

# ============================================================================
# BACKGROUND TASKS
# ============================================================================

def cleanup_expired_sessions():
    """Clean up expired sessions and collaborations."""
    current_time = datetime.now()
    expired_sessions = []
    expired_collaborations = []
    
    # Check for expired uncertainty sessions (24 hours)
    for session_id, session_data in active_sessions.items():
        created_time = datetime.fromisoformat(session_data['created_time'])
        if current_time - created_time > timedelta(hours=24):
            expired_sessions.append(session_id)
    
    # Check for expired collaborations (2 hours)
    for collaboration_id, collaboration_data in active_collaborations.items():
        created_time = datetime.fromisoformat(collaboration_data['created_time'])
        if current_time - created_time > timedelta(hours=2):
            expired_collaborations.append(collaboration_id)
    
    # Remove expired sessions
    for session_id in expired_sessions:
        del active_sessions[session_id]
        socketio.emit('session_expired', {'session_id': session_id}, room=f'session_{session_id}')
    
    # Remove expired collaborations
    for collaboration_id in expired_collaborations:
        del active_collaborations[collaboration_id]
        socketio.emit('collaboration_expired', {'collaboration_id': collaboration_id}, room=f'collaboration_{collaboration_id}')

def start_background_tasks():
    """Start background cleanup tasks."""
    def cleanup_loop():
        while True:
            time.sleep(3600)  # Run every hour
            cleanup_expired_sessions()
    
    cleanup_thread = threading.Thread(target=cleanup_loop, daemon=True)
    cleanup_thread.start()

# ============================================================================
# APPLICATION STARTUP
# ============================================================================

if __name__ == '__main__':
    # Start background tasks
    start_background_tasks()
    
    # Run the application
    print("Starting Enhanced Veritas 2 API Service...")
    print("API Documentation available at: http://localhost:5000/api/v2/docs")
    print("WebSocket connections available at: ws://localhost:5000")
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)

