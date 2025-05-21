"""
Sample data for schema validation in the Minimal Viable Governance framework.

This module provides sample data for validating the governance schemas:
- Governance Primitive Schema
- Decision Framework Schema
- Governance Policy Schema
- Governance Requirement Schema

These samples can be used for testing schema validation and for providing
examples of properly structured governance data.
"""

import json
import jsonschema
import datetime
import hashlib
import os
from pathlib import Path

# Paths to schema files
SCHEMAS_DIR = Path(__file__).parent
PRIMITIVE_SCHEMA_PATH = SCHEMAS_DIR / "governance_primitive.schema.v1.json"
DECISION_SCHEMA_PATH = SCHEMAS_DIR / "decision_framework.schema.v1.json"
POLICY_SCHEMA_PATH = SCHEMAS_DIR / "governance_policy.schema.v1.json"
REQUIREMENT_SCHEMA_PATH = SCHEMAS_DIR / "governance_requirement.schema.v1.json"

# Sample governance primitive data
SAMPLE_PRIMITIVE = {
    "primitive_id": "security.data_encryption",
    "version": "1.0.0",
    "name": "Data Encryption Primitive",
    "description": "Defines requirements for encrypting sensitive data at rest and in transit",
    "category": "SECURITY",
    "status": "ACTIVE",
    "created_at": datetime.datetime.now().isoformat(),
    "updated_at": datetime.datetime.now().isoformat(),
    "dependencies": [
        {
            "primitive_id": "security.key_management",
            "version": "1.0.0",
            "relationship_type": "REQUIRES",
            "notes": "Requires key management primitive for encryption key handling"
        }
    ],
    "validation_rules": [
        {
            "rule_id": "encryption.algorithm",
            "rule_type": "ENUM",
            "rule_definition": {
                "allowed_values": ["AES-256", "ChaCha20-Poly1305"]
            },
            "error_message": "Encryption algorithm must be AES-256 or ChaCha20-Poly1305",
            "severity": "ERROR"
        }
    ],
    "enforcement_mechanisms": [
        {
            "mechanism_id": "encryption.enforce",
            "mechanism_type": "PREVENTIVE",
            "mechanism_definition": {
                "check_function": "verify_encryption_before_storage",
                "parameters": {
                    "min_key_length": 256
                }
            },
            "activation_conditions": {
                "data_classification": ["SENSITIVE", "CONFIDENTIAL", "RESTRICTED"]
            },
            "priority": 1
        }
    ],
    "attestation_requirements": {
        "required_authorities": ["security_officer", "compliance_officer"],
        "minimum_trust_level": "HIGH",
        "attestation_frequency": "QUARTERLY",
        "attestation_expiry": "P3M"
    },
    "metadata": {
        "tags": ["encryption", "security", "compliance", "data-protection"],
        "owner": "Security Team",
        "source": "Security Policy Framework",
        "references": [
            {
                "title": "NIST Encryption Guidelines",
                "url": "https://example.com/nist-guidelines",
                "description": "NIST guidelines for data encryption"
            }
        ],
        "custom_properties": {
            "compliance_frameworks": ["GDPR", "HIPAA", "PCI-DSS"]
        }
    },
    "codex_contract": {
        "contract_id": "governance.primitive.security.data_encryption",
        "contract_version": "v2025.05.21",
        "tether_check_hash": hashlib.sha256("verify_codex_contract_tether".encode()).hexdigest(),
        "last_verified": datetime.datetime.now().isoformat()
    }
}

