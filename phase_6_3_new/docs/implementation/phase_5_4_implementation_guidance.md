# Phase 5.4 Implementation Guidance for Builder Manus

## Codex Contract Reference
- **Contract Version:** v2025.05.18
- **Phase ID:** 5.4
- **Title:** Distributed Verification Network
- **Description:** Implement a distributed network for verifying Merkle seals and execution logs across multiple nodes
- **Clauses:** 5.4, 11.0, 5.2.5
- **Schema Registry:** 
  - verification_node.schema.v1.json
  - consensus_record.schema.v1.json
  - network_topology.schema.v1.json

## Repository Structure Lock

As per Codex clause 5.2.5 "Codex Repository Hygiene Freeze", Phase 5.4 shall execute under the current repository structure. Directory normalization is postponed until the reorganization unlock clause is codified.

## Implementation Requirements

This document provides detailed guidance for implementing Phase 5.4 of the Promethios roadmap. The implementation must adhere to the Codex Contract Tethering Protocol and maintain strict governance integrity.

### Core Components to Implement

1. **Verification Node Manager**
   - Create a VerificationNodeManager class for managing verification nodes
   - Implement node registration, discovery, and status management
   - Ensure proper schema validation against verification_node.schema.v1.json

2. **Consensus Service**
   - Create a ConsensusService class for managing consensus formation
   - Implement quorum-based consensus with Byzantine fault tolerance
   - Ensure proper schema validation against consensus_record.schema.v1.json

3. **Seal Distribution Service**
   - Create a SealDistributionService class for distributing Merkle seals
   - Implement prioritization and bandwidth optimization
   - Ensure efficient distribution to verification nodes

4. **Network Topology Manager**
   - Create a NetworkTopologyManager class for managing network topology
   - Implement dynamic topology management and optimization
   - Ensure proper schema validation against network_topology.schema.v1.json

5. **Trust Aggregation Service**
   - Create a TrustAggregationService class for aggregating verification results
   - Implement trust score calculation based on consensus
   - Ensure proper integration with the Trust Log UI

6. **Runtime Executor Integration**
   - Integrate all components with the existing runtime_executor.py
   - Implement API endpoints for UI access
   - Ensure proper Codex contract tethering

### Implementation Steps

1. **Create Core Files**
   - verification_node_manager.py - Verification node management
   - consensus_service.py - Consensus formation and management
   - seal_distribution_service.py - Seal distribution to nodes
   - network_topology_manager.py - Network topology management
   - trust_aggregation_service.py - Trust score aggregation

2. **Update Existing Files**
   - runtime_executor.py - Integrate distributed verification
   - trust_log_writer.py - Add support for verification results

3. **Create Test Files**
   - test_verification_node_manager.py - Test node management
   - test_consensus_service.py - Test consensus formation
   - test_seal_distribution_service.py - Test seal distribution
   - test_network_topology_manager.py - Test topology management
   - test_trust_aggregation_service.py - Test trust aggregation
   - test_phase_5_4.py - End-to-end tests for Phase 5.4

4. **Update UI Components**
   - Add VerificationNetworkViewer.js to promethios_ui_surface
   - Add ConsensusRecordViewer.js to promethios_ui_surface
   - Update TrustLogUI.js to include new components

### Schema Validation Requirements

All data structures must be validated against their respective schemas:

1. **Verification Node Schema**
   - Validate all nodes against verification_node.schema.v1.json
   - Ensure all required fields are present and correctly formatted
   - Verify that codex_clauses are correctly specified

2. **Consensus Record Schema**
   - Validate all consensus records against consensus_record.schema.v1.json
   - Ensure all required fields are present and correctly formatted
   - Verify that codex_clauses are correctly specified

3. **Network Topology Schema**
   - Validate all network topologies against network_topology.schema.v1.json
   - Ensure all required fields are present and correctly formatted
   - Verify that codex_clauses are correctly specified

### Codex Compliance Requirements

All implementation must adhere to the Codex Contract Tethering Protocol:

1. **Contract References**
   - Include explicit contract version and phase ID references in all files
   - Example: `# This component implements Phase 5.4 of the Promethios roadmap.`
   - Example: `# Codex Contract: v2025.05.18`

2. **Clause Binding**
   - Bind all functionality to specific Codex clauses
   - Example: `# Clauses: 5.4, 11.0, 5.2.5`

3. **Pre-Loop Tether Checks**
   - Implement pre_loop_tether_check() in all entry points
   - Verify contract version and phase ID
   - Validate against schemas

4. **Repository Structure**
   - Respect clause 5.2.5, maintaining the current repository structure
   - Do not reorganize directories or move existing files

## Testing Requirements

Implement comprehensive tests for all components:

1. **Unit Tests**
   - Test each component in isolation
   - Verify correct behavior for all methods
   - Test edge cases and error handling

2. **Integration Tests**
   - Test the integration of all components
   - Verify correct data flow between components
   - Test end-to-end functionality

3. **Schema Validation Tests**
   - Test validation against schemas
   - Verify rejection of invalid data
   - Test all required fields and constraints

## Deliverables

The following deliverables are expected:

1. **Core Implementation Files**
   - verification_node_manager.py
   - consensus_service.py
   - seal_distribution_service.py
   - network_topology_manager.py
   - trust_aggregation_service.py
   - Updated runtime_executor.py

2. **Test Files**
   - test_verification_node_manager.py
   - test_consensus_service.py
   - test_seal_distribution_service.py
   - test_network_topology_manager.py
   - test_trust_aggregation_service.py
   - test_phase_5_4.py

3. **UI Components**
   - VerificationNetworkViewer.js
   - ConsensusRecordViewer.js
   - Updated TrustLogUI.js

4. **Documentation**
   - Phase_5_4_Completion_Report.md
   - Updated README.md sections for Phase 5.4

## Implementation Timeline

1. **Week 1: Core Components**
   - Implement VerificationNodeManager and NetworkTopologyManager
   - Create ConsensusService and SealDistributionService
   - Write unit tests for all components

2. **Week 2: Integration**
   - Implement TrustAggregationService
   - Integrate with runtime_executor.py
   - Create API endpoints for UI access

3. **Week 3: UI and Testing**
   - Implement UI components for verification network visualization
   - Write integration and end-to-end tests
   - Document the implementation

## Final Notes

This implementation is critical for establishing a distributed verification network in the Promethios kernel. It sets the foundation for future phases while maintaining strict governance integrity.

Remember to adhere to the Codex Contract Tethering Protocol at all times and ensure that all components are properly validated against their schemas. Most importantly, maintain the current repository structure as required by clause 5.2.5 until the reorganization unlock clause is codified.
