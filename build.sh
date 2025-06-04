#!/bin/bash
# Custom build script for Promethios CMU Playground
# Print current directory for debugging
echo "Current directory: $(pwd)"

# Navigate to the correct directory
cd /opt/render/project/src/phase_7_1_prototype/promethios-ui
echo "Changed to directory: $(pwd)"
ls -la

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building project..."
npx vite build

# Verify build output
echo "Checking build output:"
ls -la dist || echo "dist directory not found!"

# Done
echo "Build script completed"
