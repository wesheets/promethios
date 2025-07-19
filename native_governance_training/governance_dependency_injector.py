#!/usr/bin/env python3
"""
Governance Dependency Injection System

This module provides dependency injection for governance components, replacing
all None components with real, connected instances. This is the critical
infrastructure that transforms governance theater into real governance.

Key Features:
- Replaces all None components with real instances
- Manages component lifecycle and dependencies
- Provides configuration-driven component creation
- Enables real-time component health monitoring
- Supports graceful degradation and error handling

This directly addresses the core issue: components exist but are never
instantiated or connected. This system wires everything together.

Codex Contract: v2025.05.21
Phase ID: 6.3
"""

import asyncio
import logging
from typing import Dict, Any, Optional, List, Type, Callable
from datetime import datetime
import importlib
import inspect
import yaml
import json
from pathlib import Path

logger = logging.getLogger(__name__)

class DependencyInjectionError(Exception):
    """Exception raised when dependency injection fails."""
    pass

class ComponentLifecycleError(Exception):
    """Exception raised when component lifecycle management fails."""
    pass

class GovernanceDependencyInjector:
    """
    Governance Dependency Injection System.
    
    This class is responsible for replacing all None components with real,
    connected instances. It manages the complete lifecycle of governance
    components and ensures they are properly wired together.
    
    CRITICAL: This is what transforms your 80% complete system into 100% connected.
    
    Key Features:
    - Component instantiation and dependency resolution
    - Configuration-driven component creation
    - Lifecycle management (initialize, start, stop, cleanup)
    - Health monitoring and error handling
    - Graceful degradation when components fail
    
    Codex Contract: v2025.05.21
    Phase ID: 6.3
    """
    
    def __init__(self, 
                 config_path: Optional[str] = None,
                 enable_health_monitoring: bool = True,
                 enable_graceful_degradation: bool = True,
                 component_timeout: int = 30):
        """
        Initialize governance dependency injector.
        
        Args:
            config_path: Path to dependency injection configuration
            enable_health_monitoring: Enable component health monitoring
            enable_graceful_degradation: Enable graceful degradation on failures
            component_timeout: Timeout for component operations in seconds
        """
        self.config_path = config_path or "governance_di_config.yaml"
        self.enable_health_monitoring = enable_health_monitoring
        self.enable_graceful_degradation = enable_graceful_degradation
        self.component_timeout = component_timeout
        
        # Component registry
        self._components: Dict[str, Any] = {}
        self._component_configs: Dict[str, Dict[str, Any]] = {}
        self._component_dependencies: Dict[str, List[str]] = {}
        self._component_instances: Dict[str, Any] = {}
        
        # Lifecycle tracking
        self._initialization_order: List[str] = []
        self._startup_order: List[str] = []
        self._component_status: Dict[str, str] = {}
        self._component_errors: Dict[str, List[str]] = {}
        
        # System state
        self._is_initialized = False
        self._is_started = False
        self._shutdown_requested = False
        
        # Health monitoring
        self._health_monitor_task = None
        self._last_health_check: Dict[str, datetime] = {}
        
        logger.info("GovernanceDependencyInjector initialized")
    
    async def initialize(self):
        """Initialize the dependency injection system."""
        if self._is_initialized:
            logger.warning("Dependency injector already initialized")
            return
        
        try:
            # Load configuration
            await self._load_configuration()
            
            # Register component types
            await self._register_component_types()
            
            # Resolve dependencies
            await self._resolve_dependencies()
            
            # Create component instances
            await self._create_component_instances()
            
            # Initialize components
            await self._initialize_components()
            
            self._is_initialized = True
            logger.info("Dependency injection system initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize dependency injection system: {e}")
            raise DependencyInjectionError(f"Initialization failed: {e}")
    
    async def start(self):
        """Start all governance components."""
        if not self._is_initialized:
            await self.initialize()
        
        if self._is_started:
            logger.warning("Components already started")
            return
        
        try:
            # Start components in dependency order
            await self._start_components()
            
            # Start health monitoring
            if self.enable_health_monitoring:
                self._health_monitor_task = asyncio.create_task(self._health_monitor())
            
            self._is_started = True
            logger.info("All governance components started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start components: {e}")
            raise ComponentLifecycleError(f"Startup failed: {e}")
    
    async def stop(self):
        """Stop all governance components."""
        if not self._is_started:
            return
        
        logger.info("Stopping governance components...")
        
        self._shutdown_requested = True
        
        # Stop health monitoring
        if self._health_monitor_task:
            self._health_monitor_task.cancel()
            try:
                await self._health_monitor_task
            except asyncio.CancelledError:
                pass
        
        # Stop components in reverse order
        await self._stop_components()
        
        self._is_started = False
        logger.info("All governance components stopped")
    
    async def get_component(self, component_name: str) -> Optional[Any]:
        """
        Get a governance component instance.
        
        This is the main method used to replace None components with real instances.
        
        Args:
            component_name: Name of the component to retrieve
            
        Returns:
            Component instance or None if not available
        """
        if component_name in self._component_instances:
            instance = self._component_instances[component_name]
            
            # Check if component is healthy
            if self._is_component_healthy(component_name):
                return instance
            else:
                logger.warning(f"Component {component_name} is unhealthy")
                
                if self.enable_graceful_degradation:
                    # Return degraded instance or None
                    return self._get_degraded_component(component_name)
                else:
                    return None
        
        logger.warning(f"Component {component_name} not found")
        return None
    
    async def get_all_components(self) -> Dict[str, Any]:
        """
        Get all governance component instances.
        
        This replaces the entire governance_components dictionary with real instances.
        
        Returns:
            Dictionary of all component instances
        """
        healthy_components = {}
        
        for component_name, instance in self._component_instances.items():
            if self._is_component_healthy(component_name):
                healthy_components[component_name] = instance
            elif self.enable_graceful_degradation:
                degraded_instance = self._get_degraded_component(component_name)
                if degraded_instance:
                    healthy_components[component_name] = degraded_instance
        
        return healthy_components
    
    async def inject_components(self, target_object: Any, component_mapping: Dict[str, str] = None):
        """
        Inject governance components into a target object.
        
        This method replaces None attributes in target objects with real component instances.
        
        Args:
            target_object: Object to inject components into
            component_mapping: Optional mapping of attribute names to component names
        """
        if not component_mapping:
            # Default mapping for common governance components
            component_mapping = {
                'trust_calculator': 'trust_metrics_calculator',
                'emotion_logger': 'emotion_telemetry_logger',
                'decision_framework': 'decision_framework_engine',
                'governance_core': 'governance_core',
                'policy_compliance': 'policy_compliance_engine',
                'veritas_engine': 'enhanced_veritas_engine'
            }
        
        for attr_name, component_name in component_mapping.items():
            if hasattr(target_object, attr_name):
                current_value = getattr(target_object, attr_name)
                
                # Replace None with real component
                if current_value is None:
                    component_instance = await self.get_component(component_name)
                    if component_instance:
                        setattr(target_object, attr_name, component_instance)
                        logger.info(f"Injected {component_name} into {attr_name}")
                    else:
                        logger.warning(f"Failed to inject {component_name} into {attr_name}")
    
    async def _load_configuration(self):
        """Load dependency injection configuration."""
        config_file = Path(self.config_path)
        
        if not config_file.exists():
            # Create default configuration
            await self._create_default_configuration()
        
        try:
            with open(config_file, 'r') as f:
                if config_file.suffix.lower() == '.yaml':
                    config = yaml.safe_load(f)
                else:
                    config = json.load(f)
            
            self._component_configs = config.get('components', {})
            self._component_dependencies = config.get('dependencies', {})\n            \n            logger.info(f\"Loaded configuration for {len(self._component_configs)} components\")\n            \n        except Exception as e:\n            logger.error(f\"Error loading configuration: {e}\")\n            raise DependencyInjectionError(f\"Configuration loading failed: {e}\")\n    \n    async def _create_default_configuration(self):\n        \"\"\"Create default dependency injection configuration.\"\"\"\n        default_config = {\n            'components': {\n                'trust_metrics_calculator': {\n                    'class': 'extensions.trust_metrics_extension.GovernanceIntegratedTrustCalculator',\n                    'config': {\n                        'real_time_enabled': True,\n                        'cache_ttl': 300\n                    },\n                    'dependencies': ['storage_backend', 'event_bus']\n                },\n                'emotion_telemetry_logger': {\n                    'class': 'extensions.emotion_telemetry_extension.GovernanceIntegratedEmotionLogger',\n                    'config': {\n                        'real_time_analysis': True,\n                        'sampling_rate': 1.0\n                    },\n                    'dependencies': ['storage_backend', 'event_bus']\n                },\n                'decision_framework_engine': {\n                    'class': 'promethios.phase_6_3_new.src.core.governance.decision_framework_engine.DecisionFrameworkEngine',\n                    'config': {},\n                    'dependencies': ['trust_metrics_calculator', 'governance_core']\n                },\n                'governance_core': {\n                    'class': 'promethios.phase_6_3_new.src.core.governance.governance_core.GovernanceCore',\n                    'config': {},\n                    'dependencies': ['event_bus']\n                },\n                'enhanced_veritas_engine': {\n                    'class': 'promethios.src.veritas.enhanced.api.enhanced_veritas_api.EnhancedVeritasAPI',\n                    'config': {},\n                    'dependencies': ['trust_metrics_calculator', 'emotion_telemetry_logger']\n                },\n                'event_bus': {\n                    'class': 'governance_event_bus.GovernanceEventBus',\n                    'config': {\n                        'enable_self_verification': True,\n                        'health_check_interval': 30\n                    },\n                    'dependencies': []\n                },\n                'storage_backend': {\n                    'class': 'governance_storage_backend.GovernanceStorageBackend',\n                    'config': {\n                        'storage_type': 'memory',  # Can be 'memory', 'file', 'database'\n                        'persistence_enabled': True\n                    },\n                    'dependencies': []\n                }\n            },\n            'dependencies': {\n                'trust_metrics_calculator': ['storage_backend', 'event_bus'],\n                'emotion_telemetry_logger': ['storage_backend', 'event_bus'],\n                'decision_framework_engine': ['trust_metrics_calculator', 'governance_core'],\n                'governance_core': ['event_bus'],\n                'enhanced_veritas_engine': ['trust_metrics_calculator', 'emotion_telemetry_logger'],\n                'event_bus': [],\n                'storage_backend': []\n            }\n        }\n        \n        config_file = Path(self.config_path)\n        with open(config_file, 'w') as f:\n            if config_file.suffix.lower() == '.yaml':\n                yaml.dump(default_config, f, default_flow_style=False)\n            else:\n                json.dump(default_config, f, indent=2)\n        \n        logger.info(f\"Created default configuration: {config_file}\")\n    \n    async def _register_component_types(self):\n        \"\"\"Register component types for instantiation.\"\"\"\n        for component_name, config in self._component_configs.items():\n            try:\n                class_path = config['class']\n                module_path, class_name = class_path.rsplit('.', 1)\n                \n                # Import module\n                module = importlib.import_module(module_path)\n                \n                # Get class\n                component_class = getattr(module, class_name)\n                \n                # Register component\n                self._components[component_name] = component_class\n                \n                logger.debug(f\"Registered component type: {component_name} -> {class_path}\")\n                \n            except Exception as e:\n                logger.error(f\"Failed to register component {component_name}: {e}\")\n                if not self.enable_graceful_degradation:\n                    raise DependencyInjectionError(f\"Component registration failed: {component_name}\")\n    \n    async def _resolve_dependencies(self):\n        \"\"\"Resolve component dependencies and determine initialization order.\"\"\"\n        # Build dependency graph\n        dependency_graph = {}\n        for component_name, dependencies in self._component_dependencies.items():\n            dependency_graph[component_name] = dependencies\n        \n        # Topological sort to determine initialization order\n        self._initialization_order = self._topological_sort(dependency_graph)\n        self._startup_order = self._initialization_order.copy()\n        \n        logger.info(f\"Component initialization order: {self._initialization_order}\")\n    \n    def _topological_sort(self, graph: Dict[str, List[str]]) -> List[str]:\n        \"\"\"Perform topological sort on dependency graph.\"\"\"\n        # Kahn's algorithm\n        in_degree = {node: 0 for node in graph}\n        \n        # Calculate in-degrees\n        for node in graph:\n            for dependency in graph[node]:\n                if dependency in in_degree:\n                    in_degree[dependency] += 1\n        \n        # Find nodes with no incoming edges\n        queue = [node for node, degree in in_degree.items() if degree == 0]\n        result = []\n        \n        while queue:\n            node = queue.pop(0)\n            result.append(node)\n            \n            # Remove edges from this node\n            for dependency in graph.get(node, []):\n                if dependency in in_degree:\n                    in_degree[dependency] -= 1\n                    if in_degree[dependency] == 0:\n                        queue.append(dependency)\n        \n        # Check for cycles\n        if len(result) != len(graph):\n            raise DependencyInjectionError(\"Circular dependency detected\")\n        \n        return result\n    \n    async def _create_component_instances(self):\n        \"\"\"Create component instances in dependency order.\"\"\"\n        for component_name in self._initialization_order:\n            try:\n                await self._create_component_instance(component_name)\n                self._component_status[component_name] = 'created'\n                \n            except Exception as e:\n                logger.error(f\"Failed to create component {component_name}: {e}\")\n                self._component_status[component_name] = 'failed'\n                self._component_errors.setdefault(component_name, []).append(str(e))\n                \n                if not self.enable_graceful_degradation:\n                    raise ComponentLifecycleError(f\"Component creation failed: {component_name}\")\n    \n    async def _create_component_instance(self, component_name: str):\n        \"\"\"Create a single component instance.\"\"\"\n        if component_name in self._component_instances:\n            return  # Already created\n        \n        component_class = self._components.get(component_name)\n        if not component_class:\n            raise DependencyInjectionError(f\"Component class not found: {component_name}\")\n        \n        component_config = self._component_configs.get(component_name, {})\n        config = component_config.get('config', {})\n        dependencies = component_config.get('dependencies', [])\n        \n        # Resolve dependencies\n        dependency_instances = {}\n        for dep_name in dependencies:\n            if dep_name in self._component_instances:\n                dependency_instances[dep_name] = self._component_instances[dep_name]\n            else:\n                logger.warning(f\"Dependency {dep_name} not available for {component_name}\")\n        \n        # Create instance\n        try:\n            # Inspect constructor to determine how to pass dependencies\n            sig = inspect.signature(component_class.__init__)\n            params = list(sig.parameters.keys())[1:]  # Skip 'self'\n            \n            # Build constructor arguments\n            constructor_args = {}\n            \n            # Add config parameters\n            for param in params:\n                if param in config:\n                    constructor_args[param] = config[param]\n                elif param in dependency_instances:\n                    constructor_args[param] = dependency_instances[param]\n            \n            # Create instance\n            instance = component_class(**constructor_args)\n            \n            self._component_instances[component_name] = instance\n            \n            logger.info(f\"Created component instance: {component_name}\")\n            \n        except Exception as e:\n            logger.error(f\"Error creating component instance {component_name}: {e}\")\n            raise\n    \n    async def _initialize_components(self):\n        \"\"\"Initialize all component instances.\"\"\"\n        for component_name in self._initialization_order:\n            if component_name in self._component_instances:\n                try:\n                    await self._initialize_component(component_name)\n                    self._component_status[component_name] = 'initialized'\n                    \n                except Exception as e:\n                    logger.error(f\"Failed to initialize component {component_name}: {e}\")\n                    self._component_status[component_name] = 'init_failed'\n                    self._component_errors.setdefault(component_name, []).append(str(e))\n                    \n                    if not self.enable_graceful_degradation:\n                        raise ComponentLifecycleError(f\"Component initialization failed: {component_name}\")\n    \n    async def _initialize_component(self, component_name: str):\n        \"\"\"Initialize a single component.\"\"\"\n        instance = self._component_instances[component_name]\n        \n        # Check if component has initialize method\n        if hasattr(instance, 'initialize') and callable(getattr(instance, 'initialize')):\n            try:\n                init_method = getattr(instance, 'initialize')\n                \n                if asyncio.iscoroutinefunction(init_method):\n                    await asyncio.wait_for(init_method(), timeout=self.component_timeout)\n                else:\n                    init_method()\n                \n                logger.info(f\"Initialized component: {component_name}\")\n                \n            except asyncio.TimeoutError:\n                raise ComponentLifecycleError(f\"Component initialization timeout: {component_name}\")\n            except Exception as e:\n                raise ComponentLifecycleError(f\"Component initialization error: {component_name}: {e}\")\n    \n    async def _start_components(self):\n        \"\"\"Start all components in dependency order.\"\"\"\n        for component_name in self._startup_order:\n            if component_name in self._component_instances:\n                try:\n                    await self._start_component(component_name)\n                    self._component_status[component_name] = 'started'\n                    \n                except Exception as e:\n                    logger.error(f\"Failed to start component {component_name}: {e}\")\n                    self._component_status[component_name] = 'start_failed'\n                    self._component_errors.setdefault(component_name, []).append(str(e))\n                    \n                    if not self.enable_graceful_degradation:\n                        raise ComponentLifecycleError(f\"Component startup failed: {component_name}\")\n    \n    async def _start_component(self, component_name: str):\n        \"\"\"Start a single component.\"\"\"\n        instance = self._component_instances[component_name]\n        \n        # Check if component has start method\n        if hasattr(instance, 'start') and callable(getattr(instance, 'start')):\n            try:\n                start_method = getattr(instance, 'start')\n                \n                if asyncio.iscoroutinefunction(start_method):\n                    await asyncio.wait_for(start_method(), timeout=self.component_timeout)\n                else:\n                    start_method()\n                \n                logger.info(f\"Started component: {component_name}\")\n                \n            except asyncio.TimeoutError:\n                raise ComponentLifecycleError(f\"Component startup timeout: {component_name}\")\n            except Exception as e:\n                raise ComponentLifecycleError(f\"Component startup error: {component_name}: {e}\")\n    \n    async def _stop_components(self):\n        \"\"\"Stop all components in reverse order.\"\"\"\n        stop_order = list(reversed(self._startup_order))\n        \n        for component_name in stop_order:\n            if component_name in self._component_instances:\n                try:\n                    await self._stop_component(component_name)\n                    self._component_status[component_name] = 'stopped'\n                    \n                except Exception as e:\n                    logger.error(f\"Error stopping component {component_name}: {e}\")\n                    self._component_status[component_name] = 'stop_failed'\n    \n    async def _stop_component(self, component_name: str):\n        \"\"\"Stop a single component.\"\"\"\n        instance = self._component_instances[component_name]\n        \n        # Check if component has stop/shutdown method\n        for method_name in ['stop', 'shutdown', 'close']:\n            if hasattr(instance, method_name) and callable(getattr(instance, method_name)):\n                try:\n                    method = getattr(instance, method_name)\n                    \n                    if asyncio.iscoroutinefunction(method):\n                        await asyncio.wait_for(method(), timeout=self.component_timeout)\n                    else:\n                        method()\n                    \n                    logger.info(f\"Stopped component: {component_name}\")\n                    break\n                    \n                except asyncio.TimeoutError:\n                    logger.warning(f\"Component stop timeout: {component_name}\")\n                    break\n                except Exception as e:\n                    logger.error(f\"Error stopping component {component_name}: {e}\")\n                    break\n    \n    def _is_component_healthy(self, component_name: str) -> bool:\n        \"\"\"Check if a component is healthy.\"\"\"\n        status = self._component_status.get(component_name)\n        return status in ['initialized', 'started']\n    \n    def _get_degraded_component(self, component_name: str) -> Optional[Any]:\n        \"\"\"Get a degraded version of a component.\"\"\"\n        # For now, return None for degraded components\n        # In the future, this could return mock/stub implementations\n        logger.warning(f\"Degraded component requested: {component_name}\")\n        return None\n    \n    async def _health_monitor(self):\n        \"\"\"Monitor component health.\"\"\"\n        while not self._shutdown_requested:\n            try:\n                await self._perform_health_checks()\n                await asyncio.sleep(30)  # Health check every 30 seconds\n                \n            except Exception as e:\n                logger.error(f\"Error in health monitor: {e}\")\n                await asyncio.sleep(30)\n    \n    async def _perform_health_checks(self):\n        \"\"\"Perform health checks on all components.\"\"\"\n        for component_name, instance in self._component_instances.items():\n            try:\n                # Check if component has health_check method\n                if hasattr(instance, 'health_check') and callable(getattr(instance, 'health_check')):\n                    health_method = getattr(instance, 'health_check')\n                    \n                    if asyncio.iscoroutinefunction(health_method):\n                        health_result = await asyncio.wait_for(\n                            health_method(), \n                            timeout=10\n                        )\n                    else:\n                        health_result = health_method()\n                    \n                    # Update health status based on result\n                    if isinstance(health_result, dict):\n                        status = health_result.get('status', 'unknown')\n                        if status == 'healthy':\n                            self._last_health_check[component_name] = datetime.now()\n                        else:\n                            logger.warning(f\"Component {component_name} reports unhealthy: {health_result}\")\n                    \n                else:\n                    # No health check method, assume healthy if instance exists\n                    self._last_health_check[component_name] = datetime.now()\n                \n            except Exception as e:\n                logger.error(f\"Health check failed for {component_name}: {e}\")\n                self._component_status[component_name] = 'unhealthy'\n    \n    async def get_system_status(self) -> Dict[str, Any]:\n        \"\"\"Get overall system status.\"\"\"\n        component_statuses = {}\n        \n        for component_name in self._component_configs.keys():\n            status = self._component_status.get(component_name, 'not_created')\n            errors = self._component_errors.get(component_name, [])\n            last_health_check = self._last_health_check.get(component_name)\n            \n            component_statuses[component_name] = {\n                'status': status,\n                'healthy': self._is_component_healthy(component_name),\n                'errors': errors,\n                'last_health_check': last_health_check.isoformat() if last_health_check else None\n            }\n        \n        # Calculate overall system health\n        total_components = len(self._component_configs)\n        healthy_components = sum(1 for name in self._component_configs.keys() \n                               if self._is_component_healthy(name))\n        \n        system_health = 'healthy' if healthy_components == total_components else 'degraded'\n        if healthy_components == 0:\n            system_health = 'failed'\n        \n        return {\n            'system_health': system_health,\n            'total_components': total_components,\n            'healthy_components': healthy_components,\n            'is_initialized': self._is_initialized,\n            'is_started': self._is_started,\n            'components': component_statuses,\n            'initialization_order': self._initialization_order,\n            'timestamp': datetime.now().isoformat()\n        }\n    \n    async def health_check(self) -> Dict[str, Any]:\n        \"\"\"Perform health check on dependency injection system.\"\"\"\n        return {\n            'component': 'governance_dependency_injector',\n            'status': 'healthy' if self._is_initialized and self._is_started else 'not_ready',\n            'timestamp': datetime.now().isoformat(),\n            'is_initialized': self._is_initialized,\n            'is_started': self._is_started,\n            'managed_components': len(self._component_instances),\n            'healthy_components': sum(1 for name in self._component_configs.keys() \n                                    if self._is_component_healthy(name)),\n            'enable_health_monitoring': self.enable_health_monitoring,\n            'enable_graceful_degradation': self.enable_graceful_degradation\n        }\n\n# Global dependency injector instance\n_global_injector: Optional[GovernanceDependencyInjector] = None\n\nasync def get_governance_injector() -> GovernanceDependencyInjector:\n    \"\"\"Get the global governance dependency injector.\"\"\"\n    global _global_injector\n    \n    if _global_injector is None:\n        _global_injector = GovernanceDependencyInjector()\n        await _global_injector.initialize()\n        await _global_injector.start()\n    \n    return _global_injector\n\nasync def inject_governance_components(target_object: Any, component_mapping: Dict[str, str] = None):\n    \"\"\"Convenience function to inject governance components into an object.\"\"\"\n    injector = await get_governance_injector()\n    await injector.inject_components(target_object, component_mapping)\n\nasync def get_governance_component(component_name: str) -> Optional[Any]:\n    \"\"\"Convenience function to get a governance component.\"\"\"\n    injector = await get_governance_injector()\n    return await injector.get_component(component_name)\n\nasync def get_all_governance_components() -> Dict[str, Any]:\n    \"\"\"Convenience function to get all governance components.\"\"\"\n    injector = await get_governance_injector()\n    return await injector.get_all_components()"

