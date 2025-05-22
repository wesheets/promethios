"""
Unit tests for the Compliance Mapping Framework for Promethios Phase 6.1

This module provides comprehensive tests for the compliance mapping framework,
ensuring that all compliance mappings are correctly validated and enforced.
"""

import unittest
import json
import os
import sys
import tempfile
from pathlib import Path

# Add the src directory to the Python path
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.compliance_mapping.framework import ComplianceMappingFramework, get_framework

class TestComplianceMappingFramework(unittest.TestCase):
    """Test cases for the ComplianceMappingFramework class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a temporary directory for test mappings
        self.test_mappings_dir = tempfile.mkdtemp()
        
        # Create test mapping files
        self.create_test_mappings()
        
        # Initialize framework with test mappings
        self.framework = ComplianceMappingFramework(self.test_mappings_dir)
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Clean up test mapping files
        for filename in os.listdir(self.test_mappings_dir):
            os.remove(os.path.join(self.test_mappings_dir, filename))
        os.rmdir(self.test_mappings_dir)
    
    def create_test_mappings(self):
        """Create test mapping files."""
        # Test SOC2 mapping
        soc2_mapping = {
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
                            "coverage_percentage": 100
                        }
                    ]
                },
                {
                    "control_id": "CC5.1",
                    "control_name": "Logical Access",
                    "control_description": "The entity selects and develops control activities that restrict technology access rights.",
                    "promethios_components": [
                        {
                            "component_type": "policy",
                            "component_id": "pol-5678",
                            "component_name": "Access Control Policy",
                            "coverage_percentage": 75
                        }
                    ]
                }
            ]
        }
        
        # Test GDPR mapping
        gdpr_mapping = {
            "mapping_id": "cmp-gdprv1",
            "standard": "GDPR",
            "version": "2016/679",
            "description": "GDPR compliance mapping for Promethios",
            "mappings": [
                {
                    "control_id": "GDPR-5",
                    "control_name": "Principles relating to processing of personal data",
                    "promethios_components": [
                        {
                            "component_type": "policy",
                            "component_id": "pol-9012",
                            "component_name": "Data Processing Policy",
                            "coverage_percentage": 90
                        }
                    ]
                },
                {
                    "control_id": "GDPR-25",
                    "control_name": "Data protection by design and by default",
                    "promethios_components": []  # Intentionally empty for testing
                }
            ]
        }
        
        # Write mappings to files
        with open(os.path.join(self.test_mappings_dir, "cmp-soc2v1.json"), "w") as f:
            json.dump(soc2_mapping, f)
        
        with open(os.path.join(self.test_mappings_dir, "cmp-gdprv1.json"), "w") as f:
            json.dump(gdpr_mapping, f)
    
    def test_load_mappings(self):
        """Test loading mappings from directory."""
        # Verify mappings were loaded
        self.assertIn("SOC2", self.framework.mappings)
        self.assertIn("GDPR", self.framework.mappings)
        
        # Verify mapping versions
        self.assertIn("2017", self.framework.mappings["SOC2"])
        self.assertIn("2016/679", self.framework.mappings["GDPR"])
    
    def test_get_mapping(self):
        """Test getting a mapping by standard and version."""
        # Get SOC2 mapping
        soc2_mapping = self.framework.get_mapping("SOC2")
        self.assertIsNotNone(soc2_mapping)
        self.assertEqual(soc2_mapping["standard"], "SOC2")
        
        # Get GDPR mapping
        gdpr_mapping = self.framework.get_mapping("GDPR")
        self.assertIsNotNone(gdpr_mapping)
        self.assertEqual(gdpr_mapping["standard"], "GDPR")
        
        # Get non-existent mapping
        nonexistent_mapping = self.framework.get_mapping("NONEXISTENT")
        self.assertIsNone(nonexistent_mapping)
    
    def test_validate_mapping(self):
        """Test validating a compliance mapping."""
        # Valid mapping
        valid_mapping = {
            "mapping_id": "cmp-test1",
            "standard": "TEST",
            "version": "1.0",
            "mappings": [
                {
                    "control_id": "TEST-1",
                    "control_name": "Test Control",
                    "promethios_components": [
                        {
                            "component_type": "policy",
                            "component_id": "pol-test"
                        }
                    ]
                }
            ]
        }
        
        is_valid, errors = self.framework.validate_mapping(valid_mapping)
        self.assertTrue(is_valid)
        self.assertEqual(len(errors), 0)
        
        # Invalid mapping (missing required field)
        invalid_mapping = {
            "mapping_id": "cmp-test2",
            "standard": "TEST",
            # Missing version
            "mappings": []
        }
        
        is_valid, errors = self.framework.validate_mapping(invalid_mapping)
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)
        
        # Invalid mapping (invalid component type)
        invalid_component_mapping = {
            "mapping_id": "cmp-test3",
            "standard": "TEST",
            "version": "1.0",
            "mappings": [
                {
                    "control_id": "TEST-1",
                    "control_name": "Test Control",
                    "promethios_components": [
                        {
                            "component_type": "invalid_type",  # Invalid type
                            "component_id": "pol-test"
                        }
                    ]
                }
            ]
        }
        
        is_valid, errors = self.framework.validate_mapping(invalid_component_mapping)
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)
    
    def test_get_controls_for_component(self):
        """Test getting compliance controls for a component."""
        # Get controls for a component that has mappings
        controls = self.framework.get_controls_for_component("policy", "pol-1234")
        self.assertIn("SOC2", controls)
        self.assertIn("CC1.1", controls["SOC2"])
        
        # Get controls for a component that has no mappings
        controls = self.framework.get_controls_for_component("policy", "nonexistent")
        self.assertEqual(controls, {})
    
    def test_get_components_for_control(self):
        """Test getting components for a compliance control."""
        # Get components for a control that has mappings
        components = self.framework.get_components_for_control("SOC2", "CC1.1")
        self.assertEqual(len(components), 1)
        self.assertEqual(components[0]["component_id"], "pol-1234")
        
        # Get components for a control that has no mappings
        components = self.framework.get_components_for_control("SOC2", "nonexistent")
        self.assertEqual(components, [])
    
    def test_generate_compliance_report(self):
        """Test generating a compliance report."""
        # Generate report for SOC2
        report = self.framework.generate_compliance_report("SOC2")
        self.assertEqual(report["standard"], "SOC2")
        self.assertEqual(report["total_controls"], 2)
        self.assertIn("coverage_by_control", report)
        self.assertIn("CC1.1", report["coverage_by_control"])
        self.assertIn("CC5.1", report["coverage_by_control"])
        
        # Generate report for GDPR
        report = self.framework.generate_compliance_report("GDPR")
        self.assertEqual(report["standard"], "GDPR")
        self.assertEqual(report["total_controls"], 2)
        self.assertIn("gaps", report)
        # GDPR-25 has no components, should be in gaps
        self.assertTrue(any(gap["control_id"] == "GDPR-25" for gap in report["gaps"]))
    
    def test_analyze_compliance_gaps(self):
        """Test analyzing compliance gaps."""
        # Analyze gaps for SOC2
        gaps = self.framework.analyze_compliance_gaps("SOC2")
        self.assertEqual(gaps["standard"], "SOC2")
        self.assertEqual(gaps["total_controls"], 2)
        self.assertEqual(len(gaps["fully_mapped_controls"]), 1)  # CC1.1 is fully mapped
        self.assertEqual(len(gaps["partially_mapped_controls"]), 1)  # CC5.1 is partially mapped
        
        # Analyze gaps for GDPR
        gaps = self.framework.analyze_compliance_gaps("GDPR")
        self.assertEqual(gaps["standard"], "GDPR")
        self.assertEqual(gaps["total_controls"], 2)
        self.assertEqual(len(gaps["unmapped_controls"]), 1)  # GDPR-25 is unmapped
        self.assertEqual(len(gaps["partially_mapped_controls"]), 1)  # GDPR-5 is partially mapped
    
    def test_map_component_to_control(self):
        """Test mapping a component to a control."""
        # Map a new component to an existing control
        result = self.framework.map_component_to_control(
            "SOC2", "CC5.1", "api", "api-1234", 80, "API access controls"
        )
        self.assertTrue(result)
        
        # Verify mapping was added
        components = self.framework.get_components_for_control("SOC2", "CC5.1")
        self.assertEqual(len(components), 2)  # Now has 2 components
        self.assertTrue(any(c["component_id"] == "api-1234" for c in components))
        
        # Verify component mapping index was updated
        controls = self.framework.get_controls_for_component("api", "api-1234")
        self.assertIn("SOC2", controls)
        self.assertIn("CC5.1", controls["SOC2"])
    
    def test_remove_component_from_control(self):
        """Test removing a component from a control."""
        # Remove an existing component from a control
        result = self.framework.remove_component_from_control(
            "SOC2", "CC1.1", "policy", "pol-1234"
        )
        self.assertTrue(result)
        
        # Verify mapping was removed
        components = self.framework.get_components_for_control("SOC2", "CC1.1")
        self.assertEqual(len(components), 0)  # Now has 0 components
    
    def test_create_standard_mapping(self):
        """Test creating a new standard mapping."""
        # Create a new standard mapping
        mapping = self.framework.create_standard_mapping(
            "HIPAA", "2013", "HIPAA compliance mapping for Promethios"
        )
        
        # Verify mapping was created correctly
        self.assertEqual(mapping["standard"], "HIPAA")
        self.assertEqual(mapping["version"], "2013")
        self.assertEqual(mapping["mappings"], [])
    
    def test_add_control_to_mapping(self):
        """Test adding a control to a mapping."""
        # Create a new mapping
        mapping = self.framework.create_standard_mapping("ISO27001", "2013")
        
        # Add a control
        mapping = self.framework.add_control_to_mapping(
            mapping, "A.5.1.1", "Information Security Policy",
            "Policies for information security"
        )
        
        # Verify control was added
        self.assertEqual(len(mapping["mappings"]), 1)
        self.assertEqual(mapping["mappings"][0]["control_id"], "A.5.1.1")
        self.assertEqual(mapping["mappings"][0]["control_name"], "Information Security Policy")
    
    def test_get_framework_singleton(self):
        """Test getting the singleton framework instance."""
        # Get singleton instance
        framework1 = get_framework()
        framework2 = get_framework()
        
        # Verify same instance
        self.assertIs(framework1, framework2)


if __name__ == "__main__":
    unittest.main()
