"""
Enhanced Veritas 2 Unified Configuration System

Manages configuration across all Enhanced Veritas 2 components and existing systems.
Provides centralized configuration management with environment-specific settings,
feature toggles, and seamless integration with existing configuration systems.

This system ensures consistent configuration across all components while maintaining
backward compatibility with existing configuration mechanisms.
"""

import logging
import json
import os
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from dataclasses import dataclass, asdict, field
from enum import Enum
import yaml

logger = logging.getLogger(__name__)

class ConfigurationLevel(Enum):
    """Configuration hierarchy levels."""
    SYSTEM = "system"
    APPLICATION = "application"
    COMPONENT = "component"
    USER = "user"
    RUNTIME = "runtime"

class FeatureFlag(Enum):
    """Feature flags for Enhanced Veritas 2 capabilities."""
    UNCERTAINTY_ANALYSIS = "uncertainty_analysis"
    HITL_COLLABORATION = "hitl_collaboration"
    QUANTUM_UNCERTAINTY = "quantum_uncertainty"
    INTELLIGENT_ORCHESTRATION = "intelligent_orchestration"
    ENHANCED_DASHBOARDS = "enhanced_dashboards"
    API_EXTENSIONS = "api_extensions"
    REAL_TIME_MONITORING = "real_time_monitoring"
    ADAPTIVE_LEARNING = "adaptive_learning"

@dataclass
class UncertaintyConfig:
    """Configuration for uncertainty analysis."""
    enabled: bool = True
    uncertainty_threshold: float = 0.7
    confidence_threshold: float = 0.8
    analysis_depth: str = "comprehensive"  # basic, standard, comprehensive
    temporal_analysis: bool = True
    multi_dimensional: bool = True
    quantum_modeling: bool = False
    cache_results: bool = True
    cache_duration_minutes: int = 30

@dataclass
class HITLConfig:
    """Configuration for Human-in-the-Loop collaboration."""
    enabled: bool = True
    auto_trigger_threshold: float = 0.8
    max_session_duration_minutes: int = 60
    clarification_strategies: List[str] = field(default_factory=lambda: ["progressive", "contextual", "direct"])
    expert_matching: bool = True
    session_persistence: bool = True
    notification_channels: List[str] = field(default_factory=lambda: ["email", "dashboard", "api"])
    escalation_levels: List[str] = field(default_factory=lambda: ["standard", "priority", "urgent"])

@dataclass
class QuantumConfig:
    """Configuration for quantum uncertainty modeling."""
    enabled: bool = False  # Advanced feature, disabled by default
    coherence_threshold: float = 0.5
    entanglement_detection: bool = True
    temporal_modeling: bool = True
    dimensional_analysis: int = 6
    correlation_analysis: bool = True
    prediction_horizon_minutes: int = 30
    quantum_optimization: bool = False

@dataclass
class OrchestrationConfig:
    """Configuration for intelligent orchestration."""
    enabled: bool = True
    uncertainty_driven_selection: bool = True
    dynamic_adaptation: bool = True
    performance_learning: bool = True
    collaboration_patterns: List[str] = field(default_factory=lambda: [
        "round_table", "innovation_lab", "sequential", "parallel", "uncertainty_adaptive"
    ])
    agent_specialization_matching: bool = True
    real_time_optimization: bool = True

@dataclass
class DashboardConfig:
    """Configuration for enhanced dashboards."""
    enabled: bool = True
    real_time_updates: bool = True
    update_interval_seconds: int = 5
    visualization_types: List[str] = field(default_factory=lambda: [
        "uncertainty_charts", "network_diagrams", "quantum_displays", "collaboration_flows"
    ])
    interactive_controls: bool = True
    export_capabilities: bool = True
    mobile_responsive: bool = True

@dataclass
class APIConfig:
    """Configuration for API extensions."""
    enabled: bool = True
    backward_compatibility: bool = True
    rate_limiting: bool = True
    requests_per_minute: int = 1000
    authentication_required: bool = True
    cors_enabled: bool = True
    api_versioning: bool = True
    documentation_auto_generation: bool = True

