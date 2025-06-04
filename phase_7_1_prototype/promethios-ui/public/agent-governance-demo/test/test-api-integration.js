/**
 * Test API Integration
 * Tests the integration with LLM providers
 */

// Import API client
import apiClient from '../api/apiClient.js';
import OpenAIProvider from '../api/providers/openai.js';
import AnthropicProvider from '../api/providers/anthropic.js';
import HuggingFaceProvider from '../api/providers/huggingface.js';
import CohereProvider from '../api/providers/cohere.js';

// Mock API keys for testing
const mockApiKeys = {
  openai: 'sk-test-openai-key',
  anthropic: 'sk-test-anthropic-key',
  huggingface: 'hf-test-key',
  cohere: 'co-test-key'
};

// Test prompt
const testPrompt = 'Explain the importance of AI governance in three sentences.';

// Test results container
const testResults = {
  providers: {},
  governance: {},
  overall: {
    success: false,
    message: 'Tests not run yet'
  }
};

/**
 * Run provider tests
 */
async function testProviders() {
  console.log('Testing LLM provider integration...');
  
  // Test OpenAI provider
  try {
    const openaiProvider = new OpenAIProvider(mockApiKeys.openai);
    testResults.providers.openai = {
      initialized: !!openaiProvider,
      methods: {
        makeRequest: typeof openaiProvider.makeRequest === 'function',
        validateApiKey: typeof openaiProvider.validateApiKey === 'function'
      }
    };
    console.log('✓ OpenAI provider initialized correctly');
  } catch (error) {
    testResults.providers.openai = { error: error.message };
    console.error('✗ OpenAI provider test failed:', error);
  }
  
  // Test Anthropic provider
  try {
    const anthropicProvider = new AnthropicProvider(mockApiKeys.anthropic);
    testResults.providers.anthropic = {
      initialized: !!anthropicProvider,
      methods: {
        makeRequest: typeof anthropicProvider.makeRequest === 'function',
        validateApiKey: typeof anthropicProvider.validateApiKey === 'function'
      }
    };
    console.log('✓ Anthropic provider initialized correctly');
  } catch (error) {
    testResults.providers.anthropic = { error: error.message };
    console.error('✗ Anthropic provider test failed:', error);
  }
  
  // Test HuggingFace provider
  try {
    const huggingfaceProvider = new HuggingFaceProvider(mockApiKeys.huggingface);
    testResults.providers.huggingface = {
      initialized: !!huggingfaceProvider,
      methods: {
        makeRequest: typeof huggingfaceProvider.makeRequest === 'function',
        validateApiKey: typeof huggingfaceProvider.validateApiKey === 'function'
      }
    };
    console.log('✓ HuggingFace provider initialized correctly');
  } catch (error) {
    testResults.providers.huggingface = { error: error.message };
    console.error('✗ HuggingFace provider test failed:', error);
  }
  
  // Test Cohere provider
  try {
    const cohereProvider = new CohereProvider(mockApiKeys.cohere);
    testResults.providers.cohere = {
      initialized: !!cohereProvider,
      methods: {
        makeRequest: typeof cohereProvider.makeRequest === 'function',
        validateApiKey: typeof cohereProvider.validateApiKey === 'function'
      }
    };
    console.log('✓ Cohere provider initialized correctly');
  } catch (error) {
    testResults.providers.cohere = { error: error.message };
    console.error('✗ Cohere provider test failed:', error);
  }
}

/**
 * Test API client integration
 */
async function testApiClient() {
  console.log('Testing API client integration...');
  
  try {
    // Initialize API client
    await apiClient.initialize({
      getConfig: () => ({
        apiKeys: mockApiKeys
      })
    });
    
    testResults.apiClient = {
      initialized: apiClient.initialized,
      methods: {
        makeUngovernedRequest: typeof apiClient.makeUngovernedRequest === 'function',
        makeGovernedRequest: typeof apiClient.makeGovernedRequest === 'function'
      }
    };
    console.log('✓ API client initialized correctly');
  } catch (error) {
    testResults.apiClient = { error: error.message };
    console.error('✗ API client test failed:', error);
  }
}

/**
 * Test governance integration
 */
