"""
Sample data for schema validation testing in the Governance Attestation Framework.
This module provides sample data instances for each schema to validate schema definitions.
"""

import json
import uuid
import datetime
from pathlib import Path

def generate_uuid(prefix):
    """Generate a UUID with the specified prefix."""
    return f"{prefix}-{uuid.uuid4()}"

def get_current_timestamp():
    """Get the current timestamp in ISO 8601 format."""
    return datetime.datetime.utcnow().isoformat() + "Z"

def get_future_timestamp(days=30):
    """Get a timestamp in the future in ISO 8601 format."""
    future = datetime.datetime.utcnow() + datetime.timedelta(days=days)
    return future.isoformat() + "Z"

# Sample Attestation Data
sample_attestation = {
    "attestation_id": generate_uuid("att"),
    "issuer_id": generate_uuid("auth"),
    "subject_id": "system-component-123",
    "claim_id": generate_uuid("claim"),
    "timestamp": get_current_timestamp(),
    "expiration": get_future_timestamp(90),
    "attestation_type": "VERIFICATION",
    "attestation_data": {
        "content": {
            "verification_result": "PASSED",
            "verification_score": 0.95,
            "verification_details": "All security checks passed"
        },
        "context": {
            "environment": "PRODUCTION",
            "verification_method": "AUTOMATED",
            "verification_tool": "SecurityScanner-v2.3"
        },
        "evidence_references": [
            "log-20250521-123456",
            "scan-result-20250521-789012"
        ],
        "contract_seal_reference": "seal-abcdef123456"
    },
    "signature": {
        "algorithm": "ED25519",
        "value": "base64-encoded-signature-value",
        "key_id": "key-12345"
    },
    "parent_attestation_id": None,
    "metadata": {
        "version": "1.0.0",
        "tags": ["security", "verification", "automated"],
        "revocation_status": "ACTIVE",
        "revocation_reason": None,
        "revocation_timestamp": None,
        "trust_score": 0.95
    }
}

# Sample Claim Data
sample_claim = {
    "claim_id": generate_uuid("claim"),
    "claim_type": "SECURITY",
    "subject_id": "system-component-123",
    "issuer_id": "organization-456",
    "timestamp": get_current_timestamp(),
    "claim_content": {
        "statement": "This component meets all security requirements for level 3 certification",
        "scope": {
            "domain": "security",
            "timeframe": {
                "start": get_current_timestamp(),
                "end": get_future_timestamp(365)
            },
            "components": ["auth-service", "data-processor", "api-gateway"]
        },
        "evidence_references": [
            {
                "evidence_id": "sec-audit-2025-001",
                "evidence_type": "AUDIT_REPORT",
                "location": "https://evidence-store/sec-audit-2025-001",
                "hash": "sha256-hash-of-evidence"
            },
            {
                "evidence_id": "pen-test-2025-003",
                "evidence_type": "TEST_RESULT",
                "location": "https://evidence-store/pen-test-2025-003",
                "hash": "sha256-hash-of-evidence"
            }
        ]
    },
    "verification_requirements": {
        "required_attestation_types": ["VERIFICATION", "CERTIFICATION"],
        "verification_threshold": 2,
        "required_authorities": ["auth-security-board", "auth-external-auditor"],
        "verification_rules": [
            {
                "rule_id": "rule-001",
                "rule_type": "AUTHORITY_DIVERSITY",
                "rule_parameters": {
                    "min_distinct_authorities": 2
                }
            }
        ]
    },
    "status": {
        "verification_status": "PENDING",
        "last_updated": get_current_timestamp(),
        "verification_details": {
            "attestation_count": 0,
            "verification_score": 0.0,
            "rejection_reason": None
        }
    },
    "metadata": {
        "version": "1.0.0",
        "tags": ["security", "certification", "level-3"],
        "priority": "HIGH",
        "related_claims": ["claim-previous-certification"]
    }
}

