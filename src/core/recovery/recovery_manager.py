"""
Recovery Manager for Promethios Governance System.

This module provides the central manager for recovery operations, coordinating
the detection, planning, execution, and verification of recovery processes.
"""

import logging
import time
import json
import uuid
from typing import Dict, List, Optional, Any, Tuple

logger = logging.getLogger(__name__)

class RecoveryManager:
    """
    Manages recovery operations for governance system failures.
    
    Provides protocols for recovering from catastrophic failures in the governance system,
    ensuring system resilience and continuity.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize the recovery manager with the specified configuration.
        
        Args:
            config_path: Path to the recovery configuration file
        """
        self.config = self._load_config(config_path)
        self.recovery_plans = {}
        self.active_recoveries = {}
        self.recovery_history = {}
        self.failure_detectors = {}
        self.recovery_executors = {}
        self.recovery_verifiers = {}
        self.logger = logging.getLogger(__name__)
        
        # Initialize components
        self._initialize_components()
        
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """
        Load configuration from the specified path.
        
        Args:
            config_path: Path to the configuration file
            
        Returns:
            dict: Configuration data
        """
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            # Validate required configuration parameters
            required_params = ['recovery_types', 'max_recovery_time', 'verification_timeout']
            for param in required_params:
                if param not in config:
                    raise ValueError(f"Missing required configuration parameter: {param}")
            
            return config
        except Exception as e:
            self.logger.error(f"Failed to load configuration: {str(e)}")
            # Provide sensible defaults for critical parameters
            return {
                'recovery_types': ['consensus', 'trust', 'governance', 'system'],
                'max_recovery_time': 3600,  # 1 hour
                'verification_timeout': 300,  # 5 minutes
                'max_retries': 3,
                'audit_level': 'detailed'
            }
    
    def _initialize_components(self) -> None:
        """
        Initialize recovery components based on configuration.
        """
        # Initialize failure detectors
        for recovery_type in self.config.get('recovery_types', []):
            detector_class = self._get_detector_class(recovery_type)
            if detector_class:
                self.failure_detectors[recovery_type] = detector_class(self.config)
                self.logger.info(f"Initialized failure detector for {recovery_type}")
            
            # Initialize recovery executors
            executor_class = self._get_executor_class(recovery_type)
            if executor_class:
                self.recovery_executors[recovery_type] = executor_class(self.config)
                self.logger.info(f"Initialized recovery executor for {recovery_type}")
            
            # Initialize recovery verifiers
            verifier_class = self._get_verifier_class(recovery_type)
            if verifier_class:
                self.recovery_verifiers[recovery_type] = verifier_class(self.config)
                self.logger.info(f"Initialized recovery verifier for {recovery_type}")
    
    def _get_detector_class(self, recovery_type: str) -> Any:
        """
        Get the failure detector class for the specified recovery type.
        
        Args:
            recovery_type: Type of recovery
            
        Returns:
            class: Failure detector class
        """
        if recovery_type == 'consensus':
            from .failure_detector import ConsensusFailureDetector
            return ConsensusFailureDetector
        elif recovery_type == 'trust':
            from .failure_detector import TrustFailureDetector
            return TrustFailureDetector
        elif recovery_type == 'governance':
            from .failure_detector import GovernanceFailureDetector
            return GovernanceFailureDetector
        elif recovery_type == 'system':
            from .failure_detector import SystemFailureDetector
            return SystemFailureDetector
        else:
            self.logger.warning(f"Unsupported recovery type for detector: {recovery_type}")
            return None
    
    def _get_executor_class(self, recovery_type: str) -> Any:
        """
        Get the recovery executor class for the specified recovery type.
        
        Args:
            recovery_type: Type of recovery
            
        Returns:
            class: Recovery executor class
        """
        if recovery_type == 'consensus':
            from .recovery_executor import ConsensusRecoveryExecutor
            return ConsensusRecoveryExecutor
        elif recovery_type == 'trust':
            from .recovery_executor import TrustRecoveryExecutor
            return TrustRecoveryExecutor
        elif recovery_type == 'governance':
            from .recovery_executor import GovernanceRecoveryExecutor
            return GovernanceRecoveryExecutor
        elif recovery_type == 'system':
            from .recovery_executor import SystemRecoveryExecutor
            return SystemRecoveryExecutor
        else:
            self.logger.warning(f"Unsupported recovery type for executor: {recovery_type}")
            return None
    
    def _get_verifier_class(self, recovery_type: str) -> Any:
        """
        Get the recovery verifier class for the specified recovery type.
        
        Args:
            recovery_type: Type of recovery
            
        Returns:
            class: Recovery verifier class
        """
        if recovery_type == 'consensus':
            from .recovery_verifier import ConsensusRecoveryVerifier
            return ConsensusRecoveryVerifier
        elif recovery_type == 'trust':
            from .recovery_verifier import TrustRecoveryVerifier
            return TrustRecoveryVerifier
        elif recovery_type == 'governance':
            from .recovery_verifier import GovernanceRecoveryVerifier
            return GovernanceRecoveryVerifier
        elif recovery_type == 'system':
            from .recovery_verifier import SystemRecoveryVerifier
            return SystemRecoveryVerifier
        else:
            self.logger.warning(f"Unsupported recovery type for verifier: {recovery_type}")
            return None
    
    def detect_failures(self, recovery_type: str = None) -> Dict[str, Any]:
        """
        Detect failures in the governance system.
        
        Args:
            recovery_type: Type of recovery to detect failures for, or None for all types
            
        Returns:
            dict: Detected failures by recovery type
        """
        detected_failures = {}
        
        if recovery_type:
            # Detect failures for specific recovery type
            if recovery_type in self.failure_detectors:
                detector = self.failure_detectors[recovery_type]
                failures = detector.detect_failures()
                if failures:
                    detected_failures[recovery_type] = failures
            else:
                self.logger.warning(f"No failure detector found for {recovery_type}")
        else:
            # Detect failures for all recovery types
            for recovery_type, detector in self.failure_detectors.items():
                failures = detector.detect_failures()
                if failures:
                    detected_failures[recovery_type] = failures
        
        # Log detected failures
        if detected_failures:
            self.logger.warning(f"Detected failures: {detected_failures}")
        else:
            self.logger.info("No failures detected")
        
        return detected_failures
    
    def create_recovery_plan(self, recovery_type: str, failure_data: Dict[str, Any]) -> str:
        """
        Create a recovery plan for a detected failure.
        
        Args:
            recovery_type: Type of recovery
            failure_data: Data about the detected failure
            
        Returns:
            str: Recovery plan ID
        """
        # Generate a unique plan ID
        plan_id = str(uuid.uuid4())
        
        # Get the appropriate recovery executor
        if recovery_type not in self.recovery_executors:
            self.logger.error(f"No recovery executor found for {recovery_type}")
            return None
        
        executor = self.recovery_executors[recovery_type]
        
        # Create recovery plan
        recovery_plan = executor.create_recovery_plan(failure_data)
        if not recovery_plan:
            self.logger.error(f"Failed to create recovery plan for {recovery_type}")
            return None
        
        # Add metadata to plan
        recovery_plan['plan_id'] = plan_id
        recovery_plan['recovery_type'] = recovery_type
        recovery_plan['failure_data'] = failure_data
        recovery_plan['status'] = 'created'
        recovery_plan['created_at'] = time.time()
        recovery_plan['updated_at'] = time.time()
        
        # Store plan
        self.recovery_plans[plan_id] = recovery_plan
        
        # Log plan creation
        self.logger.info(f"Created recovery plan {plan_id} for {recovery_type}")
        
        return plan_id
    
    def execute_recovery_plan(self, plan_id: str) -> bool:
        """
        Execute a recovery plan.
        
        Args:
            plan_id: Recovery plan ID
            
        Returns:
            bool: True if execution was successful
        """
        if plan_id not in self.recovery_plans:
            self.logger.error(f"Recovery plan {plan_id} not found")
            return False
        
        recovery_plan = self.recovery_plans[plan_id]
        recovery_type = recovery_plan['recovery_type']
        
        # Get the appropriate recovery executor
        if recovery_type not in self.recovery_executors:
            self.logger.error(f"No recovery executor found for {recovery_type}")
            return False
        
        executor = self.recovery_executors[recovery_type]
        
        # Update plan status
        recovery_plan['status'] = 'executing'
        recovery_plan['execution_started_at'] = time.time()
        recovery_plan['updated_at'] = time.time()
        
        # Execute recovery plan
        try:
            success = executor.execute_recovery_plan(recovery_plan)
            
            # Update plan status
            if success:
                recovery_plan['status'] = 'executed'
                self.logger.info(f"Recovery plan {plan_id} executed successfully")
            else:
                recovery_plan['status'] = 'failed'
                self.logger.error(f"Recovery plan {plan_id} execution failed")
            
            recovery_plan['execution_completed_at'] = time.time()
            recovery_plan['updated_at'] = time.time()
            
            return success
        except Exception as e:
            # Handle execution errors
            recovery_plan['status'] = 'failed'
            recovery_plan['error'] = str(e)
            recovery_plan['execution_completed_at'] = time.time()
            recovery_plan['updated_at'] = time.time()
            
            self.logger.error(f"Error executing recovery plan {plan_id}: {str(e)}")
            return False
    
    def verify_recovery(self, plan_id: str) -> bool:
        """
        Verify that a recovery was successful.
        
        Args:
            plan_id: Recovery plan ID
            
        Returns:
            bool: True if verification was successful
        """
        if plan_id not in self.recovery_plans:
            self.logger.error(f"Recovery plan {plan_id} not found")
            return False
        
        recovery_plan = self.recovery_plans[plan_id]
        recovery_type = recovery_plan['recovery_type']
        
        # Check if plan was executed
        if recovery_plan['status'] != 'executed':
            self.logger.error(f"Recovery plan {plan_id} has not been executed")
            return False
        
        # Get the appropriate recovery verifier
        if recovery_type not in self.recovery_verifiers:
            self.logger.error(f"No recovery verifier found for {recovery_type}")
            return False
        
        verifier = self.recovery_verifiers[recovery_type]
        
        # Update plan status
        recovery_plan['status'] = 'verifying'
        recovery_plan['verification_started_at'] = time.time()
        recovery_plan['updated_at'] = time.time()
        
        # Verify recovery
        try:
            success = verifier.verify_recovery(recovery_plan)
            
            # Update plan status
            if success:
                recovery_plan['status'] = 'verified'
                self.logger.info(f"Recovery plan {plan_id} verified successfully")
            else:
                recovery_plan['status'] = 'verification_failed'
                self.logger.error(f"Recovery plan {plan_id} verification failed")
            
            recovery_plan['verification_completed_at'] = time.time()
            recovery_plan['updated_at'] = time.time()
            
            return success
        except Exception as e:
            # Handle verification errors
            recovery_plan['status'] = 'verification_failed'
            recovery_plan['verification_error'] = str(e)
            recovery_plan['verification_completed_at'] = time.time()
            recovery_plan['updated_at'] = time.time()
            
            self.logger.error(f"Error verifying recovery plan {plan_id}: {str(e)}")
            return False
    
    def perform_recovery(self, recovery_type: str, failure_data: Dict[str, Any]) -> bool:
        """
        Perform a complete recovery process (create plan, execute, verify).
        
        Args:
            recovery_type: Type of recovery
            failure_data: Data about the detected failure
            
        Returns:
            bool: True if recovery was successful
        """
        # Create recovery plan
        plan_id = self.create_recovery_plan(recovery_type, failure_data)
        if not plan_id:
            return False
        
        # Execute recovery plan
        execution_success = self.execute_recovery_plan(plan_id)
        if not execution_success:
            return False
        
        # Verify recovery
        verification_success = self.verify_recovery(plan_id)
        
        # Add to recovery history
        self.recovery_history[plan_id] = self.recovery_plans[plan_id]
        
        return verification_success
    
    def get_recovery_plan(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a recovery plan.
        
        Args:
            plan_id: Recovery plan ID
            
        Returns:
            dict or None: Recovery plan
        """
        if plan_id not in self.recovery_plans:
            self.logger.error(f"Recovery plan {plan_id} not found")
            return None
        
        return self.recovery_plans[plan_id]
    
    def get_recovery_history(self) -> Dict[str, Dict[str, Any]]:
        """
        Get the recovery history.
        
        Returns:
            dict: Recovery history
        """
        return self.recovery_history
    
    def get_active_recoveries(self) -> Dict[str, Dict[str, Any]]:
        """
        Get active recovery operations.
        
        Returns:
            dict: Active recoveries
        """
        active = {}
        for plan_id, plan in self.recovery_plans.items():
            if plan['status'] in ['executing', 'verifying']:
                active[plan_id] = plan
        
        return active
    
    def cancel_recovery(self, plan_id: str) -> bool:
        """
        Cancel an active recovery operation.
        
        Args:
            plan_id: Recovery plan ID
            
        Returns:
            bool: True if cancellation was successful
        """
        if plan_id not in self.recovery_plans:
            self.logger.error(f"Recovery plan {plan_id} not found")
            return False
        
        recovery_plan = self.recovery_plans[plan_id]
        
        # Check if plan is active
        if recovery_plan['status'] not in ['executing', 'verifying']:
            self.logger.warning(f"Recovery plan {plan_id} is not active")
            return False
        
        # Update plan status
        recovery_plan['status'] = 'cancelled'
        recovery_plan['cancelled_at'] = time.time()
        recovery_plan['updated_at'] = time.time()
        
        self.logger.info(f"Recovery plan {plan_id} cancelled")
        return True
