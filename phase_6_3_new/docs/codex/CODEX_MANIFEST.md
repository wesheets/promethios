# Resurrection Codex Manifest

## Overview

The Resurrection Codex serves as the definitive, living repository for the Promethios project, post-realignment. It will house all critical documentation, schemas, governance principles, architectural blueprints, and historical lineage necessary for the transparent and controlled evolution of the system.

## Directory Structure

*   **/ResurrectionCodex/**
    *   **00_Project_Constitution/**: Core principles, mission, ethical guidelines, and overarching governance philosophy.
        *   `README.md`: Overview of the project constitution.
        *   `Mission_Statement.md`: The core mission of Promethios.
        *   `Ethical_Framework.md`: Ethical guidelines and constraints.
        *   `Governance_Philosophy.md`: High-level approach to system governance.
    *   **01_Minimal_Governance_Core_MGC/**: All documentation, schemas, and design for the MGC.
        *   `README.md`: Overview of the MGC.
        *   `MGC_Architecture.md`: Detailed architectural design of the MGC.
        *   `MGC_Schema_Registry/`: Directory for all MGC-related schemas.
            *   `mgc_loop_control.schema.json`: Schema for MGC loop control structures.
            *   `mgc_memory_surface_interface.schema.json`: Schema for MGC interaction with memory surfaces.
            *   `operator_override.schema.v1.json`: Schema for operator override mechanisms (New in Phase 1.1).
            *   `mgc_emotion_telemetry.schema.json`: Schema for MGC internal emotion state model.
            *   `loop_justification_log.schema.v1.json`: Schema for MGC justification logs.
        *   `MGC_Contract_Definitions.md`: Definitions of contracts enforced by the MGC.
    *   **02_System_Architecture/**: Broader system architecture beyond the MGC (if any future components are envisioned).
        *   `README.md`: Overview of the extended system architecture.
    *   **03_Agent_Contracts_Legacy/**: Documentation of legacy agent contracts (for historical reference and DNA extraction).
        *   `README.md`: Overview of legacy agent contracts.
    *   **04_Schema_Evolution_Legacy/**: Documentation of legacy schema evolution (for historical reference).
        *   `README.md`: Overview of legacy schema evolution.
    *   **05_Historical_Lineage/**: Key findings and summaries from past phases (e.g., Phases 16-28 summary).
        *   `README.md`: Overview of historical lineage documents.
        *   `Phase_16_28_Key_Findings_Summary.md`: (Link to or copy of the existing summary).
    *   **06_Operational_Playbooks/**: Procedures for system operation, maintenance, and incident response.
        *   `README.md`: Overview of operational playbooks.
    *   **07_Validation_And_Testing/**: Strategies, plans, and reports for system validation and testing.
        *   `README.md`: Overview of validation and testing.
    *   **08_Decision_Log/**: A log of key architectural and governance decisions made during the resurrection.
        *   `README.md`: Overview of the decision log.
        *   `ADR_Template.md`: Template for Architecture Decision Records.
        *   `ADR-0001.md`: ADR for Monolithic Governance Kernel.
    *   **manifest.md**: This file, outlining the structure of the Resurrection Codex.



## Registered Schemas and Version Hashes (SHA256)

This section lists all officially registered schemas within the MGC Schema Registry and their corresponding version hashes for integrity verification.

*   **Path:** `/home/ubuntu/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/mgc_loop_control.schema.json`
    *   **Hash:** `7ee1fa433ced2136d150e113ae80bbffa0937f2e334fbd875b9ea29a818b29ac`
*   **Path:** `/home/ubuntu/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/mgc_memory_surface_interface.schema.json`
    *   **Hash:** `7a107772adf47a7edfa1c5b0dc240f4ec8b9904dec9a3c316d6fa5560e97fd6d`
*   **Path:** `/home/ubuntu/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/operator_override.schema.v1.json` (New in Phase 1.1)
    *   **Hash:** `cbb18b65992e03a68b2943bd958fbba430907a77cd30659b22e6404ccc4a1e66`
*   **Path:** `/home/ubuntu/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/mgc_emotion_telemetry.schema.json`
    *   **Hash:** `1a48e936c669c05845240a0da2dd67b8aeea8b687e1f311be1df354c0ccb7fcb`
*   **Path:** `/home/ubuntu/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/loop_justification_log.schema.v1.json` (Updated in Phase 1.1)
    *   **Hash:** `30cd4045ffff7d27668b8178ba0edfcb6ba8a5ec0df3e4e0c05a60afb6a6f26b`

