#!/usr/bin/env python3
"""
Governance Event Bus

This module provides real-time event-driven communication between governance components.
It enables proactive governance by allowing components to communicate, verify, and
self-monitor in real-time.

Key Features:
- Asynchronous event publishing and subscription
- Event priority handling
- Component health monitoring
- Self-verification event patterns
- Proactive governance alerts

This addresses the core AI governance problem: transforming reactive assumption
into proactive verification through real-time component communication.

Codex Contract: v2025.05.21
Phase ID: 6.3
"""

import asyncio
import logging
from typing import Dict, Any, Optional, List, Callable, Set
from datetime import datetime, timedelta
from enum import Enum
import json
import uuid
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

class EventPriority(Enum):
    """Event priority levels for governance events."""
    CRITICAL = 1    # System failures, security violations
    HIGH = 2        # Governance violations, trust issues
    MEDIUM = 3      # Normal governance operations
    LOW = 4         # Monitoring, health checks

@dataclass
class GovernanceEvent:
    """
    Governance event data structure.
    
    This represents a single governance event that can be published
    and consumed by governance components for real-time communication.
    """
    id: str
    type: str
    timestamp: datetime
    source_component: str
    target_component: Optional[str]
    data: Dict[str, Any]
    priority: EventPriority
    correlation_id: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary for serialization."""
        event_dict = asdict(self)
        event_dict['timestamp'] = self.timestamp.isoformat()
        event_dict['priority'] = self.priority.value
        return event_dict
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GovernanceEvent':
        """Create event from dictionary."""
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        data['priority'] = EventPriority(data['priority'])
        return cls(**data)

class GovernanceEventBus:
    """
    Governance Event Bus for real-time component communication.
    
    This class provides the foundation for proactive governance by enabling
    real-time communication between governance components. It transforms
    AI from reactive assumption to proactive verification.
    
    Key Features:
    - Asynchronous event publishing and subscription
    - Priority-based event handling
    - Component health monitoring
    - Self-verification event patterns
    - Automatic retry and error handling
    
    Codex Contract: v2025.05.21
    Phase ID: 6.3
    """
    
    def __init__(self, 
                 max_queue_size: int = 10000,
                 health_check_interval: int = 30,
                 event_retention_hours: int = 24,
                 enable_self_verification: bool = True):
        """
        Initialize governance event bus.
        
        Args:
            max_queue_size: Maximum number of events in queue
            health_check_interval: Health check interval in seconds
            event_retention_hours: How long to retain events for analysis
            enable_self_verification: Enable proactive self-verification
        """
        self.max_queue_size = max_queue_size
        self.health_check_interval = health_check_interval
        self.event_retention_hours = event_retention_hours
        self.enable_self_verification = enable_self_verification
        
        # Event handling
        self._event_queue = asyncio.Queue(maxsize=max_queue_size)
        self._subscribers: Dict[str, List[Callable]] = {}
        self._event_history: List[GovernanceEvent] = []
        self._failed_events: List[GovernanceEvent] = []
        
        # Component tracking
        self._registered_components: Set[str] = set()
        self._component_health: Dict[str, Dict[str, Any]] = {}
        self._component_last_seen: Dict[str, datetime] = {}
        
        # Self-verification tracking
        self._verification_requests: Dict[str, GovernanceEvent] = {}
        self._verification_responses: Dict[str, GovernanceEvent] = {}
        
        # System state
        self._is_running = False
        self._shutdown_requested = False
        self._event_processor_task = None
        self._health_monitor_task = None
        self._self_verification_task = None
        
        logger.info("GovernanceEventBus initialized with proactive verification enabled")
    
    async def start(self):
        """Start the governance event bus."""
        if self._is_running:
            logger.warning("Event bus already running")
            return
        
        try:
            self._is_running = True
            self._shutdown_requested = False
            
            # Start event processor
            self._event_processor_task = asyncio.create_task(self._process_events())
            
            # Start health monitor
            self._health_monitor_task = asyncio.create_task(self._health_monitor())
            
            # Start self-verification monitor if enabled
            if self.enable_self_verification:
                self._self_verification_task = asyncio.create_task(self._self_verification_monitor())
            
            logger.info("Governance event bus started")
            
        except Exception as e:
            logger.error(f"Error starting event bus: {e}")
            self._is_running = False
            raise
    
    async def stop(self):
        """Stop the governance event bus."""
        if not self._is_running:
            return
        
        logger.info("Stopping governance event bus...")
        
        self._shutdown_requested = True
        
        # Cancel tasks
        if self._event_processor_task:
            self._event_processor_task.cancel()
        
        if self._health_monitor_task:
            self._health_monitor_task.cancel()
        
        if self._self_verification_task:
            self._self_verification_task.cancel()
        
        # Wait for tasks to complete
        await asyncio.gather(
            self._event_processor_task,
            self._health_monitor_task,
            self._self_verification_task,
            return_exceptions=True
        )
        
        self._is_running = False
        logger.info("Governance event bus stopped")
    
    async def register_component(self, component_name: str, component_info: Dict[str, Any] = None):
        """
        Register a governance component with the event bus.
        
        Args:
            component_name: Name of the component
            component_info: Optional component information
        """
        self._registered_components.add(component_name)
        self._component_last_seen[component_name] = datetime.now()
        
        if component_info:
            self._component_health[component_name] = component_info
        
        # Publish component registration event
        registration_event = GovernanceEvent(
            id=f"component_registration_{component_name}_{uuid.uuid4().hex[:8]}",
            type="component_registered",
            timestamp=datetime.now(),
            source_component="event_bus",
            target_component=None,
            data={
                'component_name': component_name,
                'component_info': component_info or {},
                'registration_timestamp': datetime.now().isoformat()
            },
            priority=EventPriority.LOW
        )
        
        await self.publish(registration_event)
        
        logger.info(f"Component registered: {component_name}")
    
    async def unregister_component(self, component_name: str):
        """
        Unregister a governance component.
        
        Args:
            component_name: Name of the component to unregister
        """
        self._registered_components.discard(component_name)
        self._component_last_seen.pop(component_name, None)
        self._component_health.pop(component_name, None)
        
        # Publish component unregistration event
        unregistration_event = GovernanceEvent(
            id=f"component_unregistration_{component_name}_{uuid.uuid4().hex[:8]}",
            type="component_unregistered",
            timestamp=datetime.now(),
            source_component="event_bus",
            target_component=None,
            data={
                'component_name': component_name,
                'unregistration_timestamp': datetime.now().isoformat()
            },
            priority=EventPriority.LOW
        )
        
        await self.publish(unregistration_event)
        
        logger.info(f"Component unregistered: {component_name}")
    
    async def publish(self, event: GovernanceEvent):
        """
        Publish a governance event.
        
        Args:
            event: The governance event to publish
        """
        try:
            # Update component last seen
            if event.source_component:
                self._component_last_seen[event.source_component] = datetime.now()
            
            # Add to queue
            await self._event_queue.put(event)
            
            # Add to history
            self._event_history.append(event)
            
            # Cleanup old events
            self._cleanup_event_history()
            
            logger.debug(f"Event published: {event.type} from {event.source_component}")
            
        except asyncio.QueueFull:
            logger.error(f"Event queue full, dropping event: {event.type}")
            self._failed_events.append(event)
        except Exception as e:
            logger.error(f"Error publishing event: {e}")
            self._failed_events.append(event)
    
    async def subscribe(self, event_type: str, handler: Callable[[GovernanceEvent], None]):
        """
        Subscribe to governance events of a specific type.
        
        Args:
            event_type: Type of events to subscribe to
            handler: Async function to handle events
        """
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        
        self._subscribers[event_type].append(handler)
        
        logger.info(f"Subscribed to event type: {event_type}")
    
    async def unsubscribe(self, event_type: str, handler: Callable[[GovernanceEvent], None]):
        """
        Unsubscribe from governance events.
        
        Args:
            event_type: Type of events to unsubscribe from
            handler: Handler function to remove
        """
        if event_type in self._subscribers:
            try:
                self._subscribers[event_type].remove(handler)
                if not self._subscribers[event_type]:
                    del self._subscribers[event_type]
                
                logger.info(f"Unsubscribed from event type: {event_type}")
            except ValueError:
                logger.warning(f"Handler not found for event type: {event_type}")
    
    async def request_verification(self, 
                                  component_name: str, 
                                  verification_type: str, 
                                  verification_data: Dict[str, Any],
                                  timeout_seconds: int = 30) -> Optional[GovernanceEvent]:
        """
        Request verification from a component (PROACTIVE GOVERNANCE).
        
        This method enables proactive governance by allowing components to
        request verification from other components before claiming completion.
        
        Args:
            component_name: Component to request verification from
            verification_type: Type of verification requested
            verification_data: Data for verification
            timeout_seconds: Timeout for verification response
            
        Returns:
            Verification response event or None if timeout
        """
        verification_id = f"verification_{uuid.uuid4().hex[:8]}"
        
        # Create verification request event
        verification_request = GovernanceEvent(
            id=verification_id,
            type="verification_request",
            timestamp=datetime.now(),
            source_component="event_bus",
            target_component=component_name,
            data={
                'verification_id': verification_id,
                'verification_type': verification_type,
                'verification_data': verification_data,
                'timeout_seconds': timeout_seconds
            },
            priority=EventPriority.HIGH
        )
        
        # Store request for tracking
        self._verification_requests[verification_id] = verification_request
        
        # Publish verification request
        await self.publish(verification_request)
        
        # Wait for response
        try:
            start_time = datetime.now()
            while (datetime.now() - start_time).total_seconds() < timeout_seconds:
                if verification_id in self._verification_responses:
                    response = self._verification_responses.pop(verification_id)
                    self._verification_requests.pop(verification_id, None)
                    return response
                
                await asyncio.sleep(0.1)  # Check every 100ms
            
            # Timeout
            logger.warning(f"Verification request timeout: {verification_id}")
            self._verification_requests.pop(verification_id, None)
            return None
            
        except Exception as e:
            logger.error(f"Error in verification request: {e}")
            self._verification_requests.pop(verification_id, None)
            return None
    
    async def respond_to_verification(self, 
                                     verification_id: str, 
                                     verification_result: Dict[str, Any],
                                     source_component: str):
        """
        Respond to a verification request.
        
        Args:
            verification_id: ID of the verification request
            verification_result: Result of the verification
            source_component: Component providing the verification
        """
        # Create verification response event
        verification_response = GovernanceEvent(
            id=f"verification_response_{verification_id}",
            type="verification_response",
            timestamp=datetime.now(),
            source_component=source_component,
            target_component="event_bus",
            data={
                'verification_id': verification_id,
                'verification_result': verification_result,
                'response_timestamp': datetime.now().isoformat()
            },
            priority=EventPriority.HIGH
        )
        
        # Store response
        self._verification_responses[verification_id] = verification_response
        
        # Publish response
        await self.publish(verification_response)
        
        logger.info(f"Verification response provided: {verification_id}")
    
    async def _process_events(self):
        """Process events from the queue."""
        while not self._shutdown_requested:
            try:
                # Get event with timeout
                event = await asyncio.wait_for(
                    self._event_queue.get(),
                    timeout=1.0
                )
                
                # Process event
                await self._handle_event(event)
                
            except asyncio.TimeoutError:
                # No events to process, continue
                continue
            except Exception as e:
                logger.error(f"Error processing event: {e}")
    
    async def _handle_event(self, event: GovernanceEvent):
        """Handle a single event."""
        try:
            # Handle special event types
            if event.type == "verification_response":
                verification_id = event.data.get('verification_id')
                if verification_id:
                    self._verification_responses[verification_id] = event
            
            # Notify subscribers
            if event.type in self._subscribers:
                for handler in self._subscribers[event.type]:
                    try:
                        if asyncio.iscoroutinefunction(handler):
                            await handler(event)
                        else:
                            handler(event)
                    except Exception as e:
                        logger.error(f"Error in event handler: {e}")
                        
                        # Retry for critical events
                        if event.priority == EventPriority.CRITICAL and event.retry_count < event.max_retries:
                            event.retry_count += 1
                            await asyncio.sleep(1)  # Brief delay before retry
                            await self.publish(event)
            
            logger.debug(f"Event handled: {event.type}")
            
        except Exception as e:
            logger.error(f"Error handling event {event.id}: {e}")
            self._failed_events.append(event)
    
    async def _health_monitor(self):
        """Monitor component health."""
        while not self._shutdown_requested:
            try:
                current_time = datetime.now()
                
                # Check component health
                for component_name in list(self._registered_components):
                    last_seen = self._component_last_seen.get(component_name)
                    
                    if last_seen:
                        time_since_seen = (current_time - last_seen).total_seconds()
                        
                        # Component considered unhealthy if not seen for 5 minutes
                        if time_since_seen > 300:
                            await self._handle_unhealthy_component(component_name, time_since_seen)
                
                # Request health checks from all components
                await self._request_health_checks()
                
                # Sleep until next health check
                await asyncio.sleep(self.health_check_interval)
                
            except Exception as e:
                logger.error(f"Error in health monitor: {e}")
                await asyncio.sleep(self.health_check_interval)
    
    async def _handle_unhealthy_component(self, component_name: str, time_since_seen: float):
        """Handle unhealthy component."""
        # Publish unhealthy component event
        unhealthy_event = GovernanceEvent(
            id=f"component_unhealthy_{component_name}_{uuid.uuid4().hex[:8]}",
            type="component_unhealthy",
            timestamp=datetime.now(),
            source_component="event_bus",
            target_component=None,
            data={
                'component_name': component_name,
                'time_since_seen_seconds': time_since_seen,
                'last_seen': self._component_last_seen[component_name].isoformat()
            },
            priority=EventPriority.HIGH
        )
        
        await self.publish(unhealthy_event)
        
        logger.warning(f"Component unhealthy: {component_name} (not seen for {time_since_seen:.1f}s)")
    
    async def _request_health_checks(self):
        """Request health checks from all components."""
        health_check_event = GovernanceEvent(
            id=f"health_check_request_{uuid.uuid4().hex[:8]}",
            type="health_check_request",
            timestamp=datetime.now(),
            source_component="event_bus",
            target_component=None,
            data={
                'request_timestamp': datetime.now().isoformat()
            },
            priority=EventPriority.LOW
        )
        
        await self.publish(health_check_event)
    
    async def _self_verification_monitor(self):
        """Monitor for self-verification opportunities (PROACTIVE GOVERNANCE)."""
        while not self._shutdown_requested:
            try:
                # Check for completion claims without verification
                await self._check_unverified_completions()
                
                # Check for overconfident claims
                await self._check_overconfident_claims()
                
                # Check for component integration issues
                await self._check_integration_issues()
                
                # Sleep before next verification check
                await asyncio.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                logger.error(f"Error in self-verification monitor: {e}")
                await asyncio.sleep(10)
    
    async def _check_unverified_completions(self):
        """Check for completion claims without verification."""
        # Look for recent completion events
        recent_events = [
            event for event in self._event_history[-100:]  # Last 100 events
            if event.type in ['task_completed', 'component_initialized', 'system_ready']
            and (datetime.now() - event.timestamp).total_seconds() < 300  # Last 5 minutes
        ]
        
        for completion_event in recent_events:
            # Check if there was a corresponding verification
            verification_found = any(
                event.type == 'verification_request'
                and event.data.get('verification_data', {}).get('related_event_id') == completion_event.id
                for event in self._event_history[-50:]  # Check recent verifications
            )
            
            if not verification_found:
                # Publish unverified completion alert
                alert_event = GovernanceEvent(
                    id=f"unverified_completion_{completion_event.id}",
                    type="unverified_completion_alert",
                    timestamp=datetime.now(),
                    source_component="event_bus",
                    target_component=None,
                    data={
                        'original_event_id': completion_event.id,
                        'original_event_type': completion_event.type,
                        'source_component': completion_event.source_component,
                        'alert_reason': 'completion_claimed_without_verification'
                    },
                    priority=EventPriority.HIGH
                )
                
                await self.publish(alert_event)
                
                logger.warning(f"Unverified completion detected: {completion_event.id}")
    
    async def _check_overconfident_claims(self):
        """Check for overconfident claims that need verification."""
        # Look for high confidence claims
        recent_events = [
            event for event in self._event_history[-50:]
            if 'confidence' in event.data
            and event.data['confidence'] > 0.9  # Very high confidence
            and (datetime.now() - event.timestamp).total_seconds() < 300
        ]
        
        for confident_event in recent_events:
            # Request verification for high confidence claims
            verification_request = GovernanceEvent(
                id=f"confidence_verification_{confident_event.id}",
                type="confidence_verification_request",
                timestamp=datetime.now(),
                source_component="event_bus",
                target_component=confident_event.source_component,
                data={
                    'original_event_id': confident_event.id,
                    'claimed_confidence': confident_event.data['confidence'],
                    'verification_reason': 'high_confidence_claim_verification'
                },
                priority=EventPriority.MEDIUM
            )
            
            await self.publish(verification_request)
    
    async def _check_integration_issues(self):
        """Check for component integration issues."""
        # Look for components that should be communicating but aren't
        expected_integrations = [
            ('trust_calculator', 'emotion_logger'),
            ('governance_core', 'decision_framework'),
            ('trust_calculator', 'governance_core')
        ]
        
        for component_a, component_b in expected_integrations:
            # Check if both components are registered
            if component_a in self._registered_components and component_b in self._registered_components:
                # Check for recent communication between them
                recent_communication = any(
                    (event.source_component == component_a and event.target_component == component_b) or
                    (event.source_component == component_b and event.target_component == component_a)
                    for event in self._event_history[-100:]
                    if (datetime.now() - event.timestamp).total_seconds() < 600  # Last 10 minutes
                )
                
                if not recent_communication:
                    # Publish integration issue alert
                    integration_alert = GovernanceEvent(
                        id=f"integration_issue_{component_a}_{component_b}_{uuid.uuid4().hex[:8]}",
                        type="integration_issue_alert",
                        timestamp=datetime.now(),
                        source_component="event_bus",
                        target_component=None,
                        data={
                            'component_a': component_a,
                            'component_b': component_b,
                            'issue_type': 'no_recent_communication',
                            'alert_reason': 'expected_integration_not_communicating'
                        },
                        priority=EventPriority.MEDIUM
                    )
                    
                    await self.publish(integration_alert)
                    
                    logger.warning(f"Integration issue detected: {component_a} <-> {component_b}")
    
    def _cleanup_event_history(self):
        """Cleanup old events from history."""
        cutoff_time = datetime.now() - timedelta(hours=self.event_retention_hours)
        
        self._event_history = [
            event for event in self._event_history
            if event.timestamp > cutoff_time
        ]
        
        # Also cleanup failed events
        self._failed_events = [
            event for event in self._failed_events
            if event.timestamp > cutoff_time
        ]
    
    async def get_component_status(self) -> Dict[str, Any]:
        """Get status of all registered components."""
        current_time = datetime.now()
        
        component_status = {}
        
        for component_name in self._registered_components:
            last_seen = self._component_last_seen.get(component_name)
            
            if last_seen:
                time_since_seen = (current_time - last_seen).total_seconds()
                status = 'healthy' if time_since_seen < 300 else 'unhealthy'
            else:
                time_since_seen = None
                status = 'unknown'
            
            component_status[component_name] = {
                'status': status,
                'last_seen': last_seen.isoformat() if last_seen else None,
                'time_since_seen_seconds': time_since_seen,
                'health_info': self._component_health.get(component_name, {})
            }
        
        return component_status
    
    async def get_event_statistics(self) -> Dict[str, Any]:
        """Get event bus statistics."""
        current_time = datetime.now()
        
        # Count events by type in last hour
        recent_events = [
            event for event in self._event_history
            if (current_time - event.timestamp).total_seconds() < 3600
        ]
        
        event_counts = {}
        for event in recent_events:
            event_counts[event.type] = event_counts.get(event.type, 0) + 1
        
        return {
            'total_events_processed': len(self._event_history),
            'events_last_hour': len(recent_events),
            'events_by_type_last_hour': event_counts,
            'failed_events': len(self._failed_events),
            'queue_size': self._event_queue.qsize(),
            'registered_components': len(self._registered_components),
            'active_subscriptions': len(self._subscribers),
            'pending_verifications': len(self._verification_requests),
            'is_running': self._is_running
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on event bus."""
        return {
            'component': 'governance_event_bus',
            'status': 'healthy' if self._is_running else 'stopped',
            'timestamp': datetime.now().isoformat(),
            'is_running': self._is_running,
            'queue_size': self._event_queue.qsize(),
            'registered_components': len(self._registered_components),
            'event_history_size': len(self._event_history),
            'failed_events': len(self._failed_events),
            'self_verification_enabled': self.enable_self_verification
        }
    
    @property
    def is_running(self) -> bool:
        """Check if event bus is running."""
        return self._is_running

