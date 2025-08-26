/**
 * Autonomous Task Planning Engine
 * 
 * Advanced algorithms for breaking down user goals into structured, executable workflows.
 * Implements intelligent phase generation, dependency analysis, and governance integration.
 * 
 * Key Features:
 * - Goal analysis and classification
 * - Intelligent phase generation based on goal type
 * - Dependency mapping and optimization
 * - Risk assessment and governance integration
 * - Resource estimation and planning
 * - Template-based and dynamic planning approaches
 */

import { AutonomousTaskPlan, AutonomousPhase, AutonomousGovernanceContext } from './AutonomousGovernanceExtension';

// Goal classification types
export interface GoalAnalysis {
  goalType: GoalType;
  complexity: 'low' | 'medium' | 'high';
  domain: GoalDomain;
  keywords: string[];
  entities: string[];
  intent: GoalIntent;
  riskFactors: RiskFactor[];
  estimatedDuration: number; // in minutes
  requiredCapabilities: string[];
  suggestedTemplate?: string;
}

export type GoalType = 
  | 'research_and_analysis'
  | 'content_creation'
  | 'software_development'
  | 'data_processing'
  | 'business_planning'
  | 'marketing_campaign'
  | 'project_management'
  | 'compliance_audit'
  | 'system_integration'
  | 'learning_and_training';

export type GoalDomain = 
  | 'technology'
  | 'business'
  | 'marketing'
  | 'finance'
  | 'healthcare'
  | 'education'
  | 'legal'
  | 'operations'
  | 'creative'
  | 'general';

export type GoalIntent = 
  | 'create'
  | 'analyze'
  | 'optimize'
  | 'automate'
  | 'research'
  | 'plan'
  | 'implement'
  | 'monitor'
  | 'report'
  | 'integrate';

export interface RiskFactor {
  type: 'data_access' | 'external_communication' | 'system_modification' | 'financial_impact' | 'compliance_requirement';
  level: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

// Phase templates for different goal types
export interface PhaseTemplate {
  id: string;
  title: string;
  description: string;
  estimatedDuration: number;
  requiredCapabilities: string[];
  tools: string[];
  dependencies: string[]; // Template IDs
  approvalRequired: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  artifacts: string[]; // Expected artifact types
}

/**
 * Advanced Task Planning Engine
 */
export class AutonomousTaskPlanningEngine {
  private phaseTemplates: Map<string, PhaseTemplate[]> = new Map();
  private goalPatterns: Map<string, RegExp[]> = new Map();
  private capabilityMap: Map<string, string[]> = new Map();

  constructor() {
    this.initializePhaseTemplates();
    this.initializeGoalPatterns();
    this.initializeCapabilityMap();
  }

  /**
   * Analyze a user goal and create a structured task plan
   */
  async createAdvancedPlan(
    goal: string, 
    governanceContext: AutonomousGovernanceContext
  ): Promise<AutonomousTaskPlan> {
    console.log(`🧠 [Planning] Creating advanced plan for goal: "${goal}"`);

    // 1. Analyze the goal
    const goalAnalysis = await this.analyzeGoal(goal);
    console.log(`📊 [Planning] Goal analysis:`, {
      type: goalAnalysis.goalType,
      complexity: goalAnalysis.complexity,
      domain: goalAnalysis.domain,
      estimatedDuration: goalAnalysis.estimatedDuration
    });

    // 2. Generate phases based on goal analysis
    const phases = await this.generatePhases(goalAnalysis, governanceContext);
    console.log(`📋 [Planning] Generated ${phases.length} phases`);

    // 3. Optimize phase dependencies and ordering
    const optimizedPhases = await this.optimizePhases(phases, goalAnalysis);
    console.log(`⚡ [Planning] Optimized phase dependencies`);

    // 4. Calculate risk assessment
    const riskLevel = await this.assessPlanRisk(optimizedPhases, goalAnalysis);
    console.log(`🛡️ [Planning] Plan risk level: ${riskLevel}`);

    // 5. Create the complete task plan
    const plan: AutonomousTaskPlan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      goal,
      description: this.generatePlanDescription(goal, goalAnalysis),
      phases: optimizedPhases,
      currentPhaseId: 1,
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedDuration: optimizedPhases.reduce((total, phase) => total + phase.estimatedDuration, 0),
      governanceContext,
      metadata: {
        complexity: goalAnalysis.complexity,
        riskLevel,
        requiresApproval: riskLevel !== 'low' || goalAnalysis.complexity !== 'low',
        userInterventionPoints: optimizedPhases
          .filter(p => p.approvalRequired)
          .map(p => p.title)
      }
    };

