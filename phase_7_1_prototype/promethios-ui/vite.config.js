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
    allowedHosts: ['5173-i3hh9acw5iolquiqr0tqc-6eda6f4e.manusvm.computer', 'localhost'],
  },
  build: {
    // Ensure environment variables are available in build
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        'cmu-playground': path.resolve(__dirname, 'public/cmu-playground/index.html')
      }
    }
  },
  // Make sure VITE_ prefixed environment variables are available
  define: {
    'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(process.env.VITE_OPENAI_API_KEY),
    'import.meta.env.VITE_ANTHROPIC_API_KEY': JSON.stringify(process.env.VITE_ANTHROPIC_API_KEY),
    'import.meta.env.VITE_COHERE_API_KEY': JSON.stringify(process.env.VITE_COHERE_API_KEY),
    'import.meta.env.VITE_HUGGINGFACE_API_KEY': JSON.stringify(process.env.VITE_HUGGINGFACE_API_KEY),
  }
})
