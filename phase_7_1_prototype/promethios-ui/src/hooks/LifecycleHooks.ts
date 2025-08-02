/**
 * Lifecycle Hooks System
 * 
 * Provides standardized hooks for triggering lifecycle events from existing services.
 * This system allows easy integration of lifecycle tracking without breaking existing functionality.
 */

import { lifecycleIntegrationExtension, LifecycleEventResult } from '../extensions/LifecycleIntegrationExtension';
import { AgentProfile } from '../services/UserAgentStorageService';

export interface LifecycleHookConfig {
  enabled: boolean;
  logEvents: boolean;
  failSilently: boolean;
  retryOnFailure: boolean;
}

/**
 * Default configuration for lifecycle hooks
 */
const DEFAULT_CONFIG: LifecycleHookConfig = {
  enabled: true,
  logEvents: true,
  failSilently: true, // Don't break existing workflows if lifecycle fails
  retryOnFailure: true
};

/**
 * Global lifecycle hooks configuration
 */
let globalConfig: LifecycleHookConfig = { ...DEFAULT_CONFIG };

/**
 * Configure global lifecycle hooks behavior
 */
export function configureLifecycleHooks(config: Partial<LifecycleHookConfig>): void {
  globalConfig = { ...globalConfig, ...config };
  console.log('🔧 Lifecycle hooks configured:', globalConfig);
}

/**
 * Get current lifecycle hooks configuration
 */
export function getLifecycleHooksConfig(): LifecycleHookConfig {
  return { ...globalConfig };
}

/**
 * Hook for agent creation events
 * Call this after successfully creating an agent
 */
export async function useAgentCreatedHook(
  agent: AgentProfile,
  config: Partial<LifecycleHookConfig> = {}
): Promise<LifecycleEventResult> {
  const hookConfig = { ...globalConfig, ...config };
  
  if (!hookConfig.enabled) {
    return { success: true }; // Silently skip if disabled
  }

  try {
    if (hookConfig.logEvents) {
      console.log(`🪝 Lifecycle Hook: Agent Created - ${agent.identity.name}`);
    }

    const result = await lifecycleIntegrationExtension.triggerAgentCreated(agent, {
      logFailures: hookConfig.logEvents,
      throwOnError: !hookConfig.failSilently,
      retryOnFailure: hookConfig.retryOnFailure
    });

    if (hookConfig.logEvents && result.success) {
      console.log(`✅ Lifecycle Hook Success: Agent Created - ${agent.identity.name}`);
    }

    return result;

  } catch (error) {
    if (hookConfig.logEvents) {
      console.warn(`⚠️ Lifecycle Hook Failed: Agent Created - ${agent.identity.name}:`, error);
    }

    if (hookConfig.failSilently) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    } else {
      throw error;
    }
  }
}

/**
 * Hook for agent wrapping events
 * Call this after successfully wrapping an agent (test → production)
 */
export async function useAgentWrappedHook(
  testAgentId: string,
  productionAgentId: string,
  userId: string,
  config: Partial<LifecycleHookConfig> = {}
): Promise<LifecycleEventResult> {
  const hookConfig = { ...globalConfig, ...config };
  
  if (!hookConfig.enabled) {
    return { success: true }; // Silently skip if disabled
  }

  try {
    if (hookConfig.logEvents) {
      console.log(`🪝 Lifecycle Hook: Agent Wrapped - ${testAgentId} → ${productionAgentId}`);
    }

    const result = await lifecycleIntegrationExtension.triggerAgentWrapped(
      testAgentId, 
      productionAgentId, 
      userId, 
      {
        logFailures: hookConfig.logEvents,
        throwOnError: !hookConfig.failSilently,
        retryOnFailure: hookConfig.retryOnFailure
      }
    );

    if (hookConfig.logEvents && result.success) {
      console.log(`✅ Lifecycle Hook Success: Agent Wrapped - ${testAgentId} → ${productionAgentId}`);
    }

    return result;

  } catch (error) {
    if (hookConfig.logEvents) {
      console.warn(`⚠️ Lifecycle Hook Failed: Agent Wrapped - ${testAgentId} → ${productionAgentId}:`, error);
    }

    if (hookConfig.failSilently) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    } else {
      throw error;
    }
  }
}

/**
 * Hook for agent deployment events
 * Call this after successfully deploying an agent
 */
export async function useAgentDeployedHook(
  agentId: string,
  deploymentId: string,
  deploymentUrl: string,
  userId: string,
  environment: string = 'production',
  config: Partial<LifecycleHookConfig> = {}
): Promise<LifecycleEventResult> {
  const hookConfig = { ...globalConfig, ...config };
  
  if (!hookConfig.enabled) {
    return { success: true }; // Silently skip if disabled
  }

  try {
    if (hookConfig.logEvents) {
      console.log(`🪝 Lifecycle Hook: Agent Deployed - ${agentId} to ${deploymentUrl}`);
    }

    const result = await lifecycleIntegrationExtension.triggerAgentDeployed(
      agentId, 
      deploymentId, 
      deploymentUrl, 
      userId, 
      environment,
      {
        logFailures: hookConfig.logEvents,
        throwOnError: !hookConfig.failSilently,
        retryOnFailure: hookConfig.retryOnFailure
      }
    );

    if (hookConfig.logEvents && result.success) {
      console.log(`✅ Lifecycle Hook Success: Agent Deployed - ${agentId} to ${deploymentUrl}`);
    }

    return result;

  } catch (error) {
    if (hookConfig.logEvents) {
      console.warn(`⚠️ Lifecycle Hook Failed: Agent Deployed - ${agentId} to ${deploymentUrl}:`, error);
    }

    if (hookConfig.failSilently) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    } else {
      throw error;
    }
  }
}

/**
 * Initialize lifecycle hooks system
 * Call this during application startup
 */
export async function initializeLifecycleHooks(): Promise<boolean> {
  try {
    console.log('🔄 Initializing lifecycle hooks system...');
    
    // Initialize the lifecycle integration extension
    const initialized = await lifecycleIntegrationExtension.initialize();
    
    if (initialized) {
      console.log('✅ Lifecycle hooks system initialized successfully');
      return true;
    } else {
      console.warn('⚠️ Lifecycle hooks system initialization failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize lifecycle hooks system:', error);
    return false;
  }
}

/**
 * Utility function to safely execute lifecycle hooks
 * Wraps hook execution with error handling and logging
 */
export async function safeExecuteLifecycleHook<T extends any[]>(
  hookName: string,
  hookFunction: (...args: T) => Promise<LifecycleEventResult>,
  ...args: T
): Promise<LifecycleEventResult> {
  try {
    const startTime = Date.now();
    const result = await hookFunction(...args);
    const duration = Date.now() - startTime;
    
    if (globalConfig.logEvents) {
      console.log(`📊 Lifecycle Hook Performance: ${hookName} completed in ${duration}ms`);
    }
    
    return result;
    
  } catch (error) {
    if (globalConfig.logEvents) {
      console.error(`❌ Lifecycle Hook Error: ${hookName}:`, error);
    }
    
    return { 
      success: false, 
      error: `Hook execution failed: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Batch execute multiple lifecycle hooks
 * Useful for scenarios where multiple lifecycle events need to be triggered
 */
export async function batchExecuteLifecycleHooks(
  hooks: Array<() => Promise<LifecycleEventResult>>
): Promise<LifecycleEventResult[]> {
  const results: LifecycleEventResult[] = [];
  
  for (const hook of hooks) {
    try {
      const result = await hook();
      results.push(result);
    } catch (error) {
      results.push({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
  
  return results;
}