# Sample decision framework data
SAMPLE_DECISION = {
    "decision_id": "dec-2025-05-21-001",
    "request_id": "req-2025-05-21-001",
    "title": "Approval for New Data Processing System",
    "description": "Decision regarding the approval of a new data processing system for customer analytics",
    "decision_type": "SYSTEM_CONFIGURATION",
    "status": "APPROVED",
    "created_at": datetime.datetime.now().isoformat(),
    "updated_at": datetime.datetime.now().isoformat(),
    "requestor": {
        "id": "data_analytics_team",
        "type": "USER",
        "trust_level": "MEDIUM",
        "metadata": {
            "department": "Data Analytics",
            "request_reason": "Improve customer insights"
        }
    },
    "applicable_policies": [
        {
            "policy_id": "data_processing.customer_data",
            "version": "1.0.0",
            "evaluation_result": "COMPLIANT",
            "evaluation_details": {
                "compliance_score": 0.95,
                "notes": "System meets all policy requirements"
            }
        }
    ],
    "applicable_primitives": [
        {
            "primitive_id": "security.data_encryption",
            "version": "1.0.0",
            "relevance": "PRIMARY"
        },
        {
            "primitive_id": "compliance.data_retention",
            "version": "1.0.0",
            "relevance": "SECONDARY"
        }
    ],
    "decision_outcome": {
        "result": "APPROVED",
        "justification": "The proposed system meets all security and compliance requirements",
        "conditions": [
            {
                "condition_id": "cond-001",
                "description": "System must undergo security review every quarter",
                "expiry": (datetime.datetime.now() + datetime.timedelta(days=365)).isoformat(),
                "verification_method": "Security audit report"
            }
        ],
        "expiry": (datetime.datetime.now() + datetime.timedelta(days=365)).isoformat()
    },
    "decision_explanation": {
        "reasoning_steps": [
            {
                "step_id": "step-001",
                "description": "Evaluated security controls",
                "factors": [
                    {
                        "factor_id": "factor-001",
                        "description": "Encryption implementation",
                        "weight": 0.4
                    }
                ]
            }
        ],
        "alternative_outcomes": [
            {
                "outcome": "REJECTED",
                "probability": 0.2,
                "reason_rejected": "Security controls are sufficient"
            }
        ],
        "confidence_level": 0.9,
        "explanation_format": "TEXT"
    },
    "attestations": [
        {
            "attestation_id": "att-001",
            "authority_id": "security_officer",
            "timestamp": datetime.datetime.now().isoformat(),
            "signature": "sample_signature_data",
            "trust_level": "HIGH"
        }
    ],
    "audit_trail": [
        {
            "event_id": "evt-001",
            "event_type": "CREATED",
            "timestamp": datetime.datetime.now().isoformat(),
            "actor": {
                "id": "data_analytics_team",
                "type": "USER"
            },
            "details": {
                "notes": "Initial decision request created"
            }
        }
    ],
    "metadata": {
        "tags": ["data-processing", "customer-analytics", "approval"],
        "priority": "HIGH",
        "impact_assessment": {
            "security_impact": "MEDIUM",
            "operational_impact": "LOW",
            "compliance_impact": "MEDIUM",
            "ethical_impact": "LOW"
        },
        "custom_properties": {
            "business_value": "HIGH",
            "implementation_timeline": "Q3 2025"
        }
    },
    "codex_contract": {
        "contract_id": "governance.decision.system_configuration",
        "contract_version": "v2025.05.21",
        "tether_check_hash": hashlib.sha256("verify_codex_contract_tether".encode()).hexdigest(),
        "last_verified": datetime.datetime.now().isoformat()
    }
}

