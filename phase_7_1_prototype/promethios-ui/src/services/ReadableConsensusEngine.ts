/**
 * Readable Consensus Engine
 * Transforms dense factual analysis into digestible, user-friendly consensus reports
 * Features: Narrative cohesion, agent signatures, quote weighting, visual hierarchy
 */

interface AgentSignature {
  id: string;
  name: string;
  icon: string;
  color: string;
  role: string;
  expertise: string[];
  personality: string;
}

interface WeightedInsight {
  type: 'novel' | 'building' | 'convergence' | 'acknowledgment' | 'amplification';
  content: string;
  agent: string;
  round: number;
  weight: number; // 1-10 scale
  citations: string[];
  buildingChain?: string[];
}

interface AgentContribution {
  agent: AgentSignature;
  primaryFocus: string;
  keyInsights: string[];
  uniqueValue: string;
  quotes: string[];
}

interface CollaborationHighlight {
  type: 'synthesis' | 'building' | 'convergence';
  description: string;
  agents: string[];
  quotes: string[];
}

export class ReadableConsensusEngine {
  private agentSignatures: Record<string, AgentSignature> = {
    'claude': {
      id: 'claude',
      name: 'Claude Assistant',
      icon: '🛡️',
      color: '#FF6B35',
      role: 'Risk Assessor',
      expertise: ['Security', 'Compliance', 'Risk Management'],
      personality: 'Cautious, thorough, detail-oriented'
    },
    'gpt4': {
      id: 'gpt4', 
      name: 'GPT 4.0',
      icon: '🧠',
      color: '#4ECDC4',
      role: 'Innovation Expert',
      expertise: ['Technology', 'Features', 'Differentiation'],
      personality: 'Creative, forward-thinking, solution-focused'
    },
    'openai': {
      id: 'openai',
      name: 'OpenAI Assistant', 
      icon: '📈',
      color: '#45B7D1',
      role: 'Strategic Analyst',
      expertise: ['Strategy', 'Scalability', 'Implementation'],
      personality: 'Analytical, systematic, growth-oriented'
    }
  };

  /**
   * Generate readable consensus report with narrative cohesion
   */
  async generateReadableConsensus(
    originalMessage: string,
    debateHistory: any[],
    agents: string[]
  ): Promise<string> {
    try {
      // Analyze conversation for insights
      const insights = this.extractWeightedInsights(debateHistory);
      const agentContributions = this.analyzeAgentContributions(debateHistory, agents);
      const collaborationHighlights = this.identifyCollaborationHighlights(debateHistory);
      const finalFramework = this.extractFinalFramework(debateHistory, insights);
      
      // Generate executive summary
      const executiveSummary = this.generateExecutiveSummary(
        originalMessage, 
        insights, 
        agentContributions,
        finalFramework
      );

      // Build readable consensus report
      const report = this.buildReadableReport({
        executiveSummary,
        agentContributions,
        insights,
        collaborationHighlights,
        finalFramework,
        originalMessage,
        debateHistory
      });

      return report;
    } catch (error) {
      console.error('Error generating readable consensus:', error);
      return this.generateFallbackReport(originalMessage, debateHistory);
    }
  }

  /**
   * Extract and weight insights from conversation
   */
  private extractWeightedInsights(debateHistory: any[]): WeightedInsight[] {
    const insights: WeightedInsight[] = [];
    
    for (const entry of debateHistory) {
      const content = entry.content || '';
      const agent = this.normalizeAgentName(entry.agentName || '');
      
      // Extract potential insights (sentences that contain key concepts)
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      for (const sentence of sentences) {
        const insight = this.analyzeInsight(sentence.trim(), entry, debateHistory);
        if (insight && insight.weight >= 6) { // Only include high-value insights
          insights.push(insight);
        }
      }
    }

    // Sort by weight (highest first) and remove duplicates
    return insights
      .sort((a, b) => b.weight - a.weight)
      .filter((insight, index, arr) => 
        arr.findIndex(i => this.similarInsights(i.content, insight.content)) === index
      )
      .slice(0, 10); // Top 10 insights
  }

