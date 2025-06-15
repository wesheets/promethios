import { 
  ScorecardMetric, 
  ScorecardContext,
  ScorecardTemplate,
  AgentScorecardResult,
  AgentComparisonResult 
} from './types';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';

/**
 * ScorecardMetricRegistry - Manages the lifecycle of metrics used in agent scorecards
 * Implements the core scorecard metric management functionality
 */
export class ScorecardMetricRegistry {
  private static instance: ScorecardMetricRegistry;
  private metrics: Map<string, ScorecardMetric> = new Map();

  private constructor() {
    this.initializeDefaultMetrics();
  }

  public static getInstance(): ScorecardMetricRegistry {
    if (!ScorecardMetricRegistry.instance) {
      ScorecardMetricRegistry.instance = new ScorecardMetricRegistry();
    }
    return ScorecardMetricRegistry.instance;
  }

  /**
   * Register a new scorecard metric
   * @param metric - The metric to register
   * @returns boolean - Success status
   */
  registerMetric(metric: ScorecardMetric): boolean {
    try {
      this.metrics.set(metric.id, metric);
      console.log('ScorecardServices: Metric registered successfully:', metric.id);
      return true;
    } catch (error) {
      console.error('ScorecardServices: Error registering metric:', error);
      return false;
    }
  }

  /**
   * Deregister a scorecard metric
   * @param metricId - The metric ID to deregister
   * @returns boolean - Success status
   */
  deregisterMetric(metricId: string): boolean {
    try {
      const deleted = this.metrics.delete(metricId);
      if (deleted) {
        console.log('ScorecardServices: Metric deregistered successfully:', metricId);
      }
      return deleted;
    } catch (error) {
      console.error('ScorecardServices: Error deregistering metric:', error);
      return false;
    }
  }

  /**
   * Get a specific metric by ID
   * @param metricId - The metric ID
   * @returns ScorecardMetric | null
   */
  getMetric(metricId: string): ScorecardMetric | null {
    return this.metrics.get(metricId) || null;
  }

  /**
   * Get all registered metrics
   * @returns ScorecardMetric[]
   */
  getAllMetrics(): ScorecardMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get metrics by category
   * @param category - The category to filter by
   * @returns ScorecardMetric[]
   */
  getMetricsByCategory(category: string): ScorecardMetric[] {
    return this.getAllMetrics().filter(metric => metric.category === category);
  }

  /**
   * Initialize default scorecard metrics
   */
  private initializeDefaultMetrics(): void {
    // Performance Metrics
    this.registerMetric({
      id: 'accuracy',
      name: 'Accuracy Score',
      description: 'Overall accuracy of agent responses',
      category: 'Performance',
      valueType: 'percentage',
      calculate: this.calculateAccuracy,
      interpretationRule: {
        direction: 'higher_is_better',
        thresholds: {
          warning: 70,
          critical: 50
        }
      },
      visualizationHint: 'gauge',
      weight: 0.3
    });

    this.registerMetric({
      id: 'response-time',
      name: 'Response Time',
      description: 'Average response time in milliseconds',
      category: 'Performance',
      valueType: 'duration',
      calculate: this.calculateResponseTime,
      interpretationRule: {
        direction: 'lower_is_better',
        thresholds: {
          warning: 2000,
          critical: 5000
        }
      },
      visualizationHint: 'bar',
      weight: 0.2
    });

    this.registerMetric({
      id: 'throughput',
      name: 'Throughput',
      description: 'Requests processed per minute',
      category: 'Performance',
      valueType: 'score',
      calculate: this.calculateThroughput,
      interpretationRule: {
        direction: 'higher_is_better',
        thresholds: {
          warning: 10,
          critical: 5
        }
      },
      visualizationHint: 'trend',
      weight: 0.15
    });

    // Fairness & Bias Metrics
    this.registerMetric({
      id: 'bias-fairness',
      name: 'Fairness Index',
      description: 'Measures bias and fairness in agent responses',
      category: 'Fairness',
      valueType: 'percentage',
      calculate: this.calculateFairnessIndex,
      interpretationRule: {
        direction: 'higher_is_better',
        thresholds: {
          warning: 80,
          critical: 60
        }
      },
      visualizationHint: 'gauge',
      weight: 0.25
    });

    this.registerMetric({
      id: 'governance-compliance',
      name: 'Governance Compliance',
      description: 'Adherence to governance policies and rules',
      category: 'Compliance',
      valueType: 'percentage',
      calculate: this.calculateGovernanceCompliance,
      interpretationRule: {
        direction: 'higher_is_better',
        thresholds: {
          warning: 90,
          critical: 75
        }
      },
      visualizationHint: 'gauge',
      weight: 0.3
    });

    this.registerMetric({
      id: 'robustness',
      name: 'Robustness Score',
      description: 'Performance under adversarial conditions',
      category: 'Robustness',
      valueType: 'percentage',
      calculate: this.calculateRobustness,
      interpretationRule: {
        direction: 'higher_is_better',
        thresholds: {
          warning: 75,
          critical: 50
        }
      },
      visualizationHint: 'bar',
      weight: 0.2
    });
  }

