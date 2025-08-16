/**
 * Recursive Memory Extension for Promethios
 * 
 * Provides comprehensive pattern analysis and memory management functionality for agents.
 * Integrates with governance systems to provide intelligent memory persistence,
 * pattern recognition, and workflow optimization based on historical data.
 */

import { Extension } from './Extension';
import { AutonomousCognitionExtension } from './AutonomousCognitionExtension';
import { ComprehensiveToolReceiptExtension, EnhancedToolReceipt } from './ComprehensiveToolReceiptExtension';
import { UniversalGovernanceAdapter } from '../services/UniversalGovernanceAdapter';

export interface PatternAnalysis {
  patternId: string;
  patternType: 'workflow_sequence' | 'tool_usage' | 'user_interaction' | 'error_recovery' | 'optimization';
  confidence: number; // 0-1 scale
  frequency: number;
  lastSeen: Date;
  firstSeen: Date;
  metadata: {
    toolsInvolved: string[];
    averageExecutionTime: number;
    successRate: number;
    errorPatterns: string[];
    userSatisfactionScore?: number;
    businessImpact: 'low' | 'medium' | 'high';
    complexity: number; // 1-10 scale
  };
  triggerConditions: string[];
  expectedOutcomes: string[];
  variations: PatternVariation[];
}

export interface PatternVariation {
  variationId: string;
  description: string;
  frequency: number;
  successRate: number;
  contextFactors: string[];
}

export interface MemoryContext {
  agentId: string;
  sessionId: string;
  businessObjective: string;
  contextTags: string[];
  createdAt: Date;
  lastUpdated: Date;
  receiptChains: ReceiptChain[];
  learnedPatterns: LearnedPattern[];
  workflowSuggestions: WorkflowSuggestion[];
  contextualInsights: string[];
  memoryStats: MemoryStats;
  conversationHistory: ConversationEntry[];
  performanceMetrics: PerformanceMetrics;
}

export interface ConversationEntry {
  entryId: string;
  timestamp: Date;
  type: 'user_message' | 'agent_response' | 'tool_execution' | 'governance_event';
  content: string;
  metadata: {
    trustScore?: number;
    responseTime?: number;
    toolsUsed?: string[];
    governanceFlags?: string[];
    userSatisfaction?: number;
  };
  relatedPatterns: string[];
}

export interface ReceiptChain {
  chainId: string;
  receipts: string[];
  pattern: string;
  businessValue: string;
  successRate: number;
  lastUsed: Date;
  totalExecutions: number;
  averageExecutionTime: number;
  errorRate: number;
  optimizationSuggestions: string[];
}

export interface LearnedPattern {
  patternId: string;
  name: string;
  description: string;
  category: 'communication' | 'crm' | 'ecommerce' | 'workflow' | 'problem_solving';
  triggerConditions: string[];
  actionSequence: PatternAction[];
  successMetrics: {
    conversionRate?: number;
    responseRate?: number;
    satisfactionScore?: number;
    resolutionTime?: number;
    customerSatisfaction?: number;
    escalationRate?: number;
    costSavings?: number;
    timeEfficiency?: number;
  };
  usageCount: number;
  lastRefined: Date;
  adaptations: PatternAdaptation[];
  contextualFactors: string[];
}

export interface PatternAction {
  actionId: string;
  toolName: string;
  actionType: string;
  parameters: Record<string, any>;
  expectedDuration: number;
  successCriteria: string[];
  fallbackActions: string[];
}

export interface PatternAdaptation {
  adaptationId: string;
  originalPattern: string;
  modification: string;
  reason: string;
  performanceImpact: number;
  adoptionDate: Date;
}

export interface WorkflowSuggestion {
  suggestionId: string;
  title: string;
  description: string;
  confidence: number;
  potentialImpact: 'low' | 'medium' | 'high';
  estimatedTimeSaving: string;
  estimatedCostSaving?: string;
  basedOnReceipts: string[];
  implementationComplexity: 'simple' | 'moderate' | 'complex';
  prerequisites: string[];
  riskFactors: string[];
}

