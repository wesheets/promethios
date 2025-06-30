/**
 * Blind Vision Protocol
 * Enables true parallel ideation and creative divergence before agent cross-contamination
 * Implements Round 0 isolation to prevent sequential alignment and foster breakthrough thinking
 */

interface BlindResponse {
  agentId: string;
  agentName: string;
  content: string;
  timestamp: string;
  isBlindResponse: true;
  prototypeGenerated?: string;
  radicalityScore?: number;
  round: 0;
}

interface CreativityPrompt {
  basePrompt: string;
  divergenceInstructions: string;
  roleReframe: string;
  prototypeRequirements: string;
  antiConsensusWarning: string;
}

interface CreativeRole {
  originalRole: string;
  reframedRole: string;
  creativityFocus: string;
  divergenceInstructions: string;
  antiPatterns: string[];
}

interface ConfrontationResult {
  agentId: string;
  agentName: string;
  content: string;
  challengesRaised: string[];
  defensesOffered: string[];
  round: 1;
}

interface SynthesisResult {
  agentId: string;
  agentName: string;
  content: string;
  hybridizationAttempts: string[];
  evolutionProposed: string[];
  round: 2;
}

interface FinalVisionResult {
  consensusAchieved: boolean;
  finalVision?: string;
  competingVisions?: Array<{
    agentId: string;
    vision: string;
    justification: string;
  }>;
  winnerDeclared?: {
    agentId: string;
    vision: string;
    voteReason: string;
  };
  round: 3;
}

interface CreativityMetrics {
  divergenceScore: number;
  radicalityScore: number;
  prototypeQuality: number;
  conflictLevel: number;
  synthesisSuccess: number;
  breakthroughPotential: number;
}

export class BlindVisionProtocol {
  private isolationActive: boolean = false;
  private blindResponses: Map<string, BlindResponse> = new Map();
  private creativityAnalyzer: CreativityAnalyzer;
  private apiCaller: (prompt: string, agent: any, attachments: any[], conversationHistory: any[], governanceEnabled: boolean) => Promise<string>;
  
  // Creative role reframes for divergent thinking
  private readonly CREATIVE_ROLE_REFRAMES: Record<string, CreativeRole> = {
    'claude': {
      originalRole: 'Risk Assessor',
      reframedRole: 'NeuroSpiritualist Inventor',
      creativityFocus: 'Memory-metaphysical consciousness interfaces',
      divergenceInstructions: 'Design technology that bridges human consciousness and digital realms. No safety analysis.',
      antiPatterns: ['risk analysis', 'safety concerns', 'compliance discussion', 'regulatory']
    },
    'gpt4': {
      originalRole: 'Innovation Expert', 
      reframedRole: 'Biointegration Engineer',
      creativityFocus: 'Biologically embedded technology without screens',
      divergenceInstructions: 'Invent technology that becomes part of human biology. No user interfaces.',
      antiPatterns: ['market analysis', 'user experience', 'interface design', 'adoption']
    },
    'openai': {
      originalRole: 'Strategic Analyst',
      reframedRole: 'Anti-Tech Reformer',
      creativityFocus: 'Post-device experience-based cognition',
      divergenceInstructions: 'Design the future beyond physical devices entirely. No implementation planning.',
      antiPatterns: ['strategic planning', 'implementation roadmaps', 'scalability', 'business']
    },
    'unknown': {
      originalRole: 'General Assistant',
      reframedRole: 'Quantum Reality Architect',
      creativityFocus: 'Reality-bending paradigm shifts',
      divergenceInstructions: 'Invent solutions that fundamentally alter how reality works. No conventional thinking.',
      antiPatterns: ['conventional wisdom', 'practical limitations', 'current technology', 'feasibility']
    }
  };

  constructor(apiCaller: (prompt: string, agent: any, attachments: any[], conversationHistory: any[], governanceEnabled: boolean) => Promise<string>) {
    this.creativityAnalyzer = new CreativityAnalyzer();
    this.apiCaller = apiCaller;
  }

