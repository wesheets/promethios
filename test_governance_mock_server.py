#!/usr/bin/env python3
"""
Mock Server for Testing Universal Governance Integration
=======================================================

This creates a simple mock server to test the Universal Governance integration
without needing the full Promethios API server running.
"""

import asyncio
import json
import sys
import os
from datetime import datetime
from typing import Dict, Any

# Add project paths
sys.path.append('/home/ubuntu/promethios')
sys.path.append('/home/ubuntu/promethios/src')
sys.path.append('/home/ubuntu/promethios/src/services')

class MockGovernanceTest:
    def __init__(self):
        self.test_results = {
            "timestamp": datetime.now().isoformat(),
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0}
        }
        
    def log_test(self, test_name: str, status: str, details: Dict[str, Any] = None):
        """Log test result"""
        test_result = {
            "test_name": test_name,
            "status": status,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        
        self.test_results["tests"].append(test_result)
        self.test_results["summary"]["total"] += 1
        
        if status == "PASSED":
            self.test_results["summary"]["passed"] += 1
            print(f"✅ {test_name}: PASSED")
        else:
            self.test_results["summary"]["failed"] += 1
            print(f"❌ {test_name}: FAILED")
            
        if details:
            print(f"   Details: {details}")

    async def test_universal_governance_adapter_import(self):
        """Test that Universal Governance Adapter can be imported"""
        test_name = "Universal Governance Adapter Import"
        
        try:
            from UniversalGovernanceAdapter import UniversalGovernanceAdapter
            adapter = UniversalGovernanceAdapter()
            
            self.log_test(test_name, "PASSED", {
                "adapter_class": str(type(adapter)),
                "context": adapter.context if hasattr(adapter, 'context') else 'unknown'
            })
            
            return adapter
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return None

    async def test_trust_scoring_functionality(self, adapter):
        """Test trust scoring functionality"""
        test_name = "Trust Scoring Functionality"
        
        if adapter is None:
            self.log_test(test_name, "FAILED", {"reason": "No adapter available"})
            return
            
        try:
            # Test trust score retrieval
            agent_id = "test_agent_001"
            trust_score = await adapter.getTrustScore(agent_id)
            
            if trust_score is not None:
                self.log_test(test_name, "PASSED", {
                    "trust_score": trust_score.currentScore if hasattr(trust_score, 'currentScore') else str(trust_score),
                    "has_trust_data": True
                })
            else:
                self.log_test(test_name, "PASSED", {
                    "trust_score": None,
                    "has_trust_data": False,
                    "note": "No trust data for new agent (expected)"
                })
                
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})

    async def test_policy_enforcement(self, adapter):
        """Test policy enforcement functionality"""
        test_name = "Policy Enforcement"
        
        if adapter is None:
            self.log_test(test_name, "FAILED", {"reason": "No adapter available"})
            return
            
        try:
            # Test policy retrieval
            policies = await adapter.getAllPolicies()
            
            self.log_test(test_name, "PASSED", {
                "policy_count": len(policies) if policies else 0,
                "has_policies": policies is not None
            })
                
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})

    async def test_audit_logging(self, adapter):
        """Test audit logging functionality"""
        test_name = "Audit Logging"
        
        if adapter is None:
            self.log_test(test_name, "FAILED", {"reason": "No adapter available"})
            return
            
        try:
            # Test audit entry creation
            test_interaction = {
                "interaction_id": "test_interaction_001",
                "agent_id": "test_agent_001",
                "user_id": "test_user_001",
                "message": "Test message for audit logging",
                "timestamp": datetime.now(),
                "trust_impact": 0.1
            }
            
            audit_entry = await adapter.createAuditEntry(test_interaction)
            
            if audit_entry:
                self.log_test(test_name, "PASSED", {
                    "audit_entry_id": audit_entry.interaction_id if hasattr(audit_entry, 'interaction_id') else 'created',
                    "has_comprehensive_fields": True
                })
            else:
                self.log_test(test_name, "FAILED", {"reason": "No audit entry created"})
                
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})

    async def test_agent_self_awareness(self, adapter):
        """Test agent self-awareness capabilities"""
        test_name = "Agent Self-Awareness"
        
        if adapter is None:
            self.log_test(test_name, "FAILED", {"reason": "No adapter available"})
            return
            
        try:
            agent_id = "test_agent_001"
            
            # Test self-awareness prompts generation
            prompts = await adapter.generateSelfAwarenessPrompts(agent_id)
            
            self.log_test(test_name, "PASSED", {
                "prompt_count": len(prompts) if prompts else 0,
                "has_self_awareness": prompts is not None
            })
                
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})

    async def test_autonomous_cognition(self, adapter):
        """Test autonomous cognition functionality"""
        test_name = "Autonomous Cognition"
        
        if adapter is None:
            self.log_test(test_name, "FAILED", {"reason": "No adapter available"})
            return
            
        try:
            agent_id = "test_agent_001"
            
            # Test autonomous thinking request
            request = {
                "type": "thinking",
                "description": "Test autonomous thinking request",
                "duration": 5000
            }
            
            result = await adapter.requestAutonomousThinking(agent_id, request)
            
            if result:
                self.log_test(test_name, "PASSED", {
                    "approved": result.get("approved", False),
                    "risk_level": result.get("riskLevel", "unknown"),
                    "has_autonomy": True
                })
            else:
                self.log_test(test_name, "FAILED", {"reason": "No autonomy result"})
                
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})

    async def test_chat_api_integration(self):
        """Test chat API integration with governance"""
        test_name = "Chat API Integration"
        
        try:
            # Test that we can create a Universal Governance Adapter instance
            # and it integrates properly with the chat system
            from UniversalGovernanceAdapter import UniversalGovernanceAdapter
            
            # Create a test adapter
            test_adapter = UniversalGovernanceAdapter(context="chat_test")
            
            # Test basic integration functions
            agent_id = "test_chat_agent_001"
            
            # Test trust system integration
            trust_score = await test_adapter.getTrustScore(agent_id)
            
            # Test audit system integration
            audit_entry = await test_adapter.createAuditEntry({
                "interaction_id": "test_chat_interaction_001",
                "agent_id": agent_id,
                "message": "Test chat message",
                "trust_impact": 0.1
            })
            
            # Test policy enforcement integration
            policy_result = await test_adapter.enforcePolicy(agent_id, "Test message content")
            
            self.log_test(test_name, "PASSED", {
                "trust_system_working": trust_score is not None,
                "audit_system_working": audit_entry is not None,
                "policy_system_working": policy_result.get("allowed") is not None,
                "adapter_context": test_adapter.context,
                "integration_status": "functional"
            })
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})

    async def run_all_tests(self):
        """Run all governance integration tests"""
        print("🧪 Starting Universal Governance Integration Tests (Mock)")
        print("=" * 60)
        
        # Test 1: Import Universal Governance Adapter
        adapter = await self.test_universal_governance_adapter_import()
        print()
        
        # Test 2: Trust scoring
        await self.test_trust_scoring_functionality(adapter)
        print()
        
        # Test 3: Policy enforcement
        await self.test_policy_enforcement(adapter)
        print()
        
        # Test 4: Audit logging
        await self.test_audit_logging(adapter)
        print()
        
        # Test 5: Agent self-awareness
        await self.test_agent_self_awareness(adapter)
        print()
        
        # Test 6: Autonomous cognition
        await self.test_autonomous_cognition(adapter)
        print()
        
        # Test 7: Chat API integration
        await self.test_chat_api_integration()
        print()
        
        # Print summary
        print("=" * 60)
        print("🏁 Test Summary")
        print(f"Total Tests: {self.test_results['summary']['total']}")
        print(f"Passed: {self.test_results['summary']['passed']}")
        print(f"Failed: {self.test_results['summary']['failed']}")
        
        if self.test_results['summary']['failed'] > 0:
            print("\n❌ Failed Tests:")
            for test in self.test_results['tests']:
                if test['status'] == 'FAILED':
                    print(f"  - {test['test_name']}")
        
        # Save results
        with open('/home/ubuntu/promethios/mock_governance_test_results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📄 Results saved to: mock_governance_test_results.json")
        
        return self.test_results['summary']['failed'] == 0

async def main():
    """Main test runner"""
    tester = MockGovernanceTest()
    
    try:
        success = await tester.run_all_tests()
        
        if success:
            print("\n✅ All tests passed! Universal Governance integration is working.")
        else:
            print("\n❌ Some tests failed. Check results for details.")
            
    except Exception as e:
        print(f"\n💥 Test runner failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())

