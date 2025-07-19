#!/usr/bin/env python3
import asyncio
import sys

async def simple_wiring_test():
    print("🔍 Simple Wiring Test Starting...")
    
    try:
        # Test 1: Import test
        print("📦 Testing imports...")
        from governance_component_factory import GovernanceComponentFactory
        print("✅ GovernanceComponentFactory imported successfully")
        
        # Test 2: Component creation (no separate initialize needed)
        print("🔧 Testing component creation...")
        factory = GovernanceComponentFactory()
        components = await factory.create_all_components()
        print(f"✅ Created {len(components)} components")
        
        # Test 4: Check for None components
        none_components = [name for name, comp in components.items() if comp is None]
        real_components = [name for name, comp in components.items() if comp is not None]
        
        print(f"📊 Real components: {len(real_components)}")
        print(f"❌ None components: {len(none_components)}")
        
        if len(none_components) > 0:
            print(f"⚠️  None components found: {none_components}")
        
        # Test 5: Basic inference wrapper test
        print("🎯 Testing inference wrapper...")
        from promethios_governance_inference_wrapper import PrometheosGovernanceMonitor
        
        config = {'test': True}
        wrapper = PrometheosGovernanceMonitor(config)
        print("✅ Inference wrapper created successfully")
        
        # Overall status
        if len(none_components) == 0:
            print("🎉 WIRING TEST PASSED - All components are real!")
            return True
        else:
            print("⚠️  WIRING TEST PARTIAL - Some components are None")
            return False
            
    except Exception as e:
        print(f"❌ WIRING TEST FAILED: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(simple_wiring_test())
    sys.exit(0 if result else 1)
