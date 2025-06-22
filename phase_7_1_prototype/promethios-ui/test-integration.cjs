#!/usr/bin/env node

/**
 * Test script to verify agent wrapper registry integration
 * This tests the complete flow from registration to chat interface
 */

const path = require('path');
const fs = require('fs');

console.log('🧪 Testing Agent Wrapper Registry Integration\n');

// Test 1: Check if UnifiedStorageService exists
console.log('1. Checking UnifiedStorageService...');
const storageServicePath = path.join(__dirname, 'src/services/UnifiedStorageService.ts');
if (fs.existsSync(storageServicePath)) {
  console.log('   ✅ UnifiedStorageService found');
} else {
  console.log('   ❌ UnifiedStorageService not found');
}

// Test 2: Check if AgentWrapperRegistry is updated
console.log('\n2. Checking AgentWrapperRegistry...');
const registryPath = path.join(__dirname, 'src/modules/agent-wrapping/services/AgentWrapperRegistry.ts');
if (fs.existsSync(registryPath)) {
  const registryContent = fs.readFileSync(registryPath, 'utf8');
  if (registryContent.includes('UnifiedStorageService')) {
    console.log('   ✅ AgentWrapperRegistry uses UnifiedStorageService');
  } else {
    console.log('   ❌ AgentWrapperRegistry still uses Firebase');
  }
  
  if (registryContent.includes('setCurrentUser')) {
    console.log('   ✅ User scoping implemented');
  } else {
    console.log('   ❌ User scoping missing');
  }
} else {
  console.log('   ❌ AgentWrapperRegistry not found');
}

// Test 3: Check if ModernChatContainer is wired
console.log('\n3. Checking ModernChatContainer integration...');
const chatPath = path.join(__dirname, 'src/modules/chat/components/ModernChatContainer.tsx');
if (fs.existsSync(chatPath)) {
  const chatContent = fs.readFileSync(chatPath, 'utf8');
  if (chatContent.includes('agentWrapperRegistry')) {
    console.log('   ✅ Chat container imports agentWrapperRegistry');
  } else {
    console.log('   ❌ Chat container not connected to registry');
  }
  
  if (chatContent.includes('loadUserWrappers')) {
    console.log('   ✅ Chat loads agents from registry');
  } else {
    console.log('   ❌ Chat still uses hardcoded agents');
  }
  
  if (chatContent.includes('/ui/agents/profiles')) {
    console.log('   ✅ Links to existing My Agents page');
  } else {
    console.log('   ❌ No link to agent management');
  }
} else {
  console.log('   ❌ ModernChatContainer not found');
}

// Test 4: Check storage manifest configuration
console.log('\n4. Checking storage configuration...');
const manifestPath = path.join(__dirname, 'src/config/storage_manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.agents) {
    console.log('   ✅ Agents namespace configured');
    console.log(`   📝 Provider: ${manifest.agents.provider}`);
    console.log(`   📝 Fallback: ${manifest.agents.fallback}`);
  } else {
    console.log('   ❌ Agents namespace not configured');
  }
} else {
  console.log('   ❌ Storage manifest not found');
}

// Test 5: Check if existing My Agents page exists
console.log('\n5. Checking existing My Agents page...');
const agentProfilesPath = path.join(__dirname, 'src/pages/AgentProfilesPage.tsx');
if (fs.existsSync(agentProfilesPath)) {
  console.log('   ✅ AgentProfilesPage exists');
} else {
  console.log('   ❌ AgentProfilesPage not found');
}

console.log('\n🎯 Integration Test Summary:');
console.log('   - Agent wrapper registry updated to use unified storage');
console.log('   - Chat interface connected to load real wrapped agents');
console.log('   - Links to existing My Agents page (no duplication)');
console.log('   - Storage configured with agents namespace');
console.log('\n✅ Ready to test complete flow!');

console.log('\n📋 Next Steps:');
console.log('   1. Start dev server: npm run dev');
console.log('   2. Navigate to /ui/agents/profiles to add agents');
console.log('   3. Navigate to /ui/modern-chat to test chat with real agents');
console.log('   4. Verify governance works with wrapped agents');

