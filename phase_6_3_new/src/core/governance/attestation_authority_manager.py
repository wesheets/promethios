"""
Attestation Authority Manager for the Governance Attestation Framework.

This module provides the core functionality for managing attestation authorities
and their trust levels within the Promethios governance framework.
"""

import json
import uuid
import logging
import datetime
from typing import Dict, List, Optional, Any, Tuple, Union
from pathlib import Path

# Import required dependencies
try:
    from src.core.common.schema_validator import SchemaValidator
    from src.core.governance.attestation_service import AttestationService
    from src.core.trust.trust_metrics_calculator import TrustMetricsCalculator
except ImportError:
    # Handle import errors gracefully for testing environments
    logging.warning("Running with mock dependencies. Some functionality may be limited.")
    SchemaValidator = None
    AttestationService = None
    TrustMetricsCalculator = None


class AttestationAuthorityManager:
    """
    Manager for attestation authorities.
    
    The AttestationAuthorityManager provides functionality for:
    - Authority registration and management
    - Trust level calculation and verification
    - Public key management and rotation
    - Authority capability verification
    
    This manager integrates with the AttestationService for attestation validation
    and the TrustMetricsCalculator for trust score calculation.
    """
    
    # Codex Contract Tethering
    CODEX_CONTRACT_ID = "governance.attestation_authority_manager"
    CODEX_CONTRACT_VERSION = "1.0.0"
    
    # Authority status constants
    STATUS_PENDING = "PENDING"
    STATUS_ACTIVE = "ACTIVE"
    STATUS_SUSPENDED = "SUSPENDED"
    STATUS_REVOKED = "REVOKED"
    
    # Trust level constants
    TRUST_LEVEL_NONE = "NONE"
    TRUST_LEVEL_LOW = "LOW"
    TRUST_LEVEL_MEDIUM = "MEDIUM"
    TRUST_LEVEL_HIGH = "HIGH"
    TRUST_LEVEL_MAXIMUM = "MAXIMUM"
    
    # Key status constants
    KEY_STATUS_ACTIVE = "ACTIVE"
    KEY_STATUS_REVOKED = "REVOKED"
    KEY_STATUS_EXPIRED = "EXPIRED"
    KEY_STATUS_ROTATED = "ROTATED"
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the AttestationAuthorityManager with the provided configuration.
        
        Args:
            config: Configuration dictionary with the following optional keys:
                - schema_path: Path to the authority schema
                - storage_path: Path for authority storage
                - trust_threshold: Minimum trust score for valid authorities
                - key_expiration_days: Default expiration period for keys in days
        """
        self.logger = logging.getLogger(__name__)
        self.config = config or {}
        
        # Pre-loop tether check
        self._verify_codex_contract_tether()
        
        # Initialize schema validator
        schema_path = self.config.get('schema_path', 
                                     str(Path(__file__).parent.parent.parent.parent / 
                                         'schemas/governance/authority.schema.v1.json'))
        self.schema_validator = SchemaValidator(schema_path) if SchemaValidator else None
        
        # Initialize dependencies
        self.attestation_service = self.config.get('attestation_service')
        self.trust_metrics_calculator = self.config.get('trust_metrics_calculator')
        
        # Initialize storage
        self.storage_path = self.config.get('storage_path', '/tmp/authorities')
        Path(self.storage_path).mkdir(parents=True, exist_ok=True)
        
        # Set trust threshold
        self.trust_threshold = self.config.get('trust_threshold', 0.5)
        
        # Set key expiration
        self.key_expiration_days = self.config.get('key_expiration_days', 365)
        
        # Initialize authority cache
        self.authority_cache = {}
        
        self.logger.info(f"AttestationAuthorityManager initialized with schema: {schema_path}")
    
    def _verify_codex_contract_tether(self) -> None:
        """
        Verify the Codex contract tether to ensure integrity.
        
        This method implements the pre-loop tether check required by the
        Promethios governance framework.
        
        Raises:
            RuntimeError: If the tether verification fails
        """
        try:
            # In a production environment, this would verify against the actual Codex contract
            # For now, we just check that the constants are defined correctly
            if not self.CODEX_CONTRACT_ID or not self.CODEX_CONTRACT_VERSION:
                raise ValueError("Codex contract tether constants are not properly defined")
            
            # Additional verification would be performed here in production
            self.logger.info(f"Codex contract tether verified: {self.CODEX_CONTRACT_ID}@{self.CODEX_CONTRACT_VERSION}")
        except Exception as e:
            self.logger.error(f"Codex contract tether verification failed: {str(e)}")
            raise RuntimeError(f"Codex contract tether verification failed: {str(e)}")
    
    def register_authority(self, 
                          name: str, 
                          description: str,
                          public_keys: List[Dict[str, str]],
                          capabilities: Dict[str, List[str]],
                          metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Register a new attestation authority.
        
        Args:
            name: Name of the authority
            description: Description of the authority
            public_keys: List of public keys for the authority
            capabilities: Dictionary of authority capabilities
            metadata: Optional metadata for the authority
            
        Returns:
            The registered authority as a dictionary
            
        Raises:
            ValueError: If the authority data is invalid
            RuntimeError: If authority registration fails
        """
        try:
            # Generate authority ID
            authority_id = f"authority-{uuid.uuid4()}"
            
            # Get current timestamp
            timestamp = datetime.datetime.utcnow().isoformat() + "Z"
            
            # Process public keys
            processed_keys = []
            for key in public_keys:
                # Validate key data
                if not key.get("key_id") or not key.get("algorithm") or not key.get("key_data"):
                    raise ValueError("Invalid public key data")
                
                # Add key metadata
                processed_key = key.copy()
                processed_key["status"] = self.KEY_STATUS_ACTIVE
                processed_key["created_at"] = timestamp
                
                # Calculate expiration
                expiration_date = (datetime.datetime.utcnow() + 
                                  datetime.timedelta(days=self.key_expiration_days))
                processed_key["expires_at"] = expiration_date.isoformat() + "Z"
                
                processed_keys.append(processed_key)
            
            # Initialize trust level
            trust_level = {
                "level": self.TRUST_LEVEL_MEDIUM,
                "score": 0.5,
                "last_updated": timestamp,
                "factors": {
                    "attestation_history": 0.0,
                    "verification_success_rate": 0.0,
                    "age_factor": 0.0
                }
            }
            
            # Create authority object
            authority = {
                "authority_id": authority_id,
                "name": name,
                "description": description,
                "public_keys": processed_keys,
                "capabilities": capabilities,
                "trust_level": trust_level,
                "status": self.STATUS_PENDING,
                "registration_date": timestamp,
                "metadata": metadata or {}
            }
            
            # Validate against schema
            if self.schema_validator:
                self.schema_validator.validate(authority)
            
            # Store authority
            self._store_authority(authority)
            
            # Update cache
            self.authority_cache[authority_id] = authority
            
            self.logger.info(f"Registered authority: {authority_id}, name: {name}")
            return authority
            
        except Exception as e:
            self.logger.error(f"Failed to register authority: {str(e)}")
            raise RuntimeError(f"Failed to register authority: {str(e)}")
    
    def get_authority(self, authority_id: str) -> Optional[Dict[str, Any]]:
        """
        Get an authority by its ID.
        
        Args:
            authority_id: Identifier of the authority to retrieve
            
        Returns:
            The authority as a dictionary, or None if not found
        """
        # Check cache first
        if authority_id in self.authority_cache:
            return self.authority_cache[authority_id]
        
        # Try to load from storage
        authority_path = Path(self.storage_path) / f"{authority_id}.json"
        if authority_path.exists():
            try:
                with open(authority_path, 'r') as f:
                    authority = json.load(f)
                    self.authority_cache[authority_id] = authority
                    return authority
            except Exception as e:
                self.logger.error(f"Failed to load authority {authority_id}: {str(e)}")
        
        return None
    
    def find_authorities(self, 
                        status: Optional[str] = None,
                        attestation_type: Optional[str] = None,
                        domain: Optional[str] = None,
                        min_trust_level: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Find authorities matching the specified criteria.
        
        Args:
            status: Optional status to filter by
            attestation_type: Optional attestation type to filter by
            domain: Optional domain to filter by
            min_trust_level: Optional minimum trust level to filter by
            
        Returns:
            List of matching authorities
        """
        results = []
        
        # Scan storage directory
        storage_path = Path(self.storage_path)
        for file_path in storage_path.glob("authority-*.json"):
            try:
                with open(file_path, 'r') as f:
                    authority = json.load(f)
                
                # Apply filters
                if status and authority["status"] != status:
                    continue
                
                if attestation_type and "attestation_types" in authority["capabilities"]:
                    if attestation_type not in authority["capabilities"]["attestation_types"]:
                        continue
                
                if domain and "domains" in authority["capabilities"]:
                    if domain not in authority["capabilities"]["domains"]:
                        continue
                
                if min_trust_level:
                    trust_levels = [
                        self.TRUST_LEVEL_NONE,
                        self.TRUST_LEVEL_LOW,
                        self.TRUST_LEVEL_MEDIUM,
                        self.TRUST_LEVEL_HIGH,
                        self.TRUST_LEVEL_MAXIMUM
                    ]
                    min_index = trust_levels.index(min_trust_level)
                    current_index = trust_levels.index(authority["trust_level"]["level"])
                    if current_index < min_index:
                        continue
                
                results.append(authority)
                
                # Update cache
                self.authority_cache[authority["authority_id"]] = authority
                
            except Exception as e:
                self.logger.error(f"Failed to process authority file {file_path}: {str(e)}")
        
        return results
    
    def activate_authority(self, authority_id: str) -> Dict[str, Any]:
        """
        Activate an authority.
        
        Args:
            authority_id: Identifier of the authority to activate
            
        Returns:
            The updated authority
            
        Raises:
            ValueError: If the authority ID is invalid
            RuntimeError: If activation fails
        """
        try:
            # Get authority
            authority = self.get_authority(authority_id)
            if not authority:
                raise ValueError(f"Authority not found: {authority_id}")
            
            # Check if already active
            if authority["status"] == self.STATUS_ACTIVE:
                return authority
            
            # Check if can be activated
            if authority["status"] == self.STATUS_REVOKED:
                raise ValueError("Cannot activate a revoked authority")
            
            # Update authority status
            authority["status"] = self.STATUS_ACTIVE
            authority["metadata"]["activation_timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
            
            # Store updated authority
            self._store_authority(authority)
            
            # Update cache
            self.authority_cache[authority_id] = authority
            
            self.logger.info(f"Activated authority: {authority_id}")
            return authority
            
        except Exception as e:
            self.logger.error(f"Failed to activate authority: {str(e)}")
            raise RuntimeError(f"Failed to activate authority: {str(e)}")
    
    def suspend_authority(self, authority_id: str, reason: str) -> Dict[str, Any]:
        """
        Suspend an authority.
        
        Args:
            authority_id: Identifier of the authority to suspend
            reason: Reason for suspension
            
        Returns:
            The updated authority
            
        Raises:
            ValueError: If the authority ID is invalid
            RuntimeError: If suspension fails
        """
        try:
            # Get authority
            authority = self.get_authority(authority_id)
            if not authority:
                raise ValueError(f"Authority not found: {authority_id}")
            
            # Check if already suspended
            if authority["status"] == self.STATUS_SUSPENDED:
                return authority
            
            # Check if can be suspended
            if authority["status"] == self.STATUS_REVOKED:
                raise ValueError("Cannot suspend a revoked authority")
            
            # Update authority status
            authority["status"] = self.STATUS_SUSPENDED
            authority["metadata"]["suspension_reason"] = reason
            authority["metadata"]["suspension_timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
            
            # Store updated authority
            self._store_authority(authority)
            
            # Update cache
            self.authority_cache[authority_id] = authority
            
            self.logger.info(f"Suspended authority: {authority_id}, reason: {reason}")
            return authority
            
        except Exception as e:
            self.logger.error(f"Failed to suspend authority: {str(e)}")
            raise RuntimeError(f"Failed to suspend authority: {str(e)}")
    
    def revoke_authority(self, authority_id: str, reason: str) -> Dict[str, Any]:
        """
        Revoke an authority.
        
        Args:
            authority_id: Identifier of the authority to revoke
            reason: Reason for revocation
            
        Returns:
            The updated authority
            
        Raises:
            ValueError: If the authority ID is invalid
            RuntimeError: If revocation fails
        """
        try:
            # Get authority
            authority = self.get_authority(authority_id)
            if not authority:
                raise ValueError(f"Authority not found: {authority_id}")
            
            # Check if already revoked
            if authority["status"] == self.STATUS_REVOKED:
                return authority
            
            # Update authority status
            authority["status"] = self.STATUS_REVOKED
            authority["metadata"]["revocation_reason"] = reason
            authority["metadata"]["revocation_timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
            
            # Revoke all keys
            for key in authority["public_keys"]:
                if key["status"] == self.KEY_STATUS_ACTIVE:
                    key["status"] = self.KEY_STATUS_REVOKED
                    key["revocation_timestamp"] = authority["metadata"]["revocation_timestamp"]
            
            # Store updated authority
            self._store_authority(authority)
            
            # Update cache
            self.authority_cache[authority_id] = authority
            
            self.logger.info(f"Revoked authority: {authority_id}, reason: {reason}")
            return authority
            
        except Exception as e:
            self.logger.error(f"Failed to revoke authority: {str(e)}")
            raise RuntimeError(f"Failed to revoke authority: {str(e)}")
    
    def add_public_key(self, 
                      authority_id: str, 
                      key_id: str,
                      algorithm: str,
                      key_data: str) -> Dict[str, Any]:
        """
        Add a public key to an authority.
        
        Args:
            authority_id: Identifier of the authority
            key_id: Identifier for the new key
            algorithm: Algorithm used for the key
            key_data: Public key data
            
        Returns:
            The updated authority
            
        Raises:
            ValueError: If the authority ID or key data is invalid
            RuntimeError: If key addition fails
        """
        try:
            # Get authority
            authority = self.get_authority(authority_id)
            if not authority:
                raise ValueError(f"Authority not found: {authority_id}")
            
            # Check if key ID already exists
            for key in authority["public_keys"]:
                if key["key_id"] == key_id:
                    raise ValueError(f"Key ID already exists: {key_id}")
            
            # Get current timestamp
            timestamp = datetime.datetime.utcnow().isoformat() + "Z"
            
            # Create new key
            new_key = {
                "key_id": key_id,
                "algorithm": algorithm,
                "key_data": key_data,
                "status": self.KEY_STATUS_ACTIVE,
                "created_at": timestamp
            }
            
            # Calculate expiration
            expiration_date = (datetime.datetime.utcnow() + 
                              datetime.timedelta(days=self.key_expiration_days))
            new_key["expires_at"] = expiration_date.isoformat() + "Z"
            
            # Add key to authority
            authority["public_keys"].append(new_key)
            
            # Store updated authority
            self._store_authority(authority)
            
            # Update cache
            self.authority_cache[authority_id] = authority
            
            self.logger.info(f"Added public key {key_id} to authority: {authority_id}")
            return authority
            
        except Exception as e:
            self.logger.error(f"Failed to add public key: {str(e)}")
            raise RuntimeError(f"Failed to add public key: {str(e)}")
    
    def revoke_public_key(self, authority_id: str, key_id: str) -> Dict[str, Any]:
        """
        Revoke a public key.
        
        Args:
            authority_id: Identifier of the authority
            key_id: Identifier of the key to revoke
            
        Returns:
            The updated authority
            
        Raises:
            ValueError: If the authority ID or key ID is invalid
            RuntimeError: If key revocation fails
        """
        try:
            # Get authority
            authority = self.get_authority(authority_id)
            if not authority:
                raise ValueError(f"Authority not found: {authority_id}")
            
            # Find key
            key_found = False
            for key in authority["public_keys"]:
                if key["key_id"] == key_id:
                    key_found = True
                    
                    # Check if already revoked
                    if key["status"] != self.KEY_STATUS_ACTIVE:
                        return authority
                    
                    # Update key status
                    key["status"] = self.KEY_STATUS_REVOKED
                    key["revocation_timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
                    break
            
            if not key_found:
                raise ValueError(f"Key not found: {key_id}")
            
            # Store updated authority
            self._store_authority(authority)
            
            # Update cache
            self.authority_cache[authority_id] = authority
            
            self.logger.info(f"Revoked public key {key_id} for authority: {authority_id}")
            return authority
            
        except Exception as e:
            self.logger.error(f"Failed to revoke public key: {str(e)}")
            raise RuntimeError(f"Failed to revoke public key: {str(e)}")
    
    def rotate_public_key(self, 
                         authority_id: str, 
                         old_key_id: str,
                         new_key_id: str,
                         algorithm: str,
                         key_data: str) -> Dict[str, Any]:
        """
        Rotate a public key.
        
        Args:
            authority_id: Identifier of the authority
            old_key_id: Identifier of the key to rotate
            new_key_id: Identifier for the new key
            algorithm: Algorithm used for the new key
            key_data: New public key data
            
        Returns:
            The updated authority
            
        Raises:
            ValueError: If the authority ID or key IDs are invalid
            RuntimeError: If key rotation fails
        """
        try:
            # Get authority
            authority = self.get_authority(authority_id)
            if not authority:
                raise ValueError(f"Authority not found: {authority_id}")
            
            # Check if new key ID already exists
            for key in authority["public_keys"]:
                if key["key_id"] == new_key_id:
                    raise ValueError(f"New key ID already exists: {new_key_id}")
            
            # Find old key
            old_key_found = False
            for key in authority["public_keys"]:
                if key["key_id"] == old_key_id:
                    old_key_found = True
                    
                    # Check if already rotated or revoked
                    if key["status"] != self.KEY_STATUS_ACTIVE:
                        raise ValueError(f"Key is not active: {old_key_id}")
                    
                    # Update key status
                    key["status"] = self.KEY_STATUS_ROTATED
                    key["rotation_timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
                    break
            
            if not old_key_found:
                raise ValueError(f"Old key not found: {old_key_id}")
            
            # Get current timestamp
            timestamp = datetime.datetime.utcnow().isoformat() + "Z"
            
            # Create new key
            new_key = {
                "key_id": new_key_id,
                "algorithm": algorithm,
                "key_data": key_data,
                "status": self.KEY_STATUS_ACTIVE,
                "created_at": timestamp,
                "rotated_from": old_key_id
            }
            
            # Calculate expiration
            expiration_date = (datetime.datetime.utcnow() + 
                              datetime.timedelta(days=self.key_expiration_days))
            new_key["expires_at"] = expiration_date.isoformat() + "Z"
            
            # Add new key to authority
            authority["public_keys"].append(new_key)
            
            # Store updated authority
            self._store_authority(authority)
            
            # Update cache
            self.authority_cache[authority_id] = authority
            
            self.logger.info(f"Rotated public key {old_key_id} to {new_key_id} for authority: {authority_id}")
            return authority
            
        except Exception as e:
            self.logger.error(f"Failed to rotate public key: {str(e)}")
            raise RuntimeError(f"Failed to rotate public key: {str(e)}")
    
    def update_trust_level(self, authority_id: str) -> Dict[str, Any]:
        """
        Update an authority's trust level based on attestation history.
        
        Args:
            authority_id: Identifier of the authority
            
        Returns:
            The updated authority
            
        Raises:
            ValueError: If the authority ID is invalid
            RuntimeError: If trust level update fails
        """
        try:
            # Get authority
            authority = self.get_authority(authority_id)
            if not authority:
                raise ValueError(f"Authority not found: {authority_id}")
            
            # Get attestations issued by this authority
            if not self.attestation_service:
                raise ValueError("Attestation service not available")
            
            attestations = self.attestation_service.find_attestations(issuer_id=authority_id)
            
            # Calculate trust factors
            
            # 1. Attestation history factor
            attestation_count = len(attestations)
            attestation_history_factor = min(attestation_count / 100, 1.0)
            
            # 2. Verification success rate
            valid_count = 0
            for attestation in attestations:
                is_valid, _ = self.attestation_service.validate_attestation(attestation["attestation_id"])
                if is_valid:
                    valid_count += 1
            
            verification_success_rate = valid_count / max(attestation_count, 1)
            
            # 3. Age factor
            try:
                # Ensure both dates are in the same format (either both naive or both aware)
                registration_date_str = authority["registration_date"].rstrip("Z")
                registration_date = datetime.datetime.fromisoformat(registration_date_str)
                current_date = datetime.datetime.utcnow()
                
                # Calculate age in days
                age_days = (current_date - registration_date).days
                age_factor = min(age_days / 365, 1.0)
            except Exception as e:
                self.logger.warning(f"Error calculating age factor: {str(e)}")
                age_factor = 0.5  # Default if calculation fails
            
            # Calculate overall trust score
            trust_score = (
                attestation_history_factor * 0.3 +
                verification_success_rate * 0.5 +
                age_factor * 0.2
            )
            
            # Determine trust level
            if trust_score >= 0.8:
                trust_level = self.TRUST_LEVEL_HIGH
            elif trust_score >= 0.5:
                trust_level = self.TRUST_LEVEL_MEDIUM
            elif trust_score >= 0.2:
                trust_level = self.TRUST_LEVEL_LOW
            else:
                trust_level = self.TRUST_LEVEL_NONE
            
            # Update authority trust level
            authority["trust_level"]["level"] = trust_level
            authority["trust_level"]["score"] = trust_score
            authority["trust_level"]["last_updated"] = datetime.datetime.utcnow().isoformat() + "Z"
            authority["trust_level"]["factors"] = {
                "attestation_history": attestation_history_factor,
                "verification_success_rate": verification_success_rate,
                "age_factor": age_factor
            }
            
            # Store updated authority
            self._store_authority(authority)
            
            # Update cache
            self.authority_cache[authority_id] = authority
            
            self.logger.info(f"Updated trust level for authority: {authority_id}, score: {trust_score}")
            return authority
            
        except Exception as e:
            self.logger.error(f"Failed to update trust level: {str(e)}")
            raise RuntimeError(f"Failed to update trust level: {str(e)}")
    
    def verify_authority_for_attestation(self, 
                                        authority_id: str,
                                        attestation_type: str,
                                        domain: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Verify if an authority is valid for a specific attestation.
        
        Args:
            authority_id: Identifier of the authority
            attestation_type: Type of attestation
            domain: Domain of attestation
            
        Returns:
            A tuple containing:
            - Boolean indicating verification success
            - Dictionary with verification details
        """
        try:
            # Get authority
            authority = self.get_authority(authority_id)
            if not authority:
                return False, {"error": "Authority not found"}
            
            # Check status
            if authority["status"] != self.STATUS_ACTIVE:
                return False, {"error": f"Authority is not active, status: {authority['status']}"}
            
            # Check capabilities
            if "attestation_types" not in authority["capabilities"] or attestation_type not in authority["capabilities"]["attestation_types"]:
                return False, {"error": f"Authority does not support attestation type: {attestation_type}"}
            
            if "domains" not in authority["capabilities"] or domain not in authority["capabilities"]["domains"]:
                return False, {"error": f"Authority does not support domain: {domain}"}
            
            # Check trust level
            trust_score = authority["trust_level"]["score"]
            if trust_score < self.trust_threshold:
                return False, {"error": f"Authority trust score ({trust_score}) is below threshold ({self.trust_threshold})"}
            
            # Check if any active keys
            has_active_key = False
            for key in authority["public_keys"]:
                if key["status"] == self.KEY_STATUS_ACTIVE:
                    has_active_key = True
                    break
            
            if not has_active_key:
                return False, {"error": "Authority has no active keys"}
            
            # Return verification result
            return True, {
                "authority_id": authority_id,
                "trust_score": trust_score,
                "trust_level": authority["trust_level"]["level"]
            }
            
        except Exception as e:
            self.logger.error(f"Failed to verify authority: {str(e)}")
            return False, {"error": f"Verification error: {str(e)}"}
    
    def find_authorities_for_attestation(self, 
                                        attestation_type: str,
                                        domain: str,
                                        min_trust_level: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Find authorities suitable for a specific attestation.
        
        Args:
            attestation_type: Type of attestation
            domain: Domain of attestation
            min_trust_level: Optional minimum trust level
            
        Returns:
            List of suitable authorities
        """
        # Find active authorities
        authorities = self.find_authorities(
            status=self.STATUS_ACTIVE,
            attestation_type=attestation_type,
            domain=domain,
            min_trust_level=min_trust_level
        )
        
        # Filter by trust threshold
        return [a for a in authorities if a["trust_level"]["score"] >= self.trust_threshold]
    
    def _store_authority(self, authority: Dict[str, Any]) -> None:
        """
        Store an authority to persistent storage.
        
        Args:
            authority: The authority to store
        """
        authority_id = authority["authority_id"]
        authority_path = Path(self.storage_path) / f"{authority_id}.json"
        
        try:
            with open(authority_path, 'w') as f:
                json.dump(authority, f, indent=2)
        except Exception as e:
            self.logger.error(f"Failed to store authority {authority_id}: {str(e)}")
            raise RuntimeError(f"Failed to store authority: {str(e)}")
