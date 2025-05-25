"""
Integration Readiness Assessment for Phase 6.3.1 remediation.

This module implements the Integration Readiness Assessment process as defined
in the Governance Lifecycle Framework. It provides tools for evaluating components
before integration, planning the integration process, and validating the outcome.
"""

import os
import json
import time
import uuid
import logging
from enum import Enum
from typing import Dict, List, Any, Optional, Set, Tuple, Callable

# Import versioning system for component checks
from governance_versioning import GovernanceVersionRegistry, GovernanceVersion, VersionStatus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AssessmentPhase(Enum):
    """Phases of the integration readiness assessment."""
    PRE_EVALUATION = "pre_evaluation"
    PLANNING = "planning"
    EXECUTION = "execution"
    POST_VALIDATION = "post_validation"


class AssessmentStatus(Enum):
    """Status of an integration readiness assessment."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    PENDING_REVIEW = "pending_review"


class ReadinessCriteria(Enum):
    """Readiness criteria for integration."""
    GOVERNANCE_MECHANISMS_IMPLEMENTED = "governance_mechanisms_implemented"
    GOVERNANCE_MECHANISMS_FUNCTIONAL = "governance_mechanisms_functional"
    CONSTITUTIONAL_COMPLIANCE_VERIFIED = "constitutional_compliance_verified"
    NO_GOVERNANCE_COMPROMISE = "no_governance_compromise"
    DOCUMENTATION_COMPLETE = "documentation_complete"
    INTEGRATION_TESTS_PASSED = "integration_tests_passed"
    PERFORMANCE_IMPACT_ASSESSED = "performance_impact_assessed"


class AssessmentResult:
    """Result of an assessment phase or criterion check."""
    
    def __init__(self, passed: bool, message: str = None, details: Dict[str, Any] = None):
        """
        Initialize an assessment result.
        
        Args:
            passed: Whether the assessment passed
            message: Optional summary message
            details: Additional details
        """
        self.passed = passed
        self.message = message or ("Passed" if passed else "Failed")
        self.details = details or {}
        self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the result to a dictionary.
        
        Returns:
            Dictionary representation of the result
        """
        return {
            "passed": self.passed,
            "message": self.message,
            "details": self.details,
            "timestamp": self.timestamp
        }