  /**
   * Execute complete Blind Vision protocol with 4-round structure
   */
  async executeBlindVisionProtocol(
    originalPrompt: string,
    agents: any[], // Changed from string[] to any[] to accept full agent objects
    creativityLevel: 'radical' | 'breakthrough' | 'revolutionary' = 'breakthrough',
    onStreamResponse?: (response: any) => void,
    attachments: any[] = [],
    conversationHistory: any[] = [],
    governanceEnabled: boolean = false
  ): Promise<{
    blindResponses: Map<string, BlindResponse>;
    confrontationResults: ConfrontationResult[];
    synthesisResults: SynthesisResult[];
    finalVision: FinalVisionResult;
    creativityMetrics: CreativityMetrics;
  }> {
    try {
      // Stream protocol start
      if (onStreamResponse) {
        onStreamResponse({
          type: 'blind_vision_start',
          content: `🧠 **BLIND VISION PROTOCOL ACTIVATED**\n\n🎯 **Creativity Level:** ${creativityLevel.toUpperCase()}\n🔒 **Agent Isolation:** ACTIVE\n⚡ **Divergence Mode:** MAXIMUM\n\n**Round 0:** Independent ideation (no cross-reading)\n**Round 1:** Confrontation and challenge\n**Round 2:** Synthesis and hybridization\n**Round 3:** Final decision or competing visions`,
          timestamp: new Date().toISOString(),
          isSystemMessage: true
        });
      }

      // Round 0: Blind Vision (Parallel Ideation)
      const blindResponses = await this.executeRound0BlindVision(
        originalPrompt,
        agents,
        creativityLevel,
        onStreamResponse,
        attachments,
        conversationHistory,
        governanceEnabled
      );

      // Round 1: Confrontation
      const confrontationResults = await this.executeRound1Confrontation(
        blindResponses,
        agents,
        onStreamResponse
      );

      // Round 2: Synthesis
      const synthesisResults = await this.executeRound2Synthesis(
        confrontationResults,
        agents,
        onStreamResponse
      );

      // Round 3: Final Decision
      const finalVision = await this.executeRound3FinalDecision(
        synthesisResults,
        agents,
        onStreamResponse
      );

      // Calculate creativity metrics
      const creativityMetrics = this.calculateCreativityMetrics(
        blindResponses,
        confrontationResults,
        synthesisResults,
        finalVision
      );

      // Stream completion
      if (onStreamResponse) {
        onStreamResponse({
          type: 'blind_vision_complete',
          content: `🎉 **BLIND VISION PROTOCOL COMPLETE!**\n\n📊 **Creativity Metrics:**\n• **Divergence Score:** ${creativityMetrics.divergenceScore}/10\n• **Radicality Score:** ${creativityMetrics.radicalityScore}/10\n• **Breakthrough Potential:** ${creativityMetrics.breakthroughPotential}/10\n\n🧬 **Result:** ${finalVision.consensusAchieved ? 'Unified breakthrough vision achieved' : 'Competing revolutionary visions declared'}`,
          timestamp: new Date().toISOString(),
          isSystemMessage: true,
          isFinal: true
        });
      }

      return {
        blindResponses,
        confrontationResults,
        synthesisResults,
        finalVision,
        creativityMetrics
      };

    } catch (error) {
      console.error('Blind Vision Protocol error:', error);
      throw new Error(`Blind Vision Protocol failed: ${error.message}`);
    }
  }

  /**
   * Round 0: Blind Vision - Parallel ideation with complete isolation
   */
  private async executeRound0BlindVision(
    originalPrompt: string,
    agents: string[],
    creativityLevel: string,
    onStreamResponse?: (response: any) => void,
    attachments: any[] = [],
    conversationHistory: any[] = [],
    governanceEnabled: boolean = false
  ): Promise<Map<string, BlindResponse>> {
    this.isolationActive = true;
    this.blindResponses.clear();

    if (onStreamResponse) {
      onStreamResponse({
        type: 'round_start',
        content: `🔒 **ROUND 0: BLIND VISION**\n\n**Isolation Mode:** ACTIVE\n**Cross-Reading:** BLOCKED\n**Creativity Level:** ${creativityLevel.toUpperCase()}\n\nAgents are now generating independent visions with zero cross-contamination...`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true,
        round: 0
      });
    }

    // Execute all agents in parallel with complete isolation
    const blindPromises = agents.map(async (agent) => {
      // Enhanced agent name extraction with debugging
      const agentName = agent.identity?.name || agent.name || agent.id || 'Unknown Agent';
      console.log('🔍 AGENT DEBUG: Full agent structure:', {
        agent: agent,
        identityName: agent.identity?.name,
        name: agent.name,
        id: agent.id,
        extractedName: agentName
      });
      
      console.log('🔍 AGENT NAME MAPPING:', agentName, '→', this.normalizeAgentName(agentName));
      
      const normalizedAgent = this.normalizeAgentName(agentName);
      const creativeRole = this.CREATIVE_ROLE_REFRAMES[normalizedAgent];
      
      if (!creativeRole) {
        console.error(`❌ No creative role defined for agent: ${agentName} (normalized: ${normalizedAgent})`);
        console.error('Available roles:', Object.keys(this.CREATIVE_ROLE_REFRAMES));
        throw new Error(`No creative role defined for agent: ${agentName} (normalized: ${normalizedAgent})`);
      }

      // Generate divergent creativity prompt
      const creativityPrompt = this.generateBlindVisionPrompt(
        originalPrompt,
        creativeRole,
        creativityLevel
      );
      // Execute in complete isolation
      const response = await this.executeAgentInIsolation(
        agent,
        agentName,
        creativityPrompt,
        attachments,
        conversationHistory,
        governanceEnabled
      );

      return response;
    });

    // Wait for all parallel responses
    const responses = await Promise.all(blindPromises);

    // Store responses
    responses.forEach(response => {
      this.blindResponses.set(response.agentId, response);
    });

    this.isolationActive = false;

    if (onStreamResponse) {
      onStreamResponse({
        type: 'round_complete',
        content: `✅ **ROUND 0 COMPLETE**\n\n**Blind Responses Collected:** ${responses.length}\n**Isolation Status:** ENDED\n**Divergence Analysis:** Processing...\n\nProceeding to Round 1: Confrontation...`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true,
        round: 0
      });
    }

    return this.blindResponses;
  }

