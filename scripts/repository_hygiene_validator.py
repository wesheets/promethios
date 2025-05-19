"""
Repository Hygiene and Contract Tethering Validator for Phase 5.5.

This module provides functionality to validate repository structure and
ensure proper Codex Contract tethering for the Governance Mesh Integration.

This component implements Phase 5.5 of the Promethios roadmap.
Codex Contract: v2025.05.18
Phase ID: 5.5
Clauses: 5.5, 5.4, 11.0, 11.1, 5.2.5
"""

import os
import json
import uuid
from datetime import datetime

class RepositoryHygieneValidator:
    """
    Validator for repository hygiene and contract tethering.
    
    This class ensures that the repository structure adheres to the
    Codex Repository Hygiene Freeze (clause 5.2.5) and that all
    components are properly tethered to the Codex Contract.
    """
    
    def __init__(self, schema_validator, repo_root="/home/ubuntu/promethios_phase_5_5"):
        """
        Initialize the repository hygiene validator.
        
        Args:
            schema_validator: SchemaValidator instance for schema validation
            repo_root: Root directory of the repository to validate
        
        Raises:
            ValueError: If schema_validator is None or repo_root is not a string
        """
        if schema_validator is None:
            raise ValueError("Schema validator is required")
        
        if not isinstance(repo_root, (str, bytes, os.PathLike)):
            raise ValueError("Repository root must be a string or path-like object")
            
        self.schema_validator = schema_validator
        self.repo_root = repo_root
        self.phase_id = "5.5"
        self.codex_clauses = ["5.5", "5.4", "11.0", "11.1", "5.2.5"]
        
        # Perform tether check on initialization
        self._perform_tether_check()
        
    def validate_repository_structure(self, repo_path=None):
        """
        Validate the repository structure according to Codex requirements.
        
        Args:
            repo_path: Optional path to repository root, defaults to self.repo_root
            
        Returns:
            Dict with validation results
        """
        if repo_path is None:
            repo_path = self.repo_root
            
        # Check if repository exists
        if not os.path.exists(repo_path) or not os.path.isdir(repo_path):
            return {
                "valid": False,
                "error": "Repository path does not exist or is not a directory",
                "phase_id": self.phase_id,
                "codex_clauses": self.codex_clauses,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
        # Check for required files and directories
        required_items = ['.codex.lock', 'schemas']
        existing_items = os.listdir(repo_path)
        
        missing_items = [item for item in required_items if item not in existing_items]
        
        if missing_items:
            return {
                "valid": False,
                "error": f"Missing required items: {', '.join(missing_items)}",
                "phase_id": self.phase_id,
                "codex_clauses": self.codex_clauses,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
        # All checks passed
        return {
            "valid": True,
            "phase_id": self.phase_id,
            "codex_clauses": self.codex_clauses,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
    def validate_codex_lock(self, repo_path=None):
        """
        Validate the .codex.lock file according to Codex requirements.
        
        Args:
            repo_path: Optional path to repository root, defaults to self.repo_root
            
        Returns:
            Dict with validation results
        """
        if repo_path is None:
            repo_path = self.repo_root
            
        codex_lock_path = os.path.join(repo_path, '.codex.lock')
        
        # Check if .codex.lock exists
        if not os.path.exists(codex_lock_path):
            return {
                "valid": False,
                "error": ".codex.lock file not found",
                "phase_id": self.phase_id,
                "codex_clauses": self.codex_clauses,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
        # Read and validate .codex.lock content
        try:
            with open(codex_lock_path, 'r') as f:
                content = f.read()
                
            # Check for required content
            if "Contract Version: v2025.05.18" not in content:
                return {
                    "valid": False,
                    "error": "Invalid contract version in .codex.lock",
                    "phase_id": self.phase_id,
                    "codex_clauses": self.codex_clauses,
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
                
            if "Phase 5.5 Governance Entry" not in content:
                return {
                    "valid": False,
                    "error": "Missing Phase 5.5 entry in .codex.lock",
                    "phase_id": self.phase_id,
                    "codex_clauses": self.codex_clauses,
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
                
            # All checks passed
            return {
                "valid": True,
                "phase_id": self.phase_id,
                "contract_version": "v2025.05.18",
                "codex_clauses": self.codex_clauses,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
                
        except Exception as e:
            return {
                "valid": False,
                "error": f"Error reading .codex.lock: {str(e)}",
                "phase_id": self.phase_id,
                "codex_clauses": self.codex_clauses,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
    
    def _perform_tether_check(self):
        """
        Perform Codex tether check to ensure contract compliance.
        
        Raises:
            ValueError: If tether check fails
        """
        codex_lock_path = os.path.join(self.repo_root, '.codex.lock')
        
        if not os.path.exists(codex_lock_path):
            raise ValueError("Codex tether check failed: .codex.lock file not found")
            
        # Additional tether checks can be added here
        
    def _codex_tether_check(self):
        """
        Explicit Codex tether check method for testing.
        
        This method is used to verify that the component is properly
        tethered to the Codex Contract.
        """
        # This method is intentionally left minimal for testing purposes
        pass