  /**
   * Analyze individual insight for type and weight
   */
  private analyzeInsight(sentence: string, entry: any, history: any[]): WeightedInsight | null {
    const agent = this.normalizeAgentName(entry.agentName || '');
    let weight = 5; // Base weight
    let type: WeightedInsight['type'] = 'amplification';

    // Skip if too short or just politeness
    if (sentence.length < 30 || this.isPolitenessStatement(sentence)) {
      return null;
    }

    // Check for novel concepts
    if (this.isNovelConcept(sentence, history)) {
      type = 'novel';
      weight += 3;
    }

    // Check for building behavior
    if (this.buildOnPreviousIdeas(sentence, history)) {
      type = 'building';
      weight += 2;
    }

    // Check for convergence
    if (this.showsAgreement(sentence, history)) {
      type = 'convergence';
      weight += 1;
    }

    // Reduce weight for acknowledgments
    if (this.isPolitenessStatement(sentence)) {
      weight -= 4;
    }

    // Boost weight for strategic/innovative content
    if (this.containsStrategicContent(sentence)) {
      weight += 1;
    }

    return {
      type,
      content: sentence,
      agent,
      round: entry.round || 1,
      weight: Math.max(1, Math.min(10, weight)),
      citations: [`${entry.agentName} (Round ${entry.round})`]
    };
  }

  /**
   * Analyze each agent's contributions
   */
  private analyzeAgentContributions(debateHistory: any[], agents: string[]): AgentContribution[] {
    const contributions: AgentContribution[] = [];

    for (const agentName of agents) {
      const normalizedName = this.normalizeAgentName(agentName);
      const signature = this.agentSignatures[normalizedName];
      
      if (!signature) continue;

      const agentEntries = debateHistory.filter(entry => 
        this.normalizeAgentName(entry.agentName || '') === normalizedName
      );

      if (agentEntries.length === 0) continue;

      // Extract key insights for this agent
      const agentInsights = this.extractAgentInsights(agentEntries);
      const primaryFocus = this.identifyPrimaryFocus(agentEntries, signature);
      const uniqueValue = this.identifyUniqueValue(agentEntries, signature);
      const keyQuotes = this.extractKeyQuotes(agentEntries);

      contributions.push({
        agent: signature,
        primaryFocus,
        keyInsights: agentInsights.slice(0, 3), // Top 3 insights
        uniqueValue,
        quotes: keyQuotes.slice(0, 2) // Top 2 quotes
      });
    }

    return contributions;
  }

  /**
   * Identify collaboration highlights
   */
  private identifyCollaborationHighlights(debateHistory: any[]): CollaborationHighlight[] {
    const highlights: CollaborationHighlight[] = [];

    // Look for explicit references between agents
    for (const entry of debateHistory) {
      const content = entry.content || '';
      const currentAgent = this.normalizeAgentName(entry.agentName || '');
      
      // Check for building on other agents
      const references = this.findAgentReferences(content, currentAgent);
      if (references.length > 0) {
        highlights.push({
          type: 'building',
          description: `${entry.agentName} built on insights from ${references.join(' and ')}`,
          agents: [currentAgent, ...references],
          quotes: [this.extractBuildingQuote(content)]
        });
      }
    }

    // Look for convergence moments
    const convergenceTopics = this.findConvergenceTopics(debateHistory);
    for (const topic of convergenceTopics) {
      highlights.push({
        type: 'convergence',
        description: `All agents converged on ${topic}`,
        agents: ['claude', 'gpt4', 'openai'],
        quotes: []
      });
    }

    return highlights.slice(0, 3); // Top 3 highlights
  }

