#!/usr/bin/env python3
"""
Manages the process of evolving contracts through a formal approval process.
"""

import uuid
import datetime
import json
import re
from typing import Dict, Any, List, Optional
from src.core.governance.contract_sealer import ContractSealer

class ContractEvolutionProtocol:
    """
    Manages the process of evolving contracts through a formal approval process.
    """
    
    def __init__(self, contract_sealer: ContractSealer, required_approvals: int = 3):
        """
        Initialize the ContractEvolutionProtocol.
        
        Args:
            contract_sealer: The ContractSealer to use for sealing evolved contracts.
            required_approvals: The number of approvals required to finalize an evolution.
        """
        self.contract_sealer = contract_sealer
        self.required_approvals = required_approvals
    
    def create_evolution_proposal(
        self,
        current_contract: Dict[str, Any],
        proposed_changes: Dict[str, Any],
        justification: str,
        proposer_id: str
    ) -> Dict[str, Any]:
        """
        Create a proposal to evolve a contract.
        
        Args:
            current_contract: The current version of the contract.
            proposed_changes: The proposed changes to the contract.
            justification: The justification for the changes.
            proposer_id: The identifier of the proposer.
            
        Returns:
            An evolution proposal.
        """
        # Create a deep copy of the current contract
        current_copy = json.loads(json.dumps(current_contract))
        
        # Apply the proposed changes to create the proposed contract
        proposed_contract = self._apply_changes(current_copy, proposed_changes)
        
        # Increment the version
        proposed_contract["version"] = self._increment_version(
            current_copy.get("version", "1.0.0")
        )
        
        # Update the last_modified timestamp
        proposed_contract["last_modified"] = datetime.datetime.utcnow().isoformat() + "Z"
        
        # Create the proposal
        proposal = {
            "proposal_id": str(uuid.uuid4()),
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "proposer_id": proposer_id,
            "current_contract": current_copy,
            "proposed_contract": proposed_contract,
            "justification": justification,
            "status": "PROPOSED",
            "approvals": [],
            "rejections": [],
            "comments": []
        }
        
        return proposal
    
    def approve_proposal(
        self,
        proposal: Dict[str, Any],
        approver_id: str,
        comments: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Approve an evolution proposal.
        
        Args:
            proposal: The proposal to approve.
            approver_id: The identifier of the approver.
            comments: Optional comments from the approver.
            
        Returns:
            The updated proposal.
        """
        # Create a deep copy of the proposal
        proposal_copy = json.loads(json.dumps(proposal))
        
        # Check if the proposal is already approved or rejected
        if proposal_copy["status"] in ["APPROVED", "REJECTED", "FINALIZED"]:
            raise ValueError(f"Cannot approve proposal with status {proposal_copy['status']}")
        
        # Check if the approver has already approved
        for approval in proposal_copy["approvals"]:
            if approval["approver_id"] == approver_id:
                raise ValueError(f"Approver {approver_id} has already approved this proposal")
        
        # Add the approval
        approval = {
            "approver_id": approver_id,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "comments": comments
        }
        proposal_copy["approvals"].append(approval)
        
        # Check if we have enough approvals
        if len(proposal_copy["approvals"]) >= self.required_approvals:
            proposal_copy["status"] = "APPROVED"
        
        return proposal_copy
    
    def reject_proposal(
        self,
        proposal: Dict[str, Any],
        rejector_id: str,
        reason: str
    ) -> Dict[str, Any]:
        """
        Reject an evolution proposal.
        
        Args:
            proposal: The proposal to reject.
            rejector_id: The identifier of the rejector.
            reason: The reason for rejection.
            
        Returns:
            The updated proposal.
        """
        # Create a deep copy of the proposal
        proposal_copy = json.loads(json.dumps(proposal))
        
        # Check if the proposal is already approved or rejected
        if proposal_copy["status"] in ["APPROVED", "REJECTED", "FINALIZED"]:
            raise ValueError(f"Cannot reject proposal with status {proposal_copy['status']}")
        
        # Add the rejection
        rejection = {
            "rejector_id": rejector_id,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "reason": reason
        }
        proposal_copy["rejections"].append(rejection)
        
        # Update the status
        proposal_copy["status"] = "REJECTED"
        
        return proposal_copy
    
    def finalize_evolution(self, proposal: Dict[str, Any]) -> Dict[str, Any]:
        """
        Finalize an approved evolution proposal.
        
        Args:
            proposal: The approved proposal to finalize.
            
        Returns:
            An evolution record.
        """
        # Check if the proposal is approved
        if proposal["status"] != "APPROVED":
            raise ValueError(f"Cannot finalize proposal with status {proposal['status']}")
        
        # Seal the proposed contract
        sealed_contract = self.contract_sealer.seal_contract(proposal["proposed_contract"])
        
        # Create the evolution record
        evolution_record = {
            "evolution_id": str(uuid.uuid4()),
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "proposal_id": proposal["proposal_id"],
            "previous_version": proposal["current_contract"].get("version", "unknown"),
            "new_version": proposal["proposed_contract"].get("version", "unknown"),
            "sealed_contract": sealed_contract,
            "approvals": proposal["approvals"],
            "justification": proposal["justification"]
        }
        
        return evolution_record
    
    def _apply_changes(
        self,
        current_contract: Dict[str, Any],
        changes: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Apply changes to a contract.
        
        Args:
            current_contract: The current contract.
            changes: The changes to apply.
            
        Returns:
            The updated contract.
        """
        # Create a deep copy of the current contract
        result = json.loads(json.dumps(current_contract))
        
        # Apply the changes recursively
        self._apply_changes_recursive(result, changes)
        
        return result
    
    def _apply_changes_recursive(
        self,
        target: Dict[str, Any],
        changes: Dict[str, Any]
    ) -> None:
        """
        Recursively apply changes to a nested dictionary.
        
        Args:
            target: The target dictionary.
            changes: The changes to apply.
        """
        for key, value in changes.items():
            if isinstance(value, dict) and key in target and isinstance(target[key], dict):
                # Recursively apply changes to nested dictionaries
                self._apply_changes_recursive(target[key], value)
            else:
                # Directly apply the change
                target[key] = value
    
    def _increment_version(self, version: str) -> str:
        """
        Increment the version number.
        
        Args:
            version: The current version.
            
        Returns:
            The incremented version.
        """
        # Parse the version
        parts = version.split(".")
        
        # Ensure we have at least 3 parts
        while len(parts) < 3:
            parts.append("0")
        
        # Increment the patch version
        parts[2] = str(int(parts[2]) + 1)
        
        # Join the parts back together
        return ".".join(parts)
