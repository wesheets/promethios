"""
Tests for Boundary Enforcement Module in Promethios Distributed Trust Surface

Codex Contract: v2025.05.20
Phase: 5.6
Clauses: 5.6, 5.5, 5.4, 11.0, 11.1, 5.2.6
"""

import unittest
import json
import uuid
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

# Updated import for canonical structure
from src.core.governance.boundary_enforcement_module import BoundaryEnforcementModule
from src.core.governance.trust_boundary_manager import TrustBoundaryManager
from src.core.governance.attestation_service import AttestationService
from src.core.governance.trust_propagation_engine import TrustPropagationEngine

class TestBoundaryEnforcementModule(unittest.TestCase):
    """Test suite for the Boundary Enforcement Module."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.instance_id = "test-instance-001"
        self.schema_validator = MagicMock()
        self.schema_validator.validate.return_value = (True, None)
        
        # Create mock dependencies
        self.trust_boundary_manager = MagicMock(spec=TrustBoundaryManager)
        self.attestation_service = MagicMock(spec=AttestationService)
        self.trust_propagation_engine = MagicMock(spec=TrustPropagationEngine)
        
        # Create the Boundary Enforcement Module
        self.module = BoundaryEnforcementModule(
            instance_id=self.instance_id,
            schema_validator=self.schema_validator,
            trust_boundary_manager=self.trust_boundary_manager,
            attestation_service=self.attestation_service,
            trust_propagation_engine=self.trust_propagation_engine
        )
    
    def test_enforce_boundary_access(self):
        """Test enforcing boundary access."""
        # Mock the trust boundary manager
        boundary_id = f"tb-{uuid.uuid4().hex}"
        self.trust_boundary_manager.list_boundaries.return_value = [
            {
                "boundary_id": boundary_id,
                "source_instance_id": "source-001",
                "target_instance_id": self.instance_id,
                "trust_level": 80,
                "status": "active"
            }
        ]
        
        # Mock the trust boundary manager's enforce_boundary_policy
        self.trust_boundary_manager.enforce_boundary_policy.return_value = (True, None)
        
        # Test enforcing boundary access
        is_allowed, reason = self.module.enforce_boundary_access(
            source_id="source-001",
            operation="read",
            resource_path="/data/file.txt",
            required_trust_level=70
        )
        
        # Verify the result
        self.assertTrue(is_allowed)
        
        # Verify the trust boundary manager was called
        self.trust_boundary_manager.enforce_boundary_policy.assert_called_once_with(
            boundary_id=boundary_id,
            operation="read",
            context={"data_path": "/data/file.txt"}
        )
        
        # Test with insufficient trust level
        is_allowed, reason = self.module.enforce_boundary_access(
            source_id="source-001",
            operation="read",
            resource_path="/data/file.txt",
            required_trust_level=90
        )
        
        # Verify the result
        self.assertFalse(is_allowed)
        self.assertEqual(reason, "Insufficient trust level")
    
    def test_enforce_attestation_requirement(self):
        """Test enforcing attestation requirement."""
        # Mock the attestation service
        attestation_id = f"att-{uuid.uuid4().hex}"
        self.attestation_service.list_attestations.return_value = [
            {
                "attestation_id": attestation_id,
                "attestation_type": "identity",
                "subject_instance_id": "source-001",
                "attester_instance_id": self.instance_id,
                "attestation_data": {"identity": "test-identity"},
                "status": "active"
            }
        ]
        
        # Mock the attestation service's verify_attestation
        self.attestation_service.verify_attestation.return_value = (True, {
            "attestation_id": attestation_id,
            "verification_status": "valid"
        })
        
        # Test enforcing attestation requirement
        is_allowed, reason = self.module.enforce_attestation_requirement(
            source_id="source-001",
            attestation_type="identity",
            operation="read",
            resource_path="/data/file.txt"
        )
        
        # Verify the result
        self.assertTrue(is_allowed)
        
        # Verify the attestation service was called
        self.attestation_service.verify_attestation.assert_called_once_with(
            attestation_id=attestation_id
        )
        
        # Test with missing attestation
        self.attestation_service.list_attestations.return_value = []
        
        is_allowed, reason = self.module.enforce_attestation_requirement(
            source_id="source-001",
            attestation_type="capability",
            operation="write",
            resource_path="/data/file.txt"
        )
        
        # Verify the result
        self.assertFalse(is_allowed)
        self.assertEqual(reason, "Required attestation not found")
    
    def test_enforce_propagated_trust(self):
        """Test enforcing propagated trust."""
        # Mock the trust propagation engine
        self.trust_propagation_engine.get_propagated_trust.return_value = (0.75, ["source-002", "source-001", self.instance_id])
        
        # Test enforcing propagated trust
        is_allowed, reason = self.module.enforce_propagated_trust(
            source_id="source-002",
            operation="read",
            resource_path="/data/file.txt",
            required_trust_level=70
        )
        
        # Verify the result
        self.assertTrue(is_allowed)
        
        # Verify the trust propagation engine was called
        self.trust_propagation_engine.get_propagated_trust.assert_called_once_with(
            source_id="source-002",
            target_id=self.instance_id
        )
        
        # Test with insufficient propagated trust
        self.trust_propagation_engine.get_propagated_trust.return_value = (0.65, ["source-002", "source-001", self.instance_id])
        
        is_allowed, reason = self.module.enforce_propagated_trust(
            source_id="source-002",
            operation="read",
            resource_path="/data/file.txt",
            required_trust_level=70
        )
        
        # Verify the result
        self.assertFalse(is_allowed)
        self.assertEqual(reason, "Insufficient propagated trust level")
    
    def test_create_enforcement_policy(self):
        """Test creating an enforcement policy."""
        # Create a policy
        policy = self.module.create_enforcement_policy(
            policy_type="resource_access",
            resource_pattern="/data/*",
            required_trust_level=80,
            required_attestations=["identity"],
            allowed_operations=["read", "write"]
        )
        
        # Verify the policy was created correctly
        self.assertIsNotNone(policy)
        self.assertIn("policy_id", policy)
        self.assertEqual(policy["policy_type"], "resource_access")
        self.assertEqual(policy["resource_pattern"], "/data/*")
        self.assertEqual(policy["required_trust_level"], 80)
        self.assertEqual(policy["required_attestations"], ["identity"])
        self.assertEqual(policy["allowed_operations"], ["read", "write"])
        
        # Verify the policy was added to the module
        policies = self.module.list_enforcement_policies()
        self.assertEqual(len(policies), 1)
        self.assertEqual(policies[0]["policy_id"], policy["policy_id"])
    
    def test_enforce_policy(self):
        """Test enforcing a policy."""
        # Create a policy
        policy = self.module.create_enforcement_policy(
            policy_type="resource_access",
            resource_pattern="/data/*",
            required_trust_level=80,
            required_attestations=["identity"],
            allowed_operations=["read", "write"]
        )
        
        # Mock the trust boundary manager
        boundary_id = f"tb-{uuid.uuid4().hex}"
        self.trust_boundary_manager.list_boundaries.return_value = [
            {
                "boundary_id": boundary_id,
                "source_instance_id": "source-001",
                "target_instance_id": self.instance_id,
                "trust_level": 90,
                "status": "active"
            }
        ]
        
        # Mock the attestation service
        attestation_id = f"att-{uuid.uuid4().hex}"
        self.attestation_service.list_attestations.return_value = [
            {
                "attestation_id": attestation_id,
                "attestation_type": "identity",
                "subject_instance_id": "source-001",
                "attester_instance_id": self.instance_id,
                "attestation_data": {"identity": "test-identity"},
                "status": "active"
            }
        ]
        
        self.attestation_service.verify_attestation.return_value = (True, {
            "attestation_id": attestation_id,
            "verification_status": "valid"
        })
        
        # Test enforcing the policy
        is_allowed, reason = self.module.enforce_policy(
            policy_id=policy["policy_id"],
            source_id="source-001",
            operation="read",
            resource_path="/data/file.txt"
        )
        
        # Verify the result
        self.assertTrue(is_allowed)
        
        # Test with disallowed operation
        is_allowed, reason = self.module.enforce_policy(
            policy_id=policy["policy_id"],
            source_id="source-001",
            operation="delete",
            resource_path="/data/file.txt"
        )
        
        # Verify the result
        self.assertFalse(is_allowed)
        self.assertEqual(reason, "Operation not allowed by policy")
    
    def test_log_enforcement_action(self):
        """Test logging an enforcement action."""
        # Log an action
        log_id = self.module.log_enforcement_action(
            source_id="source-001",
            operation="read",
            resource_path="/data/file.txt",
            is_allowed=True,
            reason="Policy allows access"
        )
        
        # Verify the log was created
        self.assertIsNotNone(log_id)
        self.assertEqual(len(self.module.enforcement_logs), 1)
        self.assertEqual(self.module.enforcement_logs[0]["log_id"], log_id)
        self.assertEqual(self.module.enforcement_logs[0]["source_instance_id"], "source-001")
        self.assertEqual(self.module.enforcement_logs[0]["operation"], "read")
        self.assertEqual(self.module.enforcement_logs[0]["resource_path"], "/data/file.txt")
        self.assertEqual(self.module.enforcement_logs[0]["is_allowed"], True)
        self.assertEqual(self.module.enforcement_logs[0]["reason"], "Policy allows access")
    
    def test_get_enforcement_logs(self):
        """Test getting enforcement logs."""
        # Create multiple logs
        self.module.log_enforcement_action(
            source_id="source-001",
            operation="read",
            resource_path="/data/file1.txt",
            is_allowed=True,
            reason="Policy allows access"
        )
        
        self.module.log_enforcement_action(
            source_id="source-001",
            operation="write",
            resource_path="/data/file2.txt",
            is_allowed=False,
            reason="Operation not allowed"
        )
        
        self.module.log_enforcement_action(
            source_id="source-002",
            operation="read",
            resource_path="/data/file1.txt",
            is_allowed=True,
            reason="Policy allows access"
        )
        
        # Test getting all logs
        logs = self.module.get_enforcement_logs()
        self.assertEqual(len(logs), 3)
        
        # Test filtering by source instance
        logs = self.module.get_enforcement_logs(source_id="source-001")
        self.assertEqual(len(logs), 2)
        
        # Test filtering by operation
        logs = self.module.get_enforcement_logs(operation="read")
        self.assertEqual(len(logs), 2)
        
        # Test filtering by resource path
        logs = self.module.get_enforcement_logs(resource_path="/data/file1.txt")
        self.assertEqual(len(logs), 2)
        
        # Test filtering by allowed status
        logs = self.module.get_enforcement_logs(is_allowed=False)
        self.assertEqual(len(logs), 1)
        
        # Test filtering by multiple criteria
        logs = self.module.get_enforcement_logs(
            source_id="source-001",
            operation="read",
            is_allowed=True
        )
        self.assertEqual(len(logs), 1)
    
    def test_codex_tether_check(self):
        """Test Codex Contract tethering check."""
        result = self.module._codex_tether_check()
        
        self.assertIsNotNone(result)
        self.assertEqual(result["codex_contract_version"], "v2025.05.20")
        self.assertEqual(result["phase_id"], "5.6")
        self.assertIn("5.6", result["clauses"])
        self.assertEqual(result["component"], "BoundaryEnforcementModule")
        self.assertEqual(result["status"], "compliant")

if __name__ == "__main__":
    unittest.main()
