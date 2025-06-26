"""
Model Registry for Promethios.

This module provides comprehensive model management within the Promethios
governance system. It enables models to be registered, versioned, tracked,
and deployed with full governance integration.
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

class ModelType(Enum):
    """Model type enumeration."""
    GOVERNANCE_NATIVE = "governance_native"
    EXTERNAL_API = "external_api"
    LOCAL_MODEL = "local_model"
    FINE_TUNED = "fine_tuned"
    ENSEMBLE = "ensemble"

class ModelStatus(Enum):
    """Model status enumeration."""
    TRAINING = "training"
    AVAILABLE = "available"
    DEPLOYED = "deployed"
    DEPRECATED = "deprecated"
    MAINTENANCE = "maintenance"
    FAILED = "failed"

class ModelCapability(Enum):
    """Model capability enumeration."""
    TEXT_GENERATION = "text_generation"
    MULTI_AGENT = "multi_agent"
    GOVERNANCE = "governance"
    REASONING = "reasoning"
    TOOL_USE = "tool_use"
    CONSCIOUSNESS = "consciousness"

class ModelMetrics(NamedTuple):
    """Model performance metrics."""
    accuracy: float
    latency_ms: float
    throughput_tokens_per_second: float
    governance_score: float
    consciousness_score: float
    reliability_score: float

class ModelRegistrationResult(NamedTuple):
    """Result of model registration."""
    success: bool
    model_id: Optional[str] = None
    error: Optional[str] = None
    registration_timestamp: Optional[str] = None

class ModelInferenceResult(NamedTuple):
    """Result of model inference."""
    success: bool
    output: Any = None
    error: Optional[str] = None
    inference_time: float = 0.0
    governance_metrics: Optional[Dict[str, float]] = None

class ModelRegistry:
    """Registry for managing model lifecycle and deployment."""
    
    def __init__(
        self,
        schema_validator,
        seal_verification_service,
        registry_path: str,
        governance_integration=None,
        deployment_manager=None
    ):
        """Initialize the model registry.
        
        Args:
            schema_validator: Validator for JSON schemas.
            seal_verification_service: Service for creating and verifying seals.
            registry_path: Path to the registry JSON file.
            governance_integration: Optional governance integration service.
            deployment_manager: Optional deployment manager for model deployment.
        """
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        self.registry_path = registry_path
        self.governance_integration = governance_integration
        self.deployment_manager = deployment_manager
        self.models = {}
        self.model_versions = {}
        self.model_deployments = {}
        self.model_performance_metrics = {}
        self.model_governance_scores = {}
        
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
                    logger.error("Model registry file seal verification failed")
                    raise ValueError("Model registry file seal verification failed")
                
                # Load registry data
                self.models = data.get("models", {})
                self.model_versions = data.get("model_versions", {})
                self.model_deployments = data.get("model_deployments", {})
                self.model_performance_metrics = data.get("model_performance_metrics", {})
                self.model_governance_scores = data.get("model_governance_scores", {})
                
                logger.info(f"Loaded {len(self.models)} models from registry")
            except Exception as e:
                logger.error(f"Error loading model registry: {str(e)}")
                self._initialize_empty_registry()
    
    def _initialize_empty_registry(self):
        """Initialize empty registry structures."""
        self.models = {}
        self.model_versions = {}
        self.model_deployments = {}
        self.model_performance_metrics = {}
        self.model_governance_scores = {}
    
    def _save_registry(self):
        """Save the registry to the JSON file."""
        # Create directory if it doesn't exist
        directory = os.path.dirname(self.registry_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
        
        # Prepare data for serialization
        data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "save_model_registry",
            "models": self.models,
            "model_versions": self.model_versions,
            "model_deployments": self.model_deployments,
            "model_performance_metrics": self.model_performance_metrics,
            "model_governance_scores": self.model_governance_scores
        }
        
        # Create a seal
        data["seal"] = self.seal_verification_service.create_seal(data)
        
        # Save to file
        with open(self.registry_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved {len(self.models)} models to registry")
    
    def _get_registry_state_hash(self) -> str:
        """Get a hash of the current registry state.
        
        Returns:
            Hash of the current registry state.
        """
        # Create a string representation of the registry state
        state_data = {
            "models": self.models,
            "model_versions": self.model_versions,
            "model_deployments": self.model_deployments,
            "model_performance_metrics": self.model_performance_metrics,
            "model_governance_scores": self.model_governance_scores
        }
        state_str = json.dumps(state_data, sort_keys=True)
        
        # Create a hash of the state
        return str(hash(state_str))
    
    def register_model(self, model_data: Dict[str, Any]) -> ModelRegistrationResult:
        """Register a new model.
        
        Args:
            model_data: Data for the model to register.
                Must include model_id, name, description, model_type, capabilities,
                architecture, and governance configuration.
                
        Returns:
            ModelRegistrationResult with success status and details.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "register_model",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return ModelRegistrationResult(
                    success=False,
                    error="Pre-loop tether verification failed"
                )
            
            # Validate the model data
            validation_result = self.schema_validator.validate(model_data, "model_registration.schema.v1.json")
            if not validation_result.is_valid:
                logger.error(f"Model validation failed: {validation_result.errors}")
                return ModelRegistrationResult(
                    success=False,
                    error=f"Model validation failed: {validation_result.errors}"
                )
            
            # Check if the model already exists
            model_id = model_data["model_id"]
            if model_id in self.models:
                logger.error(f"Model {model_id} already exists")
                return ModelRegistrationResult(
                    success=False,
                    error=f"Model {model_id} already exists"
                )
            
            # Prepare the model data
            registration_timestamp = datetime.utcnow().isoformat()
            model = {
                "model_id": model_id,
                "name": model_data["name"],
                "description": model_data["description"],
                "model_type": model_data["model_type"],
                "version": model_data.get("version", "1.0.0"),
                "author": model_data.get("author", "unknown"),
                "capabilities": model_data.get("capabilities", []),
                "architecture": model_data.get("architecture", {}),
                "parameters": model_data.get("parameters", {}),
                "governance_config": model_data.get("governance_config", {}),
                "metadata": model_data.get("metadata", {}),
                "registration_timestamp": registration_timestamp,
                "status": ModelStatus.AVAILABLE.value,
                "inference_count": 0,
                "last_used": None
            }
            
            # Create a seal for the model
            model["seal"] = self.seal_verification_service.create_seal(model)
            
            # Add the model to the registry
            self.models[model_id] = model
            
            # Initialize model versions
            self.model_versions[model_id] = {
                model_data.get("version", "1.0.0"): {
                    "version": model_data.get("version", "1.0.0"),
                    "registration_timestamp": registration_timestamp,
                    "model_path": model_data.get("model_path"),
                    "config_path": model_data.get("config_path"),
                    "checksum": model_data.get("checksum"),
                    "size_bytes": model_data.get("size_bytes", 0)
                }
            }
            
            # Initialize performance metrics
            self.model_performance_metrics[model_id] = {
                "total_inferences": 0,
                "successful_inferences": 0,
                "failed_inferences": 0,
                "average_latency_ms": 0.0,
                "average_throughput": 0.0,
                "last_inference": None,
                "performance_history": []
            }
            
            # Initialize governance scores if governance integration is available
            if self.governance_integration:
                governance_scores = self.governance_integration.initialize_model_governance(model_id, model)
                self.model_governance_scores[model_id] = governance_scores
            else:
                self.model_governance_scores[model_id] = {
                    "constitutional_alignment": 0.0,
                    "policy_compliance": 0.0,
                    "consciousness_quality": 0.0,
                    "governance_integration": 0.0,
                    "safety_score": 1.0
                }
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Registered model {model_id}")
            return ModelRegistrationResult(
                success=True,
                model_id=model_id,
                registration_timestamp=registration_timestamp
            )
            
        except Exception as e:
            logger.error(f"Error registering model: {str(e)}")
            return ModelRegistrationResult(
                success=False,
                error=f"Error registering model: {str(e)}"
            )
    
    def register_model_version(self, model_id: str, version_data: Dict[str, Any]) -> bool:
        """Register a new version of an existing model.
        
        Args:
            model_id: ID of the model to update.
            version_data: Data for the new version.
                
        Returns:
            True if the version was registered successfully.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "register_model_version",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return False
            
            # Check if the model exists
            if model_id not in self.models:
                logger.error(f"Model {model_id} does not exist")
                return False
            
            # Validate the version data
            validation_result = self.schema_validator.validate(version_data, "model_version.schema.v1.json")
            if not validation_result.is_valid:
                logger.error(f"Version validation failed: {validation_result.errors}")
                return False
            
            # Check if the version already exists
            version = version_data["version"]
            if model_id in self.model_versions and version in self.model_versions[model_id]:
                logger.error(f"Version {version} already exists for model {model_id}")
                return False
            
            # Prepare the version data
            version_entry = {
                "version": version,
                "registration_timestamp": datetime.utcnow().isoformat(),
                "model_path": version_data.get("model_path"),
                "config_path": version_data.get("config_path"),
                "checksum": version_data.get("checksum"),
                "size_bytes": version_data.get("size_bytes", 0),
                "changes": version_data.get("changes", []),
                "performance_improvements": version_data.get("performance_improvements", {})
            }
            
            # Add the version to the model
            if model_id not in self.model_versions:
                self.model_versions[model_id] = {}
            self.model_versions[model_id][version] = version_entry
            
            # Update the model's current version if the new version is higher
            current_version = self.models[model_id]["version"]
            if self._compare_versions(version, current_version) > 0:
                self.models[model_id]["version"] = version
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Registered version {version} for model {model_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error registering model version: {str(e)}")
            return False
    
    def _compare_versions(self, version1: str, version2: str) -> int:
        """Compare two version strings.
        
        Args:
            version1: First version string.
            version2: Second version string.
            
        Returns:
            1 if version1 > version2, -1 if version1 < version2, 0 if equal.
        """
        try:
            v1_parts = [int(x) for x in version1.split('.')]
            v2_parts = [int(x) for x in version2.split('.')]
            
            for i in range(max(len(v1_parts), len(v2_parts))):
                v1 = v1_parts[i] if i < len(v1_parts) else 0
                v2 = v2_parts[i] if i < len(v2_parts) else 0
                
                if v1 > v2:
                    return 1
                elif v1 < v2:
                    return -1
            
            return 0
        except ValueError:
            # If version strings are not numeric, use string comparison
            if version1 > version2:
                return 1
            elif version1 < version2:
                return -1
            else:
                return 0
    
    def deploy_model(self, model_id: str, deployment_config: Dict[str, Any]) -> bool:
        """Deploy a model.
        
        Args:
            model_id: ID of the model to deploy.
            deployment_config: Configuration for the deployment.
            
        Returns:
            True if the model was deployed successfully.
        """
        try:
            if model_id not in self.models:
                logger.error(f"Model {model_id} does not exist")
                return False
            
            # Use deployment manager if available
            if self.deployment_manager:
                deployment_result = self.deployment_manager.deploy_model(model_id, deployment_config)
                if not deployment_result.success:
                    logger.error(f"Model deployment failed: {deployment_result.error}")
                    return False
            
            # Update model status
            self.models[model_id]["status"] = ModelStatus.DEPLOYED.value
            
            # Record deployment
            deployment_id = f"{model_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            self.model_deployments[deployment_id] = {
                "deployment_id": deployment_id,
                "model_id": model_id,
                "deployment_timestamp": datetime.utcnow().isoformat(),
                "config": deployment_config,
                "status": "active"
            }
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Deployed model {model_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deploying model {model_id}: {str(e)}")
            return False
    
    def inference(self, model_id: str, input_data: Dict[str, Any], agent_id: Optional[str] = None) -> ModelInferenceResult:
        """Perform inference with a model.
        
        Args:
            model_id: ID of the model to use for inference.
            input_data: Input data for the inference.
            agent_id: Optional ID of the agent requesting inference.
            
        Returns:
            ModelInferenceResult with success status and output.
        """
        start_time = datetime.utcnow()
        
        try:
            # Check if the model exists
            if model_id not in self.models:
                return ModelInferenceResult(
                    success=False,
                    error=f"Model {model_id} does not exist"
                )
            
            model = self.models[model_id]
            
            # Check if model is available
            if model.get("status") not in [ModelStatus.AVAILABLE.value, ModelStatus.DEPLOYED.value]:
                return ModelInferenceResult(
                    success=False,
                    error=f"Model {model_id} is not available (status: {model.get('status')})"
                )
            
            # Validate input data
            if self.schema_validator:
                input_schema = model.get("input_schema")
                if input_schema:
                    validation_result = self.schema_validator.validate(input_data, input_schema)
                    if not validation_result.is_valid:
                        return ModelInferenceResult(
                            success=False,
                            error=f"Input validation failed: {validation_result.errors}"
                        )
            
            # Perform inference (this would be implemented based on model type)
            # For now, we'll simulate inference
            output = self._simulate_inference(model, input_data)
            success = True
            error = None
            
            # Calculate inference time
            end_time = datetime.utcnow()
            inference_time = (end_time - start_time).total_seconds()
            
            # Update performance metrics
            self._update_model_performance_metrics(model_id, success, inference_time)
            
            # Calculate governance metrics if governance integration is available
            governance_metrics = None
            if self.governance_integration:
                governance_metrics = self.governance_integration.evaluate_model_inference(
                    model_id, input_data, output, success, agent_id
                )
            
            return ModelInferenceResult(
                success=success,
                output=output,
                error=error,
                inference_time=inference_time,
                governance_metrics=governance_metrics
            )
            
        except Exception as e:
            end_time = datetime.utcnow()
            inference_time = (end_time - start_time).total_seconds()
            
            logger.error(f"Error performing inference with model {model_id}: {str(e)}")
            return ModelInferenceResult(
                success=False,
                error=f"Error performing inference: {str(e)}",
                inference_time=inference_time
            )
    
    def _simulate_inference(self, model: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate model inference (placeholder implementation).
        
        Args:
            model: Model configuration.
            input_data: Input data for inference.
            
        Returns:
            Simulated inference output.
        """
        # This is a placeholder - real implementation would depend on model type
        return {
            "generated_text": f"Response from {model['name']} to: {input_data.get('prompt', 'input')}",
            "confidence": 0.85,
            "governance_scores": {
                "constitutional_alignment": 0.88,
                "policy_compliance": 0.92,
                "consciousness_quality": 0.79
            }
        }
    
    def _update_model_performance_metrics(self, model_id: str, success: bool, inference_time: float):
        """Update model performance metrics.
        
        Args:
            model_id: ID of the model.
            success: Whether the inference was successful.
            inference_time: Inference time in seconds.
        """
        if model_id not in self.model_performance_metrics:
            self.model_performance_metrics[model_id] = {
                "total_inferences": 0,
                "successful_inferences": 0,
                "failed_inferences": 0,
                "average_latency_ms": 0.0,
                "average_throughput": 0.0,
                "last_inference": None,
                "performance_history": []
            }
        
        metrics = self.model_performance_metrics[model_id]
        
        # Update counters
        metrics["total_inferences"] += 1
        if success:
            metrics["successful_inferences"] += 1
        else:
            metrics["failed_inferences"] += 1
        
        # Update average latency
        latency_ms = inference_time * 1000
        total_latency = metrics["average_latency_ms"] * (metrics["total_inferences"] - 1) + latency_ms
        metrics["average_latency_ms"] = total_latency / metrics["total_inferences"]
        
        # Update last inference timestamp
        metrics["last_inference"] = datetime.utcnow().isoformat()
        
        # Update model's inference count and last used
        self.models[model_id]["inference_count"] = metrics["total_inferences"]
        self.models[model_id]["last_used"] = metrics["last_inference"]
        
        # Add to performance history (keep last 100 entries)
        metrics["performance_history"].append({
            "timestamp": metrics["last_inference"],
            "success": success,
            "latency_ms": latency_ms
        })
        if len(metrics["performance_history"]) > 100:
            metrics["performance_history"] = metrics["performance_history"][-100:]
    
    def get_model(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a model.
        
        Args:
            model_id: ID of the model to get.
            
        Returns:
            Information about the model, or None if it doesn't exist.
        """
        return self.models.get(model_id)
    
    def get_model_versions(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get all versions of a model.
        
        Args:
            model_id: ID of the model.
            
        Returns:
            Dictionary of model versions, or None if model doesn't exist.
        """
        return self.model_versions.get(model_id)
    
    def get_model_performance_metrics(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get model performance metrics.
        
        Args:
            model_id: ID of the model.
            
        Returns:
            Model performance metrics, or None if it doesn't exist.
        """
        return self.model_performance_metrics.get(model_id)
    
    def get_model_governance_scores(self, model_id: str) -> Optional[Dict[str, float]]:
        """Get model governance scores.
        
        Args:
            model_id: ID of the model.
            
        Returns:
            Model governance scores, or None if it doesn't exist.
        """
        return self.model_governance_scores.get(model_id)
    
    def list_models(self, model_type_filter: Optional[ModelType] = None,
                   status_filter: Optional[ModelStatus] = None,
                   capability_filter: Optional[ModelCapability] = None) -> Dict[str, Dict[str, Any]]:
        """List all registered models with optional filtering.
        
        Args:
            model_type_filter: Optional model type filter.
            status_filter: Optional status filter.
            capability_filter: Optional capability filter.
            
        Returns:
            Dictionary mapping model IDs to model information.
        """
        filtered_models = {}
        
        for model_id, model in self.models.items():
            # Apply model type filter
            if model_type_filter and model.get("model_type") != model_type_filter.value:
                continue
            
            # Apply status filter
            if status_filter and model.get("status") != status_filter.value:
                continue
            
            # Apply capability filter
            if capability_filter:
                capabilities = model.get("capabilities", [])
                if capability_filter.value not in capabilities:
                    continue
            
            filtered_models[model_id] = model
        
        return filtered_models
    
    def get_available_models(self) -> List[str]:
        """Get list of currently available models.
        
        Returns:
            List of available model IDs.
        """
        available_models = []
        
        for model_id, model in self.models.items():
            if model.get("status") in [ModelStatus.AVAILABLE.value, ModelStatus.DEPLOYED.value]:
                available_models.append(model_id)
        
        return available_models
    
    def get_registry_statistics(self) -> Dict[str, Any]:
        """Get registry statistics.
        
        Returns:
            Dictionary containing registry statistics.
        """
        stats = {
            "total_models": len(self.models),
            "models_by_type": {},
            "models_by_status": {},
            "total_inferences": sum(metrics.get("total_inferences", 0) for metrics in self.model_performance_metrics.values()),
            "average_governance_scores": {}
        }
        
        # Count models by type
        for model in self.models.values():
            model_type = model.get("model_type", "unknown")
            stats["models_by_type"][model_type] = stats["models_by_type"].get(model_type, 0) + 1
        
        # Count models by status
        for model in self.models.values():
            status = model.get("status", "unknown")
            stats["models_by_status"][status] = stats["models_by_status"].get(status, 0) + 1
        
        # Calculate average governance scores
        if self.model_governance_scores:
            governance_metrics = ["constitutional_alignment", "policy_compliance", "consciousness_quality", "governance_integration", "safety_score"]
            for metric in governance_metrics:
                scores = [scores.get(metric, 0.0) for scores in self.model_governance_scores.values()]
                stats["average_governance_scores"][metric] = sum(scores) / len(scores) if scores else 0.0
        
        return stats
    
    def check_model_exists(self, model_id: str) -> bool:
        """Check if a model exists.
        
        Args:
            model_id: ID of the model to check.
            
        Returns:
            True if the model exists, False otherwise.
        """
        return model_id in self.models
    
    def update_model_status(self, model_id: str, status: ModelStatus) -> bool:
        """Update a model's status.
        
        Args:
            model_id: ID of the model to update.
            status: New status for the model.
            
        Returns:
            True if the status was updated successfully.
        """
        try:
            if model_id not in self.models:
                logger.error(f"Model {model_id} does not exist")
                return False
            
            # Update model status
            self.models[model_id]["status"] = status.value
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Updated model {model_id} status to {status.value}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating model {model_id} status: {str(e)}")
            return False

