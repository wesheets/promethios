import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from src.core.governance.codex_lock import CodexLock

router = APIRouter(prefix="/api/v1/codex-lock", tags=["codex-lock"])

# Dependency to get the CodexLock instance
def get_codex_lock() -> CodexLock:
    """
    Get the CodexLock instance.
    
    Returns:
        A CodexLock instance.
    """
    codex_path = os.environ.get("CODEX_PATH", "/etc/promethios/codex/.codex.lock")
    return CodexLock(codex_path)

# Models
class EvolutionProposal(BaseModel):
    changes: Dict[str, Any]
    justification: str
    proposer_id: str

class ApprovalRequest(BaseModel):
    approver_id: str
    comments: Optional[str] = None

class RejectionRequest(BaseModel):
    rejector_id: str
    reason: str

# Endpoints
@router.get("/status")
def get_lock_status(codex_lock: CodexLock = Depends(get_codex_lock)):
    """
    Get the status of the Codex Lock.
    
    Returns:
        The status of the Codex Lock.
    """
    integrity_check = codex_lock.verify_contract_integrity()
    
    return {
        "contract_version": codex_lock.current_contract.get("version", "unknown"),
        "integrity_verified": integrity_check["verified"],
        "details": integrity_check["details"] if not integrity_check["verified"] else "Contract integrity verified",
        "last_sealed": codex_lock.seal_registry["last_updated"] if codex_lock.seal_registry.get("seals") else None
    }

@router.post("/lock")
def lock_contract(codex_lock: CodexLock = Depends(get_codex_lock)):
    """
    Lock the current contract.
    
    Returns:
        The result of locking the contract.
    """
    try:
        seal = codex_lock.lock_current_contract()
        return {
            "success": True,
            "message": "Contract successfully locked",
            "seal_id": seal["seal_id"],
            "timestamp": seal["timestamp"],
            "contract_version": seal["contract_version"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/propose-evolution")
def propose_evolution(
    proposal: EvolutionProposal,
    codex_lock: CodexLock = Depends(get_codex_lock)
):
    """
    Propose an evolution of the current contract.
    
    Args:
        proposal: The evolution proposal.
        
    Returns:
        The result of proposing the evolution.
    """
    try:
        result = codex_lock.propose_contract_evolution(
            proposal.changes,
            proposal.justification,
            proposal.proposer_id
        )
        return {
            "success": True,
            "message": "Evolution proposal created",
            "proposal_id": result["proposal_id"],
            "timestamp": result["timestamp"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/approve-proposal/{proposal_id}")
def approve_proposal(
    proposal_id: str,
    approval: ApprovalRequest,
    codex_lock: CodexLock = Depends(get_codex_lock)
):
    """
    Approve an evolution proposal.
    
    Args:
        proposal_id: The identifier of the proposal to approve.
        approval: The approval request.
        
    Returns:
        The result of approving the proposal.
    """
    try:
        result = codex_lock.approve_proposal(
            proposal_id,
            approval.approver_id,
            approval.comments
        )
        return {
            "success": True,
            "message": "Proposal approved",
            "proposal_id": proposal_id,
            "status": result["status"],
            "approvals_count": len(result["approvals"])
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reject-proposal/{proposal_id}")
def reject_proposal(
    proposal_id: str,
    rejection: RejectionRequest,
    codex_lock: CodexLock = Depends(get_codex_lock)
):
    """
    Reject an evolution proposal.
    
    Args:
        proposal_id: The identifier of the proposal to reject.
        rejection: The rejection request.
        
    Returns:
        The result of rejecting the proposal.
    """
    try:
        result = codex_lock.reject_proposal(
            proposal_id,
            rejection.rejector_id,
            rejection.reason
        )
        return {
            "success": True,
            "message": "Proposal rejected",
            "proposal_id": proposal_id,
            "status": result["status"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/apply-evolution/{proposal_id}")
def apply_evolution(
    proposal_id: str,
    codex_lock: CodexLock = Depends(get_codex_lock)
):
    """
    Apply an approved evolution proposal.
    
    Args:
        proposal_id: The identifier of the approved proposal to apply.
        
    Returns:
        The result of applying the evolution.
    """
    try:
        result = codex_lock.apply_approved_evolution(proposal_id)
        return {
            "success": True,
            "message": "Evolution successfully applied",
            "evolution_id": result["evolution_id"],
            "previous_version": result["previous_version"],
            "new_version": result["new_version"],
            "timestamp": result["timestamp"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
