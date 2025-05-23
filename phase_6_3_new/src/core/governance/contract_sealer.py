#!/usr/bin/env python3
"""
Creates and verifies cryptographic seals of contracts.
"""

import hashlib
import json
import uuid
import datetime
from typing import Dict, Any, Optional

class ContractSealer:
    """
    Creates and verifies cryptographic seals of contracts.
    """
    
    def __init__(self, hash_algorithm: str = "sha256"):
        """
        Initialize the ContractSealer.
        
        Args:
            hash_algorithm: The hash algorithm to use for sealing.
        """
        self.hash_algorithm = hash_algorithm
    
    def seal_contract(self, contract: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a cryptographic seal of a contract.
        
        Args:
            contract: The contract to seal.
            
        Returns:
            A seal containing the contract hash and the sealed contract.
        """
        # Create a deep copy of the contract to avoid modifying the original
        contract_copy = json.loads(json.dumps(contract))
        
        # Calculate the contract hash
        contract_hash = self._calculate_hash(contract_copy)
        
        # Create the seal
        seal = {
            "seal_id": str(uuid.uuid4()),
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "contract_hash": contract_hash,
            "hash_algorithm": self.hash_algorithm,
            "contract_version": contract_copy.get("version", "unknown"),
            "sealed_contract": contract_copy
        }
        
        return seal
    
    def verify_seal(self, seal: Dict[str, Any]) -> bool:
        """
        Verify the integrity of a sealed contract.
        
        Args:
            seal: The seal to verify.
            
        Returns:
            True if the seal is valid, False otherwise.
        """
        # Extract the sealed contract
        sealed_contract = seal.get("sealed_contract")
        if not sealed_contract:
            return False
        
        # Calculate the hash of the sealed contract
        calculated_hash = self._calculate_hash(sealed_contract)
        
        # Compare the calculated hash with the stored hash
        return calculated_hash == seal.get("contract_hash")
    
    def _calculate_hash(self, contract: Dict[str, Any]) -> str:
        """
        Calculate the hash of a contract.
        
        Args:
            contract: The contract to hash.
            
        Returns:
            The hash of the contract.
        """
        # Convert the contract to a canonical JSON string
        canonical_json = json.dumps(contract, sort_keys=True)
        
        # Calculate the hash
        if self.hash_algorithm == "sha256":
            return hashlib.sha256(canonical_json.encode()).hexdigest()
        elif self.hash_algorithm == "sha512":
            return hashlib.sha512(canonical_json.encode()).hexdigest()
        else:
            raise ValueError(f"Unsupported hash algorithm: {self.hash_algorithm}")
