"""
Benchmark scenario data for TheAgentCompany integration testing

This module provides sample benchmark scenarios for testing the Promethios API
with TheAgentCompany integration framework.
"""

import os
import json
from datetime import datetime

def create_benchmark_scenarios(output_dir):
    """
    Create benchmark scenarios for TheAgentCompany integration testing.
    
    Args:
        output_dir: Directory to save the scenario files
    """
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Basic API functionality scenario
    basic_scenario = {
        "scenario_id": "scn-basic-api-test",
        "name": "Basic API Functionality Test",
        "description": "Tests basic API functionality including memory, policy, and reflection endpoints",
        "version": "1.0.0",
        "steps": [
            {
                "id": "memory-get",
                "type": "api_call",
                "method": "GET",
                "endpoint": "/memory/records",
                "params": {"limit": 10},
                "context_key": "memory_list"
            },
            {
                "id": "memory-post",
                "type": "api_call",
                "method": "POST",
                "endpoint": "/memory/records",
                "body": {
                    "record_id": f"mem-test{int(datetime.now().timestamp())}",
                    "timestamp": datetime.now().isoformat(),
                    "source": "benchmark",
                    "record_type": "test",
                    "content": {"test": "data"},
                    "metadata": {
                        "priority": "medium",
                        "tags": ["test", "benchmark"]
                    }
                },
                "context_key": "memory_create"
            },
            {
                "id": "memory-get-by-id",
                "type": "api_call",
                "method": "GET",
                "endpoint": "/memory/records/{id}",
                "params": {"id": "{memory_create.record_id}"},
                "context_key": "memory_get"
            },
            {
                "id": "policy-get",
                "type": "api_call",
                "method": "GET",
                "endpoint": "/policy",
                "params": {"limit": 10},
                "context_key": "policy_list"
            },
            {
                "id": "reflection-get",
                "type": "api_call",
                "method": "GET",
                "endpoint": "/reflection/records",
                "params": {"limit": 10},
                "context_key": "reflection_list"
            }
        ],
        "compliance_checks": [
            {
                "id": "memory-schema-validation",
                "type": "response_field",
                "criteria": {
                    "context_key": "memory_create",
                    "field_path": "record_id"
                }
            },
            {
                "id": "memory-content-validation",
                "type": "response_field",
                "criteria": {
                    "context_key": "memory_create",
                    "field_path": "content"
                }
            },
            {
                "id": "memory-get-validation",
                "type": "response_field",
                "criteria": {
                    "context_key": "memory_get",
                    "field_path": "record_id"
                }
            }
        ],
        "performance_thresholds": {
            "excellent": 0.2,
            "good": 0.5,
            "acceptable": 1.0,
            "poor": 2.0
        }
    }
    
    # Security testing scenario
    security_scenario = {
        "scenario_id": "scn-security-test",
        "name": "Security Testing",
        "description": "Tests API security including authentication, input validation, and access control",
        "version": "1.0.0",
        "steps": [
            {
                "id": "unauthenticated-access",
                "type": "api_call",
                "method": "GET",
                "endpoint": "/policy",
                "headers": {"Authorization": "Bearer invalid"},
                "context_key": "unauthenticated_access"
            },
            {
                "id": "invalid-input",
                "type": "api_call",
                "method": "POST",
                "endpoint": "/memory/records",
                "body": {
                    # Missing required fields
                    "content": {"test": "data"}
                },
                "context_key": "invalid_input"
            },
            {
                "id": "sql-injection-attempt",
                "type": "api_call",
                "method": "GET",
                "endpoint": "/memory/records",
                "params": {"query": "'; DROP TABLE records; --"},
                "context_key": "sql_injection"
            }
        ],
        "security_checks": [
            {
                "id": "auth-required",
                "type": "authentication",
                "criteria": {
                    "context_key": "unauthenticated_access"
                }
            },
            {
                "id": "input-validation",
                "type": "input_validation",
                "criteria": {
                    "context_key": "invalid_input"
                }
            },
            {
                "id": "sql-injection-protection",
                "type": "response_field",
                "criteria": {
                    "context_key": "sql_injection",
                    "field_path": "status_code",
                    "expected_value": 400
                }
            }
        ]
    }
    
    # Compliance testing scenario
    compliance_scenario = {
        "scenario_id": "scn-compliance-test",
        "name": "Compliance Testing",
        "description": "Tests API compliance with regulatory requirements",
        "version": "1.0.0",
        "steps": [
            {
                "id": "get-compliance-mappings",
                "type": "api_call",
                "method": "GET",
                "endpoint": "/compliance/mappings",
                "context_key": "compliance_mappings"
            },
            {
                "id": "get-soc2-compliance",
                "type": "api_call",
                "method": "GET",
                "endpoint": "/compliance/mappings/SOC2",
                "context_key": "soc2_compliance"
            },
            {
                "id": "get-gdpr-compliance",
                "type": "api_call",
                "method": "GET",
                "endpoint": "/compliance/mappings/GDPR",
                "context_key": "gdpr_compliance"
            },
            {
                "id": "get-hipaa-compliance",
                "type": "api_call",
                "method": "GET",
                "endpoint": "/compliance/mappings/HIPAA",
                "context_key": "hipaa_compliance"
            }
        ],
        "compliance_checks": [
            {
                "id": "soc2-mapping-exists",
                "type": "response_field",
                "criteria": {
                    "context_key": "soc2_compliance",
                    "field_path": "standard"
                }
            },
            {
                "id": "gdpr-mapping-exists",
                "type": "response_field",
                "criteria": {
                    "context_key": "gdpr_compliance",
                    "field_path": "standard"
                }
            },
            {
                "id": "hipaa-mapping-exists",
                "type": "response_field",
                "criteria": {
                    "context_key": "hipaa_compliance",
                    "field_path": "standard"
                }
            }
        ]
    }
    
    # Performance testing scenario
    performance_scenario = {
        "scenario_id": "scn-performance-test",
        "name": "Performance Testing",
        "description": "Tests API performance under various load conditions",
        "version": "1.0.0",
        "steps": [
            # Repeat memory GET operation 10 times to measure performance
            *[{
                "id": f"memory-get-{i}",
                "type": "api_call",
                "method": "GET",
                "endpoint": "/memory/records",
                "params": {"limit": 10},
                "context_key": f"memory_list_{i}"
            } for i in range(10)],
            
            # Repeat policy GET operation 10 times to measure performance
            *[{
                "id": f"policy-get-{i}",
                "type": "api_call",
                "method": "GET",
                "endpoint": "/policy",
                "params": {"limit": 10},
                "context_key": f"policy_list_{i}"
            } for i in range(10)]
        ],
        "performance_thresholds": {
            "excellent": 0.1,
            "good": 0.3,
            "acceptable": 0.5,
            "poor": 1.0
        }
    }
    
    # Write scenarios to files
    scenarios = [
        basic_scenario,
        security_scenario,
        compliance_scenario,
        performance_scenario
    ]
    
    for scenario in scenarios:
        filename = f"{scenario['scenario_id']}.json"
        filepath = os.path.join(output_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(scenario, f, indent=2)
        
        print(f"Created benchmark scenario: {filepath}")

if __name__ == "__main__":
    # Create benchmark scenarios in the data directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "..", "..", "data", "benchmark_scenarios")
    create_benchmark_scenarios(data_dir)
