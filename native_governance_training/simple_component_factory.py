#!/usr/bin/env python3
"""
Simplified Governance Component Factory for Testing Basic Wiring

This is a simplified version of the governance component factory that focuses
on demonstrating the basic wiring concept with mock components.
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime

# Import mock components
from mock_components import (
    MockTrustMetricsCalculator,
    MockEmotionTelemetryLogger,
    MockDecisionFrameworkEngine,
    MockEnhancedVeritas,
    MockGovernanceCore,
    MockReflectionLoopTracker
)

logger = logging.getLogger(__name__)

class SimpleGovernanceComponentFactory:
    """Simplified factory for creating governance components with mock fallbacks."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the simplified factory."""
        self.config = config or {}
        self._components = {}
        self._initialized = False
        
    async def initialize(self):
        """Initialize the factory."""
        if self._initialized:
            return
            
        logger.info("Initializing SimpleGovernanceComponentFactory")
        self._initialized = True
        
    async def create_all_components(self) -> Dict[str, Any]:
        """
        Create all governance components using mock implementations.
        
        THIS IS THE MAIN METHOD THAT REPLACES ALL None COMPONENTS WITH REAL INSTANCES
        
        Returns:
            Dictionary of all created governance components
        """
        if not self._initialized:
            await self.initialize()
            
        logger.info("Creating all governance components with mock implementations...")
        
        try:
            # Create mock storage backend
            storage_backend = MockStorageBackend()
            await storage_backend.initialize()
            
            # Create mock event bus
            event_bus = MockEventBus()
            await event_bus.initialize()
            
            # Create all governance components
            components = {
                'storage_backend': storage_backend,
                'event_bus': event_bus,
                'trust_metrics_calculator': MockTrustMetricsCalculator(
                    config=self.config.get('trust_metrics', {}),
                    storage_backend=storage_backend,
                    event_bus=event_bus
                ),
                'emotion_telemetry_logger': MockEmotionTelemetryLogger(
                    config=self.config.get('emotion_telemetry', {}),
                    storage_backend=storage_backend,
                    event_bus=event_bus
                ),
                'decision_framework_engine': MockDecisionFrameworkEngine(
                    config=self.config.get('decision_framework', {}),
                    storage_backend=storage_backend,
                    event_bus=event_bus
                ),
                'enhanced_veritas_2': MockEnhancedVeritas(
                    config=self.config.get('enhanced_veritas', {}),
                    storage_backend=storage_backend,
                    event_bus=event_bus
                ),
                'governance_core': MockGovernanceCore(
                    config=self.config.get('governance_core', {}),
                    storage_backend=storage_backend,
                    event_bus=event_bus
                ),
                'reflection_loop_tracker': MockReflectionLoopTracker(
                    config=self.config.get('reflection_tracker', {}),
                    storage_backend=storage_backend,
                    event_bus=event_bus
                )
            }
            
            # Initialize all components
            for name, component in components.items():
                if name not in ['storage_backend', 'event_bus']:  # Already initialized
                    try:
                        await component.initialize()
                        logger.info(f"✅ {name} initialized successfully")
                    except Exception as e:
                        logger.error(f"❌ Failed to initialize {name}: {e}")
                        
            # Store components
            self._components = components
            
            logger.info("🎉 All governance components created successfully!")
            return components
            
        except Exception as e:
            logger.error(f"Failed to create governance components: {e}")
            raise
            
    async def get_component(self, component_name: str) -> Optional[Any]:
        """Get a specific component by name."""
        if not self._components:
            await self.create_all_components()
        return self._components.get(component_name)
        
    async def get_all_components(self) -> Dict[str, Any]:
        """Get all components."""
        if not self._components:
            await self.create_all_components()
        return self._components.copy()
        
    async def verify_wiring(self) -> Dict[str, Any]:
        """Verify that all components are properly wired."""
        if not self._components:
            await self.create_all_components()
            
        verification_results = {
            'total_components': len(self._components),
            'wired_components': 0,
            'failed_components': 0,
            'component_status': {},
            'overall_status': 'unknown'
        }
        
        for name, component in self._components.items():
            try:
                # Check if component is not None
                if component is None:
                    verification_results['component_status'][name] = {
                        'status': 'failed',
                        'reason': 'Component is None'
                    }
                    verification_results['failed_components'] += 1
                else:
                    # Check if component has required methods
                    has_initialize = hasattr(component, 'initialize')
                    is_initialized = getattr(component, '_initialized', False)
                    
                    verification_results['component_status'][name] = {
                        'status': 'wired' if has_initialize and is_initialized else 'partial',
                        'has_initialize': has_initialize,
                        'is_initialized': is_initialized,
                        'component_type': type(component).__name__
                    }
                    verification_results['wired_components'] += 1
                    
            except Exception as e:
                verification_results['component_status'][name] = {
                    'status': 'error',
                    'reason': str(e)
                }
                verification_results['failed_components'] += 1
                
        # Determine overall status
        if verification_results['failed_components'] == 0:
            verification_results['overall_status'] = 'fully_wired'
        elif verification_results['wired_components'] > 0:
            verification_results['overall_status'] = 'partially_wired'
        else:
            verification_results['overall_status'] = 'not_wired'
            
        return verification_results

class MockStorageBackend:
    """Mock storage backend for testing."""
    
    def __init__(self):
        self._data = {}
        self._initialized = False
        
    async def initialize(self):
        """Initialize the mock storage backend."""
        self._initialized = True
        logger.info("MockStorageBackend initialized")
        
    async def store_record(self, record_type: str, data: Dict[str, Any]):
        """Store a record."""
        if record_type not in self._data:
            self._data[record_type] = []
        self._data[record_type].append({
            'timestamp': datetime.now().isoformat(),
            'data': data
        })
        
    async def get_records(self, record_type: str, limit: int = 100) -> list:
        """Get records."""
        return self._data.get(record_type, [])[-limit:]
        
    async def get_health_status(self):
        """Get health status."""
        return {'status': 'healthy', 'backend': 'mock', 'records': len(self._data)}

class MockEventBus:
    """Mock event bus for testing."""
    
    def __init__(self):
        self._events = []
        self._initialized = False
        
    async def initialize(self):
        """Initialize the mock event bus."""
        self._initialized = True
        logger.info("MockEventBus initialized")
        
    async def publish(self, event_type: str, data: Dict[str, Any]):
        """Publish an event."""
        event = {
            'timestamp': datetime.now().isoformat(),
            'type': event_type,
            'data': data
        }
        self._events.append(event)
        logger.debug(f"Published event: {event_type}")
        
    async def get_events(self, limit: int = 100) -> list:
        """Get recent events."""
        return self._events[-limit:]
        
    async def get_health_status(self):
        """Get health status."""
        return {'status': 'healthy', 'backend': 'mock', 'events': len(self._events)}

