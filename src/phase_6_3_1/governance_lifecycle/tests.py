"""
Tests for the Governance Lifecycle Framework implementation.

This module contains comprehensive tests for all components of the
Governance Lifecycle Framework: versioning, integration readiness,
and continuous improvement cycles.
"""

import os
import json
import time
import unittest
import tempfile
import shutil
from typing import Dict, List, Any, Optional

# Import the modules to test
from governance_versioning import (
    GovernanceVersionRegistry, GovernanceVersion, VersionManager,
    VersionType, VersionStatus, ValidationLevel, CompatibilityType
)
from integration_readiness import (
    IntegrationReadinessAssessment, AssessmentManager, AssessmentPhase,
    AssessmentStatus, ReadinessCriteria, AssessmentResult
)
from continuous_improvement import (
    ImprovementProposal, ImprovementCycle, ContinuousImprovementManager,
    ImprovementCycleType, ImprovementProposalStatus, ImprovementSource
)


class TestGovernanceVersioning(unittest.TestCase):
    """Tests for the governance versioning system."""
    
    def setUp(self):
        """Set up test environment."""
        # Create temporary directory for test data
        self.test_dir = tempfile.mkdtemp()
        
        # Initialize version registry
        self.registry = GovernanceVersionRegistry(storage_dir=self.test_dir)
    
    def tearDown(self):
        """Clean up test environment."""
        # Remove temporary directory
        shutil.rmtree(self.test_dir)
    
    def test_component_registration(self):
        """Test component registration."""
        # Register a component
        component = self.registry.register_component(
            component_id="test_component",
            name="Test Component",
            description="A test component"
        )
        
        # Verify component was registered
        self.assertIsNotNone(component)
        self.assertEqual(component["component_id"], "test_component")
        self.assertEqual(component["name"], "Test Component")
        
        # Verify component can be retrieved
        retrieved = self.registry.get_component("test_component")
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved["name"], "Test Component")
    
    def test_version_creation(self):
        """Test version creation."""
        # Register a component
        self.registry.register_component(
            component_id="test_component",
            name="Test Component"
        )
        
        # Create a version
        version = self.registry.create_component_version(
            component_id="test_component",
            version_type=VersionType.MAJOR,
            description="Initial version"
        )
        
        # Verify version was created
        self.assertIsNotNone(version)
        self.assertEqual(str(version.version), "1.0.0")
        self.assertEqual(version.status, VersionStatus.DRAFT)
        
        # Create another version
        version2 = self.registry.create_component_version(
            component_id="test_component",
            version_type=VersionType.MINOR
        )
        
        # Verify version was created with correct number
        self.assertIsNotNone(version2)
        self.assertEqual(str(version2.version), "1.1.0")
    
    def test_version_activation(self):
        """Test version activation."""
        # Register a component
        self.registry.register_component(
            component_id="test_component",
            name="Test Component"
        )
        
        # Create a version
        version = self.registry.create_component_version(
            component_id="test_component",
            version_type=VersionType.MAJOR
        )
        
        # Update status to APPROVED
        version.update_status(VersionStatus.APPROVED)
        self.registry.version_manager.update_version(version)
        
        # Activate the version
        activated = self.registry.version_manager.activate_version(
            component_id="test_component",
            version_str=str(version.version)
        )
        
        # Verify version was activated
        self.assertIsNotNone(activated)
        self.assertEqual(activated.status, VersionStatus.ACTIVE)
        
        # Verify active version can be retrieved
        active = self.registry.version_manager.get_active_version("test_component")
        self.assertIsNotNone(active)
        self.assertEqual(str(active.version), str(version.version))
    
    def test_version_compatibility(self):
        """Test version compatibility tracking."""
        # Register a component
        self.registry.register_component(
            component_id="test_component",
            name="Test Component"
        )
        
        # Create two versions
        v1 = self.registry.create_component_version(
            component_id="test_component",
            version_type=VersionType.MAJOR
        )
        
        v2 = self.registry.create_component_version(
            component_id="test_component",
            version_type=VersionType.MINOR
        )
        
        # Set compatibility
        v1.set_compatibility(
            other_version=str(v2.version),
            compatibility_type=CompatibilityType.BACKWARD,
            details={"notes": "Compatible with minor changes"}
        )
        self.registry.version_manager.update_version(v1)
        
        # Verify compatibility info
        compat = self.registry.version_manager.get_compatibility_info(
            component_id="test_component",
            version1=str(v1.version),
            version2=str(v2.version)
        )
        
        self.assertIsNotNone(compat)
        self.assertEqual(compat["type"], CompatibilityType.BACKWARD.value)
    
    def test_version_report(self):
        """Test version reporting."""
        # Register a component
        self.registry.register_component(
            component_id="test_component",
            name="Test Component"
        )
        
        # Create versions
        v1 = self.registry.create_component_version(
            component_id="test_component",
            version_type=VersionType.MAJOR
        )
        
        v2 = self.registry.create_component_version(
            component_id="test_component",
            version_type=VersionType.MINOR
        )
        
        # Activate v1
        v1.update_status(VersionStatus.APPROVED)
        self.registry.version_manager.update_version(v1)
        self.registry.version_manager.activate_version(
            component_id="test_component",
            version_str=str(v1.version)
        )
        
        # Generate report
        report = self.registry.get_system_version_report()
        
        # Verify report
        self.assertIsNotNone(report)
        self.assertEqual(report["total_components"], 1)
        self.assertEqual(report["active_versions"]["test_component"], "1.0.0")
        self.assertEqual(report["version_summary"]["total"], 2)
        self.assertEqual(report["version_summary"]["active"], 1)
        self.assertEqual(report["version_summary"]["draft"], 1)


