"""
Test suite for the Constitutional Governance Framework in Promethios.

This module contains unit tests for the Constitutional Governance Framework,
ensuring that amendments, the CRITIC agent, and migration tools work correctly.
"""

import os
import sys
import unittest
import tempfile
from unittest.mock import patch, MagicMock

# Add the repository root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))

from codex.tools.critic_agent import CRITICAgent
from codex.tools.migration_generator import MigrationChecklistGenerator


class TestConstitutionalGovernanceFramework(unittest.TestCase):
    """Test cases for the Constitutional Governance Framework."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.amendment_path = os.path.join(self.temp_dir.name, 'test_amendment.md')
        
        # Create a test amendment file
        with open(self.amendment_path, 'w') as f:
            f.write("""
# Constitutional Amendment Template

## Metadata
- **Amendment ID**: CGF-2025-TEST
- **Title**: Test Amendment
- **Author**: Test Author
- **Date Proposed**: 2025-05-25
- **Status**: Draft
- **Behavior Version**: 6.4.0
- **Affected Components**: core, monitoring

## Summary
A test amendment for unit testing.

## Motivation
To ensure the Constitutional Governance Framework works correctly.

## Current Behavior
The system currently uses 'completed' state for all terminations.

## Proposed Behavior
The system will use 'aborted' state for resource limit and timeout terminations.

## Philosophical Implications
This change has philosophical implications.

## Backward Compatibility
This change may impact backward compatibility.

## Implementation Requirements
Technical requirements for implementing this change.

## Governance Requirements
Governance instrumentation required for this change.

## Migration Path
High-level migration steps.

## Alternatives Considered
Other approaches that were considered.

## References
- Related amendments
""")
    
    def tearDown(self):
        """Tear down test fixtures."""
        self.temp_dir.cleanup()
    
    def test_critic_agent_initialization(self):
        """Test that the CRITIC agent can be initialized."""
        critic = CRITICAgent()
        self.assertIsNotNone(critic)
        self.assertIsNotNone(critic.constitutional_principles)
    
    def test_critic_agent_analyze_amendment(self):
        """Test that the CRITIC agent can analyze an amendment."""
        critic = CRITICAgent()
        
        # Mock the _generate_reflection method to avoid complex analysis
        with patch.object(critic, '_generate_reflection', return_value="Test reflection"):
            reflection = critic.analyze_amendment(self.amendment_path)
            
            # Verify that reflection is generated
            self.assertIsNotNone(reflection)
            self.assertEqual(reflection, "Test reflection")
    
    def test_migration_generator_initialization(self):
        """Test that the migration generator can be initialized."""
        generator = MigrationChecklistGenerator()
        self.assertIsNotNone(generator)
    
    def test_migration_generator_generate_checklist(self):
        """Test that the migration generator can generate a checklist."""
        generator = MigrationChecklistGenerator()
        
        # Generate a checklist
        checklist = generator.generate_checklist(self.amendment_path)
        
        # Verify that checklist is generated
        self.assertIsNotNone(checklist)
        self.assertIn("Migration Checklist for Amendment CGF-2025-TEST", checklist)
        self.assertIn("Test Amendment", checklist)
        
        # Verify that checklist contains expected sections
        self.assertIn("## Code Changes", checklist)
        self.assertIn("## Test Updates", checklist)
        self.assertIn("## Configuration Updates", checklist)
        self.assertIn("## Verification Steps", checklist)
        self.assertIn("## Documentation Updates", checklist)
        self.assertIn("## Governance Verification", checklist)


if __name__ == '__main__':
    unittest.main()
