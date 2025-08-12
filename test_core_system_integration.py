#!/usr/bin/env python3
"""
Core Promethios Chat System Integration Test
===========================================

Comprehensive test suite for validating the core Promethios Chat system
integration focusing on the components that are fully implemented and working.

Test Coverage:
- Universal Governance integration
- Analytics and automation services
- Human handoff and lead management
- Core chat workflow validation
- Performance and scalability
- System health monitoring
"""

import asyncio
import json
import logging
import sys
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)

async def test_core_system_integration():
    """Test core Promethios Chat system integration"""
    
    print("=" * 80)
    print("🧪 CORE PROMETHIOS CHAT SYSTEM INTEGRATION TEST")
    print("=" * 80)
    
    test_results = {
        "test_name": "Core Promethios Chat System Integration",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tests": {},
        "performance_metrics": {},
        "summary": {}
    }
    
    try:
        # Import core services
        print("📦 Test 1: Core Service Import Validation")
        try:
            # Core services
            from services.UniversalGovernanceAdapter import UniversalGovernanceAdapter
            from api.chat.analytics_service import ChatAnalyticsService
            from api.chat.automation_service import ChatAutomationService
            from api.chat.human_handoff_service import HumanHandoffService, Agent, HandoffRequest, AgentStatus, HandoffReason
            from api.chat.lead_management_service import LeadManagementService, Lead, LeadStatus, LeadSource
            
            test_results["tests"]["core_service_imports"] = {
                "status": "PASS",
                "message": "All 5 core services imported successfully"
            }
            print("✅ Core service imports successful")
            
        except Exception as e:
            test_results["tests"]["core_service_imports"] = {
                "status": "FAIL",
                "message": f"Service import failed: {e}"
            }
            print(f"❌ Core service imports failed: {e}")
            return test_results
        
        # Initialize core system
        print("\n🚀 Test 2: Core System Initialization")
        try:
            start_time = datetime.now()
            
            # Initialize core governance
            governance_adapter = UniversalGovernanceAdapter()
            
            # Initialize all core services
            analytics_service = ChatAnalyticsService(governance_adapter=governance_adapter)
            automation_service = ChatAutomationService(governance_adapter=governance_adapter)
            handoff_service = HumanHandoffService(governance_adapter=governance_adapter)
            lead_service = LeadManagementService(governance_adapter=governance_adapter)
            
            # Initialize all services
            await analytics_service.initialize()
            await automation_service.initialize()
            await handoff_service.initialize()
            await lead_service.initialize()
            
            initialization_time = (datetime.now() - start_time).total_seconds()
            
            test_results["tests"]["core_system_initialization"] = {
                "status": "PASS",
                "message": f"Core system initialized successfully in {initialization_time:.2f}s"
            }
            test_results["performance_metrics"]["initialization_time"] = initialization_time
            print("✅ Core system initialization successful")
            
        except Exception as e:
            test_results["tests"]["core_system_initialization"] = {
                "status": "FAIL",
                "message": f"System initialization failed: {e}"
            }
            print(f"❌ Core system initialization failed: {e}")
            return test_results
        
        # Test complete chat-to-sale workflow
        print("\n💬 Test 3: Complete Chat-to-Sale Workflow")
        try:
            workflow_start = datetime.now()
            
            # Simulate high-value enterprise lead conversation
            conversation_data = {
                "conversation_id": "enterprise_conv_001",
                "user_id": "enterprise_user_001",
                "chatbot_id": "enterprise_bot_001",
                "messages": [
                    {
                        "content": "Hello, I'm Jennifer Martinez, CTO of GlobalTech Solutions. We're a Fortune 500 company looking for an enterprise AI platform. My email is jennifer.martinez@globaltech.com",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "sender": "user"
                    },
                    {
                        "content": "We have a budget of $500,000 and need to implement this within 3 months for our digital transformation initiative. This is a high-priority project for our CEO.",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "sender": "user"
                    },
                    {
                        "content": "We need to schedule a demo with your enterprise team as soon as possible. Can you connect me with someone who can handle enterprise deals?",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "sender": "user"
                    }
                ]
            }
            
            # Step 1: Governance evaluation for all messages
            governance_results = []
            for message in conversation_data["messages"]:
                result = await governance_adapter.evaluateMessage(
                    message["content"],
                    {"trust_threshold": 0.7, "policy_enforcement_level": "strict"}
                )
                governance_results.append(result)
            
            # Step 2: Analytics tracking
            await analytics_service.track_conversation_start(conversation_data["conversation_id"])
            for message in conversation_data["messages"]:
                await analytics_service.track_message(
                    conversation_data["conversation_id"],
                    message
                )
            
            # Step 3: Automation rule evaluation
            automation_actions = []
            for message in conversation_data["messages"]:
                actions = await automation_service.evaluate_message(
                    conversation_data["conversation_id"],
                    message["content"],
                    {"sentiment": "positive", "urgency": "high", "value": "enterprise"}
                )
                automation_actions.extend(actions)
            
            # Step 4: Lead capture and qualification
            lead_id = await lead_service.capture_lead(conversation_data)
            
            # Step 5: Lead qualification
            qualification_result = await lead_service.qualify_lead(lead_id, conversation_data)
            
            # Step 6: High-priority handoff request
            handoff_request = HandoffRequest(
                request_id="enterprise_handoff_001",
                conversation_id=conversation_data["conversation_id"],
                user_id=conversation_data["user_id"],
                chatbot_id=conversation_data["chatbot_id"],
                reason=HandoffReason.COMPLEX_QUERY,
                priority="urgent",
                requested_skills=["enterprise_sales", "fortune_500", "ai_solutions"],
                context_summary="Fortune 500 CTO requesting enterprise AI platform - $500K budget, 3-month timeline"
            )
            
            handoff_id = await handoff_service.request_handoff(handoff_request)
            
            # Step 7: Opportunity creation
            opportunity_data = {
                "name": "GlobalTech Solutions Enterprise AI Platform",
                "description": "Fortune 500 digital transformation initiative - enterprise AI platform implementation",
                "value": 500000,
                "probability": 0.85,
                "stage": "qualification",
                "expected_close_date": datetime.now(timezone.utc) + timedelta(days=60)
            }
            
            opportunity_id = await lead_service.create_opportunity(lead_id, opportunity_data)
            
            # Step 8: Follow-up task creation
            followup_task_data = {
                "lead_id": lead_id,
                "task_type": "demo",
                "description": "Enterprise demo for GlobalTech Solutions CTO - Fortune 500 digital transformation",
                "scheduled_date": datetime.now(timezone.utc) + timedelta(hours=4),
                "assigned_to": "enterprise_sales_rep",
                "priority": "urgent"
            }
            
            followup_task_id = await lead_service.create_followup_task(followup_task_data)
            
            workflow_time = (datetime.now() - workflow_start).total_seconds()
            
            # Validate complete workflow
            workflow_success = (
                len(governance_results) == 3 and all(r.get("status") == "success" for r in governance_results) and
                lead_id and qualification_result and handoff_id and opportunity_id and followup_task_id and
                len(automation_actions) > 0
            )
            
            if workflow_success:
                test_results["tests"]["chat_to_sale_workflow"] = {
                    "status": "PASS",
                    "message": f"Complete chat-to-sale workflow executed successfully in {workflow_time:.2f}s. Lead: {lead_id}, Opportunity: ${opportunity_data['value']:,}, Qualification Score: {qualification_result.get('qualification_score', 0):.2f}"
                }
                test_results["performance_metrics"]["workflow_time"] = workflow_time
                test_results["performance_metrics"]["opportunity_value"] = opportunity_data['value']
                test_results["performance_metrics"]["qualification_score"] = qualification_result.get('qualification_score', 0)
                print("✅ Complete chat-to-sale workflow successful")
            else:
                test_results["tests"]["chat_to_sale_workflow"] = {
                    "status": "FAIL",
                    "message": "Chat-to-sale workflow incomplete - missing components"
                }
                print("❌ Complete chat-to-sale workflow failed")
            
        except Exception as e:
            test_results["tests"]["chat_to_sale_workflow"] = {
                "status": "FAIL",
                "message": f"Workflow execution failed: {e}"
            }
            print(f"❌ Complete chat-to-sale workflow failed: {e}")
        
        # Test agent assignment and handoff
        print("\n👥 Test 4: Agent Assignment and Handoff Management")
        try:
            handoff_start = datetime.now()
            
            # Add specialized enterprise agent
            enterprise_agent = Agent(
                agent_id="enterprise_agent_001",
                name="Michael Thompson",
                email="michael.thompson@company.com",
                specializations=["enterprise_sales", "fortune_500", "ai_solutions"],
                status=AgentStatus.AVAILABLE,
                current_conversations=[],
                max_conversations=3,
                performance_rating=4.8,
                skills=["enterprise_sales", "technical_demos", "c_suite_communication"],
                languages=["en"]
            )
            
            agent_added = await handoff_service.add_agent(enterprise_agent)
            
            # Test agent assignment
            if 'handoff_id' in locals() and handoff_id:
                assignment_success = await handoff_service.assign_conversation(handoff_id, enterprise_agent.agent_id)
            else:
                assignment_success = False
            
            # Test queue status
            queue_status = await handoff_service.get_queue_status()
            
            # Test agent metrics
            handoff_metrics = await handoff_service.get_handoff_metrics()
            
            handoff_time = (datetime.now() - handoff_start).total_seconds()
            
            if agent_added and assignment_success and queue_status and handoff_metrics:
                test_results["tests"]["agent_handoff_management"] = {
                    "status": "PASS",
                    "message": f"Agent handoff management working correctly. Agent added and assigned in {handoff_time:.2f}s. Queue: {queue_status.get('total_pending', 0)} pending"
                }
                test_results["performance_metrics"]["handoff_time"] = handoff_time
                print("✅ Agent assignment and handoff management successful")
            else:
                test_results["tests"]["agent_handoff_management"] = {
                    "status": "FAIL",
                    "message": "Agent handoff management incomplete"
                }
                print("❌ Agent assignment and handoff management failed")
            
        except Exception as e:
            test_results["tests"]["agent_handoff_management"] = {
                "status": "FAIL",
                "message": f"Agent handoff management failed: {e}"
            }
            print(f"❌ Agent assignment and handoff management failed: {e}")
        
        # Test analytics and reporting
        print("\n📊 Test 5: Analytics and Reporting")
        try:
            analytics_start = datetime.now()
            
            # Generate comprehensive analytics
            dashboard_data = await analytics_service.generate_dashboard_data("24h")
            performance_metrics = await analytics_service.get_performance_metrics()
            conversation_count = await analytics_service.get_conversation_count()
            
            # Test automation metrics
            automation_metrics = await automation_service.get_automation_metrics()
            
            # Test lead analytics
            lead_analytics = await lead_service.get_lead_analytics("30d")
            lead_metrics = await lead_service.get_lead_metrics()
            
            analytics_time = (datetime.now() - analytics_start).total_seconds()
            
            analytics_success = (
                dashboard_data and "overview" in dashboard_data and
                performance_metrics and automation_metrics and
                lead_analytics and "lead_metrics" in lead_analytics and
                conversation_count >= 0
            )
            
            if analytics_success:
                total_leads = lead_analytics.get("lead_metrics", {}).get("total_leads", 0)
                pipeline_value = lead_analytics.get("pipeline_metrics", {}).get("pipeline_value", 0)
                
                test_results["tests"]["analytics_reporting"] = {
                    "status": "PASS",
                    "message": f"Analytics and reporting working correctly in {analytics_time:.2f}s. {total_leads} leads, ${pipeline_value:,} pipeline value"
                }
                test_results["performance_metrics"]["analytics_time"] = analytics_time
                test_results["performance_metrics"]["total_leads"] = total_leads
                test_results["performance_metrics"]["pipeline_value"] = pipeline_value
                print("✅ Analytics and reporting successful")
            else:
                test_results["tests"]["analytics_reporting"] = {
                    "status": "FAIL",
                    "message": "Analytics and reporting incomplete"
                }
                print("❌ Analytics and reporting failed")
            
        except Exception as e:
            test_results["tests"]["analytics_reporting"] = {
                "status": "FAIL",
                "message": f"Analytics and reporting failed: {e}"
            }
            print(f"❌ Analytics and reporting failed: {e}")
        
        # Test concurrent operations and scalability
        print("\n⚡ Test 6: Concurrent Operations and Scalability")
        try:
            scalability_start = datetime.now()
            
            # Create multiple concurrent conversations
            concurrent_tasks = []
            
            # Simulate 20 concurrent conversations
            for i in range(20):
                conv_data = {
                    "conversation_id": f"scale_conv_{i:03d}",
                    "user_id": f"scale_user_{i:03d}",
                    "chatbot_id": "scale_bot_001",
                    "messages": [
                        {
                            "content": f"Hi, I'm interested in your product. This is conversation {i}",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "sender": "user"
                        }
                    ]
                }
                
                # Track conversation
                task1 = analytics_service.track_conversation_start(conv_data["conversation_id"])
                concurrent_tasks.append(task1)
                
                # Capture lead (every 4th conversation)
                if i % 4 == 0:
                    task2 = lead_service.capture_lead(conv_data)
                    concurrent_tasks.append(task2)
                
                # Evaluate automation (every 2nd conversation)
                if i % 2 == 0:
                    task3 = automation_service.evaluate_message(
                        conv_data["conversation_id"],
                        conv_data["messages"][0]["content"],
                        {"sentiment": "neutral", "urgency": "medium"}
                    )
                    concurrent_tasks.append(task3)
            
            # Execute all tasks concurrently
            results = await asyncio.gather(*concurrent_tasks, return_exceptions=True)
            
            scalability_time = (datetime.now() - scalability_start).total_seconds()
            
            # Count successful operations
            successful_operations = sum(1 for r in results if not isinstance(r, Exception))
            total_operations = len(concurrent_tasks)
            throughput = total_operations / scalability_time if scalability_time > 0 else 0
            
            if successful_operations >= total_operations * 0.9 and scalability_time < 15:  # 90% success rate, under 15 seconds
                test_results["tests"]["concurrent_scalability"] = {
                    "status": "PASS",
                    "message": f"Scalability test successful. {successful_operations}/{total_operations} operations in {scalability_time:.2f}s ({throughput:.1f} ops/sec)"
                }
                test_results["performance_metrics"]["throughput"] = throughput
                test_results["performance_metrics"]["concurrent_operations"] = total_operations
                test_results["performance_metrics"]["success_rate"] = (successful_operations / total_operations) * 100
                print("✅ Concurrent operations and scalability successful")
            else:
                test_results["tests"]["concurrent_scalability"] = {
                    "status": "FAIL",
                    "message": f"Scalability issues: {successful_operations}/{total_operations} operations in {scalability_time:.2f}s"
                }
                print("❌ Concurrent operations and scalability failed")
            
        except Exception as e:
            test_results["tests"]["concurrent_scalability"] = {
                "status": "FAIL",
                "message": f"Scalability test failed: {e}"
            }
            print(f"❌ Concurrent operations and scalability failed: {e}")
        
        # Test governance and compliance
        print("\n🛡️ Test 7: Governance and Compliance")
        try:
            governance_start = datetime.now()
            
            # Test comprehensive governance operations
            governance_operations = []
            
            # Policy enforcement
            policy_result = await governance_adapter.enforcePolicy(
                "enterprise_policy_001",
                {"content": "Enterprise customer data handling", "user_id": "enterprise_user", "classification": "sensitive"}
            )
            governance_operations.append(("policy", policy_result))
            
            # Trust assessment
            trust_result = await governance_adapter.assessTrust(
                "enterprise_agent_001",
                {"interaction_type": "enterprise_demo", "content": "High-value enterprise interaction", "risk_level": "low"}
            )
            governance_operations.append(("trust", trust_result))
            
            # Audit logging
            audit_result = await governance_adapter.createAuditEntry({
                "interaction_id": "enterprise_audit_001",
                "agent_id": "enterprise_agent_001",
                "event_type": "enterprise_lead_captured",
                "lead_value": 500000,
                "compliance_status": "compliant",
                "status": "success"
            })
            governance_operations.append(("audit", audit_result))
            
            # Agent self-awareness
            awareness_result = await governance_adapter.generateSelfReflectionPrompt(
                "enterprise_agent_001",
                {"interaction_type": "enterprise_sales", "outcome": "opportunity_created", "value": 500000}
            )
            governance_operations.append(("awareness", awareness_result))
            
            governance_time = (datetime.now() - governance_start).total_seconds()
            
            # Validate governance operations
            successful_governance = sum(1 for _, result in governance_operations if result and result.get("status") == "success")
            total_governance = len(governance_operations)
            
            if successful_governance == total_governance:
                test_results["tests"]["governance_compliance"] = {
                    "status": "PASS",
                    "message": f"Governance and compliance working perfectly. {successful_governance}/{total_governance} operations successful in {governance_time:.2f}s"
                }
                test_results["performance_metrics"]["governance_time"] = governance_time
                print("✅ Governance and compliance successful")
            else:
                test_results["tests"]["governance_compliance"] = {
                    "status": "FAIL",
                    "message": f"Governance issues: {successful_governance}/{total_governance} operations successful"
                }
                print("❌ Governance and compliance failed")
            
        except Exception as e:
            test_results["tests"]["governance_compliance"] = {
                "status": "FAIL",
                "message": f"Governance and compliance failed: {e}"
            }
            print(f"❌ Governance and compliance failed: {e}")
        
        # Test system health and monitoring
        print("\n🏥 Test 8: System Health and Monitoring")
        try:
            health_start = datetime.now()
            
            # Comprehensive system health check
            health_checks = {}
            
            # Service availability
            health_checks["governance"] = bool(governance_adapter)
            health_checks["analytics"] = bool(analytics_service)
            health_checks["automation"] = bool(automation_service)
            health_checks["handoff"] = bool(handoff_service)
            health_checks["lead_management"] = bool(lead_service)
            
            # Data integrity
            leads = await lead_service.get_leads()
            opportunities = await lead_service.get_opportunities()
            agents = await handoff_service.get_agents()
            handoff_requests = await handoff_service.get_handoff_requests()
            
            health_checks["data_integrity"] = all([
                isinstance(leads, list),
                isinstance(opportunities, list),
                isinstance(agents, list),
                isinstance(handoff_requests, list)
            ])
            
            # Performance metrics
            system_metrics = {
                "total_conversations": await analytics_service.get_conversation_count(),
                "total_leads": len(leads),
                "total_opportunities": len(opportunities),
                "total_agents": len(agents),
                "total_handoff_requests": len(handoff_requests)
            }
            
            health_time = (datetime.now() - health_start).total_seconds()
            
            # Calculate health score
            healthy_services = sum(health_checks.values())
            total_services = len(health_checks)
            health_score = (healthy_services / total_services) * 100
            
            if health_score >= 90:
                test_results["tests"]["system_health"] = {
                    "status": "PASS",
                    "message": f"System health excellent: {health_score:.1f}% ({healthy_services}/{total_services} services healthy) in {health_time:.2f}s"
                }
                test_results["performance_metrics"]["health_check_time"] = health_time
                test_results["performance_metrics"]["health_score"] = health_score
                test_results["performance_metrics"]["system_metrics"] = system_metrics
                print("✅ System health and monitoring successful")
            else:
                test_results["tests"]["system_health"] = {
                    "status": "FAIL",
                    "message": f"System health issues: {health_score:.1f}% ({healthy_services}/{total_services} services healthy)"
                }
                print("❌ System health and monitoring failed")
            
        except Exception as e:
            test_results["tests"]["system_health"] = {
                "status": "FAIL",
                "message": f"System health check failed: {e}"
            }
            print(f"❌ System health and monitoring failed: {e}")
        
        # Calculate final summary
        total_tests = len(test_results["tests"])
        passed_tests = len([t for t in test_results["tests"].values() if t["status"] == "PASS"])
        failed_tests = len([t for t in test_results["tests"].values() if t["status"] == "FAIL"])
        
        # Calculate overall performance score
        performance_metrics = test_results["performance_metrics"]
        performance_score = 100
        
        # Performance scoring
        if performance_metrics.get("initialization_time", 0) > 3:
            performance_score -= 5
        if performance_metrics.get("workflow_time", 0) > 2:
            performance_score -= 10
        if performance_metrics.get("throughput", 0) < 5:
            performance_score -= 10
        if performance_metrics.get("health_score", 100) < 90:
            performance_score -= 15
        
        test_results["summary"] = {
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": round((passed_tests / total_tests) * 100, 1) if total_tests > 0 else 0,
            "performance_score": max(0, performance_score),
            "system_status": "EXCELLENT" if passed_tests >= 7 else "GOOD" if passed_tests >= 6 else "ACCEPTABLE" if passed_tests >= 5 else "CRITICAL"
        }
        
        # Print comprehensive summary
        print("\n" + "=" * 80)
        print("📋 CORE SYSTEM INTEGRATION TEST REPORT")
        print("=" * 80)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {test_results['summary']['success_rate']}%")
        print(f"Performance Score: {test_results['summary']['performance_score']}/100")
        print(f"System Status: {test_results['summary']['system_status']}")
        
        print("\n📊 PERFORMANCE METRICS:")
        for metric, value in performance_metrics.items():
            if isinstance(value, float):
                if "time" in metric:
                    print(f"  • {metric.replace('_', ' ').title()}: {value:.2f}s")
                elif "score" in metric or "rate" in metric:
                    print(f"  • {metric.replace('_', ' ').title()}: {value:.1f}%")
                else:
                    print(f"  • {metric.replace('_', ' ').title()}: {value:.2f}")
            elif isinstance(value, dict):
                print(f"  • {metric.replace('_', ' ').title()}:")
                for k, v in value.items():
                    print(f"    - {k}: {v}")
            else:
                print(f"  • {metric.replace('_', ' ').title()}: {value}")
        
        print("\n📊 DETAILED TEST RESULTS:")
        for test_name, result in test_results["tests"].items():
            status_icon = "✅" if result["status"] == "PASS" else "❌"
            print(f"{status_icon} {result['status']} {test_name.replace('_', ' ').title()}: {result['message']}")
        
        # Save comprehensive results
        results_file = "core_system_integration_results.json"
        with open(results_file, 'w') as f:
            json.dump(test_results, f, indent=2)
        
        print(f"\n💾 Core system test results saved to: {results_file}")
        
        # Final assessment
        if test_results['summary']['success_rate'] >= 90:
            print(f"\n🎉 EXCELLENT! Core system integration is working perfectly with {test_results['summary']['success_rate']}% success rate.")
            print("🚀 The Promethios Chat core system is ready for production deployment!")
        elif test_results['summary']['success_rate'] >= 80:
            print(f"\n✅ GOOD! Core system integration is working well with {test_results['summary']['success_rate']}% success rate.")
            print("🔧 Minor optimizations recommended before production deployment.")
        elif test_results['summary']['success_rate'] >= 70:
            print(f"\n⚠️  ACCEPTABLE! Core system integration has some issues with {test_results['summary']['success_rate']}% success rate.")
            print("🛠️  Improvements needed before production deployment.")
        else:
            print(f"\n❌ CRITICAL! Core system integration has major issues with {test_results['summary']['success_rate']}% success rate.")
            print("🚨 System requires immediate attention before deployment.")
        
        return test_results
        
    except Exception as e:
        logger.error(f"❌ Core system test execution failed: {e}")
        test_results["tests"]["test_execution"] = {
            "status": "FAIL",
            "message": f"Test execution failed: {e}"
        }
        return test_results

if __name__ == "__main__":
    asyncio.run(test_core_system_integration())