class TestIntegrationReadiness(unittest.TestCase):
    """Tests for the integration readiness assessment."""
    
    def setUp(self):
        """Set up test environment."""
        # Create temporary directory for test data
        self.test_dir = tempfile.mkdtemp()
        
        # Initialize version registry and assessment manager
        self.registry = GovernanceVersionRegistry(
            storage_dir=os.path.join(self.test_dir, "registry")
        )
        self.assessment_manager = AssessmentManager(
            governance_registry=self.registry,
            storage_dir=os.path.join(self.test_dir, "assessments")
        )
        
        # Register a component and create a version
        self.registry.register_component(
            component_id="test_component",
            name="Test Component"
        )
        self.version = self.registry.create_component_version(
            component_id="test_component",
            version_type=VersionType.MAJOR
        )
    
    def tearDown(self):
        """Clean up test environment."""
        # Remove temporary directory
        shutil.rmtree(self.test_dir)
    
    def test_assessment_creation(self):
        """Test assessment creation."""
        # Create an assessment
        assessment = self.assessment_manager.create_assessment(
            component_id="test_component",
            target_version=str(self.version.version),
            description="Test assessment"
        )
        
        # Verify assessment was created
        self.assertIsNotNone(assessment)
        self.assertEqual(assessment.component_id, "test_component")
        self.assertEqual(assessment.target_version, str(self.version.version))
        self.assertEqual(assessment.status, AssessmentStatus.NOT_STARTED)
    
    def test_assessment_workflow(self):
        """Test assessment workflow."""
        # Create an assessment
        assessment = self.assessment_manager.create_assessment(
            component_id="test_component",
            target_version=str(self.version.version)
        )
        
        # Start assessment
        assessment.start_assessment()
        self.assertEqual(assessment.status, AssessmentStatus.IN_PROGRESS)
        
        # Complete pre-evaluation phase
        assessment.complete_phase(
            phase=AssessmentPhase.PRE_EVALUATION,
            result=AssessmentResult(passed=True, message="Pre-evaluation passed")
        )
        
        # Verify phase was completed
        self.assertEqual(assessment.current_phase, AssessmentPhase.PLANNING)
        self.assertTrue(assessment.results[AssessmentPhase.PRE_EVALUATION.value]["passed"])
        
        # Update readiness criteria
        assessment.update_readiness_criterion(
            criterion=ReadinessCriteria.GOVERNANCE_MECHANISMS_IMPLEMENTED,
            result=AssessmentResult(passed=True)
        )
        
        assessment.update_readiness_criterion(
            criterion=ReadinessCriteria.DOCUMENTATION_COMPLETE,
            result=AssessmentResult(passed=True)
        )
        
        # Complete remaining phases
        assessment.complete_phase(
            phase=AssessmentPhase.PLANNING,
            result=AssessmentResult(passed=True)
        )
        
        assessment.complete_phase(
            phase=AssessmentPhase.EXECUTION,
            result=AssessmentResult(passed=True)
        )
        
        # Update more criteria
        for criterion in ReadinessCriteria:
            if criterion not in [
                ReadinessCriteria.GOVERNANCE_MECHANISMS_IMPLEMENTED,
                ReadinessCriteria.DOCUMENTATION_COMPLETE
            ]:
                assessment.update_readiness_criterion(
                    criterion=criterion,
                    result=AssessmentResult(passed=True)
                )
        
        # Complete final phase
        assessment.complete_phase(
            phase=AssessmentPhase.POST_VALIDATION,
            result=AssessmentResult(passed=True)
        )
        
        # Verify assessment is completed
        self.assertEqual(assessment.status, AssessmentStatus.COMPLETED)
        self.assertTrue(assessment.overall_readiness)
    
    def test_assessment_retrieval(self):
        """Test assessment retrieval."""
        # Create an assessment
        assessment = self.assessment_manager.create_assessment(
            component_id="test_component",
            target_version=str(self.version.version)
        )
        
        # Save assessment ID
        assessment_id = assessment.assessment_id
        
        # Retrieve assessment
        retrieved = self.assessment_manager.get_assessment(assessment_id)
        
        # Verify assessment was retrieved
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.assessment_id, assessment_id)
        self.assertEqual(retrieved.component_id, "test_component")
    
    def test_failed_assessment(self):
        """Test failed assessment."""
        # Create an assessment
        assessment = self.assessment_manager.create_assessment(
            component_id="test_component",
            target_version=str(self.version.version)
        )
        
        # Start assessment
        assessment.start_assessment()
        
        # Fail pre-evaluation phase
        assessment.complete_phase(
            phase=AssessmentPhase.PRE_EVALUATION,
            result=AssessmentResult(passed=False, message="Pre-evaluation failed")
        )
        
        # Verify assessment failed
        self.assertEqual(assessment.status, AssessmentStatus.FAILED)


