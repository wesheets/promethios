"""
Tests for Trust Propagation Engine in Promethios Distributed Trust Surface

Codex Contract: v2025.05.20
Phase: 5.6
Clauses: 5.6, 5.5, 5.4, 11.0, 11.1, 5.2.6
"""

import unittest
import json
import uuid
import math
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

# Updated import for canonical structure
from src.core.governance.trust_propagation_engine import TrustPropagationEngine
from src.core.governance.trust_boundary_manager import TrustBoundaryManager
from src.core.governance.attestation_service import AttestationService

class TestTrustPropagationEngine(unittest.TestCase):
    """Test suite for the Trust Propagation Engine."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.instance_id = "test-instance-001"
        self.schema_validator = MagicMock()
        self.schema_validator.validate.return_value = (True, None)
        
        # Create mock dependencies
        self.trust_boundary_manager = MagicMock(spec=TrustBoundaryManager)
        self.attestation_service = MagicMock(spec=AttestationService)
        
        # Create the Trust Propagation Engine
        self.engine = TrustPropagationEngine(
            instance_id=self.instance_id,
            schema_validator=self.schema_validator,
            trust_boundary_manager=self.trust_boundary_manager,
            attestation_service=self.attestation_service
        )
    
    def test_update_trust_graph(self):
        """Test updating the trust graph."""
        # Mock the trust boundary manager to return boundaries
        self.trust_boundary_manager.list_boundaries.return_value = [
            {
                "boundary_id": f"tb-{uuid.uuid4().hex}",
                "source_instance_id": "source-001",
                "target_instance_id": "target-001",
                "trust_level": 80,
                "status": "active"
            },
            {
                "boundary_id": f"tb-{uuid.uuid4().hex}",
                "source_instance_id": "source-001",
                "target_instance_id": "target-002",
                "trust_level": 70,
                "status": "active"
            },
            {
                "boundary_id": f"tb-{uuid.uuid4().hex}",
                "source_instance_id": "target-001",
                "target_instance_id": "target-002",
                "trust_level": 90,
                "status": "active"
            }
        ]
        
        # Update the trust graph
        result = self.engine.update_trust_graph()
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the trust graph was updated
        self.assertEqual(len(self.engine.trust_graph), 2)
        self.assertIn("source-001", self.engine.trust_graph)
        self.assertIn("target-001", self.engine.trust_graph)
        
        # Verify trust levels
        self.assertEqual(self.engine.trust_graph["source-001"]["target-001"], 0.8)
        self.assertEqual(self.engine.trust_graph["source-001"]["target-002"], 0.7)
        self.assertEqual(self.engine.trust_graph["target-001"]["target-002"], 0.9)
    
    def test_get_direct_trust(self):
        """Test getting direct trust between instances."""
        # Set up the trust graph
        self.engine.trust_graph = {
            "source-001": {
                "target-001": 0.8,
                "target-002": 0.7
            },
            "target-001": {
                "target-002": 0.9
            }
        }
        
        # Test getting direct trust
        trust = self.engine.get_direct_trust("source-001", "target-001")
        self.assertEqual(trust, 0.8)
        
        # Test getting direct trust that doesn't exist
        trust = self.engine.get_direct_trust("source-001", "target-003")
        self.assertEqual(trust, 0.0)
        
        # Test getting direct trust from non-existent source
        trust = self.engine.get_direct_trust("source-002", "target-001")
        self.assertEqual(trust, 0.0)
    
    def test_get_propagated_trust(self):
        """Test getting propagated trust between instances."""
        # Set up the trust graph
        self.engine.trust_graph = {
            "source-001": {
                "target-001": 0.8
            },
            "target-001": {
                "target-002": 0.9
            }
        }
        
        # Set up propagation paths
        self.engine.propagation_paths = {
            "source-001": {
                "target-002": ["source-001", "target-001", "target-002"]
            }
        }
        
        # Test getting direct trust
        trust, path = self.engine.get_propagated_trust("source-001", "target-001")
        self.assertEqual(trust, 0.8)
        self.assertEqual(path, ["source-001", "target-001"])
        
        # Test getting propagated trust
        trust, path = self.engine.get_propagated_trust("source-001", "target-002")
        self.assertAlmostEqual(trust, 0.8 * 0.9 * 0.8, places=2)  # Trust with discount factor
        self.assertEqual(path, ["source-001", "target-001", "target-002"])
        
        # Test getting trust that doesn't exist
        trust, path = self.engine.get_propagated_trust("source-001", "target-003")
        self.assertEqual(trust, 0.0)
        self.assertEqual(path, [])
    
    def test_apply_trust_decay(self):
        """Test applying trust decay."""
        # Mock the trust boundary manager
        boundary_id_1 = f"tb-{uuid.uuid4().hex}"
        boundary_id_2 = f"tb-{uuid.uuid4().hex}"
        
        self.trust_boundary_manager.list_boundaries.return_value = [
            {
                "boundary_id": boundary_id_1,
                "source_instance_id": "source-001",
                "target_instance_id": "target-001",
                "trust_level": 80,
                "status": "active"
            },
            {
                "boundary_id": boundary_id_2,
                "source_instance_id": "source-001",
                "target_instance_id": "target-002",
                "trust_level": 70,
                "status": "active"
            }
        ]
        
        # Apply trust decay
        result = self.engine.apply_trust_decay(days=7)
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the trust boundary manager was called to update boundaries
        self.trust_boundary_manager.update_boundary.assert_any_call(
            boundary_id=boundary_id_1,
            trust_level=int(80 * math.pow(1 - 0.1, 7))
        )
        
        self.trust_boundary_manager.update_boundary.assert_any_call(
            boundary_id=boundary_id_2,
            trust_level=int(70 * math.pow(1 - 0.1, 7))
        )
    
    def test_reinforce_trust(self):
        """Test reinforcing trust."""
        # Mock the trust boundary manager
        boundary_id = f"tb-{uuid.uuid4().hex}"
        
        self.trust_boundary_manager.list_boundaries.return_value = [
            {
                "boundary_id": boundary_id,
                "source_instance_id": "source-001",
                "target_instance_id": "target-001",
                "trust_level": 80,
                "status": "active"
            }
        ]
        
        # Reinforce trust
        result = self.engine.reinforce_trust(
            source_id="source-001",
            target_id="target-001",
            reinforcement_value=0.1,
            reason="Test reinforcement"
        )
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the trust boundary manager was called to update the boundary
        self.trust_boundary_manager.update_boundary.assert_called_once_with(
            boundary_id=boundary_id,
            trust_level=90  # 80 + 10
        )
    
    def test_handle_trust_conflict(self):
        """Test handling a trust conflict."""
        # Mock the trust boundary manager
        boundary_id = f"tb-{uuid.uuid4().hex}"
        
        self.trust_boundary_manager.list_boundaries.return_value = [
            {
                "boundary_id": boundary_id,
                "source_instance_id": "source-001",
                "target_instance_id": "target-001",
                "trust_level": 80,
                "status": "active"
            }
        ]
        
        # Handle a trust conflict
        conflict_id = self.engine.handle_trust_conflict(
            source_id="source-001",
            target_id="target-001",
            conflict_type="attestation_mismatch",
            conflict_data={"mismatch_type": "version"}
        )
        
        # Verify the conflict was recorded
        self.assertIsNotNone(conflict_id)
        self.assertEqual(len(self.engine.conflict_records), 1)
        self.assertEqual(self.engine.conflict_records[0]["conflict_id"], conflict_id)
        self.assertEqual(self.engine.conflict_records[0]["conflict_type"], "attestation_mismatch")
        
        # Verify the trust boundary manager was called to reduce trust
        self.trust_boundary_manager.update_boundary.assert_called_once_with(
            boundary_id=boundary_id,
            trust_level=60  # 80 - 20
        )
    
    def test_resolve_trust_conflict(self):
        """Test resolving a trust conflict."""
        # Create a conflict record
        conflict_id = f"tc-{uuid.uuid4().hex}"
        self.engine.conflict_records = [
            {
                "conflict_id": conflict_id,
                "created_at": datetime.utcnow().isoformat() + 'Z',
                "source_instance_id": "source-001",
                "target_instance_id": "target-001",
                "conflict_type": "attestation_mismatch",
                "conflict_data": {"mismatch_type": "version"},
                "resolution_status": "pending",
                "resolution_data": None
            }
        ]
        
        # Mock the trust boundary manager
        boundary_id = f"tb-{uuid.uuid4().hex}"
        
        self.trust_boundary_manager.list_boundaries.return_value = [
            {
                "boundary_id": boundary_id,
                "source_instance_id": "source-001",
                "target_instance_id": "target-001",
                "trust_level": 60,
                "status": "active"
            }
        ]
        
        # Resolve the conflict
        result = self.engine.resolve_trust_conflict(
            conflict_id=conflict_id,
            resolution_status="resolved",
            resolution_data={"resolution_type": "update"},
            trust_adjustment=10
        )
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the conflict was updated
        self.assertEqual(self.engine.conflict_records[0]["resolution_status"], "resolved")
        self.assertEqual(self.engine.conflict_records[0]["resolution_data"]["resolution_type"], "update")
        
        # Verify the trust boundary manager was called to adjust trust
        self.trust_boundary_manager.update_boundary.assert_called_once_with(
            boundary_id=boundary_id,
            trust_level=70  # 60 + 10
        )
    
    def test_get_trust_conflicts(self):
        """Test getting trust conflicts."""
        # Create conflict records
        self.engine.conflict_records = [
            {
                "conflict_id": f"tc-{uuid.uuid4().hex}",
                "created_at": datetime.utcnow().isoformat() + 'Z',
                "source_instance_id": "source-001",
                "target_instance_id": "target-001",
                "conflict_type": "attestation_mismatch",
                "conflict_data": {"mismatch_type": "version"},
                "resolution_status": "pending",
                "resolution_data": None
            },
            {
                "conflict_id": f"tc-{uuid.uuid4().hex}",
                "created_at": datetime.utcnow().isoformat() + 'Z',
                "source_instance_id": "source-001",
                "target_instance_id": "target-002",
                "conflict_type": "verification_failure",
                "conflict_data": {"failure_type": "signature"},
                "resolution_status": "resolved",
                "resolution_data": {"resolution_type": "update"}
            },
            {
                "conflict_id": f"tc-{uuid.uuid4().hex}",
                "created_at": datetime.utcnow().isoformat() + 'Z',
                "source_instance_id": "source-002",
                "target_instance_id": "target-001",
                "conflict_type": "attestation_mismatch",
                "conflict_data": {"mismatch_type": "content"},
                "resolution_status": "pending",
                "resolution_data": None
            }
        ]
        
        # Test getting all conflicts
        conflicts = self.engine.get_trust_conflicts()
        self.assertEqual(len(conflicts), 3)
        
        # Test filtering by source instance
        conflicts = self.engine.get_trust_conflicts(source_id="source-001")
        self.assertEqual(len(conflicts), 2)
        
        # Test filtering by target instance
        conflicts = self.engine.get_trust_conflicts(target_id="target-001")
        self.assertEqual(len(conflicts), 2)
        
        # Test filtering by conflict type
        conflicts = self.engine.get_trust_conflicts(conflict_type="attestation_mismatch")
        self.assertEqual(len(conflicts), 2)
        
        # Test filtering by resolution status
        conflicts = self.engine.get_trust_conflicts(resolution_status="pending")
        self.assertEqual(len(conflicts), 2)
        
        # Test filtering by multiple criteria
        conflicts = self.engine.get_trust_conflicts(
            source_id="source-001",
            conflict_type="attestation_mismatch",
            resolution_status="pending"
        )
        self.assertEqual(len(conflicts), 1)
    
    def test_codex_tether_check(self):
        """Test Codex Contract tethering check."""
        result = self.engine._codex_tether_check()
        
        self.assertIsNotNone(result)
        self.assertEqual(result["codex_contract_version"], "v2025.05.20")
        self.assertEqual(result["phase_id"], "5.6")
        self.assertIn("5.6", result["clauses"])
        self.assertEqual(result["component"], "TrustPropagationEngine")
        self.assertEqual(result["status"], "compliant")

if __name__ == "__main__":
    unittest.main()
