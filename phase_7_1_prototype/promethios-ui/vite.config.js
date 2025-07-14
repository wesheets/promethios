// Bundle optimization configuration
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['*', '5173-irvp18jlopbh17iy0n4g8-ffd3d388.manusvm.computer', '5173-iodgdwzdg7fidmqwueiz8-e58de46c.manusvm.computer', '5173-iwjuy1m7kphmidu41hlw3-73b17971.manusvm.computer']
  },
  define: {
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(process.env.VITE_FIREBASE_APP_ID),
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@mui/system']
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable minification with comprehensive constructor preservation
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.log for debugging
        drop_debugger: true,
        // Prevent function inlining that can break constructor patterns
        inline: false,
        // Preserve function names
        keep_fnames: true,
        // Preserve class names
        keep_classnames: true
      },
      mangle: {
        // Preserve ALL class names and constructor names
        keep_classnames: true,
        keep_fnames: true,
        // Comprehensive list of reserved names - EXPANDED to prevent Ge constructor error
        reserved: [
          // Storage Services
          'UnifiedStorageService', 
          'EnhancedDeploymentService', 
          'DeploymentService', 
          'StorageService',
          'FirebaseStorageProvider',
          'UserAgentStorageService',
          
          // CRITICAL: Deployment Integration Services (likely source of Ge error)
          'DeploymentIntegrationService',
          'DeploymentIntegration',
          'IntegrationService',
          
          // Extensions
          'MetricsCollectionExtension',
          'MonitoringExtension', 
          'DeploymentExtension',
          
          // Backend Services
          'AuditBackendService',
          'NotificationBackendService',
          'ObserverBackendService',
          'AgentBackendService',
          
          // Core Services
          'AuditService',
          'ExecutionService',
          'LLMService',
          'SessionManager',
          
          // API Services - CRITICAL: Add DeployedAgentAPI to prevent Ge constructor error
          'DeployedAgentAPI',
          'AgentAPIKey',
          'EnhancedDeploymentPackage',
          'RealDeploymentResult',
          'DualAgentWrapper',
          'MultiAgentDualWrapper',
          
          // Policy and Governance
          'PrometheiosPolicyAPI',
          'GovernanceAPI',
          'PolicyService',
          
          // Firebase and External Services
          'Firestore',
          'Auth',
          'Database',
          'FirebaseApp',
          
          // Common constructors that might be minified
          'constructor',
          'prototype',
          'Function',
          'Object',
          'Array',
          'Promise',
          'Error',
          'Component',
          'PureComponent',
          'ErrorBoundary'
        ]
      },
      // Preserve function names in output
      keep_fnames: true,
      keep_classnames: true
    },
    // Additional build options to prevent constructor issues
    target: 'es2020',
    sourcemap: true // Enable source maps for better debugging
  }
});


