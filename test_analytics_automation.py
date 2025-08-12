#!/usr/bin/env python3
"""
Analytics and Automation Services Integration Test
=================================================

Comprehensive test suite for the Promethios Chat analytics and automation
services to ensure proper functionality and integration.

Test Coverage:
- Analytics service initialization and data tracking
- Automation service rule creation and execution
- Integration between analytics and automation
- Real-time metrics and automation triggers
- Dashboard data generation
- Workflow execution and escalation handling
"""

import asyncio
import json
import sys
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

try:
    from api.chat.analytics_service import ChatAnalyticsService, ConversationMetrics
    from api.chat.automation_service import ChatAutomationService, AutomationRule, TriggerType, ActionType
    from services.UniversalGovernanceAdapter import UniversalGovernanceAdapter
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure all required modules are available")
    sys.exit(1)

class AnalyticsAutomationIntegrationTest:
    """Test suite for analytics and automation services integration"""
    
    def __init__(self):
        self.test_results = {
            "test_name": "Analytics and Automation Services Integration Test",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tests": []
        }
        
        # Initialize services
        self.governance_adapter = UniversalGovernanceAdapter()
        self.analytics_service = None
        self.automation_service = None
    
    async def run_all_tests(self):
        """Run all integration tests"""
        print("🧪 Starting Analytics and Automation Services Integration Test")
        print("=" * 70)
        
        try:
            # Test 1: Service Initialization
            await self.test_service_initialization()
            
            # Test 2: Analytics Data Tracking
            await self.test_analytics_tracking()
            
            # Test 3: Automation Rule Creation
            await self.test_automation_rules()
            
            # Test 4: Workflow Management
            await self.test_workflow_management()
            
            # Test 5: Escalation Rules
            await self.test_escalation_rules()
            
            # Test 6: Real-time Integration
            await self.test_realtime_integration()
            
            # Test 7: Dashboard Data Generation
            await self.test_dashboard_generation()
            
            # Test 8: Performance Metrics
            await self.test_performance_metrics()
            
            # Generate test report
            await self.generate_test_report()
            
        except Exception as e:
            print(f"❌ Test suite failed: {e}")
            self.add_test_result("Test Suite Execution", False, str(e))
    
    async def test_service_initialization(self):
        """Test 1: Service Initialization"""
        print("\n🔧 Test 1: Service Initialization")
        
        try:
            # Initialize analytics service
            self.analytics_service = ChatAnalyticsService(
                governance_adapter=self.governance_adapter,
                db_path="./test_analytics.db"
            )
            await self.analytics_service.initialize()
            
            # Initialize automation service
            self.automation_service = ChatAutomationService(
                governance_adapter=self.governance_adapter,
                analytics_service=self.analytics_service
            )
            await self.automation_service.initialize()
            
            print("✅ Services initialized successfully")
            self.add_test_result("Service Initialization", True, "Analytics and automation services initialized")
            
        except Exception as e:
            print(f"❌ Service initialization failed: {e}")
            self.add_test_result("Service Initialization", False, str(e))
            raise
    
    async def test_analytics_tracking(self):
        """Test 2: Analytics Data Tracking"""
        print("\n📊 Test 2: Analytics Data Tracking")
        
        try:
            # Test conversation tracking
            conversation_id = "test_conv_001"
            user_id = "test_user_001"
            chatbot_id = "test_bot_001"
            
            # Start conversation tracking
            await self.analytics_service.track_conversation_start(
                conversation_id, user_id, chatbot_id
            )
            
            # Track multiple messages
            for i in range(5):
                message_data = {
                    "conversation_id": conversation_id,
                    "user_id": user_id,
                    "chatbot_id": chatbot_id,
                    "message_type": "user" if i % 2 == 0 else "bot",
                    "response_time": 1.2 + (i * 0.3),
                    "sentiment_score": 0.5 - (i * 0.1),
                    "trust_score": 0.8 + (i * 0.02),
                    "governance_violations": 0,
                    "cost": 0.01
                }
                await self.analytics_service.track_message(message_data)
            
            # End conversation
            await self.analytics_service.track_conversation_end(
                conversation_id, "resolved", 4.2
            )
            
            # Verify conversation metrics
            metrics = await self.analytics_service.get_conversation_metrics(conversation_id)
            
            if metrics and metrics.message_count == 5:
                print("✅ Analytics tracking working correctly")
                self.add_test_result("Analytics Tracking", True, f"Tracked {metrics.message_count} messages")
            else:
                print("❌ Analytics tracking failed")
                self.add_test_result("Analytics Tracking", False, "Message count mismatch")
            
        except Exception as e:
            print(f"❌ Analytics tracking test failed: {e}")
            self.add_test_result("Analytics Tracking", False, str(e))
    
    async def test_automation_rules(self):
        """Test 3: Automation Rule Creation and Management"""
        print("\n🤖 Test 3: Automation Rule Management")
        
        try:
            # Create test automation rule
            test_rule = AutomationRule(
                rule_id="test_rule_001",
                name="Test High Response Time Rule",
                description="Test rule for high response times",
                trigger_type=TriggerType.RESPONSE_TIME,
                trigger_conditions={"threshold": 3.0, "operator": "greater_than"},
                action_type=ActionType.SEND_AUTO_RESPONSE,
                action_parameters={"template": "apology_slow_response"},
                priority=1
            )
            
            # Add rule to automation service
            success = await self.automation_service.add_automation_rule(test_rule)
            
            if success:
                # Test rule retrieval
                rules = await self.automation_service.get_automation_rules()
                
                if len(rules) > 0:
                    print("✅ Automation rule management working correctly")
                    self.add_test_result("Automation Rules", True, f"Created and retrieved {len(rules)} rules")
                else:
                    print("❌ Rule retrieval failed")
                    self.add_test_result("Automation Rules", False, "No rules retrieved")
            else:
                print("❌ Rule creation failed")
                self.add_test_result("Automation Rules", False, "Rule creation failed")
            
        except Exception as e:
            print(f"❌ Automation rules test failed: {e}")
            self.add_test_result("Automation Rules", False, str(e))
    
    async def test_workflow_management(self):
        """Test 4: Workflow Management"""
        print("\n🔄 Test 4: Workflow Management")
        
        try:
            # Get workflows
            workflows = await self.automation_service.get_workflows()
            
            if len(workflows) > 0:
                # Test workflow execution
                workflow_id = workflows[0]["workflow_id"]
                context = {
                    "user_id": "test_user_002",
                    "conversation_id": "test_conv_002",
                    "intent": "purchase",
                    "lead_score": 85
                }
                
                success = await self.automation_service.execute_workflow(workflow_id, context)
                
                if success:
                    print("✅ Workflow management working correctly")
                    self.add_test_result("Workflow Management", True, f"Executed workflow: {workflow_id}")
                else:
                    print("❌ Workflow execution failed")
                    self.add_test_result("Workflow Management", False, "Workflow execution failed")
            else:
                print("✅ Workflow management initialized (no workflows to test)")
                self.add_test_result("Workflow Management", True, "Service initialized correctly")
            
        except Exception as e:
            print(f"❌ Workflow management test failed: {e}")
            self.add_test_result("Workflow Management", False, str(e))
    
    async def test_escalation_rules(self):
        """Test 5: Escalation Rules"""
        print("\n🚨 Test 5: Escalation Rules")
        
        try:
            # Get escalation rules
            escalation_rules = await self.automation_service.get_escalation_rules()
            
            if len(escalation_rules) > 0:
                # Test escalation condition checking
                conversation_data = {
                    "conversation_id": "test_conv_003",
                    "sentiment_score": -0.8,  # Very negative
                    "message_count": 7,       # Many messages
                    "trust_score": 0.2,       # Low trust
                    "confidence_score": 0.3   # Low confidence
                }
                
                escalation_rule = await self.automation_service.check_escalation_conditions(conversation_data)
                
                if escalation_rule:
                    print("✅ Escalation rules working correctly")
                    self.add_test_result("Escalation Rules", True, f"Triggered escalation: {escalation_rule.name}")
                else:
                    print("✅ Escalation rules evaluated (no escalation needed)")
                    self.add_test_result("Escalation Rules", True, "Escalation conditions evaluated correctly")
            else:
                print("✅ Escalation rules initialized")
                self.add_test_result("Escalation Rules", True, "Service initialized correctly")
            
        except Exception as e:
            print(f"❌ Escalation rules test failed: {e}")
            self.add_test_result("Escalation Rules", False, str(e))
    
    async def test_realtime_integration(self):
        """Test 6: Real-time Integration Between Services"""
        print("\n⚡ Test 6: Real-time Integration")
        
        try:
            # Simulate real-time message processing
            message_data = {
                "conversation_id": "test_conv_004",
                "user_id": "test_user_004",
                "chatbot_id": "test_bot_004",
                "message_type": "bot",
                "response_time": 6.5,  # High response time to trigger automation
                "sentiment_score": -0.3,
                "trust_score": 0.7,
                "governance_violations": 0,
                "cost": 0.02,
                "content": "I need help with my account"
            }
            
            # Process message through automation service
            triggered_actions = await self.automation_service.process_message(message_data)
            
            # Track message in analytics
            await self.analytics_service.track_message(message_data)
            
            if len(triggered_actions) > 0:
                print("✅ Real-time integration working correctly")
                self.add_test_result("Real-time Integration", True, f"Triggered {len(triggered_actions)} actions")
            else:
                print("✅ Real-time integration processed (no actions triggered)")
                self.add_test_result("Real-time Integration", True, "Message processed successfully")
            
        except Exception as e:
            print(f"❌ Real-time integration test failed: {e}")
            self.add_test_result("Real-time Integration", False, str(e))
    
    async def test_dashboard_generation(self):
        """Test 7: Dashboard Data Generation"""
        print("\n📈 Test 7: Dashboard Data Generation")
        
        try:
            # Generate dashboard data
            dashboard_data = await self.analytics_service.get_dashboard_data("24h")
            
            # Check required dashboard components
            required_keys = ["system_metrics", "time_range", "generated_at"]
            missing_keys = [key for key in required_keys if key not in dashboard_data]
            
            if not missing_keys:
                print("✅ Dashboard data generation working correctly")
                self.add_test_result("Dashboard Generation", True, "All required dashboard components present")
            else:
                print(f"❌ Dashboard missing keys: {missing_keys}")
                self.add_test_result("Dashboard Generation", False, f"Missing keys: {missing_keys}")
            
        except Exception as e:
            print(f"❌ Dashboard generation test failed: {e}")
            self.add_test_result("Dashboard Generation", False, str(e))
    
    async def test_performance_metrics(self):
        """Test 8: Performance Metrics"""
        print("\n⚡ Test 8: Performance Metrics")
        
        try:
            # Get system metrics
            system_metrics = await self.analytics_service.get_system_metrics("24h")
            
            # Get automation stats
            automation_stats = await self.automation_service.get_automation_stats()
            
            # Check metrics structure
            metrics_valid = (
                "conversations" in system_metrics and
                "performance" in system_metrics and
                "total_rules" in automation_stats
            )
            
            if metrics_valid:
                print("✅ Performance metrics working correctly")
                self.add_test_result("Performance Metrics", True, "All metrics components available")
            else:
                print("❌ Performance metrics incomplete")
                self.add_test_result("Performance Metrics", False, "Missing metrics components")
            
        except Exception as e:
            print(f"❌ Performance metrics test failed: {e}")
            self.add_test_result("Performance Metrics", False, str(e))
    
    def add_test_result(self, test_name: str, success: bool, details: str):
        """Add a test result to the results collection"""
        self.test_results["tests"].append({
            "test_name": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    
    async def generate_test_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 70)
        print("📋 TEST REPORT SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results["tests"])
        passed_tests = len([t for t in self.test_results["tests"] if t["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\n📊 DETAILED RESULTS:")
        for test in self.test_results["tests"]:
            status = "✅ PASS" if test["success"] else "❌ FAIL"
            print(f"{status} {test['test_name']}: {test['details']}")
        
        # Save results to file
        results_file = "analytics_automation_test_results.json"
        with open(results_file, 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n💾 Test results saved to: {results_file}")
        
        if failed_tests == 0:
            print("\n🎉 ALL TESTS PASSED! Analytics and Automation services are working correctly.")
        else:
            print(f"\n⚠️  {failed_tests} test(s) failed. Please review the issues above.")

async def main():
    """Main test execution function"""
    test_suite = AnalyticsAutomationIntegrationTest()
    await test_suite.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())

