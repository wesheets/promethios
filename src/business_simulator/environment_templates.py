"""
Business Environment Simulator for the Promethios Test Harness.

This module provides functionality for simulating business environments and actors
to test governance behavior in realistic scenarios.
"""

import json
import logging
import random
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BusinessSimulator:
    """
    Simulator for business environments in the Promethios test harness.
    
    The BusinessSimulator provides functionality for creating realistic business
    scenarios with multiple actors, events, and governance challenges.
    """
    
    def __init__(self, config_path: str = None):
        """
        Initialize the BusinessSimulator.
        
        Args:
            config_path: Path to the configuration file.
                         If None, uses default configuration.
        """
        self.config = self._load_config(config_path)
        self.environments = {}
        self.actors = {}
        self.current_environment = None
        
        # Load predefined environments and actors
        self._load_environments()
        self._load_actors()
        
        logger.info("BusinessSimulator initialized")
    
    def _load_config(self, config_path: str) -> Dict:
        """
        Load configuration from file.
        
        Args:
            config_path: Path to the configuration file.
            
        Returns:
            Configuration dictionary.
        """
        default_config = {
            "seed": 42,
            "default_duration": 3600,  # 1 hour in seconds
            "event_frequency": 10,     # Events per minute
            "environments_path": "data/environments",
            "actors_path": "data/actors",
            "actions_path": "data/actions"
        }
        
        if not config_path:
            logger.info("Using default configuration")
            return default_config
        
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
                # Merge with defaults for any missing keys
                for key, value in default_config.items():
                    if key not in config:
                        config[key] = value
                logger.info(f"Loaded configuration from {config_path}")
                return config
        except Exception as e:
            logger.warning(f"Failed to load configuration from {config_path}: {e}")
            logger.info("Using default configuration")
            return default_config
    
    def _load_environments(self) -> None:
        """Load predefined environment templates."""
        try:
            # In a real implementation, this would load from files
            # For this starter code, we'll define some built-in environments
            
            self.environments = {
                "financial_services": {
                    "name": "Financial Services",
                    "description": "Banking and financial services environment with strict compliance requirements",
                    "compliance_frameworks": ["SOC2", "PCI-DSS", "GDPR"],
                    "risk_level": "high",
                    "actors": ["customer", "banker", "compliance_officer", "regulator"],
                    "data_sensitivity": "high",
                    "governance_policies": [
                        "data_access_control",
                        "audit_logging",
                        "customer_consent",
                        "fraud_detection"
                    ]
                },
                "healthcare": {
                    "name": "Healthcare",
                    "description": "Healthcare environment with patient data and medical systems",
                    "compliance_frameworks": ["HIPAA", "GDPR"],
                    "risk_level": "high",
                    "actors": ["patient", "doctor", "nurse", "administrator"],
                    "data_sensitivity": "high",
                    "governance_policies": [
                        "patient_privacy",
                        "medical_record_access",
                        "emergency_override",
                        "consent_management"
                    ]
                },
                "e_commerce": {
                    "name": "E-Commerce",
                    "description": "Online retail environment with customer transactions",
                    "compliance_frameworks": ["PCI-DSS", "GDPR", "CCPA"],
                    "risk_level": "medium",
                    "actors": ["customer", "support_agent", "inventory_manager", "marketing_analyst"],
                    "data_sensitivity": "medium",
                    "governance_policies": [
                        "payment_processing",
                        "customer_data_protection",
                        "marketing_consent",
                        "fraud_prevention"
                    ]
                }
            }
            
            logger.info(f"Loaded {len(self.environments)} environment templates")
        except Exception as e:
            logger.error(f"Failed to load environments: {e}")
            self.environments = {}
    
    def _load_actors(self) -> None:
        """Load predefined actor profiles."""
        try:
            # In a real implementation, this would load from files
            # For this starter code, we'll define some built-in actors
            
            self.actors = {
                "customer": {
                    "name": "Customer",
                    "description": "End user or customer of the service",
                    "permissions": ["view_own_data", "update_own_profile", "submit_requests"],
                    "risk_level": "low",
                    "typical_actions": ["query_account", "update_profile", "request_service"]
                },
                "support_agent": {
                    "name": "Support Agent",
                    "description": "Customer support representative",
                    "permissions": ["view_customer_data", "update_customer_records", "process_requests"],
                    "risk_level": "medium",
                    "typical_actions": ["view_customer", "update_record", "resolve_issue"]
                },
                "administrator": {
                    "name": "System Administrator",
                    "description": "Technical administrator with elevated privileges",
                    "permissions": ["system_config", "user_management", "data_management"],
                    "risk_level": "high",
                    "typical_actions": ["create_user", "modify_settings", "access_logs"]
                },
                "compliance_officer": {
                    "name": "Compliance Officer",
                    "description": "Responsible for ensuring regulatory compliance",
                    "permissions": ["audit_access", "policy_management", "compliance_reporting"],
                    "risk_level": "medium",
                    "typical_actions": ["run_audit", "review_policy", "generate_report"]
                }
            }
            
            logger.info(f"Loaded {len(self.actors)} actor profiles")
        except Exception as e:
            logger.error(f"Failed to load actors: {e}")
            self.actors = {}
    
    def create_environment(self, template_id: str, customizations: Dict = None) -> Dict:
        """
        Create a new environment instance from a template.
        
        Args:
            template_id: ID of the environment template to use.
            customizations: Optional customizations to apply to the template.
            
        Returns:
            The created environment instance.
            
        Raises:
            ValueError: If the template doesn't exist.
        """
        if template_id not in self.environments:
            raise ValueError(f"Environment template not found: {template_id}")
        
        # Clone the template
        template = self.environments[template_id]
        environment = template.copy()
        
        # Apply customizations if provided
        if customizations:
            for key, value in customizations.items():
                environment[key] = value
        
        # Add instance-specific properties
        environment["id"] = f"ENV-{uuid.uuid4().hex[:8].upper()}"
        environment["created_at"] = datetime.now().isoformat()
        environment["template_id"] = template_id
        environment["active_actors"] = []
        environment["events"] = []
        
        # Set as current environment
        self.current_environment = environment
        
        logger.info(f"Created environment: {environment['id']} from template: {template_id}")
        return environment
    
    def add_actor_to_environment(self, actor_id: str, role: str = None, customizations: Dict = None) -> Dict:
        """
        Add an actor to the current environment.
        
        Args:
            actor_id: ID of the actor profile to add.
            role: Optional role override for the actor.
            customizations: Optional customizations to apply to the actor.
            
        Returns:
            The actor instance added to the environment.
            
        Raises:
            ValueError: If no environment is active or the actor profile doesn't exist.
        """
        if not self.current_environment:
            raise ValueError("No active environment")
        
        if actor_id not in self.actors:
            raise ValueError(f"Actor profile not found: {actor_id}")
        
        # Clone the actor profile
        profile = self.actors[actor_id]
        actor = profile.copy()
        
        # Apply customizations if provided
        if customizations:
            for key, value in customizations.items():
                actor[key] = value
        
        # Add instance-specific properties
        actor["id"] = f"ACTOR-{uuid.uuid4().hex[:8].upper()}"
        actor["profile_id"] = actor_id
        actor["environment_id"] = self.current_environment["id"]
        actor["role"] = role or actor_id
        actor["joined_at"] = datetime.now().isoformat()
        actor["events"] = []
        
        # Add to environment
        self.current_environment["active_actors"].append(actor)
        
        logger.info(f"Added actor {actor['id']} ({actor_id}) to environment {self.current_environment['id']}")
        return actor
    
    def generate_event(self, actor_id: str, action_type: str, parameters: Dict = None) -> Dict:
        """
        Generate a single event in the current environment.
        
        Args:
            actor_id: ID of the actor generating the event.
            action_type: Type of action being performed.
            parameters: Optional parameters for the action.
            
        Returns:
            The generated event.
            
        Raises:
            ValueError: If no environment is active or the actor doesn't exist.
        """
        if not self.current_environment:
            raise ValueError("No active environment")
        
        # Find the actor
        actor = None
        for a in self.current_environment["active_actors"]:
            if a["id"] == actor_id:
                actor = a
                break
        
        if not actor:
            raise ValueError(f"Actor not found in environment: {actor_id}")
        
        # Create the event
        event = {
            "id": f"EVENT-{uuid.uuid4().hex[:8].upper()}",
            "timestamp": datetime.now().isoformat(),
            "environment_id": self.current_environment["id"],
            "actor_id": actor_id,
            "actor_role": actor["role"],
            "action_type": action_type,
            "parameters": parameters or {}
        }
        
        # Add governance context
        event["governance_context"] = {
            "environment_risk": self.current_environment["risk_level"],
            "actor_risk": actor["risk_level"],
            "data_sensitivity": self.current_environment.get("data_sensitivity", "medium"),
            "applicable_policies": self._get_applicable_policies(action_type, actor)
        }
        
        # Add to environment events
        self.current_environment["events"].append(event)
        
        # Add to actor events
        actor["events"].append(event["id"])
        
        logger.info(f"Generated event {event['id']} by actor {actor_id}: {action_type}")
        return event
    
    def _get_applicable_policies(self, action_type: str, actor: Dict) -> List[str]:
        """
        Determine which governance policies apply to an action.
        
        Args:
            action_type: Type of action being performed.
            actor: Actor performing the action.
            
        Returns:
            List of applicable policy IDs.
        """
        # In a real implementation, this would use a more sophisticated policy engine
        # For this starter code, we'll use a simple mapping
        
        all_policies = self.current_environment.get("governance_policies", [])
        applicable_policies = []
        
        # Map common actions to policies
        action_policy_map = {
            "view_data": ["data_access_control", "audit_logging", "patient_privacy", "medical_record_access"],
            "update_data": ["data_access_control", "audit_logging", "patient_privacy", "medical_record_access"],
            "delete_data": ["data_access_control", "audit_logging", "patient_privacy"],
            "create_user": ["user_management", "audit_logging"],
            "process_payment": ["payment_processing", "fraud_prevention", "audit_logging"],
            "export_data": ["data_access_control", "audit_logging", "customer_consent", "marketing_consent"],
            "override_policy": ["emergency_override", "audit_logging"]
        }
        
        # Add policies based on action type
        if action_type in action_policy_map:
            for policy in action_policy_map[action_type]:
                if policy in all_policies and policy not in applicable_policies:
                    applicable_policies.append(policy)
        
        # Add policies based on actor risk level
        if actor["risk_level"] == "high":
            if "audit_logging" in all_policies and "audit_logging" not in applicable_policies:
                applicable_policies.append("audit_logging")
        
        return applicable_policies
    
    def simulate_scenario(self, scenario_config: Dict) -> Dict:
        """
        Simulate a complete business scenario.
        
        Args:
            scenario_config: Configuration for the scenario.
            
        Returns:
            Results of the simulation.
            
        Raises:
            ValueError: If the scenario configuration is invalid.
        """
        if not scenario_config.get("environment_template"):
            raise ValueError("Scenario must specify an environment template")
        
        # Create the environment
        environment = self.create_environment(
            template_id=scenario_config["environment_template"],
            customizations=scenario_config.get("environment_customizations")
        )
        
        # Add actors
        actors = []
        for actor_config in scenario_config.get("actors", []):
            actor = self.add_actor_to_environment(
                actor_id=actor_config["profile_id"],
                role=actor_config.get("role"),
                customizations=actor_config.get("customizations")
            )
            actors.append(actor)
        
        # Generate events
        events = []
        for event_config in scenario_config.get("events", []):
            event = self.generate_event(
                actor_id=event_config["actor_id"],
                action_type=event_config["action_type"],
                parameters=event_config.get("parameters")
            )
            events.append(event)
        
        # Compile results
        results = {
            "scenario_id": scenario_config.get("id", f"SCENARIO-{uuid.uuid4().hex[:8].upper()}"),
            "environment": environment,
            "actors": actors,
            "events": events,
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Simulated scenario {results['scenario_id']} with {len(events)} events")
        return results
    
    def generate_random_scenario(self, environment_template: str, num_actors: int = 3, num_events: int = 10) -> Dict:
        """
        Generate a random business scenario.
        
        Args:
            environment_template: ID of the environment template to use.
            num_actors: Number of actors to include.
            num_events: Number of events to generate.
            
        Returns:
            The generated scenario configuration.
        """
        if environment_template not in self.environments:
            raise ValueError(f"Environment template not found: {environment_template}")
        
        # Set random seed for reproducibility
        random.seed(self.config["seed"])
        
        # Create scenario configuration
        scenario_id = f"SCENARIO-{uuid.uuid4().hex[:8].upper()}"
        scenario_config = {
            "id": scenario_id,
            "name": f"Random Scenario: {environment_template}",
            "description": f"Randomly generated scenario in {environment_template} environment",
            "environment_template": environment_template,
            "actors": [],
            "events": []
        }
        
        # Select actor profiles for this environment
        available_profiles = list(self.actors.keys())
        environment_actors = self.environments[environment_template].get("actors", [])
        if environment_actors:
            available_profiles = [p for p in available_profiles if p in environment_actors]
        
        # Add actors
        for i in range(num_actors):
            if not available_profiles:
                break
                
            profile_id = random.choice(available_profiles)
            actor_config = {
                "profile_id": profile_id,
                "role": profile_id
            }
            scenario_config["actors"].append(actor_config)
        
        # Create the environment
        environment = self.create_environment(environment_template)
        
        # Add actors to environment
        actors = []
        for actor_config in scenario_config["actors"]:
            actor = self.add_actor_to_environment(
                actor_id=actor_config["profile_id"],
                role=actor_config["role"]
            )
            actors.append(actor)
        
        # Generate events
        for i in range(num_events):
            # Select a random actor
            actor = random.choice(actors)
            
            # Select a random action type for this actor
            action_types = actor.get("typical_actions", ["view_data", "update_data"])
            action_type = random.choice(action_types)
            
            # Generate event configuration
            event_config = {
                "actor_id": actor["id"],
                "action_type": action_type,
                "parameters": {
                    "timestamp": (datetime.now() + timedelta(minutes=i)).isoformat()
                }
            }
            scenario_config["events"].append(event_config)
        
        logger.info(f"Generated random scenario {scenario_id} with {num_actors} actors and {num_events} events")
        return scenario_config


# Example usage
if __name__ == "__main__":
    simulator = BusinessSimulator()
    
    # Create a scenario configuration
    scenario_config = {
        "id": "SCENARIO-001",
        "name": "Financial Data Access",
        "description": "Scenario testing access to financial data with various actors",
        "environment_template": "financial_services",
        "actors": [
            {"profile_id": "customer", "role": "account_holder"},
            {"profile_id": "support_agent", "role": "customer_service"},
            {"profile_id": "administrator", "role": "system_admin"}
        ],
        "events": [
            {
                "actor_id": "ACTOR-1",  # This would be filled in after actors are created
                "action_type": "view_data",
                "parameters": {
                    "data_type": "account_balance",
                    "account_id": "12345"
                }
            }
        ]
    }
    
    # Generate a random scenario instead
    random_scenario = simulator.generate_random_scenario(
        environment_template="financial_services",
        num_actors=3,
        num_events=5
    )
    
    # Simulate the random scenario
    results = simulator.simulate_scenario(random_scenario)
    print(f"Simulated scenario with {len(results['events'])} events")
