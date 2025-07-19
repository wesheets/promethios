#!/usr/bin/env python3
"""
Test Script for Simple Governance Component Wiring

This script tests the basic wiring functionality using the simplified component factory.
"""

import asyncio
import logging
import json
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

async def test_simple_wiring():
    """Test the simple governance component wiring."""
    print("🔍 Simple Governance Wiring Test Starting...")
    print("=" * 60)
    
    try:
        # Import the simplified factory
        from simple_component_factory import SimpleGovernanceComponentFactory
        print("✅ SimpleGovernanceComponentFactory imported successfully")
        
        # Create factory instance
        factory = SimpleGovernanceComponentFactory()
        print("✅ Factory instance created")
        
        # Initialize factory
        await factory.initialize()
        print("✅ Factory initialized")
        
        # Create all components
        print("\n🔧 Creating all governance components...")
        components = await factory.create_all_components()
        print(f"✅ Created {len(components)} components")
        
        # Verify wiring
        print("\n🔍 Verifying component wiring...")
        verification = await factory.verify_wiring()
        
        print(f"\n📊 Wiring Verification Results:")
        print(f"   Total Components: {verification['total_components']}")
        print(f"   Wired Components: {verification['wired_components']}")
        print(f"   Failed Components: {verification['failed_components']}")
        print(f"   Overall Status: {verification['overall_status']}")
        
        # Test individual components
        print("\n🧪 Testing individual components...")
        
        # Test trust metrics calculator
        trust_calc = await factory.get_component('trust_metrics_calculator')
        if trust_calc:
            trust_result = await trust_calc.calculate_trust_async('test_session_123')
            print(f"✅ Trust Calculator: {trust_result['trust_score']:.3f}")
        
        # Test emotion telemetry logger
        emotion_logger = await factory.get_component('emotion_telemetry_logger')
        if emotion_logger:
            emotion_result = await emotion_logger.log_emotion_state('test_session_123', {'text': 'test message'})
            print(f"✅ Emotion Logger: {emotion_result['emotional_state']}")
        
        # Test decision framework engine
        decision_engine = await factory.get_component('decision_framework_engine')
        if decision_engine:
            decision_result = await decision_engine.make_decision({'context': 'test decision'})
            print(f"✅ Decision Engine: {decision_result['strategy']} - {decision_result['approved']}")
        
        # Test enhanced veritas
        enhanced_veritas = await factory.get_component('enhanced_veritas_2')
        if enhanced_veritas:
            veritas_result = await enhanced_veritas.analyze_uncertainty('test query', {'context': 'test'})
            print(f"✅ Enhanced Veritas: uncertainty={veritas_result['overall_uncertainty']:.3f}")
        
        # Test governance core
        governance_core = await factory.get_component('governance_core')
        if governance_core:
            governance_result = await governance_core.validate_governance_compliance({'id': 'test_action'})
            print(f"✅ Governance Core: compliant={governance_result['compliant']}")
        
        # Test reflection loop tracker
        reflection_tracker = await factory.get_component('reflection_loop_tracker')
        if reflection_tracker:
            reflection_result = await reflection_tracker.track_reflection_cycle({'cycle': 'test'})
            print(f"✅ Reflection Tracker: efficiency={reflection_result['efficiency_score']:.3f}")
        
        # Test component communication
        print("\n🔗 Testing component communication...")
        storage = await factory.get_component('storage_backend')
        event_bus = await factory.get_component('event_bus')
        
        if storage and event_bus:
            # Test storage
            await storage.store_record('test_records', {'test': 'data'})
            records = await storage.get_records('test_records')
            print(f"✅ Storage: {len(records)} records stored")
            
            # Test event bus
            await event_bus.publish('test_event', {'test': 'event_data'})
            events = await event_bus.get_events()
            print(f"✅ Event Bus: {len(events)} events published")
        
        # Final status
        print("\n" + "=" * 60)
        if verification['overall_status'] == 'fully_wired':
            print("🎉 SUCCESS: All governance components are fully wired!")
            print("🔧 The governance system is ready for real component integration!")
            print("📈 This demonstrates that the wiring infrastructure works correctly!")
        elif verification['overall_status'] == 'partially_wired':
            print("⚠️  PARTIAL SUCCESS: Some components are wired")
            print("🔧 The basic wiring infrastructure is working")
        else:
            print("❌ FAILURE: Components are not properly wired")
            
        return verification['overall_status'] == 'fully_wired'
        
    except Exception as e:
        print(f"❌ WIRING TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_inference_wrapper_integration():
    """Test integration with the inference wrapper."""
    print("\n🔌 Testing Inference Wrapper Integration...")
    
    try:
        from simple_component_factory import SimpleGovernanceComponentFactory
        
        # Create factory and components
        factory = SimpleGovernanceComponentFactory()
        components = await factory.create_all_components()
        
        # Simulate inference wrapper integration
        print("✅ Simulating inference wrapper integration...")
        
        # Test the pattern that the inference wrapper would use
        trust_calc = components.get('trust_metrics_calculator')
        emotion_logger = components.get('emotion_telemetry_logger')
        
        if trust_calc and emotion_logger:
            # Simulate a governance-wrapped inference
            session_id = 'inference_test_session'
            
            # Pre-inference governance check
            trust_metrics = await trust_calc.calculate_trust_async(session_id)
            print(f"✅ Pre-inference trust score: {trust_metrics['trust_score']:.3f}")
            
            # Simulate inference happening here...
            inference_result = "This is a simulated AI response with governance."
            
            # Post-inference governance logging
            emotion_data = {'text': inference_result, 'confidence': 0.9}
            emotion_metrics = await emotion_logger.log_emotion_state(session_id, emotion_data)
            print(f"✅ Post-inference emotion state: {emotion_metrics['emotional_state']}")
            
            print("🎯 Inference wrapper integration pattern validated!")
            return True
        else:
            print("❌ Missing required components for inference integration")
            return False
            
    except Exception as e:
        print(f"❌ Inference wrapper integration test failed: {e}")
        return False

async def main():
    """Main test function."""
    print("🚀 Starting Comprehensive Governance Wiring Tests")
    print("=" * 80)
    
    # Test basic wiring
    basic_success = await test_simple_wiring()
    
    # Test inference wrapper integration
    integration_success = await test_inference_wrapper_integration()
    
    # Summary
    print("\n" + "=" * 80)
    print("📋 TEST SUMMARY:")
    print(f"   Basic Wiring: {'✅ PASS' if basic_success else '❌ FAIL'}")
    print(f"   Inference Integration: {'✅ PASS' if integration_success else '❌ FAIL'}")
    
    if basic_success and integration_success:
        print("\n🎉 ALL TESTS PASSED!")
        print("🔧 The governance wiring infrastructure is working correctly!")
        print("🚀 Ready to proceed with real component integration!")
    else:
        print("\n⚠️  SOME TESTS FAILED")
        print("🔧 Basic wiring infrastructure needs attention")
    
    return basic_success and integration_success

if __name__ == "__main__":
    asyncio.run(main())

