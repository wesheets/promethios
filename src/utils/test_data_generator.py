"""
Updated Test Data Generator for Schema Validation of Phase 5.5 Components.

This module generates valid test data for all Phase 5.5 components
to ensure compliance with their respective schemas.

This component implements Phase 5.5 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.5
Clauses: 5.5, 5.4, 11.0, 11.1, 5.2.5
"""

import os
import json
import logging
import uuid
import hashlib
from datetime import datetime
from typing import Dict, List, Any, Optional

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def generate_uuid() -> str:
    """Generate a valid UUID string."""
    return str(uuid.uuid4())

def generate_hash(data: str) -> str:
    """Generate a SHA-256 hash of the provided data."""
    return hashlib.sha256(data.encode()).hexdigest()

def generate_test_data() -> Dict[str, Dict[str, Any]]:
    """
    Generate valid test data for all Phase 5.5 components.
    
    Returns:
        Dictionary mapping component names to test data objects
    """
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    # Contract sync test data
    contract_sync_data = {
        "sync_id": generate_uuid(),
        "source_node_id": generate_uuid(),
        "target_node_ids": [generate_uuid(), generate_uuid()],
        "contract_version": "v2025.05.18",
        "contract_hash": generate_hash("contract_content"),
        "timestamp": timestamp,
        "phase_id": "5.5",
        "sync_type": "full",
        "successful_nodes": [generate_uuid()],
        "failed_nodes": [
            {
                "node_id": generate_uuid(),
                "error": "Connection timeout"
            }
        ],
        "attestation": {
            "attester_node_id": generate_uuid(),
            "signature": "Base64EncodedSignatureDataThatIsLongEnoughToPassValidation==",
            "timestamp": timestamp
        },
        "codex_clauses": ["5.5", "5.4", "11.0", "11.1", "5.2.5"]
    }
    
    # Governance proposal test data
    proposal_data = {
        "proposal_id": generate_uuid(),
        "proposed_by": generate_uuid(),
        "target_contract_clause": "11.4.2",
        "rationale": "This proposal aims to improve the governance mesh resilience",
        "changes": {  # Changed from list to object with required properties
            "current_text": "The resilience threshold shall be set to 0.75 for all governance mesh operations.",
            "proposed_text": "The resilience threshold shall be set to 0.85 for all governance mesh operations.",
            "diff": [
                {
                    "path": "/governance/mesh/resilience_threshold",
                    "operation": "replace",
                    "value": "0.85"
                }
            ]
        },
        "status": "draft",
        "created_at": timestamp,
        "phase_id": "5.5",
        "votes": [
            {
                "node_id": generate_uuid(),
                "vote": "approve",
                "timestamp": timestamp,
                "signature": "Base64EncodedSignatureDataThatIsLongEnoughToPassValidation=="
            }
        ],
        "metadata": {
            "priority": "high",
            "tags": ["security", "resilience"]
        },
        "codex_clauses": ["5.5", "5.4", "11.0", "11.1", "5.2.5"]
    }
    
    # Mesh topology test data
    topology_data = {
        "topology_id": generate_uuid(),
        "version": 1,
        "nodes": [
            {
                "node_id": generate_uuid(),
                "node_type": "governance_hub",
                "status": "active",
                "privileges": ["can_propose_policy", "can_vote_on_proposal"],
                "public_key": "Base64EncodedPublicKeyDataThatIsLongEnoughToPassValidation==",
                "network_address": "https://node1.example.com",
                "last_seen": timestamp,
                "node_policy_capabilities": ["contract_sync", "proposal_voting"]
            },
            {
                "node_id": generate_uuid(),
                "node_type": "compliance_witness",
                "status": "active",
                "privileges": ["can_validate_attestation"],
                "public_key": "Base64EncodedPublicKeyDataThatIsLongEnoughToPassValidation==",
                "network_address": "https://node2.example.com",
                "last_seen": timestamp,
                "node_policy_capabilities": ["attestation_validation"]
            }
        ],
        "connections": [
            {
                "source_node_id": generate_uuid(),
                "target_node_id": generate_uuid(),
                "connection_type": "direct",
                "trust_score": 0.95,
                "attestation_id": generate_uuid()
            }
        ],
        "domains": [
            {
                "domain_id": generate_uuid(),
                "name": "Primary Governance Domain",
                "description": "Main governance domain for contract synchronization",
                "admin_node_id": generate_uuid(),
                "member_nodes": [generate_uuid(), generate_uuid()],
                "policy_rules": [
                    {
                        "rule_id": generate_uuid(),
                        "description": "Require 2/3 majority for proposal approval",
                        "rule_type": "voting_threshold",
                        "parameters": {
                            "threshold": 0.66
                        }
                    }
                ]
            }
        ],
        "timestamp": timestamp,
        "phase_id": "5.5",
        "optimization_metrics": {
            "average_latency": 15.5,
            "connectivity_score": 0.95,
            "resilience_score": 0.85
        },
        "codex_clauses": ["5.5", "5.4", "11.0", "11.1", "5.2.5"]
    }
    
    # Verification node test data
    node_data = {
        "node_id": generate_uuid(),
        "name": "Test Verification Node",
        "status": "active",
        "capabilities": ["merkle_verification", "consensus_participation"],
        "timestamp": timestamp,
        "contract_version": "v2025.05.18",
        "phase_id": "5.4",
        "public_key": "Base64EncodedPublicKeyDataThatIsLongEnoughToPassValidation==",
        "network_address": "https://node.example.com",
        "last_seen": timestamp,
        "trust_score": 0.9,
        "verification_count": 42,
        "metadata": {
            "version": "1.2.3",
            "operator": "Test Operator",
            "region": "us-west"
        },
        "codex_clauses": ["5.4", "11.0", "5.2.5"]
    }
    
    # Consensus record test data
    consensus_data = {
        "consensus_id": generate_uuid(),
        "seal_id": generate_uuid(),
        "participating_nodes": [
            {
                "node_id": generate_uuid(),
                "verification_result": True,
                "signature": "Base64EncodedSignatureDataThatIsLongEnoughToPassValidation==",
                "timestamp": timestamp
            },
            {
                "node_id": generate_uuid(),
                "verification_result": True,
                "signature": "Base64EncodedSignatureDataThatIsLongEnoughToPassValidation==",
                "timestamp": timestamp
            }
        ],
        "consensus_result": True,
        "timestamp": timestamp,
        "contract_version": "v2025.05.18",
        "phase_id": "5.4",
        "consensus_threshold": 0.66,
        "consensus_percentage": 1.0,
        "verification_type": "seal_integrity",
        "codex_clauses": ["5.4", "11.0", "5.2.5"]
    }
    
    # Network topology test data
    network_topology_data = {
        "topology_id": generate_uuid(),
        "version": 1,
        "nodes": [
            {
                "node_id": generate_uuid(),
                "name": "Test Node 1",
                "role": "coordinator",  # Changed from 'type' to 'role' to match schema
                "status": "active",
                "address": "localhost",
                "port": 8080
            },
            {
                "node_id": generate_uuid(),
                "name": "Test Node 2",
                "role": "verifier",  # Changed from 'type' to 'role' to match schema
                "status": "active",
                "address": "localhost",
                "port": 8081
            }
        ],
        "connections": [
            {
                "source_node_id": generate_uuid(),
                "target_node_id": generate_uuid(),
                "connection_type": "direct",  # Added required 'connection_type'
                "latency": 10
            }
        ],
        "timestamp": timestamp,  # Added required 'timestamp'
        "contract_version": "v2025.05.18",  # Added required 'contract_version'
        "phase_id": "5.4",  # Added required 'phase_id'
        "topology_hash": generate_hash("topology_content"),
        "optimization_metrics": {
            "average_latency": 15.5,
            "connectivity_score": 0.95,
            "resilience_score": 0.85
        },
        "codex_clauses": ["5.4", "11.0", "5.2.5"]
    }
    
    return {
        "governance_contract_sync": contract_sync_data,
        "governance_proposal_protocol": proposal_data,
        "mesh_topology_manager": topology_data,
        "verification_node_manager": node_data,
        "consensus_service": consensus_data,
        "network_topology_manager": network_topology_data
    }

if __name__ == "__main__":
    # Generate and print test data
    test_data = generate_test_data()
    for component, data in test_data.items():
        print(f"\n=== {component} ===")
        print(json.dumps(data, indent=2))
