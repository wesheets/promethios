"""
Progressive Access Workflow - Quota Manager

This module implements quota management for the progressive access workflow,
enabling tracking and enforcement of usage quotas across different tiers.
"""

import logging
from typing import Dict, List, Optional, Any, Union, Set
from datetime import datetime, timedelta
from collections import defaultdict

from src.access_tier.models import TierDefinition, TierAssignment, UsageRecord
from src.access_tier.exceptions import RateLimitExceededError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class QuotaManager:
    """
    Manager for tracking and enforcing usage quotas.
    
    This class provides functionality for:
    - Tracking usage against quotas
    - Enforcing quota limits
    - Generating quota usage reports
    - Providing quota status for users
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the quota manager.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.enforce_quotas = self.config.get('enforce_quotas', True)
        self.quota_grace_percentage = self.config.get('quota_grace_percentage', 0)
        self.quota_warning_threshold = self.config.get('quota_warning_threshold', 0.8)
        self.notification_enabled = self.config.get('notification_enabled', True)
        
        # Store quota usage by user and quota type
        self.quota_usage = defaultdict(lambda: defaultdict(int))
        
        # Store quota reset timestamps
        self.quota_reset_times = {}
        
        logger.info("Initialized quota manager")
    
    def track_usage(self, user_id: str, usage_type: str, amount: int = 1) -> Dict[str, Any]:
        """
        Track usage against a quota.
        
        Args:
            user_id: The ID of the user
            usage_type: The type of usage (e.g., 'api_calls', 'storage')
            amount: The amount to track
            
        Returns:
            Dict: Updated quota status
        """
        # Update quota usage
        self.quota_usage[user_id][usage_type] += amount
        
        logger.debug(f"Tracked {amount} {usage_type} usage for user {user_id}")
        
        # Return updated status
        return {
            "user_id": user_id,
            "usage_type": usage_type,
            "current_usage": self.quota_usage[user_id][usage_type]
        }
    
    def check_quota(self, user_id: str, tier: TierDefinition, usage_type: str, amount: int = 1) -> bool:
        """
        Check if a usage would exceed the quota.
        
        Args:
            user_id: The ID of the user
            tier: The user's tier
            usage_type: The type of usage
            amount: The amount to check
            
        Returns:
            bool: True if within quota, False if would exceed
            
        Raises:
            RateLimitExceededError: If quota would be exceeded and enforcement is enabled
        """
        # Get quota limit from tier
        if not tier.quotas or usage_type not in tier.quotas:
            # No quota defined, allow usage
            return True
        
        quota_limit = tier.quotas[usage_type]
        
        # Apply grace percentage if configured
        if self.quota_grace_percentage > 0:
            quota_limit = quota_limit * (1 + self.quota_grace_percentage / 100)
        
        # Get current usage
        current_usage = self.quota_usage[user_id][usage_type]
        
        # Check if usage would exceed quota
        if current_usage + amount > quota_limit:
            if self.enforce_quotas:
                logger.warning(f"Quota exceeded for user {user_id}: {usage_type}")
                raise RateLimitExceededError(
                    user_id, 
                    f"{usage_type} quota ({quota_limit} {usage_type})"
                )
            return False
        
        # Check if usage would cross warning threshold
        if current_usage < quota_limit * self.quota_warning_threshold and current_usage + amount >= quota_limit * self.quota_warning_threshold:
            # Send warning notification if enabled
            if self.notification_enabled:
                self._send_quota_warning_notification(user_id, usage_type, current_usage + amount, quota_limit)
        
        return True
    
    def get_quota_status(self, user_id: str, tier: TierDefinition) -> Dict[str, Any]:
        """
        Get the quota status for a user.
        
        Args:
            user_id: The ID of the user
            tier: The user's tier
            
        Returns:
            Dict: Quota status
        """
        if not tier.quotas:
            return {
                "user_id": user_id,
                "tier_id": tier.id,
                "has_quotas": False
            }
        
        status = {
            "user_id": user_id,
            "tier_id": tier.id,
            "has_quotas": True,
            "quotas": {}
        }
        
        for usage_type, limit in tier.quotas.items():
            current_usage = self.quota_usage[user_id][usage_type]
            percentage_used = (current_usage / limit) * 100 if limit > 0 else 0
            
            status["quotas"][usage_type] = {
                "limit": limit,
                "used": current_usage,
                "remaining": max(0, limit - current_usage),
                "percentage_used": percentage_used,
                "warning_level": percentage_used >= self.quota_warning_threshold * 100,
                "exceeded": current_usage > limit
            }
        
        return status
    
    def reset_quota(self, user_id: str, usage_type: str = None) -> Dict[str, Any]:
        """
        Reset quota usage for a user.
        
        Args:
            user_id: The ID of the user
            usage_type: The type of usage to reset (optional, resets all if None)
            
        Returns:
            Dict: Reset status
        """
        if usage_type:
            # Reset specific usage type
            if user_id in self.quota_usage and usage_type in self.quota_usage[user_id]:
                self.quota_usage[user_id][usage_type] = 0
                logger.info(f"Reset {usage_type} quota for user {user_id}")
        else:
            # Reset all usage types
            if user_id in self.quota_usage:
                self.quota_usage[user_id] = defaultdict(int)
                logger.info(f"Reset all quotas for user {user_id}")
        
        # Record reset time
        reset_key = f"{user_id}:{usage_type}" if usage_type else user_id
        self.quota_reset_times[reset_key] = datetime.now()
        
        return {
            "user_id": user_id,
            "usage_type": usage_type,
            "reset": True,
            "reset_time": datetime.now().isoformat()
        }
    
    def schedule_quota_reset(self, user_id: str, usage_type: str, reset_time: datetime) -> Dict[str, Any]:
        """
        Schedule a quota reset for a future time.
        
        Args:
            user_id: The ID of the user
            usage_type: The type of usage to reset
            reset_time: The time to reset the quota
            
        Returns:
            Dict: Schedule status
        """
        # In a real implementation, this would use a task scheduler
        # For now, just record the reset time
        reset_key = f"{user_id}:{usage_type}"
        self.quota_reset_times[reset_key] = reset_time
        
        logger.info(f"Scheduled {usage_type} quota reset for user {user_id} at {reset_time.isoformat()}")
        
        return {
            "user_id": user_id,
            "usage_type": usage_type,
            "scheduled": True,
            "reset_time": reset_time.isoformat()
        }
    
    def get_quota_report(self, tier: TierDefinition = None) -> Dict[str, Any]:
        """
        Generate a quota usage report.
        
        Args:
            tier: Filter by tier (optional)
            
        Returns:
            Dict: Quota usage report
        """
        report = {
            "generated_at": datetime.now().isoformat(),
            "users": {}
        }
        
        for user_id, usage_types in self.quota_usage.items():
            # Skip if no usage
            if not usage_types:
                continue
            
            # Add user to report
            report["users"][user_id] = {
                "usage": dict(usage_types)
            }
        
        return report
    
    def _send_quota_warning_notification(self, user_id: str, usage_type: str, current_usage: int, quota_limit: int) -> None:
        """
        Send a quota warning notification.
        
        Args:
            user_id: The ID of the user
            usage_type: The type of usage
            current_usage: The current usage
            quota_limit: The quota limit
        """
        # In a real implementation, this would send an email or other notification
        percentage = (current_usage / quota_limit) * 100 if quota_limit > 0 else 0
        logger.info(f"[NOTIFICATION] Quota warning for user {user_id}: {usage_type} usage at {percentage:.1f}% ({current_usage}/{quota_limit})")
