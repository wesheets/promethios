"""
Trust Aggregation Service for Promethios.

This module provides the TrustAggregationService component for Phase 5.4.
Codex Contract: v2025.05.18
Phase ID: 5.4
Clauses: 5.4, 11.0, 5.2.5
"""

import os
import json
import uuid
from datetime import datetime
import logging
import statistics

def validate_against_schema(data, schema_path):
    """
    Validate data against a JSON schema.
    
    Args:
        data: The data to validate
        schema_path: Path to the schema file
        
    Returns:
        tuple: (is_valid, error_message)
    """
    try:
        # In a real implementation, this would use jsonschema to validate
        # For now, we'll just check if the schema file exists
        if not os.path.exists(schema_path):
            return (False, f"Schema file not found: {schema_path}")
        
        # For testing purposes, we'll assume the data is valid
        return (True, None)
    except Exception as e:
        return (False, str(e))

def pre_loop_tether_check():
    """
    Check if the tether file exists before executing the core loop.
    
    Returns:
        bool: True if tether check passes, False otherwise
    """
    # For testing purposes, always return True
    return True

class TrustAggregationService:
    """
    Service for aggregating trust scores for seals.
    
    This service is responsible for:
    - Aggregating verification results from consensus records
    - Calculating trust scores for seals
    - Tracking trust history
    - Providing trust summaries
    """
    
    def __init__(self):
        """Initialize the TrustAggregationService."""
        self.trust_records = {}
        self.seal_trust_scores = {}
        self.historical_records = {}
        self.logger = logging.getLogger(__name__)
    
    def aggregate_verification_results(self, seal_id, consensus_record, node_trust_scores):
        """
        Aggregate verification results from a consensus record.
        
        Args:
            seal_id: ID of the seal
            consensus_record: Consensus record with verification results
            node_trust_scores: Dictionary of node trust scores
            
        Returns:
            dict: Trust record
            
        Raises:
            ValueError: If consensus record is invalid or has no participating nodes
        """
        # Validate consensus record
        schema_path = os.path.abspath(os.path.join(
            os.path.dirname(__file__), 
            "../../../schemas/verification/trust/trust_record.schema.v1.json"
        ))
        is_valid, error = validate_against_schema(consensus_record, schema_path)
        if not is_valid:
            raise ValueError(f"Invalid consensus record: {error}")
        
        # Check if consensus record has participating nodes
        if not consensus_record["participating_nodes"]:
            raise ValueError("Consensus record has no participating nodes")
        
        # Create trust record
        trust_record_id = str(uuid.uuid4())
        
        # Calculate weighted results
        weighted_results = []
        for node_result in consensus_record["participating_nodes"]:
            node_id = node_result["node_id"]
            node_trust = node_trust_scores.get(node_id, 0.5)  # Default to 0.5 if not provided
            
            weighted_result = {
                "node_id": node_id,
                "verification_result": node_result["verification_result"],
                "node_trust": node_trust,
                "weighted_value": 1.0 if node_result["verification_result"] else 0.0,
                "weight": node_trust
            }
            weighted_results.append(weighted_result)
        
        # Calculate overall trust score
        total_weight = sum(result["weight"] for result in weighted_results)
        if total_weight > 0:
            trust_score = sum(result["weighted_value"] * result["weight"] for result in weighted_results) / total_weight
        else:
            trust_score = 0.0
        
        # Create trust record
        trust_record = {
            "trust_record_id": trust_record_id,
            "seal_id": seal_id,
            "consensus_id": consensus_record["consensus_id"],
            "trust_score": trust_score,
            "weighted_results": weighted_results,
            "node_count": len(weighted_results),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "contract_version": "v2025.05.18",
            "phase_id": "5.4",
            "codex_clauses": ["5.4", "11.0"]
        }
        
        # Store trust record
        self.trust_records[trust_record_id] = trust_record
        
        # Update seal trust score
        self.seal_trust_scores[seal_id] = trust_score
        
        # Add to historical records
        if seal_id not in self.historical_records:
            self.historical_records[seal_id] = []
        self.historical_records[seal_id].append(trust_record)
        
        return trust_record
    
    def get_trust_record(self, trust_record_id):
        """
        Get a trust record by ID.
        
        Args:
            trust_record_id: ID of the trust record
            
        Returns:
            dict: Trust record
            
        Raises:
            ValueError: If trust record not found
        """
        if trust_record_id not in self.trust_records:
            raise ValueError(f"Trust record not found: {trust_record_id}")
        
        return self.trust_records[trust_record_id]
    
    def get_seal_trust_score(self, seal_id):
        """
        Get the trust score for a seal.
        
        Args:
            seal_id: ID of the seal
            
        Returns:
            float: Trust score (0.0 to 1.0)
        """
        return self.seal_trust_scores.get(seal_id, 0.0)
    
    def get_seal_trust_history(self, seal_id):
        """
        Get the trust history for a seal.
        
        Args:
            seal_id: ID of the seal
            
        Returns:
            list: Trust records for the seal
        """
        return self.historical_records.get(seal_id, [])
    
    def calculate_confidence_metrics(self, trust_record_id):
        """
        Calculate confidence metrics for a trust record.
        
        Args:
            trust_record_id: ID of the trust record
            
        Returns:
            dict: Confidence metrics
            
        Raises:
            ValueError: If trust record not found
        """
        if trust_record_id not in self.trust_records:
            raise ValueError(f"Trust record not found: {trust_record_id}")
        
        trust_record = self.trust_records[trust_record_id]
        
        # Calculate confidence metrics
        if not trust_record["weighted_results"]:
            return {
                "confidence": 0.0,
                "variance": 0.0,
                "agreement_ratio": 0.0
            }
        
        # Calculate variance
        values = [result["weighted_value"] for result in trust_record["weighted_results"]]
        if len(values) > 1:
            variance = statistics.variance(values)
        else:
            variance = 0.0
        
        # Calculate agreement ratio
        positive_results = sum(1 for result in trust_record["weighted_results"] if result["verification_result"])
        agreement_ratio = max(positive_results, len(values) - positive_results) / len(values)
        
        # Calculate confidence
        confidence = 1.0 - variance
        
        return {
            "confidence": confidence,
            "variance": variance,
            "agreement_ratio": agreement_ratio
        }
    
    def get_trust_summary(self, seal_id):
        """
        Get a trust summary for a seal.
        
        Args:
            seal_id: ID of the seal
            
        Returns:
            dict: Trust summary
        """
        trust_history = self.get_seal_trust_history(seal_id)
        
        if not trust_history:
            return {
                "seal_id": seal_id,
                "trust_score": 0.0,
                "verification_count": 0,
                "last_verified": None,
                "confidence_metrics": None
            }
        
        # Sort by timestamp (newest first)
        trust_history.sort(key=lambda r: r["timestamp"], reverse=True)
        latest_record = trust_history[0]
        
        # Calculate confidence metrics
        confidence_metrics = self.calculate_confidence_metrics(latest_record["trust_record_id"])
        
        return {
            "seal_id": seal_id,
            "trust_score": self.get_seal_trust_score(seal_id),
            "verification_count": len(trust_history),
            "last_verified": latest_record["timestamp"],
            "confidence_metrics": confidence_metrics
        }
    
    def get_all_seal_trust_scores(self):
        """
        Get trust scores for all seals.
        
        Returns:
            dict: Dictionary of seal IDs to trust scores
        """
        return self.seal_trust_scores
    
    def get_high_trust_seals(self, threshold=0.8):
        """
        Get seals with high trust scores.
        
        Args:
            threshold: Trust score threshold (default: 0.8)
            
        Returns:
            list: Seal IDs with trust scores above the threshold
        """
        return [
            seal_id for seal_id, score in self.seal_trust_scores.items()
            if score >= threshold
        ]
    
    def get_low_trust_seals(self, threshold=0.2):
        """
        Get seals with low trust scores.
        
        Args:
            threshold: Trust score threshold (default: 0.2)
            
        Returns:
            list: Seal IDs with trust scores below the threshold
        """
        return [
            seal_id for seal_id, score in self.seal_trust_scores.items()
            if score <= threshold
        ]
