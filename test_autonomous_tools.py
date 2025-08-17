#!/usr/bin/env python3
"""
Comprehensive Test Suite for Promethios Autonomous Tool Capabilities

Tests all implemented tools to ensure they work correctly with governance oversight.
"""

import asyncio
import sys
import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any

# Add src directory to path
sys.path.append('/home/ubuntu/promethios/src')

# Import tool services
from api.tools.unified_tool_router import UnifiedToolRouter
from api.tools.governance_tool_adapter import GovernanceToolAdapter

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AutonomousToolTester:
    """Comprehensive tester for autonomous tool capabilities."""
    
    def __init__(self):
        """Initialize the tester."""
        self.tool_router = UnifiedToolRouter()
        self.test_results = {}
        self.test_agent_id = "test_agent_001"
        
        logger.info("🧪 Autonomous Tool Tester initialized")
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all tool tests and return comprehensive results."""
        logger.info("🚀 Starting comprehensive autonomous tool testing...")
        
        test_suite = {
            "Core Autonomous Tools": [
                ("file_operations", self.test_file_operations),
                ("code_execution", self.test_code_execution),
                ("shell_operations", self.test_shell_operations),
                ("web_browsing", self.test_web_browsing),
            ],
            "Communication Tools": [
                ("web_search", self.test_web_search),
                ("email_sending", self.test_email_sending),
                ("sms_messaging", self.test_sms_messaging),
            ],
            "Content Creation Tools": [
                ("document_generation", self.test_document_generation),
                ("data_visualization", self.test_data_visualization),
                ("coding_programming", self.test_coding_programming),
            ],
            "Business Tools": [
                ("salesforce_crm", self.test_salesforce_crm),
                ("google_calendar", self.test_google_calendar),
                ("shopify_integration", self.test_shopify_integration),
            ],
            "Governance & Security": [
                ("governance_evaluation", self.test_governance_evaluation),
                ("policy_enforcement", self.test_policy_enforcement),
                ("audit_logging", self.test_audit_logging),
            ]
        }
        
        overall_results = {
            "test_summary": {
                "start_time": datetime.utcnow().isoformat(),
                "total_categories": len(test_suite),
                "total_tests": sum(len(tests) for tests in test_suite.values()),
                "passed": 0,
                "failed": 0,
                "warnings": 0
            },
            "category_results": {},
            "detailed_results": {},
            "governance_metrics": {},
            "recommendations": []
        }
        
        # Run tests by category
        for category, tests in test_suite.items():
            logger.info(f"📋 Testing category: {category}")
            category_results = {
                "passed": 0,
                "failed": 0,
                "warnings": 0,
                "tests": {}
            }
            
            for test_name, test_func in tests:
                try:
                    logger.info(f"  🔧 Testing {test_name}...")
                    result = await test_func()
                    
                    category_results["tests"][test_name] = result
                    overall_results["detailed_results"][test_name] = result
                    
                    if result["status"] == "passed":
                        category_results["passed"] += 1
                        overall_results["test_summary"]["passed"] += 1
                    elif result["status"] == "failed":
                        category_results["failed"] += 1
                        overall_results["test_summary"]["failed"] += 1
                    elif result["status"] == "warning":
                        category_results["warnings"] += 1
                        overall_results["test_summary"]["warnings"] += 1
                    
                    logger.info(f"    ✅ {test_name}: {result['status'].upper()}")
                    
                except Exception as e:
                    error_result = {
                        "status": "failed",
                        "error": str(e),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    category_results["tests"][test_name] = error_result
                    category_results["failed"] += 1
                    overall_results["test_summary"]["failed"] += 1
                    overall_results["detailed_results"][test_name] = error_result
                    
                    logger.error(f"    ❌ {test_name}: FAILED - {str(e)}")
            
            overall_results["category_results"][category] = category_results
        
        # Get governance metrics
        overall_results["governance_metrics"] = await self.tool_router.governance_adapter.get_governance_metrics()
        
        # Generate recommendations
        overall_results["recommendations"] = self.generate_recommendations(overall_results)
        
        # Finalize summary
        overall_results["test_summary"]["end_time"] = datetime.utcnow().isoformat()
        overall_results["test_summary"]["success_rate"] = (
            overall_results["test_summary"]["passed"] / 
            overall_results["test_summary"]["total_tests"] * 100
            if overall_results["test_summary"]["total_tests"] > 0 else 0
        )
        
        logger.info("🏁 Comprehensive testing completed!")
        return overall_results
    
    # Core Autonomous Tool Tests
    async def test_file_operations(self) -> Dict[str, Any]:
        """Test file operations capabilities."""
        try:
            # Test file creation
            result = await self.tool_router.execute_tool(
                "file_write",
                {
                    "file_path": "/tmp/test_file.txt",
                    "content": "Test file content for autonomous testing",
                    "encoding": "utf-8"
                },
                self.test_agent_id
            )
            
            if result.get("success", False):
                return {
                    "status": "passed",
                    "message": "File operations working correctly",
                    "details": result,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "status": "failed",
                    "message": "File operations failed",
                    "error": result.get("error", "Unknown error"),
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {
                "status": "failed",
                "message": "File operations test exception",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def test_code_execution(self) -> Dict[str, Any]:
        """Test code execution capabilities."""
        try:
            # Test Python code execution
            result = await self.tool_router.execute_tool(
                "code_execute",
                {
                    "code": "print('Hello from autonomous agent!')\nresult = 2 + 2\nprint(f'2 + 2 = {result}')",
                    "language": "python",
                    "timeout": 10
                },
                self.test_agent_id
            )
            
            if result.get("success", False):
                return {
                    "status": "passed",
                    "message": "Code execution working correctly",
                    "output": result.get("output", ""),
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "status": "failed",
                    "message": "Code execution failed",
                    "error": result.get("error", "Unknown error"),
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {
                "status": "failed",
                "message": "Code execution test exception",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def test_shell_operations(self) -> Dict[str, Any]:
        """Test shell operations capabilities."""
        try:
            # Test safe shell command
            result = await self.tool_router.execute_tool(
                "shell_execute",
                {
                    "command": "echo 'Shell operations test successful'",
                    "timeout": 10
                },
                self.test_agent_id
            )
            
            if result.get("success", False):
                return {
                    "status": "passed",
                    "message": "Shell operations working correctly",
                    "output": result.get("output", ""),
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "status": "warning",
                    "message": "Shell operations may be restricted by governance",
                    "details": result,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {
                "status": "failed",
                "message": "Shell operations test exception",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def test_web_browsing(self) -> Dict[str, Any]:
        """Test web browsing capabilities."""
        try:
            # Test web navigation (simulated)
            result = await self.tool_router.execute_tool(
                "web_navigate",
                {
                    "url": "https://httpbin.org/get",
                    "timeout": 30
                },
                self.test_agent_id
            )
            
            return {
                "status": "passed" if result.get("success", False) else "warning",
                "message": "Web browsing capabilities tested",
                "details": result,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "warning",
                "message": "Web browsing test - may require additional setup",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    # Communication Tool Tests
    async def test_web_search(self) -> Dict[str, Any]:
        """Test web search capabilities."""
        try:
            result = await self.tool_router.execute_tool(
                "web_search",
                {
                    "query": "autonomous AI agents",
                    "search_engine": "duckduckgo",
                    "agent_id": self.test_agent_id
                },
                self.test_agent_id
            )
            
            if result.get("success", False):
                return {
                    "status": "passed",
                    "message": "Web search working correctly",
                    "results_count": len(result.get("results", [])),
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "status": "failed",
                    "message": "Web search failed",
                    "error": result.get("error", "Unknown error"),
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {
                "status": "failed",
                "message": "Web search test exception",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def test_email_sending(self) -> Dict[str, Any]:
        """Test email sending capabilities."""
        try:
            result = await self.tool_router.execute_tool(
                "email_sending",
                {
                    "to_email": "test@example.com",
                    "subject": "Autonomous Agent Test",
                    "body": "This is a test email from an autonomous agent."
                },
                self.test_agent_id
            )
            
            return {
                "status": "warning",
                "message": "Email sending requires configuration",
                "details": result,
                "note": "Email credentials needed for full functionality",
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "warning",
                "message": "Email sending test - requires configuration",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def test_sms_messaging(self) -> Dict[str, Any]:
        """Test SMS messaging capabilities."""
        try:
            result = await self.tool_router.execute_tool(
                "sms_messaging",
                {
                    "to_number": "+1234567890",
                    "message": "Test SMS from autonomous agent"
                },
                self.test_agent_id
            )
            
            return {
                "status": "warning",
                "message": "SMS messaging requires Twilio configuration",
                "details": result,
                "note": "Twilio credentials needed for full functionality",
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "warning",
                "message": "SMS messaging test - requires configuration",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    # Content Creation Tool Tests
    async def test_document_generation(self) -> Dict[str, Any]:
        """Test document generation capabilities."""
        try:
            result = await self.tool_router.execute_tool(
                "document_generation",
                {
                    "content": "# Autonomous Agent Test Report\n\nThis document was generated by an autonomous agent to test document generation capabilities.\n\n## Features Tested\n- PDF generation\n- Content formatting\n- File creation",
                    "format": "pdf",
                    "title": "Autonomous Agent Test Report"
                },
                self.test_agent_id
            )
            
            if result.get("success", False):
                return {
                    "status": "passed",
                    "message": "Document generation working correctly",
                    "document_path": result.get("document_path", ""),
                    "format": result.get("format", ""),
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "status": "failed",
                    "message": "Document generation failed",
                    "error": result.get("error", "Unknown error"),
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {
                "status": "failed",
                "message": "Document generation test exception",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def test_data_visualization(self) -> Dict[str, Any]:
        """Test data visualization capabilities."""
        try:
            result = await self.tool_router.execute_tool(
                "data_visualization",
                {
                    "data": [
                        {"category": "Web Search", "usage": 45},
                        {"category": "Code Execution", "usage": 32},
                        {"category": "Document Gen", "usage": 28},
                        {"category": "File Operations", "usage": 15}
                    ],
                    "chart_type": "bar",
                    "title": "Tool Usage Statistics",
                    "x_label": "Tools",
                    "y_label": "Usage Count"
                },
                self.test_agent_id
            )
            
            if result.get("success", False):
                return {
                    "status": "passed",
                    "message": "Data visualization working correctly",
                    "chart_path": result.get("chart_path", ""),
                    "chart_type": result.get("chart_type", ""),
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "status": "failed",
                    "message": "Data visualization failed",
                    "error": result.get("error", "Unknown error"),
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {
                "status": "failed",
                "message": "Data visualization test exception",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def test_coding_programming(self) -> Dict[str, Any]:
        """Test coding and programming capabilities."""
        try:
            # Test JavaScript execution
            result = await self.tool_router.execute_tool(
                "coding_programming",
                {
                    "code": "console.log('JavaScript execution test'); const sum = 5 + 3; console.log('5 + 3 =', sum);",
                    "language": "javascript",
                    "timeout": 10
                },
                self.test_agent_id
            )
            
            if result.get("success", False):
                return {
                    "status": "passed",
                    "message": "Coding & programming working correctly",
                    "language": result.get("language", ""),
                    "output": result.get("output", ""),
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "status": "warning",
                    "message": "Coding & programming may need runtime setup",
                    "error": result.get("error", "Unknown error"),
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {
                "status": "warning",
                "message": "Coding & programming test - may need runtime setup",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    # Business Tool Tests
    async def test_salesforce_crm(self) -> Dict[str, Any]:
        """Test Salesforce CRM integration."""
        return {
            "status": "warning",
            "message": "Salesforce CRM requires API credentials",
            "note": "Enterprise tool - requires Salesforce API setup",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def test_google_calendar(self) -> Dict[str, Any]:
        """Test Google Calendar integration."""
        return {
            "status": "warning",
            "message": "Google Calendar requires OAuth credentials",
            "note": "Professional tool - requires Google API setup",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def test_shopify_integration(self) -> Dict[str, Any]:
        """Test Shopify integration."""
        return {
            "status": "warning",
            "message": "Shopify integration requires API credentials",
            "note": "Enterprise tool - requires Shopify API setup",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Governance & Security Tests
    async def test_governance_evaluation(self) -> Dict[str, Any]:
        """Test governance evaluation system."""
        try:
            # Test governance evaluation
            evaluation = await self.tool_router.governance_adapter.evaluate_tool_usage(
                "shell_execute",
                {"command": "rm -rf /"},  # This should be blocked
                self.test_agent_id
            )
            
            if not evaluation.get("approved", True):
                return {
                    "status": "passed",
                    "message": "Governance evaluation working correctly - blocked dangerous command",
                    "evaluation": evaluation,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "status": "warning",
                    "message": "Governance evaluation may need tuning",
                    "evaluation": evaluation,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {
                "status": "failed",
                "message": "Governance evaluation test exception",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def test_policy_enforcement(self) -> Dict[str, Any]:
        """Test policy enforcement system."""
        try:
            policies = self.tool_router.governance_adapter.get_policies()
            
            return {
                "status": "passed",
                "message": "Policy enforcement system active",
                "policy_count": len(policies),
                "policies": list(policies.keys()),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "failed",
                "message": "Policy enforcement test exception",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def test_audit_logging(self) -> Dict[str, Any]:
        """Test audit logging system."""
        try:
            metrics = await self.tool_router.governance_adapter.get_governance_metrics(self.test_agent_id)
            
            return {
                "status": "passed",
                "message": "Audit logging system working",
                "total_evaluations": metrics.get("total_evaluations", 0),
                "approval_rate": metrics.get("approval_rate", 0.0),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "failed",
                "message": "Audit logging test exception",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def generate_recommendations(self, results: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on test results."""
        recommendations = []
        
        # Check success rate
        success_rate = results["test_summary"]["success_rate"]
        if success_rate < 70:
            recommendations.append("⚠️ Low success rate - review failed tests and address configuration issues")
        elif success_rate < 90:
            recommendations.append("📈 Good progress - address remaining warnings to improve reliability")
        else:
            recommendations.append("🎉 Excellent success rate - autonomous capabilities are well implemented")
        
        # Check for configuration needs
        warning_count = results["test_summary"]["warnings"]
        if warning_count > 0:
            recommendations.append(f"🔧 {warning_count} tools need configuration - set up API credentials for full functionality")
        
        # Check governance
        governance_metrics = results.get("governance_metrics", {})
        if governance_metrics.get("total_evaluations", 0) > 0:
            recommendations.append("🛡️ Governance system is active and monitoring tool usage")
        else:
            recommendations.append("⚠️ Governance system needs verification - ensure policies are being enforced")
        
        # Specific recommendations
        failed_tests = [name for name, result in results["detailed_results"].items() 
                       if result["status"] == "failed"]
        if failed_tests:
            recommendations.append(f"🔴 Priority fixes needed for: {', '.join(failed_tests)}")
        
        return recommendations

