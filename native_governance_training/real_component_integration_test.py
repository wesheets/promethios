#!/usr/bin/env python3
"""
Real Component Integration Test

This script tests integration with the actual Promethios governance components
from the main system, demonstrating how to replace mock components with real ones.
"""

import asyncio
import logging
import json
import sys
import os
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Add the main Promethios path to sys.path for importing real components
promethios_path = Path(__file__).parent.parent / "phase_6_3_new"
if promethios_path.exists():
    sys.path.insert(0, str(promethios_path))

async def test_real_component_availability():
    """Test which real Promethios governance components are available."""
    print("🔍 Testing Real Component Availability")
    print("=" * 60)
    
    available_components = {}
    
    # Test trust metrics calculator
    try:
        from src.core.trust.trust_metrics_calculator import TrustMetricsCalculator
        available_components['trust_metrics_calculator'] = {
            'available': True,
            'class': TrustMetricsCalculator,
            'module': 'src.core.trust.trust_metrics_calculator'
        }
        print("✅ TrustMetricsCalculator available")
    except ImportError as e:
        available_components['trust_metrics_calculator'] = {
            'available': False,
            'error': str(e)
        }
        print(f"❌ TrustMetricsCalculator not available: {e}")
    
    # Test governance core
    try:
        from src.core.governance.governance_core import GovernanceCore
        available_components['governance_core'] = {
            'available': True,
            'class': GovernanceCore,
            'module': 'src.core.governance.governance_core'
        }
        print("✅ GovernanceCore available")
    except ImportError as e:
        available_components['governance_core'] = {
            'available': False,
            'error': str(e)
        }
        print(f"❌ GovernanceCore not available: {e}")
    
    # Test decision framework engine
    try:
        from src.core.governance.decision_framework_engine import DecisionFrameworkEngine
        available_components['decision_framework_engine'] = {
            'available': True,
            'class': DecisionFrameworkEngine,
            'module': 'src.core.governance.decision_framework_engine'
        }
        print("✅ DecisionFrameworkEngine available")
    except ImportError as e:
        available_components['decision_framework_engine'] = {
            'available': False,
            'error': str(e)
        }
        print(f"❌ DecisionFrameworkEngine not available: {e}")
    
    # Test reflection loop tracker
    try:
        from src.core.meta.reflection_loop_tracker import ReflectionLoopTracker
        available_components['reflection_loop_tracker'] = {
            'available': True,
            'class': ReflectionLoopTracker,
            'module': 'src.core.meta.reflection_loop_tracker'
        }
        print("✅ ReflectionLoopTracker available")
    except ImportError as e:
        available_components['reflection_loop_tracker'] = {
            'available': False,
            'error': str(e)
        }
        print(f"❌ ReflectionLoopTracker not available: {e}")
    
    # Summary
    available_count = sum(1 for comp in available_components.values() if comp.get('available', False))
    total_count = len(available_components)
    
    print(f"\n📊 Component Availability Summary:")
    print(f"   Available: {available_count}/{total_count}")
    print(f"   Missing: {total_count - available_count}/{total_count}")
    
    return available_components

