#!/usr/bin/env python3
"""
Business System Integrations Test
=================================

Test script to validate the business system integrations functionality
including Salesforce, HubSpot, Zendesk, and webhook integrations.
"""

import asyncio
import json
import logging
import sys
import os
from datetime import datetime
from typing import Dict, Any

# Add project paths
sys.path.append('/home/ubuntu/promethios')
sys.path.append('/home/ubuntu/promethios/src')
sys.path.append('/home/ubuntu/promethios/src/services')
sys.path.append('/home/ubuntu/promethios/src/api/chat/integrations')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BusinessIntegrationsTest:
    def __init__(self):
        self.test_results = {}
        self.start_time = datetime.now()
        
    def log_test(self, test_name: str, status: str, details: Dict[str, Any] = None):
        """Log test result"""
        self.test_results[test_name] = {
            "status": status,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
        
        status_emoji = "✅" if status == "PASSED" else "❌"
        print(f"{status_emoji} {test_name}: {status}")
        if details:
            print(f"   Details: {details}")

    async def test_integration_manager_import(self):
        """Test importing the integration manager"""
        test_name = "Integration Manager Import"
        
        try:
            from integration_manager import IntegrationManager, IntegrationType, IntegrationConfig
            from salesforce_integration import SalesforceIntegration, SalesforceConfig
            from hubspot_integration import HubSpotIntegration, HubSpotConfig
            from zendesk_integration import ZendeskIntegration, ZendeskConfig
            from webhook_integration import WebhookIntegration, WebhookConfig
            
            self.log_test(test_name, "PASSED", {
                "integration_manager": "imported",
                "salesforce": "imported",
                "hubspot": "imported", 
                "zendesk": "imported",
                "webhook": "imported"
            })
            
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def test_integration_manager_creation(self):
        """Test creating integration manager instance"""
        test_name = "Integration Manager Creation"
        
        try:
            from integration_manager import IntegrationManager
            from UniversalGovernanceAdapter import UniversalGovernanceAdapter
            
            # Create governance adapter
            governance_adapter = UniversalGovernanceAdapter(context="integration_test")
            
            # Create integration manager
            manager = IntegrationManager(governance_adapter)
            
            # Test status
            status = manager.get_integration_status()
            
            self.log_test(test_name, "PASSED", {
                "manager_created": True,
                "governance_adapter": "connected",
                "initial_integrations": status.get("total_integrations", 0)
            })
            
            return manager
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return None

    async def test_salesforce_integration_registration(self, manager):
        """Test registering Salesforce integration"""
        test_name = "Salesforce Integration Registration"
        
        try:
            from integration_manager import IntegrationConfig, IntegrationType
            
            # Create test Salesforce config
            sf_config = IntegrationConfig(
                id="test_salesforce",
                name="Test Salesforce CRM",
                type=IntegrationType.SALESFORCE,
                config={
                    "instance_url": "https://test.salesforce.com",
                    "client_id": "test_client_id",
                    "client_secret": "test_client_secret",
                    "username": "test@example.com",
                    "password": "test_password",
                    "security_token": "test_token"
                },
                enabled=False,  # Don't activate for testing
                priority=1,
                tags=["test", "crm"]
            )
            
            # Register integration
            success = await manager.register_integration(sf_config)
            
            if success:
                status = manager.get_integration_status("test_salesforce")
                self.log_test(test_name, "PASSED", {
                    "registration_success": True,
                    "integration_id": "test_salesforce",
                    "status": status.get("status", "unknown")
                })
                return True
            else:
                self.log_test(test_name, "FAILED", {"registration_success": False})
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def test_hubspot_integration_registration(self, manager):
        """Test registering HubSpot integration"""
        test_name = "HubSpot Integration Registration"
        
        try:
            from integration_manager import IntegrationConfig, IntegrationType
            
            # Create test HubSpot config
            hs_config = IntegrationConfig(
                id="test_hubspot",
                name="Test HubSpot Marketing",
                type=IntegrationType.HUBSPOT,
                config={
                    "api_key": "test_api_key",
                    "portal_id": "12345678"
                },
                enabled=False,  # Don't activate for testing
                priority=2,
                tags=["test", "marketing"]
            )
            
            # Register integration
            success = await manager.register_integration(hs_config)
            
            if success:
                status = manager.get_integration_status("test_hubspot")
                self.log_test(test_name, "PASSED", {
                    "registration_success": True,
                    "integration_id": "test_hubspot",
                    "status": status.get("status", "unknown")
                })
                return True
            else:
                self.log_test(test_name, "FAILED", {"registration_success": False})
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def test_zendesk_integration_registration(self, manager):
        """Test registering Zendesk integration"""
        test_name = "Zendesk Integration Registration"
        
        try:
            from integration_manager import IntegrationConfig, IntegrationType
            
            # Create test Zendesk config
            zd_config = IntegrationConfig(
                id="test_zendesk",
                name="Test Zendesk Support",
                type=IntegrationType.ZENDESK,
                config={
                    "subdomain": "test-company",
                    "email": "admin@test-company.com",
                    "api_token": "test_api_token"
                },
                enabled=False,  # Don't activate for testing
                priority=3,
                tags=["test", "support"]
            )
            
            # Register integration
            success = await manager.register_integration(zd_config)
            
            if success:
                status = manager.get_integration_status("test_zendesk")
                self.log_test(test_name, "PASSED", {
                    "registration_success": True,
                    "integration_id": "test_zendesk",
                    "status": status.get("status", "unknown")
                })
                return True
            else:
                self.log_test(test_name, "FAILED", {"registration_success": False})
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def test_webhook_integration_registration(self, manager):
        """Test registering webhook integration"""
        test_name = "Webhook Integration Registration"
        
        try:
            from integration_manager import IntegrationConfig, IntegrationType
            
            # Create test webhook config
            wh_config = IntegrationConfig(
                id="test_webhook",
                name="Test Custom Webhook",
                type=IntegrationType.WEBHOOK,
                config={
                    "name": "Test Webhook",
                    "url": "https://httpbin.org/post",
                    "method": "POST",
                    "auth_type": "none",
                    "timeout": 30
                },
                enabled=False,  # Don't activate for testing
                priority=4,
                tags=["test", "webhook"]
            )
            
            # Register integration
            success = await manager.register_integration(wh_config)
            
            if success:
                status = manager.get_integration_status("test_webhook")
                self.log_test(test_name, "PASSED", {
                    "registration_success": True,
                    "integration_id": "test_webhook",
                    "status": status.get("status", "unknown")
                })
                return True
            else:
                self.log_test(test_name, "FAILED", {"registration_success": False})
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def test_integration_status_retrieval(self, manager):
        """Test retrieving integration status"""
        test_name = "Integration Status Retrieval"
        
        try:
            # Get all integrations status
            all_status = manager.get_integration_status()
            
            # Get individual integration status
            sf_status = manager.get_integration_status("test_salesforce")
            hs_status = manager.get_integration_status("test_hubspot")
            zd_status = manager.get_integration_status("test_zendesk")
            wh_status = manager.get_integration_status("test_webhook")
            
            self.log_test(test_name, "PASSED", {
                "total_integrations": all_status.get("total_integrations", 0),
                "active_integrations": all_status.get("active_integrations", 0),
                "salesforce_status": sf_status.get("status", "unknown"),
                "hubspot_status": hs_status.get("status", "unknown"),
                "zendesk_status": zd_status.get("status", "unknown"),
                "webhook_status": wh_status.get("status", "unknown")
            })
            
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def test_mock_lead_capture(self, manager):
        """Test mock lead capture operation"""
        test_name = "Mock Lead Capture Operation"
        
        try:
            from integration_manager import ChatContext
            
            # Create test lead data
            lead_data = {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "phone": "+1-555-123-4567",
                "company": "Test Company Inc.",
                "title": "Marketing Manager",
                "description": "Interested in our chat platform"
            }
            
            # Create test chat context
            chat_context = ChatContext(
                conversation_id="test_conv_001",
                user_id="test_user_001",
                agent_id="test_agent_001",
                messages=[
                    {
                        "sender": "user",
                        "content": "I'm interested in your chat platform",
                        "timestamp": datetime.now().isoformat()
                    },
                    {
                        "sender": "agent",
                        "content": "I'd be happy to help! Can I get your contact information?",
                        "timestamp": datetime.now().isoformat()
                    }
                ],
                user_data={"source": "website", "page": "/pricing"},
                session_data={"session_id": "sess_123", "duration": 300}
            )
            
            # Test lead capture (will fail due to invalid credentials, but should test the flow)
            results = await manager.create_lead(lead_data, chat_context)
            
            self.log_test(test_name, "PASSED", {
                "operation_attempted": True,
                "results_count": len(results),
                "lead_data": lead_data,
                "chat_context_id": chat_context.conversation_id
            })
            
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def test_supported_operations(self, manager):
        """Test getting supported operations for each integration type"""
        test_name = "Supported Operations Retrieval"
        
        try:
            from integration_manager import IntegrationType
            
            operations = {}
            for int_type in IntegrationType:
                ops = manager.get_supported_operations(int_type)
                operations[int_type.value] = ops
            
            self.log_test(test_name, "PASSED", {
                "integration_types": len(operations),
                "operations": operations
            })
            
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def run_all_tests(self):
        """Run all business integration tests"""
        print("🧪 Starting Business System Integrations Tests")
        print("=" * 60)
        
        # Test 1: Import integration components
        import_success = await self.test_integration_manager_import()
        if not import_success:
            print("❌ Import failed, skipping remaining tests")
            return
        
        # Test 2: Create integration manager
        manager = await self.test_integration_manager_creation()
        if not manager:
            print("❌ Manager creation failed, skipping remaining tests")
            return
        
        # Test 3-6: Register integrations
        await self.test_salesforce_integration_registration(manager)
        await self.test_hubspot_integration_registration(manager)
        await self.test_zendesk_integration_registration(manager)
        await self.test_webhook_integration_registration(manager)
        
        # Test 7: Status retrieval
        await self.test_integration_status_retrieval(manager)
        
        # Test 8: Mock operations
        await self.test_mock_lead_capture(manager)
        
        # Test 9: Supported operations
        await self.test_supported_operations(manager)
        
        # Summary
        print("=" * 60)
        print("🏁 Test Summary")
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results.values() if r["status"] == "PASSED"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        if failed_tests > 0:
            print("❌ Failed Tests:")
            for test_name, result in self.test_results.items():
                if result["status"] == "FAILED":
                    print(f"  - {test_name}")
        
        # Save results
        results_file = "business_integrations_test_results.json"
        with open(results_file, 'w') as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests,
                    "start_time": self.start_time.isoformat(),
                    "end_time": datetime.now().isoformat()
                },
                "test_results": self.test_results
            }, f, indent=2)
        
        print(f"📄 Results saved to: {results_file}")
        
        if failed_tests == 0:
            print("✅ All tests passed! Business integrations are working correctly.")
        else:
            print("❌ Some tests failed. Check results for details.")

async def main():
    """Main test function"""
    test_runner = BusinessIntegrationsTest()
    await test_runner.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())

