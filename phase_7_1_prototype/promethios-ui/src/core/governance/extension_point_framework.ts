/**
 * Simplified Extension Point Framework for Promethios UI
 * 
 * Provides basic extension point functionality for the frontend components
 * without requiring the full backend governance framework.
 */

export interface ExtensionPoint {
  name: string;
  description: string;
  execute: (data: any) => Promise<any>;
}

export interface Extension {
  id: string;
  name: string;
  version: string;
  extensionPoints: ExtensionPoint[];
  initialize: () => Promise<boolean>;
}

export class ExtensionRegistry {
  private static instance: ExtensionRegistry;
  private extensions = new Map<string, Extension>();
  private extensionPoints = new Map<string, ExtensionPoint[]>();

  private constructor() {}

  static getInstance(): ExtensionRegistry {
    if (!ExtensionRegistry.instance) {
      ExtensionRegistry.instance = new ExtensionRegistry();
    }
    return ExtensionRegistry.instance;
  }

  async registerExtension(extension: Extension): Promise<boolean> {
    try {
      // Initialize the extension
      const initialized = await extension.initialize();
      if (!initialized) {
        console.error(`Failed to initialize extension: ${extension.id}`);
        return false;
      }

      // Register the extension
      this.extensions.set(extension.id, extension);

      // Register extension points
      for (const point of extension.extensionPoints) {
        if (!this.extensionPoints.has(point.name)) {
          this.extensionPoints.set(point.name, []);
        }
        this.extensionPoints.get(point.name)!.push(point);
      }

      console.log(`Extension registered: ${extension.id}`);
      return true;
    } catch (error) {
      console.error(`Failed to register extension ${extension.id}:`, error);
      return false;
    }
  }

  async executeExtensionPoint(name: string, data: any): Promise<any[]> {
    const points = this.extensionPoints.get(name) || [];
    const results: any[] = [];

    for (const point of points) {
      try {
        const result = await point.execute(data);
        results.push(result);
      } catch (error) {
        console.error(`Extension point ${name} failed:`, error);
        // Continue with other extension points
      }
    }

    return results;
  }

  getExtension(id: string): Extension | undefined {
    return this.extensions.get(id);
  }

  getExtensionPoints(name: string): ExtensionPoint[] {
    return this.extensionPoints.get(name) || [];
  }

  listExtensions(): Extension[] {
    return Array.from(this.extensions.values());
  }

  listExtensionPoints(): string[] {
    return Array.from(this.extensionPoints.keys());
  }
}