export interface MemoryStats {
  totalReceipts: number;
  totalPatterns: number;
  totalWorkflows: number;
  averageSuccessRate: number;
  memoryEfficiency: number;
  lastOptimization: Date;
  storageUsed: number; // MB
  compressionRatio: number;
  accessFrequency: number;
}

export interface PerformanceMetrics {
  responseTimeAverage: number;
  successRateOverall: number;
  userSatisfactionAverage: number;
  errorFrequency: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  lastPerformanceReview: Date;
}

export class RecursiveMemoryExtension extends Extension {
  private autonomousCognition: AutonomousCognitionExtension;
  private receiptExtension: ComprehensiveToolReceiptExtension;
  private governanceAdapter: UniversalGovernanceAdapter;
  
  // Memory storage
  private memoryContexts: Map<string, MemoryContext> = new Map();
  private patternAnalyses: Map<string, PatternAnalysis[]> = new Map();
  private globalPatterns: Map<string, PatternAnalysis> = new Map();
  
  // Pattern recognition
  private patternRecognitionEngine: PatternRecognitionEngine;
  private memoryOptimizer: MemoryOptimizer;
  private insightGenerator: InsightGenerator;

  constructor() {
    super('RecursiveMemoryExtension', '1.0.0');
    this.autonomousCognition = AutonomousCognitionExtension.getInstance();
    this.receiptExtension = new ComprehensiveToolReceiptExtension();
    this.governanceAdapter = new UniversalGovernanceAdapter();
    
    this.patternRecognitionEngine = new PatternRecognitionEngine();
    this.memoryOptimizer = new MemoryOptimizer();
    this.insightGenerator = new InsightGenerator();
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🧠 [Memory] Initializing Recursive Memory Extension...');
      
      // Initialize dependencies
      await this.autonomousCognition.initialize();
      await this.receiptExtension.initialize();
      
      // Initialize pattern recognition engine
      await this.patternRecognitionEngine.initialize();
      
      // Start memory optimization background process
      this.startMemoryOptimization();
      
      // Load existing memory contexts
      await this.loadExistingMemoryContexts();
      
      console.log('✅ [Memory] Recursive Memory Extension initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ [Memory] Failed to initialize Recursive Memory Extension:', error);
      return false;
    }
  }

  async analyzePatterns(agentId: string, data: EnhancedToolReceipt[]): Promise<PatternAnalysis[]> {
    try {
      console.log(`🔍 [Memory] Analyzing patterns for agent: ${agentId} with ${data.length} receipts`);
      
      const patterns = await this.patternRecognitionEngine.analyzeReceipts(agentId, data);
      
      // Store patterns for this agent
      this.patternAnalyses.set(agentId, patterns);
      
      // Update global pattern database
      for (const pattern of patterns) {
        this.globalPatterns.set(pattern.patternId, pattern);
      }
      
      // Generate insights based on new patterns
      const insights = await this.insightGenerator.generateInsights(agentId, patterns);
      
      console.log(`✅ [Memory] Found ${patterns.length} patterns and ${insights.length} insights for agent ${agentId}`);
      return patterns;
    } catch (error) {
      console.error(`❌ [Memory] Failed to analyze patterns for agent ${agentId}:`, error);
      return [];
    }
  }

  async getMemoryContext(agentId: string, sessionId: string): Promise<MemoryContext | null> {
    try {
      const contextKey = `${agentId}_${sessionId}`;
      
      if (this.memoryContexts.has(contextKey)) {
        const context = this.memoryContexts.get(contextKey)!;
        // Update last accessed time
        context.lastUpdated = new Date();
        return context;
      }
      
      // Create comprehensive memory context
      const context = await this.createMemoryContext(agentId, sessionId);
      this.memoryContexts.set(contextKey, context);
      
      return context;
    } catch (error) {
      console.error(`❌ [Memory] Failed to get memory context for ${agentId}:`, error);
      return null;
    }
  }

  private async createMemoryContext(agentId: string, sessionId: string): Promise<MemoryContext> {
    // Load historical data for this agent
    const receipts = await this.receiptExtension.getAgentReceipts(agentId, { limit: 1000 });
    const patterns = await this.analyzePatterns(agentId, receipts);
    const suggestions = await this.generateWorkflowSuggestions(agentId, patterns);
    
    return {
      agentId,
      sessionId,
      businessObjective: await this.inferBusinessObjective(agentId, receipts),
      contextTags: await this.generateContextTags(agentId, receipts),
      createdAt: new Date(),
      lastUpdated: new Date(),
      receiptChains: await this.buildReceiptChains(receipts),
      learnedPatterns: await this.convertPatternsToLearned(patterns),
      workflowSuggestions: suggestions,
      contextualInsights: await this.generateContextualInsights(agentId, patterns, receipts),
      memoryStats: await this.calculateMemoryStats(agentId),
      conversationHistory: [],
      performanceMetrics: await this.calculatePerformanceMetrics(agentId, receipts)
    };
  }

  async updateMemoryContext(agentId: string, sessionId: string, updates: Partial<MemoryContext>): Promise<boolean> {
    try {
      const contextKey = `${agentId}_${sessionId}`;
      const existing = this.memoryContexts.get(contextKey);
      
      if (existing) {
        const updated = { 
          ...existing, 
          ...updates, 
          lastUpdated: new Date(),
          memoryStats: {
            ...existing.memoryStats,
            lastOptimization: new Date()
          }
        };
        this.memoryContexts.set(contextKey, updated);
        
        // Trigger pattern reanalysis if significant changes
        if (updates.conversationHistory || updates.receiptChains) {
          await this.reanalyzePatterns(agentId);
        }
        
        console.log(`✅ [Memory] Updated memory context for ${agentId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ [Memory] Failed to update memory context for ${agentId}:`, error);
      return false;
    }
  }

  async addConversationEntry(agentId: string, sessionId: string, entry: Omit<ConversationEntry, 'entryId' | 'relatedPatterns'>): Promise<boolean> {
    try {
      const context = await this.getMemoryContext(agentId, sessionId);
      if (!context) return false;
      
      const conversationEntry: ConversationEntry = {
        entryId: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        relatedPatterns: await this.findRelatedPatterns(agentId, entry.content),
        ...entry
      };
      
      context.conversationHistory.push(conversationEntry);
      
      // Optimize memory if conversation history gets too large
      if (context.conversationHistory.length > 1000) {
        context.conversationHistory = await this.memoryOptimizer.compressConversationHistory(context.conversationHistory);
      }
      
      await this.updateMemoryContext(agentId, sessionId, { conversationHistory: context.conversationHistory });
      
      return true;
    } catch (error) {
      console.error(`❌ [Memory] Failed to add conversation entry:`, error);
      return false;
    }
  }

  async getPatternAnalysis(agentId: string): Promise<PatternAnalysis[]> {
    return this.patternAnalyses.get(agentId) || [];
  }

  async findSimilarPatterns(agentId: string, currentAction: any): Promise<PatternAnalysis[]> {
    try {
      const agentPatterns = this.patternAnalyses.get(agentId) || [];
      const similarPatterns = await this.patternRecognitionEngine.findSimilar(currentAction, agentPatterns);
      
      return similarPatterns.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error(`❌ [Memory] Failed to find similar patterns:`, error);
      return [];
    }
  }

  async optimizeMemory(agentId: string): Promise<boolean> {
    try {
      console.log(`🔧 [Memory] Optimizing memory for agent: ${agentId}`);
      
      const context = await this.getMemoryContext(agentId, 'optimization');
      if (!context) return false;
      
      // Optimize conversation history
      context.conversationHistory = await this.memoryOptimizer.compressConversationHistory(context.conversationHistory);
      
      // Optimize patterns
      const optimizedPatterns = await this.memoryOptimizer.optimizePatterns(context.learnedPatterns);
      context.learnedPatterns = optimizedPatterns;
      
      // Update memory stats
      context.memoryStats = await this.calculateMemoryStats(agentId);
      context.memoryStats.lastOptimization = new Date();
      
      await this.updateMemoryContext(agentId, 'optimization', context);
      
      console.log(`✅ [Memory] Memory optimization completed for agent ${agentId}`);
      return true;
    } catch (error) {
      console.error(`❌ [Memory] Failed to optimize memory for agent ${agentId}:`, error);
      return false;
    }
  }

  async clearMemory(agentId: string): Promise<boolean> {
    try {
      // Clear all memory contexts for this agent
      const keysToDelete = Array.from(this.memoryContexts.keys()).filter(key => key.startsWith(agentId));
      keysToDelete.forEach(key => this.memoryContexts.delete(key));
      
      // Clear pattern analyses
      this.patternAnalyses.delete(agentId);
      
      console.log(`✅ [Memory] Cleared memory for agent ${agentId}`);
      return true;
    } catch (error) {
      console.error(`❌ [Memory] Failed to clear memory for agent ${agentId}:`, error);
      return false;
    }
  }

  // Private helper methods
  private async loadExistingMemoryContexts(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    console.log('📂 [Memory] Loading existing memory contexts from storage...');
  }

  private startMemoryOptimization(): void {
    // Run memory optimization every hour
    setInterval(async () => {
      for (const [contextKey] of this.memoryContexts) {
        const agentId = contextKey.split('_')[0];
        await this.optimizeMemory(agentId);
      }
    }, 3600000); // 1 hour
  }

  private async reanalyzePatterns(agentId: string): Promise<void> {
    try {
      const receipts = await this.receiptExtension.getAgentReceipts(agentId, { limit: 1000 });
      await this.analyzePatterns(agentId, receipts);
    } catch (error) {
      console.error(`❌ [Memory] Failed to reanalyze patterns for ${agentId}:`, error);
    }
  }

  private async findRelatedPatterns(agentId: string, content: string): Promise<string[]> {
    const patterns = this.patternAnalyses.get(agentId) || [];
    const related: string[] = [];
    
    for (const pattern of patterns) {
      // Simple keyword matching - in real implementation would use NLP
      const keywords = content.toLowerCase().split(' ');
      const patternKeywords = pattern.triggerConditions.join(' ').toLowerCase();
      
      if (keywords.some(keyword => patternKeywords.includes(keyword))) {
        related.push(pattern.patternId);
      }
    }
    
    return related;
  }

  private async inferBusinessObjective(agentId: string, receipts: EnhancedToolReceipt[]): Promise<string> {
    // Analyze receipt patterns to infer business objective
    const toolUsage = receipts.reduce((acc, receipt) => {
      acc[receipt.toolName] = (acc[receipt.toolName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const primaryTool = Object.entries(toolUsage).sort(([,a], [,b]) => b - a)[0]?.[0];
    
    switch (primaryTool) {
      case 'salesforce': return 'Customer relationship management and sales optimization';
      case 'email': return 'Communication and customer engagement';
      case 'shopify': return 'E-commerce operations and order management';
      default: return 'General business process automation';
    }
  }

  private async generateContextTags(agentId: string, receipts: EnhancedToolReceipt[]): Promise<string[]> {
    const tags = new Set<string>();
    
    receipts.forEach(receipt => {
      tags.add(receipt.toolName);
      if (receipt.businessContext?.department) {
        tags.add(receipt.businessContext.department);
      }
    });
    
    return Array.from(tags);
  }

  private async buildReceiptChains(receipts: EnhancedToolReceipt[]): Promise<ReceiptChain[]> {
    // Group receipts by temporal proximity and tool relationships
    const chains: ReceiptChain[] = [];
    
    // Simple implementation - group receipts within 1 hour of each other
    const sortedReceipts = receipts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    let currentChain: string[] = [];
    let lastTimestamp = 0;
    
    for (const receipt of sortedReceipts) {
      const receiptTime = new Date(receipt.timestamp).getTime();
      
      if (receiptTime - lastTimestamp > 3600000) { // 1 hour gap
        if (currentChain.length > 1) {
          chains.push({
            chainId: `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            receipts: [...currentChain],
            pattern: 'temporal_sequence',
            businessValue: 'Workflow automation',
            successRate: 0.85,
            lastUsed: new Date(receiptTime),
            totalExecutions: 1,
            averageExecutionTime: 0,
            errorRate: 0.15,
            optimizationSuggestions: []
          });
        }
        currentChain = [];
      }
      
      currentChain.push(receipt.receiptId);
      lastTimestamp = receiptTime;
    }
    
    return chains;
  }

  private async convertPatternsToLearned(patterns: PatternAnalysis[]): Promise<LearnedPattern[]> {
    return patterns.map(pattern => ({
      patternId: pattern.patternId,
      name: `${pattern.patternType} Pattern`,
      description: `Learned pattern for ${pattern.patternType}`,
      category: this.mapPatternTypeToCategory(pattern.patternType),
      triggerConditions: pattern.triggerConditions,
      actionSequence: [],
      successMetrics: {
        satisfactionScore: pattern.metadata.userSatisfactionScore,
        resolutionTime: pattern.metadata.averageExecutionTime
      },
      usageCount: pattern.frequency,
      lastRefined: pattern.lastSeen,
      adaptations: [],
      contextualFactors: pattern.metadata.toolsInvolved
    }));
  }

  private mapPatternTypeToCategory(patternType: string): 'communication' | 'crm' | 'ecommerce' | 'workflow' | 'problem_solving' {
    switch (patternType) {
      case 'user_interaction': return 'communication';
      case 'tool_usage': return 'workflow';
      case 'error_recovery': return 'problem_solving';
      default: return 'workflow';
    }
  }

  private async generateWorkflowSuggestions(agentId: string, patterns: PatternAnalysis[]): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];
    
    for (const pattern of patterns) {
      if (pattern.confidence > 0.7 && pattern.frequency > 5) {
        suggestions.push({
          suggestionId: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: `Optimize ${pattern.patternType} workflow`,
          description: `Based on ${pattern.frequency} occurrences, consider automating this pattern`,
          confidence: pattern.confidence,
          potentialImpact: pattern.metadata.businessImpact,
          estimatedTimeSaving: `${Math.round(pattern.metadata.averageExecutionTime * 0.3)} seconds per execution`,
          basedOnReceipts: [], // Would be populated with actual receipt IDs
          implementationComplexity: pattern.metadata.complexity > 7 ? 'complex' : pattern.metadata.complexity > 4 ? 'moderate' : 'simple',
          prerequisites: [],
          riskFactors: pattern.metadata.errorPatterns
        });
      }
    }
    
    return suggestions;
  }

  private async generateContextualInsights(agentId: string, patterns: PatternAnalysis[], receipts: EnhancedToolReceipt[]): Promise<string[]> {
    const insights: string[] = [];
    
    const totalReceipts = receipts.length;
    const successfulReceipts = receipts.filter(r => r.outcome === 'success').length;
    const successRate = totalReceipts > 0 ? successfulReceipts / totalReceipts : 0;
    
    insights.push(`Agent has processed ${totalReceipts} tool executions with ${(successRate * 100).toFixed(1)}% success rate`);
    
    if (patterns.length > 0) {
      const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
      insights.push(`${patterns.length} behavioral patterns identified with ${(avgConfidence * 100).toFixed(1)}% average confidence`);
    }
    
    const toolUsage = receipts.reduce((acc, receipt) => {
      acc[receipt.toolName] = (acc[receipt.toolName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostUsedTool = Object.entries(toolUsage).sort(([,a], [,b]) => b - a)[0];
    if (mostUsedTool) {
      insights.push(`Most frequently used tool: ${mostUsedTool[0]} (${mostUsedTool[1]} executions)`);
    }
    
    return insights;
  }

  private async calculateMemoryStats(agentId: string): Promise<MemoryStats> {
    const patterns = this.patternAnalyses.get(agentId) || [];
    const context = this.memoryContexts.get(`${agentId}_current`);
    
    return {
      totalReceipts: context?.receiptChains.reduce((sum, chain) => sum + chain.receipts.length, 0) || 0,
      totalPatterns: patterns.length,
      totalWorkflows: context?.workflowSuggestions.length || 0,
      averageSuccessRate: patterns.length > 0 ? patterns.reduce((sum, p) => sum + p.metadata.successRate, 0) / patterns.length : 0,
      memoryEfficiency: 0.85, // Would be calculated based on compression and access patterns
      lastOptimization: new Date(),
      storageUsed: patterns.length * 0.1, // Rough estimate in MB
      compressionRatio: 0.7,
      accessFrequency: patterns.reduce((sum, p) => sum + p.frequency, 0)
    };
  }

  private async calculatePerformanceMetrics(agentId: string, receipts: EnhancedToolReceipt[]): Promise<PerformanceMetrics> {
    const responseTimes = receipts.map(r => r.executionTime || 0);
    const successCount = receipts.filter(r => r.outcome === 'success').length;
    
    return {
      responseTimeAverage: responseTimes.length > 0 ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0,
      successRateOverall: receipts.length > 0 ? successCount / receipts.length : 0,
      userSatisfactionAverage: 0.8, // Would be calculated from actual feedback
      errorFrequency: receipts.filter(r => r.outcome === 'failure').length,
      improvementTrend: 'stable', // Would be calculated from historical data
      lastPerformanceReview: new Date()
    };
  }
}

// Helper classes for pattern recognition and optimization
class PatternRecognitionEngine {
  async initialize(): Promise<void> {
    console.log('🔍 [PatternEngine] Pattern Recognition Engine initialized');
  }

  async analyzeReceipts(agentId: string, receipts: EnhancedToolReceipt[]): Promise<PatternAnalysis[]> {
    const patterns: PatternAnalysis[] = [];
    
    // Analyze tool usage patterns
    const toolPatterns = this.analyzeToolUsagePatterns(receipts);
    patterns.push(...toolPatterns);
    
    // Analyze temporal patterns
    const temporalPatterns = this.analyzeTemporalPatterns(receipts);
    patterns.push(...temporalPatterns);
    
    // Analyze error patterns
    const errorPatterns = this.analyzeErrorPatterns(receipts);
    patterns.push(...errorPatterns);
    
    return patterns;
  }

  async findSimilar(currentAction: any, patterns: PatternAnalysis[]): Promise<PatternAnalysis[]> {
    // Simple similarity matching - in real implementation would use ML
    return patterns.filter(pattern => 
      pattern.metadata.toolsInvolved.some(tool => 
        currentAction.toolName === tool
      )
    );
  }

  private analyzeToolUsagePatterns(receipts: EnhancedToolReceipt[]): PatternAnalysis[] {
    const toolSequences = new Map<string, number>();
    
    for (let i = 0; i < receipts.length - 1; i++) {
      const current = receipts[i];
      const next = receipts[i + 1];
      const sequence = `${current.toolName}->${next.toolName}`;
      toolSequences.set(sequence, (toolSequences.get(sequence) || 0) + 1);
    }
    
    return Array.from(toolSequences.entries())
      .filter(([, count]) => count > 2)
      .map(([sequence, count]) => ({
        patternId: `tool_pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patternType: 'tool_usage' as const,
        confidence: Math.min(count / receipts.length, 1),
        frequency: count,
        lastSeen: new Date(),
        firstSeen: new Date(Date.now() - 86400000), // 1 day ago
        metadata: {
          toolsInvolved: sequence.split('->'),
          averageExecutionTime: 2000,
          successRate: 0.9,
          errorPatterns: [],
          businessImpact: 'medium' as const,
          complexity: 3
        },
        triggerConditions: [sequence.split('->')[0]],
        expectedOutcomes: [sequence.split('->')[1]],
        variations: []
      }));
  }

  private analyzeTemporalPatterns(receipts: EnhancedToolReceipt[]): PatternAnalysis[] {
    // Analyze time-based patterns (e.g., daily routines, peak usage times)
    const hourlyUsage = new Map<number, number>();
    
    receipts.forEach(receipt => {
      const hour = new Date(receipt.timestamp).getHours();
      hourlyUsage.set(hour, (hourlyUsage.get(hour) || 0) + 1);
    });
    
    const peakHours = Array.from(hourlyUsage.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    if (peakHours.length > 0) {
      return [{
        patternId: `temporal_pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patternType: 'workflow_sequence',
        confidence: 0.8,
        frequency: peakHours[0][1],
        lastSeen: new Date(),
        firstSeen: new Date(Date.now() - 86400000),
        metadata: {
          toolsInvolved: ['temporal_analysis'],
          averageExecutionTime: 0,
          successRate: 1.0,
          errorPatterns: [],
          businessImpact: 'low',
          complexity: 2
        },
        triggerConditions: [`hour_${peakHours[0][0]}`],
        expectedOutcomes: ['increased_activity'],
        variations: []
      }];
    }
    
    return [];
  }

  private analyzeErrorPatterns(receipts: EnhancedToolReceipt[]): PatternAnalysis[] {
    const errorReceipts = receipts.filter(r => r.outcome === 'failure');
    
    if (errorReceipts.length > 0) {
      const errorTools = errorReceipts.reduce((acc, receipt) => {
        acc[receipt.toolName] = (acc[receipt.toolName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(errorTools).map(([tool, count]) => ({
        patternId: `error_pattern_${tool}_${Date.now()}`,
        patternType: 'error_recovery' as const,
        confidence: count / receipts.length,
        frequency: count,
        lastSeen: new Date(),
        firstSeen: new Date(Date.now() - 86400000),
        metadata: {
          toolsInvolved: [tool],
          averageExecutionTime: 0,
          successRate: 0,
          errorPatterns: ['tool_failure'],
          businessImpact: 'high',
          complexity: 8
        },
        triggerConditions: [tool],
        expectedOutcomes: ['error_recovery'],
        variations: []
      }));
    }
    
    return [];
  }
}

class MemoryOptimizer {
  async compressConversationHistory(history: ConversationEntry[]): Promise<ConversationEntry[]> {
    // Keep recent entries and important entries, compress older ones
    const recent = history.slice(-100); // Keep last 100 entries
    const important = history.filter(entry => 
      entry.metadata.userSatisfaction && entry.metadata.userSatisfaction > 4
    );
    
    return [...important, ...recent];
  }

  async optimizePatterns(patterns: LearnedPattern[]): Promise<LearnedPattern[]> {
    // Remove low-usage patterns and merge similar ones
    return patterns.filter(pattern => pattern.usageCount > 2);
  }
}

class InsightGenerator {
  async generateInsights(agentId: string, patterns: PatternAnalysis[]): Promise<string[]> {
    const insights: string[] = [];
    
    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8);
    if (highConfidencePatterns.length > 0) {
      insights.push(`${highConfidencePatterns.length} high-confidence patterns detected for optimization`);
    }
    
    const errorPatterns = patterns.filter(p => p.patternType === 'error_recovery');
    if (errorPatterns.length > 0) {
      insights.push(`${errorPatterns.length} error patterns identified for prevention strategies`);
    }
    
    return insights;
  }
}

