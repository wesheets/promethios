import { useState, useEffect } from 'react';
import { 
  ScorecardTemplate, 
  AgentScorecardResult, 
  ScorecardContext, 
  ScorecardMetric,
  AgentComparisonResult 
} from '../types';
import { agentEvaluationService, scorecardMetricRegistry } from '../services/ScorecardServices';

/**
 * React hook for managing scorecard templates
 */
export const useScorecardTemplates = () => {
  const [templates, setTemplates] = useState<ScorecardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const templateList = await agentEvaluationService.listScorecardTemplates();
      setTemplates(templateList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData: Omit<ScorecardTemplate, 'id'>) => {
    try {
      setError(null);
      const templateId = await agentEvaluationService.saveScorecardTemplate(templateData);
      await loadTemplates(); // Reload to get updated list
      return templateId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getTemplate = async (templateId: string): Promise<ScorecardTemplate | null> => {
    try {
      setError(null);
      return await agentEvaluationService.getScorecardTemplate(templateId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get template';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    templates,
    loading,
    error,
    createTemplate,
    getTemplate,
    refreshTemplates: loadTemplates
  };
};

/**
 * React hook for managing agent evaluations
 */
export const useAgentEvaluations = (agentId: string | null) => {
  const [evaluations, setEvaluations] = useState<AgentScorecardResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agentId) {
      loadEvaluations(agentId);
    } else {
      setEvaluations([]);
    }
  }, [agentId]);

  const loadEvaluations = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const evaluationList = await agentEvaluationService.getAgentEvaluationHistory(id);
      setEvaluations(evaluationList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evaluations');
      console.error('Error loading evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  const evaluateAgent = async (templateId: string, context: ScorecardContext = {}) => {
    if (!agentId) return null;

    try {
      setError(null);
      const result = await agentEvaluationService.evaluateAgent(agentId, templateId, context);
      
      // Add the new evaluation to the list
      setEvaluations(prev => [result, ...prev]);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to evaluate agent';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getEvaluationHistory = async (
    templateId?: string,
    timePeriod?: { start: Date; end: Date }
  ) => {
    if (!agentId) return [];

    try {
      setError(null);
      return await agentEvaluationService.getAgentEvaluationHistory(agentId, templateId, timePeriod);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get evaluation history';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    evaluations,
    loading,
    error,
    evaluateAgent,
    getEvaluationHistory,
    refreshEvaluations: () => agentId && loadEvaluations(agentId)
  };
};

/**
 * React hook for managing scorecard metrics
 */
export const useScorecardMetrics = () => {
  const [metrics, setMetrics] = useState<ScorecardMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = () => {
    try {
      setLoading(true);
      const metricList = scorecardMetricRegistry.getAllMetrics();
      setMetrics(metricList);
    } catch (err) {
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMetricsByCategory = (category: string): ScorecardMetric[] => {
    return scorecardMetricRegistry.getMetricsByCategory(category);
  };

  const getMetric = (metricId: string): ScorecardMetric | null => {
    return scorecardMetricRegistry.getMetric(metricId);
  };

  const registerMetric = (metric: ScorecardMetric): boolean => {
    const success = scorecardMetricRegistry.registerMetric(metric);
    if (success) {
      loadMetrics(); // Refresh the list
    }
    return success;
  };

  const deregisterMetric = (metricId: string): boolean => {
    const success = scorecardMetricRegistry.deregisterMetric(metricId);
    if (success) {
      loadMetrics(); // Refresh the list
    }
    return success;
  };

  return {
    metrics,
    loading,
    getMetricsByCategory,
    getMetric,
    registerMetric,
    deregisterMetric,
    refreshMetrics: loadMetrics
  };
};

/**
 * React hook for agent comparisons
 */
export const useAgentComparison = () => {
  const [comparisonResults, setComparisonResults] = useState<AgentComparisonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compareAgents = async (
    agentIds: string[],
    templateId: string,
    context: ScorecardContext = {}
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await agentEvaluationService.compareAgents(agentIds, templateId, context);
      setComparisonResults(results);
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compare agents';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearComparison = () => {
    setComparisonResults([]);
    setError(null);
  };

  return {
    comparisonResults,
    loading,
    error,
    compareAgents,
    clearComparison
  };
};

/**
 * Hook for a single scorecard template
 */
export const useScorecardTemplate = (templateId: string | null) => {
  const [template, setTemplate] = useState<ScorecardTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    } else {
      setTemplate(null);
    }
  }, [templateId]);

  const loadTemplate = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const templateData = await agentEvaluationService.getScorecardTemplate(id);
      setTemplate(templateData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
      console.error('Error loading template:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    template,
    loading,
    error,
    refreshTemplate: () => templateId && loadTemplate(templateId)
  };
};

