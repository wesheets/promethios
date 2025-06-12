# Promethios UI Integration Guide

## Overview

This document outlines best practices and a streamlined process for integrating new UI pages into the Promethios application. It addresses common issues encountered during development and provides solutions to prevent them in future work.

## Common Issues and Root Causes

### 1. Vite Development Server Host Configuration

**Issue**: When the development server runs on a new port (which happens frequently in sandbox environments), the application shows a "Blocked request" error because the new host is not allowed in the Vite configuration.

**Root Cause**: Vite's security feature requires explicit allowance of hosts in `vite.config.js`. When a port changes or a new domain is used, this configuration needs to be updated.

**Impact**: Developers cannot access the application through the browser until this is fixed, blocking all UI testing and development.

### 2. UI Component Rendering Issues

**Issue**: Stub pages (like Agent Wrapping and Multi-Agent Wrapping) were not displaying their content correctly, instead showing the landing page content.

**Root Cause**: The `MainLayoutProxy.tsx` component was designed to wrap child components with navigation and layout, but it contained hardcoded dashboard content that overrode the children props being passed to it.

**Impact**: New pages added to the application would not display their intended content, making feature development difficult.

### 3. Proxy Configuration for API Requests

**Issue**: API requests failed with 502 Bad Gateway errors after exposing the frontend to an external URL.

**Root Cause**: The proxy configuration in `vite.config.js` was pointing to `localhost:3000` for API requests, but in exposed environments, the backend has its own unique external URL.

**Impact**: Authentication and data fetching failed, preventing proper testing of the application.

## Streamlined Integration Process

To avoid these issues in the future, follow this streamlined process when integrating new UI pages:

### 1. Page Structure and Component Organization

1. **Create Stub Implementation**: Place actual UI component code in the appropriate module directory:
   ```
   src/modules/[feature-name]/ui-stubs/[ComponentName].tsx
   ```

2. **Create Page Wrapper**: Create a wrapper component in the pages directory that imports the stub:
   ```
   src/pages/[ComponentName]Page.tsx
   ```
   
   Example:
   ```tsx
   import React from 'react';
   import ComponentName from '../modules/feature-name/ui-stubs/ComponentName';
   
   const ComponentNamePage: React.FC = () => {
     return <ComponentName />;
   };
   
   export default ComponentNamePage;
   ```

3. **Add Route**: Add the new route in `UIIntegration.tsx`:
   ```tsx
   <Route path="path/to/feature" element={
     <ProtectedRoute requireOnboarding={false}>
       <MainLayoutProxy>
         <ComponentNamePage />
       </MainLayoutProxy>
     </ProtectedRoute>
   } />
   ```

4. **Add Navigation Link**: Update the appropriate navigation component to include a link to your new page.

### 2. Development Environment Configuration

1. **Dynamic Host Configuration**: Before starting development, update the `vite.config.js` file to include the current host:

   ```js
   // Get the current host from environment or use a default
   const currentHost = process.env.CURRENT_HOST || "localhost";
   
   export default defineConfig({
     // ...other config
     server: {
       allowedHosts: [currentHost, "localhost"],
       // ...other server config
     },
   });
   ```

2. **API Proxy Configuration**: Ensure the API proxy points to the correct backend URL:

   ```js
   proxy: {
     '/api': {
       target: process.env.API_URL || 'http://localhost:3000',
       changeOrigin: true,
       secure: false,
       rewrite: (path) => path
     }
   }
   ```

3. **Host Update Script**: Create a utility script to automatically update the allowed hosts when the port changes:

   ```js
   // scripts/update-hosts.js
   const fs = require('fs');
   const path = require('path');
   
   const configPath = path.resolve(__dirname, '../vite.config.js');
   const newHost = process.argv[2];
   
   if (!newHost) {
     console.error('Please provide a host to add');
     process.exit(1);
   }
   
   let config = fs.readFileSync(configPath, 'utf8');
   
   // Simple regex replacement to add the new host
   const allowedHostsRegex = /(allowedHosts:\s*\[)(.*?)(\])/;
   const match = config.match(allowedHostsRegex);
   
   if (match) {
     const currentHosts = match[2];
     const updatedHosts = currentHosts.includes(newHost) 
       ? currentHosts 
       : `${currentHosts}${currentHosts.trim() ? ', ' : ''}"${newHost}"`;
     
     config = config.replace(allowedHostsRegex, `$1${updatedHosts}$3`);
     fs.writeFileSync(configPath, config);
     console.log(`Added ${newHost} to allowed hosts`);
   } else {
     console.error('Could not find allowedHosts in config');
     process.exit(1);
   }
   ```

   Usage: `node scripts/update-hosts.js "5174-iqc0m8i3d3k6wyqzsnqcg-9757b766.manusvm.computer"`

### 3. Component Design Best Practices

1. **Layout Proxy Pattern**: Ensure that layout components like `MainLayoutProxy.tsx` only provide layout structure and never include hardcoded page-specific content:

   ```tsx
   // Good example
   const MainLayoutProxy: React.FC<MainLayoutProxyProps> = ({ children }) => {
     // ... layout setup code
     
     return (
       <Box sx={{ display: 'flex' }}>
         <HeaderNavigation />
         <SideNavigation />
         <Box component="main" sx={{ /* styles */ }}>
           {children} {/* Always render children without overriding */}
         </Box>
       </Box>
     );
   };
   ```

2. **Component Isolation**: Keep components focused on a single responsibility and avoid dependencies that aren't necessary.

3. **Consistent Styling**: Use theme variables and consistent styling approaches across components.

### 4. Testing Process

1. **Local Testing**: Before pushing changes:
   - Verify that the page renders correctly with its stub content
   - Test navigation to and from the page
   - Verify that the layout is consistent with other pages

2. **Host Configuration Testing**: Test the application with the exposed URL to ensure host configuration is correct.

3. **API Integration Testing**: Verify that API calls work correctly through the proxy.

## Conclusion

By following this streamlined process, you can avoid the common pitfalls encountered during UI integration and ensure a smoother development experience. Remember to always update the allowed hosts when working in environments with dynamic port assignments, and ensure that layout components properly render their children without overriding them with hardcoded content.
