"""
Migration Checklist Generator

This module implements a tool for automatically generating migration checklists
from constitutional amendments in the Promethios system.
"""

import os
import re
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class MigrationChecklistGenerator:
    """
    Generator for migration checklists based on constitutional amendments.
    """
    
    def __init__(self, config=None):
        """Initialize the generator with optional configuration."""
        self.config = config or {}
        
    def generate_checklist(self, amendment_path, output_path=None):
        """
        Generate a migration checklist from a constitutional amendment.
        
        Args:
            amendment_path: Path to the amendment file
            output_path: Optional path for the output checklist
            
        Returns:
            str: Migration checklist content
        """
        # Read amendment content
        with open(amendment_path, 'r') as f:
            content = f.read()
            
        # Extract key sections
        amendment_id = self._extract_metadata(content, "Amendment ID")
        title = self._extract_metadata(content, "Title")
        behavior_version = self._extract_metadata(content, "Behavior Version")
        affected_components = self._extract_metadata(content, "Affected Components")
        current_behavior = self._extract_section(content, "Current Behavior")
        proposed_behavior = self._extract_section(content, "Proposed Behavior")
        migration_path = self._extract_section(content, "Migration Path")
        
        # Generate checklist sections
        code_changes = self._generate_code_changes(
            current_behavior, proposed_behavior, affected_components)
        test_updates = self._generate_test_updates(
            current_behavior, proposed_behavior, affected_components)
        config_updates = self._generate_config_updates(
            current_behavior, proposed_behavior)
        verification_steps = self._generate_verification_steps(
            current_behavior, proposed_behavior)
        doc_updates = self._generate_doc_updates(
            title, behavior_version, affected_components)
        
        # Format checklist
        checklist = self._format_checklist(
            amendment_id, title, behavior_version,
            code_changes, test_updates, config_updates,
            verification_steps, doc_updates, migration_path)
        
        # Write output if path provided
        if output_path:
            with open(output_path, 'w') as f:
                f.write(checklist)
                
        return checklist
        
    def _extract_metadata(self, content, field_name):
        """Extract metadata field from the amendment content."""
        pattern = rf"\*\*{field_name}\*\*: (.*?)(?:\n|$)"
        match = re.search(pattern, content)
        if match:
            return match.group(1).strip()
        return ""
        
    def _extract_section(self, content, section_name):
        """Extract a section from the amendment content."""
        pattern = rf"## {section_name}\n(.*?)(?:\n##|\Z)"
        match = re.search(pattern, content, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""
        
    def _generate_code_changes(self, current_behavior, proposed_behavior, affected_components):
        """Generate code change checklist items."""
        changes = []
        
        # Parse affected components
        components = [c.strip() for c in affected_components.split(',')]
        
        # Look for state changes
        if "state" in current_behavior and "state" in proposed_behavior:
            if "aborted" in proposed_behavior and "completed" in current_behavior:
                changes.append("Update loop termination handlers to check for 'aborted' state")
                changes.append("Modify resource limit handlers to set 'aborted' state")
                changes.append("Update timeout handlers to set 'aborted' state")
                changes.append("Add termination reason field to state object")
                
        # Look for recovery changes
        if "recovery" in current_behavior and "recovery" in proposed_behavior:
            if "preserve" in proposed_behavior:
                changes.append("Update checkpoint recovery to preserve new state keys")
            if "failed" in proposed_behavior:
                changes.append("Modify error recovery to maintain 'failed' state")
                
        # Look for monitoring changes
        if "monitor" in current_behavior and "monitor" in proposed_behavior:
            if "events" in proposed_behavior:
                changes.append("Add new monitoring events for recovery operations")
                
        # Add component-specific changes
        for component in components:
            changes.append(f"Update {component} to comply with new behavior")
            
        return changes
        
    def _generate_test_updates(self, current_behavior, proposed_behavior, affected_components):
        """Generate test update checklist items."""
        updates = []
        
        # Parse affected components
        components = [c.strip() for c in affected_components.split(',')]
        
        # Look for state changes
        if "state" in current_behavior and "state" in proposed_behavior:
            if "aborted" in proposed_behavior and "completed" in current_behavior:
                updates.append("Update test_resource_limit_condition to expect 'aborted' state")
                updates.append("Update test_timeout_condition to expect 'aborted' state")
                updates.append("Add tests for termination reason field")
                
        # Look for recovery changes
        if "recovery" in current_behavior and "recovery" in proposed_behavior:
            if "preserve" in proposed_behavior:
                updates.append("Update test_recover_from_checkpoint to verify key preservation")
            if "failed" in proposed_behavior:
                updates.append("Update test_recover_from_error to verify 'failed' state maintenance")
                
        # Look for monitoring changes
        if "monitor" in current_behavior and "monitor" in proposed_behavior:
            if "events" in proposed_behavior:
                updates.append("Update test_monitor_recovery to expect additional events")
                
        # Add component-specific test updates
        for component in components:
            updates.append(f"Update tests for {component} to verify new behavior")
            
        # Add version-aware test updates
        updates.append("Add version-specific tests using @behavior_test decorator")
        
        return updates
        
    def _generate_config_updates(self, current_behavior, proposed_behavior):
        """Generate configuration update checklist items."""
        updates = []
        
        # Look for state changes
        if "state" in current_behavior and "state" in proposed_behavior:
            if "aborted" in proposed_behavior and "completed" in current_behavior:
                updates.append("Add legacy_state_reporting configuration option")
                updates.append("Document configuration option in settings guide")
                
        # Look for recovery changes
        if "recovery" in current_behavior and "recovery" in proposed_behavior:
            updates.append("Add recovery_mode configuration parameter")
            updates.append("Document recovery mode options in settings guide")
                
        # Look for monitoring changes
        if "monitor" in current_behavior and "monitor" in proposed_behavior:
            if "events" in proposed_behavior:
                updates.append("Add monitoring_verbosity configuration option")
                updates.append("Document monitoring verbosity levels in settings guide")
                
        # Add behavior version configuration
        updates.append("Add behavior_version configuration option")
        updates.append("Document behavior version options in settings guide")
        
        return updates
        
    def _generate_verification_steps(self, current_behavior, proposed_behavior):
        """Generate verification checklist items."""
        steps = []
        
        # Look for state changes
        if "state" in current_behavior and "state" in proposed_behavior:
            if "aborted" in proposed_behavior and "completed" in current_behavior:
                steps.append("Verify resource limit termination produces 'aborted' state")
                steps.append("Verify timeout termination produces 'aborted' state")
                steps.append("Verify normal completion still produces 'completed' state")
                steps.append("Verify legacy_state_reporting=true produces 'completed' state for all terminations")
                
        # Look for recovery changes
        if "recovery" in current_behavior and "recovery" in proposed_behavior:
            if "preserve" in proposed_behavior:
                steps.append("Verify checkpoint recovery preserves new state keys")
            if "failed" in proposed_behavior:
                steps.append("Verify error recovery maintains 'failed' state")
                
        # Look for monitoring changes
        if "monitor" in current_behavior and "monitor" in proposed_behavior:
            if "events" in proposed_behavior:
                steps.append("Verify recovery operations generate expected monitoring events")
                steps.append("Verify monitoring_verbosity configuration controls event generation")
                
        # Add governance verification
        steps.append("Verify all modules report to the trust system")
        steps.append("Verify memory logging includes behavior version information")
        steps.append("Verify semantic shift detection works for the new behavior")
        
        return steps
        
    def _generate_doc_updates(self, title, behavior_version, affected_components):
        """Generate documentation update checklist items."""
        updates = []
        
        # Add standard documentation updates
        updates.append(f"Update API documentation for {title}")
        updates.append(f"Update developer guide with new behavior in version {behavior_version}")
        updates.append("Add migration note to release documentation")
        
        # Parse affected components
        components = [c.strip() for c in affected_components.split(',')]
        
        # Add component-specific documentation updates
        for component in components:
            updates.append(f"Update documentation for {component}")
            
        # Add governance documentation
        updates.append("Update constitutional governance documentation")
        updates.append("Document behavior versioning options")
        
        return updates
        
    def _format_checklist(self, amendment_id, title, behavior_version,
                         code_changes, test_updates, config_updates,
                         verification_steps, doc_updates, migration_path):
        """Format the migration checklist."""
        lines = [f"# Migration Checklist for Amendment {amendment_id}"]
        lines.append("")
        lines.append(f"## Overview")
        lines.append(f"This checklist provides migration steps for implementing '{title}' in version {behavior_version}.")
        lines.append("")
        
        # Add original migration path if provided
        if migration_path:
            lines.append("## Original Migration Notes")
            lines.append(migration_path)
            lines.append("")
        
        # Add code changes
        lines.append("## Code Changes")
        for change in code_changes:
            lines.append(f"- [ ] {change}")
        lines.append("")
        
        # Add test updates
        lines.append("## Test Updates")
        for update in test_updates:
            lines.append(f"- [ ] {update}")
        lines.append("")
        
        # Add configuration updates
        lines.append("## Configuration Updates")
        for update in config_updates:
            lines.append(f"- [ ] {update}")
        lines.append("")
        
        # Add verification steps
        lines.append("## Verification Steps")
        for step in verification_steps:
            lines.append(f"- [ ] {step}")
        lines.append("")
        
        # Add documentation updates
        lines.append("## Documentation Updates")
        for update in doc_updates:
            lines.append(f"- [ ] {update}")
        lines.append("")
        
        # Add governance verification
        lines.append("## Governance Verification")
        lines.append("- [ ] Verify constitutional amendment is properly documented")
        lines.append("- [ ] Verify CHANGELOG.md is updated")
        lines.append("- [ ] Verify behavior version is registered")
        lines.append("- [ ] Verify governance wrappers are applied to affected modules")
        
        return "\n".join(lines)


def main():
    """Main function for CLI usage."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Migration Checklist Generator")
    parser.add_argument("amendment_path", help="Path to the amendment file")
    parser.add_argument("--output", "-o", help="Output path for checklist")
    parser.add_argument("--config", "-c", help="Path to configuration file")
    
    args = parser.parse_args()
    
    # Load config if provided
    config = None
    if args.config:
        with open(args.config, 'r') as f:
            config = json.load(f)
    
    # Create generator
    generator = MigrationChecklistGenerator(config)
    
    # Generate checklist
    checklist = generator.generate_checklist(args.amendment_path, args.output)
    
    # Output checklist if no output path provided
    if not args.output:
        print(checklist)


if __name__ == "__main__":
    main()
