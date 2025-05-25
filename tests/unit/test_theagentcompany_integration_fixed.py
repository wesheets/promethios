"""
Update test_theagentcompany_integration.py to use compatibility layer.

This module contains tests for the TheAgentCompany integration system.
"""

import unittest
import json
from unittest.mock import patch, MagicMock

# Import the module to test using compatibility layer
from src.integration.theagentcompany_integration import TheAgentCompanyIntegration
from src.integration.compatibility import BenchmarkType

# Rest of the test file remains unchanged