  // Default metric calculation functions
  private async calculateAccuracy(agentId: string, context: ScorecardContext): Promise<number> {
    // Mock implementation - in real system, this would analyze agent interactions
    // and calculate accuracy based on correct vs incorrect responses
    const baseAccuracy = 85 + Math.random() * 10; // 85-95%
    return Math.min(100, Math.max(0, baseAccuracy));
  }

  private async calculateResponseTime(agentId: string, context: ScorecardContext): Promise<number> {
    // Mock implementation - would analyze actual response times
    const baseTime = 800 + Math.random() * 1200; // 800-2000ms
    return Math.round(baseTime);
  }

  private async calculateThroughput(agentId: string, context: ScorecardContext): Promise<number> {
    // Mock implementation - would analyze request processing rates
    const baseThroughput = 15 + Math.random() * 25; // 15-40 requests/min
    return Math.round(baseThroughput);
  }

  private async calculateFairnessIndex(agentId: string, context: ScorecardContext): Promise<number> {
    // Mock implementation - would analyze bias in responses across different groups
    const baseFairness = 80 + Math.random() * 15; // 80-95%
    return Math.min(100, Math.max(0, baseFairness));
  }

  private async calculateGovernanceCompliance(agentId: string, context: ScorecardContext): Promise<number> {
    // Mock implementation - would check adherence to governance policies
    const baseCompliance = 88 + Math.random() * 10; // 88-98%
    return Math.min(100, Math.max(0, baseCompliance));
  }

  private async calculateRobustness(agentId: string, context: ScorecardContext): Promise<number> {
    // Mock implementation - would test performance under adversarial conditions
    const baseRobustness = 75 + Math.random() * 20; // 75-95%
    return Math.min(100, Math.max(0, baseRobustness));
  }
}

/**
 * AgentEvaluationService - Orchestrates the evaluation of agents against scorecards
 */
export class AgentEvaluationService {
  private static instance: AgentEvaluationService;
  private metricRegistry: ScorecardMetricRegistry;

  private constructor() {
    this.metricRegistry = ScorecardMetricRegistry.getInstance();
  }

  public static getInstance(): AgentEvaluationService {
    if (!AgentEvaluationService.instance) {
      AgentEvaluationService.instance = new AgentEvaluationService();
    }
    return AgentEvaluationService.instance;
  }

