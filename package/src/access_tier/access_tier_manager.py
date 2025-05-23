"""
Access Tier Management System

This module implements the Access Tier Management System for controlling and managing 
access to Promethios APIs across multiple tiers, enabling a controlled, progressive 
release strategy.
"""

import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set

from .models import TierDefinition, TierAssignment, UsageRecord, ProgressionCandidate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AccessTierManager:
    """
    Manages access tiers, assignments, and usage tracking for the Phased API Exposure framework.
    
    The AccessTierManager is responsible for:
    - Registering and managing access tier definitions
    - Assigning users to tiers
    - Validating access based on tier permissions
    - Tracking API usage for quota management
    - Evaluating tier progression based on usage patterns
    """
    
    def __init__(self, config_path: str = None):
        """
        Initialize the AccessTierManager.
        
        Args:
            config_path: Path to the configuration file
        """
        self.tiers: Dict[str, TierDefinition] = {}
        self.assignments: Dict[str, TierAssignment] = {}
        self.usage_records: List[UsageRecord] = []
        
        # Load configuration if provided
        self.config = {}
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    self.config = json.load(f)
                logger.info(f"Loaded configuration from {config_path}")
                
                # Load predefined tiers if available
                if 'tiers' in self.config:
                    for tier_data in self.config['tiers']:
                        tier = TierDefinition(**tier_data)
                        self.register_tier(tier)
            except Exception as e:
                logger.error(f"Failed to load configuration: {str(e)}")
    
    def register_tier(self, tier: TierDefinition) -> bool:
        """
        Register a new access tier.
        
        Args:
            tier: The tier definition to register
            
        Returns:
            bool: True if registration was successful, False otherwise
        """
        if tier.id in self.tiers:
            logger.warning(f"Tier with ID {tier.id} already exists")
            return False
        
        self.tiers[tier.id] = tier
        logger.info(f"Registered tier: {tier.id} ({tier.name})")
        return True
    
    def get_tier(self, tier_id: str) -> Optional[TierDefinition]:
        """
        Get a tier definition by ID.
        
        Args:
            tier_id: The ID of the tier to retrieve
            
        Returns:
            TierDefinition or None: The tier definition if found, None otherwise
        """
        return self.tiers.get(tier_id)
    
    def list_tiers(self) -> List[TierDefinition]:
        """
        List all registered tiers.
        
        Returns:
            List[TierDefinition]: List of all registered tier definitions
        """
        return list(self.tiers.values())
    
    def assign_tier(self, assignment: TierAssignment) -> bool:
        """
        Assign a user to a tier.
        
        Args:
            assignment: The tier assignment
            
        Returns:
            bool: True if assignment was successful, False otherwise
        """
        # Validate that the tier exists
        if assignment.tier_id not in self.tiers:
            logger.error(f"Cannot assign user to non-existent tier: {assignment.tier_id}")
            return False
        
        # Store the assignment
        self.assignments[assignment.user_id] = assignment
        logger.info(f"Assigned user {assignment.user_id} to tier {assignment.tier_id}")
        return True
    
    def get_user_tier(self, user_id: str) -> Optional[TierDefinition]:
        """
        Get the tier assigned to a user.
        
        Args:
            user_id: The ID of the user
            
        Returns:
            TierDefinition or None: The user's assigned tier if found, None otherwise
        """
        assignment = self.assignments.get(user_id)
        if not assignment:
            return None
        
        # Check if the assignment has expired
        if assignment.expires_at and assignment.expires_at < datetime.now():
            logger.info(f"User {user_id}'s tier assignment has expired")
            return None
        
        return self.tiers.get(assignment.tier_id)
    
    def check_access(self, user_id: str, endpoint: str, method: str) -> bool:
        """
        Check if a user has access to a specific endpoint.
        
        Args:
            user_id: The ID of the user
            endpoint: The API endpoint
            method: The HTTP method
            
        Returns:
            bool: True if access is allowed, False otherwise
        """
        # Get the user's tier
        tier = self.get_user_tier(user_id)
        if not tier:
            logger.warning(f"User {user_id} has no tier assignment")
            return False
        
        # Check if the user has the required permission
        # This is a simplified permission check - in a real implementation,
        # we would have more sophisticated permission mapping
        required_permission = f"{method.lower()}:{endpoint}"
        
        # Check for exact match or wildcard permissions
        for permission in tier.permissions:
            if permission == "*" or permission == required_permission:
                return True
            
            # Check for path-based wildcards (e.g., "get:/api/*")
            if "*" in permission:
                parts = permission.split(":")
                if len(parts) == 2:
                    perm_method, perm_path = parts
                    if (perm_method == "*" or perm_method.lower() == method.lower()) and \
                       self._match_wildcard_path(perm_path, endpoint):
                        return True
        
        logger.warning(f"User {user_id} does not have permission {required_permission}")
        return False
    
    def _match_wildcard_path(self, pattern: str, path: str) -> bool:
        """
        Match a path against a wildcard pattern.
        
        Args:
            pattern: The wildcard pattern (e.g., "/api/v1/*")
            path: The path to check (e.g., "/api/v1/users")
            
        Returns:
            bool: True if the path matches the pattern, False otherwise
        """
        if pattern == "*":
            return True
        
        if pattern.endswith("*"):
            prefix = pattern[:-1]
            return path.startswith(prefix)
        
        return pattern == path
    
    def track_usage(self, user_id: str, endpoint: str, method: str, 
                   status_code: int, response_time: int,
                   request_size: Optional[int] = None,
                   response_size: Optional[int] = None) -> None:
        """
        Track API usage for quota management.
        
        Args:
            user_id: The ID of the user
            endpoint: The API endpoint
            method: The HTTP method
            status_code: The HTTP status code
            response_time: The response time in milliseconds
            request_size: The size of the request in bytes (optional)
            response_size: The size of the response in bytes (optional)
        """
        record = UsageRecord(
            user_id=user_id,
            endpoint=endpoint,
            method=method,
            timestamp=datetime.now(),
            status_code=status_code,
            response_time=response_time,
            request_size=request_size,
            response_size=response_size
        )
        
        self.usage_records.append(record)
        
        # In a production system, we would persist this record to a database
        # and potentially trigger alerts if quotas are exceeded
        logger.debug(f"Tracked usage: {user_id} {method} {endpoint} {status_code}")
    
    def check_rate_limit(self, user_id: str) -> bool:
        """
        Check if a user has exceeded their rate limit.
        
        Args:
            user_id: The ID of the user
            
        Returns:
            bool: True if the user is within their rate limit, False otherwise
        """
        tier = self.get_user_tier(user_id)
        if not tier:
            return False
        
        # Get the user's recent usage
        now = datetime.now()
        one_minute_ago = now - timedelta(minutes=1)
        one_day_ago = now - timedelta(days=1)
        
        # Count requests in the last minute
        requests_last_minute = sum(
            1 for record in self.usage_records
            if record.user_id == user_id and record.timestamp >= one_minute_ago
        )
        
        if requests_last_minute >= tier.rate_limits.requests_per_minute:
            logger.warning(f"User {user_id} has exceeded their per-minute rate limit")
            return False
        
        # Check daily limit if configured
        if tier.rate_limits.requests_per_day:
            requests_last_day = sum(
                1 for record in self.usage_records
                if record.user_id == user_id and record.timestamp >= one_day_ago
            )
            
            if requests_last_day >= tier.rate_limits.requests_per_day:
                logger.warning(f"User {user_id} has exceeded their daily rate limit")
                return False
        
        return True
    
    def evaluate_progression(self) -> List[ProgressionCandidate]:
        """
        Evaluate users for tier progression based on usage patterns.
        
        Returns:
            List[ProgressionCandidate]: List of users eligible for tier progression
        """
        candidates = []
        
        # Group tiers by progression path (this is a simplified approach)
        # In a real implementation, we would have a more sophisticated tier hierarchy
        tier_progression = {
            "developer_preview": "partner_access",
            "partner_access": "public_beta",
            "public_beta": "general_availability"
        }
        
        # Evaluate each user
        for user_id, assignment in self.assignments.items():
            current_tier_id = assignment.tier_id
            
            # Skip if there's no next tier defined
            if current_tier_id not in tier_progression:
                continue
            
            next_tier_id = tier_progression[current_tier_id]
            
            # Skip if the next tier doesn't exist
            if next_tier_id not in self.tiers:
                continue
            
            current_tier = self.tiers[current_tier_id]
            
            # Skip if no progression criteria defined
            if not current_tier.progression_criteria:
                continue
            
            # Check if the user meets the progression criteria
            criteria_met = {}
            
            # Check days in tier
            if current_tier.progression_criteria.min_days_in_tier:
                days_in_tier = (datetime.now() - assignment.assigned_at).days
                criteria_met["min_days_in_tier"] = days_in_tier >= current_tier.progression_criteria.min_days_in_tier
            
            # Check successful requests
            if current_tier.progression_criteria.min_successful_requests:
                successful_requests = sum(
                    1 for record in self.usage_records
                    if record.user_id == user_id and 200 <= record.status_code < 300
                )
                criteria_met["min_successful_requests"] = successful_requests >= current_tier.progression_criteria.min_successful_requests
            
            # Check error rate
            if current_tier.progression_criteria.max_error_rate is not None:
                total_requests = sum(1 for record in self.usage_records if record.user_id == user_id)
                error_requests = sum(
                    1 for record in self.usage_records
                    if record.user_id == user_id and (record.status_code < 200 or record.status_code >= 300)
                )
                
                error_rate = error_requests / total_requests if total_requests > 0 else 0
                criteria_met["max_error_rate"] = error_rate <= current_tier.progression_criteria.max_error_rate
            
            # If all criteria are met, add to candidates
            if all(criteria_met.values()):
                candidate = ProgressionCandidate(
                    user_id=user_id,
                    current_tier_id=current_tier_id,
                    next_tier_id=next_tier_id,
                    criteria_met=criteria_met,
                    evaluation_timestamp=datetime.now()
                )
                candidates.append(candidate)
        
        return candidates
    
    def get_usage_statistics(self, user_id: Optional[str] = None, 
                           start_time: Optional[datetime] = None,
                           end_time: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Get usage statistics for a user or all users.
        
        Args:
            user_id: The ID of the user (optional, if None, get stats for all users)
            start_time: The start time for the statistics (optional)
            end_time: The end time for the statistics (optional)
            
        Returns:
            Dict: Usage statistics
        """
        # Filter records based on parameters
        filtered_records = self.usage_records
        
        if user_id:
            filtered_records = [r for r in filtered_records if r.user_id == user_id]
        
        if start_time:
            filtered_records = [r for r in filtered_records if r.timestamp >= start_time]
        
        if end_time:
            filtered_records = [r for r in filtered_records if r.timestamp <= end_time]
        
        # Calculate statistics
        total_requests = len(filtered_records)
        
        if total_requests == 0:
            return {
                "total_requests": 0,
                "success_rate": 0,
                "avg_response_time": 0,
                "endpoints": {},
                "status_codes": {}
            }
        
        # Success rate
        successful_requests = sum(1 for r in filtered_records if 200 <= r.status_code < 300)
        success_rate = successful_requests / total_requests
        
        # Average response time
        avg_response_time = sum(r.response_time for r in filtered_records) / total_requests
        
        # Endpoint usage
        endpoints = {}
        for record in filtered_records:
            key = f"{record.method} {record.endpoint}"
            if key not in endpoints:
                endpoints[key] = 0
            endpoints[key] += 1
        
        # Status code distribution
        status_codes = {}
        for record in filtered_records:
            if record.status_code not in status_codes:
                status_codes[record.status_code] = 0
            status_codes[record.status_code] += 1
        
        return {
            "total_requests": total_requests,
            "success_rate": success_rate,
            "avg_response_time": avg_response_time,
            "endpoints": endpoints,
            "status_codes": status_codes
        }
