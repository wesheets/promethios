"""
Trust Boundaries API for Promethios
Provides endpoints for creating, managing, and evaluating trust boundaries between agents
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from flask import Blueprint, request, jsonify
from dataclasses import dataclass, asdict
import uuid

# Add the parent directory to the path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
trust_boundaries_bp = Blueprint('trust_boundaries', __name__, url_prefix='/api/trust')

@dataclass
class TrustEvaluation:
    evaluation_id: str
    source_instance_id: str
    target_instance_id: str
    trust_score: float
    confidence: float
    evaluation_timestamp: str
    trust_dimensions: Dict[str, float]
    metadata: Dict[str, Any]

@dataclass
class TrustBoundary:
    boundary_id: str
    source_instance_id: str
    target_instance_id: str
    source_name: str
    target_name: str
    trust_level: int
    boundary_type: str
    status: str
    created_at: str
    expires_at: Optional[str]
    policies: List[Dict[str, Any]]
    attestations: List[str]
    metadata: Dict[str, Any]

# In-memory storage for demo purposes (in production, this would use a database)
trust_evaluations = {}
trust_boundaries = {}

@trust_boundaries_bp.route('/evaluate', methods=['POST'])
def evaluate_trust():
    """
    Evaluate trust between two agents
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract required fields
        source_id = data.get('source_instance_id') or data.get('agent_id')
        target_id = data.get('target_instance_id') or data.get('target_id')
        
        if not source_id or not target_id:
            return jsonify({'error': 'source_instance_id and target_instance_id are required'}), 400
        
        # Generate evaluation ID
        evaluation_id = str(uuid.uuid4())
        
        # Simulate trust evaluation (in production, this would use ML models)
        # Base trust score with some randomness for demo
        base_score = 0.75 + (hash(f"{source_id}_{target_id}") % 100) / 400  # 0.75-0.99
        
        # Trust dimensions
        trust_dimensions = {
            'competence': base_score + 0.05,
            'reliability': base_score - 0.02,
            'honesty': base_score + 0.03,
            'transparency': base_score - 0.01
        }
        
        # Ensure all dimensions are within [0, 1]
        trust_dimensions = {k: max(0, min(1, v)) for k, v in trust_dimensions.items()}
        
        # Overall trust score is average of dimensions
        trust_score = sum(trust_dimensions.values()) / len(trust_dimensions)
        
        # Confidence based on consistency of dimensions
        dimension_variance = sum((v - trust_score) ** 2 for v in trust_dimensions.values()) / len(trust_dimensions)
        confidence = max(0.5, 1 - dimension_variance * 10)  # Higher variance = lower confidence
        
        evaluation = TrustEvaluation(
            evaluation_id=evaluation_id,
            source_instance_id=source_id,
            target_instance_id=target_id,
            trust_score=trust_score,
            confidence=confidence,
            evaluation_timestamp=datetime.utcnow().isoformat(),
            trust_dimensions=trust_dimensions,
            metadata={
                'evaluation_context': data.get('evaluation_context', {}),
                'evaluation_history': data.get('evaluation_history', []),
                'requested_dimensions': data.get('trust_dimensions', [])
            }
        )
        
        # Store evaluation
        trust_evaluations[evaluation_id] = evaluation
        
        logger.info(f"Trust evaluation completed: {source_id} -> {target_id}, score: {trust_score:.3f}")
        
        return jsonify(asdict(evaluation)), 200
        
    except Exception as e:
        logger.error(f"Error evaluating trust: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@trust_boundaries_bp.route('/boundaries', methods=['GET'])
def get_boundaries():
    """
    Get all trust boundaries
    """
    try:
        # Return all boundaries
        boundaries_list = [asdict(boundary) for boundary in trust_boundaries.values()]
        
        return jsonify({
            'boundaries': boundaries_list,
            'total': len(boundaries_list),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting boundaries: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@trust_boundaries_bp.route('/boundaries', methods=['POST'])
def create_boundary():
    """
    Create a new trust boundary
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract required fields
        source_id = data.get('source_instance_id')
        target_id = data.get('target_instance_id')
        boundary_type = data.get('boundary_type', 'direct')
        
        if not source_id or not target_id:
            return jsonify({'error': 'source_instance_id and target_instance_id are required'}), 400
        
        # Generate boundary ID
        boundary_id = f"boundary_{int(datetime.utcnow().timestamp())}_{str(uuid.uuid4())[:8]}"
        
        # Create boundary
        boundary = TrustBoundary(
            boundary_id=boundary_id,
            source_instance_id=source_id,
            target_instance_id=target_id,
            source_name=data.get('source_name', f"Agent {source_id}"),
            target_name=data.get('target_name', f"Agent {target_id}"),
            trust_level=data.get('trust_level', 80),
            boundary_type=boundary_type,
            status='active',
            created_at=datetime.utcnow().isoformat(),
            expires_at=data.get('expires_at'),
            policies=data.get('policies', []),
            attestations=[f"attestation_{boundary_id}"],
            metadata=data.get('metadata', {})
        )
        
        # Store boundary
        trust_boundaries[boundary_id] = boundary
        
        logger.info(f"Trust boundary created: {boundary_id} ({source_id} -> {target_id})")
        
        return jsonify(asdict(boundary)), 201
        
    except Exception as e:
        logger.error(f"Error creating boundary: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@trust_boundaries_bp.route('/boundaries/<boundary_id>', methods=['GET'])
def get_boundary(boundary_id):
    """
    Get a specific trust boundary
    """
    try:
        boundary = trust_boundaries.get(boundary_id)
        
        if not boundary:
            return jsonify({'error': 'Boundary not found'}), 404
        
        return jsonify(asdict(boundary)), 200
        
    except Exception as e:
        logger.error(f"Error getting boundary {boundary_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@trust_boundaries_bp.route('/boundaries/<boundary_id>', methods=['PUT'])
def update_boundary(boundary_id):
    """
    Update a trust boundary
    """
    try:
        boundary = trust_boundaries.get(boundary_id)
        
        if not boundary:
            return jsonify({'error': 'Boundary not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update boundary fields
        for field, value in data.items():
            if hasattr(boundary, field) and field not in ['boundary_id', 'created_at']:
                setattr(boundary, field, value)
        
        # Update timestamp
        boundary.metadata['updated_at'] = datetime.utcnow().isoformat()
        
        logger.info(f"Trust boundary updated: {boundary_id}")
        
        return jsonify(asdict(boundary)), 200
        
    except Exception as e:
        logger.error(f"Error updating boundary {boundary_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@trust_boundaries_bp.route('/boundaries/<boundary_id>', methods=['DELETE'])
def delete_boundary(boundary_id):
    """
    Delete a trust boundary
    """
    try:
        boundary = trust_boundaries.get(boundary_id)
        
        if not boundary:
            return jsonify({'error': 'Boundary not found'}), 404
        
        del trust_boundaries[boundary_id]
        
        logger.info(f"Trust boundary deleted: {boundary_id}")
        
        return jsonify({'message': 'Boundary deleted successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error deleting boundary {boundary_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@trust_boundaries_bp.route('/metrics', methods=['GET'])
def get_trust_metrics():
    """
    Get trust boundary metrics
    """
    try:
        total_boundaries = len(trust_boundaries)
        active_boundaries = sum(1 for b in trust_boundaries.values() if b.status == 'active')
        
        if total_boundaries > 0:
            avg_trust_level = sum(b.trust_level for b in trust_boundaries.values()) / total_boundaries
            at_risk_count = sum(1 for b in trust_boundaries.values() if b.trust_level < 70)
        else:
            avg_trust_level = 0
            at_risk_count = 0
        
        # Count policies
        total_policies = sum(len(b.policies) for b in trust_boundaries.values())
        
        metrics = {
            'active_boundaries': active_boundaries,
            'total_boundaries': total_boundaries,
            'average_trust_level': round(avg_trust_level, 1),
            'at_risk_boundaries': at_risk_count,
            'active_policies': total_policies,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify(metrics), 200
        
    except Exception as e:
        logger.error(f"Error getting trust metrics: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@trust_boundaries_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'service': 'trust-boundaries-api',
        'version': '1.0.0',
        'endpoints': {
            'evaluate_trust': '/api/trust/evaluate',
            'get_boundaries': '/api/trust/boundaries',
            'create_boundary': '/api/trust/boundaries',
            'get_boundary': '/api/trust/boundaries/<boundary_id>',
            'update_boundary': '/api/trust/boundaries/<boundary_id>',
            'delete_boundary': '/api/trust/boundaries/<boundary_id>',
            'get_metrics': '/api/trust/metrics'
        },
        'statistics': {
            'total_evaluations': len(trust_evaluations),
            'total_boundaries': len(trust_boundaries)
        }
    }), 200