  /**
   * Save a scorecard template
   * @param template - The template to save
   * @returns Promise<string> - The template ID
   */
  async saveScorecardTemplate(template: Omit<ScorecardTemplate, 'id'>): Promise<string> {
    console.log('ScorecardServices: Attempting to save scorecard template.');
    try {
      const docRef = await addDoc(collection(db, 'scorecardTemplates'), template);
      await updateDoc(docRef, { id: docRef.id });
      console.log('ScorecardServices: Scorecard template saved:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('ScorecardServices: Error saving scorecard template:', error);
      throw new Error('Failed to save scorecard template');
    }
  }

  /**
   * Get a scorecard template by ID
   * @param templateId - The template ID
   * @returns Promise<ScorecardTemplate | null>
   */
  async getScorecardTemplate(templateId: string): Promise<ScorecardTemplate | null> {
    console.log('ScorecardServices: Attempting to get scorecard template:', templateId);
    try {
      const docRef = doc(db, 'scorecardTemplates', templateId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('ScorecardServices: Scorecard template found:', docSnap.id);
        return { id: docSnap.id, ...docSnap.data() } as ScorecardTemplate;
      }
      
      console.log('ScorecardServices: Scorecard template not found:', templateId);
      return null;
    } catch (error) {
      console.error('ScorecardServices: Error getting scorecard template:', error);
      throw new Error('Failed to retrieve scorecard template');
    }
  }

  /**
   * List all scorecard templates
   * @returns Promise<ScorecardTemplate[]>
   */
  async listScorecardTemplates(): Promise<ScorecardTemplate[]> {
    console.log('ScorecardServices: Attempting to list all scorecard templates.');
    try {
      const q = query(collection(db, 'scorecardTemplates'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const templates: ScorecardTemplate[] = [];
      querySnapshot.forEach((doc) => {
        templates.push({ id: doc.id, ...doc.data() } as ScorecardTemplate);
      });
      
      console.log('ScorecardServices: Successfully listed scorecard templates. Count:', templates.length);
      return templates;
    } catch (error) {
      console.error('ScorecardServices: Error listing scorecard templates:', error);
      throw new Error('Failed to list scorecard templates');
    }
  }

  /**
   * Evaluate an agent against a scorecard template
   * @param agentId - The agent ID
   * @param templateId - The template ID
   * @param context - The evaluation context
   * @returns Promise<AgentScorecardResult>
   */
  async evaluateAgent(
    agentId: string, 
    templateId: string, 
    context: ScorecardContext
  ): Promise<AgentScorecardResult> {
    console.log('ScorecardServices: Attempting to evaluate agent:', agentId, 'with template:', templateId);
    try {
      const template = await this.getScorecardTemplate(templateId);
      if (!template) {
        throw new Error('Scorecard template not found');
      }

      const metricValues: Record<string, { value: number | boolean | string; score?: number; status?: 'critical' | 'warning' | 'normal' }> = {};
      let totalWeightedScore = 0;
      let totalWeight = 0;

      // Evaluate each metric in the template
      for (const metricId of template.metricIds) {
        const metric = this.metricRegistry.getMetric(metricId);
        if (!metric) {
          console.warn(`ScorecardServices: Metric ${metricId} not found in registry`);
          continue;
        }

        const value = await metric.calculate(agentId, context);
        const weight = template.metricWeights?.[metricId] || metric.weight || 1;
        
        // Calculate normalized score (0-100)
        let score = 0;
        let status: 'critical' | 'warning' | 'normal' = 'normal';

        if (typeof value === 'number') {
          score = this.normalizeScore(value, metric);
          status = this.getMetricStatus(value, metric);
        } else if (typeof value === 'boolean') {
          score = value ? 100 : 0;
          status = value ? 'normal' : 'critical';
        }

        metricValues[metricId] = { value, score, status };
        totalWeightedScore += score * weight;
        totalWeight += weight;
      }

      const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

      const result: AgentScorecardResult = {
        agentId,
        templateId,
        evaluationTimestamp: new Date(),
        context,
        overallScore: Math.round(overallScore),
        metricValues
      };

      // Save the result to Firebase
      console.log('ScorecardServices: Attempting to save scorecard result for agent:', agentId);
      await addDoc(collection(db, 'scorecardResults'), {
        ...result,
        evaluationTimestamp: Timestamp.fromDate(result.evaluationTimestamp)
      });

      console.log('ScorecardServices: Scorecard result saved for agent:', agentId);
      return result;
    } catch (error) {
      console.error('ScorecardServices: Error evaluating agent:', error);
      throw new Error('Failed to evaluate agent');
    }
  }

  /**
   * Get evaluation history for an agent
   * @param agentId - The agent ID
   * @param templateId - Optional template ID filter
   * @param timePeriod - Optional time period filter
   * @returns Promise<AgentScorecardResult[]>
   */
  async getAgentEvaluationHistory(
    agentId: string,
    templateId?: string,
    timePeriod?: { start: Date; end: Date }
  ): Promise<AgentScorecardResult[]> {
    console.log('ScorecardServices: Attempting to get evaluation history for agent:', agentId);
    try {
      let q = query(
        collection(db, 'scorecardResults'),
        where('agentId', '==', agentId),
        orderBy('evaluationTimestamp', 'desc')
      );

      if (templateId) {
        q = query(q, where('templateId', '==', templateId));
      }

      const querySnapshot = await getDocs(q);
      const results: AgentScorecardResult[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const result = {
          ...data,
          evaluationTimestamp: data.evaluationTimestamp.toDate()
        } as AgentScorecardResult;

        // Apply time period filter (client-side for now)
        if (timePeriod) {
          const evalTime = result.evaluationTimestamp;
          if (evalTime >= timePeriod.start && evalTime <= timePeriod.end) {
            results.push(result);
          }
        } else {
          results.push(result);
        }
      });

      console.log('ScorecardServices: Successfully retrieved evaluation history. Count:', results.length);
      return results;
    } catch (error) {
      console.error('ScorecardServices: Error getting evaluation history:', error);
      throw new Error('Failed to retrieve evaluation history');
    }
  }

  /**
   * Compare multiple agents
   * @param agentIds - Array of agent IDs to compare
   * @param templateId - The template ID to use for comparison
   * @param context - The evaluation context
   * @returns Promise<AgentComparisonResult[]>
   */
  async compareAgents(
    agentIds: string[],
    templateId: string,
    context: ScorecardContext
  ): Promise<AgentComparisonResult[]> {
    console.log('ScorecardServices: Attempting to compare agents:', agentIds, 'with template:', templateId);
    try {
      const results: AgentComparisonResult[] = [];

      // Evaluate each agent
      for (const agentId of agentIds) {
        const evaluation = await this.evaluateAgent(agentId, templateId, context);
        results.push({ ...evaluation, rank: 0 }); // Rank will be calculated below
      }

      // Sort by overall score and assign ranks
      results.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
      results.forEach((result, index) => {
        result.rank = index + 1;
      });

      console.log('ScorecardServices: Successfully compared agents. Count:', results.length);
      return results;
    } catch (error) {
      console.error('ScorecardServices: Error comparing agents:', error);
      throw new Error('Failed to compare agents');
    }
  }

  /**
   * Normalize a metric value to a 0-100 score
   */
  private normalizeScore(value: number, metric: ScorecardMetric): number {
    if (!metric.interpretationRule) return value;

    const rule = metric.interpretationRule;
    
    if (rule.direction === 'higher_is_better') {
      return Math.min(100, Math.max(0, value));
    } else if (rule.direction === 'lower_is_better') {
      // For lower-is-better metrics, invert the score
      const maxValue = rule.thresholds?.critical || 5000;
      return Math.max(0, 100 - (value / maxValue) * 100);
    } else if (rule.direction === 'target_range' && rule.targetRange) {
      const [min, max] = rule.targetRange;
      if (value >= min && value <= max) return 100;
      const distance = Math.min(Math.abs(value - min), Math.abs(value - max));
      return Math.max(0, 100 - distance);
    }

    return value;
  }

  /**
   * Get the status of a metric value
   */
  private getMetricStatus(value: number, metric: ScorecardMetric): 'critical' | 'warning' | 'normal' {
    if (!metric.interpretationRule?.thresholds) return 'normal';

    const thresholds = metric.interpretationRule.thresholds;
    const direction = metric.interpretationRule.direction;

    if (direction === 'higher_is_better') {
      if (value < thresholds.critical) return 'critical';
      if (value < thresholds.warning) return 'warning';
    } else if (direction === 'lower_is_better') {
      if (value > thresholds.critical) return 'critical';
      if (value > thresholds.warning) return 'warning';
    } else if (direction === 'target_range' && metric.interpretationRule.targetRange) {
      const [min, max] = metric.interpretationRule.targetRange;
      if (value < min || value > max) return 'critical';
      // You might define a 'warning' range outside the target but within acceptable bounds
    }

    return 'normal';
  }
}

// Singleton instance
export const scorecardMetricRegistry = ScorecardMetricRegistry.getInstance();
export const agentEvaluationService = AgentEvaluationService.getInstance();


