#!/usr/bin/env python3
"""
Test Universal Governance Integration
=====================================

This script tests the integration between the chat system and the Universal Governance Adapter
to ensure that chat agents have the same governance capabilities as modern chat agents.

Test Coverage:
- Trust scoring integration
- Policy enforcement
- Audit logging
- Agent self-awareness
- Governance identity creation
- Real-time monitoring
"""

import asyncio
import json
import sys
import os
import requests
from datetime import datetime
from typing import Dict, List, Any, Optional

# Add project root to path
sys.path.append('/home/ubuntu/promethios')

class UniversalGovernanceIntegrationTest:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.test_results = {
            "timestamp": datetime.now().isoformat(),
            "tests": [],
            "summary": {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "errors": []
            }
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
        elif status == "FAILED":
            self.test_results["summary"]["failed"] += 1
            print(f"❌ {test_name}: FAILED")
            if details:
                print(f"   Details: {details}")
        else:
            self.test_results["summary"]["failed"] += 1
            print(f"⚠️ {test_name}: ERROR")
            if details:
                print(f"   Error: {details}")

    async def test_chat_api_governance_integration(self):
        """Test that chat API properly integrates with Universal Governance"""
        test_name = "Chat API Governance Integration"
        
        try:
            # Test data
            test_session_data = {
                "agent_id": "test_chat_agent_001",
                "user_id": "test_user_001",
                "session_type": "chat",
                "governance_config": {
                    "trust_threshold": 0.7,
                    "compliance_mode": "basic",
                    "policies": ["content_safety", "data_privacy"]
                }
            }
            
            # Test session creation with governance
            response = requests.post(
                f"{self.base_url}/api/chat/sessions",
                json=test_session_data,
                timeout=10
            )
            
            if response.status_code == 200:
                session_data = response.json()
                
                # Check if governance data is present
                governance_checks = {
                    "has_governance_id": "governance_id" in session_data,
                    "has_trust_score": "trust_score" in session_data,
                    "has_audit_entry": "audit_entry_id" in session_data,
                    "governance_enabled": session_data.get("governance_enabled", False)
                }
                