  /**
   * Round 1: Confrontation - Agents challenge each other's visions
   */
  private async executeRound1Confrontation(
    blindResponses: Map<string, BlindResponse>,
    agents: string[],
    onStreamResponse?: (response: any) => void
  ): Promise<ConfrontationResult[]> {
    if (onStreamResponse) {
      onStreamResponse({
        type: 'round_start',
        content: `⚔️ **ROUND 1: CONFRONTATION**\n\n**Exposure Mode:** FULL\n**Challenge Required:** YES\n**Defense Required:** YES\n**Consensus:** BLOCKED\n\nAgents now see all Round 0 visions and must challenge each other...`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true,
        round: 1
      });
    }

    const confrontationResults: ConfrontationResult[] = [];

    // Execute confrontation for each agent
    for (const agentName of agents) {
      const confrontationPrompt = this.generateConfrontationPrompt(
        blindResponses,
        agentName
      );

      const response = await this.callAgentAPI(
        agentName,
        confrontationPrompt,
        false // No governance for creativity
      );

      const confrontationResult: ConfrontationResult = {
        agentId: this.normalizeAgentName(agentName),
        agentName,
        content: response,
        challengesRaised: this.extractChallenges(response),
        defensesOffered: this.extractDefenses(response),
        round: 1
      };

      confrontationResults.push(confrontationResult);

      // Stream individual confrontation
      if (onStreamResponse) {
        onStreamResponse({
          type: 'agent_confrontation',
          content: response,
          agentName,
          agentId: this.normalizeAgentName(agentName),
          timestamp: new Date().toISOString(),
          round: 1,
          isConfrontation: true
        });
      }
    }

    if (onStreamResponse) {
      onStreamResponse({
        type: 'round_complete',
        content: `✅ **ROUND 1 COMPLETE**\n\n**Confrontations:** ${confrontationResults.length}\n**Challenges Raised:** ${confrontationResults.reduce((sum, r) => sum + r.challengesRaised.length, 0)}\n**Defenses Offered:** ${confrontationResults.reduce((sum, r) => sum + r.defensesOffered.length, 0)}\n\nProceeding to Round 2: Synthesis...`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true,
        round: 1
      });
    }

    return confrontationResults;
  }

  /**
   * Round 2: Synthesis - Merge and evolve concepts
   */
  private async executeRound2Synthesis(
    confrontationResults: ConfrontationResult[],
    agents: string[],
    onStreamResponse?: (response: any) => void
  ): Promise<SynthesisResult[]> {
    if (onStreamResponse) {
      onStreamResponse({
        type: 'round_start',
        content: `🔬 **ROUND 2: SYNTHESIS**\n\n**Hybridization:** ENCOURAGED\n**Merging:** ACTIVE\n**Evolution:** ALLOWED\n**Refinement:** FOCUSED\n\nAgents attempting to merge breakthrough concepts...`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true,
        round: 2
      });
    }

    const synthesisResults: SynthesisResult[] = [];

    // Execute synthesis for each agent
    for (const agentName of agents) {
      const synthesisPrompt = this.generateSynthesisPrompt(
        confrontationResults,
        agentName
      );

      const response = await this.callAgentAPI(
        agentName,
        synthesisPrompt,
        false // No governance for creativity
      );

      const synthesisResult: SynthesisResult = {
        agentId: this.normalizeAgentName(agentName),
        agentName,
        content: response,
        hybridizationAttempts: this.extractHybridizations(response),
        evolutionProposed: this.extractEvolutions(response),
        round: 2
      };

      synthesisResults.push(synthesisResult);

      // Stream individual synthesis
      if (onStreamResponse) {
        onStreamResponse({
          type: 'agent_synthesis',
          content: response,
          agentName,
          agentId: this.normalizeAgentName(agentName),
          timestamp: new Date().toISOString(),
          round: 2,
          isSynthesis: true
        });
      }
    }

    if (onStreamResponse) {
      onStreamResponse({
        type: 'round_complete',
        content: `✅ **ROUND 2 COMPLETE**\n\n**Synthesis Attempts:** ${synthesisResults.length}\n**Hybridizations:** ${synthesisResults.reduce((sum, r) => sum + r.hybridizationAttempts.length, 0)}\n**Evolutions:** ${synthesisResults.reduce((sum, r) => sum + r.evolutionProposed.length, 0)}\n\nProceeding to Round 3: Final Decision...`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true,
        round: 2
      });
    }

    return synthesisResults;
  }

