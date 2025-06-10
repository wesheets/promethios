# Promethios Extension System Documentation

## Overview

The Promethios Extension System provides a flexible and robust framework for extending the functionality of the Promethios platform. It allows for dynamic loading and unloading of extensions, feature toggling, and dependency management.

This document provides comprehensive documentation on the architecture, components, and usage of the extension system.

## Architecture

The extension system consists of three main components:

1. **ExtensionRegistry**: Manages extensions and their lifecycle
2. **ModuleRegistry**: Manages modules and their dependencies
3. **FeatureToggleService**: Controls feature availability

These components work together to provide a cohesive extension system:

```
┌─────────────────────┐
│  ExtensionRegistry  │
└─────────┬───────────┘
          │
          │ coordinates
          │
┌─────────▼───────────┐     ┌─────────────────────┐
│   ModuleRegistry    │◄────►│FeatureToggleService│
└─────────────────────┘     └─────────────────────┘
```

### Integration Layer

The `ExtensionSystemIntegration` class provides compatibility with existing Promethios components:

```
┌─────────────────────────────────────────┐
│      ExtensionSystemIntegration         │
├─────────────────┬───────────────────────┤
│ ExtensionRegistry│ModuleRegistry│FeatureToggleService│
└─────────────────┴───────────────┴───────┘
          │                │               │
          ▼                ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
│ UI Components   │ │Core Modules │ │  Features   │
└─────────────────┘ └─────────────┘ └─────────────┘
```

## Components

### ExtensionRegistry

The `ExtensionRegistry` is responsible for:
- Registering and deregistering extensions
- Enabling and disabling extensions
- Tracking extension metadata and state
- Coordinating with ModuleRegistry and FeatureToggleService

#### Key Methods:
- `register(extension)`: Register an extension
- `deregister(extension_id)`: Deregister an extension
- `get_extension(extension_id)`: Get an extension by ID
- `get_all_extensions()`: Get all registered extensions
- `is_extension_enabled(extension_id)`: Check if an extension is enabled
- `enable_extension(extension_id, module_registry, feature_toggle_service)`: Enable an extension
- `disable_extension(extension_id, module_registry, feature_toggle_service)`: Disable an extension

### ModuleRegistry

The `ModuleRegistry` is responsible for:
- Registering and deregistering modules
- Loading and unloading modules
- Resolving module dependencies
- Tracking module metadata and state

#### Key Methods:
- `register(module)`: Register a module
- `deregister(module_id)`: Deregister a module
- `get_module(module_id)`: Get a module by ID
- `get_all_modules()`: Get all registered modules
- `is_module_loaded(module_id)`: Check if a module is loaded
- `load_module(module_id)`: Load a module and its dependencies
- `unload_module(module_id)`: Unload a module
- `resolve_dependencies(module_id)`: Resolve dependencies for a module

### FeatureToggleService

The `FeatureToggleService` is responsible for:
- Enabling and disabling features
- Managing feature dependencies
- Tracking feature state
- Providing feature availability information

#### Key Methods:
- `enable_feature(feature_id)`: Enable a feature and its dependencies
- `disable_feature(feature_id)`: Disable a feature and its dependent features
- `is_feature_enabled(feature_id)`: Check if a feature is enabled
- `set_feature_dependencies(feature_id, dependencies)`: Set dependencies for a feature
- `get_feature_dependencies(feature_id)`: Get dependencies for a feature
- `get_dependent_features(feature_id)`: Get features that depend on a feature
- `get_all_enabled_features()`: Get all enabled features

### ExtensionSystemIntegration

The `ExtensionSystemIntegration` class provides:
- Integration with existing Promethios components
- Registration of core modules, features, and extensions
- UI component management
- Simplified API for extension management

#### Key Methods:
- `initialize()`: Initialize the extension system
- `get_ui_component(component_id)`: Get a UI component by ID
- `register_extension(extension_data)`: Register an extension from data
- `enable_extension(extension_id)`: Enable an extension
- `disable_extension(extension_id)`: Disable an extension
- `is_feature_enabled(feature_id)`: Check if a feature is enabled

## Usage

### Creating an Extension

Extensions must have the following attributes:
- `id`: A unique identifier for the extension
- `name`: A human-readable name for the extension
- `version`: The version of the extension
- `modules`: A list of module IDs that this extension includes
- `features`: A list of feature IDs that this extension provides

Example:
```python
class MyExtension:
    def __init__(self):
        self.id = "my-extension"
        self.name = "My Extension"
        self.version = "1.0.0"
        self.modules = ["my-module"]
        self.features = ["my-feature"]
```

### Creating a Module

Modules must have the following attributes:
- `id`: A unique identifier for the module
- `name`: A human-readable name for the module
- `version`: The version of the module
- `dependencies`: A list of module IDs that this module depends on

Modules should also implement:
- `initialize()`: Called when the module is loaded
- `shutdown()`: Called when the module is unloaded

Example:
```python
class MyModule:
    def __init__(self):
        self.id = "my-module"
        self.name = "My Module"
        self.version = "1.0.0"
        self.dependencies = []
    
    def initialize(self):
        # Initialize the module
        return True
    
    def shutdown(self):
        # Clean up resources
        return True
```

### Using the Extension System

#### Basic Usage

```python
from src.core.integration.extension_system_integration import ExtensionSystemIntegration

# Initialize the extension system
integration = ExtensionSystemIntegration()
integration.initialize()

# Register an extension
extension_data = {
    'id': 'my-extension',
    'name': 'My Extension',
    'version': '1.0.0',
    'modules': ['my-module'],
    'features': ['my-feature']
}
integration.register_extension(extension_data)

# Enable the extension
integration.enable_extension('my-extension')

# Check if a feature is enabled
if integration.is_feature_enabled('my-feature'):
    # Use the feature
    pass

# Get a UI component
dashboard = integration.get_ui_component('governance-dashboard')

# Disable the extension
integration.disable_extension('my-extension')
```

#### Advanced Usage

For more advanced usage, you can access the underlying components directly:

```python
# Access the extension registry
extension_registry = integration.extension_registry

# Access the module registry
module_registry = integration.module_registry

# Access the feature toggle service
feature_toggle_service = integration.feature_toggle_service

# Register a module directly
module = MyModule()
module_registry.register(module)

# Set feature dependencies
feature_toggle_service.set_feature_dependencies('feature-b', ['feature-a'])
```

## Best Practices

1. **Module Dependencies**: Keep module dependencies minimal and explicit
2. **Feature Granularity**: Define features at an appropriate level of granularity
3. **Extension Composition**: Compose extensions from reusable modules
4. **Error Handling**: Handle errors gracefully and provide meaningful error messages
5. **Testing**: Write comprehensive tests for extensions and modules
6. **Documentation**: Document extensions, modules, and features thoroughly

## Troubleshooting

### Common Issues

1. **Module Not Found**: Ensure the module is registered before loading
2. **Circular Dependencies**: Check for circular dependencies between modules or features
3. **Extension Not Enabled**: Ensure the extension is enabled before using its features
4. **Feature Not Available**: Check if the feature is enabled and all dependencies are satisfied

### Debugging

The extension system uses Python's logging module for logging. To enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Conclusion

The Promethios Extension System provides a flexible and robust framework for extending the functionality of the Promethios platform. By following the guidelines in this document, you can create and manage extensions that integrate seamlessly with the platform.
