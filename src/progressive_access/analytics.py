"""
Progressive Access Workflow - Analytics

This module provides analytics functionality for the progressive access workflow,
enabling insights into user progression, quota usage, and system performance.
"""

import logging
from typing import Dict, List, Optional, Any, Union, Set
from datetime import datetime, timedelta
from collections import defaultdict, Counter

from src.access_tier.models import TierDefinition, TierAssignment, UsageRecord
from src.progressive_access.workflow import ProgressionState

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class UsageAnalytics:
    """
    Analytics for usage patterns and metrics.
    
    This class provides functionality for:
    - Analyzing API usage patterns
    - Tracking resource consumption
    - Identifying usage trends
    - Generating usage reports
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the usage analytics.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.analysis_window_days = self.config.get('analysis_window_days', 30)
        self.usage_records = []
        
        logger.info("Initialized usage analytics")
    
    def track_usage(self, user_id: str, resource_id: str, 
                   action: str, quantity: int = 1,
                   metadata: Dict[str, Any] = None) -> None:
        """
        Track resource usage.
        
        Args:
            user_id: The ID of the user
            resource_id: The ID of the resource
            action: The action performed
            quantity: The quantity consumed
            metadata: Additional metadata
        """
        record = {
            "user_id": user_id,
            "resource_id": resource_id,
            "action": action,
            "quantity": quantity,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        self.usage_records.append(record)
        
        # Log usage
        logger.debug(f"Tracked usage: {user_id} {action} {resource_id} ({quantity})")
    
    def get_usage_by_user(self, user_id: str, 
                         start_time: Optional[datetime] = None,
                         end_time: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Get usage statistics for a specific user.
        
        Args:
            user_id: The ID of the user
            start_time: Start time for filtering records
            end_time: End time for filtering records
            
        Returns:
            Dict: Usage statistics
        """
        # Default time range if not specified
        if not start_time:
            start_time = datetime.now() - timedelta(days=self.analysis_window_days)
        if not end_time:
            end_time = datetime.now()
        
        # Filter records for the user and time range
        filtered_records = [
            r for r in self.usage_records
            if r["user_id"] == user_id and
               start_time <= datetime.fromisoformat(r["timestamp"]) <= end_time
        ]
        
        # Aggregate by resource and action
        resource_usage = defaultdict(lambda: defaultdict(int))
        for record in filtered_records:
            resource_id = record["resource_id"]
            action = record["action"]
            quantity = record["quantity"]
            
            resource_usage[resource_id][action] += quantity
        
        # Calculate total usage
        total_usage = sum(
            sum(actions.values())
            for actions in resource_usage.values()
        )
        
        # Create usage statistics
        stats = {
            "user_id": user_id,
            "period": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat()
            },
            "total_usage": total_usage,
            "resource_usage": dict(resource_usage),
            "record_count": len(filtered_records)
        }
        
        return stats
    
    def get_usage_by_resource(self, resource_id: str,
                            start_time: Optional[datetime] = None,
                            end_time: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Get usage statistics for a specific resource.
        
        Args:
            resource_id: The ID of the resource
            start_time: Start time for filtering records
            end_time: End time for filtering records
            
        Returns:
            Dict: Usage statistics
        """
        # Default time range if not specified
        if not start_time:
            start_time = datetime.now() - timedelta(days=self.analysis_window_days)
        if not end_time:
            end_time = datetime.now()
        
        # Filter records for the resource and time range
        filtered_records = [
            r for r in self.usage_records
            if r["resource_id"] == resource_id and
               start_time <= datetime.fromisoformat(r["timestamp"]) <= end_time
        ]
        
        # Aggregate by user and action
        user_usage = defaultdict(lambda: defaultdict(int))
        for record in filtered_records:
            user_id = record["user_id"]
            action = record["action"]
            quantity = record["quantity"]
            
            user_usage[user_id][action] += quantity
        
        # Calculate total usage
        total_usage = sum(
            sum(actions.values())
            for actions in user_usage.values()
        )
        
        # Create usage statistics
        stats = {
            "resource_id": resource_id,
            "period": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat()
            },
            "total_usage": total_usage,
            "user_usage": dict(user_usage),
            "user_count": len(user_usage),
            "record_count": len(filtered_records)
        }
        
        return stats
    
    def generate_usage_report(self, 
                            start_time: Optional[datetime] = None,
                            end_time: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Generate a comprehensive usage report.
        
        Args:
            start_time: Start time for filtering records
            end_time: End time for filtering records
            
        Returns:
            Dict: Usage report
        """
        # Default time range if not specified
        if not start_time:
            start_time = datetime.now() - timedelta(days=self.analysis_window_days)
        if not end_time:
            end_time = datetime.now()
        
        # Filter records for the time range
        filtered_records = [
            r for r in self.usage_records
            if start_time <= datetime.fromisoformat(r["timestamp"]) <= end_time
        ]
        
        # Aggregate by user, resource, and action
        user_usage = defaultdict(int)
        resource_usage = defaultdict(int)
        action_usage = defaultdict(int)
        
        for record in filtered_records:
            user_id = record["user_id"]
            resource_id = record["resource_id"]
            action = record["action"]
            quantity = record["quantity"]
            
            user_usage[user_id] += quantity
            resource_usage[resource_id] += quantity
            action_usage[action] += quantity
        
        # Calculate total usage
        total_usage = sum(user_usage.values())
        
        # Find top users and resources
        top_users = sorted(
            [(user_id, usage) for user_id, usage in user_usage.items()],
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        top_resources = sorted(
            [(resource_id, usage) for resource_id, usage in resource_usage.items()],
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        # Create usage report
        report = {
            "generated_at": datetime.now().isoformat(),
            "period": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat()
            },
            "summary": {
                "total_usage": total_usage,
                "user_count": len(user_usage),
                "resource_count": len(resource_usage),
                "action_count": len(action_usage),
                "record_count": len(filtered_records)
            },
            "top_users": dict(top_users),
            "top_resources": dict(top_resources),
            "action_breakdown": dict(action_usage)
        }
        
        return report
    
    def analyze_usage_trends(self,
                           start_time: Optional[datetime] = None,
                           end_time: Optional[datetime] = None,
                           interval_days: int = 1) -> Dict[str, Any]:
        """
        Analyze usage trends over time.
        
        Args:
            start_time: Start time for filtering records
            end_time: End time for filtering records
            interval_days: Interval in days for trend analysis
            
        Returns:
            Dict: Usage trend analysis
        """
        # Default time range if not specified
        if not start_time:
            start_time = datetime.now() - timedelta(days=self.analysis_window_days)
        if not end_time:
            end_time = datetime.now()
        
        # Filter records for the time range
        filtered_records = [
            r for r in self.usage_records
            if start_time <= datetime.fromisoformat(r["timestamp"]) <= end_time
        ]
        
        # Create time intervals
        intervals = []
        current_time = start_time
        while current_time < end_time:
            next_time = current_time + timedelta(days=interval_days)
            intervals.append((current_time, next_time))
            current_time = next_time
        
        # Aggregate usage by interval
        interval_usage = []
        
        for interval_start, interval_end in intervals:
            # Filter records for this interval
            interval_records = [
                r for r in filtered_records
                if interval_start <= datetime.fromisoformat(r["timestamp"]) < interval_end
            ]
            
            # Calculate total usage for this interval
            total_usage = sum(r["quantity"] for r in interval_records)
            
            # Count unique users and resources
            unique_users = set(r["user_id"] for r in interval_records)
            unique_resources = set(r["resource_id"] for r in interval_records)
            
            interval_usage.append({
                "interval_start": interval_start.isoformat(),
                "interval_end": interval_end.isoformat(),
                "total_usage": total_usage,
                "record_count": len(interval_records),
                "user_count": len(unique_users),
                "resource_count": len(unique_resources)
            })
        
        # Create trend analysis
        trends = {
            "generated_at": datetime.now().isoformat(),
            "period": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat()
            },
            "interval_days": interval_days,
            "intervals": interval_usage
        }
        
        return trends


class ProgressionAnalytics:
    """
    Analytics for the progressive access workflow.
    
    This class provides functionality for:
    - Analyzing progression patterns
    - Generating insights on tier transitions
    - Identifying bottlenecks in the progression workflow
    - Tracking quota utilization patterns
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the progression analytics.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.analysis_window_days = self.config.get('analysis_window_days', 90)
        
        logger.info("Initialized progression analytics")
    
    def analyze_progression_funnel(self, workflow_history: Dict[str, List[Dict[str, Any]]],
                                 tiers: Dict[str, TierDefinition]) -> Dict[str, Any]:
        """
        Analyze the progression funnel across tiers.
        
        Args:
            workflow_history: Progression workflow history
            tiers: Dictionary of tier definitions
            
        Returns:
            Dict: Progression funnel analysis
        """
        # Count users in each state for each tier
        state_counts = defaultdict(lambda: defaultdict(int))
        
        # Track the latest state for each user-tier combination
        latest_states = {}
        
        # Process all history entries
        for key, entries in workflow_history.items():
            if not entries:
                continue
            
            # Parse user_id and tier_id from key
            parts = key.split(':')
            if len(parts) != 2:
                continue
            
            user_id, tier_id = parts
            
            # Find the latest entry
            latest_entry = max(entries, key=lambda e: e.get("timestamp", ""))
            
            # Store the latest state
            latest_states[key] = latest_entry.get("to_state")
            
            # Count the state
            state_counts[tier_id][latest_entry.get("to_state", "unknown")] += 1
        
        # Create funnel analysis
        funnel = {
            "generated_at": datetime.now().isoformat(),
            "tiers": {},
            "overall": {
                "total_users": len(set(key.split(':')[0] for key in latest_states.keys())),
                "state_counts": dict(Counter(latest_states.values()))
            }
        }
        
        # Add tier-specific analysis
        for tier_id, tier in tiers.items():
            tier_states = state_counts.get(tier_id, {})
            
            funnel["tiers"][tier_id] = {
                "name": tier.name,
                "state_counts": dict(tier_states),
                "total_users": sum(tier_states.values()),
                "conversion_rate": self._calculate_conversion_rate(tier_states)
            }
        
        return funnel
    
    def analyze_progression_velocity(self, workflow_history: Dict[str, List[Dict[str, Any]]],
                                   assignments: Dict[str, TierAssignment]) -> Dict[str, Any]:
        """
        Analyze the velocity of progression through tiers.
        
        Args:
            workflow_history: Progression workflow history
            assignments: Dictionary of user assignments
            
        Returns:
            Dict: Progression velocity analysis
        """
        # Track time spent in each state by tier
        state_durations = defaultdict(lambda: defaultdict(list))
        
        # Track time to complete progression by tier
        completion_times = defaultdict(list)
        
        # Process all history entries
        for key, entries in workflow_history.items():
            if len(entries) < 2:
                continue
            
            # Parse user_id and tier_id from key
            parts = key.split(':')
            if len(parts) != 2:
                continue
            
            user_id, tier_id = parts
            
            # Sort entries by timestamp
            sorted_entries = sorted(entries, key=lambda e: e.get("timestamp", ""))
            
            # Calculate durations between state changes
            for i in range(len(sorted_entries) - 1):
                from_entry = sorted_entries[i]
                to_entry = sorted_entries[i + 1]
                
                from_state = from_entry.get("to_state")
                to_state = to_entry.get("to_state")
                
                if not from_state or not to_state:
                    continue
                
                # Parse timestamps
                try:
                    from_time = datetime.fromisoformat(from_entry.get("timestamp"))
                    to_time = datetime.fromisoformat(to_entry.get("timestamp"))
                    
                    # Calculate duration in days
                    duration_days = (to_time - from_time).total_seconds() / 86400
                    
                    # Add to state durations
                    state_durations[tier_id][from_state].append(duration_days)
                    
                    # Check if this is a completion
                    if to_state == ProgressionState.COMPLETED.value:
                        # Find the initial state (should be INITIAL or ELIGIBLE)
                        initial_entry = sorted_entries[0]
                        initial_state = initial_entry.get("from_state")
                        
                        if initial_state in [ProgressionState.INITIAL.value, ProgressionState.ELIGIBLE.value]:
                            try:
                                initial_time = datetime.fromisoformat(initial_entry.get("timestamp"))
                                total_days = (to_time - initial_time).total_seconds() / 86400
                                completion_times[tier_id].append(total_days)
                            except (ValueError, TypeError):
                                pass
                except (ValueError, TypeError):
                    continue
        
        # Calculate average durations
        avg_durations = {}
        for tier_id, states in state_durations.items():
            avg_durations[tier_id] = {}
            for state, durations in states.items():
                if durations:
                    avg_durations[tier_id][state] = sum(durations) / len(durations)
        
        # Calculate average completion times
        avg_completion = {}
        for tier_id, times in completion_times.items():
            if times:
                avg_completion[tier_id] = sum(times) / len(times)
        
        # Create velocity analysis
        velocity = {
            "generated_at": datetime.now().isoformat(),
            "average_state_durations": avg_durations,
            "average_completion_times": avg_completion
        }
        
        return velocity
    
    def analyze_quota_utilization(self, quota_usage: Dict[str, Dict[str, int]],
                                tiers: Dict[str, TierDefinition],
                                assignments: Dict[str, TierAssignment]) -> Dict[str, Any]:
        """
        Analyze quota utilization patterns.
        
        Args:
            quota_usage: Dictionary of quota usage by user and type
            tiers: Dictionary of tier definitions
            assignments: Dictionary of user assignments
            
        Returns:
            Dict: Quota utilization analysis
        """
        # Group users by tier
        users_by_tier = defaultdict(list)
        for user_id, assignment in assignments.items():
            users_by_tier[assignment.tier_id].append(user_id)
        
        # Calculate utilization by tier and quota type
        utilization_by_tier = {}
        
        for tier_id, tier in tiers.items():
            if not tier.quotas:
                continue
            
            tier_users = users_by_tier.get(tier_id, [])
            if not tier_users:
                continue
            
            utilization_by_tier[tier_id] = {
                "name": tier.name,
                "user_count": len(tier_users),
                "quota_types": {}
            }
            
            for quota_type, limit in tier.quotas.items():
                # Collect usage for all users in this tier
                usages = []
                for user_id in tier_users:
                    if user_id in quota_usage and quota_type in quota_usage[user_id]:
                        usages.append(quota_usage[user_id][quota_type])
                
                if not usages:
                    continue
                
                # Calculate statistics
                avg_usage = sum(usages) / len(usages)
                max_usage = max(usages)
                utilization_rate = avg_usage / limit if limit > 0 else 0
                
                # Count users in different utilization brackets
                low_count = sum(1 for u in usages if u < limit * 0.25)
                medium_count = sum(1 for u in usages if limit * 0.25 <= u < limit * 0.75)
                high_count = sum(1 for u in usages if limit * 0.75 <= u < limit)
                over_count = sum(1 for u in usages if u >= limit)
                
                utilization_by_tier[tier_id]["quota_types"][quota_type] = {
                    "limit": limit,
                    "average_usage": avg_usage,
                    "max_usage": max_usage,
                    "average_utilization_rate": utilization_rate,
                    "utilization_brackets": {
                        "low": low_count,
                        "medium": medium_count,
                        "high": high_count,
                        "over": over_count
                    }
                }
        
        # Create utilization analysis
        utilization = {
            "generated_at": datetime.now().isoformat(),
            "by_tier": utilization_by_tier
        }
        
        return utilization
    
    def identify_progression_bottlenecks(self, workflow_history: Dict[str, List[Dict[str, Any]]],
                                       candidates: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Identify bottlenecks in the progression workflow.
        
        Args:
            workflow_history: Progression workflow history
            candidates: List of progression candidates with criteria results
            
        Returns:
            Dict: Bottleneck analysis
        """
        # Count failed criteria by tier
        failed_criteria = defaultdict(lambda: defaultdict(int))
        
        # Process candidates
        for candidate in candidates:
            if not candidate.get("eligible", True):
                tier_id = candidate.get("current_tier_id")
                criteria_met = candidate.get("criteria_met", {})
                
                for criterion, met in criteria_met.items():
                    if not met:
                        failed_criteria[tier_id][criterion] += 1
        
        # Count long-pending approvals
        pending_approvals = defaultdict(list)
        long_pending_threshold = timedelta(days=7)
        
        for key, entries in workflow_history.items():
            # Parse user_id and tier_id from key
            parts = key.split(':')
            if len(parts) != 2:
                continue
            
            user_id, tier_id = parts
            
            # Find entries with PENDING_APPROVAL state
            pending_entries = [
                e for e in entries
                if e.get("to_state") == ProgressionState.PENDING_APPROVAL.value
            ]
            
            if not pending_entries:
                continue
            
            # Find the latest pending entry
            latest_pending = max(pending_entries, key=lambda e: e.get("timestamp", ""))
            
            # Check if there's a later state change
            later_entries = [
                e for e in entries
                if e.get("timestamp", "") > latest_pending.get("timestamp", "")
            ]
            
            if not later_entries:
                # Still pending, calculate duration
                try:
                    pending_time = datetime.fromisoformat(latest_pending.get("timestamp"))
                    duration = datetime.now() - pending_time
                    
                    pending_approvals[tier_id].append({
                        "user_id": user_id,
                        "pending_since": pending_time.isoformat(),
                        "days_pending": duration.total_seconds() / 86400
                    })
                except (ValueError, TypeError):
                    pass
        
        # Create bottleneck analysis
        bottlenecks = {
            "generated_at": datetime.now().isoformat(),
            "failed_criteria": dict(failed_criteria),
            "pending_approvals": {
                tier_id: {
                    "count": len(approvals),
                    "average_days_pending": sum(a["days_pending"] for a in approvals) / len(approvals) if approvals else 0,
                    "long_pending_count": sum(1 for a in approvals if a["days_pending"] > long_pending_threshold.total_seconds() / 86400)
                }
                for tier_id, approvals in pending_approvals.items()
            }
        }
        
        return bottlenecks
    
    def _calculate_conversion_rate(self, state_counts: Dict[str, int]) -> float:
        """
        Calculate the conversion rate from eligible to completed.
        
        Args:
            state_counts: Counts of users in each state
            
        Returns:
            float: Conversion rate as a percentage
        """
        eligible_count = state_counts.get(ProgressionState.ELIGIBLE.value, 0)
        pending_count = state_counts.get(ProgressionState.PENDING_APPROVAL.value, 0)
        approved_count = state_counts.get(ProgressionState.APPROVED.value, 0)
        completed_count = state_counts.get(ProgressionState.COMPLETED.value, 0)
        
        # Calculate conversion rate
        total_in_pipeline = eligible_count + pending_count + approved_count + completed_count
        
        if total_in_pipeline > 0:
            return (completed_count / total_in_pipeline) * 100
        
        return 0.0
