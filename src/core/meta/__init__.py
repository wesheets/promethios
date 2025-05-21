"""
Meta-Governance Framework for Promethios.

This module provides the initialization for the Meta-Governance Framework,
enabling reflective and adaptive governance over the Promethios system.
"""

import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# Export key components
from .meta_governance_manager import MetaGovernanceManager
from .reflection_loop_tracker import ReflectionLoopTracker
from .governance_state_monitor import GovernanceStateMonitor
from .policy_adaptation_engine import PolicyAdaptationEngine
from .compliance_verification_system import ComplianceVerificationSystem
from .recovery_trigger_system import RecoveryTriggerSystem

__all__ = [
    'MetaGovernanceManager',
    'ReflectionLoopTracker',
    'GovernanceStateMonitor',
    'PolicyAdaptationEngine',
    'ComplianceVerificationSystem',
    'RecoveryTriggerSystem'
]

logger.info("Meta-Governance Framework initialized")
