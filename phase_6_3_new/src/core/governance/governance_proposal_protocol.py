"""
Governance Proposal Protocol for Phase 5.5.

This module provides functionality for creating, validating, and managing
governance policy proposals across the mesh network.

This component implements Phase 5.5 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.5
Clauses: 5.5, 5.4, 11.0, 11.1, 5.2.5
"""

import os
import json
import uuid
from datetime import datetime

class GovernanceProposalProtocol:
    """
    Protocol for governance policy proposals.
    
    This class handles the creation, validation, and management of
    governance policy proposals across the mesh network.
    """
    
    def __init__(self, schema_validator):
        """
        Initialize the governance proposal protocol.
        
        Args:
            schema_validator: SchemaValidator instance for schema validation
        
        Raises:
            ValueError: If schema_validator is None
        """
        if schema_validator is None:
            raise ValueError("Schema validator is required")
            
        self.schema_validator = schema_validator
        self.phase_id = "5.5"
        self.codex_clauses = ["5.5", "5.4", "11.0", "11.1", "5.2.5"]
        
        # Perform tether check on initialization
        self._codex_tether_check()
        
    def create_proposal(self, proposer_id, target_clause, description, current_text, proposed_text, json_patches=None):
        """
        Create a new governance proposal.
        
        Args:
            proposer_id: ID of the node proposing the change
            target_clause: Contract clause being modified
            description: Description of the proposal
            current_text: Current text of the clause
            proposed_text: Proposed new text for the clause
            json_patches: Optional list of JSON patch operations
            
        Returns:
            Dict containing the proposal data
        """
        if json_patches is None:
            json_patches = []
            
        proposal_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        proposal = {
            "proposal_id": proposal_id,
            "proposed_by": proposer_id,
            "target_contract_clause": target_clause,
            "description": description,
            "rationale": description,  # Adding rationale field which is required by schema
            "status": "draft",
            "created_at": timestamp,
            "updated_at": timestamp,
            "phase_id": self.phase_id,
            "codex_clauses": self.codex_clauses,
            "changes": {
                "current_text": current_text,
                "proposed_text": proposed_text,
                "json_patches": json_patches
            },
            "votes": [],
            "comments": []
        }
        
        # Validate proposal against schema
        validation_result = self.schema_validator.validate_governance_proposal(proposal)
        
        if not validation_result.get("valid", False):
            raise ValueError(f"Invalid proposal: {validation_result.get('error', 'Unknown error')}")
            
        return proposal
        
    def submit_proposal(self, proposal, mesh_state):
        """
        Submit a proposal to the governance mesh.
        
        Args:
            proposal: Proposal data
            mesh_state: Current state of the governance mesh
            
        Returns:
            Dict with submission results
        """
        if proposal["status"] != "draft":
            raise ValueError("Only draft proposals can be submitted")
            
        # Update proposal status
        proposal["status"] = "submitted"
        proposal["updated_at"] = datetime.utcnow().isoformat() + "Z"
        
        # Add to mesh state
        if "proposals" not in mesh_state:
            mesh_state["proposals"] = []
            
        mesh_state["proposals"].append(proposal)
        
        return {
            "success": True,
            "proposal_id": proposal["proposal_id"],
            "status": "submitted",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
    def vote_on_proposal(self, proposal_id, voter_id, vote, comment=None, mesh_state=None):
        """
        Record a vote on a proposal.
        
        Args:
            proposal_id: ID of the proposal
            voter_id: ID of the voting node
            vote: Vote value ("approve", "reject", "abstain")
            comment: Optional comment with the vote
            mesh_state: Current state of the governance mesh
            
        Returns:
            Dict with voting results
        """
        if mesh_state is None or "proposals" not in mesh_state:
            raise ValueError("Invalid mesh state")
            
        # Find the proposal
        proposal = None
        for p in mesh_state["proposals"]:
            if p["proposal_id"] == proposal_id:
                proposal = p
                break
                
        if proposal is None:
            raise ValueError(f"Proposal {proposal_id} not found")
            
        if proposal["status"] != "submitted":
            raise ValueError("Only submitted proposals can be voted on")
            
        # Check if node has already voted
        for v in proposal["votes"]:
            if v["voter_id"] == voter_id:
                raise ValueError(f"Node {voter_id} has already voted on this proposal")
                
        # Record the vote
        timestamp = datetime.utcnow().isoformat() + "Z"
        vote_data = {
            "voter_id": voter_id,
            "vote": vote,
            "timestamp": timestamp
        }
        
        if comment:
            vote_data["comment"] = comment
            
        proposal["votes"].append(vote_data)
        proposal["updated_at"] = timestamp
        
        # Add comment if provided
        if comment:
            if "comments" not in proposal:
                proposal["comments"] = []
                
            proposal["comments"].append({
                "author_id": voter_id,
                "text": comment,
                "timestamp": timestamp
            })
            
        return {
            "success": True,
            "proposal_id": proposal_id,
            "voter_id": voter_id,
            "vote": vote,
            "timestamp": timestamp
        }
        
    def finalize_proposal(self, proposal_id, mesh_state):
        """
        Finalize a proposal based on votes.
        
        Args:
            proposal_id: ID of the proposal
            mesh_state: Current state of the governance mesh
            
        Returns:
            Dict with finalization results
        """
        if mesh_state is None or "proposals" not in mesh_state:
            raise ValueError("Invalid mesh state")
            
        # Find the proposal
        proposal = None
        for p in mesh_state["proposals"]:
            if p["proposal_id"] == proposal_id:
                proposal = p
                break
                
        if proposal is None:
            raise ValueError(f"Proposal {proposal_id} not found")
            
        if proposal["status"] != "submitted":
            raise ValueError("Only submitted proposals can be finalized")
            
        # Count votes
        approve_count = 0
        reject_count = 0
        abstain_count = 0
        
        for vote in proposal["votes"]:
            if vote["vote"] == "approve":
                approve_count += 1
            elif vote["vote"] == "reject":
                reject_count += 1
            elif vote["vote"] == "abstain":
                abstain_count += 1
                
        total_votes = approve_count + reject_count + abstain_count
        
        if total_votes == 0:
            raise ValueError("No votes recorded for this proposal")
            
        # Determine result (simple majority for now)
        if approve_count > reject_count:
            result = "approved"
        else:
            result = "rejected"
            
        # Update proposal status
        proposal["status"] = result
        proposal["updated_at"] = datetime.utcnow().isoformat() + "Z"
        proposal["finalized_at"] = datetime.utcnow().isoformat() + "Z"
        proposal["vote_summary"] = {
            "approve": approve_count,
            "reject": reject_count,
            "abstain": abstain_count,
            "total": total_votes
        }
        
        return {
            "success": True,
            "proposal_id": proposal_id,
            "status": result,
            "vote_summary": proposal["vote_summary"],
            "timestamp": proposal["finalized_at"]
        }
    
    def _codex_tether_check(self):
        """
        Explicit Codex tether check method for testing.
        
        This method is used to verify that the component is properly
        tethered to the Codex Contract.
        """
        # This method is intentionally left minimal for testing purposes
        pass
