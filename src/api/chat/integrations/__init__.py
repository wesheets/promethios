"""
Chat Business System Integrations
=================================

This module provides integrations with popular business systems for the Promethios Chat platform.

Supported Integrations:
- Salesforce CRM (lead capture, contact management)
- HubSpot (marketing automation, lead scoring)
- Zendesk (support ticket creation, customer service)
- Custom Webhooks (generic integration for any system)
- Slack (team notifications, escalations)
- Microsoft Teams (collaboration, notifications)

Features:
- Real-time data synchronization
- Bi-directional communication
- Governance oversight on all integrations
- Error handling and retry logic
- Rate limiting and API quota management
- Secure credential management
"""

__version__ = "1.0.0"
__author__ = "Promethios Team"

try:
    from salesforce_integration import SalesforceIntegration
    from hubspot_integration import HubSpotIntegration
    from zendesk_integration import ZendeskIntegration
    from webhook_integration import WebhookIntegration
    from integration_manager import IntegrationManager
    
    __all__ = [
        "SalesforceIntegration",
        "HubSpotIntegration", 
        "ZendeskIntegration",
        "WebhookIntegration",
        "IntegrationManager"
    ]
except ImportError as e:
    print(f"Warning: Could not import all integration components: {e}")
    __all__ = []

