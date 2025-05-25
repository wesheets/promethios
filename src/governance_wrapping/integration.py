"""
Governance Wrapping Integration for Promethios

This module provides utilities for applying governance wrapping to all modules
in the Promethios system, ensuring consistent governance instrumentation.
"""

import os
import sys
import importlib
import logging
import inspect
from pathlib import Path

from ..governance_wrapping.core import wrap_module, GovernanceConfig

logger = logging.getLogger(__name__)

class GovernanceIntegrator:
    """Integrator for applying governance wrapping to all modules."""
    
    def __init__(self, config=None):
        """Initialize with optional configuration."""
        self.config = config or GovernanceConfig.default()
        self.wrapped_modules = {}
        
    def integrate_all_modules(self, base_path=None):
        """Apply governance wrapping to all modules in the system."""
        if base_path is None:
            # Default to src directory
            base_path = os.path.join(os.path.dirname(__file__), '..', '..')
            
        base_path = os.path.abspath(base_path)
        logger.info(f"Integrating governance wrapping for all modules in {base_path}")
        
        # Find all Python modules
        module_paths = self._find_python_modules(base_path)
        
        # Apply wrapping to each module
        for module_path in module_paths:
            self._wrap_module(module_path, base_path)
            
        logger.info(f"Integrated governance wrapping for {len(self.wrapped_modules)} modules")
        return self.wrapped_modules
        
    def _find_python_modules(self, base_path):
        """Find all Python modules in the base path."""
        module_paths = []
        
        for root, dirs, files in os.walk(base_path):
            # Skip hidden directories and __pycache__
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']
            
            for file in files:
                if file.endswith('.py') and not file.startswith('_'):
                    module_paths.append(os.path.join(root, file))
                    
        return module_paths
        
    def _wrap_module(self, module_path, base_path):
        """Wrap a module with governance controls."""
        # Convert file path to module path
        rel_path = os.path.relpath(module_path, base_path)
        module_name = os.path.splitext(rel_path)[0].replace(os.path.sep, '.')
        
        try:
            # Import the module
            module = importlib.import_module(module_name)
            
            # Determine module type
            module_type = self._determine_module_type(module, module_name)
            
            # Apply wrapping
            wrapped = wrap_module(module, module_type)
            
            # Store wrapped module
            self.wrapped_modules[module_name] = wrapped
            
            logger.info(f"Wrapped module {module_name} as {module_type}")
        except Exception as e:
            logger.error(f"Failed to wrap module {module_name}: {e}")
            
    def _determine_module_type(self, module, module_name):
        """Determine the type of a module based on its characteristics."""
        # Check module name for clues
        if any(segment in module_name for segment in ['core', 'kernel', 'engine']):
            return 'core'
        elif any(segment in module_name for segment in ['extension', 'plugin', 'addon']):
            return 'extension'
        elif any(segment in module_name for segment in ['integration', 'external', 'connector']):
            return 'integration'
            
        # Check module contents
        if hasattr(module, '__all__'):
            exports = module.__all__
            
            # Check for core module patterns
            if any(name in exports for name in ['Engine', 'Core', 'Kernel']):
                return 'core'
                
            # Check for extension module patterns
            if any(name in exports for name in ['Extension', 'Plugin']):
                return 'extension'
                
            # Check for integration module patterns
            if any(name in exports for name in ['Integration', 'Connector']):
                return 'integration'
                
        # Default to basic module
        return 'basic'


class ModuleRegistry:
    """Registry for tracking wrapped modules."""
    
    _instance = None
    
    @classmethod
    def get_instance(cls):
        """Get singleton instance."""
        if cls._instance is None:
            cls._instance = ModuleRegistry()
        return cls._instance
        
    def __init__(self):
        """Initialize the registry."""
        self.wrapped_modules = {}
        
    def register(self, module_name, wrapped_module, original_module):
        """Register a wrapped module."""
        self.wrapped_modules[module_name] = {
            'wrapped': wrapped_module,
            'original': original_module
        }
        
    def get_wrapped(self, module_name):
        """Get a wrapped module by name."""
        if module_name in self.wrapped_modules:
            return self.wrapped_modules[module_name]['wrapped']
        return None
        
    def get_original(self, module_name):
        """Get the original unwrapped module by name."""
        if module_name in self.wrapped_modules:
            return self.wrapped_modules[module_name]['original']
        return None
        
    def list_modules(self):
        """List all registered modules."""
        return list(self.wrapped_modules.keys())


