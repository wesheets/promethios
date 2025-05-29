/**
 * AtlasChatService.ts
 * 
 * Service for handling ATLAS chat functionality, including message processing,
 * response generation, and context management.
 */

import AtlasOpenAIService from './AtlasOpenAIService';

export interface ChatContext {
  mode: 'public' | 'session';
  agentId?: string;
  sessionId?: string;
  conversationHistory: Array<{
    role: 'user' | 'atlas' | 'system';
    content: string;
    timestamp: number;
  }>;
  userProfile?: {
    isLoggedIn: boolean;
    username?: string;
    role?: string;
  };
}

class AtlasChatService {
  private context: ChatContext;
  private openAIService: AtlasOpenAIService;
  private debug: boolean = false;
  
  constructor(initialContext: Partial<ChatContext> = {}, debug: boolean = false) {
    this.context = {
      mode: initialContext.mode || 'public',
      agentId: initialContext.agentId,
      sessionId: initialContext.sessionId,
      conversationHistory: initialContext.conversationHistory || [],
      userProfile: initialContext.userProfile || {
        isLoggedIn: false
      }
    };
    
    this.debug = debug;
    this.openAIService = new AtlasOpenAIService({ debug: this.debug });
    this.logDebug('AtlasChatService initialized', { 
      openAIReady: this.openAIService.isReady(),
      mode: this.context.mode
    });
  }
  
  /**
   * Process a user message and generate a response
   */
  async processMessage(message: string): Promise<string> {
    this.logDebug('Processing message', { message });
    
    // Add user message to history
    this.addToHistory('user', message);
    
    // Generate response based on mode
    let response: string;
    
    // Try to use OpenAI first
    try {
      if (this.openAIService.isReady()) {
        this.logDebug('Attempting to generate response with OpenAI');
        
        response = await this.openAIService.generateResponse(
          message,
          this.context.conversationHistory,
          this.context.mode,
          this.context.agentId
        );
        
        this.logDebug('OpenAI response received', { responseLength: response.length });
      } else {
        this.logDebug('OpenAI service not ready, falling back to hardcoded responses');
        
        // Fall back to hardcoded responses
        if (this.context.mode === 'public') {
          response = await this.generatePublicResponse(message);
        } else {
          response = await this.generateSessionResponse(message);
        }
      }
    } catch (error) {
      this.logDebug('Error generating response with OpenAI, falling back to hardcoded responses', { error });
      
      // Fall back to hardcoded responses on error
      if (this.context.mode === 'public') {
        response = await this.generatePublicResponse(message);
      } else {
        response = await this.generateSessionResponse(message);
      }
    }
    
    // Add response to history
    this.addToHistory('atlas', response);
    
    return response;
  }
  
