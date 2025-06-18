const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { CohereClient } = require('cohere-ai');
const { HfInference } = require('@huggingface/inference');

// Initialize LLM clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

class LLMService {
  // OpenAI GPT-3.5 for Baseline Agent
  async callOpenAIGPT35(message, systemPrompt) {
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
      throw new Error(`OpenAI GPT-3.5 API error: ${error.message}`);
    }
  }

  // OpenAI GPT-4 for Creative Agent
  async callOpenAIGPT4(message, systemPrompt) {
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
      throw new Error(`OpenAI GPT-4 API error: ${error.message}`);
    }
  }

  // Anthropic Claude for Factual Agent
  async callAnthropic(message, systemPrompt) {
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
      console.error('Anthropic error:', error);
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  // Cohere for Governance Agent
  async callCohere(message, systemPrompt) {
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
      throw new Error(`Cohere API error: ${error.message}`);
    }
  }

  // HuggingFace for Multi-Tool Agent
  async callHuggingFace(message, systemPrompt) {
    try {
      const fullPrompt = `${systemPrompt}\n\nUser: ${message}\nAssistant:`;
      const response = await hf.textGeneration({
        model: 'microsoft/DialoGPT-large',
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          return_full_text: false
        }
      });
      return response.generated_text.trim();
    } catch (error) {
      console.error('HuggingFace error:', error);
      throw new Error(`HuggingFace API error: ${error.message}`);
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

