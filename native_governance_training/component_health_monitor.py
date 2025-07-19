#!/usr/bin/env python3
"""
Mock Component Health Monitor for Testing Governance Wiring Infrastructure

This module provides a mock implementation of the component health monitoring
system for testing the wiring infrastructure when the full promethios modules
aren't available.
"""

import asyncio
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime

logger = logging.getLogger(__name__)

class ComponentHealthMonitor:
    """Mock implementation of ComponentHealthMonitor for testing wiring."""
    
    def __init__(self, component_name: str, component: Any, health_check_interval: int = 30):
        """
        Initialize the mock health monitor.
        
        Args:
            component_name: Name of the component to monitor
            component: The component instance to monitor
            health_check_interval: Interval between health checks in seconds
        """
        self.component_name = component_name
        self.component = component
        self.health_check_interval = health_check_interval
        self._monitoring = False
        self._health_status = 'unknown'
        self._last_check = None
        self._health_callback: Optional[Callable] = None
        
    async def start_monitoring(self, health_callback: Optional[Callable] = None):
        """Start monitoring the component health."""
        self._health_callback = health_callback
        self._monitoring = True
        self._health_status = 'healthy'
        self._last_check = datetime.now()
        
        logger.info(f"Started health monitoring for {self.component_name}")
        
        # Start background monitoring task
        asyncio.create_task(self._monitor_health())
        
    async def stop_monitoring(self):
        """Stop monitoring the component health."""
        self._monitoring = False
        logger.info(f"Stopped health monitoring for {self.component_name}")
        
    async def _monitor_health(self):
        """Background task to monitor component health."""
        while self._monitoring:
            try:
                # Perform health check
                health_status = await self._check_component_health()
                
                # Update status
                old_status = self._health_status
                self._health_status = health_status.get('status', 'unknown')
                self._last_check = datetime.now()
                
                # Notify callback if status changed
                if old_status != self._health_status and self._health_callback:
                    try:
                        await self._health_callback(health_status)
                    except Exception as e:
                        logger.error(f"Health callback failed for {self.component_name}: {e}")
                
                # Wait for next check
                await asyncio.sleep(self.health_check_interval)
                
            except Exception as e:
                logger.error(f"Health monitoring error for {self.component_name}: {e}")
                self._health_status = 'error'
                await asyncio.sleep(self.health_check_interval)
                
    async def _check_component_health(self) -> Dict[str, Any]:
        """Check the health of the monitored component."""
        try:
            # Try to call component's health check method if available
            if hasattr(self.component, 'get_health_status'):
                health_status = await self.component.get_health_status()
            elif hasattr(self.component, 'health_check'):
                health_status = await self.component.health_check()
            else:
                # Basic health check - just verify component exists and is callable
                health_status = {
                    'status': 'healthy' if self.component is not None else 'unhealthy',
                    'component_name': self.component_name,
                    'component_type': type(self.component).__name__,
                    'last_check': datetime.now().isoformat(),
                    'monitor_type': 'mock'
                }
                
            return health_status
            
        except Exception as e:
            return {
                'status': 'error',
                'component_name': self.component_name,
                'error': str(e),
                'last_check': datetime.now().isoformat(),
                'monitor_type': 'mock'
            }
            
    async def get_current_health(self) -> Dict[str, Any]:
        """Get the current health status of the component."""
        return {
            'component_name': self.component_name,
            'status': self._health_status,
            'last_check': self._last_check.isoformat() if self._last_check else None,
            'monitoring': self._monitoring,
            'health_check_interval': self.health_check_interval,
            'monitor_type': 'mock'
        }