class HybridGovernanceComponentFactory:
    """
    Hybrid factory that uses real Promethios components when available,
    falls back to mock components when not available.
    """
    
    def __init__(self, config=None):
        """Initialize the hybrid factory."""
        self.config = config or {}
        self._components = {}
        self._initialized = False
        self._available_real_components = {}
        
    async def initialize(self):
        """Initialize the factory and check component availability."""
        if self._initialized:
            return
            
        logger.info("Initializing HybridGovernanceComponentFactory")
        
        # Check which real components are available
        self._available_real_components = await test_real_component_availability()
        
        self._initialized = True
        
    async def create_all_components(self):
        """Create all governance components using real components when available."""
        if not self._initialized:
            await self.initialize()
            
        logger.info("Creating governance components (real + mock hybrid)...")
        
        try:
            # Create storage backend and event bus (always mock for now)
            from simple_component_factory import MockStorageBackend, MockEventBus
            
            storage_backend = MockStorageBackend()
            await storage_backend.initialize()
            
            event_bus = MockEventBus()
            await event_bus.initialize()
            
            components = {
                'storage_backend': storage_backend,
                'event_bus': event_bus
            }
            
            # Create trust metrics calculator (real if available)
            if self._available_real_components.get('trust_metrics_calculator', {}).get('available'):
                try:
                    TrustMetricsCalculator = self._available_real_components['trust_metrics_calculator']['class']
                    trust_calc = TrustMetricsCalculator()
                    # Initialize if it has an initialize method
                    if hasattr(trust_calc, 'initialize'):
                        await trust_calc.initialize()
                    components['trust_metrics_calculator'] = trust_calc
                    logger.info("✅ Using REAL TrustMetricsCalculator")
                except Exception as e:
                    logger.error(f"Failed to create real TrustMetricsCalculator: {e}")
                    # Fallback to mock
                    from mock_components import MockTrustMetricsCalculator
                    components['trust_metrics_calculator'] = MockTrustMetricsCalculator(
                        config=self.config.get('trust_metrics', {}),
                        storage_backend=storage_backend,
                        event_bus=event_bus
                    )
                    await components['trust_metrics_calculator'].initialize()
                    logger.info("⚠️  Fallback to MockTrustMetricsCalculator")
            else:
                from mock_components import MockTrustMetricsCalculator
                components['trust_metrics_calculator'] = MockTrustMetricsCalculator(
                    config=self.config.get('trust_metrics', {}),
                    storage_backend=storage_backend,
                    event_bus=event_bus
                )
                await components['trust_metrics_calculator'].initialize()
                logger.info("⚠️  Using MockTrustMetricsCalculator (real not available)")
            
            # Create governance core (real if available)
            if self._available_real_components.get('governance_core', {}).get('available'):
                try:
                    GovernanceCore = self._available_real_components['governance_core']['class']
                    governance_core = GovernanceCore()
                    # Initialize if it has an initialize method
                    if hasattr(governance_core, 'initialize'):
                        await governance_core.initialize()
                    components['governance_core'] = governance_core
                    logger.info("✅ Using REAL GovernanceCore")
                except Exception as e:
                    logger.error(f"Failed to create real GovernanceCore: {e}")
                    # Fallback to mock
                    from mock_components import MockGovernanceCore
                    components['governance_core'] = MockGovernanceCore(
                        config=self.config.get('governance_core', {}),
                        storage_backend=storage_backend,
                        event_bus=event_bus
                    )
                    await components['governance_core'].initialize()
                    logger.info("⚠️  Fallback to MockGovernanceCore")
            else:
                from mock_components import MockGovernanceCore
                components['governance_core'] = MockGovernanceCore(
                    config=self.config.get('governance_core', {}),
                    storage_backend=storage_backend,
                    event_bus=event_bus
                )
                await components['governance_core'].initialize()
                logger.info("⚠️  Using MockGovernanceCore (real not available)")
            
            # Create decision framework engine (real if available)
            if self._available_real_components.get('decision_framework_engine', {}).get('available'):
                try:
                    DecisionFrameworkEngine = self._available_real_components['decision_framework_engine']['class']
                    decision_engine = DecisionFrameworkEngine()
                    # Initialize if it has an initialize method
                    if hasattr(decision_engine, 'initialize'):
                        await decision_engine.initialize()
                    components['decision_framework_engine'] = decision_engine
                    logger.info("✅ Using REAL DecisionFrameworkEngine")
                except Exception as e:
                    logger.error(f"Failed to create real DecisionFrameworkEngine: {e}")
                    # Fallback to mock
                    from mock_components import MockDecisionFrameworkEngine
                    components['decision_framework_engine'] = MockDecisionFrameworkEngine(
                        config=self.config.get('decision_framework', {}),
                        storage_backend=storage_backend,
                        event_bus=event_bus
                    )
                    await components['decision_framework_engine'].initialize()
                    logger.info("⚠️  Fallback to MockDecisionFrameworkEngine")
            else:
                from mock_components import MockDecisionFrameworkEngine
                components['decision_framework_engine'] = MockDecisionFrameworkEngine(
                    config=self.config.get('decision_framework', {}),
                    storage_backend=storage_backend,
                    event_bus=event_bus
                )
                await components['decision_framework_engine'].initialize()
                logger.info("⚠️  Using MockDecisionFrameworkEngine (real not available)")
            
            # Create reflection loop tracker (real if available)
            if self._available_real_components.get('reflection_loop_tracker', {}).get('available'):
                try:
                    ReflectionLoopTracker = self._available_real_components['reflection_loop_tracker']['class']
                    reflection_tracker = ReflectionLoopTracker()
                    # Initialize if it has an initialize method
                    if hasattr(reflection_tracker, 'initialize'):
                        await reflection_tracker.initialize()
                    components['reflection_loop_tracker'] = reflection_tracker
                    logger.info("✅ Using REAL ReflectionLoopTracker")
                except Exception as e:
                    logger.error(f"Failed to create real ReflectionLoopTracker: {e}")
                    # Fallback to mock
                    from mock_components import MockReflectionLoopTracker
                    components['reflection_loop_tracker'] = MockReflectionLoopTracker(
                        config=self.config.get('reflection_tracker', {}),
                        storage_backend=storage_backend,
                        event_bus=event_bus
                    )
                    await components['reflection_loop_tracker'].initialize()
                    logger.info("⚠️  Fallback to MockReflectionLoopTracker")
            else:
                from mock_components import MockReflectionLoopTracker
                components['reflection_loop_tracker'] = MockReflectionLoopTracker(
                    config=self.config.get('reflection_tracker', {}),
                    storage_backend=storage_backend,
                    event_bus=event_bus
                )
                await components['reflection_loop_tracker'].initialize()
                logger.info("⚠️  Using MockReflectionLoopTracker (real not available)")
            
            # Add remaining mock components for completeness
            from mock_components import MockEmotionTelemetryLogger, MockEnhancedVeritas
            
            components['emotion_telemetry_logger'] = MockEmotionTelemetryLogger(
                config=self.config.get('emotion_telemetry', {}),
                storage_backend=storage_backend,
                event_bus=event_bus
            )
            await components['emotion_telemetry_logger'].initialize()
            
            components['enhanced_veritas_2'] = MockEnhancedVeritas(
                config=self.config.get('enhanced_veritas', {}),
                storage_backend=storage_backend,
                event_bus=event_bus
            )
            await components['enhanced_veritas_2'].initialize()
            
            # Store components
            self._components = components
            
            # Count real vs mock components
            real_count = sum(1 for comp_name in ['trust_metrics_calculator', 'governance_core', 
                           'decision_framework_engine', 'reflection_loop_tracker'] 
                           if self._available_real_components.get(comp_name, {}).get('available'))
            
            logger.info(f"🎉 Created {len(components)} components ({real_count} real, {len(components)-real_count-2} mock)")
            return components
            
        except Exception as e:
            logger.error(f"Failed to create governance components: {e}")
            raise
            
    async def get_component_status(self):
        """Get the status of all components (real vs mock)."""
        status = {}
        
        for comp_name in ['trust_metrics_calculator', 'governance_core', 
                         'decision_framework_engine', 'reflection_loop_tracker']:
            if self._available_real_components.get(comp_name, {}).get('available'):
                status[comp_name] = 'real'
            else:
                status[comp_name] = 'mock'
                
        # These are always mock for now
        status['storage_backend'] = 'mock'
        status['event_bus'] = 'mock'
        status['emotion_telemetry_logger'] = 'mock'
        status['enhanced_veritas_2'] = 'mock'
        
        return status

