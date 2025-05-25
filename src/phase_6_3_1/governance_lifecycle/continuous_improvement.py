"""
Continuous Improvement Cycles for Phase 6.3.1 remediation.

This module implements the Continuous Improvement Cycles process as defined
in the Governance Lifecycle Framework. It provides tools for identifying,
prioritizing, planning, implementing, and validating governance improvements.
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


class ImprovementCycleType(Enum):
    """Types of continuous improvement cycles."""
    MINOR = "minor"           # Monthly reviews, targeted improvements
    MAJOR = "major"           # Quarterly reviews, significant enhancements
    CONSTITUTIONAL = "constitutional" # Annual reviews, foundational assessments


class ImprovementProposalStatus(Enum):
    """Status of an improvement proposal."""
    IDENTIFIED = "identified"
    PRIORITIZED = "prioritized"
    PLANNED = "planned"
    IMPLEMENTING = "implementing"
    VALIDATING = "validating"
    COMPLETED = "completed"
    REJECTED = "rejected"
    DEFERRED = "deferred"


class ImprovementSource(Enum):
    """Source of an improvement opportunity."""
    MONITORING = "monitoring"
    VALIDATION = "validation"
    STAKEHOLDER_FEEDBACK = "stakeholder_feedback"
    GOVERNANCE_GAP = "governance_gap"
    INTERNAL_REVIEW = "internal_review"


class ImprovementProposal:
    """
    Represents a single proposal for governance improvement.
    """
    
    def __init__(self, 
                 proposal_id: str,
                 title: str,
                 description: str,
                 source: ImprovementSource,
                 component_id: Optional[str] = None,
                 target_version: Optional[str] = None,
                 created_by: str = None,
                 metadata: Dict[str, Any] = None):
        """
        Initialize an improvement proposal.
        
        Args:
            proposal_id: Unique identifier for the proposal
            title: Short title for the proposal
            description: Detailed description of the proposed improvement
            source: Source of the improvement opportunity
            component_id: Optional target component ID
            target_version: Optional target version for the improvement
            created_by: Identifier of the creator
            metadata: Additional metadata
        """
        self.proposal_id = proposal_id
        self.title = title
        self.description = description
        self.source = source
        self.component_id = component_id
        self.target_version = target_version
        self.created_by = created_by
        self.created_at = time.time()
        self.last_updated = self.created_at
        self.metadata = metadata or {}
        
        self.status = ImprovementProposalStatus.IDENTIFIED
        self.priority = 0  # Lower number means higher priority
        self.estimated_effort = 0 # e.g., in person-days or story points
        self.impact_assessment = {}
        self.implementation_plan = {}
        self.validation_plan = {}
        self.validation_results = []
        self.notes = []
    
    def update_status(self, new_status: ImprovementProposalStatus, reason: str = None) -> None:
        """
        Update the status of the proposal.
        
        Args:
            new_status: New status to set
            reason: Optional reason for the status change
        """
        old_status = self.status
        self.status = new_status
        self.last_updated = time.time()
        self.add_note(f"Status changed from {old_status.value} to {new_status.value}", {"reason": reason})
        logger.info(f"Proposal {self.proposal_id} status updated: {old_status.value} -> {new_status.value}")
    
    def set_priority(self, priority: int, reason: str = None) -> None:
        """
        Set the priority of the proposal.
        
        Args:
            priority: Priority level (lower is higher)
            reason: Optional reason for setting priority
        """
        self.priority = priority
        self.last_updated = time.time()
        self.add_note(f"Priority set to {priority}", {"reason": reason})
    
    def set_implementation_plan(self, plan: Dict[str, Any]) -> None:
        """
        Set the implementation plan.
        
        Args:
            plan: Implementation plan details
        """
        self.implementation_plan = plan
        self.last_updated = time.time()
        self.add_note("Implementation plan updated")
    
    def set_validation_plan(self, plan: Dict[str, Any]) -> None:
        """
        Set the validation plan.
        
        Args:
            plan: Validation plan details
        """
        self.validation_plan = plan
        self.last_updated = time.time()
        self.add_note("Validation plan updated")
    
    def add_validation_result(self, result: Dict[str, Any]) -> None:
        """
        Add a validation result.
        
        Args:
            result: Validation result details
        """
        result["timestamp"] = time.time()
        self.validation_results.append(result)
        self.last_updated = time.time()
        self.add_note(f"Validation result added: {result.get('summary', 'No summary')}")
    
    def add_note(self, note: str, details: Dict[str, Any] = None) -> None:
        """
        Add a note to the proposal log.
        
        Args:
            note: The note to add
            details: Additional details
        """
        entry = {
            "timestamp": time.time(),
            "note": note,
            "details": details or {}
        }
        self.notes.append(entry)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the proposal to a dictionary.
        
        Returns:
            Dictionary representation of the proposal
        """
        return {
            "proposal_id": self.proposal_id,
            "title": self.title,
            "description": self.description,
            "source": self.source.value,
            "component_id": self.component_id,
            "target_version": self.target_version,
            "created_by": self.created_by,
            "created_at": self.created_at,
            "last_updated": self.last_updated,
            "metadata": self.metadata,
            "status": self.status.value,
            "priority": self.priority,
            "estimated_effort": self.estimated_effort,
            "impact_assessment": self.impact_assessment,
            "implementation_plan": self.implementation_plan,
            "validation_plan": self.validation_plan,
            "validation_results": self.validation_results,
            "notes": self.notes
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Optional["ImprovementProposal"]:
        """
        Create a proposal from a dictionary.
        
        Args:
            data: Dictionary representation of a proposal
            
        Returns:
            ImprovementProposal instance or None if error
        """
        try:
            proposal = cls(
                proposal_id=data["proposal_id"],
                title=data["title"],
                description=data["description"],
                source=ImprovementSource(data["source"]),
                component_id=data.get("component_id"),
                target_version=data.get("target_version"),
                created_by=data.get("created_by"),
                metadata=data.get("metadata", {})
            )
            
            # Restore state
            proposal.created_at = data.get("created_at", time.time())
            proposal.last_updated = data.get("last_updated", proposal.created_at)
            proposal.status = ImprovementProposalStatus(data["status"])
            proposal.priority = data.get("priority", 0)
            proposal.estimated_effort = data.get("estimated_effort", 0)
            proposal.impact_assessment = data.get("impact_assessment", {})
            proposal.implementation_plan = data.get("implementation_plan", {})
            proposal.validation_plan = data.get("validation_plan", {})
            proposal.validation_results = data.get("validation_results", [])
            proposal.notes = data.get("notes", [])
            
            return proposal
        except Exception as e:
            logger.error(f"Error creating proposal from dict: {str(e)}", exc_info=True)
            return None


class ImprovementCycle:
    """
    Represents a single continuous improvement cycle.
    """
    
    def __init__(self, cycle_id: str, cycle_type: ImprovementCycleType, 
                 start_date: float, end_date: float):
        """
        Initialize an improvement cycle.
        
        Args:
            cycle_id: Unique identifier for the cycle
            cycle_type: Type of the cycle (minor, major, constitutional)
            start_date: Start timestamp of the cycle
            end_date: End timestamp of the cycle
        """
        self.cycle_id = cycle_id
        self.cycle_type = cycle_type
        self.start_date = start_date
        self.end_date = end_date
        self.status = "planned" # planned, active, completed
        self.proposals = [] # List of proposal IDs included in this cycle
        self.summary = {}
        self.created_at = time.time()
        self.last_updated = self.created_at
    
    def start_cycle(self) -> None:
        """
        Start the improvement cycle.
        """
        if self.status != "planned":
            logger.warning(f"Cycle {self.cycle_id} cannot be started (status: {self.status})")
            return
        
        self.status = "active"
        self.last_updated = time.time()
        logger.info(f"Improvement cycle {self.cycle_id} ({self.cycle_type.value}) started")
    
    def complete_cycle(self, summary: Dict[str, Any]) -> None:
        """
        Complete the improvement cycle.
        
        Args:
            summary: Summary of the cycle outcomes
        """
        if self.status != "active":
            logger.warning(f"Cycle {self.cycle_id} cannot be completed (status: {self.status})")
            return
        
        self.status = "completed"
        self.summary = summary
        self.last_updated = time.time()
        logger.info(f"Improvement cycle {self.cycle_id} completed")
    
    def add_proposal(self, proposal_id: str) -> None:
        """
        Add a proposal to this cycle.
        
        Args:
            proposal_id: ID of the proposal to add
        """
        if proposal_id not in self.proposals:
            self.proposals.append(proposal_id)
            self.last_updated = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the cycle to a dictionary.
        
        Returns:
            Dictionary representation of the cycle
        """
        return {
            "cycle_id": self.cycle_id,
            "cycle_type": self.cycle_type.value,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "status": self.status,
            "proposals": self.proposals,
            "summary": self.summary,
            "created_at": self.created_at,
            "last_updated": self.last_updated
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Optional["ImprovementCycle"]:
        """
        Create a cycle from a dictionary.
        
        Args:
            data: Dictionary representation of a cycle
            
        Returns:
            ImprovementCycle instance or None if error
        """
        try:
            cycle = cls(
                cycle_id=data["cycle_id"],
                cycle_type=ImprovementCycleType(data["cycle_type"]),
                start_date=data["start_date"],
                end_date=data["end_date"]
            )
            
            # Restore state
            cycle.status = data.get("status", "planned")
            cycle.proposals = data.get("proposals", [])
            cycle.summary = data.get("summary", {})
            cycle.created_at = data.get("created_at", time.time())
            cycle.last_updated = data.get("last_updated", cycle.created_at)
            
            return cycle
        except Exception as e:
            logger.error(f"Error creating cycle from dict: {str(e)}", exc_info=True)
            return None


class ContinuousImprovementManager:
    """
    Manages the continuous improvement process.
    
    This class handles the creation, tracking, and management of improvement
    proposals and cycles.
    """
    
    def __init__(self, governance_registry: GovernanceVersionRegistry, 
                 storage_dir: str = None):
        """
        Initialize the continuous improvement manager.
        
        Args:
            governance_registry: Instance of GovernanceVersionRegistry
            storage_dir: Directory for storing improvement data
        """
        self.governance_registry = governance_registry
        self.storage_dir = storage_dir or os.path.join(os.getcwd(), "governance_improvements")
        self.logger = logging.getLogger(__name__)
        
        # Create storage directories
        self.proposals_dir = os.path.join(self.storage_dir, "proposals")
        self.cycles_dir = os.path.join(self.storage_dir, "cycles")
        os.makedirs(self.proposals_dir, exist_ok=True)
        os.makedirs(self.cycles_dir, exist_ok=True)
        
        # Cache of loaded proposals and cycles
        self._proposal_cache = {}
        self._cycle_cache = {}
    
    def create_proposal(self, title: str, description: str, source: ImprovementSource,
                        component_id: Optional[str] = None, target_version: Optional[str] = None,
                        created_by: str = None, metadata: Dict[str, Any] = None) -> Optional[ImprovementProposal]:
        """
        Create a new improvement proposal.
        
        Args:
            title: Short title for the proposal
            description: Detailed description
            source: Source of the improvement opportunity
            component_id: Optional target component ID
            target_version: Optional target version
            created_by: Identifier of the creator
            metadata: Additional metadata
            
        Returns:
            Newly created ImprovementProposal or None if error
        """
        proposal_id = str(uuid.uuid4())
        proposal = ImprovementProposal(
            proposal_id=proposal_id,
            title=title,
            description=description,
            source=source,
            component_id=component_id,
            target_version=target_version,
            created_by=created_by,
            metadata=metadata
        )
        
        # Save and cache
        if self._save_proposal(proposal):
            self._proposal_cache[proposal_id] = proposal
            return proposal
        else:
            return None
    
    def get_proposal(self, proposal_id: str) -> Optional[ImprovementProposal]:
        """
        Get a specific proposal by ID.
        
        Args:
            proposal_id: Unique identifier for the proposal
            
        Returns:
            ImprovementProposal if found, None otherwise
        """
        # Check cache first
        if proposal_id in self._proposal_cache:
            return self._proposal_cache[proposal_id]
        
        # Load from storage
        proposal_file = os.path.join(self.proposals_dir, f"{proposal_id}.json")
        if not os.path.exists(proposal_file):
            return None
        
        try:
            with open(proposal_file, "r") as f:
                data = json.load(f)
                proposal = ImprovementProposal.from_dict(data)
                if proposal:
                    self._proposal_cache[proposal_id] = proposal
                return proposal
        except Exception as e:
            self.logger.error(f"Error loading proposal {proposal_id}: {str(e)}")
            return None
    
    def update_proposal(self, proposal: ImprovementProposal) -> bool:
        """
        Update a proposal in storage.
        
        Args:
            proposal: Proposal object to update
            
        Returns:
            True if successful, False otherwise
        """
        proposal.last_updated = time.time()
        return self._save_proposal(proposal)
    
    def get_proposals_by_status(self, status: ImprovementProposalStatus) -> List[ImprovementProposal]:
        """
        Get all proposals with a specific status.
        
        Args:
            status: ImprovementProposalStatus to filter by
            
        Returns:
            List of proposals with the specified status
        """
        proposals = []
        for filename in os.listdir(self.proposals_dir):
            if not filename.endswith(".json"):
                continue
            
            proposal_id = filename[:-5]
            proposal = self.get_proposal(proposal_id)
            if proposal and proposal.status == status:
                proposals.append(proposal)
        
        # Sort by priority (higher first), then creation date
        proposals.sort(key=lambda p: (p.priority, p.created_at))
        return proposals
    
    def create_cycle(self, cycle_type: ImprovementCycleType, 
                     start_date: float, end_date: float) -> Optional[ImprovementCycle]:
        """
        Create a new improvement cycle.
        
        Args:
            cycle_type: Type of the cycle
            start_date: Start timestamp
            end_date: End timestamp
            
        Returns:
            Newly created ImprovementCycle or None if error
        """
        cycle_id = str(uuid.uuid4())
        cycle = ImprovementCycle(
            cycle_id=cycle_id,
            cycle_type=cycle_type,
            start_date=start_date,
            end_date=end_date
        )
        
        # Save and cache
        if self._save_cycle(cycle):
            self._cycle_cache[cycle_id] = cycle
            return cycle
        else:
            return None
    
    def get_cycle(self, cycle_id: str) -> Optional[ImprovementCycle]:
        """
        Get a specific cycle by ID.
        
        Args:
            cycle_id: Unique identifier for the cycle
            
        Returns:
            ImprovementCycle if found, None otherwise
        """
        # Check cache first
        if cycle_id in self._cycle_cache:
            return self._cycle_cache[cycle_id]
        
        # Load from storage
        cycle_file = os.path.join(self.cycles_dir, f"{cycle_id}.json")
        if not os.path.exists(cycle_file):
            return None
        
        try:
            with open(cycle_file, "r") as f:
                data = json.load(f)
                cycle = ImprovementCycle.from_dict(data)
                if cycle:
                    self._cycle_cache[cycle_id] = cycle
                return cycle
        except Exception as e:
            self.logger.error(f"Error loading cycle {cycle_id}: {str(e)}")
            return None
    
    def update_cycle(self, cycle: ImprovementCycle) -> bool:
        """
        Update a cycle in storage.
        
        Args:
            cycle: Cycle object to update
            
        Returns:
            True if successful, False otherwise
        """
        cycle.last_updated = time.time()
        return self._save_cycle(cycle)
    
    def get_active_cycles(self) -> List[ImprovementCycle]:
        """
        Get all currently active improvement cycles.
        
        Returns:
            List of active cycles
        """
        cycles = []
        for filename in os.listdir(self.cycles_dir):
            if not filename.endswith(".json"):
                continue
            
            cycle_id = filename[:-5]
            cycle = self.get_cycle(cycle_id)
            if cycle and cycle.status == "active":
                cycles.append(cycle)
        
        # Sort by start date
        cycles.sort(key=lambda c: c.start_date)
        return cycles
    
    def assign_proposal_to_cycle(self, proposal_id: str, cycle_id: str) -> bool:
        """
        Assign a proposal to an improvement cycle.
        
        Args:
            proposal_id: ID of the proposal
            cycle_id: ID of the cycle
            
        Returns:
            True if successful, False otherwise
        """
        proposal = self.get_proposal(proposal_id)
        cycle = self.get_cycle(cycle_id)
        
        if not proposal:
            self.logger.error(f"Proposal {proposal_id} not found")
            return False
        if not cycle:
            self.logger.error(f"Cycle {cycle_id} not found")
            return False
        
        if cycle.status != "planned":
            self.logger.error(f"Cannot assign proposal to cycle {cycle_id} (status: {cycle.status})")
            return False
        
        cycle.add_proposal(proposal_id)
        proposal.add_note(f"Assigned to cycle {cycle_id}")
        
        # Update both
        self.update_cycle(cycle)
        self.update_proposal(proposal)
        
        return True
    
    def _save_proposal(self, proposal: ImprovementProposal) -> bool:
        """
        Save a proposal to storage.
        
        Args:
            proposal: Proposal object to save
            
        Returns:
            True if successful, False otherwise
        """
        proposal_file = os.path.join(self.proposals_dir, f"{proposal.proposal_id}.json")
        try:
            with open(proposal_file, "w") as f:
                json.dump(proposal.to_dict(), f, indent=2)
            return True
        except Exception as e:
            self.logger.error(f"Error saving proposal {proposal.proposal_id}: {str(e)}")
            return False
    
    def _save_cycle(self, cycle: ImprovementCycle) -> bool:
        """
        Save a cycle to storage.
        
        Args:
            cycle: Cycle object to save
            
        Returns:
            True if successful, False otherwise
        """
        cycle_file = os.path.join(self.cycles_dir, f"{cycle.cycle_id}.json")
        try:
            with open(cycle_file, "w") as f:
                json.dump(cycle.to_dict(), f, indent=2)
            return True
        except Exception as e:
            self.logger.error(f"Error saving cycle {cycle.cycle_id}: {str(e)}")
            return False


# Example usage
if __name__ == "__main__":
    # Create registry and improvement manager
    registry = GovernanceVersionRegistry()
    improvement_manager = ContinuousImprovementManager(registry)
    
    # Create a proposal
    proposal = improvement_manager.create_proposal(
        title="Enhance Trust Boundary Enforcement",
        description="Improve the validation logic for trust boundaries during inheritance.",
        source=ImprovementSource.VALIDATION,
        component_id="trust_propagation",
        created_by="validator_b"
    )
    
    if proposal:
        # Prioritize the proposal
        proposal.set_priority(1, reason="High impact on security")
        proposal.update_status(ImprovementProposalStatus.PRIORITIZED)
        improvement_manager.update_proposal(proposal)
        
        # Create an improvement cycle
        now = time.time()
        cycle = improvement_manager.create_cycle(
            cycle_type=ImprovementCycleType.MINOR,
            start_date=now,
            end_date=now + 30 * 24 * 60 * 60 # 30 days
        )
        
        if cycle:
            # Assign proposal to cycle
            improvement_manager.assign_proposal_to_cycle(proposal.proposal_id, cycle.cycle_id)
            
            # Start the cycle
            cycle.start_cycle()
            improvement_manager.update_cycle(cycle)
            
            # ... later, complete the cycle ...
            # cycle.complete_cycle({"proposals_completed": 1, "issues_found": 0})
            # improvement_manager.update_cycle(cycle)
            
            # Retrieve and print cycle
            retrieved_cycle = improvement_manager.get_cycle(cycle.cycle_id)
            if retrieved_cycle:
                print("Cycle:", json.dumps(retrieved_cycle.to_dict(), indent=2))
            
            # Retrieve and print proposal
            retrieved_proposal = improvement_manager.get_proposal(proposal.proposal_id)
            if retrieved_proposal:
                print("\nProposal:", json.dumps(retrieved_proposal.to_dict(), indent=2))
