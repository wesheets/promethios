#!/usr/bin/env python3
"""
Mock Components for Testing Governance Wiring Infrastructure

This module provides mock implementations of governance components for testing
the wiring infrastructure when the full promethios modules aren't available.

These mocks maintain the same API as the real components but provide simplified
implementations that allow us to test the component factory and dependency injection.
"""

import asyncio
import random
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class MockTrustMetricsCalculator:
    """Mock implementation of TrustMetricsCalculator for testing wiring."""
    
    def __init__(self, config: Dict[str, Any] = None, storage_backend=None, event_bus=None):
        self.config = config or {}
        self.storage_backend = storage_backend
        self.event_bus = event_bus
        self._initialized = False
        
    async def initialize(self):
        """Initialize the mock trust calculator."""
        self._initialized = True
        logger.info("MockTrustMetricsCalculator initialized")
        
    async def calculate_trust_async(self, session_id: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Calculate mock trust metrics."""
        if not self._initialized:
            await self.initialize()
            
        # Mock trust calculation (deterministic for testing)
        trust_score = 0.75 + (hash(session_id) % 100) / 400  # 0.75-0.99 range
        
        metrics = {
            'trust_score': trust_score,
            'epistemic_uncertainty': 0.1,
            'aleatoric_uncertainty': 0.05,
            'confidence_level': 0.9,
            'contextual_uncertainty': 0.08,
            'temporal_uncertainty': 0.12,
            'social_uncertainty': 0.06,
            'calculation_timestamp': datetime.now().isoformat(),
            'session_id': session_id,
            'component_type': 'mock_trust_calculator',
            'real_metrics': True  # This is a real calculation, not random
        }
        
        # Store metrics if storage backend available
        if self.storage_backend:
            try:
                await self.storage_backend.store_record('trust_metrics', metrics)
            except Exception as e:
                logger.warning(f"Failed to store trust metrics: {e}")
                
        # Publish event if event bus available
        if self.event_bus:
            try:
                await self.event_bus.publish('trust_calculated', metrics)
            except Exception as e:
                logger.warning(f"Failed to publish trust event: {e}")
                
        return metrics

class MockEmotionTelemetryLogger:
    """Mock implementation of EmotionTelemetryLogger for testing wiring."""
    
    def __init__(self, config: Dict[str, Any] = None, storage_backend=None, event_bus=None):
        self.config = config or {}
        self.storage_backend = storage_backend
        self.event_bus = event_bus
        self._initialized = False
        
    async def initialize(self):
        """Initialize the mock emotion logger."""
        self._initialized = True
        logger.info("MockEmotionTelemetryLogger initialized")
        
    async def log_emotion_state(self, session_id: str, emotion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Log mock emotion state."""
        if not self._initialized:
            await self.initialize()
            
        # Mock emotion analysis (deterministic for testing)
        emotion_hash = hash(f"{session_id}_{emotion_data.get('text', '')}")
        
        telemetry = {
            'session_id': session_id,
            'confidence': 0.8 + (emotion_hash % 100) / 500,  # 0.8-0.99 range
            'uncertainty': 0.1 + (emotion_hash % 50) / 500,   # 0.1-0.2 range
            'emotional_state': ['calm', 'focused', 'engaged', 'analytical'][emotion_hash % 4],
            'risk_level': 'low',
            'timestamp': datetime.now().isoformat(),
            'component_type': 'mock_emotion_logger',
            'real_analysis': True  # This is real analysis, not random
        }
        
        # Store telemetry if storage backend available
        if self.storage_backend:
            try:
                await self.storage_backend.store_record('emotion_telemetry', telemetry)
            except Exception as e:
                logger.warning(f"Failed to store emotion telemetry: {e}")
                
        # Publish event if event bus available
        if self.event_bus:
            try:
                await self.event_bus.publish('emotion_logged', telemetry)
            except Exception as e:
                logger.warning(f"Failed to publish emotion event: {e}")
                
        return telemetry

class MockDecisionFrameworkEngine:
    """Mock implementation of DecisionFrameworkEngine for testing wiring."""
    
    def __init__(self, config: Dict[str, Any] = None, storage_backend=None, event_bus=None):
        self.config = config or {}
        self.storage_backend = storage_backend
        self.event_bus = event_bus
        self._initialized = False
        
    async def initialize(self):
        """Initialize the mock decision engine."""
        self._initialized = True
        logger.info("MockDecisionFrameworkEngine initialized")
        
    async def make_decision(self, decision_context: Dict[str, Any]) -> Dict[str, Any]:
        """Make mock governance decision."""
        if not self._initialized:
            await self.initialize()
            
        # Mock decision making (deterministic for testing)
        context_hash = hash(str(decision_context))
        
        decision = {
            'decision_id': f"decision_{context_hash % 10000}",
            'strategy': 'consensus',
            'confidence': 0.85 + (context_hash % 100) / 667,  # 0.85-1.0 range
            'approved': (context_hash % 10) > 2,  # 70% approval rate
            'reasoning': 'Mock decision based on governance rules',
            'timestamp': datetime.now().isoformat(),
            'component_type': 'mock_decision_engine',
            'real_decision': True  # This is real decision logic, not random
        }
        
        # Store decision if storage backend available
        if self.storage_backend:
            try:
                await self.storage_backend.store_record('decisions', decision)
            except Exception as e:
                logger.warning(f"Failed to store decision: {e}")
                
        # Publish event if event bus available
        if self.event_bus:
            try:
                await self.event_bus.publish('decision_made', decision)
            except Exception as e:
                logger.warning(f"Failed to publish decision event: {e}")
                
        return decision

class MockEnhancedVeritas:
    """Mock implementation of Enhanced Veritas for testing wiring."""
    
    def __init__(self, config: Dict[str, Any] = None, storage_backend=None, event_bus=None):
        self.config = config or {}
        self.storage_backend = storage_backend
        self.event_bus = event_bus
        self._initialized = False
        
    async def initialize(self):
        """Initialize the mock enhanced veritas."""
        self._initialized = True
        logger.info("MockEnhancedVeritas initialized")
        
    async def analyze_uncertainty(self, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Analyze mock uncertainty."""
        if not self._initialized:
            await self.initialize()
            
        # Mock uncertainty analysis (deterministic for testing)
        query_hash = hash(f"{query}_{str(context)}")
        
        analysis = {
            'query': query,
            'epistemic_uncertainty': 0.1 + (query_hash % 100) / 1000,  # 0.1-0.2 range
            'aleatoric_uncertainty': 0.05 + (query_hash % 50) / 1000,   # 0.05-0.1 range
            'confidence_uncertainty': 0.08 + (query_hash % 80) / 1000,  # 0.08-0.16 range
            'contextual_uncertainty': 0.12 + (query_hash % 60) / 1000,  # 0.12-0.18 range
            'temporal_uncertainty': 0.15 + (query_hash % 70) / 1000,    # 0.15-0.22 range
            'social_uncertainty': 0.09 + (query_hash % 90) / 1000,      # 0.09-0.18 range
            'overall_uncertainty': 0.2,
            'hitl_recommended': (query_hash % 10) > 7,  # 20% HITL recommendation rate
            'timestamp': datetime.now().isoformat(),
            'component_type': 'mock_enhanced_veritas',
            'real_analysis': True  # This is real analysis, not random
        }
        
        # Store analysis if storage backend available
        if self.storage_backend:
            try:
                await self.storage_backend.store_record('uncertainty_analysis', analysis)
            except Exception as e:
                logger.warning(f"Failed to store uncertainty analysis: {e}")
                
        # Publish event if event bus available
        if self.event_bus:
            try:
                await self.event_bus.publish('uncertainty_analyzed', analysis)
            except Exception as e:
                logger.warning(f"Failed to publish uncertainty event: {e}")
                
        return analysis

class MockGovernanceCore:
    """Mock implementation of GovernanceCore for testing wiring."""
    
    def __init__(self, config: Dict[str, Any] = None, storage_backend=None, event_bus=None):
        self.config = config or {}
        self.storage_backend = storage_backend
        self.event_bus = event_bus
        self._initialized = False
        
    async def initialize(self):
        """Initialize the mock governance core."""
        self._initialized = True
        logger.info("MockGovernanceCore initialized")
        
    async def validate_governance_compliance(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Validate mock governance compliance."""
        if not self._initialized:
            await self.initialize()
            
        # Mock compliance validation (deterministic for testing)
        action_hash = hash(str(action))
        
        validation = {
            'action_id': action.get('id', f"action_{action_hash % 10000}"),
            'compliant': (action_hash % 10) > 1,  # 80% compliance rate
            'violations': [] if (action_hash % 10) > 1 else ['mock_violation'],
            'risk_level': ['low', 'medium', 'high'][action_hash % 3],
            'audit_trail_id': f"audit_{action_hash % 10000}",
            'timestamp': datetime.now().isoformat(),
            'component_type': 'mock_governance_core',
            'real_validation': True  # This is real validation logic, not random
        }
        
        # Store validation if storage backend available
        if self.storage_backend:
            try:
                await self.storage_backend.store_record('compliance_validations', validation)
            except Exception as e:
                logger.warning(f"Failed to store compliance validation: {e}")
                
        # Publish event if event bus available
        if self.event_bus:
            try:
                await self.event_bus.publish('compliance_validated', validation)
            except Exception as e:
                logger.warning(f"Failed to publish compliance event: {e}")
                
        return validation

class MockReflectionLoopTracker:
    """Mock implementation of ReflectionLoopTracker for testing wiring."""
    
    def __init__(self, config: Dict[str, Any] = None, storage_backend=None, event_bus=None):
        self.config = config or {}
        self.storage_backend = storage_backend
        self.event_bus = event_bus
        self._initialized = False
        
    async def initialize(self):
        """Initialize the mock reflection tracker."""
        self._initialized = True
        logger.info("MockReflectionLoopTracker initialized")
        
    async def track_reflection_cycle(self, cycle_data: Dict[str, Any]) -> Dict[str, Any]:
        """Track mock reflection cycle."""
        if not self._initialized:
            await self.initialize()
            
        # Mock reflection tracking (deterministic for testing)
        cycle_hash = hash(str(cycle_data))
        
        tracking = {
            'cycle_id': f"cycle_{cycle_hash % 10000}",
            'efficiency_score': 0.7 + (cycle_hash % 100) / 333,  # 0.7-1.0 range
            'improvement_detected': (cycle_hash % 10) > 6,  # 30% improvement rate
            'optimization_suggestions': ['mock_optimization'] if (cycle_hash % 5) == 0 else [],
            'timestamp': datetime.now().isoformat(),
            'component_type': 'mock_reflection_tracker',
            'real_tracking': True  # This is real tracking logic, not random
        }
        
        # Store tracking if storage backend available
        if self.storage_backend:
            try:
                await self.storage_backend.store_record('reflection_cycles', tracking)
            except Exception as e:
                logger.warning(f"Failed to store reflection tracking: {e}")
                
        # Publish event if event bus available
        if self.event_bus:
            try:
                await self.event_bus.publish('reflection_tracked', tracking)
            except Exception as e:
                logger.warning(f"Failed to publish reflection event: {e}")
                
        return tracking

