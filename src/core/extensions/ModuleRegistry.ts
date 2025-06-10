/**
 * ModuleRegistry.ts
 * 
 * A system for managing modules in the Promethios UI.
 * This registry handles module registration, dependency resolution, and lifecycle management.
 */

import ExtensionRegistry, { ExtensionMetadata } from './ExtensionRegistry';

export interface ModuleDefinition {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: Record<string, string>;
  extensionPoints?: string[];
  initialize?: () => Promise<void>;
  start?: () => Promise<void>;
  stop?: () => Promise<void>;
  uninstall?: () => Promise<void>;
}

export enum ModuleState {
  REGISTERED = 'registered',
  INITIALIZED = 'initialized',
  STARTED = 'started',
  STOPPED = 'stopped',
  ERROR = 'error'
}

export interface ModuleStatus {
  state: ModuleState;
  error?: Error;
  lastStateChange: Date;
}

/**
 * Singleton registry for managing modules throughout the application.
 * Handles module lifecycle, dependencies, and integration with the extension system.
 */
export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private modules: Record<string, ModuleDefinition> = {};
  private moduleStatus: Record<string, ModuleStatus> = {};
  private extensionRegistry: ExtensionRegistry;
  private startupOrder: string[] = [];

  private constructor() {
    this.extensionRegistry = ExtensionRegistry.getInstance();
  }

  /**
   * Get the singleton instance of the ModuleRegistry
   */
  public static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  /**
   * Register a new module
   * @param module Module definition
   * @returns True if registration was successful
   */
  public registerModule(module: ModuleDefinition): boolean {
    if (this.modules[module.id]) {
      console.warn(`Module ${module.id} already registered. Skipping.`);
      return false;
    }

    this.modules[module.id] = module;
    this.moduleStatus[module.id] = {
      state: ModuleState.REGISTERED,
      lastStateChange: new Date()
    };

    console.log(`Registered module ${module.id}@${module.version}`);
    return true;
  }

  /**
   * Unregister a module
   * @param moduleId ID of the module to unregister
   * @returns True if unregistration was successful
   */
  public unregisterModule(moduleId: string): boolean {
    if (!this.modules[moduleId]) {
      console.warn(`Module ${moduleId} not found. Cannot unregister.`);
      return false;
    }

    // Check if any other modules depend on this one
    const dependents = this.findDependentModules(moduleId);
    if (dependents.length > 0) {
      console.error(`Cannot unregister module ${moduleId}. The following modules depend on it: ${dependents.join(', ')}`);
      return false;
    }

    delete this.modules[moduleId];
    delete this.moduleStatus[moduleId];
    
    // Remove from startup order if present
    const index = this.startupOrder.indexOf(moduleId);
    if (index !== -1) {
      this.startupOrder.splice(index, 1);
    }

    console.log(`Unregistered module ${moduleId}`);
    return true;
  }

  /**
   * Get a module by ID
   * @param moduleId ID of the module to retrieve
   * @returns The requested module or undefined if not found
   */
  public getModule(moduleId: string): ModuleDefinition | undefined {
    return this.modules[moduleId];
  }

  /**
   * Get all registered modules
   * @returns Record of all registered modules
   */
  public getAllModules(): Record<string, ModuleDefinition> {
    return { ...this.modules };
  }

  /**
   * Get the status of a module
   * @param moduleId ID of the module
   * @returns Module status or undefined if not found
   */
  public getModuleStatus(moduleId: string): ModuleStatus | undefined {
    return this.moduleStatus[moduleId];
  }

  /**
   * Get the status of all modules
   * @returns Record of all module statuses
   */
  public getAllModuleStatuses(): Record<string, ModuleStatus> {
    return { ...this.moduleStatus };
  }

  /**
   * Initialize a module
   * @param moduleId ID of the module to initialize
   * @returns Promise resolving to true if initialization was successful
   */
  public async initializeModule(moduleId: string): Promise<boolean> {
    const module = this.modules[moduleId];
    if (!module) {
      console.warn(`Module ${moduleId} not found. Cannot initialize.`);
      return false;
    }

    if (this.moduleStatus[moduleId].state === ModuleState.INITIALIZED) {
      console.warn(`Module ${moduleId} already initialized.`);
      return true;
    }

    try {
      // Initialize dependencies first
      if (module.dependencies) {
        for (const [depId, depVersion] of Object.entries(module.dependencies)) {
          const depModule = this.modules[depId];
          if (!depModule) {
            throw new Error(`Dependency ${depId}@${depVersion} not found for module ${moduleId}.`);
          }

          if (this.moduleStatus[depId].state === ModuleState.REGISTERED) {
            const success = await this.initializeModule(depId);
            if (!success) {
              throw new Error(`Failed to initialize dependency ${depId} for module ${moduleId}.`);
            }
          }
        }
      }

      // Initialize the module
      if (module.initialize) {
        await module.initialize();
      }

      this.moduleStatus[moduleId] = {
        state: ModuleState.INITIALIZED,
        lastStateChange: new Date()
      };

      console.log(`Initialized module ${moduleId}`);
      return true;
    } catch (error) {
      this.moduleStatus[moduleId] = {
        state: ModuleState.ERROR,
        error: error instanceof Error ? error : new Error(String(error)),
        lastStateChange: new Date()
      };

      console.error(`Failed to initialize module ${moduleId}:`, error);
      return false;
    }
  }

  /**
   * Start a module
   * @param moduleId ID of the module to start
   * @returns Promise resolving to true if start was successful
   */
  public async startModule(moduleId: string): Promise<boolean> {
    const module = this.modules[moduleId];
    if (!module) {
      console.warn(`Module ${moduleId} not found. Cannot start.`);
      return false;
    }

    if (this.moduleStatus[moduleId].state === ModuleState.STARTED) {
      console.warn(`Module ${moduleId} already started.`);
      return true;
    }

    if (this.moduleStatus[moduleId].state !== ModuleState.INITIALIZED) {
      console.warn(`Module ${moduleId} not initialized. Initializing first.`);
      const success = await this.initializeModule(moduleId);
      if (!success) {
        return false;
      }
    }

    try {
      // Start dependencies first
      if (module.dependencies) {
        for (const [depId, depVersion] of Object.entries(module.dependencies)) {
          const depModule = this.modules[depId];
          if (!depModule) {
            throw new Error(`Dependency ${depId}@${depVersion} not found for module ${moduleId}.`);
          }

          if (this.moduleStatus[depId].state !== ModuleState.STARTED) {
            const success = await this.startModule(depId);
            if (!success) {
              throw new Error(`Failed to start dependency ${depId} for module ${moduleId}.`);
            }
          }
        }
      }

      // Start the module
      if (module.start) {
        await module.start();
      }

      this.moduleStatus[moduleId] = {
        state: ModuleState.STARTED,
        lastStateChange: new Date()
      };

      // Add to startup order if not already present
      if (!this.startupOrder.includes(moduleId)) {
        this.startupOrder.push(moduleId);
      }

      console.log(`Started module ${moduleId}`);
      return true;
    } catch (error) {
      this.moduleStatus[moduleId] = {
        state: ModuleState.ERROR,
        error: error instanceof Error ? error : new Error(String(error)),
        lastStateChange: new Date()
      };

      console.error(`Failed to start module ${moduleId}:`, error);
      return false;
    }
  }

  /**
   * Stop a module
   * @param moduleId ID of the module to stop
   * @returns Promise resolving to true if stop was successful
   */
  public async stopModule(moduleId: string): Promise<boolean> {
    const module = this.modules[moduleId];
    if (!module) {
      console.warn(`Module ${moduleId} not found. Cannot stop.`);
      return false;
    }

    if (this.moduleStatus[moduleId].state !== ModuleState.STARTED) {
      console.warn(`Module ${moduleId} not started. Nothing to stop.`);
      return true;
    }

    // Check if any other modules depend on this one
    const dependents = this.findStartedDependentModules(moduleId);
    if (dependents.length > 0) {
      console.error(`Cannot stop module ${moduleId}. The following modules depend on it: ${dependents.join(', ')}`);
      return false;
    }

    try {
      // Stop the module
      if (module.stop) {
        await module.stop();
      }

      this.moduleStatus[moduleId] = {
        state: ModuleState.STOPPED,
        lastStateChange: new Date()
      };

      console.log(`Stopped module ${moduleId}`);
      return true;
    } catch (error) {
      this.moduleStatus[moduleId] = {
        state: ModuleState.ERROR,
        error: error instanceof Error ? error : new Error(String(error)),
        lastStateChange: new Date()
      };

      console.error(`Failed to stop module ${moduleId}:`, error);
      return false;
    }
  }

  /**
   * Start all registered modules
   * @returns Promise resolving to true if all modules were started successfully
   */
  public async startAllModules(): Promise<boolean> {
    const moduleIds = Object.keys(this.modules);
    const results = await Promise.all(moduleIds.map(id => this.startModule(id)));
    return results.every(result => result);
  }

  /**
   * Stop all started modules in reverse startup order
   * @returns Promise resolving to true if all modules were stopped successfully
   */
  public async stopAllModules(): Promise<boolean> {
    const reverseOrder = [...this.startupOrder].reverse();
    const results = await Promise.all(reverseOrder.map(id => this.stopModule(id)));
    return results.every(result => result);
  }

  /**
   * Find modules that depend on a specific module
   * @param moduleId ID of the module
   * @returns Array of module IDs that depend on the specified module
   */
  private findDependentModules(moduleId: string): string[] {
    return Object.entries(this.modules)
      .filter(([id, module]) => 
        module.dependencies && 
        Object.keys(module.dependencies).includes(moduleId)
      )
      .map(([id]) => id);
  }

  /**
   * Find started modules that depend on a specific module
   * @param moduleId ID of the module
   * @returns Array of module IDs that depend on the specified module and are currently started
   */
  private findStartedDependentModules(moduleId: string): string[] {
    return this.findDependentModules(moduleId)
      .filter(id => this.moduleStatus[id].state === ModuleState.STARTED);
  }

  /**
   * Resolve the dependency order for modules
   * @param moduleIds Array of module IDs to resolve
   * @returns Array of module IDs in dependency order
   */
  public resolveDependencyOrder(moduleIds: string[]): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const module = this.modules[id];
      if (!module) return;

      if (module.dependencies) {
        for (const depId of Object.keys(module.dependencies)) {
          if (this.modules[depId]) {
            visit(depId);
          }
        }
      }

      result.push(id);
    };

    for (const id of moduleIds) {
      visit(id);
    }

    return result;
  }

  /**
   * Reset the registry (primarily for testing purposes)
   */
  public reset(): void {
    this.modules = {};
    this.moduleStatus = {};
    this.startupOrder = [];
  }
}

export default ModuleRegistry;
