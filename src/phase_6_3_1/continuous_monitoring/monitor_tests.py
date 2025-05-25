"""
Tests for the Real-Time Anomaly Detection Monitors.

This module contains unit tests for the Phase 2 real-time monitors:
- TrustPropagationMonitor
- MemoryLoggingMonitor
- GovernanceInheritanceMonitor
- LoopManagementMonitor
"""

import unittest
import os
import time
import json
import tempfile
import threading
import logging
from typing import Dict, Any, List

from monitoring_framework import (
    MonitoringFramework,
    AlertSeverity,
    MonitoringEvent
)
from trust_propagation_monitor import TrustPropagationMonitor, TrustAnomalyType
from memory_logging_monitor import MemoryLoggingMonitor, LoggingAnomalyType
from governance_inheritance_monitor import GovernanceInheritanceMonitor, InheritanceAnomalyType
from loop_management_monitor import LoopManagementMonitor, LoopAnomalyType

# Configure logging for tests
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


class TrustPropagationMonitorTests(unittest.TestCase):
    """Test cases for the TrustPropagationMonitor class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.framework = MonitoringFramework()
        self.monitor = TrustPropagationMonitor("trust_monitor", self.framework)
        self.framework.register_monitor(self.monitor)
    
    def tearDown(self):
        """Tear down test fixtures."""
        if self.framework.running:
            self.framework.stop()
    
    def test_trust_calculation_anomaly_detection(self):
        """Test detection of trust calculation anomalies."""
        # Set up test data with a significant deviation
        test_calculation_data = {
            "entity1": {
                "trust_score": 0.8,
                "factors": {"history": 0.9, "verification": 0.7}
            }
        }
        
        # Set expected pattern to create a deviation
        self.monitor.expected_patterns = {
            "entity1": 0.5  # Expected trust score
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(calculation_data=test_calculation_data)
        self.monitor.monitor_trust_calculation()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "trust_calculation_anomaly"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["entity_id"], "entity1")
        self.assertEqual(events[0].details["expected_score"], 0.5)
        self.assertEqual(events[0].details["actual_score"], 0.8)
        self.assertAlmostEqual(events[0].details["deviation"], 0.6)  # (0.8-0.5)/0.5 = 0.6
        self.assertEqual(events[0].severity, AlertSeverity.HIGH)
    
    def test_propagation_anomaly_detection(self):
        """Test detection of unusual propagation patterns."""
        # Set up test data with unexpected propagation targets
        test_propagation_data = {
            "source1": {
                "target1": {"propagated_value": 0.7},
                "target2": {"propagated_value": 0.6},
                "target3": {"propagated_value": 0.5}  # Unexpected target
            }
        }
        
        # Set expected propagation targets
        self.monitor.expected_patterns = {
            "source1": {
                "propagation_targets": ["target1", "target2"]
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(propagation_data=test_propagation_data)
        self.monitor.detect_propagation_anomalies()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "unusual_propagation_pattern"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["source_id"], "source1")
        self.assertIn("target3", events[0].details["unexpected_targets"])
        self.assertEqual(events[0].severity, AlertSeverity.MEDIUM)
    
    def test_boundary_violation_detection(self):
        """Test detection of trust boundary violations."""
        # Set up test data with a boundary violation
        test_boundary_data = {
            "boundary1": {
                "required_score": 0.7,
                "entities": {
                    "entity1": {"trust_score": 0.6},  # Violation
                    "entity2": {"trust_score": 0.8}   # No violation
                }
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(boundary_data=test_boundary_data)
        self.monitor.alert_trust_boundary_violations()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "trust_boundary_violation"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["boundary_id"], "boundary1")
        self.assertEqual(events[0].details["entity_id"], "entity1")
        self.assertEqual(events[0].details["entity_score"], 0.6)
        self.assertEqual(events[0].details["required_score"], 0.7)
        self.assertEqual(events[0].severity, AlertSeverity.CRITICAL)
    
    def test_tier_transition_detection(self):
        """Test detection of unexpected tier transitions."""
        # Set up test data with an unexpected tier transition
        test_tier_data = {
            "entity1": {
                "current_tier": "platinum",
                "previous_tier": "bronze",  # Unexpected jump from bronze to platinum
                "transition_time": 1800.0   # 30 minutes
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(tier_data=test_tier_data)
        self.monitor.track_trust_tier_transitions()
        
        # Check that events were emitted
        unexpected_events = [e for e in self.framework.event_history if e.event_type == "unexpected_tier_transition"]
        rapid_events = [e for e in self.framework.event_history if e.event_type == "rapid_tier_transition"]
        
        self.assertEqual(len(unexpected_events), 1)
        self.assertEqual(unexpected_events[0].details["entity_id"], "entity1")
        self.assertEqual(unexpected_events[0].details["previous_tier"], "bronze")
        self.assertEqual(unexpected_events[0].details["current_tier"], "platinum")
        self.assertEqual(unexpected_events[0].severity, AlertSeverity.HIGH)
        
        self.assertEqual(len(rapid_events), 1)
        self.assertEqual(rapid_events[0].details["entity_id"], "entity1")
        self.assertEqual(rapid_events[0].details["transition_time"], 1800.0)
        self.assertEqual(rapid_events[0].severity, AlertSeverity.MEDIUM)


class MemoryLoggingMonitorTests(unittest.TestCase):
    """Test cases for the MemoryLoggingMonitor class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.framework = MonitoringFramework()
        self.monitor = MemoryLoggingMonitor("logging_monitor", self.framework)
        self.framework.register_monitor(self.monitor)
    
    def tearDown(self):
        """Tear down test fixtures."""
        if self.framework.running:
            self.framework.stop()
    
    def test_missing_log_entries_detection(self):
        """Test detection of missing log entries."""
        # Set up test data with missing sequence numbers
        test_log_data = {
            "source1": [
                {"sequence_number": 1, "timestamp": 1000.0},
                {"sequence_number": 2, "timestamp": 1001.0},
                # Missing sequence 3
                {"sequence_number": 4, "timestamp": 1003.0},
                {"sequence_number": 5, "timestamp": 1004.0}
            ]
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(log_data=test_log_data)
        self.monitor.verify_log_completeness()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "missing_log_entries"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["source_id"], "source1")
        self.assertIn(3, events[0].details["missing_sequences"])
        self.assertEqual(events[0].severity, AlertSeverity.HIGH)
    
    def test_timestamp_disorder_detection(self):
        """Test detection of timestamp disorder."""
        # Set up test data with out-of-order timestamps
        test_log_data = {
            "source1": [
                {"sequence_number": 1, "timestamp": 1000.0},
                {"sequence_number": 2, "timestamp": 1001.0},
                {"sequence_number": 3, "timestamp": 999.0},  # Out of order
                {"sequence_number": 4, "timestamp": 1003.0}
            ]
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(log_data=test_log_data)
        self.monitor.validate_timestamp_sequence()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "timestamp_disorder"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["source_id"], "source1")
        self.assertEqual(len(events[0].details["disorders"]), 1)
        self.assertEqual(events[0].details["disorders"][0]["sequence"], 3)
        self.assertEqual(events[0].severity, AlertSeverity.HIGH)
    
    def test_excessive_latency_detection(self):
        """Test detection of excessive logging latency."""
        # Set up test data with excessive latency
        test_latency_data = {
            "source1": {
                "current_latency_ms": 600.0,  # Above default threshold of 500ms
                "average_latency_ms": 300.0
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(latency_data=test_latency_data)
        self.monitor.detect_logging_latency_issues()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "excessive_logging_latency"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["source_id"], "source1")
        self.assertEqual(events[0].details["current_latency_ms"], 600.0)
        self.assertEqual(events[0].details["threshold_ms"], 500.0)
        self.assertEqual(events[0].severity, AlertSeverity.HIGH)
    
    def test_storage_corruption_detection(self):
        """Test detection of log storage corruption."""
        # Set up test data with checksum mismatch
        test_storage_data = {
            "storage1": {
                "checksum": "abc123",
                "expected_checksum": "def456",
                "metadata": {"size": 1024, "format": "json"}
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(storage_data=test_storage_data)
        self.monitor.monitor_log_storage_integrity()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "log_storage_corruption"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["storage_id"], "storage1")
        self.assertEqual(events[0].details["current_checksum"], "abc123")
        self.assertEqual(events[0].details["expected_checksum"], "def456")
        self.assertEqual(events[0].severity, AlertSeverity.CRITICAL)


class GovernanceInheritanceMonitorTests(unittest.TestCase):
    """Test cases for the GovernanceInheritanceMonitor class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.framework = MonitoringFramework()
        self.monitor = GovernanceInheritanceMonitor("inheritance_monitor", self.framework)
        self.framework.register_monitor(self.monitor)
    
    def tearDown(self):
        """Tear down test fixtures."""
        if self.framework.running:
            self.framework.stop()
    
    def test_incomplete_chain_detection(self):
        """Test detection of incomplete inheritance chains."""
        # Set up test data with incomplete chain
        test_chain_data = {
            "entity1": {
                "declared_chain": ["parent1", "grandparent1", "root1"],
                "actual_chain": ["parent1", "root1"]  # Missing grandparent1
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(chain_data=test_chain_data)
        self.monitor.verify_inheritance_chains()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "incomplete_inheritance_chain"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["entity_id"], "entity1")
        self.assertIn("grandparent1", events[0].details["missing_ancestors"])
        self.assertEqual(events[0].severity, AlertSeverity.HIGH)
    
    def test_inheritance_loop_detection(self):
        """Test detection of inheritance loops."""
        # Set up test data with an inheritance loop
        test_chain_data = {
            "entity1": {
                "declared_chain": ["parent1", "grandparent1", "parent1"],  # Loop with parent1 appearing twice
                "actual_chain": ["parent1", "grandparent1", "parent1"]
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(chain_data=test_chain_data)
        self.monitor.verify_inheritance_chains()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "inheritance_loop_detected"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["entity_id"], "entity1")
        self.assertIn("parent1", events[0].details["loop_indicators"])
        self.assertEqual(events[0].severity, AlertSeverity.CRITICAL)
    
    def test_unusual_pattern_detection(self):
        """Test detection of unusual inheritance patterns."""
        # Set up test data with unusual pattern
        test_pattern_data = {
            "pattern1": {
                "current_pattern": {
                    "relationships": {
                        "parent1": ["child1", "child2", "child3"],  # Extra child3
                        "parent2": []  # Missing children
                    }
                }
            }
        }
        
        # Set expected pattern
        self.monitor.expected_inheritance_patterns = {
            "pattern1": {
                "relationships": {
                    "parent1": ["child1", "child2"],
                    "parent2": ["child4", "child5"]
                }
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(pattern_data=test_pattern_data)
        self.monitor.detect_inheritance_anomalies()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "unusual_inheritance_pattern"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["pattern_id"], "pattern1")
        
        # Check that anomalies were detected
        anomalies = events[0].details["anomalies"]
        self.assertGreaterEqual(len(anomalies), 2)  # At least 2 anomalies
        
        # Find specific anomalies
        extra_child = next((a for a in anomalies if a.get("type") == "unexpected_children"), None)
        missing_children = next((a for a in anomalies if a.get("type") == "missing_children"), None)
        
        self.assertIsNotNone(extra_child)
        self.assertIsNotNone(missing_children)
        self.assertIn("child3", extra_child["unexpected_children"])
        self.assertEqual(missing_children["parent"], "parent2")
        self.assertEqual(events[0].severity, AlertSeverity.MEDIUM)
    
    def test_boundary_violation_detection(self):
        """Test detection of inheritance boundary violations."""
        # Set up test data with boundary violation
        test_boundary_data = {
            "boundary1": {
                "allows_inheritance": False,
                "entities": {
                    "entity1": {
                        "has_inheritance": True,
                        "inheritance_chain": ["parent1", "grandparent1"]
                    }
                }
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(boundary_data=test_boundary_data)
        self.monitor.monitor_inheritance_boundaries()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "inheritance_boundary_violation"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["boundary_id"], "boundary1")
        self.assertEqual(events[0].details["entity_id"], "entity1")
        self.assertEqual(events[0].details["allows_inheritance"], False)
        self.assertEqual(events[0].details["has_inheritance"], True)
        self.assertEqual(events[0].severity, AlertSeverity.HIGH)
    
    def test_attribute_propagation_failure_detection(self):
        """Test detection of attribute propagation failures."""
        # Set up test data with attribute propagation failure
        test_attribute_data = {
            "entity1": {
                "inherited_attributes": {
                    "attr1": "value1",
                    # Missing attr2
                    "attr3": "value3_wrong"  # Inconsistent value
                },
                "expected_attributes": {
                    "attr1": "value1",
                    "attr2": "value2",
                    "attr3": "value3"
                },
                "inheritance_chain": ["parent1", "grandparent1"]
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(attribute_data=test_attribute_data)
        self.monitor.track_governance_attribute_propagation()
        
        # Check that events were emitted
        missing_events = [e for e in self.framework.event_history if e.event_type == "attribute_propagation_failure"]
        inconsistent_events = [e for e in self.framework.event_history if e.event_type == "inconsistent_attributes"]
        
        self.assertEqual(len(missing_events), 1)
        self.assertEqual(missing_events[0].details["entity_id"], "entity1")
        self.assertIn("attr2", missing_events[0].details["missing_attributes"])
        self.assertEqual(missing_events[0].severity, AlertSeverity.HIGH)
        
        self.assertEqual(len(inconsistent_events), 1)
        self.assertEqual(inconsistent_events[0].details["entity_id"], "entity1")
        self.assertIn("attr3", inconsistent_events[0].details["inconsistent_attributes"])
        self.assertEqual(inconsistent_events[0].severity, AlertSeverity.HIGH)


class LoopManagementMonitorTests(unittest.TestCase):
    """Test cases for the LoopManagementMonitor class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.framework = MonitoringFramework()
        self.monitor = LoopManagementMonitor("loop_monitor", self.framework)
        self.framework.register_monitor(self.monitor)
    
    def tearDown(self):
        """Tear down test fixtures."""
        if self.framework.running:
            self.framework.stop()
    
    def test_execution_failure_detection(self):
        """Test detection of loop execution failures."""
        # Set up test data with execution failure
        test_execution_data = {
            "loop1": {
                "current_iteration": 5,
                "expected_iterations": 10,
                "execution_time": 2.5,
                "success_rate": 0.7  # 30% failure rate
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(execution_data=test_execution_data)
        self.monitor.monitor_loop_execution()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "loop_execution_failure"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["loop_id"], "loop1")
        self.assertEqual(events[0].details["success_rate"], 0.7)
        self.assertAlmostEqual(events[0].details["failure_rate"], 0.3, places=5)
        self.assertEqual(events[0].severity, AlertSeverity.HIGH)
    
    def test_infinite_loop_detection(self):
        """Test detection of potential infinite loops."""
        # Set up test data with excessive iterations
        test_execution_data = {
            "loop1": {
                "current_iteration": 110,  # 11x expected
                "expected_iterations": 10,
                "execution_time": 30.0,
                "success_rate": 1.0
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(execution_data=test_execution_data)
        self.monitor.monitor_loop_execution()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "potential_infinite_loop"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["loop_id"], "loop1")
        self.assertEqual(events[0].details["current_iteration"], 110)
        self.assertEqual(events[0].details["expected_iterations"], 10)
        self.assertEqual(events[0].details["ratio"], 11.0)
        self.assertEqual(events[0].severity, AlertSeverity.CRITICAL)
    
    def test_termination_issue_detection(self):
        """Test detection of loop termination issues."""
        # Set up test data with termination issue
        test_termination_data = {
            "loop1": {
                "status": "error",
                "reason": "timeout",
                "completed_iterations": 7,
                "expected_iterations": 10
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(termination_data=test_termination_data)
        self.monitor.detect_loop_termination_issues()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "loop_termination_issue"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["loop_id"], "loop1")
        self.assertEqual(events[0].details["status"], "error")
        self.assertEqual(events[0].details["reason"], "timeout")
        self.assertEqual(events[0].severity, AlertSeverity.HIGH)
    
    def test_premature_termination_detection(self):
        """Test detection of premature loop termination."""
        # Set up test data with premature termination
        test_termination_data = {
            "loop1": {
                "status": "success",
                "reason": "",
                "completed_iterations": 7,
                "expected_iterations": 10
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(termination_data=test_termination_data)
        self.monitor.detect_loop_termination_issues()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "premature_loop_termination"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["loop_id"], "loop1")
        self.assertEqual(events[0].details["completed_iterations"], 7)
        self.assertEqual(events[0].details["expected_iterations"], 10)
        self.assertEqual(events[0].details["completion_percentage"], 70.0)
        self.assertEqual(events[0].severity, AlertSeverity.MEDIUM)
    
    def test_state_persistence_failure_detection(self):
        """Test detection of state persistence failures."""
        # Set up test data with persistence failure
        test_state_data = {
            "loop1": {
                "persistence_status": "error",
                "persisted_state": {"counter": 5},
                "expected_state": {"counter": 7, "status": "running"}
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(state_data=test_state_data)
        self.monitor.verify_loop_state_persistence()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "state_persistence_failure"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["loop_id"], "loop1")
        self.assertEqual(events[0].details["status"], "error")
        self.assertEqual(events[0].severity, AlertSeverity.HIGH)
    
    def test_state_inconsistency_detection(self):
        """Test detection of state inconsistencies."""
        # Set up test data with state inconsistency
        test_state_data = {
            "loop1": {
                "persistence_status": "success",
                "persisted_state": {
                    "counter": 5,  # Inconsistent value
                    "extra_key": "unexpected"  # Unexpected key
                },
                "expected_state": {
                    "counter": 7,
                    "status": "running"  # Missing key
                }
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(state_data=test_state_data)
        self.monitor.verify_loop_state_persistence()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "state_inconsistency"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["loop_id"], "loop1")
        
        # Check that inconsistencies were detected
        inconsistencies = events[0].details["inconsistencies"]
        self.assertEqual(len(inconsistencies), 3)  # 3 inconsistencies
        
        # Find specific inconsistencies
        value_mismatch = next((i for i in inconsistencies if i.get("type") == "value_mismatch"), None)
        missing_key = next((i for i in inconsistencies if i.get("type") == "missing_key"), None)
        unexpected_key = next((i for i in inconsistencies if i.get("type") == "unexpected_key"), None)
        
        self.assertIsNotNone(value_mismatch)
        self.assertIsNotNone(missing_key)
        self.assertIsNotNone(unexpected_key)
        self.assertEqual(value_mismatch["key"], "counter")
        self.assertEqual(missing_key["key"], "status")
        self.assertEqual(unexpected_key["key"], "extra_key")
        self.assertEqual(events[0].severity, AlertSeverity.MEDIUM)
    
    def test_resource_overutilization_detection(self):
        """Test detection of resource overutilization."""
        # Set up test data with resource overutilization
        test_resource_data = {
            "loop1": {
                "cpu_usage": 0.9,  # 90% (above threshold)
                "memory_usage": 0.7,  # 70% (below threshold)
                "disk_io": 0.85,  # 85% (above threshold)
                "network_io": 0.6   # 60% (below threshold)
            }
        }
        
        # Set test data and execute monitor
        self.monitor.set_test_data(resource_data=test_resource_data)
        self.monitor.track_resource_utilization()
        
        # Check that an event was emitted
        events = [e for e in self.framework.event_history if e.event_type == "resource_overutilization"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].details["loop_id"], "loop1")
        
        # Check that overutilized resources were detected
        overutilized = events[0].details["overutilized_resources"]
        self.assertEqual(len(overutilized), 2)  # 2 overutilized resources
        
        # Find specific resources
        cpu = next((r for r in overutilized if r.get("resource") == "cpu"), None)
        disk = next((r for r in overutilized if r.get("resource") == "disk_io"), None)
        
        self.assertIsNotNone(cpu)
        self.assertIsNotNone(disk)
        self.assertEqual(cpu["usage"], 0.9)
        self.assertEqual(disk["usage"], 0.85)
        self.assertEqual(events[0].severity, AlertSeverity.HIGH)


if __name__ == "__main__":
    unittest.main()
