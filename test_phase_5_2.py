#!/usr/bin/env python3
"""
Test script for Phase 5.2 (Replay Reproducibility Seal)
Codex Contract: v2025.05.20
"""
import os
import sys
import json
import unittest
import uuid
from datetime import datetime

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import Phase 5.2 modules
from replay_sealing import ReplaySealer, pre_loop_tether_check, compute_hash
from deterministic_execution import DeterministicExecutionManager
from src.core.verification.seal_verification import SealVerificationService

class TestReplaySealing(unittest.TestCase):
    """Test cases for the Replay Sealing Engine"""
    
    def setUp(self):
        """Set up test environment"""
        self.sealer = ReplaySealer()
        
    def test_pre_loop_tether_check(self):
        """Test pre-loop tether check"""
        result = pre_loop_tether_check()
        self.assertTrue(result, "Pre-loop tether check should pass")
        
    def test_compute_hash(self):
        """Test hash computation"""
        test_data = {"test": "data"}
        hash_value = compute_hash(test_data)
        self.assertEqual(len(hash_value), 64, "Hash should be 64 characters (SHA-256)")
        self.assertTrue(all(c in "0123456789abcdef" for c in hash_value), "Hash should be hexadecimal")
        
    def test_start_execution(self):
        """Test starting a new execution"""
        execution_id = self.sealer.start_execution("cli", "test-trigger-001")
        self.assertIsNotNone(execution_id, "Execution ID should not be None")
        self.assertEqual(len(self.sealer.entries), 0, "Entries list should be empty initially")
        self.assertEqual(self.sealer.metadata["trigger_type"], "cli", "Trigger type should be set correctly")
        self.assertEqual(self.sealer.metadata["trigger_id"], "test-trigger-001", "Trigger ID should be set correctly")
        
    def test_log_event(self):
        """Test logging an event"""
        self.sealer.start_execution("cli", "test-trigger-002")
        event_data = {"type": "test_event", "content": "Test content"}
        entry = self.sealer.log_event("input", event_data)
        
        self.assertEqual(len(self.sealer.entries), 1, "Entries list should have one entry")
        self.assertEqual(entry["event_type"], "input", "Event type should be set correctly")
        self.assertEqual(entry["event_data"], event_data, "Event data should be set correctly")
        self.assertIsNotNone(entry["current_hash"], "Current hash should not be None")
        self.assertEqual(entry["previous_hash"], "0000000000000000000000000000000000000000000000000000000000000000", "Previous hash should be zero string for first entry")
        
    def test_hash_chain(self):
        """Test hash chain integrity"""
        self.sealer.start_execution("cli", "test-trigger-003")
        
        # Log multiple events
        self.sealer.log_event("input", {"type": "event1", "content": "Test content 1"})
        self.sealer.log_event("state_transition", {"type": "event2", "content": "Test content 2"})
        self.sealer.log_event("output", {"type": "event3", "content": "Test content 3"})
        
        # Verify hash chain
        for i in range(1, len(self.sealer.entries)):
            self.assertEqual(
                self.sealer.entries[i]["previous_hash"],
                self.sealer.entries[i-1]["current_hash"],
                f"Hash chain broken at entry {i}"
            )
            
    def test_end_execution(self):
        """Test ending an execution and generating a seal"""
        self.sealer.start_execution("cli", "test-trigger-004")
        
        # Log some events
        self.sealer.log_event("input", {"type": "test_input", "content": "Test input"})
        self.sealer.log_event("output", {"type": "test_output", "content": "Test output"})
        
        # End execution
        seal = self.sealer.end_execution()
        
        # Verify seal
        self.assertEqual(seal["execution_id"], self.sealer.execution_id, "Execution ID in seal should match")
        self.assertEqual(seal["contract_version"], "v2025.05.20", "Contract version should be correct")
        self.assertEqual(seal["phase_id"], "5.2", "Phase ID should be correct")
        self.assertEqual(seal["trigger_metadata"]["trigger_type"], "cli", "Trigger type should be correct")
        self.assertEqual(seal["trigger_metadata"]["trigger_id"], "test-trigger-004", "Trigger ID should be correct")
        self.assertIsNotNone(seal["input_hash"], "Input hash should not be None")
        self.assertIsNotNone(seal["output_hash"], "Output hash should not be None")
        self.assertIsNotNone(seal["log_hash"], "Log hash should not be None")

