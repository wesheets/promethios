"""
Test fixtures and utilities for end-to-end tests

This module provides test fixtures and utilities for end-to-end tests,
including temporary directory creation and test result tracking.
"""

import os
import sys
import tempfile
import shutil
import logging
import json
from typing import Dict, List, Any, Optional

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TestFixtures:
    """Test fixtures and utilities for end-to-end tests."""
    
    # Class-level storage for test results
    _test_results = {}
    
    @classmethod
    def create_temp_directory(cls) -> str:
        """
        Create a temporary directory for test files.
        
        Returns:
            str: Path to the temporary directory
        """
        temp_dir = tempfile.mkdtemp(prefix="promethios_e2e_test_")
        logger.info(f"Created temporary directory: {temp_dir}")
        return temp_dir
    
    @classmethod
    def remove_temp_directory(cls, temp_dir: str) -> None:
        """
        Remove a temporary directory and its contents.
        
        Args:
            temp_dir: Path to the temporary directory
        """
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
            logger.info(f"Removed temporary directory: {temp_dir}")
    
    @classmethod
    def record_test_result(cls, test_class: str, test_name: str, status: str, details: Dict[str, Any] = None) -> None:
        """
        Record a test result.
        
        Args:
            test_class: Test class name
            test_name: Test method name
            status: Test status (pass, fail, error, skipped)
            details: Test details
        """
        if test_class not in cls._test_results:
            cls._test_results[test_class] = {}
        
        cls._test_results[test_class][test_name] = {
            "status": status,
            "details": details or {}
        }
    
    @classmethod
    def get_test_results(cls) -> Dict[str, Dict[str, Dict[str, Any]]]:
        """
        Get all recorded test results.
        
        Returns:
            Dict[str, Dict[str, Dict[str, Any]]]: Test results by class and method
        """
        return cls._test_results
    
    @classmethod
    def save_test_results(cls, file_path: str) -> None:
        """
        Save test results to a JSON file.
        
        Args:
            file_path: Path to the output JSON file
        """
        with open(file_path, "w") as f:
            json.dump(cls._test_results, f, indent=2)
        logger.info(f"Test results saved to: {file_path}")


class SystemUnderTest:
    """System under test container."""
    
    def __init__(self):
        """Initialize the system under test."""
        self.components = {}
        self.temp_dirs = []
    
    def setup(self) -> None:
        """Set up the system under test."""
        logger.info("SystemUnderTest setup")
    
    def teardown(self) -> None:
        """Tear down the system under test."""
        # Clean up temporary directories
        for temp_dir in self.temp_dirs:
            TestFixtures.remove_temp_directory(temp_dir)
        
        # Clear components
        self.components.clear()
        
        logger.info("SystemUnderTest teardown completed")
    
    def add_temp_directory(self, temp_dir: str) -> None:
        """
        Add a temporary directory to be cleaned up during teardown.
        
        Args:
            temp_dir: Path to the temporary directory
        """
        self.temp_dirs.append(temp_dir)
