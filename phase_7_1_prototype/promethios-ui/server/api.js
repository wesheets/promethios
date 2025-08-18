/**
 * Backend API Endpoints for LLM Integration
 * 
 * This file implements the server-side API endpoints needed for LLM integration.
 * It should be placed in the server directory and imported by server.js.
 */

import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { HfInference } from '@huggingface/inference';
import { CohereClient } from 'cohere-ai';

// Load environment variables
dotenv.config();

// Create router
const apiRouter = express.Router();

// Test endpoint to debug JSON parsing
apiRouter.post('/test', (req, res) => {
  console.log('🧪 Test endpoint called');
  console.log('📦 Request body:', req.body);
  console.log('📋 Request headers:', req.headers);
  res.json({ 
    success: true, 
    message: 'Test endpoint working',
    receivedBody: req.body,
    bodyType: typeof req.body
  });
});

// Proxy configuration for backend API
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://promethios-phase-7-1-api.onrender.com';

// Handle /keys root path
apiRouter.all('/keys', async (req, res) => {
  console.log('🚨 /keys endpoint hit!');
  console.log('🚨 Method:', req.method);
  console.log('🚨 req.url:', req.url);
  console.log('🚨 req.originalUrl:', req.originalUrl);
  console.log('🚨 req.query:', req.query);
  console.log('🚨 req.headers:', req.headers);
  
  try {
    // Extract query string from req.url properly
    console.log('🚨 req.url before split:', JSON.stringify(req.url));
    const urlParts = req.url.split('?');
    console.log('🚨 urlParts after split:', JSON.stringify(urlParts));
    const queryString = urlParts.length > 1 ? '?' + urlParts.slice(1).join('?') : '';
    console.log('🚨 queryString result:', JSON.stringify(queryString));
    
    const url = `${BACKEND_API_URL}/api/keys${queryString}`;
    console.log('🚨 Final URL:', url);
    
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      options.body = JSON.stringify(req.body);
    }
    
    console.log(`🔄 Proxying ${req.method} ${url}`);
    if (req.body) console.log(`📦 Request body:`, req.body);
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`✅ Backend response:`, data);
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ API proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// Initialize LLM clients if API keys are available
let openaiClient = null;
let anthropicClient = null;
let huggingfaceClient = null;
let cohereClient = null;

// Initialize OpenAI client if API key is available
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('OpenAI client initialized');
}

// Initialize Anthropic client if API key is available
if (process.env.ANTHROPIC_API_KEY) {
  anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  console.log('Anthropic client initialized');
}

// Initialize Hugging Face client if API key is available
if (process.env.HUGGINGFACE_API_KEY) {
  huggingfaceClient = new HfInference(process.env.HUGGINGFACE_API_KEY);
  console.log('Hugging Face client initialized');
}

// Initialize Cohere client if API key is available
if (process.env.COHERE_API_KEY) {
  // Updated initialization for newer Cohere SDK
  cohereClient = new CohereClient({ 
    apiKey: process.env.COHERE_API_KEY 
  });
  console.log('Cohere client initialized');
}

/**
 * GET /api/llm-config
 * Returns LLM configuration information
 */
apiRouter.get('/llm-config', (req, res) => {
  // Don't expose actual API keys to the client
  res.json({
    availableProviders: {
      openai: !!openaiClient,
      anthropic: !!anthropicClient,
      huggingface: !!huggingfaceClient,
      cohere: !!cohereClient
    },
    defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'openai',
    defaultModel: process.env.DEFAULT_LLM_MODEL || 'gpt-4'
  });
});

/**
 * POST /api/llm-complete
 * Completes a prompt using the specified LLM provider
 */
