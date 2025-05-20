import unittest
from unittest.mock import MagicMock, patch
import json
import os
import tempfile
from src.core.governance.contract_sealer import ContractSealer

class TestContractSealer(unittest.TestCase):
    """
    Unit tests for the ContractSealer class.
    """
    
    def setUp(self):
        """
        Set up test fixtures.
        """
        self.sealer = ContractSealer()
        self.test_contract = {
            "version": "1.0.0",
            "clauses": {
                "clause1": {
                    "text": "This is a test clause",
                    "required": True
                }
            }
        }
    
    def test_seal_contract(self):
        """
        Test that a contract can be sealed.
        """
        # Seal the contract
        seal = self.sealer.seal_contract(self.test_contract)
        
        # Check that the seal has the expected fields
        self.assertIn("seal_id", seal)
        self.assertIn("timestamp", seal)
        self.assertIn("contract_hash", seal)
        self.assertIn("hash_algorithm", seal)
        self.assertIn("contract_version", seal)
        self.assertIn("sealed_contract", seal)
        
        # Check that the sealed contract matches the original
        self.assertEqual(seal["sealed_contract"], self.test_contract)
        
        # Check that the contract version is correct
        self.assertEqual(seal["contract_version"], "1.0.0")
        
        # Check that the hash algorithm is correct
        self.assertEqual(seal["hash_algorithm"], "sha256")
    
    def test_verify_seal_valid(self):
        """
        Test that a valid seal can be verified.
        """
        # Seal the contract
        seal = self.sealer.seal_contract(self.test_contract)
        
        # Verify the seal
        result = self.sealer.verify_seal(seal)
        
        # Check that the verification passed
        self.assertTrue(result)
    
    def test_verify_seal_invalid(self):
        """
        Test that an invalid seal cannot be verified.
        """
        # Seal the contract
        seal = self.sealer.seal_contract(self.test_contract)
        
        # Modify the sealed contract
        seal["sealed_contract"]["clauses"]["clause1"]["text"] = "Modified text"
        
        # Verify the seal
        result = self.sealer.verify_seal(seal)
        
        # Check that the verification failed
        self.assertFalse(result)
    
    def test_verify_seal_missing_contract(self):
        """
        Test that a seal without a sealed contract cannot be verified.
        """
        # Seal the contract
        seal = self.sealer.seal_contract(self.test_contract)
        
        # Remove the sealed contract
        del seal["sealed_contract"]
        
        # Verify the seal
        result = self.sealer.verify_seal(seal)
        
        # Check that the verification failed
        self.assertFalse(result)
    
    def test_calculate_hash(self):
        """
        Test that the hash calculation is consistent.
        """
        # Calculate the hash
        hash1 = self.sealer._calculate_hash(self.test_contract)
        hash2 = self.sealer._calculate_hash(self.test_contract)
        
        # Check that the hashes are the same
        self.assertEqual(hash1, hash2)
        
        # Modify the contract
        modified_contract = json.loads(json.dumps(self.test_contract))
        modified_contract["clauses"]["clause1"]["text"] = "Modified text"
        
        # Calculate the hash of the modified contract
        hash3 = self.sealer._calculate_hash(modified_contract)
        
        # Check that the hash is different
        self.assertNotEqual(hash1, hash3)
    
    def test_different_hash_algorithms(self):
        """
        Test that different hash algorithms produce different results.
        """
        # Create sealers with different hash algorithms
        sealer_sha256 = ContractSealer(hash_algorithm="sha256")
        sealer_sha512 = ContractSealer(hash_algorithm="sha512")
        
        # Calculate hashes
        hash_sha256 = sealer_sha256._calculate_hash(self.test_contract)
        hash_sha512 = sealer_sha512._calculate_hash(self.test_contract)
        
        # Check that the hashes are different
        self.assertNotEqual(hash_sha256, hash_sha512)
        
        # Check that the hash lengths are different
        self.assertEqual(len(hash_sha256), 64)  # SHA-256 produces 64 hex characters
        self.assertEqual(len(hash_sha512), 128)  # SHA-512 produces 128 hex characters
    
    def test_unsupported_hash_algorithm(self):
        """
        Test that an unsupported hash algorithm raises an error.
        """
        # Create a sealer with an unsupported hash algorithm
        sealer = ContractSealer(hash_algorithm="md5")
        
        # Try to calculate a hash
        with self.assertRaises(ValueError):
            sealer._calculate_hash(self.test_contract)

if __name__ == "__main__":
    unittest.main()
