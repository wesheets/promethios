"""
Scenario 3: Governance Lifecycle with Trust Verification

This test scenario validates that the governance lifecycle framework works correctly
with trust verification from Phase 2.3 through Phase 6.3.1.
"""

import os
import sys
import time
import unittest
import logging
from typing import Dict, List, Any, Optional

# Import base test case
from base_test_case import EndToEndTestCase
from test_fixtures import TestFixtures

# Configure logger
logger = logging.getLogger(__name__)


class TestGovernanceLifecycleTrustVerification(EndToEndTestCase):
    """Test governance lifecycle with trust verification."""
    
    def setUp(self):
        """Set up test fixtures."""
        super().setUp()
        
        # Import required components
        self.governance_versioning = self.load_component(
            'phase_6_3_1_implementation.governance_lifecycle.governance_versioning',
            'GovernanceVersionRegistry'
        )
        
        self.integration_readiness = self.load_component(
            'phase_6_3_1_implementation.governance_lifecycle.integration_readiness',
            'AssessmentManager'
        )
        
        self.trust_verification_system = self.load_component(
            'phase_6_3_1_implementation.trust_verification_system',
            'TrustVerificationSystem'
        )
        
        self.trust_propagation_manager = self.load_component(
            'phase_6_3_1_implementation.trust_propagation_manager',
            'TrustPropagationManager'
        )
        
        # Create test directory
        self.test_dir = TestFixtures.create_temp_directory()
        
        # Initialize components if they were loaded successfully
        if all([self.governance_versioning, self.integration_readiness, 
                self.trust_verification_system, self.trust_propagation_manager]):
            
            # Initialize trust components
            self.propagation_manager = self.trust_propagation_manager(
                storage_dir=os.path.join(self.test_dir, "trust_propagation")
            )
            
            # Import and initialize trust inheritance handler
            self.trust_inheritance_handler = self.load_component(
                'phase_6_3_1_implementation.trust_inheritance_handler',
                'TrustInheritanceHandler'
            )
            
            if self.trust_inheritance_handler:
                self.inheritance_handler = self.trust_inheritance_handler(
                    propagation_manager=self.propagation_manager,
                    storage_dir=os.path.join(self.test_dir, "trust_inheritance")
                )
                
                # Initialize verification system
                self.verification_system = self.trust_verification_system(
                    propagation_manager=self.propagation_manager,
                    inheritance_handler=self.inheritance_handler,
                    storage_dir=os.path.join(self.test_dir, "trust_verification")
                )
                
                # Initialize governance components
                self.version_registry = self.governance_versioning(
                    storage_dir=os.path.join(self.test_dir, "governance_versioning")
                )
                
                self.assessment_manager = self.integration_readiness(
                    governance_registry=self.version_registry,
                    storage_dir=os.path.join(self.test_dir, "integration_readiness")
                )
                
                # Register with the system under test
                self.system.components.update({
                    'propagation_manager': self.propagation_manager,
                    'inheritance_handler': self.inheritance_handler,
                    'verification_system': self.verification_system,
                    'version_registry': self.version_registry,
                    'assessment_manager': self.assessment_manager
                })
    
    def test_governance_version_with_trust_requirements(self):
        """Test governance versioning with trust requirements."""
        # Skip if components weren't loaded
        if not hasattr(self, 'version_registry'):
            self.skipTest("Required components could not be loaded")
        
        try:
            # Create a governance component with trust requirements
            component = self.version_registry.register_component(
                component_id="trust_component",
                name="Trust Component",
                description="Component with trust requirements",
                metadata={
                    "trust_requirements": {
                        "min_trust_score": 0.7,
                        "required_attributes": ["role", "access_level"]
                    }
                }
            )
            
            # Create a version
            version = self.version_registry.create_component_version(
                component_id="trust_component",
                version_type="MAJOR",
                description="Initial version with trust requirements"
            )
            
            # Create an entity in the trust system
            entity = self.propagation_manager.register_entity(
                entity_id="governance_entity",
                trust_score=0.8,
                attributes={
                    "role": "governance",
                    "access_level": "high",
                    "component_id": "trust_component"
                }
            )
            
            # Create a trust boundary based on component requirements
            boundary = self.propagation_manager.create_trust_boundary(
                boundary_id="component_boundary",
                min_trust_score=component["metadata"]["trust_requirements"]["min_trust_score"],
                required_attributes=component["metadata"]["trust_requirements"]["required_attributes"],
                description=f"Boundary for {component['name']}"
            )
            
            # Verify entity against boundary
            verification_result = self.verification_system.verify_entity_against_boundary(
                entity_id="governance_entity",
                boundary_id="component_boundary"
            )
            
            # Assert with result recording
            self.assert_with_result(
                verification_result.passed,
                "Entity should pass boundary verification",
                {"verification_result": verification_result.__dict__}
            )
            
            # Update version with verification result
            version_data = self.version_registry.get_component_version(
                component_id="trust_component",
                version_str=str(version.version)
            )
            
            version_data.update_validation_result({
                "trust_verification": {
                    "passed": verification_result.passed,
                    "timestamp": time.time(),
                    "details": verification_result.__dict__
                }
            })
            
            self.version_registry.version_manager.update_version(version_data)
            
            # Verify the validation result was saved
            updated_version = self.version_registry.get_component_version(
                component_id="trust_component",
                version_str=str(version.version)
            )
            
            self.assert_with_result(
                "trust_verification" in updated_version.validation_results,
                "Version should have trust verification results",
                {"validation_results": updated_version.validation_results}
            )
            
        except Exception as e:
            logger.error(f"Error in test_governance_version_with_trust_requirements: {e}")
            self.record_result(False, {"error": str(e)})
            raise
    
    def test_readiness_assessment_with_trust_verification(self):
        """Test integration readiness assessment with trust verification."""
        # Skip if components weren't loaded
        if not hasattr(self, 'assessment_manager'):
            self.skipTest("Required components could not be loaded")
        
        try:
            # Create a governance component
            component = self.version_registry.register_component(
                component_id="assessed_component",
                name="Assessed Component",
                description="Component for readiness assessment",
                metadata={
                    "trust_requirements": {
                        "min_trust_score": 0.75,
                        "required_attributes": ["role", "security_level"]
                    }
                }
            )
            
            # Create a version
            version = self.version_registry.create_component_version(
                component_id="assessed_component",
                version_type="MAJOR",
                description="Version for assessment"
            )
            
            # Create an assessment
            assessment = self.assessment_manager.create_assessment(
                component_id="assessed_component",
                target_version=str(version.version),
                description="Assessment with trust verification"
            )
            
            # Start the assessment
            assessment.start_assessment()
            
            # Create entities in the trust system
            entity1 = self.propagation_manager.register_entity(
                entity_id="assessment_entity_1",
                trust_score=0.8,
                attributes={
                    "role": "assessor",
                    "security_level": "high",
                    "component_id": "assessed_component"
                }
            )
            
            entity2 = self.propagation_manager.register_entity(
                entity_id="assessment_entity_2",
                trust_score=0.7,
                attributes={
                    "role": "reviewer",
                    "security_level": "medium",
                    "component_id": "assessed_component"
                }
            )
            
            # Create a trust boundary based on component requirements
            boundary = self.propagation_manager.create_trust_boundary(
                boundary_id="assessment_boundary",
                min_trust_score=component["metadata"]["trust_requirements"]["min_trust_score"],
                required_attributes=component["metadata"]["trust_requirements"]["required_attributes"],
                description=f"Boundary for {component['name']} assessment"
            )
            
            # Verify entities against boundary
            result1 = self.verification_system.verify_entity_against_boundary(
                entity_id="assessment_entity_1",
                boundary_id="assessment_boundary"
            )
            
            result2 = self.verification_system.verify_entity_against_boundary(
                entity_id="assessment_entity_2",
                boundary_id="assessment_boundary"
            )
            
            # Update assessment with verification results
            assessment.update_readiness_criterion(
                criterion="GOVERNANCE_MECHANISMS_IMPLEMENTED",
                result={
                    "passed": result1.passed and result2.passed,
                    "message": "Trust verification completed",
                    "details": {
                        "entity1_result": result1.__dict__,
                        "entity2_result": result2.__dict__
                    }
                }
            )
            
            # Complete assessment phases
            assessment.complete_phase(
                phase="PRE_EVALUATION",
                result={"passed": True, "message": "Pre-evaluation completed"}
            )
            
            assessment.complete_phase(
                phase="PLANNING",
                result={"passed": True, "message": "Planning completed"}
            )
            
            assessment.complete_phase(
                phase="EXECUTION",
                result={"passed": True, "message": "Execution completed"}
            )
            
            # Update all readiness criteria
            for criterion in ["DOCUMENTATION_COMPLETE", "TESTS_PASSING", "PERFORMANCE_ACCEPTABLE",
                             "SECURITY_REQUIREMENTS_MET", "COMPATIBILITY_VERIFIED"]:
                assessment.update_readiness_criterion(
                    criterion=criterion,
                    result={"passed": True, "message": f"{criterion} verified"}
                )
            
            # Complete final phase
            assessment.complete_phase(
                phase="POST_VALIDATION",
                result={"passed": True, "message": "Post-validation completed"}
            )
            
            # Verify assessment status
            self.assert_with_result(
                assessment.status == "completed",
                f"Assessment should be completed, got {assessment.status}",
                {"assessment_status": assessment.status}
            )
            
            # Verify overall readiness
            self.assert_with_result(
                assessment.overall_readiness,
                "Assessment should indicate overall readiness",
                {"overall_readiness": assessment.overall_readiness}
            )
            
        except Exception as e:
            logger.error(f"Error in test_readiness_assessment_with_trust_verification: {e}")
            self.record_result(False, {"error": str(e)})
            raise
    
    def test_version_transition_with_trust_boundaries(self):
        """Test version transitions with trust boundary preservation."""
        # Skip if components weren't loaded
        if not hasattr(self, 'version_registry'):
            self.skipTest("Required components could not be loaded")
        
        try:
            # Create a governance component
            component = self.version_registry.register_component(
                component_id="transition_component",
                name="Transition Component",
                description="Component for version transition testing",
                metadata={
                    "trust_requirements": {
                        "min_trust_score": 0.7,
                        "required_attributes": ["role"]
                    }
                }
            )
            
            # Create initial version
            v1 = self.version_registry.create_component_version(
                component_id="transition_component",
                version_type="MAJOR",
                description="Initial version"
            )
            
            # Create a trust boundary for v1
            boundary_v1 = self.propagation_manager.create_trust_boundary(
                boundary_id="boundary_v1",
                min_trust_score=0.7,
                required_attributes=["role"],
                description=f"Boundary for {component['name']} v1"
            )
            
            # Create an entity that passes the boundary
            entity = self.propagation_manager.register_entity(
                entity_id="transition_entity",
                trust_score=0.75,
                attributes={
                    "role": "transition_tester",
                    "version": "1.0.0"
                }
            )
            
            # Verify entity against v1 boundary
            result_v1 = self.verification_system.verify_entity_against_boundary(
                entity_id="transition_entity",
                boundary_id="boundary_v1"
            )
            
            # Assert entity passes v1 boundary
            self.assert_with_result(
                result_v1.passed,
                "Entity should pass v1 boundary",
                {"result_v1": result_v1.__dict__}
            )
            
            # Approve and activate v1
            v1.update_status("APPROVED")
            self.version_registry.version_manager.update_version(v1)
            
            activated_v1 = self.version_registry.version_manager.activate_version(
                component_id="transition_component",
                version_str=str(v1.version)
            )
            
            # Create a new version with stricter requirements
            v2 = self.version_registry.create_component_version(
                component_id="transition_component",
                version_type="MINOR",
                description="Updated version with stricter requirements",
                metadata={
                    "trust_requirements": {
                        "min_trust_score": 0.8,  # Increased requirement
                        "required_attributes": ["role", "security_clearance"]  # Added requirement
                    }
                }
            )
            
            # Create a trust boundary for v2
            boundary_v2 = self.propagation_manager.create_trust_boundary(
                boundary_id="boundary_v2",
                min_trust_score=0.8,
                required_attributes=["role", "security_clearance"],
                description=f"Boundary for {component['name']} v2"
            )
            
            # Verify entity against v2 boundary (should fail)
            result_v2 = self.verification_system.verify_entity_against_boundary(
                entity_id="transition_entity",
                boundary_id="boundary_v2"
            )
            
            # Assert entity fails v2 boundary
            self.assert_with_result(
                not result_v2.passed,
                "Entity should fail v2 boundary",
                {"result_v2": result_v2.__dict__}
            )
            
            # Update entity to meet v2 requirements
            self.propagation_manager.update_entity(
                entity_id="transition_entity",
                trust_score=0.85,
                attributes={
                    "role": "transition_tester",
                    "security_clearance": "high",
                    "version": "1.1.0"
                }
            )
            
            # Verify updated entity against v2 boundary (should pass)
            result_v2_updated = self.verification_system.verify_entity_against_boundary(
                entity_id="transition_entity",
                boundary_id="boundary_v2"
            )
            
            # Assert updated entity passes v2 boundary
            self.assert_with_result(
                result_v2_updated.passed,
                "Updated entity should pass v2 boundary",
                {"result_v2_updated": result_v2_updated.__dict__}
            )
            
            # Approve and activate v2
            v2.update_status("APPROVED")
            self.version_registry.version_manager.update_version(v2)
            
            activated_v2 = self.version_registry.version_manager.activate_version(
                component_id="transition_component",
                version_str=str(v2.version)
            )
            
            # Verify v1 is now deprecated
            v1_updated = self.version_registry.get_component_version(
                component_id="transition_component",
                version_str=str(v1.version)
            )
            
            self.assert_with_result(
                v1_updated.status == "DEPRECATED",
                f"v1 should be deprecated, got {v1_updated.status}",
                {"v1_status": v1_updated.status}
            )
            
            # Verify v2 is active
            self.assert_with_result(
                activated_v2.status == "ACTIVE",
                f"v2 should be active, got {activated_v2.status}",
                {"v2_status": activated_v2.status}
            )
            
        except Exception as e:
            logger.error(f"Error in test_version_transition_with_trust_boundaries: {e}")
            self.record_result(False, {"error": str(e)})
            raise


if __name__ == "__main__":
    unittest.main()
