import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  base: '/', // Explicitly set the base URL
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ["5173-i12s5dk625k8npjm2uzax-6eb5f1c3.manusvm.computer", "5174-iqc0m8i3d3k6wyqzsnqcg-9757b766.manusvm.computer", "localhost"],
    proxy: {
      // Add proxy configuration for API requests
      '/api': {
        target: 'https://3000-i12s5dk625k8npjm2uzax-6eb5f1c3.manusvm.computer',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  build: {
    outDir: 'dist', // Explicitly set output directory to 'dist'
    // Bundle optimization
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          // Separate vendor libraries for better caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@mui/system'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage']
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable minification with optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      mangle: {
        safari10: true
      }
    },
    // Enable source maps for debugging (can be disabled for smaller builds)
    sourcemap: false
  },
  // Make sure VITE_ prefixed environment variables are available
  define: {
    'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(process.env.VITE_OPENAI_API_KEY),
    'import.meta.env.VITE_ANTHROPIC_API_KEY': JSON.stringify(process.env.VITE_ANTHROPIC_API_KEY),
    'import.meta.env.VITE_COHERE_API_KEY': JSON.stringify(process.env.VITE_COHERE_API_KEY),
    'import.meta.env.VITE_HUGGINGFACE_API_KEY': JSON.stringify(process.env.VITE_HUGGINGFACE_API_KEY),
  }
})

