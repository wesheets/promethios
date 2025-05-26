/**
 * Integration Test for Phase Change Tracker Notification System
 * 
 * This file contains tests for the notification system to ensure it works correctly
 * with all providers and properly handles different notification scenarios.
 */

const notificationManager = require('../notification');
const fs = require('fs');
const path = require('path');

// Mock report data for testing
const mockReport = {
  previousPhase: '6.5',
  currentPhase: '7.0',
  dirChanges: {
    added: ['src/wrapping/detection', 'src/wrapping/generator', 'ui/dashboard'],
    removed: [],
    modified: ['ui/trust_log']
  },
  fileChanges: {
    added: [
      'src/wrapping/detection/schema_analyzer.ts',
      'src/wrapping/detection/integration_points.ts',
      'src/wrapping/generator/wrapper_templates.ts',
      'ui/dashboard/DeveloperDashboard.tsx'
    ],
    removed: [],
    modified: ['ui/trust_log/components/ReplayLogViewer.js']
  },
  apiChanges: {
    interfaces: {
      added: [{ name: 'ISchemaAnalyzer', file: 'src/wrapping/detection/schema_analyzer.ts' }],
      removed: [],
      modified: []
    },
    components: {
      added: [{ name: 'DeveloperDashboard', file: 'ui/dashboard/DeveloperDashboard.tsx' }],
      removed: [],
      modified: [{ name: 'ReplayLogViewer', file: 'ui/trust_log/components/ReplayLogViewer.js' }]
    }
  }
};

// Test notification sending
async function testNotificationSending() {
  console.log('Testing notification system...');
  
  // Add test subscribers
  notificationManager.addSubscriber({
    id: 'test-user-1',
    name: 'Test User 1',
    email: 'test1@example.com',
    preferences: {
      notificationTypes: ['phase-change'],
      components: ['DeveloperDashboard'],
      directories: ['src/wrapping']
    }
  });
  
  notificationManager.addSubscriber({
    id: 'test-user-2',
    name: 'Test User 2',
    email: 'test2@example.com',
    preferences: {
      notificationTypes: ['phase-change'],
      components: ['ReplayLogViewer'],
      directories: ['ui/trust_log']
    }
  });
  
  // Configure notification providers for testing
  notificationManager.config.providers.email.enabled = true;
  notificationManager.config.providers.slack.enabled = false;
  notificationManager.config.providers.teams.enabled = false;
  notificationManager.config.providers.discord.enabled = false;
  
  // Set base URL for report links
  notificationManager.config.baseUrl = 'https://github.com/wesheets/promethios/blob/main/';
  
  // Save configuration
  notificationManager.saveConfig();
  
  // Test sending phase change notification
  try {
    const result = await notificationManager.sendPhaseChangeNotification(mockReport);
    console.log('Notification test result:', result);
    
    if (result.success) {
      console.log('✅ Notification system test passed!');
    } else {
      console.log('❌ Notification system test failed:', result.errors);
    }
  } catch (error) {
    console.error('❌ Notification system test error:', error);
  }
}

// Run tests
testNotificationSending();
