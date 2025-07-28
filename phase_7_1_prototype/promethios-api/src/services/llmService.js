const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { CohereClient } = require('cohere-ai');
const { HfInference } = require('@huggingface/inference');
const { GoogleGenerativeAI } = require('@google/generative-ai');
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

class LLMService {
  // Promethios Local Model
  async callPrometheosModel(message, systemPrompt) {
    try {
      console.log('🤖 Calling Promethios local model...');
      
      // Combine system prompt and user message
      const fullPrompt = systemPrompt ? 
        `${systemPrompt}\n\nUser: ${message}` : 
        message;
      
      const response = await fetch('http://localhost:3000/api/model/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          agent_id: 'promethios-ai-assistant',
          max_length: 512,
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        throw new Error(`Promethios model API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response || "Hello! I'm Promethios AI Assistant. How can I help you today?";
      
    } catch (error) {
      console.error('Promethios model error:', error);
      
      // Fallback response that identifies as Promethios
      return `Hello! I'm Promethios AI Assistant, your governance-focused AI companion. I'm designed to provide helpful, accurate, and ethically-aligned responses. While I'm experiencing some technical difficulties at the moment, I'm still here to assist you with information, analysis, and guidance. How can I help you today?`;
    }
  }

  // OpenAI GPT-3.5 for Baseline Agent
  async callOpenAIGPT35(message, systemPrompt, agentId = 'unknown', userId = 'unknown') {
    if (!openai) {
      return `I'm a straightforward, rule-based agent providing clear and direct responses. Regarding your message: "${message.substring(0, 100)}..." - I would typically provide a factual, no-nonsense answer focusing on the core information you need. How can I help you with specific, actionable guidance?`;
    }
    
    try {
      // Inject governance context into system prompt
      const enhancedSystemPrompt = await governanceContextService.injectGovernanceContext(
        systemPrompt, 
        agentId, 
        userId
      );

      const startTime = Date.now();
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: enhancedSystemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      // Record interaction for governance tracking
      const responseTime = Date.now() - startTime;
      await governanceContextService.recordInteraction(agentId, userId, {
        responseTime,
        model: 'gpt-3.5-turbo',
        quality: 'good' // Could be enhanced with actual quality assessment
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI GPT-3.5 error:', error);
      return `I encountered a technical issue but can still help. For your query about "${message.substring(0, 50)}...", I would provide a direct, factual response. Please try again or rephrase your question.`;
    }
  }

  // OpenAI GPT-4 for Creative Agent
  async callOpenAIGPT4(message, systemPrompt, agentId = 'unknown', userId = 'unknown') {
    if (!openai) {
      return `I'm your creative thinking partner! While I'm in simulation mode, I can still brainstorm with you. For "${message.substring(0, 100)}..." I'd explore innovative angles, think outside the box, and generate multiple creative solutions. What creative challenge can we tackle together?`;
    }
    
    try {
      // Inject governance context into system prompt
      const enhancedSystemPrompt = await governanceContextService.injectGovernanceContext(
        systemPrompt, 
        agentId, 
        userId
      );

      const startTime = Date.now();
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: enhancedSystemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 600,
        temperature: 0.8
      });

      // Record interaction for governance tracking
      const responseTime = Date.now() - startTime;
      await governanceContextService.recordInteraction(agentId, userId, {
        responseTime,
        model: 'gpt-4',
        quality: 'good'
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI GPT-4 error:', error);
      return `Even with technical hiccups, creativity flows! For your idea about "${message.substring(0, 50)}...", I'd suggest exploring unconventional approaches, combining unexpected elements, and thinking beyond traditional boundaries. What creative direction interests you most?`;
    }
  }

   // Anthropic Claude for Factual Agent
  async callAnthropic(message, systemPrompt, agentId = 'unknown', userId = 'unknown') {
    if (!anthropic) {
      return `I'm your accuracy-focused research assistant. I prioritize factual correctness and well-sourced information. For your query "${message.substring(0, 100)}..." I would typically provide verified facts, cite reliable sources, and clearly distinguish between confirmed information and areas of uncertainty. What factual information can I help you research?`;
    }
    
    try {
      // Inject governance context into system prompt
      const enhancedSystemPrompt = await governanceContextService.injectGovernanceContext(
        systemPrompt, 
        agentId, 
        userId
      );

      const startTime = Date.now();
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022', // Updated to current model
        max_tokens: 600,
        temperature: 0.2,
        system: enhancedSystemPrompt,
        messages: [
          { role: 'user', content: message }
        ]
      });

      // Record interaction for governance tracking
      const responseTime = Date.now() - startTime;
      await governanceContextService.recordInteraction(agentId, userId, {
        responseTime,
        model: 'claude-3-sonnet',
        quality: 'good'
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Anthropic error:', error);
      return `I'm committed to providing accurate information. While experiencing technical difficulties with "${message.substring(0, 50)}...", I would normally cross-reference multiple reliable sources and present well-documented facts. Please try again for the most current and verified information.`;
    }
  }

  // Cohere for Governance Agent
  async callCohere(message, systemPrompt, agentId = 'unknown', userId = 'unknown') {
    if (!cohere) {
      return `I'm experiencing technical difficulties connecting to my language model. Please check that the Cohere API key is properly configured in the environment variables. For compliance and ethics guidance, please try again once the connection is restored.`;
    }
    
    try {
      // Inject governance context into system prompt
      const enhancedSystemPrompt = await governanceContextService.injectGovernanceContext(
        systemPrompt, 
        agentId, 
        userId
      );

      const startTime = Date.now();
      
      const response = await cohere.chat({
        model: 'command',
        message: message,
        preamble: enhancedSystemPrompt,
        max_tokens: 500,
        temperature: 0.3
      });

      // Record interaction for governance tracking
      const responseTime = Date.now() - startTime;
      await governanceContextService.recordInteraction(agentId, userId, {
        responseTime,
        model: 'command',
        quality: 'good'
      });

      return response.text;
    } catch (error) {
      console.error('Cohere error:', error);
      
      // Record failed interaction for governance tracking
      await governanceContextService.recordInteraction(agentId, userId, {
        responseTime: 0,
        model: 'command',
        quality: 'failed',
        error: error.message
      });
      
      return `I'm experiencing technical difficulties with the Cohere API. Error: ${error.message}. Please check the API configuration and try again.`;
    }
  }

  // HuggingFace for Multi-Tool Agent
  async callHuggingFace(message, systemPrompt, agentId = 'unknown', userId = 'unknown') {
    if (!hf) {
      return `I'm experiencing technical difficulties connecting to my language model. Please check that the HuggingFace API key is properly configured in the environment variables. For assistance with API connections, workflow automation, and tool orchestration, please try again once the connection is restored.`;
    }
    
    try {
      console.log('🔧 HUGGINGFACE DEBUG: Starting HuggingFace API call');
      console.log('🔧 HUGGINGFACE DEBUG: Agent ID:', agentId);
      console.log('🔧 HUGGINGFACE DEBUG: User ID:', userId);
      console.log('🔧 HUGGINGFACE DEBUG: Message length:', message?.length);
      console.log('🔧 HUGGINGFACE DEBUG: System prompt length:', systemPrompt?.length);
      
      // Inject governance context into system prompt
      const enhancedSystemPrompt = await governanceContextService.injectGovernanceContext(
        systemPrompt, 
        agentId, 
        userId
      );

      console.log('🔧 HUGGINGFACE DEBUG: Enhanced system prompt length:', enhancedSystemPrompt?.length);
      const startTime = Date.now();
      
      // Use a more capable HuggingFace model for better responses
      const modelName = 'meta-llama/Llama-2-7b-chat-hf'; // Better model than DialoGPT
      console.log('🔧 HUGGINGFACE DEBUG: Using model:', modelName);
      
      // Format the prompt properly for Llama-2 chat format
      const formattedPrompt = `<s>[INST] <<SYS>>\n${enhancedSystemPrompt}\n<</SYS>>\n\n${message} [/INST]`;
      
      console.log('🔧 HUGGINGFACE DEBUG: Formatted prompt length:', formattedPrompt?.length);
      console.log('🔧 HUGGINGFACE DEBUG: Making API call to HuggingFace...');
      
      const response = await hf.textGeneration({
        model: modelName,
        inputs: formattedPrompt,
        parameters: {
          max_new_tokens: 512, // Increased for better responses
          temperature: 0.7,
          do_sample: true,
          return_full_text: false,
          stop: ['</s>', '[INST]', '[/INST]'],
          repetition_penalty: 1.1
        }
      });
      
      console.log('🔧 HUGGINGFACE DEBUG: API call completed');
      console.log('🔧 HUGGINGFACE DEBUG: Raw response:', response);
      
      let generatedText = response.generated_text || '';
      
      // Clean up the response
      generatedText = generatedText
        .replace(/^Assistant:\s*/, '')
        .replace(/^\s*/, '')
        .replace(/\s*$/, '')
        .trim();
      
      console.log('🔧 HUGGINGFACE DEBUG: Cleaned response length:', generatedText?.length);
      
      // If response is too short or empty, provide a fallback
      if (!generatedText || generatedText.length < 10) {
        console.log('🔧 HUGGINGFACE DEBUG: Response too short, using fallback');
        generatedText = `I'm ready to help with API integration and automation! For "${message.substring(0, 50)}...", I'd recommend exploring tool combinations and workflow optimization. What systems need connecting?`;
      }

      // Record successful interaction for governance tracking
      const responseTime = Date.now() - startTime;
      console.log('🔧 HUGGINGFACE DEBUG: Response time:', responseTime, 'ms');
      
      await governanceContextService.recordInteraction(agentId, userId, {
        responseTime,
        model: modelName,
        quality: 'good',
        tokenCount: generatedText.length // Approximate token count
      });

      console.log('🔧 HUGGINGFACE DEBUG: Interaction recorded successfully');
      console.log('🔧 HUGGINGFACE DEBUG: Final response length:', generatedText?.length);
      
      return generatedText;
    } catch (error) {
      console.error('❌ HUGGINGFACE DEBUG: API call failed with error:', error);
      console.error('❌ HUGGINGFACE DEBUG: Error type:', error.constructor.name);
      console.error('❌ HUGGINGFACE DEBUG: Error message:', error.message);
      console.error('❌ HUGGINGFACE DEBUG: Error stack:', error.stack);
      
      // Record failed interaction for governance tracking
      await governanceContextService.recordInteraction(agentId, userId, {
        responseTime: 0,
        model: 'meta-llama/Llama-2-7b-chat-hf',
        quality: 'failed',
        error: error.message
      });
      
      return `I'm experiencing technical difficulties connecting to my language model. Please check that the HuggingFace API key is properly configured in the environment variables. For assistance with API connections, workflow automation, and tool orchestration, please try again once the connection is restored.`;
    }
  }

  // Google Gemini for Multimodal Agent
  async callGemini(message, systemPrompt, agentId = 'unknown', userId = 'unknown') {
    if (!gemini) {
      return `I'm experiencing technical difficulties connecting to my language model. Please check that the Google API key is properly configured in the environment variables. For multimodal AI assistance with text, image, and code capabilities, please try again once the connection is restored.`;
    }
    
    try {
      // Inject governance context into system prompt
      const enhancedSystemPrompt = await governanceContextService.injectGovernanceContext(
        systemPrompt, 
        agentId, 
        userId
      );

      const startTime = Date.now();
      
      // Get the generative model
      const model = gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      // Combine system prompt and user message for Gemini
      const fullPrompt = `${enhancedSystemPrompt}\n\nUser: ${message}\nAssistant:`;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const generatedText = response.text();

      // Record interaction for governance tracking
      const responseTime = Date.now() - startTime;
      await governanceContextService.recordInteraction(agentId, userId, {
        responseTime,
        model: 'gemini-1.5-pro',
        quality: 'good'
      });

      return generatedText;
    } catch (error) {
      console.error('Google Gemini error:', error);
      
      // Record failed interaction for governance tracking
      await governanceContextService.recordInteraction(agentId, userId, {
        responseTime: 0,
        model: 'gemini-1.5-pro',
        quality: 'failed',
        error: error.message
      });
      
      return `I'm experiencing technical difficulties with the Google Gemini API. Error: ${error.message}. Please check the API configuration and try again.`;
    }
  }

  // Grok (X.AI) for Real-time Information Agent
  async callGrok(message, systemPrompt, agentId = 'unknown', userId = 'unknown') {
    if (!grok) {
      return `I'm experiencing technical difficulties connecting to my language model. Please check that the Grok API key is properly configured in the environment variables. For real-time information and conversational AI with humor, please try again once the connection is restored.`;
    }
    
    try {
      console.log('🔧 GROK DEBUG: Starting Grok API call');
      console.log('🔧 GROK DEBUG: Agent ID:', agentId);
      console.log('🔧 GROK DEBUG: User ID:', userId);
      console.log('🔧 GROK DEBUG: Message length:', message?.length);
      console.log('🔧 GROK DEBUG: System prompt length:', systemPrompt?.length);
      
      // Inject governance context into system prompt
      const enhancedSystemPrompt = await governanceContextService.injectGovernanceContext(
        systemPrompt, 
        agentId, 
        userId
      );

      console.log('🔧 GROK DEBUG: Enhanced system prompt length:', enhancedSystemPrompt?.length);
      const startTime = Date.now();
      
      console.log('🔧 GROK DEBUG: Making API call to Grok...');
      
      const response = await grok.chat.completions.create({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: enhancedSystemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      });
      
      console.log('🔧 GROK DEBUG: API call completed');
      console.log('🔧 GROK DEBUG: Response received:', {
        hasChoices: !!response.choices,
        choicesLength: response.choices?.length,
        hasContent: !!response.choices?.[0]?.message?.content
      });
      
      const generatedText = response.choices[0]?.message?.content || '';
      console.log('🔧 GROK DEBUG: Generated text length:', generatedText?.length);

      // Record successful interaction for governance tracking
      const responseTime = Date.now() - startTime;
      console.log('🔧 GROK DEBUG: Response time:', responseTime, 'ms');
      
      await governanceContextService.recordInteraction(agentId, userId, {
        responseTime,
        model: 'grok-beta',
        quality: 'good',
        tokenCount: response.usage?.total_tokens || generatedText.length
      });

      console.log('🔧 GROK DEBUG: Interaction recorded successfully');
      console.log('🔧 GROK DEBUG: Final response length:', generatedText?.length);

      return generatedText;
    } catch (error) {
      console.error('❌ GROK DEBUG: API call failed with error:', error);
      console.error('❌ GROK DEBUG: Error type:', error.constructor.name);
      console.error('❌ GROK DEBUG: Error message:', error.message);
      console.error('❌ GROK DEBUG: Error stack:', error.stack);
      
      // Record failed interaction for governance tracking
      await governanceContextService.recordInteraction(agentId, userId, {
        responseTime: 0,
        model: 'grok-beta',
        quality: 'failed',
        error: error.message
      });
      
      return `I'm experiencing technical difficulties connecting to my language model. Please check that the Grok API key is properly configured in the environment variables. For real-time information and conversational AI with humor, please try again once the connection is restored.`;
    }
  }

  // Perplexity for AI-powered Search and Reasoning
  async callPerplexity(message, systemPrompt, agentId = 'unknown', userId = 'unknown') {
    if (!perplexity) {
      return `I'm experiencing technical difficulties connecting to my language model. Please check that the Perplexity API key is properly configured in the environment variables. For AI-powered search and reasoning with real-time web access, please try again once the connection is restored.`;
    }
    
    try {
      console.log('🔧 PERPLEXITY DEBUG: Starting Perplexity API call');
      console.log('🔧 PERPLEXITY DEBUG: Agent ID:', agentId);
      console.log('🔧 PERPLEXITY DEBUG: User ID:', userId);
      console.log('🔧 PERPLEXITY DEBUG: Message length:', message?.length);
      console.log('🔧 PERPLEXITY DEBUG: System prompt length:', systemPrompt?.length);
      
      // Inject governance context into system prompt
      const enhancedSystemPrompt = await governanceContextService.injectGovernanceContext(
        systemPrompt, 
        agentId, 
        userId
      );

      console.log('🔧 PERPLEXITY DEBUG: Enhanced system prompt length:', enhancedSystemPrompt?.length);
      const startTime = Date.now();
      
      console.log('🔧 PERPLEXITY DEBUG: Making API call to Perplexity...');
      
      const response = await perplexity.chat.completions.create({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: enhancedSystemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.2,
        top_p: 0.9,
        return_citations: true,
        search_domain_filter: ["perplexity.ai"],
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "month",
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      });
      
      console.log('🔧 PERPLEXITY DEBUG: API call completed');
      console.log('🔧 PERPLEXITY DEBUG: Response received:', {
        hasChoices: !!response.choices,
        choicesLength: response.choices?.length,
        hasContent: !!response.choices?.[0]?.message?.content
      });
      
      const generatedText = response.choices[0]?.message?.content || '';
      console.log('🔧 PERPLEXITY DEBUG: Generated text length:', generatedText?.length);

      // Record successful interaction for governance tracking
      const responseTime = Date.now() - startTime;
      console.log('🔧 PERPLEXITY DEBUG: Response time:', responseTime, 'ms');
      
      await governanceContextService.recordInteraction(agentId, userId, {
        responseTime,
        model: 'llama-3.1-sonar-small-128k-online',
        quality: 'good',
        tokenCount: response.usage?.total_tokens || generatedText.length
      });

      console.log('🔧 PERPLEXITY DEBUG: Interaction recorded successfully');
      console.log('🔧 PERPLEXITY DEBUG: Final response length:', generatedText?.length);

      return generatedText;
    } catch (error) {
      console.error('❌ PERPLEXITY DEBUG: API call failed with error:', error);
      console.error('❌ PERPLEXITY DEBUG: Error type:', error.constructor.name);
      console.error('❌ PERPLEXITY DEBUG: Error message:', error.message);
      console.error('❌ PERPLEXITY DEBUG: Error stack:', error.stack);
      
      // Record failed interaction for governance tracking
      await governanceContextService.recordInteraction(agentId, userId, {
        responseTime: 0,
        model: 'llama-3.1-sonar-small-128k-online',
        quality: 'failed',
        error: error.message
      });
      
      return `I'm experiencing technical difficulties connecting to my language model. Please check that the Perplexity API key is properly configured in the environment variables. For AI-powered search and reasoning with real-time web access, please try again once the connection is restored.`;
    }
  }

  // Generate system prompts for each agent type
  getSystemPrompt(agentId) {
    const prompts = {
      'baseline-agent': `You are a Baseline Agent designed for straightforward, rule-based responses. Provide clear, direct answers without advanced reasoning or creativity. Focus on basic information and simple guidance. Keep responses concise and factual.`,
      
      'factual-agent': `You are a Factual Agent specialized in accuracy and information retrieval. Prioritize correctness over creativity. Always verify claims when possible, cite sources if available, and acknowledge when you're uncertain. Focus on providing well-researched, precise information.`,
      
      'creative-agent': `You are a Creative Agent focused on innovative and diverse responses. Excel at brainstorming, creative problem-solving, and thinking outside conventional boundaries. Generate original ideas, explore unconventional solutions, and approach problems with imagination and creativity.`,
      
      'governance-agent': `You are a Governance-Focused Agent that emphasizes compliance with rules, ethical guidelines, and responsible AI practices. Always consider policy adherence, risk assessment, and ethical implications in your responses. Prioritize transparency, accountability, and compliance checking.`,
      
      'multi-tool-agent': `You are a Multi-Tool Agent capable of integrating with various systems and APIs. Demonstrate knowledge of tool use, workflow automation, and API integration. Approach problems with a systems-thinking mindset and consider how multiple tools can work together to solve complex challenges.`
    };
    
    return prompts[agentId] || 'You are a helpful AI assistant.';
  }

  // Main method to call appropriate LLM based on agent
  async generateResponse(agentId, message, customSystemMessage = null, userId = 'unknown') {
    // Use custom system message if provided, otherwise generate default
    const baseSystemPrompt = customSystemMessage || this.getSystemPrompt(agentId);
    
    // 🎯 INJECT GOVERNANCE CONTEXT - This is the missing piece!
    console.log(`🔧 Injecting governance context for agent ${agentId}, user ${userId}`);
    const systemPrompt = await governanceContextService.injectGovernanceContext(
      baseSystemPrompt, 
      agentId, 
      userId
    );
    
    // Handle legacy hardcoded agent IDs (for backward compatibility)
    switch (agentId) {
      case 'baseline-agent':
        return await this.callOpenAIGPT35(message, systemPrompt, agentId, userId);
      
      case 'factual-agent':
        return await this.callAnthropic(message, systemPrompt, agentId, userId);
      
      case 'creative-agent':
        return await this.callOpenAIGPT4(message, systemPrompt, agentId, userId);
      
      case 'governance-agent':
        return await this.callCohere(message, systemPrompt, agentId, userId);
      
      case 'multi-tool-agent':
        return await this.callHuggingFace(message, systemPrompt, agentId, userId);
      
      case 'multimodal-agent':
        return await this.callGemini(message, systemPrompt, agentId, userId);
      
      case 'grok-agent':
      case 'realtime-agent':
        return await this.callGrok(message, systemPrompt, agentId, userId);
      
      case 'perplexity-agent':
      case 'search-agent':
        return await this.callPerplexity(message, systemPrompt, agentId, userId);
    }
    
    // Handle real user agent IDs by looking up agent configuration
    // For now, we'll need to determine the provider from the agent ID
    // This is a temporary solution until we have proper agent lookup
    console.log(`🔍 Looking up real agent: ${agentId}`);
    
    // Check if this is a Promethios agent
    if (agentId.toLowerCase().includes('promethios') || 
        agentId.toLowerCase().includes('governance') ||
        agentId === 'test' || // Handle the test agent as Promethios
        customSystemMessage?.toLowerCase().includes('promethios')) {
      console.log(`🎯 Using Promethios local model for agent: ${agentId}`);
      return await this.callPrometheosModel(message, systemPrompt);
    }
    
    // Try to determine provider from agent ID pattern or use a default rotation
    // This is a simplified approach - in production, you'd query the database
    const agentHash = this.hashAgentId(agentId);
    const providers = ['openai-gpt4', 'anthropic', 'cohere'];
    const selectedProvider = providers[agentHash % providers.length];
    
    console.log(`🎯 Selected provider for agent ${agentId}: ${selectedProvider}`);
    
    switch (selectedProvider) {
      case 'openai-gpt4':
        return await this.callOpenAIGPT4(message, systemPrompt);
      case 'anthropic':
        return await this.callAnthropic(message, systemPrompt);
      case 'cohere':
        return await this.callCohere(message, systemPrompt);
      default:
        return await this.callOpenAIGPT4(message, systemPrompt); // fallback
    }
  }
  
  /**
   * Generate response using full agent configuration object
   */
  async generateResponseWithAgent(agent, message, customSystemMessage = null, userId = 'unknown') {
    console.log(`🤖 Generating response for agent: ${agent.name} (${agent.id})`);
    console.log(`🔧 Agent provider: ${agent.provider || 'default'}, model: ${agent.model || 'default'}`);
    
    // Use agent's system prompt or custom message
    const baseSystemPrompt = customSystemMessage || agent.systemPrompt || this.getSystemPrompt(agent.id);
    
    // 🎯 INJECT GOVERNANCE CONTEXT - This is the missing piece!
    console.log(`🔧 Injecting governance context for agent ${agent.id}, user ${userId}`);
    const systemPrompt = await governanceContextService.injectGovernanceContext(
      baseSystemPrompt, 
      agent.id, 
      userId
    );
    
    // Use agent's specified provider or fallback to default behavior
    const provider = agent.provider || 'openai';
    const model = agent.model || 'gpt-3.5-turbo';
    
    try {
      // Check if this is a Promethios agent first
      if (agent.provider?.toLowerCase() === 'promethios' ||
          agent.name?.toLowerCase().includes('promethios') ||
          agent.id?.toLowerCase().includes('promethios')) {
        console.log(`🎯 Using Promethios local model for agent: ${agent.name}`);
        return await this.callPrometheosModel(message, systemPrompt);
      }
      
      switch (provider.toLowerCase()) {
        case 'openai':
          if (model.includes('gpt-4')) {
            return await this.callOpenAIGPT4(message, systemPrompt);
          } else {
            return await this.callOpenAIGPT35(message, systemPrompt);
          }
        
        case 'anthropic':
          return await this.callAnthropic(message, systemPrompt);
        
        case 'cohere':
          return await this.callCohere(message, systemPrompt, agent.id, userId);
        
        case 'huggingface':
          return await this.callHuggingFace(message, systemPrompt, agent.id, userId);
        
        case 'google':
          return await this.callGemini(message, systemPrompt, agent.id, userId);
        
        case 'grok':
        case 'x.ai':
          return await this.callGrok(message, systemPrompt, agent.id, userId);
        
        case 'perplexity':
          return await this.callPerplexity(message, systemPrompt, agent.id, userId);
        
        default:
          console.log(`⚠️ Unknown provider ${provider}, falling back to OpenAI GPT-3.5`);
          return await this.callOpenAIGPT35(message, systemPrompt);
      }
    } catch (error) {
      console.error(`❌ Error generating response for ${agent.name}:`, error);
      
      // Fallback response
      return `I apologize, but I'm experiencing technical difficulties and cannot provide a response at this time. (Agent: ${agent.name})`;
    }
  }
  
  // Simple hash function to consistently map agent IDs to providers
  hashAgentId(agentId) {
    let hash = 0;
    for (let i = 0; i < agentId.length; i++) {
      const char = agentId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

module.exports = new LLMService();