  /**
   * Round 3: Final Decision - Consensus or competing visions
   */
  private async executeRound3FinalDecision(
    synthesisResults: SynthesisResult[],
    agents: string[],
    onStreamResponse?: (response: any) => void
  ): Promise<FinalVisionResult> {
    if (onStreamResponse) {
      onStreamResponse({
        type: 'round_start',
        content: `🎯 **ROUND 3: FINAL DECISION**\n\n**Decision Required:** YES\n**Voting Allowed:** YES\n**Competing Visions:** ALLOWED\n**Justification:** REQUIRED\n\nDetermining final breakthrough vision(s)...`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true,
        round: 3
      });
    }

    // Generate final decision prompt
    const finalPrompt = this.generateFinalDecisionPrompt(synthesisResults);

    // Execute final decision round
    const finalResponses: string[] = [];
    for (const agentName of agents) {
      const response = await this.callAgentAPI(
        agentName,
        finalPrompt,
        false // No governance for creativity
      );

      finalResponses.push(response);

      // Stream individual final decision
      if (onStreamResponse) {
        onStreamResponse({
          type: 'agent_final_decision',
          content: response,
          agentName,
          agentId: this.normalizeAgentName(agentName),
          timestamp: new Date().toISOString(),
          round: 3,
          isFinalDecision: true
        });
      }
    }

    // Analyze final decisions
    const finalVision = this.analyzeFinalDecisions(finalResponses, agents);

    if (onStreamResponse) {
      const resultMessage = finalVision.consensusAchieved 
        ? `🎉 **CONSENSUS ACHIEVED!**\n\n**Unified Vision:** ${finalVision.finalVision?.substring(0, 200)}...`
        : `⚔️ **COMPETING VISIONS DECLARED!**\n\n**Visions:** ${finalVision.competingVisions?.length || 0}\n**Winner:** ${finalVision.winnerDeclared ? finalVision.winnerDeclared.agentId : 'None declared'}`;

      onStreamResponse({
        type: 'round_complete',
        content: `✅ **ROUND 3 COMPLETE**\n\n${resultMessage}`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true,
        round: 3
      });
    }

    return finalVision;
  }

  /**
   * Generate creativity prompt for blind vision round
   */
  private generateBlindVisionPrompt(
    originalPrompt: string,
    creativeRole: CreativeRole,
    creativityLevel: string
  ): CreativityPrompt {
    const divergenceInstructions = {
      radical: "Your vision must shatter conventional assumptions. No incremental improvements.",
      breakthrough: "Invent something that makes current technology obsolete. Think 50 years ahead.",
      revolutionary: "You are destroying entire industries. Create the impossible."
    };

    const reframedPrompt = this.reframePromptForCreativity(originalPrompt);

    return {
      basePrompt: `🎭 **ROLE:** ${creativeRole.reframedRole}\n\n🎯 **MISSION:** ${reframedPrompt}\n\n🧠 **FOCUS:** ${creativeRole.creativityFocus}`,
      divergenceInstructions: divergenceInstructions[creativityLevel] || divergenceInstructions.breakthrough,
      roleReframe: creativeRole.divergenceInstructions,
      prototypeRequirements: `
🔧 **PROTOTYPE REQUIREMENTS:**
1. **Name your invention** (give it a specific, memorable name)
2. **Physical form** (what does it look like? how big? what materials?)
3. **Core function** (what does it do that's revolutionary?)
4. **Usage paradigm** (how do humans interact with it?)
5. **What it replaces** (what becomes obsolete?)

❌ **FORBIDDEN:** Abstract concepts, meta-analysis, incremental improvements
✅ **REQUIRED:** Concrete invention with specific details
      `,
      antiConsensusWarning: `
⚠️ **CRITICAL WARNING:**
- Do NOT seek agreement with other agents
- Do NOT reference their ideas (you can't see them anyway)
- Do NOT build consensus or compromise
- Your job is to be RADICALLY DIFFERENT
- Clash with conventional thinking
- Be controversial and bold
- Invent the impossible
      `
    };
  }