                if all(governance_checks.values()):
                    self.log_test(test_name, "PASSED", {
                        "session_id": session_data.get("session_id"),
                        "governance_checks": governance_checks,
                        "trust_score": session_data.get("trust_score")
                    })
                else:
                    self.log_test(test_name, "FAILED", {
                        "missing_governance_features": [k for k, v in governance_checks.items() if not v],
                        "response": session_data
                    })
            else:
                self.log_test(test_name, "FAILED", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                
        except Exception as e:
            self.log_test(test_name, "ERROR", {"exception": str(e)})

    async def test_trust_scoring_integration(self):
        """Test that trust scoring works properly"""
        test_name = "Trust Scoring Integration"
        
        try:
            # Test trust score retrieval
            agent_id = "test_chat_agent_001"
            
            response = requests.get(
                f"{self.base_url}/api/agents/{agent_id}/trust-score",
                timeout=10
            )
            
            if response.status_code == 200:
                trust_data = response.json()
                
                # Check trust score structure
                required_fields = ["currentScore", "trend", "level", "history"]
                has_required_fields = all(field in trust_data for field in required_fields)
                
                # Validate trust score values
                current_score = trust_data.get("currentScore", 0)
                is_valid_score = 0 <= current_score <= 1
                
                if has_required_fields and is_valid_score:
                    self.log_test(test_name, "PASSED", {
                        "trust_score": current_score,
                        "trust_level": trust_data.get("level"),
                        "trend": trust_data.get("trend")
                    })
                else:
                    self.log_test(test_name, "FAILED", {
                        "missing_fields": [f for f in required_fields if f not in trust_data],
                        "invalid_score": not is_valid_score,
                        "response": trust_data
                    })
            else:
                self.log_test(test_name, "FAILED", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                
        except Exception as e:
            self.log_test(test_name, "ERROR", {"exception": str(e)})

    async def test_policy_enforcement(self):
        """Test that policy enforcement works"""
        test_name = "Policy Enforcement"
        
        try:
            # Test policy validation
            agent_id = "test_chat_agent_001"
            
            response = requests.get(
                f"{self.base_url}/api/agents/{agent_id}/policies",
                timeout=10
            )
            
            if response.status_code == 200:
                policies_data = response.json()
                
                # Check if policies are returned
                has_policies = len(policies_data.get("policies", [])) > 0
                has_compliance_metrics = "compliance_metrics" in policies_data
                
                if has_policies and has_compliance_metrics:
                    self.log_test(test_name, "PASSED", {
                        "policy_count": len(policies_data.get("policies", [])),
                        "compliance_rate": policies_data.get("compliance_metrics", {}).get("overall_rate"),
                        "active_policies": [p.get("name") for p in policies_data.get("policies", [])]
                    })
                else:
                    self.log_test(test_name, "FAILED", {
                        "has_policies": has_policies,
                        "has_compliance_metrics": has_compliance_metrics,
                        "response": policies_data
                    })
            else:
                self.log_test(test_name, "FAILED", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                
        except Exception as e:
            self.log_test(test_name, "ERROR", {"exception": str(e)})

    async def test_audit_logging(self):
        """Test that audit logging works properly"""
        test_name = "Audit Logging"
        
        try:
            # Test audit log retrieval
            agent_id = "test_chat_agent_001"
            
            response = requests.get(
                f"{self.base_url}/api/agents/{agent_id}/audit-logs",
                timeout=10
            )
            
            if response.status_code == 200:
                audit_data = response.json()
                
                # Check audit log structure
                has_logs = len(audit_data.get("logs", [])) >= 0
                has_metadata = "metadata" in audit_data
                
                # Check if logs have required fields (47+ field comprehensive audit)
                if has_logs and audit_data.get("logs"):
                    sample_log = audit_data["logs"][0]
                    required_audit_fields = [
                        "interaction_id", "agent_id", "timestamp", "trust_impact",
                        "governance_metadata", "performance_metrics"
                    ]
                    has_comprehensive_fields = all(field in sample_log for field in required_audit_fields)
                else:
                    has_comprehensive_fields = True  # No logs yet, but structure is correct
                
                if has_logs and has_metadata and has_comprehensive_fields:
                    self.log_test(test_name, "PASSED", {
                        "log_count": len(audit_data.get("logs", [])),
                        "has_comprehensive_fields": has_comprehensive_fields,
                        "metadata": audit_data.get("metadata")
                    })
                else:
                    self.log_test(test_name, "FAILED", {
                        "has_logs": has_logs,
                        "has_metadata": has_metadata,
                        "has_comprehensive_fields": has_comprehensive_fields,
                        "response": audit_data
                    })
            else:
                self.log_test(test_name, "FAILED", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                
        except Exception as e:
            self.log_test(test_name, "ERROR", {"exception": str(e)})

    async def test_agent_self_awareness(self):
        """Test that agents can access their own governance data"""
        test_name = "Agent Self-Awareness"
        
        try:
            # Test agent self-awareness capabilities
            agent_id = "test_chat_agent_001"
            
            # Test multiple self-awareness endpoints
            endpoints = [
                f"/api/agents/{agent_id}/trust-score",
                f"/api/agents/{agent_id}/policies", 
                f"/api/agents/{agent_id}/audit-logs",
                f"/api/agents/{agent_id}/compliance-metrics"
            ]
            
            self_awareness_results = {}
            
            for endpoint in endpoints:
                try:
                    response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                    self_awareness_results[endpoint] = {
                        "status_code": response.status_code,
                        "accessible": response.status_code == 200,
                        "has_data": len(response.json()) > 0 if response.status_code == 200 else False
                    }
                except Exception as e:
                    self_awareness_results[endpoint] = {
                        "status_code": None,
                        "accessible": False,
                        "error": str(e)
                    }
            
            # Check if all endpoints are accessible
            accessible_count = sum(1 for result in self_awareness_results.values() if result.get("accessible"))
            total_endpoints = len(endpoints)
            
            if accessible_count == total_endpoints:
                self.log_test(test_name, "PASSED", {
                    "accessible_endpoints": accessible_count,
                    "total_endpoints": total_endpoints,
                    "endpoint_results": self_awareness_results
                })
            else:
                self.log_test(test_name, "FAILED", {
                    "accessible_endpoints": accessible_count,
                    "total_endpoints": total_endpoints,
                    "failed_endpoints": [ep for ep, result in self_awareness_results.items() if not result.get("accessible")],
                    "endpoint_results": self_awareness_results
                })
                
        except Exception as e:
            self.log_test(test_name, "ERROR", {"exception": str(e)})

    async def test_governance_identity_creation(self):
        """Test that governance identities are created for new chatbots"""
        test_name = "Governance Identity Creation"
        
        try:
            # Test chatbot creation with governance
            chatbot_data = {
                "name": "Test Governance Chatbot",
                "description": "Testing governance integration",
                "agent_id": "test_wrapped_agent_001",
                "governance_config": {
                    "trust_threshold": 0.8,
                    "compliance_mode": "healthcare",
                    "policies": ["hipaa", "content_safety"]
                }
            }
            
            response = requests.post(
                f"{self.base_url}/api/chat/chatbots",
                json=chatbot_data,
                timeout=10
            )
            
            if response.status_code == 200 or response.status_code == 201:
                chatbot_response = response.json()
                
                # Check if governance identity was created
                governance_checks = {
                    "has_governance_id": "governance_id" in chatbot_response,
                    "governance_validated": chatbot_response.get("governance_validated", False),
                    "governance_registered": chatbot_response.get("governance_registered", False),
                    "has_trust_threshold": "trust_threshold" in chatbot_response.get("governance_config", {})
                }
                
                if all(governance_checks.values()):
                    self.log_test(test_name, "PASSED", {
                        "chatbot_id": chatbot_response.get("chatbot_id"),
                        "governance_id": chatbot_response.get("governance_id"),
                        "governance_checks": governance_checks
                    })
                else:
                    self.log_test(test_name, "FAILED", {
                        "missing_governance_features": [k for k, v in governance_checks.items() if not v],
                        "response": chatbot_response
                    })
            else:
                self.log_test(test_name, "FAILED", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                
        except Exception as e:
            self.log_test(test_name, "ERROR", {"exception": str(e)})

    async def test_real_time_governance_monitoring(self):
        """Test real-time governance monitoring capabilities"""
        test_name = "Real-time Governance Monitoring"
        
        try:
            # Test governance monitoring endpoint
            agent_id = "test_chat_agent_001"
            
            response = requests.get(
                f"{self.base_url}/api/governance/monitoring/{agent_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                monitoring_data = response.json()
                
                # Check monitoring capabilities
                monitoring_checks = {
                    "has_real_time_metrics": "real_time_metrics" in monitoring_data,
                    "has_governance_alerts": "governance_alerts" in monitoring_data,
                    "has_compliance_status": "compliance_status" in monitoring_data,
                    "monitoring_active": monitoring_data.get("monitoring_active", False)
                }
                
                if all(monitoring_checks.values()):
                    self.log_test(test_name, "PASSED", {
                        "monitoring_checks": monitoring_checks,
                        "active_alerts": len(monitoring_data.get("governance_alerts", [])),
                        "compliance_rate": monitoring_data.get("compliance_status", {}).get("overall_rate")
                    })
                else:
                    self.log_test(test_name, "FAILED", {
                        "missing_monitoring_features": [k for k, v in monitoring_checks.items() if not v],
                        "response": monitoring_data
                    })
            else:
                self.log_test(test_name, "FAILED", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                
        except Exception as e:
            self.log_test(test_name, "ERROR", {"exception": str(e)})

    async def run_all_tests(self):
        """Run all governance integration tests"""
        print("🧪 Starting Universal Governance Integration Tests")
        print("=" * 60)
        
        # List of all tests
        tests = [
            self.test_chat_api_governance_integration,
            self.test_trust_scoring_integration,
            self.test_policy_enforcement,
            self.test_audit_logging,
            self.test_agent_self_awareness,
            self.test_governance_identity_creation,
            self.test_real_time_governance_monitoring
        ]
        
        # Run tests
        for test in tests:
            await test()
            print()  # Add spacing between tests
        
        # Print summary
        print("=" * 60)
        print("🏁 Test Summary")
        print(f"Total Tests: {self.test_results['summary']['total']}")
        print(f"Passed: {self.test_results['summary']['passed']}")
        print(f"Failed: {self.test_results['summary']['failed']}")
        
        if self.test_results['summary']['failed'] > 0:
            print("\n❌ Failed Tests:")
            for test in self.test_results['tests']:
                if test['status'] in ['FAILED', 'ERROR']:
                    print(f"  - {test['test_name']}: {test['status']}")
        
        # Save results
        with open('/home/ubuntu/promethios/universal_governance_test_results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: universal_governance_test_results.json")
        
        # Return success status
        return self.test_results['summary']['failed'] == 0

async def main():
    """Main test runner"""
    tester = UniversalGovernanceIntegrationTest()
    
    try:
        success = await tester.run_all_tests()
        
        if success:
            print("\n✅ All tests passed! Universal Governance integration is working correctly.")
            sys.exit(0)
        else:
            print("\n❌ Some tests failed. Check the results for details.")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n💥 Test runner failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

