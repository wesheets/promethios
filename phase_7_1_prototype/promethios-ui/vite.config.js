import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to dynamically add the current host to allowedHosts
const dynamicAllowedHostsPlugin = () => {
  return {
    name: 'dynamic-allowed-hosts',
    configureServer(server) {
      // Get the original listen method
      const originalListen = server.httpServer.listen.bind(server.httpServer);
      
      // Override the listen method to capture the port
      server.httpServer.listen = function(...args) {
        const port = typeof args[0] === 'number' ? args[0] : 
                    (typeof args[0] === 'object' && args[0].port ? args[0].port : null);
        
        if (port) {
          console.log(`Detected server starting on port: ${port}`);
          
          // Add the current host pattern to allowedHosts
          const currentHost = `${port}-iqc0m8i3d3k6wyqzsnqcg-9757b766.manusvm.computer`;
          if (!server.config.server.allowedHosts.includes(currentHost)) {
            console.log(`Adding ${currentHost} to allowedHosts`);
            server.config.server.allowedHosts.push(currentHost);
          }
        }
        
        // Call the original listen method
        return originalListen(...args);
      };
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    process.env.NODE_ENV !== 'production' && dynamicAllowedHostsPlugin()
  ].filter(Boolean),
  server: {
    allowedHosts: ["5173-i12s5dk625k8npjm2uzax-6eb5f1c3.manusvm.computer", "5174-iqc0m8i3d3k6wyqzsnqcg-9757b766.manusvm.computer", "5175-iqc0m8i3d3k6wyqzsnqcg-9757b766.manusvm.computer", "5176-iqc0m8i3d3k6wyqzsnqcg-9757b766.manusvm.computer", "5177-i1j3oekanixfi9rgj1xp4-9757b766.manusvm.computer", "localhost", "*-*-*.manusvm.computer", "*-5173-*.manusvm.computer", "5173-*-*.manusvm.computer", "*-5174-*.manusvm.computer", "5174-*-*.manusvm.computer", "*-5175-*.manusvm.computer", "5175-*-*.manusvm.computer", "*-5176-*.manusvm.computer", "5176-*-*.manusvm.computer", "*-5177-*.manusvm.computer", "5177-*-*.manusvm.computer", "*-5178-*.manusvm.computer", "5178-*-*.manusvm.computer", "*-5179-*.manusvm.computer", "5179-*-*.manusvm.computer", "*-5180-*.manusvm.computer", "5180-*-*.manusvm.computer"],
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
  build: {
    rollupOptions: {
        external: ["firebase/auth", "firebase/app", "firebase/firestore", "firebase/analytics", "react-markdown", "react-syntax-highlighter", "recharts", "@mui/material", "@mui/icons-material", "@mui/material/styles"],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})