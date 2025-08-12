"""
Generic Webhook Integration
===========================

Provides flexible webhook integration for connecting to any business system
that supports HTTP webhooks or REST APIs.

Features:
- Outbound webhooks (send data to external systems)
- Inbound webhooks (receive data from external systems)
- Custom payload formatting
- Authentication support (API keys, OAuth, Basic Auth)
- Retry logic and error handling
- Rate limiting and throttling
- Custom field mapping
- Real-time data synchronization
- Governance oversight and audit logging
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Union, Callable
from dataclasses import dataclass, asdict
import aiohttp
import hashlib
import hmac
from urllib.parse import urlencode

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class WebhookConfig:
    """Webhook configuration"""
    name: str
    url: str
    method: str = "POST"
    auth_type: str = "none"  # none, api_key, bearer, basic, oauth
    auth_config: Dict[str, Any] = None
    headers: Dict[str, str] = None
    timeout: int = 30
    retry_attempts: int = 3
    retry_delay: int = 1
    rate_limit: Optional[int] = None  # requests per minute
    
    def __post_init__(self):
        if self.auth_config is None:
            self.auth_config = {}
        if self.headers is None:
            self.headers = {"Content-Type": "application/json"}

@dataclass
class WebhookPayload:
    """Webhook payload data structure"""
    event_type: str
    timestamp: datetime
    data: Dict[str, Any]
    source: str = "promethios_chat"
    version: str = "1.0"
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

@dataclass
class WebhookResponse:
    """Webhook response data structure"""
    success: bool
    status_code: int
    response_data: Optional[Dict] = None
    error_message: Optional[str] = None
    execution_time: float = 0.0
    retry_count: int = 0

class WebhookIntegration:
    """
    Generic Webhook Integration
    
    Provides flexible integration with any system that supports:
    - HTTP webhooks
    - REST APIs
    - Custom data formats
    - Various authentication methods
    """
    
    def __init__(self, config: WebhookConfig, governance_adapter=None):
        self.config = config
        self.governance_adapter = governance_adapter
        self.session = None
        self.rate_limiter = {}
        self.last_request_time = {}
        
        logger.info(f"🔗 [Webhook] Initializing integration: {config.name}")
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers with authentication"""
        headers = self.config.headers.copy()
        
        # Add authentication headers based on type
        if self.config.auth_type == "api_key":
            api_key = self.config.auth_config.get("api_key")
            key_header = self.config.auth_config.get("header_name", "X-API-Key")
            if api_key:
                headers[key_header] = api_key
                
        elif self.config.auth_type == "bearer":
            token = self.config.auth_config.get("token")
            if token:
                headers["Authorization"] = f"Bearer {token}"
                
        elif self.config.auth_type == "basic":
            username = self.config.auth_config.get("username")
            password = self.config.auth_config.get("password")
            if username and password:
                import base64
                auth_string = f"{username}:{password}"
                auth_header = base64.b64encode(auth_string.encode()).decode()
                headers["Authorization"] = f"Basic {auth_header}"
        
        return headers
    
    async def _rate_limit_check(self) -> bool:
        """Check rate limiting"""
        if not self.config.rate_limit:
            return True
        
        now = datetime.now(timezone.utc)
        webhook_name = self.config.name
        
        # Initialize rate limiter for this webhook
        if webhook_name not in self.rate_limiter:
            self.rate_limiter[webhook_name] = []
        
        # Clean old requests (older than 1 minute)
        minute_ago = now.timestamp() - 60
        self.rate_limiter[webhook_name] = [
            req_time for req_time in self.rate_limiter[webhook_name] 
            if req_time > minute_ago
        ]
        
        # Check if we're under the rate limit
        if len(self.rate_limiter[webhook_name]) >= self.config.rate_limit:
            logger.warning(f"⚠️ [Webhook] Rate limit exceeded for {webhook_name}")
            return False
        
        # Add current request to rate limiter
        self.rate_limiter[webhook_name].append(now.timestamp())
        return True
    
    # ============================================================================
    # OUTBOUND WEBHOOKS
    # ============================================================================
    
    async def send_webhook(self, payload: WebhookPayload, custom_data: Dict = None) -> WebhookResponse:
        """Send webhook to external system"""
        start_time = datetime.now(timezone.utc)
        
        try:
            logger.info(f"📤 [Webhook] Sending {payload.event_type} to {self.config.name}")
            
            # Check rate limiting
            if not await self._rate_limit_check():
                return WebhookResponse(
                    success=False,
                    status_code=429,
                    error_message="Rate limit exceeded",
                    execution_time=0.0
                )
            
            # Prepare payload data
            webhook_data = {
                "event_type": payload.event_type,
                "timestamp": payload.timestamp.isoformat(),
                "source": payload.source,
                "version": payload.version,
                "data": payload.data,
                "metadata": payload.metadata
            }
            
            # Add custom data if provided
            if custom_data:
                webhook_data.update(custom_data)
            
            # Get headers with authentication
            headers = self._get_headers()
            
            # Add webhook signature if configured
            if self.config.auth_type == "signature":
                secret = self.config.auth_config.get("secret")
                if secret:
                    payload_str = json.dumps(webhook_data, sort_keys=True)
                    signature = hmac.new(
                        secret.encode(),
                        payload_str.encode(),
                        hashlib.sha256
                    ).hexdigest()
                    headers["X-Webhook-Signature"] = f"sha256={signature}"
            
            # Attempt to send webhook with retries
            for attempt in range(self.config.retry_attempts):
                try:
                    async with self.session.request(
                        method=self.config.method,
                        url=self.config.url,
                        json=webhook_data,
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=self.config.timeout)
                    ) as response:
                        
                        execution_time = (datetime.now(timezone.utc) - start_time).total_seconds()
                        
                        if response.status < 400:
                            # Success
                            try:
                                response_data = await response.json()
                            except:
                                response_data = {"message": await response.text()}
                            
                            logger.info(f"✅ [Webhook] Successfully sent to {self.config.name}: {response.status}")
                            
                            # Log webhook for governance
                            if self.governance_adapter:
                                await self.governance_adapter.createAuditEntry({
                                    "interaction_id": f"webhook_{self.config.name}_{payload.timestamp.timestamp()}",
                                    "agent_id": "webhook_integration",
                                    "event_type": "webhook_sent",
                                    "webhook_name": self.config.name,
                                    "webhook_url": self.config.url,
                                    "event_type_sent": payload.event_type,
                                    "status_code": response.status,
                                    "integration": "webhook",
                                    "status": "success"
                                })
                            
                            return WebhookResponse(
                                success=True,
                                status_code=response.status,
                                response_data=response_data,
                                execution_time=execution_time,
                                retry_count=attempt
                            )
                        else:
                            # Error response
                            error_text = await response.text()
                            logger.error(f"❌ [Webhook] Error from {self.config.name}: {response.status} - {error_text}")
                            
                            if attempt < self.config.retry_attempts - 1:
                                logger.info(f"🔄 [Webhook] Retrying in {self.config.retry_delay} seconds (attempt {attempt + 1})")
                                await asyncio.sleep(self.config.retry_delay)
                            else:
                                return WebhookResponse(
                                    success=False,
                                    status_code=response.status,
                                    error_message=error_text,
                                    execution_time=execution_time,
                                    retry_count=attempt + 1
                                )
                
                except asyncio.TimeoutError:
                    logger.error(f"⏰ [Webhook] Timeout sending to {self.config.name}")
                    if attempt < self.config.retry_attempts - 1:
                        await asyncio.sleep(self.config.retry_delay)
                    else:
                        return WebhookResponse(
                            success=False,
                            status_code=408,
                            error_message="Request timeout",
                            execution_time=(datetime.now(timezone.utc) - start_time).total_seconds(),
                            retry_count=attempt + 1
                        )
                
                except Exception as e:
                    logger.error(f"❌ [Webhook] Exception sending to {self.config.name}: {e}")
                    if attempt < self.config.retry_attempts - 1:
                        await asyncio.sleep(self.config.retry_delay)
                    else:
                        return WebhookResponse(
                            success=False,
                            status_code=500,
                            error_message=str(e),
                            execution_time=(datetime.now(timezone.utc) - start_time).total_seconds(),
                            retry_count=attempt + 1
                        )
            
        except Exception as e:
            logger.error(f"❌ [Webhook] Unexpected error: {e}")
            return WebhookResponse(
                success=False,
                status_code=500,
                error_message=str(e),
                execution_time=(datetime.now(timezone.utc) - start_time).total_seconds()
            )
    
    async def send_chat_event(self, event_type: str, chat_data: Dict, user_data: Dict = None) -> WebhookResponse:
        """Send chat-specific event via webhook"""
        try:
            # Prepare chat event payload
            payload = WebhookPayload(
                event_type=event_type,
                timestamp=datetime.now(timezone.utc),
                data={
                    "chat": chat_data,
                    "user": user_data or {},
                    "source": "promethios_chat"
                },
                metadata={
                    "webhook_name": self.config.name,
                    "integration_type": "chat_webhook"
                }
            )
            
            return await self.send_webhook(payload)
            
        except Exception as e:
            logger.error(f"❌ [Webhook] Chat event error: {e}")
            return WebhookResponse(
                success=False,
                status_code=500,
                error_message=str(e)
            )
    
    async def send_lead_capture(self, lead_data: Dict, chat_context: Dict = None) -> WebhookResponse:
        """Send lead capture event via webhook"""
        try:
            # Prepare lead capture payload
            payload_data = {
                "lead": lead_data,
                "source": "chat",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            if chat_context:
                payload_data["chat_context"] = chat_context
            
            payload = WebhookPayload(
                event_type="lead_captured",
                timestamp=datetime.now(timezone.utc),
                data=payload_data,
                metadata={
                    "webhook_name": self.config.name,
                    "integration_type": "lead_webhook"
                }
            )
            
            return await self.send_webhook(payload)
            
        except Exception as e:
            logger.error(f"❌ [Webhook] Lead capture error: {e}")
            return WebhookResponse(
                success=False,
                status_code=500,
                error_message=str(e)
            )
    
    # ============================================================================
    # INBOUND WEBHOOK PROCESSING
    # ============================================================================
    
    def verify_webhook_signature(self, payload: str, signature: str, secret: str) -> bool:
        """Verify webhook signature for security"""
        try:
            # Extract signature from header (format: sha256=<signature>)
            if signature.startswith("sha256="):
                signature = signature[7:]
            
            # Calculate expected signature
            expected_signature = hmac.new(
                secret.encode(),
                payload.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception as e:
            logger.error(f"❌ [Webhook] Signature verification error: {e}")
            return False
    
    async def process_inbound_webhook(self, payload: Dict, headers: Dict = None, signature: str = None) -> Dict:
        """Process inbound webhook from external system"""
        try:
            logger.info(f"📥 [Webhook] Processing inbound webhook from {self.config.name}")
            
            # Verify signature if configured
            if self.config.auth_type == "signature" and signature:
                secret = self.config.auth_config.get("secret")
                if secret:
                    payload_str = json.dumps(payload, sort_keys=True)
                    if not self.verify_webhook_signature(payload_str, signature, secret):
                        logger.error("❌ [Webhook] Invalid signature")
                        return {"success": False, "error": "Invalid signature"}
            
            # Log inbound webhook for governance
            if self.governance_adapter:
                await self.governance_adapter.createAuditEntry({
                    "interaction_id": f"webhook_inbound_{self.config.name}_{datetime.now().timestamp()}",
                    "agent_id": "webhook_integration",
                    "event_type": "webhook_received",
                    "webhook_name": self.config.name,
                    "payload_size": len(json.dumps(payload)),
                    "integration": "webhook",
                    "status": "success"
                })
            
            # Process the webhook payload
            result = {
                "success": True,
                "webhook_name": self.config.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "payload": payload,
                "headers": headers or {}
            }
            
            logger.info(f"✅ [Webhook] Successfully processed inbound webhook from {self.config.name}")
            return result
            
        except Exception as e:
            logger.error(f"❌ [Webhook] Inbound webhook processing error: {e}")
            return {"success": False, "error": str(e)}
    
    # ============================================================================
    # UTILITY METHODS
    # ============================================================================
    
    async def test_connection(self) -> bool:
        """Test the webhook connection"""
        try:
            # Send a test payload
            test_payload = WebhookPayload(
                event_type="connection_test",
                timestamp=datetime.now(timezone.utc),
                data={"test": True, "message": "Connection test from Promethios Chat"},
                metadata={"test": True}
            )
            
            response = await self.send_webhook(test_payload)
            
            if response.success:
                logger.info(f"✅ [Webhook] Connection test successful for {self.config.name}")
                return True
            else:
                logger.error(f"❌ [Webhook] Connection test failed for {self.config.name}: {response.error_message}")
                return False
                
        except Exception as e:
            logger.error(f"❌ [Webhook] Connection test error: {e}")
            return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get integration status"""
        return {
            "integration": "webhook",
            "name": self.config.name,
            "url": self.config.url,
            "method": self.config.method,
            "auth_type": self.config.auth_type,
            "rate_limit": self.config.rate_limit,
            "retry_attempts": self.config.retry_attempts,
            "status": "active"
        }

