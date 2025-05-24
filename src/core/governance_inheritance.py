"""
Core Extension Base Class for Governance Inheritance

This module provides the base class for all extensions in the system,
implementing governance inheritance capabilities including trust scoring,
memory logging, reflection, and override awareness.

Extension Type: Core
Governance Inheritance: Trust Scoring, Memory Logging, Reflection Capability, Override Awareness
Trust Impact: Low
"""

import logging
import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExtensionBase:
    """
    Base class for all extensions, providing governance inheritance capabilities.
    
    This class implements core governance capabilities that are inherited by all extensions:
    - Trust scoring
    - Memory logging
    - Reflection capability
    - Override awareness
    """
    
    def __init__(self, extension_id: str, extension_type: str, trust_impact: str):
        """
        Initialize the extension base.
        
        Args:
            extension_id: Unique identifier for the extension
            extension_type: Type of extension (Core, UI, etc.)
            trust_impact: Impact on trust (Low, Medium, High)
        """
        self.extension_id = extension_id
        self.extension_type = extension_type
        self.trust_impact = trust_impact
        self.override_active = False
        self.memory = []
        
        # Create memory directory if it doesn't exist
        os.makedirs("data/memory", exist_ok=True)
        
        # Log initialization
        logging.info(f"Extension {extension_id} initialized with type {extension_type} and trust impact {trust_impact}")
    
    def log_memory(self, action: str, data: Dict[str, Any]) -> None:
        """
        Log memory for governance tracking.
        
        Args:
            action: Action being performed
            data: Data associated with the action
        """
        memory_entry = {
            "timestamp": datetime.now().isoformat(),
            "extension_id": self.extension_id,
            "extension_type": self.extension_type,
            "action": action,
            "data": data
        }
        
        self.memory.append(memory_entry)
        
        # Log to file
        self._save_memory(memory_entry)
        
        # Log to console - using logging.info directly to match the patch in the test
        logging.info(f"Memory logged for {self.extension_id}: {action}")
    
    def _save_memory(self, memory_entry: Dict[str, Any]) -> None:
        """
        Save memory entry to file.
        
        Args:
            memory_entry: Memory entry to save
        """
        memory_file = f"data/memory/{self.extension_id}.jsonl"
        
        with open(memory_file, "a") as f:
            f.write(json.dumps(memory_entry) + "\n")
    
    def get_memory(self, action: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get memory entries.
        
        Args:
            action: Optional action to filter by
            
        Returns:
            List: Memory entries
        """
        if action:
            return [entry for entry in self.memory if entry["action"] == action]
        
        return self.memory
    
    def check_override(self) -> bool:
        """
        Check if override is active.
        
        Returns:
            bool: Whether override is active
        """
        return self.override_active
    
    def set_override(self, active: bool) -> Dict[str, Any]:
        """
        Set override status.
        
        Args:
            active: Whether override is active
            
        Returns:
            Dict: Result of setting override
        """
        previous_state = self.override_active
        self.override_active = active
        
        # Log memory
        self.log_memory("override_set", {
            "previous_state": previous_state,
            "new_state": active
        })
        
        return {
            "status": "success",
            "previous_state": previous_state,
            "new_state": active
        }
    
    def get_override_status(self) -> Dict[str, Any]:
        """
        Get override status.
        
        Returns:
            Dict: Override status
        """
        return {
            "status": "success",
            "override_active": self.override_active
        }
    
    def reflect(self) -> Dict[str, Any]:
        """
        Generate reflection data about the extension's operation.
        
        Returns:
            Dict: Reflection data
        """
        # Count memory entries by action
        action_counts = {}
        for entry in self.memory:
            action = entry["action"]
            if action not in action_counts:
                action_counts[action] = 0
            
            action_counts[action] += 1
        
        return {
            "extension_id": self.extension_id,
            "extension_type": self.extension_type,
            "trust_impact": self.trust_impact,
            "override_active": self.override_active,
            "memory_count": len(self.memory),
            "action_counts": action_counts,
            "timestamp": datetime.now().isoformat()
        }
