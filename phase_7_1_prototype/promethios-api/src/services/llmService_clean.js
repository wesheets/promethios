const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { CohereClient } = require('cohere-ai');
const { HfInference } = require('@huggingface/inference');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { MistralAI } = require('@mistralai/mistralai');
const axios = require('axios');
const governanceContextService = require('./governanceContextService');

// Initialize LLM clients with optional API keys for testing
let openai = null;
let anthropic = null;
let cohere = null;
let hf = null;
let gemini = null;
let mistral = null;
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
  if (process.env.MISTRAL_API_KEY) {
    mistral = new MistralAI({
      apiKey: process.env.MISTRAL_API_KEY,
    });
    console.log('✅ Mistral AI client initialized');
  } else {
    console.log('⚠️ Mistral API key not found - using fallback responses');
  }
} catch (error) {
  console.log('⚠️ Mistral AI initialization failed - using fallback responses');
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

// Export the service class and other components
module.exports = {
  LLMService: class LLMService {
    // Add minimal methods to prevent errors
    async callPrometheosModel(message, systemPrompt) {
      return "Promethios AI Assistant is temporarily unavailable. Please try again later.";
    }
    
    async callOpenAIGPT35(message, systemPrompt) {
      return "OpenAI GPT-3.5 is temporarily unavailable. Please try again later.";
    }
    
    async callOpenAIGPT4(message, systemPrompt) {
      return "OpenAI GPT-4 is temporarily unavailable. Please try again later.";
    }
    
    async callAnthropic(message, systemPrompt) {
      return "Anthropic Claude is temporarily unavailable. Please try again later.";
    }
    
    async callCohere(message, systemPrompt) {
      return "Cohere is temporarily unavailable. Please try again later.";
    }
  }
};

