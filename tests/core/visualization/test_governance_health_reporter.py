"""
Unit tests for the Governance Health Reporter module.

This test suite validates the functionality of the GovernanceHealthReporter class,
ensuring it correctly reports on the health of governance components and identifies issues.
"""

import unittest
from unittest.mock import MagicMock, patch
import json
import os
import sys
from datetime import datetime, timedelta

# Add the src directory to the path so we can import the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from src.core.visualization.governance_health_reporter import GovernanceHealthReporter


class TestGovernanceHealthReporter(unittest.TestCase):
    """Test cases for the GovernanceHealthReporter class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        # Create a mock for the visualization data transformer
        self.data_transformer_mock = MagicMock()
        
        # Create a mock for the governance primitive manager
        self.governance_primitive_manager_mock = MagicMock()
        
        # Create a mock for the attestation service
        self.attestation_service_mock = MagicMock()
        
        # Create a mock for the boundary integrity verifier
        self.boundary_integrity_verifier_mock = MagicMock()
        
        # Create a mock for the schema validator
        self.schema_validator_mock = MagicMock()
        self.schema_validator_mock.validate.return_value = True
        
        # Create the reporter with mocked dependencies
        self.reporter = GovernanceHealthReporter(
            data_transformer=self.data_transformer_mock,
            governance_primitive_manager=self.governance_primitive_manager_mock,
            attestation_service=self.attestation_service_mock,
            boundary_integrity_verifier=self.boundary_integrity_verifier_mock,
            schema_validator=self.schema_validator_mock
        )
        
        # Sample health report data
        self.sample_health_report = {
            "overall_health": {
                "score": 0.94,
                "status": "healthy",
                "issues": {
                    "critical": 0,
                    "major": 1,
                    "minor": 3
                }
            },
            "components": {
                "attestation_service": {
                    "score": 0.95,
                    "status": "healthy",
                    "issues": {
                        "critical": 0,
                        "major": 0,
                        "minor": 1
                    },
                    "last_check": "2025-05-21T15:30:00Z"
                },
                "claim_verification_protocol": {
                    "score": 0.92,
                    "status": "warning",
                    "issues": {
                        "critical": 0,
                        "major": 1,
                        "minor": 0
                    },
                    "last_check": "2025-05-21T15:30:00Z"
                },
                "governance_audit_trail": {
                    "score": 0.98,
                    "status": "healthy",
                    "issues": {
                        "critical": 0,
                        "major": 0,
                        "minor": 2
                    },
                    "last_check": "2025-05-21T15:30:00Z"
                }
            }
        }
        
        # Sample issue report data
        self.sample_issue_report = {
            "summary": {
                "total_count": 4,
                "critical_count": 0,
                "major_count": 1,
                "minor_count": 3
            },
            "component_issues": [
                {
                    "component": "attestation_service",
                    "total_count": 1,
                    "critical_count": 0,
                    "major_count": 0,
                    "minor_count": 1
                },
                {
                    "component": "claim_verification_protocol",
                    "total_count": 1,
                    "critical_count": 0,
                    "major_count": 1,
                    "minor_count": 0
                },
                {
                    "component": "governance_audit_trail",
                    "total_count": 2,
                    "critical_count": 0,
                    "major_count": 0,
                    "minor_count": 2
                }
            ],
            "issues": [
                {
                    "id": "issue-001",
                    "severity": "minor",
                    "component": "attestation_service",
                    "description": "Attestation refresh rate below optimal threshold",
                    "detected_at": "2025-05-21T14:30:00Z",
                    "status": "open"
                },
                {
                    "id": "issue-002",
                    "severity": "major",
                    "component": "claim_verification_protocol",
                    "description": "Increased latency in claim verification process",
                    "detected_at": "2025-05-21T13:45:00Z",
                    "status": "in_progress"
                },
                {
                    "id": "issue-003",
                    "severity": "minor",
                    "component": "governance_audit_trail",
                    "description": "Audit trail storage approaching capacity threshold",
                    "detected_at": "2025-05-21T12:15:00Z",
                    "status": "open"
                },
                {
                    "id": "issue-004",
                    "severity": "minor",
                    "component": "governance_audit_trail",
                    "description": "Audit trail indexing performance degradation",
                    "detected_at": "2025-05-21T11:30:00Z",
                    "status": "open"
                }
            ]
        }
        
        # Sample compliance report data
        self.sample_compliance_report = {
            "summary": {
                "compliant_count": 18,
                "non_compliant_count": 2,
                "compliance_percentage": 90.0
            },
            "compliance_by_type": [
                {
                    "type": "security",
                    "compliant_count": 5,
                    "non_compliant_count": 0,
                    "compliance_percentage": 100.0
                },
                {
                    "type": "privacy",
                    "compliant_count": 4,
                    "non_compliant_count": 1,
                    "compliance_percentage": 80.0
                },
                {
                    "type": "operational",
                    "compliant_count": 9,
                    "non_compliant_count": 1,
                    "compliance_percentage": 90.0
                }
            ],
            "compliance_details": [
                {
                    "requirement": "Data encryption at rest",
                    "type": "security",
                    "status": "compliant",
                    "component": "attestation_service",
                    "last_checked": "2025-05-21T15:00:00Z",
                    "details": "AES-256 encryption implemented for all stored data"
                },
                {
                    "requirement": "Data minimization",
                    "type": "privacy",
                    "status": "non_compliant",
                    "component": "governance_audit_trail",
                    "last_checked": "2025-05-21T15:00:00Z",
                    "details": "Audit trail contains unnecessary personal data fields"
                },
                {
                    "requirement": "High availability",
                    "type": "operational",
                    "status": "compliant",
                    "component": "claim_verification_protocol",
                    "last_checked": "2025-05-21T15:00:00Z",
                    "details": "99.99% uptime achieved in the last 30 days"
                }
                # Additional compliance details would be here
            ]
        }
        
        # Sample anomaly report data
        self.sample_anomaly_report = {
            "detection_method": "statistical",
            "confidence_level": 0.95,
            "time_series_data": [
                {"timestamp": "2025-05-15T00:00:00Z", "value": 0.95, "expected_value": 0.95, "upper_bound": 0.98, "lower_bound": 0.92},
                {"timestamp": "2025-05-16T00:00:00Z", "value": 0.94, "expected_value": 0.95, "upper_bound": 0.98, "lower_bound": 0.92},
                {"timestamp": "2025-05-17T00:00:00Z", "value": 0.96, "expected_value": 0.95, "upper_bound": 0.98, "lower_bound": 0.92},
                {"timestamp": "2025-05-18T00:00:00Z", "value": 0.95, "expected_value": 0.95, "upper_bound": 0.98, "lower_bound": 0.92},
                {"timestamp": "2025-05-19T00:00:00Z", "value": 0.93, "expected_value": 0.95, "upper_bound": 0.98, "lower_bound": 0.92},
                {"timestamp": "2025-05-20T00:00:00Z", "value": 0.91, "expected_value": 0.95, "upper_bound": 0.98, "lower_bound": 0.92},
                {"timestamp": "2025-05-21T00:00:00Z", "value": 0.85, "expected_value": 0.95, "upper_bound": 0.98, "lower_bound": 0.92}
            ],
            "anomalies": [
                {
                    "timestamp": "2025-05-21T00:00:00Z",
                    "component": "claim_verification_protocol",
                    "metric": "verification_rate",
                    "value": 0.85,
                    "expected_value": 0.95,
                    "deviation_percentage": 10.5,
                    "severity": "major",
                    "description": "Significant drop in claim verification rate"
                }
            ]
        }
        
        # Configure the mocks to return the sample data
        self.data_transformer_mock.transform_health_report_for_visualization.return_value = self.sample_health_report
        self.governance_primitive_manager_mock.get_issue_report.return_value = self.sample_issue_report
        self.governance_primitive_manager_mock.get_compliance_report.return_value = self.sample_compliance_report
        self.governance_primitive_manager_mock.get_anomaly_report.return_value = self.sample_anomaly_report

    def test_get_health_report(self):
        """Test getting the governance health report."""
        # Call the method under test
        result = self.reporter.get_health_report()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('overall_health', result)
        self.assertIn('components', result)
        
        # Verify overall health
        self.assertIn('score', result['overall_health'])
        self.assertIn('status', result['overall_health'])
        self.assertIn('issues', result['overall_health'])
        
        # Verify components
        self.assertEqual(len(result['components']), len(self.sample_health_report['components']))
        for component_id, component_data in result['components'].items():
            self.assertIn('score', component_data)
            self.assertIn('status', component_data)
            self.assertIn('issues', component_data)
            self.assertIn('last_check', component_data)
        
        # Verify the data transformer was called
        self.data_transformer_mock.transform_health_report_for_visualization.assert_called_once()

    def test_get_health_report_with_options(self):
        """Test getting the governance health report with custom options."""
        # Custom options
        options = {
            "include_inactive": True,
            "min_health": 0.9,
            "components": ["attestation_service", "claim_verification_protocol"]
        }
        
        # Call the method under test with custom options
        result = self.reporter.get_health_report(options)
        
        # Verify the result
        self.assertIsNotNone(result)
        
        # Verify the data transformer was called with the options
        self.data_transformer_mock.transform_health_report_for_visualization.assert_called_once_with(options)

    def test_get_issue_report(self):
        """Test getting the governance issue report."""
        # Call the method under test
        result = self.reporter.get_issue_report()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('summary', result)
        self.assertIn('component_issues', result)
        self.assertIn('issues', result)
        
        # Verify summary
        self.assertIn('total_count', result['summary'])
        self.assertIn('critical_count', result['summary'])
        self.assertIn('major_count', result['summary'])
        self.assertIn('minor_count', result['summary'])
        
        # Verify component issues
        self.assertEqual(len(result['component_issues']), len(self.sample_issue_report['component_issues']))
        for component_issue in result['component_issues']:
            self.assertIn('component', component_issue)
            self.assertIn('total_count', component_issue)
            self.assertIn('critical_count', component_issue)
            self.assertIn('major_count', component_issue)
            self.assertIn('minor_count', component_issue)
        
        # Verify issues
        self.assertEqual(len(result['issues']), len(self.sample_issue_report['issues']))
        for issue in result['issues']:
            self.assertIn('id', issue)
            self.assertIn('severity', issue)
            self.assertIn('component', issue)
            self.assertIn('description', issue)
            self.assertIn('detected_at', issue)
            self.assertIn('status', issue)
        
        # Verify the governance primitive manager was called
        self.governance_primitive_manager_mock.get_issue_report.assert_called_once()

    def test_get_issue_report_with_filters(self):
        """Test getting the governance issue report with filters."""
        # Filters
        severity = "major"
        component = "claim_verification_protocol"
        status = "in_progress"
        
        # Call the method under test with filters
        result = self.reporter.get_issue_report(severity, component, status)
        
        # Verify the result
        self.assertIsNotNone(result)
        
        # Verify the governance primitive manager was called with the filters
        self.governance_primitive_manager_mock.get_issue_report.assert_called_once_with(
            severity=severity, component=component, status=status
        )

    def test_get_compliance_report(self):
        """Test getting the governance compliance report."""
        # Call the method under test
        result = self.reporter.get_compliance_report()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('summary', result)
        self.assertIn('compliance_by_type', result)
        self.assertIn('compliance_details', result)
        
        # Verify summary
        self.assertIn('compliant_count', result['summary'])
        self.assertIn('non_compliant_count', result['summary'])
        self.assertIn('compliance_percentage', result['summary'])
        
        # Verify compliance by type
        self.assertEqual(len(result['compliance_by_type']), len(self.sample_compliance_report['compliance_by_type']))
        for compliance_type in result['compliance_by_type']:
            self.assertIn('type', compliance_type)
            self.assertIn('compliant_count', compliance_type)
            self.assertIn('non_compliant_count', compliance_type)
            self.assertIn('compliance_percentage', compliance_type)
        
        # Verify compliance details
        self.assertEqual(len(result['compliance_details']), len(self.sample_compliance_report['compliance_details']))
        for detail in result['compliance_details']:
            self.assertIn('requirement', detail)
            self.assertIn('type', detail)
            self.assertIn('status', detail)
            self.assertIn('component', detail)
            self.assertIn('last_checked', detail)
            self.assertIn('details', detail)
        
        # Verify the governance primitive manager was called
        self.governance_primitive_manager_mock.get_compliance_report.assert_called_once()

    def test_get_compliance_report_with_filters(self):
        """Test getting the governance compliance report with filters."""
        # Filters
        compliance_type = "security"
        status = "compliant"
        component = "attestation_service"
        
        # Call the method under test with filters
        result = self.reporter.get_compliance_report(compliance_type, status, component)
        
        # Verify the result
        self.assertIsNotNone(result)
        
        # Verify the governance primitive manager was called with the filters
        self.governance_primitive_manager_mock.get_compliance_report.assert_called_once_with(
            compliance_type=compliance_type, status=status, component=component
        )

    def test_get_anomaly_report(self):
        """Test getting the governance anomaly report."""
        # Call the method under test
        result = self.reporter.get_anomaly_report()
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('detection_method', result)
        self.assertIn('confidence_level', result)
        self.assertIn('time_series_data', result)
        self.assertIn('anomalies', result)
        
        # Verify time series data
        self.assertEqual(len(result['time_series_data']), len(self.sample_anomaly_report['time_series_data']))
        for data_point in result['time_series_data']:
            self.assertIn('timestamp', data_point)
            self.assertIn('value', data_point)
            self.assertIn('expected_value', data_point)
            self.assertIn('upper_bound', data_point)
            self.assertIn('lower_bound', data_point)
        
        # Verify anomalies
        self.assertEqual(len(result['anomalies']), len(self.sample_anomaly_report['anomalies']))
        for anomaly in result['anomalies']:
            self.assertIn('timestamp', anomaly)
            self.assertIn('component', anomaly)
            self.assertIn('metric', anomaly)
            self.assertIn('value', anomaly)
            self.assertIn('expected_value', anomaly)
            self.assertIn('deviation_percentage', anomaly)
            self.assertIn('severity', anomaly)
            self.assertIn('description', anomaly)
        
        # Verify the governance primitive manager was called
        self.governance_primitive_manager_mock.get_anomaly_report.assert_called_once()

    def test_get_anomaly_report_with_options(self):
        """Test getting the governance anomaly report with options."""
        # Options
        time_period = "weekly"
        component = "claim_verification_protocol"
        metric = "verification_rate"
        
        # Call the method under test with options
        result = self.reporter.get_anomaly_report(time_period, component, metric)
        
        # Verify the result
        self.assertIsNotNone(result)
        
        # Verify the governance primitive manager was called with the options
        self.governance_primitive_manager_mock.get_anomaly_report.assert_called_once_with(
            time_period=time_period, component=component, metric=metric
        )

    def test_get_component_health(self):
        """Test getting health information for a specific component."""
        # Component ID
        component_id = "claim_verification_protocol"
        
        # Sample component health data
        component_health = {
            "id": component_id,
            "name": "Claim Verification Protocol",
            "score": 0.92,
            "status": "warning",
            "issues": {
                "critical": 0,
                "major": 1,
                "minor": 0
            },
            "metrics": {
                "verification_rate": 0.95,
                "response_time": 0.15,
                "error_rate": 0.02
            },
            "last_check": "2025-05-21T15:30:00Z",
            "trend": "decreasing"
        }
        
        # Configure the mock to return the sample component health data
        self.governance_primitive_manager_mock.get_component_health.return_value = component_health
        
        # Call the method under test
        result = self.reporter.get_component_health(component_id)
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertEqual(result['id'], component_id)
        self.assertIn('name', result)
        self.assertIn('score', result)
        self.assertIn('status', result)
        self.assertIn('issues', result)
        self.assertIn('metrics', result)
        self.assertIn('last_check', result)
        self.assertIn('trend', result)
        
        # Verify the governance primitive manager was called
        self.governance_primitive_manager_mock.get_component_health.assert_called_once_with(component_id)

    def test_get_health_history(self):
        """Test getting historical health data."""
        # Sample historical data parameters
        start_date = datetime.now() - timedelta(days=7)
        end_date = datetime.now()
        component_id = "claim_verification_protocol"
        interval = "daily"
        
        # Sample historical health data
        historical_health = [
            {
                "timestamp": "2025-05-15T00:00:00Z",
                "score": 0.95,
                "status": "healthy",
                "issues": {
                    "critical": 0,
                    "major": 0,
                    "minor": 1
                }
            },
            {
                "timestamp": "2025-05-16T00:00:00Z",
                "score": 0.95,
                "status": "healthy",
                "issues": {
                    "critical": 0,
                    "major": 0,
                    "minor": 1
                }
            },
            {
                "timestamp": "2025-05-17T00:00:00Z",
                "score": 0.94,
                "status": "healthy",
                "issues": {
                    "critical": 0,
                    "major": 0,
                    "minor": 2
                }
            },
            {
                "timestamp": "2025-05-18T00:00:00Z",
                "score": 0.94,
                "status": "healthy",
                "issues": {
                    "critical": 0,
                    "major": 0,
                    "minor": 2
                }
            },
            {
                "timestamp": "2025-05-19T00:00:00Z",
                "score": 0.93,
                "status": "healthy",
                "issues": {
                    "critical": 0,
                    "major": 0,
                    "minor": 2
                }
            },
            {
                "timestamp": "2025-05-20T00:00:00Z",
                "score": 0.93,
                "status": "healthy",
                "issues": {
                    "critical": 0,
                    "major": 0,
                    "minor": 2
                }
            },
            {
                "timestamp": "2025-05-21T00:00:00Z",
                "score": 0.92,
                "status": "warning",
                "issues": {
                    "critical": 0,
                    "major": 1,
                    "minor": 0
                }
            }
        ]
        
        # Configure the mock to return the sample historical health data
        self.governance_primitive_manager_mock.get_health_history.return_value = historical_health
        
        # Call the method under test
        result = self.reporter.get_health_history(start_date, end_date, component_id, interval)
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertEqual(len(result), len(historical_health))
        for i, entry in enumerate(result):
            self.assertIn('timestamp', entry)
            self.assertIn('score', entry)
            self.assertIn('status', entry)
            self.assertIn('issues', entry)
        
        # Verify the governance primitive manager was called
        self.governance_primitive_manager_mock.get_health_history.assert_called_once_with(
            start_date, end_date, component_id, interval
        )

    def test_generate_health_report(self):
        """Test generating a comprehensive health report."""
        # Sample report options
        options = {
            "include_issues": True,
            "include_compliance": True,
            "include_anomalies": True,
            "format": "json"
        }
        
        # Call the method under test
        result = self.reporter.generate_health_report(options)
        
        # Verify the result
        self.assertIsNotNone(result)
        self.assertIn('timestamp', result)
        self.assertIn('overall_health', result)
        self.assertIn('components', result)
        
        if options.get('include_issues'):
            self.assertIn('issues', result)
        
        if options.get('include_compliance'):
            self.assertIn('compliance', result)
        
        if options.get('include_anomalies'):
            self.assertIn('anomalies', result)
        
        # Verify the data transformer and other dependencies were called
        self.data_transformer_mock.transform_health_report_for_visualization.assert_called()
        
        if options.get('include_issues'):
            self.governance_primitive_manager_mock.get_issue_report.assert_called()
        
        if options.get('include_compliance'):
            self.governance_primitive_manager_mock.get_compliance_report.assert_called()
        
        if options.get('include_anomalies'):
            self.governance_primitive_manager_mock.get_anomaly_report.assert_called()

    def test_invalid_health_report_data(self):
        """Test behavior when invalid health report data is provided."""
        # Configure the mock to return invalid data
        self.data_transformer_mock.transform_health_report_for_visualization.return_value = {"invalid": "data"}
        
        # Configure schema validator to reject the data
        self.schema_validator_mock.validate.return_value = False
        
        # Call the method under test and verify it raises an exception
        with self.assertRaises(ValueError):
            self.reporter.get_health_report()


if __name__ == '__main__':
    unittest.main()"""
