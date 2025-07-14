/**
 * Environment Configuration System
 * Provides environment-aware configuration management for the Promethios deployment system
 */

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  environment: Environment;
  api: {
    baseUrl: string;
    deploymentApiUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  features: {
    enableRealTimeUpdates: boolean;
    enableAdvancedMonitoring: boolean;
    enableBetaFeatures: boolean;
    enableDebugMode: boolean;
  };
  deployment: {
    maxConcurrentDeployments: number;
    defaultTimeout: number;
    enableAutoRetry: boolean;
    enableRollback: boolean;
  };
  monitoring: {
    enableMetrics: boolean;
    enableErrorTracking: boolean;
    enablePerformanceMonitoring: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  security: {
    enableApiKeyRotation: boolean;
    sessionTimeout: number;
    enableMFA: boolean;
    enableAuditLogging: boolean;
  };
}

/**
 * Get the current environment from various sources
 */
function getCurrentEnvironment(): Environment {
  // Check environment variable first
  const envVar = import.meta.env.VITE_ENVIRONMENT as Environment;
  if (envVar && ['development', 'staging', 'production'].includes(envVar)) {
    return envVar;
  }

  // Check hostname patterns
  const hostname = window.location.hostname;
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'development';
  }
  if (hostname.includes('staging') || hostname.includes('dev')) {
    return 'staging';
  }
  
  // Default to production for safety
  return 'production';
}

/**
 * Development environment configuration
 */
const developmentConfig: EnvironmentConfig = {
  environment: 'development',
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    deploymentApiUrl: import.meta.env.VITE_DEPLOYMENT_API_URL || 'https://promethios-deployment-api.onrender.com',
    timeout: 30000,
    retryAttempts: 3,
  },
  features: {
    enableRealTimeUpdates: true,
    enableAdvancedMonitoring: true,
    enableBetaFeatures: true,
    enableDebugMode: true,
  },
  deployment: {
    maxConcurrentDeployments: 5,
    defaultTimeout: 300000, // 5 minutes
    enableAutoRetry: true,
    enableRollback: true,
  },
  monitoring: {
    enableMetrics: true,
    enableErrorTracking: true,
    enablePerformanceMonitoring: true,
    logLevel: 'debug',
  },
  security: {
    enableApiKeyRotation: false,
    sessionTimeout: 3600000, // 1 hour
    enableMFA: false,
    enableAuditLogging: true,
  },
};

/**
 * Staging environment configuration
 */
const stagingConfig: EnvironmentConfig = {
  environment: 'staging',
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api-staging.promethios.ai',
    deploymentApiUrl: import.meta.env.VITE_DEPLOYMENT_API_URL || 'https://deployment-api-staging.promethios.ai',
    timeout: 45000,
    retryAttempts: 3,
  },
  features: {
    enableRealTimeUpdates: true,
    enableAdvancedMonitoring: true,
    enableBetaFeatures: true,
    enableDebugMode: false,
  },
  deployment: {
    maxConcurrentDeployments: 10,
    defaultTimeout: 600000, // 10 minutes
    enableAutoRetry: true,
    enableRollback: true,
  },
  monitoring: {
    enableMetrics: true,
    enableErrorTracking: true,
    enablePerformanceMonitoring: true,
    logLevel: 'info',
  },
  security: {
    enableApiKeyRotation: true,
    sessionTimeout: 1800000, // 30 minutes
    enableMFA: true,
    enableAuditLogging: true,
  },
};

/**
 * Production environment configuration
 */
