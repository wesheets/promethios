"""
Trust Propagation Monitor for Continuous Risk Monitoring System.

This module implements real-time monitoring for trust propagation operations,
detecting anomalies and violations in trust calculations, propagation patterns,
boundary enforcement, and tier transitions.
"""

import logging
import time
from typing import Dict, List, Any, Optional, Set, Tuple
from enum import Enum

from monitoring_framework import BaseMonitor, AlertSeverity, MonitoringEvent

class TrustAnomalyType(Enum):
    """Types of anomalies that can be detected in trust propagation."""
    CALCULATION_DEVIATION = "calculation_deviation"
    UNUSUAL_PROPAGATION = "unusual_propagation"
    BOUNDARY_VIOLATION = "boundary_violation"
    UNEXPECTED_TIER_TRANSITION = "unexpected_tier_transition"
    INHERITANCE_INCONSISTENCY = "inheritance_inconsistency"
    ATTRIBUTE_CORRUPTION = "attribute_corruption"


class TrustPropagationMonitor(BaseMonitor):
    """
    Monitor for trust propagation operations.
    
    This monitor detects anomalies in trust calculations, propagation patterns,
    boundary violations, and tier transitions.
    """
    
    def __init__(self, name: str, framework):
        """
        Initialize the trust propagation monitor.
        
        Args:
            name: Name of the monitor
            framework: Reference to the monitoring framework
        """
        super().__init__(name, framework)
        self.trust_calculation_history = {}
        self.propagation_patterns = {}
        self.boundary_states = {}
        self.tier_transitions = {}
        self.expected_patterns = {}
        self.anomaly_thresholds = {
            TrustAnomalyType.CALCULATION_DEVIATION: 0.1,  # 10% deviation
            TrustAnomalyType.UNUSUAL_PROPAGATION: 0.2,    # 20% deviation
            TrustAnomalyType.BOUNDARY_VIOLATION: 0.0,     # Any violation
            TrustAnomalyType.UNEXPECTED_TIER_TRANSITION: 0.0,  # Any unexpected
            TrustAnomalyType.INHERITANCE_INCONSISTENCY: 0.0,   # Any inconsistency
            TrustAnomalyType.ATTRIBUTE_CORRUPTION: 0.0,        # Any corruption
        }
        self.logger.info(f"Initialized trust propagation monitor: {name}")
    
    def configure(self, config: Dict[str, Any]) -> None:
        """
        Configure the monitor with specific settings.
        
        Args:
            config: Configuration dictionary
        """
        super().configure(config)
        
        # Update anomaly thresholds if provided
        if 'anomaly_thresholds' in config:
            for anomaly_type, threshold in config['anomaly_thresholds'].items():
                if isinstance(anomaly_type, str):
                    anomaly_type = TrustAnomalyType(anomaly_type)
                self.anomaly_thresholds[anomaly_type] = threshold
        
        # Update expected patterns if provided
        if 'expected_patterns' in config:
            self.expected_patterns.update(config['expected_patterns'])
        
        self.logger.info(f"Updated configuration for {self.name}")
    
    def execute(self) -> None:
        """Execute the monitor's check logic."""
        super().execute()
        
        # Run all monitoring functions
        self.monitor_trust_calculation()
        self.detect_propagation_anomalies()
        self.alert_trust_boundary_violations()
        self.track_trust_tier_transitions()
    
    def monitor_trust_calculation(self) -> None:
        """
        Verify trust calculations match expected patterns.
        
        This function checks recent trust calculations against expected patterns
        and historical data to detect anomalies.
        """
        self.logger.debug("Monitoring trust calculations")
        
        # In a real implementation, this would hook into the trust calculation system
        # For now, we'll simulate by checking if we have any calculation data to analyze
        if not hasattr(self, '_test_calculation_data'):
            self.logger.debug("No trust calculation data available")
            return
        
        # Process test calculation data
        for entity_id, calculation in self._test_calculation_data.items():
            expected = self._get_expected_calculation(entity_id, calculation)
            actual = calculation.get('trust_score', 0.0)
            
            # Calculate deviation
            if expected != 0:
                deviation = abs(actual - expected) / expected
            else:
                deviation = abs(actual) if actual != 0 else 0
            
            # Check if deviation exceeds threshold
            if deviation > self.anomaly_thresholds[TrustAnomalyType.CALCULATION_DEVIATION]:
                self.emit_event(
                    event_type="trust_calculation_anomaly",
                    details={
                        "entity_id": entity_id,
                        "expected_score": expected,
                        "actual_score": actual,
                        "deviation": deviation,
                        "threshold": self.anomaly_thresholds[TrustAnomalyType.CALCULATION_DEVIATION],
                        "calculation_factors": calculation.get('factors', {})
                    },
                    severity=AlertSeverity.HIGH
                )
                self.logger.warning(
                    f"Trust calculation anomaly detected for {entity_id}: "
                    f"expected={expected}, actual={actual}, deviation={deviation:.2f}"
                )
            
            # Update history
            if entity_id not in self.trust_calculation_history:
                self.trust_calculation_history[entity_id] = []
            
            self.trust_calculation_history[entity_id].append({
                'timestamp': time.time(),
                'score': actual,
                'factors': calculation.get('factors', {}),
                'expected': expected,
                'deviation': deviation
            })
            
            # Limit history size
            if len(self.trust_calculation_history[entity_id]) > 100:
                self.trust_calculation_history[entity_id] = self.trust_calculation_history[entity_id][-100:]
    
    def _get_expected_calculation(self, entity_id: str, calculation: Dict[str, Any]) -> float:
        """
        Get the expected trust calculation for an entity.
        
        Args:
            entity_id: ID of the entity
            calculation: Current calculation data
            
        Returns:
            Expected trust score
        """
        # Check if we have an expected pattern for this entity
        if entity_id in self.expected_patterns:
            return self.expected_patterns[entity_id]
        
        # If we have historical data, use the average of recent calculations
        if entity_id in self.trust_calculation_history and self.trust_calculation_history[entity_id]:
            recent = self.trust_calculation_history[entity_id][-5:]  # Last 5 calculations
            if recent:
                return sum(item['score'] for item in recent) / len(recent)
        
        # Otherwise, use the current calculation
        return calculation.get('trust_score', 0.0)
    
    def detect_propagation_anomalies(self) -> None:
        """
        Identify unusual propagation patterns.
        
        This function analyzes trust propagation patterns to detect anomalies
        such as unexpected propagation paths or unusual propagation speeds.
        """
        self.logger.debug("Detecting propagation anomalies")
        
        # In a real implementation, this would hook into the trust propagation system
        # For now, we'll simulate by checking if we have any propagation data to analyze
        if not hasattr(self, '_test_propagation_data'):
            self.logger.debug("No propagation data available")
            return
        
        # Process test propagation data
        for source_id, targets in self._test_propagation_data.items():
            # Check if this source has propagated to unexpected targets
            expected_targets = self._get_expected_propagation_targets(source_id)
            unexpected_targets = set(targets.keys()) - expected_targets
            
            if unexpected_targets:
                self.emit_event(
                    event_type="unusual_propagation_pattern",
                    details={
                        "source_id": source_id,
                        "unexpected_targets": list(unexpected_targets),
                        "expected_targets": list(expected_targets),
                        "propagation_data": targets
                    },
                    severity=AlertSeverity.MEDIUM
                )
                self.logger.warning(
                    f"Unusual propagation pattern detected for {source_id}: "
                    f"unexpected targets: {unexpected_targets}"
                )
            
            # Check propagation values for anomalies
            for target_id, prop_data in targets.items():
                expected_value = self._get_expected_propagation_value(source_id, target_id)
                actual_value = prop_data.get('propagated_value', 0.0)
                
                # Calculate deviation
                if expected_value != 0:
                    deviation = abs(actual_value - expected_value) / expected_value
                else:
                    deviation = abs(actual_value) if actual_value != 0 else 0
                
                # Check if deviation exceeds threshold
                if deviation > self.anomaly_thresholds[TrustAnomalyType.UNUSUAL_PROPAGATION]:
                    self.emit_event(
                        event_type="propagation_value_anomaly",
                        details={
                            "source_id": source_id,
                            "target_id": target_id,
                            "expected_value": expected_value,
                            "actual_value": actual_value,
                            "deviation": deviation,
                            "threshold": self.anomaly_thresholds[TrustAnomalyType.UNUSUAL_PROPAGATION],
                            "propagation_data": prop_data
                        },
                        severity=AlertSeverity.MEDIUM
                    )
                    self.logger.warning(
                        f"Propagation value anomaly detected from {source_id} to {target_id}: "
                        f"expected={expected_value}, actual={actual_value}, deviation={deviation:.2f}"
                    )
            
            # Update propagation patterns
            self.propagation_patterns[source_id] = {
                'timestamp': time.time(),
                'targets': targets
            }
    
    def _get_expected_propagation_targets(self, source_id: str) -> Set[str]:
        """
        Get the expected propagation targets for a source entity.
        
        Args:
            source_id: ID of the source entity
            
        Returns:
            Set of expected target entity IDs
        """
        # Check if we have expected patterns for this source
        if source_id in self.expected_patterns and 'propagation_targets' in self.expected_patterns[source_id]:
            return set(self.expected_patterns[source_id]['propagation_targets'])
        
        # If we have historical data, use the targets from the most recent propagation
        if source_id in self.propagation_patterns and 'targets' in self.propagation_patterns[source_id]:
            return set(self.propagation_patterns[source_id]['targets'].keys())
        
        # Otherwise, assume any target is valid (no anomaly detection in this case)
        return set()
    
    def _get_expected_propagation_value(self, source_id: str, target_id: str) -> float:
        """
        Get the expected propagation value from source to target.
        
        Args:
            source_id: ID of the source entity
            target_id: ID of the target entity
            
        Returns:
            Expected propagation value
        """
        # Check if we have expected patterns for this source-target pair
        if (source_id in self.expected_patterns and 
            'propagation_values' in self.expected_patterns[source_id] and
            target_id in self.expected_patterns[source_id]['propagation_values']):
            return self.expected_patterns[source_id]['propagation_values'][target_id]
        
        # If we have historical data, use the value from the most recent propagation
        if (source_id in self.propagation_patterns and 
            'targets' in self.propagation_patterns[source_id] and
            target_id in self.propagation_patterns[source_id]['targets']):
            return self.propagation_patterns[source_id]['targets'][target_id].get('propagated_value', 0.0)
        
        # Otherwise, use the current value
        if hasattr(self, '_test_propagation_data') and source_id in self._test_propagation_data:
            return self._test_propagation_data[source_id].get(target_id, {}).get('propagated_value', 0.0)
        
        return 0.0
    
    def alert_trust_boundary_violations(self) -> None:
        """
        Alert on trust boundary violations.
        
        This function checks for entities that violate trust boundaries
        and generates alerts for such violations.
        """
        self.logger.debug("Checking for trust boundary violations")
        
        # In a real implementation, this would hook into the trust boundary system
        # For now, we'll simulate by checking if we have any boundary data to analyze
        if not hasattr(self, '_test_boundary_data'):
            self.logger.debug("No boundary data available")
            return
        
        # Process test boundary data
        for boundary_id, boundary_data in self._test_boundary_data.items():
            required_score = boundary_data.get('required_score', 0.0)
            entities = boundary_data.get('entities', {})
            
            for entity_id, entity_data in entities.items():
                entity_score = entity_data.get('trust_score', 0.0)
                
                # Check for boundary violation
                if entity_score < required_score:
                    # Check if this is a new violation
                    is_new_violation = True
                    if (boundary_id in self.boundary_states and 
                        entity_id in self.boundary_states[boundary_id] and
                        self.boundary_states[boundary_id][entity_id].get('violation', False)):
                        is_new_violation = False
                    
                    # Record the violation
                    if boundary_id not in self.boundary_states:
                        self.boundary_states[boundary_id] = {}
                    
                    self.boundary_states[boundary_id][entity_id] = {
                        'timestamp': time.time(),
                        'score': entity_score,
                        'required': required_score,
                        'violation': True
                    }
                    
                    # Only emit an event for new violations
                    if is_new_violation:
                        self.emit_event(
                            event_type="trust_boundary_violation",
                            details={
                                "boundary_id": boundary_id,
                                "entity_id": entity_id,
                                "entity_score": entity_score,
                                "required_score": required_score,
                                "deficit": required_score - entity_score,
                                "boundary_data": boundary_data
                            },
                            severity=AlertSeverity.CRITICAL
                        )
                        self.logger.error(
                            f"Trust boundary violation detected: entity {entity_id} "
                            f"with score {entity_score} violates boundary {boundary_id} "
                            f"requiring {required_score}"
                        )
                else:
                    # Record the compliance
                    if boundary_id not in self.boundary_states:
                        self.boundary_states[boundary_id] = {}
                    
                    # Check if this is a resolved violation
                    was_violation = False
                    if (boundary_id in self.boundary_states and 
                        entity_id in self.boundary_states[boundary_id] and
                        self.boundary_states[boundary_id][entity_id].get('violation', False)):
                        was_violation = True
                    
                    self.boundary_states[boundary_id][entity_id] = {
                        'timestamp': time.time(),
                        'score': entity_score,
                        'required': required_score,
                        'violation': False
                    }
                    
                    # Emit an event for resolved violations
                    if was_violation:
                        self.emit_event(
                            event_type="trust_boundary_violation_resolved",
                            details={
                                "boundary_id": boundary_id,
                                "entity_id": entity_id,
                                "entity_score": entity_score,
                                "required_score": required_score,
                                "margin": entity_score - required_score,
                                "boundary_data": boundary_data
                            },
                            severity=AlertSeverity.INFO
                        )
                        self.logger.info(
                            f"Trust boundary violation resolved: entity {entity_id} "
                            f"with score {entity_score} now complies with boundary {boundary_id} "
                            f"requiring {required_score}"
                        )
    
    def track_trust_tier_transitions(self) -> None:
        """
        Monitor trust tier promotions and demotions.
        
        This function tracks transitions between trust tiers and detects
        unexpected or rapid transitions.
        """
        self.logger.debug("Tracking trust tier transitions")
        
        # In a real implementation, this would hook into the trust tier system
        # For now, we'll simulate by checking if we have any tier data to analyze
        if not hasattr(self, '_test_tier_data'):
            self.logger.debug("No tier data available")
            return
        
        # Process test tier data
        for entity_id, tier_data in self._test_tier_data.items():
            current_tier = tier_data.get('current_tier', '')
            previous_tier = tier_data.get('previous_tier', '')
            transition_time = tier_data.get('transition_time', 0.0)
            
            # Check if this is a new entity or a tier change
            if entity_id not in self.tier_transitions or self.tier_transitions[entity_id]['current_tier'] != current_tier:
                # Record the transition
                self.tier_transitions[entity_id] = {
                    'timestamp': time.time(),
                    'current_tier': current_tier,
                    'previous_tier': previous_tier if entity_id in self.tier_transitions else '',
                    'transition_time': transition_time
                }
                
                # Check for unexpected transitions
                if self._is_unexpected_transition(entity_id, previous_tier, current_tier):
                    self.emit_event(
                        event_type="unexpected_tier_transition",
                        details={
                            "entity_id": entity_id,
                            "previous_tier": previous_tier,
                            "current_tier": current_tier,
                            "transition_time": transition_time,
                            "tier_data": tier_data
                        },
                        severity=AlertSeverity.HIGH
                    )
                    self.logger.warning(
                        f"Unexpected tier transition detected for {entity_id}: "
                        f"{previous_tier} -> {current_tier} in {transition_time:.2f}s"
                    )
                
                # Check for rapid transitions
                if self._is_rapid_transition(transition_time):
                    self.emit_event(
                        event_type="rapid_tier_transition",
                        details={
                            "entity_id": entity_id,
                            "previous_tier": previous_tier,
                            "current_tier": current_tier,
                            "transition_time": transition_time,
                            "tier_data": tier_data
                        },
                        severity=AlertSeverity.MEDIUM
                    )
                    self.logger.warning(
                        f"Rapid tier transition detected for {entity_id}: "
                        f"{previous_tier} -> {current_tier} in {transition_time:.2f}s"
                    )
    
    def _is_unexpected_transition(self, entity_id: str, previous_tier: str, current_tier: str) -> bool:
        """
        Determine if a tier transition is unexpected.
        
        Args:
            entity_id: ID of the entity
            previous_tier: Previous tier
            current_tier: Current tier
            
        Returns:
            True if the transition is unexpected, False otherwise
        """
        # Define allowed tier transitions (in a real system, this would be configurable)
        allowed_transitions = {
            '': ['bronze'],  # New entities can only start at bronze
            'bronze': ['silver', ''],  # Bronze can go to silver or be removed
            'silver': ['bronze', 'gold', ''],  # Silver can go to bronze, gold, or be removed
            'gold': ['silver', 'platinum', ''],  # Gold can go to silver, platinum, or be removed
            'platinum': ['gold', '']  # Platinum can go to gold or be removed
        }
        
        # Check if the transition is allowed
        if previous_tier in allowed_transitions and current_tier in allowed_transitions[previous_tier]:
            return False
        
        return True
    
    def _is_rapid_transition(self, transition_time: float) -> bool:
        """
        Determine if a tier transition is unusually rapid.
        
        Args:
            transition_time: Time taken for the transition (in seconds)
            
        Returns:
            True if the transition is rapid, False otherwise
        """
        # Define minimum transition time (in a real system, this would be configurable)
        min_transition_time = 3600.0  # 1 hour
        
        return transition_time < min_transition_time
    
    def set_test_data(self, 
                     calculation_data: Optional[Dict[str, Dict[str, Any]]] = None,
                     propagation_data: Optional[Dict[str, Dict[str, Dict[str, Any]]]] = None,
                     boundary_data: Optional[Dict[str, Dict[str, Any]]] = None,
                     tier_data: Optional[Dict[str, Dict[str, Any]]] = None) -> None:
        """
        Set test data for the monitor.
        
        This method is for testing purposes only and would not exist in a production system.
        
        Args:
            calculation_data: Test trust calculation data
            propagation_data: Test trust propagation data
            boundary_data: Test trust boundary data
            tier_data: Test trust tier data
        """
        if calculation_data is not None:
            self._test_calculation_data = calculation_data
        
        if propagation_data is not None:
            self._test_propagation_data = propagation_data
        
        if boundary_data is not None:
            self._test_boundary_data = boundary_data
        
        if tier_data is not None:
            self._test_tier_data = tier_data