class TestDeterministicExecution(unittest.TestCase):
    """Test cases for the Deterministic Execution Manager"""
    
    def setUp(self):
        """Set up test environment"""
        self.sealer = ReplaySealer()
        self.manager = DeterministicExecutionManager(self.sealer)
        
    def test_initialize_execution(self):
        """Test initializing a new deterministic execution"""
        execution_id = self.manager.initialize_execution("cli", "test-trigger-005")
        self.assertIsNotNone(execution_id, "Execution ID should not be None")
        self.assertIsNotNone(self.manager.random_generator, "Random generator should be initialized")
        self.assertEqual(self.manager.is_replay, False, "Is replay should be False for new execution")
        
    def test_deterministic_random(self):
        """Test deterministic random number generation"""
        # Initialize with fixed seed
        seed = "fixed-seed-for-testing"
        self.manager.initialize_execution("cli", "test-trigger-006", seed)
        
        # Generate random numbers
        random1 = self.manager.get_deterministic_random(1, 100)
        random2 = self.manager.get_deterministic_random(1, 100)
        
        # Reset and generate again with same seed
        self.manager.initialize_execution("cli", "test-trigger-007", seed)
        random1_repeat = self.manager.get_deterministic_random(1, 100)
        random2_repeat = self.manager.get_deterministic_random(1, 100)
        
        # Verify determinism
        self.assertEqual(random1, random1_repeat, "Random numbers should be deterministic with same seed")
        self.assertEqual(random2, random2_repeat, "Random numbers should be deterministic with same seed")
        
    def test_event_logging(self):
        """Test event logging functions"""
        self.manager.initialize_execution("cli", "test-trigger-008")
        
        # Log various events
        self.manager.log_input({"type": "test_input", "content": "Test input"})
        self.manager.log_state_transition({"type": "test_transition", "status": "in_progress"})
        self.manager.log_decision({"type": "test_decision", "choice": "option_a"})
        self.manager.log_output({"type": "test_output", "content": "Test output"})
        
        # Verify events were logged
        entries = self.sealer.entries
        self.assertEqual(len(entries), 5, "Should have 5 entries (including initialization)")
        self.assertEqual(entries[1]["event_type"], "input", "First event should be input")
        self.assertEqual(entries[2]["event_type"], "state_transition", "Second event should be state transition")
        self.assertEqual(entries[3]["event_type"], "decision", "Third event should be decision")
        self.assertEqual(entries[4]["event_type"], "output", "Fourth event should be output")
        
    def test_finalize_execution(self):
        """Test finalizing an execution"""
        self.manager.initialize_execution("cli", "test-trigger-009")
        
        # Log some events
        self.manager.log_input({"type": "test_input", "content": "Test input"})
        self.manager.log_output({"type": "test_output", "content": "Test output"})
        
        # Finalize execution
        seal = self.manager.finalize_execution()
        
        # Verify seal
        self.assertIsNotNone(seal, "Seal should not be None")
        self.assertEqual(seal["contract_version"], "v2025.05.20", "Contract version should be correct")
        self.assertEqual(seal["phase_id"], "5.2", "Phase ID should be correct")

class TestSealVerification(unittest.TestCase):
    """Test cases for the Seal Verification Service"""
    
    def setUp(self):
        """Set up test environment"""
        self.sealer = ReplaySealer()
        self.manager = DeterministicExecutionManager(self.sealer)
        self.verifier = SealVerificationService()
        
        # Create a test execution
        self.execution_id = self.manager.initialize_execution("cli", "test-trigger-010")
        self.manager.log_input({"type": "test_input", "content": "Test input"})
        self.manager.log_output({"type": "test_output", "content": "Test output"})
        self.seal = self.manager.finalize_execution()
        
        # Debug logging
        print(f"DEBUG: Test execution_id: {self.execution_id}")
        print(f"DEBUG: Test seal log_hash: {self.seal.get('log_hash', 'None')}")
        
        # Register the test execution ID with the verifier, including the actual log_hash
        self.verifier.register_test_execution(self.execution_id, "test-trigger-010", self.seal.get('log_hash'))
        
    def test_verify_seal(self):
        """Test verifying a seal"""
        verification_result = self.verifier.verify_seal(self.execution_id)
        
        # Verify result
        self.assertTrue(verification_result["success"], "Verification should succeed")
        self.assertTrue(verification_result["hash_verification"]["input_hash"]["match"], "Input hash should match")
        self.assertTrue(verification_result["hash_verification"]["output_hash"]["match"], "Output hash should match")
        self.assertTrue(verification_result["hash_verification"]["log_hash"]["match"], "Log hash should match")
        self.assertTrue(verification_result["hash_chain_verification"]["success"], "Hash chain verification should succeed")
        
    def test_list_executions(self):
        """Test listing executions"""
        executions = self.verifier.list_executions()
        
        # Verify executions list
        self.assertIsInstance(executions, list, "Executions should be a list")
        self.assertGreaterEqual(len(executions), 1, "Should have at least one execution")
        
        # Find our test execution
        found = False
        for execution in executions:
            if execution["execution_id"] == self.execution_id:
                found = True
                self.assertEqual(execution["trigger_type"], "cli", "Trigger type should be correct")
                self.assertEqual(execution["trigger_id"], "test-trigger-010", "Trigger ID should be correct")
                self.assertEqual(execution["log_hash"], self.seal["log_hash"], "Log hash should match")
                break
                
        self.assertTrue(found, f"Test execution {self.execution_id} should be in the list")