# Sample governance policy data
SAMPLE_POLICY = {
    "policy_id": "data_processing.customer_data",
    "version": "1.0.0",
    "name": "Customer Data Processing Policy",
    "description": "Policy governing the processing of customer data within the organization",
    "category": "COMPLIANCE",
    "status": "ACTIVE",
    "created_at": datetime.datetime.now().isoformat(),
    "updated_at": datetime.datetime.now().isoformat(),
    "effective_from": datetime.datetime.now().isoformat(),
    "effective_until": (datetime.datetime.now() + datetime.timedelta(days=365)).isoformat(),
    "scope": {
        "applies_to": [
            {
                "entity_type": "SYSTEM",
                "entity_id_pattern": ".*_analytics_.*",
                "conditions": {
                    "processes_customer_data": True
                }
            }
        ],
        "excludes": [
            {
                "entity_type": "SYSTEM",
                "entity_id_pattern": "legacy_system_.*",
                "reason": "Legacy systems are covered by separate policies"
            }
        ],
        "jurisdictions": ["EU", "US", "UK"]
    },
    "rules": [
        {
            "rule_id": "rule-001",
            "description": "Customer data must be encrypted at rest",
            "rule_type": "OBLIGATION",
            "rule_definition": {
                "condition": {
                    "data_type": "customer_data",
                    "storage_state": "at_rest"
                },
                "action": {
                    "apply_encryption": True,
                    "minimum_encryption_standard": "AES-256"
                }
            },
            "priority": 1,
            "severity": "CRITICAL"
        }
    ],
    "dependencies": [
        {
            "policy_id": "security.data_protection",
            "version": "1.0.0",
            "relationship_type": "EXTENDS",
            "notes": "Extends the general data protection policy with customer-specific requirements"
        }
    ],
    "conflict_resolution": {
        "resolution_strategy": "MOST_RESTRICTIVE",
        "priority": 10,
        "override_rules": [
            {
                "policy_id": "legacy.customer_data",
                "condition": {
                    "system_type": "modern"
                },
                "reason": "Modern systems should follow updated policy"
            }
        ]
    },
    "attestation_requirements": {
        "required_authorities": ["data_protection_officer", "compliance_officer"],
        "minimum_trust_level": "HIGH",
        "attestation_frequency": "QUARTERLY",
        "attestation_expiry": "P3M"
    },
    "metadata": {
        "tags": ["customer-data", "gdpr", "data-processing", "privacy"],
        "owner": "Data Governance Team",
        "source": "Data Governance Framework",
        "references": [
            {
                "title": "GDPR Article 5",
                "url": "https://example.com/gdpr-article-5",
                "description": "GDPR principles relating to processing of personal data"
            }
        ],
        "custom_properties": {
            "compliance_frameworks": ["GDPR", "CCPA"]
        }
    },
    "codex_contract": {
        "contract_id": "governance.policy.data_processing.customer_data",
        "contract_version": "v2025.05.21",
        "tether_check_hash": hashlib.sha256("verify_codex_contract_tether".encode()).hexdigest(),
        "last_verified": datetime.datetime.now().isoformat()
    }
}

# Sample governance requirement data
SAMPLE_REQUIREMENT = {
    "requirement_id": "req.data_encryption",
    "version": "1.0.0",
    "name": "Data Encryption Requirement",
    "description": "Requirement for encrypting sensitive data in systems",
    "category": "SECURITY",
    "status": "ACTIVE",
    "created_at": datetime.datetime.now().isoformat(),
    "updated_at": datetime.datetime.now().isoformat(),
    "effective_from": datetime.datetime.now().isoformat(),
    "effective_until": (datetime.datetime.now() + datetime.timedelta(days=365)).isoformat(),
    "scope": {
        "applies_to": [
            {
                "entity_type": "SYSTEM",
                "entity_id_pattern": ".*",
                "conditions": {
                    "processes_sensitive_data": True
                }
            }
        ],
        "excludes": [
            {
                "entity_type": "SYSTEM",
                "entity_id_pattern": "air_gapped_.*",
                "reason": "Air-gapped systems have separate requirements"
            }
        ],
        "jurisdictions": ["GLOBAL"]
    },
    "validation_criteria": [
        {
            "criterion_id": "criterion-001",
            "description": "Data must be encrypted with approved algorithms",
            "validation_method": "AUTOMATED",
            "validation_definition": {
                "condition": {
                    "check_type": "encryption_algorithm",
                    "parameters": {
                        "data_types": ["PII", "FINANCIAL", "HEALTH"]
                    }
                },
                "expected_result": {
                    "algorithms": ["AES-256", "ChaCha20-Poly1305"]
                },
                "tolerance": {
                    "allow_exceptions": False
                }
            },
            "priority": 1,
            "severity": "CRITICAL"
        }
    ],
    "dependencies": [
        {
            "requirement_id": "req.key_management",
            "version": "1.0.0",
            "relationship_type": "REQUIRES",
            "notes": "Encryption requires proper key management"
        }
    ],
    "related_policies": [
        {
            "policy_id": "data_processing.customer_data",
            "version": "1.0.0",
            "relationship_type": "IMPLEMENTS",
            "notes": "This requirement implements aspects of the customer data policy"
        }
    ],
    "validation_frequency": {
        "schedule_type": "PERIODIC",
        "periodic_schedule": "R/P1M",
        "event_triggers": [
            {
                "event_type": "SYSTEM_UPDATE",
                "event_pattern": {
                    "update_type": ["MAJOR", "SECURITY"]
                }
            }
        ]
    },
    "remediation_guidelines": [
        {
            "violation_type": "WEAK_ENCRYPTION",
            "remediation_steps": [
                {
                    "step_number": 1,
                    "description": "Identify all instances of weak encryption",
                    "expected_outcome": "Complete inventory of weak encryption usage"
                },
                {
                    "step_number": 2,
                    "description": "Upgrade encryption to approved algorithms",
                    "expected_outcome": "All encryption meets standards"
                }
            ],
            "timeframe": "1_WEEK",
            "severity": "CRITICAL"
        }
    ],
    "attestation_requirements": {
        "required_authorities": ["security_officer"],
        "minimum_trust_level": "HIGH",
        "attestation_frequency": "QUARTERLY",
        "attestation_expiry": "P3M"
    },
    "metadata": {
        "tags": ["encryption", "security", "data-protection"],
        "owner": "Security Team",
        "source": "Security Requirements Framework",
        "references": [
            {
                "title": "NIST Encryption Standards",
                "url": "https://example.com/nist-standards",
                "description": "NIST standards for encryption"
            }
        ],
        "custom_properties": {
            "audit_priority": "HIGH"
        }
    },
    "codex_contract": {
        "contract_id": "governance.requirement.data_encryption",
        "contract_version": "v2025.05.21",
        "tether_check_hash": hashlib.sha256("verify_codex_contract_tether".encode()).hexdigest(),
        "last_verified": datetime.datetime.now().isoformat()
    }
}

