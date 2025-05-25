"""
Base test case for end-to-end tests

This module provides the base test case for end-to-end tests,
including component loading, result recording, and test utilities.
"""

import os
import sys
import unittest
import importlib
import logging
import time
from typing import Dict, List, Any, Optional, Tuple, Type, Callable

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import test fixtures
from test_fixtures import SystemUnderTest, TestFixtures

class EndToEndTestCase(unittest.TestCase):
    """Base test case for end-to-end tests."""
    
    @classmethod
    def setUpClass(cls):
        """Set up the test class."""
        logger.info(f"Setting up test class: {cls.__name__}")
        cls.system = SystemUnderTest()
        cls.system.setup()
        
        # Create a temporary directory for the test class
        cls.class_temp_dir = TestFixtures.create_temp_directory()
        cls.system.add_temp_directory(cls.class_temp_dir)
    
    @classmethod
    def tearDownClass(cls):
        """Tear down the test class."""
        logger.info(f"Tearing down test class: {cls.__name__}")
        cls.system.teardown()
    
    def setUp(self):
        """Set up the test case."""
        logger.info(f"Setting up test: {self._testMethodName}")
        self.start_time = time.time()
    
    def tearDown(self):
        """Tear down the test case."""
        logger.info(f"Tearing down test: {self._testMethodName}")
        duration = time.time() - self.start_time
        logger.info(f"Test duration: {duration:.2f} seconds")
    
    def load_component(self, module_path: str, class_name: str) -> Optional[Type]:
        """
        Load a component class from a module.
        
        Args:
            module_path: Module path
            class_name: Class name
            
        Returns:
            Optional[Type]: Component class if found, None otherwise
        """
        # Try direct import first
        try:
            module = importlib.import_module(module_path)
            component_class = getattr(module, class_name)
            logger.info(f"Successfully imported {module_path} as {module.__name__}")
            return component_class
        except ImportError:
            logger.warning(f"Failed to import module {module_path}: No module named '{module_path}'")
        except AttributeError:
            logger.warning(f"Failed to import {class_name} from {module_path}: Module does not have attribute '{class_name}'")
        
        # Try alternative import paths
        alt_paths = [
            f"phase_6_3_1_implementation.{module_path}",
            module_path.split('.')[-1]
        ]
        
        for alt_path in alt_paths:
            try:
                module = importlib.import_module(alt_path)
                component_class = getattr(module, class_name)
                logger.info(f"Successfully imported {alt_path} as {module.__name__}")
                return component_class
            except ImportError:
                logger.warning(f"Failed to import module {alt_path}: No module named '{alt_path}'")
            except AttributeError:
                logger.warning(f"Failed to import {class_name} from {alt_path}: Module does not have attribute '{class_name}'")
        
        return None
    
    def assert_with_result(self, condition: bool, message: str, details: Dict[str, Any] = None) -> None:
        """
        Assert a condition and record the result.
        
        Args:
            condition: Condition to assert
            message: Assertion message
            details: Additional details to record
        """
        try:
            self.assertTrue(condition, message)
            self.record_result(True, details)
        except AssertionError as e:
            self.record_result(False, details)
            raise
    
    def record_result(self, passed: bool, details: Dict[str, Any] = None) -> None:
        """
        Record a test result.
        
        Args:
            passed: Whether the test passed
            details: Additional details to record
        """
        test_class = self.__class__.__name__
        test_name = self._testMethodName
        status = "pass" if passed else "fail"
        
        TestFixtures.record_test_result(test_class, test_name, status, details)
