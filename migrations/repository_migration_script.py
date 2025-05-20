#!/usr/bin/env python3
"""
Repository Migration Script for Promethios Phase 5.6

Codex Contract: v2025.05.18
Phase: 5.6
Clauses: 5.6, 5.5, 5.4, 11.0, 11.1, 5.2.6
"""

import os
import json
import shutil
import re
import sys
from pathlib import Path
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("migration.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("repository_migration")

class RepositoryMigrator:
    """
    Handles the migration of files to the new repository structure
    according to the repository structure contract.
    """
    
    def __init__(self, source_dir, target_dir):
        """
        Initialize the migrator with source and target directories.
        
        Args:
            source_dir (str): Path to the source directory
            target_dir (str): Path to the target directory
        """
        self.source_dir = Path(source_dir)
        self.target_dir = Path(target_dir)
        self.module_registry = {}
        self.migration_log = []
        
    def create_directory_structure(self):
        """Create the directory structure as defined in the repository structure contract."""
        logger.info("Creating directory structure...")
        
        directories = [
            "src/core",
            "src/governance",
            "src/verification",
            "src/ui",
            "schemas/core",
            "schemas/governance",
            "schemas/verification",
            "schemas/ui",
            "tests/unit/core",
            "tests/unit/governance",
            "tests/unit/verification",
            "tests/unit/ui",
            "tests/integration/core",
            "tests/integration/governance",
            "tests/integration/verification",
            "tests/integration/ui",
            "tests/end_to_end",
            "docs/phases",
            "docs/architecture",
            "docs/schemas",
            "docs/api",
            "ui/trust_log",
            "registry",
            "migrations",
            "scripts"
        ]
        
        for directory in directories:
            dir_path = self.target_dir / directory
            if not dir_path.exists():
                dir_path.mkdir(parents=True)
                logger.info(f"Created directory: {dir_path}")
                self.migration_log.append(f"Created directory: {dir_path}")
    
    def load_module_registry(self):
        """Load the module registry from the registry directory."""
        registry_path = self.target_dir / "registry" / "module_registry.json"
        if registry_path.exists():
            with open(registry_path, 'r') as f:
                self.module_registry = json.load(f)
                logger.info("Loaded module registry")
        else:
            logger.warning("Module registry not found, creating empty registry")
            self.module_registry = {
                "registry_version": "v2025.05.18",
                "last_updated": datetime.now().strftime("%Y-%m-%d"),
                "modules": {}
            }
    
    def save_module_registry(self):
        """Save the module registry to the registry directory."""
        registry_path = self.target_dir / "registry" / "module_registry.json"
        with open(registry_path, 'w') as f:
            json.dump(self.module_registry, f, indent=2)
            logger.info("Saved module registry")
    
    def migrate_core_modules(self):
        """Migrate core modules to their appropriate directories."""
        logger.info("Migrating core modules...")
        
        # Example module migration
        # This would be expanded to handle all modules based on the registry
        for category, modules in self.module_registry.get("modules", {}).items():
            for module_name, module_info in modules.items():
                source_path = self.source_dir / f"{module_name}.py"
                target_path = self.target_dir / module_info["path"]
                
                if source_path.exists():
                    # Ensure target directory exists
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Copy the file
                    shutil.copy2(source_path, target_path)
                    logger.info(f"Migrated module: {module_name}.py to {module_info['path']}")
                    self.migration_log.append(f"Migrated module: {module_name}.py to {module_info['path']}")
                else:
                    logger.warning(f"Source module not found: {source_path}")
    
    def migrate_schema_files(self):
        """Migrate schema files to their appropriate directories."""
        logger.info("Migrating schema files...")
        
        # Find all schema files in the source directory
        schema_files = list(self.source_dir.glob("**/*.schema.v*.json"))
        
        for schema_file in schema_files:
            # Determine the category based on the schema name
            schema_name = schema_file.name
            
            if "trust_" in schema_name or "governance_" in schema_name:
                category = "governance"
            elif "verification_" in schema_name or "consensus_" in schema_name:
                category = "verification"
            elif "ui_" in schema_name or "view_" in schema_name:
                category = "ui"
            else:
                category = "core"
            
            target_path = self.target_dir / "schemas" / category / schema_name
            
            # Copy the file
            shutil.copy2(schema_file, target_path)
            logger.info(f"Migrated schema: {schema_name} to schemas/{category}/")
            self.migration_log.append(f"Migrated schema: {schema_name} to schemas/{category}/")
    
    def migrate_test_files(self):
        """Migrate test files to their appropriate directories."""
        logger.info("Migrating test files...")
        
        # Find all test files in the source directory
        test_files = list(self.source_dir.glob("**/test_*.py"))
        
        for test_file in test_files:
            # Determine the category and type based on the test name
            test_name = test_file.name
            
            if "integration" in str(test_file):
                test_type = "integration"
            else:
                test_type = "unit"
            
            if "trust_" in test_name or "governance_" in test_name:
                category = "governance"
            elif "verification_" in test_name or "consensus_" in test_name:
                category = "verification"
            elif "ui_" in test_name or "view_" in test_name:
                category = "ui"
            else:
                category = "core"
            
            target_path = self.target_dir / "tests" / test_type / category / test_name
            
            # Copy the file
            shutil.copy2(test_file, target_path)
            logger.info(f"Migrated test: {test_name} to tests/{test_type}/{category}/")
            self.migration_log.append(f"Migrated test: {test_name} to tests/{test_type}/{category}/")
    
    def migrate_documentation_files(self):
        """Migrate documentation files to their appropriate directories."""
        logger.info("Migrating documentation files...")
        
        # Find all documentation files in the source directory
        doc_files = list(self.source_dir.glob("**/*.md"))
        
        for doc_file in doc_files:
            # Determine the category based on the doc name
            doc_name = doc_file.name
            
            if "phase" in doc_name.lower():
                category = "phases"
            elif "architecture" in doc_name.lower():
                category = "architecture"
            elif "schema" in doc_name.lower():
                category = "schemas"
            elif "api" in doc_name.lower():
                category = "api"
            else:
                # Skip files that don't match any category
                continue
            
            target_path = self.target_dir / "docs" / category / doc_name
            
            # Copy the file
            shutil.copy2(doc_file, target_path)
            logger.info(f"Migrated documentation: {doc_name} to docs/{category}/")
            self.migration_log.append(f"Migrated documentation: {doc_name} to docs/{category}/")
    
    def save_migration_log(self):
        """Save the migration log to the migrations directory."""
        log_path = self.target_dir / "migrations" / f"migration_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(log_path, 'w') as f:
            f.write("\n".join(self.migration_log))
            logger.info(f"Saved migration log to {log_path}")
    
    def run_migration(self):
        """Run the complete migration process."""
        logger.info("Starting repository migration...")
        
        try:
            # Step 1: Create directory structure
            self.create_directory_structure()
            
            # Step 2: Load module registry
            self.load_module_registry()
            
            # Step 3: Migrate core modules
            self.migrate_core_modules()
            
            # Step 4: Migrate schema files
            self.migrate_schema_files()
            
            # Step 5: Migrate test files
            self.migrate_test_files()
            
            # Step 6: Migrate documentation files
            self.migrate_documentation_files()
            
            # Step 7: Save module registry
            self.save_module_registry()
            
            # Step 8: Save migration log
            self.save_migration_log()
            
            logger.info("Repository migration completed successfully")
            return True
        
        except Exception as e:
            logger.error(f"Migration failed: {str(e)}")
            return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python repository_migration_script.py <source_dir> <target_dir>")
        sys.exit(1)
    
    source_dir = sys.argv[1]
    target_dir = sys.argv[2]
    
    migrator = RepositoryMigrator(source_dir, target_dir)
    success = migrator.run_migration()
    
    sys.exit(0 if success else 1)
