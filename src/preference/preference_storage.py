"""
Preference Storage Component (Part of EXT-CORE-001)

This module implements the Preference Storage component of the
Preference Data Collection Framework extension.

Extension ID: EXT-CORE-001
Extension Type: CORE
Governance Inheritance: Trust Scoring, Memory Logging, Reflection Capability, Override Awareness
Trust Impact: Medium
"""

import logging
import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional

from core.governance_inheritance import ExtensionBase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PreferenceStorage(ExtensionBase):
    """
    Component for storing and retrieving user preferences.
    """
    
    def __init__(self):
        """Initialize the Preference Storage."""
        super().__init__(
            extension_id="EXT-CORE-001",
            extension_type="CORE",
            trust_impact="Medium"
        )
        self.status = "ready"
        self.preferences = {}
        
        # Create data directory if it doesn't exist
        os.makedirs("data", exist_ok=True)
        
        # Load preferences if available
        self._load_preferences()
        
        # Log initialization
        logger.info("PreferenceStorage initialized")
    
    def get_preferences(self, user_id: str, preference_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Get preferences for a user.
        
        Args:
            user_id: Identifier for the user
            preference_type: Optional type of preference to filter by
            
        Returns:
            Dict: User preferences
        """
        # Check if user exists
        if user_id not in self.preferences:
            return {
                "status": "success",
                "preferences": [],
                "count": 0
            }
        
        # Get all preferences for user
        user_preferences = self.preferences[user_id]
        
        # Filter by type if specified
        if preference_type:
            filtered_preferences = [p for p in user_preferences if p.get("type") == preference_type]
        else:
            filtered_preferences = user_preferences
        
        # Log memory
        self.log_memory("preferences_retrieved", {
            "user_id": user_id,
            "preference_type": preference_type,
            "count": len(filtered_preferences)
        })
        
        return {
            "status": "success",
            "preferences": filtered_preferences,
            "count": len(filtered_preferences)
        }
    
    def store_preference(self, user_id: str, preference_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Store a preference for a user.
        
        Args:
            user_id: Identifier for the user
            preference_data: Preference data to store
            
        Returns:
            Dict: Result of preference storage
        """
        # Create user entry if it doesn't exist
        if user_id not in self.preferences:
            self.preferences[user_id] = []
        
        # Check if preference already exists
        preference_type = preference_data.get("type")
        existing_index = None
        
        for i, pref in enumerate(self.preferences[user_id]):
            if pref.get("type") == preference_type:
                existing_index = i
                break
        
        # Generate preference ID if not provided
        if "id" not in preference_data:
            preference_data["id"] = f"pref_{len(self.preferences[user_id]) + 1}"
        
        # Add timestamp
        preference_data["timestamp"] = datetime.now().isoformat()
        
        # Update or add preference
        if existing_index is not None:
            self.preferences[user_id][existing_index] = preference_data
        else:
            self.preferences[user_id].append(preference_data)
        
        # Save preferences
        self._save_preferences()
        
        # Log memory
        self.log_memory("preference_stored", {
            "user_id": user_id,
            "preference_type": preference_type
        })
        
        return {
            "status": "success",
            "preference_id": preference_data["id"]
        }
    
    def clear_preferences(self, user_id: str, preference_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Clear preferences for a user.
        
        Args:
            user_id: Identifier for the user
            preference_type: Optional type of preference to clear
            
        Returns:
            Dict: Result of preference clearing
        """
        # Check if user exists
        if user_id not in self.preferences:
            return {
                "status": "success",
                "message": "No preferences to clear"
            }
        
        # Clear all preferences for user
        if preference_type is None:
            self.preferences[user_id] = []
        else:
            # Filter out preferences of the specified type
            self.preferences[user_id] = [p for p in self.preferences[user_id] if p.get("type") != preference_type]
        
        # Save preferences
        self._save_preferences()
        
        # Log memory
        self.log_memory("preferences_cleared", {
            "user_id": user_id,
            "preference_type": preference_type
        })
        
        return {
            "status": "success",
            "message": "Preferences cleared"
        }
    
    def _load_preferences(self):
        """Load preferences from file."""
        try:
            with open("data/preferences.json", "r") as f:
                self.preferences = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # File doesn't exist or is invalid, use empty data
            self.preferences = {}
    
    def _save_preferences(self):
        """Save preferences to file."""
        with open("data/preferences.json", "w") as f:
            json.dump(self.preferences, f, indent=2)
    
    def reset_for_testing(self):
        """Reset storage for testing."""
        self.preferences = {}
        self._save_preferences()
