"""
Updated Schema Validation Test Suite for Phase 5.5 Components.

This module runs validation tests for all Phase 5.5 components
against their respective schemas using the improved test data generator.

This component implements Phase 5.5 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.5
Clauses: 5.5, 5.4, 11.0, 11.1, 5.2.5
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

# Import schema validator and improved test data generator
from schema_validator import SchemaValidator
from test_data_generator import generate_test_data

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SchemaValidationTester:
    """
    Runs validation tests for all Phase 5.5 components.
    
    This component implements Phase 5.5 of the Promethios roadmap.
    Codex Contract: v2025.05.18
    Phase ID: 5.5
    Clauses: 5.5, 5.4, 11.0, 11.1, 5.2.5
    """
    
    def __init__(self, repo_root: str = None):
        """
        Initialize the schema validation tester.
        
        Args:
            repo_root: Root directory of the repository
        """
        # Set repository root
        self.repo_root = repo_root or os.path.dirname(os.path.abspath(__file__))
        
        # Initialize schema validator
        self.validator = SchemaValidator(self.repo_root)
        
        # Generate test data using improved generator
        self.test_data = generate_test_data()
        
        # Initialize results
        self.validation_results = None
        
        logger.info("SchemaValidationTester initialized with improved test data generator")
    
    def run_validation_tests(self) -> Dict[str, Any]:
        """
        Run validation tests for all components.
        
        Returns:
            Validation results object
        """
        logger.info("Running validation tests for all components with improved test data")
        
        # Validate all components
        self.validation_results = self.validator.validate_all_components(self.test_data)
        
        # Generate report
        report = self.validator.generate_validation_report(self.validation_results)
        
        # Save report
        report_path = os.path.join(self.repo_root, "schema_validation_report.md")
        with open(report_path, "w") as f:
            f.write(report)
        
        logger.info("Validation tests complete: %s", 
                   "all passed" if self.validation_results["all_valid"] else "some failed")
        logger.info("Validation report saved to: %s", report_path)
        
        return self.validation_results
    
    def get_validation_summary(self) -> Dict[str, Any]:
        """
        Get a summary of validation results.
        
        Returns:
            Validation summary object
        """
        if not self.validation_results:
            logger.warning("No validation results available")
            return {
                "status": "not_run",
                "message": "Validation tests have not been run",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        
        # Count valid and invalid components
        valid_count = sum(1 for result in self.validation_results["results"].values() if result["valid"])
        invalid_count = len(self.validation_results["results"]) - valid_count
        
        # Get invalid components
        invalid_components = [
            {
                "component": component,
                "schema": result["schema_name"],
                "error": result.get("error", "Unknown error")
            }
            for component, result in self.validation_results["results"].items()
            if not result["valid"]
        ]
        
        return {
            "status": "success" if self.validation_results["all_valid"] else "failure",
            "total_components": len(self.validation_results["results"]),
            "valid_components": valid_count,
            "invalid_components": invalid_count,
            "invalid_details": invalid_components,
            "timestamp": self.validation_results["timestamp"]
        }


if __name__ == "__main__":
    # Run validation tests
    tester = SchemaValidationTester()
    results = tester.run_validation_tests()
    
    # Print summary
    summary = tester.get_validation_summary()
    print(f"\nValidation Status: {summary['status']}")
    print(f"Total Components: {summary['total_components']}")
    print(f"Valid Components: {summary['valid_components']}")
    print(f"Invalid Components: {summary['invalid_components']}")
    
    if summary["invalid_components"] > 0:
        print("\nInvalid Components:")
        for component in summary["invalid_details"]:
            print(f"- {component['component']} (Schema: {component['schema']}): {component['error']}")
    
    print(f"\nValidation report saved to: {os.path.join(tester.repo_root, 'schema_validation_report.md')}")
