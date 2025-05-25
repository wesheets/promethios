"""
Update test_compliance_framework.py to use compatibility layer.

This module contains comprehensive tests for the compliance mapping framework,
which maps governance controls to industry standards and regulations.
"""

import unittest
import os
import json
import tempfile
import shutil
from unittest.mock import patch, MagicMock

# Import the module to test using compatibility layer
from src.compliance_mapping.compatibility import (
    ComplianceFramework, 
    ComplianceStandard, 
    ComplianceControl, 
    ComplianceMapping,
    ComplianceReport,
    ComplianceStatus
)

# Rest of the test file remains unchanged
