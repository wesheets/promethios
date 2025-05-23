"""
Progressive Access Workflow - State Machine

This module implements the state machine for the progressive access workflow,
enabling controlled progression through access tiers.
"""

import logging
import enum
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta

from src.access_tier.models import TierDefinition, TierAssignment, ProgressionCandidate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ProgressionState(enum.Enum):
    """Enumeration of progression states in the workflow."""
    
    INITIAL = "initial"
    ELIGIBLE = "eligible"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class ProgressionWorkflow:
    """
    State machine for the progressive access workflow.
    
    This class manages the progression of users through access tiers,
    including state transitions, approvals, and notifications.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the progression workflow.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.auto_approve_tiers = self.config.get('auto_approve_tiers', [])
        self.approval_required_tiers = self.config.get('approval_required_tiers', [])
        self.notification_enabled = self.config.get('notification_enabled', True)
        
        # Store progression state for each user
        self.progression_states = {}
        
        # Store progression history
        self.progression_history = {}
        
        logger.info("Initialized progression workflow")
    
    def process_candidate(self, candidate: ProgressionCandidate, tiers: Dict[str, TierDefinition]) -> Dict[str, Any]:
        """
        Process a progression candidate and determine the next state.
        
        Args:
            candidate: The progression candidate
            tiers: Dictionary of tier definitions
            
        Returns:
            Dict: Result of the processing
        """
        user_id = candidate.user_id
        current_tier_id = candidate.current_tier_id
        next_tier_id = candidate.next_tier_id
        
        # Get current state or set to INITIAL
        current_state = self.get_progression_state(user_id, next_tier_id)
        
        # Get tier definitions
        current_tier = tiers.get(current_tier_id)
        next_tier = tiers.get(next_tier_id)
        
        if not current_tier or not next_tier:
            logger.error(f"Invalid tier progression: {current_tier_id} -> {next_tier_id}")
            return {
                "success": False,
                "user_id": user_id,
                "current_tier_id": current_tier_id,
                "next_tier_id": next_tier_id,
                "state": current_state.value,
                "message": "Invalid tier progression"
            }
        
        # Process based on current state
        if current_state == ProgressionState.INITIAL:
            # Move to ELIGIBLE state
            new_state = ProgressionState.ELIGIBLE
            self.set_progression_state(user_id, next_tier_id, new_state)
            
            # Record in history
            self._record_state_change(user_id, next_tier_id, current_state, new_state)
            
            logger.info(f"User {user_id} is eligible for progression to {next_tier_id}")
            
            # Check if auto-approval is enabled for this tier
            if next_tier_id in self.auto_approve_tiers:
                return self.approve_progression(user_id, next_tier_id)
            
            # Check if approval is required
            if next_tier_id in self.approval_required_tiers:
                # Move to PENDING_APPROVAL state
                new_state = ProgressionState.PENDING_APPROVAL
                self.set_progression_state(user_id, next_tier_id, new_state)
                
                # Record in history
                self._record_state_change(user_id, next_tier_id, ProgressionState.ELIGIBLE, new_state)
                
                # Send notification if enabled
                if self.notification_enabled:
                    self._send_approval_notification(user_id, current_tier, next_tier)
                
                logger.info(f"User {user_id} progression to {next_tier_id} is pending approval")
            
            return {
                "success": True,
                "user_id": user_id,
                "current_tier_id": current_tier_id,
                "next_tier_id": next_tier_id,
                "state": new_state.value,
                "message": f"User is now {new_state.value} for progression"
            }
        
        elif current_state == ProgressionState.ELIGIBLE:
            # Already eligible, check if auto-approval is enabled
            if next_tier_id in self.auto_approve_tiers:
                return self.approve_progression(user_id, next_tier_id)
            
            # Check if approval is required
            if next_tier_id in self.approval_required_tiers:
                # Move to PENDING_APPROVAL state
                new_state = ProgressionState.PENDING_APPROVAL
                self.set_progression_state(user_id, next_tier_id, new_state)
                
                # Record in history
                self._record_state_change(user_id, next_tier_id, current_state, new_state)
                
                # Send notification if enabled
                if self.notification_enabled:
                    self._send_approval_notification(user_id, current_tier, next_tier)
                
                logger.info(f"User {user_id} progression to {next_tier_id} is pending approval")
            
            return {
                "success": True,
                "user_id": user_id,
                "current_tier_id": current_tier_id,
                "next_tier_id": next_tier_id,
                "state": self.get_progression_state(user_id, next_tier_id).value,
                "message": "User is already being processed for progression"
            }
        
        elif current_state == ProgressionState.PENDING_APPROVAL:
            # Already pending approval
            return {
                "success": True,
                "user_id": user_id,
                "current_tier_id": current_tier_id,
                "next_tier_id": next_tier_id,
                "state": current_state.value,
                "message": "User progression is pending approval"
            }
        
        elif current_state == ProgressionState.APPROVED:
            # Already approved
            return {
                "success": True,
                "user_id": user_id,
                "current_tier_id": current_tier_id,
                "next_tier_id": next_tier_id,
                "state": current_state.value,
                "message": "User progression has been approved"
            }
        
        elif current_state == ProgressionState.REJECTED:
            # Was rejected, check if criteria are still met
            all_criteria_met = all(candidate.criteria_met.values())
            
            if all_criteria_met:
                # Move back to ELIGIBLE state
                new_state = ProgressionState.ELIGIBLE
                self.set_progression_state(user_id, next_tier_id, new_state)
                
                # Record in history
                self._record_state_change(user_id, next_tier_id, current_state, new_state)
                
                logger.info(f"User {user_id} is eligible again for progression to {next_tier_id}")
                
                return {
                    "success": True,
                    "user_id": user_id,
                    "current_tier_id": current_tier_id,
                    "next_tier_id": next_tier_id,
                    "state": new_state.value,
                    "message": "User is eligible again for progression"
                }
            else:
                return {
                    "success": False,
                    "user_id": user_id,
                    "current_tier_id": current_tier_id,
                    "next_tier_id": next_tier_id,
                    "state": current_state.value,
                    "message": "User progression was previously rejected"
                }
        
        elif current_state == ProgressionState.COMPLETED:
            # Already completed
            return {
                "success": True,
                "user_id": user_id,
                "current_tier_id": current_tier_id,
                "next_tier_id": next_tier_id,
                "state": current_state.value,
                "message": "User progression has been completed"
            }
        
        # Should never get here
        logger.error(f"Invalid progression state: {current_state}")
        return {
            "success": False,
            "user_id": user_id,
            "current_tier_id": current_tier_id,
            "next_tier_id": next_tier_id,
            "state": current_state.value,
            "message": "Invalid progression state"
        }
    
    def approve_progression(self, user_id: str, next_tier_id: str) -> Dict[str, Any]:
        """
        Approve a user's progression to the next tier.
        
        Args:
            user_id: The ID of the user
            next_tier_id: The ID of the next tier
            
        Returns:
            Dict: Result of the approval
        """
        current_state = self.get_progression_state(user_id, next_tier_id)
        
        if current_state not in [ProgressionState.ELIGIBLE, ProgressionState.PENDING_APPROVAL]:
            logger.warning(f"Cannot approve progression for user {user_id} in state {current_state}")
            return {
                "success": False,
                "user_id": user_id,
                "next_tier_id": next_tier_id,
                "state": current_state.value,
                "message": f"Cannot approve progression in state {current_state.value}"
            }
        
        # Move to APPROVED state
        new_state = ProgressionState.APPROVED
        self.set_progression_state(user_id, next_tier_id, new_state)
        
        # Record in history
        self._record_state_change(user_id, next_tier_id, current_state, new_state)
        
        # Send notification if enabled
        if self.notification_enabled:
            self._send_progression_notification(user_id, next_tier_id, "approved")
        
        logger.info(f"Approved progression for user {user_id} to tier {next_tier_id}")
        
        return {
            "success": True,
            "user_id": user_id,
            "next_tier_id": next_tier_id,
            "state": new_state.value,
            "message": "Progression approved"
        }
    
    def reject_progression(self, user_id: str, next_tier_id: str, reason: str = None) -> Dict[str, Any]:
        """
        Reject a user's progression to the next tier.
        
        Args:
            user_id: The ID of the user
            next_tier_id: The ID of the next tier
            reason: Reason for rejection (optional)
            
        Returns:
            Dict: Result of the rejection
        """
        current_state = self.get_progression_state(user_id, next_tier_id)
        
        if current_state not in [ProgressionState.ELIGIBLE, ProgressionState.PENDING_APPROVAL]:
            logger.warning(f"Cannot reject progression for user {user_id} in state {current_state}")
            return {
                "success": False,
                "user_id": user_id,
                "next_tier_id": next_tier_id,
                "state": current_state.value,
                "message": f"Cannot reject progression in state {current_state.value}"
            }
        
        # Move to REJECTED state
        new_state = ProgressionState.REJECTED
        self.set_progression_state(user_id, next_tier_id, new_state)
        
        # Record in history
        self._record_state_change(user_id, next_tier_id, current_state, new_state, metadata={"reason": reason})
        
        # Send notification if enabled
        if self.notification_enabled:
            self._send_progression_notification(user_id, next_tier_id, "rejected", reason)
        
        logger.info(f"Rejected progression for user {user_id} to tier {next_tier_id}: {reason}")
        
        return {
            "success": True,
            "user_id": user_id,
            "next_tier_id": next_tier_id,
            "state": new_state.value,
            "message": "Progression rejected",
            "reason": reason
        }
    
    def complete_progression(self, user_id: str, next_tier_id: str) -> Dict[str, Any]:
        """
        Complete a user's progression to the next tier.
        
        Args:
            user_id: The ID of the user
            next_tier_id: The ID of the next tier
            
        Returns:
            Dict: Result of the completion
        """
        current_state = self.get_progression_state(user_id, next_tier_id)
        
        if current_state != ProgressionState.APPROVED:
            logger.warning(f"Cannot complete progression for user {user_id} in state {current_state}")
            return {
                "success": False,
                "user_id": user_id,
                "next_tier_id": next_tier_id,
                "state": current_state.value,
                "message": f"Cannot complete progression in state {current_state.value}"
            }
        
        # Move to COMPLETED state
        new_state = ProgressionState.COMPLETED
        self.set_progression_state(user_id, next_tier_id, new_state)
        
        # Record in history
        self._record_state_change(user_id, next_tier_id, current_state, new_state)
        
        # Send notification if enabled
        if self.notification_enabled:
            self._send_progression_notification(user_id, next_tier_id, "completed")
        
        logger.info(f"Completed progression for user {user_id} to tier {next_tier_id}")
        
        return {
            "success": True,
            "user_id": user_id,
            "next_tier_id": next_tier_id,
            "state": new_state.value,
            "message": "Progression completed"
        }
    
    def get_progression_state(self, user_id: str, tier_id: str) -> ProgressionState:
        """
        Get the current progression state for a user and tier.
        
        Args:
            user_id: The ID of the user
            tier_id: The ID of the tier
            
        Returns:
            ProgressionState: The current state
        """
        key = f"{user_id}:{tier_id}"
        return self.progression_states.get(key, ProgressionState.INITIAL)
    
    def set_progression_state(self, user_id: str, tier_id: str, state: ProgressionState) -> None:
        """
        Set the progression state for a user and tier.
        
        Args:
            user_id: The ID of the user
            tier_id: The ID of the tier
            state: The new state
        """
        key = f"{user_id}:{tier_id}"
        self.progression_states[key] = state
    
    def get_progression_history(self, user_id: str, tier_id: str = None) -> List[Dict[str, Any]]:
        """
        Get the progression history for a user.
        
        Args:
            user_id: The ID of the user
            tier_id: The ID of the tier (optional)
            
        Returns:
            List[Dict]: List of history entries
        """
        if tier_id:
            key = f"{user_id}:{tier_id}"
            return self.progression_history.get(key, [])
        
        # Get history for all tiers
        history = []
        for key, entries in self.progression_history.items():
            if key.startswith(f"{user_id}:"):
                history.extend(entries)
        
        # Sort by timestamp
        history.sort(key=lambda entry: entry["timestamp"])
        
        return history
    
    def _record_state_change(self, user_id: str, tier_id: str, 
                           from_state: ProgressionState, to_state: ProgressionState,
                           metadata: Dict[str, Any] = None) -> None:
        """
        Record a state change in the progression history.
        
        Args:
            user_id: The ID of the user
            tier_id: The ID of the tier
            from_state: The previous state
            to_state: The new state
            metadata: Additional metadata (optional)
        """
        key = f"{user_id}:{tier_id}"
        
        if key not in self.progression_history:
            self.progression_history[key] = []
        
        entry = {
            "user_id": user_id,
            "tier_id": tier_id,
            "from_state": from_state.value,
            "to_state": to_state.value,
            "timestamp": datetime.now().isoformat()
        }
        
        if metadata:
            entry["metadata"] = metadata
        
        self.progression_history[key].append(entry)
    
    def _send_approval_notification(self, user_id: str, current_tier: TierDefinition, next_tier: TierDefinition) -> None:
        """
        Send a notification for progression approval.
        
        Args:
            user_id: The ID of the user
            current_tier: The current tier
            next_tier: The next tier
        """
        # In a real implementation, this would send an email or other notification
        logger.info(f"[NOTIFICATION] Progression approval needed for user {user_id} from {current_tier.name} to {next_tier.name}")
    
    def _send_progression_notification(self, user_id: str, tier_id: str, status: str, reason: str = None) -> None:
        """
        Send a notification for progression status change.
        
        Args:
            user_id: The ID of the user
            tier_id: The ID of the tier
            status: The status (approved, rejected, completed)
            reason: Reason for rejection (optional)
        """
        # In a real implementation, this would send an email or other notification
        message = f"[NOTIFICATION] Progression to {tier_id} for user {user_id} has been {status}"
        if reason and status == "rejected":
            message += f": {reason}"
        
        logger.info(message)
