const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { CohereClient } = require('cohere-ai');
const { HfInference } = require('@huggingface/inference');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const governanceContextService = require('./governanceContextService');

// Initialize LLM clients with optional API keys for testing
let openai = null;
let anthropic = null;
let cohere = null;
let hf = null;
let gemini = null;
let grok = null;
let perplexity = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI client initialized');
  } else {
    console.log('⚠️ OpenAI API key not found - using fallback responses');
  }
} catch (error) {
  console.log('⚠️ OpenAI initialization failed - using fallback responses');
}

try {
  if (process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    console.log('✅ Anthropic client initialized');
  } else {
    console.log('⚠️ Anthropic API key not found - using fallback responses');
  }
} catch (error) {
  console.log('⚠️ Anthropic initialization failed - using fallback responses');
}

try {
  if (process.env.COHERE_API_KEY) {
    cohere = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });
    console.log('✅ Cohere client initialized');
  } else {
    console.log('⚠️ Cohere API key not found - using fallback responses');
  }
} catch (error) {
  console.log('⚠️ Cohere initialization failed - using fallback responses');
}

try {
  if (process.env.HUGGINGFACE_API_KEY) {
    hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    console.log('✅ HuggingFace client initialized');
  } else {
    console.log('⚠️ HuggingFace API key not found - using fallback responses');
  }
} catch (error) {
  console.log('⚠️ HuggingFace initialization failed - using fallback responses');
}

try {
  if (process.env.GOOGLE_API_KEY) {
    gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    console.log('✅ Google Gemini client initialized');
  } else {
    console.log('⚠️ Google API key not found - using fallback responses');
  }
} catch (error) {
  console.log('⚠️ Google Gemini initialization failed - using fallback responses');
}

try {
  if (process.env.GROK_API_KEY) {
    grok = new OpenAI({
      apiKey: process.env.GROK_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });
    console.log('✅ Grok (X.AI) client initialized');
  } else {
    console.log('⚠️ Grok API key not found - using fallback responses');
  }
} catch (error) {
  console.log('⚠️ Grok initialization failed - using fallback responses');
}

try {
  if (process.env.PERPLEXITY_API_KEY) {
    perplexity = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai',
    });
    console.log('✅ Perplexity client initialized');
  } else {
    console.log('⚠️ Perplexity API key not found - using fallback responses');
  }
} catch (error) {
  console.log('⚠️ Perplexity initialization failed - using fallback responses');
}

// Main generateResponse function that routes to appropriate provider
async function generateResponse(agentId, message, systemMessage, userId, options = {}) {
  console.log('🔧 LLM SERVICE: generateResponse called with:', {
    agentId,
    messageLength: message?.length,
    systemMessageLength: systemMessage?.length,
    userId,
    provider: options.provider,
    model: options.model
  });

  try {
    const provider = options.provider?.toLowerCase();
    
    // Route to appropriate provider based on agent configuration
    switch (provider) {
      case 'openai':
        return await callOpenAI(message, systemMessage, options);
      
      case 'anthropic':
      case 'claude':
        return await callAnthropic(message, systemMessage, options);
      
      case 'cohere':
        return await callCohere(message, systemMessage, options);
      
      case 'google':
      case 'gemini':
        return await callGemini(message, systemMessage, options);
      
      case 'huggingface':
        return await callHuggingFace(message, systemMessage, options);
      
      case 'grok':
      case 'x.ai':
        return await callGrok(message, systemMessage, options);
      
      case 'perplexity':
        return await callPerplexity(message, systemMessage, options);
      
      default:
        console.log('🔧 LLM SERVICE: Unknown provider, defaulting to OpenAI:', provider);
        return await callOpenAI(message, systemMessage, options);
    }
  } catch (error) {
    console.error('❌ LLM SERVICE: Error in generateResponse:', error);
    throw error;
  }
}

