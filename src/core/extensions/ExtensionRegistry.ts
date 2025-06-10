/**
 * ExtensionRegistry.ts
 * 
 * A centralized registry for managing extension points in the Promethios UI.
 * This system allows for versioned, backward-compatible extensions throughout the application.
 */

export interface ExtensionMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: Record<string, string>;
}

export interface ExtensionPoint<T> {
  id: string;
  version: string;
  register: (implementation: T, key: string, metadata?: Partial<ExtensionMetadata>) => void;
  unregister: (key: string) => void;
  get: (key: string) => T | undefined;
  getAll: () => Record<string, T>;
  getDefault: () => T | undefined;
  setDefault: (key: string) => void;
  getMetadata: (key: string) => ExtensionMetadata | undefined;
  getAllMetadata: () => Record<string, ExtensionMetadata>;
}

/**
 * Singleton registry for managing extension points throughout the application.
 * Provides versioning support and backward compatibility mechanisms.
 */
export class ExtensionRegistry {
  private static instance: ExtensionRegistry;
  private extensionPoints: Record<string, Record<string, ExtensionPoint<any>>> = {};
  private defaultExtensions: Record<string, string> = {};

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of the ExtensionRegistry
   */
  public static getInstance(): ExtensionRegistry {
    if (!ExtensionRegistry.instance) {
      ExtensionRegistry.instance = new ExtensionRegistry();
    }
    return ExtensionRegistry.instance;
  }

  /**
   * Register a new extension point with versioning support
   * @param id Unique identifier for the extension point
   * @param version Version of the extension point
   * @returns An ExtensionPoint instance for registering implementations
   */
  public registerExtensionPoint<T>(id: string, version: string): ExtensionPoint<T> {
    if (!this.extensionPoints[id]) {
      this.extensionPoints[id] = {};
    }

    if (this.extensionPoints[id][version]) {
      console.warn(`Extension point ${id}@${version} already registered. Returning existing instance.`);
      return this.extensionPoints[id][version] as ExtensionPoint<T>;
    }

    const implementations: Record<string, T> = {};
    const metadata: Record<string, ExtensionMetadata> = {};
    let defaultImplementation: string | undefined;

    const extensionPoint: ExtensionPoint<T> = {
      id,
      version,
      
      register: (implementation: T, key: string, meta?: Partial<ExtensionMetadata>) => {
        if (implementations[key]) {
          console.warn(`Implementation ${key} for extension point ${id}@${version} already registered. Overwriting.`);
        }
        
        implementations[key] = implementation;
        metadata[key] = {
          id: key,
          name: meta?.name || key,
          version: meta?.version || '1.0.0',
          description: meta?.description,
          author: meta?.author,
          dependencies: meta?.dependencies
        };
        
        // Set as default if it's the first implementation or explicitly requested
        if (!defaultImplementation || this.defaultExtensions[`${id}@${version}`] === key) {
          defaultImplementation = key;
          this.defaultExtensions[`${id}@${version}`] = key;
        }
        
        console.log(`Registered implementation ${key} for extension point ${id}@${version}`);
      },
      
      unregister: (key: string) => {
        if (!implementations[key]) {
          console.warn(`Implementation ${key} for extension point ${id}@${version} not found.`);
          return;
        }
        
        delete implementations[key];
        delete metadata[key];
        
        // Update default if needed
        if (defaultImplementation === key) {
          defaultImplementation = Object.keys(implementations)[0];
          if (defaultImplementation) {
            this.defaultExtensions[`${id}@${version}`] = defaultImplementation;
          } else {
            delete this.defaultExtensions[`${id}@${version}`];
          }
        }
        
        console.log(`Unregistered implementation ${key} for extension point ${id}@${version}`);
      },
      
      get: (key: string) => {
        return implementations[key];
      },
      
      getAll: () => {
        return { ...implementations };
      },
      
      getDefault: () => {
        return defaultImplementation ? implementations[defaultImplementation] : undefined;
      },
      
      setDefault: (key: string) => {
        if (!implementations[key]) {
          console.warn(`Cannot set default: Implementation ${key} for extension point ${id}@${version} not found.`);
          return;
        }
        
        defaultImplementation = key;
        this.defaultExtensions[`${id}@${version}`] = key;
        console.log(`Set ${key} as default implementation for extension point ${id}@${version}`);
      },
      
      getMetadata: (key: string) => {
        return metadata[key];
      },
      
      getAllMetadata: () => {
        return { ...metadata };
      }
    };
    
    this.extensionPoints[id][version] = extensionPoint;
    console.log(`Registered extension point ${id}@${version}`);
    
    return extensionPoint;
  }

  /**
   * Get an extension point by ID and version
   * @param id Unique identifier for the extension point
   * @param version Version of the extension point
   * @returns The requested ExtensionPoint or undefined if not found
   */
  public getExtensionPoint<T>(id: string, version: string): ExtensionPoint<T> | undefined {
    if (!this.extensionPoints[id] || !this.extensionPoints[id][version]) {
      console.warn(`Extension point ${id}@${version} not found.`);
      return undefined;
    }
    
    return this.extensionPoints[id][version] as ExtensionPoint<T>;
  }

  /**
   * Get the latest version of an extension point by ID
   * @param id Unique identifier for the extension point
   * @returns The latest version of the requested ExtensionPoint or undefined if not found
   */
  public getLatestExtensionPoint<T>(id: string): ExtensionPoint<T> | undefined {
    if (!this.extensionPoints[id]) {
      console.warn(`No extension points found with ID ${id}.`);
      return undefined;
    }
    
    const versions = Object.keys(this.extensionPoints[id]).sort((a, b) => {
      // Simple semver-like comparison
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = i < aParts.length ? aParts[i] : 0;
        const bVal = i < bParts.length ? bParts[i] : 0;
        
        if (aVal !== bVal) {
          return bVal - aVal; // Descending order
        }
      }
      
      return 0;
    });
    
    if (versions.length === 0) {
      console.warn(`No versions found for extension point ${id}.`);
      return undefined;
    }
    
    return this.extensionPoints[id][versions[0]] as ExtensionPoint<T>;
  }

  /**
   * List all registered extension points
   * @returns A record of all extension points by ID and version
   */
  public listExtensionPoints(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    
    Object.keys(this.extensionPoints).forEach(id => {
      result[id] = Object.keys(this.extensionPoints[id]);
    });
    
    return result;
  }

  /**
   * Validate extension compatibility based on dependencies
   * @param extensionId The ID of the extension to validate
   * @param extensionPointId The ID of the extension point
   * @param version The version of the extension point
   * @returns True if compatible, false otherwise
   */
  public validateCompatibility(extensionId: string, extensionPointId: string, version: string): boolean {
    const extensionPoint = this.getExtensionPoint(extensionPointId, version);
    if (!extensionPoint) {
      return false;
    }
    
    const metadata = extensionPoint.getMetadata(extensionId);
    if (!metadata || !metadata.dependencies) {
      return true; // No dependencies to validate
    }
    
    // Check each dependency
    for (const [depId, depVersion] of Object.entries(metadata.dependencies)) {
      const depExtensionPoint = this.getExtensionPoint(depId, depVersion);
      if (!depExtensionPoint) {
        console.warn(`Dependency ${depId}@${depVersion} not found for extension ${extensionId}.`);
        return false;
      }
      
      // Additional validation logic could be added here
    }
    
    return true;
  }

  /**
   * Reset the registry (primarily for testing purposes)
   */
  public reset(): void {
    this.extensionPoints = {};
    this.defaultExtensions = {};
  }
}

export default ExtensionRegistry;
