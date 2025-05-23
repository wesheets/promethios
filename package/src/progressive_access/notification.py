"""
Progressive Access Workflow - Notification System

This module implements the notification system for the progressive access workflow,
enabling communication with users about tier changes, quota usage, and other events.
"""

import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NotificationService:
    """
    Notification service for the progressive access workflow.
    
    This class provides functionality for:
    - Sending tier progression notifications
    - Alerting users about quota usage
    - Notifying administrators about approval requests
    - Tracking notification history
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the notification service.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.notification_channels = self.config.get('notification_channels', ['email'])
        self.admin_emails = self.config.get('admin_emails', [])
        self.notification_templates = self.config.get('notification_templates', {})
        self.enabled = self.config.get('enabled', True)
        
        # Store notification history
        self.notification_history = []
        
        logger.info(f"Initialized notification service with channels: {', '.join(self.notification_channels)}")
    
    def notify_tier_progression(self, user_id: str, user_email: str, 
                              current_tier_name: str, next_tier_name: str,
                              status: str) -> Dict[str, Any]:
        """
        Send a notification about tier progression.
        
        Args:
            user_id: The ID of the user
            user_email: The email of the user
            current_tier_name: The name of the current tier
            next_tier_name: The name of the next tier
            status: The status of the progression (eligible, approved, rejected, completed)
            
        Returns:
            Dict: Notification result
        """
        if not self.enabled:
            return {"sent": False, "reason": "notifications disabled"}
        
        # Create notification content
        subject = f"API Access Tier Progression {status.capitalize()}"
        
        if status == "eligible":
            message = f"You are now eligible to progress from {current_tier_name} to {next_tier_name}. "
            message += "Please visit the developer portal to request this upgrade."
        elif status == "approved":
            message = f"Your progression from {current_tier_name} to {next_tier_name} has been approved. "
            message += "Your account will be upgraded shortly."
        elif status == "rejected":
            message = f"Your progression from {current_tier_name} to {next_tier_name} has been rejected. "
            message += "Please contact support for more information."
        elif status == "completed":
            message = f"Your account has been successfully upgraded from {current_tier_name} to {next_tier_name}. "
            message += "You now have access to additional API features and higher rate limits."
        else:
            message = f"There has been an update to your progression from {current_tier_name} to {next_tier_name}. "
            message += "Please visit the developer portal for more information."
        
        # Send notification
        notification = {
            "recipient_id": user_id,
            "recipient_email": user_email,
            "subject": subject,
            "message": message,
            "type": "tier_progression",
            "status": status,
            "timestamp": datetime.now().isoformat()
        }
        
        result = self._send_notification(notification)
        
        # Record in history
        self._record_notification(notification, result)
        
        return result
    
    def notify_quota_usage(self, user_id: str, user_email: str,
                         quota_type: str, current_usage: int,
                         quota_limit: int, percentage: float) -> Dict[str, Any]:
        """
        Send a notification about quota usage.
        
        Args:
            user_id: The ID of the user
            user_email: The email of the user
            quota_type: The type of quota
            current_usage: The current usage
            quota_limit: The quota limit
            percentage: The percentage of quota used
            
        Returns:
            Dict: Notification result
        """
        if not self.enabled:
            return {"sent": False, "reason": "notifications disabled"}
        
        # Create notification content
        subject = f"API Quota Usage Alert: {percentage:.1f}% of {quota_type} Used"
        
        message = f"You have used {current_usage} out of {quota_limit} {quota_type} ({percentage:.1f}%). "
        
        if percentage >= 90:
            message += "You are approaching your quota limit. Consider upgrading your tier or reducing usage."
        elif percentage >= 75:
            message += "You are nearing your quota limit. Please monitor your usage carefully."
        else:
            message += "This is a courtesy notification about your current usage."
        
        # Send notification
        notification = {
            "recipient_id": user_id,
            "recipient_email": user_email,
            "subject": subject,
            "message": message,
            "type": "quota_usage",
            "quota_type": quota_type,
            "percentage": percentage,
            "timestamp": datetime.now().isoformat()
        }
        
        result = self._send_notification(notification)
        
        # Record in history
        self._record_notification(notification, result)
        
        return result
    
    def notify_admin_approval_needed(self, user_id: str, user_email: str,
                                   current_tier_name: str, next_tier_name: str,
                                   user_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send a notification to administrators about an approval request.
        
        Args:
            user_id: The ID of the user
            user_email: The email of the user
            current_tier_name: The name of the current tier
            next_tier_name: The name of the next tier
            user_metrics: Metrics about the user's usage
            
        Returns:
            Dict: Notification result
        """
        if not self.enabled:
            return {"sent": False, "reason": "notifications disabled"}
        
        if not self.admin_emails:
            return {"sent": False, "reason": "no admin emails configured"}
        
        # Create notification content
        subject = f"API Tier Progression Approval Needed: {user_id}"
        
        message = f"User {user_id} ({user_email}) is eligible to progress from {current_tier_name} to {next_tier_name}.\n\n"
        message += "User Metrics:\n"
        
        for metric, value in user_metrics.items():
            if isinstance(value, dict):
                message += f"- {metric}:\n"
                for sub_metric, sub_value in value.items():
                    message += f"  - {sub_metric}: {sub_value}\n"
            else:
                message += f"- {metric}: {value}\n"
        
        message += "\nPlease visit the admin portal to approve or reject this request."
        
        # Send notification to all admins
        results = []
        for admin_email in self.admin_emails:
            notification = {
                "recipient_id": "admin",
                "recipient_email": admin_email,
                "subject": subject,
                "message": message,
                "type": "admin_approval",
                "user_id": user_id,
                "timestamp": datetime.now().isoformat()
            }
            
            result = self._send_notification(notification)
            results.append(result)
            
            # Record in history
            self._record_notification(notification, result)
        
        # Return combined result
        return {
            "sent": any(r.get("sent", False) for r in results),
            "recipients": len(results),
            "successful": sum(1 for r in results if r.get("sent", False))
        }
    
    def get_notification_history(self, user_id: Optional[str] = None, 
                               notification_type: Optional[str] = None,
                               start_date: Optional[datetime] = None,
                               end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Get notification history.
        
        Args:
            user_id: Filter by user ID (optional)
            notification_type: Filter by notification type (optional)
            start_date: Filter by start date (optional)
            end_date: Filter by end date (optional)
            
        Returns:
            List[Dict]: List of notifications
        """
        filtered_history = self.notification_history
        
        # Apply filters
        if user_id:
            filtered_history = [
                n for n in filtered_history
                if n.get("notification", {}).get("recipient_id") == user_id
            ]
        
        if notification_type:
            filtered_history = [
                n for n in filtered_history
                if n.get("notification", {}).get("type") == notification_type
            ]
        
        if start_date:
            filtered_history = [
                n for n in filtered_history
                if self._parse_timestamp(n.get("notification", {}).get("timestamp")) >= start_date
            ]
        
        if end_date:
            filtered_history = [
                n for n in filtered_history
                if self._parse_timestamp(n.get("notification", {}).get("timestamp")) <= end_date
            ]
        
        return filtered_history
    
    def _send_notification(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send a notification through configured channels.
        
        Args:
            notification: The notification to send
            
        Returns:
            Dict: Notification result
        """
        # In a real implementation, this would send through actual channels
        # For now, just log the notification
        
        recipient = notification.get("recipient_email", "unknown")
        subject = notification.get("subject", "Notification")
        
        logger.info(f"Sending notification to {recipient}: {subject}")
        
        # Simulate sending through channels
        results = {}
        for channel in self.notification_channels:
            if channel == "email":
                # Simulate email sending
                results[channel] = {"sent": True, "message_id": f"email_{datetime.now().timestamp()}"}
            elif channel == "sms":
                # Simulate SMS sending
                results[channel] = {"sent": True, "message_id": f"sms_{datetime.now().timestamp()}"}
            elif channel == "webhook":
                # Simulate webhook
                results[channel] = {"sent": True, "status_code": 200}
            else:
                results[channel] = {"sent": False, "error": "Unsupported channel"}
        
        return {
            "sent": any(r.get("sent", False) for r in results.values()),
            "channels": results,
            "timestamp": datetime.now().isoformat()
        }
    
    def _record_notification(self, notification: Dict[str, Any], result: Dict[str, Any]) -> None:
        """
        Record a notification in the history.
        
        Args:
            notification: The notification that was sent
            result: The result of sending the notification
        """
        self.notification_history.append({
            "notification": notification,
            "result": result
        })
    
    def _parse_timestamp(self, timestamp: Optional[str]) -> Optional[datetime]:
        """
        Parse a timestamp string to a datetime object.
        
        Args:
            timestamp: The timestamp string
            
        Returns:
            datetime: The parsed datetime, or None if parsing fails
        """
        if not timestamp:
            return None
        
        try:
            return datetime.fromisoformat(timestamp)
        except (ValueError, TypeError):
            return None


# For backward compatibility, keep the original NotificationSystem class
# but make it an alias of NotificationService
NotificationSystem = NotificationService