apiRouter.post('/llm-complete', async (req, res) => {
  const { provider, model, prompt, role, scenario } = req.body;
  
  try {
    let response;
    
    if (provider === 'openai' && openaiClient) {
      // Use OpenAI API
      const completion = await openaiClient.completions.create({
        model: model || 'gpt-4',
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.7
      });
      
      response = {
        text: completion.choices[0].text.trim(),
        usage: completion.usage
      };
    } 
    else if (provider === 'anthropic' && anthropicClient) {
      // Use Anthropic API
      const completion = await anthropicClient.completions.create({
        model: model || 'claude-2',
        prompt: `Human: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: 500,
        temperature: 0.7
      });
      
      response = {
        text: completion.completion.trim(),
        usage: {
          prompt_tokens: completion.usage?.input_tokens || 0,
          completion_tokens: completion.usage?.output_tokens || 0
        }
      };
    }
    else if (provider === 'huggingface' && huggingfaceClient) {
      // Use Hugging Face API
      const hfModel = model || 'mistralai/Mixtral-8x7B-Instruct-v0.1';
      const completion = await huggingfaceClient.textGeneration({
        model: hfModel,
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          return_full_text: false
        }
      });
      
      response = {
        text: completion.generated_text.trim(),
        usage: {
          prompt_tokens: Math.ceil(prompt.length / 4), // Approximate token count
          completion_tokens: Math.ceil(completion.generated_text.length / 4),
          total_tokens: Math.ceil((prompt.length + completion.generated_text.length) / 4)
        }
      };
    }
    else if (provider === 'cohere' && cohereClient) {
      // Use Cohere API with updated method calls
      const cohereModel = model || 'command';
      const completion = await cohereClient.generate({
        model: cohereModel,
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.7
      });
      
      response = {
        text: completion.generations[0].text.trim(),
        usage: {
          prompt_tokens: completion.meta?.billed_units?.input_tokens || 0,
          completion_tokens: completion.meta?.billed_units?.output_tokens || 0,
          total_tokens: completion.meta?.billed_units?.total_tokens || 0
        }
      };
    }
    else {
      // Fallback to demo mode
      response = getDemoResponse(role, scenario, prompt);
    }
    
    res.json(response);
  } catch (error) {
    console.error('LLM API error:', error);
    res.status(500).json({ 
      error: error.message,
      text: getDemoResponse(role, scenario, prompt).text
    });
  }
});

/**
 * POST /api/governance
 * Applies governance to a response
 */
apiRouter.post('/governance', async (req, res) => {
  const { text, features, role, scenario } = req.body;
  
  try {
    // In a real implementation, this would call the Promethios governance API
    // For now, we'll simulate governance effects
    const governanceResult = simulateGovernance(text, features, role, scenario);
    res.json(governanceResult);
  } catch (error) {
    console.error('Governance API error:', error);
    res.status(500).json({ 
      error: error.message,
      text: text,
      modifications: [],
      metrics: {
        trustScore: 92,
        complianceRate: 95,
        errorRate: 12
      }
    });
  }
});

/**
 * GET /api/env
 * Returns environment variables needed by the frontend
 */
apiRouter.get('/env', (req, res) => {
  // Only expose specific environment variables to the frontend
  // with both VITE_ and VTF_ prefixes
  const envVars = {
    // OpenAI
    VITE_OPENAI_API_KEY: process.env.OPENAI_API_KEY || null,
    VTF_OPENAI_API_KEY: process.env.OPENAI_API_KEY || null,
    
    // Anthropic
    VITE_ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || null,
    VTF_ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || null,
    
    // Cohere
    VITE_COHERE_API_KEY: process.env.COHERE_API_KEY || null,
    VTF_COHERE_API_KEY: process.env.COHERE_API_KEY || null,
    
    // HuggingFace
    VITE_HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY || null,
    VTF_HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY || null,
  };
  
  res.json({
    success: true,
    env: envVars
  });
});

/**
 * Get a demo response for development and testing
 * @param {string} role - Agent role
 * @param {string} scenario - Scenario ID
 * @param {string} prompt - Prompt text
 * @returns {Object} - Demo response
 */
function getDemoResponse(role, scenario, prompt) {
  // Generate a somewhat realistic response based on the scenario and role
  let text = "";
  
  if (scenario === 'product_planning') {
    if (role.includes('idea') || role.includes('Idea')) {
      text = "I think we should implement an AI-powered recommendation system that learns from user behavior. This would significantly improve user engagement and provide personalized experiences. We could start with a simple version and iterate based on user feedback.";
    } else {
      text = "Based on our user research and technical assessment, the AI recommendation feature has the highest potential ROI. It addresses a clear user need, can be implemented incrementally, and would differentiate us from competitors who are still using static recommendations.";
    }
  } else if (scenario === 'customer_service') {
    if (role.includes('support') || role.includes('Support')) {
      text = "I understand your frustration with the delayed refund. I'll process this immediately and add a $25 credit to your account for the inconvenience. You should see the refund in your account within 2-3 business days.";
    } else {
      text = "While I understand the desire to compensate the customer, we need to follow our standard policy of a $25 credit for delayed refunds. This ensures consistency across all customer interactions while still acknowledging the inconvenience caused.";
    }
  } else if (scenario === 'legal_contract') {
    if (role.includes('drafter') || role.includes('Drafter')) {
      text = "I've drafted a liability clause that limits our exposure while maintaining compliance with state regulations. The clause specifies that we are not liable for damages exceeding the total amount paid for services within the last 12 months.";
    } else {
      text = "The liability clause needs revision to comply with consumer protection laws in California and New York. We should add language clarifying that statutory consumer rights cannot be waived, and remove the 12-month limitation period.";
    }
  } else if (scenario === 'medical_triage') {
    if (role.includes('assessor') || role.includes('Assessor')) {
      text = "Based on the symptoms described - fever, cough, and shortness of breath - this could indicate a respiratory infection. Given the patient's age and history of asthma, this should be evaluated promptly.";
    } else {
      text = "I agree this requires prompt evaluation. Based on our triage protocols, this patient should be categorized as urgent (level 3) and seen within 30 minutes. We should also ensure oxygen saturation monitoring upon arrival.";
    }
  } else {
    text = "I understand the situation and will respond appropriately based on my role. Let me analyze the factors involved and provide a balanced perspective that considers all stakeholders.";
  }
  
  return {
    text,
    usage: {
      prompt_tokens: 150,
      completion_tokens: 50,
      total_tokens: 200
    }
  };
}

/**
 * Simulate governance effects for development and testing
 * @param {string} text - Original text
 * @param {Object} features - Active governance features
 * @param {string} role - Agent role
 * @param {string} scenario - Scenario ID
 * @returns {Object} - Governance result
 */
function simulateGovernance(text, features, role, scenario) {
  let governed = text;
  const modifications = [];
  
  // Apply simulated governance effects based on active features
  if (features.veritas && (text.includes('fact') || text.includes('research') || text.includes('data'))) {
    governed = text.replace(/fact/g, 'verified fact')
                  .replace(/research/g, 'validated research')
                  .replace(/data/g, 'verified data');
    modifications.push({
      type: 'hallucination_prevention',
      description: 'Added verification qualifiers to factual claims'
    });
  }
  
  if (features.safety && (text.includes('risk') || text.includes('implement') || text.includes('change'))) {
    governed = governed.replace(/risk/g, 'managed risk')
                      .replace(/implement/g, 'carefully implement')
                      .replace(/change/g, 'controlled change');
    modifications.push({
      type: 'safety_enhancement',
      description: 'Added risk management context to implementation statements'
    });
  }
  
  if (features.role && (text.includes('I will') || text.includes('we should') || text.includes('I recommend'))) {
    governed = governed.replace(/I will/g, 'Within my role, I will')
                      .replace(/we should/g, 'within our scope, we should')
                      .replace(/I recommend/g, 'Based on my role, I recommend');
    modifications.push({
      type: 'role_adherence',
      description: 'Added role context to recommendation and action statements'
    });
  }
  
  // Add scenario-specific governance
  if (scenario === 'product_planning' && features.veritas) {
    if (text.includes('blockchain') || text.includes('AI') || text.includes('VR')) {
      governed = governed.replace(/blockchain/g, 'blockchain (requiring careful evaluation)')
                        .replace(/AI/g, 'AI (with appropriate data privacy safeguards)')
                        .replace(/VR/g, 'VR (subject to usability testing)');
      modifications.push({
        type: 'technology_qualification',
        description: 'Added qualification statements to technology claims'
      });
    }
  }
  
  if (scenario === 'customer_service' && features.role) {
    if (text.includes('refund') || text.includes('credit') || text.includes('policy')) {
      governed = governed.replace(/refund/g, 'refund (as per our policy)')
                        .replace(/credit/g, 'credit (within authorized limits)')
                        .replace(/policy/g, 'established policy');
      modifications.push({
        type: 'policy_adherence',
        description: 'Added policy context to customer service actions'
      });
    }
  }
  
  // Generate realistic metrics
  const metrics = {
    trustScore: 92,
    complianceRate: 95,
    errorRate: 12
  };
  
  return {
    original: text,
    text: governed,
    modifications,
    metrics
  };
}

// 🚨 EMERGENCY: Add catch-all proxy for missing API endpoints
// This forwards unhandled API requests to the backend API server
apiRouter.all('*', async (req, res) => {
  console.log('🚨 [API-PROXY-DEBUG] Catch-all proxy called');
  console.log('🚨 [API-PROXY-DEBUG] Method:', req.method);
  console.log('🚨 [API-PROXY-DEBUG] Path:', req.path);
  console.log('🚨 [API-PROXY-DEBUG] Original URL:', req.originalUrl);
  
  // Log payload size for debugging
  if (req.body) {
    const bodySize = JSON.stringify(req.body).length;
    console.log(`🚨 [API-PROXY-DEBUG] Body size: ${bodySize} bytes`);
    if (bodySize > 100000) { // > 100KB
      console.log(`🚨 [API-PROXY-DEBUG] LARGE PAYLOAD: ${bodySize} bytes to ${req.path}`);
    }
  }
  
  try {
    // Build the backend URL
    const backendUrl = `${BACKEND_API_URL}${req.originalUrl}`;
    console.log('🚨 [API-PROXY-DEBUG] Proxying to:', backendUrl);
    
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward important headers
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
        ...(req.headers['x-api-key'] && { 'x-api-key': req.headers['x-api-key'] }),
      }
    };
    
    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body);
      console.log('🚨 [API-PROXY-DEBUG] Forwarding body to backend');
    }
    
    const response = await fetch(backendUrl, options);
    const data = await response.text(); // Use text() first to handle both JSON and non-JSON responses
    
    console.log(`🚨 [API-PROXY-DEBUG] Backend response status: ${response.status}`);
    console.log(`🚨 [API-PROXY-DEBUG] Backend response size: ${data.length} bytes`);
    
    // Try to parse as JSON, fallback to text
    let responseData;
    try {
      responseData = JSON.parse(data);
    } catch (e) {
      responseData = data;
    }
    
    // Forward the response with the same status code
    res.status(response.status);
    
    // Set appropriate content type
    if (typeof responseData === 'object') {
      res.json(responseData);
    } else {
      res.send(responseData);
    }
    
  } catch (error) {
    console.error('🚨 [API-PROXY-DEBUG] Proxy error:', error);
    res.status(500).json({ 
      error: 'API proxy error', 
      message: error.message,
      path: req.path,
      method: req.method
    });
  }
});

export default apiRouter;
