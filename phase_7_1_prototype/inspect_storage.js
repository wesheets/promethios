// Script to inspect stored agent data
const fs = require('fs');
const path = require('path');

console.log('=== UNIFIED STORAGE INSPECTION ===\n');

// Check if there are any storage files in the project
const possibleStorageLocations = [
  './storage',
  './data',
  './localStorage',
  './agents',
  './.storage',
  './promethios-ui/storage',
  './promethios-ui/data'
];

console.log('1. CHECKING STORAGE LOCATIONS:');
possibleStorageLocations.forEach(location => {
  if (fs.existsSync(location)) {
    console.log(`   ✓ Found: ${location}`);
    try {
      const files = fs.readdirSync(location);
      console.log(`     Files: ${files.join(', ')}`);
    } catch (e) {
      console.log(`     Error reading: ${e.message}`);
    }
  } else {
    console.log(`   ✗ Not found: ${location}`);
  }
});

console.log('\n2. CHECKING FOR AGENT DATA FILES:');
const agentFilePatterns = [
  'agents.json',
  'localStorage.json',
  'storage.json',
  'user-agents.json'
];

function findFiles(dir, pattern) {
  const results = [];
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...findFiles(fullPath, pattern));
      } else if (file.includes(pattern.replace('.json', '')) || file === pattern) {
        results.push(fullPath);
      }
    });
  } catch (e) {
    // Ignore errors
  }
  return results;
}

agentFilePatterns.forEach(pattern => {
  const found = findFiles('.', pattern);
  if (found.length > 0) {
    console.log(`   ✓ Found ${pattern}: ${found.join(', ')}`);
    found.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        console.log(`     Preview: ${content.substring(0, 200)}...`);
      } catch (e) {
        console.log(`     Error reading: ${e.message}`);
      }
    });
  } else {
    console.log(`   ✗ Not found: ${pattern}`);
  }
});

console.log('\n3. CHECKING BROWSER STORAGE SIMULATION:');
console.log('   Note: Browser localStorage is not directly accessible from Node.js');
console.log('   The UnifiedStorageService uses browser localStorage at runtime');

console.log('\n4. EXPECTED AGENT DATA STRUCTURE:');
console.log('   Key format: {userId}.{agentId}');
console.log('   Example: HSf4SIwCcRRzAFPuFXlFE9CsQ6W2.agent-1750680776317');
console.log('   Data should include:');
console.log('     - identity: { id, name, description, ... }');
console.log('     - governancePolicy: { complianceFramework, securityLevel, ... }');
console.log('     - isWrapped: true');
console.log('     - isDeployed: true');

console.log('\n5. VERIFICATION NEEDED:');
console.log('   ✓ Check browser DevTools -> Application -> Local Storage');
console.log('   ✓ Look for keys starting with "agents."');
console.log('   ✓ Verify governance policy objects are complete');
console.log('   ✓ Confirm HIPAA strict policy has enableAuditLogging: true');
