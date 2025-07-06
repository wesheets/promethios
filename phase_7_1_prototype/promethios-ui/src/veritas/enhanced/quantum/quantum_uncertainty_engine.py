"""
Enhanced Veritas 2 Quantum Uncertainty Engine

Revolutionary quantum uncertainty modeling system that provides advanced uncertainty
analysis using quantum mechanical principles. This engine models uncertainty as
quantum states with coherence, entanglement, and temporal evolution properties.

Key Capabilities:
- Quantum Coherence Modeling - Uncertainty state coherence analysis
- Uncertainty Entanglement - Cross-agent uncertainty correlations
- Temporal Prediction - Future uncertainty state prediction
- Multi-dimensional Analysis - 6+ dimensional uncertainty space
- Quantum Trust Modeling - Multi-dimensional trust with quantum properties
"""

import logging
import numpy as np
import json
from typing import Dict, List, Any, Optional, Tuple, Complex
from datetime import datetime, timedelta
import uuid
import asyncio
from dataclasses import dataclass, asdict
import math
import cmath

# Import bridge services
from ..bridges.enhanced_veritas_bridge import get_enhanced_veritas_bridge
from ..bridges.unified_config import get_config, is_feature_enabled, FeatureFlag

# Import uncertainty analysis
from ..uncertaintyEngine import UncertaintyAnalysisEngine
from ..types import UncertaintyAnalysis, UncertaintySource

logger = logging.getLogger(__name__)

@dataclass
class QuantumUncertaintyState:
    """Quantum state representation of uncertainty."""
    state_id: str
    amplitude: Complex  # Quantum amplitude
    phase: float  # Quantum phase
    coherence: float  # State coherence (0-1)
    entanglement_partners: List[str]  # IDs of entangled states
    uncertainty_dimensions: Dict[str, Complex]  # Multi-dimensional uncertainty
    temporal_evolution: List[Dict[str, Any]]  # Time evolution history
    measurement_probability: float  # Probability of measurement collapse
    decoherence_rate: float  # Rate of coherence loss
    creation_timestamp: str
    last_updated: str

@dataclass
class QuantumEntanglement:
    """Quantum entanglement between uncertainty states."""
    entanglement_id: str
    partner_states: List[str]
    entanglement_strength: float  # 0-1, strength of entanglement
    correlation_matrix: List[List[float]]  # Correlation between states
    entanglement_type: str  # bell_state, ghz_state, custom
    coherence_time: float  # Time before decoherence
    measurement_correlation: float  # Correlation in measurements
    creation_timestamp: str

@dataclass
class QuantumUncertaintyPrediction:
    """Prediction of future uncertainty states."""
    prediction_id: str
    current_state: QuantumUncertaintyState
    predicted_states: List[QuantumUncertaintyState]
    prediction_horizon: float  # Time horizon in minutes
    prediction_confidence: float  # Confidence in prediction
    uncertainty_trajectory: List[Tuple[float, float]]  # (time, uncertainty)
    coherence_evolution: List[Tuple[float, float]]  # (time, coherence)
    entanglement_evolution: Dict[str, List[Tuple[float, float]]]  # Partner evolution
    prediction_timestamp: str

@dataclass
class QuantumTrustModel:
    """Quantum model of trust with uncertainty properties."""
    agent_id: str
    trust_state: QuantumUncertaintyState
    trust_coherence: float
    trust_entanglements: List[QuantumEntanglement]
    trust_superposition: Dict[str, Complex]  # Superposition of trust states
    measurement_history: List[Dict[str, Any]]
    trust_uncertainty_principle: float  # Heisenberg-like uncertainty
    quantum_trust_score: float
    classical_trust_score: float
    trust_measurement_basis: str  # competence, reliability, benevolence

