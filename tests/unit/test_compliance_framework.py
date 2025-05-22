"""
Unit tests for the Compliance Mapping Framework in Promethios.

This module contains comprehensive tests for the compliance mapping framework,
which maps governance controls to industry standards and regulations.
"""

import unittest
import os
import json
import tempfile
import shutil
from unittest.mock import patch, MagicMock

# Import the module to test
from src.compliance_mapping.framework import (
    ComplianceFramework, 
    ComplianceStandard, 
    ComplianceControl, 
    ComplianceMapping,
    ComplianceReport,
    ComplianceStatus
)

class TestComplianceFramework(unittest.TestCase):
    """Test cases for the ComplianceFramework class."""
    
    def setUp(self):
        """Set up test environment before each test."""
        # Create a temporary directory for test data
        self.test_dir = tempfile.mkdtemp()
        self.framework = ComplianceFramework(storage_dir=self.test_dir)
        
        # Sample compliance standards for testing
        self.soc2_standard = ComplianceStandard(
            id="SOC2",
            name="SOC 2",
            description="Service Organization Control 2",
            version="2017",
            categories=[
                {
                    "id": "CC1",
                    "name": "Control Environment",
                    "description": "The control environment sets the tone of an organization"
                },
                {
                    "id": "CC2",
                    "name": "Communication and Information",
                    "description": "Communication and information systems support the entity's objectives"
                }
            ],
            controls=[
                {
                    "id": "CC1.1",
                    "name": "Management Philosophy",
                    "description": "Management demonstrates a commitment to integrity and ethical values",
                    "category_id": "CC1"
                },
                {
                    "id": "CC2.1",
                    "name": "Information Quality",
                    "description": "The entity obtains or generates relevant quality information",
                    "category_id": "CC2"
                }
            ]
        )
        
        self.gdpr_standard = ComplianceStandard(
            id="GDPR",
            name="General Data Protection Regulation",
            description="EU data protection and privacy regulation",
            version="2018",
            categories=[
                {
                    "id": "GDPR-CH2",
                    "name": "Principles",
                    "description": "Principles relating to processing of personal data"
                },
                {
                    "id": "GDPR-CH3",
                    "name": "Rights",
                    "description": "Rights of the data subject"
                }
            ],
            controls=[
                {
                    "id": "GDPR-5",
                    "name": "Principles relating to processing",
                    "description": "Personal data shall be processed lawfully, fairly and transparently",
                    "category_id": "GDPR-CH2"
                },
                {
                    "id": "GDPR-25",
                    "name": "Data protection by design",
                    "description": "Implement appropriate technical and organizational measures",
                    "category_id": "GDPR-CH3"
                }
            ]
        )
    
    def tearDown(self):
        """Clean up test environment after each test."""
        # Remove the temporary directory
        shutil.rmtree(self.test_dir)
    
    def test_register_standard(self):
        """Test registering a compliance standard."""
        # Register a standard
        standard_id = self.framework.register_standard(self.soc2_standard)
        
        # Verify the standard was registered
        self.assertEqual(standard_id, "SOC2")
        self.assertIn(standard_id, self.framework.standards)
        
        # Verify standard properties
        standard = self.framework.standards[standard_id]
        self.assertEqual(standard.name, "SOC 2")
        self.assertEqual(standard.version, "2017")
        self.assertEqual(len(standard.categories), 2)
        self.assertEqual(len(standard.controls), 2)
    
    def test_get_standard(self):
        """Test retrieving a compliance standard by ID."""
        # Register a standard
        self.framework.register_standard(self.gdpr_standard)
        
        # Retrieve the standard
        standard = self.framework.get_standard("GDPR")
        
        # Verify the standard
        self.assertIsNotNone(standard)
        self.assertEqual(standard.id, "GDPR")
        self.assertEqual(standard.name, "General Data Protection Regulation")
        self.assertEqual(standard.version, "2018")
    
    def test_list_standards(self):
        """Test listing compliance standards."""
        # Register multiple standards
        self.framework.register_standard(self.soc2_standard)
        self.framework.register_standard(self.gdpr_standard)
        
        # List all standards
        standards = self.framework.list_standards()
        
        # Verify the standards
        self.assertEqual(len(standards), 2)
        standard_ids = [s.id for s in standards]
        self.assertIn("SOC2", standard_ids)
        self.assertIn("GDPR", standard_ids)
    
    def test_update_standard(self):
        """Test updating a compliance standard."""
        # Register a standard
        self.framework.register_standard(self.soc2_standard)
        
        # Update the standard
        updated_standard = ComplianceStandard(
            id="SOC2",
            name="SOC 2",
            description="Updated Service Organization Control 2",
            version="2023",  # Updated version
            categories=self.soc2_standard.categories,
            controls=self.soc2_standard.controls
        )
        
        self.framework.update_standard(updated_standard)
        
        # Verify the update
        standard = self.framework.get_standard("SOC2")
        self.assertEqual(standard.version, "2023")
        self.assertEqual(standard.description, "Updated Service Organization Control 2")
    
    def test_delete_standard(self):
        """Test deleting a compliance standard."""
        # Register a standard
        self.framework.register_standard(self.soc2_standard)
        
        # Verify the standard exists
        self.assertIn("SOC2", self.framework.standards)
        
        # Delete the standard
        result = self.framework.delete_standard("SOC2")
        
        # Verify the deletion
        self.assertTrue(result)
        self.assertNotIn("SOC2", self.framework.standards)
    
    def test_get_control(self):
        """Test retrieving a compliance control by ID."""
        # Register a standard
        self.framework.register_standard(self.gdpr_standard)
        
        # Retrieve a control
        control = self.framework.get_control("GDPR", "GDPR-5")
        
        # Verify the control
        self.assertIsNotNone(control)
        self.assertEqual(control.id, "GDPR-5")
        self.assertEqual(control.name, "Principles relating to processing")
        self.assertEqual(control.category_id, "GDPR-CH2")
    
    def test_list_controls(self):
        """Test listing compliance controls for a standard."""
        # Register a standard
        self.framework.register_standard(self.soc2_standard)
        
        # List controls
        controls = self.framework.list_controls("SOC2")
        
        # Verify the controls
        self.assertEqual(len(controls), 2)
        control_ids = [c.id for c in controls]
        self.assertIn("CC1.1", control_ids)
        self.assertIn("CC2.1", control_ids)
    
    def test_create_mapping(self):
        """Test creating a compliance mapping."""
        # Register standards
        self.framework.register_standard(self.soc2_standard)
        self.framework.register_standard(self.gdpr_standard)
        
        # Create a mapping
        mapping = ComplianceMapping(
            id="governance-mapping",
            name="Governance Controls Mapping",
            description="Maps governance controls to compliance standards",
            mappings=[
                {
                    "governance_control": "GC-1",
                    "governance_control_name": "Policy Management",
                    "standard_mappings": [
                        {
                            "standard_id": "SOC2",
                            "control_ids": ["CC1.1"]
                        },
                        {
                            "standard_id": "GDPR",
                            "control_ids": ["GDPR-5"]
                        }
                    ]
                },
                {
                    "governance_control": "GC-2",
                    "governance_control_name": "Data Protection",
                    "standard_mappings": [
                        {
                            "standard_id": "GDPR",
                            "control_ids": ["GDPR-25"]
                        }
                    ]
                }
            ]
        )
        
        mapping_id = self.framework.create_mapping(mapping)
        
        # Verify the mapping
        self.assertEqual(mapping_id, "governance-mapping")
        self.assertIn(mapping_id, self.framework.mappings)
        
        # Verify mapping properties
        stored_mapping = self.framework.mappings[mapping_id]
        self.assertEqual(stored_mapping.name, "Governance Controls Mapping")
        self.assertEqual(len(stored_mapping.mappings), 2)
    
    def test_get_mapping(self):
        """Test retrieving a compliance mapping by ID."""
        # Register standards
        self.framework.register_standard(self.soc2_standard)
        self.framework.register_standard(self.gdpr_standard)
        
        # Create a mapping
        mapping = ComplianceMapping(
            id="test-mapping",
            name="Test Mapping",
            description="Test compliance mapping",
            mappings=[
                {
                    "governance_control": "GC-1",
                    "governance_control_name": "Policy Management",
                    "standard_mappings": [
                        {
                            "standard_id": "SOC2",
                            "control_ids": ["CC1.1"]
                        }
                    ]
                }
            ]
        )
        
        self.framework.create_mapping(mapping)
        
        # Retrieve the mapping
        retrieved_mapping = self.framework.get_mapping("test-mapping")
        
        # Verify the mapping
        self.assertIsNotNone(retrieved_mapping)
        self.assertEqual(retrieved_mapping.id, "test-mapping")
        self.assertEqual(retrieved_mapping.name, "Test Mapping")
    
    def test_list_mappings(self):
        """Test listing compliance mappings."""
        # Register standards
        self.framework.register_standard(self.soc2_standard)
        self.framework.register_standard(self.gdpr_standard)
        
        # Create multiple mappings
        mapping1 = ComplianceMapping(
            id="mapping-1",
            name="Mapping 1",
            description="First mapping",
            mappings=[]
        )
        
        mapping2 = ComplianceMapping(
            id="mapping-2",
            name="Mapping 2",
            description="Second mapping",
            mappings=[]
        )
        
        self.framework.create_mapping(mapping1)
        self.framework.create_mapping(mapping2)
        
        # List mappings
        mappings = self.framework.list_mappings()
        
        # Verify the mappings
        self.assertEqual(len(mappings), 2)
        mapping_ids = [m.id for m in mappings]
        self.assertIn("mapping-1", mapping_ids)
        self.assertIn("mapping-2", mapping_ids)
    
    def test_update_mapping(self):
        """Test updating a compliance mapping."""
        # Register standards
        self.framework.register_standard(self.soc2_standard)
        
        # Create a mapping
        mapping = ComplianceMapping(
            id="update-test",
            name="Update Test",
            description="Mapping to be updated",
            mappings=[
                {
                    "governance_control": "GC-1",
                    "governance_control_name": "Policy Management",
                    "standard_mappings": [
                        {
                            "standard_id": "SOC2",
                            "control_ids": ["CC1.1"]
                        }
                    ]
                }
            ]
        )
        
        self.framework.create_mapping(mapping)
        
        # Update the mapping
        updated_mapping = ComplianceMapping(
            id="update-test",
            name="Updated Mapping",
            description="This mapping has been updated",
            mappings=[
                {
                    "governance_control": "GC-1",
                    "governance_control_name": "Policy Management",
                    "standard_mappings": [
                        {
                            "standard_id": "SOC2",
                            "control_ids": ["CC1.1", "CC2.1"]  # Added CC2.1
                        }
                    ]
                }
            ]
        )
        
        self.framework.update_mapping(updated_mapping)
        
        # Verify the update
        mapping = self.framework.get_mapping("update-test")
        self.assertEqual(mapping.name, "Updated Mapping")
        self.assertEqual(mapping.description, "This mapping has been updated")
        self.assertEqual(len(mapping.mappings[0]["standard_mappings"][0]["control_ids"]), 2)
    
    def test_delete_mapping(self):
        """Test deleting a compliance mapping."""
        # Register standards
        self.framework.register_standard(self.soc2_standard)
        
        # Create a mapping
        mapping = ComplianceMapping(
            id="delete-test",
            name="Delete Test",
            description="Mapping to be deleted",
            mappings=[]
        )
        
        self.framework.create_mapping(mapping)
        
        # Verify the mapping exists
        self.assertIn("delete-test", self.framework.mappings)
        
        # Delete the mapping
        result = self.framework.delete_mapping("delete-test")
        
        # Verify the deletion
        self.assertTrue(result)
        self.assertNotIn("delete-test", self.framework.mappings)
    
    def test_generate_compliance_report(self):
        """Test generating a compliance report."""
        # Register standards
        self.framework.register_standard(self.soc2_standard)
        self.framework.register_standard(self.gdpr_standard)
        
        # Create a mapping
        mapping = ComplianceMapping(
            id="report-test",
            name="Report Test",
            description="Mapping for report testing",
            mappings=[
                {
                    "governance_control": "GC-1",
                    "governance_control_name": "Policy Management",
                    "standard_mappings": [
                        {
                            "standard_id": "SOC2",
                            "control_ids": ["CC1.1"]
                        },
                        {
                            "standard_id": "GDPR",
                            "control_ids": ["GDPR-5"]
                        }
                    ]
                }
            ]
        )
        
        self.framework.create_mapping(mapping)
        
        # Mock governance control status
        governance_status = {
            "GC-1": {
                "status": "implemented",
                "evidence": ["policy-doc-1", "audit-log-1"],
                "last_review": "2025-05-01T10:00:00Z"
            }
        }
        
        # Generate a report
        report = self.framework.generate_compliance_report(
            mapping_id="report-test",
            governance_status=governance_status,
            report_name="Test Compliance Report",
            report_date="2025-05-22"
        )
        
        # Verify the report
        self.assertIsNotNone(report)
        self.assertEqual(report.mapping_id, "report-test")
        self.assertEqual(report.report_name, "Test Compliance Report")
        self.assertEqual(report.report_date, "2025-05-22")
        
        # Verify standard compliance
        self.assertIn("SOC2", report.standard_compliance)
        self.assertIn("GDPR", report.standard_compliance)
        
        # Verify control compliance
        soc2_compliance = report.standard_compliance["SOC2"]
        self.assertIn("CC1.1", soc2_compliance.control_compliance)
        self.assertEqual(soc2_compliance.control_compliance["CC1.1"].status, ComplianceStatus.IMPLEMENTED)
        
        gdpr_compliance = report.standard_compliance["GDPR"]
        self.assertIn("GDPR-5", gdpr_compliance.control_compliance)
        self.assertEqual(gdpr_compliance.control_compliance["GDPR-5"].status, ComplianceStatus.IMPLEMENTED)
    
    def test_get_governance_control_mappings(self):
        """Test retrieving mappings for a governance control."""
        # Register standards
        self.framework.register_standard(self.soc2_standard)
        self.framework.register_standard(self.gdpr_standard)
        
        # Create a mapping
        mapping = ComplianceMapping(
            id="gc-mapping-test",
            name="Governance Control Mapping Test",
            description="Test for governance control mappings",
            mappings=[
                {
                    "governance_control": "GC-1",
                    "governance_control_name": "Policy Management",
                    "standard_mappings": [
                        {
                            "standard_id": "SOC2",
                            "control_ids": ["CC1.1"]
                        },
                        {
                            "standard_id": "GDPR",
                            "control_ids": ["GDPR-5"]
                        }
                    ]
                },
                {
                    "governance_control": "GC-2",
                    "governance_control_name": "Data Protection",
                    "standard_mappings": [
                        {
                            "standard_id": "GDPR",
                            "control_ids": ["GDPR-25"]
                        }
                    ]
                }
            ]
        )
        
        self.framework.create_mapping(mapping)
        
        # Get mappings for a governance control
        gc_mappings = self.framework.get_governance_control_mappings("GC-1")
        
        # Verify the mappings
        self.assertEqual(len(gc_mappings), 1)
        self.assertEqual(gc_mappings[0].id, "gc-mapping-test")
        
        # Verify the specific control mapping
        gc_mapping = None
        for m in gc_mappings[0].mappings:
            if m["governance_control"] == "GC-1":
                gc_mapping = m
                break
                
        self.assertIsNotNone(gc_mapping)
        self.assertEqual(len(gc_mapping["standard_mappings"]), 2)
        
        # Verify standard mappings
        standard_ids = [sm["standard_id"] for sm in gc_mapping["standard_mappings"]]
        self.assertIn("SOC2", standard_ids)
        self.assertIn("GDPR", standard_ids)
    
    def test_get_compliance_control_mappings(self):
        """Test retrieving mappings for a compliance control."""
        # Register standards
        self.framework.register_standard(self.soc2_standard)
        
        # Create a mapping
        mapping = ComplianceMapping(
            id="cc-mapping-test",
            name="Compliance Control Mapping Test",
            description="Test for compliance control mappings",
            mappings=[
                {
                    "governance_control": "GC-1",
                    "governance_control_name": "Policy Management",
                    "standard_mappings": [
                        {
                            "standard_id": "SOC2",
                            "control_ids": ["CC1.1"]
                        }
                    ]
                },
                {
                    "governance_control": "GC-2",
                    "governance_control_name": "Risk Assessment",
                    "standard_mappings": [
                        {
                            "standard_id": "SOC2",
                            "control_ids": ["CC1.1", "CC2.1"]
                        }
                    ]
                }
            ]
        )
        
        self.framework.create_mapping(mapping)
        
        # Get mappings for a compliance control
        cc_mappings = self.framework.get_compliance_control_mappings("SOC2", "CC1.1")
        
        # Verify the mappings
        self.assertEqual(len(cc_mappings), 1)
        self.assertEqual(cc_mappings[0].id, "cc-mapping-test")
        
        # Count governance controls mapped to this compliance control
        gc_count = 0
        for m in cc_mappings[0].mappings:
            for sm in m["standard_mappings"]:
                if sm["standard_id"] == "SOC2" and "CC1.1" in sm["control_ids"]:
                    gc_count += 1
                    
        self.assertEqual(gc_count, 2)  # Both GC-1 and GC-2 map to CC1.1
    
    def test_export_compliance_data(self):
        """Test exporting compliance data."""
        # Register standards
        self.framework.register_standard(self.soc2_standard)
        self.framework.register_standard(self.gdpr_standard)
        
        # Create a mapping
        mapping = ComplianceMapping(
            id="export-test",
            name="Export Test",
            description="Mapping for export testing",
            mappings=[
                {
                    "governance_control": "GC-1",
                    "governance_control_name": "Policy Management",
                    "standard_mappings": [
                        {
                            "standard_id": "SOC2",
                            "control_ids": ["CC1.1"]
                        }
                    ]
                }
            ]
        )
        
        self.framework.create_mapping(mapping)
        
        # Export data
        export_data = self.framework.export_compliance_data()
        
        # Verify the export
        self.assertIn("standards", export_data)
        self.assertIn("mappings", export_data)
        
        # Verify standards in export
        self.assertEqual(len(export_data["standards"]), 2)
        standard_ids = [s["id"] for s in export_data["standards"]]
        self.assertIn("SOC2", standard_ids)
        self.assertIn("GDPR", standard_ids)
        
        # Verify mappings in export
        self.assertEqual(len(export_data["mappings"]), 1)
        self.assertEqual(export_data["mappings"][0]["id"], "export-test")
    
    def test_import_compliance_data(self):
        """Test importing compliance data."""
        # Prepare import data
        import_data = {
            "standards": [
                {
                    "id": "ISO27001",
                    "name": "ISO/IEC 27001",
                    "description": "Information security management",
                    "version": "2013",
                    "categories": [
                        {
                            "id": "A.5",
                            "name": "Information security policies",
                            "description": "Management direction for information security"
                        }
                    ],
                    "controls": [
                        {
                            "id": "A.5.1.1",
                            "name": "Policies for information security",
                            "description": "A set of policies for information security shall be defined",
                            "category_id": "A.5"
                        }
                    ]
                }
            ],
            "mappings": [
                {
                    "id": "import-mapping",
                    "name": "Imported Mapping",
                    "description": "Mapping from import",
                    "mappings": [
                        {
                            "governance_control": "GC-3",
                            "governance_control_name": "Information Security Policy",
                            "standard_mappings": [
                                {
                                    "standard_id": "ISO27001",
                                    "control_ids": ["A.5.1.1"]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        
        # Import data
        result = self.framework.import_compliance_data(import_data)
        
        # Verify the import
        self.assertTrue(result)
        
        # Verify imported standard
        standard = self.framework.get_standard("ISO27001")
        self.assertIsNotNone(standard)
        self.assertEqual(standard.name, "ISO/IEC 27001")
        
        # Verify imported mapping
        mapping = self.framework.get_mapping("import-mapping")
        self.assertIsNotNone(mapping)
        self.assertEqual(mapping.name, "Imported Mapping")
    
    def test_compliance_gap_analysis(self):
        """Test performing a compliance gap analysis."""
        # Register standards
        self.framework.register_standard(self.soc2_standard)
        
        # Create a mapping
        mapping = ComplianceMapping(
            id="gap-analysis-test",
            name="Gap Analysis Test",
            description="Mapping for gap analysis",
            mappings=[
                {
                    "governance_control": "GC-1",
                    "governance_control_name": "Policy Management",
                    "standard_mappings": [
                        {
                            "standard_id": "SOC2",
                            "control_ids": ["CC1.1"]
                        }
                    ]
                },
                {
                    "governance_control": "GC-2",
                    "governance_control_name": "Information Quality",
                    "standard_mappings": [
                        {
                            "standard_id": "SOC2",
                            "control_ids": ["CC2.1"]
                        }
                    ]
                }
            ]
        )
        
        self.framework.create_mapping(mapping)
        
        # Mock governance control status (GC-2 is missing)
        governance_status = {
            "GC-1": {
                "status": "implemented",
                "evidence": ["policy-doc-1"],
                "last_review": "2025-05-01T10:00:00Z"
            }
        }
        
        # Perform gap analysis
        gap_analysis = self.framework.perform_gap_analysis(
            mapping_id="gap-analysis-test",
            governance_status=governance_status,
            standard_id="SOC2"
        )
        
        # Verify the gap analysis
        self.assertIn("implemented_controls", gap_analysis)
        self.assertIn("gap_controls", gap_analysis)
        
        # Verify implemented controls
        self.assertEqual(len(gap_analysis["implemented_controls"]), 1)
        self.assertEqual(gap_analysis["implemented_controls"][0], "CC1.1")
        
        # Verify gap controls
        self.assertEqual(len(gap_analysis["gap_controls"]), 1)
        self.assertEqual(gap_analysis["gap_controls"][0], "CC2.1")
        
        # Verify gap details
        self.assertIn("gap_details", gap_analysis)
        self.assertEqual(len(gap_analysis["gap_details"]), 1)
        self.assertEqual(gap_analysis["gap_details"][0]["control_id"], "CC2.1")
        self.assertEqual(gap_analysis["gap_details"][0]["governance_control"], "GC-2")
    
    def test_compliance_report_persistence(self):
        """Test persistence of compliance reports."""
        # Register standards
        self.framework.register_standard(self.soc2_standard)
        
        # Create a mapping
        mapping = ComplianceMapping(
            id="persistence-test",
            name="Persistence Test",
            description="Mapping for persistence testing",
            mappings=[
                {
                    "governance_control": "GC-1",
                    "governance_control_name": "Policy Management",
                    "standard_mappings": [
                        {
                            "standard_id": "SOC2",
                            "control_ids": ["CC1.1"]
                        }
                    ]
                }
            ]
        )
        
        self.framework.create_mapping(mapping)
        
        # Mock governance control status
        governance_status = {
            "GC-1": {
                "status": "implemented",
                "evidence": ["policy-doc-1"],
                "last_review": "2025-05-01T10:00:00Z"
            }
        }
        
        # Generate a report
        report = self.framework.generate_compliance_report(
            mapping_id="persistence-test",
            governance_status=governance_status,
            report_name="Persistence Report",
            report_date="2025-05-22"
        )
        
        # Save the report
        report_id = self.framework.save_compliance_report(report)
        
        # Verify the report was saved
        self.assertIsNotNone(report_id)
        
        # Retrieve the report
        retrieved_report = self.framework.get_compliance_report(report_id)
        
        # Verify the retrieved report
        self.assertIsNotNone(retrieved_report)
        self.assertEqual(retrieved_report.report_name, "Persistence Report")
        self.assertEqual(retrieved_report.mapping_id, "persistence-test")
    
    def test_list_compliance_reports(self):
        """Test listing compliance reports."""
        # Register standards
        self.framework.register_standard(self.soc2_standard)
        
        # Create a mapping
        mapping = ComplianceMapping(
            id="list-reports-test",
            name="List Reports Test",
            description="Mapping for listing reports",
            mappings=[
                {
                    "governance_control": "GC-1",
                    "governance_control_name": "Policy Management",
                    "standard_mappings": [
                        {
                            "standard_id": "SOC2",
                            "control_ids": ["CC1.1"]
                        }
                    ]
                }
            ]
        )
        
        self.framework.create_mapping(mapping)
        
        # Mock governance control status
        governance_status = {
            "GC-1": {
                "status": "implemented",
                "evidence": ["policy-doc-1"],
                "last_review": "2025-05-01T10:00:00Z"
            }
        }
        
        # Generate multiple reports
        report1 = self.framework.generate_compliance_report(
            mapping_id="list-reports-test",
            governance_status=governance_status,
            report_name="Report 1",
            report_date="2025-05-01"
        )
        
        report2 = self.framework.generate_compliance_report(
            mapping_id="list-reports-test",
            governance_status=governance_status,
            report_name="Report 2",
            report_date="2025-05-15"
        )
        
        # Save the reports
        self.framework.save_compliance_report(report1)
        self.framework.save_compliance_report(report2)
        
        # List all reports
        reports = self.framework.list_compliance_reports()
        
        # Verify the reports
        self.assertEqual(len(reports), 2)
        report_names = [r.report_name for r in reports]
        self.assertIn("Report 1", report_names)
        self.assertIn("Report 2", report_names)
        
        # List reports by date range
        filtered_reports = self.framework.list_compliance_reports(
            start_date="2025-05-10",
            end_date="2025-05-20"
        )
        
        # Verify filtered reports
        self.assertEqual(len(filtered_reports), 1)
        self.assertEqual(filtered_reports[0].report_name, "Report 2")

if __name__ == "__main__":
    unittest.main()