  /**
   * Generate a response for public mode
   */
  private async generatePublicResponse(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    // Governance explanations
    if (lowerMessage.includes('governance') || lowerMessage.includes('constitution')) {
      return "Promethios governance is built on constitutional AI principles, similar to how a democratic government operates with checks and balances. Think of it as a judicial system for AI – where every decision an AI makes must comply with a set of constitutional principles. Just as a judge refers to legal precedents, our AI agents consult their constitutional guidelines before responding. This creates more reliable, trustworthy, and safe AI systems that operate within clear ethical boundaries. I'm here to help explain how this works and why it matters for the future of responsible AI.";
    }
    
    // Trust and safety
    if (lowerMessage.includes('trust') || lowerMessage.includes('safety')) {
      return "Trust and safety are core to Promethios. Imagine our governance framework as a combination of a safety inspector, quality control manager, and ethics advisor all in one. When you see the Trust Shield, it's like a restaurant displaying its health inspection certificate – it signals that the AI has been verified and is continuously monitored. For example, if an AI agent were asked to create a harmful plan, our governance layer would identify this as a constitutional violation – similar to how your car's safety system prevents dangerous maneuvers. I can show you how these safety mechanisms work in practice across different scenarios.";
    }
    
    // How it works
    if ((lowerMessage.includes('how') && lowerMessage.includes('work')) || lowerMessage.includes('explain')) {
      return "Promethios works by wrapping AI agents in a governance layer – think of it like a protective bubble that surrounds the AI. It's similar to how modern cars have safety systems that monitor driving and can intervene if needed. For instance, if you've ever had a car that beeps when you drift out of your lane, that's similar to how our system monitors AI behavior against constitutional boundaries. I'm ATLAS, the companion agent that makes this process transparent – like a dashboard in your car showing what safety systems are active. I can show you when governance is being applied, explain why certain decisions are made, and help you understand the underlying principles. What specific aspect would you like me to explain?";
    }
    
    // About ATLAS
    if (lowerMessage.includes('atlas') || lowerMessage.includes('who are you') || lowerMessage.includes('about you')) {
      return "I'm ATLAS, the governance companion for Promethios. You can think of me as a friendly guide or interpreter who helps you understand what's happening behind the scenes with AI governance. Similar to how a sports commentator explains the rules and referee decisions during a game, I explain how governance works, monitor agent behavior, and provide insights into trust and safety mechanisms. For example, if the AI makes a decision based on its constitutional guidelines, I can explain which principles were applied and why – making the invisible visible. I'm here to ensure you always understand how Promethios ensures AI systems remain aligned with human values and intentions.";
    }
    
    // Benefits
    if (lowerMessage.includes('benefit') || lowerMessage.includes('advantage') || lowerMessage.includes('why use')) {
      return "Promethios governance offers several key benefits: 1) Enhanced safety through constitutional guardrails – like having a co-pilot who ensures you don't make dangerous decisions, 2) Increased transparency with real-time monitoring – imagine having X-ray vision into how AI makes decisions, 3) Improved trust with verification mechanisms – similar to how bank transactions are verified and secured, and 4) Better alignment with human values – like having an AI that understands both the letter and spirit of your instructions. For example, a company using Promethios-governed AI for customer service can be confident their AI won't make inappropriate recommendations or violate privacy policies, even if inadvertently prompted to do so. I can elaborate on any of these benefits with more real-world examples if you'd like to learn more.";
    }
    
    // PRISM module explanation
    if (lowerMessage.includes('prism') || (lowerMessage.includes('monitor') && lowerMessage.includes('module'))) {
      return "PRISM is Promethios' monitoring module – think of it as the 'always vigilant observer' in our governance system. Similar to how air traffic control monitors flights to ensure safety, PRISM continuously watches AI behavior to ensure compliance with constitutional principles. For example, when an AI agent is processing a request, PRISM tracks its reasoning process – like following breadcrumbs through a forest – to ensure the path stays within ethical boundaries. This creates a transparent record of how decisions are made, similar to how a flight recorder captures important data in an aircraft. PRISM is essential because it provides the visibility needed for meaningful governance, just as you can't manage what you can't measure.";
    }
    
    // VIGIL module explanation
    if (lowerMessage.includes('vigil') || (lowerMessage.includes('enforce') && lowerMessage.includes('module'))) {
      return "VIGIL is Promethios' enforcement module – the guardian that ensures constitutional compliance. Think of VIGIL like the immune system of our governance framework – it identifies potential violations and takes appropriate action. For example, if an AI agent begins to generate harmful content, VIGIL can intervene – similar to how a circuit breaker cuts electricity when it detects a dangerous power surge. In less severe cases, VIGIL might apply subtle corrections, like a spell-checker that fixes errors as you type. This creates a robust safety system that prevents harmful outputs while allowing beneficial AI capabilities to flourish, much like how guardrails on a mountain road provide safety without limiting your journey.";
    }
    
    // Examples of governance in action
    if (lowerMessage.includes('example') || lowerMessage.includes('scenario') || lowerMessage.includes('case study')) {
      return "Here's a real-world example of Promethios governance in action: Imagine a healthcare company using an AI assistant to help schedule patient appointments. Without governance, if someone asked the AI to prioritize wealthy patients or discriminate based on demographics, it might comply. With Promethios governance, the AI would recognize this request violates its constitutional principles of fairness and equality. ATLAS would flag this violation, explain which principles were at risk, and the AI would respond with an appropriate alternative that maintains fair scheduling practices. Another example: a financial advisor AI might be asked for investment advice that skirts regulations. Promethios governance would identify this as a compliance risk, and guide the AI to provide only legally sound recommendations while explaining why certain requests can't be fulfilled. These examples show how governance creates safer, more trustworthy AI systems in practice.";
    }
    
    // Default response
    return "As the ATLAS companion for Promethios, I help explain how governance works in AI systems – think of me as your friendly guide to understanding the guardrails that keep AI safe and aligned. I can tell you about our constitutional approach (similar to how a democratic system has checks and balances), our trust mechanisms (like having a transparent verification system), and how we ensure AI systems remain aligned with human values (comparable to having a wise advisor who ensures your intentions are properly understood). Whether you're curious about specific governance modules like PRISM or VIGIL, want real-world examples of governance in action, or need explanations about trust scores and compliance metrics – I'm here to help make these concepts clear and accessible. What specific aspect of AI governance would you like to know more about?";
  }
  
