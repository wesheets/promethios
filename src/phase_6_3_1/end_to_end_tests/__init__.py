"""
End-to-End Test Suite for Phase 2.3 through Phase 6.3.1

This package contains comprehensive tests that validate the integration
and functionality of all components from Phase 2.3 through Phase 6.3.1
of the Promethios project.
"""

import os
import sys
import unittest
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'test_execution.log')),
        logging.StreamHandler()
    ]
)

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
