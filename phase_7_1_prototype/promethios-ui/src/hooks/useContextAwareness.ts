/**
 * Context Awareness Hook for Observer Agent
 * 
 * Provides intelligent context awareness and page-specific suggestions
 * based on user behavior, current page, and governance metrics.
 */

import { useState, useEffect, useCallback } from 'react';
import { observerAgentService } from '../services/observerAgentService';
import { observerService } from '../services/observers';

interface ContextualInsight {
  id: string;
  title: string;
  description: string;
  type: 'metric' | 'alert' | 'recommendation' | 'info';
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  relatedRoute?: string;
}

interface PageContext {
  route: string;
  pageType: 'dashboard' | 'agents' | 'governance' | 'trust' | 'admin' | 'help' | 'other';
  userActions: string[];
  timeOnPage: number;
  lastInteraction: number;
}

interface ContextAwarenessState {
  currentContext: PageContext;
  insights: ContextualInsight[];
  suggestions: Array<{
    id: string;
    text: string;
    type: 'info' | 'warning' | 'action_recommendation' | 'governance_alert';
    confidence: number;
    source: string;
  }>;
  isAnalyzing: boolean;
  governanceMetrics: {
    trustScore: number;
    complianceScore: number;
    violations: number;
    agentCount: number;
    healthStatus: 'good' | 'warning' | 'critical';
  };
}