class TestContinuousImprovement(unittest.TestCase):
    """Tests for the continuous improvement cycles."""
    
    def setUp(self):
        """Set up test environment."""
        # Create temporary directory for test data
        self.test_dir = tempfile.mkdtemp()
        
        # Initialize version registry and improvement manager
        self.registry = GovernanceVersionRegistry(
            storage_dir=os.path.join(self.test_dir, "registry")
        )
        self.improvement_manager = ContinuousImprovementManager(
            governance_registry=self.registry,
            storage_dir=os.path.join(self.test_dir, "improvements")
        )
    
    def tearDown(self):
        """Clean up test environment."""
        # Remove temporary directory
        shutil.rmtree(self.test_dir)
    
    def test_proposal_creation(self):
        """Test proposal creation."""
        # Create a proposal
        proposal = self.improvement_manager.create_proposal(
            title="Test Proposal",
            description="A test proposal",
            source=ImprovementSource.MONITORING
        )
        
        # Verify proposal was created
        self.assertIsNotNone(proposal)
        self.assertEqual(proposal.title, "Test Proposal")
        self.assertEqual(proposal.status, ImprovementProposalStatus.IDENTIFIED)
    
    def test_proposal_workflow(self):
        """Test proposal workflow."""
        # Create a proposal
        proposal = self.improvement_manager.create_proposal(
            title="Test Proposal",
            description="A test proposal",
            source=ImprovementSource.MONITORING
        )
        
        # Update status
        proposal.update_status(
            new_status=ImprovementProposalStatus.PRIORITIZED,
            reason="High priority"
        )
        
        # Set priority
        proposal.set_priority(1)
        
        # Set implementation plan
        proposal.set_implementation_plan({
            "steps": ["Step 1", "Step 2"],
            "timeline": "2 weeks"
        })
        
        # Update status again
        proposal.update_status(
            new_status=ImprovementProposalStatus.PLANNED,
            reason="Ready for implementation"
        )
        
        # Save proposal
        self.improvement_manager.update_proposal(proposal)
        
        # Retrieve proposal
        retrieved = self.improvement_manager.get_proposal(proposal.proposal_id)
        
        # Verify proposal was updated
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.status, ImprovementProposalStatus.PLANNED)
        self.assertEqual(retrieved.priority, 1)
        self.assertEqual(len(retrieved.implementation_plan["steps"]), 2)
    
    def test_cycle_creation(self):
        """Test cycle creation."""
        # Create a cycle
        now = time.time()
        cycle = self.improvement_manager.create_cycle(
            cycle_type=ImprovementCycleType.MINOR,
            start_date=now,
            end_date=now + 30 * 24 * 60 * 60  # 30 days
        )
        
        # Verify cycle was created
        self.assertIsNotNone(cycle)
        self.assertEqual(cycle.cycle_type, ImprovementCycleType.MINOR)
        self.assertEqual(cycle.status, "planned")
    
    def test_proposal_cycle_assignment(self):
        """Test assigning proposals to cycles."""
        # Create a proposal
        proposal = self.improvement_manager.create_proposal(
            title="Test Proposal",
            description="A test proposal",
            source=ImprovementSource.MONITORING
        )
        
        # Create a cycle
        now = time.time()
        cycle = self.improvement_manager.create_cycle(
            cycle_type=ImprovementCycleType.MINOR,
            start_date=now,
            end_date=now + 30 * 24 * 60 * 60  # 30 days
        )
        
        # Assign proposal to cycle
        result = self.improvement_manager.assign_proposal_to_cycle(
            proposal_id=proposal.proposal_id,
            cycle_id=cycle.cycle_id
        )
        
        # Verify assignment
        self.assertTrue(result)
        
        # Retrieve cycle
        retrieved_cycle = self.improvement_manager.get_cycle(cycle.cycle_id)
        
        # Verify proposal was added to cycle
        self.assertIsNotNone(retrieved_cycle)
        self.assertIn(proposal.proposal_id, retrieved_cycle.proposals)
    
    def test_cycle_workflow(self):
        """Test cycle workflow."""
        # Create a cycle
        now = time.time()
        cycle = self.improvement_manager.create_cycle(
            cycle_type=ImprovementCycleType.MINOR,
            start_date=now,
            end_date=now + 30 * 24 * 60 * 60  # 30 days
        )
        
        # Start cycle
        cycle.start_cycle()
        self.improvement_manager.update_cycle(cycle)
        
        # Verify cycle was started
        self.assertEqual(cycle.status, "active")
        
        # Complete cycle
        cycle.complete_cycle({
            "proposals_completed": 0,
            "proposals_deferred": 0,
            "summary": "Test cycle completed"
        })
        self.improvement_manager.update_cycle(cycle)
        
        # Verify cycle was completed
        self.assertEqual(cycle.status, "completed")
        
        # Retrieve active cycles
        active_cycles = self.improvement_manager.get_active_cycles()
        
        # Verify no active cycles
        self.assertEqual(len(active_cycles), 0)


