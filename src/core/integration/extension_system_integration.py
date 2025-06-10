"""
Integration module for the Promethios extension system.

This module provides compatibility layers and integration points between
the extension system and existing kernel and UI components.
"""

from typing import Dict, Any, Optional
import logging
from ..extensions import ExtensionRegistry, ModuleRegistry, FeatureToggleService

# Set up logging
logger = logging.getLogger(__name__)

class ExtensionSystemIntegration:
    """
    Integration class for the Promethios extension system.
    
    This class provides compatibility layers and integration points between
    the extension system and existing kernel and UI components.
    """
    
    def __init__(self):
        """Initialize the ExtensionSystemIntegration."""
        self.extension_registry = ExtensionRegistry()
        self.module_registry = ModuleRegistry()
        self.feature_toggle_service = FeatureToggleService()
        self._ui_component_cache: Dict[str, Any] = {}
        logger.info("ExtensionSystemIntegration initialized")
    
    def initialize(self) -> bool:
        """
        Initialize the extension system and register core components.
        
        Returns:
            bool: True if initialization was successful, False otherwise.
        """
        try:
            # Register core modules
            self._register_core_modules()
            
            # Register core features
            self._register_core_features()
            
            # Register core extensions
            self._register_core_extensions()
            
            logger.info("ExtensionSystemIntegration initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize ExtensionSystemIntegration: {e}")
            return False
    
    def _register_core_modules(self) -> None:
        """Register core modules with the ModuleRegistry."""
        from ...core.trust import trust_metrics_calculator
        from ...core.visualization import visualization_data_transformer
        
        # Create module wrappers
        trust_module = self._create_module_wrapper(
            "core-trust",
            "Core Trust Module",
            "1.0.0",
            [],
            trust_metrics_calculator
        )
        
        visualization_module = self._create_module_wrapper(
            "core-visualization",
            "Core Visualization Module",
            "1.0.0",
            ["core-trust"],
            visualization_data_transformer
        )
        
        # Register modules
        self.module_registry.register(trust_module)
        self.module_registry.register(visualization_module)
        
        logger.info("Core modules registered successfully")
    
    def _register_core_features(self) -> None:
        """Register core features with the FeatureToggleService."""
        # Register core features
        self.feature_toggle_service.enable_feature("core-trust-metrics")
        self.feature_toggle_service.enable_feature("core-visualization")
        
        # Set up feature dependencies
        self.feature_toggle_service.set_feature_dependencies(
            "core-visualization",
            ["core-trust-metrics"]
        )
        
        logger.info("Core features registered successfully")
    
    def _register_core_extensions(self) -> None:
        """Register core extensions with the ExtensionRegistry."""
        # Create extension wrappers
        trust_extension = self._create_extension_wrapper(
            "core-trust-extension",
            "Core Trust Extension",
            "1.0.0",
            ["core-trust"],
            ["core-trust-metrics"]
        )
        
        visualization_extension = self._create_extension_wrapper(
            "core-visualization-extension",
            "Core Visualization Extension",
            "1.0.0",
            ["core-visualization"],
            ["core-visualization"]
        )
        
        # Register extensions
        self.extension_registry.register(trust_extension)
        self.extension_registry.register(visualization_extension)
        
        # Enable extensions
        self.extension_registry.enable_extension(
            "core-trust-extension",
            self.module_registry,
            self.feature_toggle_service
        )
        
        self.extension_registry.enable_extension(
            "core-visualization-extension",
            self.module_registry,
            self.feature_toggle_service
        )
        
        logger.info("Core extensions registered successfully")
    
    def _create_module_wrapper(self, id: str, name: str, version: str, 
                              dependencies: list, module_instance: Any) -> Any:
        """
        Create a module wrapper for a legacy module.
        
        Args:
            id: The ID of the module.
            name: The name of the module.
            version: The version of the module.
            dependencies: A list of module IDs that this module depends on.
            module_instance: The legacy module instance to wrap.
            
        Returns:
            A module wrapper object.
        """
        class ModuleWrapper:
            def __init__(self, mid, mname, mversion, mdependencies, minstance):
                self.id = mid
                self.name = mname
                self.version = mversion
                self.dependencies = mdependencies
                self._instance = minstance
            
            def initialize(self):
                if hasattr(self._instance, 'initialize') and callable(self._instance.initialize):
                    return self._instance.initialize()
                return True
            
            def shutdown(self):
                if hasattr(self._instance, 'shutdown') and callable(self._instance.shutdown):
                    return self._instance.shutdown()
                return True
            
            def __getattr__(self, name):
                return getattr(self._instance, name)
        
        return ModuleWrapper(id, name, version, dependencies, module_instance)
    
    def _create_extension_wrapper(self, id: str, name: str, version: str,
                                 modules: list, features: list) -> Any:
        """
        Create an extension wrapper.
        
        Args:
            id: The ID of the extension.
            name: The name of the extension.
            version: The version of the extension.
            modules: A list of module IDs that this extension includes.
            features: A list of feature IDs that this extension provides.
            
        Returns:
            An extension wrapper object.
        """
        class ExtensionWrapper:
            def __init__(self, eid, ename, eversion, emodules, efeatures):
                self.id = eid
                self.name = ename
                self.version = eversion
                self.modules = emodules
                self.features = efeatures
        
        return ExtensionWrapper(id, name, version, modules, features)
    
    def get_ui_component(self, component_id: str) -> Optional[Any]:
        """
        Get a UI component by ID, either from cache or by creating it.
        
        Args:
            component_id: The ID of the UI component to retrieve.
            
        Returns:
            The UI component, or None if not available.
        """
        # Check cache first
        if component_id in self._ui_component_cache:
            return self._ui_component_cache[component_id]
        
        # Create component based on ID
        component = None
        
        if component_id == "governance-dashboard":
            from ...ui.governance_dashboard.components.governance_dashboard import GovernanceDashboard
            component = GovernanceDashboard()
        elif component_id == "trust-metrics-visualizer":
            from ...ui.governance_dashboard.components.trust_metrics_visualizer import TrustMetricsVisualizer
            component = TrustMetricsVisualizer()
        elif component_id == "governance-health-reporter":
            from ...ui.governance_dashboard.components.governance_health_reporter_ui import GovernanceHealthReporterUI
            component = GovernanceHealthReporterUI()
        
        # Cache the component
        if component:
            self._ui_component_cache[component_id] = component
        
        return component
    
    def register_extension(self, extension_data: Dict[str, Any]) -> bool:
        """
        Register an extension from extension data.
        
        Args:
            extension_data: A dictionary containing extension data.
            
        Returns:
            bool: True if registration was successful, False otherwise.
        """
        try:
            # Validate extension data
            required_fields = ['id', 'name', 'version', 'modules', 'features']
            for field in required_fields:
                if field not in extension_data:
                    logger.error(f"Extension data missing required field: {field}")
                    return False
            
            # Create extension wrapper
            extension = self._create_extension_wrapper(
                extension_data['id'],
                extension_data['name'],
                extension_data['version'],
                extension_data['modules'],
                extension_data['features']
            )
            
            # Register extension
            return self.extension_registry.register(extension)
        except Exception as e:
            logger.error(f"Failed to register extension: {e}")
            return False
    
    def enable_extension(self, extension_id: str) -> bool:
        """
        Enable an extension by ID.
        
        Args:
            extension_id: The ID of the extension to enable.
            
        Returns:
            bool: True if the extension was enabled successfully, False otherwise.
        """
        return self.extension_registry.enable_extension(
            extension_id,
            self.module_registry,
            self.feature_toggle_service
        )
    
    def disable_extension(self, extension_id: str) -> bool:
        """
        Disable an extension by ID.
        
        Args:
            extension_id: The ID of the extension to disable.
            
        Returns:
            bool: True if the extension was disabled successfully, False otherwise.
        """
        return self.extension_registry.disable_extension(
            extension_id,
            self.module_registry,
            self.feature_toggle_service
        )
    
    def is_feature_enabled(self, feature_id: str) -> bool:
        """
        Check if a feature is enabled.
        
        Args:
            feature_id: The ID of the feature to check.
            
        Returns:
            bool: True if the feature is enabled, False otherwise.
        """
        return self.feature_toggle_service.is_feature_enabled(feature_id)