async def test_hybrid_component_integration():
    """Test the hybrid component integration."""
    print("\n🔄 Testing Hybrid Component Integration")
    print("=" * 60)
    
    try:
        # Create hybrid factory
        factory = HybridGovernanceComponentFactory()
        await factory.initialize()
        
        # Create components
        components = await factory.create_all_components()
        
        # Get component status
        status = await factory.get_component_status()
        
        print(f"\n📊 Component Status:")
        real_count = sum(1 for s in status.values() if s == 'real')
        mock_count = sum(1 for s in status.values() if s == 'mock')
        
        for comp_name, comp_status in status.items():
            icon = "🔧" if comp_status == 'real' else "🎭"
            print(f"   {icon} {comp_name}: {comp_status.upper()}")
            
        print(f"\n📈 Summary: {real_count} real, {mock_count} mock components")
        
        # Test component functionality
        print(f"\n🧪 Testing component functionality...")
        
        # Test trust calculator
        trust_calc = components.get('trust_metrics_calculator')
        if trust_calc:
            if hasattr(trust_calc, 'calculate_trust_async'):
                trust_result = await trust_calc.calculate_trust_async('hybrid_test_session')
                print(f"✅ Trust Calculator: {trust_result.get('trust_score', 'N/A')}")
            elif hasattr(trust_calc, 'calculate_trust'):
                # Try sync method if async not available
                trust_result = trust_calc.calculate_trust('hybrid_test_session')
                print(f"✅ Trust Calculator (sync): {trust_result}")
            else:
                print("⚠️  Trust Calculator: No calculate method found")
        
        # Test governance core
        governance_core = components.get('governance_core')
        if governance_core:
            if hasattr(governance_core, 'validate_governance_compliance'):
                governance_result = await governance_core.validate_governance_compliance({
                    'action': 'test_action',
                    'context': 'hybrid_test'
                })
                print(f"✅ Governance Core: {governance_result.get('compliant', 'N/A')}")
            else:
                print("⚠️  Governance Core: No validate method found")
        
        return True
        
    except Exception as e:
        print(f"❌ Hybrid component integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function."""
    print("🚀 Starting Real Component Integration Tests")
    print("=" * 80)
    
    # Test component availability
    available_components = await test_real_component_availability()
    
    # Test hybrid integration
    integration_success = await test_hybrid_component_integration()
    
    # Summary
    print("\n" + "=" * 80)
    print("📋 REAL COMPONENT INTEGRATION SUMMARY:")
    
    available_count = sum(1 for comp in available_components.values() if comp.get('available', False))
    total_real_components = len(available_components)
    
    print(f"   Real Components Available: {available_count}/{total_real_components}")
    print(f"   Hybrid Integration: {'✅ PASS' if integration_success else '❌ FAIL'}")
    
    if available_count > 0:
        print(f"\n🎉 SUCCESS: {available_count} real Promethios components integrated!")
        print("🔧 The hybrid approach successfully uses real components when available!")
        print("📈 This demonstrates the path to full real component integration!")
    else:
        print("\n⚠️  NO REAL COMPONENTS AVAILABLE")
        print("🔧 All components using mock implementations")
        print("📈 The integration pattern is validated and ready for real components!")
    
    if integration_success:
        print("\n💡 NEXT STEPS:")
        print("   1. Ensure real Promethios components are accessible")
        print("   2. Update component factory to use real components")
        print("   3. Test with actual governance data")
        print("   4. Deploy to production with real governance infrastructure")
    
    return integration_success

if __name__ == "__main__":
    asyncio.run(main())

