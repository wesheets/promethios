"""
Unit tests for Conflict Detection System implementation.

This module tests Phase 5.3 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.3
Clauses: 5.3, 10.4
"""

import unittest
import hashlib
import json
import uuid
import sys
import os
from datetime import datetime
from unittest.mock import patch, MagicMock

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from conflict_detection import ConflictDetector


class TestConflictDetector(unittest.TestCase):
    """Test cases for ConflictDetector implementation."""
    
    def setUp(self):
        """Set up test environment."""
        # Mock the validate_against_schema function to always return True
        self.validate_patch = patch('conflict_detection.validate_against_schema', return_value=(True, None))
        self.mock_validate = self.validate_patch.start()
        
        # Create a ConflictDetector instance
        self.conflict_detector = ConflictDetector()
        
        # Sample execution context for testing
        self.sample_context = {
            "agent_ids": [str(uuid.uuid4())],
            "components": ["test_component"],
            "schema": "test_schema.json",
            "error": "Schema validation error",
            "trust_score": 0.5,
            "threshold": 0.7,
            "failure_reason": "Contract version mismatch"
        }
    
    def tearDown(self):
        """Clean up after tests."""
        self.validate_patch.stop()
    
    def test_detect_schema_violation_conflict(self):
        """Test detecting a schema violation conflict."""
        # Detect conflict
        conflict = self.conflict_detector.detect_conflict(
            self.sample_context,
            "schema_violation",
            "high"
        )
        
        # Verify conflict structure
        self.assertIn("conflict_id", conflict)
        self.assertIn("conflict_type", conflict)
        self.assertIn("agent_ids", conflict)
        self.assertIn("timestamp", conflict)
        self.assertIn("timestamp_hash", conflict)
        self.assertIn("contract_version", conflict)
        self.assertIn("phase_id", conflict)
        self.assertIn("severity", conflict)
        self.assertIn("resolution_status", conflict)
        self.assertIn("conflict_details", conflict)
        self.assertIn("resolution_path", conflict)
        self.assertIn("arbitration_metadata", conflict)
        self.assertIn("codex_clauses", conflict)
        
        # Verify contract details
        self.assertEqual(conflict["contract_version"], "v2025.05.18")
        self.assertEqual(conflict["phase_id"], "5.3")
        self.assertEqual(conflict["codex_clauses"], ["5.3", "10.4"])
        
        # Verify conflict details
        self.assertEqual(conflict["conflict_type"], "schema_violation")
        self.assertEqual(conflict["severity"], "high")
        self.assertEqual(conflict["resolution_status"], "unresolved")
        
        # Verify evidence
        self.assertEqual(len(conflict["conflict_details"]["evidence"]), 1)
        evidence = conflict["conflict_details"]["evidence"][0]
        self.assertEqual(evidence["evidence_type"], "schema_validation")
        self.assertEqual(evidence["evidence_data"]["schema"], "test_schema.json")
        self.assertEqual(evidence["evidence_data"]["validation_error"], "Schema validation error")
    
    def test_detect_trust_threshold_conflict(self):
        """Test detecting a trust threshold conflict."""
        # Detect conflict
        conflict = self.conflict_detector.detect_conflict(
            self.sample_context,
            "trust_threshold",
            "medium"
        )
        
        # Verify conflict type and evidence
        self.assertEqual(conflict["conflict_type"], "trust_threshold")
        self.assertEqual(conflict["severity"], "medium")
        
        # Verify evidence
        evidence = conflict["conflict_details"]["evidence"][0]
        self.assertEqual(evidence["evidence_type"], "trust_score")
        self.assertEqual(evidence["evidence_data"]["trust_score"], 0.5)
        self.assertEqual(evidence["evidence_data"]["threshold"], 0.7)
    
    def test_detect_tether_failure_conflict(self):
        """Test detecting a tether failure conflict."""
        # Detect conflict
        conflict = self.conflict_detector.detect_conflict(
            self.sample_context,
            "tether_failure",
            "critical"
        )
        
        # Verify conflict type and evidence
        self.assertEqual(conflict["conflict_type"], "tether_failure")
        self.assertEqual(conflict["severity"], "critical")
        
        # Verify evidence
        evidence = conflict["conflict_details"]["evidence"][0]
        self.assertEqual(evidence["evidence_type"], "tether_check")
        self.assertEqual(evidence["evidence_data"]["tether_check"], "pre_loop_tether_check")
        self.assertEqual(evidence["evidence_data"]["failure_reason"], "Contract version mismatch")
    
    def test_update_resolution(self):
        """Test updating the resolution path for a conflict."""
        # Detect conflict
        conflict = self.conflict_detector.detect_conflict(
            self.sample_context,
            "schema_violation",
            "high"
        )
        conflict_id = conflict["conflict_id"]
        
        # Update resolution
        updated_conflict = self.conflict_detector.update_resolution(
            conflict_id,
            "manual_override",
            "Schema violation manually resolved",
            "operator"
        )
        
        # Verify resolution path
        self.assertEqual(len(updated_conflict["resolution_path"]), 1)
        step = updated_conflict["resolution_path"][0]
        self.assertEqual(step["step_id"], 1)
        self.assertEqual(step["action"], "manual_override")
        self.assertEqual(step["result"], "Schema violation manually resolved")
        self.assertEqual(step["actor"], "operator")
        
        # Verify resolution status
        self.assertEqual(updated_conflict["resolution_status"], "in_progress")
    
    def test_update_resolution_resolved(self):
        """Test updating resolution to resolved status."""
        # Detect conflict
        conflict = self.conflict_detector.detect_conflict(
            self.sample_context,
            "schema_violation",
            "high"
        )
        conflict_id = conflict["conflict_id"]
        
        # Update resolution with "resolved" in result
        updated_conflict = self.conflict_detector.update_resolution(
            conflict_id,
            "manual_override",
            "Conflict resolved by operator",
            "operator"
        )
        
        # Verify resolution status
        self.assertEqual(updated_conflict["resolution_status"], "resolved")
    
    def test_update_resolution_escalated(self):
        """Test updating resolution to escalated status."""
        # Detect conflict
        conflict = self.conflict_detector.detect_conflict(
            self.sample_context,
            "schema_violation",
            "high"
        )
        conflict_id = conflict["conflict_id"]
        
        # Update resolution with "escalated" in result
        updated_conflict = self.conflict_detector.update_resolution(
            conflict_id,
            "escalate",
            "Conflict escalated to arbitration",
            "operator"
        )
        
        # Verify resolution status and arbitration status
        self.assertEqual(updated_conflict["resolution_status"], "escalated")
        self.assertEqual(updated_conflict["arbitration_metadata"]["arbitration_status"], "pending")
    
    def test_escalate_to_arbitration(self):
        """Test escalating a conflict to arbitration."""
        # Detect conflict
        conflict = self.conflict_detector.detect_conflict(
            self.sample_context,
            "schema_violation",
            "high"
        )
        conflict_id = conflict["conflict_id"]
        
        # Escalate to arbitration
        updated_conflict = self.conflict_detector.escalate_to_arbitration(
            conflict_id,
            "Critical schema violation requires arbitration"
        )
        
        # Verify arbitration metadata
        self.assertIn("arbitration_id", updated_conflict["arbitration_metadata"])
        self.assertEqual(updated_conflict["arbitration_metadata"]["arbitration_status"], "pending")
        self.assertEqual(updated_conflict["arbitration_metadata"]["arbitration_reason"], 
                         "Critical schema violation requires arbitration")
        
        # Verify resolution status
        self.assertEqual(updated_conflict["resolution_status"], "escalated")
    
    def test_resolve_conflict(self):
        """Test resolving a conflict."""
        # Detect conflict
        conflict = self.conflict_detector.detect_conflict(
            self.sample_context,
            "schema_violation",
            "high"
        )
        conflict_id = conflict["conflict_id"]
        
        # Resolve conflict
        updated_conflict = self.conflict_detector.resolve_conflict(
            conflict_id,
            "Schema updated to match data structure"
        )
        
        # Verify resolution status
        self.assertEqual(updated_conflict["resolution_status"], "resolved")
        
        # Verify resolution path
        self.assertEqual(len(updated_conflict["resolution_path"]), 1)
        step = updated_conflict["resolution_path"][0]
        self.assertEqual(step["action"], "resolve_conflict")
        self.assertEqual(step["result"], "Conflict resolved: Schema updated to match data structure")
    
    def test_get_conflict(self):
        """Test getting a conflict by ID."""
        # Detect conflict
        conflict = self.conflict_detector.detect_conflict(
            self.sample_context,
            "schema_violation",
            "high"
        )
        conflict_id = conflict["conflict_id"]
        
        # Get conflict
        retrieved_conflict = self.conflict_detector.get_conflict(conflict_id)
        
        # Verify retrieved conflict
        self.assertEqual(retrieved_conflict, conflict)
    
    def test_get_all_conflicts(self):
        """Test getting all conflicts."""
        # Detect multiple conflicts
        conflict1 = self.conflict_detector.detect_conflict(
            self.sample_context,
            "schema_violation",
            "high"
        )
        conflict2 = self.conflict_detector.detect_conflict(
            self.sample_context,
            "trust_threshold",
            "medium"
        )
        
        # Get all conflicts
        all_conflicts = self.conflict_detector.get_all_conflicts()
        
        # Verify all conflicts
        self.assertEqual(len(all_conflicts), 2)
        self.assertIn(conflict1, all_conflicts)
        self.assertIn(conflict2, all_conflicts)
    
    def test_get_conflicts_by_type(self):
        """Test getting conflicts by type."""
        # Detect multiple conflicts of different types
        conflict1 = self.conflict_detector.detect_conflict(
            self.sample_context,
            "schema_violation",
            "high"
        )
        conflict2 = self.conflict_detector.detect_conflict(
            self.sample_context,
            "trust_threshold",
            "medium"
        )
        conflict3 = self.conflict_detector.detect_conflict(
            self.sample_context,
            "schema_violation",
            "medium"
        )
        
        # Get conflicts by type
        schema_conflicts = self.conflict_detector.get_conflicts_by_type("schema_violation")
        
        # Verify filtered conflicts
        self.assertEqual(len(schema_conflicts), 2)
        self.assertIn(conflict1, schema_conflicts)
        self.assertIn(conflict3, schema_conflicts)


if __name__ == "__main__":
    unittest.main()
