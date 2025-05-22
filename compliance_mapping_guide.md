# Promethios Phase 6.1 Compliance Mapping Guide

## Overview

This document provides a comprehensive guide to the compliance mapping framework implemented in Phase 6.1 of the Promethios project. It covers the mapping of API components to regulatory standards, implementation details, and usage guidelines.

## Supported Compliance Standards

The compliance mapping framework supports the following regulatory standards:

1. **SOC2** - Service Organization Control 2
2. **GDPR** - General Data Protection Regulation
3. **HIPAA** - Health Insurance Portability and Accountability Act
4. **ISO27001** - Information Security Management

## Compliance Mapping Architecture

The compliance mapping framework follows a hierarchical structure:

1. **Standards** - Top-level regulatory frameworks (e.g., SOC2, GDPR)
2. **Controls** - Specific requirements within each standard
3. **Mappings** - Connections between Promethios components and controls
4. **Evidence** - Documentation and implementation details supporting compliance

### Architecture Diagram

```
┌─────────────────────────────────────┐
│        Compliance Standards          │
│                                      │
│  ┌──────────┐  ┌──────────┐  ┌────┐ │
│  │   SOC2   │  │   GDPR   │  │... │ │
│  └──────────┘  └──────────┘  └────┘ │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│           Control Mappings           │
│                                      │
│  ┌──────────┐  ┌──────────┐  ┌────┐ │
│  │  CC7.1   │  │ Art. 32  │  │... │ │
│  └──────────┘  └──────────┘  └────┘ │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│         Component Mappings           │
│                                      │
│  ┌──────────┐  ┌──────────┐  ┌────┐ │
│  │   API    │  │  Schema  │  │... │ │
│  └──────────┘  └──────────┘  └────┘ │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│         Evidence Collection          │
└─────────────────────────────────────┘
```

## Implementation Details

The compliance mapping framework is implemented in `/src/compliance_mapping/framework.py`. It provides a comprehensive set of classes and methods for managing compliance mappings:

### ComplianceMappingFramework

The main class that manages all compliance mappings and provides methods for querying and reporting.

Key methods:
- `register_standard(standard_id, version, description)` - Register a compliance standard
- `register_control(standard_id, control_id, name, description)` - Register a control within a standard
- `register_mapping(standard_id, control_id, component, implementation, evidence)` - Register a mapping between a component and a control
- `get_mappings_for_standard(standard_id)` - Get all mappings for a standard
- `get_mappings_for_component(component)` - Get all mappings for a component
- `check_compliance(component, standard_id, control_id)` - Check compliance for a specific component and control
- `generate_compliance_report(standard_id)` - Generate a compliance report for a standard

### Standard

Represents a compliance standard such as SOC2 or GDPR.

Properties:
- `standard_id` - Unique identifier for the standard
- `version` - Version of the standard
- `description` - Description of the standard
- `controls` - Dictionary of controls within the standard

### Control

Represents a specific control within a compliance standard.

Properties:
- `control_id` - Unique identifier for the control
- `name` - Name of the control
- `description` - Description of the control
- `mappings` - List of component mappings for the control

### Mapping

Represents a mapping between a Promethios component and a compliance control.

Properties:
- `component` - Name of the Promethios component
- `implementation` - Description of how the component implements the control
- `evidence` - Evidence supporting compliance

## Standard-Specific Mappings

### SOC2 Mappings

SOC2 is organized around five Trust Services Criteria:
1. Security
2. Availability
3. Processing Integrity
4. Confidentiality
5. Privacy

Example SOC2 mapping:

```json
{
  "standard": "SOC2",
  "version": "2017",
  "controls": [
    {
      "control_id": "CC7.1",
      "name": "Authentication and Identification",
      "description": "The entity uses identification and authentication mechanisms to prevent unauthorized access to system components.",
      "mappings": [
        {
          "component": "API Authentication",
          "implementation": "JWT-based authentication with role-based access control",
          "evidence": "Authentication middleware in API routes"
        },
        {
          "component": "Schema Validation",
          "implementation": "Input validation for all API requests",
          "evidence": "Schema Validation Registry"
        }
      ]
    }
  ]
}
```

### GDPR Mappings

GDPR is organized around articles that define specific requirements for data protection.

Example GDPR mapping:

