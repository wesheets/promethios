"""
Progressive Access Workflow - Criteria Evaluator

This module implements the criteria evaluation for the progressive access workflow,
determining when users are eligible for progression to higher access tiers.
"""

import logging
from typing import Dict, List, Optional, Any, Union, Set
from datetime import datetime, timedelta

from src.access_tier.models import TierDefinition, TierAssignment, ProgressionCandidate, ProgressionCriteria, UsageRecord

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CriteriaEvaluator:
    """
    Evaluator for progression criteria.
    
    This class evaluates whether users meet the criteria for progression
    to higher access tiers based on their usage patterns and history.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the criteria evaluator.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.evaluation_window_days = self.config.get('evaluation_window_days', 30)
        self.min_successful_requests_override = self.config.get('min_successful_requests_override', {})
        self.max_error_rate_override = self.config.get('max_error_rate_override', {})
        
        logger.info("Initialized criteria evaluator")
    
    def evaluate_user(self, user_id: str, current_tier: TierDefinition, 
                     next_tier: TierDefinition, assignment: TierAssignment,
                     usage_records: List[UsageRecord]) -> ProgressionCandidate:
        """
        Evaluate a user for progression eligibility.
        
        Args:
            user_id: The ID of the user
            current_tier: The user's current tier
            next_tier: The potential next tier
            assignment: The user's current tier assignment
            usage_records: The user's usage records
            
        Returns:
            ProgressionCandidate: The evaluation result
        """
        # Get progression criteria
        criteria = current_tier.progression_criteria
        
        if not criteria:
            logger.warning(f"No progression criteria defined for tier {current_tier.id}")
            return ProgressionCandidate(
                user_id=user_id,
                current_tier_id=current_tier.id,
                next_tier_id=next_tier.id,
                eligible=False,
                criteria_met={
                    "min_days_in_tier": False,
                    "min_successful_requests": False,
                    "max_error_rate": False
                },
                evaluation_date=datetime.now()
            )
        
        # Filter usage records to the evaluation window
        cutoff_date = datetime.now() - timedelta(days=self.evaluation_window_days)
        recent_records = [
            record for record in usage_records
            if record.timestamp >= cutoff_date
        ]
        
        # Evaluate criteria
        criteria_met = {}
        
        # Check minimum days in tier
        days_in_tier = (datetime.now() - assignment.assigned_at).days
        min_days_required = criteria.min_days_in_tier
        criteria_met["min_days_in_tier"] = days_in_tier >= min_days_required
        
        # Check minimum successful requests
        successful_requests = sum(
            1 for record in recent_records
            if 200 <= record.status_code < 300
        )
        
        # Apply override if configured
        min_requests_required = self.min_successful_requests_override.get(
            current_tier.id, criteria.min_successful_requests
        )
        
        criteria_met["min_successful_requests"] = successful_requests >= min_requests_required
        
        # Check maximum error rate
        total_requests = len(recent_records)
        if total_requests > 0:
            error_requests = sum(
                1 for record in recent_records
                if record.status_code >= 400
            )
            error_rate = error_requests / total_requests
            
            # Apply override if configured
            max_error_rate = self.max_error_rate_override.get(
                current_tier.id, criteria.max_error_rate
            )
            
            criteria_met["max_error_rate"] = error_rate <= max_error_rate
        else:
            # No requests means no errors
            criteria_met["max_error_rate"] = True
        
        # Determine overall eligibility
        eligible = all(criteria_met.values())
        
        # Create and return the candidate
        candidate = ProgressionCandidate(
            user_id=user_id,
            current_tier_id=current_tier.id,
            next_tier_id=next_tier.id,
            eligible=eligible,
            criteria_met=criteria_met,
            evaluation_date=datetime.now()
        )
        
        logger.info(f"Evaluated user {user_id} for progression: eligible={eligible}")
        return candidate
    
    def evaluate_all_users(self, assignments: Dict[str, TierAssignment], 
                          tiers: Dict[str, TierDefinition],
                          usage_records: Dict[str, List[UsageRecord]],
                          tier_progression_map: Dict[str, str] = None) -> List[ProgressionCandidate]:
        """
        Evaluate all users for progression eligibility.
        
        Args:
            assignments: Dictionary of user assignments
            tiers: Dictionary of tier definitions
            usage_records: Dictionary of usage records by user
            tier_progression_map: Map of tier IDs to next tier IDs (optional)
            
        Returns:
            List[ProgressionCandidate]: List of progression candidates
        """
        candidates = []
        
        # Create default tier progression map if not provided
        if not tier_progression_map:
            tier_progression_map = self._create_default_tier_progression_map(tiers)
        
        # Evaluate each user
        for user_id, assignment in assignments.items():
            current_tier_id = assignment.tier_id
            current_tier = tiers.get(current_tier_id)
            
            if not current_tier:
                logger.warning(f"Invalid tier ID for user {user_id}: {current_tier_id}")
                continue
            
            # Check if there's a next tier
            next_tier_id = tier_progression_map.get(current_tier_id)
            if not next_tier_id:
                logger.debug(f"No next tier defined for tier {current_tier_id}")
                continue
            
            next_tier = tiers.get(next_tier_id)
            if not next_tier:
                logger.warning(f"Invalid next tier ID: {next_tier_id}")
                continue
            
            # Get user's usage records
            user_records = usage_records.get(user_id, [])
            
            # Evaluate the user
            candidate = self.evaluate_user(
                user_id=user_id,
                current_tier=current_tier,
                next_tier=next_tier,
                assignment=assignment,
                usage_records=user_records
            )
            
            # Add to candidates if eligible
            if candidate.eligible:
                candidates.append(candidate)
        
        logger.info(f"Evaluated all users for progression: {len(candidates)} eligible candidates")
        return candidates
    
    def _create_default_tier_progression_map(self, tiers: Dict[str, TierDefinition]) -> Dict[str, str]:
        """
        Create a default tier progression map based on tier definitions.
        
        Args:
            tiers: Dictionary of tier definitions
            
        Returns:
            Dict[str, str]: Map of tier IDs to next tier IDs
        """
        # Sort tiers by permission count (as a simple heuristic)
        sorted_tiers = sorted(
            tiers.values(),
            key=lambda tier: len(tier.permissions)
        )
        
        # Create progression map
        progression_map = {}
        for i in range(len(sorted_tiers) - 1):
            current_tier = sorted_tiers[i]
            next_tier = sorted_tiers[i + 1]
            progression_map[current_tier.id] = next_tier.id
        
        return progression_map
    
    def get_progression_metrics(self, user_id: str, current_tier: TierDefinition, 
                              assignment: TierAssignment,
                              usage_records: List[UsageRecord]) -> Dict[str, Any]:
        """
        Get detailed progression metrics for a user.
        
        Args:
            user_id: The ID of the user
            current_tier: The user's current tier
            assignment: The user's current tier assignment
            usage_records: The user's usage records
            
        Returns:
            Dict: Detailed progression metrics
        """
        # Get progression criteria
        criteria = current_tier.progression_criteria
        
        if not criteria:
            return {
                "user_id": user_id,
                "tier_id": current_tier.id,
                "has_criteria": False
            }
        
        # Filter usage records to the evaluation window
        cutoff_date = datetime.now() - timedelta(days=self.evaluation_window_days)
        recent_records = [
            record for record in usage_records
            if record.timestamp >= cutoff_date
        ]
        
        # Calculate metrics
        days_in_tier = (datetime.now() - assignment.assigned_at).days
        min_days_required = criteria.min_days_in_tier
        days_remaining = max(0, min_days_required - days_in_tier)
        
        successful_requests = sum(
            1 for record in recent_records
            if 200 <= record.status_code < 300
        )
        
        # Apply override if configured
        min_requests_required = self.min_successful_requests_override.get(
            current_tier.id, criteria.min_successful_requests
        )
        
        requests_remaining = max(0, min_requests_required - successful_requests)
        
        total_requests = len(recent_records)
        if total_requests > 0:
            error_requests = sum(
                1 for record in recent_records
                if record.status_code >= 400
            )
            error_rate = error_requests / total_requests
            
            # Apply override if configured
            max_error_rate = self.max_error_rate_override.get(
                current_tier.id, criteria.max_error_rate
            )
        else:
            error_requests = 0
            error_rate = 0
            max_error_rate = criteria.max_error_rate
        
        # Create metrics dictionary
        metrics = {
            "user_id": user_id,
            "tier_id": current_tier.id,
            "has_criteria": True,
            "days_in_tier": {
                "current": days_in_tier,
                "required": min_days_required,
                "remaining": days_remaining,
                "met": days_in_tier >= min_days_required
            },
            "successful_requests": {
                "current": successful_requests,
                "required": min_requests_required,
                "remaining": requests_remaining,
                "met": successful_requests >= min_requests_required
            },
            "error_rate": {
                "current": error_rate,
                "max_allowed": max_error_rate,
                "error_count": error_requests,
                "total_requests": total_requests,
                "met": error_rate <= max_error_rate if total_requests > 0 else True
            }
        }
        
        return metrics