    console.log(`✅ [Planning] Advanced plan created:`, {
      planId: plan.id,
      phases: plan.phases.length,
      estimatedDuration: plan.estimatedDuration,
      riskLevel: plan.metadata.riskLevel
    });

    return plan;
  }

  /**
   * Analyze a goal to understand its type, complexity, and requirements
   */
  private async analyzeGoal(goal: string): Promise<GoalAnalysis> {
    const goalLower = goal.toLowerCase();
    
    // Determine goal type
    const goalType = this.classifyGoalType(goalLower);
    
    // Determine domain
    const domain = this.classifyGoalDomain(goalLower);
    
    // Determine intent
    const intent = this.classifyGoalIntent(goalLower);
    
    // Extract keywords and entities
    const keywords = this.extractKeywords(goalLower);
    const entities = this.extractEntities(goal);
    
    // Assess complexity
    const complexity = this.assessComplexity(goalLower, keywords, entities);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(goalLower, keywords);
    
    // Estimate duration
    const estimatedDuration = this.estimateDuration(goalType, complexity, keywords.length);
    
    // Determine required capabilities
    const requiredCapabilities = this.determineRequiredCapabilities(goalType, intent, keywords);
    
    // Suggest template if applicable
    const suggestedTemplate = this.suggestTemplate(goalType, complexity, domain);

    return {
      goalType,
      complexity,
      domain,
      keywords,
      entities,
      intent,
      riskFactors,
      estimatedDuration,
      requiredCapabilities,
      suggestedTemplate
    };
  }

  /**
   * Generate phases based on goal analysis
   */
  private async generatePhases(
    goalAnalysis: GoalAnalysis, 
    governanceContext: AutonomousGovernanceContext
  ): Promise<AutonomousPhase[]> {
    console.log(`🏗️ [Planning] Generating phases for ${goalAnalysis.goalType} goal`);

    // Get base template phases
    const templatePhases = this.getTemplatePhases(goalAnalysis.goalType, goalAnalysis.complexity);
    
    // Customize phases based on specific goal requirements
    const customizedPhases = await this.customizePhases(templatePhases, goalAnalysis, governanceContext);
    
    // Add governance-specific phases if needed
    const governancePhases = await this.addGovernancePhases(customizedPhases, goalAnalysis, governanceContext);
    
    return governancePhases;
  }

  /**
   * Get template phases for a specific goal type
   */
  private getTemplatePhases(goalType: GoalType, complexity: 'low' | 'medium' | 'high'): PhaseTemplate[] {
    const templates = this.phaseTemplates.get(goalType) || this.phaseTemplates.get('general') || [];
    
    // Filter templates based on complexity
    return templates.filter(template => {
      if (complexity === 'low') return template.riskLevel === 'low';
      if (complexity === 'medium') return template.riskLevel !== 'high';
      return true; // High complexity includes all phases
    });
  }

  /**
   * Customize template phases for specific goal requirements
   */
  private async customizePhases(
    templatePhases: PhaseTemplate[],
    goalAnalysis: GoalAnalysis,
    governanceContext: AutonomousGovernanceContext
  ): Promise<AutonomousPhase[]> {
    const phases: AutonomousPhase[] = [];
    
    for (let i = 0; i < templatePhases.length; i++) {
      const template = templatePhases[i];
      
      const phase: AutonomousPhase = {
        id: i + 1,
        title: this.customizePhaseTitle(template.title, goalAnalysis),
        description: this.customizePhaseDescription(template.description, goalAnalysis),
        status: 'pending',
        dependencies: this.mapTemplateDependencies(template.dependencies, templatePhases),
        estimatedDuration: this.adjustPhaseDuration(template.estimatedDuration, goalAnalysis.complexity),
        requiredCapabilities: [...template.requiredCapabilities, ...goalAnalysis.requiredCapabilities].filter((v, i, a) => a.indexOf(v) === i),
        approvalRequired: template.approvalRequired || this.requiresApproval(template, goalAnalysis, governanceContext),
        tools: this.selectPhaseTools(template.tools, goalAnalysis, governanceContext),
        artifacts: [],
        receipts: []
      };
      
      phases.push(phase);
    }
    
    return phases;
  }

