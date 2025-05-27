/**
 * Deployment Configuration for Promethios
 * 
 * This file contains the configuration settings for deploying
 * Promethios to the production environment.
 */

module.exports = {
  // Environment settings
  environment: 'production',
  
  // Server configuration
  server: {
    host: '0.0.0.0',
    port: 3000,
    ssl: true,
    cors: {
      enabled: true,
      origins: ['https://promethios.ai', 'https://api.promethios.ai']
    }
  },
  
  // Database configuration
  database: {
    type: 'mongodb',
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/promethios',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // Logging configuration
  logging: {
    level: 'info',
    format: 'json',
    transports: ['console', 'file'],
    fileOptions: {
      filename: '/var/log/promethios/app.log',
      maxSize: '10m',
      maxFiles: 10
    }
  },
  
  // Module configurations
  modules: {
    // Agent Scorecard configuration
    agentScorecard: {
      enabled: true,
      cryptographicVerification: true,
      storageRetentionDays: 365,
      apiEndpoints: {
        enabled: true,
        rateLimit: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 100 // limit each IP to 100 requests per windowMs
        }
      },
      trustLineage: {
        enabled: true,
        maxDelegationDepth: 5
      }
    },
    
    // Observer configurations
    observers: {
      prism: {
        enabled: true,
        eventBufferSize: 1000,
        samplingRate: 1.0 // 100% sampling
      },
      vigil: {
        enabled: true,
        violationThreshold: 'minor',
        alertingEnabled: true
      }
    },
    
    // Tool Selection History configuration
    toolSelectionHistory: {
      enabled: true,
      storageRetentionDays: 90,
      patternAnalysis: {
        enabled: true,
        minSampleSize: 50
      }
    },
    
    // Governance Identity configuration
    governanceIdentity: {
      enabled: true,
      verificationRequired: true,
      constitutionalHooksEnabled: true
    },
    
    // Adaptive Learning Loop configuration
    adaptiveLearningLoop: {
      enabled: true,
      feedbackCollection: {
        enabled: true,
        sources: ['user', 'system', 'observer']
      },
      learningRate: 0.01
    },
    
    // Multi-Agent Coordination configuration
    multiAgentCoordination: {
      enabled: true,
      messageBus: {
        type: 'redis',
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      },
      governanceExchange: {
        enabled: true,
        verificationRequired: true
      }
    }
  },
  
  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'development-secret-do-not-use-in-production',
    jwtExpiresIn: '1d',
    bcryptRounds: 10,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'", 'https://api.promethios.ai'],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      }
    }
  },
  
  // UI configuration
  ui: {
    enabled: true,
    path: '/ui',
    assets: {
      path: '/app/public'
    }
  }
};