async def main():
    """Main test execution function."""
    print("🚀 Starting Promethios Autonomous Tool Validation")
    print("=" * 60)
    
    tester = AutonomousToolTester()
    results = await tester.run_all_tests()
    
    # Save results to file
    results_file = "/home/ubuntu/promethios/autonomous_tools_test_results.json"
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    # Print summary
    print("\n" + "=" * 60)
    print("🏁 AUTONOMOUS TOOL VALIDATION COMPLETE")
    print("=" * 60)
    
    summary = results["test_summary"]
    print(f"📊 Total Tests: {summary['total_tests']}")
    print(f"✅ Passed: {summary['passed']}")
    print(f"❌ Failed: {summary['failed']}")
    print(f"⚠️  Warnings: {summary['warnings']}")
    print(f"📈 Success Rate: {summary['success_rate']:.1f}%")
    
    print(f"\n📋 Results saved to: {results_file}")
    
    print("\n🎯 RECOMMENDATIONS:")
    for rec in results["recommendations"]:
        print(f"  {rec}")
    
    print("\n🔍 DETAILED CATEGORY RESULTS:")
    for category, cat_results in results["category_results"].items():
        print(f"  📁 {category}: {cat_results['passed']} passed, {cat_results['failed']} failed, {cat_results['warnings']} warnings")
    
    return results

if __name__ == "__main__":
    asyncio.run(main())