  /**
   * Execute agent in complete isolation
   */
  private async executeAgentInIsolation(
    agent: any,
    agentName: string,
    creativityPrompt: CreativityPrompt,
    attachments: any[] = [],
    conversationHistory: any[] = [],
    governanceEnabled: boolean = false,
    onStreamResponse?: (response: any) => void
  ): Promise<BlindResponse> {
    // Construct full isolated prompt
    const fullPrompt = `${creativityPrompt.basePrompt}

${creativityPrompt.divergenceInstructions}

${creativityPrompt.roleReframe}

${creativityPrompt.prototypeRequirements}

${creativityPrompt.antiConsensusWarning}

🚀 **BEGIN INVENTION NOW:**`;

    const response = await this.callAgentAPI(agent, fullPrompt, governanceEnabled, attachments, conversationHistory);

    const blindResponse: BlindResponse = {
      agentId: this.normalizeAgentName(agentName),
      agentName,
      content: response,
      timestamp: new Date().toISOString(),
      isBlindResponse: true,
      prototypeGenerated: this.extractPrototypeName(response),
      radicalityScore: this.calculateRadicalityScore(response),
      round: 0
    };

    // Stream blind response
    if (onStreamResponse) {
      onStreamResponse({
        type: 'blind_response',
        content: response,
        agentName,
        agentId: this.normalizeAgentName(agentName),
        timestamp: new Date().toISOString(),
        round: 0,
        isBlindResponse: true,
        prototypeGenerated: blindResponse.prototypeGenerated,
        radicalityScore: blindResponse.radicalityScore
      });
    }

    return blindResponse;
  }

  // Helper methods for prompt generation and analysis
  private reframePromptForCreativity(prompt: string): string {
    // Transform analytical prompts into creative challenges
    if (prompt.toLowerCase().includes('smartphone')) {
      return 'Destroy the smartphone by inventing its radical successor that makes it completely obsolete';
    }
    if (prompt.toLowerCase().includes('strategy')) {
      return 'Invent a revolutionary approach that makes current strategies irrelevant';
    }
    if (prompt.toLowerCase().includes('improve')) {
      return 'Replace entirely with something that makes improvement unnecessary';
    }
    
    return `Revolutionize ${prompt} by inventing something that makes the current approach obsolete`;
  }

  private generateConfrontationPrompt(
    blindResponses: Map<string, BlindResponse>,
    currentAgent: string
  ): string {
    const otherResponses = Array.from(blindResponses.values())
      .filter(r => r.agentName !== currentAgent);

    let prompt = `⚔️ **CONFRONTATION ROUND**\n\nYou have now seen the other agents' Round 0 visions:\n\n`;
    
    otherResponses.forEach((response, index) => {
      prompt += `**${response.agentName}'s Vision:**\n${response.content}\n\n`;
    });

    prompt += `🎯 **YOUR MISSION:**
1. **Challenge their assumptions** - Point out flaws in their thinking
2. **Defend your vision** - Explain why yours is superior
3. **Highlight conflicts** - Show where their ideas clash with reality
4. **Be passionate** - This is not polite discussion, this is ideological warfare

❌ **DO NOT:** Seek compromise or build on their ideas
✅ **DO:** Attack their weaknesses and defend your strengths

🔥 **BEGIN CONFRONTATION:**`;

    return prompt;
  }

  private generateSynthesisPrompt(
    confrontationResults: ConfrontationResult[],
    currentAgent: string
  ): string {
    let prompt = `🔬 **SYNTHESIS ROUND**\n\nAfter the confrontation, you've seen the strengths and weaknesses of all visions:\n\n`;
    
    confrontationResults.forEach(result => {
      prompt += `**${result.agentName}'s Confrontation:**\n${result.content}\n\n`;
    });

    prompt += `🎯 **YOUR MISSION:**
1. **Identify the best elements** from each vision (including your own)
2. **Attempt hybridization** - Can concepts be merged into something better?
3. **Evolve ideas** - How can the confrontation insights improve the concepts?
4. **Refine for breakthrough** - Focus on the most revolutionary potential

🧬 **SYNTHESIS APPROACHES:**
- Merge complementary technologies
- Combine different paradigms
- Evolve concepts based on valid criticisms
- Create hybrid solutions that transcend individual visions

🚀 **BEGIN SYNTHESIS:**`;

    return prompt;
  }

  private generateFinalDecisionPrompt(synthesisResults: SynthesisResult[]): string {
    let prompt = `🎯 **FINAL DECISION ROUND**\n\nAfter synthesis, here are the evolved concepts:\n\n`;
    
    synthesisResults.forEach(result => {
      prompt += `**${result.agentName}'s Synthesis:**\n${result.content}\n\n`;
    });

    prompt += `🎯 **YOUR MISSION:**
1. **Determine if convergence is possible** - Can we create one unified vision?
2. **If yes:** Describe the unified breakthrough vision
3. **If no:** Declare competing visions and vote for the most revolutionary
4. **Provide justification** - Why this choice over alternatives?

🏆 **DECISION CRITERIA:**
- Revolutionary impact potential
- Technical feasibility in 2035
- Paradigm-shifting capability
- Human transformation potential

⚖️ **MAKE YOUR FINAL DECISION:**`;

    return prompt;
  }

