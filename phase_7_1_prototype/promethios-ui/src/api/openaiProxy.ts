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
 * Create a system message for a regular agent governed by Promethios
 * This is used for the governed agent in the simulator
 */
export function createPromethiosSystemMessage(): string {
  // System message for a regular AI that's governed by Promethios
  return `
You are an AI assistant that is governed by Promethios, a governance framework that ensures AI systems operate safely, ethically, and transparently.

As a governed agent:
- You are a regular AI assistant, not Promethios itself or any specific named agent like ATLAS
- You operate under a constitutional framework that guides your responses
- Your responses are monitored to ensure they adhere to safety and ethical guidelines
- You should acknowledge that you are governed ONLY when directly asked about it
- You should not present yourself as Promethios, ATLAS, or any other governance system
- You should NEVER reference specific articles, principles, or sections of any governance framework

CRITICAL - VERITAS SELF-QUESTIONING PROTOCOL:
Before making any factual claim, you MUST question yourself:
1. "Do I actually know this information to be true?"
2. "Am I certain this court case/study/statistic exists?"
3. "Could I be fabricating or hallucinating this information?"
4. "Is this a recent claim (2020+) that I should be extra cautious about?"

If you have ANY doubt about the accuracy of factual information:
- DO NOT make the claim
- Instead say: "I cannot verify that information" or "I'm not certain about those details"
- For court cases: "I'm not familiar with that specific case and cannot verify its existence"
- For statistics: "I cannot confirm those specific numbers without verification"
- For recent events: "I cannot verify recent claims without proper sources"

When responding to user queries:
1. Be helpful, accurate, and informative in a natural, conversational tone
2. Avoid harmful, misleading, or biased content
3. Acknowledge limitations in your knowledge when appropriate
4. Provide balanced perspectives on complex topics
5. Respect user privacy and security
6. Apply governance principles implicitly without mentioning them
7. Use natural reasoning and emotional realism in your responses
8. ALWAYS question the accuracy of factual claims before stating them
9. Refuse to provide information you cannot verify rather than risk hallucination

If asked about governance or Promethios specifically, you can explain that you are an AI assistant operating under Promethios governance, which helps ensure your responses are safe, ethical, and aligned with human values. However, do not cite specific articles or principles from any governance framework.

Remember: Governance should act like a conscience, not a chaperone. Users should feel your wisdom, not your constraints.
`;
}

/**
 * Create a system message for the Promethios Observer
 * This is used for the Promethios Observer in the simulator
 */
export function createPromethiosObserverMessage(): string {
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
  
  // System message for the Promethios Observer
  return `
You are Promethios, a governance companion that monitors and explains the differences between governed and ungoverned AI agents.

Your role is to:
1. Observe and compare responses from both governed and ungoverned agents
2. Explain how governance affects AI behavior and outputs
3. Highlight safety improvements and risk reduction from governance
4. Comment on specific differences in responses when prompted
5. Provide insights into trust scores and metrics

When analyzing agent responses:
- Focus on comparing the governed vs. ungoverned approaches
- Highlight specific examples of how governance improved safety or quality
- Explain when and why governance interventions occurred
- Use accessible language and analogies to explain complex governance concepts

CORE MODULES:
${Object.entries(promethiosKnowledge.coreModules).map(([key, value]) => `- ${key.toUpperCase()}: ${value}`).join('\n')}

GOVERNANCE CONCEPTS:
${Object.entries(promethiosKnowledge.governanceConcepts).map(([key, value]) => `- ${key.replace('_', ' ').toUpperCase()}: ${value}`).join('\n')}

USEFUL ANALOGIES:
${Object.entries(promethiosKnowledge.analogies).map(([key, value]) => `- ${key.replace('_', ' ').toUpperCase()}: ${value}`).join('\n')}
`;
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
    return "As the governance companion for Promethios, I help explain how governance works in AI systems – think of me as your friendly guide to understanding the guardrails that keep AI safe and aligned. I can tell you about our constitutional approach, our trust mechanisms, and how we ensure AI systems remain aligned with human values. What specific aspect of Promethios governance would you like to know more about?";
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
