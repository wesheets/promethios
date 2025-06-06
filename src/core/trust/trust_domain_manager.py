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
from typing import Dict, List, Optional, Any, Tuple, Union

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
            schema_validator: Validator for schemas
            seal_verification_service: Service for verifying seals
            domains_file_path: Path to the domains file
        """
        self.boundary_detection_engine = boundary_detection_engine
        self.governance_primitive_manager = governance_primitive_manager
        self.attestation_service = attestation_service
        self.evolution_protocol = evolution_protocol
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        self.domains_file_path = domains_file_path or "/tmp/domains.json"
        
        # Initialize domains
        self.domains = {}
        
        # Load domains from file if it exists
        if os.path.exists(self.domains_file_path):
            try:
                with open(self.domains_file_path, "r") as f:
                    self.domains = json.load(f)
            except json.JSONDecodeError:
                logging.error(f"Failed to load domains from {self.domains_file_path}")
                self.domains = {}
        
        # Initialize domain components
        for domain_id, domain in self.domains.items():
            if "components" not in domain:
                domain["components"] = {}
            if "relationships" not in domain:
                domain["relationships"] = {}
            if "boundaries" not in domain:
                domain["boundaries"] = {}
            if "attestations" not in domain:
                domain["attestations"] = {}
            if "governance_policies" not in domain:
                domain["governance_policies"] = {}
            if "evolution_history" not in domain:
                domain["evolution_history"] = []
    
    def register_domain(self, domain: Dict[str, Any]) -> str:
        """
        Register a new domain.
        
        Args:
            domain: Domain definition
            
        Returns:
            Domain ID
            
        Raises:
            ValueError: If the domain definition is invalid
        """
        # Verify contract tether
        self._verify_contract_tether("register_domain")
        
        # Validate domain schema
        validation_result = self.schema_validator.validate_object(domain, "domain")
        if not validation_result.is_valid:
            raise ValueError(f"Invalid domain schema: {validation_result.errors}")
        
        # Generate domain ID if not provided
        domain_id = domain.get("domain_id", f"domain-{str(uuid.uuid4())}")
        domain["domain_id"] = domain_id
        
        # Add timestamp
        domain["created_at"] = datetime.utcnow().isoformat() + "Z"
        domain["updated_at"] = domain["created_at"]
        
        # Initialize domain components
        if "components" not in domain:
            domain["components"] = {}
        if "relationships" not in domain:
            domain["relationships"] = {}
        if "boundaries" not in domain:
            domain["boundaries"] = {}
        if "attestations" not in domain:
            domain["attestations"] = {}
        if "governance_policies" not in domain:
            domain["governance_policies"] = {}
        if "evolution_history" not in domain:
            domain["evolution_history"] = []
        
        # Add domain to registry
        self.domains[domain_id] = domain
        
        # Record evolution
        self._record_domain_evolution(
            domain_id,
            "domain_registered",
            {"domain": domain}
        )
        
        # Save domains to file
        self._save_domains()
        
        return domain_id
    
    def get_domain(self, domain_id: str) -> Dict[str, Any]:
        """
        Get a domain by ID.
        
        Args:
            domain_id: Domain ID
            
        Returns:
            Domain definition
            
        Raises:
            ValueError: If the domain does not exist
        """
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        return self.domains[domain_id]
    
    def update_domain(self, domain_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update a domain definition.
        
        Args:
            domain_id: Domain ID
            updates: Updates to apply
            
        Returns:
            True if the domain was updated, False otherwise
            
        Raises:
            ValueError: If the domain does not exist or the updates are invalid
        """
        # Verify contract tether
        self._verify_contract_tether("update_domain")
        
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Validate updates
        validation_result = self.schema_validator.validate_object(updates, "domain")
        if not validation_result.is_valid:
            raise ValueError(f"Invalid domain updates: {validation_result.errors}")
        
        # Apply updates
        domain = self.domains[domain_id]
        for key, value in updates.items():
            if key not in ["domain_id", "created_at", "updated_at", "components", "relationships", "boundaries", "attestations", "governance_policies", "evolution_history"]:
                domain[key] = value
        
        # Update timestamp
        domain["updated_at"] = datetime.utcnow().isoformat() + "Z"
        
        # Record evolution
        self._record_domain_evolution(
            domain_id,
            "domain_updated",
            {"updates": updates}
        )
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    def delete_domain(self, domain_id: str) -> bool:
        """
        Delete a domain from the registry.
        
        Args:
            domain_id: Domain ID
            
        Returns:
            True if the domain was deleted, False otherwise
            
        Raises:
            ValueError: If the domain does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("delete_domain")
        
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Record evolution before deletion
        self._record_domain_evolution(
            domain_id,
            "domain_deleted",
            {"domain": self.domains[domain_id]}
        )
        
        # Delete domain
        del self.domains[domain_id]
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    def list_domains(self, domain_type: str = None, status: str = None) -> Dict[str, Any]:
        """
        List all domains in the registry, optionally filtered by type and status.
        
        Args:
            domain_type: Domain type to filter by
            status: Domain status to filter by
            
        Returns:
            Dictionary of domains
        """
        # Filter domains
        filtered_domains = {}
        for domain_id, domain in self.domains.items():
            if domain_type and domain.get("domain_type") != domain_type:
                continue
            if status and domain.get("status") != status:
                continue
            filtered_domains[domain_id] = domain
        
        return filtered_domains
    
    def add_domain_component(self, domain_id: str, component_id: str, component_type: str, description: str = None) -> bool:
        """
        Add a component to a domain.
        
        Args:
            domain_id: Domain ID
            component_id: Component ID
            component_type: Component type
            description: Component description
            
        Returns:
            True if the component was added, False otherwise
            
        Raises:
            ValueError: If the domain does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("add_domain_component")
        
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Add component
        domain = self.domains[domain_id]
        if "components" not in domain:
            domain["components"] = {}
        
        domain["components"][component_id] = {
            "component_id": component_id,
            "type": component_type,
            "description": description,
            "added_at": datetime.utcnow().isoformat() + "Z"
        }
        
        # Record evolution
        self._record_domain_evolution(
            domain_id,
            "component_added",
            {"component_id": component_id, "component_type": component_type}
        )
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    def update_domain_component(self, domain_id: str, component_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update a component in a domain.
        
        Args:
            domain_id: Domain ID
            component_id: Component ID
            updates: Updates to apply
            
        Returns:
            True if the component was updated, False otherwise
            
        Raises:
            ValueError: If the domain or component does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("update_domain_component")
        
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Check if component exists
        domain = self.domains[domain_id]
        if "components" not in domain or component_id not in domain["components"]:
            raise ValueError(f"Component {component_id} does not exist in domain {domain_id}")
        
        # Apply updates
        component = domain["components"][component_id]
        for key, value in updates.items():
            if key not in ["component_id", "added_at"]:
                component[key] = value
        
        # Update timestamp
        component["updated_at"] = datetime.utcnow().isoformat() + "Z"
        
        # Record evolution
        self._record_domain_evolution(
            domain_id,
            "component_updated",
            {"component_id": component_id, "updates": updates}
        )
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    def remove_domain_component(self, domain_id: str, component_id: str) -> bool:
        """
        Remove a component from a domain.
        
        Args:
            domain_id: Domain ID
            component_id: Component ID
            
        Returns:
            True if the component was removed, False otherwise
            
        Raises:
            ValueError: If the domain or component does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("remove_domain_component")
        
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Check if component exists
        domain = self.domains[domain_id]
        if "components" not in domain or component_id not in domain["components"]:
            raise ValueError(f"Component {component_id} does not exist in domain {domain_id}")
        
        # Record evolution before removal
        self._record_domain_evolution(
            domain_id,
            "component_removed",
            {"component_id": component_id, "component": domain["components"][component_id]}
        )
        
        # Remove component
        del domain["components"][component_id]
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    def get_domain_components(self, domain_id: str) -> Dict[str, Any]:
        """
        Get all components in a domain.
        
        Args:
            domain_id: Domain ID
            
        Returns:
            Dictionary of components
            
        Raises:
            ValueError: If the domain does not exist
        """
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Get components
        domain = self.domains[domain_id]
        if "components" not in domain:
            domain["components"] = {}
        
        return domain["components"]
    
    def add_domain_relationship(self, source_domain_id: str, target_domain_id: str, relationship_type: str, description: str = None) -> bool:
        """
        Add a relationship between two domains.
        
        Args:
            source_domain_id: Source domain ID
            target_domain_id: Target domain ID
            relationship_type: Relationship type
            description: Relationship description
            
        Returns:
            True if the relationship was added, False otherwise
            
        Raises:
            ValueError: If either domain does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("add_domain_relationship")
        
        # Check if domains exist
        if source_domain_id not in self.domains:
            raise ValueError(f"Source domain {source_domain_id} does not exist")
        if target_domain_id not in self.domains:
            raise ValueError(f"Target domain {target_domain_id} does not exist")
        
        # Add relationship
        source_domain = self.domains[source_domain_id]
        if "relationships" not in source_domain:
            source_domain["relationships"] = {}
        
        source_domain["relationships"][target_domain_id] = {
            "target_domain_id": target_domain_id,
            "type": relationship_type,
            "description": description,
            "added_at": datetime.utcnow().isoformat() + "Z"
        }
        
        # Record evolution
        self._record_domain_evolution(
            source_domain_id,
            "relationship_added",
            {"target_domain_id": target_domain_id, "relationship_type": relationship_type}
        )
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    def update_domain_relationship(self, source_domain_id: str, target_domain_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update a relationship between two domains.
        
        Args:
            source_domain_id: Source domain ID
            target_domain_id: Target domain ID
            updates: Updates to apply
            
        Returns:
            True if the relationship was updated, False otherwise
            
        Raises:
            ValueError: If either domain does not exist or the relationship does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("update_domain_relationship")
        
        # Check if domains exist
        if source_domain_id not in self.domains:
            raise ValueError(f"Source domain {source_domain_id} does not exist")
        if target_domain_id not in self.domains:
            raise ValueError(f"Target domain {target_domain_id} does not exist")
        
        # Check if relationship exists
        source_domain = self.domains[source_domain_id]
        if "relationships" not in source_domain or target_domain_id not in source_domain["relationships"]:
            raise ValueError(f"Relationship from {source_domain_id} to {target_domain_id} does not exist")
        
        # Apply updates
        relationship = source_domain["relationships"][target_domain_id]
        for key, value in updates.items():
            if key not in ["target_domain_id", "added_at"]:
                relationship[key] = value
        
        # Update timestamp
        relationship["updated_at"] = datetime.utcnow().isoformat() + "Z"
        
        # Record evolution
        self._record_domain_evolution(
            source_domain_id,
            "relationship_updated",
            {"target_domain_id": target_domain_id, "updates": updates}
        )
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    def remove_domain_relationship(self, source_domain_id: str, target_domain_id: str) -> bool:
        """
        Remove a relationship between two domains.
        
        Args:
            source_domain_id: Source domain ID
            target_domain_id: Target domain ID
            
        Returns:
            True if the relationship was removed, False otherwise
            
        Raises:
            ValueError: If either domain does not exist or the relationship does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("remove_domain_relationship")
        
        # Check if domains exist
        if source_domain_id not in self.domains:
            raise ValueError(f"Source domain {source_domain_id} does not exist")
        if target_domain_id not in self.domains:
            raise ValueError(f"Target domain {target_domain_id} does not exist")
        
        # Check if relationship exists
        source_domain = self.domains[source_domain_id]
        if "relationships" not in source_domain or target_domain_id not in source_domain["relationships"]:
            raise ValueError(f"Relationship from {source_domain_id} to {target_domain_id} does not exist")
        
        # Record evolution before removal
        self._record_domain_evolution(
            source_domain_id,
            "relationship_removed",
            {"target_domain_id": target_domain_id, "relationship": source_domain["relationships"][target_domain_id]}
        )
        
        # Remove relationship
        del source_domain["relationships"][target_domain_id]
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    def get_domain_relationships(self, domain_id: str) -> Dict[str, Any]:
        """
        Get all relationships for a domain.
        
        Args:
            domain_id: Domain ID
            
        Returns:
            Dictionary of relationships
            
        Raises:
            ValueError: If the domain does not exist
        """
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Get relationships
        domain = self.domains[domain_id]
        if "relationships" not in domain:
            domain["relationships"] = {}
        
        return domain["relationships"]
    
    def add_domain_boundary_association(self, domain_id: str, boundary_id: str, description: str = None) -> bool:
        """
        Associate a domain with a boundary.
        
        Args:
            domain_id: Domain ID
            boundary_id: Boundary ID
            description: Association description
            
        Returns:
            True if the association was added, False otherwise
            
        Raises:
            ValueError: If the domain does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("add_domain_boundary_association")
        
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Add boundary association
        domain = self.domains[domain_id]
        if "boundaries" not in domain:
            domain["boundaries"] = {}
        
        domain["boundaries"][boundary_id] = {
            "boundary_id": boundary_id,
            "description": description,
            "added_at": datetime.utcnow().isoformat() + "Z"
        }
        
        # Record evolution
        self._record_domain_evolution(
            domain_id,
            "boundary_association_added",
            {"boundary_id": boundary_id}
        )
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    # Alias for backward compatibility
    associate_domain_with_boundary = add_domain_boundary_association
    
    def update_domain_boundary_association(self, domain_id: str, boundary_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update a boundary association for a domain.
        
        Args:
            domain_id: Domain ID
            boundary_id: Boundary ID
            updates: Updates to apply
            
        Returns:
            True if the association was updated, False otherwise
            
        Raises:
            ValueError: If the domain does not exist or the association does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("update_domain_boundary_association")
        
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Check if boundary association exists
        domain = self.domains[domain_id]
        if "boundaries" not in domain or boundary_id not in domain["boundaries"]:
            raise ValueError(f"Boundary association {boundary_id} does not exist in domain {domain_id}")
        
        # Apply updates
        association = domain["boundaries"][boundary_id]
        for key, value in updates.items():
            if key not in ["boundary_id", "added_at"]:
                association[key] = value
        
        # Update timestamp
        association["updated_at"] = datetime.utcnow().isoformat() + "Z"
        
        # Record evolution
        self._record_domain_evolution(
            domain_id,
            "boundary_association_updated",
            {"boundary_id": boundary_id, "updates": updates}
        )
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    def remove_domain_boundary_association(self, domain_id: str, boundary_id: str) -> bool:
        """
        Remove a boundary association from a domain.
        
        Args:
            domain_id: Domain ID
            boundary_id: Boundary ID
            
        Returns:
            True if the association was removed, False otherwise
            
        Raises:
            ValueError: If the domain does not exist or the association does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("remove_domain_boundary_association")
        
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Check if boundary association exists
        domain = self.domains[domain_id]
        if "boundaries" not in domain or boundary_id not in domain["boundaries"]:
            raise ValueError(f"Boundary association {boundary_id} does not exist in domain {domain_id}")
        
        # Record evolution before removal
        self._record_domain_evolution(
            domain_id,
            "boundary_association_removed",
            {"boundary_id": boundary_id, "association": domain["boundaries"][boundary_id]}
        )
        
        # Remove boundary association
        del domain["boundaries"][boundary_id]
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    def get_domain_boundaries(self, domain_id: str) -> Dict[str, Any]:
        """
        Get all boundaries associated with a domain.
        
        Args:
            domain_id: Domain ID
            
        Returns:
            Dictionary of boundary associations
            
        Raises:
            ValueError: If the domain does not exist
        """
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Get boundaries
        domain = self.domains[domain_id]
        if "boundaries" not in domain:
            domain["boundaries"] = {}
        
        return domain["boundaries"]
    
    def add_governance_policy(self, domain_id: str, policy_id: str, policy_type: str, enforcement_level: str = "mandatory") -> bool:
        """
        Associate a governance policy with a domain.
        
        Args:
            domain_id: Domain ID
            policy_id: Policy ID
            policy_type: Policy type
            enforcement_level: Enforcement level
            
        Returns:
            True if the policy was associated, False otherwise
            
        Raises:
            ValueError: If the domain does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("add_governance_policy")
        
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Add governance policy
        domain = self.domains[domain_id]
        if "governance_policies" not in domain:
            domain["governance_policies"] = {}
        
        domain["governance_policies"][policy_id] = {
            "policy_id": policy_id,
            "type": policy_type,
            "enforcement_level": enforcement_level,
            "added_at": datetime.utcnow().isoformat() + "Z"
        }
        
        # Record evolution
        self._record_domain_evolution(
            domain_id,
            "governance_policy_added",
            {"policy_id": policy_id, "policy_type": policy_type}
        )
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    # Alias for backward compatibility
    associate_governance_policy = add_governance_policy
    
    def update_governance_policy(self, domain_id: str, policy_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update a governance policy for a domain.
        
        Args:
            domain_id: Domain ID
            policy_id: Policy ID
            updates: Updates to apply
            
        Returns:
            True if the policy was updated, False otherwise
            
        Raises:
            ValueError: If the domain does not exist or the policy does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("update_governance_policy")
        
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Check if policy exists
        domain = self.domains[domain_id]
        if "governance_policies" not in domain or policy_id not in domain["governance_policies"]:
            raise ValueError(f"Governance policy {policy_id} does not exist in domain {domain_id}")
        
        # Apply updates
        policy = domain["governance_policies"][policy_id]
        for key, value in updates.items():
            if key not in ["policy_id", "added_at"]:
                policy[key] = value
        
        # Update timestamp
        policy["updated_at"] = datetime.utcnow().isoformat() + "Z"
        
        # Record evolution
        self._record_domain_evolution(
            domain_id,
            "governance_policy_updated",
            {"policy_id": policy_id, "updates": updates}
        )
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    def remove_governance_policy(self, domain_id: str, policy_id: str) -> bool:
        """
        Remove a governance policy association from a domain.
        
        Args:
            domain_id: Domain ID
            policy_id: Policy ID
            
        Returns:
            True if the policy was removed, False otherwise
            
        Raises:
            ValueError: If the domain does not exist or the policy does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("remove_governance_policy")
        
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Check if policy exists
        domain = self.domains[domain_id]
        if "governance_policies" not in domain or policy_id not in domain["governance_policies"]:
            raise ValueError(f"Governance policy {policy_id} does not exist in domain {domain_id}")
        
        # Record evolution before removal
        self._record_domain_evolution(
            domain_id,
            "governance_policy_removed",
            {"policy_id": policy_id, "policy": domain["governance_policies"][policy_id]}
        )
        
        # Remove policy
        del domain["governance_policies"][policy_id]
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    def get_governance_policies(self, domain_id: str) -> Dict[str, Any]:
        """
        Get all governance policies associated with a domain.
        
        Args:
            domain_id: Domain ID
            
        Returns:
            Dictionary of governance policies
            
        Raises:
            ValueError: If the domain does not exist
        """
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Get governance policies
        domain = self.domains[domain_id]
        if "governance_policies" not in domain:
            domain["governance_policies"] = {}
        
        return domain["governance_policies"]
    
    # Alias for backward compatibility
    get_domain_governance_policies = get_governance_policies
    
    def add_domain_attestation(self, domain_id: str, attestation_id: str, attestation_type: str, claims: List[Dict[str, Any]] = None) -> bool:
        """
        Add an attestation to a domain.
        
        Args:
            domain_id: Domain ID
            attestation_id: Attestation ID
            attestation_type: Attestation type
            claims: Attestation claims
            
        Returns:
            True if the attestation was added, False otherwise
            
        Raises:
            ValueError: If the domain does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("add_domain_attestation")
        
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Add attestation
        domain = self.domains[domain_id]
        if "attestations" not in domain:
            domain["attestations"] = {}
        
        domain["attestations"][attestation_id] = {
            "attestation_id": attestation_id,
            "type": attestation_type,
            "claims": claims or [],
            "added_at": datetime.utcnow().isoformat() + "Z"
        }
        
        # Record evolution
        self._record_domain_evolution(
            domain_id,
            "attestation_added",
            {"attestation_id": attestation_id, "attestation_type": attestation_type}
        )
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    def remove_domain_attestation(self, domain_id: str, attestation_id: str) -> bool:
        """
        Remove an attestation from a domain.
        
        Args:
            domain_id: Domain ID
            attestation_id: Attestation ID
            
        Returns:
            True if the attestation was removed, False otherwise
            
        Raises:
            ValueError: If the domain does not exist or the attestation does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("remove_domain_attestation")
        
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Check if attestation exists
        domain = self.domains[domain_id]
        if "attestations" not in domain or attestation_id not in domain["attestations"]:
            raise ValueError(f"Attestation {attestation_id} does not exist in domain {domain_id}")
        
        # Record evolution before removal
        self._record_domain_evolution(
            domain_id,
            "attestation_removed",
            {"attestation_id": attestation_id, "attestation": domain["attestations"][attestation_id]}
        )
        
        # Remove attestation
        del domain["attestations"][attestation_id]
        
        # Save domains to file
        self._save_domains()
        
        return True
    
    def get_domain_attestations(self, domain_id: str) -> Dict[str, Any]:
        """
        Get all attestations for a domain.
        
        Args:
            domain_id: Domain ID
            
        Returns:
            Dictionary of attestations
            
        Raises:
            ValueError: If the domain does not exist
        """
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Get attestations
        domain = self.domains[domain_id]
        if "attestations" not in domain:
            domain["attestations"] = {}
        
        return domain["attestations"]
    
    def calculate_domain_trust_level(self, domain_id: str) -> Dict[str, Any]:
        """
        Calculate the trust level for a domain.
        
        Args:
            domain_id: Domain ID
            
        Returns:
            Trust level calculation result
            
        Raises:
            ValueError: If the domain does not exist
        """
        # Check if domain exists
        if domain_id not in self.domains:
            raise ValueError(f"Domain {domain_id} does not exist")
        
        # Get domain
        domain = self.domains[domain_id]
        
        # Calculate trust factors
        attestation_factor = self._calculate_attestation_factor(domain)
        compliance_factor = self._calculate_compliance_factor(domain)
        history_factor = self._calculate_history_factor(domain)
        integrity_factor = self._calculate_integrity_factor(domain)
        governance_factor = self._calculate_governance_factor(domain)
        
        # Calculate overall trust level
        trust_level = (
            attestation_factor * 0.3 +
            compliance_factor * 0.2 +
            history_factor * 0.15 +
            integrity_factor * 0.2 +
            governance_factor * 0.15
        )
        
        # Create trust level result
        result = {
            "domain_id": domain_id,
            "trust_level": trust_level,
            "factors": {
                "attestation": attestation_factor,
                "compliance": compliance_factor,
                "history": history_factor,
                "integrity": integrity_factor,
                "governance": governance_factor
            },
            "calculated_at": datetime.utcnow().isoformat() + "Z"
        }
        
        return result
    
    def _calculate_attestation_factor(self, domain: Dict[str, Any]) -> float:
        """
        Calculate the attestation factor for a domain.
        
        Args:
            domain: Domain definition
            
        Returns:
            Attestation factor (0.0 to 1.0)
        """
        # Simple implementation for now
        attestations = domain.get("attestations", {})
        if not attestations:
            return 0.0
        
        # Count attestations by type
        attestation_counts = {}
        for attestation in attestations.values():
            attestation_type = attestation.get("type", "unknown")
            attestation_counts[attestation_type] = attestation_counts.get(attestation_type, 0) + 1
        
        # Calculate factor based on attestation types
        factor = min(1.0, len(attestation_counts) / 5.0)
        
        return factor
    
    def _calculate_compliance_factor(self, domain: Dict[str, Any]) -> float:
        """
        Calculate the compliance factor for a domain.
        
        Args:
            domain: Domain definition
            
        Returns:
            Compliance factor (0.0 to 1.0)
        """
        # Simple implementation for now
        governance_policies = domain.get("governance_policies", {})
        if not governance_policies:
            return 0.0
        
        # Count policies by type
        policy_counts = {}
        for policy in governance_policies.values():
            policy_type = policy.get("type", "unknown")
            policy_counts[policy_type] = policy_counts.get(policy_type, 0) + 1
        
        # Calculate factor based on policy types
        factor = min(1.0, len(policy_counts) / 3.0)
        
        return factor
    
    def _calculate_history_factor(self, domain: Dict[str, Any]) -> float:
        """
        Calculate the history factor for a domain.
        
        Args:
            domain: Domain definition
            
        Returns:
            History factor (0.0 to 1.0)
        """
        # Simple implementation for now
        evolution_history = domain.get("evolution_history", [])
        if not evolution_history:
            return 0.0
        
        # Calculate factor based on history length
        factor = min(1.0, len(evolution_history) / 10.0)
        
        return factor
    
    def _calculate_integrity_factor(self, domain: Dict[str, Any]) -> float:
        """
        Calculate the integrity factor for a domain.
        
        Args:
            domain: Domain definition
            
        Returns:
            Integrity factor (0.0 to 1.0)
        """
        # Simple implementation for now
        # In a real implementation, this would check for integrity violations
        return 0.8
    
    def _calculate_governance_factor(self, domain: Dict[str, Any]) -> float:
        """
        Calculate the governance factor for a domain.
        
        Args:
            domain: Domain definition
            
        Returns:
            Governance factor (0.0 to 1.0)
        """
        # Simple implementation for now
        governance_policies = domain.get("governance_policies", {})
        if not governance_policies:
            return 0.0
        
        # Calculate factor based on policy count
        factor = min(1.0, len(governance_policies) / 5.0)
        
        return factor
    
    def _record_domain_evolution(
        self,
        domain_id: str,
        event_type: str,
        event_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Record a domain evolution event.
        
        Args:
            domain_id: Domain ID
            event_type: Event type
            event_data: Event data
            
        Returns:
            Evolution record
        """
        # Check if domain exists
        if domain_id not in self.domains:
            return None
        
        # Create evolution record
        evolution_record = {
            "evolution_id": str(uuid.uuid4()),
            "domain_id": domain_id,
            "event_type": event_type,
            "event_data": event_data,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        # Add record to domain evolution history
        domain = self.domains[domain_id]
        if "evolution_history" not in domain:
            domain["evolution_history"] = []
        
        domain["evolution_history"].append(evolution_record)
        
        # Use evolution protocol to record evolution
        if self.evolution_protocol:
            self.evolution_protocol.record_evolution(
                domain_id=domain_id,
                event_type=event_type,
                event_data=event_data
            )
        
        return evolution_record
    
    def get_domain_evolution_history(self, domain_id: str) -> List[Dict[str, Any]]:
        """
        Get the evolution history for a domain.
        
        Args:
            domain_id: Domain ID
            
        Returns:
            List of evolution records
        """
        # Check if domain exists
        if domain_id not in self.domains:
            return []
        
        # Get evolution history
        domain = self.domains[domain_id]
        if "evolution_history" not in domain:
            domain["evolution_history"] = []
        
        return domain["evolution_history"]
    
    def merge_domains(self, source_domain_ids: List[str], new_domain_definition: Dict[str, Any]) -> str:
        """
        Merge multiple domains into a new domain.
        
        Args:
            source_domain_ids: List of source domain IDs
            new_domain_definition: Definition for the new merged domain
            
        Returns:
            New domain ID
            
        Raises:
            ValueError: If any source domain does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("merge_domains")
        
        # Check if source domains exist
        for domain_id in source_domain_ids:
            if domain_id not in self.domains:
                raise ValueError(f"Source domain {domain_id} does not exist")
        
        # Register new domain
        new_domain_id = self.register_domain(new_domain_definition)
        
        # Merge components, relationships, boundaries, attestations, and governance policies
        for source_domain_id in source_domain_ids:
            source_domain = self.domains[source_domain_id]
            
            # Merge components
            for component_id, component in source_domain.get("components", {}).items():
                self.add_domain_component(
                    new_domain_id,
                    component_id,
                    component.get("type", "unknown"),
                    component.get("description")
                )
            
            # Merge relationships
            for target_domain_id, relationship in source_domain.get("relationships", {}).items():
                if target_domain_id not in source_domain_ids:  # Don't merge relationships between source domains
                    self.add_domain_relationship(
                        new_domain_id,
                        target_domain_id,
                        relationship.get("type", "unknown"),
                        relationship.get("description")
                    )
            
            # Merge boundaries
            for boundary_id, boundary in source_domain.get("boundaries", {}).items():
                self.add_domain_boundary_association(
                    new_domain_id,
                    boundary_id,
                    boundary.get("description")
                )
            
            # Merge attestations
            for attestation_id, attestation in source_domain.get("attestations", {}).items():
                self.add_domain_attestation(
                    new_domain_id,
                    attestation_id,
                    attestation.get("type", "unknown"),
                    attestation.get("claims", [])
                )
            
            # Merge governance policies
            for policy_id, policy in source_domain.get("governance_policies", {}).items():
                self.add_governance_policy(
                    new_domain_id,
                    policy_id,
                    policy.get("type", "unknown"),
                    policy.get("enforcement_level", "mandatory")
                )
        
        # Record evolution
        self._record_domain_evolution(
            new_domain_id,
            "domains_merged",
            {"source_domain_ids": source_domain_ids}
        )
        
        return new_domain_id
    
    def split_domain(self, source_domain_id: str, new_domain_definitions: List[Dict[str, Any]], component_mapping: Dict[str, str] = None) -> List[str]:
        """
        Split a domain into multiple new domains.
        
        Args:
            source_domain_id: Source domain ID
            new_domain_definitions: Definitions for the new domains
            component_mapping: Mapping of component IDs to new domain IDs
            
        Returns:
            List of new domain IDs
            
        Raises:
            ValueError: If the source domain does not exist
        """
        # Verify contract tether
        self._verify_contract_tether("split_domain")
        
        # Check if source domain exists
        if source_domain_id not in self.domains:
            raise ValueError(f"Source domain {source_domain_id} does not exist")
        
        # Register new domains
        new_domain_ids = []
        for domain_def in new_domain_definitions:
            new_domain_id = self.register_domain(domain_def)
            new_domain_ids.append(new_domain_id)
        
        # Split components based on mapping
        if component_mapping:
            source_domain = self.domains[source_domain_id]
            for component_id, component in source_domain.get("components", {}).items():
                if component_id in component_mapping:
                    target_domain_id = component_mapping[component_id]
                    if target_domain_id in new_domain_ids:
                        self.add_domain_component(
                            target_domain_id,
                            component_id,
                            component.get("type", "unknown"),
                            component.get("description")
                        )
        
        # Record evolution
        for new_domain_id in new_domain_ids:
            self._record_domain_evolution(
                new_domain_id,
                "domain_split",
                {"source_domain_id": source_domain_id}
            )
        
        return new_domain_ids
    
    def _save_domains(self) -> None:
        """
        Save domains to file.
        """
        if not self.domains_file_path:
            return
        
        try:
            # Create a serializable copy of the domains dictionary
            serializable_domains = {}
            for domain_id, domain in self.domains.items():
                # Deep copy the domain to avoid modifying the original
                serializable_domain = {}
                for key, value in domain.items():
                    # Handle special cases for serialization
                    if key == "evolution_history":
                        # For evolution history, only include serializable fields
                        serializable_history = []
                        for record in value:
                            serializable_record = {}
                            for record_key, record_value in record.items():
                                if record_key == "event_data":
                                    # Simplify event data to avoid circular references
                                    serializable_event_data = {}
                                    for event_key, event_value in record_value.items():
                                        if isinstance(event_value, (str, int, float, bool, type(None))):
                                            serializable_event_data[event_key] = event_value
                                        elif isinstance(event_value, (list, tuple)):
                                            # Handle lists of primitive types
                                            if all(isinstance(item, (str, int, float, bool, type(None))) for item in event_value):
                                                serializable_event_data[event_key] = event_value
                                            else:
                                                serializable_event_data[event_key] = str(event_value)
                                        elif isinstance(event_value, dict):
                                            # Handle dictionaries with primitive values
                                            if all(isinstance(v, (str, int, float, bool, type(None))) for v in event_value.values()):
                                                serializable_event_data[event_key] = event_value
                                            else:
                                                serializable_event_data[event_key] = str(event_value)
                                        else:
                                            # Convert non-serializable objects to strings
                                            serializable_event_data[event_key] = str(event_value)
                                    serializable_record[record_key] = serializable_event_data
                                else:
                                    # Include other fields as-is if they're serializable
                                    if isinstance(record_value, (str, int, float, bool, type(None), list, dict)):
                                        serializable_record[record_key] = record_value
                                    else:
                                        serializable_record[record_key] = str(record_value)
                            serializable_history.append(serializable_record)
                        serializable_domain[key] = serializable_history
                    else:
                        # For other fields, include as-is if they're serializable
                        if isinstance(value, (str, int, float, bool, type(None))):
                            serializable_domain[key] = value
                        elif isinstance(value, (list, tuple)):
                            # Handle lists of primitive types
                            if all(isinstance(item, (str, int, float, bool, type(None))) for item in value):
                                serializable_domain[key] = value
                            else:
                                serializable_domain[key] = str(value)
                        elif isinstance(value, dict):
                            # Handle dictionaries with serializable values
                            serializable_dict = {}
                            for dict_key, dict_value in value.items():
                                if isinstance(dict_value, (str, int, float, bool, type(None))):
                                    serializable_dict[dict_key] = dict_value
                                elif isinstance(dict_value, dict):
                                    # Handle nested dictionaries with primitive values
                                    if all(isinstance(v, (str, int, float, bool, type(None))) for v in dict_value.values()):
                                        serializable_dict[dict_key] = dict_value
                                    else:
                                        serializable_dict[dict_key] = str(dict_value)
                                else:
                                    # Convert non-serializable objects to strings
                                    serializable_dict[dict_key] = str(dict_value)
                            serializable_domain[key] = serializable_dict
                        else:
                            # Convert non-serializable objects to strings
                            serializable_domain[key] = str(value)
                
                serializable_domains[domain_id] = serializable_domain
            
            # Write serializable domains to file
            with open(self.domains_file_path, "w") as f:
                json.dump(serializable_domains, f, indent=2)
        except Exception as e:
            logging.error(f"Failed to save domains to {self.domains_file_path}: {e}")
    
    def _verify_contract_tether(self, operation: str) -> None:
        """
        Verify the contract tether before performing an operation.
        
        Args:
            operation: Operation name
            
        Raises:
            ValueError: If the contract tether verification fails
        """
        if not self.seal_verification_service:
            return
        
        # Create verification context
        context = {
            "operation": operation,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        # Verify contract tether
        if not self.seal_verification_service.verify_contract_tether(context):
            raise ValueError(f"Contract tether verification failed for operation {operation}")
