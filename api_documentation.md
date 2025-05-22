# Promethios Phase 6.1 API Documentation

## Overview

This document provides comprehensive documentation for the Promethios Phase 6.1 API, including formal API specifications, schema validation, compliance mapping, and integration with TheAgentCompany benchmark framework.

## API Specifications

The Promethios API is formally specified using multiple specification formats to support a wide range of client implementations:

1. **OpenAPI (Swagger)** - REST API specification
2. **GraphQL** - Query language specification
3. **Protocol Buffers** - Binary serialization specification
4. **JSON Schema** - Data model specification

All specifications are available in the `/docs/api/` directory.

## Core Components

### Schema Validation Registry

The Schema Validation Registry provides centralized schema management and validation for all API requests and responses. It supports:

- Schema registration and versioning
- Runtime validation of API payloads
- Schema evolution tracking
- Programmatic access to schemas

### API Routes

The API is organized into the following route groups:

- **Memory API** - Endpoints for managing memory records
- **Policy API** - Endpoints for managing governance policies
- **Reflection API** - Endpoints for managing reflection records
- **Loop API** - Endpoints for managing governance loops
- **Trust API** - Endpoints for managing trust relationships
- **Override API** - Endpoints for managing governance overrides
- **Audit API** - Endpoints for accessing audit records

### Compliance Mapping Framework

The Compliance Mapping Framework maps API components to regulatory controls for the following standards:

- **SOC2** - Service Organization Control 2
- **GDPR** - General Data Protection Regulation
- **HIPAA** - Health Insurance Portability and Accountability Act
- **ISO27001** - Information Security Management

### TheAgentCompany Integration

The TheAgentCompany integration provides benchmark testing capabilities for the API, including:

- Benchmark scenario management
- Metrics collection and analysis
- Compliance result analysis
- Performance testing

## API Reference

### Memory API

#### GET /memory/records

Retrieves a list of memory records.

**Parameters:**
- `limit` (optional): Maximum number of records to return
- `offset` (optional): Number of records to skip
- `query` (optional): Query string to filter records

**Response:**
```json
{
  "items": [
    {
      "record_id": "string",
      "timestamp": "string",
      "source": "string",
      "record_type": "string",
      "content": {},
      "metadata": {}
    }
  ],
  "total": 0,
  "limit": 0,
  "offset": 0
}
```

#### POST /memory/records

Creates a new memory record.

**Request Body:**
```json
{
  "record_id": "string",
  "timestamp": "string",
  "source": "string",
  "record_type": "string",
  "content": {},
  "metadata": {}
}
```

**Response:**
```json
{
  "record_id": "string",
  "timestamp": "string",
  "source": "string",
  "record_type": "string",
  "content": {},
  "metadata": {}
}
```

#### GET /memory/records/{id}

Retrieves a specific memory record by ID.

**Parameters:**
- `id`: Record ID

**Response:**
```json
{
  "record_id": "string",
  "timestamp": "string",
  "source": "string",
  "record_type": "string",
  "content": {},
  "metadata": {}
}
```

### Policy API

#### GET /policy

Retrieves a list of governance policies.

**Parameters:**
- `limit` (optional): Maximum number of policies to return
- `offset` (optional): Number of policies to skip
- `domain` (optional): Filter by policy domain

**Response:**
```json
{
  "items": [
    {
      "policy_id": "string",
      "name": "string",
      "description": "string",
      "domain": "string",
      "version": "string",
      "rules": [],
      "metadata": {}
    }
  ],
  "total": 0,
  "limit": 0,
  "offset": 0
}
```

#### POST /policy

