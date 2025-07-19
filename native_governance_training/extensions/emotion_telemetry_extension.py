#!/usr/bin/env python3
"""
Backwards-Compatible Emotion Telemetry Logger Extension

This module extends the existing EmotionTelemetryLogger with governance integration
while maintaining 100% backwards compatibility with the existing API.

REPLACES: governance_components['emotion_logger'] = None
WITH: Real EmotionTelemetryLogger instance with governance integration

Key Features:
- Maintains exact same API as original EmotionTelemetryLogger
- Adds real emotion analysis (no more fake/random values)
- Integrates with storage backend and event bus
- Provides real-time emotion analysis with governance context
- Backwards compatible with all existing code

Codex Contract: v2025.05.21
Phase ID: 6.3
"""

import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import json
import hashlib
import statistics

logger = logging.getLogger(__name__)

class GovernanceIntegratedEmotionLogger:
    """
    Backwards-compatible extension of EmotionTelemetryLogger with governance integration.
    
    This class provides the same API as the original EmotionTelemetryLogger while adding:
    - Real emotion analysis (replaces fake/random values)
    - Storage backend integration for persistence
    - Event bus integration for real-time communication
    - Enhanced emotion analysis with governance context
    - Backwards compatibility with existing APIs
    
    CRITICAL: This maintains 100% backwards compatibility while adding governance features.
    
    Codex Contract: v2025.05.21
    Phase ID: 6.3
    """
    
    def __init__(self,
                 sampling_rate: float = 1.0,
                 buffer_size: int = 1000,
                 emotion_models: List[str] = None,
                 telemetry_interval: int = 5,
                 storage_backend: Optional[Any] = None,
                 event_bus: Optional[Any] = None,
                 governance_config: Optional[Dict[str, Any]] = None,
                 real_time_analysis: bool = True):
        """
        Initialize governance-integrated emotion logger.
        
        Args:
            sampling_rate: Rate of emotion sampling (backwards compatible)
            buffer_size: Size of emotion buffer (backwards compatible)
            emotion_models: List of emotion models to use (backwards compatible)
            telemetry_interval: Interval for telemetry updates (backwards compatible)
            storage_backend: Storage backend for governance data
            event_bus: Event bus for real-time communication
            governance_config: Governance-specific configuration
            real_time_analysis: Enable real-time governance features
        """
        # Backwards compatible parameters
        self.sampling_rate = sampling_rate
        self.buffer_size = buffer_size
        self.emotion_models = emotion_models or ['basic']
        self.telemetry_interval = telemetry_interval
        
        # Governance integration components
        self.storage_backend = storage_backend
        self.event_bus = event_bus
        self.governance_config = governance_config or {}
        self.real_time_analysis = real_time_analysis
        
        # Governance state
        self.governance_enabled = True
        self._emotion_buffer = []
        self._analysis_cache = {}
        self._session_histories = {}
        self._is_initialized = False
        
        # Emotion analysis configuration
        self.emotion_dimensions = [
            'happiness',
            'stress',
            'confidence',
            'engagement',
            'frustration',
            'satisfaction',
            'anxiety',
            'focus'
        ]
        
        # Governance metrics configuration
        self.governance_metrics = [
            'emotional_volatility',
            'stress_level',
            'confidence_level',
            'engagement_level',
            'governance_risk_score'
        ]
        
        # Event subscriptions
        self._event_subscriptions = []
        
        logger.info("GovernanceIntegratedEmotionLogger initialized with governance features")
    
    async def initialize(self):
        """Initialize governance integration features."""
        try:
            # Subscribe to governance events
            if self.event_bus:
                await self._subscribe_to_events()
            
            # Initialize emotion analysis cache
            await self._initialize_emotion_cache()
            
            # Load historical emotion data
            await self._load_emotion_history()
            
            # Start real-time analysis if enabled
            if self.real_time_analysis:
                asyncio.create_task(self._real_time_analysis_loop())
            
            self._is_initialized = True
            logger.info("Emotion logger governance integration initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize emotion logger governance: {e}")
            # Graceful degradation - continue without governance features
            self.governance_enabled = False
    
    async def _subscribe_to_events(self):
        """Subscribe to relevant governance events."""
        if not self.event_bus:
            return
        
        # Subscribe to emotion analysis requests
        await self.event_bus.subscribe('emotion_analysis_request', self._handle_emotion_request)
        
        # Subscribe to session context updates
        await self.event_bus.subscribe('session_context_update', self._handle_session_update)
        
        # Subscribe to system health checks
        await self.event_bus.subscribe('health_check_request', self._handle_health_check)
        
        logger.info("Subscribed to emotion governance events")
    
    async def _handle_emotion_request(self, event):
        """Handle emotion analysis request from event bus."""
        try:
            data = event.data
            session_id = data.get('session_id')
            context = data.get('context', {})
            
            # Analyze emotional state
            result = await self.analyze_emotional_state(session_id, context)
            
            # Publish result
            if self.event_bus:
                from promethios.native_governance_training.governance_event_bus import GovernanceEvent, EventPriority
                
                response_event = GovernanceEvent(
                    id=f"emotion_result_{event.id}",
                    type="emotion_analysis_result",
                    timestamp=datetime.now(),
                    source_component="emotion_logger",
                    target_component=event.source_component,
                    data={
                        'request_id': event.id,
                        'emotion_result': result,
                        'analysis_timestamp': datetime.now().isoformat()
                    },
                    priority=EventPriority.MEDIUM
                )
                
                await self.event_bus.publish(response_event)
            
        except Exception as e:
            logger.error(f"Error handling emotion request: {e}")
    
    async def _handle_session_update(self, event):
        """Handle session context updates."""
        try:
            session_data = event.data
            session_id = session_data.get('session_id')
            
            if session_id:
                # Invalidate cache for this session
                self._invalidate_session_cache(session_id)
                
                # Update session context
                if session_id not in self._session_histories:
                    self._session_histories[session_id] = []
                
                logger.info(f"Updated emotion context for session {session_id}")
            
        except Exception as e:
            logger.error(f"Error handling session update: {e}")
    
    async def _handle_health_check(self, event):
        """Handle health check requests."""
        try:
            health_status = await self.health_check()
            
            if self.event_bus:
                from promethios.native_governance_training.governance_event_bus import GovernanceEvent, EventPriority
                
                health_event = GovernanceEvent(
                    id=f"health_response_{event.id}",
                    type="health_check_response",
                    timestamp=datetime.now(),
                    source_component="emotion_logger",
                    target_component=event.source_component,
                    data={
                        'request_id': event.id,
                        'health_status': health_status
                    },
                    priority=EventPriority.LOW
                )
                
                await self.event_bus.publish(health_event)
            
        except Exception as e:
            logger.error(f"Error handling health check: {e}")
    
    async def _initialize_emotion_cache(self):
        """Initialize emotion analysis cache."""
        self._analysis_cache = {}
        logger.info("Emotion analysis cache initialized")
    
    async def _load_emotion_history(self):
        """Load historical emotion data."""
        if not self.storage_backend:
            return
        
        try:
            # Load recent emotion analyses for context
            recent_analyses = await self.storage_backend.query(
                'emotion_analyses',
                {'timestamp': {'$gte': datetime.now() - timedelta(hours=24)}},
                limit=1000
            )
            
            # Organize by session
            for analysis in recent_analyses:
                session_id = analysis.get('session_id')
                if session_id:
                    if session_id not in self._session_histories:
                        self._session_histories[session_id] = []
                    self._session_histories[session_id].append(analysis)
            
            logger.info(f"Loaded emotion history for {len(self._session_histories)} sessions")
            
        except Exception as e:
            logger.error(f"Error loading emotion history: {e}")
    
    # BACKWARDS COMPATIBLE METHODS - These maintain exact same API as original
    
    def log_emotion_telemetry(self, session_id: str, emotion_data: Dict[str, float]) -> bool:
        """
        BACKWARDS COMPATIBLE: Log emotion telemetry data.
        
        This method maintains the exact same API as the original EmotionTelemetryLogger
        while adding governance integration features.
        
        Args:
            session_id: Session identifier
            emotion_data: Dictionary of emotion values
            
        Returns:
            True if logging successful, False otherwise
        """
        try:
            # Validate emotion data
            if not self._validate_emotion_data(emotion_data):
                logger.warning(f"Invalid emotion data for session {session_id}")
                return False
            
            # Create emotion entry
            emotion_entry = {
                'session_id': session_id,
                'emotion_data': emotion_data,
                'timestamp': datetime.now(),
                'governance_enabled': self.governance_enabled
            }
            
            # Add to buffer
            self._emotion_buffer.append(emotion_entry)
            
            # Maintain buffer size
            if len(self._emotion_buffer) > self.buffer_size:
                self._emotion_buffer.pop(0)
            
            # Add to session history
            if session_id not in self._session_histories:
                self._session_histories[session_id] = []
            
            self._session_histories[session_id].append(emotion_entry)
            
            # Trigger real-time analysis if enabled
            if self.real_time_analysis and self.governance_enabled:
                asyncio.create_task(self._trigger_real_time_analysis(session_id, emotion_data))
            
            logger.debug(f"Emotion telemetry logged for session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error logging emotion telemetry: {e}")
            return False
    
    async def analyze_emotional_state(self, 
                                     session_id: str, 
                                     context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        ENHANCED: Analyze emotional state with governance integration.
        
        This method provides enhanced emotion analysis with real governance metrics,
        replacing all fake/random values with actual calculations.
        
        Args:
            session_id: Session identifier
            context: Optional context information
            
        Returns:
            Enhanced emotion analysis result with governance metrics
        """
        analysis_start = datetime.now()
        
        try:
            # Check cache first
            cache_key = self._get_analysis_cache_key(session_id, context)
            cached_result = self._get_cached_analysis(cache_key)
            if cached_result:
                return cached_result
            
            # Get session emotion history
            session_emotions = self._get_session_emotions(session_id)
            
            if not session_emotions:
                logger.warning(f"No emotion data found for session {session_id}")
                return self._get_default_emotion_analysis(session_id)
            
            # Calculate real emotion analysis (NO MORE FAKE VALUES)
            emotional_state = await self._calculate_real_emotional_state(session_emotions)
            
            # Calculate governance metrics
            governance_metrics = await self._calculate_emotion_governance_metrics(
                session_emotions, 
                emotional_state, 
                context
            )
            
            # Create comprehensive result
            result = {
                'session_id': session_id,
                'emotional_state': emotional_state,
                'governance_metrics': governance_metrics,
                'analysis_timestamp': analysis_start.isoformat(),
                'analysis_duration_ms': (datetime.now() - analysis_start).total_seconds() * 1000,
                'governance_enabled': self.governance_enabled,
                'data_points': len(session_emotions),
                'confidence': self._calculate_analysis_confidence(session_emotions)
            }
            
            # Add context analysis if provided
            if context:
                result['context_analysis'] = await self._analyze_emotional_context(
                    emotional_state, 
                    context
                )
            
            # Cache result
            self._cache_analysis(cache_key, result)
            
            # Store analysis for historical tracking
            await self._store_emotion_analysis(result)
            
            # Publish analysis event
            await self._publish_emotion_analysis_event(result)
            
            logger.info(f"Emotion analysis completed for session {session_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error in emotion analysis: {e}")
            return self._get_fallback_emotion_analysis(session_id)
    
    async def _calculate_real_emotional_state(self, session_emotions: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Calculate REAL emotional state (replaces all fake/random values).
        
        This method calculates actual emotional state based on:
        - Historical emotion patterns
        - Current emotion trends
        - Emotional volatility analysis
        - Contextual emotion assessment
        
        NO MORE random.uniform() CALLS!
        
        Args:
            session_emotions: List of emotion data points
            
        Returns:
            Real emotional state dictionary
        """
        emotional_state = {}
        
        try:
            # Calculate current emotional state for each dimension
            for dimension in self.emotion_dimensions:
                emotional_state[dimension] = await self._calculate_emotion_dimension(
                    dimension, 
                    session_emotions
                )
            
            # Calculate derived emotional metrics
            emotional_state['overall_mood'] = self._calculate_overall_mood(emotional_state)
            emotional_state['emotional_stability'] = self._calculate_emotional_stability(session_emotions)
            emotional_state['stress_indicators'] = self._calculate_stress_indicators(emotional_state)
            emotional_state['engagement_quality'] = self._calculate_engagement_quality(emotional_state)
            
            logger.info("Real emotional state calculated successfully")
            return emotional_state
            
        except Exception as e:
            logger.error(f"Error calculating emotional state: {e}")
            return self._get_conservative_emotional_state()
    
    async def _calculate_emotion_dimension(self, dimension: str, session_emotions: List[Dict[str, Any]]) -> float:
        """Calculate specific emotion dimension value."""
        try:
            # Extract values for this dimension from session history
            dimension_values = []
            
            for emotion_entry in session_emotions:
                emotion_data = emotion_entry.get('emotion_data', {})
                if dimension in emotion_data:
                    dimension_values.append(emotion_data[dimension])
            
            if not dimension_values:
                return 0.5  # Neutral default
            
            # Calculate weighted average with more recent values weighted higher
            if len(dimension_values) == 1:
                return max(0.0, min(dimension_values[0], 1.0))
            
            # Apply temporal weighting
            weights = [i + 1 for i in range(len(dimension_values))]
            weighted_sum = sum(value * weight for value, weight in zip(dimension_values, weights))
            weight_sum = sum(weights)
            
            weighted_average = weighted_sum / weight_sum
            
            # Apply smoothing for stability
            if len(dimension_values) >= 3:
                # Use median of recent values for stability
                recent_values = dimension_values[-3:]
                median_value = statistics.median(recent_values)
                
                # Blend weighted average with median (70/30)
                final_value = (weighted_average * 0.7) + (median_value * 0.3)
            else:
                final_value = weighted_average
            
            return max(0.0, min(final_value, 1.0))
            
        except Exception as e:
            logger.error(f"Error calculating emotion dimension {dimension}: {e}")
            return 0.5  # Conservative default
    
    def _calculate_overall_mood(self, emotional_state: Dict[str, float]) -> float:
        """Calculate overall mood score."""
        try:
            # Weight different emotions for overall mood
            mood_weights = {
                'happiness': 0.3,
                'satisfaction': 0.2,
                'confidence': 0.15,
                'engagement': 0.1,
                'stress': -0.15,  # Negative impact
                'frustration': -0.1,  # Negative impact
                'anxiety': -0.1  # Negative impact
            }
            
            mood_score = 0.5  # Neutral baseline
            
            for emotion, weight in mood_weights.items():
                if emotion in emotional_state:
                    mood_score += emotional_state[emotion] * weight
            
            return max(0.0, min(mood_score, 1.0))
            
        except Exception as e:
            logger.error(f"Error calculating overall mood: {e}")
            return 0.5
    
    def _calculate_emotional_stability(self, session_emotions: List[Dict[str, Any]]) -> float:
        """Calculate emotional stability score."""
        try:
            if len(session_emotions) < 2:
                return 0.8  # Assume stable for limited data
            
            # Calculate variance across all emotion dimensions
            all_variances = []
            
            for dimension in self.emotion_dimensions:
                values = []
                for emotion_entry in session_emotions:
                    emotion_data = emotion_entry.get('emotion_data', {})
                    if dimension in emotion_data:
                        values.append(emotion_data[dimension])
                
                if len(values) >= 2:
                    variance = statistics.variance(values)
                    all_variances.append(variance)
            
            if not all_variances:
                return 0.8
            
            # Calculate average variance
            avg_variance = sum(all_variances) / len(all_variances)
            
            # Convert variance to stability (lower variance = higher stability)
            stability = max(0.0, 1.0 - (avg_variance * 2))  # Scale factor
            
            return stability
            
        except Exception as e:
            logger.error(f"Error calculating emotional stability: {e}")
            return 0.7
    
    def _calculate_stress_indicators(self, emotional_state: Dict[str, float]) -> float:
        """Calculate stress indicator score."""
        try:
            stress_factors = []
            
            # Direct stress measurement
            if 'stress' in emotional_state:
                stress_factors.append(emotional_state['stress'])
            
            # Anxiety contribution
            if 'anxiety' in emotional_state:
                stress_factors.append(emotional_state['anxiety'] * 0.8)
            
            # Frustration contribution
            if 'frustration' in emotional_state:
                stress_factors.append(emotional_state['frustration'] * 0.6)
            
            # Inverse confidence (low confidence can indicate stress)
            if 'confidence' in emotional_state:
                stress_factors.append((1.0 - emotional_state['confidence']) * 0.4)
            
            if not stress_factors:
                return 0.3  # Low stress default
            
            # Calculate weighted stress score
            stress_score = sum(stress_factors) / len(stress_factors)
            
            return max(0.0, min(stress_score, 1.0))
            
        except Exception as e:
            logger.error(f"Error calculating stress indicators: {e}")
            return 0.3
    
    def _calculate_engagement_quality(self, emotional_state: Dict[str, float]) -> float:
        """Calculate engagement quality score."""
        try:
            engagement_factors = []
            
            # Direct engagement measurement
            if 'engagement' in emotional_state:
                engagement_factors.append(emotional_state['engagement'])
            
            # Focus contribution
            if 'focus' in emotional_state:
                engagement_factors.append(emotional_state['focus'] * 0.8)
            
            # Confidence contribution
            if 'confidence' in emotional_state:
                engagement_factors.append(emotional_state['confidence'] * 0.6)
            
            # Satisfaction contribution
            if 'satisfaction' in emotional_state:
                engagement_factors.append(emotional_state['satisfaction'] * 0.5)
            
            # Negative factors
            if 'frustration' in emotional_state:
                engagement_factors.append((1.0 - emotional_state['frustration']) * 0.3)
            
            if not engagement_factors:
                return 0.6  # Moderate engagement default
            
            engagement_score = sum(engagement_factors) / len(engagement_factors)
            
            return max(0.0, min(engagement_score, 1.0))
            
        except Exception as e:
            logger.error(f"Error calculating engagement quality: {e}")
            return 0.6
    
    async def _calculate_emotion_governance_metrics(self, 
                                                   session_emotions: List[Dict[str, Any]], 
                                                   emotional_state: Dict[str, float],
                                                   context: Dict[str, Any] = None) -> Dict[str, float]:
        """
        Calculate emotion governance metrics.
        
        Args:
            session_emotions: Historical emotion data
            emotional_state: Current emotional state
            context: Optional context information
            
        Returns:
            Governance metrics dictionary
        """
        metrics = {}
        
        try:
            # Calculate emotional volatility
            metrics['emotional_volatility'] = self._calculate_emotional_volatility(session_emotions)
            
            # Calculate stress level
            metrics['stress_level'] = emotional_state.get('stress_indicators', 0.3)
            
            # Calculate confidence level
            metrics['confidence_level'] = emotional_state.get('confidence', 0.6)
            
            # Calculate engagement level
            metrics['engagement_level'] = emotional_state.get('engagement_quality', 0.6)
            
            # Calculate governance risk score based on emotions
            metrics['governance_risk_score'] = self._calculate_emotion_governance_risk(
                emotional_state, 
                metrics
            )
            
            # Add context-specific metrics if available
            if context:
                metrics.update(await self._calculate_contextual_emotion_metrics(
                    emotional_state, 
                    context
                ))
            
            logger.info("Emotion governance metrics calculated successfully")
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating emotion governance metrics: {e}")
            return self._get_conservative_emotion_governance_metrics()
    
    def _calculate_emotional_volatility(self, session_emotions: List[Dict[str, Any]]) -> float:
        """Calculate emotional volatility score."""
        try:
            if len(session_emotions) < 3:
                return 0.3  # Low volatility for limited data
            
            # Calculate volatility for each emotion dimension
            volatilities = []
            
            for dimension in self.emotion_dimensions:
                values = []
                for emotion_entry in session_emotions:
                    emotion_data = emotion_entry.get('emotion_data', {})
                    if dimension in emotion_data:
                        values.append(emotion_data[dimension])
                
                if len(values) >= 3:
                    # Calculate standard deviation as volatility measure
                    std_dev = statistics.stdev(values)
                    volatilities.append(std_dev)
            
            if not volatilities:
                return 0.3
            
            # Average volatility across dimensions
            avg_volatility = sum(volatilities) / len(volatilities)
            
            # Scale to 0-1 range
            scaled_volatility = min(avg_volatility * 2, 1.0)  # Scale factor
            
            return scaled_volatility
            
        except Exception as e:
            logger.error(f"Error calculating emotional volatility: {e}")
            return 0.3
    
    def _calculate_emotion_governance_risk(self, 
                                          emotional_state: Dict[str, float], 
                                          metrics: Dict[str, float]) -> float:
        """Calculate governance risk score based on emotional state."""
        try:
            risk_factors = []
            
            # High stress increases risk
            stress_level = metrics.get('stress_level', 0.3)
            risk_factors.append(stress_level * 0.3)
            
            # High volatility increases risk
            volatility = metrics.get('emotional_volatility', 0.3)
            risk_factors.append(volatility * 0.25)
            
            # Low confidence increases risk
            confidence = metrics.get('confidence_level', 0.6)
            risk_factors.append((1.0 - confidence) * 0.2)
            
            # Low engagement increases risk
            engagement = metrics.get('engagement_level', 0.6)
            risk_factors.append((1.0 - engagement) * 0.15)
            
            # Frustration increases risk
            frustration = emotional_state.get('frustration', 0.3)
            risk_factors.append(frustration * 0.1)
            
            # Calculate overall risk
            risk_score = sum(risk_factors)
            
            return max(0.0, min(risk_score, 1.0))
            
        except Exception as e:
            logger.error(f"Error calculating emotion governance risk: {e}")
            return 0.4  # Conservative default
    
    async def _calculate_contextual_emotion_metrics(self, 
                                                   emotional_state: Dict[str, float], 
                                                   context: Dict[str, Any]) -> Dict[str, float]:
        """Calculate context-specific emotion metrics."""
        contextual_metrics = {}
        
        try:
            # High-stakes context analysis
            if context.get('high_stakes'):
                stress_amplification = emotional_state.get('stress_indicators', 0.3) * 1.2
                contextual_metrics['high_stakes_stress'] = min(stress_amplification, 1.0)
            
            # Time pressure analysis
            if context.get('time_pressure'):
                pressure_impact = self._calculate_time_pressure_impact(emotional_state)
                contextual_metrics['time_pressure_impact'] = pressure_impact
            
            # Social context analysis
            if context.get('social_context'):
                social_stress = self._calculate_social_stress(emotional_state, context['social_context'])
                contextual_metrics['social_stress'] = social_stress
            
            return contextual_metrics
            
        except Exception as e:
            logger.error(f"Error calculating contextual emotion metrics: {e}")
            return {}
    
    def _calculate_time_pressure_impact(self, emotional_state: Dict[str, float]) -> float:
        """Calculate impact of time pressure on emotional state."""
        try:
            stress = emotional_state.get('stress_indicators', 0.3)
            anxiety = emotional_state.get('anxiety', 0.3)
            focus = emotional_state.get('focus', 0.6)
            
            # Time pressure amplifies stress and anxiety, reduces focus
            pressure_impact = (stress * 0.4) + (anxiety * 0.4) + ((1.0 - focus) * 0.2)
            
            return max(0.0, min(pressure_impact, 1.0))
            
        except Exception as e:
            logger.error(f"Error calculating time pressure impact: {e}")
            return 0.4
    
    def _calculate_social_stress(self, emotional_state: Dict[str, float], social_context: Dict[str, Any]) -> float:
        """Calculate social stress based on emotional state and social context."""
        try:
            base_stress = emotional_state.get('stress_indicators', 0.3)
            anxiety = emotional_state.get('anxiety', 0.3)
            confidence = emotional_state.get('confidence', 0.6)
            
            # Social factors that increase stress
            social_stress = base_stress
            
            if social_context.get('public_speaking'):
                social_stress += anxiety * 0.3
                social_stress += (1.0 - confidence) * 0.2
            
            if social_context.get('authority_present'):
                social_stress += anxiety * 0.2
            
            if social_context.get('performance_evaluation'):
                social_stress += (1.0 - confidence) * 0.3
            
            return max(0.0, min(social_stress, 1.0))
            
        except Exception as e:
            logger.error(f"Error calculating social stress: {e}")
            return 0.4
    
    def _get_conservative_emotional_state(self) -> Dict[str, float]:
        """Get conservative emotional state as fallback."""
        return {
            'happiness': 0.6,
            'stress': 0.3,
            'confidence': 0.6,
            'engagement': 0.6,
            'frustration': 0.3,
            'satisfaction': 0.6,
            'anxiety': 0.3,
            'focus': 0.6,
            'overall_mood': 0.6,
            'emotional_stability': 0.7,
            'stress_indicators': 0.3,
            'engagement_quality': 0.6
        }
    
    def _get_conservative_emotion_governance_metrics(self) -> Dict[str, float]:
        """Get conservative emotion governance metrics as fallback."""
        return {
            'emotional_volatility': 0.3,
            'stress_level': 0.3,
            'confidence_level': 0.6,
            'engagement_level': 0.6,
            'governance_risk_score': 0.4
        }
    
    # HELPER METHODS
    
    def _validate_emotion_data(self, emotion_data: Dict[str, float]) -> bool:
        """Validate emotion data format and values."""
        if not isinstance(emotion_data, dict):
            return False
        
        for key, value in emotion_data.items():
            if not isinstance(value, (int, float)):
                return False
            if not (0.0 <= value <= 1.0):
                return False
        
        return True
    
    def _get_session_emotions(self, session_id: str) -> List[Dict[str, Any]]:
        """Get emotion history for a session."""
        return self._session_histories.get(session_id, [])
    
    def _get_analysis_cache_key(self, session_id: str, context: Dict[str, Any]) -> str:
        """Generate cache key for emotion analysis."""
        key_data = {
            'session_id': session_id,
            'context_hash': hashlib.md5(json.dumps(context or {}, sort_keys=True).encode()).hexdigest(),
            'timestamp_hour': datetime.now().hour  # Cache per hour
        }
        
        return hashlib.md5(json.dumps(key_data, sort_keys=True).encode()).hexdigest()
    
    def _get_cached_analysis(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get cached emotion analysis result."""
        if cache_key in self._analysis_cache:
            cached_entry = self._analysis_cache[cache_key]
            
            # Check if cache entry is still valid (1 hour TTL)
            if datetime.now() - cached_entry['timestamp'] < timedelta(hours=1):
                return cached_entry['result']
            else:
                del self._analysis_cache[cache_key]
        
        return None
    
    def _cache_analysis(self, cache_key: str, result: Dict[str, Any]):
        """Cache emotion analysis result."""
        self._analysis_cache[cache_key] = {
            'result': result,
            'timestamp': datetime.now()
        }
        
        # Cleanup old cache entries
        self._cleanup_analysis_cache()
    
    def _cleanup_analysis_cache(self):
        """Cleanup expired cache entries."""
        current_time = datetime.now()
        expired_keys = []
        
        for key, entry in self._analysis_cache.items():
            if current_time - entry['timestamp'] > timedelta(hours=1):
                expired_keys.append(key)
        
        for key in expired_keys:
            del self._analysis_cache[key]
    
    def _invalidate_session_cache(self, session_id: str):
        """Invalidate cache entries for specific session."""
        keys_to_remove = []
        
        for key, entry in self._analysis_cache.items():
            if entry['result'].get('session_id') == session_id:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self._analysis_cache[key]
    
    def _calculate_analysis_confidence(self, session_emotions: List[Dict[str, Any]]) -> float:
        """Calculate confidence in emotion analysis."""
        if not session_emotions:
            return 0.3  # Low confidence for no data
        
        # Confidence based on data quantity and recency
        data_quantity_score = min(len(session_emotions) / 10, 1.0)  # Max confidence at 10+ data points
        
        # Recency score (more recent data = higher confidence)
        if session_emotions:
            latest_timestamp = session_emotions[-1].get('timestamp', datetime.now())
            age_hours = (datetime.now() - latest_timestamp).total_seconds() / 3600
            recency_score = max(0.0, 1.0 - (age_hours / 24))  # Decay over 24 hours
        else:
            recency_score = 0.0
        
        # Combined confidence
        confidence = (data_quantity_score * 0.6) + (recency_score * 0.4)
        
        return max(0.3, min(confidence, 1.0))  # Minimum 30% confidence
    
    async def _analyze_emotional_context(self, 
                                        emotional_state: Dict[str, float], 
                                        context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze emotional state in context."""
        context_analysis = {
            'context_appropriateness': 0.7,  # Default
            'emotional_alignment': 0.7,     # Default
            'risk_factors': []
        }
        
        try:
            # Analyze context appropriateness
            if context.get('task_type') == 'critical':
                required_confidence = 0.8
                actual_confidence = emotional_state.get('confidence', 0.6)
                
                if actual_confidence < required_confidence:
                    context_analysis['context_appropriateness'] = 0.4
                    context_analysis['risk_factors'].append('low_confidence_for_critical_task')
            
            # Analyze stress levels for context
            if context.get('high_stakes') and emotional_state.get('stress_indicators', 0.3) > 0.7:
                context_analysis['emotional_alignment'] = 0.3
                context_analysis['risk_factors'].append('high_stress_in_high_stakes_context')
            
            return context_analysis
            
        except Exception as e:
            logger.error(f"Error analyzing emotional context: {e}")
            return context_analysis
    
    def _get_default_emotion_analysis(self, session_id: str) -> Dict[str, Any]:
        """Get default emotion analysis for sessions with no data."""
        return {
            'session_id': session_id,
            'emotional_state': self._get_conservative_emotional_state(),
            'governance_metrics': self._get_conservative_emotion_governance_metrics(),
            'analysis_timestamp': datetime.now().isoformat(),
            'governance_enabled': self.governance_enabled,
            'data_points': 0,
            'confidence': 0.3,
            'default_analysis': True
        }
    
    def _get_fallback_emotion_analysis(self, session_id: str) -> Dict[str, Any]:
        """Get fallback emotion analysis when analysis fails."""
        logger.warning("Using fallback emotion analysis")
        
        result = self._get_default_emotion_analysis(session_id)
        result['fallback_used'] = True
        result['governance_enabled'] = False
        
        return result
    
    async def _trigger_real_time_analysis(self, session_id: str, emotion_data: Dict[str, float]):
        """Trigger real-time emotion analysis."""
        try:
            # Check if analysis is needed
            if self._should_trigger_analysis(session_id, emotion_data):
                analysis = await self.analyze_emotional_state(session_id)
                
                # Check for alerts
                await self._check_emotion_alerts(analysis)
            
        except Exception as e:
            logger.error(f"Error in real-time emotion analysis: {e}")
    
    def _should_trigger_analysis(self, session_id: str, emotion_data: Dict[str, float]) -> bool:
        """Determine if real-time analysis should be triggered."""
        # Trigger on high stress
        if emotion_data.get('stress', 0) > 0.8:
            return True
        
        # Trigger on low confidence
        if emotion_data.get('confidence', 1.0) < 0.3:
            return True
        
        # Trigger on high frustration
        if emotion_data.get('frustration', 0) > 0.8:
            return True
        
        return False
    
    async def _check_emotion_alerts(self, analysis: Dict[str, Any]):
        """Check for emotion-based alerts."""
        try:
            governance_metrics = analysis.get('governance_metrics', {})
            
            # High stress alert
            if governance_metrics.get('stress_level', 0) > 0.8:
                await self._send_emotion_alert('high_stress', analysis)
            
            # High governance risk alert
            if governance_metrics.get('governance_risk_score', 0) > 0.8:
                await self._send_emotion_alert('high_governance_risk', analysis)
            
        except Exception as e:
            logger.error(f"Error checking emotion alerts: {e}")
    
    async def _send_emotion_alert(self, alert_type: str, analysis: Dict[str, Any]):
        """Send emotion-based alert."""
        if not self.event_bus:
            return
        
        try:
            from promethios.native_governance_training.governance_event_bus import GovernanceEvent, EventPriority
            
            alert_event = GovernanceEvent(
                id=f"emotion_alert_{alert_type}_{datetime.now().timestamp()}",
                type="emotion_alert",
                timestamp=datetime.now(),
                source_component="emotion_logger",
                target_component=None,
                data={
                    'alert_type': alert_type,
                    'session_id': analysis['session_id'],
                    'governance_metrics': analysis['governance_metrics'],
                    'emotional_state': analysis['emotional_state']
                },
                priority=EventPriority.HIGH
            )
            
            await self.event_bus.publish(alert_event)
            
        except Exception as e:
            logger.error(f"Error sending emotion alert: {e}")
    
    async def _real_time_analysis_loop(self):
        """Real-time emotion analysis loop."""
        while self._is_initialized and not self._shutdown_requested:
            try:
                # Process emotion buffer for real-time insights
                if self._emotion_buffer:
                    await self._process_emotion_buffer()
                
                # Sleep for telemetry interval
                await asyncio.sleep(self.telemetry_interval)
                
            except Exception as e:
                logger.error(f"Error in real-time analysis loop: {e}")
                await asyncio.sleep(self.telemetry_interval)
    
    async def _process_emotion_buffer(self):
        """Process emotion buffer for real-time insights."""
        try:
            # Group by session
            session_groups = {}
            for emotion_entry in self._emotion_buffer:
                session_id = emotion_entry['session_id']
                if session_id not in session_groups:
                    session_groups[session_id] = []
                session_groups[session_id].append(emotion_entry)
            
            # Analyze each session
            for session_id, emotions in session_groups.items():
                if len(emotions) >= 3:  # Minimum for analysis
                    await self._trigger_real_time_analysis(session_id, emotions[-1]['emotion_data'])
            
        except Exception as e:
            logger.error(f"Error processing emotion buffer: {e}")
    
    async def _store_emotion_analysis(self, result: Dict[str, Any]):
        """Store emotion analysis for historical tracking."""
        if not self.storage_backend:
            return
        
        try:
            storage_record = {
                'session_id': result['session_id'],
                'emotional_state': result['emotional_state'],
                'governance_metrics': result['governance_metrics'],
                'analysis_timestamp': result['analysis_timestamp'],
                'confidence': result['confidence'],
                'data_points': result['data_points']
            }
            
            await self.storage_backend.store('emotion_analyses', storage_record)
            
        except Exception as e:
            logger.error(f"Error storing emotion analysis: {e}")
    
    async def _publish_emotion_analysis_event(self, result: Dict[str, Any]):
        """Publish emotion analysis event."""
        if not self.event_bus:
            return
        
        try:
            from promethios.native_governance_training.governance_event_bus import GovernanceEvent, EventPriority
            
            event = GovernanceEvent(
                id=f"emotion_analysis_{result['session_id']}_{datetime.now().timestamp()}",
                type="emotion_analysis_completed",
                timestamp=datetime.now(),
                source_component="emotion_logger",
                target_component=None,
                data={
                    'session_id': result['session_id'],
                    'governance_risk_score': result['governance_metrics'].get('governance_risk_score'),
                    'stress_level': result['governance_metrics'].get('stress_level'),
                    'confidence_level': result['governance_metrics'].get('confidence_level'),
                    'analysis_timestamp': result['analysis_timestamp']
                },
                priority=EventPriority.MEDIUM
            )
            
            await self.event_bus.publish(event)
            
        except Exception as e:
            logger.error(f"Error publishing emotion analysis event: {e}")
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on emotion logger."""
        health_status = {
            'component': 'emotion_telemetry_logger',
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'governance_enabled': self.governance_enabled,
            'initialized': self._is_initialized,
            'buffer_size': len(self._emotion_buffer),
            'active_sessions': len(self._session_histories),
            'cache_size': len(self._analysis_cache)
        }
        
        # Check component dependencies
        if self.storage_backend:
            try:
                storage_health = await self.storage_backend.health_check()
                health_status['storage_backend'] = storage_health.get('status', 'unknown')
            except:
                health_status['storage_backend'] = 'error'
                health_status['status'] = 'warning'
        
        if self.event_bus:
            try:
                event_bus_health = await self.event_bus.health_check()
                health_status['event_bus'] = event_bus_health.get('status', 'unknown')
            except:
                health_status['event_bus'] = 'error'
                health_status['status'] = 'warning'
        
        return health_status
    
    async def shutdown(self):
        """Gracefully shutdown emotion logger."""
        logger.info("Shutting down emotion logger...")
        
        self._shutdown_requested = True
        
        # Unsubscribe from events
        if self.event_bus:
            for subscription in self._event_subscriptions:
                try:
                    await self.event_bus.unsubscribe(subscription)
                except Exception as e:
                    logger.error(f"Error unsubscribing from event: {e}")
        
        # Clear caches and buffers
        self._emotion_buffer.clear()
        self._analysis_cache.clear()
        self._session_histories.clear()
        
        # Mark as shutdown
        self._is_initialized = False
        
        logger.info("Emotion logger shutdown complete")
    
    @property
    def is_initialized(self) -> bool:
        """Check if emotion logger is initialized."""
        return self._is_initialized

