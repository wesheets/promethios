import unittest
from unittest.mock import MagicMock, patch
import json
import os
import tempfile
from src.core.trust.mutation_detector import MutationDetector
from src.core.governance.contract_sealer import ContractSealer

class TestMutationDetector(unittest.TestCase):
    """
    Unit tests for the MutationDetector class.
    """
    
    def setUp(self):
        """
        Set up test fixtures.
        """
        self.contract_sealer = MagicMock(spec=ContractSealer)
        self.detector = MutationDetector(self.contract_sealer)
        
        self.test_contract = {
            "version": "1.0.0",
            "clauses": {
                "clause1": {
                    "text": "This is a test clause",
                    "required": True
                }
            }
        }
        
        self.test_seal = {
            "seal_id": "test-seal-id",
            "timestamp": "2025-05-20T12:00:00Z",
            "contract_hash": "test-hash",
            "hash_algorithm": "sha256",
            "contract_version": "1.0.0",
            "sealed_contract": self.test_contract
        }
    
    def test_check_for_mutations_no_mutations(self):
        """
        Test that no mutations are detected when the contract is unchanged.
        """
        # Mock the contract sealer to return True for verify_seal
        self.contract_sealer.verify_seal.return_value = True
        
        # Check for mutations
        result = self.detector.check_for_mutations(
            self.test_seal,
            self.test_contract
        )
        
        # Check that the contract sealer was called
        self.contract_sealer.verify_seal.assert_called_once_with(self.test_seal)
        
        # Check that no mutations were detected
        self.assertFalse(result["mutation_detected"])
        self.assertIsNone(result["reason"])
        self.assertIsNone(result["details"])
        self.assertIsNone(result["differences"])
    
    def test_check_for_mutations_invalid_seal(self):
        """
        Test that mutations are detected when the seal is invalid.
        """
        # Mock the contract sealer to return False for verify_seal
        self.contract_sealer.verify_seal.return_value = False
        
        # Check for mutations
        result = self.detector.check_for_mutations(
            self.test_seal,
            self.test_contract
        )
        
        # Check that the contract sealer was called
        self.contract_sealer.verify_seal.assert_called_once_with(self.test_seal)
        
        # Check that mutations were detected
        self.assertTrue(result["mutation_detected"])
        self.assertEqual(result["reason"], "INVALID_SEAL")
        self.assertEqual(result["details"], "The seal is invalid or has been tampered with.")
        self.assertIsNone(result["differences"])
    
    def test_check_for_mutations_modified_contract(self):
        """
        Test that mutations are detected when the contract is modified.
        """
        # Mock the contract sealer to return True for verify_seal
        self.contract_sealer.verify_seal.return_value = True
        
        # Modify the contract
        modified_contract = json.loads(json.dumps(self.test_contract))
        modified_contract["clauses"]["clause1"]["text"] = "Modified text"
        
        # Check for mutations
        result = self.detector.check_for_mutations(
            self.test_seal,
            modified_contract
        )
        
        # Check that the contract sealer was called
        self.contract_sealer.verify_seal.assert_called_once_with(self.test_seal)
        
        # Check that mutations were detected
        self.assertTrue(result["mutation_detected"])
        self.assertEqual(result["reason"], "STATE_MODIFIED")
        self.assertEqual(result["details"], "The contract state has been modified.")
        
        # Check that the differences were correctly identified
        self.assertEqual(len(result["differences"]), 1)
        self.assertEqual(result["differences"][0]["type"], "MODIFIED")
        self.assertEqual(result["differences"][0]["key"], "clauses.clause1.text")
        self.assertEqual(result["differences"][0]["original_value"], "This is a test clause")
        self.assertEqual(result["differences"][0]["current_value"], "Modified text")
    
    def test_check_for_mutations_added_field(self):
        """
        Test that mutations are detected when a field is added to the contract.
        """
        # Mock the contract sealer to return True for verify_seal
        self.contract_sealer.verify_seal.return_value = True
        
        # Add a field to the contract
        modified_contract = json.loads(json.dumps(self.test_contract))
        modified_contract["clauses"]["clause2"] = {
            "text": "This is a new clause",
            "required": False
        }
        
        # Check for mutations
        result = self.detector.check_for_mutations(
            self.test_seal,
            modified_contract
        )
        
        # Check that mutations were detected
        self.assertTrue(result["mutation_detected"])
        self.assertEqual(result["reason"], "STATE_MODIFIED")
        
        # Check that the differences were correctly identified
        differences = result["differences"]
        self.assertTrue(any(d["type"] == "ADDED" and d["key"] == "clauses.clause2" for d in differences))
    
    def test_check_for_mutations_removed_field(self):
        """
        Test that mutations are detected when a field is removed from the contract.
        """
        # Mock the contract sealer to return True for verify_seal
        self.contract_sealer.verify_seal.return_value = True
        
        # Remove a field from the contract
        modified_contract = json.loads(json.dumps(self.test_contract))
        del modified_contract["clauses"]["clause1"]["required"]
        
        # Check for mutations
        result = self.detector.check_for_mutations(
            self.test_seal,
            modified_contract
        )
        
        # Check that mutations were detected
        self.assertTrue(result["mutation_detected"])
        self.assertEqual(result["reason"], "STATE_MODIFIED")
        
        # Check that the differences were correctly identified
        differences = result["differences"]
        self.assertTrue(any(d["type"] == "REMOVED" and d["key"] == "clauses.clause1.required" for d in differences))
    
    def test_compare_objects(self):
        """
        Test that objects can be compared correctly.
        """
        # Create two objects to compare
        obj1 = {
            "a": 1,
            "b": {
                "c": 2,
                "d": 3
            },
            "e": "hello"
        }
        
        obj2 = {
            "a": 1,
            "b": {
                "c": 2,
                "d": 4
            },
            "f": "world"
        }
        
        # Compare the objects
        differences = self.detector._compare_objects(obj1, obj2)
        
        # Check that the differences were correctly identified
        self.assertEqual(len(differences), 3)
        
        # Check for the modified value
        modified = next(d for d in differences if d["type"] == "MODIFIED")
        self.assertEqual(modified["key"], "b.d")
        self.assertEqual(modified["original_value"], 3)
        self.assertEqual(modified["current_value"], 4)
        
        # Check for the added field
        added = next(d for d in differences if d["type"] == "ADDED")
        self.assertEqual(added["key"], "f")
        self.assertIsNone(added["original_value"])
        self.assertEqual(added["current_value"], "world")
        
        # Check for the removed field
        removed = next(d for d in differences if d["type"] == "REMOVED")
        self.assertEqual(removed["key"], "e")
        self.assertEqual(removed["original_value"], "hello")
        self.assertIsNone(removed["current_value"])

if __name__ == "__main__":
    unittest.main()
