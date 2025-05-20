"""
Trust Aggregation Service for aggregating verification results from multiple nodes.

This module implements Phase 5.4 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.4
Clauses: 5.4, 11.0, 5.2.5
"""

import json
import uuid
import hashlib
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple, Set

# Import from verification_node_manager.py
from src.core.verification.verification_node_manager import pre_loop_tether_check, validate_against_schema


class TrustAggregationService:
    """
    Aggregates verification results from multiple nodes in the distributed verification network.
    
    This component implements Phase 5.4 of the Promethios roadmap.
    Codex Contract: v2025.05.18
    Phase ID: 5.4
    Clauses: 5.4, 11.0, 5.2.5
    """
    
    def __init__(self):
        """Initialize the trust aggregation service."""
        # Perform pre-loop tether check
        if not pre_loop_tether_check("v2025.05.18", "5.4"):
            raise ValueError("Pre-loop tether check failed: Invalid contract version or phase ID")
            
        self.trust_records: Dict[str, Dict[str, Any]] = {}
        self.seal_trust_scores: Dict[str, float] = {}
        self.historical_records: Dict[str, List[Dict[str, Any]]] = {}
    
    def aggregate_verification_results(
        self, 
        seal_id: str, 
        consensus_record: Dict[str, Any],
        node_trust_scores: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Aggregate verification results from a consensus record.
        
        Args:
            seal_id: ID of the Merkle seal
            consensus_record: Consensus record containing verification results
            node_trust_scores: Trust scores for verification nodes
            
        Returns:
            Trust aggregation record
        """
        # Validate consensus record
        is_valid, error = validate_against_schema(
            consensus_record, 
            "consensus_record.schema.v1.json"
        )
        if not is_valid:
            raise ValueError(f"Invalid consensus record: {error}")
        
        # Create trust record ID
        trust_record_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Calculate weighted verification results
        participating_nodes = consensus_record.get("participating_nodes", [])
        if not participating_nodes:
            raise ValueError("Consensus record has no participating nodes")
        
        weighted_results = []
        total_weight = 0.0
        positive_weighted_sum = 0.0
        
        for node_result in participating_nodes:
            node_id = node_result.get("node_id")
            if not node_id:
                continue
            
            # Get node trust score
            node_trust = node_trust_scores.get(node_id, 0.5)  # Default to 0.5 if not provided
            
            # Calculate weighted result
            result_value = 1.0 if node_result.get("verification_result") else 0.0
            weighted_result = result_value * node_trust
            
            weighted_results.append({
                "node_id": node_id,
                "verification_result": node_result.get("verification_result"),
                "node_trust_score": node_trust,
                "weighted_result": weighted_result
            })
            
            total_weight += node_trust
            positive_weighted_sum += weighted_result
        
        # Calculate aggregate trust score
        if total_weight > 0:
            trust_score = positive_weighted_sum / total_weight
        else:
            trust_score = 0.0
        
        # Create trust record
        trust_record = {
            "trust_record_id": trust_record_id,
            "seal_id": seal_id,
            "consensus_id": consensus_record.get("consensus_id"),
            "timestamp": timestamp,
            "trust_score": trust_score,
            "weighted_results": weighted_results,
            "total_weight": total_weight,
            "positive_weighted_sum": positive_weighted_sum,
            "node_count": len(participating_nodes),
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
    
    def get_trust_record(self, trust_record_id: str) -> Dict[str, Any]:
        """
        Get a trust record by ID.
        
        Args:
            trust_record_id: ID of the trust record
            
        Returns:
            Trust record
        """
        if trust_record_id not in self.trust_records:
            raise ValueError(f"Trust record {trust_record_id} not found")
        
        return self.trust_records[trust_record_id]
    
    def get_seal_trust_score(self, seal_id: str) -> float:
        """
        Get the trust score for a Merkle seal.
        
        Args:
            seal_id: ID of the Merkle seal
            
        Returns:
            Trust score between 0.0 and 1.0
        """
        return self.seal_trust_scores.get(seal_id, 0.0)
    
    def get_seal_trust_history(self, seal_id: str) -> List[Dict[str, Any]]:
        """
        Get the trust history for a Merkle seal.
        
        Args:
            seal_id: ID of the Merkle seal
            
        Returns:
            List of trust records
        """
        return self.historical_records.get(seal_id, [])
    
    def calculate_confidence_metrics(self, trust_record_id: str) -> Dict[str, Any]:
        """
        Calculate confidence metrics for a trust record.
        
        Args:
            trust_record_id: ID of the trust record
            
        Returns:
            Confidence metrics
        """
        if trust_record_id not in self.trust_records:
            raise ValueError(f"Trust record {trust_record_id} not found")
        
        trust_record = self.trust_records[trust_record_id]
        weighted_results = trust_record.get("weighted_results", [])
        
        if not weighted_results:
            return {
                "confidence": 0.0,
                "variance": 0.0,
                "agreement_ratio": 0.0
            }
        
        # Calculate variance
        mean = trust_record.get("trust_score", 0.0)
        squared_diffs = []
        
        for result in weighted_results:
            result_value = 1.0 if result.get("verification_result") else 0.0
            squared_diff = (result_value - mean) ** 2
            squared_diffs.append(squared_diff)
        
        variance = sum(squared_diffs) / len(weighted_results)
        
        # Calculate agreement ratio
        positive_count = sum(1 for result in weighted_results if result.get("verification_result"))
        agreement_ratio = max(positive_count, len(weighted_results) - positive_count) / len(weighted_results)
        
        # Calculate confidence
        confidence = agreement_ratio * (1.0 - variance)
        
        return {
            "confidence": confidence,
            "variance": variance,
            "agreement_ratio": agreement_ratio
        }
    
    def get_trust_summary(self, seal_id: str) -> Dict[str, Any]:
        """
        Get a summary of trust information for a Merkle seal.
        
        Args:
            seal_id: ID of the Merkle seal
            
        Returns:
            Trust summary
        """
        trust_score = self.get_seal_trust_score(seal_id)
        history = self.get_seal_trust_history(seal_id)
        
        if not history:
            return {
                "seal_id": seal_id,
                "trust_score": trust_score,
                "verification_count": 0,
                "last_verified": None,
                "confidence_metrics": None
            }
        
        # Get latest trust record
        latest_record = max(history, key=lambda record: record.get("timestamp", ""))
        
        # Calculate confidence metrics
        confidence_metrics = self.calculate_confidence_metrics(latest_record.get("trust_record_id"))
        
        return {
            "seal_id": seal_id,
            "trust_score": trust_score,
            "verification_count": len(history),
            "last_verified": latest_record.get("timestamp"),
            "confidence_metrics": confidence_metrics
        }
    
    def get_all_seal_trust_scores(self) -> Dict[str, float]:
        """
        Get trust scores for all Merkle seals.
        
        Returns:
            Dictionary mapping seal IDs to trust scores
        """
        return self.seal_trust_scores.copy()
    
    def get_high_trust_seals(self, threshold: float = 0.8) -> List[str]:
        """
        Get IDs of Merkle seals with high trust scores.
        
        Args:
            threshold: Trust score threshold
            
        Returns:
            List of seal IDs
        """
        return [
            seal_id for seal_id, score in self.seal_trust_scores.items()
            if score >= threshold
        ]
    
    def get_low_trust_seals(self, threshold: float = 0.3) -> List[str]:
        """
        Get IDs of Merkle seals with low trust scores.
        
        Args:
            threshold: Trust score threshold
            
        Returns:
            List of seal IDs
        """
        return [
            seal_id for seal_id, score in self.seal_trust_scores.items()
            if score <= threshold
        ]
