"""
ModuleRegistry module for the Promethios extension system.

This module provides the ModuleRegistry class, which is responsible for
managing modules and their dependencies in the Promethios system.
"""

from typing import Dict, List, Any, Optional
import logging
from collections import deque

# Set up logging
logger = logging.getLogger(__name__)

class ModuleRegistry:
    """
    Registry for managing modules in the Promethios system.
    
    The ModuleRegistry is responsible for:
    - Registering and deregistering modules
    - Loading and unloading modules
    - Resolving module dependencies
    - Tracking module metadata and state
    """
    
    def __init__(self):
        """Initialize the ModuleRegistry."""
        self._modules: Dict[str, Any] = {}
        self._loaded_modules: Dict[str, bool] = {}
        logger.info("ModuleRegistry initialized")
    
    def register(self, module: Any) -> bool:
        """
        Register a module with the registry.
        
        Args:
            module: The module to register. Must have an 'id' attribute.
            
        Returns:
            bool: True if registration was successful, False otherwise.
        """
        if not hasattr(module, 'id'):
            logger.error("Module must have an 'id' attribute")
            return False
        
        module_id = module.id
        
        if module_id in self._modules:
            logger.warning(f"Module '{module_id}' is already registered")
            return False
        
        self._modules[module_id] = module
        self._loaded_modules[module_id] = False
        
        logger.info(f"Module '{module_id}' registered successfully")
        return True
    
    def deregister(self, module_id: str) -> bool:
        """
        Deregister a module from the registry.
        
        Args:
            module_id: The ID of the module to deregister.
            
        Returns:
            bool: True if deregistration was successful, False otherwise.
        """
        if module_id not in self._modules:
            logger.warning(f"Module '{module_id}' is not registered")
            return False
        
        # Unload the module if it's loaded
        if self._loaded_modules.get(module_id, False):
            logger.info(f"Unloading module '{module_id}' before deregistration")
            self.unload_module(module_id)
        
        # Remove the module
        del self._modules[module_id]
        del self._loaded_modules[module_id]
        
        logger.info(f"Module '{module_id}' deregistered successfully")
        return True
    
    def get_module(self, module_id: str) -> Optional[Any]:
        """
        Get a module by ID.
        
        Args:
            module_id: The ID of the module to retrieve.
            
        Returns:
            The module object, or None if not found.
        """
        return self._modules.get(module_id)
    
    def get_all_modules(self) -> List[str]:
        """
        Get a list of all registered module IDs.
        
        Returns:
            List[str]: A list of module IDs.
        """
        return list(self._modules.keys())
    
    def is_module_loaded(self, module_id: str) -> bool:
        """
        Check if a module is loaded.
        
        Args:
            module_id: The ID of the module to check.
            
        Returns:
            bool: True if the module is loaded, False otherwise.
        """
        if module_id not in self._modules:
            logger.warning(f"Module '{module_id}' is not registered")
            return False
        
        return self._loaded_modules.get(module_id, False)
    
    def load_module(self, module_id: str) -> bool:
        """
        Load a module and its dependencies.
        
        Args:
            module_id: The ID of the module to load.
            
        Returns:
            bool: True if the module was loaded successfully, False otherwise.
        """
        if module_id not in self._modules:
            logger.warning(f"Module '{module_id}' is not registered")
            return False
        
        if self._loaded_modules.get(module_id, False):
            logger.info(f"Module '{module_id}' is already loaded")
            return True
        
        # Resolve dependencies
        dependencies = self.resolve_dependencies(module_id)
        if not dependencies:
            logger.error(f"Failed to resolve dependencies for module '{module_id}'")
            return False
        
        # Load dependencies in order
        for dependency in dependencies:
            if dependency.id == module_id:
                # This is the target module
                if hasattr(dependency, 'initialize') and callable(dependency.initialize):
                    try:
                        dependency.initialize()
                    except Exception as e:
                        logger.error(f"Failed to initialize module '{module_id}': {e}")
                        return False
                
                self._loaded_modules[module_id] = True
                logger.info(f"Module '{module_id}' loaded successfully")
            elif not self._loaded_modules.get(dependency.id, False):
                # This is a dependency that needs to be loaded
                if hasattr(dependency, 'initialize') and callable(dependency.initialize):
                    try:
                        dependency.initialize()
                    except Exception as e:
                        logger.error(f"Failed to initialize dependency '{dependency.id}' for module '{module_id}': {e}")
                        return False
                
                self._loaded_modules[dependency.id] = True
                logger.info(f"Dependency '{dependency.id}' for module '{module_id}' loaded successfully")
        
        return True
    
    def unload_module(self, module_id: str) -> bool:
        """
        Unload a module.
        
        Args:
            module_id: The ID of the module to unload.
            
        Returns:
            bool: True if the module was unloaded successfully, False otherwise.
        """
        if module_id not in self._modules:
            logger.warning(f"Module '{module_id}' is not registered")
            return False
        
        if not self._loaded_modules.get(module_id, False):
            logger.info(f"Module '{module_id}' is already unloaded")
            return True
        
        module = self._modules[module_id]
        
        # Check for dependent modules
        dependent_modules = self._find_dependent_modules(module_id)
        if dependent_modules:
            logger.warning(f"Cannot unload module '{module_id}' because it has dependent modules: {dependent_modules}")
            return False
        
        # Unload the module
        if hasattr(module, 'shutdown') and callable(module.shutdown):
            try:
                module.shutdown()
            except Exception as e:
                logger.error(f"Failed to shutdown module '{module_id}': {e}")
                return False
        
        self._loaded_modules[module_id] = False
        logger.info(f"Module '{module_id}' unloaded successfully")
        return True
    
    def resolve_dependencies(self, module_id: str) -> Optional[List[Any]]:
        """
        Resolve dependencies for a module.
        
        Args:
            module_id: The ID of the module to resolve dependencies for.
            
        Returns:
            Optional[List[Any]]: A list of modules in dependency order, or None if resolution failed.
        """
        if module_id not in self._modules:
            logger.warning(f"Module '{module_id}' is not registered")
            return None
        
        # Use topological sort to resolve dependencies
        visited = set()
        temp_visited = set()
        order = []
        
        def visit(mid):
            if mid in temp_visited:
                logger.error(f"Circular dependency detected involving module '{mid}'")
                return False
            
            if mid in visited:
                return True
            
            if mid not in self._modules:
                logger.error(f"Dependency '{mid}' is not registered")
                return False
            
            temp_visited.add(mid)
            
            # Visit dependencies
            module = self._modules[mid]
            if hasattr(module, 'dependencies') and module.dependencies:
                for dep_id in module.dependencies:
                    if not visit(dep_id):
                        return False
            
            temp_visited.remove(mid)
            visited.add(mid)
            order.append(self._modules[mid])
            return True
        
        if not visit(module_id):
            return None
        
        return order
    
    def _find_dependent_modules(self, module_id: str) -> List[str]:
        """
        Find modules that depend on the specified module.
        
        Args:
            module_id: The ID of the module to find dependents for.
            
        Returns:
            List[str]: A list of module IDs that depend on the specified module.
        """
        dependent_modules = []
        
        for mid, module in self._modules.items():
            if mid == module_id:
                continue
            
            if hasattr(module, 'dependencies') and module.dependencies and module_id in module.dependencies:
                dependent_modules.append(mid)
        
        return dependent_modules
