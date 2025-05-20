#!/usr/bin/env python3
"""
Sample data generator and validator for Phase 5.9 Trust Decay Engine schemas.
This script generates sample data for each schema and validates it against the schema.
"""

import json
import jsonschema
import os
from datetime import datetime, timedelta
import uuid

# Constants
SCHEMAS_DIR = os.path.dirname(os.path.abspath(__file__))
CONTRACT_VERSION = "v2025.05.21"
PHASE_ID = "5.9"
CODEX_CLAUSES = ["5.9", "11.3", "11.7"]

def load_schema(schema_file):
    """Load a schema from file."""
    with open(os.path.join(SCHEMAS_DIR, schema_file), 'r') as f:
        return json.load(f)

def validate_data(data, schema):
    """Validate data against a schema."""
    try:
        jsonschema.validate(data, schema)
        return True, None
    except jsonschema.exceptions.ValidationError as e:
        return False, str(e)

def generate_codex_contract():
    """Generate a codex contract object."""
    return {
        "contract_version": CONTRACT_VERSION,
        "phase_id": PHASE_ID,
        "codex_clauses": CODEX_CLAUSES
    }

def generate_trust_decay_sample():
    """Generate sample data for trust decay schema."""
    return {
        "decay_type": "event",
        "timestamp": datetime.now().isoformat(),
        "entity_id": f"entity_{uuid.uuid4().hex[:8]}",
        "previous_trust": 0.8,
        "new_trust": 0.6,
        "decay_factor": 0.25,
        "details": {
            "event_type": "verification_failure",
            "source_context": "high_trust",
            "target_context": "medium_trust"
        },
        "codex_contract": generate_codex_contract()
    }

def generate_trust_regeneration_sample():
    """Generate sample data for trust regeneration schema."""
    return {
        "regeneration_type": "attestation",
        "timestamp": datetime.now().isoformat(),
        "entity_id": f"entity_{uuid.uuid4().hex[:8]}",
        "previous_trust": 0.4,
        "new_trust": 0.6,
        "regeneration_factor": 0.33,
        "details": {
            "attestation_type": "authority_attestation",
            "attestation_data": {
                "authority": "central_authority",
                "verification_id": uuid.uuid4().hex
            }
        },
        "codex_contract": generate_codex_contract()
    }

def generate_trust_metrics_sample():
    """Generate sample data for trust metrics schema."""
    now = datetime.now()
    history = []
    for i in range(10):
        timestamp = (now - timedelta(days=i)).isoformat()
        history.append({
            "timestamp": timestamp,
            "value": 0.5 + (i * 0.05)
        })
    
    return {
        "entity_id": f"entity_{uuid.uuid4().hex[:8]}",
        "timestamp": now.isoformat(),
        "metrics": {
            "aggregate": 0.75,
            "dimensions": {
                "verification": 0.8,
                "attestation": 0.7,
                "boundary": 0.6,
                "temporal": 0.9
            }
        },
        "history": {
            "aggregate": history,
            "dimensions": {
                "verification": history[:5],
                "attestation": history[3:8]
            }
        },
        "first_seen": (now - timedelta(days=30)).isoformat(),
        "codex_contract": generate_codex_contract()
    }

def generate_trust_monitoring_sample():
    """Generate sample data for trust monitoring schema."""
    return {
        "alert_id": uuid.uuid4().hex,
        "timestamp": datetime.now().isoformat(),
        "entity_id": f"entity_{uuid.uuid4().hex[:8]}",
        "level": "warning",
        "metric_type": "aggregate",
        "value": 0.35,
        "threshold": 0.4,
        "message": "Trust level has fallen below warning threshold",
        "resolved": False,
        "codex_contract": generate_codex_contract()
    }

def main():
    """Main function to generate and validate sample data."""
    # Define schema files and their sample data generators
    schema_samples = {
        "trust_decay.schema.v1.json": generate_trust_decay_sample,
        "trust_regeneration.schema.v1.json": generate_trust_regeneration_sample,
        "trust_metrics.schema.v1.json": generate_trust_metrics_sample,
        "trust_monitoring.schema.v1.json": generate_trust_monitoring_sample
    }
    
    all_valid = True
    
    # Generate and validate sample data for each schema
    for schema_file, sample_generator in schema_samples.items():
        print(f"\nTesting {schema_file}:")
        
        try:
            # Load schema
            schema = load_schema(schema_file)
            
            # Generate sample data
            sample_data = sample_generator()
            
            # Print sample data
            print(f"Sample data: {json.dumps(sample_data, indent=2)[:200]}...")
            
            # Validate sample data
            is_valid, error = validate_data(sample_data, schema)
            
            if is_valid:
                print(f"✓ Sample data is valid against {schema_file}")
            else:
                all_valid = False
                print(f"✗ Sample data is invalid against {schema_file}: {error}")
                
        except Exception as e:
            all_valid = False
            print(f"✗ Error processing {schema_file}: {str(e)}")
    
    print(f"\nOverall validation result: {'PASS' if all_valid else 'FAIL'}")
    return 0 if all_valid else 1

if __name__ == "__main__":
    exit(main())
