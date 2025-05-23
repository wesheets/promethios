"""
Integration tests for the Governance Recovery Mechanisms.

This module provides tests to validate the integration of all recovery components,
ensuring they work together correctly to recover from governance system failures.
"""

import unittest
import json
import os
import tempfile
import time
from typing import Dict, List, Any

from src.core.recovery.recovery_manager import RecoveryManager
from src.core.recovery.failure_detector import ConsensusFailureDetector, TrustFailureDetector
from src.core.recovery.recovery_executor import ConsensusRecoveryExecutor, TrustRecoveryExecutor
from src.core.recovery.recovery_verifier import ConsensusRecoveryVerifier, TrustRecoveryVerifier
from src.core.recovery.recovery_audit_logger import RecoveryAuditLogger
from src.core.recovery.recovery_compensator import RecoveryCompensator

class TestGovernanceRecoveryIntegration(unittest.TestCase):
    """Integration tests for the Governance Recovery Mechanisms."""
    
    def setUp(self):
        """Set up test environment."""
        # Create a temporary config file
        self.config_file = tempfile.NamedTemporaryFile(delete=False)
        config = {
            'recovery_types': ['consensus', 'trust', 'governance', 'system'],
            'max_recovery_time': 3600,
            'verification_timeout': 300,
            'max_retries': 3,
            'audit_level': 'detailed'
        }
        with open(self.config_file.name, 'w') as f:
            json.dump(config, f)
        
        # Initialize components
        self.recovery_manager = RecoveryManager(self.config_file.name)
        self.consensus_detector = ConsensusFailureDetector(config)
        self.trust_detector = TrustFailureDetector(config)
        self.consensus_executor = ConsensusRecoveryExecutor(config)
        self.trust_executor = TrustRecoveryExecutor(config)
        self.consensus_verifier = ConsensusRecoveryVerifier(config)
        self.trust_verifier = TrustRecoveryVerifier(config)
        self.audit_logger = RecoveryAuditLogger(config)
        self.compensator = RecoveryCompensator(config)
        
        # Create a temporary log directory
        self.log_dir = tempfile.mkdtemp()
        config['log_directory'] = self.log_dir
        self.audit_logger = RecoveryAuditLogger(config)
    
    def tearDown(self):
        """Clean up after tests."""
        os.unlink(self.config_file.name)
        
        # Clean up log directory
        for filename in os.listdir(self.log_dir):
            os.unlink(os.path.join(self.log_dir, filename))
        os.rmdir(self.log_dir)
    
    def test_consensus_recovery_flow(self):
        """Test the complete consensus recovery flow."""
        # Create a simulated consensus failure
        failure_data = {
            'failure_id': 'test_consensus_failure',
            'failure_type': 'consensus_timeout',
            'proposal_id': 'proposal_123',
            'timestamp': time.time()
        }
        
        # Log the detection
        self.audit_logger.log_detection(failure_data)
        
        # Create a recovery plan
        plan_id = self.recovery_manager.create_recovery_plan('consensus', failure_data)
        self.assertIsNotNone(plan_id)
        
        # Get the recovery plan
        recovery_plan = self.recovery_manager.get_recovery_plan(plan_id)
        self.assertIsNotNone(recovery_plan)
        self.assertEqual(recovery_plan['recovery_type'], 'consensus')
        
        # Execute the recovery plan
        execution_success = self.recovery_manager.execute_recovery_plan(plan_id)
        self.assertTrue(execution_success)
        
        # Verify the recovery
        verification_success = self.recovery_manager.verify_recovery(plan_id)
        self.assertTrue(verification_success)
        
        # Check recovery history
        recovery_history = self.recovery_manager.get_recovery_history()
        self.assertIn(plan_id, recovery_history)
        self.assertEqual(recovery_history[plan_id]['status'], 'verified')
    
    def test_trust_recovery_flow(self):
        """Test the complete trust recovery flow."""
        # Create a simulated trust failure
        failure_data = {
            'failure_id': 'test_trust_failure',
            'failure_type': 'trust_decay',
            'domain_id': 'domain_123',
            'timestamp': time.time()
        }
        
        # Log the detection
        self.audit_logger.log_detection(failure_data)
        
        # Create a recovery plan
        plan_id = self.recovery_manager.create_recovery_plan('trust', failure_data)
        self.assertIsNotNone(plan_id)
        
        # Get the recovery plan
        recovery_plan = self.recovery_manager.get_recovery_plan(plan_id)
        self.assertIsNotNone(recovery_plan)
        self.assertEqual(recovery_plan['recovery_type'], 'trust')
        
        # Execute the recovery plan
        execution_success = self.recovery_manager.execute_recovery_plan(plan_id)
        self.assertTrue(execution_success)
        
        # Verify the recovery
        verification_success = self.recovery_manager.verify_recovery(plan_id)
        self.assertTrue(verification_success)
        
        # Check recovery history
        recovery_history = self.recovery_manager.get_recovery_history()
        self.assertIn(plan_id, recovery_history)
        self.assertEqual(recovery_history[plan_id]['status'], 'verified')
    
    def test_failed_recovery_compensation(self):
        """Test compensation for a failed recovery."""
        # Create a simulated consensus failure
        failure_data = {
            'failure_id': 'test_failed_recovery',
            'failure_type': 'consensus_timeout',
            'proposal_id': 'proposal_456',
            'timestamp': time.time()
        }
        
        # Create a recovery plan
        recovery_plan = self.consensus_executor.create_recovery_plan(failure_data)
        recovery_plan['plan_id'] = 'test_plan'
        recovery_plan['recovery_type'] = 'consensus'
        recovery_plan['failure_data'] = failure_data
        
        # Simulate a failed execution
        execution_data = {
            'step': 2,
            'action': 'restart_consensus_process',
            'parameters': {'proposal_id': 'proposal_456'},
            'success': False,
            'error': 'Simulated failure'
        }
        
        # Compensate for the failed recovery
        compensation_success = self.compensator.compensate_recovery(recovery_plan, execution_data)
        self.assertTrue(compensation_success)
        
        # Check compensation history
        compensation_history = self.compensator.get_compensation_history('test_plan')
        self.assertIsNotNone(compensation_history)
        self.assertIn('test_plan', compensation_history)
    
    def test_audit_logging(self):
        """Test audit logging for recovery operations."""
        # Create a simulated consensus failure
        failure_data = {
            'failure_id': 'test_audit_logging',
            'failure_type': 'consensus_timeout',
            'proposal_id': 'proposal_789',
            'timestamp': time.time()
        }
        
        # Log the detection
        self.audit_logger.log_detection(failure_data)
        
        # Create a recovery plan
        plan_data = {
            'plan_id': 'test_plan',
            'recovery_type': 'consensus',
            'failure_data': failure_data,
            'steps': [
                {
                    'action': 'reset_consensus_timer',
                    'parameters': {'proposal_id': 'proposal_789'}
                }
            ]
        }
        self.audit_logger.log_plan_creation(plan_data)
        
        # Log execution
        execution_data = {
            'plan_id': 'test_plan',
            'step': 1,
            'action': 'reset_consensus_timer',
            'parameters': {'proposal_id': 'proposal_789'},
            'success': True
        }
        self.audit_logger.log_execution(execution_data)
        
        # Log verification
        verification_data = {
            'plan_id': 'test_plan',
            'success': True
        }
        self.audit_logger.log_verification(verification_data)
        
        # Get logs
        logs = self.audit_logger.get_recovery_logs()
        self.assertGreaterEqual(len(logs), 4)  # At least 4 log entries
        
        # Check log types
        log_types = [log.get('event_type') for log in logs]
        self.assertIn('detection', log_types)
        self.assertIn('plan_creation', log_types)
        self.assertIn('execution', log_types)
        self.assertIn('verification', log_types)
    
    def test_recovery_manager_integration(self):
        """Test integration of all recovery components through the recovery manager."""
        # Create a simulated consensus failure
        failure_data = {
            'failure_id': 'test_integration',
            'failure_type': 'consensus_timeout',
            'proposal_id': 'proposal_999',
            'timestamp': time.time()
        }
        
        # Perform complete recovery process
        recovery_success = self.recovery_manager.perform_recovery('consensus', failure_data)
        self.assertTrue(recovery_success)
        
        # Check active recoveries (should be empty after completion)
        active_recoveries = self.recovery_manager.get_active_recoveries()
        self.assertEqual(len(active_recoveries), 0)
        
        # Check recovery history
        recovery_history = self.recovery_manager.get_recovery_history()
        self.assertGreaterEqual(len(recovery_history), 1)
        
        # Find the recovery for our test
        test_recovery = None
        for plan_id, plan in recovery_history.items():
            if plan.get('failure_data', {}).get('failure_id') == 'test_integration':
                test_recovery = plan
                break
        
        self.assertIsNotNone(test_recovery)
        self.assertEqual(test_recovery['status'], 'verified')

if __name__ == '__main__':
    unittest.main()
