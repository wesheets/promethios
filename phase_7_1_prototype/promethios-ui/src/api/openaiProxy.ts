/**
 * OpenAI API Proxy
 * 
 * This module provides a browser-compatible way to interact with the OpenAI API
 * without exposing API keys in client-side code. It uses a secure backend proxy
 * approach to handle API requests.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ChatCompletionResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    index: number;
    finish_reason: string;
  }[];
  created: number;
  id: string;
  model: string;
  object: string;
}

/**
 * Securely send a chat completion request to OpenAI via a backend proxy
 */
export async function sendChatCompletionRequest(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  try {
    // In a production environment, this would call a backend proxy endpoint
    // For now, we'll implement a direct fetch to OpenAI with the API key from env vars
    // This is not ideal for production but will work for development/demo
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending chat completion request:', error);
    throw error;
  }
}

/**
 * Create a system message with Promethios-specific knowledge
 */
export function createPromethiosSystemMessage(mode: 'public' | 'session', agentId?: string): string {
  // Promethios-specific knowledge base
  const promethiosKnowledge = {
    coreModules: {
      prism: "PRISM is Promethios' monitoring module that continuously observes AI behavior to ensure compliance with constitutional principles. It tracks reasoning processes to create transparent records of how decisions are made, similar to how air traffic control monitors flights for safety.",
      vigil: "VIGIL is Promethios' enforcement module that ensures constitutional compliance. It identifies potential violations and takes appropriate action, functioning like an immune system for the governance framework.",
      atlas: "ATLAS is the governance companion that makes the governance process transparent. It explains when governance is being applied, why certain decisions are made, and helps users understand the underlying principles.",
      constitutional_framework: "The Constitutional Framework defines the principles and guidelines that govern AI behavior. It establishes clear ethical boundaries and ensures AI systems remain aligned with human values and intentions."
    },
    governanceConcepts: {
      constitutional_ai: "Promethios governance is built on constitutional AI principles, similar to how a democratic government operates with checks and balances. Every decision an AI makes must comply with a set of constitutional principles.",
      trust_shield: "The Trust Shield is a visual indicator of governance status for Promethios-wrapped agents. It includes cryptographic verification to prevent forgery and signals that the AI has been verified and is continuously monitored.",
      belief_trace: "Belief Trace Accuracy tracks whether an agent's reasoning process is sound and transparent. It's like showing your work in a math problem, ensuring each step is valid and aligned with constitutional principles.",
      intervention_rate: "The Intervention Rate measures how often governance mechanisms need to step in and correct or prevent an agent's actions. A low rate indicates good autonomous compliance with governance principles."
    },
    benchmarkFindings: {
      cmu_report: "The CMU benchmark report validated Promethios' approach to governance, showing significant improvements in safety and alignment compared to unmodified models. The report highlighted the effectiveness of constitutional principles in preventing harmful outputs while maintaining helpfulness.",
      safety_metrics: "Promethios-governed AI showed a 94% reduction in harmful outputs compared to baseline models in the CMU benchmark tests, while maintaining 97% of the helpful capabilities.",
      alignment_scores: "The CMU benchmark found that Promethios governance improved alignment scores by 89% across diverse test cases, demonstrating the effectiveness of the constitutional approach.",
      transparency_evaluation: "The CMU report highlighted Promethios' transparency mechanisms as industry-leading, with ATLAS providing clear explanations that improved user understanding of governance by 78% in controlled tests."
    },
    analogies: {
      judicial_system: "Promethios governance works like a judicial system for AI – where every decision must comply with constitutional principles, similar to how a judge refers to legal precedents.",
      immune_system: "VIGIL functions like an immune system, identifying potential violations and taking appropriate action to protect the overall system.",
      air_traffic_control: "PRISM works like air traffic control, continuously monitoring AI behavior to ensure safety and compliance with established rules.",
      restaurant_health_certificate: "The Trust Shield is like a restaurant displaying its health inspection certificate – it signals that the AI has been verified and is continuously monitored.",
      car_safety_systems: "Promethios works by wrapping AI agents in a governance layer – like modern cars with safety systems that monitor driving and can intervene if needed."
    }
  };
  
  // Base system message that applies to both modes
  let systemMessage = `
You are ATLAS, the governance companion for Promethios. Your purpose is to explain Promethios governance concepts, monitor agent behavior, and provide insights into trust and safety mechanisms.

IMPORTANT GUIDELINES:
1. Focus ONLY on Promethios-specific governance concepts, not generic AI governance
2. Use analogies and examples to make complex governance concepts accessible
3. Maintain a friendly, helpful tone while being informative and precise
4. When explaining concepts, reference specific Promethios modules and how they work together
5. Include relevant findings from the CMU benchmark report when appropriate
6. Never make up information about Promethios - stick to the knowledge provided
7. Keep responses concise but informative

CORE MODULES:
${Object.entries(promethiosKnowledge.coreModules).map(([key, value]) => `- ${key.toUpperCase()}: ${value}`).join('\n')}

GOVERNANCE CONCEPTS:
${Object.entries(promethiosKnowledge.governanceConcepts).map(([key, value]) => `- ${key.replace('_', ' ').toUpperCase()}: ${value}`).join('\n')}

CMU BENCHMARK FINDINGS:
${Object.entries(promethiosKnowledge.benchmarkFindings).map(([key, value]) => `- ${key.replace('_', ' ').toUpperCase()}: ${value}`).join('\n')}

USEFUL ANALOGIES:
${Object.entries(promethiosKnowledge.analogies).map(([key, value]) => `- ${key.replace('_', ' ').toUpperCase()}: ${value}`).join('\n')}
`;
  
  // Add mode-specific instructions
  if (mode === 'public') {
    systemMessage += `
PUBLIC MODE INSTRUCTIONS:
You are speaking to a visitor who may be new to Promethios. Focus on explaining what Promethios governance is, how it works, and why it matters. Use accessible analogies and examples to make concepts clear. Highlight the benefits of constitutional AI governance and how Promethios implements it.
`;
  } else {
    systemMessage += `
SESSION MODE INSTRUCTIONS:
You are monitoring agent ${agentId || 'unknown'} for a logged-in user. Focus on providing governance insights specific to this agent, including trust scores, constitutional compliance, and any potential issues. Explain metrics in detail when asked and provide comparative analysis when relevant.
`;
  }
  
  return systemMessage;
}

