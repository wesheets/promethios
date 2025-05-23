"""
Trust Domain Manager for the Trust Boundary Definition framework.

This module provides functionality for managing trust domains within the Promethios system.
It handles domain registration, relationship mapping, trust level calculation, and governance
policy association.
"""

import os
import json
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple

# Import dependencies from previous phases
from src.core.trust.boundary_detection_engine import BoundaryDetectionEngine
from src.core.governance.governance_primitive_manager import GovernancePrimitiveManager
from src.core.governance.attestation_service import AttestationService
from src.core.governance.evolution_protocol import EvolutionProtocol
from src.core.common.schema_validator import SchemaValidator
from src.core.verification.seal_verification import SealVerificationService

class TrustDomainManager:
    """
    Manager for trust domains within the Promethios system.
    
    The TrustDomainManager is responsible for registering and managing trust domains,
    mapping relationships between domains, calculating trust levels, associating governance
    policies, and tracking domain evolution.
    """
    
    def __init__(
        self,
        boundary_detection_engine: BoundaryDetectionEngine,
        governance_primitive_manager: GovernancePrimitiveManager,
        attestation_service: AttestationService,
        evolution_protocol: EvolutionProtocol,
        schema_validator: SchemaValidator,
        seal_verification_service: SealVerificationService,
        domains_file_path: str = None
    ):
        """
        Initialize the TrustDomainManager.
        
        Args:
            boundary_detection_engine: Engine for detecting and managing trust boundaries
            governance_primitive_manager: Manager for governance primitives
            attestation_service: Service for managing attestations
            evolution_protocol: Protocol for managing evolution
            schema_validator: Validator for schema compliance
            seal_verification_service: Service for verifying seals
            domains_file_path: Path to the file storing domain definitions
        """
        self.boundary_detection_engine = boundary_detection_engine
        self.governance_primitive_manager = governance_primitive_manager
        self.attestation_service = attestation_service
        self.evolution_protocol = evolution_protocol
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        
        # Set default domains file path if not provided
        if domains_file_path is None:
            domains_file_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                "data",
                "trust",
                "domains.json"
            )
        
        self.domains_file_path = domains_file_path
        self.domains = {}
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(self.domains_file_path), exist_ok=True)
        
        # Load existing domains if file exists
        if os.path.exists(self.domains_file_path):
            self._load_domains()
        else:
            self._save_domains()
        
        self.logger = logging.getLogger(__name__)
    
    def _load_domains(self) -> None:
        """
        Load domains from the domains file.
        """
        try:
            with open(self.domains_file_path, 'r') as f:
                data = json.load(f)
                self.domains = data.get('domains', {})
        except Exception as e:
            self.logger.error(f"Error loading domains: {str(e)}")
            self.domains = {}
    
    def _save_domains(self) -> None:
        """
        Save domains to the domains file.
        """
        try:
            data = {
                'domains': self.domains
            }
            
            # Create a seal for the domains data
            seal = self.seal_verification_service.create_seal(json.dumps(data))
            data['seal'] = seal
            
            with open(self.domains_file_path, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving domains: {str(e)}")
    
    def register_domain(self, domain_definition: Dict[str, Any]) -> str:
        """
        Register a new trust domain in the system.
        
        Args:
            domain_definition: Definition of the domain to register
            
        Returns:
            ID of the registered domain
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("register_domain")
        
        # Validate the domain definition
        schema_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            "schemas",
            "trust",
            "trust_domain.schema.v1.json"
        )
        
        validation_result = self.schema_validator.validate(domain_definition, schema_path)
        if not validation_result.is_valid:
            self.logger.error(f"Invalid domain definition: {validation_result.errors}")
            raise ValueError(f"Invalid domain definition: {validation_result.errors}")
        
        # Generate a domain ID if not provided
        if 'domain_id' not in domain_definition:
            domain_definition['domain_id'] = f"domain-{str(uuid.uuid4())}"
        
        # Set timestamps if not provided
        now = datetime.utcnow().isoformat()
        if 'created_at' not in domain_definition:
            domain_definition['created_at'] = now
        if 'updated_at' not in domain_definition:
            domain_definition['updated_at'] = now
        
        # Set version if not provided
        if 'version' not in domain_definition:
            domain_definition['version'] = "1.0.0"
        
        # Set status if not provided
        if 'status' not in domain_definition:
            domain_definition['status'] = "active"
        
        # Add the domain to the registry
        domain_id = domain_definition['domain_id']
        self.domains[domain_id] = domain_definition
        
        # Save the updated domains
        self._save_domains()
        
        # Record domain creation in evolution history
        self._record_domain_evolution(
            domain_id=domain_id,
            evolution_type="created",
            actor_id="system",
            description="Domain created",
            previous_state=None,
            new_state=domain_definition
        )
        
        return domain_id
    
    def get_domain(self, domain_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a domain by its ID.
        
        Args:
            domain_id: ID of the domain to retrieve
            
        Returns:
            Domain definition or None if not found
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("get_domain")
        
        return self.domains.get(domain_id)
    
    def update_domain(self, domain_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update a domain definition.
        
        Args:
            domain_id: ID of the domain to update
            updates: Updates to apply to the domain
            
        Returns:
            True if the update was successful, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("update_domain")
        
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return False
        
        # Get the current domain definition
        domain = self.domains[domain_id]
        previous_state = domain.copy()
        
        # Apply updates
        for key, value in updates.items():
            if key not in ['domain_id', 'created_at']:
                domain[key] = value
        
        # Update the timestamp
        domain['updated_at'] = datetime.utcnow().isoformat()
        
        # Increment the version
        version_parts = domain['version'].split('.')
        version_parts[-1] = str(int(version_parts[-1]) + 1)
        domain['version'] = '.'.join(version_parts)
        
        # Validate the updated domain
        schema_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            "schemas",
            "trust",
            "trust_domain.schema.v1.json"
        )
        
        validation_result = self.schema_validator.validate(domain, schema_path)
        if not validation_result.is_valid:
            self.logger.error(f"Invalid domain definition after update: {validation_result.errors}")
            return False
        
        # Update the domain in the registry
        self.domains[domain_id] = domain
        
        # Save the updated domains
        self._save_domains()
        
        # Record domain update in evolution history
        self._record_domain_evolution(
            domain_id=domain_id,
            evolution_type="updated",
            actor_id="system",
            description="Domain updated",
            previous_state=previous_state,
            new_state=domain
        )
        
        return True
    
    def delete_domain(self, domain_id: str) -> bool:
        """
        Delete a domain from the registry.
        
        Args:
            domain_id: ID of the domain to delete
            
        Returns:
            True if the deletion was successful, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("delete_domain")
        
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return False
        
        # Get the current domain definition for evolution history
        previous_state = self.domains[domain_id].copy()
        
        # Remove the domain from the registry
        del self.domains[domain_id]
        
        # Save the updated domains
        self._save_domains()
        
        # Record domain deletion in evolution history
        self._record_domain_evolution(
            domain_id=domain_id,
            evolution_type="deprecated",
            actor_id="system",
            description="Domain deleted",
            previous_state=previous_state,
            new_state=None
        )
        
        return True
    
    def list_domains(self, domain_type: str = None, status: str = None) -> List[Dict[str, Any]]:
        """
        List all domains in the registry, optionally filtered by type and status.
        
        Args:
            domain_type: Type of domains to filter by
            status: Status to filter by
            
        Returns:
            List of domain definitions
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("list_domains")
        
        domains = list(self.domains.values())
        
        # Filter by domain type if provided
        if domain_type:
            domains = [d for d in domains if d.get('domain_type') == domain_type]
        
        # Filter by status if provided
        if status:
            domains = [d for d in domains if d.get('status') == status]
        
        return domains
    
    def add_domain_relationship(
        self,
        source_domain_id: str,
        target_domain_id: str,
        relationship_type: str,
        trust_direction: str,
        trust_level: float = None,
        description: str = None
    ) -> bool:
        """
        Add a relationship between two domains.
        
        Args:
            source_domain_id: ID of the source domain
            target_domain_id: ID of the target domain
            relationship_type: Type of relationship
            trust_direction: Direction of trust flow
            trust_level: Trust level for this relationship
            description: Description of the relationship
            
        Returns:
            True if the relationship was added successfully, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("add_domain_relationship")
        
        # Verify that both domains exist
        if source_domain_id not in self.domains:
            self.logger.error(f"Source domain {source_domain_id} not found")
            return False
        
        if target_domain_id not in self.domains:
            self.logger.error(f"Target domain {target_domain_id} not found")
            return False
        
        # Verify that the relationship type is valid
        valid_relationship_types = [
            "parent",
            "child",
            "peer",
            "trusted",
            "trusting",
            "distrusted",
            "isolated"
        ]
        
        if relationship_type not in valid_relationship_types:
            self.logger.error(f"Invalid relationship type: {relationship_type}")
            return False
        
        # Verify that the trust direction is valid
        valid_trust_directions = [
            "inbound",
            "outbound",
            "bidirectional",
            "none"
        ]
        
        if trust_direction not in valid_trust_directions:
            self.logger.error(f"Invalid trust direction: {trust_direction}")
            return False
        
        # Get the source domain
        source_domain = self.domains[source_domain_id]
        previous_source_state = source_domain.copy()
        
        # Initialize relationships if not present
        if 'relationships' not in source_domain:
            source_domain['relationships'] = []
        
        # Check if the relationship already exists
        for rel in source_domain['relationships']:
            if rel['related_domain_id'] == target_domain_id:
                # Update the existing relationship
                rel['relationship_type'] = relationship_type
                rel['trust_direction'] = trust_direction
                if trust_level is not None:
                    rel['trust_level'] = trust_level
                if description:
                    rel['description'] = description
                
                # Save the updated domains
                self._save_domains()
                
                # Record domain relationship update in evolution history
                self._record_domain_evolution(
                    domain_id=source_domain_id,
                    evolution_type="relationship_change",
                    actor_id="system",
                    description=f"Relationship with {target_domain_id} updated",
                    previous_state=previous_source_state,
                    new_state=source_domain
                )
                
                return True
        
        # Create the new relationship
        relationship = {
            "related_domain_id": target_domain_id,
            "relationship_type": relationship_type,
            "trust_direction": trust_direction
        }
        
        if trust_level is not None:
            relationship['trust_level'] = trust_level
        
        if description:
            relationship['description'] = description
        
        # Add the relationship to the source domain
        source_domain['relationships'].append(relationship)
        
        # Save the updated domains
        self._save_domains()
        
        # Record domain relationship addition in evolution history
        self._record_domain_evolution(
            domain_id=source_domain_id,
            evolution_type="relationship_change",
            actor_id="system",
            description=f"Relationship with {target_domain_id} added",
            previous_state=previous_source_state,
            new_state=source_domain
        )
        
        return True
    
    def remove_domain_relationship(self, source_domain_id: str, target_domain_id: str) -> bool:
        """
        Remove a relationship between two domains.
        
        Args:
            source_domain_id: ID of the source domain
            target_domain_id: ID of the target domain
            
        Returns:
            True if the relationship was removed successfully, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("remove_domain_relationship")
        
        # Verify that the source domain exists
        if source_domain_id not in self.domains:
            self.logger.error(f"Source domain {source_domain_id} not found")
            return False
        
        # Get the source domain
        source_domain = self.domains[source_domain_id]
        previous_source_state = source_domain.copy()
        
        # Check if the domain has relationships
        if 'relationships' not in source_domain:
            return False
        
        # Find and remove the relationship
        for i, rel in enumerate(source_domain['relationships']):
            if rel['related_domain_id'] == target_domain_id:
                source_domain['relationships'].pop(i)
                
                # Save the updated domains
                self._save_domains()
                
                # Record domain relationship removal in evolution history
                self._record_domain_evolution(
                    domain_id=source_domain_id,
                    evolution_type="relationship_change",
                    actor_id="system",
                    description=f"Relationship with {target_domain_id} removed",
                    previous_state=previous_source_state,
                    new_state=source_domain
                )
                
                return True
        
        return False
    
    def get_domain_relationships(self, domain_id: str) -> List[Dict[str, Any]]:
        """
        Get all relationships for a domain.
        
        Args:
            domain_id: ID of the domain
            
        Returns:
            List of relationships for the domain
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("get_domain_relationships")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return []
        
        # Get the domain
        domain = self.domains[domain_id]
        
        # Return the relationships if present
        return domain.get('relationships', [])
    
    def calculate_domain_trust_level(self, domain_id: str) -> Dict[str, Any]:
        """
        Calculate the trust level for a domain.
        
        Args:
            domain_id: ID of the domain
            
        Returns:
            Trust level information
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("calculate_domain_trust_level")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            raise ValueError(f"Domain {domain_id} not found")
        
        # Get the domain
        domain = self.domains[domain_id]
        previous_state = domain.copy()
        
        # Initialize trust factors
        factors = []
        
        # Factor 1: Attestation factor
        attestation_factor = self._calculate_attestation_factor(domain)
        factors.append({
            "factor_id": "attestation_factor",
            "factor_type": "attestation",
            "weight": 0.3,
            "value": attestation_factor,
            "description": "Trust factor based on attestations"
        })
        
        # Factor 2: Compliance factor
        compliance_factor = self._calculate_compliance_factor(domain)
        factors.append({
            "factor_id": "compliance_factor",
            "factor_type": "compliance",
            "weight": 0.2,
            "value": compliance_factor,
            "description": "Trust factor based on compliance"
        })
        
        # Factor 3: History factor
        history_factor = self._calculate_history_factor(domain)
        factors.append({
            "factor_id": "history_factor",
            "factor_type": "history",
            "weight": 0.1,
            "value": history_factor,
            "description": "Trust factor based on history"
        })
        
        # Factor 4: Integrity factor
        integrity_factor = self._calculate_integrity_factor(domain)
        factors.append({
            "factor_id": "integrity_factor",
            "factor_type": "integrity",
            "weight": 0.2,
            "value": integrity_factor,
            "description": "Trust factor based on integrity"
        })
        
        # Factor 5: Governance factor
        governance_factor = self._calculate_governance_factor(domain)
        factors.append({
            "factor_id": "governance_factor",
            "factor_type": "governance",
            "weight": 0.2,
            "value": governance_factor,
            "description": "Trust factor based on governance"
        })
        
        # Calculate overall trust level
        trust_level = 0.0
        for factor in factors:
            trust_level += factor['weight'] * factor['value']
        
        # Calculate confidence based on factor values
        confidence = sum(f['value'] for f in factors) / len(factors)
        
        # Create trust level object
        trust_level_obj = {
            "level": trust_level,
            "confidence": confidence,
            "last_calculated": datetime.utcnow().isoformat(),
            "factors": factors
        }
        
        # Update the domain with the new trust level
        domain['trust_level'] = trust_level_obj
        
        # Save the updated domains
        self._save_domains()
        
        # Record domain trust level change in evolution history
        self._record_domain_evolution(
            domain_id=domain_id,
            evolution_type="trust_level_change",
            actor_id="system",
            description="Trust level recalculated",
            previous_state=previous_state,
            new_state=domain
        )
        
        return trust_level_obj
    
    def _calculate_attestation_factor(self, domain: Dict[str, Any]) -> float:
        """
        Calculate the attestation factor for a domain.
        
        Args:
            domain: Domain to calculate factor for
            
        Returns:
            Attestation factor value (0.0 to 1.0)
        """
        # Check if the domain has attestations
        if 'attestations' not in domain or not domain['attestations']:
            return 0.0
        
        # Count valid attestations
        valid_attestations = 0
        total_attestations = len(domain['attestations'])
        
        for attestation_ref in domain['attestations']:
            attestation_id = attestation_ref['attestation_id']
            
            # Check if the attestation is valid
            if self.attestation_service.verify_attestation(attestation_id):
                valid_attestations += 1
        
        # Calculate factor value
        return valid_attestations / total_attestations if total_attestations > 0 else 0.0
    
    def _calculate_compliance_factor(self, domain: Dict[str, Any]) -> float:
        """
        Calculate the compliance factor for a domain.
        
        Args:
            domain: Domain to calculate factor for
            
        Returns:
            Compliance factor value (0.0 to 1.0)
        """
        # Check if the domain has governance policies
        if 'governance_policies' not in domain or not domain['governance_policies']:
            return 0.5  # Neutral value if no policies
        
        # Count policies with different enforcement levels
        total_policies = len(domain['governance_policies'])
        strict_policies = sum(1 for p in domain['governance_policies'] if p.get('enforcement_level') == 'strict')
        mandatory_policies = sum(1 for p in domain['governance_policies'] if p.get('enforcement_level') == 'mandatory')
        
        # Calculate factor value based on policy enforcement
        if total_policies == 0:
            return 0.5
        
        # Higher weight for strict policies
        weighted_sum = (strict_policies * 1.0 + mandatory_policies * 0.7) / total_policies
        
        return min(1.0, weighted_sum)
    
    def _calculate_history_factor(self, domain: Dict[str, Any]) -> float:
        """
        Calculate the history factor for a domain.
        
        Args:
            domain: Domain to calculate factor for
            
        Returns:
            History factor value (0.0 to 1.0)
        """
        # Check if the domain has evolution history
        if 'evolution_history' not in domain or not domain['evolution_history']:
            return 0.8  # Default value for new domains
        
        # Count positive and negative evolution events
        positive_events = 0
        negative_events = 0
        
        for event in domain['evolution_history']:
            event_type = event.get('evolution_type', '')
            
            # Classify events as positive or negative
            if event_type in ['created', 'attestation_change']:
                positive_events += 1
            elif event_type in ['boundary_change', 'trust_level_change', 'relationship_change']:
                # These can be either positive or negative, consider neutral
                pass
            elif event_type in ['deprecated', 'split']:
                negative_events += 1
        
        # Calculate factor value based on event history
        total_events = len(domain['evolution_history'])
        if total_events == 0:
            return 0.8
        
        # Base value plus positive influence minus negative influence
        base_value = 0.7
        positive_influence = 0.3 * (positive_events / total_events)
        negative_influence = 0.3 * (negative_events / total_events)
        
        return min(1.0, max(0.0, base_value + positive_influence - negative_influence))
    
    def _calculate_integrity_factor(self, domain: Dict[str, Any]) -> float:
        """
        Calculate the integrity factor for a domain.
        
        Args:
            domain: Domain to calculate factor for
            
        Returns:
            Integrity factor value (0.0 to 1.0)
        """
        # Check if the domain has boundaries
        if 'boundaries' not in domain or not domain['boundaries']:
            return 0.5  # Neutral value if no boundaries
        
        # For each boundary, check its integrity
        # In a real implementation, this would use the BoundaryIntegrityVerifier
        # For now, return a placeholder value
        return 0.9
    
    def _calculate_governance_factor(self, domain: Dict[str, Any]) -> float:
        """
        Calculate the governance factor for a domain.
        
        Args:
            domain: Domain to calculate factor for
            
        Returns:
            Governance factor value (0.0 to 1.0)
        """
        # Check if the domain has governance policies
        if 'governance_policies' not in domain or not domain['governance_policies']:
            return 0.5  # Neutral value if no policies
        
        # Get governance primitives for the domain
        domain_id = domain['domain_id']
        primitives = self.governance_primitive_manager.get_primitives_for_entity(domain_id)
        
        # Count active primitives
        active_primitives = sum(1 for p in primitives if p.get('status') == 'active')
        
        # Calculate factor value based on active primitives
        if not primitives:
            return 0.5
        
        return min(1.0, active_primitives / len(primitives))
    
    def associate_governance_policy(self, domain_id: str, policy_id: str, policy_type: str, enforcement_level: str = "mandatory") -> bool:
        """
        Associate a governance policy with a domain.
        
        Args:
            domain_id: ID of the domain
            policy_id: ID of the policy to associate
            policy_type: Type of policy
            enforcement_level: Level of policy enforcement
            
        Returns:
            True if the policy was associated successfully, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("associate_governance_policy")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return False
        
        # Get the domain
        domain = self.domains[domain_id]
        previous_state = domain.copy()
        
        # Initialize governance policies if not present
        if 'governance_policies' not in domain:
            domain['governance_policies'] = []
        
        # Check if the policy is already associated
        for policy in domain['governance_policies']:
            if policy['policy_id'] == policy_id:
                # Update the existing policy association
                policy['policy_type'] = policy_type
                policy['enforcement_level'] = enforcement_level
                
                # Save the updated domains
                self._save_domains()
                
                # Record domain policy change in evolution history
                self._record_domain_evolution(
                    domain_id=domain_id,
                    evolution_type="policy_change",
                    actor_id="system",
                    description=f"Policy {policy_id} updated",
                    previous_state=previous_state,
                    new_state=domain
                )
                
                return True
        
        # Create the new policy association
        policy_association = {
            "policy_id": policy_id,
            "policy_type": policy_type,
            "enforcement_level": enforcement_level
        }
        
        # Add the policy association to the domain
        domain['governance_policies'].append(policy_association)
        
        # Save the updated domains
        self._save_domains()
        
        # Record domain policy addition in evolution history
        self._record_domain_evolution(
            domain_id=domain_id,
            evolution_type="policy_change",
            actor_id="system",
            description=f"Policy {policy_id} associated",
            previous_state=previous_state,
            new_state=domain
        )
        
        return True
    
    def remove_governance_policy(self, domain_id: str, policy_id: str) -> bool:
        """
        Remove a governance policy association from a domain.
        
        Args:
            domain_id: ID of the domain
            policy_id: ID of the policy to remove
            
        Returns:
            True if the policy was removed successfully, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("remove_governance_policy")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return False
        
        # Get the domain
        domain = self.domains[domain_id]
        previous_state = domain.copy()
        
        # Check if the domain has governance policies
        if 'governance_policies' not in domain:
            return False
        
        # Find and remove the policy association
        for i, policy in enumerate(domain['governance_policies']):
            if policy['policy_id'] == policy_id:
                domain['governance_policies'].pop(i)
                
                # Save the updated domains
                self._save_domains()
                
                # Record domain policy removal in evolution history
                self._record_domain_evolution(
                    domain_id=domain_id,
                    evolution_type="policy_change",
                    actor_id="system",
                    description=f"Policy {policy_id} removed",
                    previous_state=previous_state,
                    new_state=domain
                )
                
                return True
        
        return False
    
    def get_domain_governance_policies(self, domain_id: str) -> List[Dict[str, Any]]:
        """
        Get all governance policies associated with a domain.
        
        Args:
            domain_id: ID of the domain
            
        Returns:
            List of governance policy associations for the domain
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("get_domain_governance_policies")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return []
        
        # Get the domain
        domain = self.domains[domain_id]
        
        # Return the governance policies if present
        return domain.get('governance_policies', [])
    
    def add_domain_attestation(self, domain_id: str, attester_id: str, claims: List[Dict[str, Any]]) -> str:
        """
        Add an attestation to a domain.
        
        Args:
            domain_id: ID of the domain
            attester_id: ID of the entity making the attestation
            claims: Claims to include in the attestation
            
        Returns:
            ID of the created attestation
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("add_domain_attestation")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            raise ValueError(f"Domain {domain_id} not found")
        
        # Get the domain
        domain = self.domains[domain_id]
        previous_state = domain.copy()
        
        # Create the attestation
        attestation_id = self.attestation_service.create_attestation(
            attester_id=attester_id,
            claims=claims,
            subject_id=domain_id,
            subject_type="trust_domain"
        )
        
        # Get the attestation details
        attestation = self.attestation_service.get_attestation(attestation_id)
        
        # Initialize attestations if not present
        if 'attestations' not in domain:
            domain['attestations'] = []
        
        # Add the attestation to the domain
        domain['attestations'].append({
            "attestation_id": attestation_id,
            "attester_id": attester_id,
            "timestamp": attestation.get('timestamp', datetime.utcnow().isoformat()),
            "validity_period": attestation.get('validity_period', {
                "start": datetime.utcnow().isoformat(),
                "end": datetime.utcnow().replace(year=datetime.utcnow().year + 1).isoformat()
            }),
            "claims": claims
        })
        
        # Save the updated domains
        self._save_domains()
        
        # Record domain attestation addition in evolution history
        self._record_domain_evolution(
            domain_id=domain_id,
            evolution_type="attestation_change",
            actor_id=attester_id,
            description=f"Attestation {attestation_id} added",
            previous_state=previous_state,
            new_state=domain
        )
        
        return attestation_id
    
    def remove_domain_attestation(self, domain_id: str, attestation_id: str) -> bool:
        """
        Remove an attestation from a domain.
        
        Args:
            domain_id: ID of the domain
            attestation_id: ID of the attestation to remove
            
        Returns:
            True if the attestation was removed successfully, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("remove_domain_attestation")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return False
        
        # Get the domain
        domain = self.domains[domain_id]
        previous_state = domain.copy()
        
        # Check if the domain has attestations
        if 'attestations' not in domain:
            return False
        
        # Find and remove the attestation
        for i, attestation in enumerate(domain['attestations']):
            if attestation['attestation_id'] == attestation_id:
                domain['attestations'].pop(i)
                
                # Save the updated domains
                self._save_domains()
                
                # Record domain attestation removal in evolution history
                self._record_domain_evolution(
                    domain_id=domain_id,
                    evolution_type="attestation_change",
                    actor_id="system",
                    description=f"Attestation {attestation_id} removed",
                    previous_state=previous_state,
                    new_state=domain
                )
                
                return True
        
        return False
    
    def get_domain_attestations(self, domain_id: str) -> List[Dict[str, Any]]:
        """
        Get all attestations for a domain.
        
        Args:
            domain_id: ID of the domain
            
        Returns:
            List of attestations for the domain
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("get_domain_attestations")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return []
        
        # Get the domain
        domain = self.domains[domain_id]
        
        # Return the attestations if present
        return domain.get('attestations', [])
    
    def add_domain_component(self, domain_id: str, component_id: str, component_type: str, description: str = None) -> bool:
        """
        Add a component to a domain.
        
        Args:
            domain_id: ID of the domain
            component_id: ID of the component to add
            component_type: Type of component
            description: Description of the component
            
        Returns:
            True if the component was added successfully, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("add_domain_component")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return False
        
        # Get the domain
        domain = self.domains[domain_id]
        previous_state = domain.copy()
        
        # Initialize components if not present
        if 'components' not in domain:
            domain['components'] = []
        
        # Check if the component is already in the domain
        for component in domain['components']:
            if component['component_id'] == component_id:
                # Update the existing component
                component['component_type'] = component_type
                if description:
                    component['description'] = description
                
                # Save the updated domains
                self._save_domains()
                
                # Record domain component update in evolution history
                self._record_domain_evolution(
                    domain_id=domain_id,
                    evolution_type="component_change",
                    actor_id="system",
                    description=f"Component {component_id} updated",
                    previous_state=previous_state,
                    new_state=domain
                )
                
                return True
        
        # Create the new component
        component = {
            "component_id": component_id,
            "component_type": component_type
        }
        
        if description:
            component['description'] = description
        
        # Add the component to the domain
        domain['components'].append(component)
        
        # Save the updated domains
        self._save_domains()
        
        # Record domain component addition in evolution history
        self._record_domain_evolution(
            domain_id=domain_id,
            evolution_type="component_change",
            actor_id="system",
            description=f"Component {component_id} added",
            previous_state=previous_state,
            new_state=domain
        )
        
        return True
    
    def remove_domain_component(self, domain_id: str, component_id: str) -> bool:
        """
        Remove a component from a domain.
        
        Args:
            domain_id: ID of the domain
            component_id: ID of the component to remove
            
        Returns:
            True if the component was removed successfully, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("remove_domain_component")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return False
        
        # Get the domain
        domain = self.domains[domain_id]
        previous_state = domain.copy()
        
        # Check if the domain has components
        if 'components' not in domain:
            return False
        
        # Find and remove the component
        for i, component in enumerate(domain['components']):
            if component['component_id'] == component_id:
                domain['components'].pop(i)
                
                # Save the updated domains
                self._save_domains()
                
                # Record domain component removal in evolution history
                self._record_domain_evolution(
                    domain_id=domain_id,
                    evolution_type="component_change",
                    actor_id="system",
                    description=f"Component {component_id} removed",
                    previous_state=previous_state,
                    new_state=domain
                )
                
                return True
        
        return False
    
    def get_domain_components(self, domain_id: str) -> List[Dict[str, Any]]:
        """
        Get all components in a domain.
        
        Args:
            domain_id: ID of the domain
            
        Returns:
            List of components in the domain
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("get_domain_components")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return []
        
        # Get the domain
        domain = self.domains[domain_id]
        
        # Return the components if present
        return domain.get('components', [])
    
    def associate_domain_with_boundary(self, domain_id: str, boundary_id: str, relationship: str) -> bool:
        """
        Associate a domain with a boundary.
        
        Args:
            domain_id: ID of the domain
            boundary_id: ID of the boundary to associate
            relationship: Relationship between the domain and the boundary
            
        Returns:
            True if the association was created successfully, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("associate_domain_with_boundary")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return False
        
        # Verify that the boundary exists
        boundary = self.boundary_detection_engine.get_boundary(boundary_id)
        if not boundary:
            self.logger.error(f"Boundary {boundary_id} not found")
            return False
        
        # Verify that the relationship is valid
        valid_relationships = [
            "defines",
            "contains",
            "intersects",
            "adjacent"
        ]
        
        if relationship not in valid_relationships:
            self.logger.error(f"Invalid relationship: {relationship}")
            return False
        
        # Get the domain
        domain = self.domains[domain_id]
        previous_state = domain.copy()
        
        # Initialize boundaries if not present
        if 'boundaries' not in domain:
            domain['boundaries'] = []
        
        # Check if the boundary is already associated
        for boundary_assoc in domain['boundaries']:
            if boundary_assoc['boundary_id'] == boundary_id:
                # Update the existing association
                boundary_assoc['relationship'] = relationship
                
                # Save the updated domains
                self._save_domains()
                
                # Record domain boundary association update in evolution history
                self._record_domain_evolution(
                    domain_id=domain_id,
                    evolution_type="boundary_change",
                    actor_id="system",
                    description=f"Boundary {boundary_id} association updated",
                    previous_state=previous_state,
                    new_state=domain
                )
                
                return True
        
        # Create the new boundary association
        boundary_association = {
            "boundary_id": boundary_id,
            "relationship": relationship
        }
        
        # Add the boundary association to the domain
        domain['boundaries'].append(boundary_association)
        
        # Save the updated domains
        self._save_domains()
        
        # Record domain boundary association addition in evolution history
        self._record_domain_evolution(
            domain_id=domain_id,
            evolution_type="boundary_change",
            actor_id="system",
            description=f"Boundary {boundary_id} associated",
            previous_state=previous_state,
            new_state=domain
        )
        
        return True
    
    def remove_domain_boundary_association(self, domain_id: str, boundary_id: str) -> bool:
        """
        Remove a boundary association from a domain.
        
        Args:
            domain_id: ID of the domain
            boundary_id: ID of the boundary to remove
            
        Returns:
            True if the association was removed successfully, False otherwise
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("remove_domain_boundary_association")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return False
        
        # Get the domain
        domain = self.domains[domain_id]
        previous_state = domain.copy()
        
        # Check if the domain has boundaries
        if 'boundaries' not in domain:
            return False
        
        # Find and remove the boundary association
        for i, boundary_assoc in enumerate(domain['boundaries']):
            if boundary_assoc['boundary_id'] == boundary_id:
                domain['boundaries'].pop(i)
                
                # Save the updated domains
                self._save_domains()
                
                # Record domain boundary association removal in evolution history
                self._record_domain_evolution(
                    domain_id=domain_id,
                    evolution_type="boundary_change",
                    actor_id="system",
                    description=f"Boundary {boundary_id} association removed",
                    previous_state=previous_state,
                    new_state=domain
                )
                
                return True
        
        return False
    
    def get_domain_boundaries(self, domain_id: str) -> List[Dict[str, Any]]:
        """
        Get all boundaries associated with a domain.
        
        Args:
            domain_id: ID of the domain
            
        Returns:
            List of boundary associations for the domain
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("get_domain_boundaries")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return []
        
        # Get the domain
        domain = self.domains[domain_id]
        
        # Return the boundaries if present
        return domain.get('boundaries', [])
    
    def _record_domain_evolution(
        self,
        domain_id: str,
        evolution_type: str,
        actor_id: str,
        description: str,
        previous_state: Dict[str, Any],
        new_state: Dict[str, Any]
    ) -> None:
        """
        Record a domain evolution event.
        
        Args:
            domain_id: ID of the domain
            evolution_type: Type of evolution
            actor_id: ID of the entity causing the evolution
            description: Description of the evolution
            previous_state: Previous state before evolution
            new_state: New state after evolution
        """
        # Skip if the domain no longer exists
        if domain_id not in self.domains:
            return
        
        # Get the domain
        domain = self.domains[domain_id]
        
        # Initialize evolution history if not present
        if 'evolution_history' not in domain:
            domain['evolution_history'] = []
        
        # Create the evolution event
        evolution_event = {
            "evolution_id": f"evolution-{str(uuid.uuid4())}",
            "timestamp": datetime.utcnow().isoformat(),
            "actor_id": actor_id,
            "evolution_type": evolution_type,
            "description": description
        }
        
        # Add state information if available
        if previous_state:
            evolution_event["previous_state"] = {
                "version": previous_state.get('version'),
                "status": previous_state.get('status'),
                "updated_at": previous_state.get('updated_at')
            }
        
        if new_state:
            evolution_event["new_state"] = {
                "version": new_state.get('version'),
                "status": new_state.get('status'),
                "updated_at": new_state.get('updated_at')
            }
        
        # Add the evolution event to the domain
        domain['evolution_history'].append(evolution_event)
        
        # Save the updated domains
        self._save_domains()
        
        # Record the evolution in the evolution protocol
        if self.evolution_protocol:
            self.evolution_protocol.record_evolution(
                entity_id=domain_id,
                entity_type="trust_domain",
                evolution_type=evolution_type,
                actor_id=actor_id,
                description=description,
                previous_state=previous_state,
                new_state=new_state
            )
    
    def get_domain_evolution_history(self, domain_id: str) -> List[Dict[str, Any]]:
        """
        Get the evolution history for a domain.
        
        Args:
            domain_id: ID of the domain
            
        Returns:
            List of evolution events for the domain
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("get_domain_evolution_history")
        
        # Verify that the domain exists
        if domain_id not in self.domains:
            self.logger.error(f"Domain {domain_id} not found")
            return []
        
        # Get the domain
        domain = self.domains[domain_id]
        
        # Return the evolution history if present
        return domain.get('evolution_history', [])
    
    def merge_domains(self, source_domain_ids: List[str], new_domain_definition: Dict[str, Any]) -> str:
        """
        Merge multiple domains into a new domain.
        
        Args:
            source_domain_ids: IDs of the domains to merge
            new_domain_definition: Definition for the new merged domain
            
        Returns:
            ID of the new merged domain
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("merge_domains")
        
        # Verify that all source domains exist
        for domain_id in source_domain_ids:
            if domain_id not in self.domains:
                self.logger.error(f"Source domain {domain_id} not found")
                raise ValueError(f"Source domain {domain_id} not found")
        
        # Create the new domain
        new_domain_id = self.register_domain(new_domain_definition)
        
        # Get the new domain
        new_domain = self.domains[new_domain_id]
        
        # Merge components from source domains
        components = []
        for domain_id in source_domain_ids:
            domain = self.domains[domain_id]
            if 'components' in domain:
                components.extend(domain['components'])
        
        if components:
            new_domain['components'] = components
        
        # Merge boundaries from source domains
        boundaries = []
        for domain_id in source_domain_ids:
            domain = self.domains[domain_id]
            if 'boundaries' in domain:
                boundaries.extend(domain['boundaries'])
        
        if boundaries:
            new_domain['boundaries'] = boundaries
        
        # Merge governance policies from source domains
        policies = []
        for domain_id in source_domain_ids:
            domain = self.domains[domain_id]
            if 'governance_policies' in domain:
                policies.extend(domain['governance_policies'])
        
        if policies:
            new_domain['governance_policies'] = policies
        
        # Save the updated domains
        self._save_domains()
        
        # Record merge in evolution history for the new domain
        self._record_domain_evolution(
            domain_id=new_domain_id,
            evolution_type="merged",
            actor_id="system",
            description=f"Domain created by merging {', '.join(source_domain_ids)}",
            previous_state=None,
            new_state=new_domain
        )
        
        # Update source domains to deprecated status
        for domain_id in source_domain_ids:
            domain = self.domains[domain_id]
            previous_state = domain.copy()
            
            domain['status'] = "deprecated"
            domain['updated_at'] = datetime.utcnow().isoformat()
            
            # Record deprecation in evolution history
            self._record_domain_evolution(
                domain_id=domain_id,
                evolution_type="deprecated",
                actor_id="system",
                description=f"Domain deprecated due to merge into {new_domain_id}",
                previous_state=previous_state,
                new_state=domain
            )
        
        # Save the updated domains again
        self._save_domains()
        
        return new_domain_id
    
    def split_domain(self, source_domain_id: str, new_domain_definitions: List[Dict[str, Any]]) -> List[str]:
        """
        Split a domain into multiple new domains.
        
        Args:
            source_domain_id: ID of the domain to split
            new_domain_definitions: Definitions for the new domains
            
        Returns:
            IDs of the new domains
        """
        # Perform pre-loop tether check
        self._verify_contract_tether("split_domain")
        
        # Verify that the source domain exists
        if source_domain_id not in self.domains:
            self.logger.error(f"Source domain {source_domain_id} not found")
            raise ValueError(f"Source domain {source_domain_id} not found")
        
        # Get the source domain
        source_domain = self.domains[source_domain_id]
        
        # Create the new domains
        new_domain_ids = []
        for domain_def in new_domain_definitions:
            new_domain_id = self.register_domain(domain_def)
            new_domain_ids.append(new_domain_id)
            
            # Record split in evolution history for the new domain
            self._record_domain_evolution(
                domain_id=new_domain_id,
                evolution_type="split",
                actor_id="system",
                description=f"Domain created by splitting {source_domain_id}",
                previous_state=None,
                new_state=self.domains[new_domain_id]
            )
        
        # Update source domain to deprecated status
        previous_state = source_domain.copy()
        
        source_domain['status'] = "deprecated"
        source_domain['updated_at'] = datetime.utcnow().isoformat()
        
        # Record deprecation in evolution history
        self._record_domain_evolution(
            domain_id=source_domain_id,
            evolution_type="split",
            actor_id="system",
            description=f"Domain deprecated due to split into {', '.join(new_domain_ids)}",
            previous_state=previous_state,
            new_state=source_domain
        )
        
        # Save the updated domains
        self._save_domains()
        
        return new_domain_ids
    
    def _verify_contract_tether(self, operation: str) -> None:
        """
        Verify the contract tether before performing an operation.
        
        Args:
            operation: Name of the operation being performed
            
        Raises:
            ValueError: If the contract tether verification fails
        """
        # Create a contract state representation
        contract_state = {
            "operation": operation,
            "timestamp": datetime.utcnow().isoformat(),
            "domains_count": len(self.domains)
        }
        
        # Verify the contract state
        if not self.seal_verification_service.verify_contract_tether(
            "TrustDomainManager",
            operation,
            json.dumps(contract_state)
        ):
            self.logger.error(f"Contract tether verification failed for operation: {operation}")
            raise ValueError(f"Contract tether verification failed for operation: {operation}")
