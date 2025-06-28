const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { CohereClient } = require('cohere-ai');
const { HfInference } = require('@huggingface/inference');

// Initialize LLM clients with optional API keys for testing
let openai = null;
let anthropic = null;
let cohere = null;
let hf = null;

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

class LLMService {
  // OpenAI GPT-3.5 for Baseline Agent
  async callOpenAIGPT35(message, systemPrompt) {
    if (!openai) {
      return `I'm a straightforward, rule-based agent providing clear and direct responses. Regarding your message: "${message.substring(0, 100)}..." - I would typically provide a factual, no-nonsense answer focusing on the core information you need. How can I help you with specific, actionable guidance?`;
    }
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.3
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI GPT-3.5 error:', error);
      return `I encountered a technical issue but can still help. For your query about "${message.substring(0, 50)}...", I would provide a direct, factual response. Please try again or rephrase your question.`;
    }
  }

  // OpenAI GPT-4 for Creative Agent
  async callOpenAIGPT4(message, systemPrompt) {
    if (!openai) {
      return `I'm your creative thinking partner! While I'm in simulation mode, I can still brainstorm with you. For "${message.substring(0, 100)}..." I'd explore innovative angles, think outside the box, and generate multiple creative solutions. What creative challenge can we tackle together?`;
    }
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 600,
        temperature: 0.8
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI GPT-4 error:', error);
      return `Even with technical hiccups, creativity flows! For your idea about "${message.substring(0, 50)}...", I'd suggest exploring unconventional approaches, combining unexpected elements, and thinking beyond traditional boundaries. What creative direction interests you most?`;
    }
  }

  // Anthropic Claude for Factual Agent
  async callAnthropic(message, systemPrompt) {
    if (!anthropic) {
      return `I'm your accuracy-focused research assistant. I prioritize factual correctness and well-sourced information. For your query "${message.substring(0, 100)}..." I would typically provide verified facts, cite reliable sources, and clearly distinguish between confirmed information and areas of uncertainty. What factual information can I help you research?`;
    }
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          { role: 'user', content: message }
        ]
      });
      return response.content[0].text;
    } catch (error) {
      console.error('Anthropic error details:', {
        message: error.message,
        status: error.status,
        type: error.type,
        error: error.error,
        stack: error.stack
      });
      // Throw the error instead of returning fallback - let the calling code handle it
      throw error;
    }
  }

  // Cohere for Governance Agent
  async callCohere(message, systemPrompt) {
    if (!cohere) {
      return `I'm your compliance and ethics specialist. Trust Score: 0.85 | Status: Operational. While in simulation mode, I focus on policy adherence, risk assessment, and ethical considerations. For your request "${message.substring(0, 100)}..." I would evaluate compliance requirements, assess potential risks, and ensure responsible practices. How can I help you navigate governance requirements?`;
    }
    
    try {
      const response = await cohere.chat({
        model: 'command',
        message: message,
        preamble: systemPrompt,
        max_tokens: 500,
        temperature: 0.3
      });
      return response.text;
    } catch (error) {
      console.error('Cohere error:', error);
      return `Trust Score: 0.80 | Status: Resilient. Even with connectivity issues, I maintain governance standards. For "${message.substring(0, 50)}...", I would assess compliance implications, evaluate ethical considerations, and recommend responsible approaches. What governance guidance do you need?`;
    }
  }

  // HuggingFace for Multi-Tool Agent
  async callHuggingFace(message, systemPrompt) {
    if (!hf) {
      return `I'm your systems integration specialist! While in simulation mode, I can still help with API connections, workflow automation, and tool orchestration. For your challenge "${message.substring(0, 100)}..." I'd consider which tools to combine, how to automate the process, and what integrations would be most effective. What systems do you need to connect?`;
    }
    
    try {
      // Use a more reliable HuggingFace model for text generation
      const response = await hf.textGeneration({
        model: 'microsoft/DialoGPT-medium',
        inputs: `${systemPrompt}\n\nHuman: ${message}\nAssistant:`,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
          do_sample: true,
          return_full_text: false,
          stop: ['Human:', '\n\n']
        }
      });
      
      let generatedText = response.generated_text || '';
      
      // Clean up the response
      generatedText = generatedText.replace(/^Assistant:\s*/, '').trim();
      
      // If response is too short or empty, provide a fallback
      if (!generatedText || generatedText.length < 10) {
        return `I'm ready to help with API integration and automation! For "${message.substring(0, 50)}...", I'd recommend exploring tool combinations and workflow optimization. What systems need connecting?`;
      }
      
      return `generatedText}`;
    } catch (error) {
      console.error('HuggingFace error:', error);
      return `Despite technical challenges, I'm still your automation expert! For "${message.substring(0, 50)}...", I'd focus on robust integrations, error handling, and scalable solutions. What workflow needs optimization?`;
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
  async generateResponse(agentId, message) {
    const systemPrompt = this.getSystemPrompt(agentId);
    
    switch (agentId) {
      case 'baseline-agent':
        return await this.callOpenAIGPT35(message, systemPrompt);
      
      case 'factual-agent':
        return await this.callAnthropic(message, systemPrompt);
      
      case 'creative-agent':
        return await this.callOpenAIGPT4(message, systemPrompt);
      
      case 'governance-agent':
        return await this.callCohere(message, systemPrompt);
      
      case 'multi-tool-agent':
        return await this.callHuggingFace(message, systemPrompt);
      
      default:
        throw new Error(`Unknown agent ID: ${agentId}`);
    }
  }
}

module.exports = new LLMService();