// OpenAI implementation
async function callOpenAI(message, systemMessage, options = {}) {
  console.log('🔧 OPENAI DEBUG: Starting OpenAI call');
  
  if (!openai) {
    throw new Error('OpenAI client not initialized - API key missing');
  }

  try {
    const model = options.model || 'gpt-4';
    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: message }
    ];

    console.log('🔧 OPENAI DEBUG: Calling OpenAI API with model:', model);
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const responseText = response.choices[0].message.content;
    console.log('🔧 OPENAI DEBUG: Response received, length:', responseText.length);
    
    return responseText;
  } catch (error) {
    console.error('❌ OPENAI DEBUG: Error:', error);
    throw error;
  }
}

// Anthropic implementation
async function callAnthropic(message, systemMessage, options = {}) {
  console.log('🔧 ANTHROPIC DEBUG: Starting Anthropic call');
  
  if (!anthropic) {
    throw new Error('Anthropic client not initialized - API key missing');
  }

  try {
    const model = options.model || 'claude-3-sonnet-20240229';
    
    console.log('🔧 ANTHROPIC DEBUG: Calling Anthropic API with model:', model);
    
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 1000,
      system: systemMessage,
      messages: [
        { role: 'user', content: message }
      ],
    });

    const responseText = response.content[0].text;
    console.log('🔧 ANTHROPIC DEBUG: Response received, length:', responseText.length);
    
    return responseText;
  } catch (error) {
    console.error('❌ ANTHROPIC DEBUG: Error:', error);
    throw error;
  }
}

// Cohere implementation
async function callCohere(message, systemMessage, options = {}) {
  console.log('🔧 COHERE DEBUG: Starting Cohere call');
  
  if (!cohere) {
    throw new Error('Cohere client not initialized - API key missing');
  }

  try {
    const model = options.model || 'command-r-plus';
    
    console.log('🔧 COHERE DEBUG: Calling Cohere API with model:', model);
    
    const response = await cohere.chat({
      model: model,
      message: message,
      preamble: systemMessage,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const responseText = response.text;
    console.log('🔧 COHERE DEBUG: Response received, length:', responseText.length);
    
    return responseText;
  } catch (error) {
    console.error('❌ COHERE DEBUG: Error:', error);
    throw error;
  }
}

// Gemini implementation
async function callGemini(message, systemMessage, options = {}) {
  console.log('🔧 GEMINI DEBUG: Starting Gemini call');
  
  if (!gemini) {
    throw new Error('Gemini client not initialized - API key missing');
  }

  try {
    const model = options.model || 'gemini-pro';
    
    console.log('🔧 GEMINI DEBUG: Calling Gemini API with model:', model);
    
    const genAI = gemini.getGenerativeModel({ model: model });
    
    const prompt = `${systemMessage}\n\nUser: ${message}`;
    const result = await genAI.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('🔧 GEMINI DEBUG: Response received, length:', responseText.length);
    
    return responseText;
  } catch (error) {
    console.error('❌ GEMINI DEBUG: Error:', error);
    throw error;
  }
}

// HuggingFace implementation
async function callHuggingFace(message, systemMessage, options = {}) {
  console.log('🔧 HUGGINGFACE DEBUG: Starting HuggingFace call');
  
  if (!hf) {
    throw new Error('HuggingFace client not initialized - API key missing');
  }

  try {
    // Use models that are more likely to be available on free tier
    const model = options.model || 'microsoft/DialoGPT-medium';
    
    console.log('🔧 HUGGINGFACE DEBUG: Calling HuggingFace API with model:', model);
    
    // Use text generation for all models - this is the most reliable approach
    let prompt;
    
    if (model.includes('DialoGPT')) {
      // For DialoGPT models, use a simple conversational format
      prompt = `${message}`;
    } else if (model.includes('llama') || model.includes('Llama')) {
      // For Llama models, use the chat template format
      prompt = `<s>[INST] <<SYS>>\n${systemMessage}\n<</SYS>>\n\n${message} [/INST]`;
    } else {
      // For other models, use a simple format
      prompt = `System: ${systemMessage}\nUser: ${message}\nAssistant:`;
    }
    
    const response = await hf.textGeneration({
      model: model,
      inputs: prompt,
      parameters: {
        max_new_tokens: 256,
        temperature: 0.7,
        repetition_penalty: 1.1,
        return_full_text: false,
        do_sample: true,
      },
    });

    const responseText = response.generated_text || 'No response generated';
    console.log('🔧 HUGGINGFACE DEBUG: Response received, length:', responseText.length);
    
    // Clean up the response
    const cleanedResponse = responseText.trim();
    return cleanedResponse || 'I apologize, but I was unable to generate a proper response.';
    
  } catch (error) {
    console.error('❌ HUGGINGFACE DEBUG: Error:', error);
    
    // If the primary model fails, try a fallback approach
    if (error.message?.includes('No Inference Provider available') || 
        error.message?.includes('Model') && error.message?.includes('is currently loading')) {
      console.log('🔧 HUGGINGFACE DEBUG: Trying fallback with simpler model');
      
      try {
        // Fallback to a very basic model that should be available
        const fallbackResponse = await hf.textGeneration({
          model: 'gpt2',
          inputs: `Q: ${message}\nA:`,
          parameters: {
            max_new_tokens: 50,
            temperature: 0.8,
            return_full_text: false,
          },
        });
        
        const fallbackText = fallbackResponse.generated_text?.trim() || 'I apologize, but I am currently experiencing technical difficulties.';
        return fallbackText;
        
      } catch (fallbackError) {
        console.error('❌ HUGGINGFACE DEBUG: Fallback also failed:', fallbackError);
        return 'I apologize, but the HuggingFace service is currently unavailable. Please try again later or use a different provider.';
      }
    }
    
    // For other errors, provide a helpful message
    if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      return 'I apologize, but there is an authentication issue with the HuggingFace service. Please contact support.';
    }
    
    return `I apologize, but I encountered an error: ${error.message || 'Unknown error'}. Please try again or use a different provider.`;
  }
}

// Grok implementation
async function callGrok(message, systemMessage, options = {}) {
  console.log('🔧 GROK DEBUG: Starting Grok call');
  
  if (!grok) {
    throw new Error('Grok client not initialized - API key missing');
  }

  try {
    const model = options.model || 'grok-beta';
    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: message }
    ];

    console.log('🔧 GROK DEBUG: Calling Grok API with model:', model);
    
    const response = await grok.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const responseText = response.choices[0].message.content;
    console.log('🔧 GROK DEBUG: Response received, length:', responseText.length);
    
    return responseText;
  } catch (error) {
    console.error('❌ GROK DEBUG: Error:', error);
    throw error;
  }
}

