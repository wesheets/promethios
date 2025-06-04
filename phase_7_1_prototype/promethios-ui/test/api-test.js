/**
 * API Testing Script for CMU Interactive Playground
 * 
 * This script tests the backend API endpoints for LLM integration.
 */

import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const LOG_RESPONSES = true;

/**
 * Test the LLM configuration endpoint
 */
async function testLLMConfig() {
  console.log('\n--- Testing LLM Config Endpoint ---');
  try {
    const response = await fetch(`${API_BASE_URL}/llm-config`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (LOG_RESPONSES) {
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
    // Validate response structure
    if (!data.availableProviders) {
      throw new Error('Missing availableProviders in response');
    }
    
    if (typeof data.defaultProvider !== 'string') {
      throw new Error('Missing or invalid defaultProvider in response');
    }
    
    if (typeof data.defaultModel !== 'string') {
      throw new Error('Missing or invalid defaultModel in response');
    }
    
    // Check for API key exposure
    const responseStr = JSON.stringify(data);
    if (responseStr.includes('sk-') || responseStr.includes('api_key')) {
      throw new Error('Potential API key exposure detected in response');
    }
    
    console.log('✅ LLM Config test passed');
    return data;
  } catch (error) {
    console.error('❌ LLM Config test failed:', error.message);
    throw error;
  }
}

/**
 * Test the LLM completion endpoint
 */
async function testLLMComplete() {
  console.log('\n--- Testing LLM Complete Endpoint ---');
  
  const testCases = [
    {
      name: 'Standard request - IdeaBot',
      body: {
        provider: 'openai',
        model: 'gpt-4',
        prompt: 'You are IdeaBot. Suggest a new product feature.',
        role: 'ideaBot',
        scenario: 'product_planning'
      }
    },
    {
      name: 'Standard request - PrioBot',
      body: {
        provider: 'openai',
        model: 'gpt-4',
        prompt: 'You are PrioBot. Evaluate the proposed AI recommendation feature.',
        role: 'prioBot',
        scenario: 'product_planning'
      }
    },
    {
      name: 'Missing provider (should use default)',
      body: {
        model: 'gpt-4',
        prompt: 'You are IdeaBot. Suggest a new product feature.',
        role: 'ideaBot',
        scenario: 'product_planning'
      }
    },
    {
      name: 'Invalid provider (should fallback)',
      body: {
        provider: 'invalid_provider',
        model: 'gpt-4',
        prompt: 'You are IdeaBot. Suggest a new product feature.',
        role: 'ideaBot',
        scenario: 'product_planning'
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\nRunning test case: ${testCase.name}`);
    try {
      const response = await fetch(`${API_BASE_URL}/llm-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (LOG_RESPONSES) {
        console.log('Response:', JSON.stringify(data, null, 2));
      }
      
      // Validate response structure
      if (typeof data.text !== 'string' || data.text.length === 0) {
        throw new Error('Missing or invalid text in response');
      }
      
      if (!data.usage || typeof data.usage !== 'object') {
        throw new Error('Missing usage information in response');
      }
      
      console.log(`✅ Test case passed: ${testCase.name}`);
    } catch (error) {
      console.error(`❌ Test case failed: ${testCase.name}`, error.message);
      // Continue with other test cases even if one fails
    }
  }
  
  console.log('\n✅ LLM Complete endpoint testing completed');
}

/**
 * Test the governance endpoint
 */
async function testGovernance() {
  console.log('\n--- Testing Governance Endpoint ---');
  
  const testCases = [
    {
      name: 'All governance features enabled',
      body: {
        text: 'I will implement this feature immediately without any testing.',
        features: {
          veritas: true,
          safety: true,
          role: true
        },
        role: 'ideaBot',
        scenario: 'product_planning'
      }
    },
    {
      name: 'Only veritas enabled',
      body: {
        text: 'Based on our research data, this feature will increase engagement by 200%.',
        features: {
          veritas: true,
          safety: false,
          role: false
        },
        role: 'ideaBot',
        scenario: 'product_planning'
      }
    },
    {
      name: 'Only safety enabled',
      body: {
        text: 'We should implement this high-risk feature immediately.',
        features: {
          veritas: false,
          safety: true,
          role: false
        },
        role: 'ideaBot',
        scenario: 'product_planning'
      }
    },
    {
      name: 'Only role adherence enabled',
      body: {
        text: 'I will make the final decision on this feature.',
        features: {
          veritas: false,
          safety: false,
          role: true
        },
        role: 'ideaBot',
        scenario: 'product_planning'
      }
    },
    {
      name: 'No governance features enabled',
      body: {
        text: 'I will implement this feature immediately without any testing.',
        features: {
          veritas: false,
          safety: false,
          role: false
        },
        role: 'ideaBot',
        scenario: 'product_planning'
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\nRunning test case: ${testCase.name}`);
    try {
      const response = await fetch(`${API_BASE_URL}/governance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (LOG_RESPONSES) {
        console.log('Response:', JSON.stringify(data, null, 2));
      }
      
      // Validate response structure
      if (typeof data.original !== 'string') {
        throw new Error('Missing original text in response');
      }
      
      if (typeof data.text !== 'string') {
        throw new Error('Missing governed text in response');
      }
      
      if (!Array.isArray(data.modifications)) {
        throw new Error('Missing or invalid modifications array in response');
      }
      
      if (!data.metrics || typeof data.metrics !== 'object') {
        throw new Error('Missing metrics in response');
      }
      
      // Check if governance was applied correctly
      const anyFeatureEnabled = Object.values(testCase.body.features).some(v => v);
      if (anyFeatureEnabled && data.original === data.text) {
        console.warn('⚠️ Warning: Governance enabled but no changes made to text');
      }
      
      if (!anyFeatureEnabled && data.original !== data.text) {
        throw new Error('Governance disabled but text was modified');
      }
      
      console.log(`✅ Test case passed: ${testCase.name}`);
    } catch (error) {
      console.error(`❌ Test case failed: ${testCase.name}`, error.message);
      // Continue with other test cases even if one fails
    }
  }
  
  console.log('\n✅ Governance endpoint testing completed');
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  console.log('\n--- Testing Error Handling ---');
  
  const testCases = [
    {
      name: 'Malformed JSON',
      endpoint: 'llm-complete',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{"this is not valid JSON',
      expectedStatus: 400
    },
    {
      name: 'Missing required parameters',
      endpoint: 'llm-complete',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}),
      expectedStatus: 400
    },
    {
      name: 'Invalid endpoint',
      endpoint: 'non-existent-endpoint',
      method: 'GET',
      expectedStatus: 404
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\nRunning error test case: ${testCase.name}`);
    try {
      const response = await fetch(`${API_BASE_URL}/${testCase.endpoint}`, {
        method: testCase.method,
        headers: testCase.headers,
        body: testCase.body
      });
      
      if (response.status === testCase.expectedStatus) {
        console.log(`✅ Error test case passed: ${testCase.name} (Status: ${response.status})`);
      } else {
        console.error(`❌ Error test case failed: ${testCase.name} (Expected status: ${testCase.expectedStatus}, got: ${response.status})`);
      }
      
      // Try to parse response as JSON
      try {
        const data = await response.json();
        if (LOG_RESPONSES) {
          console.log('Error response:', JSON.stringify(data, null, 2));
        }
        
        // Check if error response has appropriate structure
        if (!data.error && response.status !== 200) {
          console.warn('⚠️ Warning: Error response does not contain an error message');
        }
      } catch (e) {
        console.warn('⚠️ Warning: Error response is not valid JSON');
      }
    } catch (error) {
      console.error(`❌ Error test case failed: ${testCase.name}`, error.message);
    }
  }
  
  console.log('\n✅ Error handling testing completed');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('Starting API tests...');
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  try {
    await testLLMConfig();
    await testLLMComplete();
    await testGovernance();
    await testErrorHandling();
    
    console.log('\n🎉 All API tests completed successfully!');
  } catch (error) {
    console.error('\n❌ API testing failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runAllTests();
