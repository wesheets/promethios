"""
Persona Registry for Promethios.

This module provides comprehensive persona management within the Promethios
governance system. It enables personas to be defined, configured, adapted,
and tracked across the multi-agent ecosystem.
"""

import os
import json
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, NamedTuple
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

class PersonaType(Enum):
    """Persona type enumeration."""
    PROFESSIONAL = "professional"
    CREATIVE = "creative"
    ANALYTICAL = "analytical"
    COLLABORATIVE = "collaborative"
    LEADERSHIP = "leadership"
    TECHNICAL = "technical"
    SUPPORTIVE = "supportive"
    INNOVATIVE = "innovative"

class PersonalityTrait(Enum):
    """Personality trait enumeration."""
    OPENNESS = "openness"
    CONSCIENTIOUSNESS = "conscientiousness"
    EXTRAVERSION = "extraversion"
    AGREEABLENESS = "agreeableness"
    NEUROTICISM = "neuroticism"
    CREATIVITY = "creativity"
    ASSERTIVENESS = "assertiveness"
    EMPATHY = "empathy"

class PersonaStatus(Enum):
    """Persona status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    LEARNING = "learning"
    ADAPTING = "adapting"
    DEPRECATED = "deprecated"

class CommunicationStyle(Enum):
    """Communication style enumeration."""
    FORMAL = "formal"
    CASUAL = "casual"
    TECHNICAL = "technical"
    FRIENDLY = "friendly"
    DIRECT = "direct"
    DIPLOMATIC = "diplomatic"
    ENCOURAGING = "encouraging"
    ANALYTICAL = "analytical"

class PersonalityProfile(NamedTuple):
    """Personality profile definition."""
    trait: str
    score: float
    confidence: float
    description: str

class PersonaRegistrationResult(NamedTuple):
    """Result of persona registration."""
    success: bool
    persona_id: Optional[str] = None
    error: Optional[str] = None
    registration_timestamp: Optional[str] = None

class PersonaRegistry:
    """Registry for managing persona lifecycle and adaptation."""
    
    def __init__(
        self,
        schema_validator,
        seal_verification_service,
        registry_path: str,
        governance_integration=None,
        agent_registry=None
    ):
        """Initialize the persona registry.
        
        Args:
            schema_validator: Validator for JSON schemas.
            seal_verification_service: Service for creating and verifying seals.
            registry_path: Path to the registry JSON file.
            governance_integration: Optional governance integration service.
            agent_registry: Optional agent registry for persona assignment.
        """
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        self.registry_path = registry_path
        self.governance_integration = governance_integration
        self.agent_registry = agent_registry
        self.personas = {}
        self.persona_assignments = {}
        self.persona_interactions = {}
        self.persona_adaptations = {}
        
        # Load existing registry if available
        self._load_registry()
    
    def _load_registry(self):
        """Load the registry from the JSON file."""
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, 'r') as f:
                    data = json.load(f)
                
                # Verify the seal
                if not self.seal_verification_service.verify_seal(data):
                    logger.error("Persona registry file seal verification failed")
                    raise ValueError("Persona registry file seal verification failed")
                
                # Load registry data
                self.personas = data.get("personas", {})
                self.persona_assignments = data.get("persona_assignments", {})
                self.persona_interactions = data.get("persona_interactions", {})
                self.persona_adaptations = data.get("persona_adaptations", {})
                
                logger.info(f"Loaded {len(self.personas)} personas from registry")
            except Exception as e:
                logger.error(f"Error loading persona registry: {str(e)}")
                self._initialize_empty_registry()
    
    def _initialize_empty_registry(self):
        """Initialize empty registry structures."""
        self.personas = {}
        self.persona_assignments = {}
        self.persona_interactions = {}
        self.persona_adaptations = {}
    
    def _save_registry(self):
        """Save the registry to the JSON file."""
        # Create directory if it doesn't exist
        directory = os.path.dirname(self.registry_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
        
        # Prepare data for serialization
        data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "save_persona_registry",
            "personas": self.personas,
            "persona_assignments": self.persona_assignments,
            "persona_interactions": self.persona_interactions,
            "persona_adaptations": self.persona_adaptations
        }
        
        # Create a seal
        data["seal"] = self.seal_verification_service.create_seal(data)
        
        # Save to file
        with open(self.registry_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved {len(self.personas)} personas to registry")
    
    def _get_registry_state_hash(self) -> str:
        """Get a hash of the current registry state.
        
        Returns:
            Hash of the current registry state.
        """
        # Create a string representation of the registry state
        state_data = {
            "personas": self.personas,
            "persona_assignments": self.persona_assignments,
            "persona_interactions": self.persona_interactions,
            "persona_adaptations": self.persona_adaptations
        }
        state_str = json.dumps(state_data, sort_keys=True)
        
        # Create a hash of the state
        return str(hash(state_str))
    
    def register_persona(self, persona_data: Dict[str, Any]) -> PersonaRegistrationResult:
        """Register a new persona.
        
        Args:
            persona_data: Data for the persona to register.
                Must include persona_id, name, description, persona_type,
                personality_profile, communication_style, and governance configuration.
                
        Returns:
            PersonaRegistrationResult with success status and details.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "register_persona",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return PersonaRegistrationResult(
                    success=False,
                    error="Pre-loop tether verification failed"
                )
            
            # Validate the persona data
            validation_result = self.schema_validator.validate(persona_data, "persona_registration.schema.v1.json")
            if not validation_result.is_valid:
                logger.error(f"Persona validation failed: {validation_result.errors}")
                return PersonaRegistrationResult(
                    success=False,
                    error=f"Persona validation failed: {validation_result.errors}"
                )
            
            # Check if the persona already exists
            persona_id = persona_data["persona_id"]
            if persona_id in self.personas:
                logger.error(f"Persona {persona_id} already exists")
                return PersonaRegistrationResult(
                    success=False,
                    error=f"Persona {persona_id} already exists"
                )
            
            # Prepare the persona data
            registration_timestamp = datetime.utcnow().isoformat()
            persona = {
                "persona_id": persona_id,
                "name": persona_data["name"],
                "description": persona_data["description"],
                "persona_type": persona_data["persona_type"],
                "version": persona_data.get("version", "1.0.0"),
                "author": persona_data.get("author", "unknown"),
                "personality_profile": persona_data["personality_profile"],
                "communication_style": persona_data["communication_style"],
                "behavioral_patterns": persona_data.get("behavioral_patterns", {}),
                "decision_making_style": persona_data.get("decision_making_style", {}),
                "interaction_preferences": persona_data.get("interaction_preferences", {}),
                "governance_config": persona_data.get("governance_config", {}),
                "metadata": persona_data.get("metadata", {}),
                "registration_timestamp": registration_timestamp,
                "status": PersonaStatus.ACTIVE.value,
                "usage_count": 0,
                "last_used": None,
                "adaptation_history": []
            }
            
            # Create a seal for the persona
            persona["seal"] = self.seal_verification_service.create_seal(persona)
            
            # Add the persona to the registry
            self.personas[persona_id] = persona
            
            # Initialize persona interactions tracking
            self.persona_interactions[persona_id] = {
                "total_interactions": 0,
                "successful_interactions": 0,
                "interaction_quality_scores": [],
                "collaboration_patterns": {},
                "feedback_history": []
            }
            
            # Initialize persona adaptations tracking
            self.persona_adaptations[persona_id] = {
                "adaptation_count": 0,
                "last_adaptation": None,
                "adaptation_triggers": [],
                "performance_improvements": []
            }
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Registered persona {persona_id}")
            return PersonaRegistrationResult(
                success=True,
                persona_id=persona_id,
                registration_timestamp=registration_timestamp
            )
            
        except Exception as e:
            logger.error(f"Error registering persona: {str(e)}")
            return PersonaRegistrationResult(
                success=False,
                error=f"Error registering persona: {str(e)}"
            )
    
    def assign_persona_to_agent(self, persona_id: str, agent_id: str, assignment_config: Optional[Dict[str, Any]] = None) -> bool:
        """Assign a persona to an agent.
        
        Args:
            persona_id: ID of the persona to assign.
            agent_id: ID of the agent to assign the persona to.
            assignment_config: Optional configuration for the assignment.
            
        Returns:
            True if the assignment was successful.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "assign_persona_to_agent",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return False
            
            # Check if the persona exists
            if persona_id not in self.personas:
                logger.error(f"Persona {persona_id} does not exist")
                return False
            
            # Check if the agent exists (if agent registry is available)
            if self.agent_registry and not self.agent_registry.check_agent_exists(agent_id):
                logger.error(f"Agent {agent_id} does not exist")
                return False
            
            # Prepare the assignment data
            assignment = {
                "persona_id": persona_id,
                "agent_id": agent_id,
                "assignment_timestamp": datetime.utcnow().isoformat(),
                "assignment_config": assignment_config or {},
                "status": "active",
                "performance_metrics": {
                    "interaction_quality": 0.0,
                    "task_completion_rate": 0.0,
                    "user_satisfaction": 0.0,
                    "governance_compliance": 0.0
                }
            }
            
            # Create a seal for the assignment
            assignment["seal"] = self.seal_verification_service.create_seal(assignment)
            
            # Add the assignment to the registry
            self.persona_assignments[agent_id] = assignment
            
            # Update persona usage
            self.personas[persona_id]["usage_count"] += 1
            self.personas[persona_id]["last_used"] = datetime.utcnow().isoformat()
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Assigned persona {persona_id} to agent {agent_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error assigning persona to agent: {str(e)}")
            return False
    
    def adapt_persona(self, persona_id: str, adaptation_data: Dict[str, Any]) -> bool:
        """Adapt a persona based on feedback and performance data.
        
        Args:
            persona_id: ID of the persona to adapt.
            adaptation_data: Data for the adaptation including feedback, performance metrics, and triggers.
            
        Returns:
            True if the adaptation was successful.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "adapt_persona",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return False
            
            # Check if the persona exists
            if persona_id not in self.personas:
                logger.error(f"Persona {persona_id} does not exist")
                return False
            
            persona = self.personas[persona_id]
            
            # Analyze adaptation triggers
            adaptation_triggers = adaptation_data.get("triggers", [])
            performance_metrics = adaptation_data.get("performance_metrics", {})
            feedback = adaptation_data.get("feedback", {})
            
            # Calculate adaptation changes
            adaptations = self._calculate_persona_adaptations(persona, adaptation_triggers, performance_metrics, feedback)
            
            if adaptations:
                # Apply adaptations to persona
                for adaptation_type, changes in adaptations.items():
                    if adaptation_type == "personality_profile":
                        self._adapt_personality_profile(persona, changes)
                    elif adaptation_type == "communication_style":
                        self._adapt_communication_style(persona, changes)
                    elif adaptation_type == "behavioral_patterns":
                        self._adapt_behavioral_patterns(persona, changes)
                
                # Record adaptation
                adaptation_record = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "triggers": adaptation_triggers,
                    "adaptations": adaptations,
                    "performance_before": performance_metrics.get("before", {}),
                    "performance_after": performance_metrics.get("after", {}),
                    "feedback": feedback
                }
                
                persona["adaptation_history"].append(adaptation_record)
                
                # Update adaptation tracking
                self.persona_adaptations[persona_id]["adaptation_count"] += 1
                self.persona_adaptations[persona_id]["last_adaptation"] = datetime.utcnow().isoformat()
                self.persona_adaptations[persona_id]["adaptation_triggers"].extend(adaptation_triggers)
                
                # Update persona status
                persona["status"] = PersonaStatus.ADAPTING.value
                
                # Save the updated registry
                self._save_registry()
                
                logger.info(f"Adapted persona {persona_id} with {len(adaptations)} changes")
                return True
            else:
                logger.info(f"No adaptations needed for persona {persona_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error adapting persona {persona_id}: {str(e)}")
            return False
    
    def _calculate_persona_adaptations(self, persona: Dict[str, Any], triggers: List[str], 
                                     performance_metrics: Dict[str, Any], feedback: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate persona adaptations based on triggers and feedback.
        
        Args:
            persona: Persona data.
            triggers: List of adaptation triggers.
            performance_metrics: Performance metrics data.
            feedback: Feedback data.
            
        Returns:
            Dictionary of adaptations to apply.
        """
        adaptations = {}
        
        # Analyze performance metrics
        current_performance = performance_metrics.get("current", {})
        target_performance = performance_metrics.get("target", {})
        
        # Check for low interaction quality
        if current_performance.get("interaction_quality", 1.0) < 0.7:
            if "low_interaction_quality" in triggers:
                adaptations["communication_style"] = {
                    "increase_empathy": 0.1,
                    "adjust_formality": -0.05 if persona["communication_style"] == CommunicationStyle.FORMAL.value else 0.05
                }
        
        # Check for low task completion rate
        if current_performance.get("task_completion_rate", 1.0) < 0.8:
            if "low_task_completion" in triggers:
                adaptations["personality_profile"] = {
                    PersonalityTrait.CONSCIENTIOUSNESS.value: 0.1,
                    PersonalityTrait.ASSERTIVENESS.value: 0.05
                }
        
        # Check for low user satisfaction
        if current_performance.get("user_satisfaction", 1.0) < 0.75:
            if "low_user_satisfaction" in triggers:
                adaptations["behavioral_patterns"] = {
                    "increase_responsiveness": 0.1,
                    "improve_helpfulness": 0.1
                }
        
        # Analyze feedback
        if feedback.get("communication_feedback"):
            comm_feedback = feedback["communication_feedback"]
            if comm_feedback.get("too_formal", False):
                adaptations.setdefault("communication_style", {})["reduce_formality"] = 0.1
            if comm_feedback.get("too_casual", False):
                adaptations.setdefault("communication_style", {})["increase_formality"] = 0.1
        
        return adaptations
    
    def _adapt_personality_profile(self, persona: Dict[str, Any], changes: Dict[str, float]):
        """Adapt personality profile based on changes.
        
        Args:
            persona: Persona data.
            changes: Changes to apply to personality traits.
        """
        personality_profile = persona["personality_profile"]
        
        for trait, adjustment in changes.items():
            if trait in personality_profile:
                current_score = personality_profile[trait].get("score", 0.5)
                new_score = max(0.0, min(1.0, current_score + adjustment))
                personality_profile[trait]["score"] = new_score
                
                # Update confidence based on adaptation
                current_confidence = personality_profile[trait].get("confidence", 0.5)
                personality_profile[trait]["confidence"] = min(1.0, current_confidence + 0.05)
    
    def _adapt_communication_style(self, persona: Dict[str, Any], changes: Dict[str, float]):
        """Adapt communication style based on changes.
        
        Args:
            persona: Persona data.
            changes: Changes to apply to communication style.
        """
        # This would involve more sophisticated communication style adaptation
        # For now, we'll update metadata to track the changes
        if "communication_adaptations" not in persona["metadata"]:
            persona["metadata"]["communication_adaptations"] = []
        
        persona["metadata"]["communication_adaptations"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "changes": changes
        })
    
    def _adapt_behavioral_patterns(self, persona: Dict[str, Any], changes: Dict[str, float]):
        """Adapt behavioral patterns based on changes.
        
        Args:
            persona: Persona data.
            changes: Changes to apply to behavioral patterns.
        """
        behavioral_patterns = persona.get("behavioral_patterns", {})
        
        for pattern, adjustment in changes.items():
            if pattern in behavioral_patterns:
                current_value = behavioral_patterns[pattern]
                if isinstance(current_value, (int, float)):
                    behavioral_patterns[pattern] = max(0.0, min(1.0, current_value + adjustment))
            else:
                behavioral_patterns[pattern] = max(0.0, min(1.0, adjustment))
        
        persona["behavioral_patterns"] = behavioral_patterns
    
    def record_persona_interaction(self, persona_id: str, interaction_data: Dict[str, Any]) -> bool:
        """Record a persona interaction for tracking and adaptation.
        
        Args:
            persona_id: ID of the persona.
            interaction_data: Data about the interaction.
            
        Returns:
            True if the interaction was recorded successfully.
        """
        try:
            if persona_id not in self.personas:
                logger.error(f"Persona {persona_id} does not exist")
                return False
            
            if persona_id not in self.persona_interactions:
                self.persona_interactions[persona_id] = {
                    "total_interactions": 0,
                    "successful_interactions": 0,
                    "interaction_quality_scores": [],
                    "collaboration_patterns": {},
                    "feedback_history": []
                }
            
            interactions = self.persona_interactions[persona_id]
            
            # Update interaction counters
            interactions["total_interactions"] += 1
            if interaction_data.get("successful", True):
                interactions["successful_interactions"] += 1
            
            # Record quality score
            quality_score = interaction_data.get("quality_score", 0.5)
            interactions["interaction_quality_scores"].append(quality_score)
            
            # Keep only last 100 quality scores
            if len(interactions["interaction_quality_scores"]) > 100:
                interactions["interaction_quality_scores"] = interactions["interaction_quality_scores"][-100:]
            
            # Record collaboration patterns
            collaboration_partner = interaction_data.get("collaboration_partner")
            if collaboration_partner:
                if collaboration_partner not in interactions["collaboration_patterns"]:
                    interactions["collaboration_patterns"][collaboration_partner] = {
                        "interaction_count": 0,
                        "average_quality": 0.0,
                        "collaboration_type": interaction_data.get("collaboration_type", "unknown")
                    }
                
                partner_data = interactions["collaboration_patterns"][collaboration_partner]
                partner_data["interaction_count"] += 1
                
                # Update average quality
                total_quality = partner_data["average_quality"] * (partner_data["interaction_count"] - 1) + quality_score
                partner_data["average_quality"] = total_quality / partner_data["interaction_count"]
            
            # Record feedback if provided
            feedback = interaction_data.get("feedback")
            if feedback:
                interactions["feedback_history"].append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "feedback": feedback,
                    "interaction_context": interaction_data.get("context", {})
                })
                
                # Keep only last 50 feedback entries
                if len(interactions["feedback_history"]) > 50:
                    interactions["feedback_history"] = interactions["feedback_history"][-50:]
            
            # Save the updated registry
            self._save_registry()
            
            logger.debug(f"Recorded interaction for persona {persona_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error recording persona interaction: {str(e)}")
            return False
    
    def get_persona(self, persona_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a persona.
        
        Args:
            persona_id: ID of the persona to get.
            
        Returns:
            Information about the persona, or None if it doesn't exist.
        """
        return self.personas.get(persona_id)
    
    def get_persona_assignment(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get persona assignment for an agent.
        
        Args:
            agent_id: ID of the agent.
            
        Returns:
            Persona assignment information, or None if no assignment exists.
        """
        return self.persona_assignments.get(agent_id)
    
    def get_persona_interactions(self, persona_id: str) -> Optional[Dict[str, Any]]:
        """Get persona interaction history.
        
        Args:
            persona_id: ID of the persona.
            
        Returns:
            Persona interaction data, or None if it doesn't exist.
        """
        return self.persona_interactions.get(persona_id)
    
    def get_persona_adaptations(self, persona_id: str) -> Optional[Dict[str, Any]]:
        """Get persona adaptation history.
        
        Args:
            persona_id: ID of the persona.
            
        Returns:
            Persona adaptation data, or None if it doesn't exist.
        """
        return self.persona_adaptations.get(persona_id)
    
    def list_personas(self, persona_type_filter: Optional[PersonaType] = None,
                     status_filter: Optional[PersonaStatus] = None) -> Dict[str, Dict[str, Any]]:
        """List all registered personas with optional filtering.
        
        Args:
            persona_type_filter: Optional persona type filter.
            status_filter: Optional status filter.
            
        Returns:
            Dictionary mapping persona IDs to persona information.
        """
        filtered_personas = {}
        
        for persona_id, persona in self.personas.items():
            # Apply persona type filter
            if persona_type_filter and persona.get("persona_type") != persona_type_filter.value:
                continue
            
            # Apply status filter
            if status_filter and persona.get("status") != status_filter.value:
                continue
            
            filtered_personas[persona_id] = persona
        
        return filtered_personas
    
    def get_active_personas(self) -> List[str]:
        """Get list of currently active personas.
        
        Returns:
            List of active persona IDs.
        """
        active_personas = []
        
        for persona_id, persona in self.personas.items():
            if persona.get("status") == PersonaStatus.ACTIVE.value:
                active_personas.append(persona_id)
        
        return active_personas
    
    def get_registry_statistics(self) -> Dict[str, Any]:
        """Get registry statistics.
        
        Returns:
            Dictionary containing registry statistics.
        """
        stats = {
            "total_personas": len(self.personas),
            "personas_by_type": {},
            "personas_by_status": {},
            "total_assignments": len(self.persona_assignments),
            "total_interactions": sum(interactions.get("total_interactions", 0) for interactions in self.persona_interactions.values()),
            "total_adaptations": sum(adaptations.get("adaptation_count", 0) for adaptations in self.persona_adaptations.values()),
            "average_interaction_quality": 0.0
        }
        
        # Count personas by type
        for persona in self.personas.values():
            persona_type = persona.get("persona_type", "unknown")
            stats["personas_by_type"][persona_type] = stats["personas_by_type"].get(persona_type, 0) + 1
        
        # Count personas by status
        for persona in self.personas.values():
            status = persona.get("status", "unknown")
            stats["personas_by_status"][status] = stats["personas_by_status"].get(status, 0) + 1
        
        # Calculate average interaction quality
        all_quality_scores = []
        for interactions in self.persona_interactions.values():
            quality_scores = interactions.get("interaction_quality_scores", [])
            all_quality_scores.extend(quality_scores)
        
        if all_quality_scores:
            stats["average_interaction_quality"] = sum(all_quality_scores) / len(all_quality_scores)
        
        return stats
    
    def check_persona_exists(self, persona_id: str) -> bool:
        """Check if a persona exists.
        
        Args:
            persona_id: ID of the persona to check.
            
        Returns:
            True if the persona exists, False otherwise.
        """
        return persona_id in self.personas
    
    def update_persona_status(self, persona_id: str, status: PersonaStatus) -> bool:
        """Update a persona's status.
        
        Args:
            persona_id: ID of the persona to update.
            status: New status for the persona.
            
        Returns:
            True if the status was updated successfully.
        """
        try:
            if persona_id not in self.personas:
                logger.error(f"Persona {persona_id} does not exist")
                return False
            
            # Update persona status
            self.personas[persona_id]["status"] = status.value
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Updated persona {persona_id} status to {status.value}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating persona {persona_id} status: {str(e)}")
            return False

