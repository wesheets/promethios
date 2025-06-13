// Bundle optimization configuration
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@mui/system'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Separate our large modules
          chat: [
            './src/modules/chat/components/ChatContainer',
            './src/modules/chat/components/MessageList',
            './src/modules/chat/components/MessageInput',
            './src/modules/chat/components/EnhancedMessageInput'
          ],
          agentWrapping: [
            './src/modules/agent-wrapping/components/MultiAgentWrappingWizard',
            './src/modules/agent-wrapping/services/AgentWrapperRegistry'
          ]
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  },
  // Ensure environment variables are available
  define: {
    'process.env': process.env
  }
});

