"""
Enhanced Veritas 2 Data Transformation Layer

Transforms data between Enhanced Veritas 2 and existing Promethios systems.
Ensures compatibility and seamless data flow while preserving data integrity.

This transformer handles bidirectional data conversion, format normalization,
and schema mapping between different system components.
"""

import logging
import json
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime
import uuid
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

class DataFormat(Enum):
    """Supported data formats for transformation."""
    ENHANCED_VERITAS_2 = "enhanced_veritas_2"
    META_GOVERNANCE = "meta_governance"
    MULTI_AGENT_GOVERNANCE = "multi_agent_governance"
    MULTI_AGENT_API = "multi_agent_api"
    VERITAS_SYSTEMS = "veritas_systems"
    DASHBOARD_METRICS = "dashboard_metrics"

@dataclass
class TransformationResult:
    """Result of a data transformation operation."""
    success: bool
    transformed_data: Dict[str, Any]
    source_format: str
    target_format: str
    transformation_id: str
    timestamp: str
    metadata: Dict[str, Any]
    errors: List[str] = None

class DataTransformer:
    """
    Transforms data between Enhanced Veritas 2 and existing systems.
    
    Provides bidirectional transformation capabilities with format validation,
    schema mapping, and error handling for seamless system integration.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.transformation_history = []
        self.schema_mappings = self._initialize_schema_mappings()
        self.format_validators = self._initialize_format_validators()
        
        self.logger.info("Data Transformer initialized")
    
    def _initialize_schema_mappings(self) -> Dict[str, Dict[str, str]]:
        """Initialize schema mappings between different data formats."""
        return {
            # Enhanced Veritas 2 to Meta Governance mapping
            "enhanced_to_meta_governance": {
                "uncertainty_score": "governance_risk_level",
                "uncertainty_sources": "risk_factors",
                "confidence_level": "decision_confidence",
                "clarification_needed": "requires_review",
                "hitl_recommended": "human_intervention_required",
                "quantum_uncertainty": "advanced_risk_metrics"
            },
            
            # Meta Governance to Enhanced Veritas 2 mapping
            "meta_governance_to_enhanced": {
                "governance_risk_level": "uncertainty_score",
                "risk_factors": "uncertainty_sources",
                "decision_confidence": "confidence_level",
                "requires_review": "clarification_needed",
                "human_intervention_required": "hitl_recommended",
                "advanced_risk_metrics": "quantum_uncertainty"
            },
            
            # Enhanced Veritas 2 to Multi-Agent Governance mapping
            "enhanced_to_multi_agent": {
                "uncertainty_score": "trust_impact_factor",
                "agent_uncertainty": "agent_reliability_score",
                "collaboration_uncertainty": "team_cohesion_factor",
                "hitl_session_data": "human_oversight_data",
                "quantum_entanglement": "agent_correlation_metrics"
            },
            
            # Multi-Agent Governance to Enhanced Veritas 2 mapping
            "multi_agent_to_enhanced": {
                "trust_impact_factor": "uncertainty_score",
                "agent_reliability_score": "agent_uncertainty",
                "team_cohesion_factor": "collaboration_uncertainty",
                "human_oversight_data": "hitl_session_data",
                "agent_correlation_metrics": "quantum_entanglement"
            },
            
            # Enhanced Veritas 2 to Dashboard Metrics mapping
            "enhanced_to_dashboard": {
                "uncertainty_score": "uncertainty_percentage",
                "confidence_level": "confidence_percentage",
                "hitl_sessions": "human_interventions",
                "quantum_coherence": "advanced_metrics",
                "uncertainty_reduction_rate": "improvement_rate"
            }
        }
    
    def _initialize_format_validators(self) -> Dict[str, callable]:
        """Initialize format validators for different data types."""
        return {
            DataFormat.ENHANCED_VERITAS_2.value: self._validate_enhanced_veritas_format,
            DataFormat.META_GOVERNANCE.value: self._validate_meta_governance_format,
            DataFormat.MULTI_AGENT_GOVERNANCE.value: self._validate_multi_agent_governance_format,
            DataFormat.MULTI_AGENT_API.value: self._validate_multi_agent_api_format,
            DataFormat.VERITAS_SYSTEMS.value: self._validate_veritas_systems_format,
            DataFormat.DASHBOARD_METRICS.value: self._validate_dashboard_metrics_format
        }
    
    def transform_data(
        self,
        data: Dict[str, Any],
        source_format: DataFormat,
        target_format: DataFormat,
        context: Dict[str, Any] = None
    ) -> TransformationResult:
        """
        Transform data from source format to target format.
        
        Args:
            data: Source data to transform
            source_format: Source data format
            target_format: Target data format
            context: Additional transformation context
            
        Returns:
            TransformationResult with transformed data and metadata
        """
        transformation_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        errors = []
        
        self.logger.info(f"Transforming data from {source_format.value} to {target_format.value}")
        
        try:
            # Validate source data
            if not self._validate_data_format(data, source_format):
                errors.append(f"Invalid source data format: {source_format.value}")
                return TransformationResult(
                    success=False,
                    transformed_data={},
                    source_format=source_format.value,
                    target_format=target_format.value,
                    transformation_id=transformation_id,
                    timestamp=timestamp,
                    metadata={"context": context or {}},
                    errors=errors
                )
            
            # Perform transformation
            transformed_data = self._perform_transformation(data, source_format, target_format, context)
            
            # Validate transformed data
            if not self._validate_data_format(transformed_data, target_format):
                errors.append(f"Transformation resulted in invalid target format: {target_format.value}")
                return TransformationResult(
                    success=False,
                    transformed_data={},
                    source_format=source_format.value,
                    target_format=target_format.value,
                    transformation_id=transformation_id,
                    timestamp=timestamp,
                    metadata={"context": context or {}},
                    errors=errors
                )
            
            # Create successful result
            result = TransformationResult(
                success=True,
                transformed_data=transformed_data,
                source_format=source_format.value,
                target_format=target_format.value,
                transformation_id=transformation_id,
                timestamp=timestamp,
                metadata={
                    "context": context or {},
                    "original_data_size": len(str(data)),
                    "transformed_data_size": len(str(transformed_data))
                }
            )
            
            # Store transformation history
            self.transformation_history.append(result)
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error during data transformation: {e}")
            errors.append(f"Transformation error: {str(e)}")
            
            return TransformationResult(
                success=False,
                transformed_data={},
                source_format=source_format.value,
                target_format=target_format.value,
                transformation_id=transformation_id,
                timestamp=timestamp,
                metadata={"context": context or {}},
                errors=errors
            )
    
    def _perform_transformation(
        self,
        data: Dict[str, Any],
        source_format: DataFormat,
        target_format: DataFormat,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Perform the actual data transformation."""
        
        # Get transformation mapping
        mapping_key = f"{source_format.value.replace('_', '_')}_to_{target_format.value.replace('_', '_')}"
        schema_mapping = self.schema_mappings.get(mapping_key, {})
        
        # Base transformation
        transformed_data = {
            "transformation_metadata": {
                "source_format": source_format.value,
                "target_format": target_format.value,
                "transformation_timestamp": datetime.utcnow().isoformat(),
                "context": context or {}
            }
        }
        
        # Apply schema mapping
        for source_key, target_key in schema_mapping.items():
            if source_key in data:
                transformed_data[target_key] = data[source_key]
        
        # Apply format-specific transformations
        if source_format == DataFormat.ENHANCED_VERITAS_2:
            transformed_data.update(self._transform_from_enhanced_veritas(data, target_format))
        elif target_format == DataFormat.ENHANCED_VERITAS_2:
            transformed_data.update(self._transform_to_enhanced_veritas(data, source_format))
        
        # Copy unmapped fields with prefix
        for key, value in data.items():
            if key not in schema_mapping and not key.startswith("transformation_"):
                transformed_data[f"original_{key}"] = value
        
        return transformed_data
    
    def _transform_from_enhanced_veritas(self, data: Dict[str, Any], target_format: DataFormat) -> Dict[str, Any]:
        """Transform Enhanced Veritas 2 data to target format."""
        result = {}
        
        if target_format == DataFormat.META_GOVERNANCE:
            # Transform for Meta Governance
            result.update({
                "reflection_context": {
                    "uncertainty_analysis": data.get("uncertainty_analysis", {}),
                    "enhanced_veritas_2": True,
                    "requires_reflection": data.get("uncertainty_score", 0) > 0.7
                },
                "governance_impact": {
                    "risk_level": self._uncertainty_to_risk_level(data.get("uncertainty_score", 0)),
                    "intervention_required": data.get("hitl_recommended", False),
                    "confidence_impact": data.get("confidence_level", 0.5)
                }
            })
        
        elif target_format == DataFormat.MULTI_AGENT_GOVERNANCE:
            # Transform for Multi-Agent Governance
            result.update({
                "trust_enhancement_data": {
                    "uncertainty_insights": data.get("uncertainty_analysis", {}),
                    "agent_performance_impact": self._calculate_agent_impact(data),
                    "collaboration_quality": data.get("collaboration_uncertainty", 0.5)
                },
                "compliance_enhancement": {
                    "enhanced_verification": True,
                    "uncertainty_factors": data.get("uncertainty_sources", []),
                    "human_oversight_level": self._calculate_oversight_level(data)
                }
            })
        
        elif target_format == DataFormat.DASHBOARD_METRICS:
            # Transform for Dashboard display
            result.update({
                "metrics": {
                    "uncertainty_percentage": round(data.get("uncertainty_score", 0) * 100, 1),
                    "confidence_percentage": round(data.get("confidence_level", 0) * 100, 1),
                    "hitl_active": data.get("hitl_session_active", False),
                    "quantum_coherence": data.get("quantum_coherence", 0.5)
                },
                "visualization_data": {
                    "uncertainty_breakdown": data.get("uncertainty_sources", []),
                    "trend_data": data.get("uncertainty_history", []),
                    "alert_level": self._calculate_alert_level(data)
                }
            })
        
        return result
    
    def _transform_to_enhanced_veritas(self, data: Dict[str, Any], source_format: DataFormat) -> Dict[str, Any]:
        """Transform data from source format to Enhanced Veritas 2 format."""
        result = {}
        
        if source_format == DataFormat.META_GOVERNANCE:
            # Transform from Meta Governance
            result.update({
                "governance_integration": {
                    "reflection_loop_data": data.get("reflection_context", {}),
                    "governance_state": data.get("governance_state", {}),
                    "policy_compliance": data.get("policy_compliance", True)
                },
                "uncertainty_context": {
                    "governance_uncertainty": self._risk_to_uncertainty_level(data.get("risk_level", "low")),
                    "decision_context": data.get("decision_context", {}),
                    "intervention_history": data.get("intervention_history", [])
                }
            })
        
        elif source_format == DataFormat.MULTI_AGENT_GOVERNANCE:
            # Transform from Multi-Agent Governance
            result.update({
                "agent_integration": {
                    "trust_scores": data.get("trust_scores", {}),
                    "compliance_data": data.get("compliance_data", {}),
                    "agent_interactions": data.get("agent_interactions", [])
                },
                "collaboration_context": {
                    "team_dynamics": data.get("team_dynamics", {}),
                    "communication_quality": data.get("communication_quality", 0.8),
                    "collective_performance": data.get("collective_performance", 0.7)
                }
            })
        
        return result
    
    def _uncertainty_to_risk_level(self, uncertainty_score: float) -> str:
        """Convert uncertainty score to risk level."""
        if uncertainty_score >= 0.8:
            return "high"
        elif uncertainty_score >= 0.6:
            return "medium"
        elif uncertainty_score >= 0.3:
            return "low"
        else:
            return "minimal"
    
    def _risk_to_uncertainty_level(self, risk_level: str) -> float:
        """Convert risk level to uncertainty score."""
        risk_mapping = {
            "high": 0.85,
            "medium": 0.65,
            "low": 0.35,
            "minimal": 0.15
        }
        return risk_mapping.get(risk_level.lower(), 0.5)
    
    def _calculate_agent_impact(self, data: Dict[str, Any]) -> float:
        """Calculate agent performance impact from uncertainty data."""
        uncertainty_score = data.get("uncertainty_score", 0.5)
        confidence_level = data.get("confidence_level", 0.5)
        return max(0, min(1, (confidence_level - uncertainty_score + 1) / 2))
    
    def _calculate_oversight_level(self, data: Dict[str, Any]) -> str:
        """Calculate required human oversight level."""
        uncertainty_score = data.get("uncertainty_score", 0.5)
        if uncertainty_score >= 0.8:
            return "high"
        elif uncertainty_score >= 0.6:
            return "medium"
        else:
            return "low"
    
    def _calculate_alert_level(self, data: Dict[str, Any]) -> str:
        """Calculate alert level for dashboard display."""
        uncertainty_score = data.get("uncertainty_score", 0.5)
        hitl_active = data.get("hitl_session_active", False)
        
        if hitl_active or uncertainty_score >= 0.8:
            return "critical"
        elif uncertainty_score >= 0.6:
            return "warning"
        elif uncertainty_score >= 0.4:
            return "info"
        else:
            return "normal"
    
    def _validate_data_format(self, data: Dict[str, Any], format_type: DataFormat) -> bool:
        """Validate data against format requirements."""
        validator = self.format_validators.get(format_type.value)
        if validator:
            return validator(data)
        return True  # Default to valid if no validator
    
    def _validate_enhanced_veritas_format(self, data: Dict[str, Any]) -> bool:
        """Validate Enhanced Veritas 2 data format."""
        required_fields = ["uncertainty_score", "confidence_level"]
        return all(field in data for field in required_fields)
    
    def _validate_meta_governance_format(self, data: Dict[str, Any]) -> bool:
        """Validate Meta Governance data format."""
        return isinstance(data, dict)  # Basic validation
    
    def _validate_multi_agent_governance_format(self, data: Dict[str, Any]) -> bool:
        """Validate Multi-Agent Governance data format."""
        return isinstance(data, dict)  # Basic validation
    
    def _validate_multi_agent_api_format(self, data: Dict[str, Any]) -> bool:
        """Validate Multi-Agent API data format."""
        return isinstance(data, dict)  # Basic validation
    
    def _validate_veritas_systems_format(self, data: Dict[str, Any]) -> bool:
        """Validate Veritas Systems data format."""
        return isinstance(data, dict)  # Basic validation
    
    def _validate_dashboard_metrics_format(self, data: Dict[str, Any]) -> bool:
        """Validate Dashboard Metrics data format."""
        return isinstance(data, dict)  # Basic validation
    
    def merge_trust_scores(self, existing_scores: Dict[str, Any], enhanced_scores: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge existing trust scores with enhanced uncertainty-based scores.
        
        Args:
            existing_scores: Current trust scores from existing system
            enhanced_scores: Enhanced scores from Enhanced Veritas 2
            
        Returns:
            Merged trust scores with enhanced insights
        """
        self.logger.info("Merging trust scores with enhanced uncertainty insights")
        
        merged_scores = {
            "merge_id": str(uuid.uuid4()),
            "merge_timestamp": datetime.utcnow().isoformat(),
            "existing_scores": existing_scores,
            "enhanced_scores": enhanced_scores,
            "merged_data": {}
        }
        
        # Base merge logic
        base_score = existing_scores.get("current_score", 0.5)
        uncertainty_factor = enhanced_scores.get("uncertainty_score", 0.5)
        confidence_factor = enhanced_scores.get("confidence_level", 0.5)
        
        # Calculate enhanced trust score
        enhanced_trust_score = (
            base_score * 0.6 +  # 60% weight to existing score
            confidence_factor * 0.3 +  # 30% weight to confidence
            (1 - uncertainty_factor) * 0.1  # 10% weight to uncertainty (inverted)
        )
        
        merged_scores["merged_data"] = {
            "trust_score": round(enhanced_trust_score, 3),
            "base_score": base_score,
            "uncertainty_factor": uncertainty_factor,
            "confidence_factor": confidence_factor,
            "enhancement_applied": True,
            "factors": {
                "governance_compliance": enhanced_scores.get("governance_compliance", existing_scores.get("governance_compliance", 0.8)),
                "uncertainty_handling": enhanced_scores.get("uncertainty_handling", 0.7),
                "communication_quality": existing_scores.get("communication_quality", 0.8),
                "task_completion": existing_scores.get("task_completion", 0.8),
                "collaboration_score": existing_scores.get("collaboration_score", 0.7)
            }
        }
        
        return merged_scores
    
    def get_transformation_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent transformation history."""
        return [asdict(result) for result in self.transformation_history[-limit:]]
    
    def get_transformation_stats(self) -> Dict[str, Any]:
        """Get transformation statistics."""
        total_transformations = len(self.transformation_history)
        successful_transformations = sum(1 for result in self.transformation_history if result.success)
        
        return {
            "total_transformations": total_transformations,
            "successful_transformations": successful_transformations,
            "success_rate": successful_transformations / total_transformations if total_transformations > 0 else 0,
            "supported_formats": [format_type.value for format_type in DataFormat],
            "available_mappings": list(self.schema_mappings.keys())
        }

# Global transformer instance
_transformer_instance = None

def get_data_transformer() -> DataTransformer:
    """Get the global Data Transformer instance."""
    global _transformer_instance
    if _transformer_instance is None:
        _transformer_instance = DataTransformer()
    return _transformer_instance

# Convenience functions for external use
def transform_enhanced_to_governance(data: Dict[str, Any], context: Dict[str, Any] = None) -> TransformationResult:
    """Transform Enhanced Veritas 2 data to Meta Governance format."""
    transformer = get_data_transformer()
    return transformer.transform_data(data, DataFormat.ENHANCED_VERITAS_2, DataFormat.META_GOVERNANCE, context)

def transform_enhanced_to_multi_agent(data: Dict[str, Any], context: Dict[str, Any] = None) -> TransformationResult:
    """Transform Enhanced Veritas 2 data to Multi-Agent Governance format."""
    transformer = get_data_transformer()
    return transformer.transform_data(data, DataFormat.ENHANCED_VERITAS_2, DataFormat.MULTI_AGENT_GOVERNANCE, context)

def transform_enhanced_to_dashboard(data: Dict[str, Any], context: Dict[str, Any] = None) -> TransformationResult:
    """Transform Enhanced Veritas 2 data to Dashboard Metrics format."""
    transformer = get_data_transformer()
    return transformer.transform_data(data, DataFormat.ENHANCED_VERITAS_2, DataFormat.DASHBOARD_METRICS, context)

def merge_trust_scores(existing_scores: Dict[str, Any], enhanced_scores: Dict[str, Any]) -> Dict[str, Any]:
    """Merge existing trust scores with enhanced uncertainty-based scores."""
    transformer = get_data_transformer()
    return transformer.merge_trust_scores(existing_scores, enhanced_scores)