class IntegrationReadinessAssessment:
    """
    Represents a single integration readiness assessment for a component.
    
    This class manages the state and results of the assessment process.
    """
    
    def __init__(self, 
                 assessment_id: str,
                 component_id: str,
                 target_version: str,
                 governance_registry: GovernanceVersionRegistry,
                 description: str = None,
                 created_by: str = None):
        """
        Initialize an integration readiness assessment.
        
        Args:
            assessment_id: Unique identifier for the assessment
            component_id: Component being assessed
            target_version: Target version of the component for integration
            governance_registry: Instance of GovernanceVersionRegistry
            description: Optional description of the assessment
            created_by: Identifier of the creator
        """
        self.assessment_id = assessment_id
        self.component_id = component_id
        self.target_version = target_version
        self.governance_registry = governance_registry
        self.description = description or f"Assessment for {component_id} v{target_version}"
        self.created_by = created_by
        self.created_at = time.time()
        self.last_updated = self.created_at
        
        self.status = AssessmentStatus.NOT_STARTED
        self.current_phase = AssessmentPhase.PRE_EVALUATION
        self.results = {}
        self.readiness_status = {criterion: None for criterion in ReadinessCriteria}
        self.overall_readiness = False
        self.notes = []
    
    def start_assessment(self) -> None:
        """
        Start the assessment process.
        """
        if self.status != AssessmentStatus.NOT_STARTED:
            logger.warning(f"Assessment {self.assessment_id} already started")
            return
        
        self.status = AssessmentStatus.IN_PROGRESS
        self.current_phase = AssessmentPhase.PRE_EVALUATION
        self.last_updated = time.time()
        self.add_note("Assessment started")
        logger.info(f"Assessment {self.assessment_id} started for {self.component_id} v{self.target_version}")
    
    def complete_phase(self, phase: AssessmentPhase, result: AssessmentResult) -> None:
        """
        Complete a phase of the assessment.
        
        Args:
            phase: The phase being completed
            result: The result of the phase
        """
        if self.status != AssessmentStatus.IN_PROGRESS:
            logger.error(f"Cannot complete phase for assessment {self.assessment_id} with status {self.status.value}")
            return
        
        if phase != self.current_phase:
            logger.warning(f"Completing phase {phase.value} out of order (current: {self.current_phase.value})")
        
        self.results[phase.value] = result.to_dict()
        self.last_updated = time.time()
        self.add_note(f"Phase {phase.value} completed: {result.message}")
        
        if not result.passed:
            self.status = AssessmentStatus.FAILED
            self.add_note(f"Assessment failed during phase {phase.value}")
            logger.error(f"Assessment {self.assessment_id} failed during phase {phase.value}")
            return
        
        # Move to the next phase
        next_phase = self._get_next_phase(phase)
        if next_phase:
            self.current_phase = next_phase
            logger.info(f"Assessment {self.assessment_id} moved to phase {next_phase.value}")
        else:
            # All phases completed, evaluate overall readiness
            self.evaluate_overall_readiness()
            if self.overall_readiness:
                self.status = AssessmentStatus.COMPLETED
                self.add_note("Assessment completed successfully")
                logger.info(f"Assessment {self.assessment_id} completed successfully")
            else:
                self.status = AssessmentStatus.PENDING_REVIEW
                self.add_note("Assessment completed, pending review due to unmet criteria")
                logger.warning(f"Assessment {self.assessment_id} completed, pending review")
    
    def _get_next_phase(self, current_phase: AssessmentPhase) -> Optional[AssessmentPhase]:
        """
        Get the next phase in the assessment process.
        
        Args:
            current_phase: The current phase
            
        Returns:
            Next AssessmentPhase or None if it's the last phase
        """
        phases = list(AssessmentPhase)
        try:
            current_index = phases.index(current_phase)
            if current_index < len(phases) - 1:
                return phases[current_index + 1]
            else:
                return None
        except ValueError:
            return None
    
    def update_readiness_criterion(self, criterion: ReadinessCriteria, 
                                  result: AssessmentResult) -> None:
        """
        Update the status of a specific readiness criterion.
        
        Args:
            criterion: The readiness criterion being updated
            result: The result of the criterion check
        """
        self.readiness_status[criterion] = result.to_dict()
        self.last_updated = time.time()
        self.add_note(f"Criterion {criterion.value} updated: {result.message}")
        
        # Re-evaluate overall readiness if assessment is complete
        if self.status in [AssessmentStatus.COMPLETED, AssessmentStatus.PENDING_REVIEW]:
            self.evaluate_overall_readiness()
    
    def evaluate_overall_readiness(self) -> bool:
        """
        Evaluate the overall readiness based on criteria.
        
        Returns:
            True if all mandatory criteria are met, False otherwise
        """
        all_passed = True
        missing_criteria = []
        
        for criterion, result_dict in self.readiness_status.items():
            if result_dict is None:
                all_passed = False
                missing_criteria.append(criterion.value)
                continue
            
            result = AssessmentResult(
                passed=result_dict["passed"],
                message=result_dict["message"],
                details=result_dict["details"]
            )
            
            if not result.passed:
                all_passed = False
        
        if missing_criteria:
            self.add_note(f"Overall readiness cannot be determined: Missing criteria {missing_criteria}")
            self.overall_readiness = False
        else:
            self.overall_readiness = all_passed
            self.add_note(f"Overall readiness evaluated: {'Passed' if all_passed else 'Failed'}")
        
        return self.overall_readiness
    
    def add_note(self, note: str) -> None:
        """
        Add a note to the assessment log.
        
        Args:
            note: The note to add
        """
        entry = {
            "timestamp": time.time(),
            "note": note
        }
        self.notes.append(entry)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the assessment to a dictionary.
        
        Returns:
            Dictionary representation of the assessment
        """
        return {
            "assessment_id": self.assessment_id,
            "component_id": self.component_id,
            "target_version": self.target_version,
            "description": self.description,
            "created_by": self.created_by,
            "created_at": self.created_at,
            "last_updated": self.last_updated,
            "status": self.status.value,
            "current_phase": self.current_phase.value,
            "results": self.results,
            "readiness_status": {k.value: v for k, v in self.readiness_status.items()},
            "overall_readiness": self.overall_readiness,
            "notes": self.notes
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any], 
                  governance_registry: GovernanceVersionRegistry) -> Optional["IntegrationReadinessAssessment"]:
        """
        Create an assessment from a dictionary.
        
        Args:
            data: Dictionary representation of an assessment
            governance_registry: Instance of GovernanceVersionRegistry
            
        Returns:
            IntegrationReadinessAssessment instance or None if error
        """
        try:
            assessment = cls(
                assessment_id=data["assessment_id"],
                component_id=data["component_id"],
                target_version=data["target_version"],
                governance_registry=governance_registry,
                description=data.get("description"),
                created_by=data.get("created_by")
            )
            
            # Restore state
            assessment.created_at = data.get("created_at", time.time())
            assessment.last_updated = data.get("last_updated", assessment.created_at)
            assessment.status = AssessmentStatus(data["status"])
            assessment.current_phase = AssessmentPhase(data["current_phase"])
            assessment.results = data.get("results", {})
            assessment.overall_readiness = data.get("overall_readiness", False)
            assessment.notes = data.get("notes", [])
            
            # Restore readiness status
            readiness_data = data.get("readiness_status", {})
            for criterion_str, result_dict in readiness_data.items():
                try:
                    criterion = ReadinessCriteria(criterion_str)
                    if result_dict:
                        assessment.readiness_status[criterion] = result_dict
                except ValueError:
                    logger.warning(f"Unknown readiness criterion found in data: {criterion_str}")
            
            return assessment
        except Exception as e:
            logger.error(f"Error creating assessment from dict: {str(e)}", exc_info=True)
            return None


class AssessmentManager:
    """
    Manages integration readiness assessments.
    
    This class provides functionality for creating, storing, retrieving,
    and managing assessments.
    """
    
    def __init__(self, governance_registry: GovernanceVersionRegistry, 
                 storage_dir: str = None):
        """
        Initialize the assessment manager.
        
        Args:
            governance_registry: Instance of GovernanceVersionRegistry
            storage_dir: Directory for storing assessment data
        """
        self.governance_registry = governance_registry
        self.storage_dir = storage_dir or os.path.join(os.getcwd(), "integration_assessments")
        self.logger = logging.getLogger(__name__)
        
        # Create storage directory
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Cache of loaded assessments
        self._assessment_cache = {}
    
    def create_assessment(self, component_id: str, target_version: str, 
                          description: str = None, created_by: str = None) -> Optional[IntegrationReadinessAssessment]:
        """
        Create a new integration readiness assessment.
        
        Args:
            component_id: Component being assessed
            target_version: Target version for integration
            description: Optional description
            created_by: Identifier of the creator
            
        Returns:
            Newly created IntegrationReadinessAssessment or None if error
        """
        # Check if component and version exist
        component = self.governance_registry.get_component(component_id)
        if not component:
            self.logger.error(f"Component {component_id} not registered")
            return None
        
        version = self.governance_registry.version_manager.get_version(component_id, target_version)
        if not version:
            self.logger.error(f"Version {target_version} not found for component {component_id}")
            return None
        
        # Create assessment
        assessment_id = str(uuid.uuid4())
        assessment = IntegrationReadinessAssessment(
            assessment_id=assessment_id,
            component_id=component_id,
            target_version=target_version,
            governance_registry=self.governance_registry,
            description=description,
            created_by=created_by
        )
        
        # Save and cache
        if self._save_assessment(assessment):
            self._assessment_cache[assessment_id] = assessment
            return assessment
        else:
            return None
    
    def get_assessment(self, assessment_id: str) -> Optional[IntegrationReadinessAssessment]:
        """
        Get a specific assessment by ID.
        
        Args:
            assessment_id: Unique identifier for the assessment
            
        Returns:
            IntegrationReadinessAssessment if found, None otherwise
        """
        # Check cache first
        if assessment_id in self._assessment_cache:
            return self._assessment_cache[assessment_id]
        
        # Load from storage
        assessment_file = os.path.join(self.storage_dir, f"{assessment_id}.json")
        if not os.path.exists(assessment_file):
            return None
        
        try:
            with open(assessment_file, 'r') as f:
                data = json.load(f)
                assessment = IntegrationReadinessAssessment.from_dict(data, self.governance_registry)
                if assessment:
                    self._assessment_cache[assessment_id] = assessment
                return assessment
        except Exception as e:
            self.logger.error(f"Error loading assessment {assessment_id}: {str(e)}")
            return None
    
    def update_assessment(self, assessment: IntegrationReadinessAssessment) -> bool:
        """
        Update an assessment in storage.
        
        Args:
            assessment: Assessment object to update
            
        Returns:
            True if successful, False otherwise
        """
        assessment.last_updated = time.time()
        return self._save_assessment(assessment)
    
    def get_assessments_for_component(self, component_id: str) -> List[IntegrationReadinessAssessment]:
        """
        Get all assessments for a specific component.
        
        Args:
            component_id: Component identifier
            
        Returns:
            List of assessments for the component
        """
        assessments = []
        for filename in os.listdir(self.storage_dir):
            if not filename.endswith(".json"):
                continue
            
            assessment_id = filename[:-5]
            assessment = self.get_assessment(assessment_id)
            if assessment and assessment.component_id == component_id:
                assessments.append(assessment)
        
        # Sort by creation date (newest first)
        assessments.sort(key=lambda a: a.created_at, reverse=True)
        return assessments
    
    def get_assessments_by_status(self, status: AssessmentStatus) -> List[IntegrationReadinessAssessment]:
        """
        Get all assessments with a specific status.
        
        Args:
            status: AssessmentStatus to filter by
            
        Returns:
            List of assessments with the specified status
        """
        assessments = []
        for filename in os.listdir(self.storage_dir):
            if not filename.endswith(".json"):
                continue
            
            assessment_id = filename[:-5]
            assessment = self.get_assessment(assessment_id)
            if assessment and assessment.status == status:
                assessments.append(assessment)
        
        # Sort by creation date (newest first)
        assessments.sort(key=lambda a: a.created_at, reverse=True)
        return assessments
    
    def _save_assessment(self, assessment: IntegrationReadinessAssessment) -> bool:
        """
        Save an assessment to storage.
        
        Args:
            assessment: Assessment object to save
            
        Returns:
            True if successful, False otherwise
        """
        assessment_file = os.path.join(self.storage_dir, f"{assessment.assessment_id}.json")
        try:
            with open(assessment_file, 'w') as f:
                json.dump(assessment.to_dict(), f, indent=2)
            return True
        except Exception as e:
            self.logger.error(f"Error saving assessment {assessment.assessment_id}: {str(e)}")
            return False


# Example usage
if __name__ == "__main__":
    # Create registry and assessment manager
    registry = GovernanceVersionRegistry()
    assessment_manager = AssessmentManager(registry)
    
    # Register component and create version
    registry.register_component("new_feature_x", "New Feature X")
    version = registry.create_component_version("new_feature_x", VersionType.MINOR)
    
    # Create assessment
    assessment = assessment_manager.create_assessment(
        component_id="new_feature_x",
        target_version=str(version.version),
        created_by="developer_a"
    )
    
    if assessment:
        # Start assessment
        assessment.start_assessment()
        
        # Complete pre-evaluation phase
        pre_eval_result = AssessmentResult(passed=True, message="Pre-evaluation passed")
        assessment.complete_phase(AssessmentPhase.PRE_EVALUATION, pre_eval_result)
        
        # Update readiness criteria
        assessment.update_readiness_criterion(
            ReadinessCriteria.GOVERNANCE_MECHANISMS_IMPLEMENTED,
            AssessmentResult(passed=True)
        )
        assessment.update_readiness_criterion(
            ReadinessCriteria.DOCUMENTATION_COMPLETE,
            AssessmentResult(passed=False, message="Documentation needs review")
        )
        
        # Complete planning phase
        planning_result = AssessmentResult(passed=True, message="Planning complete")
        assessment.complete_phase(AssessmentPhase.PLANNING, planning_result)
        
        # ... complete other phases and criteria ...
        
        # Save the updated assessment
        assessment_manager.update_assessment(assessment)
        
        # Retrieve and print assessment
        retrieved_assessment = assessment_manager.get_assessment(assessment.assessment_id)
        if retrieved_assessment:
            print(json.dumps(retrieved_assessment.to_dict(), indent=2))
