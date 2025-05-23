#!/usr/bin/env python3
"""
Trust Decay API for Promethios Phase 5.9

This module implements the API endpoints for interacting with the Trust Decay Engine,
Trust Regeneration Protocol, Trust Metrics Calculator, and Trust Monitoring Service.

Codex Contract: v2025.05.21
Phase ID: 5.9
"""

import json
import os
import re
import logging
from datetime import datetime, timedelta
import uuid
from fastapi import FastAPI, HTTPException, Depends, Query, Path, Body
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Union

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrustDecayAPI:
    """
    API for interacting with the Trust Decay Engine and related components.
    
    This component provides API endpoints for trust level retrieval, decay triggering,
    regeneration triggering, alert management, and configuration management.
    
    Codex Contract: v2025.05.21
    Phase ID: 5.9
    """
    
    def __init__(self, decay_engine, regeneration_protocol, metrics_calculator, monitoring_service, config=None):
        """
        Initialize the Trust Decay API with required components.
        
        Args:
            decay_engine (TrustDecayEngine): Instance of TrustDecayEngine
            regeneration_protocol (TrustRegenerationProtocol): Instance of TrustRegenerationProtocol
            metrics_calculator (TrustMetricsCalculator): Instance of TrustMetricsCalculator
            monitoring_service (TrustMonitoringService): Instance of TrustMonitoringService
            config (dict, optional): Configuration dictionary for API parameters
        """
        # Codex contract tethering
        self.contract_version = "v2025.05.21"
        self.phase_id = "5.9"
        self.codex_clauses = ["5.9", "11.3", "11.7"]
        
        # Store component instances
        self.decay_engine = decay_engine
        self.regeneration_protocol = regeneration_protocol
        self.metrics_calculator = metrics_calculator
        self.monitoring_service = monitoring_service
        
        # Initialize configuration
        self.config = config or self._load_default_config()
        
        # Initialize FastAPI app
        self.app = FastAPI(
            title="Trust Decay API",
            description="API for interacting with the Trust Decay Engine",
            version="1.0.0"
        )
        
        # Set up authentication
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
        
        # Register routes
        self._register_routes()
        
        # Perform pre-loop tether check
        if not self._pre_loop_tether_check():
            raise ValueError("Pre-loop tether check failed for TrustDecayAPI")
        
        logger.info("TrustDecayAPI initialized with contract version %s", self.contract_version)
    
    def _pre_loop_tether_check(self):
        """
        Perform pre-loop tether check to verify contract compliance.
        
        Returns:
            bool: True if tether check passes, False otherwise.
        """
        # Verify contract version format
        if not re.match(r"v\d{4}\.\d{2}\.\d{2}", self.contract_version):
            logger.error("Invalid contract version format: %s", self.contract_version)
            return False
            
        # Verify phase ID format
        if not re.match(r"5\.\d+", self.phase_id):
            logger.error("Invalid phase ID format: %s", self.phase_id)
            return False
            
        # Verify codex clauses
        if "5.9" not in self.codex_clauses:
            logger.error("Missing required codex clause 5.9")
            return False
            
        # Verify required components
        if not self.decay_engine or not self.regeneration_protocol or not self.metrics_calculator or not self.monitoring_service:
            logger.error("Missing required components")
            return False
            
        return True
    
    def _load_default_config(self):
        """
        Load default configuration for the Trust Decay API.
        
        Returns:
            dict: Default configuration dictionary.
        """
        return {
            "api": {
                "rate_limit": 100,
                "auth_required": True,
                "admin_roles": ["admin", "security_officer"]
            }
        }
    
    def _register_routes(self):
        """Register API routes."""
        
        # Trust level retrieval endpoints
        @self.app.get("/trust/{entity_id}")
        async def get_trust_level(entity_id: str, token: str = Depends(self.oauth2_scheme)):
            """Get current trust level for an entity."""
            self._validate_auth(token)
            
            metrics = self.metrics_calculator.get_entity_metrics(entity_id)
            if not metrics:
                raise HTTPException(status_code=404, detail=f"Entity {entity_id} not found")
                
            return metrics
        
        @self.app.get("/trust/{entity_id}/history")
        async def get_trust_history(
            entity_id: str, 
            dimension: Optional[str] = None, 
            limit: Optional[int] = 100,
            token: str = Depends(self.oauth2_scheme)
        ):
            """Get trust history for an entity."""
            self._validate_auth(token)
            
            if dimension:
                history = self.metrics_calculator.get_dimension_history(entity_id, dimension, limit)
                if history is None:
                    raise HTTPException(status_code=404, detail=f"Dimension {dimension} not found for entity {entity_id}")
            else:
                history = self.metrics_calculator.get_aggregate_history(entity_id, limit)
                if history is None:
                    raise HTTPException(status_code=404, detail=f"Entity {entity_id} not found")
                    
            return {"entity_id": entity_id, "dimension": dimension, "history": history}
        
        # Decay triggering endpoint
        @self.app.post("/trust/{entity_id}/decay")
        async def trigger_decay(
            entity_id: str, 
            decay_type: str = Body(..., embed=True),
            details: Dict[str, Any] = Body({}, embed=True),
            token: str = Depends(self.oauth2_scheme)
        ):
            """Trigger decay for an entity."""
            self._validate_auth(token)
            
            # Get current trust level
            metrics = self.metrics_calculator.get_entity_metrics(entity_id)
            if not metrics:
                raise HTTPException(status_code=404, detail=f"Entity {entity_id} not found")
                
            current_trust = metrics["current_aggregate"]
            if current_trust is None:
                raise HTTPException(status_code=400, detail=f"No aggregate trust level available for entity {entity_id}")
                
            # Apply decay based on type
            if decay_type == "time":
                last_update = datetime.fromisoformat(details.get("last_update", datetime.now().isoformat()))
                new_trust = self.decay_engine.calculate_time_decay(current_trust, last_update)
            elif decay_type == "event":
                event_type = details.get("event_type")
                if not event_type:
                    raise HTTPException(status_code=400, detail="event_type is required for event decay")
                new_trust = self.decay_engine.apply_event_decay(current_trust, event_type, entity_id)
            elif decay_type == "context":
                source_context = details.get("source_context")
                target_context = details.get("target_context")
                if not source_context or not target_context:
                    raise HTTPException(status_code=400, detail="source_context and target_context are required for context decay")
                new_trust = self.decay_engine.apply_context_decay(current_trust, source_context, target_context, entity_id)
            else:
                raise HTTPException(status_code=400, detail=f"Invalid decay type: {decay_type}")
                
            # Update metrics
            self.metrics_calculator.calculate_dimension_metric(entity_id, "temporal", new_trust)
            aggregate = self.metrics_calculator.calculate_aggregate_metric(entity_id)
            
            # Check for alerts
            alerts = self.monitoring_service.check_entity_thresholds(entity_id)
            
            return {
                "success": True,
                "entity_id": entity_id,
                "decay_type": decay_type,
                "previous_trust": current_trust,
                "new_trust": new_trust,
                "decay_amount": current_trust - new_trust,
                "new_aggregate": aggregate,
                "alerts": alerts
            }
        
        # Regeneration triggering endpoint
        @self.app.post("/trust/{entity_id}/regenerate")
        async def trigger_regeneration(
            entity_id: str, 
            regeneration_type: str = Body(..., embed=True),
            details: Dict[str, Any] = Body({}, embed=True),
            token: str = Depends(self.oauth2_scheme)
        ):
            """Trigger regeneration for an entity."""
            self._validate_auth(token)
            
            # Get current trust level
            metrics = self.metrics_calculator.get_entity_metrics(entity_id)
            if not metrics:
                raise HTTPException(status_code=404, detail=f"Entity {entity_id} not found")
                
            current_trust = metrics["current_aggregate"]
            if current_trust is None:
                raise HTTPException(status_code=400, detail=f"No aggregate trust level available for entity {entity_id}")
                
            # Apply regeneration based on type
            if regeneration_type == "verification":
                verification_result = details.get("verification_result", False)
                new_trust = self.regeneration_protocol.apply_verification_regeneration(
                    current_trust, verification_result, entity_id
                )
            elif regeneration_type == "attestation":
                attestation_type = details.get("attestation_type")
                if not attestation_type:
                    raise HTTPException(status_code=400, detail="attestation_type is required for attestation regeneration")
                attestation_data = details.get("attestation_data", {})
                attestation_data["entity_id"] = entity_id
                new_trust = self.regeneration_protocol.apply_attestation_regeneration(
                    current_trust, attestation_type, attestation_data
                )
            elif regeneration_type == "time":
                last_update = datetime.fromisoformat(details.get("last_update", datetime.now().isoformat()))
                new_trust = self.regeneration_protocol.apply_time_regeneration(
                    current_trust, last_update, entity_id=entity_id
                )
            else:
                raise HTTPException(status_code=400, detail=f"Invalid regeneration type: {regeneration_type}")
                
            # Update metrics
            self.metrics_calculator.calculate_dimension_metric(entity_id, "temporal", new_trust)
            aggregate = self.metrics_calculator.calculate_aggregate_metric(entity_id)
            
            # Check for auto-resolution of alerts
            resolved_alerts = self.monitoring_service.check_for_auto_resolution(entity_id)
            
            return {
                "success": True,
                "entity_id": entity_id,
                "regeneration_type": regeneration_type,
                "previous_trust": current_trust,
                "new_trust": new_trust,
                "regeneration_amount": new_trust - current_trust,
                "new_aggregate": aggregate,
                "resolved_alerts": resolved_alerts
            }
        
        # Alert management endpoints
        @self.app.get("/alerts")
        async def get_alerts(
            entity_id: Optional[str] = None,
            level: Optional[str] = None,
            resolved: Optional[bool] = None,
            limit: Optional[int] = 100,
            token: str = Depends(self.oauth2_scheme)
        ):
            """Get alerts, optionally filtered."""
            self._validate_auth(token)
            
            alerts = self.monitoring_service.get_alerts(entity_id, level, resolved, limit)
            return {"alerts": alerts, "count": len(alerts)}
        
        @self.app.post("/alerts/{alert_id}/resolve")
        async def resolve_alert(
            alert_id: str,
            resolution_message: Optional[str] = Body(None, embed=True),
            token: str = Depends(self.oauth2_scheme)
        ):
            """Resolve an alert."""
            self._validate_auth(token)
            
            alert = self.monitoring_service.resolve_alert(alert_id, resolution_message)
            if not alert:
                raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
                
            return {"success": True, "alert": alert}
        
        # Configuration management endpoints
        @self.app.get("/config")
        async def get_config(token: str = Depends(self.oauth2_scheme)):
            """Get current configuration."""
            auth_context = self._validate_auth(token, admin_required=True)
            
            return {
                "decay_engine": self.decay_engine.config,
                "regeneration_protocol": self.regeneration_protocol.config,
                "metrics_calculator": self.metrics_calculator.config,
                "monitoring_service": self.monitoring_service.config,
                "api": self.config["api"]
            }
        
        @self.app.put("/config")
        async def update_config(
            config: Dict[str, Any] = Body(...),
            token: str = Depends(self.oauth2_scheme)
        ):
            """Update configuration."""
            auth_context = self._validate_auth(token, admin_required=True)
            
            result = {}
            
            # Update decay engine config if provided
            if "decay_engine" in config:
                result["decay_engine"] = self.decay_engine.update_config(
                    config["decay_engine"], auth_context
                )
                
            # Update regeneration protocol config if provided
            if "regeneration_protocol" in config:
                result["regeneration_protocol"] = self.regeneration_protocol.update_config(
                    config["regeneration_protocol"], auth_context
                )
                
            # Update metrics calculator config if provided
            if "metrics_calculator" in config:
                result["metrics_calculator"] = self.metrics_calculator.update_config(
                    config["metrics_calculator"], auth_context
                )
                
            # Update monitoring service config if provided
            if "monitoring_service" in config:
                result["monitoring_service"] = self.monitoring_service.update_config(
                    config["monitoring_service"], auth_context
                )
                
            # Update API config if provided
            if "api" in config:
                self.config["api"].update(config["api"])
                result["api"] = self.config["api"]
                
            return {"success": True, "updated_config": result}
    
    def _validate_auth(self, token, admin_required=False):
        """
        Validate authentication token and optionally check admin role.
        
        Args:
            token (str): Authentication token
            admin_required (bool, optional): Whether admin role is required
            
        Returns:
            dict: Authentication context
            
        Raises:
            HTTPException: If authentication fails
        """
        # In a real implementation, this would validate the token
        # and return user information. For this implementation, we'll
        # just return a dummy auth context.
        
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
            
        # Dummy auth context
        auth_context = {
            "user_id": "user_123",
            "roles": ["user"]
        }
        
        # Check admin role if required
        if admin_required and not any(role in self.config["api"]["admin_roles"] for role in auth_context["roles"]):
            raise HTTPException(status_code=403, detail="Admin role required")
            
        return auth_context
    
    def run(self, host="0.0.0.0", port=8000):
        """
        Run the API server.
        
        Args:
            host (str, optional): Host to bind to
            port (int, optional): Port to bind to
        """
        import uvicorn
        uvicorn.run(self.app, host=host, port=port)
    
    def verify_contract_integrity(self):
        """
        Verify the integrity of the contract tethering.
        
        Returns:
            bool: True if contract integrity is verified, False otherwise
        """
        return self._pre_loop_tether_check()
