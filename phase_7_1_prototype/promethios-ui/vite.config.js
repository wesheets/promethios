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
})