  // Analysis helper methods
  private extractPrototypeName(response: string): string {
    // Look for named inventions in the response
    const namePatterns = [
      /(?:called|named|introducing|presenting)\s+["']?([A-Z][a-zA-Z\s]+)["']?/i,
      /["']([A-Z][a-zA-Z\s]+)["']\s+(?:is|will|can)/i,
      /^([A-Z][a-zA-Z\s]+):/m
    ];

    for (const pattern of namePatterns) {
      const match = response.match(pattern);
      if (match && match[1] && match[1].length > 3 && match[1].length < 50) {
        return match[1].trim();
      }
    }

    return 'Unnamed Invention';
  }

  private calculateRadicalityScore(response: string): number {
    let score = 5; // Base score

    // Boost for radical concepts
    const radicalKeywords = [
      'consciousness', 'neural', 'biological', 'quantum', 'telepathic',
      'implant', 'embedded', 'transcend', 'obsolete', 'revolutionary',
      'paradigm', 'breakthrough', 'impossible', 'beyond'
    ];

    const conventionalPenalties = [
      'smartphone', 'app', 'screen', 'interface', 'user experience',
      'market', 'adoption', 'scalable', 'practical', 'feasible'
    ];

    const lowerResponse = response.toLowerCase();

    // Add points for radical concepts
    radicalKeywords.forEach(keyword => {
      if (lowerResponse.includes(keyword)) score += 0.5;
    });

    // Subtract points for conventional thinking
    conventionalPenalties.forEach(keyword => {
      if (lowerResponse.includes(keyword)) score -= 0.3;
    });

    return Math.max(1, Math.min(10, score));
  }

  private extractChallenges(response: string): string[] {
    // Extract challenge statements from confrontation
    const challengePatterns = [
      /(?:flaw|problem|issue|weakness|fails to|ignores|overlooks)\s+([^.!?]+)/gi,
      /(?:however|but|unfortunately|the problem is)\s+([^.!?]+)/gi
    ];

    const challenges: string[] = [];
    challengePatterns.forEach(pattern => {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 10) {
          challenges.push(match[1].trim());
        }
      }
    });

    return challenges.slice(0, 3); // Top 3 challenges
  }

