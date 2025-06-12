/**
 * Automatic Vite Allowed Hosts Updater
 * 
 * This script automatically updates the allowedHosts array in vite.config.js
 * to include the current host and predict potential future hosts,
 * preventing the need for manual updates when the development server port changes.
 * 
 * Usage:
 * - Run directly: node scripts/update-allowed-hosts.cjs
 * - Or use with npm script: npm run update-hosts
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
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
    console.log('No running Vite server detected, using port prediction');
  }
  
  return null; // Return null if no port detected
}

// Function to predict potential ports
function predictPorts() {
  // Standard Vite ports and potential increments
  const basePorts = [5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180];
  return basePorts;
}

// Function to get the sandbox domain
function getSandboxDomain() {
  try {
    // Try to get the sandbox domain from environment or hostname
    const hostname = os.hostname();
    if (hostname.includes('sandbox')) {
      return hostname;
    }
    
    // Try to get from environment variables if available
    if (process.env.SANDBOX_DOMAIN) {
      return process.env.SANDBOX_DOMAIN;
    }
  } catch (error) {
    console.log('Could not determine sandbox domain');
  }
  
  return 'manusvm.computer'; // Default domain suffix
}

// Generate potential host patterns
function generateHostPatterns() {
  const currentPort = getCurrentPort();
  const predictedPorts = predictPorts();
  const sandboxDomain = getSandboxDomain();
  
  // Start with wildcard patterns that will match any port
  const patterns = [
    `*-*-*.manusvm.computer`,
    `*-*-*.${sandboxDomain}`,
    `localhost`
  ];
  
  // Add specific port patterns if a current port is detected
  if (currentPort) {
    patterns.push(`${currentPort}-*-*.manusvm.computer`);
    patterns.push(`${currentPort}-*-*.${sandboxDomain}`);
    patterns.push(`*-${currentPort}-*.manusvm.computer`);
    patterns.push(`*-${currentPort}-*.${sandboxDomain}`);
  }
  
  // Add predicted port patterns
  predictedPorts.forEach(port => {
    patterns.push(`${port}-*-*.manusvm.computer`);
    patterns.push(`${port}-*-*.${sandboxDomain}`);
    patterns.push(`*-${port}-*.manusvm.computer`);
    patterns.push(`*-${port}-*.${sandboxDomain}`);
  });
  
  // Remove duplicates
  return [...new Set(patterns)];
}

// Update the vite.config.js file
function updateViteConfig() {
  try {
    console.log('Reading vite.config.js...');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Generate host patterns to include
    const hostPatterns = generateHostPatterns();
    
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
      
      // Add new host patterns if they don't exist
      let hostsAdded = false;
      hostPatterns.forEach(pattern => {
        if (!currentHostsArray.some(host => 
            host === pattern || 
            host === `"${pattern}"` || 
            host === `'${pattern}'`)) {
          currentHostsArray.push(pattern);
          hostsAdded = true;
        }
      });
      
      if (hostsAdded) {
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
        console.log('Added patterns:', hostPatterns);
      } else {
        console.log('✅ All necessary host patterns are already in vite.config.js');
      }
    } else {
      console.error('❌ Could not find allowedHosts in vite.config.js');
      console.log('Please ensure your vite.config.js has a server.allowedHosts array');
    }
  } catch (error) {
    console.error('❌ Error updating vite.config.js:', error.message);
  }
}

// Run the update
updateViteConfig();
