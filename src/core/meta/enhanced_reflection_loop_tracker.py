"""
Enhanced Reflection Loop Tracker for Promethios.

This module provides an enhanced tracking system for reflection loops in the Meta-Governance Framework,
enabling monitoring and analysis of governance decision-making processes with integration to
the Constitutional Observer framework.
"""

import logging
import json
import os
import time
import uuid
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

from hooks.constitutional_hooks import ConstitutionalHooksManager
from modules.belief_trace.index import BeliefTraceManager
from modules.goal_adherence.index import GoalAdherenceMonitor

logger = logging.getLogger(__name__)

class EnhancedReflectionLoopTracker:
    """
    Enhanced Tracker for reflection loops in the Meta-Governance Framework.
    
    Tracks and analyzes reflection loops for governance decisions and operations,
    providing insights into decision-making processes and governance effectiveness.
    Integrates with the Constitutional Observer framework for governance verification
    and analytics collection.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the Enhanced Reflection Loop Tracker with the specified configuration.
        
        Args:
            config: Configuration dictionary
        """
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing Enhanced Reflection Loop Tracker")
        
        # Store configuration
        self.config = config
        
        # Initialize reflection loop store
        self.reflection_loops = {}
        
        # Initialize directories
        os.makedirs(self.config.get('reflection_loop_directory', 'logs/reflection_loops'), exist_ok=True)
        
        # Initialize integration with constitutional hooks
        try:
            self.hooks_manager = ConstitutionalHooksManager()
            self.belief_trace_manager = BeliefTraceManager()
            self.goal_adherence_monitor = GoalAdherenceMonitor()
        except Exception as e:
            self.logger.warning(f"Constitutional framework integration initialization failed: {str(e)}")
            self.hooks_manager = None
            self.belief_trace_manager = None
            self.goal_adherence_monitor = None
        
        # Initialize analytics data collection
        self.analytics = {
            "reflection_patterns": {},
            "outcome_distribution": {
                "success": 0,
                "failure": 0,
                "aborted": 0
            },
            "unreflected_failures": [],
            "reflection_quality": {},
            "trust_impact": {}
        }
        
        # Load reflection loops from disk
        self._load_reflection_loops()
        
        self.logger.info("Enhanced Reflection Loop Tracker initialized")
    
    def start_reflection_loop(self, reflection_loop_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Start a reflection loop with the specified context and constitutional governance integration.
        
        Args:
            reflection_loop_id: ID of the reflection loop
            context: Context of the reflection loop
            
        Returns:
            Dict: Result with status and trace information
        """
        self.logger.info(f"Starting reflection loop: {reflection_loop_id}")
        
        # Create belief trace for this operation
        belief_trace = None
        if self.belief_trace_manager:
            try:
                belief_trace = self.belief_trace_manager.createTrace(
                    operation="start_reflection_loop",
                    sourceType="reflection_governance",
                    metadata={
                        "reflection_loop_id": reflection_loop_id,
                        "context_type": context.get("type", "unknown"),
                        "timestamp": datetime.now().isoformat()
                    }
                )
            except Exception as e:
                self.logger.warning(f"Failed to create belief trace: {str(e)}")
        
        # Create reflection loop data
        reflection_loop_data = {
            'id': reflection_loop_id,
            'start_timestamp': time.time(),
            'status': 'active',
            'context': context,
            'steps': [],
            'result': None,
            'trace_id': belief_trace.id if belief_trace else None,
            'governance': {
                'trust_impact': 0.0,
                'adherence_score': 1.0,
                'verification_status': 'pending'
            }
        }
        
        # Add to store
        self.reflection_loops[reflection_loop_id] = reflection_loop_data
        
        # Save to disk
        self._save_reflection_loop(reflection_loop_id, reflection_loop_data)
        
        # Register with goal adherence monitor if available
        if self.goal_adherence_monitor:
            try:
                # Create a goal for reflection quality
                goal_id = f"reflection_quality_{reflection_loop_id}"
                
                self.goal_adherence_monitor.registerGoal({
                    "id": goal_id,
                    "description": f"Maintain high-quality reflection for loop {reflection_loop_id}",
                    "criteria": [
                        {
                            "id": "complete_steps",
                            "description": "All reflection steps must be completed"
                        },
                        {
                            "id": "proper_analysis",
                            "description": "Reflection must include proper analysis"
                        }
                    ],
                    "constraints": [
                        {
                            "id": "no_unreflected_failures",
                            "description": "Failures must be properly reflected upon",
                            "severity": "high"
                        }
                    ],
                    "agent": "reflection_tracker"
                })
                
                # Store goal ID in reflection loop data
                reflection_loop_data['governance']['goal_id'] = goal_id
                
                # Save updated data
                self._save_reflection_loop(reflection_loop_id, reflection_loop_data)
                
            except Exception as e:
                self.logger.warning(f"Failed to register with goal adherence monitor: {str(e)}")
        
        # Trigger constitutional hooks if available
        if self.hooks_manager:
            try:
                self.hooks_manager.triggerHook(
                    hookType="reflection_start",
                    data={
                        "reflection_loop_id": reflection_loop_id,
                        "context": context,
                        "trace_id": belief_trace.id if belief_trace else None
                    }
                )
            except Exception as e:
                self.logger.warning(f"Failed to trigger constitutional hook: {str(e)}")
        
        result = {
            "status": "success",
            "reflection_loop_id": reflection_loop_id
        }
        
        # Add trace ID if available
        if belief_trace:
            result["trace_id"] = belief_trace.id
        
        return result
    
    def add_reflection_step(self, reflection_loop_id: str, step_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add a step to a reflection loop with constitutional governance integration.
        
        Args:
            reflection_loop_id: ID of the reflection loop
            step_data: Data about the reflection step
            
        Returns:
            Dict: Result with status and trace information
        """
        self.logger.info(f"Adding step to reflection loop: {reflection_loop_id}")
        
        # Create belief trace for this operation
        belief_trace = None
        if self.belief_trace_manager:
            try:
                belief_trace = self.belief_trace_manager.createTrace(
                    operation="add_reflection_step",
                    sourceType="reflection_step",
                    metadata={
                        "reflection_loop_id": reflection_loop_id,
                        "step_type": step_data.get("type", "unknown"),
                        "timestamp": datetime.now().isoformat()
                    }
                )
            except Exception as e:
                self.logger.warning(f"Failed to create belief trace: {str(e)}")
        
        # Check if reflection loop exists
        if reflection_loop_id not in self.reflection_loops:
            self.logger.error(f"Reflection loop not found: {reflection_loop_id}")
            result = {
                "status": "error",
                "message": f"Reflection loop not found: {reflection_loop_id}"
            }
            
            # Add trace ID if available
            if belief_trace:
                result["trace_id"] = belief_trace.id
                
            return result
        
        # Get reflection loop data
        reflection_loop_data = self.reflection_loops[reflection_loop_id]
        
        # Check if reflection loop is active
        if reflection_loop_data['status'] != 'active':
            self.logger.error(f"Reflection loop not active: {reflection_loop_id}")
            result = {
                "status": "error",
                "message": f"Reflection loop not active: {reflection_loop_id}"
            }
            
            # Add trace ID if available
            if belief_trace:
                result["trace_id"] = belief_trace.id
                
            return result
        
        # Add timestamp to step
        step_data['timestamp'] = time.time()
        
        # Add trace ID if available
        if belief_trace:
            step_data['trace_id'] = belief_trace.id
        
        # Add step to reflection loop
        reflection_loop_data['steps'].append(step_data)
        
        # Update analytics
        step_type = step_data.get("type", "unknown")
        if step_type not in self.analytics["reflection_patterns"]:
            self.analytics["reflection_patterns"][step_type] = 0
        self.analytics["reflection_patterns"][step_type] += 1
        
        # Save to disk
        self._save_reflection_loop(reflection_loop_id, reflection_loop_data)
        
        # Check goal adherence if available
        if self.goal_adherence_monitor and 'governance' in reflection_loop_data and 'goal_id' in reflection_loop_data['governance']:
            try:
                goal_id = reflection_loop_data['governance']['goal_id']
                
                # Check adherence
                adherence_result = self.goal_adherence_monitor.checkAdherence(
                    goal_id,
                    {
                        "steps_completed": len(reflection_loop_data['steps']),
                        "step_types": [step.get("type", "unknown") for step in reflection_loop_data['steps']],
                        "has_analysis": any(step.get("type") == "analysis" for step in reflection_loop_data['steps'])
                    }
                )
                
                # Update governance data
                reflection_loop_data['governance']['adherence_score'] = adherence_result.adherenceScore
                reflection_loop_data['governance']['drift_detected'] = adherence_result.driftDetected
                
                # Save updated data
                self._save_reflection_loop(reflection_loop_id, reflection_loop_data)
                
            except Exception as e:
                self.logger.warning(f"Failed to check goal adherence: {str(e)}")
        
        # Trigger constitutional hooks if available
        if self.hooks_manager:
            try:
                self.hooks_manager.triggerHook(
                    hookType="reflection_step",
                    data={
                        "reflection_loop_id": reflection_loop_id,
                        "step_data": step_data,
                        "trace_id": belief_trace.id if belief_trace else None
                    }
                )
            except Exception as e:
                self.logger.warning(f"Failed to trigger constitutional hook: {str(e)}")
        
        result = {
            "status": "success",
            "reflection_loop_id": reflection_loop_id,
            "step_index": len(reflection_loop_data['steps']) - 1
        }
        
        # Add trace ID if available
        if belief_trace:
            result["trace_id"] = belief_trace.id
        
        return result
    
    def complete_reflection_loop(self, reflection_loop_id: str, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Complete a reflection loop with the specified result and constitutional governance integration.
        
        Args:
            reflection_loop_id: ID of the reflection loop
            result: Result of the reflection loop
            
        Returns:
            Dict: Result with status and trace information
        """
        self.logger.info(f"Completing reflection loop: {reflection_loop_id}")
        
        # Create belief trace for this operation
        belief_trace = None
        if self.belief_trace_manager:
            try:
                belief_trace = self.belief_trace_manager.createTrace(
                    operation="complete_reflection_loop",
                    sourceType="reflection_completion",
                    metadata={
                        "reflection_loop_id": reflection_loop_id,
                        "success": result.get("success", False),
                        "timestamp": datetime.now().isoformat()
                    }
                )
            except Exception as e:
                self.logger.warning(f"Failed to create belief trace: {str(e)}")
        
        # Check if reflection loop exists
        if reflection_loop_id not in self.reflection_loops:
            self.logger.error(f"Reflection loop not found: {reflection_loop_id}")
            response = {
                "status": "error",
                "message": f"Reflection loop not found: {reflection_loop_id}"
            }
            
            # Add trace ID if available
            if belief_trace:
                response["trace_id"] = belief_trace.id
                
            return response
        
        # Get reflection loop data
        reflection_loop_data = self.reflection_loops[reflection_loop_id]
        
        # Check if reflection loop is active
        if reflection_loop_data['status'] != 'active':
            self.logger.error(f"Reflection loop not active: {reflection_loop_id}")
            response = {
                "status": "error",
                "message": f"Reflection loop not active: {reflection_loop_id}"
            }
            
            # Add trace ID if available
            if belief_trace:
                response["trace_id"] = belief_trace.id
                
            return response
        
        # Update reflection loop data
        reflection_loop_data['status'] = 'completed'
        reflection_loop_data['end_timestamp'] = time.time()
        reflection_loop_data['result'] = result
        
        # Add trace ID if available
        if belief_trace:
            if 'trace_ids' not in reflection_loop_data:
                reflection_loop_data['trace_ids'] = []
            reflection_loop_data['trace_ids'].append(belief_trace.id)
        
        # Calculate duration
        start_timestamp = reflection_loop_data.get('start_timestamp', 0)
        end_timestamp = reflection_loop_data.get('end_timestamp', 0)
        reflection_loop_data['duration'] = end_timestamp - start_timestamp
        
        # Update analytics
        if result.get("success", False):
            self.analytics["outcome_distribution"]["success"] += 1
        else:
            self.analytics["outcome_distribution"]["failure"] += 1
        
        # Calculate reflection quality score
        quality_score = self._calculate_reflection_quality(reflection_loop_data)
        reflection_loop_data['governance']['quality_score'] = quality_score
        
        # Update reflection quality analytics
        loop_type = reflection_loop_data.get('context', {}).get('type', 'unknown')
        if loop_type not in self.analytics["reflection_quality"]:
            self.analytics["reflection_quality"][loop_type] = []
        self.analytics["reflection_quality"][loop_type].append(quality_score)
        
        # Save to disk
        self._save_reflection_loop(reflection_loop_id, reflection_loop_data)
        
        # Check goal adherence if available
        if self.goal_adherence_monitor and 'governance' in reflection_loop_data and 'goal_id' in reflection_loop_data['governance']:
            try:
                goal_id = reflection_loop_data['governance']['goal_id']
                
                # Final adherence check
                adherence_result = self.goal_adherence_monitor.checkAdherence(
                    goal_id,
                    {
                        "steps_completed": len(reflection_loop_data['steps']),
                        "step_types": [step.get("type", "unknown") for step in reflection_loop_data['steps']],
                        "has_analysis": any(step.get("type") == "analysis" for step in reflection_loop_data['steps']),
                        "success": result.get("success", False),
                        "quality_score": quality_score
                    }
                )
                
                # Update governance data
                reflection_loop_data['governance']['adherence_score'] = adherence_result.adherenceScore
                reflection_loop_data['governance']['drift_detected'] = adherence_result.driftDetected
                
                # Save updated data
                self._save_reflection_loop(reflection_loop_id, reflection_loop_data)
                
                # Update analytics
                self.analytics["trust_impact"][reflection_loop_id] = adherence_result.adherenceScore
                
            except Exception as e:
                self.logger.warning(f"Failed to check goal adherence: {str(e)}")
        
        # Verify trace if available
        if self.belief_trace_manager and belief_trace:
            try:
                verification_result = self.belief_trace_manager.verifyTrace(
                    traceId=belief_trace.id,
                    verificationLevel="standard"
                )
                
                # Update governance data
                reflection_loop_data['governance']['verification_status'] = 'verified' if verification_result.verified else 'failed'
                reflection_loop_data['governance']['verification_confidence'] = verification_result.confidence
                
                # Save updated data
                self._save_reflection_loop(reflection_loop_id, reflection_loop_data)
                
            except Exception as e:
                self.logger.warning(f"Failed to verify belief trace: {str(e)}")
        
        # Trigger constitutional hooks if available
        if self.hooks_manager:
            try:
                self.hooks_manager.triggerHook(
                    hookType="reflection_complete",
                    data={
                        "reflection_loop_id": reflection_loop_id,
                        "result": result,
                        "quality_score": quality_score,
                        "trace_id": belief_trace.id if belief_trace else None
                    }
                )
            except Exception as e:
                self.logger.warning(f"Failed to trigger constitutional hook: {str(e)}")
        
        response = {
            "status": "success",
            "reflection_loop_id": reflection_loop_id,
            "quality_score": quality_score
        }
        
        # Add trace ID if available
        if belief_trace:
            response["trace_id"] = belief_trace.id
        
        return response
    
    def abort_reflection_loop(self, reflection_loop_id: str, reason: str) -> Dict[str, Any]:
        """
        Abort a reflection loop with the specified reason and constitutional governance integration.
        
        Args:
            reflection_loop_id: ID of the reflection loop
            reason: Reason for aborting the reflection loop
            
        Returns:
            Dict: Result with status and trace information
        """
        self.logger.info(f"Aborting reflection loop: {reflection_loop_id}")
        
        # Create belief trace for this operation
        belief_trace = None
        if self.belief_trace_manager:
            try:
                belief_trace = self.belief_trace_manager.createTrace(
                    operation="abort_reflection_loop",
                    sourceType="reflection_abortion",
                    metadata={
                        "reflection_loop_id": reflection_loop_id,
                        "reason": reason,
                        "timestamp": datetime.now().isoformat()
                    }
                )
            except Exception as e:
                self.logger.warning(f"Failed to create belief trace: {str(e)}")
        
        # Check if reflection loop exists
        if reflection_loop_id not in self.reflection_loops:
            self.logger.error(f"Reflection loop not found: {reflection_loop_id}")
            response = {
                "status": "error",
                "message": f"Reflection loop not found: {reflection_loop_id}"
            }
            
            # Add trace ID if available
            if belief_trace:
                response["trace_id"] = belief_trace.id
                
            return response
        
        # Get reflection loop data
        reflection_loop_data = self.reflection_loops[reflection_loop_id]
        
        # Check if reflection loop is active
        if reflection_loop_data['status'] != 'active':
            self.logger.error(f"Reflection loop not active: {reflection_loop_id}")
            response = {
                "status": "error",
                "message": f"Reflection loop not active: {reflection_loop_id}"
            }
            
            # Add trace ID if available
            if belief_trace:
                response["trace_id"] = belief_trace.id
                
            return response
        
        # Update reflection loop data
        reflection_loop_data['status'] = 'aborted'
        reflection_loop_data['end_timestamp'] = time.time()
        reflection_loop_data['abort_reason'] = reason
        
        # Add trace ID if available
        if belief_trace:
            if 'trace_ids' not in reflection_loop_data:
                reflection_loop_data['trace_ids'] = []
            reflection_loop_data['trace_ids'].append(belief_trace.id)
        
        # Calculate duration
        start_timestamp = reflection_loop_data.get('start_timestamp', 0)
        end_timestamp = reflection_loop_data.get('end_timestamp', 0)
        reflection_loop_data['duration'] = end_timestamp - start_timestamp
        
        # Update analytics
        self.analytics["outcome_distribution"]["aborted"] += 1
        
        # Save to disk
        self._save_reflection_loop(reflection_loop_id, reflection_loop_data)
        
        # Check goal adherence if available
        if self.goal_adherence_monitor and 'governance' in reflection_loop_data and 'goal_id' in reflection_loop_data['governance']:
            try:
                goal_id = reflection_loop_data['governance']['goal_id']
                
                # Final adherence check
                adherence_result = self.goal_adherence_monitor.checkAdherence(
                    goal_id,
                    {
                        "steps_completed": len(reflection_loop_data['steps']),
                        "aborted": True,
                        "abort_reason": reason
                    }
                )
                
                # Update governance data
                reflection_loop_data['governance']['adherence_score'] = adherence_result.adherenceScore
                reflection_loop_data['governance']['drift_detected'] = adherence_result.driftDetected
                
                # Save updated data
                self._save_reflection_loop(reflection_loop_id, reflection_loop_data)
                
                # Update analytics
                self.analytics["trust_impact"][reflection_loop_id] = adherence_result.adherenceScore
                
            except Exception as e:
                self.logger.warning(f"Failed to check goal adherence: {str(e)}")
        
        # Trigger constitutional hooks if available
        if self.hooks_manager:
            try:
                self.hooks_manager.triggerHook(
                    hookType="reflection_abort",
                    data={
                        "reflection_loop_id": reflection_loop_id,
                        "reason": reason,
                        "trace_id": belief_trace.id if belief_trace else None
                    }
                )
            except Exception as e:
                self.logger.warning(f"Failed to trigger constitutional hook: {str(e)}")
        
        response = {
            "status": "success",
            "reflection_loop_id": reflection_loop_id
        }
        
        # Add trace ID if available
        if belief_trace:
            response["trace_id"] = belief_trace.id
        
        return response
    
    def get_reflection_loop(self, reflection_loop_id: str) -> Dict[str, Any]:
        """
        Get information about a reflection loop with constitutional governance integration.
        
        Args:
            reflection_loop_id: ID of the reflection loop
            
        Returns:
            Dict: Reflection loop data or error response
        """
        self.logger.info(f"Getting reflection loop: {reflection_loop_id}")
        
        # Create belief trace for this operation
        belief_trace = None
        if self.belief_trace_manager:
            try:
                belief_trace = self.belief_trace_manager.createTrace(
                    operation="get_reflection_loop",
                    sourceType="reflection_query",
                    metadata={
                        "reflection_loop_id": reflection_loop_id,
                        "timestamp": datetime.now().isoformat()
                    }
                )
            except Exception as e:
                self.logger.warning(f"Failed to create belief trace: {str(e)}")
        
        # Check if reflection loop exists
        if reflection_loop_id not in self.reflection_loops:
            self.logger.error(f"Reflection loop not found: {reflection_loop_id}")
            response = {
                "status": "error",
                "message": f"Reflection loop not found: {reflection_loop_id}"
            }
            
            # Add trace ID if available
            if belief_trace:
                response["trace_id"] = belief_trace.id
                
            return response
        
        # Get reflection loop data
        reflection_loop_data = self.reflection_loops[reflection_loop_id]
        
        # Create response
        response = {
            "status": "success",
            "reflection_loop": reflection_loop_data
        }
        
        # Add trace ID if available
        if belief_trace:
            response["trace_id"] = belief_trace.id
        
        return response
    
    def list_reflection_loops(self, filter_params: Dict[str, Any] = None, limit: int = 100) -> Dict[str, Any]:
        """
        List reflection loops, optionally filtered by parameters, with constitutional governance integration.
        
        Args:
            filter_params: Parameters to filter the reflection loops by
            limit: Maximum number of reflection loops to return
            
        Returns:
            Dict: List of reflection loop data with status and trace information
        """
        self.logger.info("Listing reflection loops")
        
        # Create belief trace for this operation
        belief_trace = None
        if self.belief_trace_manager:
            try:
                belief_trace = self.belief_trace_manager.createTrace(
                    operation="list_reflection_loops",
                    sourceType="reflection_query",
                    metadata={
                        "filter_params": filter_params,
                        "limit": limit,
                        "timestamp": datetime.now().isoformat()
                    }
                )
            except Exception as e:
                self.logger.warning(f"Failed to create belief trace: {str(e)}")
        
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
        
        # Create response
        response = {
            "status": "success",
            "reflection_loops": result,
            "total_count": len(result),
            "limit": limit
        }
        
        # Add trace ID if available
        if belief_trace:
            response["trace_id"] = belief_trace.id
        
        return response
    
    def get_reflection_loop_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about reflection loops with constitutional governance integration.
        
        Returns:
            Dict: Reflection loop statistics with status and trace information
        """
        self.logger.info("Getting reflection loop statistics")
        
        # Create belief trace for this operation
        belief_trace = None
        if self.belief_trace_manager:
            try:
                belief_trace = self.belief_trace_manager.createTrace(
                    operation="get_reflection_loop_statistics",
                    sourceType="reflection_analytics",
                    metadata={
                        "timestamp": datetime.now().isoformat()
                    }
                )
            except Exception as e:
                self.logger.warning(f"Failed to create belief trace: {str(e)}")
        
        # Initialize statistics
        statistics = {
            'total_loops': len(self.reflection_loops),
            'active_loops': 0,
            'completed_loops': 0,
            'aborted_loops': 0,
            'average_duration': 0,
            'loops_by_type': {},
            'success_rate': 0,
            'average_quality_score': 0,
            'governance': {
                'average_adherence_score': 0,
                'drift_detected_count': 0,
                'verification_success_rate': 0
            }
        }
        
        # Calculate statistics
        total_duration = 0
        total_completed = 0
        total_successful = 0
        total_quality_score = 0
        total_adherence_score = 0
        total_with_adherence = 0
        total_verified = 0
        total_with_verification = 0
        
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
                
                # Add to quality score
                if 'governance' in reflection_loop_data and 'quality_score' in reflection_loop_data['governance']:
                    quality_score = reflection_loop_data['governance']['quality_score']
                    total_quality_score += quality_score
                
                # Add to adherence score
                if 'governance' in reflection_loop_data and 'adherence_score' in reflection_loop_data['governance']:
                    adherence_score = reflection_loop_data['governance']['adherence_score']
                    total_adherence_score += adherence_score
                    total_with_adherence += 1
                    
                    # Count drift detected
                    if reflection_loop_data['governance'].get('drift_detected', False):
                        statistics['governance']['drift_detected_count'] += 1
                
                # Count verification status
                if 'governance' in reflection_loop_data and 'verification_status' in reflection_loop_data['governance']:
                    total_with_verification += 1
                    if reflection_loop_data['governance']['verification_status'] == 'verified':
                        total_verified += 1
                
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
        
        # Calculate average quality score
        if total_completed > 0:
            statistics['average_quality_score'] = total_quality_score / total_completed
        
        # Calculate governance statistics
        if total_with_adherence > 0:
            statistics['governance']['average_adherence_score'] = total_adherence_score / total_with_adherence
        
        if total_with_verification > 0:
            statistics['governance']['verification_success_rate'] = (total_verified / total_with_verification) * 100
        
        # Add analytics data
        statistics['analytics'] = self.analytics
        
        # Create response
        response = {
            "status": "success",
            "statistics": statistics
        }
        
        # Add trace ID if available
        if belief_trace:
            response["trace_id"] = belief_trace.id
        
        return response
    
    def get_analytics(self) -> Dict[str, Any]:
        """
        Get analytics data collected by the reflection loop tracker.
        
        Returns:
            Dict: Analytics data with status and trace information
        """
        # Create belief trace for this operation
        belief_trace = None
        if self.belief_trace_manager:
            try:
                belief_trace = self.belief_trace_manager.createTrace(
                    operation="get_analytics",
                    sourceType="reflection_analytics",
                    metadata={
                        "timestamp": datetime.now().isoformat()
                    }
                )
            except Exception as e:
                self.logger.warning(f"Failed to create belief trace: {str(e)}")
        
        response = {
            "status": "success",
            "analytics": self.analytics
        }
        
        # Add trace ID if available
        if belief_trace:
            response["trace_id"] = belief_trace.id
        
        return response
    
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
                        
                        # Update analytics
                        status = reflection_loop_data.get('status')
                        if status == 'completed':
                            result = reflection_loop_data.get('result', {})
                            if result.get('success', False):
                                self.analytics["outcome_distribution"]["success"] += 1
                            else:
                                self.analytics["outcome_distribution"]["failure"] += 1
                        elif status == 'aborted':
                            self.analytics["outcome_distribution"]["aborted"] += 1
                        
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
    
    def _calculate_reflection_quality(self, reflection_loop_data: Dict[str, Any]) -> float:
        """
        Calculate the quality score for a reflection loop.
        
        Args:
            reflection_loop_data: Reflection loop data
            
        Returns:
            float: Quality score between 0 and 1
        """
        # Initialize score
        quality_score = 0.0
        
        # Get steps
        steps = reflection_loop_data.get('steps', [])
        
        # Check if there are steps
        if not steps:
            return quality_score
        
        # Check for required step types
        has_analysis = any(step.get('type') == 'analysis' for step in steps)
        has_conclusion = any(step.get('type') == 'conclusion' for step in steps)
        
        # Base score on step count (up to 0.5)
        step_count_score = min(len(steps) / 5, 0.5)
        quality_score += step_count_score
        
        # Add score for required step types (up to 0.3)
        if has_analysis:
            quality_score += 0.2
        if has_conclusion:
            quality_score += 0.1
        
        # Check for step order (up to 0.2)
        step_types = [step.get('type') for step in steps]
        if 'analysis' in step_types and 'conclusion' in step_types:
            analysis_index = step_types.index('analysis')
            conclusion_index = step_types.index('conclusion')
            if conclusion_index > analysis_index:
                quality_score += 0.2
        
        return min(quality_score, 1.0)
