import path from "path"
import react from "@vitejs/plugin-react"
// Using direct import without type checking for defineConfig
// @ts-ignore
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