  /**
   * Add governance-specific phases if required
   */
  private async addGovernancePhases(
    phases: AutonomousPhase[],
    goalAnalysis: GoalAnalysis,
    governanceContext: AutonomousGovernanceContext
  ): Promise<AutonomousPhase[]> {
    const enhancedPhases = [...phases];
    
    // Add compliance review phase for high-risk goals
    if (goalAnalysis.riskFactors.some(rf => rf.level === 'high')) {
      const compliancePhase: AutonomousPhase = {
        id: enhancedPhases.length + 1,
        title: 'Compliance Review',
        description: 'Review plan and approach for compliance with governance policies',
        status: 'pending',
        dependencies: [], // Can run in parallel with initial phases
        estimatedDuration: 10,
        requiredCapabilities: ['compliance_review', 'policy_analysis'],
        approvalRequired: true,
        tools: ['policy_checker', 'compliance_validator'],
        artifacts: [],
        receipts: []
      };
      
      enhancedPhases.splice(1, 0, compliancePhase); // Insert after first phase
      
      // Update subsequent phase IDs and dependencies
      for (let i = 2; i < enhancedPhases.length; i++) {
        enhancedPhases[i].id = i + 1;
        enhancedPhases[i].dependencies = enhancedPhases[i].dependencies.map(dep => 
          dep >= 2 ? dep + 1 : dep
        );
      }
    }
    
    // Add final review phase for complex goals
    if (goalAnalysis.complexity === 'high') {
      const reviewPhase: AutonomousPhase = {
        id: enhancedPhases.length + 1,
        title: 'Final Review and Validation',
        description: 'Comprehensive review of all deliverables and validation against original goal',
        status: 'pending',
        dependencies: [enhancedPhases.length], // Depends on last current phase
        estimatedDuration: 15,
        requiredCapabilities: ['quality_assurance', 'validation'],
        approvalRequired: true,
        tools: ['validation_tools', 'quality_checker'],
        artifacts: [],
        receipts: []
      };
      
      enhancedPhases.push(reviewPhase);
    }
    
    return enhancedPhases;
  }

  /**
   * Optimize phase dependencies and ordering
   */
  private async optimizePhases(
    phases: AutonomousPhase[],
    goalAnalysis: GoalAnalysis
  ): Promise<AutonomousPhase[]> {
    console.log(`⚡ [Planning] Optimizing ${phases.length} phases`);
    
    // Identify phases that can run in parallel
    const parallelizablePhases = this.identifyParallelizablePhases(phases);
    
    // Optimize critical path
    const optimizedPhases = this.optimizeCriticalPath(phases, parallelizablePhases);
    
    // Balance resource utilization
    const balancedPhases = this.balanceResourceUtilization(optimizedPhases, goalAnalysis);
    
    return balancedPhases;
  }

  /**
   * Assess overall plan risk level
   */
  private async assessPlanRisk(
    phases: AutonomousPhase[],
    goalAnalysis: GoalAnalysis
  ): Promise<'low' | 'medium' | 'high'> {
    // Count high-risk factors
    const highRiskFactors = goalAnalysis.riskFactors.filter(rf => rf.level === 'high').length;
    const mediumRiskFactors = goalAnalysis.riskFactors.filter(rf => rf.level === 'medium').length;
    
    // Count approval-required phases
    const approvalPhases = phases.filter(p => p.approvalRequired).length;
    
    // Calculate risk score
    let riskScore = 0;
    riskScore += highRiskFactors * 3;
    riskScore += mediumRiskFactors * 2;
    riskScore += approvalPhases * 1;
    riskScore += goalAnalysis.complexity === 'high' ? 2 : goalAnalysis.complexity === 'medium' ? 1 : 0;
    
    // Determine risk level
    if (riskScore >= 8) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
  }

  // ============================================================================
  // GOAL CLASSIFICATION METHODS
  // ============================================================================

  private classifyGoalType(goalLower: string): GoalType {
    const patterns = this.goalPatterns;
    
    for (const [type, regexes] of patterns.entries()) {
      if (regexes.some(regex => regex.test(goalLower))) {
        return type as GoalType;
      }
    }
    
    return 'research_and_analysis'; // Default
  }

