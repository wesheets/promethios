"""
Debug script for investigating the error recovery hang in loop management.

This script adds instrumentation to identify where the recovery process is hanging.
"""

import os
import sys
import time
import logging
import threading
import traceback
from typing import Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("debug_recovery")

# Add timeout decorator for detecting hangs
def timeout(seconds, error_message="Function call timed out"):
    def decorator(func):
        def wrapper(*args, **kwargs):
            result = [None]
            error = [None]
            
            def target():
                try:
                    result[0] = func(*args, **kwargs)
                except Exception as e:
                    error[0] = e
                    logger.error(f"Exception in {func.__name__}: {str(e)}")
                    logger.error(traceback.format_exc())
            
            thread = threading.Thread(target=target)
            thread.daemon = True
            thread.start()
            thread.join(seconds)
            
            if thread.is_alive():
                logger.error(f"TIMEOUT: {error_message} in {func.__name__}")
                logger.error(f"Args: {args}, Kwargs: {kwargs}")
                # Get stack trace of the hanging thread
                for th in threading.enumerate():
                    if th == thread:
                        frame = sys._current_frames().get(th.ident)
                        if frame:
                            logger.error("Stack trace of hanging thread:")
                            logger.error(''.join(traceback.format_stack(frame)))
                raise TimeoutError(error_message)
            
            if error[0]:
                raise error[0]
            
            return result[0]
        return wrapper
    return decorator

# Import the loop management components with instrumentation
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Monkey patch the StatePersistenceManager to add logging and timeouts
from loop_controller import StatePersistenceManager, LoopState, TerminationReason

original_get_lock = StatePersistenceManager.get_lock
def instrumented_get_lock(self, loop_id):
    logger.debug(f"Getting lock for loop {loop_id}")
    lock = original_get_lock(self, loop_id)
    logger.debug(f"Got lock for loop {loop_id}")
    return lock

original_transaction = StatePersistenceManager.transaction
def instrumented_transaction(self, loop_id):
    logger.debug(f"Creating transaction for loop {loop_id}")
    result = original_transaction(self, loop_id)
    logger.debug(f"Created transaction for loop {loop_id}")
    return result

original_load_state = StatePersistenceManager.load_state
def instrumented_load_state(self, loop_id):
    logger.debug(f"Loading state for loop {loop_id}")
    start_time = time.time()
    result = original_load_state(self, loop_id)
    logger.debug(f"Loaded state for loop {loop_id} in {time.time() - start_time:.4f}s")
    return result

original_save_state = StatePersistenceManager.save_state
def instrumented_save_state(self, loop_id, state):
    logger.debug(f"Saving state for loop {loop_id}")
    start_time = time.time()
    result = original_save_state(self, loop_id, state)
    logger.debug(f"Saved state for loop {loop_id} in {time.time() - start_time:.4f}s")
    return result

# Apply the monkey patches
StatePersistenceManager.get_lock = instrumented_get_lock
StatePersistenceManager.transaction = instrumented_transaction
StatePersistenceManager.load_state = instrumented_load_state
StatePersistenceManager.save_state = instrumented_save_state

# Import the recovery components
from loop_recovery import LoopRecoveryManager, RecoverableLoopController

# Monkey patch the recovery methods to add logging and timeouts
original_recover_from_failure = LoopRecoveryManager.recover_from_failure
@timeout(5, "Recovery from failure timed out")
def instrumented_recover_from_failure(self, loop_controller):
    logger.debug(f"Starting recovery from failure for loop {loop_controller.loop_id}")
    start_time = time.time()
    result = original_recover_from_failure(self, loop_controller)
    logger.debug(f"Completed recovery from failure for loop {loop_controller.loop_id} in {time.time() - start_time:.4f}s")
    return result

original_recover_from_checkpoint = LoopRecoveryManager.recover_from_checkpoint
@timeout(5, "Recovery from checkpoint timed out")
def instrumented_recover_from_checkpoint(self, loop_controller, checkpoint_id=None):
    logger.debug(f"Starting recovery from checkpoint for loop {loop_controller.loop_id}")
    start_time = time.time()
    result = original_recover_from_checkpoint(self, loop_controller, checkpoint_id)
    logger.debug(f"Completed recovery from checkpoint for loop {loop_controller.loop_id} in {time.time() - start_time:.4f}s")
    return result

# Apply the monkey patches
LoopRecoveryManager.recover_from_failure = instrumented_recover_from_failure
LoopRecoveryManager.recover_from_checkpoint = instrumented_recover_from_checkpoint

def run_error_recovery_test():
    """Run the error recovery test with instrumentation."""
    import tempfile
    import shutil
    
    logger.info("Starting error recovery test with instrumentation")
    
    # Create test directory
    test_dir = tempfile.mkdtemp()
    logger.info(f"Created test directory: {test_dir}")
    
    try:
        # Create recovery manager and loop controller
        logger.info("Creating recovery manager")
        recovery_manager = LoopRecoveryManager(test_dir)
        
        logger.info("Creating loop controller")
        loop_controller = RecoverableLoopController(
            loop_id="test_loop", 
            storage_dir=os.path.join(test_dir, "state")
        )
        
        # Set up initial state with error
        logger.info("Setting up initial state with error")
        loop_controller.update_state({
            "state": LoopState.FAILED.value,
            "termination_reason": TerminationReason.ERROR.value,
            "error_count": 3,
            "last_error": "Test error"
        })
        
        # Create checkpoint before error
        logger.info("Creating checkpoint")
        checkpoint = recovery_manager.create_checkpoint(loop_controller)
        logger.info(f"Created checkpoint: {checkpoint.checkpoint_id}")
        
        # Recover from error
        logger.info("Starting recovery from failure")
        try:
            result = recovery_manager.recover_from_failure(loop_controller)
            logger.info(f"Recovery result: {result.success}, Strategy: {result.strategy}, Actions: {result.actions}")
        except Exception as e:
            logger.error(f"Recovery failed with exception: {str(e)}")
            logger.error(traceback.format_exc())
            return False
        
        # Force reload state from disk
        logger.info("Reloading state from disk")
        if hasattr(loop_controller.state_manager, "clear_cache"):
            loop_controller.state_manager.clear_cache(loop_controller.loop_id)
        
        # Verify state
        logger.info("Verifying state")
        state = loop_controller.get_state()
        logger.info(f"Current state: {state.get('state')}")
        
        if state.get("state") == LoopState.FAILED.value:
            logger.error("Test failed: State is still FAILED after recovery")
            return False
        else:
            logger.info("Test passed: State is no longer FAILED after recovery")
            return True
    
    except Exception as e:
        logger.error(f"Unexpected exception: {str(e)}")
        logger.error(traceback.format_exc())
        return False
    
    finally:
        # Clean up
        logger.info(f"Cleaning up test directory: {test_dir}")
        shutil.rmtree(test_dir)

if __name__ == "__main__":
    success = run_error_recovery_test()
    if success:
        logger.info("Error recovery test completed successfully")
        sys.exit(0)
    else:
        logger.error("Error recovery test failed")
        sys.exit(1)