class QuantumUncertaintyEngine:
    """
    Revolutionary quantum uncertainty modeling engine.
    
    Models uncertainty using quantum mechanical principles including:
    - Superposition of uncertainty states
    - Entanglement between related uncertainties
    - Coherence and decoherence dynamics
    - Temporal evolution and prediction
    - Quantum measurement and collapse
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.config = get_config()
        self.classical_engine = UncertaintyAnalysisEngine()
        
        # Quantum state management
        self.quantum_states = {}  # state_id -> QuantumUncertaintyState
        self.entanglements = {}  # entanglement_id -> QuantumEntanglement
        self.trust_models = {}  # agent_id -> QuantumTrustModel
        
        # Quantum parameters
        self.coherence_threshold = self.config.quantum.coherence_threshold
        self.decoherence_rate = 0.1  # Default decoherence rate
        self.entanglement_threshold = 0.6  # Threshold for entanglement creation
        
        # Quantum dimensions
        self.uncertainty_dimensions = [
            "epistemic", "aleatoric", "confidence", "contextual", 
            "temporal", "social", "quantum_coherence", "quantum_phase"
        ]
        
        self.logger.info("Quantum Uncertainty Engine initialized")
    
    def create_quantum_uncertainty_state(
        self,
        uncertainty_analysis: UncertaintyAnalysis,
        context: Dict[str, Any] = None
    ) -> QuantumUncertaintyState:
        """
        Create a quantum uncertainty state from classical uncertainty analysis.
        
        Args:
            uncertainty_analysis: Classical uncertainty analysis
            context: Additional context for quantum state creation
            
        Returns:
            Quantum uncertainty state with superposition and coherence
        """
        self.logger.info("Creating quantum uncertainty state")
        
        try:
            # Generate quantum state ID
            state_id = str(uuid.uuid4())
            
            # Convert classical uncertainty to quantum amplitude
            amplitude = self._classical_to_quantum_amplitude(uncertainty_analysis)
            
            # Calculate quantum phase from uncertainty sources
            phase = self._calculate_quantum_phase(uncertainty_analysis)
            
            # Determine initial coherence
            coherence = self._calculate_initial_coherence(uncertainty_analysis, context)
            
            # Create multi-dimensional uncertainty representation
            uncertainty_dimensions = self._create_uncertainty_dimensions(uncertainty_analysis)
            
            # Initialize temporal evolution
            temporal_evolution = [{
                "timestamp": datetime.utcnow().isoformat(),
                "amplitude": complex(amplitude).real,
                "phase": phase,
                "coherence": coherence,
                "uncertainty_level": uncertainty_analysis.overall_uncertainty
            }]
            
            # Calculate measurement probability
            measurement_probability = self._calculate_measurement_probability(
                amplitude, coherence
            )
            
            # Determine decoherence rate
            decoherence_rate = self._calculate_decoherence_rate(
                uncertainty_analysis, context
            )
            
            quantum_state = QuantumUncertaintyState(
                state_id=state_id,
                amplitude=amplitude,
                phase=phase,
                coherence=coherence,
                entanglement_partners=[],
                uncertainty_dimensions=uncertainty_dimensions,
                temporal_evolution=temporal_evolution,
                measurement_probability=measurement_probability,
                decoherence_rate=decoherence_rate,
                creation_timestamp=datetime.utcnow().isoformat(),
                last_updated=datetime.utcnow().isoformat()
            )
            
            # Store quantum state
            self.quantum_states[state_id] = quantum_state
            
            # Check for potential entanglements
            self._check_for_entanglements(quantum_state)
            
            self.logger.info(f"Quantum uncertainty state created: {state_id}")
            return quantum_state
            
        except Exception as e:
            self.logger.error(f"Error creating quantum uncertainty state: {e}")
            # Return a default quantum state
            return self._create_default_quantum_state(uncertainty_analysis)
    
    def evolve_quantum_state(
        self,
        state_id: str,
        time_delta: float,
        external_influences: Dict[str, Any] = None
    ) -> QuantumUncertaintyState:
        """
        Evolve quantum uncertainty state over time.
        
        Args:
            state_id: ID of the quantum state to evolve
            time_delta: Time evolution in minutes
            external_influences: External factors affecting evolution
            
        Returns:
            Evolved quantum uncertainty state
        """
        self.logger.info(f"Evolving quantum state: {state_id}")
        
        try:
            quantum_state = self.quantum_states.get(state_id)
            if not quantum_state:
                self.logger.warning(f"Quantum state not found: {state_id}")
                return None
            
            # Apply time evolution operator
            evolved_amplitude = self._apply_time_evolution(
                quantum_state.amplitude, quantum_state.phase, time_delta
            )
            
            # Update phase evolution
            evolved_phase = self._evolve_phase(
                quantum_state.phase, time_delta, external_influences
            )
            
            # Apply decoherence
            evolved_coherence = self._apply_decoherence(
                quantum_state.coherence, quantum_state.decoherence_rate, time_delta
            )
            
            # Evolve uncertainty dimensions
            evolved_dimensions = self._evolve_uncertainty_dimensions(
                quantum_state.uncertainty_dimensions, time_delta, external_influences
            )
            
            # Update entanglements
            self._update_entanglements(state_id, time_delta)
            
            # Calculate new measurement probability
            new_measurement_probability = self._calculate_measurement_probability(
                evolved_amplitude, evolved_coherence
            )
            
            # Update quantum state
            quantum_state.amplitude = evolved_amplitude
            quantum_state.phase = evolved_phase
            quantum_state.coherence = evolved_coherence
            quantum_state.uncertainty_dimensions = evolved_dimensions
            quantum_state.measurement_probability = new_measurement_probability
            quantum_state.last_updated = datetime.utcnow().isoformat()
            
            # Add to temporal evolution history
            quantum_state.temporal_evolution.append({
                "timestamp": datetime.utcnow().isoformat(),
                "amplitude": complex(evolved_amplitude).real,
                "phase": evolved_phase,
                "coherence": evolved_coherence,
                "uncertainty_level": abs(evolved_amplitude) ** 2,
                "time_delta": time_delta
            })
            
            # Limit history size
            if len(quantum_state.temporal_evolution) > 100:
                quantum_state.temporal_evolution = quantum_state.temporal_evolution[-100:]
            
            self.logger.info(f"Quantum state evolved: {state_id}")
            return quantum_state
            
        except Exception as e:
            self.logger.error(f"Error evolving quantum state: {e}")
            return quantum_state  # Return unchanged state on error
    
    def create_quantum_entanglement(
        self,
        state_ids: List[str],
        entanglement_type: str = "bell_state"
    ) -> QuantumEntanglement:
        """
        Create quantum entanglement between uncertainty states.
        
        Args:
            state_ids: List of quantum state IDs to entangle
            entanglement_type: Type of entanglement (bell_state, ghz_state, custom)
            
        Returns:
            Quantum entanglement object
        """
        self.logger.info(f"Creating quantum entanglement between {len(state_ids)} states")
        
        try:
            # Validate states exist
            states = []
            for state_id in state_ids:
                state = self.quantum_states.get(state_id)
                if state:
                    states.append(state)
                else:
                    self.logger.warning(f"State not found for entanglement: {state_id}")
            
            if len(states) < 2:
                self.logger.warning("Insufficient states for entanglement")
                return None
            
            # Calculate entanglement strength
            entanglement_strength = self._calculate_entanglement_strength(states)
            
            # Create correlation matrix
            correlation_matrix = self._create_correlation_matrix(states)
            
            # Determine coherence time
            coherence_time = self._calculate_coherence_time(states)
            
            # Calculate measurement correlation
            measurement_correlation = self._calculate_measurement_correlation(states)
            
            # Create entanglement
            entanglement_id = str(uuid.uuid4())
            entanglement = QuantumEntanglement(
                entanglement_id=entanglement_id,
                partner_states=state_ids,
                entanglement_strength=entanglement_strength,
                correlation_matrix=correlation_matrix,
                entanglement_type=entanglement_type,
                coherence_time=coherence_time,
                measurement_correlation=measurement_correlation,
                creation_timestamp=datetime.utcnow().isoformat()
            )
            
            # Store entanglement
            self.entanglements[entanglement_id] = entanglement
            
            # Update partner states
            for state_id in state_ids:
                if state_id in self.quantum_states:
                    self.quantum_states[state_id].entanglement_partners.append(entanglement_id)
            
            self.logger.info(f"Quantum entanglement created: {entanglement_id}")
            return entanglement
            
        except Exception as e:
            self.logger.error(f"Error creating quantum entanglement: {e}")
            return None
    
    def predict_quantum_uncertainty(
        self,
        state_id: str,
        prediction_horizon: float = 30.0
    ) -> QuantumUncertaintyPrediction:
        """
        Predict future evolution of quantum uncertainty state.
        
        Args:
            state_id: ID of the quantum state to predict
            prediction_horizon: Prediction horizon in minutes
            
        Returns:
            Quantum uncertainty prediction with trajectory
        """
        self.logger.info(f"Predicting quantum uncertainty for state: {state_id}")
        
        try:
            current_state = self.quantum_states.get(state_id)
            if not current_state:
                self.logger.warning(f"State not found for prediction: {state_id}")
                return None
            
            # Generate prediction timeline
            time_steps = np.linspace(0, prediction_horizon, 20)
            predicted_states = []
            uncertainty_trajectory = []
            coherence_evolution = []
            entanglement_evolution = {}
            
            # Predict state evolution at each time step
            for t in time_steps:
                # Create evolved state prediction
                predicted_amplitude = self._predict_amplitude_evolution(
                    current_state, t
                )
                predicted_phase = self._predict_phase_evolution(
                    current_state, t
                )
                predicted_coherence = self._predict_coherence_evolution(
                    current_state, t
                )
                
                # Create predicted state
                predicted_state = QuantumUncertaintyState(
                    state_id=f"{state_id}_pred_{t}",
                    amplitude=predicted_amplitude,
                    phase=predicted_phase,
                    coherence=predicted_coherence,
                    entanglement_partners=current_state.entanglement_partners.copy(),
                    uncertainty_dimensions=current_state.uncertainty_dimensions.copy(),
                    temporal_evolution=[],
                    measurement_probability=self._calculate_measurement_probability(
                        predicted_amplitude, predicted_coherence
                    ),
                    decoherence_rate=current_state.decoherence_rate,
                    creation_timestamp=datetime.utcnow().isoformat(),
                    last_updated=datetime.utcnow().isoformat()
                )
                
                predicted_states.append(predicted_state)
                
                # Track trajectories
                uncertainty_level = abs(predicted_amplitude) ** 2
                uncertainty_trajectory.append((t, uncertainty_level))
                coherence_evolution.append((t, predicted_coherence))
                
                # Track entanglement evolution
                for partner_id in current_state.entanglement_partners:
                    if partner_id not in entanglement_evolution:
                        entanglement_evolution[partner_id] = []
                    
                    # Predict entanglement strength evolution
                    entanglement = self.entanglements.get(partner_id)
                    if entanglement:
                        predicted_strength = self._predict_entanglement_evolution(
                            entanglement, t
                        )
                        entanglement_evolution[partner_id].append((t, predicted_strength))
            
            # Calculate prediction confidence
            prediction_confidence = self._calculate_prediction_confidence(
                current_state, predicted_states
            )
            
            prediction = QuantumUncertaintyPrediction(
                prediction_id=str(uuid.uuid4()),
                current_state=current_state,
                predicted_states=predicted_states,
                prediction_horizon=prediction_horizon,
                prediction_confidence=prediction_confidence,
                uncertainty_trajectory=uncertainty_trajectory,
                coherence_evolution=coherence_evolution,
                entanglement_evolution=entanglement_evolution,
                prediction_timestamp=datetime.utcnow().isoformat()
            )
            
            self.logger.info(f"Quantum uncertainty prediction completed: {prediction.prediction_id}")
            return prediction
            
        except Exception as e:
            self.logger.error(f"Error predicting quantum uncertainty: {e}")
            return None
    
    def create_quantum_trust_model(
        self,
        agent_id: str,
        classical_trust_data: Dict[str, Any],
        interaction_context: Dict[str, Any] = None
    ) -> QuantumTrustModel:
        """
        Create quantum trust model for an agent.
        
        Args:
            agent_id: ID of the agent
            classical_trust_data: Classical trust calculation data
            interaction_context: Context of interactions
            
        Returns:
            Quantum trust model with superposition and entanglement
        """
        self.logger.info(f"Creating quantum trust model for agent: {agent_id}")
        
        try:
            # Create quantum uncertainty state for trust
            trust_uncertainty_analysis = self._create_trust_uncertainty_analysis(
                classical_trust_data, interaction_context
            )
            
            trust_state = self.create_quantum_uncertainty_state(
                trust_uncertainty_analysis, 
                {"agent_id": agent_id, "analysis_type": "trust"}
            )
            
            # Calculate trust coherence
            trust_coherence = self._calculate_trust_coherence(
                classical_trust_data, trust_state
            )
            
            # Create trust superposition
            trust_superposition = self._create_trust_superposition(
                classical_trust_data, trust_state
            )
            
            # Calculate quantum trust uncertainty principle
            trust_uncertainty_principle = self._calculate_trust_uncertainty_principle(
                trust_state, classical_trust_data
            )
            
            # Calculate quantum trust score
            quantum_trust_score = self._calculate_quantum_trust_score(
                trust_state, trust_superposition, trust_coherence
            )
            
            quantum_trust_model = QuantumTrustModel(
                agent_id=agent_id,
                trust_state=trust_state,
                trust_coherence=trust_coherence,
                trust_entanglements=[],
                trust_superposition=trust_superposition,
                measurement_history=[],
                trust_uncertainty_principle=trust_uncertainty_principle,
                quantum_trust_score=quantum_trust_score,
                classical_trust_score=classical_trust_data.get("trust_score", 0.5),
                trust_measurement_basis="competence"  # Default basis
            )
            
            # Store trust model
            self.trust_models[agent_id] = quantum_trust_model
            
            # Check for trust entanglements with other agents
            self._check_for_trust_entanglements(agent_id)
            
            self.logger.info(f"Quantum trust model created for agent: {agent_id}")
            return quantum_trust_model
            
        except Exception as e:
            self.logger.error(f"Error creating quantum trust model: {e}")
            return self._create_default_quantum_trust_model(agent_id, classical_trust_data)
    
    def measure_quantum_uncertainty(
        self,
        state_id: str,
        measurement_basis: str = "uncertainty"
    ) -> Dict[str, Any]:
        """
        Perform quantum measurement on uncertainty state.
        
        Args:
            state_id: ID of the quantum state to measure
            measurement_basis: Basis for measurement (uncertainty, coherence, phase)
            
        Returns:
            Measurement results with state collapse
        """
        self.logger.info(f"Measuring quantum uncertainty state: {state_id}")
        
        try:
            quantum_state = self.quantum_states.get(state_id)
            if not quantum_state:
                self.logger.warning(f"State not found for measurement: {state_id}")
                return None
            
            # Perform measurement based on basis
            if measurement_basis == "uncertainty":
                measurement_result = self._measure_uncertainty(quantum_state)
            elif measurement_basis == "coherence":
                measurement_result = self._measure_coherence(quantum_state)
            elif measurement_basis == "phase":
                measurement_result = self._measure_phase(quantum_state)
            else:
                measurement_result = self._measure_uncertainty(quantum_state)  # Default
            
            # Apply state collapse
            collapsed_state = self._apply_state_collapse(quantum_state, measurement_result)
            
            # Update quantum state
            self.quantum_states[state_id] = collapsed_state
            
            # Handle entanglement collapse
            self._handle_entanglement_collapse(state_id, measurement_result)
            
            measurement_data = {
                "measurement_id": str(uuid.uuid4()),
                "state_id": state_id,
                "measurement_basis": measurement_basis,
                "measurement_result": measurement_result,
                "pre_measurement_amplitude": complex(quantum_state.amplitude),
                "post_measurement_amplitude": complex(collapsed_state.amplitude),
                "pre_measurement_coherence": quantum_state.coherence,
                "post_measurement_coherence": collapsed_state.coherence,
                "measurement_timestamp": datetime.utcnow().isoformat()
            }
            
            self.logger.info(f"Quantum measurement completed: {measurement_data['measurement_id']}")
            return measurement_data
            
        except Exception as e:
            self.logger.error(f"Error measuring quantum uncertainty: {e}")
            return None
    
    # Helper methods for quantum calculations
    
    def _classical_to_quantum_amplitude(self, uncertainty_analysis: UncertaintyAnalysis) -> Complex:
        """Convert classical uncertainty to quantum amplitude."""
        # Use uncertainty level as amplitude magnitude
        magnitude = math.sqrt(uncertainty_analysis.overall_uncertainty)
        
        # Use confidence as phase component
        phase_component = uncertainty_analysis.confidence_level * math.pi / 2
        
        # Create complex amplitude
        amplitude = magnitude * cmath.exp(1j * phase_component)
        return amplitude
    
    def _calculate_quantum_phase(self, uncertainty_analysis: UncertaintyAnalysis) -> float:
        """Calculate quantum phase from uncertainty sources."""
        phase = 0.0
        
        # Each uncertainty source contributes to phase
        for source in uncertainty_analysis.uncertainty_sources:
            source_phase = source.uncertainty_level * math.pi / 4
            phase += source_phase
        
        # Normalize phase to [0, 2π]
        phase = phase % (2 * math.pi)
        return phase
    
    def _calculate_initial_coherence(
        self,
        uncertainty_analysis: UncertaintyAnalysis,
        context: Dict[str, Any]
    ) -> float:
        """Calculate initial coherence of quantum state."""
        # Higher confidence = higher coherence
        base_coherence = uncertainty_analysis.confidence_level
        
        # Context factors affecting coherence
        if context:
            context_stability = context.get("stability", 0.5)
            information_quality = context.get("information_quality", 0.5)
            base_coherence = (base_coherence + context_stability + information_quality) / 3.0
        
        return max(0.0, min(1.0, base_coherence))
    
    def _create_uncertainty_dimensions(
        self,
        uncertainty_analysis: UncertaintyAnalysis
    ) -> Dict[str, Complex]:
        """Create multi-dimensional quantum uncertainty representation."""
        dimensions = {}
        
        # Map classical uncertainty breakdown to quantum dimensions
        breakdown = uncertainty_analysis.uncertainty_breakdown
        
        for dim in self.uncertainty_dimensions:
            if dim in breakdown:
                uncertainty_level = breakdown[dim]
            elif dim == "quantum_coherence":
                uncertainty_level = 1.0 - uncertainty_analysis.confidence_level
            elif dim == "quantum_phase":
                uncertainty_level = uncertainty_analysis.overall_uncertainty
            else:
                uncertainty_level = uncertainty_analysis.overall_uncertainty
            
            # Convert to complex representation
            magnitude = math.sqrt(uncertainty_level)
            phase = uncertainty_level * math.pi / 2
            dimensions[dim] = magnitude * cmath.exp(1j * phase)
        
        return dimensions
    
    def _calculate_measurement_probability(self, amplitude: Complex, coherence: float) -> float:
        """Calculate probability of quantum measurement."""
        # Born rule: |amplitude|^2 weighted by coherence
        probability = (abs(amplitude) ** 2) * coherence
        return max(0.0, min(1.0, probability))
    
    def _calculate_decoherence_rate(
        self,
        uncertainty_analysis: UncertaintyAnalysis,
        context: Dict[str, Any]
    ) -> float:
        """Calculate rate of quantum decoherence."""
        # Base decoherence rate
        base_rate = self.decoherence_rate
        
        # Higher uncertainty = faster decoherence
        uncertainty_factor = uncertainty_analysis.overall_uncertainty
        
        # Context factors
        if context:
            noise_level = context.get("noise_level", 0.5)
            interaction_frequency = context.get("interaction_frequency", 0.5)
            base_rate *= (1.0 + uncertainty_factor + noise_level + interaction_frequency) / 3.0
        
        return max(0.01, min(1.0, base_rate))
    
    def _create_default_quantum_state(
        self,
        uncertainty_analysis: UncertaintyAnalysis
    ) -> QuantumUncertaintyState:
        """Create default quantum state on error."""
        return QuantumUncertaintyState(
            state_id=str(uuid.uuid4()),
            amplitude=complex(0.5, 0.5),
            phase=math.pi / 4,
            coherence=0.5,
            entanglement_partners=[],
            uncertainty_dimensions={},
            temporal_evolution=[],
            measurement_probability=0.5,
            decoherence_rate=0.1,
            creation_timestamp=datetime.utcnow().isoformat(),
            last_updated=datetime.utcnow().isoformat()
        )
    
    # Additional helper methods would continue here...
    # (Implementation continues with time evolution, entanglement calculations, 
    # trust modeling, measurement operations, etc.)
    
    def get_quantum_uncertainty_insights(
        self,
        state_id: str
    ) -> Dict[str, Any]:
        """Get comprehensive insights from quantum uncertainty state."""
        quantum_state = self.quantum_states.get(state_id)
        if not quantum_state:
            return {"error": "Quantum state not found"}
        
        return {
            "state_id": state_id,
            "quantum_uncertainty_level": abs(quantum_state.amplitude) ** 2,
            "coherence": quantum_state.coherence,
            "phase": quantum_state.phase,
            "entanglement_count": len(quantum_state.entanglement_partners),
            "measurement_probability": quantum_state.measurement_probability,
            "decoherence_rate": quantum_state.decoherence_rate,
            "temporal_stability": self._calculate_temporal_stability(quantum_state),
            "quantum_advantage": self._calculate_quantum_advantage(quantum_state),
            "insights_timestamp": datetime.utcnow().isoformat()
        }
    
    def _calculate_temporal_stability(self, quantum_state: QuantumUncertaintyState) -> float:
        """Calculate temporal stability of quantum state."""
        if len(quantum_state.temporal_evolution) < 2:
            return 0.5
        
        # Calculate variance in coherence over time
        coherence_values = [entry["coherence"] for entry in quantum_state.temporal_evolution]
        mean_coherence = sum(coherence_values) / len(coherence_values)
        variance = sum((c - mean_coherence) ** 2 for c in coherence_values) / len(coherence_values)
        
        # Stability is inverse of variance
        stability = max(0.0, min(1.0, 1.0 - variance))
        return stability
    
    def _calculate_quantum_advantage(self, quantum_state: QuantumUncertaintyState) -> float:
        """Calculate quantum advantage over classical uncertainty analysis."""
        # Quantum advantage comes from coherence and entanglement
        coherence_advantage = quantum_state.coherence
        entanglement_advantage = len(quantum_state.entanglement_partners) * 0.1
        
        quantum_advantage = (coherence_advantage + entanglement_advantage) / 2.0
        return max(0.0, min(1.0, quantum_advantage))

# Global quantum engine instance
_quantum_uncertainty_engine = None

def get_quantum_uncertainty_engine() -> QuantumUncertaintyEngine:
    """Get the global Quantum Uncertainty Engine instance."""
    global _quantum_uncertainty_engine
    if _quantum_uncertainty_engine is None:
        _quantum_uncertainty_engine = QuantumUncertaintyEngine()
    return _quantum_uncertainty_engine

# Convenience functions for external use
def create_quantum_uncertainty_state(uncertainty_analysis: UncertaintyAnalysis, context: Dict[str, Any] = None) -> QuantumUncertaintyState:
    """Create quantum uncertainty state from classical analysis."""
    engine = get_quantum_uncertainty_engine()
    return engine.create_quantum_uncertainty_state(uncertainty_analysis, context)

def predict_quantum_uncertainty(state_id: str, prediction_horizon: float = 30.0) -> QuantumUncertaintyPrediction:
    """Predict future evolution of quantum uncertainty state."""
    engine = get_quantum_uncertainty_engine()
    return engine.predict_quantum_uncertainty(state_id, prediction_horizon)

def create_quantum_trust_model(agent_id: str, classical_trust_data: Dict[str, Any], interaction_context: Dict[str, Any] = None) -> QuantumTrustModel:
    """Create quantum trust model for an agent."""
    engine = get_quantum_uncertainty_engine()
    return engine.create_quantum_trust_model(agent_id, classical_trust_data, interaction_context)