  private classifyGoalDomain(goalLower: string): GoalDomain {
    const domainKeywords = {
      technology: ['software', 'code', 'api', 'database', 'system', 'tech', 'programming', 'development'],
      business: ['business', 'strategy', 'revenue', 'profit', 'market', 'customer', 'sales'],
      marketing: ['marketing', 'campaign', 'brand', 'promotion', 'advertising', 'social media'],
      finance: ['financial', 'budget', 'cost', 'investment', 'accounting', 'revenue'],
      healthcare: ['health', 'medical', 'patient', 'clinical', 'healthcare'],
      education: ['education', 'learning', 'training', 'course', 'curriculum'],
      legal: ['legal', 'compliance', 'regulation', 'policy', 'contract'],
      operations: ['operations', 'process', 'workflow', 'efficiency', 'automation'],
      creative: ['design', 'creative', 'content', 'writing', 'visual', 'artistic']
    };
    
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => goalLower.includes(keyword))) {
        return domain as GoalDomain;
      }
    }
    
    return 'general';
  }

  private classifyGoalIntent(goalLower: string): GoalIntent {
    const intentKeywords = {
      create: ['create', 'build', 'develop', 'generate', 'make', 'design'],
      analyze: ['analyze', 'examine', 'study', 'investigate', 'review'],
      optimize: ['optimize', 'improve', 'enhance', 'refine', 'streamline'],
      automate: ['automate', 'streamline', 'systematize', 'mechanize'],
      research: ['research', 'investigate', 'explore', 'discover', 'find'],
      plan: ['plan', 'strategy', 'roadmap', 'schedule', 'organize'],
      implement: ['implement', 'deploy', 'execute', 'launch', 'roll out'],
      monitor: ['monitor', 'track', 'observe', 'watch', 'measure'],
      report: ['report', 'document', 'summarize', 'present'],
      integrate: ['integrate', 'connect', 'combine', 'merge', 'link']
    };
    
    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (keywords.some(keyword => goalLower.includes(keyword))) {
        return intent as GoalIntent;
      }
    }
    
    return 'create'; // Default
  }

  private extractKeywords(goalLower: string): string[] {
    // Simple keyword extraction - in production, this would use NLP
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'];
    
    return goalLower
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10); // Limit to top 10 keywords
  }

  private extractEntities(goal: string): string[] {
    // Simple entity extraction - in production, this would use NER
    const entities: string[] = [];
    
    // Extract capitalized words (potential proper nouns)
    const capitalizedWords = goal.match(/\b[A-Z][a-z]+\b/g) || [];
    entities.push(...capitalizedWords);
    
    // Extract quoted strings
    const quotedStrings = goal.match(/"([^"]+)"/g) || [];
    entities.push(...quotedStrings.map(s => s.replace(/"/g, '')));
    
    return [...new Set(entities)].slice(0, 5); // Unique entities, limit to 5
  }

  private assessComplexity(goalLower: string, keywords: string[], entities: string[]): 'low' | 'medium' | 'high' {
    let complexityScore = 0;
    
    // Length-based complexity
    complexityScore += Math.min(goalLower.length / 50, 3);
    
    // Keyword-based complexity
    complexityScore += Math.min(keywords.length / 3, 3);
    
    // Entity-based complexity
    complexityScore += Math.min(entities.length / 2, 2);
    
    // Complex action words
    const complexActions = ['integrate', 'optimize', 'analyze', 'implement', 'deploy', 'automate'];
    if (complexActions.some(action => goalLower.includes(action))) {
      complexityScore += 2;
    }
    
    // Multiple steps indicated
    if (goalLower.includes(' and ') || goalLower.includes(' then ') || goalLower.includes(' after ')) {
      complexityScore += 1;
    }
    
    if (complexityScore >= 7) return 'high';
    if (complexityScore >= 4) return 'medium';
    return 'low';
  }

  private identifyRiskFactors(goalLower: string, keywords: string[]): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];
    
    // Data access risks
    if (keywords.some(k => ['database', 'data', 'personal', 'sensitive', 'private'].includes(k))) {
      riskFactors.push({
        type: 'data_access',
        level: 'medium',
        description: 'Goal involves accessing potentially sensitive data',
        mitigation: 'Implement data access controls and audit logging'
      });
    }
    
    // External communication risks
    if (keywords.some(k => ['email', 'send', 'publish', 'post', 'share', 'external'].includes(k))) {
      riskFactors.push({
        type: 'external_communication',
        level: 'medium',
        description: 'Goal involves external communication',
        mitigation: 'Require approval for external communications'
      });
    }
    
    // System modification risks
    if (keywords.some(k => ['deploy', 'install', 'configure', 'modify', 'change', 'update'].includes(k))) {
      riskFactors.push({
        type: 'system_modification',
        level: 'high',
        description: 'Goal involves system modifications',
        mitigation: 'Require explicit approval for system changes'
      });
    }
    
    // Financial impact risks
    if (keywords.some(k => ['payment', 'purchase', 'cost', 'budget', 'financial', 'money'].includes(k))) {
      riskFactors.push({
        type: 'financial_impact',
        level: 'high',
        description: 'Goal has potential financial impact',
        mitigation: 'Require financial approval and budget verification'
      });
    }
    
    // Compliance risks
    if (keywords.some(k => ['compliance', 'regulation', 'legal', 'policy', 'audit'].includes(k))) {
      riskFactors.push({
        type: 'compliance_requirement',
        level: 'medium',
        description: 'Goal involves compliance considerations',
        mitigation: 'Include compliance review in workflow'
      });
    }
    
    return riskFactors;
  }

  private estimateDuration(goalType: GoalType, complexity: 'low' | 'medium' | 'high', keywordCount: number): number {
    const baseDurations = {
      research_and_analysis: 30,
      content_creation: 45,
      software_development: 90,
      data_processing: 60,
      business_planning: 75,
      marketing_campaign: 60,
      project_management: 120,
      compliance_audit: 90,
      system_integration: 120,
      learning_and_training: 45
    };
    
    let duration = baseDurations[goalType] || 60;
    
    // Adjust for complexity
    const complexityMultipliers = { low: 0.7, medium: 1.0, high: 1.5 };
    duration *= complexityMultipliers[complexity];
    
    // Adjust for keyword count (more keywords = more complex)
    duration *= (1 + keywordCount * 0.1);
    
    return Math.round(duration);
  }

  private determineRequiredCapabilities(goalType: GoalType, intent: GoalIntent, keywords: string[]): string[] {
    const capabilities = new Set<string>();
    
    // Add capabilities based on goal type
    const typeCapabilities = this.capabilityMap.get(goalType) || [];
    typeCapabilities.forEach(cap => capabilities.add(cap));
    
    // Add capabilities based on intent
    const intentCapabilities = {
      create: ['content_generation', 'design'],
      analyze: ['data_analysis', 'research'],
      optimize: ['optimization', 'performance_analysis'],
      automate: ['automation', 'scripting'],
      research: ['web_search', 'information_gathering'],
      plan: ['planning', 'strategy_development'],
      implement: ['implementation', 'deployment'],
      monitor: ['monitoring', 'analytics'],
      report: ['documentation', 'reporting'],
      integrate: ['integration', 'api_management']
    };
    
    const intentCaps = intentCapabilities[intent] || [];
    intentCaps.forEach(cap => capabilities.add(cap));
    
    // Add capabilities based on keywords
    const keywordCapabilities = {
      code: ['programming', 'software_development'],
      data: ['data_analysis', 'database_management'],
      design: ['design', 'visual_creation'],
      test: ['testing', 'quality_assurance'],
      deploy: ['deployment', 'devops'],
      monitor: ['monitoring', 'analytics'],
      document: ['documentation', 'technical_writing']
    };
    
    keywords.forEach(keyword => {
      const caps = keywordCapabilities[keyword] || [];
      caps.forEach(cap => capabilities.add(cap));
    });
    
    return Array.from(capabilities);
  }

  private suggestTemplate(goalType: GoalType, complexity: 'low' | 'medium' | 'high', domain: GoalDomain): string | undefined {
    const templates = {
      software_development: 'code_shell',
      research_and_analysis: 'research_dossier',
      business_planning: 'launch_plan',
      marketing_campaign: 'launch_plan',
      compliance_audit: 'audit_pack'
    };
    
    return templates[goalType];
  }

  // ============================================================================
  // PHASE OPTIMIZATION METHODS
  // ============================================================================

  private identifyParallelizablePhases(phases: AutonomousPhase[]): number[][] {
    const parallelGroups: number[][] = [];
    const processed = new Set<number>();
    
    for (const phase of phases) {
      if (processed.has(phase.id)) continue;
      
      const parallelGroup = [phase.id];
      processed.add(phase.id);
      
      // Find other phases that can run in parallel
      for (const otherPhase of phases) {
        if (processed.has(otherPhase.id)) continue;
        
        if (this.canRunInParallel(phase, otherPhase, phases)) {
          parallelGroup.push(otherPhase.id);
          processed.add(otherPhase.id);
        }
      }
      
      if (parallelGroup.length > 1) {
        parallelGroups.push(parallelGroup);
      }
    }
    
    return parallelGroups;
  }

  private canRunInParallel(phase1: AutonomousPhase, phase2: AutonomousPhase, allPhases: AutonomousPhase[]): boolean {
    // Check if phases have conflicting dependencies
    const phase1Deps = new Set(phase1.dependencies);
    const phase2Deps = new Set(phase2.dependencies);
    
    // If one phase depends on the other, they can't run in parallel
    if (phase1Deps.has(phase2.id) || phase2Deps.has(phase1.id)) {
      return false;
    }
    
    // Check for resource conflicts
    const phase1Tools = new Set(phase1.tools);
    const phase2Tools = new Set(phase2.tools);
    
    // If phases use conflicting tools, they might not be able to run in parallel
    const exclusiveTools = ['database_write', 'system_deploy', 'file_system_modify'];
    const hasConflict = exclusiveTools.some(tool => 
      phase1Tools.has(tool) && phase2Tools.has(tool)
    );
    
    return !hasConflict;
  }

  private optimizeCriticalPath(phases: AutonomousPhase[], parallelGroups: number[][]): AutonomousPhase[] {
    // Simple critical path optimization - in production, this would be more sophisticated
    const optimizedPhases = [...phases];
    
    // Adjust estimated durations for parallel phases
    for (const group of parallelGroups) {
      if (group.length > 1) {
        const maxDuration = Math.max(...group.map(id => 
          optimizedPhases.find(p => p.id === id)?.estimatedDuration || 0
        ));
        
        // Set all phases in the group to the maximum duration (they'll run in parallel)
        group.forEach(id => {
          const phase = optimizedPhases.find(p => p.id === id);
          if (phase) {
            phase.estimatedDuration = maxDuration;
          }
        });
      }
    }
    
    return optimizedPhases;
  }

  private balanceResourceUtilization(phases: AutonomousPhase[], goalAnalysis: GoalAnalysis): AutonomousPhase[] {
    // Simple resource balancing - distribute intensive phases
    const balancedPhases = [...phases];
    
    // Identify resource-intensive phases
    const intensivePhases = balancedPhases.filter(phase => 
      phase.estimatedDuration > 30 || 
      phase.tools.length > 3 ||
      phase.requiredCapabilities.length > 3
    );
    
    // Spread intensive phases across the timeline
    if (intensivePhases.length > 1) {
      const totalPhases = balancedPhases.length;
      const spacing = Math.floor(totalPhases / intensivePhases.length);
      
      intensivePhases.forEach((phase, index) => {
        const targetPosition = index * spacing;
        const currentPosition = balancedPhases.findIndex(p => p.id === phase.id);
        
        if (currentPosition !== targetPosition && targetPosition < totalPhases) {
          // Simple reordering - in production, this would respect dependencies
          const [movedPhase] = balancedPhases.splice(currentPosition, 1);
          balancedPhases.splice(targetPosition, 0, movedPhase);
        }
      });
    }
    
    return balancedPhases;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generatePlanDescription(goal: string, goalAnalysis: GoalAnalysis): string {
    return `Autonomous execution plan for ${goalAnalysis.goalType.replace(/_/g, ' ')} goal: ${goal}. ` +
           `Estimated complexity: ${goalAnalysis.complexity}, domain: ${goalAnalysis.domain}, ` +
           `duration: ${goalAnalysis.estimatedDuration} minutes.`;
  }

  private customizePhaseTitle(templateTitle: string, goalAnalysis: GoalAnalysis): string {
    // Simple title customization based on goal analysis
    return templateTitle.replace(/\{domain\}/g, goalAnalysis.domain)
                       .replace(/\{type\}/g, goalAnalysis.goalType.replace(/_/g, ' '));
  }

  private customizePhaseDescription(templateDescription: string, goalAnalysis: GoalAnalysis): string {
    // Simple description customization
    return templateDescription.replace(/\{keywords\}/g, goalAnalysis.keywords.join(', '))
                             .replace(/\{entities\}/g, goalAnalysis.entities.join(', '));
  }

  private mapTemplateDependencies(templateDeps: string[], templates: PhaseTemplate[]): number[] {
    // Map template dependency names to phase IDs
    return templateDeps.map(depName => {
      const depIndex = templates.findIndex(t => t.id === depName);
      return depIndex >= 0 ? depIndex + 1 : 0;
    }).filter(id => id > 0);
  }

  private adjustPhaseDuration(baseDuration: number, complexity: 'low' | 'medium' | 'high'): number {
    const multipliers = { low: 0.8, medium: 1.0, high: 1.3 };
    return Math.round(baseDuration * multipliers[complexity]);
  }

  private requiresApproval(
    template: PhaseTemplate, 
    goalAnalysis: GoalAnalysis, 
    governanceContext: AutonomousGovernanceContext
  ): boolean {
    // Additional approval logic beyond template requirements
    return template.riskLevel === 'high' || 
           goalAnalysis.riskFactors.some(rf => rf.level === 'high') ||
           governanceContext.approvalGates.phaseTransitions;
  }

  private selectPhaseTools(
    templateTools: string[], 
    goalAnalysis: GoalAnalysis, 
    governanceContext: AutonomousGovernanceContext
  ): string[] {
    // Filter tools based on governance context and goal requirements
    const allowedTools = governanceContext.resourceLimits.allowedTools;
    const selectedTools = templateTools.filter(tool => allowedTools.includes(tool));
    
    // Add goal-specific tools
    const goalSpecificTools = this.getGoalSpecificTools(goalAnalysis);
    selectedTools.push(...goalSpecificTools.filter(tool => allowedTools.includes(tool)));
    
    return [...new Set(selectedTools)]; // Remove duplicates
  }

  private getGoalSpecificTools(goalAnalysis: GoalAnalysis): string[] {
    const toolMap = {
      research_and_analysis: ['web_search', 'document_analysis', 'data_analysis'],
      content_creation: ['document_generation', 'image_generation', 'content_tools'],
      software_development: ['code_generation', 'testing_tools', 'deployment_tools'],
      data_processing: ['data_analysis', 'database_tools', 'visualization_tools'],
      business_planning: ['planning_tools', 'financial_analysis', 'market_research'],
      marketing_campaign: ['content_tools', 'social_media_tools', 'analytics_tools']
    };
    
    return toolMap[goalAnalysis.goalType] || [];
  }

  // ============================================================================
  // INITIALIZATION METHODS
  // ============================================================================

  private initializePhaseTemplates(): void {
    // Research and Analysis templates
    this.phaseTemplates.set('research_and_analysis', [
      {
        id: 'topic_analysis',
        title: 'Topic Analysis',
        description: 'Analyze the research topic and define scope',
        estimatedDuration: 15,
        requiredCapabilities: ['analysis', 'research'],
        tools: ['web_search', 'document_analysis'],
        dependencies: [],
        approvalRequired: false,
        riskLevel: 'low',
        artifacts: ['topic_analysis_doc']
      },
      {
        id: 'information_gathering',
        title: 'Information Gathering',
        description: 'Collect relevant information from various sources',
        estimatedDuration: 30,
        requiredCapabilities: ['research', 'information_gathering'],
        tools: ['web_search', 'database_search', 'document_retrieval'],
        dependencies: ['topic_analysis'],
        approvalRequired: false,
        riskLevel: 'low',
        artifacts: ['research_data', 'source_list']
      },
      {
        id: 'analysis_synthesis',
        title: 'Analysis and Synthesis',
        description: 'Analyze gathered information and synthesize findings',
        estimatedDuration: 25,
        requiredCapabilities: ['analysis', 'synthesis'],
        tools: ['data_analysis', 'text_analysis'],
        dependencies: ['information_gathering'],
        approvalRequired: false,
        riskLevel: 'low',
        artifacts: ['analysis_report', 'key_findings']
      },
      {
        id: 'documentation',
        title: 'Documentation',
        description: 'Create comprehensive documentation of findings',
        estimatedDuration: 20,
        requiredCapabilities: ['documentation', 'writing'],
        tools: ['document_generation', 'formatting_tools'],
        dependencies: ['analysis_synthesis'],
        approvalRequired: false,
        riskLevel: 'low',
        artifacts: ['final_report', 'executive_summary']
      }
    ]);

    // Software Development templates
    this.phaseTemplates.set('software_development', [
      {
        id: 'requirements_analysis',
        title: 'Requirements Analysis',
        description: 'Analyze and document software requirements',
        estimatedDuration: 20,
        requiredCapabilities: ['analysis', 'requirements_engineering'],
        tools: ['document_analysis', 'requirements_tools'],
        dependencies: [],
        approvalRequired: false,
        riskLevel: 'low',
        artifacts: ['requirements_doc', 'user_stories']
      },
      {
        id: 'design_architecture',
        title: 'Design and Architecture',
        description: 'Create software design and architecture',
        estimatedDuration: 30,
        requiredCapabilities: ['design', 'architecture'],
        tools: ['design_tools', 'architecture_tools'],
        dependencies: ['requirements_analysis'],
        approvalRequired: true,
        riskLevel: 'medium',
        artifacts: ['design_doc', 'architecture_diagram']
      },
      {
        id: 'implementation',
        title: 'Implementation',
        description: 'Implement the software solution',
        estimatedDuration: 60,
        requiredCapabilities: ['programming', 'implementation'],
        tools: ['code_generation', 'development_tools'],
        dependencies: ['design_architecture'],
        approvalRequired: true,
        riskLevel: 'high',
        artifacts: ['source_code', 'build_artifacts']
      },
      {
        id: 'testing_validation',
        title: 'Testing and Validation',
        description: 'Test and validate the implementation',
        estimatedDuration: 25,
        requiredCapabilities: ['testing', 'validation'],
        tools: ['testing_tools', 'validation_tools'],
        dependencies: ['implementation'],
        approvalRequired: false,
        riskLevel: 'medium',
        artifacts: ['test_results', 'validation_report']
      }
    ]);

    // Add more templates for other goal types...
    // (Content Creation, Business Planning, etc.)
  }

  private initializeGoalPatterns(): void {
    this.goalPatterns.set('research_and_analysis', [
      /research|analyze|study|investigate|examine|explore/i,
      /find out|learn about|understand|discover/i,
      /what is|how does|why do|when did/i
    ]);

    this.goalPatterns.set('software_development', [
      /build|create|develop|code|program|implement/i,
      /software|application|app|system|website|api/i,
      /deploy|launch|release/i
    ]);

    this.goalPatterns.set('content_creation', [
      /write|create|generate|produce|draft/i,
      /content|article|blog|document|report|presentation/i,
      /design|visual|graphic|image/i
    ]);

    this.goalPatterns.set('data_processing', [
      /process|analyze|transform|clean|organize/i,
      /data|dataset|database|information|records/i,
      /extract|import|export|migrate/i
    ]);

    this.goalPatterns.set('business_planning', [
      /plan|strategy|roadmap|business|market/i,
      /launch|startup|venture|project/i,
      /budget|financial|revenue|profit/i
    ]);
  }

  private initializeCapabilityMap(): void {
    this.capabilityMap.set('research_and_analysis', [
      'web_search', 'data_analysis', 'information_gathering', 'synthesis', 'documentation'
    ]);

    this.capabilityMap.set('software_development', [
      'programming', 'software_design', 'testing', 'deployment', 'version_control'
    ]);

    this.capabilityMap.set('content_creation', [
      'writing', 'content_generation', 'design', 'editing', 'publishing'
    ]);

    this.capabilityMap.set('data_processing', [
      'data_analysis', 'data_transformation', 'database_management', 'visualization'
    ]);

    this.capabilityMap.set('business_planning', [
      'strategic_planning', 'market_analysis', 'financial_planning', 'project_management'
    ]);
  }
}

// Export singleton instance
export const autonomousTaskPlanningEngine = new AutonomousTaskPlanningEngine();

