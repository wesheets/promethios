/**
 * Base Extension Class
 * 
 * Abstract base class for all Promethios extensions.
 * Provides common functionality and interface for extension management.
 */

export abstract class Extension {
  protected name: string;
  protected version: string;
  protected enabled: boolean;

  constructor(name: string, version: string = '1.0.0') {
    this.name = name;
    this.version = version;
    this.enabled = false;
  }

  /**
   * Initialize the extension
   */
  abstract initialize(): Promise<boolean>;

  /**
   * Enable the extension
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable the extension
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if extension is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get extension name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get extension version
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Cleanup resources when extension is destroyed
   */
  destroy(): void {
    this.enabled = false;
  }
}