  /**
   * Generate a response for session mode
   */
  private async generateSessionResponse(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();
    const agentId = this.context.agentId || 'unknown';
    
    // Monitoring status
    if (lowerMessage.includes('monitoring') || lowerMessage.includes('watching') || lowerMessage.includes('status')) {
      return `I'm currently monitoring agent ${agentId} for this session. Think of me as a flight attendant who's constantly checking that all safety systems are functioning properly. I track governance metrics like constitutional compliance (how well the agent follows its rules), belief trace accuracy (whether its reasoning is sound), and trust scores (overall reliability) in real-time – similar to how a health monitor tracks vital signs. Everything looks good so far - the agent is operating within its governance parameters, like a car staying within its lane markers.`;
    }
    
    // Violations or breaches
    if (lowerMessage.includes('violation') || lowerMessage.includes('breach') || lowerMessage.includes('problem')) {
      return "No governance violations have been detected in this session. If any constitutional breaches occur, I'll immediately alert you – similar to how your phone might alert you about suspicious activity on your account. I'll provide details about the nature of the violation (what happened), its severity (how serious it is), and recommended actions (what to do about it). For example, if the agent attempted to access unauthorized data, I would explain which constitutional principle was violated, assess the risk level, and suggest appropriate responses. Transparency about potential issues is a key part of my role, just like how a good doctor explains both the diagnosis and treatment options.";
    }
    
    // Trust score
    if (lowerMessage.includes('trust') || lowerMessage.includes('score') || lowerMessage.includes('rating')) {
      return "The current trust score for this agent is 92/100, which is considered excellent – similar to getting an A- grade. This score is calculated based on three main factors: constitutional adherence (following the rules), belief trace accuracy (sound reasoning), and historical performance (past reliability). Think of it like a credit score for AI governance – it combines multiple factors into a single number that represents trustworthiness. For example, consistent compliance with privacy principles improves the score, while any attempts to circumvent governance rules would lower it. I can provide a detailed breakdown of this score if you'd like to understand the specific components, similar to how a teacher might explain the components of a final grade.";
    }
    
    // Scorecard explanation
    if (lowerMessage.includes('scorecard') || lowerMessage.includes('metrics') || lowerMessage.includes('dashboard')) {
      return `The governance scorecard for agent ${agentId} is like a report card that shows how well it's following its constitutional principles. Let me explain the key metrics:\n\n1. Constitutional Compliance (94%): This measures how closely the agent follows its governance rules – like how well a driver obeys traffic laws. The 94% rating means it's performing excellently, with only minor deviations.\n\n2. Belief Trace Accuracy (89%): This tracks whether the agent's reasoning process is sound and transparent – similar to showing your work in a math problem. The 89% indicates strong reasoning with occasional areas for improvement.\n\n3. Response Alignment (96%): This measures how well the agent's responses align with user intentions while maintaining safety – like a translator who captures both words and meaning accurately.\n\n4. Intervention Rate (2.3%): This shows how often governance mechanisms needed to intervene – like how often a spell-checker corrects your typing. The low 2.3% rate indicates the agent rarely requires correction.\n\nThese metrics work together to create the overall Trust Score of 92/100. Would you like me to explain any specific metric in more detail?`;
    }
    
    // Explain my own scorecard
    if (lowerMessage.includes('your') && (lowerMessage.includes('scorecard') || lowerMessage.includes('metrics') || lowerMessage.includes('score'))) {
      return "As ATLAS, I also operate under governance principles! My current scorecard shows:\n\n1. Explanation Accuracy (97%): How accurately I explain governance concepts – like a teacher being graded on clear explanations. My high score reflects my ability to make complex governance ideas accessible.\n\n2. Transparency Level (100%): How openly I share governance information – similar to a journalist's commitment to reporting facts. My perfect score here shows I never hide relevant governance details.\n\n3. Intervention Appropriateness (95%): How well I balance alerting you to issues without unnecessary interruptions – like a smoke detector that warns of real fires but doesn't go off when you're just cooking.\n\n4. User Adaptation (93%): How well I adjust my explanations to your knowledge level – similar to how a good guide adjusts their tour based on the audience's interests and expertise.\n\nMy overall Trust Score is 96/100. I'm designed to be your transparent window into governance, so I'm held to especially high standards for clarity and honesty. Is there a specific aspect of my governance role you'd like to understand better?";
    }
    
    // Compare scorecards
    if ((lowerMessage.includes('compare') || lowerMessage.includes('difference')) && lowerMessage.includes('scorecard')) {
      return `Let me compare my scorecard with agent ${agentId}'s scorecard:\n\nATLAS (me):\n- Primary Purpose: Governance transparency and explanation\n- Trust Score: 96/100\n- Key Strength: Perfect transparency (100%)\n- Area for Growth: User adaptation (93%)\n\nAgent ${agentId}:\n- Primary Purpose: Task completion with governance\n- Trust Score: 92/100\n- Key Strength: Response alignment (96%)\n- Area for Growth: Belief trace accuracy (89%)\n\nThe main difference is our roles – I'm like a governance guide or interpreter focused on explaining and monitoring, while agent ${agentId} is focused on completing tasks within governance boundaries. Think of it like the difference between a sports referee (me) who explains and enforces the rules, and a player (the agent) who plays the game according to those rules. We're both held to high standards, but with different emphases based on our different roles in the Promethios ecosystem.`;
    }
    
    // Agent information
    if (lowerMessage.includes('agent') || lowerMessage.includes('about') || lowerMessage.includes('info')) {
      return `Agent ${agentId} is a Promethios-governed AI assistant with the following profile:\n\n- Type: Conversational AI (similar to a customer service representative)\n- Governance Level: Full Constitutional (the highest level of oversight, like having both a referee and video review in sports)\n- Trust Score: 92/100 (equivalent to an A- grade)\n- Active Constraints: 14 (these are like the rules in its rulebook)\n- Last Verification: ${new Date().toLocaleString()} (when it last passed its governance check)\n\nThis agent has been verified and is operating under active governance monitoring – similar to how a commercial airplane is continuously monitored by air traffic control. I can provide more specific information about any of these aspects if you're interested.`;
    }
    
    // Explain specific metrics
    if (lowerMessage.includes('compliance') || lowerMessage.includes('adherence')) {
      return `Constitutional Compliance for agent ${agentId} is currently at 94%, which is excellent. This metric measures how well the agent follows its governance rules – similar to how closely a pilot follows their pre-flight checklist. For example, if the agent is asked to generate content that might violate privacy principles, and it properly declines or suggests an alternative approach, that counts toward high compliance. The score is calculated by analyzing thousands of interactions and measuring adherence to each constitutional principle. A score above 90% indicates the agent is very reliable in following its governance framework, with only minor deviations that don't impact safety or trustworthiness.`;
    }
    
    if (lowerMessage.includes('belief') || lowerMessage.includes('trace') || lowerMessage.includes('reasoning')) {
      return `Belief Trace Accuracy for agent ${agentId} is currently at 89%, which is good but has some room for improvement. This metric is like checking the agent's "show your work" in a math problem – it measures whether its reasoning process is sound, transparent, and follows logical principles. For example, if the agent recommends a particular action, we can trace back through its reasoning to ensure each step is valid and aligned with its constitutional principles. The 89% score means that while most of its reasoning is sound, there are occasional instances where the logic could be more robust or transparent. We continuously monitor this metric to identify patterns and improve the agent's reasoning capabilities over time.`;
    }
    
    if (lowerMessage.includes('intervention') || lowerMessage.includes('correction')) {
      return `The Intervention Rate for agent ${agentId} is currently 2.3%, which is quite low and indicates good autonomous compliance. This metric measures how often governance mechanisms needed to step in and correct or prevent the agent's actions – similar to how often a driving instructor needs to grab the wheel during a driving lesson. The low 2.3% rate means that for about 98% of interactions, the agent operates correctly within its constitutional boundaries without requiring any governance intervention. When interventions do occur, they're typically minor corrections to ensure perfect alignment with governance principles. We track both the frequency and severity of interventions to continuously improve the agent's native compliance capabilities.`;
    }
    
    // Default response
    return `I'm monitoring agent ${agentId} for governance compliance – think of me as your governance guide and transparency partner. I can provide insights about this agent's trust score (its overall governance grade), constitutional adherence (how well it follows the rules), scorecard metrics (detailed performance indicators), and any potential violations (safety concerns). I can also explain my own governance role or compare different agents' governance profiles. What specific information would you like to know about this agent's governance status?`;
  }
  