```json
{
  "standard": "GDPR",
  "version": "2016",
  "controls": [
    {
      "control_id": "Art. 32",
      "name": "Security of processing",
      "description": "The controller and the processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk.",
      "mappings": [
        {
          "component": "API Authentication",
          "implementation": "JWT-based authentication with role-based access control",
          "evidence": "Authentication middleware in API routes"
        },
        {
          "component": "Audit Logging",
          "implementation": "Comprehensive audit logging of all API operations",
          "evidence": "Audit API endpoints"
        }
      ]
    }
  ]
}
```

### HIPAA Mappings

HIPAA is organized around the Security Rule, which defines administrative, physical, and technical safeguards.

Example HIPAA mapping:

```json
{
  "standard": "HIPAA",
  "version": "2013",
  "controls": [
    {
      "control_id": "164.312(a)(1)",
      "name": "Access Control",
      "description": "Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to those persons or software programs that have been granted access rights.",
      "mappings": [
        {
          "component": "API Authentication",
          "implementation": "JWT-based authentication with role-based access control",
          "evidence": "Authentication middleware in API routes"
        },
        {
          "component": "Policy API",
          "implementation": "Granular access control policies",
          "evidence": "Policy API endpoints"
        }
      ]
    }
  ]
}
```

### ISO27001 Mappings

ISO27001 is organized around Annex A controls, which define specific requirements for information security management.

Example ISO27001 mapping:

```json
{
  "standard": "ISO27001",
  "version": "2013",
  "controls": [
    {
      "control_id": "A.9.2.1",
      "name": "User registration and de-registration",
      "description": "A formal user registration and de-registration process shall be implemented to enable assignment of access rights.",
      "mappings": [
        {
          "component": "API Authentication",
          "implementation": "JWT-based authentication with role-based access control",
          "evidence": "Authentication middleware in API routes"
        },
        {
          "component": "User Management API",
          "implementation": "User registration and de-registration endpoints",
          "evidence": "User API endpoints"
        }
      ]
    }
  ]
}
```

## Usage Examples

### Registering a Standard and Controls

```python
from src.compliance_mapping.framework import ComplianceMappingFramework

# Get singleton instance
framework = ComplianceMappingFramework.get_instance()

# Register SOC2 standard
framework.register_standard(
    standard_id="SOC2",
    version="2017",
    description="Service Organization Control 2"
)

# Register SOC2 control
framework.register_control(
    standard_id="SOC2",
    control_id="CC7.1",
    name="Authentication and Identification",
    description="The entity uses identification and authentication mechanisms to prevent unauthorized access to system components."
)

# Register mapping
framework.register_mapping(
    standard_id="SOC2",
    control_id="CC7.1",
    component="API Authentication",
    implementation="JWT-based authentication with role-based access control",
    evidence="Authentication middleware in API routes"
)
```

### Checking Compliance

```python
# Check compliance for a component
compliance_result = framework.check_compliance(
    component="API Authentication",
    standard_id="SOC2",
    control_id="CC7.1"
)

if compliance_result.is_compliant:
    print(f"Component is compliant with {compliance_result.standard_id} {compliance_result.control_id}")
    print(f"Implementation: {compliance_result.implementation}")
    print(f"Evidence: {compliance_result.evidence}")
else:
    print(f"Component is not compliant with {compliance_result.standard_id} {compliance_result.control_id}")
```

### Generating Compliance Reports

```python
# Generate compliance report for SOC2
report = framework.generate_compliance_report(standard_id="SOC2")

# Print report summary
print(f"Standard: {report.standard_id} {report.version}")
print(f"Total Controls: {len(report.controls)}")
print(f"Compliant Controls: {report.compliant_controls}")
print(f"Compliance Score: {report.compliance_score:.2f}")

# Export report to JSON
report.export_to_json("soc2_compliance_report.json")
```

## Integration with TheAgentCompany Benchmark

The compliance mapping framework integrates with TheAgentCompany benchmark to provide automated compliance testing:

```python
from src.integration.theagentcompany_integration import get_integration

# Get integration instance
integration = get_integration()

# Run compliance benchmark scenario
run_id = integration.run_scenario("scn-compliance-test")

# Get run results
result = integration.get_run_result(run_id)

# Check compliance results
compliance_results = result.get("results", {}).get("compliance", {})
compliance_score = compliance_results.get("score", 0)

print(f"Compliance Score: {compliance_score:.2f}")
```

## Conclusion

The compliance mapping framework provides a comprehensive solution for mapping Promethios API components to regulatory standards. It enables automated compliance testing, reporting, and evidence collection, ensuring that the Promethios governance system meets all regulatory requirements.
