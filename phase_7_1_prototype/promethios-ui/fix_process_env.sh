#!/bin/bash

# Find all TypeScript files with process.env and replace them
find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "process\.env" | while read file; do
  echo "Fixing $file..."
  
  # Replace common patterns
  sed -i 's/process\.env\.REACT_APP_/import.meta.env.VITE_/g' "$file"
  sed -i 's/process\.env\.NEXT_PUBLIC_/import.meta.env.VITE_/g' "$file"
  sed -i 's/process\.env\.NODE_ENV/import.meta.env.MODE/g' "$file"
  sed -i 's/process\.env\.OPENAI_API_KEY/import.meta.env.VITE_OPENAI_API_KEY/g' "$file"
  
  # Handle any remaining process.env references
  sed -i 's/process\.env\./import.meta.env.VITE_/g' "$file"
done

echo "All process.env references have been updated!"