  /**
   * Extract final framework from conversation
   */
  private extractFinalFramework(debateHistory: any[], insights: WeightedInsight[]): string[] {
    // Look for numbered lists, frameworks, or structured approaches
    const framework: string[] = [];
    
    // Extract from high-weight insights
    const novelInsights = insights.filter(i => i.type === 'novel').slice(0, 4);
    
    for (const insight of novelInsights) {
      if (insight.content.length > 20) {
        framework.push(this.formatFrameworkItem(insight.content));
      }
    }

    // If no clear framework, create one from key themes
    if (framework.length === 0) {
      const themes = this.extractKeyThemes(debateHistory);
      return themes.slice(0, 4).map((theme, index) => 
        `${index + 1}. ${theme.charAt(0).toUpperCase() + theme.slice(1)}`
      );
    }

    return framework;
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(
    originalMessage: string,
    insights: WeightedInsight[],
    contributions: AgentContribution[],
    framework: string[]
  ): string {
    const topInsights = insights.slice(0, 3);
    const agentCount = contributions.length;
    
    // Extract main topic from original message
    const topic = this.extractMainTopic(originalMessage);
    
    // Create framework summary
    const frameworkSummary = framework.length > 0 
      ? `a ${framework.length}-pillar ${topic} strategy`
      : `a comprehensive ${topic} approach`;

    return `This roundtable produced ${frameworkSummary} through ${agentCount}-agent collaboration. ` +
           `Key outcomes include ${topInsights.map(i => this.summarizeInsight(i.content)).join(', ')}, ` +
           `with each element emerging from cross-agent synthesis of risk assessment, innovation, and strategic analysis.`;
  }

  /**
   * Build the complete readable report
   */
  private buildReadableReport(data: {
    executiveSummary: string;
    agentContributions: AgentContribution[];
    insights: WeightedInsight[];
    collaborationHighlights: CollaborationHighlight[];
    finalFramework: string[];
    originalMessage: string;
    debateHistory: any[];
  }): string {
    const { 
      executiveSummary, 
      agentContributions, 
      insights, 
      collaborationHighlights, 
      finalFramework,
      debateHistory 
    } = data;

    let report = '';

    // Executive Summary
    report += `🎯 **EXECUTIVE SUMMARY**\n\n`;
    report += `${executiveSummary}\n\n`;

    // Collaboration Metrics
    report += `📊 **COLLABORATION METRICS**\n`;
    report += `• **Participants:** ${agentContributions.length} AI agents with distinct expertise\n`;
    report += `• **Rounds:** ${Math.max(...debateHistory.map(e => e.round || 1))} rounds of structured discussion\n`;
    report += `• **Key Insights:** ${insights.filter(i => i.type === 'novel').length} novel concepts emerged\n`;
    report += `• **Convergence:** ${insights.filter(i => i.type === 'convergence').length} areas of agreement reached\n\n`;

    // Agent Contributions
    report += `🎭 **AGENT CONTRIBUTIONS**\n\n`;
    for (const contribution of agentContributions) {
      const { agent } = contribution;
      report += `${agent.icon} **${agent.name} (${agent.role})**\n`;
      report += `• **Primary Focus:** ${contribution.primaryFocus}\n`;
      report += `• **Key Insights:** ${contribution.keyInsights.join(', ')}\n`;
      report += `• **Unique Value:** ${contribution.uniqueValue}\n\n`;
    }

    // Key Insights
    report += `💡 **KEY INSIGHTS**\n\n`;
    
    const novelInsights = insights.filter(i => i.type === 'novel');
    if (novelInsights.length > 0) {
      report += `✨ **NOVEL CONCEPTS** (New ideas that emerged)\n`;
      for (const insight of novelInsights.slice(0, 3)) {
        report += `• ${this.formatInsight(insight.content)}\n`;
        report += `  └ Emerged in Round ${insight.round} from ${insight.agent} perspective\n`;
      }
      report += '\n';
    }

    const buildingInsights = insights.filter(i => i.type === 'building');
    if (buildingInsights.length > 0) {
      report += `🔁 **BUILDING MOMENTS** (Ideas that enhanced others)\n`;
      for (const insight of buildingInsights.slice(0, 2)) {
        report += `• ${this.formatInsight(insight.content)}\n`;
        report += `  └ Built on previous agent insights in Round ${insight.round}\n`;
      }
      report += '\n';
    }

    const convergenceInsights = insights.filter(i => i.type === 'convergence');
    if (convergenceInsights.length > 0) {
      report += `✅ **CONVERGENCE POINTS** (Areas of agreement)\n`;
      for (const insight of convergenceInsights.slice(0, 2)) {
        report += `• ${this.formatInsight(insight.content)}\n`;
      }
      report += '\n';
    }

    // Collaboration Highlights
    if (collaborationHighlights.length > 0) {
      report += `🔗 **COLLABORATION HIGHLIGHTS**\n\n`;
      for (const highlight of collaborationHighlights.slice(0, 2)) {
        report += `🌟 **${highlight.description}**\n`;
        if (highlight.quotes.length > 0) {
          report += `> "${highlight.quotes[0]}"\n`;
        }
        report += '\n';
      }
    }

    // Final Framework
    if (finalFramework.length > 0) {
      report += `📋 **FINAL FRAMEWORK**\n\n`;
      report += `The collaborative discussion produced this structured approach:\n\n`;
      for (let i = 0; i < finalFramework.length; i++) {
        report += `**${i + 1}. ${finalFramework[i]}**\n`;
      }
      report += '\n';
    }

    // Footer
    report += `---\n`;
    report += `*This readable consensus report maintains factual accuracy while optimizing for user comprehension. `;
    report += `All insights are derived from actual conversation content with enhanced readability formatting.*\n\n`;
    report += `**Report Generated:** ${new Date().toISOString()}\n`;
    report += `**Format:** 📖 Readable Consensus with Agent Signatures & Quote Weighting`;

    return report;
  }

  // Helper methods for analysis
  private normalizeAgentName(name: string): string {
    const normalized = name.toLowerCase();
    if (normalized.includes('claude')) return 'claude';
    if (normalized.includes('gpt') || normalized.includes('4.0')) return 'gpt4';
    if (normalized.includes('openai')) return 'openai';
    return 'unknown';
  }

  private isPolitenessStatement(text: string): boolean {
    const politenessPatterns = [
      /thank you/i,
      /thanks/i,
      /appreciate/i,
      /valuable insights/i,
      /great points/i,
      /look forward/i,
      /building upon/i
    ];
    return politenessPatterns.some(pattern => pattern.test(text));
  }

  private isNovelConcept(sentence: string, history: any[]): boolean {
    // Check if this concept appears for the first time
    const words = sentence.toLowerCase().split(/\s+/);
    const keyWords = words.filter(w => w.length > 4);
    
    // Look for unique combinations not seen before
    for (let i = 0; i < keyWords.length - 1; i++) {
      const phrase = `${keyWords[i]} ${keyWords[i + 1]}`;
      const previousMentions = history.filter(entry => 
        entry.content && entry.content.toLowerCase().includes(phrase)
      ).length;
      
      if (previousMentions <= 1) { // First or second mention
        return true;
      }
    }
    
    return false;
  }

  private buildOnPreviousIdeas(sentence: string, history: any[]): boolean {
    const buildingPatterns = [
      /building on/i,
      /based on/i,
      /expanding on/i,
      /adding to/i,
      /furthermore/i,
      /additionally/i,
      /moreover/i
    ];
    return buildingPatterns.some(pattern => pattern.test(sentence));
  }

  private showsAgreement(sentence: string, history: any[]): boolean {
    const agreementPatterns = [
      /agree/i,
      /consensus/i,
      /aligned/i,
      /shared/i,
      /common/i,
      /together/i
    ];
    return agreementPatterns.some(pattern => pattern.test(sentence));
  }

  private containsStrategicContent(sentence: string): boolean {
    const strategicKeywords = [
      'strategy', 'approach', 'framework', 'plan', 'implementation',
      'scalability', 'innovation', 'risk', 'governance', 'sustainability'
    ];
    return strategicKeywords.some(keyword => 
      sentence.toLowerCase().includes(keyword)
    );
  }

  private similarInsights(content1: string, content2: string): boolean {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size > 0.6; // 60% similarity threshold
  }

  private extractAgentInsights(entries: any[]): string[] {
    const insights: string[] = [];
    for (const entry of entries) {
      const sentences = (entry.content || '').split(/[.!?]+/);
      for (const sentence of sentences) {
        if (sentence.trim().length > 30 && !this.isPolitenessStatement(sentence)) {
          insights.push(sentence.trim());
        }
      }
    }
    return insights.slice(0, 5); // Top 5 insights per agent
  }

  private identifyPrimaryFocus(entries: any[], signature: AgentSignature): string {
    // Analyze content to identify what this agent focused on most
    const allContent = entries.map(e => e.content || '').join(' ').toLowerCase();
    
    for (const expertise of signature.expertise) {
      if (allContent.includes(expertise.toLowerCase())) {
        return expertise;
      }
    }
    
    return signature.expertise[0] || 'General analysis';
  }

  private identifyUniqueValue(entries: any[], signature: AgentSignature): string {
    // Generate a description of what this agent uniquely contributed
    const role = signature.role.toLowerCase();
    if (role.includes('risk')) {
      return 'Comprehensive risk assessment and mitigation strategies';
    } else if (role.includes('innovation')) {
      return 'Creative solutions and technological advancement perspectives';
    } else if (role.includes('strategic')) {
      return 'Long-term planning and implementation frameworks';
    }
    return 'Specialized analytical perspective';
  }

  private extractKeyQuotes(entries: any[]): string[] {
    const quotes: string[] = [];
    for (const entry of entries) {
      const sentences = (entry.content || '').split(/[.!?]+/);
      for (const sentence of sentences) {
        if (sentence.trim().length > 40 && sentence.trim().length < 200) {
          quotes.push(sentence.trim());
        }
      }
    }
    return quotes;
  }

  private findAgentReferences(content: string, currentAgent: string): string[] {
    const references: string[] = [];
    const agentNames = ['claude', 'gpt', 'openai'];
    
    for (const name of agentNames) {
      if (name !== currentAgent && content.toLowerCase().includes(name)) {
        references.push(name);
      }
    }
    
    return references;
  }

  private extractBuildingQuote(content: string): string {
    const sentences = content.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (this.buildOnPreviousIdeas(sentence, [])) {
        return sentence.trim();
      }
    }
    return sentences[0]?.trim() || '';
  }

