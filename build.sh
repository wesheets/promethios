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

# Skip the full build process and directly serve from public directory
echo "Skipping full build process to serve CMU playground directly from public directory"

# Create a minimal dist directory without redirection
mkdir -p dist
echo "<html><head><title>Promethios Platform</title></head><body><h1>Promethios Platform</h1><p>Welcome to the Promethios Platform. <a href='/cmu-playground/'>Visit the CMU Playground Demo</a></p></body></html>" > dist/index.html

# Verify the dist directory
echo "Checking dist directory:"
ls -la dist

# Done
echo "Build script completed"