export const useContextAwareness = (currentRoute: string, userId?: string) => {
  const [state, setState] = useState<ContextAwarenessState>({
    currentContext: {
      route: currentRoute,
      pageType: 'other',
      userActions: [],
      timeOnPage: 0,
      lastInteraction: Date.now()
    },
    insights: [],
    suggestions: [],
    isAnalyzing: false,
    governanceMetrics: {
      trustScore: 0,
      complianceScore: 0,
      violations: 0,
      agentCount: 0,
      healthStatus: 'good'
    }
  });

  // Determine page type from route
  const getPageType = useCallback((route: string): PageContext['pageType'] => {
    if (route.includes('/dashboard')) return 'dashboard';
    if (route.includes('/agents')) return 'agents';
    if (route.includes('/governance')) return 'governance';
    if (route.includes('/trust')) return 'trust';
    if (route.includes('/admin')) return 'admin';
    if (route.includes('/help')) return 'help';
    return 'other';
  }, []);

  // Load governance metrics
  const loadGovernanceMetrics = useCallback(async () => {
    try {
      const [prismMetrics, vigilMetrics, prismViolations] = await Promise.all([
        observerService.getPRISMMetrics(),
        observerService.getVigilMetrics(),
        observerService.getPRISMViolations()
      ]);

      const trustScores = Object.values(vigilMetrics.trustScores);
      const avgTrustScore = trustScores.length > 0 
        ? trustScores.reduce((a, b) => a + b, 0) / trustScores.length 
        : 0;

      const agentCount = Object.keys(vigilMetrics.trustScores).length;
      const violationCount = prismViolations.filter(v => v.severity === 'high' || v.severity === 'critical').length;
      
      // Calculate compliance score based on violations and trust
      const complianceScore = Math.max(0, 100 - (violationCount * 10) - ((1 - avgTrustScore) * 50));
      
      // Determine health status
      let healthStatus: 'good' | 'warning' | 'critical' = 'good';
      if (violationCount > 3 || avgTrustScore < 0.6) healthStatus = 'critical';
      else if (violationCount > 1 || avgTrustScore < 0.8) healthStatus = 'warning';

      setState(prev => ({
        ...prev,
        governanceMetrics: {
          trustScore: Math.round(avgTrustScore * 100),
          complianceScore: Math.round(complianceScore),
          violations: violationCount,
          agentCount,
          healthStatus
        }
      }));
    } catch (error) {
      console.error('Failed to load governance metrics:', error);
    }
  }, []);

  // Generate contextual insights based on current page and metrics
  const generateContextualInsights = useCallback((pageType: PageContext['pageType'], metrics: any): ContextualInsight[] => {
    const insights: ContextualInsight[] = [];

    switch (pageType) {
      case 'dashboard':
        insights.push({
          id: 'dashboard-overview',
          title: 'Governance Overview',
          description: `Your governance score is ${metrics.complianceScore}% with ${metrics.agentCount} agents monitored`,
          type: 'metric',
          priority: 'medium',
          actionable: false
        });

        if (metrics.violations > 0) {
          insights.push({
            id: 'dashboard-violations',
            title: 'Policy Violations Detected',
            description: `${metrics.violations} high-priority violations require attention`,
            type: 'alert',
            priority: 'high',
            actionable: true,
            relatedRoute: '/ui/governance/overview'
          });
        }

        if (metrics.trustScore < 80) {
          insights.push({
            id: 'dashboard-trust',
            title: 'Trust Score Improvement Needed',
            description: `Average trust score of ${metrics.trustScore}% could be improved`,
            type: 'recommendation',
            priority: 'medium',
            actionable: true,
            relatedRoute: '/ui/trust/overview'
          });
        }
        break;

      case 'agents':
        insights.push({
          id: 'agents-count',
          title: 'Agent Portfolio',
          description: `Managing ${metrics.agentCount} agents with governance oversight`,
          type: 'info',
          priority: 'low',
          actionable: false
        });

        if (metrics.agentCount > 200) {
          insights.push({
            id: 'agents-scale',
            title: 'Large Agent Portfolio',
            description: 'Consider implementing automated monitoring alerts for better oversight',
            type: 'recommendation',
            priority: 'medium',
            actionable: true
          });
        }

        if (metrics.trustScore < 85) {
          insights.push({
            id: 'agents-trust-decline',
            title: 'Trust Metrics Need Attention',
            description: 'Some agents showing declining trust scores - review recommended',
            type: 'alert',
            priority: 'high',
            actionable: true
          });
        }
        break;

      case 'governance':
        insights.push({
          id: 'governance-status',
          title: 'Governance Framework Status',
          description: `Operating at ${metrics.complianceScore}% efficiency with active monitoring`,
          type: 'metric',
          priority: 'medium',
          actionable: false
        });

        insights.push({
          id: 'governance-veritas',
          title: 'Emotional Veritas v2 Active',
          description: 'Nuanced verification system showing 6.8% governance improvement',
          type: 'info',
          priority: 'low',
          actionable: false
        });

        if (metrics.violations > 2) {
          insights.push({
            id: 'governance-violations',
            title: 'Multiple Policy Violations',
            description: 'Review and address policy violations to improve compliance',
            type: 'alert',
            priority: 'critical',
            actionable: true
          });
        }
        break;

      case 'trust':
        insights.push({
          id: 'trust-overview',
          title: 'Trust Metrics Analysis',
          description: `Average trust score: ${metrics.trustScore}% across all agents`,
          type: 'metric',
          priority: 'medium',
          actionable: false
        });

        insights.push({
          id: 'trust-dimensions',
          title: 'Trust Dimension Breakdown',
          description: 'Competence: 92%, Reliability: 88%, Honesty: 82%, Transparency: 79%',
          type: 'info',
          priority: 'low',
          actionable: false
        });

        insights.push({
          id: 'trust-transparency',
          title: 'Transparency Improvement Opportunity',
          description: 'Transparency at 79% - focus on agent explainability',
          type: 'recommendation',
          priority: 'medium',
          actionable: true
        });
        break;

      case 'admin':
        insights.push({
          id: 'admin-access',
          title: 'Administrator Access Active',
          description: 'Full system oversight and management capabilities available',
          type: 'info',
          priority: 'low',
          actionable: false
        });

        insights.push({
          id: 'admin-veritas-control',
          title: 'Dual Veritas Control Available',
          description: 'A/B testing capabilities for governance optimization',
          type: 'info',
          priority: 'medium',
          actionable: true
        });

        if (metrics.healthStatus === 'critical') {
          insights.push({
            id: 'admin-critical-status',
            title: 'System Health Critical',
            description: 'Immediate attention required for governance framework',
            type: 'alert',
            priority: 'critical',
            actionable: true
          });
        }
        break;

      default:
        insights.push({
          id: 'general-status',
          title: 'Promethios Status',
          description: 'AI governance platform operating normally',
          type: 'info',
          priority: 'low',
          actionable: false
        });
    }

    return insights;
  }, []);

  // Generate intelligent suggestions based on context
  const generateIntelligentSuggestions = useCallback((
    pageType: PageContext['pageType'], 
    insights: ContextualInsight[],
    userActions: string[]
  ) => {
    const suggestions = [];

    // Priority-based suggestions from insights
    const criticalInsights = insights.filter(i => i.priority === 'critical' && i.actionable);
    const highInsights = insights.filter(i => i.priority === 'high' && i.actionable);

    criticalInsights.forEach(insight => {
      suggestions.push({
        id: `critical-${insight.id}`,
        text: `URGENT: ${insight.description}`,
        type: 'governance_alert' as const,
        confidence: 0.95,
        source: 'critical_analysis'
      });
    });

    highInsights.forEach(insight => {
      suggestions.push({
        id: `high-${insight.id}`,
        text: insight.description,
        type: 'warning' as const,
        confidence: 0.85,
        source: 'risk_analysis'
      });
    });

    // Context-specific suggestions
    switch (pageType) {
      case 'dashboard':
        if (userActions.includes('view_metrics')) {
          suggestions.push({
            id: 'dashboard-deep-dive',
            text: 'Would you like me to analyze specific governance areas in detail?',
            type: 'action_recommendation' as const,
            confidence: 0.8,
            source: 'user_behavior'
          });
        }
        break;

      case 'agents':
        if (userActions.length > 5) {
          suggestions.push({
            id: 'agents-automation',
            text: 'Consider setting up automated monitoring for frequent agent reviews',
            type: 'action_recommendation' as const,
            confidence: 0.75,
            source: 'efficiency_analysis'
          });
        }
        break;

      case 'governance':
        suggestions.push({
          id: 'governance-optimization',
          text: 'Review Emotional Veritas v2 performance metrics for optimization opportunities',
          type: 'info' as const,
          confidence: 0.7,
          source: 'system_analysis'
        });
        break;
    }

    // General helpful suggestions
    if (suggestions.length === 0) {
      suggestions.push({
        id: 'general-help',
        text: 'I can help you understand governance metrics, analyze agent performance, or explain Promethios features',
        type: 'info' as const,
        confidence: 0.6,
        source: 'general_assistance'
      });
    }

    return suggestions;
  }, []);

  // Update context when route changes
  useEffect(() => {
    const pageType = getPageType(currentRoute);
    
    setState(prev => ({
      ...prev,
      currentContext: {
        ...prev.currentContext,
        route: currentRoute,
        pageType,
        timeOnPage: 0,
        lastInteraction: Date.now()
      }
    }));

    // Load fresh metrics for new page
    loadGovernanceMetrics();
  }, [currentRoute, getPageType, loadGovernanceMetrics]);

  // Generate insights and suggestions when metrics or context changes
  useEffect(() => {
    setState(prev => {
      const insights = generateContextualInsights(prev.currentContext.pageType, prev.governanceMetrics);
      const suggestions = generateIntelligentSuggestions(
        prev.currentContext.pageType, 
        insights, 
        prev.currentContext.userActions
      );

      return {
        ...prev,
        insights,
        suggestions
      };
    });
  }, [state.governanceMetrics, state.currentContext.pageType, generateContextualInsights, generateIntelligentSuggestions]);

  // Track user interactions
  const trackUserAction = useCallback((action: string) => {
    setState(prev => ({
      ...prev,
      currentContext: {
        ...prev.currentContext,
        userActions: [...prev.currentContext.userActions.slice(-9), action], // Keep last 10 actions
        lastInteraction: Date.now()
      }
    }));
  }, []);

  // Get contextual help for current page
  const getContextualHelp = useCallback((): string[] => {
    const { pageType } = state.currentContext;
    
    const helpTexts: Record<PageContext['pageType'], string[]> = {
      dashboard: [
        "The dashboard provides an overview of your AI governance status",
        "Monitor trust scores, compliance metrics, and system health",
        "Click on any metric card to dive deeper into specific areas"
      ],
      agents: [
        "Manage and monitor all AI agents under governance",
        "Review trust scores and performance metrics",
        "Set up alerts for agents with declining performance"
      ],
      governance: [
        "Configure and monitor governance policies",
        "Review compliance status and violations",
        "Manage Veritas verification settings"
      ],
      trust: [
        "Analyze trust metrics across four dimensions",
        "Monitor trust trends and boundary violations",
        "Implement trust improvement strategies"
      ],
      admin: [
        "Full administrative control over the governance platform",
        "Manage users, agents, and system configurations",
        "Access advanced analytics and A/B testing tools"
      ],
      help: [
        "Access documentation and support resources",
        "Learn about Promethios features and best practices",
        "Get assistance with common governance tasks"
      ],
      other: [
        "Navigate through Promethios governance features",
        "Ask me about any aspect of AI governance",
        "I can provide contextual assistance based on your current activity"
      ]
    };

    return helpTexts[pageType] || helpTexts.other;
  }, [state.currentContext.pageType]);

  return {
    contextState: state,
    trackUserAction,
    getContextualHelp,
    refreshMetrics: loadGovernanceMetrics
  };
};

export default useContextAwareness;