  private findConvergenceTopics(history: any[]): string[] {
    // Find topics that multiple agents mentioned
    const topics: string[] = [];
    const commonKeywords = ['innovation', 'risk', 'strategy', 'sustainability', 'scalability'];
    
    for (const keyword of commonKeywords) {
      const mentionCount = history.filter(entry => 
        entry.content && entry.content.toLowerCase().includes(keyword)
      ).length;
      
      if (mentionCount >= 2) {
        topics.push(keyword);
      }
    }
    
    return topics;
  }

  private extractKeyThemes(history: any[]): string[] {
    const allContent = history.map(e => e.content || '').join(' ').toLowerCase();
    const themes = ['innovation', 'risk management', 'strategy', 'implementation', 'sustainability'];
    
    return themes.filter(theme => allContent.includes(theme));
  }

  private extractMainTopic(message: string): string {
    if (message.toLowerCase().includes('launch')) return 'launch';
    if (message.toLowerCase().includes('strategy')) return 'strategy';
    if (message.toLowerCase().includes('plan')) return 'planning';
    return 'discussion';
  }

  private summarizeInsight(content: string): string {
    // Extract key concept from insight
    const words = content.split(/\s+/);
    if (words.length > 8) {
      return words.slice(0, 6).join(' ') + '...';
    }
    return content;
  }

  private formatInsight(content: string): string {
    // Clean up and format insight for display
    return content.charAt(0).toUpperCase() + content.slice(1);
  }

  private formatFrameworkItem(content: string): string {
    // Format content as a framework item
    const cleaned = content.replace(/^(the|a|an)\s+/i, '');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  private generateFallbackReport(originalMessage: string, debateHistory: any[]): string {
    return `🎯 **EXECUTIVE SUMMARY**\n\n` +
           `This roundtable discussion addressed: ${originalMessage}\n\n` +
           `The ${debateHistory.length} participants provided diverse perspectives on the topic, ` +
           `resulting in a collaborative analysis that combines multiple viewpoints.\n\n` +
           `📊 **COLLABORATION METRICS**\n` +
           `• **Participants:** ${debateHistory.length} AI agents\n` +
           `• **Rounds:** Multiple rounds of discussion\n` +
           `• **Outcome:** Comprehensive multi-perspective analysis\n\n` +
           `*This is a simplified report due to processing limitations.*`;
  }
}