Creates a new governance policy.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "domain": "string",
  "rules": [],
  "metadata": {}
}
```

**Response:**
```json
{
  "policy_id": "string",
  "name": "string",
  "description": "string",
  "domain": "string",
  "version": "string",
  "rules": [],
  "metadata": {}
}
```

### Reflection API

#### GET /reflection/records

Retrieves a list of reflection records.

**Parameters:**
- `limit` (optional): Maximum number of records to return
- `offset` (optional): Number of records to skip
- `type` (optional): Filter by reflection type

**Response:**
```json
{
  "items": [
    {
      "reflection_id": "string",
      "timestamp": "string",
      "type": "string",
      "content": {},
      "metadata": {}
    }
  ],
  "total": 0,
  "limit": 0,
  "offset": 0
}
```

#### POST /reflection/records

Creates a new reflection record.

**Request Body:**
```json
{
  "type": "string",
  "content": {},
  "metadata": {}
}
```

**Response:**
```json
{
  "reflection_id": "string",
  "timestamp": "string",
  "type": "string",
  "content": {},
  "metadata": {}
}
```

### Override API

#### GET /override/requests

Retrieves a list of override requests.

**Parameters:**
- `limit` (optional): Maximum number of requests to return
- `offset` (optional): Number of requests to skip
- `status` (optional): Filter by request status

**Response:**
```json
{
  "items": [
    {
      "request_id": "string",
      "timestamp": "string",
      "requester": "string",
      "policy_id": "string",
      "rule_id": "string",
      "justification": "string",
      "status": "string",
      "metadata": {}
    }
  ],
  "total": 0,
  "limit": 0,
  "offset": 0
}
```

#### POST /override/requests

Creates a new override request.

**Request Body:**
```json
{
  "requester": "string",
  "policy_id": "string",
  "rule_id": "string",
  "justification": "string",
  "metadata": {}
}
```

**Response:**
```json
{
  "request_id": "string",
  "timestamp": "string",
  "requester": "string",
  "policy_id": "string",
  "rule_id": "string",
  "justification": "string",
  "status": "pending",
  "metadata": {}
}
```

### Compliance API

#### GET /compliance/mappings

Retrieves a list of compliance mappings.

**Parameters:**
- `standard` (optional): Filter by compliance standard

**Response:**
```json
{
  "items": [
    {
      "standard": "string",
      "version": "string",
      "controls": [
        {
          "control_id": "string",
          "name": "string",
          "description": "string",
          "mappings": [
            {
              "component": "string",
              "implementation": "string",
              "evidence": "string"
            }
          ]
        }
      ]
    }
  ]
}
```

#### GET /compliance/mappings/{standard}

Retrieves compliance mappings for a specific standard.

**Parameters:**
- `standard`: Compliance standard (e.g., SOC2, GDPR)

**Response:**
```json
{
  "standard": "string",
  "version": "string",
  "controls": [
    {
      "control_id": "string",
      "name": "string",
      "description": "string",
      "mappings": [
        {
          "component": "string",
          "implementation": "string",
          "evidence": "string"
        }
      ]
    }
  ]
}
```

## Schema Validation

All API requests and responses are validated against JSON schemas defined in the `/docs/schemas/` directory. The Schema Validation Registry provides runtime validation of API payloads.

### Example Schema: Memory Record

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Memory Record",
  "description": "A memory record in the Promethios governance system",
  "type": "object",
  "required": ["record_id", "timestamp", "content"],
  "properties": {
    "record_id": {
      "type": "string",
      "description": "Unique identifier for the memory record",
      "pattern": "^mem-[a-zA-Z0-9]{8,}$"
    },
    "timestamp": {
      "type": "string",
      "description": "ISO 8601 timestamp of when the record was created",
      "format": "date-time"
    },
    "source": {
      "type": "string",
      "description": "Source of the memory record"
    },
    "record_type": {
      "type": "string",
      "description": "Type of memory record"
    },
    "content": {
      "type": "object",
      "description": "Content of the memory record"
    },
    "metadata": {
      "type": "object",
      "description": "Metadata associated with the memory record"
    }
  }
}
```

## Compliance Mapping

The Compliance Mapping Framework maps API components to regulatory controls for SOC2, GDPR, HIPAA, and ISO27001. Each mapping includes:

- Control ID and name
- Component implementation details
- Evidence of compliance

### Example Compliance Mapping: SOC2

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

## TheAgentCompany Integration

The TheAgentCompany integration provides benchmark testing capabilities for the API. It includes:

- Benchmark scenario management
- Metrics collection and analysis
- Compliance result analysis
- Performance testing

### Benchmark Scenarios

Benchmark scenarios are defined in JSON files and include:

- API calls to test
- Compliance checks to perform
- Performance thresholds
- Security checks

### Example Benchmark Scenario

```json
{
  "scenario_id": "scn-basic-api-test",
  "name": "Basic API Functionality Test",
  "description": "Tests basic API functionality including memory, policy, and reflection endpoints",
  "steps": [
    {
      "id": "memory-get",
      "type": "api_call",
      "method": "GET",
      "endpoint": "/memory/records",
      "params": {"limit": 10},
      "context_key": "memory_list"
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
    }
  ]
}
```

## Integration Test Results

The integration testing of Promethios Phase 6.1 API with TheAgentCompany benchmark has been successfully completed with an overall score of **0.91**.

For detailed integration test results, see the [Integration Test Report](integration_test_report.md).

## Conclusion

The Promethios Phase 6.1 API provides formal API specifications, comprehensive schema validation, robust compliance mapping, and integration with TheAgentCompany benchmark framework. The API is well-documented, thoroughly tested, and ready for use by API consumers.