const productionConfig: EnvironmentConfig = {
  environment: 'production',
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.promethios.ai',
    deploymentApiUrl: import.meta.env.VITE_DEPLOYMENT_API_URL || 'https://deployment-api.promethios.ai',
    timeout: 60000,
    retryAttempts: 5,
  },
  features: {
    enableRealTimeUpdates: true,
    enableAdvancedMonitoring: true,
    enableBetaFeatures: false,
    enableDebugMode: false,
  },
  deployment: {
    maxConcurrentDeployments: 50,
    defaultTimeout: 1800000, // 30 minutes
    enableAutoRetry: true,
    enableRollback: true,
  },
  monitoring: {
    enableMetrics: true,
    enableErrorTracking: true,
    enablePerformanceMonitoring: true,
    logLevel: 'warn',
  },
  security: {
    enableApiKeyRotation: true,
    sessionTimeout: 900000, // 15 minutes
    enableMFA: true,
    enableAuditLogging: true,
  },
};

/**
 * Get configuration for the current environment
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const environment = getCurrentEnvironment();
  
  switch (environment) {
    case 'development':
      return developmentConfig;
    case 'staging':
      return stagingConfig;
    case 'production':
      return productionConfig;
    default:
      console.warn(`Unknown environment: ${environment}, falling back to production config`);
      return productionConfig;
  }
}

/**
 * Get the current environment
 */
export function getEnvironment(): Environment {
  return getCurrentEnvironment();
}

/**
 * Check if a feature is enabled in the current environment
 */
export function isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
  const config = getEnvironmentConfig();
  return config.features[feature];
}

/**
 * Get API configuration for the current environment
 */
export function getApiConfig() {
  const config = getEnvironmentConfig();
  return config.api;
}

/**
 * Get deployment configuration for the current environment
 */
export function getDeploymentConfig() {
  const config = getEnvironmentConfig();
  return config.deployment;
}

/**
 * Get monitoring configuration for the current environment
 */
export function getMonitoringConfig() {
  const config = getEnvironmentConfig();
  return config.monitoring;
}

/**
 * Get security configuration for the current environment
 */
export function getSecurityConfig() {
  const config = getEnvironmentConfig();
  return config.security;
}

/**
 * Validate environment configuration
 */
export function validateEnvironmentConfig(): { isValid: boolean; errors: string[] } {
  const config = getEnvironmentConfig();
  const errors: string[] = [];

  // Validate API URLs
  if (!config.api.baseUrl) {
    errors.push('API base URL is not configured');
  }
  if (!config.api.deploymentApiUrl) {
    errors.push('Deployment API URL is not configured');
  }

  // Validate URL formats
  try {
    new URL(config.api.baseUrl);
  } catch {
    errors.push('Invalid API base URL format');
  }

  try {
    new URL(config.api.deploymentApiUrl);
  } catch {
    errors.push('Invalid deployment API URL format');
  }

  // Validate timeouts
  if (config.api.timeout <= 0) {
    errors.push('API timeout must be positive');
  }
  if (config.deployment.defaultTimeout <= 0) {
    errors.push('Deployment timeout must be positive');
  }

  // Validate retry attempts
  if (config.api.retryAttempts < 0) {
    errors.push('Retry attempts cannot be negative');
  }

  // Validate concurrent deployments
  if (config.deployment.maxConcurrentDeployments <= 0) {
    errors.push('Max concurrent deployments must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Log environment configuration (excluding sensitive data)
 */
export function logEnvironmentInfo(): void {
  const config = getEnvironmentConfig();
  const validation = validateEnvironmentConfig();

  console.group('🔧 Environment Configuration');
  console.log('Environment:', config.environment);
  console.log('API Base URL:', config.api.baseUrl);
  console.log('Deployment API URL:', config.api.deploymentApiUrl);
  console.log('Features:', config.features);
  console.log('Validation:', validation.isValid ? '✅ Valid' : '❌ Invalid');
  
  if (!validation.isValid) {
    console.error('Configuration Errors:', validation.errors);
  }
  
  console.groupEnd();
}

// Initialize and validate configuration on module load
const validation = validateEnvironmentConfig();
if (!validation.isValid) {
  console.error('❌ Environment configuration validation failed:', validation.errors);
}

// Export the current configuration as default
export default getEnvironmentConfig();

