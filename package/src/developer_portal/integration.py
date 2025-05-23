"""
Developer Experience Portal - Integration Module

This module implements the integration between the Developer Experience Portal
and other components of the system, such as the Access Tier Management System,
API Gateway, and Progressive Access Workflow.
"""

import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

from src.access_tier.access_tier_manager import AccessTierManager
from src.api_gateway.connector import ApiGatewayConnector
from src.progressive_access.workflow import ProgressionWorkflow
from src.progressive_access.quota_manager import QuotaManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PortalIntegration:
    """
    Integration module for the Developer Experience Portal.
    
    This class provides functionality for:
    - Connecting the portal with the access tier management system
    - Integrating with the API gateway
    - Interfacing with the progressive access workflow
    - Providing a unified interface for portal components
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the portal integration.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.enable_access_tier = self.config.get('enable_access_tier', True)
        self.enable_api_gateway = self.config.get('enable_api_gateway', True)
        self.enable_progressive_access = self.config.get('enable_progressive_access', True)
        
        # Initialize components
        self.access_tier_manager = None
        self.api_gateway_connector = None
        self.progression_workflow = None
        self.quota_manager = None
        
        if self.enable_access_tier:
            self._init_access_tier_manager()
        
        if self.enable_api_gateway:
            self._init_api_gateway_connector()
        
        if self.enable_progressive_access:
            self._init_progressive_access()
        
        logger.info("Initialized portal integration")
    
    def _init_access_tier_manager(self) -> None:
        """Initialize the access tier manager."""
        try:
            access_tier_config = self.config.get('access_tier_config', {})
            self.access_tier_manager = AccessTierManager(access_tier_config)
            logger.info("Initialized access tier manager")
        except Exception as e:
            logger.error(f"Error initializing access tier manager: {str(e)}")
    
    def _init_api_gateway_connector(self) -> None:
        """Initialize the API gateway connector."""
        try:
            api_gateway_config = self.config.get('api_gateway_config', {})
            self.api_gateway_connector = ApiGatewayConnector(api_gateway_config)
            logger.info("Initialized API gateway connector")
        except Exception as e:
            logger.error(f"Error initializing API gateway connector: {str(e)}")
    
    def _init_progressive_access(self) -> None:
        """Initialize the progressive access components."""
        try:
            progressive_access_config = self.config.get('progressive_access_config', {})
            self.progression_workflow = ProgressionWorkflow(progressive_access_config)
            self.quota_manager = QuotaManager(progressive_access_config.get('quota_config', {}))
            logger.info("Initialized progressive access components")
        except Exception as e:
            logger.error(f"Error initializing progressive access components: {str(e)}")
    
    def get_user_tier(self, user_id: str) -> Dict[str, Any]:
        """
        Get a user's access tier.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict: User's tier information
        """
        if not self.access_tier_manager:
            return {"error": "Access tier management not enabled"}
        
        try:
            tier_assignment = self.access_tier_manager.get_user_tier_assignment(user_id)
            
            if not tier_assignment:
                return {
                    "user_id": user_id,
                    "has_tier": False
                }
            
            tier_id = tier_assignment.tier_id
            tier = self.access_tier_manager.get_tier_definition(tier_id)
            
            if not tier:
                return {
                    "user_id": user_id,
                    "has_tier": True,
                    "tier_id": tier_id,
                    "tier_details": None
                }
            
            return {
                "user_id": user_id,
                "has_tier": True,
                "tier_id": tier_id,
                "tier_name": tier.name,
                "tier_description": tier.description,
                "permissions": tier.permissions,
                "quotas": tier.quotas,
                "assigned_at": tier_assignment.assigned_at
            }
        except Exception as e:
            logger.error(f"Error getting user tier: {str(e)}")
            return {"error": str(e)}
    
    def get_available_tiers(self) -> List[Dict[str, Any]]:
        """
        Get all available access tiers.
        
        Returns:
            List: Available tiers
        """
        if not self.access_tier_manager:
            return [{"error": "Access tier management not enabled"}]
        
        try:
            tiers = self.access_tier_manager.get_all_tiers()
            
            return [
                {
                    "id": tier.id,
                    "name": tier.name,
                    "description": tier.description,
                    "permissions": tier.permissions,
                    "quotas": tier.quotas
                }
                for tier in tiers
            ]
        except Exception as e:
            logger.error(f"Error getting available tiers: {str(e)}")
            return [{"error": str(e)}]
    
    def check_progression_eligibility(self, user_id: str) -> Dict[str, Any]:
        """
        Check if a user is eligible for tier progression.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict: Progression eligibility information
        """
        if not self.progression_workflow or not self.access_tier_manager:
            return {"error": "Progressive access or access tier management not enabled"}
        
        try:
            # Get user's current tier
            tier_assignment = self.access_tier_manager.get_user_tier_assignment(user_id)
            
            if not tier_assignment:
                return {
                    "user_id": user_id,
                    "eligible": False,
                    "reason": "No tier assignment"
                }
            
            current_tier_id = tier_assignment.tier_id
            current_tier = self.access_tier_manager.get_tier_definition(current_tier_id)
            
            if not current_tier:
                return {
                    "user_id": user_id,
                    "eligible": False,
                    "reason": "Invalid tier assignment"
                }
            
            # Get next tier
            next_tier_id = self.progression_workflow.get_next_tier_id(current_tier_id)
            
            if not next_tier_id:
                return {
                    "user_id": user_id,
                    "eligible": False,
                    "reason": "No next tier available",
                    "current_tier": {
                        "id": current_tier_id,
                        "name": current_tier.name
                    }
                }
            
            next_tier = self.access_tier_manager.get_tier_definition(next_tier_id)
            
            if not next_tier:
                return {
                    "user_id": user_id,
                    "eligible": False,
                    "reason": "Invalid next tier",
                    "current_tier": {
                        "id": current_tier_id,
                        "name": current_tier.name
                    }
                }
            
            # Get user's usage records
            usage_records = self.access_tier_manager.get_user_usage_records(user_id)
            
            # Check eligibility
            criteria_evaluator = self.progression_workflow.get_criteria_evaluator()
            candidate = criteria_evaluator.evaluate_user(
                user_id=user_id,
                current_tier=current_tier,
                next_tier=next_tier,
                assignment=tier_assignment,
                usage_records=usage_records
            )
            
            # Get detailed metrics
            metrics = criteria_evaluator.get_progression_metrics(
                user_id=user_id,
                current_tier=current_tier,
                assignment=tier_assignment,
                usage_records=usage_records
            )
            
            return {
                "user_id": user_id,
                "eligible": candidate.eligible,
                "current_tier": {
                    "id": current_tier_id,
                    "name": current_tier.name
                },
                "next_tier": {
                    "id": next_tier_id,
                    "name": next_tier.name
                },
                "criteria_met": candidate.criteria_met,
                "metrics": metrics
            }
        except Exception as e:
            logger.error(f"Error checking progression eligibility: {str(e)}")
            return {"error": str(e)}
    
    def request_tier_progression(self, user_id: str) -> Dict[str, Any]:
        """
        Request tier progression for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict: Progression request result
        """
        if not self.progression_workflow or not self.access_tier_manager:
            return {"error": "Progressive access or access tier management not enabled"}
        
        try:
            # Check eligibility first
            eligibility = self.check_progression_eligibility(user_id)
            
            if "error" in eligibility:
                return eligibility
            
            if not eligibility.get("eligible", False):
                return {
                    "user_id": user_id,
                    "success": False,
                    "reason": "Not eligible for progression",
                    "eligibility": eligibility
                }
            
            # Request progression
            current_tier_id = eligibility["current_tier"]["id"]
            next_tier_id = eligibility["next_tier"]["id"]
            
            result = self.progression_workflow.request_progression(
                user_id=user_id,
                current_tier_id=current_tier_id,
                next_tier_id=next_tier_id
            )
            
            return {
                "user_id": user_id,
                "success": result.get("success", False),
                "current_tier": eligibility["current_tier"],
                "next_tier": eligibility["next_tier"],
                "status": result.get("status"),
                "request_id": result.get("request_id")
            }
        except Exception as e:
            logger.error(f"Error requesting tier progression: {str(e)}")
            return {"error": str(e)}
    
    def get_quota_status(self, user_id: str) -> Dict[str, Any]:
        """
        Get a user's quota status.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict: Quota status information
        """
        if not self.quota_manager or not self.access_tier_manager:
            return {"error": "Quota management or access tier management not enabled"}
        
        try:
            # Get user's current tier
            tier_assignment = self.access_tier_manager.get_user_tier_assignment(user_id)
            
            if not tier_assignment:
                return {
                    "user_id": user_id,
                    "has_quotas": False,
                    "reason": "No tier assignment"
                }
            
            current_tier_id = tier_assignment.tier_id
            current_tier = self.access_tier_manager.get_tier_definition(current_tier_id)
            
            if not current_tier:
                return {
                    "user_id": user_id,
                    "has_quotas": False,
                    "reason": "Invalid tier assignment"
                }
            
            # Get quota status
            quota_status = self.quota_manager.get_quota_status(user_id, current_tier)
            
            return quota_status
        except Exception as e:
            logger.error(f"Error getting quota status: {str(e)}")
            return {"error": str(e)}
    
    def get_api_key(self, user_id: str) -> Dict[str, Any]:
        """
        Get or generate an API key for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict: API key information
        """
        if not self.api_gateway_connector:
            return {"error": "API gateway integration not enabled"}
        
        try:
            # Get user's current tier
            if self.access_tier_manager:
                tier_assignment = self.access_tier_manager.get_user_tier_assignment(user_id)
                tier_id = tier_assignment.tier_id if tier_assignment else None
            else:
                tier_id = None
            
            # Get or generate API key
            api_key_info = self.api_gateway_connector.get_or_create_api_key(user_id, tier_id)
            
            return {
                "user_id": user_id,
                "api_key": api_key_info.get("api_key"),
                "created_at": api_key_info.get("created_at"),
                "expires_at": api_key_info.get("expires_at"),
                "tier_id": tier_id
            }
        except Exception as e:
            logger.error(f"Error getting API key: {str(e)}")
            return {"error": str(e)}
    
    def revoke_api_key(self, user_id: str, api_key: str) -> Dict[str, Any]:
        """
        Revoke an API key.
        
        Args:
            user_id: User ID
            api_key: API key to revoke
            
        Returns:
            Dict: Revocation result
        """
        if not self.api_gateway_connector:
            return {"error": "API gateway integration not enabled"}
        
        try:
            result = self.api_gateway_connector.revoke_api_key(user_id, api_key)
            
            return {
                "user_id": user_id,
                "success": result.get("success", False),
                "revoked_at": result.get("revoked_at")
            }
        except Exception as e:
            logger.error(f"Error revoking API key: {str(e)}")
            return {"error": str(e)}


# For backward compatibility, create an alias for IntegrationManager
IntegrationManager = PortalIntegration