class ImportHook:
    """Import hook for automatically wrapping modules."""
    
    def __init__(self, base_package):
        """Initialize with base package to wrap."""
        self.base_package = base_package
        self.registry = ModuleRegistry.get_instance()
        
    def find_spec(self, fullname, path, target=None):
        """Find module spec and prepare for wrapping if needed."""
        # Only handle modules in our base package
        if not fullname.startswith(self.base_package):
            return None
            
        # Let the normal import machinery find the spec
        spec = importlib.util.find_spec(fullname)
        if spec is None:
            return None
            
        # Return a wrapped spec
        return importlib.util.spec_from_loader(
            fullname,
            WrappingLoader(spec.loader, fullname, self.registry)
        )


class WrappingLoader:
    """Loader that wraps modules with governance controls."""
    
    def __init__(self, original_loader, fullname, registry):
        """Initialize with original loader and module information."""
        self.original_loader = original_loader
        self.fullname = fullname
        self.registry = registry
        
    def create_module(self, spec):
        """Create the module using the original loader."""
        return self.original_loader.create_module(spec)
        
    def exec_module(self, module):
        """Execute the module and apply governance wrapping."""
        # Execute the original module
        self.original_loader.exec_module(module)
        
        # Determine module type
        module_type = self._determine_module_type(module)
        
        # Apply wrapping
        wrapped = wrap_module(module, module_type)
        
        # Register the wrapped module
        self.registry.register(self.fullname, wrapped, module)
        
        # Replace module attributes with wrapped versions
        for name in dir(wrapped):
            if not name.startswith('_'):
                setattr(module, name, getattr(wrapped, name))
                
    def _determine_module_type(self, module):
        """Determine the type of a module based on its characteristics."""
        # This is a simplified implementation
        # In a real system, this would use more sophisticated detection
        
        if any(name in self.fullname for name in ['core', 'kernel', 'engine']):
            return 'core'
        elif any(name in self.fullname for name in ['extension', 'plugin', 'addon']):
            return 'extension'
        elif any(name in self.fullname for name in ['integration', 'external', 'connector']):
            return 'integration'
        else:
            return 'basic'


def install_import_hook(base_package='promethios'):
    """Install the import hook for automatic governance wrapping."""
    sys.meta_path.insert(0, ImportHook(base_package))
    logger.info(f"Installed governance wrapping import hook for {base_package}")


def apply_governance_wrapping():
    """Apply governance wrapping to all modules in the system."""
    # Create integrator
    integrator = GovernanceIntegrator()
    
    # Apply wrapping to all modules
    wrapped_modules = integrator.integrate_all_modules()
    
    # Install import hook for future imports
    install_import_hook()
    
    return wrapped_modules


def main():
    """Main function for CLI usage."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Governance Wrapping Integration")
    parser.add_argument("--config", "-c", help="Path to configuration file")
    parser.add_argument("--base-path", "-p", help="Base path for module discovery")
    parser.add_argument("--install-hook", "-i", action="store_true", help="Install import hook")
    
    args = parser.parse_args()
    
    # Load config if provided
    config = None
    if args.config:
        config = GovernanceConfig.from_config_file(args.config)
    else:
        config = GovernanceConfig.from_environment()
    
    # Create integrator
    integrator = GovernanceIntegrator(config)
    
    # Apply wrapping to all modules
    wrapped_modules = integrator.integrate_all_modules(args.base_path)
    
    # Install import hook if requested
    if args.install_hook:
        install_import_hook()
    
    print(f"Applied governance wrapping to {len(wrapped_modules)} modules")


if __name__ == "__main__":
    main()
