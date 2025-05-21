"""
Sample boundary definitions and implementations for the Trust Boundary Definition framework.

This module provides sample boundary definitions and implementations to demonstrate
the use of the core components and schemas of the Trust Boundary Definition framework.
"""

import os
import json
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Import core components
from src.core.trust.boundary_detection_engine import BoundaryDetectionEngine
from src.core.trust.boundary_crossing_protocol import BoundaryCrossingProtocol
from src.core.verification.boundary_integrity_verifier import BoundaryIntegrityVerifier
from src.core.trust.trust_domain_manager import TrustDomainManager

class SampleBoundaryDefinitions:
    """
    Sample boundary definitions and implementations for the Trust Boundary Definition framework.
    
    This class provides methods to create and manage sample boundary definitions and
    implementations for demonstration and testing purposes.
    """
    
    def __init__(
        self,
        boundary_detection_engine: BoundaryDetectionEngine,
        boundary_crossing_protocol: BoundaryCrossingProtocol,
        boundary_integrity_verifier: BoundaryIntegrityVerifier,
        trust_domain_manager: TrustDomainManager
    ):
        """
        Initialize the SampleBoundaryDefinitions.
        
        Args:
            boundary_detection_engine: Engine for detecting and managing trust boundaries
            boundary_crossing_protocol: Protocol for managing boundary crossings
            boundary_integrity_verifier: Verifier for ensuring boundary integrity
            trust_domain_manager: Manager for trust domains
        """
        self.boundary_detection_engine = boundary_detection_engine
        self.boundary_crossing_protocol = boundary_crossing_protocol
        self.boundary_integrity_verifier = boundary_integrity_verifier
        self.trust_domain_manager = trust_domain_manager
        self.logger = logging.getLogger(__name__)
    
    def create_sample_process_boundary(self) -> str:
        """
        Create a sample process boundary.
        
        Returns:
            ID of the created boundary
        """
        # Create a process boundary definition
        process_boundary = {
            "boundary_id": f"boundary-process-{str(uuid.uuid4())}",
            "name": "Sample Process Boundary",
            "description": "A sample process boundary for demonstration purposes",
            "boundary_type": "process",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "system",
                "name": "System",
                "role": "administrator"
            },
            "controls": [
                {
                    "control_id": f"control-{str(uuid.uuid4())}",
                    "control_type": "authentication",
                    "name": "Process Authentication Control",
                    "description": "Authentication control for the process boundary",
                    "implementation": {
                        "type": "token-based",
                        "mechanism": "JWT",
                        "configuration": {
                            "token_lifetime": 3600,
                            "refresh_enabled": True,
                            "multi_factor": False
                        }
                    },
                    "status": "active"
                },
                {
                    "control_id": f"control-{str(uuid.uuid4())}",
                    "control_type": "authorization",
                    "name": "Process Authorization Control",
                    "description": "Authorization control for the process boundary",
                    "implementation": {
                        "type": "role-based",
                        "mechanism": "RBAC",
                        "configuration": {
                            "roles": ["admin", "user", "guest"],
                            "default_role": "guest",
                            "privilege_escalation": False
                        }
                    },
                    "status": "active"
                }
            ],
            "entry_points": [
                {
                    "entry_point_id": f"entry-point-{str(uuid.uuid4())}",
                    "name": "Main API Endpoint",
                    "description": "Main API endpoint for the process",
                    "protocol": "HTTP",
                    "port": 8080,
                    "path": "/api/v1",
                    "authentication_required": True,
                    "authorization_required": True
                }
            ],
            "exit_points": [
                {
                    "exit_point_id": f"exit-point-{str(uuid.uuid4())}",
                    "name": "Database Connection",
                    "description": "Connection to the database",
                    "protocol": "TCP",
                    "port": 5432,
                    "destination": "database-server",
                    "authentication_required": True,
                    "encryption_required": True
                }
            ],
            "metadata": {
                "process_id": "12345",
                "process_name": "sample-process",
                "process_owner": "system",
                "process_priority": "high"
            }
        }
        
        # Register the boundary
        boundary_id = self.boundary_detection_engine.register_boundary(process_boundary)
        
        self.logger.info(f"Created sample process boundary: {boundary_id}")
        
        return boundary_id
    
    def create_sample_network_boundary(self) -> str:
        """
        Create a sample network boundary.
        
        Returns:
            ID of the created boundary
        """
        # Create a network boundary definition
        network_boundary = {
            "boundary_id": f"boundary-network-{str(uuid.uuid4())}",
            "name": "Sample Network Boundary",
            "description": "A sample network boundary for demonstration purposes",
            "boundary_type": "network",
            "classification": "restricted",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "network-admin",
                "name": "Network Administrator",
                "role": "network-admin"
            },
            "controls": [
                {
                    "control_id": f"control-{str(uuid.uuid4())}",
                    "control_type": "filtering",
                    "name": "Network Filtering Control",
                    "description": "Filtering control for the network boundary",
                    "implementation": {
                        "type": "firewall",
                        "mechanism": "stateful-inspection",
                        "configuration": {
                            "default_policy": "deny",
                            "allowed_ports": [80, 443, 22],
                            "allowed_protocols": ["TCP", "UDP"],
                            "ip_blacklist_enabled": True
                        }
                    },
                    "status": "active"
                },
                {
                    "control_id": f"control-{str(uuid.uuid4())}",
                    "control_type": "encryption",
                    "name": "Network Encryption Control",
                    "description": "Encryption control for the network boundary",
                    "implementation": {
                        "type": "transport-layer",
                        "mechanism": "TLS",
                        "configuration": {
                            "min_version": "1.2",
                            "preferred_ciphers": ["TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256"],
                            "certificate_rotation": True
                        }
                    },
                    "status": "active"
                },
                {
                    "control_id": f"control-{str(uuid.uuid4())}",
                    "control_type": "monitoring",
                    "name": "Network Monitoring Control",
                    "description": "Monitoring control for the network boundary",
                    "implementation": {
                        "type": "intrusion-detection",
                        "mechanism": "signature-based",
                        "configuration": {
                            "alert_threshold": "medium",
                            "log_retention": 90,
                            "real_time_alerting": True
                        }
                    },
                    "status": "active"
                }
            ],
            "entry_points": [
                {
                    "entry_point_id": f"entry-point-{str(uuid.uuid4())}",
                    "name": "Internet Gateway",
                    "description": "Internet-facing gateway",
                    "protocol": "TCP/IP",
                    "port_range": "80,443",
                    "source": "internet",
                    "authentication_required": True,
                    "encryption_required": True
                }
            ],
            "exit_points": [
                {
                    "exit_point_id": f"exit-point-{str(uuid.uuid4())}",
                    "name": "Internal Network Connection",
                    "description": "Connection to internal network",
                    "protocol": "TCP/IP",
                    "port_range": "1024-65535",
                    "destination": "internal-network",
                    "authentication_required": True,
                    "encryption_required": True
                }
            ],
            "network_segments": [
                {
                    "segment_id": f"segment-{str(uuid.uuid4())}",
                    "name": "DMZ",
                    "description": "Demilitarized zone",
                    "cidr": "192.168.1.0/24",
                    "vlan_id": 100,
                    "isolation_level": "high"
                },
                {
                    "segment_id": f"segment-{str(uuid.uuid4())}",
                    "name": "Internal",
                    "description": "Internal network",
                    "cidr": "10.0.0.0/16",
                    "vlan_id": 200,
                    "isolation_level": "high"
                }
            ],
            "metadata": {
                "network_id": "net-12345",
                "network_name": "sample-network",
                "network_owner": "network-admin",
                "network_priority": "high"
            }
        }
        
        # Register the boundary
        boundary_id = self.boundary_detection_engine.register_boundary(network_boundary)
        
        self.logger.info(f"Created sample network boundary: {boundary_id}")
        
        return boundary_id
    
    def create_sample_data_boundary(self) -> str:
        """
        Create a sample data boundary.
        
        Returns:
            ID of the created boundary
        """
        # Create a data boundary definition
        data_boundary = {
            "boundary_id": f"boundary-data-{str(uuid.uuid4())}",
            "name": "Sample Data Boundary",
            "description": "A sample data boundary for demonstration purposes",
            "boundary_type": "data",
            "classification": "critical",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "data-admin",
                "name": "Data Administrator",
                "role": "data-admin"
            },
            "controls": [
                {
                    "control_id": f"control-{str(uuid.uuid4())}",
                    "control_type": "encryption",
                    "name": "Data Encryption Control",
                    "description": "Encryption control for the data boundary",
                    "implementation": {
                        "type": "data-at-rest",
                        "mechanism": "AES-256",
                        "configuration": {
                            "key_rotation": True,
                            "key_rotation_period": 90,
                            "key_storage": "hardware-security-module"
                        }
                    },
                    "status": "active"
                },
                {
                    "control_id": f"control-{str(uuid.uuid4())}",
                    "control_type": "validation",
                    "name": "Data Validation Control",
                    "description": "Validation control for the data boundary",
                    "implementation": {
                        "type": "schema-validation",
                        "mechanism": "JSON-Schema",
                        "configuration": {
                            "strict_mode": True,
                            "additional_properties": False,
                            "error_handling": "reject"
                        }
                    },
                    "status": "active"
                },
                {
                    "control_id": f"control-{str(uuid.uuid4())}",
                    "control_type": "logging",
                    "name": "Data Access Logging Control",
                    "description": "Logging control for the data boundary",
                    "implementation": {
                        "type": "access-logging",
                        "mechanism": "event-based",
                        "configuration": {
                            "log_reads": True,
                            "log_writes": True,
                            "log_retention": 365,
                            "tamper_proof": True
                        }
                    },
                    "status": "active"
                }
            ],
            "entry_points": [
                {
                    "entry_point_id": f"entry-point-{str(uuid.uuid4())}",
                    "name": "Data API",
                    "description": "API for accessing data",
                    "protocol": "HTTPS",
                    "port": 443,
                    "path": "/api/data",
                    "authentication_required": True,
                    "authorization_required": True
                }
            ],
            "exit_points": [
                {
                    "exit_point_id": f"exit-point-{str(uuid.uuid4())}",
                    "name": "Data Export",
                    "description": "Data export endpoint",
                    "protocol": "HTTPS",
                    "port": 443,
                    "path": "/api/data/export",
                    "authentication_required": True,
                    "authorization_required": True,
                    "encryption_required": True
                }
            ],
            "data_classification": {
                "pii": True,
                "phi": True,
                "pci": False,
                "confidential": True,
                "public": False
            },
            "data_retention": {
                "policy": "retain-and-archive",
                "retention_period": 365,
                "archive_period": 730,
                "deletion_policy": "secure-wipe"
            },
            "metadata": {
                "data_id": "data-12345",
                "data_name": "sample-data",
                "data_owner": "data-admin",
                "data_priority": "high"
            }
        }
        
        # Register the boundary
        boundary_id = self.boundary_detection_engine.register_boundary(data_boundary)
        
        self.logger.info(f"Created sample data boundary: {boundary_id}")
        
        return boundary_id
    
    def create_sample_governance_boundary(self) -> str:
        """
        Create a sample governance boundary.
        
        Returns:
            ID of the created boundary
        """
        # Create a governance boundary definition
        governance_boundary = {
            "boundary_id": f"boundary-governance-{str(uuid.uuid4())}",
            "name": "Sample Governance Boundary",
            "description": "A sample governance boundary for demonstration purposes",
            "boundary_type": "governance",
            "classification": "restricted",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "governance-admin",
                "name": "Governance Administrator",
                "role": "governance-admin"
            },
            "controls": [
                {
                    "control_id": f"control-{str(uuid.uuid4())}",
                    "control_type": "authentication",
                    "name": "Governance Authentication Control",
                    "description": "Authentication control for the governance boundary",
                    "implementation": {
                        "type": "multi-factor",
                        "mechanism": "certificate-and-password",
                        "configuration": {
                            "token_lifetime": 1800,
                            "refresh_enabled": False,
                            "multi_factor": True
                        }
                    },
                    "status": "active"
                },
                {
                    "control_id": f"control-{str(uuid.uuid4())}",
                    "control_type": "authorization",
                    "name": "Governance Authorization Control",
                    "description": "Authorization control for the governance boundary",
                    "implementation": {
                        "type": "attribute-based",
                        "mechanism": "ABAC",
                        "configuration": {
                            "policy_enforcement_point": "centralized",
                            "policy_decision_point": "distributed",
                            "policy_information_point": "federated"
                        }
                    },
                    "status": "active"
                },
                {
                    "control_id": f"control-{str(uuid.uuid4())}",
                    "control_type": "logging",
                    "name": "Governance Audit Logging Control",
                    "description": "Audit logging control for the governance boundary",
                    "implementation": {
                        "type": "audit-logging",
                        "mechanism": "append-only",
                        "configuration": {
                            "log_all_actions": True,
                            "log_retention": 730,
                            "tamper_proof": True,
                            "cryptographic_verification": True
                        }
                    },
                    "status": "active"
                }
            ],
            "entry_points": [
                {
                    "entry_point_id": f"entry-point-{str(uuid.uuid4())}",
                    "name": "Governance API",
                    "description": "API for governance operations",
                    "protocol": "HTTPS",
                    "port": 443,
                    "path": "/api/governance",
                    "authentication_required": True,
                    "authorization_required": True
                }
            ],
            "exit_points": [
                {
                    "exit_point_id": f"exit-point-{str(uuid.uuid4())}",
                    "name": "Governance Notification",
                    "description": "Notification endpoint for governance events",
                    "protocol": "HTTPS",
                    "port": 443,
                    "path": "/api/governance/notify",
                    "authentication_required": True,
                    "authorization_required": True,
                    "encryption_required": True
                }
            ],
            "governance_policies": [
                {
                    "policy_id": f"policy-{str(uuid.uuid4())}",
                    "name": "Data Access Policy",
                    "description": "Policy governing data access",
                    "enforcement_level": "strict",
                    "version": "1.0.0",
                    "status": "active"
                },
                {
                    "policy_id": f"policy-{str(uuid.uuid4())}",
                    "name": "Authentication Policy",
                    "description": "Policy governing authentication",
                    "enforcement_level": "strict",
                    "version": "1.0.0",
                    "status": "active"
                },
                {
                    "policy_id": f"policy-{str(uuid.uuid4())}",
                    "name": "Audit Policy",
                    "description": "Policy governing audit logging",
                    "enforcement_level": "strict",
                    "version": "1.0.0",
                    "status": "active"
                }
            ],
            "metadata": {
                "governance_id": "gov-12345",
                "governance_name": "sample-governance",
                "governance_owner": "governance-admin",
                "governance_priority": "high"
            }
        }
        
        # Register the boundary
        boundary_id = self.boundary_detection_engine.register_boundary(governance_boundary)
        
        self.logger.info(f"Created sample governance boundary: {boundary_id}")
        
        return boundary_id
    
    def create_sample_trust_domain(self) -> str:
        """
        Create a sample trust domain.
        
        Returns:
            ID of the created domain
        """
        # Create a trust domain definition
        trust_domain = {
            "domain_id": f"domain-{str(uuid.uuid4())}",
            "name": "Sample Trust Domain",
            "description": "A sample trust domain for demonstration purposes",
            "domain_type": "application",
            "classification": "confidential",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "domain-admin",
                "name": "Domain Administrator",
                "role": "domain-admin"
            },
            "components": [
                {
                    "component_id": "component-1",
                    "component_type": "service",
                    "description": "Sample service component"
                },
                {
                    "component_id": "component-2",
                    "component_type": "database",
                    "description": "Sample database component"
                }
            ],
            "governance_policies": [
                {
                    "policy_id": "policy-1",
                    "policy_type": "access-control",
                    "enforcement_level": "mandatory"
                },
                {
                    "policy_id": "policy-2",
                    "policy_type": "data-protection",
                    "enforcement_level": "strict"
                }
            ],
            "metadata": {
                "domain_id": "dom-12345",
                "domain_name": "sample-domain",
                "domain_owner": "domain-admin",
                "domain_priority": "high"
            }
        }
        
        # Register the domain
        domain_id = self.trust_domain_manager.register_domain(trust_domain)
        
        self.logger.info(f"Created sample trust domain: {domain_id}")
        
        return domain_id
    
    def create_sample_boundary_crossing(self, source_boundary_id: str, target_boundary_id: str) -> str:
        """
        Create a sample boundary crossing.
        
        Args:
            source_boundary_id: ID of the source boundary
            target_boundary_id: ID of the target boundary
            
        Returns:
            ID of the created crossing
        """
        # Create a boundary crossing definition
        crossing = {
            "crossing_id": f"crossing-{str(uuid.uuid4())}",
            "source_boundary_id": source_boundary_id,
            "target_boundary_id": target_boundary_id,
            "crossing_type": "data-transfer",
            "direction": "outbound",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "status": "active",
            "protocol": "HTTPS",
            "port": 443,
            "path": "/api/data",
            "authentication_required": True,
            "authorization_required": True,
            "encryption_required": True,
            "validation_required": True,
            "controls": [
                {
                    "control_id": f"control-{str(uuid.uuid4())}",
                    "control_type": "authentication",
                    "name": "Crossing Authentication Control",
                    "description": "Authentication control for the boundary crossing",
                    "implementation": {
                        "type": "token-based",
                        "mechanism": "JWT",
                        "configuration": {
                            "token_lifetime": 3600,
                            "refresh_enabled": True,
                            "multi_factor": False
                        }
                    },
                    "status": "active"
                },
                {
                    "control_id": f"control-{str(uuid.uuid4())}",
                    "control_type": "encryption",
                    "name": "Crossing Encryption Control",
                    "description": "Encryption control for the boundary crossing",
                    "implementation": {
                        "type": "transport-layer",
                        "mechanism": "TLS",
                        "configuration": {
                            "min_version": "1.2",
                            "preferred_ciphers": ["TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256"],
                            "certificate_rotation": True
                        }
                    },
                    "status": "active"
                }
            ],
            "metadata": {
                "crossing_name": "sample-crossing",
                "crossing_owner": "system",
                "crossing_priority": "high"
            }
        }
        
        # Register the crossing
        crossing_id = self.boundary_crossing_protocol.register_crossing(crossing)
        
        self.logger.info(f"Created sample boundary crossing: {crossing_id}")
        
        return crossing_id
    
    def create_sample_boundary_integrity_verification(self, boundary_id: str) -> Dict[str, Any]:
        """
        Create a sample boundary integrity verification.
        
        Args:
            boundary_id: ID of the boundary to verify
            
        Returns:
            Verification record
        """
        # Verify the boundary integrity
        verification = self.boundary_integrity_verifier.verify_boundary_integrity(
            boundary_id=boundary_id,
            verification_type="comprehensive"
        )
        
        self.logger.info(f"Created sample boundary integrity verification: {verification['verification_id']}")
        
        return verification
    
    def create_sample_domain_relationship(self, source_domain_id: str, target_domain_id: str) -> bool:
        """
        Create a sample domain relationship.
        
        Args:
            source_domain_id: ID of the source domain
            target_domain_id: ID of the target domain
            
        Returns:
            True if the relationship was added successfully, False otherwise
        """
        # Add a domain relationship
        result = self.trust_domain_manager.add_domain_relationship(
            source_domain_id=source_domain_id,
            target_domain_id=target_domain_id,
            relationship_type="trusted",
            trust_direction="bidirectional",
            trust_level=0.8,
            description="Sample trusted relationship"
        )
        
        if result:
            self.logger.info(f"Created sample domain relationship between {source_domain_id} and {target_domain_id}")
        else:
            self.logger.error(f"Failed to create sample domain relationship between {source_domain_id} and {target_domain_id}")
        
        return result
    
    def create_sample_domain_boundary_association(self, domain_id: str, boundary_id: str) -> bool:
        """
        Create a sample domain-boundary association.
        
        Args:
            domain_id: ID of the domain
            boundary_id: ID of the boundary
            
        Returns:
            True if the association was created successfully, False otherwise
        """
        # Associate domain with boundary
        result = self.trust_domain_manager.associate_domain_with_boundary(
            domain_id=domain_id,
            boundary_id=boundary_id,
            relationship="defines"
        )
        
        if result:
            self.logger.info(f"Created sample domain-boundary association between {domain_id} and {boundary_id}")
        else:
            self.logger.error(f"Failed to create sample domain-boundary association between {domain_id} and {boundary_id}")
        
        return result
    
    def create_complete_sample_environment(self) -> Dict[str, Any]:
        """
        Create a complete sample environment with boundaries, domains, crossings, and verifications.
        
        Returns:
            Dictionary containing all created sample IDs
        """
        # Create sample boundaries
        process_boundary_id = self.create_sample_process_boundary()
        network_boundary_id = self.create_sample_network_boundary()
        data_boundary_id = self.create_sample_data_boundary()
        governance_boundary_id = self.create_sample_governance_boundary()
        
        # Create sample trust domains
        application_domain_id = self.create_sample_trust_domain()
        
        # Create another trust domain for relationship demonstration
        security_domain = {
            "domain_id": f"domain-security-{str(uuid.uuid4())}",
            "name": "Sample Security Domain",
            "description": "A sample security domain for demonstration purposes",
            "domain_type": "security",
            "classification": "restricted",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "status": "active",
            "owner": {
                "id": "security-admin",
                "name": "Security Administrator",
                "role": "security-admin"
            },
            "components": [
                {
                    "component_id": "component-3",
                    "component_type": "firewall",
                    "description": "Sample firewall component"
                },
                {
                    "component_id": "component-4",
                    "component_type": "ids",
                    "description": "Sample intrusion detection system component"
                }
            ],
            "governance_policies": [
                {
                    "policy_id": "policy-3",
                    "policy_type": "security-control",
                    "enforcement_level": "strict"
                }
            ],
            "metadata": {
                "domain_id": "dom-67890",
                "domain_name": "sample-security-domain",
                "domain_owner": "security-admin",
                "domain_priority": "high"
            }
        }
        
        security_domain_id = self.trust_domain_manager.register_domain(security_domain)
        
        # Create sample boundary crossings
        process_to_network_crossing_id = self.create_sample_boundary_crossing(
            source_boundary_id=process_boundary_id,
            target_boundary_id=network_boundary_id
        )
        
        network_to_data_crossing_id = self.create_sample_boundary_crossing(
            source_boundary_id=network_boundary_id,
            target_boundary_id=data_boundary_id
        )
        
        data_to_governance_crossing_id = self.create_sample_boundary_crossing(
            source_boundary_id=data_boundary_id,
            target_boundary_id=governance_boundary_id
        )
        
        # Create sample domain relationships
        self.create_sample_domain_relationship(
            source_domain_id=application_domain_id,
            target_domain_id=security_domain_id
        )
        
        # Create sample domain-boundary associations
        self.create_sample_domain_boundary_association(
            domain_id=application_domain_id,
            boundary_id=process_boundary_id
        )
        
        self.create_sample_domain_boundary_association(
            domain_id=security_domain_id,
            boundary_id=network_boundary_id
        )
        
        # Create sample boundary integrity verifications
        process_verification = self.create_sample_boundary_integrity_verification(
            boundary_id=process_boundary_id
        )
        
        network_verification = self.create_sample_boundary_integrity_verification(
            boundary_id=network_boundary_id
        )
        
        # Calculate domain trust levels
        application_trust_level = self.trust_domain_manager.calculate_domain_trust_level(
            domain_id=application_domain_id
        )
        
        security_trust_level = self.trust_domain_manager.calculate_domain_trust_level(
            domain_id=security_domain_id
        )
        
        # Return all created sample IDs
        return {
            "boundaries": {
                "process": process_boundary_id,
                "network": network_boundary_id,
                "data": data_boundary_id,
                "governance": governance_boundary_id
            },
            "domains": {
                "application": application_domain_id,
                "security": security_domain_id
            },
            "crossings": {
                "process_to_network": process_to_network_crossing_id,
                "network_to_data": network_to_data_crossing_id,
                "data_to_governance": data_to_governance_crossing_id
            },
            "verifications": {
                "process": process_verification["verification_id"],
                "network": network_verification["verification_id"]
            },
            "trust_levels": {
                "application": application_trust_level["level"],
                "security": security_trust_level["level"]
            }
        }
