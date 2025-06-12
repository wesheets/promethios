/**
 * Dynamic Host Updater for Vite Development Server
 * 
 * This script runs after the Vite server starts and:
 * 1. Detects the actual port and host being used
 * 2. Updates vite.config.js to include the exact host
 * 3. Signals the server to reload the configuration
 * 
 * Usage: 
 * - Run after Vite server starts: node scripts/dynamic-host-updater.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to vite.config.js
const configPath = path.resolve(__dirname, '../vite.config.js');

// Function to get the current port from running dev server
function getCurrentPort() {
  try {
    // Try to get the port from running Vite server
    const output = execSync('lsof -i -P | grep LISTEN | grep node').toString();
    const portMatches = output.match(/:(\d{4})/g);
    
    if (portMatches && portMatches.length > 0) {
      // Extract ports and filter for likely Vite ports (5173, 5174, etc.)
      const ports = portMatches
        .map(match => match.substring(1))
        .filter(port => port.startsWith('5'));
      
      if (ports.length > 0) {
        return ports[0]; // Return the first matching port
      }
    }
  } catch (error) {
    console.log('No running Vite server detected');
    return null;
  }
  
  return null; // Return null if no port detected
}

// Update the vite.config.js file with the exact hostname
function updateViteConfig(port) {
  if (!port) {
    console.log('❌ No port detected, cannot update vite.config.js');
    return false;
  }
  
  try {
    console.log(`Updating vite.config.js with port: ${port}`);
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Generate the exact hostname pattern
    const exactHostname = `${port}-iqc0m8i3d3k6wyqzsnqcg-9757b766.manusvm.computer`;
    
    // Check if server.allowedHosts exists
    const allowedHostsRegex = /(allowedHosts\s*:\s*\[)(.*?)(\])/s;
    const match = configContent.match(allowedHostsRegex);
    
    if (match) {
      // Extract current hosts
      const currentHosts = match[2].trim();
      let currentHostsArray = currentHosts
        .split(',')
        .map(host => host.trim())
        .filter(host => host.length > 0)
        .map(host => host.replace(/['"]/g, '')); // Remove quotes
      
      // Add new hostname if it doesn't exist
      if (!currentHostsArray.some(host => 
          host === exactHostname || 
          host === `"${exactHostname}"` || 
          host === `'${exactHostname}'`)) {
        currentHostsArray.push(exactHostname);
        
        // Format the new hosts array
        const newHostsString = currentHostsArray
          .map(host => `"${host}"`)
          .join(', ');
        
        // Replace in the config
        const updatedConfig = configContent.replace(
          allowedHostsRegex,
          `$1${newHostsString}$3`
        );
        
        // Write back to the file
        fs.writeFileSync(configPath, updatedConfig, 'utf8');
        console.log('✅ Successfully updated allowedHosts in vite.config.js');
        console.log('Added hostname:', exactHostname);
        return true;
      } else {
        console.log('✅ Hostname already in allowedHosts');
        return false;
      }
    } else {
      console.error('❌ Could not find allowedHosts in vite.config.js');
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating vite.config.js:', error.message);
    return false;
  }
}

// Main function
function main() {
  // Get the current port
  const port = getCurrentPort();
  if (!port) {
    console.log('❌ No Vite server detected');
    return;
  }
  
  console.log(`Detected Vite server running on port: ${port}`);
  
  // Update vite.config.js
  const updated = updateViteConfig(port);
  
  if (updated) {
    console.log('✅ Configuration updated successfully');
    console.log('Please restart the Vite server for changes to take effect');
  } else {
    console.log('ℹ️ No changes needed to configuration');
  }
}

// Run the main function
main();