class TestIntegrationTests(unittest.TestCase):
    """Integration tests for the Governance Lifecycle Framework."""
    
    def setUp(self):
        """Set up test environment."""
        # Create temporary directory for test data
        self.test_dir = tempfile.mkdtemp()
        
        # Initialize all managers
        self.registry = GovernanceVersionRegistry(
            storage_dir=os.path.join(self.test_dir, "registry")
        )
        self.assessment_manager = AssessmentManager(
            governance_registry=self.registry,
            storage_dir=os.path.join(self.test_dir, "assessments")
        )
        self.improvement_manager = ContinuousImprovementManager(
            governance_registry=self.registry,
            storage_dir=os.path.join(self.test_dir, "improvements")
        )
    
    def tearDown(self):
        """Clean up test environment."""
        # Remove temporary directory
        shutil.rmtree(self.test_dir)
    
    def test_end_to_end_workflow(self):
        """Test end-to-end governance lifecycle workflow."""
        # 1. Register a component
        component = self.registry.register_component(
            component_id="test_component",
            name="Test Component",
            description="A test component for governance lifecycle"
        )
        self.assertIsNotNone(component)
        
        # 2. Create initial version
        v1 = self.registry.create_component_version(
            component_id="test_component",
            version_type=VersionType.MAJOR,
            description="Initial version"
        )
        self.assertIsNotNone(v1)
        
        # 3. Approve and activate version
        v1.update_status(VersionStatus.APPROVED)
        self.registry.version_manager.update_version(v1)
        
        activated = self.registry.version_manager.activate_version(
            component_id="test_component",
            version_str=str(v1.version)
        )
        self.assertIsNotNone(activated)
        self.assertEqual(activated.status, VersionStatus.ACTIVE)
        
        # 4. Create improvement proposal
        proposal = self.improvement_manager.create_proposal(
            title="Enhance Component",
            description="Add new features to the component",
            source=ImprovementSource.STAKEHOLDER_FEEDBACK,
            component_id="test_component"
        )
        self.assertIsNotNone(proposal)
        
        # 5. Prioritize and plan proposal
        proposal.update_status(ImprovementProposalStatus.PRIORITIZED)
        proposal.set_priority(1)
        proposal.set_implementation_plan({
            "steps": ["Design", "Implement", "Test"],
            "timeline": "2 weeks"
        })
        proposal.update_status(ImprovementProposalStatus.PLANNED)
        self.improvement_manager.update_proposal(proposal)
        
        # 6. Create improvement cycle
        now = time.time()
        cycle = self.improvement_manager.create_cycle(
            cycle_type=ImprovementCycleType.MINOR,
            start_date=now,
            end_date=now + 30 * 24 * 60 * 60  # 30 days
        )
        self.assertIsNotNone(cycle)
        
        # 7. Assign proposal to cycle
        result = self.improvement_manager.assign_proposal_to_cycle(
            proposal_id=proposal.proposal_id,
            cycle_id=cycle.cycle_id
        )
        self.assertTrue(result)
        
        # 8. Start cycle
        cycle.start_cycle()
        self.improvement_manager.update_cycle(cycle)
        
        # 9. Implement proposal (simulate)
        proposal.update_status(ImprovementProposalStatus.IMPLEMENTING)
        self.improvement_manager.update_proposal(proposal)
        
        # 10. Create new version based on proposal
        v2 = self.registry.create_component_version(
            component_id="test_component",
            version_type=VersionType.MINOR,
            description="Enhanced version with new features"
        )
        self.assertIsNotNone(v2)
        
        # 11. Create assessment for new version
        assessment = self.assessment_manager.create_assessment(
            component_id="test_component",
            target_version=str(v2.version),
            description="Assessment for enhanced version"
        )
        self.assertIsNotNone(assessment)
        
        # 12. Complete assessment
        assessment.start_assessment()
        
        # First update all readiness criteria to ensure they're all passed
        for criterion in ReadinessCriteria:
            assessment.update_readiness_criterion(
                criterion=criterion,
                result=AssessmentResult(passed=True)
            )
        
        # Then complete all phases
        for phase in AssessmentPhase:
            assessment.complete_phase(
                phase=phase,
                result=AssessmentResult(passed=True)
            )
            
            # If we're not at the last phase, the status should still be IN_PROGRESS
            if phase != AssessmentPhase.POST_VALIDATION:
                self.assertEqual(assessment.status, AssessmentStatus.IN_PROGRESS)
        
        # Verify assessment is completed
        self.assertEqual(assessment.status, AssessmentStatus.COMPLETED)
        self.assertTrue(assessment.overall_readiness)
        
        # 13. Approve and activate new version
        v2.update_status(VersionStatus.APPROVED)
        self.registry.version_manager.update_version(v2)
        
        activated = self.registry.version_manager.activate_version(
            component_id="test_component",
            version_str=str(v2.version)
        )
        self.assertIsNotNone(activated)
        self.assertEqual(activated.status, VersionStatus.ACTIVE)
        
        # 14. Complete proposal
        proposal.update_status(ImprovementProposalStatus.COMPLETED)
        self.improvement_manager.update_proposal(proposal)
        
        # 15. Complete cycle
        cycle.complete_cycle({
            "proposals_completed": 1,
            "proposals_deferred": 0,
            "summary": "Successfully implemented component enhancements"
        })
        self.improvement_manager.update_cycle(cycle)
        
        # 16. Verify system state
        # Check active version
        active = self.registry.version_manager.get_active_version("test_component")
        self.assertIsNotNone(active)
        self.assertEqual(str(active.version), str(v2.version))
        
        # Check previous version status
        v1_updated = self.registry.version_manager.get_version(
            component_id="test_component",
            version_str=str(v1.version)
        )
        self.assertIsNotNone(v1_updated)
        self.assertEqual(v1_updated.status, VersionStatus.DEPRECATED)
        
        # Check cycle status
        cycle_updated = self.improvement_manager.get_cycle(cycle.cycle_id)
        self.assertIsNotNone(cycle_updated)
        self.assertEqual(cycle_updated.status, "completed")
        
        # Generate system report
        report = self.registry.get_system_version_report()
        self.assertIsNotNone(report)
        self.assertEqual(report["active_versions"]["test_component"], str(v2.version))


if __name__ == "__main__":
    unittest.main()
