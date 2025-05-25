"""
Governance Inheritance Monitor for Continuous Risk Monitoring System.

This module implements real-time monitoring for governance inheritance operations,
detecting anomalies and issues in inheritance chains, inheritance patterns,
boundary enforcement, and attribute propagation.
"""

import logging
import time
from typing import Dict, List, Any, Optional, Set, Tuple
from enum import Enum

from monitoring_framework import BaseMonitor, AlertSeverity, MonitoringEvent

class InheritanceAnomalyType(Enum):
    """Types of anomalies that can be detected in governance inheritance."""
    INCOMPLETE_CHAIN = "incomplete_chain"
    UNUSUAL_PATTERN = "unusual_pattern"
    BOUNDARY_VIOLATION = "boundary_violation"
    ATTRIBUTE_PROPAGATION_FAILURE = "attribute_propagation_failure"
    INHERITANCE_LOOP = "inheritance_loop"
    INCONSISTENT_ATTRIBUTES = "inconsistent_attributes"


class GovernanceInheritanceMonitor(BaseMonitor):
    """
    Monitor for governance inheritance operations.
    
    This monitor detects issues in inheritance chains, inheritance patterns,
    boundary enforcement, and attribute propagation.
    """
    
    def __init__(self, name: str, framework):
        """
        Initialize the governance inheritance monitor.
        
        Args:
            name: Name of the monitor
            framework: Reference to the monitoring framework
        """
        super().__init__(name, framework)
        self.inheritance_chains = {}
        self.boundary_enforcements = {}
        self.attribute_propagations = {}
        self.expected_inheritance_patterns = {}
        self.anomaly_thresholds = {
            InheritanceAnomalyType.INCOMPLETE_CHAIN: 0,  # Any incompleteness is an anomaly
            InheritanceAnomalyType.UNUSUAL_PATTERN: 0.2,  # 20% deviation from expected
            InheritanceAnomalyType.BOUNDARY_VIOLATION: 0,  # Any violation is an anomaly
            InheritanceAnomalyType.ATTRIBUTE_PROPAGATION_FAILURE: 0,  # Any failure is an anomaly
            InheritanceAnomalyType.INHERITANCE_LOOP: 0,  # Any loop is an anomaly
            InheritanceAnomalyType.INCONSISTENT_ATTRIBUTES: 0,  # Any inconsistency is an anomaly
        }
        self.logger.info(f"Initialized governance inheritance monitor: {name}")
    
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
                    anomaly_type = InheritanceAnomalyType(anomaly_type)
                self.anomaly_thresholds[anomaly_type] = threshold
        
        # Update expected inheritance patterns if provided
        if 'expected_inheritance_patterns' in config:
            self.expected_inheritance_patterns.update(config['expected_inheritance_patterns'])
        
        self.logger.info(f"Updated configuration for {self.name}")
    
    def execute(self) -> None:
        """Execute the monitor's check logic."""
        super().execute()
        
        # Run all monitoring functions
        self.verify_inheritance_chains()
        self.detect_inheritance_anomalies()
        self.monitor_inheritance_boundaries()
        self.track_governance_attribute_propagation()
    
    def verify_inheritance_chains(self) -> None:
        """
        Validate complete inheritance chains.
        
        This function checks that inheritance chains are complete and consistent,
        detecting any missing links or inconsistencies.
        """
        self.logger.debug("Verifying inheritance chains")
        
        # In a real implementation, this would hook into the governance inheritance system
        # For now, we'll simulate by checking if we have any chain data to analyze
        if not hasattr(self, '_test_chain_data'):
            self.logger.debug("No inheritance chain data available")
            return
        
        # Process test chain data
        for entity_id, chain_data in self._test_chain_data.items():
            declared_chain = chain_data.get('declared_chain', [])
            actual_chain = chain_data.get('actual_chain', [])
            
            # Check for inheritance loops - do this check first as it's more critical
            if self._has_inheritance_loop(actual_chain):
                self.emit_event(
                    event_type="inheritance_loop_detected",
                    details={
                        "entity_id": entity_id,
                        "chain": actual_chain,
                        "loop_indicators": self._find_loop_indicators(actual_chain)
                    },
                    severity=AlertSeverity.CRITICAL
                )
                self.logger.error(
                    f"Inheritance loop detected for {entity_id} in chain: {actual_chain}"
                )
            
            # Check for incomplete chains
            if set(declared_chain) != set(actual_chain):
                missing_ancestors = set(declared_chain) - set(actual_chain)
                extra_ancestors = set(actual_chain) - set(declared_chain)
                
                self.emit_event(
                    event_type="incomplete_inheritance_chain",
                    details={
                        "entity_id": entity_id,
                        "declared_chain": declared_chain,
                        "actual_chain": actual_chain,
                        "missing_ancestors": list(missing_ancestors),
                        "extra_ancestors": list(extra_ancestors)
                    },
                    severity=AlertSeverity.HIGH
                )
                self.logger.warning(
                    f"Incomplete inheritance chain detected for {entity_id}: "
                    f"missing ancestors: {missing_ancestors}, "
                    f"unexpected ancestors: {extra_ancestors}"
                )
                self.emit_event(
                    event_type="inheritance_loop_detected",
                    details={
                        "entity_id": entity_id,
                        "chain": actual_chain,
                        "loop_indicators": self._find_loop_indicators(actual_chain)
                    },
                    severity=AlertSeverity.CRITICAL
                )
                self.logger.error(
                    f"Inheritance loop detected for {entity_id} in chain: {actual_chain}"
                )
            
            # Update inheritance chains
            self.inheritance_chains[entity_id] = {
                'timestamp': time.time(),
                'declared_chain': declared_chain,
                'actual_chain': actual_chain
            }
    
    def _has_inheritance_loop(self, chain: List[str]) -> bool:
        """
        Check if an inheritance chain contains a loop.
        
        Args:
            chain: Inheritance chain to check
            
        Returns:
            True if the chain contains a loop, False otherwise
        """
        # Count occurrences of each entity in the chain
        entity_counts = {}
        for entity in chain:
            if entity in entity_counts:
                entity_counts[entity] += 1
            else:
                entity_counts[entity] = 1
                
        # If any entity appears more than once, we have a loop
        for entity, count in entity_counts.items():
            if count > 1:
                return True
                
        return False
    
    def _find_loop_indicators(self, chain: List[str]) -> List[str]:
        """
        Find the entities that appear multiple times in a chain (loop indicators).
        
        Args:
            chain: Inheritance chain to check
            
        Returns:
            List of entities that appear multiple times
        """
        seen = set()
        duplicates = []
        
        for entity in chain:
            if entity in seen:
                duplicates.append(entity)
            else:
                seen.add(entity)
        
        return duplicates
    
    def detect_inheritance_anomalies(self) -> None:
        """
        Identify unusual inheritance patterns.
        
        This function analyzes inheritance patterns to detect anomalies
        such as unexpected inheritance relationships or unusual patterns.
        """
        self.logger.debug("Detecting inheritance anomalies")
        
        # In a real implementation, this would hook into the governance inheritance system
        # For now, we'll simulate by checking if we have any pattern data to analyze
        if not hasattr(self, '_test_pattern_data'):
            self.logger.debug("No inheritance pattern data available")
            return
        
        # Process test pattern data
        for pattern_id, pattern_data in self._test_pattern_data.items():
            current_pattern = pattern_data.get('current_pattern', {})
            expected_pattern = self._get_expected_pattern(pattern_id)
            
            # Compare patterns
            if expected_pattern:
                anomalies = self._compare_inheritance_patterns(current_pattern, expected_pattern)
                
                if anomalies:
                    self.emit_event(
                        event_type="unusual_inheritance_pattern",
                        details={
                            "pattern_id": pattern_id,
                            "anomalies": anomalies,
                            "current_pattern": current_pattern,
                            "expected_pattern": expected_pattern
                        },
                        severity=AlertSeverity.MEDIUM
                    )
                    self.logger.warning(
                        f"Unusual inheritance pattern detected for {pattern_id}: "
                        f"{len(anomalies)} anomalies found"
                    )
    
    def _get_expected_pattern(self, pattern_id: str) -> Dict[str, Any]:
        """
        Get the expected inheritance pattern.
        
        Args:
            pattern_id: ID of the pattern
            
        Returns:
            Expected inheritance pattern
        """
        # Check if we have an expected pattern for this ID
        if pattern_id in self.expected_inheritance_patterns:
            return self.expected_inheritance_patterns[pattern_id]
        
        return {}
    
    def _compare_inheritance_patterns(self, current: Dict[str, Any], expected: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Compare current and expected inheritance patterns to find anomalies.
        
        Args:
            current: Current inheritance pattern
            expected: Expected inheritance pattern
            
        Returns:
            List of anomalies found
        """
        anomalies = []
        
        # Compare relationships
        current_relationships = current.get('relationships', {})
        expected_relationships = expected.get('relationships', {})
        
        # Check for missing relationships
        for parent, children in expected_relationships.items():
            if parent not in current_relationships:
                anomalies.append({
                    'type': 'missing_parent',
                    'parent': parent
                })
            else:
                missing_children = set(children) - set(current_relationships[parent])
                if missing_children:
                    anomalies.append({
                        'type': 'missing_children',
                        'parent': parent,
                        'missing_children': list(missing_children)
                    })
        
        # Check for unexpected relationships
        for parent, children in current_relationships.items():
            if parent not in expected_relationships:
                anomalies.append({
                    'type': 'unexpected_parent',
                    'parent': parent
                })
            else:
                unexpected_children = set(children) - set(expected_relationships[parent])
                if unexpected_children:
                    anomalies.append({
                        'type': 'unexpected_children',
                        'parent': parent,
                        'unexpected_children': list(unexpected_children)
                    })
        
        return anomalies
    
    def monitor_inheritance_boundaries(self) -> None:
        """
        Verify boundary enforcement with inheritance.
        
        This function checks that inheritance boundaries are properly enforced,
        detecting any violations or inconsistencies.
        """
        self.logger.debug("Monitoring inheritance boundaries")
        
        # In a real implementation, this would hook into the governance inheritance system
        # For now, we'll simulate by checking if we have any boundary data to analyze
        if not hasattr(self, '_test_boundary_data'):
            self.logger.debug("No inheritance boundary data available")
            return
        
        # Process test boundary data
        for boundary_id, boundary_data in self._test_boundary_data.items():
            allows_inheritance = boundary_data.get('allows_inheritance', False)
            entities = boundary_data.get('entities', {})
            
            for entity_id, entity_data in entities.items():
                has_inheritance = entity_data.get('has_inheritance', False)
                inheritance_chain = entity_data.get('inheritance_chain', [])
                
                # Check for boundary violations
                if not allows_inheritance and has_inheritance:
                    self.emit_event(
                        event_type="inheritance_boundary_violation",
                        details={
                            "boundary_id": boundary_id,
                            "entity_id": entity_id,
                            "allows_inheritance": allows_inheritance,
                            "has_inheritance": has_inheritance,
                            "inheritance_chain": inheritance_chain
                        },
                        severity=AlertSeverity.HIGH
                    )
                    self.logger.warning(
                        f"Inheritance boundary violation detected: entity {entity_id} "
                        f"has inheritance but boundary {boundary_id} doesn't allow it"
                    )
                
                # Update boundary enforcements
                if boundary_id not in self.boundary_enforcements:
                    self.boundary_enforcements[boundary_id] = {}
                
                self.boundary_enforcements[boundary_id][entity_id] = {
                    'timestamp': time.time(),
                    'allows_inheritance': allows_inheritance,
                    'has_inheritance': has_inheritance,
                    'inheritance_chain': inheritance_chain
                }
    
    def track_governance_attribute_propagation(self) -> None:
        """
        Monitor attribute propagation through inheritance.
        
        This function tracks the propagation of governance attributes through
        inheritance chains, detecting any failures or inconsistencies.
        """
        self.logger.debug("Tracking governance attribute propagation")
        
        # In a real implementation, this would hook into the governance inheritance system
        # For now, we'll simulate by checking if we have any attribute data to analyze
        if not hasattr(self, '_test_attribute_data'):
            self.logger.debug("No attribute propagation data available")
            return
        
        # Process test attribute data
        for entity_id, attribute_data in self._test_attribute_data.items():
            inherited_attributes = attribute_data.get('inherited_attributes', {})
            expected_attributes = attribute_data.get('expected_attributes', {})
            inheritance_chain = attribute_data.get('inheritance_chain', [])
            
            # Check for attribute propagation failures
            missing_attributes = {}
            inconsistent_attributes = {}
            
            for attr_name, expected_value in expected_attributes.items():
                if attr_name not in inherited_attributes:
                    missing_attributes[attr_name] = expected_value
                elif inherited_attributes[attr_name] != expected_value:
                    inconsistent_attributes[attr_name] = {
                        'expected': expected_value,
                        'actual': inherited_attributes[attr_name]
                    }
            
            if missing_attributes:
                self.emit_event(
                    event_type="attribute_propagation_failure",
                    details={
                        "entity_id": entity_id,
                        "missing_attributes": missing_attributes,
                        "inheritance_chain": inheritance_chain
                    },
                    severity=AlertSeverity.HIGH
                )
                self.logger.warning(
                    f"Attribute propagation failure detected for {entity_id}: "
                    f"missing attributes: {list(missing_attributes.keys())}"
                )
            
            if inconsistent_attributes:
                self.emit_event(
                    event_type="inconsistent_attributes",
                    details={
                        "entity_id": entity_id,
                        "inconsistent_attributes": inconsistent_attributes,
                        "inheritance_chain": inheritance_chain
                    },
                    severity=AlertSeverity.HIGH
                )
                self.logger.warning(
                    f"Inconsistent attributes detected for {entity_id}: "
                    f"inconsistent attributes: {list(inconsistent_attributes.keys())}"
                )
            
            # Update attribute propagations
            self.attribute_propagations[entity_id] = {
                'timestamp': time.time(),
                'inherited_attributes': inherited_attributes,
                'expected_attributes': expected_attributes,
                'inheritance_chain': inheritance_chain
            }
    
    def set_test_data(self, 
                     chain_data: Optional[Dict[str, Dict[str, Any]]] = None,
                     pattern_data: Optional[Dict[str, Dict[str, Any]]] = None,
                     boundary_data: Optional[Dict[str, Dict[str, Any]]] = None,
                     attribute_data: Optional[Dict[str, Dict[str, Any]]] = None) -> None:
        """
        Set test data for the monitor.
        
        This method is for testing purposes only and would not exist in a production system.
        
        Args:
            chain_data: Test inheritance chain data
            pattern_data: Test inheritance pattern data
            boundary_data: Test boundary enforcement data
            attribute_data: Test attribute propagation data
        """
        if chain_data is not None:
            self._test_chain_data = chain_data
        
        if pattern_data is not None:
            self._test_pattern_data = pattern_data
        
        if boundary_data is not None:
            self._test_boundary_data = boundary_data
        
        if attribute_data is not None:
            self._test_attribute_data = attribute_data
