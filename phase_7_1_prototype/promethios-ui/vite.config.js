// NUCLEAR OPTION: Complete minification disable to fix constructor issues
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
    allowedHosts: ['*', '5173-irvp18jlopbh17iy0n4g8-ffd3d388.manusvm.computer', '5173-iodgdwzdg7fidmqwueiz8-e58de46c.manusvm.computer', '5173-iwjuy1m7kphmidu41hlw3-73b17971.manusvm.computer', '5173-ib2j0uguz57orodfwialy-d1a933a4.manusvm.computer', '5173-i1c6f2ewtnb2j8vhqg88w-2c5a68d5.manusvm.computer'],
    proxy: {
      '/api': {
        target: 'https://promethios-phase-7-1-api.onrender.com',
        changeOrigin: true,
        secure: true
      }
    }
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
    // NUCLEAR OPTION: Completely disable minification
    minify: false,
    
    // Keep source maps for debugging
    sourcemap: true,
    
    // Optimize bundle without minification
    rollupOptions: {
      output: {
        // Prevent code splitting for critical deployment files
        manualChunks: {
          'deployment-critical': [
            'src/modules/agent-wrapping/services/EnhancedDeploymentService.ts',
            'src/services/api/deployedAgentAPI.ts',
            'src/services/deploymentIntegrationService.ts'
          ],
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui': ['@mui/material', '@mui/icons-material', '@mui/system']
        }
      }
    },
    
    // Target modern browsers to reduce bundle size
    target: 'es2020',
    
    // Increase chunk size warning limit since we're not minifying
    chunkSizeWarningLimit: 2000
  }
});

