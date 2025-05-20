#!/usr/bin/env python3
"""
Import Statement Update Script

Codex Contract: v2025.05.18
Phase: 5.2.6
Clauses: 5.2.6, 5.2.5

This script updates import statements across the codebase to reference
either canonical module locations or compatibility layers.
"""

import os
import re
import sys

# Map of old module names to their canonical import paths
MODULE_MAP = {
    'merkle_tree': 'src.core.merkle.merkle_tree',
    'merkle_sealing': 'src.core.merkle.merkle_sealing',
    'conflict_detection': 'src.core.merkle.conflict_detection',
    'output_capture': 'src.core.merkle.output_capture',
    'network_topology_manager': 'src.core.verification.network_topology_manager',
    'verification_node_manager': 'src.core.verification.verification_node_manager',
    'consensus_service': 'src.core.verification.consensus_service',
    'seal_distribution_service': 'src.core.verification.seal_distribution_service',
    'trust_aggregation_service': 'src.core.verification.trust_aggregation_service',
    'seal_verification': 'src.core.verification.seal_verification',
    'governance_contract_sync': 'src.core.governance.governance_contract_sync',
    'governance_mesh_integration': 'src.core.governance.governance_mesh_integration',
    'governance_proposal_protocol': 'src.core.governance.governance_proposal_protocol',
    'mesh_topology_manager': 'src.core.governance.mesh_topology_manager',
    'governance_core': 'src.core.governance.governance_core',
    'trust_log_writer': 'src.core.trust.trust_log_writer',
    'schema_validator': 'src.core.common.schema_validator',
    'runtime_executor_integration': 'src.integration.runtime_executor_integration',
    'trust_log_integration': 'src.integration.trust_log_integration',
    'distributed_verification_integration': 'src.integration.distributed_verification_integration',
    'validate_schema': 'src.utils.validate_schema',
    'validate_schema_compliance': 'src.utils.validate_schema_compliance',
    'verify_log_hashes': 'src.utils.verify_log_hashes',
    'view_logs': 'src.utils.view_logs',
    'package_logs': 'src.utils.package_logs',
    'test_data_generator': 'src.utils.test_data_generator',
    'repository_hygiene_validator': 'src.utils.repository_hygiene_validator',
    'analyze_component_usage': 'src.utils.analyze_component_usage',
    'saas_connector': 'src.api.saas_connector',
    'cli_trigger': 'src.cli.cli_trigger',
    'main': 'src.main',
    'runtime_executor': 'src.main.runtime_executor',
    'replay_sealing': 'src.replay.replay_sealing',
    'deterministic_execution': 'src.replay.deterministic_execution'
}

def update_imports_in_file(file_path):
    """Update import statements in a file to use canonical paths."""
    print(f"Updating imports in: {file_path}")
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        original_content = content
        
        # Update import statements
        for module_name, canonical_path in MODULE_MAP.items():
            # Match various import patterns
            patterns = [
                (f"import {module_name}(?![a-zA-Z0-9_])", f"import {canonical_path}"),
                (f"from {module_name} import", f"from {canonical_path} import"),
                (f"import {module_name} as", f"import {canonical_path} as")
            ]
            
            for pattern, replacement in patterns:
                content = re.sub(pattern, replacement, content)
        
        # Only write if content has changed
        if content != original_content:
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"  Updated imports in: {file_path}")
        else:
            print(f"  No changes needed in: {file_path}")
            
        return True
    except Exception as e:
        print(f"Error updating imports in {file_path}: {e}")
        return False

def update_all_imports():
    """Update import statements in all Python files."""
    success_count = 0
    error_count = 0
    
    for root, _, files in os.walk("."):
        if ".git" in root:
            continue
        
        for file in files:
            if file.endswith(".py"):
                file_path = os.path.join(root, file)
                if update_imports_in_file(file_path):
                    success_count += 1
                else:
                    error_count += 1
    
    print(f"\nImport update complete.")
    print(f"Successfully updated: {success_count} files")
    print(f"Errors: {error_count} files")

def create_init_files():
    """Create __init__.py files in all directories to make them proper packages."""
    dirs_with_init = 0
    
    for root, dirs, files in os.walk("src"):
        if ".git" in root:
            continue
        
        # Check if __init__.py exists
        if "__init__.py" not in files:
            init_path = os.path.join(root, "__init__.py")
            with open(init_path, 'w') as f:
                f.write(f"""# {os.path.basename(root)} package
# Codex Contract: v2025.05.18
# Phase: 5.2.6
# Clauses: 5.2.6, 5.2.5
""")
            print(f"Created: {init_path}")
            dirs_with_init += 1
    
    print(f"\nCreated {dirs_with_init} __init__.py files")

def create_pythonpath_script():
    """Create a script to set PYTHONPATH for running tests."""
    script_content = """#!/bin/bash
# Set PYTHONPATH for running tests
# Codex Contract: v2025.05.18
# Phase: 5.2.6
# Clauses: 5.2.6, 5.2.5

# Add the current directory to PYTHONPATH
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Run the tests with the specified arguments
python -m pytest "$@"
"""
    
    with open("run_tests.sh", 'w') as f:
        f.write(script_content)
    
    os.chmod("run_tests.sh", 0o755)
    print("Created run_tests.sh script for setting PYTHONPATH")

def main():
    """Main function to execute the import update."""
    print("Starting import statement update...")
    
    # Create __init__.py files
    create_init_files()
    
    # Update import statements
    update_all_imports()
    
    # Create PYTHONPATH script
    create_pythonpath_script()
    
    print("\nImport update complete. Use ./run_tests.sh to run tests with the correct PYTHONPATH.")

if __name__ == "__main__":
    main()
