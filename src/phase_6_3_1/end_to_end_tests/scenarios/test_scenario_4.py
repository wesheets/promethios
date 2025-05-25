"""
Scenario 4: Loop Management with Recovery

This test scenario validates that loop management works correctly with recovery
mechanisms from Phase 2.3 through Phase 6.3.1.
"""

import os
import sys
import time
import unittest
import logging
from typing import Dict, List, Any, Optional

# Import base test case
from base_test_case import EndToEndTestCase
from test_fixtures import TestFixtures

# Configure logger
logger = logging.getLogger(__name__)


class TestLoopManagementRecovery(EndToEndTestCase):
    """Test loop management with recovery mechanisms."""
    
    def setUp(self):
        """Set up test fixtures."""
        super().setUp()
        
        # Import required components
        self.loop_controller = self.load_component(
            'phase_6_3_1_implementation.loop_management.loop_controller',
            'LoopController'
        )
        
        self.loop_recovery = self.load_component(
            'phase_6_3_1_implementation.loop_management.loop_recovery_fixed',
            'LoopRecoveryManager'
        )
        
        self.state_persistence = self.load_component(
            'phase_6_3_1_implementation.loop_management.loop_controller',
            'StatePersistenceManager'
        )
        
        self.trust_propagation_manager = self.load_component(
            'phase_6_3_1_implementation.trust_propagation_manager',
            'TrustPropagationManager'
        )
        
        # Create test directory
        self.test_dir = TestFixtures.create_temp_directory()
        
        # Initialize components if they were loaded successfully
        if all([self.loop_controller, self.loop_recovery, self.state_persistence, self.trust_propagation_manager]):
            # Initialize trust components
            self.propagation_manager = self.trust_propagation_manager(
                storage_dir=os.path.join(self.test_dir, "trust_propagation")
            )
            
            # Initialize loop management components
            self.persistence_manager = self.state_persistence(
                storage_dir=os.path.join(self.test_dir, "state_persistence")
            )
            
            self.controller = self.loop_controller(
                persistence_manager=self.persistence_manager,
                storage_dir=os.path.join(self.test_dir, "loop_controller")
            )
            
            self.recovery_manager = self.loop_recovery(
                persistence_manager=self.persistence_manager,
                storage_dir=os.path.join(self.test_dir, "loop_recovery")
            )
            
            # Register with the system under test
            self.system.components.update({
                'propagation_manager': self.propagation_manager,
                'persistence_manager': self.persistence_manager,
                'controller': self.controller,
                'recovery_manager': self.recovery_manager
            })
    
    def test_loop_termination_conditions(self):
        """Test loop termination conditions."""
        # Skip if components weren't loaded
        if not hasattr(self, 'controller'):
            self.skipTest("Required components could not be loaded")
        
        try:
            # Create a loop with timeout condition
            loop_id = "timeout_loop"
            
            # Define loop parameters
            loop_params = {
                "max_iterations": 100,
                "timeout_seconds": 1,  # Short timeout for testing
                "resource_limits": {
                    "max_memory_mb": 100,
                    "max_cpu_percent": 80
                }
            }
            
            # Create a simple loop function that counts
            def loop_function(state):
                if 'counter' not in state:
                    state['counter'] = 0
                state['counter'] += 1
                time.sleep(0.1)  # Small delay to simulate work
                return state
            
            # Execute the loop with timeout condition
            result = self.controller.execute_loop(
                loop_id=loop_id,
                loop_function=loop_function,
                initial_state={'counter': 0},
                loop_params=loop_params
            )
            
            # Verify loop terminated due to timeout
            self.assert_with_result(
                result['termination_reason'] == 'timeout',
                f"Loop should terminate due to timeout, got {result.get('termination_reason')}",
                {"result": result}
            )
            
            # Create a loop with max iterations condition
            loop_id = "max_iterations_loop"
            
            # Update loop parameters
            loop_params = {
                "max_iterations": 5,
                "timeout_seconds": 30,  # Longer timeout
                "resource_limits": {
                    "max_memory_mb": 100,
                    "max_cpu_percent": 80
                }
            }
            
            # Execute the loop with max iterations condition
            result = self.controller.execute_loop(
                loop_id=loop_id,
                loop_function=loop_function,
                initial_state={'counter': 0},
                loop_params=loop_params
            )
            
            # Verify loop terminated due to max iterations
            self.assert_with_result(
                result['termination_reason'] == 'max_iterations',
                f"Loop should terminate due to max iterations, got {result.get('termination_reason')}",
                {"result": result}
            )
            
            # Verify the final state
            self.assert_with_result(
                result['final_state']['counter'] == 5,
                f"Counter should be 5, got {result['final_state'].get('counter')}",
                {"final_state": result['final_state']}
            )
            
        except Exception as e:
            logger.error(f"Error in test_loop_termination_conditions: {e}")
            self.record_result(False, {"error": str(e)})
            raise
    
    def test_state_persistence_and_recovery(self):
        """Test state persistence and recovery."""
        # Skip if components weren't loaded
        if not hasattr(self, 'persistence_manager'):
            self.skipTest("Required components could not be loaded")
        
        try:
            # Create a test state
            loop_id = "persistence_test_loop"
            test_state = {
                "counter": 42,
                "name": "test_loop",
                "data": {
                    "key1": "value1",
                    "key2": [1, 2, 3],
                    "key3": {"nested": "value"}
                }
            }
            
            # Save the state
            self.persistence_manager.save_state(loop_id, test_state)
            
            # Load the state
            loaded_state = self.persistence_manager.load_state(loop_id)
            
            # Verify state was persisted correctly
            self.assert_with_result(
                loaded_state == test_state,
                "Loaded state should match saved state",
                {"saved_state": test_state, "loaded_state": loaded_state}
            )
            
            # Create a new persistence manager to simulate restart
            new_persistence_manager = self.state_persistence(
                storage_dir=os.path.join(self.test_dir, "state_persistence")
            )
            
            # Load the state with the new manager
            loaded_state_after_restart = new_persistence_manager.load_state(loop_id)
            
            # Verify state was persisted correctly across restarts
            self.assert_with_result(
                loaded_state_after_restart == test_state,
                "Loaded state after restart should match saved state",
                {"saved_state": test_state, "loaded_state_after_restart": loaded_state_after_restart}
            )
            
        except Exception as e:
            logger.error(f"Error in test_state_persistence_and_recovery: {e}")
            self.record_result(False, {"error": str(e)})
            raise
    
    def test_recovery_from_failure(self):
        """Test recovery from loop failure."""
        # Skip if components weren't loaded
        if not hasattr(self, 'recovery_manager'):
            self.skipTest("Required components could not be loaded")
        
        try:
            # Create a loop that will fail
            loop_id = "failing_loop"
            
            # Define initial state with checkpoint
            initial_state = {
                "counter": 0,
                "checkpoint": {
                    "counter": 0,
                    "last_successful_iteration": 0
                }
            }
            
            # Define a loop function that fails after a few iterations
            def failing_loop_function(state):
                state['counter'] += 1
                
                # Create checkpoint every 2 iterations
                if state['counter'] % 2 == 0:
                    state['checkpoint'] = {
                        "counter": state['counter'],
                        "last_successful_iteration": state['counter']
                    }
                
                # Fail at iteration 5
                if state['counter'] == 5:
                    raise ValueError("Simulated failure at iteration 5")
                
                return state
            
            # Save initial state
            self.persistence_manager.save_state(loop_id, initial_state)
            
            # Execute the loop (will fail)
            try:
                self.controller.execute_loop(
                    loop_id=loop_id,
                    loop_function=failing_loop_function,
                    initial_state=initial_state,
                    loop_params={"max_iterations": 10, "timeout_seconds": 30}
                )
            except ValueError:
                # Expected failure
                pass
            
            # Recover from failure
            recovery_result = self.recovery_manager.recover_from_failure(
                loop_id=loop_id,
                error_info={"error_type": "ValueError", "message": "Simulated failure at iteration 5"}
            )
            
            # Verify recovery was successful
            self.assert_with_result(
                recovery_result['success'],
                "Recovery should be successful",
                {"recovery_result": recovery_result}
            )
            
            # Verify recovered state has the last checkpoint
            self.assert_with_result(
                recovery_result['recovered_state']['counter'] == 4,
                f"Recovered counter should be 4, got {recovery_result['recovered_state'].get('counter')}",
                {"recovered_state": recovery_result['recovered_state']}
            )
            
            # Continue execution with recovered state
            def continuation_function(state):
                state['counter'] += 1
                return state
            
            # Execute the continuation
            continuation_result = self.controller.execute_loop(
                loop_id=loop_id,
                loop_function=continuation_function,
                initial_state=recovery_result['recovered_state'],
                loop_params={"max_iterations": 3, "timeout_seconds": 30}
            )
            
            # Verify continuation completed successfully
            self.assert_with_result(
                continuation_result['termination_reason'] == 'max_iterations',
                f"Continuation should terminate due to max iterations, got {continuation_result.get('termination_reason')}",
                {"continuation_result": continuation_result}
            )
            
            # Verify final state
            self.assert_with_result(
                continuation_result['final_state']['counter'] == 7,
                f"Final counter should be 7, got {continuation_result['final_state'].get('counter')}",
                {"final_state": continuation_result['final_state']}
            )
            
        except Exception as e:
            logger.error(f"Error in test_recovery_from_failure: {e}")
            self.record_result(False, {"error": str(e)})
            raise
    
    def test_loop_with_trust_boundaries(self):
        """Test loop execution with trust boundaries."""
        # Skip if components weren't loaded
        if not hasattr(self, 'controller') or not hasattr(self, 'propagation_manager'):
            self.skipTest("Required components could not be loaded")
        
        try:
            # Create entities with trust boundaries
            entity_id = "loop_entity"
            self.propagation_manager.register_entity(
                entity_id=entity_id,
                trust_score=0.8,
                attributes={"role": "loop_executor", "access_level": "high"}
            )
            
            # Create a trust boundary
            boundary_id = "loop_boundary"
            self.propagation_manager.create_trust_boundary(
                boundary_id=boundary_id,
                min_trust_score=0.7,
                required_attributes=["role", "access_level"],
                description="Boundary for loop execution"
            )
            
            # Define a loop function that checks trust boundary
            def trust_boundary_loop(state):
                # Get current entity
                entity = self.propagation_manager.get_entity(entity_id)
                
                # Check if entity passes boundary
                if entity['trust_score'] < 0.7:
                    state['boundary_passed'] = False
                    return state
                
                # Update state
                state['counter'] += 1
                state['boundary_passed'] = True
                
                # Simulate work
                time.sleep(0.1)
                
                return state
            
            # Execute the loop
            loop_id = "trust_boundary_loop"
            result = self.controller.execute_loop(
                loop_id=loop_id,
                loop_function=trust_boundary_loop,
                initial_state={'counter': 0, 'boundary_passed': False},
                loop_params={"max_iterations": 5, "timeout_seconds": 30}
            )
            
            # Verify loop completed successfully
            self.assert_with_result(
                result['termination_reason'] == 'max_iterations',
                f"Loop should terminate due to max iterations, got {result.get('termination_reason')}",
                {"result": result}
            )
            
            # Verify boundary was passed
            self.assert_with_result(
                result['final_state']['boundary_passed'],
                "Boundary should be passed",
                {"final_state": result['final_state']}
            )
            
            # Update entity to fail boundary
            self.propagation_manager.update_entity(
                entity_id=entity_id,
                trust_score=0.6,  # Below boundary threshold
                attributes={"role": "loop_executor", "access_level": "medium"}
            )
            
            # Execute the loop again
            loop_id = "trust_boundary_loop_fail"
            result = self.controller.execute_loop(
                loop_id=loop_id,
                loop_function=trust_boundary_loop,
                initial_state={'counter': 0, 'boundary_passed': False},
                loop_params={"max_iterations": 5, "timeout_seconds": 30}
            )
            
            # Verify boundary was not passed
            self.assert_with_result(
                not result['final_state']['boundary_passed'],
                "Boundary should not be passed",
                {"final_state": result['final_state']}
            )
            
            # Verify counter didn't increase
            self.assert_with_result(
                result['final_state']['counter'] == 0,
                f"Counter should be 0, got {result['final_state'].get('counter')}",
                {"final_state": result['final_state']}
            )
            
        except Exception as e:
            logger.error(f"Error in test_loop_with_trust_boundaries: {e}")
            self.record_result(False, {"error": str(e)})
            raise


if __name__ == "__main__":
    unittest.main()
