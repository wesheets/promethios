"""
Isolated test for TimestampSynchronizationService thread shutdown.

This module provides a minimal test case to verify that the
TimestampSynchronizationService thread can be properly shut down.
"""

import time
import threading
import logging
import unittest
import os
import sys
import signal
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("IsolatedTest")

# Fix import path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
from timestamp_synchronization import TimestampSynchronizationService

class TestTimestampSynchronizationShutdown(unittest.TestCase):
    """Test case for verifying TimestampSynchronizationService shutdown."""
    
    def setUp(self):
        """Set up test environment."""
        # Use mock NTP servers to avoid network dependencies
        self.mock_ntp_servers = ["localhost"]
        # Use a short sync interval for faster testing
        self.sync_interval = 1
        
        # Create service instance
        logger.info("Creating TimestampSynchronizationService instance")
        self.service = TimestampSynchronizationService(
            ntp_servers=self.mock_ntp_servers,
            sync_interval=self.sync_interval
        )
        
        # Verify service is running
        self.assertTrue(hasattr(self.service, 'sync_thread'))
        self.assertTrue(self.service.sync_thread.is_alive())
        logger.info("Service initialized and thread is alive")
    
    def tearDown(self):
        """Clean up after test."""
        # Ensure service is shut down
        if hasattr(self, 'service'):
            logger.info("Cleaning up service in tearDown")
            try:
                self.service.shutdown()
            except Exception as e:
                logger.error(f"Error during tearDown shutdown: {str(e)}")
    
    def test_shutdown_terminates_thread(self):
        """Test that shutdown properly terminates the sync thread."""
        # Let the service run for a bit
        logger.info("Letting service run for 3 seconds")
        time.sleep(3)
        
        # Verify thread is still alive
        self.assertTrue(self.service.sync_thread.is_alive())
        logger.info("Thread is still alive after initial run period")
        
        # Shutdown the service
        logger.info("Shutting down service")
        self.service.shutdown()
        
        # Wait a bit for shutdown to complete
        logger.info("Waiting for shutdown to complete")
        time.sleep(2)
        
        # Verify thread is terminated
        thread_alive = self.service.sync_thread.is_alive()
        logger.info(f"Thread alive status after shutdown: {thread_alive}")
        self.assertFalse(thread_alive, "Thread should be terminated after shutdown")
        
        # Verify internal state
        self.assertFalse(self.service._running, "_running flag should be False")
        self.assertTrue(self.service._shutdown_event.is_set(), "shutdown_event should be set")
        
        logger.info("Shutdown test completed successfully")

class TestTimestampSynchronizationWithTimeout(unittest.TestCase):
    """Test case for verifying TimestampSynchronizationService shutdown with timeout."""
    
    def setUp(self):
        """Set up test environment."""
        # Use mock NTP servers to avoid network dependencies
        self.mock_ntp_servers = ["localhost"]
        # Use a short sync interval for faster testing
        self.sync_interval = 1
        
        # Create service instance
        logger.info("Creating TimestampSynchronizationService instance")
        self.service = TimestampSynchronizationService(
            ntp_servers=self.mock_ntp_servers,
            sync_interval=self.sync_interval
        )
        
        # Set up timeout handler
        def timeout_handler(signum, frame):
            logger.error("TEST TIMEOUT: Test did not complete in time")
            # Force exit if test hangs
            os._exit(1)
        
        # Register timeout handler
        signal.signal(signal.SIGALRM, timeout_handler)
        # Set 10 second timeout
        signal.alarm(10)
    
    def tearDown(self):
        """Clean up after test."""
        # Cancel timeout
        signal.alarm(0)
        
        # Ensure service is shut down
        if hasattr(self, 'service'):
            logger.info("Cleaning up service in tearDown")
            try:
                self.service.shutdown()
            except Exception as e:
                logger.error(f"Error during tearDown shutdown: {str(e)}")
    
    def test_shutdown_with_timeout(self):
        """Test that shutdown completes within a reasonable time."""
        # Let the service run for a bit
        logger.info("Letting service run for 2 seconds")
        time.sleep(2)
        
        # Record start time
        start_time = time.time()
        
        # Shutdown the service
        logger.info("Shutting down service")
        self.service.shutdown()
        
        # Record end time
        end_time = time.time()
        shutdown_duration = end_time - start_time
        
        # Verify shutdown completed in reasonable time
        logger.info(f"Shutdown completed in {shutdown_duration:.2f} seconds")
        self.assertLess(shutdown_duration, 5.0, "Shutdown should complete in less than 5 seconds")
        
        # Verify thread is terminated
        thread_alive = self.service.sync_thread.is_alive()
        logger.info(f"Thread alive status after shutdown: {thread_alive}")
        self.assertFalse(thread_alive, "Thread should be terminated after shutdown")
        
        logger.info("Shutdown timeout test completed successfully")

if __name__ == "__main__":
    unittest.main()
