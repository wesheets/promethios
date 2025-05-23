"""
Reflection Loop Tracker for Promethios.

This module provides tracking for reflection loops in the Meta-Governance Framework,
enabling monitoring and analysis of governance decision-making processes.
"""

import logging
import json
import os
import time
import uuid
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class ReflectionLoopTracker:
    """
    Tracker for reflection loops in the Meta-Governance Framework.
    
    Tracks and analyzes reflection loops for governance decisions and operations,
    providing insights into decision-making processes and governance effectiveness.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the Reflection Loop Tracker with the specified configuration.
        
        Args:
            config: Configuration dictionary
        """
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing Reflection Loop Tracker")
        
        # Store configuration
        self.config = config
        
        # Initialize reflection loop store
        self.reflection_loops = {}
        
        # Initialize directories
        os.makedirs(self.config.get('reflection_loop_directory', 'logs/reflection_loops'), exist_ok=True)
        
        # Load reflection loops from disk
        self._load_reflection_loops()
        
        self.logger.info("Reflection Loop Tracker initialized")
    
    def start_reflection_loop(self, reflection_loop_id: str, context: Dict[str, Any]) -> bool:
        """
        Start a reflection loop with the specified context.
        
        Args:
            reflection_loop_id: ID of the reflection loop
            context: Context of the reflection loop
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Starting reflection loop: {reflection_loop_id}")
        
        # Create reflection loop data
        reflection_loop_data = {
            'id': reflection_loop_id,
            'start_timestamp': time.time(),
            'status': 'active',
            'context': context,
            'steps': [],
            'result': None
        }
        
        # Add to store
        self.reflection_loops[reflection_loop_id] = reflection_loop_data
        
        # Save to disk
        self._save_reflection_loop(reflection_loop_id, reflection_loop_data)
        
        return True
    
    def add_reflection_step(self, reflection_loop_id: str, step_data: Dict[str, Any]) -> bool:
        """
        Add a step to a reflection loop.
        
        Args:
            reflection_loop_id: ID of the reflection loop
            step_data: Data about the reflection step
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Adding step to reflection loop: {reflection_loop_id}")
        
        # Check if reflection loop exists
        if reflection_loop_id not in self.reflection_loops:
            self.logger.error(f"Reflection loop not found: {reflection_loop_id}")
            return False
        
        # Get reflection loop data
        reflection_loop_data = self.reflection_loops[reflection_loop_id]
        
        # Check if reflection loop is active
        if reflection_loop_data['status'] != 'active':
            self.logger.error(f"Reflection loop not active: {reflection_loop_id}")
            return False
        
        # Add timestamp to step
        step_data['timestamp'] = time.time()
        
        # Add step to reflection loop
        reflection_loop_data['steps'].append(step_data)
        
        # Save to disk
        self._save_reflection_loop(reflection_loop_id, reflection_loop_data)
        
        return True
    
    def complete_reflection_loop(self, reflection_loop_id: str, result: Dict[str, Any]) -> bool:
        """
        Complete a reflection loop with the specified result.
        
        Args:
            reflection_loop_id: ID of the reflection loop
            result: Result of the reflection loop
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Completing reflection loop: {reflection_loop_id}")
        
        # Check if reflection loop exists
        if reflection_loop_id not in self.reflection_loops:
            self.logger.error(f"Reflection loop not found: {reflection_loop_id}")
            return False
        
        # Get reflection loop data
        reflection_loop_data = self.reflection_loops[reflection_loop_id]
        
        # Check if reflection loop is active
        if reflection_loop_data['status'] != 'active':
            self.logger.error(f"Reflection loop not active: {reflection_loop_id}")
            return False
        
        # Update reflection loop data
        reflection_loop_data['status'] = 'completed'
        reflection_loop_data['end_timestamp'] = time.time()
        reflection_loop_data['result'] = result
        
        # Calculate duration
        start_timestamp = reflection_loop_data.get('start_timestamp', 0)
        end_timestamp = reflection_loop_data.get('end_timestamp', 0)
        reflection_loop_data['duration'] = end_timestamp - start_timestamp
        
        # Save to disk
        self._save_reflection_loop(reflection_loop_id, reflection_loop_data)
        
        return True
    
    def abort_reflection_loop(self, reflection_loop_id: str, reason: str) -> bool:
        """
        Abort a reflection loop with the specified reason.
        
        Args:
            reflection_loop_id: ID of the reflection loop
            reason: Reason for aborting the reflection loop
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Aborting reflection loop: {reflection_loop_id}")
        
        # Check if reflection loop exists
        if reflection_loop_id not in self.reflection_loops:
            self.logger.error(f"Reflection loop not found: {reflection_loop_id}")
            return False
        
        # Get reflection loop data
        reflection_loop_data = self.reflection_loops[reflection_loop_id]
        
        # Check if reflection loop is active
        if reflection_loop_data['status'] != 'active':
            self.logger.error(f"Reflection loop not active: {reflection_loop_id}")
            return False
        
        # Update reflection loop data
        reflection_loop_data['status'] = 'aborted'
        reflection_loop_data['end_timestamp'] = time.time()
        reflection_loop_data['abort_reason'] = reason
        
        # Calculate duration
        start_timestamp = reflection_loop_data.get('start_timestamp', 0)
        end_timestamp = reflection_loop_data.get('end_timestamp', 0)
        reflection_loop_data['duration'] = end_timestamp - start_timestamp
        
        # Save to disk
        self._save_reflection_loop(reflection_loop_id, reflection_loop_data)
        
        return True
    
    def get_reflection_loop(self, reflection_loop_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a reflection loop.
        
        Args:
            reflection_loop_id: ID of the reflection loop
            
        Returns:
            dict: Reflection loop data or None if not found
        """
        self.logger.info(f"Getting reflection loop: {reflection_loop_id}")
        
        # Check if reflection loop exists
        if reflection_loop_id not in self.reflection_loops:
            self.logger.error(f"Reflection loop not found: {reflection_loop_id}")
            return None
        
        return self.reflection_loops[reflection_loop_id]
    
    def list_reflection_loops(self, filter_params: Dict[str, Any] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """
        List reflection loops, optionally filtered by parameters.
        
        Args:
            filter_params: Parameters to filter the reflection loops by
            limit: Maximum number of reflection loops to return
            
        Returns:
            list: List of reflection loop data
        """
        self.logger.info("Listing reflection loops")
        
        # Initialize result
        result = []
        
        # Apply filters if provided
        if filter_params:
            for reflection_loop_id, reflection_loop_data in self.reflection_loops.items():
                match = True
                for key, value in filter_params.items():
                    if key == 'context':
                        # Special handling for context fields
                        context = reflection_loop_data.get('context', {})
                        for context_key, context_value in value.items():
                            if context_key not in context or context[context_key] != context_value:
                                match = False
                                break
                    elif key not in reflection_loop_data or reflection_loop_data[key] != value:
                        match = False
                        break
                if match:
                    result.append(reflection_loop_data)
        else:
            result = list(self.reflection_loops.values())
        
        # Sort by start timestamp (newest first)
        result.sort(key=lambda x: x.get('start_timestamp', 0), reverse=True)
        
        # Apply limit
        result = result[:limit]
        
        return result
    
    def get_reflection_loop_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about reflection loops.
        
        Returns:
            dict: Reflection loop statistics
        """
        self.logger.info("Getting reflection loop statistics")
        
        # Initialize statistics
        statistics = {
            'total_loops': len(self.reflection_loops),
            'active_loops': 0,
            'completed_loops': 0,
            'aborted_loops': 0,
            'average_duration': 0,
            'loops_by_type': {},
            'success_rate': 0
        }
        
        # Calculate statistics
        total_duration = 0
        total_completed = 0
        total_successful = 0
        
        for reflection_loop_id, reflection_loop_data in self.reflection_loops.items():
            # Count by status
            status = reflection_loop_data.get('status')
            if status == 'active':
                statistics['active_loops'] += 1
            elif status == 'completed':
                statistics['completed_loops'] += 1
                total_completed += 1
                
                # Check if successful
                result = reflection_loop_data.get('result', {})
                if result.get('success', False):
                    total_successful += 1
                
                # Add to total duration
                duration = reflection_loop_data.get('duration', 0)
                total_duration += duration
            elif status == 'aborted':
                statistics['aborted_loops'] += 1
            
            # Count by type
            context = reflection_loop_data.get('context', {})
            loop_type = context.get('type', 'unknown')
            if loop_type not in statistics['loops_by_type']:
                statistics['loops_by_type'][loop_type] = 0
            statistics['loops_by_type'][loop_type] += 1
        
        # Calculate average duration
        if statistics['completed_loops'] > 0:
            statistics['average_duration'] = total_duration / statistics['completed_loops']
        
        # Calculate success rate
        if total_completed > 0:
            statistics['success_rate'] = (total_successful / total_completed) * 100
        
        return statistics
    
    def _load_reflection_loops(self):
        """Load reflection loops from disk."""
        reflection_loop_directory = self.config.get('reflection_loop_directory', 'logs/reflection_loops')
        if not os.path.exists(reflection_loop_directory):
            return
        
        for filename in os.listdir(reflection_loop_directory):
            if filename.endswith('.json'):
                reflection_loop_path = os.path.join(reflection_loop_directory, filename)
                try:
                    with open(reflection_loop_path, 'r') as f:
                        reflection_loop_data = json.load(f)
                    
                    reflection_loop_id = reflection_loop_data.get('id')
                    if reflection_loop_id:
                        self.reflection_loops[reflection_loop_id] = reflection_loop_data
                except Exception as e:
                    self.logger.error(f"Error loading reflection loop from {filename}: {str(e)}")
    
    def _save_reflection_loop(self, reflection_loop_id: str, reflection_loop_data: Dict[str, Any]):
        """
        Save a reflection loop to disk.
        
        Args:
            reflection_loop_id: ID of the reflection loop
            reflection_loop_data: Reflection loop data to save
        """
        reflection_loop_directory = self.config.get('reflection_loop_directory', 'logs/reflection_loops')
        os.makedirs(reflection_loop_directory, exist_ok=True)
        
        reflection_loop_path = os.path.join(reflection_loop_directory, f"{reflection_loop_id}.json")
        with open(reflection_loop_path, 'w') as f:
            json.dump(reflection_loop_data, f, indent=2)