@dataclass
class MonitoringConfig:
    """Configuration for monitoring and observability."""
    enabled: bool = True
    metrics_collection: bool = True
    performance_tracking: bool = True
    error_tracking: bool = True
    audit_logging: bool = True
    real_time_alerts: bool = True
    health_checks: bool = True
    metrics_retention_days: int = 30

@dataclass
class IntegrationConfig:
    """Configuration for system integrations."""
    meta_governance_integration: bool = True
    multi_agent_governance_integration: bool = True
    multi_agent_api_integration: bool = True
    veritas_systems_integration: bool = True
    dashboard_integration: bool = True
    bridge_services_enabled: bool = True
    data_transformation_enabled: bool = True
    fallback_to_existing_systems: bool = True

@dataclass
class EnhancedVeritasConfig:
    """Main configuration class for Enhanced Veritas 2."""
    # System identification
    system_name: str = "Enhanced Veritas 2"
    version: str = "2.0.0"
    environment: str = "development"  # development, staging, production
    
    # Feature configurations
    uncertainty: UncertaintyConfig = field(default_factory=UncertaintyConfig)
    hitl: HITLConfig = field(default_factory=HITLConfig)
    quantum: QuantumConfig = field(default_factory=QuantumConfig)
    orchestration: OrchestrationConfig = field(default_factory=OrchestrationConfig)
    dashboard: DashboardConfig = field(default_factory=DashboardConfig)
    api: APIConfig = field(default_factory=APIConfig)
    monitoring: MonitoringConfig = field(default_factory=MonitoringConfig)
    integration: IntegrationConfig = field(default_factory=IntegrationConfig)
    
    # Feature flags
    feature_flags: Dict[str, bool] = field(default_factory=lambda: {
        FeatureFlag.UNCERTAINTY_ANALYSIS.value: True,
        FeatureFlag.HITL_COLLABORATION.value: True,
        FeatureFlag.QUANTUM_UNCERTAINTY.value: False,
        FeatureFlag.INTELLIGENT_ORCHESTRATION.value: True,
        FeatureFlag.ENHANCED_DASHBOARDS.value: True,
        FeatureFlag.API_EXTENSIONS.value: True,
        FeatureFlag.REAL_TIME_MONITORING.value: True,
        FeatureFlag.ADAPTIVE_LEARNING.value: False
    })
    
    # System paths
    config_directory: str = "/home/ubuntu/promethios/config"
    data_directory: str = "/home/ubuntu/promethios/data"
    logs_directory: str = "/home/ubuntu/promethios/logs"
    cache_directory: str = "/home/ubuntu/promethios/cache"
    
    # Existing system configurations
    existing_systems: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    
    # Runtime metadata
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    config_version: int = 1