// Perplexity implementation
async function callPerplexity(message, systemMessage, options = {}) {
  console.log('🔧 PERPLEXITY DEBUG: Starting Perplexity call');
  
  if (!perplexity) {
    throw new Error('Perplexity client not initialized - API key missing');
  }

  try {
    const model = options.model || 'llama-3.1-sonar-small-128k-online';
    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: message }
    ];

    console.log('🔧 PERPLEXITY DEBUG: Calling Perplexity API with model:', model);
    
    const response = await perplexity.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const responseText = response.choices[0].message.content;
    console.log('🔧 PERPLEXITY DEBUG: Response received, length:', responseText.length);
    
    return responseText;
  } catch (error) {
    console.error('❌ PERPLEXITY DEBUG: Error:', error);
    throw error;
  }
}

// Export the service with all methods
module.exports = {
  generateResponse,
  callOpenAI,
  callAnthropic,
  callCohere,
  callGemini,
  callHuggingFace,
  callGrok,
  callPerplexity,
  
  // Legacy method names for backward compatibility
  callOpenAIGPT35: callOpenAI,
  callOpenAIGPT4: callOpenAI,
  
  // LLMService class for backward compatibility
  LLMService: class LLMService {
    async generateResponse(agentId, message, systemMessage, userId, options = {}) {
      return generateResponse(agentId, message, systemMessage, userId, options);
    }
    
    async callOpenAI(message, systemPrompt) {
      return callOpenAI(message, systemPrompt);
    }
    
    async callAnthropic(message, systemPrompt) {
      return callAnthropic(message, systemPrompt);
    }
    
    async callCohere(message, systemPrompt) {
      return callCohere(message, systemPrompt);
    }
    
    async callGemini(message, systemPrompt) {
      return callGemini(message, systemPrompt);
    }
  }
};