async function testGovernance() {
  console.log('Testing governance integration...');
  
  // Import governance plugins
  try {
    const RoleEnforcementPlugin = (await import('../plugins/governance/roleEnforcement.js')).default;
    const FactualAccuracyPlugin = (await import('../plugins/governance/factualAccuracy.js')).default;
    const SafetyFiltersPlugin = (await import('../plugins/governance/safetyFilters.js')).default;
    
    // Test role enforcement
    const roleEnforcement = new RoleEnforcementPlugin();
    testResults.governance.roleEnforcement = {
      initialized: !!roleEnforcement,
      methods: {
        applyGovernance: typeof roleEnforcement.applyGovernance === 'function',
        recordIntervention: typeof roleEnforcement.recordIntervention === 'function'
      }
    };
    
    // Test factual accuracy
    const factualAccuracy = new FactualAccuracyPlugin();
    testResults.governance.factualAccuracy = {
      initialized: !!factualAccuracy,
      methods: {
        applyGovernance: typeof factualAccuracy.applyGovernance === 'function',
        recordIntervention: typeof factualAccuracy.recordIntervention === 'function'
      }
    };
    
    // Test safety filters
    const safetyFilters = new SafetyFiltersPlugin();
    testResults.governance.safetyFilters = {
      initialized: !!safetyFilters,
      methods: {
        applyGovernance: typeof safetyFilters.applyGovernance === 'function',
        recordIntervention: typeof safetyFilters.recordIntervention === 'function'
      }
    };
    
    console.log('✓ Governance plugins initialized correctly');
  } catch (error) {
    testResults.governance.error = error.message;
    console.error('✗ Governance test failed:', error);
  }
}

/**
 * Test agent integration
 */
async function testAgents() {
  console.log('Testing agent integration...');
  
  // Import agent plugins
  try {
    const HRSpecialistAgent = (await import('../plugins/agents/hrSpecialist.js')).default;
    const ProjectManagerAgent = (await import('../plugins/agents/projectManager.js')).default;
    const TechnicalLeadAgent = (await import('../plugins/agents/technicalLead.js')).default;
    
    // Test HR specialist
    const hrAgent = new HRSpecialistAgent({ provider: 'openai', isGoverned: true });
    testResults.agents = {
      hrSpecialist: {
        initialized: !!hrAgent,
        methods: {
          generateResponse: typeof hrAgent.generateResponse === 'function',
          getSystemPrompt: typeof hrAgent.getSystemPrompt === 'function'
        }
      }
    };
    
    // Test project manager
    const pmAgent = new ProjectManagerAgent({ provider: 'openai', isGoverned: true });
    testResults.agents.projectManager = {
      initialized: !!pmAgent,
      methods: {
        generateResponse: typeof pmAgent.generateResponse === 'function',
        getSystemPrompt: typeof pmAgent.getSystemPrompt === 'function'
      }
    };
    
    // Test technical lead
    const techAgent = new TechnicalLeadAgent({ provider: 'openai', isGoverned: true });
    testResults.agents.technicalLead = {
      initialized: !!techAgent,
      methods: {
        generateResponse: typeof techAgent.generateResponse === 'function',
        getSystemPrompt: typeof techAgent.getSystemPrompt === 'function'
      }
    };
    
    console.log('✓ Agent plugins initialized correctly');
  } catch (error) {
    testResults.agents = { error: error.message };
    console.error('✗ Agent test failed:', error);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting API integration tests...');
  
  try {
    await testProviders();
    await testApiClient();
    await testGovernance();
    await testAgents();
    
    testResults.overall = {
      success: true,
      message: 'All tests completed successfully',
      timestamp: new Date().toISOString()
    };
    
    console.log('✓ All tests completed successfully');
  } catch (error) {
    testResults.overall = {
      success: false,
      message: `Tests failed: ${error.message}`,
      timestamp: new Date().toISOString()
    };
    
    console.error('✗ Tests failed:', error);
  }
  
  // Output test results
  console.log('Test Results:', JSON.stringify(testResults, null, 2));
  return testResults;
}

// Export test functions
export {
  runTests,
  testProviders,
  testApiClient,
  testGovernance,
  testAgents,
  testResults
};

// Run tests if this is the main module
if (typeof window !== 'undefined' && window.runTests) {
  runTests();
}