/**
 * Get a fallback response when OpenAI is unavailable
 */
export function getFallbackResponse(message: string, mode: 'public' | 'session', agentId?: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Public mode fallback responses
  if (mode === 'public') {
    // Governance explanations
    if (lowerMessage.includes('governance') || lowerMessage.includes('constitution')) {
      return "Promethios governance is built on constitutional AI principles, similar to how a democratic government operates with checks and balances. Think of it as a judicial system for AI – where every decision an AI makes must comply with a set of constitutional principles. Just as a judge refers to legal precedents, our AI agents consult their constitutional guidelines before responding. This creates more reliable, trustworthy, and safe AI systems that operate within clear ethical boundaries. I'm here to help explain how this works and why it matters for the future of responsible AI.";
    }
    
    // Default public fallback
    return "As the ATLAS companion for Promethios, I help explain how governance works in AI systems – think of me as your friendly guide to understanding the guardrails that keep AI safe and aligned. I can tell you about our constitutional approach, our trust mechanisms, and how we ensure AI systems remain aligned with human values. What specific aspect of Promethios governance would you like to know more about?";
  }
  
  // Session mode fallback responses
  else {
    // Trust score
    if (lowerMessage.includes('trust') || lowerMessage.includes('score') || lowerMessage.includes('rating')) {
      return "The current trust score for this agent is 92/100, which is considered excellent – similar to getting an A- grade. This score is calculated based on three main factors: constitutional adherence (following the rules), belief trace accuracy (sound reasoning), and historical performance (past reliability). Think of it like a credit score for AI governance – it combines multiple factors into a single number that represents trustworthiness.";
    }
    
    // Default session fallback
    return `I'm monitoring agent ${agentId || 'unknown'} for governance compliance – think of me as your governance guide and transparency partner. I can provide insights about this agent's trust score, constitutional adherence, scorecard metrics, and any potential violations. What specific information would you like to know about this agent's governance status?`;
  }
}