def load_schema(schema_path):
    """Load a JSON schema from file."""
    with open(schema_path, 'r') as f:
        return json.load(f)

def validate_sample_data():
    """Validate all sample data against their respective schemas."""
    results = {}
    
    # Validate primitive
    try:
        if os.path.exists(PRIMITIVE_SCHEMA_PATH):
            primitive_schema = load_schema(PRIMITIVE_SCHEMA_PATH)
            jsonschema.validate(SAMPLE_PRIMITIVE, primitive_schema)
            results["primitive"] = "Valid"
        else:
            results["primitive"] = "Schema file not found"
    except jsonschema.exceptions.ValidationError as e:
        results["primitive"] = f"Invalid: {e}"
    
    # Validate decision
    try:
        if os.path.exists(DECISION_SCHEMA_PATH):
            decision_schema = load_schema(DECISION_SCHEMA_PATH)
            jsonschema.validate(SAMPLE_DECISION, decision_schema)
            results["decision"] = "Valid"
        else:
            results["decision"] = "Schema file not found"
    except jsonschema.exceptions.ValidationError as e:
        results["decision"] = f"Invalid: {e}"
    
    # Validate policy
    try:
        if os.path.exists(POLICY_SCHEMA_PATH):
            policy_schema = load_schema(POLICY_SCHEMA_PATH)
            jsonschema.validate(SAMPLE_POLICY, policy_schema)
            results["policy"] = "Valid"
        else:
            results["policy"] = "Schema file not found"
    except jsonschema.exceptions.ValidationError as e:
        results["policy"] = f"Invalid: {e}"
    
    # Validate requirement
    try:
        if os.path.exists(REQUIREMENT_SCHEMA_PATH):
            requirement_schema = load_schema(REQUIREMENT_SCHEMA_PATH)
            jsonschema.validate(SAMPLE_REQUIREMENT, requirement_schema)
            results["requirement"] = "Valid"
        else:
            results["requirement"] = "Schema file not found"
    except jsonschema.exceptions.ValidationError as e:
        results["requirement"] = f"Invalid: {e}"
    
    return results

if __name__ == "__main__":
    results = validate_sample_data()
    for schema_name, result in results.items():
        print(f"{schema_name.capitalize()} schema validation: {result}")
