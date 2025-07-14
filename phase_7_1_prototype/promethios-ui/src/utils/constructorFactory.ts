/**
 * Constructor Factory Pattern
 * Provides minification-safe constructor resolution
 */

// Constructor registry to avoid minification issues
const CONSTRUCTOR_REGISTRY = new Map<string, any>();

/**
 * Register a constructor with a string key
 */
export function registerConstructor(key: string, constructor: any): void {
  CONSTRUCTOR_REGISTRY.set(key, constructor);
  console.log(`🔧 Registered constructor: ${key}`);
}

/**
 * Create instance using string-based constructor resolution
 */
export function createInstance<T>(key: string, ...args: any[]): T | null {
  try {
    const Constructor = CONSTRUCTOR_REGISTRY.get(key);
    if (!Constructor) {
      console.error(`❌ Constructor not found: ${key}`);
      return null;
    }
    
    console.log(`✅ Creating instance of: ${key}`);
    return new Constructor(...args);
  } catch (error) {
    console.error(`❌ Failed to create instance of ${key}:`, error);
    return null;
  }
}

/**
 * Safe constructor wrapper that handles minification
 */
export function safeConstructor<T>(
  Constructor: new (...args: any[]) => T,
  fallbackKey?: string,
  ...args: any[]
): T | null {
  try {
    // Try direct constructor first
    return new Constructor(...args);
  } catch (error) {
    console.warn(`⚠️ Direct constructor failed, trying fallback:`, error);
    
    if (fallbackKey) {
      return createInstance<T>(fallbackKey, ...args);
    }
    
    console.error(`❌ No fallback available for constructor`);
    return null;
  }
}

/**
 * Initialize constructor registry with deployment-critical constructors
 */
export function initializeConstructorRegistry(): void {
  console.log('🔧 Initializing constructor registry...');
  
  // Import and register constructors dynamically to avoid minification
  import('../services/api/deployedAgentAPI').then(module => {
    if (module.DeployedAgentAPI) {
      registerConstructor('DeployedAgentAPI', module.DeployedAgentAPI);
    }
  }).catch(console.error);
  
  import('../services/deploymentIntegrationService').then(module => {
    if (module.DeploymentIntegrationService) {
      registerConstructor('DeploymentIntegrationService', module.DeploymentIntegrationService);
    }
  }).catch(console.error);
  
  import('../modules/agent-wrapping/services/EnhancedDeploymentService').then(module => {
    if (module.EnhancedDeploymentService) {
      registerConstructor('EnhancedDeploymentService', module.EnhancedDeploymentService);
    }
  }).catch(console.error);
  
  import('../services/UnifiedStorageService').then(module => {
    if (module.UnifiedStorageService) {
      registerConstructor('UnifiedStorageService', module.UnifiedStorageService);
    }
  }).catch(console.error);
  
  console.log('✅ Constructor registry initialized');
}

