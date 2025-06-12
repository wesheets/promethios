/**
 * Host Configuration Update Script for Promethios UI
 * 
 * This utility script automatically updates the allowed hosts in vite.config.js
 * when the development server port changes or a new domain is used.
 * 
 * Usage: node host-configuration-script.js "your-new-host.manusvm.computer"
 */

const fs = require('fs');
const path = require('path');

// Get the config file path
const configPath = path.resolve(__dirname, '../vite.config.js');
const newHost = process.argv[2];

if (!newHost) {
  console.error('Please provide a host to add');
  console.error('Usage: node host-configuration-script.js "your-new-host.manusvm.computer"');
  process.exit(1);
}

console.log(`Attempting to add ${newHost} to allowed hosts in ${configPath}...`);

try {
  // Read the current config file
  let config = fs.readFileSync(configPath, 'utf8');
  
  // Simple regex to find the allowedHosts array
  const allowedHostsRegex = /(allowedHosts:\s*\[)(.*?)(\])/;
  const match = config.match(allowedHostsRegex);
  
  if (match) {
    const currentHosts = match[2];
    
    // Check if the host is already in the list
    if (currentHosts.includes(newHost)) {
      console.log(`Host "${newHost}" is already in the allowed hosts list.`);
      process.exit(0);
    }
    
    // Add the new host to the list
    const updatedHosts = `${currentHosts}${currentHosts.trim() ? ', ' : ''}"${newHost}"`;
    
    // Replace the old hosts list with the updated one
    config = config.replace(allowedHostsRegex, `$1${updatedHosts}$3`);
    
    // Write the updated config back to the file
    fs.writeFileSync(configPath, config);
    console.log(`Successfully added "${newHost}" to allowed hosts!`);
    
    console.log('\nRemember to restart the development server for changes to take effect:');
    console.log('npm run dev');
  } else {
    console.error('Could not find allowedHosts in config file. Please check the format of vite.config.js');
    process.exit(1);
  }
} catch (error) {
  console.error('Error updating config file:', error.message);
  process.exit(1);
}