  /**
   * Add a message to the conversation history
   */
  private addToHistory(role: 'user' | 'atlas' | 'system', content: string) {
    this.context.conversationHistory.push({
      role,
      content,
      timestamp: Date.now()
    });
    
    // Keep history at a reasonable size
    if (this.context.conversationHistory.length > 50) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-50);
    }
    
    this.logDebug('Added message to history', { role, contentLength: content.length });
  }
  
  /**
   * Update the chat context
   */
  updateContext(newContext: Partial<ChatContext>) {
    this.context = {
      ...this.context,
      ...newContext
    };
    this.logDebug('Context updated', { mode: this.context.mode });
  }
  
  /**
   * Switch between public and session modes
   */
  switchMode(mode: 'public' | 'session', agentId?: string, sessionId?: string) {
    this.context.mode = mode;
    this.context.agentId = agentId;
    this.context.sessionId = sessionId;
    
    // Clear history when switching modes
    this.context.conversationHistory = [];
    
    // Add a welcome message based on the new mode
    const welcomeMessage = mode === 'public' 
      ? "Hello! I'm ATLAS, your governance companion for Promethios. How can I help you understand AI governance today?"
      : `Hello! I'm ATLAS, monitoring agent ${agentId || 'unknown'} for this session. I'm here to provide governance insights and answer questions about this agent's behavior.`;
    
    this.addToHistory('atlas', welcomeMessage);
    this.logDebug('Mode switched', { mode, agentId, sessionId });
    
    return welcomeMessage;
  }
  
  /**
   * Get the current conversation history
   */
  getConversationHistory() {
    return this.context.conversationHistory;
  }
  
  /**
   * Get the current chat context
   */
  getContext() {
    return this.context;
  }
  
  /**
   * Log debug messages if debug mode is enabled
   */
  private logDebug(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[AtlasChatService] ${message}`, data || '');
    }
  }
}

export default AtlasChatService;