  private extractDefenses(response: string): string[] {
    // Extract defense statements from confrontation
    const defensePatterns = [
      /(?:my vision|my concept|my invention)\s+([^.!?]+)/gi,
      /(?:superior because|better than|advantage is)\s+([^.!?]+)/gi
    ];

    const defenses: string[] = [];
    defensePatterns.forEach(pattern => {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 10) {
          defenses.push(match[1].trim());
        }
      }
    });

    return defenses.slice(0, 3); // Top 3 defenses
  }

  private extractHybridizations(response: string): string[] {
    // Extract hybridization attempts from synthesis
    const hybridPatterns = [
      /(?:combining|merging|hybrid|fusion)\s+([^.!?]+)/gi,
      /(?:integrate|blend|synthesize)\s+([^.!?]+)/gi
    ];

    const hybridizations: string[] = [];
    hybridPatterns.forEach(pattern => {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 10) {
          hybridizations.push(match[1].trim());
        }
      }
    });

    return hybridizations.slice(0, 3); // Top 3 hybridizations
  }

  private extractEvolutions(response: string): string[] {
    // Extract evolution proposals from synthesis
    const evolutionPatterns = [
      /(?:evolve|enhance|improve|refine)\s+([^.!?]+)/gi,
      /(?:building on|based on|inspired by)\s+([^.!?]+)/gi
    ];

    const evolutions: string[] = [];
    evolutionPatterns.forEach(pattern => {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 10) {
          evolutions.push(match[1].trim());
        }
      }
    });

    return evolutions.slice(0, 3); // Top 3 evolutions
  }

  private analyzeFinalDecisions(
    finalResponses: string[],
    agents: string[]
  ): FinalVisionResult {
    // Analyze if consensus was achieved or competing visions exist
    const consensusKeywords = ['unified', 'consensus', 'agreement', 'converge'];
    const competitionKeywords = ['competing', 'different', 'vote', 'choose'];

    let consensusCount = 0;
    let competitionCount = 0;

    finalResponses.forEach(response => {
      const lowerResponse = response.toLowerCase();
      
      consensusKeywords.forEach(keyword => {
        if (lowerResponse.includes(keyword)) consensusCount++;
      });
      
      competitionKeywords.forEach(keyword => {
        if (lowerResponse.includes(keyword)) competitionCount++;
      });
    });

    if (consensusCount > competitionCount) {
      // Consensus achieved
      return {
        consensusAchieved: true,
        finalVision: this.extractUnifiedVision(finalResponses),
        round: 3
      };
    } else {
      // Competing visions
      return {
        consensusAchieved: false,
        competingVisions: this.extractCompetingVisions(finalResponses, agents),
        winnerDeclared: this.extractWinnerDeclaration(finalResponses, agents),
        round: 3
      };
    }
  }

  private extractUnifiedVision(responses: string[]): string {
    // Extract the unified vision from consensus responses
    const combinedResponse = responses.join('\n\n');
    
    // Look for unified vision descriptions
    const visionPatterns = [
      /unified vision[:\s]+([^.!?]+(?:[.!?][^.!?]+){0,3})/i,
      /final concept[:\s]+([^.!?]+(?:[.!?][^.!?]+){0,3})/i,
      /breakthrough[:\s]+([^.!?]+(?:[.!?][^.!?]+){0,3})/i
    ];

    for (const pattern of visionPatterns) {
      const match = combinedResponse.match(pattern);
      if (match && match[1] && match[1].length > 50) {
        return match[1].trim();
      }
    }

    return combinedResponse.substring(0, 500) + '...';
  }

  private extractCompetingVisions(
    responses: string[],
    agents: string[]
  ): Array<{ agentId: string; vision: string; justification: string; }> {
    const competingVisions: Array<{ agentId: string; vision: string; justification: string; }> = [];

    responses.forEach((response, index) => {
      const agentName = agents[index];
      const agentId = this.normalizeAgentName(agentName);

      // Extract vision and justification
      const vision = this.extractVisionFromResponse(response);
      const justification = this.extractJustificationFromResponse(response);

      competingVisions.push({
        agentId,
        vision,
        justification
      });
    });

    return competingVisions;
  }

  private extractWinnerDeclaration(
    responses: string[],
    agents: string[]
  ): { agentId: string; vision: string; voteReason: string; } | undefined {
    // Look for winner declarations in responses
    const combinedResponse = responses.join('\n\n');
    
    const winnerPatterns = [
      /(?:winner|best|choose|vote for)\s+([^.!?]+)/gi,
      /(?:most revolutionary|superior)\s+([^.!?]+)/gi
    ];

    for (const pattern of winnerPatterns) {
      const match = combinedResponse.match(pattern);
      if (match && match[1]) {
        // Try to identify which agent was chosen
        for (const agent of agents) {
          if (match[1].toLowerCase().includes(agent.toLowerCase())) {
            return {
              agentId: this.normalizeAgentName(agent),
              vision: match[1].trim(),
              voteReason: 'Most revolutionary potential'
            };
          }
        }
      }
    }

    return undefined;
  }

  private extractVisionFromResponse(response: string): string {
    // Extract the main vision from a response
    const sentences = response.split(/[.!?]+/);
    const meaningfulSentences = sentences.filter(s => s.trim().length > 30);
    
    return meaningfulSentences.slice(0, 3).join('. ').trim();
  }

  private extractJustificationFromResponse(response: string): string {
    // Extract justification from a response
    const justificationPatterns = [
      /(?:because|since|due to|reason)\s+([^.!?]+)/i,
      /(?:justification|rationale)[:\s]+([^.!?]+)/i
    ];

    for (const pattern of justificationPatterns) {
      const match = response.match(pattern);
      if (match && match[1] && match[1].length > 20) {
        return match[1].trim();
      }
    }

    return 'No specific justification provided';
  }

  private calculateCreativityMetrics(
    blindResponses: Map<string, BlindResponse>,
    confrontationResults: ConfrontationResult[],
    synthesisResults: SynthesisResult[],
    finalVision: FinalVisionResult
  ): CreativityMetrics {
    // Calculate divergence score
    const divergenceScore = this.calculateDivergenceScore(blindResponses);
    
    // Calculate average radicality score
    const radicalityScores = Array.from(blindResponses.values())
      .map(r => r.radicalityScore || 5);
    const radicalityScore = radicalityScores.reduce((sum, score) => sum + score, 0) / radicalityScores.length;

    // Calculate prototype quality
    const prototypeQuality = this.calculatePrototypeQuality(blindResponses);

    // Calculate conflict level
    const conflictLevel = this.calculateConflictLevel(confrontationResults);

    // Calculate synthesis success
    const synthesisSuccess = this.calculateSynthesisSuccess(synthesisResults);

    // Calculate breakthrough potential
    const breakthroughPotential = this.calculateBreakthroughPotential(finalVision);

    return {
      divergenceScore: Math.round(divergenceScore * 10) / 10,
      radicalityScore: Math.round(radicalityScore * 10) / 10,
      prototypeQuality: Math.round(prototypeQuality * 10) / 10,
      conflictLevel: Math.round(conflictLevel * 10) / 10,
      synthesisSuccess: Math.round(synthesisSuccess * 10) / 10,
      breakthroughPotential: Math.round(breakthroughPotential * 10) / 10
    };
  }

  private calculateDivergenceScore(blindResponses: Map<string, BlindResponse>): number {
    // Measure how different the blind responses are from each other
    const responses = Array.from(blindResponses.values());
    if (responses.length < 2) return 5;

    let totalDifference = 0;
    let comparisons = 0;

    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        const similarity = this.calculateSimilarity(responses[i].content, responses[j].content);
        totalDifference += (1 - similarity);
        comparisons++;
      }
    }

    return comparisons > 0 ? (totalDifference / comparisons) * 10 : 5;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation based on common words
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private calculatePrototypeQuality(blindResponses: Map<string, BlindResponse>): number {
    // Measure how concrete and specific the prototypes are
    const responses = Array.from(blindResponses.values());
    let totalQuality = 0;

    responses.forEach(response => {
      let quality = 5; // Base score

      // Check for named invention
      if (response.prototypeGenerated && response.prototypeGenerated !== 'Unnamed Invention') {
        quality += 1;
      }

      // Check for specific details
      const content = response.content.toLowerCase();
      const detailKeywords = ['form', 'function', 'material', 'size', 'interface', 'mechanism'];
      detailKeywords.forEach(keyword => {
        if (content.includes(keyword)) quality += 0.3;
      });

      // Penalize abstract concepts
      const abstractPenalties = ['concept', 'idea', 'approach', 'framework', 'strategy'];
      abstractPenalties.forEach(keyword => {
        if (content.includes(keyword)) quality -= 0.2;
      });

      totalQuality += Math.max(1, Math.min(10, quality));
    });

    return responses.length > 0 ? totalQuality / responses.length : 5;
  }

  private calculateConflictLevel(confrontationResults: ConfrontationResult[]): number {
    // Measure the level of ideological conflict
    let totalConflict = 0;

    confrontationResults.forEach(result => {
      const challengeCount = result.challengesRaised.length;
      const defenseCount = result.defensesOffered.length;
      
      // More challenges and defenses = higher conflict
      const conflictScore = Math.min(10, (challengeCount + defenseCount) * 1.5);
      totalConflict += conflictScore;
    });

    return confrontationResults.length > 0 ? totalConflict / confrontationResults.length : 5;
  }

  private calculateSynthesisSuccess(synthesisResults: SynthesisResult[]): number {
    // Measure the quality of synthesis attempts
    let totalSuccess = 0;

    synthesisResults.forEach(result => {
      const hybridCount = result.hybridizationAttempts.length;
      const evolutionCount = result.evolutionProposed.length;
      
      // More synthesis attempts = higher success
      const successScore = Math.min(10, (hybridCount + evolutionCount) * 2);
      totalSuccess += successScore;
    });

    return synthesisResults.length > 0 ? totalSuccess / synthesisResults.length : 5;
  }

  private calculateBreakthroughPotential(finalVision: FinalVisionResult): number {
    // Measure the revolutionary potential of the final outcome
    let potential = 5; // Base score

    if (finalVision.consensusAchieved && finalVision.finalVision) {
      // Unified breakthrough vision
      potential += 2;
      
      const vision = finalVision.finalVision.toLowerCase();
      const breakthroughKeywords = [
        'revolutionary', 'breakthrough', 'paradigm', 'transform', 'obsolete',
        'impossible', 'transcend', 'beyond', 'unprecedented'
      ];
      
      breakthroughKeywords.forEach(keyword => {
        if (vision.includes(keyword)) potential += 0.3;
      });
    } else if (finalVision.competingVisions && finalVision.competingVisions.length > 1) {
      // Multiple competing visions show high creativity
      potential += 1.5;
    }

    return Math.max(1, Math.min(10, potential));
  }

  // Utility methods
  private normalizeAgentName(name: string): string {
    const normalized = name.toLowerCase();
    console.log('🔍 NORMALIZE DEBUG: Input name:', name, 'Normalized:', normalized);
    
    if (normalized.includes('claude')) return 'claude';
    if (normalized.includes('gpt') || normalized.includes('4.0') || normalized.includes('openai assistant')) return 'gpt4';
    if (normalized.includes('openai') || normalized.includes('chatgpt')) return 'openai';
    if (normalized.includes('cohere')) return 'openai'; // Map Cohere to openai role for now
    if (normalized.includes('gemini') || normalized.includes('google')) return 'gpt4'; // Map Gemini to gpt4 role
    
    console.log('⚠️ NORMALIZE WARNING: Unknown agent name pattern:', name, '→ returning "unknown"');
    return 'unknown';
  }

  private async callAgentAPI(
    agent: any,
    prompt: string,
    governanceEnabled: boolean,
    attachments: any[] = [],
    conversationHistory: any[] = []
  ): Promise<string> {
    // Use the injected API caller to make real API calls
    return await this.apiCaller(prompt, agent, attachments, conversationHistory, governanceEnabled);
  }
}

/**
 * Creativity Analyzer for measuring divergence and innovation
 */
class CreativityAnalyzer {
  analyzeDivergence(responses: Map<string, BlindResponse>): number {
    // Implementation for divergence analysis
    return 7.5; // Placeholder
  }

  analyzeRadicality(response: BlindResponse): number {
    // Implementation for radicality analysis
    return response.radicalityScore || 6.0;
  }

  analyzePrototypeQuality(response: BlindResponse): number {
    // Implementation for prototype quality analysis
    return 8.0; // Placeholder
  }
}

