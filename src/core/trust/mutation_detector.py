#!/usr/bin/env python3
"""
Detects unauthorized modifications to sealed contracts.
"""

import json
from typing import Dict, Any, List, Optional
from src.core.governance.contract_sealer import ContractSealer

class MutationDetector:
    """
    Detects unauthorized modifications to sealed contracts.
    """
    
    def __init__(self, contract_sealer: ContractSealer):
        """
        Initialize the MutationDetector.
        
        Args:
            contract_sealer: The ContractSealer to use for verification.
        """
        self.contract_sealer = contract_sealer
    
    def check_for_mutations(
        self,
        seal: Dict[str, Any],
        current_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Check for unauthorized modifications to a sealed contract.
        
        Args:
            seal: The seal of the contract.
            current_state: The current state of the contract.
            
        Returns:
            A result indicating whether mutations were detected.
        """
        # First, verify the seal itself
        if not self.contract_sealer.verify_seal(seal):
            return {
                "mutation_detected": True,
                "reason": "INVALID_SEAL",
                "details": "The seal is invalid or has been tampered with.",
                "differences": None
            }
        
        # Compare the sealed contract with the current state
        sealed_contract = seal["sealed_contract"]
        differences = self._compare_objects(sealed_contract, current_state)
        
        if differences:
            return {
                "mutation_detected": True,
                "reason": "STATE_MODIFIED",
                "details": "The contract state has been modified.",
                "differences": differences
            }
        
        return {
            "mutation_detected": False,
            "reason": None,
            "details": None,
            "differences": None
        }
    
    def _compare_objects(
        self,
        original: Dict[str, Any],
        current: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Compare two objects and identify differences.
        
        Args:
            original: The original object.
            current: The current object.
            
        Returns:
            A list of differences between the objects.
        """
        differences = []
        
        # Check for added keys
        for key in current:
            if key not in original:
                differences.append({
                    "type": "ADDED",
                    "key": key,
                    "original_value": None,
                    "current_value": current[key]
                })
        
        # Check for removed keys
        for key in original:
            if key not in current:
                differences.append({
                    "type": "REMOVED",
                    "key": key,
                    "original_value": original[key],
                    "current_value": None
                })
        
        # Check for modified values
        for key in original:
            if key in current:
                if isinstance(original[key], dict) and isinstance(current[key], dict):
                    # Recursively compare nested dictionaries
                    nested_differences = self._compare_objects(original[key], current[key])
                    for diff in nested_differences:
                        diff["key"] = f"{key}.{diff['key']}"
                        differences.append(diff)
                elif original[key] != current[key]:
                    differences.append({
                        "type": "MODIFIED",
                        "key": key,
                        "original_value": original[key],
                        "current_value": current[key]
                    })
        
        return differences
