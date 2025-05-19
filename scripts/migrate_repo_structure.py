#!/usr/bin/env python3
"""
Repository Structure Migration Script

Codex Contract: v2025.05.18
Phase: 5.2.6
Clauses: 5.2.6, 5.2.5

This script automates the migration of files to their canonical locations
as defined in the module registry. It tracks all moves for traceability
and creates compatibility layers for import statements.
"""

import os
import sys
import json
import shutil
import re
from datetime import datetime

# Configuration
MODULE_REGISTRY_PATH = "registry/module_registry.json"
MIGRATION_LOG_PATH = "registry/migration_log.json"
COMPATIBILITY_DIR = "src/compatibility"

def load_module_registry():
    """Load the module registry from JSON file."""
    try:
        with open(MODULE_REGISTRY_PATH, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading module registry: {e}")
        sys.exit(1)

def create_migration_log():
    """Create or load the migration log."""
    if os.path.exists(MIGRATION_LOG_PATH):
        try:
            with open(MIGRATION_LOG_PATH, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading migration log: {e}")
            return {
                "version": "1.0.0",
                "last_updated": datetime.now().isoformat(),
                "migrations": []
            }
    else:
        return {
            "version": "1.0.0",
            "last_updated": datetime.now().isoformat(),
            "migrations": []
        }

def save_migration_log(log):
    """Save the migration log to JSON file."""
    log["last_updated"] = datetime.now().isoformat()
    os.makedirs(os.path.dirname(MIGRATION_LOG_PATH), exist_ok=True)
    with open(MIGRATION_LOG_PATH, 'w') as f:
        json.dump(log, f, indent=2)

def ensure_directory_exists(path):
    """Ensure that a directory exists, creating it if necessary."""
    directory = os.path.dirname(path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)
        print(f"Created directory: {directory}")

def move_file(source, destination):
    """Move a file from source to destination, ensuring the destination directory exists."""
    if not os.path.exists(source):
        print(f"Warning: Source file does not exist: {source}")
        return False
    
    ensure_directory_exists(destination)
    
    try:
        shutil.copy2(source, destination)
        print(f"Copied: {source} -> {destination}")
        return True
    except Exception as e:
        print(f"Error copying file: {e}")
        return False

def create_compatibility_layer(original_path, canonical_path):
    """Create a compatibility layer for import statements."""
    if not os.path.exists(canonical_path):
        print(f"Warning: Canonical file does not exist: {canonical_path}")
        return False
    
    compatibility_path = os.path.join(COMPATIBILITY_DIR, original_path)
    ensure_directory_exists(compatibility_path)
    
    # Get the module name from the file path
    module_name = os.path.basename(canonical_path).split('.')[0]
    
    # Get the canonical module path for import
    canonical_module_path = os.path.dirname(canonical_path).replace('/', '.')
    if canonical_module_path.startswith('.'):
        canonical_module_path = canonical_module_path[1:]
    
    # Create compatibility file with import redirection
    with open(compatibility_path, 'w') as f:
        f.write(f"""# Compatibility layer for {original_path}
# This file redirects imports to the canonical location: {canonical_path}
# Codex Contract: v2025.05.18
# Phase: 5.2.6
# Clauses: 5.2.6, 5.2.5

# Import all from canonical module
from {canonical_module_path}.{module_name} import *
""")
    
    print(f"Created compatibility layer: {compatibility_path}")
    return True

def update_import_statements(file_path, moved_files):
    """Update import statements in a file based on moved files."""
    if not os.path.exists(file_path):
        print(f"Warning: File does not exist: {file_path}")
        return False
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Map of original module names to new module paths
        module_map = {}
        for original, canonical in moved_files.items():
            module_name = os.path.basename(original).split('.')[0]
            new_module_path = os.path.dirname(canonical).replace('/', '.')
            if new_module_path.startswith('.'):
                new_module_path = new_module_path[1:]
            module_map[module_name] = f"{new_module_path}.{module_name}"
        
        # Update import statements
        for module_name, new_module_path in module_map.items():
            # Match various import patterns
            patterns = [
                (f"import {module_name}(?![a-zA-Z0-9_])", f"import {new_module_path}"),
                (f"from {module_name} import", f"from {new_module_path} import"),
                (f"import {module_name} as", f"import {new_module_path} as")
            ]
            
            for pattern, replacement in patterns:
                content = re.sub(pattern, replacement, content)
        
        with open(file_path, 'w') as f:
            f.write(content)
        
        print(f"Updated import statements in: {file_path}")
        return True
    except Exception as e:
        print(f"Error updating import statements: {e}")
        return False

def migrate_schemas(registry):
    """Migrate schema files based on the module registry."""
    migration_log = create_migration_log()
    moved_files = {}
    
    # Process each schema category in the registry
    for category, schemas in registry.get("schemas", {}).items():
        for schema_name, schema_info in schemas.items():
            if isinstance(schema_info, dict) and "canonical_path" in schema_info:
                # Determine source path - schemas are in schemas/ directory
                source_path = os.path.join("schemas", schema_name)
                canonical_path = schema_info["canonical_path"]
                
                if move_file(source_path, canonical_path):
                    moved_files[source_path] = canonical_path
                    migration_log["migrations"].append({
                        "timestamp": datetime.now().isoformat(),
                        "source": source_path,
                        "destination": canonical_path,
                        "type": "schema",
                        "category": category,
                        "name": schema_name
                    })
    
    save_migration_log(migration_log)
    return moved_files

def migrate_core_modules(registry):
    """Migrate core modules based on the module registry."""
    migration_log = create_migration_log()
    moved_files = {}
    
    # Process each module category in the registry
    for category, modules in registry.get("core", {}).items():
        for module_name, module_info in modules.items():
            if isinstance(module_info, dict) and "canonical_path" in module_info:
                # Determine source path - modules are in root directory
                source_path = module_name
                canonical_path = module_info["canonical_path"]
                
                if move_file(source_path, canonical_path):
                    moved_files[source_path] = canonical_path
                    migration_log["migrations"].append({
                        "timestamp": datetime.now().isoformat(),
                        "source": source_path,
                        "destination": canonical_path,
                        "type": "core_module",
                        "category": category,
                        "name": module_name
                    })
    
    save_migration_log(migration_log)
    return moved_files

def migrate_integration_modules(registry):
    """Migrate integration modules based on the module registry."""
    migration_log = create_migration_log()
    moved_files = {}
    
    # Process each integration module in the registry
    for module_name, module_info in registry.get("integration", {}).items():
        if isinstance(module_info, dict) and "canonical_path" in module_info:
            # Determine source path - modules are in root directory
            source_path = module_name
            canonical_path = module_info["canonical_path"]
            
            if move_file(source_path, canonical_path):
                moved_files[source_path] = canonical_path
                migration_log["migrations"].append({
                    "timestamp": datetime.now().isoformat(),
                    "source": source_path,
                    "destination": canonical_path,
                    "type": "integration_module",
                    "name": module_name
                })
    
    save_migration_log(migration_log)
    return moved_files

def migrate_utility_modules(registry):
    """Migrate utility modules based on the module registry."""
    migration_log = create_migration_log()
    moved_files = {}
    
    # Process each utility module in the registry
    for module_name, module_info in registry.get("utils", {}).items():
        if isinstance(module_info, dict) and "canonical_path" in module_info:
            # Determine source path - modules are in root directory
            source_path = module_name
            canonical_path = module_info["canonical_path"]
            
            if move_file(source_path, canonical_path):
                moved_files[source_path] = canonical_path
                migration_log["migrations"].append({
                    "timestamp": datetime.now().isoformat(),
                    "source": source_path,
                    "destination": canonical_path,
                    "type": "utility_module",
                    "name": module_name
                })
    
    save_migration_log(migration_log)
    return moved_files

def migrate_api_modules(registry):
    """Migrate API modules based on the module registry."""
    migration_log = create_migration_log()
    moved_files = {}
    
    # Process each API module in the registry
    for module_name, module_info in registry.get("api", {}).items():
        if isinstance(module_info, dict) and "canonical_path" in module_info:
            # Determine source path - modules are in root directory
            source_path = module_name
            canonical_path = module_info["canonical_path"]
            
            if move_file(source_path, canonical_path):
                moved_files[source_path] = canonical_path
                migration_log["migrations"].append({
                    "timestamp": datetime.now().isoformat(),
                    "source": source_path,
                    "destination": canonical_path,
                    "type": "api_module",
                    "name": module_name
                })
    
    save_migration_log(migration_log)
    return moved_files

def migrate_cli_modules(registry):
    """Migrate CLI modules based on the module registry."""
    migration_log = create_migration_log()
    moved_files = {}
    
    # Process each CLI module in the registry
    for module_name, module_info in registry.get("cli", {}).items():
        if isinstance(module_info, dict) and "canonical_path" in module_info:
            # Determine source path - modules are in root directory
            source_path = module_name
            canonical_path = module_info["canonical_path"]
            
            if move_file(source_path, canonical_path):
                moved_files[source_path] = canonical_path
                migration_log["migrations"].append({
                    "timestamp": datetime.now().isoformat(),
                    "source": source_path,
                    "destination": canonical_path,
                    "type": "cli_module",
                    "name": module_name
                })
    
    save_migration_log(migration_log)
    return moved_files

def migrate_main_modules(registry):
    """Migrate main modules based on the module registry."""
    migration_log = create_migration_log()
    moved_files = {}
    
    # Process each main module in the registry
    for module_name, module_info in registry.get("main", {}).items():
        if isinstance(module_info, dict) and "canonical_path" in module_info:
            # Determine source path - modules are in root directory
            source_path = module_name
            canonical_path = module_info["canonical_path"]
            
            if move_file(source_path, canonical_path):
                moved_files[source_path] = canonical_path
                migration_log["migrations"].append({
                    "timestamp": datetime.now().isoformat(),
                    "source": source_path,
                    "destination": canonical_path,
                    "type": "main_module",
                    "name": module_name
                })
    
    save_migration_log(migration_log)
    return moved_files

def migrate_replay_modules(registry):
    """Migrate replay modules based on the module registry."""
    migration_log = create_migration_log()
    moved_files = {}
    
    # Process each replay module in the registry
    for module_name, module_info in registry.get("replay", {}).items():
        if isinstance(module_info, dict) and "canonical_path" in module_info:
            # Determine source path - modules are in root directory
            source_path = module_name
            canonical_path = module_info["canonical_path"]
            
            if move_file(source_path, canonical_path):
                moved_files[source_path] = canonical_path
                migration_log["migrations"].append({
                    "timestamp": datetime.now().isoformat(),
                    "source": source_path,
                    "destination": canonical_path,
                    "type": "replay_module",
                    "name": module_name
                })
    
    save_migration_log(migration_log)
    return moved_files

def migrate_tests(registry):
    """Migrate test files based on the module registry."""
    migration_log = create_migration_log()
    moved_files = {}
    
    # Process each test category in the registry
    for category, tests in registry.get("tests", {}).items():
        for test_name, test_info in tests.items():
            if isinstance(test_info, dict) and "canonical_path" in test_info:
                # Determine source path - tests are in tests/ directory or root
                if os.path.exists(os.path.join("tests", test_name)):
                    source_path = os.path.join("tests", test_name)
                else:
                    source_path = test_name
                
                canonical_path = test_info["canonical_path"]
                
                if move_file(source_path, canonical_path):
                    moved_files[source_path] = canonical_path
                    migration_log["migrations"].append({
                        "timestamp": datetime.now().isoformat(),
                        "source": source_path,
                        "destination": canonical_path,
                        "type": "test",
                        "category": category,
                        "name": test_name
                    })
    
    save_migration_log(migration_log)
    return moved_files

def migrate_docs(registry):
    """Migrate documentation files based on the module registry."""
    migration_log = create_migration_log()
    moved_files = {}
    
    # Process each documentation category in the registry
    for category, docs in registry.get("docs", {}).items():
        for doc_name, doc_info in docs.items():
            if isinstance(doc_info, dict) and "canonical_path" in doc_info:
                # Determine source path - docs are in root directory
                source_path = doc_name
                canonical_path = doc_info["canonical_path"]
                
                if move_file(source_path, canonical_path):
                    moved_files[source_path] = canonical_path
                    migration_log["migrations"].append({
                        "timestamp": datetime.now().isoformat(),
                        "source": source_path,
                        "destination": canonical_path,
                        "type": "doc",
                        "category": category,
                        "name": doc_name
                    })
    
    save_migration_log(migration_log)
    return moved_files

def create_compatibility_layers(moved_files):
    """Create compatibility layers for all moved files."""
    ensure_directory_exists(os.path.join(COMPATIBILITY_DIR, "dummy.txt"))
    
    for original_path, canonical_path in moved_files.items():
        if original_path.endswith(".py"):
            try:
                create_compatibility_layer(original_path, canonical_path)
            except Exception as e:
                print(f"Error creating compatibility layer for {original_path}: {e}")

def update_all_import_statements(moved_files):
    """Update import statements in all Python files."""
    for root, _, files in os.walk("."):
        if ".git" in root or COMPATIBILITY_DIR in root:
            continue
        
        for file in files:
            if file.endswith(".py"):
                file_path = os.path.join(root, file)
                update_import_statements(file_path, moved_files)

def main():
    """Main function to execute the migration."""
    print("Starting repository structure migration...")
    
    # Ensure compatibility directory exists
    ensure_directory_exists(os.path.join(COMPATIBILITY_DIR, "dummy.txt"))
    
    # Load module registry
    registry = load_module_registry()
    print(f"Loaded module registry with {len(registry)} categories")
    
    # Migrate schema files first (least dependencies)
    print("\nMigrating schema files...")
    schema_moves = migrate_schemas(registry)
    
    # Migrate core modules
    print("\nMigrating core modules...")
    core_moves = migrate_core_modules(registry)
    
    # Migrate integration modules
    print("\nMigrating integration modules...")
    integration_moves = migrate_integration_modules(registry)
    
    # Migrate utility modules
    print("\nMigrating utility modules...")
    utility_moves = migrate_utility_modules(registry)
    
    # Migrate API modules
    print("\nMigrating API modules...")
    api_moves = migrate_api_modules(registry)
    
    # Migrate CLI modules
    print("\nMigrating CLI modules...")
    cli_moves = migrate_cli_modules(registry)
    
    # Migrate main modules
    print("\nMigrating main modules...")
    main_moves = migrate_main_modules(registry)
    
    # Migrate replay modules
    print("\nMigrating replay modules...")
    replay_moves = migrate_replay_modules(registry)
    
    # Migrate test files
    print("\nMigrating test files...")
    test_moves = migrate_tests(registry)
    
    # Migrate documentation files
    print("\nMigrating documentation files...")
    doc_moves = migrate_docs(registry)
    
    # Combine all moved files
    all_moves = {}
    all_moves.update(schema_moves)
    all_moves.update(core_moves)
    all_moves.update(integration_moves)
    all_moves.update(utility_moves)
    all_moves.update(api_moves)
    all_moves.update(cli_moves)
    all_moves.update(main_moves)
    all_moves.update(replay_moves)
    all_moves.update(test_moves)
    all_moves.update(doc_moves)
    
    # Create compatibility layers
    print("\nCreating compatibility layers...")
    create_compatibility_layers(all_moves)
    
    # Update import statements
    print("\nUpdating import statements...")
    update_all_import_statements(all_moves)
    
    print(f"\nMigration complete. Moved {len(all_moves)} files.")
    print(f"Migration log saved to: {MIGRATION_LOG_PATH}")

if __name__ == "__main__":
    main()