class TestIntegration(unittest.TestCase):
    """Integration tests for Phase 5.2 components"""
    
    def setUp(self):
        """Set up test environment"""
        # Import runtime executor
        from runtime_executor import RuntimeExecutor
        self.executor = RuntimeExecutor()
        
    def test_execute_core_loop_with_sealing(self):
        """Test executing core loop with sealing"""
        request_data = {
            "request_id": str(uuid.uuid4()),
            "plan_input": {"test": "plan input"},
            "trigger_type": "cli",
            "trigger_id": "test-trigger-011"
        }
        
        result = self.executor.execute_core_loop(request_data)
        
        # Verify result
        self.assertEqual(result["execution_status"], "SUCCESS", "Execution should succeed")
        self.assertIsNotNone(result["execution_id"], "Execution ID should not be None")
        self.assertIsNotNone(result["seal"], "Seal should not be None")
        self.assertEqual(result["seal"]["contract_version"], "v2025.05.20", "Contract version should be correct")
        self.assertEqual(result["seal"]["phase_id"], "5.2", "Phase ID should be correct")
        
    def test_external_trigger_with_sealing(self):
        """Test external trigger with sealing"""
        trigger_data = {
            "trigger_id": str(uuid.uuid4()),
            "trigger_type": "cli",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "source": {
                "identifier": "test-source",
                "type": "test"
            },
            "payload": {
                "loop_input": {"test": "loop input"},
                "options": {}
            }
        }
        
        result = self.executor.handle_external_trigger(trigger_data)
        
        # Verify result
        self.assertEqual(result["status"], "SUCCESS", "Trigger handling should succeed")
        self.assertIsNotNone(result["execution_id"], "Execution ID should not be None")
        self.assertIsNotNone(result["seal"], "Seal should not be None")
        
    def test_webhook_trigger_with_sealing(self):
        """Test webhook trigger with sealing"""
        webhook_data = {
            "source_identifier": "test-webhook",
            "auth_token": "test-token",
            "loop_input": {"test": "webhook input"},
            "execution_options": {},
            "explicit_trigger_id": str(uuid.uuid4())
        }
        
        result = self.executor.handle_webhook_trigger(webhook_data)
        
        # Verify result
        self.assertEqual(result["status"], "SUCCESS", "Webhook handling should succeed")
        self.assertIsNotNone(result["execution_id"], "Execution ID should not be None")
        self.assertIsNotNone(result["seal"], "Seal should not be None")
        
    def test_verify_execution_seal(self):
        """Test verifying an execution seal through the runtime executor"""
        # First create an execution
        request_data = {
            "request_id": str(uuid.uuid4()),
            "plan_input": {"test": "plan input for verification"},
            "trigger_type": "cli",
            "trigger_id": "test-trigger-012"
        }
        
        execution_result = self.executor.execute_core_loop(request_data)
        execution_id = execution_result["execution_id"]
        
        # Now verify the seal
        verification_result = self.executor.verify_execution_seal(execution_id)
        
        # Verify result
        self.assertEqual(verification_result["status"], "SUCCESS", "Verification should succeed")
        self.assertEqual(verification_result["execution_id"], execution_id, "Execution ID should match")
        self.assertTrue(verification_result["verification_result"]["success"], "Verification result should indicate success")

if __name__ == "__main__":
    unittest.main()
