# Build Configuration for CMU Playground

# Build the React app with environment variables
npm run build

# Copy CMU playground files to dist
cp -r public/cmu-playground dist/

# The built files will have environment variables injected via import.meta.env

