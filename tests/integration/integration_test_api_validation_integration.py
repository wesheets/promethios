"""
Integration tests for API validation and compliance mapping integration for Promethios Phase 6.1

This module provides comprehensive integration tests for the API validation and compliance
mapping components, ensuring they work together correctly in the Promethios governance system.
"""

import unittest
import json
import os
import sys
import tempfile
from pathlib import Path

# Add the src directory to the Python path
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.schema_validation.registry import SchemaValidationRegistry, get_registry
from src.compliance_mapping.framework import ComplianceMappingFramework, get_framework

class TestAPIValidationIntegration(unittest.TestCase):
    """Integration tests for API validation and compliance mapping."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Get registry and framework instances
        self.registry = get_registry()
        self.framework = get_framework()
        
        # Create test data
        self.create_test_data()
    
    def create_test_data(self):
        """Create test data for integration tests."""
        # Test memory record
        self.memory_record = {
            "record_id": "mem-12345abcdef",
            "timestamp": "2025-05-22T10:30:00Z",
            "source": "governance-engine",
            "record_type": "decision",
            "content": {
                "decision_id": "dec-6789",
                "policy_id": "pol-1234",
                "action": "approve"
            },
            "metadata": {
                "priority": "high",
                "tags": ["governance", "access-control"]
            },
            "version": 1,
            "created_at": "2025-05-22T10:30:00Z",
            "updated_at": "2025-05-22T10:30:00Z",
            "created_by": "system-governance",
            "updated_by": "system-governance"
        }
        
        # Test policy
        self.policy = {
            "policy_id": "pol-1234",
            "name": "Data Access Policy",
            "version": "1.0.0",
            "status": "active",
            "category": "data-governance",
            "description": "This policy controls access to sensitive data based on user roles and data classification.",
            "rules": [
                {
                    "rule_id": "rule-1",
                    "name": "Admin Access Rule",
                    "description": "Allows admin users full access to data",
                    "condition": "user.role == 'admin'",
                    "action": "allow",
                    "priority": 10,
                    "metadata": {
                        "rationale": "Administrators need full access to manage the system",
                        "tags": ["admin", "full-access"]
                    },
                    "created_at": "2025-05-01T09:00:00Z",
                    "updated_at": "2025-05-15T14:30:00Z"
                }
            ],
            "metadata": {
                "owner": "Security Team",
                "compliance_mappings": {
                    "SOC2": ["CC1.1", "CC5.2"],
                    "GDPR": ["GDPR-5", "GDPR-25"]
                },
                "tags": ["data-access", "security"]
            },
            "created_at": "2025-05-01T09:00:00Z",
            "updated_at": "2025-05-15T14:30:00Z",
            "created_by": "user-456",
            "updated_by": "user-789"
        }
        
        # Test reflection record
        self.reflection_record = {
            "record_id": "ref-12345abc",
            "timestamp": "2025-05-22T10:30:00Z",
            "reflection_type": "policy_effectiveness",
            "trigger": "scheduled",
            "status": "completed",
            "inputs": {
                "time_period": "2025-04-01T00:00:00Z/2025-05-01T00:00:00Z",
                "policy_ids": ["pol-1234", "pol-5678"],
                "metrics": ["decision_count", "override_rate", "compliance_score"]
            },
            "outputs": {
                "summary": "Policy effectiveness analysis for April 2025",
                "metrics": {
                    "decision_count": 1245,
                    "override_rate": 0.032,
                    "compliance_score": 0.97
                },
                "recommendations": [
                    "Adjust threshold for policy pol-1234 to reduce false positives",
                    "Consider adding additional rule for handling edge cases in pol-5678"
                ]
            },
            "insights": [
                {
                    "insight_id": "ins-abc123",
                    "reflection_id": "ref-12345abc",
                    "timestamp": "2025-05-22T11:30:00Z",
                    "category": "policy_gap",
                    "severity": "medium",
                    "description": "Policy pol-1234 has a high rate of overrides (8.5%) for users in the marketing department",
                    "evidence": {
                        "override_count": 42,
                        "total_decisions": 495,
                        "affected_users": ["user-123", "user-456", "user-789"],
                        "time_pattern": "Primarily during campaign launches"
                    },
                    "recommendations": [
                        "Adjust policy conditions to account for marketing campaign activities",
                        "Create specialized rule for marketing department during campaign periods"
                    ],
                    "metadata": {
                        "confidence": 0.92,
                        "related_insights": ["ins-def456", "ins-ghi789"],
                        "tags": ["override-pattern", "department-specific"]
                    }
                }
            ],
            "metadata": {
                "priority": "high",
                "tags": ["governance", "policy-improvement"],
                "initiated_by": "system-scheduler"
            },
            "created_at": "2025-05-22T10:30:00Z",
            "updated_at": "2025-05-22T11:45:00Z"
        }
        
        # Test override request
        self.override_request = {
            "request_id": "ovr-12345abc",
            "timestamp": "2025-05-22T10:30:00Z",
            "requestor": "user-789",
            "decision_id": "dec-456789",
            "original_decision": "deny",
            "requested_decision": "allow",
            "justification": "Business-critical access needed for emergency system maintenance",
            "status": "pending",
            "reviewer_id": "user-123",
            "review_notes": "Approved for emergency maintenance window only",
            "review_timestamp": "2025-05-22T11:15:00Z",
            "expiration_time": "2025-05-23T10:30:00Z",
            "metadata": {
                "priority": "high",
                "tags": ["emergency", "maintenance"],
                "affected_systems": ["database", "authentication"],
                "ticket_id": "INC-12345"
            }
        }
        
        # Test compliance mapping
        self.compliance_mapping = {
            "mapping_id": "cmp-soc2v1",
            "standard": "SOC2",
            "version": "2017",
            "description": "SOC2 compliance mapping for Promethios",
            "mappings": [
                {
                    "control_id": "CC1.1",
                    "control_name": "Control Environment",
                    "control_description": "The entity demonstrates a commitment to integrity and ethical values.",
                    "promethios_components": [
                        {
                            "component_type": "policy",
                            "component_id": "pol-1234",
                            "component_name": "Ethics Policy",
                            "implementation_details": "Enforces ethical standards through governance policies",
                            "coverage_percentage": 100,
                            "verification_method": "Automated testing"
                        }
                    ],
                    "evidence_requirements": [
                        "Policy documentation",
                        "Audit logs",
                        "Configuration settings"
                    ],
                    "risk_level": "high",
                    "notes": "Implementation requires both technical controls and procedural documentation."
                }
            ],
            "metadata": {
                "owner": "Compliance Team",
                "last_review_date": "2025-03-15",
                "next_review_date": "2025-09-15",
                "regulatory_region": ["US", "EU"]
            },
            "created_at": "2025-01-15T09:00:00Z",
            "updated_at": "2025-03-15T14:30:00Z",
            "created_by": "user-456",
            "updated_by": "user-789"
        }
    
    def test_validate_memory_record(self):
        """Test validating a memory record."""
        # Validate memory record
        is_valid, errors = self.registry.validate(self.memory_record, "memory_record")
        self.assertTrue(is_valid, f"Memory record validation failed: {errors}")
    
    def test_validate_policy(self):
        """Test validating a policy."""
        # Validate policy
        is_valid, errors = self.registry.validate(self.policy, "policy")
        self.assertTrue(is_valid, f"Policy validation failed: {errors}")
    
    def test_validate_reflection_record(self):
        """Test validating a reflection record."""
        # Validate reflection record
        is_valid, errors = self.registry.validate(self.reflection_record, "reflection_record")
        self.assertTrue(is_valid, f"Reflection record validation failed: {errors}")
    
    def test_validate_override_request(self):
        """Test validating an override request."""
        # Validate override request
        is_valid, errors = self.registry.validate(self.override_request, "override_request")
        self.assertTrue(is_valid, f"Override request validation failed: {errors}")
    
    def test_validate_compliance_mapping(self):
        """Test validating a compliance mapping."""
        # Validate compliance mapping
        is_valid, errors = self.framework.validate_mapping(self.compliance_mapping)
        self.assertTrue(is_valid, f"Compliance mapping validation failed: {errors}")
    
    def test_api_request_validation(self):
        """Test validating API requests."""
        # Test memory record API request
        is_valid, errors = self.registry.validate_request(self.memory_record, "/memory/records", "POST")
        self.assertTrue(is_valid, f"Memory record API request validation failed: {errors}")
        
        # Test policy API request
        is_valid, errors = self.registry.validate_request(self.policy, "/policy", "POST")
        self.assertTrue(is_valid, f"Policy API request validation failed: {errors}")
        
        # Test override request API request
        is_valid, errors = self.registry.validate_request(self.override_request, "/override/requests", "POST")
        self.assertTrue(is_valid, f"Override request API request validation failed: {errors}")
    
    def test_api_response_validation(self):
        """Test validating API responses."""
        # Test memory record API response
        is_valid, errors = self.registry.validate_response(self.memory_record, "/memory/records/{id}", "GET")
        self.assertTrue(is_valid, f"Memory record API response validation failed: {errors}")
        
        # Test policy API response
        is_valid, errors = self.registry.validate_response(self.policy, "/policy/{id}", "GET")
        self.assertTrue(is_valid, f"Policy API response validation failed: {errors}")
        
        # Test override request API response
        is_valid, errors = self.registry.validate_response(self.override_request, "/override/requests/{id}", "GET")
        self.assertTrue(is_valid, f"Override request API response validation failed: {errors}")
    
    def test_compliance_mapping_for_policy(self):
        """Test compliance mapping for a policy."""
        # Register the compliance mapping
        self.framework.register_mapping(self.compliance_mapping)
        
        # Get compliance controls for the policy
        controls = self.framework.get_controls_for_component("policy", "pol-1234")
        
        # Verify SOC2 mapping
        self.assertIn("SOC2", controls)
        self.assertIn("CC1.1", controls["SOC2"])
        
        # Generate compliance report for the policy
        report = self.framework.generate_component_compliance_report("policy", "pol-1234")
        
        # Verify report
        self.assertEqual(report["component_id"], "pol-1234")
        self.assertIn("SOC2", report["standards"])
    
    def test_compliance_report_generation(self):
        """Test generating a compliance report."""
        # Register the compliance mapping
        self.framework.register_mapping(self.compliance_mapping)
        
        # Generate compliance report for SOC2
        report = self.framework.generate_compliance_report("SOC2")
        
        # Verify report
        self.assertEqual(report["standard"], "SOC2")
        self.assertGreater(report["total_controls"], 0)
        self.assertIn("coverage_by_control", report)
        self.assertIn("CC1.1", report["coverage_by_control"])
    
    def test_compliance_gap_analysis(self):
        """Test analyzing compliance gaps."""
        # Register the compliance mapping
        self.framework.register_mapping(self.compliance_mapping)
        
        # Analyze gaps for SOC2
        gaps = self.framework.analyze_compliance_gaps("SOC2")
        
        # Verify gaps analysis
        self.assertEqual(gaps["standard"], "SOC2")
        self.assertGreater(gaps["total_controls"], 0)
        self.assertIn("fully_mapped_controls", gaps)
        self.assertIn("partially_mapped_controls", gaps)
        self.assertIn("unmapped_controls", gaps)
    
    def test_integrated_validation_and_compliance(self):
        """Test integrated validation and compliance mapping."""
        # Register the compliance mapping
        self.framework.register_mapping(self.compliance_mapping)
        
        # Validate policy
        is_valid, errors = self.registry.validate(self.policy, "policy")
        self.assertTrue(is_valid, f"Policy validation failed: {errors}")
        
        # Get compliance controls for the policy
        controls = self.framework.get_controls_for_component("policy", "pol-1234")
        
        # Verify SOC2 mapping
        self.assertIn("SOC2", controls)
        self.assertIn("CC1.1", controls["SOC2"])
        
        # Verify policy has correct compliance mappings in metadata
        self.assertIn("compliance_mappings", self.policy["metadata"])
        self.assertIn("SOC2", self.policy["metadata"]["compliance_mappings"])
        self.assertIn("CC1.1", self.policy["metadata"]["compliance_mappings"]["SOC2"])
        
        # Verify consistency between schema validation and compliance mapping
        policy_soc2_controls = self.policy["metadata"]["compliance_mappings"]["SOC2"]
        framework_soc2_controls = controls["SOC2"]
        
        # Check that all controls in policy metadata are recognized by framework
        for control in policy_soc2_controls:
            self.assertIn(control, framework_soc2_controls)


if __name__ == "__main__":
    unittest.main()