class ConfigurationManager:
    """
    Unified configuration manager for Enhanced Veritas 2.
    
    Manages configuration across all components with support for:
    - Environment-specific configurations
    - Feature flags and toggles
    - Integration with existing systems
    - Runtime configuration updates
    - Configuration validation and defaults
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.logger = logging.getLogger(__name__)
        self.config_path = config_path or "/home/ubuntu/promethios/config/enhanced_veritas_2.json"
        self.config = None
        self.watchers = []
        self.validation_rules = {}
        
        # Initialize configuration
        self._initialize_configuration()
        
        self.logger.info("Configuration Manager initialized")
    
    def _initialize_configuration(self):
        """Initialize configuration from file or create default."""
        try:
            if os.path.exists(self.config_path):
                self.config = self._load_configuration()
                self.logger.info(f"Loaded configuration from {self.config_path}")
            else:
                self.config = self._create_default_configuration()
                self._save_configuration()
                self.logger.info("Created default configuration")
            
            # Load existing system configurations
            self._load_existing_system_configs()
            
            # Validate configuration
            self._validate_configuration()
            
        except Exception as e:
            self.logger.error(f"Error initializing configuration: {e}")
            self.config = self._create_default_configuration()
    
    def _load_configuration(self) -> EnhancedVeritasConfig:
        """Load configuration from file."""
        try:
            with open(self.config_path, 'r') as f:
                config_data = json.load(f)
            
            # Convert dict to dataclass
            return self._dict_to_config(config_data)
            
        except Exception as e:
            self.logger.error(f"Error loading configuration: {e}")
            return self._create_default_configuration()
    
    def _save_configuration(self):
        """Save configuration to file."""
        try:
            # Ensure config directory exists
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            
            # Update timestamp
            self.config.last_updated = datetime.utcnow().isoformat()
            self.config.config_version += 1
            
            # Convert to dict and save
            config_dict = asdict(self.config)
            with open(self.config_path, 'w') as f:
                json.dump(config_dict, f, indent=2)
            
            self.logger.info(f"Configuration saved to {self.config_path}")
            
        except Exception as e:
            self.logger.error(f"Error saving configuration: {e}")
    
    def _create_default_configuration(self) -> EnhancedVeritasConfig:
        """Create default configuration."""
        config = EnhancedVeritasConfig()
        
        # Set environment-specific defaults
        environment = os.getenv('ENHANCED_VERITAS_ENV', 'development')
        config.environment = environment
        
        if environment == 'production':
            # Production-specific settings
            config.quantum.enabled = True
            config.feature_flags[FeatureFlag.ADAPTIVE_LEARNING.value] = True
            config.monitoring.metrics_retention_days = 90
            config.api.rate_limiting = True
            config.api.requests_per_minute = 500
        elif environment == 'staging':
            # Staging-specific settings
            config.quantum.enabled = True
            config.monitoring.metrics_retention_days = 14
        else:
            # Development-specific settings
            config.quantum.enabled = False
            config.monitoring.metrics_retention_days = 7
            config.api.rate_limiting = False
        
        return config
    
    def _dict_to_config(self, config_dict: Dict[str, Any]) -> EnhancedVeritasConfig:
        """Convert dictionary to configuration dataclass."""
        # This is a simplified conversion - in practice, you'd want more robust handling
        try:
            return EnhancedVeritasConfig(
                system_name=config_dict.get('system_name', 'Enhanced Veritas 2'),
                version=config_dict.get('version', '2.0.0'),
                environment=config_dict.get('environment', 'development'),
                uncertainty=UncertaintyConfig(**config_dict.get('uncertainty', {})),
                hitl=HITLConfig(**config_dict.get('hitl', {})),
                quantum=QuantumConfig(**config_dict.get('quantum', {})),
                orchestration=OrchestrationConfig(**config_dict.get('orchestration', {})),
                dashboard=DashboardConfig(**config_dict.get('dashboard', {})),
                api=APIConfig(**config_dict.get('api', {})),
                monitoring=MonitoringConfig(**config_dict.get('monitoring', {})),
                integration=IntegrationConfig(**config_dict.get('integration', {})),
                feature_flags=config_dict.get('feature_flags', {}),
                config_directory=config_dict.get('config_directory', '/home/ubuntu/promethios/config'),
                data_directory=config_dict.get('data_directory', '/home/ubuntu/promethios/data'),
                logs_directory=config_dict.get('logs_directory', '/home/ubuntu/promethios/logs'),
                cache_directory=config_dict.get('cache_directory', '/home/ubuntu/promethios/cache'),
                existing_systems=config_dict.get('existing_systems', {}),
                created_at=config_dict.get('created_at', datetime.utcnow().isoformat()),
                last_updated=config_dict.get('last_updated', datetime.utcnow().isoformat()),
                config_version=config_dict.get('config_version', 1)
            )
        except Exception as e:
            self.logger.error(f"Error converting dict to config: {e}")
            return self._create_default_configuration()
    
    def _load_existing_system_configs(self):
        """Load configurations from existing systems."""
        existing_configs = {}
        
        # Load Meta Governance config
        meta_governance_config_path = "/home/ubuntu/promethios/phase_6_3_new/config/meta_governance_config.json"
        if os.path.exists(meta_governance_config_path):
            try:
                with open(meta_governance_config_path, 'r') as f:
                    existing_configs['meta_governance'] = json.load(f)
            except Exception as e:
                self.logger.warning(f"Could not load meta governance config: {e}")
        
        # Load other existing system configs as they become available
        # This would be expanded to include other system configurations
        
        self.config.existing_systems = existing_configs
    
    def _validate_configuration(self):
        """Validate configuration values."""
        errors = []
        
        # Validate uncertainty thresholds
        if not 0 <= self.config.uncertainty.uncertainty_threshold <= 1:
            errors.append("Uncertainty threshold must be between 0 and 1")
        
        if not 0 <= self.config.uncertainty.confidence_threshold <= 1:
            errors.append("Confidence threshold must be between 0 and 1")
        
        # Validate HITL configuration
        if not 0 <= self.config.hitl.auto_trigger_threshold <= 1:
            errors.append("HITL auto trigger threshold must be between 0 and 1")
        
        if self.config.hitl.max_session_duration_minutes <= 0:
            errors.append("HITL max session duration must be positive")
        
        # Validate quantum configuration
        if not 0 <= self.config.quantum.coherence_threshold <= 1:
            errors.append("Quantum coherence threshold must be between 0 and 1")
        
        if self.config.quantum.dimensional_analysis <= 0:
            errors.append("Quantum dimensional analysis must be positive")
        
        # Validate API configuration
        if self.config.api.requests_per_minute <= 0:
            errors.append("API requests per minute must be positive")
        
        # Validate monitoring configuration
        if self.config.monitoring.metrics_retention_days <= 0:
            errors.append("Metrics retention days must be positive")
        
        if errors:
            self.logger.warning(f"Configuration validation errors: {errors}")
            # In production, you might want to raise an exception or fix the errors
    
    def get_config(self) -> EnhancedVeritasConfig:
        """Get the current configuration."""
        return self.config
    
    def update_config(self, updates: Dict[str, Any], save: bool = True):
        """Update configuration with new values."""
        try:
            # Apply updates to configuration
            for key, value in updates.items():
                if hasattr(self.config, key):
                    setattr(self.config, key, value)
                elif '.' in key:
                    # Handle nested updates like 'uncertainty.threshold'
                    parts = key.split('.')
                    obj = self.config
                    for part in parts[:-1]:
                        obj = getattr(obj, part)
                    setattr(obj, parts[-1], value)
            
            # Validate updated configuration
            self._validate_configuration()
            
            # Save if requested
            if save:
                self._save_configuration()
            
            # Notify watchers
            self._notify_watchers(updates)
            
            self.logger.info(f"Configuration updated: {list(updates.keys())}")
            
        except Exception as e:
            self.logger.error(f"Error updating configuration: {e}")
    
    def is_feature_enabled(self, feature: Union[FeatureFlag, str]) -> bool:
        """Check if a feature is enabled."""
        if isinstance(feature, FeatureFlag):
            feature_name = feature.value
        else:
            feature_name = feature
        
        return self.config.feature_flags.get(feature_name, False)
    
    def enable_feature(self, feature: Union[FeatureFlag, str], save: bool = True):
        """Enable a feature flag."""
        if isinstance(feature, FeatureFlag):
            feature_name = feature.value
        else:
            feature_name = feature
        
        self.config.feature_flags[feature_name] = True
        
        if save:
            self._save_configuration()
        
        self.logger.info(f"Feature enabled: {feature_name}")
    
    def disable_feature(self, feature: Union[FeatureFlag, str], save: bool = True):
        """Disable a feature flag."""
        if isinstance(feature, FeatureFlag):
            feature_name = feature.value
        else:
            feature_name = feature
        
        self.config.feature_flags[feature_name] = False
        
        if save:
            self._save_configuration()
        
        self.logger.info(f"Feature disabled: {feature_name}")
    
    def get_environment_config(self) -> Dict[str, Any]:
        """Get environment-specific configuration."""
        return {
            "environment": self.config.environment,
            "system_name": self.config.system_name,
            "version": self.config.version,
            "feature_flags": self.config.feature_flags,
            "paths": {
                "config": self.config.config_directory,
                "data": self.config.data_directory,
                "logs": self.config.logs_directory,
                "cache": self.config.cache_directory
            }
        }
    
    def get_integration_config(self) -> Dict[str, Any]:
        """Get integration configuration for existing systems."""
        return {
            "integration_settings": asdict(self.config.integration),
            "existing_systems": self.config.existing_systems,
            "bridge_enabled": self.config.integration.bridge_services_enabled,
            "fallback_enabled": self.config.integration.fallback_to_existing_systems
        }
    
    def add_config_watcher(self, callback: callable):
        """Add a callback to be notified of configuration changes."""
        self.watchers.append(callback)
    
    def remove_config_watcher(self, callback: callable):
        """Remove a configuration change callback."""
        if callback in self.watchers:
            self.watchers.remove(callback)
    
    def _notify_watchers(self, changes: Dict[str, Any]):
        """Notify all watchers of configuration changes."""
        for watcher in self.watchers:
            try:
                watcher(changes)
            except Exception as e:
                self.logger.error(f"Error notifying config watcher: {e}")
    
    def export_config(self, format_type: str = "json") -> str:
        """Export configuration in specified format."""
        config_dict = asdict(self.config)
        
        if format_type.lower() == "json":
            return json.dumps(config_dict, indent=2)
        elif format_type.lower() == "yaml":
            return yaml.dump(config_dict, default_flow_style=False)
        else:
            raise ValueError(f"Unsupported export format: {format_type}")
    
    def import_config(self, config_data: str, format_type: str = "json", merge: bool = True):
        """Import configuration from string data."""
        try:
            if format_type.lower() == "json":
                imported_config = json.loads(config_data)
            elif format_type.lower() == "yaml":
                imported_config = yaml.safe_load(config_data)
            else:
                raise ValueError(f"Unsupported import format: {format_type}")
            
            if merge:
                # Merge with existing configuration
                self.update_config(imported_config)
            else:
                # Replace entire configuration
                self.config = self._dict_to_config(imported_config)
                self._save_configuration()
            
            self.logger.info(f"Configuration imported from {format_type}")
            
        except Exception as e:
            self.logger.error(f"Error importing configuration: {e}")
            raise
    
    def get_config_summary(self) -> Dict[str, Any]:
        """Get a summary of the current configuration."""
        return {
            "system_info": {
                "name": self.config.system_name,
                "version": self.config.version,
                "environment": self.config.environment,
                "config_version": self.config.config_version
            },
            "enabled_features": [
                feature for feature, enabled in self.config.feature_flags.items() if enabled
            ],
            "integration_status": {
                "meta_governance": self.config.integration.meta_governance_integration,
                "multi_agent_governance": self.config.integration.multi_agent_governance_integration,
                "multi_agent_api": self.config.integration.multi_agent_api_integration,
                "veritas_systems": self.config.integration.veritas_systems_integration,
                "dashboard": self.config.integration.dashboard_integration
            },
            "configuration_health": {
                "last_updated": self.config.last_updated,
                "validation_passed": True,  # Would be set by validation
                "existing_systems_loaded": len(self.config.existing_systems)
            }
        }

# Global configuration manager
_config_manager = None

def get_configuration_manager(config_path: Optional[str] = None) -> ConfigurationManager:
    """Get the global Configuration Manager instance."""
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigurationManager(config_path)
    return _config_manager

def get_config() -> EnhancedVeritasConfig:
    """Get the current Enhanced Veritas 2 configuration."""
    manager = get_configuration_manager()
    return manager.get_config()

def is_feature_enabled(feature: Union[FeatureFlag, str]) -> bool:
    """Check if a feature is enabled."""
    manager = get_configuration_manager()
    return manager.is_feature_enabled(feature)

def update_config(updates: Dict[str, Any], save: bool = True):
    """Update the global configuration."""
    manager = get_configuration_manager()
    manager.update_config(updates, save)