# Sample Audit Trail Event
sample_audit_trail = {
    "event_id": generate_uuid("audit"),
    "entity_id": "system-component-123",
    "event_type": "ATTESTATION_CREATED",
    "timestamp": get_current_timestamp(),
    "actor_id": "user-admin-789",
    "event_data": {
        "content": {
            "attestation_id": generate_uuid("att"),
            "attestation_type": "VERIFICATION",
            "result": "SUCCESS"
        },
        "context": {
            "environment": "PRODUCTION",
            "source_ip": "10.0.0.5",
            "user_agent": "AdminConsole/1.2.3"
        },
        "references": [
            {
                "reference_type": "ATTESTATION",
                "reference_id": generate_uuid("att")
            },
            {
                "reference_type": "CLAIM",
                "reference_id": generate_uuid("claim")
            }
        ],
        "result": {
            "status": "SUCCESS",
            "details": {
                "processing_time_ms": 235,
                "verification_steps": 5
            }
        }
    },
    "merkle_proof": {
        "root_hash": "merkle-root-hash-value",
        "path": [
            {
                "position": "LEFT",
                "hash": "hash-value-1"
            },
            {
                "position": "RIGHT",
                "hash": "hash-value-2"
            }
        ],
        "leaf_hash": "leaf-hash-value",
        "tree_size": 1024,
        "timestamp": get_current_timestamp()
    },
    "metadata": {
        "version": "1.0.0",
        "tags": ["attestation", "creation", "audit"],
        "severity": "INFO",
        "source": "attestation-service",
        "retention_period": "P7Y"
    }
}

# Sample Authority Data
sample_authority = {
    "authority_id": generate_uuid("auth"),
    "name": "Security Certification Board",
    "description": "Official authority for security certifications and attestations",
    "public_keys": [
        {
            "key_id": "key-12345",
            "algorithm": "ED25519",
            "key_data": "base64-encoded-public-key-data",
            "status": "ACTIVE",
            "created_at": get_current_timestamp(),
            "expires_at": get_future_timestamp(365)
        }
    ],
    "trust_level": {
        "level": "VERY_HIGH",
        "score": 0.92,
        "last_updated": get_current_timestamp(),
        "factors": [
            {
                "factor_name": "historical_accuracy",
                "factor_value": 0.95,
                "weight": 0.4
            },
            {
                "factor_name": "external_validation",
                "factor_value": 0.9,
                "weight": 0.3
            },
            {
                "factor_name": "community_trust",
                "factor_value": 0.88,
                "weight": 0.3
            }
        ]
    },
    "status": "ACTIVE",
    "registration_date": get_current_timestamp(),
    "capabilities": {
        "attestation_types": ["VERIFICATION", "CERTIFICATION", "AUDIT"],
        "domains": ["security", "compliance", "performance"],
        "delegation_capabilities": {
            "can_delegate": True,
            "delegation_constraints": [
                {
                    "constraint_type": "DOMAIN_RESTRICTION",
                    "constraint_value": "security"
                }
            ]
        }
    },
    "metadata": {
        "version": "1.0.0",
        "organization": "Global Security Alliance",
        "contact_information": {
            "email": "certifications@globalsecurity.org",
            "url": "https://globalsecurity.org/certifications"
        },
        "certification_references": [
            {
                "certification_type": "ISO27001",
                "certification_id": "ISO27001-2025-123456",
                "issuer": "International Standards Organization",
                "valid_until": get_future_timestamp(730)
            }
        ]
    }
}

def validate_schema(schema_file, data):
    """
    Validate data against a JSON schema.
    
    Args:
        schema_file: Path to the schema file
        data: Data to validate
        
    Returns:
        bool: True if validation succeeds, False otherwise
    """
    try:
        import jsonschema
        
        with open(schema_file, 'r') as f:
            schema = json.load(f)
        
        jsonschema.validate(instance=data, schema=schema)
        return True
    except Exception as e:
        print(f"Validation error: {e}")
        return False

def validate_all_schemas():
    """Validate all sample data against their respective schemas."""
    schemas_dir = Path(__file__).parent
    
    # Validate attestation schema
    attestation_valid = validate_schema(
        schemas_dir / "attestation.schema.v1.json", 
        sample_attestation
    )
    
    # Validate claim schema
    claim_valid = validate_schema(
        schemas_dir / "claim.schema.v1.json", 
        sample_claim
    )
    
    # Validate audit trail schema
    audit_trail_valid = validate_schema(
        schemas_dir / "audit_trail.schema.v1.json", 
        sample_audit_trail
    )
    
    # Validate authority schema
    authority_valid = validate_schema(
        schemas_dir / "authority.schema.v1.json", 
        sample_authority
    )
    
    results = {
        "attestation": attestation_valid,
        "claim": claim_valid,
        "audit_trail": audit_trail_valid,
        "authority": authority_valid
    }
    
    print("Schema validation results:")
    for schema_name, is_valid in results.items():
        status = "PASSED" if is_valid else "FAILED"
        print(f"  {schema_name}: {status}")
    
    return all(results.values())

if __name__ == "__main__":
    all_valid = validate_all_schemas()
    exit_code = 0 if all_valid else 1
    print(f"Overall validation: {'PASSED' if all_valid else 'FAILED'}")
    exit(exit_code)
