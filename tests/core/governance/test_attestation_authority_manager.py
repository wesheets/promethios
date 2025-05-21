"""
Unit tests for the AttestationAuthorityManager class.

This module contains unit tests for the AttestationAuthorityManager class,
which is responsible for managing attestation authorities and their trust levels.
"""

import unittest
import json
import uuid
import datetime
from unittest.mock import MagicMock, patch
from pathlib import Path
import sys
import os

# Add the src directory to the path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))

# Import the class to test
from src.core.governance.attestation_authority_manager import AttestationAuthorityManager


class TestAttestationAuthorityManager(unittest.TestCase):
    """Test cases for the AttestationAuthorityManager class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a mock configuration
        self.config = {
            'storage_path': '/tmp/test_authorities',
            'schema_path': '/tmp/test_schemas/authority.schema.v1.json',
            'trust_threshold': 0.5,
            'key_expiration_days': 365
        }
        
        # Create mock dependencies
        self.mock_schema_validator = MagicMock()
        self.mock_schema_validator.validate.return_value = True
        
        self.mock_attestation_service = MagicMock()
        self.mock_trust_metrics_calculator = MagicMock()
        
        # Create a test directory
        Path(self.config['storage_path']).mkdir(parents=True, exist_ok=True)
        
        # Create the manager with mocked dependencies
        with patch('src.core.governance.attestation_authority_manager.SchemaValidator', return_value=self.mock_schema_validator):
            self.manager = AttestationAuthorityManager(self.config)
            self.manager.attestation_service = self.mock_attestation_service
            self.manager.trust_metrics_calculator = self.mock_trust_metrics_calculator
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Clean up test files
        import shutil
        if Path(self.config['storage_path']).exists():
            shutil.rmtree(self.config['storage_path'])
    
    def test_init(self):
        """Test initialization of the manager."""
        self.assertEqual(self.manager.config, self.config)
        self.assertEqual(self.manager.storage_path, self.config['storage_path'])
        self.assertEqual(self.manager.trust_threshold, self.config['trust_threshold'])
        self.assertEqual(self.manager.key_expiration_days, self.config['key_expiration_days'])
        self.assertIsNotNone(self.manager.schema_validator)
    
    def test_register_authority(self):
        """Test registering an authority."""
        # Define test data
        name = "Test Authority"
        description = "A test authority"
        public_keys = [
            {
                "key_id": "key1",
                "algorithm": "RSA",
                "key_data": "test-key-data"
            }
        ]
        capabilities = {
            "attestation_types": ["VERIFICATION", "CERTIFICATION"],
            "domains": ["test-domain"]
        }
        metadata = {"version": "1.0.0"}
        
        # Register authority
        authority = self.manager.register_authority(
            name=name,
            description=description,
            public_keys=public_keys,
            capabilities=capabilities,
            metadata=metadata
        )
        
        # Verify authority
        self.assertIsNotNone(authority)
        self.assertIn("authority_id", authority)
        self.assertEqual(authority["name"], name)
        self.assertEqual(authority["description"], description)
        self.assertEqual(authority["capabilities"], capabilities)
        self.assertEqual(authority["metadata"], metadata)
        self.assertIn("registration_date", authority)
        self.assertIn("trust_level", authority)
        self.assertEqual(authority["status"], self.manager.STATUS_PENDING)
        
        # Verify public keys were processed
        self.assertEqual(len(authority["public_keys"]), 1)
        self.assertEqual(authority["public_keys"][0]["key_id"], "key1")
        self.assertEqual(authority["public_keys"][0]["status"], "ACTIVE")
        self.assertIn("created_at", authority["public_keys"][0])
        self.assertIn("expires_at", authority["public_keys"][0])
        
        # Verify schema validation was called
        self.mock_schema_validator.validate.assert_called_once()
        
        # Verify authority was stored
        authority_path = Path(self.config['storage_path']) / f"{authority['authority_id']}.json"
        self.assertTrue(authority_path.exists())
    
    def test_get_authority(self):
        """Test getting an authority."""
        # Register an authority first
        authority = self.manager.register_authority(
            name="Test Authority",
            description="A test authority",
            public_keys=[{"key_id": "key1", "algorithm": "RSA", "key_data": "test-key-data"}],
            capabilities={
                "attestation_types": ["VERIFICATION"],
                "domains": ["test-domain"]
            }
        )
        
        # Get the authority
        retrieved = self.manager.get_authority(authority["authority_id"])
        
        # Verify it's the same
        self.assertEqual(retrieved, authority)
        
        # Test getting a non-existent authority
        non_existent = self.manager.get_authority("non-existent")
        self.assertIsNone(non_existent)
    
    def test_find_authorities(self):
        """Test finding authorities by criteria."""
        # Register multiple authorities
        authority1 = self.manager.register_authority(
            name="Authority 1",
            description="First test authority",
            public_keys=[{"key_id": "key1", "algorithm": "RSA", "key_data": "test-key-data"}],
            capabilities={
                "attestation_types": ["VERIFICATION", "CERTIFICATION"],
                "domains": ["domain1", "domain2"]
            }
        )
        
        authority2 = self.manager.register_authority(
            name="Authority 2",
            description="Second test authority",
            public_keys=[{"key_id": "key2", "algorithm": "RSA", "key_data": "test-key-data"}],
            capabilities={
                "attestation_types": ["VERIFICATION"],
                "domains": ["domain1"]
            }
        )
        
        authority3 = self.manager.register_authority(
            name="Authority 3",
            description="Third test authority",
            public_keys=[{"key_id": "key3", "algorithm": "RSA", "key_data": "test-key-data"}],
            capabilities={
                "attestation_types": ["CERTIFICATION"],
                "domains": ["domain2"]
            }
        )
        
        # Activate authorities
        self.manager.activate_authority(authority1["authority_id"])
        self.manager.activate_authority(authority2["authority_id"])
        
        # Find by status
        active_authorities = self.manager.find_authorities(status=self.manager.STATUS_ACTIVE)
        self.assertEqual(len(active_authorities), 2)
        authority_ids = [a["authority_id"] for a in active_authorities]
        self.assertIn(authority1["authority_id"], authority_ids)
        self.assertIn(authority2["authority_id"], authority_ids)
        
        pending_authorities = self.manager.find_authorities(status=self.manager.STATUS_PENDING)
        self.assertEqual(len(pending_authorities), 1)
        self.assertEqual(pending_authorities[0]["authority_id"], authority3["authority_id"])
        
        # Find by attestation type
        verification_authorities = self.manager.find_authorities(attestation_type="VERIFICATION")
        self.assertEqual(len(verification_authorities), 2)
        authority_ids = [a["authority_id"] for a in verification_authorities]
        self.assertIn(authority1["authority_id"], authority_ids)
        self.assertIn(authority2["authority_id"], authority_ids)
        
        certification_authorities = self.manager.find_authorities(attestation_type="CERTIFICATION")
        self.assertEqual(len(certification_authorities), 2)
        authority_ids = [a["authority_id"] for a in certification_authorities]
        self.assertIn(authority1["authority_id"], authority_ids)
        self.assertIn(authority3["authority_id"], authority_ids)
        
        # Find by domain
        domain1_authorities = self.manager.find_authorities(domain="domain1")
        self.assertEqual(len(domain1_authorities), 2)
        authority_ids = [a["authority_id"] for a in domain1_authorities]
        self.assertIn(authority1["authority_id"], authority_ids)
        self.assertIn(authority2["authority_id"], authority_ids)
        
        # Find by multiple criteria
        filtered_authorities = self.manager.find_authorities(
            status=self.manager.STATUS_ACTIVE,
            attestation_type="VERIFICATION",
            domain="domain1"
        )
        self.assertEqual(len(filtered_authorities), 2)
        authority_ids = [a["authority_id"] for a in filtered_authorities]
        self.assertIn(authority1["authority_id"], authority_ids)
        self.assertIn(authority2["authority_id"], authority_ids)
    
    def test_activate_authority(self):
        """Test activating an authority."""
        # Register an authority
        authority = self.manager.register_authority(
            name="Test Authority",
            description="A test authority",
            public_keys=[{"key_id": "key1", "algorithm": "RSA", "key_data": "test-key-data"}],
            capabilities={
                "attestation_types": ["VERIFICATION"],
                "domains": ["test-domain"]
            }
        )
        
        # Verify it's pending
        self.assertEqual(authority["status"], self.manager.STATUS_PENDING)
        
        # Activate it
        activated = self.manager.activate_authority(authority["authority_id"])
        
        # Verify it's active
        self.assertEqual(activated["status"], self.manager.STATUS_ACTIVE)
        
        # Get it again to verify persistence
        retrieved = self.manager.get_authority(authority["authority_id"])
        self.assertEqual(retrieved["status"], self.manager.STATUS_ACTIVE)
    
    def test_suspend_authority(self):
        """Test suspending an authority."""
        # Register and activate an authority
        authority = self.manager.register_authority(
            name="Test Authority",
            description="A test authority",
            public_keys=[{"key_id": "key1", "algorithm": "RSA", "key_data": "test-key-data"}],
            capabilities={
                "attestation_types": ["VERIFICATION"],
                "domains": ["test-domain"]
            }
        )
        self.manager.activate_authority(authority["authority_id"])
        
        # Verify it's active
        self.assertEqual(authority["status"], self.manager.STATUS_ACTIVE)
        
        # Suspend it
        reason = "Test suspension"
        suspended = self.manager.suspend_authority(authority["authority_id"], reason)
        
        # Verify it's suspended
        self.assertEqual(suspended["status"], self.manager.STATUS_SUSPENDED)
        self.assertEqual(suspended["metadata"]["suspension_reason"], reason)
        self.assertIn("suspension_timestamp", suspended["metadata"])
        
        # Get it again to verify persistence
        retrieved = self.manager.get_authority(authority["authority_id"])
        self.assertEqual(retrieved["status"], self.manager.STATUS_SUSPENDED)
    
    def test_revoke_authority(self):
        """Test revoking an authority."""
        # Register and activate an authority
        authority = self.manager.register_authority(
            name="Test Authority",
            description="A test authority",
            public_keys=[{"key_id": "key1", "algorithm": "RSA", "key_data": "test-key-data"}],
            capabilities={
                "attestation_types": ["VERIFICATION"],
                "domains": ["test-domain"]
            }
        )
        self.manager.activate_authority(authority["authority_id"])
        
        # Verify it's active
        self.assertEqual(authority["status"], self.manager.STATUS_ACTIVE)
        
        # Revoke it
        reason = "Test revocation"
        revoked = self.manager.revoke_authority(authority["authority_id"], reason)
        
        # Verify it's revoked
        self.assertEqual(revoked["status"], self.manager.STATUS_REVOKED)
        self.assertEqual(revoked["metadata"]["revocation_reason"], reason)
        self.assertIn("revocation_timestamp", revoked["metadata"])
        
        # Verify all keys are revoked
        for key in revoked["public_keys"]:
            self.assertEqual(key["status"], "REVOKED")
        
        # Get it again to verify persistence
        retrieved = self.manager.get_authority(authority["authority_id"])
        self.assertEqual(retrieved["status"], self.manager.STATUS_REVOKED)
    
    def test_add_public_key(self):
        """Test adding a public key to an authority."""
        # Register an authority
        authority = self.manager.register_authority(
            name="Test Authority",
            description="A test authority",
            public_keys=[{"key_id": "key1", "algorithm": "RSA", "key_data": "test-key-data"}],
            capabilities={
                "attestation_types": ["VERIFICATION"],
                "domains": ["test-domain"]
            }
        )
        
        # Verify it has one key
        self.assertEqual(len(authority["public_keys"]), 1)
        
        # Add a new key
        key_id = "key2"
        algorithm = "EC"
        key_data = "test-ec-key-data"
        updated = self.manager.add_public_key(
            authority_id=authority["authority_id"],
            key_id=key_id,
            algorithm=algorithm,
            key_data=key_data
        )
        
        # Verify it now has two keys
        self.assertEqual(len(updated["public_keys"]), 2)
        
        # Verify the new key
        new_key = next(k for k in updated["public_keys"] if k["key_id"] == key_id)
        self.assertEqual(new_key["algorithm"], algorithm)
        self.assertEqual(new_key["key_data"], key_data)
        self.assertEqual(new_key["status"], "ACTIVE")
        self.assertIn("created_at", new_key)
        self.assertIn("expires_at", new_key)
        
        # Get it again to verify persistence
        retrieved = self.manager.get_authority(authority["authority_id"])
        self.assertEqual(len(retrieved["public_keys"]), 2)
    
    def test_revoke_public_key(self):
        """Test revoking a public key."""
        # Register an authority with two keys
        authority = self.manager.register_authority(
            name="Test Authority",
            description="A test authority",
            public_keys=[
                {"key_id": "key1", "algorithm": "RSA", "key_data": "test-key-data"},
                {"key_id": "key2", "algorithm": "EC", "key_data": "test-ec-key-data"}
            ],
            capabilities={
                "attestation_types": ["VERIFICATION"],
                "domains": ["test-domain"]
            }
        )
        
        # Verify both keys are active
        for key in authority["public_keys"]:
            self.assertEqual(key["status"], "ACTIVE")
        
        # Revoke one key
        key_id = "key1"
        updated = self.manager.revoke_public_key(
            authority_id=authority["authority_id"],
            key_id=key_id
        )
        
        # Verify the key is revoked
        revoked_key = next(k for k in updated["public_keys"] if k["key_id"] == key_id)
        self.assertEqual(revoked_key["status"], "REVOKED")
        
        # Verify the other key is still active
        active_key = next(k for k in updated["public_keys"] if k["key_id"] == "key2")
        self.assertEqual(active_key["status"], "ACTIVE")
        
        # Get it again to verify persistence
        retrieved = self.manager.get_authority(authority["authority_id"])
        revoked_key = next(k for k in retrieved["public_keys"] if k["key_id"] == key_id)
        self.assertEqual(revoked_key["status"], "REVOKED")
    
    def test_rotate_public_key(self):
        """Test rotating a public key."""
        # Register an authority
        authority = self.manager.register_authority(
            name="Test Authority",
            description="A test authority",
            public_keys=[{"key_id": "key1", "algorithm": "RSA", "key_data": "test-key-data"}],
            capabilities={
                "attestation_types": ["VERIFICATION"],
                "domains": ["test-domain"]
            }
        )
        
        # Rotate the key
        old_key_id = "key1"
        new_key_id = "key2"
        algorithm = "EC"
        key_data = "test-ec-key-data"
        updated = self.manager.rotate_public_key(
            authority_id=authority["authority_id"],
            old_key_id=old_key_id,
            new_key_id=new_key_id,
            algorithm=algorithm,
            key_data=key_data
        )
        
        # Verify the old key is rotated
        old_key = next(k for k in updated["public_keys"] if k["key_id"] == old_key_id)
        self.assertEqual(old_key["status"], "ROTATED")
        
        # Verify the new key is active
        new_key = next(k for k in updated["public_keys"] if k["key_id"] == new_key_id)
        self.assertEqual(new_key["status"], "ACTIVE")
        self.assertEqual(new_key["algorithm"], algorithm)
        self.assertEqual(new_key["key_data"], key_data)
        
        # Get it again to verify persistence
        retrieved = self.manager.get_authority(authority["authority_id"])
        old_key = next(k for k in retrieved["public_keys"] if k["key_id"] == old_key_id)
        self.assertEqual(old_key["status"], "ROTATED")
        new_key = next(k for k in retrieved["public_keys"] if k["key_id"] == new_key_id)
        self.assertEqual(new_key["status"], "ACTIVE")
    
    def test_update_trust_level(self):
        """Test updating an authority's trust level."""
        # Register an authority
        authority = self.manager.register_authority(
            name="Test Authority",
            description="A test authority",
            public_keys=[{"key_id": "key1", "algorithm": "RSA", "key_data": "test-key-data"}],
            capabilities={
                "attestation_types": ["VERIFICATION"],
                "domains": ["test-domain"]
            }
        )
        
        # Store the original last_updated timestamp
        original_timestamp = authority["trust_level"]["last_updated"]
        
        # Mock attestation service to return attestations
        self.mock_attestation_service.find_attestations.return_value = [
            {"attestation_id": "att1"},
            {"attestation_id": "att2"}
        ]
        
        # Mock attestation validation to return valid
        self.mock_attestation_service.validate_attestation.return_value = (True, {})
        
        # Modify the last_updated timestamp to ensure it changes
        authority["trust_level"]["last_updated"] = "2025-01-01T00:00:00Z"
        self.manager._store_authority(authority)
        
        # Update trust level
        updated = self.manager.update_trust_level(authority["authority_id"])
        
        # Verify trust level was updated
        self.assertNotEqual(updated["trust_level"]["last_updated"], "2025-01-01T00:00:00Z")
        
        # Get it again to verify persistence
        retrieved = self.manager.get_authority(authority["authority_id"])
        self.assertEqual(retrieved["trust_level"]["last_updated"], updated["trust_level"]["last_updated"])
    
    def test_verify_authority_for_attestation(self):
        """Test verifying an authority for attestation."""
        # Register and activate an authority
        authority = self.manager.register_authority(
            name="Test Authority",
            description="A test authority",
            public_keys=[{"key_id": "key1", "algorithm": "RSA", "key_data": "test-key-data"}],
            capabilities={
                "attestation_types": ["VERIFICATION", "CERTIFICATION"],
                "domains": ["domain1", "domain2"]
            }
        )
        self.manager.activate_authority(authority["authority_id"])
        
        # Set a high trust score
        authority["trust_level"]["score"] = 0.8
        self.manager._store_authority(authority)
        
        # Verify for supported attestation type and domain
        is_valid, details = self.manager.verify_authority_for_attestation(
            authority_id=authority["authority_id"],
            attestation_type="VERIFICATION",
            domain="domain1"
        )
        
        # Should be valid
        self.assertTrue(is_valid)
        self.assertEqual(details["authority_id"], authority["authority_id"])
        self.assertEqual(details["trust_score"], 0.8)
        
        # Verify for unsupported attestation type
        is_valid, details = self.manager.verify_authority_for_attestation(
            authority_id=authority["authority_id"],
            attestation_type="APPROVAL",
            domain="domain1"
        )
        
        # Should be invalid
        self.assertFalse(is_valid)
        self.assertIn("error", details)
        
        # Verify for unsupported domain
        is_valid, details = self.manager.verify_authority_for_attestation(
            authority_id=authority["authority_id"],
            attestation_type="VERIFICATION",
            domain="domain3"
        )
        
        # Should be invalid
        self.assertFalse(is_valid)
        self.assertIn("error", details)
        
        # Set a low trust score
        authority["trust_level"]["score"] = 0.3
        self.manager._store_authority(authority)
        
        # Verify with low trust score
        is_valid, details = self.manager.verify_authority_for_attestation(
            authority_id=authority["authority_id"],
            attestation_type="VERIFICATION",
            domain="domain1"
        )
        
        # Should be invalid due to low trust
        self.assertFalse(is_valid)
        self.assertIn("error", details)
        self.assertIn("trust score", details["error"])
    
    def test_find_authorities_for_attestation(self):
        """Test finding authorities for attestation."""
        # Register and activate multiple authorities
        authority1 = self.manager.register_authority(
            name="Authority 1",
            description="First test authority",
            public_keys=[{"key_id": "key1", "algorithm": "RSA", "key_data": "test-key-data"}],
            capabilities={
                "attestation_types": ["VERIFICATION", "CERTIFICATION"],
                "domains": ["domain1", "domain2"]
            }
        )
        self.manager.activate_authority(authority1["authority_id"])
        
        # Set trust levels
        authority1["trust_level"]["level"] = self.manager.TRUST_LEVEL_HIGH
        authority1["trust_level"]["score"] = 0.8
        self.manager._store_authority(authority1)
        
        # Find authorities for verification in domain1
        authorities = self.manager.find_authorities_for_attestation(
            attestation_type="VERIFICATION",
            domain="domain1"
        )
        
        # Should find one authority
        self.assertEqual(len(authorities), 1)
        self.assertEqual(authorities[0]["authority_id"], authority1["authority_id"])


if __name__ == '__main__':
    unittest.main()
