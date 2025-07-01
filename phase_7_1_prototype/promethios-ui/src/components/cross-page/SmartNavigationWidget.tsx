import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ArrowRight, 
  Activity, 
  Shield, 
  Settings, 
  BarChart3,
  Zap,
  Bell,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Server,
  Eye,
  Play,
  Pause,
  RefreshCw,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { MonitoringExtension } from '@/extensions/MonitoringExtension';

interface NavigationSuggestion {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  badge?: {
    text: string;
    variant: 'default' | 'destructive' | 'secondary' | 'outline';
  };
  tooltip: string;
  action?: () => void;
}

interface SmartNavigationWidgetProps {
  currentPage?: string;
  agentIds?: string[];
  showQuickActions?: boolean;
  maxSuggestions?: number;
  className?: string;
}

export const SmartNavigationWidget: React.FC<SmartNavigationWidgetProps> = ({
  currentPage,
  agentIds = [],
  showQuickActions = true,
  maxSuggestions = 4,
  className = ''
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [suggestions, setSuggestions] = useState<NavigationSuggestion[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    totalAgents: 0,
    onlineAgents: 0,
    activeAlerts: 0,
    averageTrustScore: 0,
    recentViolations: 0
  });
  const [loading, setLoading] = useState(true);
  
  const monitoringExtension = new MonitoringExtension();

  // Fetch system status for smart suggestions
  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      
      let totalAgents = agentIds.length;
      let onlineAgents = 0;
      let averageTrustScore = 0;
      let recentViolations = 0;
      
      if (agentIds.length > 0) {
        const statusPromises = agentIds.map(async (agentId) => {
          try {
            const status = await monitoringExtension.getAgentStatus(agentId);
            const metrics = await monitoringExtension.getAgentMetrics(agentId, '1h');
            
            if (status.status === 'online') onlineAgents++;
            if (metrics.length > 0) {
              averageTrustScore += metrics[metrics.length - 1].trustScore;
              recentViolations += metrics[metrics.length - 1].violationCount;
            }
          } catch (error) {
            console.warn(`Failed to fetch status for agent ${agentId}:`, error);
          }
        });
        
        await Promise.all(statusPromises);
        averageTrustScore = totalAgents > 0 ? averageTrustScore / totalAgents : 0;
      }
      
      const activeAlerts = monitoringExtension.getActiveAlerts().length;
      
      setSystemStatus({
        totalAgents,
        onlineAgents,
        activeAlerts,
        averageTrustScore,
        recentViolations
      });
      
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate smart navigation suggestions based on current context
  const generateSuggestions = () => {
    const currentPath = location.pathname;
    const newSuggestions: NavigationSuggestion[] = [];

    // Deployment-related suggestions
    if (currentPath.includes('/deploy') || currentPath.includes('/agent-wrapping')) {
      if (systemStatus.totalAgents === 0) {
        newSuggestions.push({
          id: 'deploy-first-agent',
          title: 'Deploy Your First Agent',
          description: 'Get started by deploying an agent with governance',
          path: '/deploy',
          icon: <Play className="h-4 w-4" />,
          priority: 'high',
          tooltip: 'Deploy your first agent to start monitoring governance metrics and performance'
        });
      } else {
        newSuggestions.push({
          id: 'monitor-deployments',
          title: 'Monitor Live Deployments',
          description: `View real-time status of ${systemStatus.totalAgents} deployed agents`,
          path: '/deploy?tab=1', // Live Monitoring tab
          icon: <Activity className="h-4 w-4" />,
          priority: 'high',
          badge: {
            text: `${systemStatus.onlineAgents}/${systemStatus.totalAgents} online`,
            variant: systemStatus.onlineAgents === systemStatus.totalAgents ? 'default' : 'destructive'
          },
          tooltip: 'Monitor real-time status, metrics, and performance of your deployed agents'
        });
      }
    }

    // Governance-related suggestions
    if (currentPath.includes('/governance') || systemStatus.recentViolations > 0) {
      newSuggestions.push({
        id: 'governance-overview',
        title: 'Governance Dashboard',
        description: 'View compliance metrics and trust scores',
        path: '/governance-overview',
        icon: <Shield className="h-4 w-4" />,
        priority: systemStatus.recentViolations > 0 ? 'high' : 'medium',
        badge: systemStatus.recentViolations > 0 ? {
          text: `${systemStatus.recentViolations} violations`,
          variant: 'destructive'
        } : undefined,
        tooltip: 'Comprehensive governance dashboard with real-time compliance metrics and trust scores'
      });
    }

    // Alert-related suggestions
    if (systemStatus.activeAlerts > 0) {
      newSuggestions.push({
        id: 'manage-alerts',
        title: 'Manage Active Alerts',
        description: 'Review and resolve governance alerts',
        path: '/governance-overview',
        icon: <Bell className="h-4 w-4" />,
        priority: 'high',
        badge: {
          text: `${systemStatus.activeAlerts} alerts`,
          variant: 'destructive'
        },
        tooltip: 'Review and manage active alerts from deployed agents including violations and performance issues'
      });
    }

    // Performance suggestions
    if (systemStatus.averageTrustScore < 0.8 && systemStatus.totalAgents > 0) {
      newSuggestions.push({
        id: 'improve-trust',
        title: 'Improve Trust Scores',
        description: 'Analyze and optimize agent performance',
        path: '/governance-overview',
        icon: <TrendingUp className="h-4 w-4" />,
        priority: 'medium',
        badge: {
          text: `${(systemStatus.averageTrustScore * 100).toFixed(0)}% avg`,
          variant: 'secondary'
        },
        tooltip: 'Analyze trust scores and get recommendations to improve agent governance and performance'
      });
    }

    // Settings suggestions
    if (!currentPath.includes('/settings')) {
      newSuggestions.push({
        id: 'configure-monitoring',
        title: 'Configure Monitoring',
        description: 'Set up alerts and thresholds',
        path: '/integrations-settings',
        icon: <Settings className="h-4 w-4" />,
        priority: 'low',
        tooltip: 'Configure monitoring settings, alert thresholds, and integration preferences'
      });
    }

    // Analytics suggestions
    if (systemStatus.totalAgents > 0 && !currentPath.includes('/analytics')) {
      newSuggestions.push({
        id: 'view-analytics',
        title: 'Performance Analytics',
        description: 'Deep dive into agent performance trends',
        path: '/deploy?tab=3', // Performance Analytics tab
        icon: <BarChart3 className="h-4 w-4" />,
        priority: 'medium',
        tooltip: 'View detailed performance analytics, trends, and insights for your deployed agents'
      });
    }

    // Sort by priority and limit
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    newSuggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    
    setSuggestions(newSuggestions.slice(0, maxSuggestions));
  };

  useEffect(() => {
    fetchSystemStatus();
  }, [agentIds]);

  useEffect(() => {
    generateSuggestions();
  }, [location.pathname, systemStatus, maxSuggestions]);

  const handleNavigate = (suggestion: NavigationSuggestion) => {
    if (suggestion.action) {
      suggestion.action();
    } else {
      navigate(suggestion.path);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getSystemHealthColor = () => {
    if (systemStatus.activeAlerts > 0 || systemStatus.recentViolations > 0) return 'text-red-600';
    if (systemStatus.averageTrustScore < 0.8) return 'text-yellow-600';
    if (systemStatus.onlineAgents === systemStatus.totalAgents && systemStatus.totalAgents > 0) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <TooltipProvider>
      <Card className={`${className}`}>
        <CardContent className="p-4">
          {/* System Status Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className={`h-5 w-5 ${getSystemHealthColor()}`} />
              <span className="font-medium text-gray-900">Smart Navigation</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Context-aware navigation suggestions based on your current workflow and system status</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="flex items-center gap-2">
              {systemStatus.totalAgents > 0 && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs">
                      {systemStatus.onlineAgents}/{systemStatus.totalAgents} online
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Deployed agents currently online and reporting metrics</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchSystemStatus}
                    disabled={loading}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh system status and navigation suggestions</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Quick Status Indicators */}
          {systemStatus.totalAgents > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className={`text-sm font-bold ${getSystemHealthColor()}`}>
                  {(systemStatus.averageTrustScore * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-600">Trust</div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-bold ${systemStatus.activeAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {systemStatus.activeAlerts}
                </div>
                <div className="text-xs text-gray-600">Alerts</div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-bold ${systemStatus.recentViolations > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {systemStatus.recentViolations}
                </div>
                <div className="text-xs text-gray-600">Violations</div>
              </div>
            </div>
          )}

          {/* Navigation Suggestions */}
          <div className="space-y-2">
            {suggestions.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">All systems running smoothly</p>
                <p className="text-xs text-gray-500">No immediate actions required</p>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <Tooltip key={suggestion.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`p-3 border-l-4 rounded-r-lg cursor-pointer transition-all hover:shadow-md ${getPriorityColor(suggestion.priority)}`}
                      onClick={() => handleNavigate(suggestion)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {suggestion.icon}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{suggestion.title}</span>
                              {suggestion.badge && (
                                <Badge variant={suggestion.badge.variant} className="text-xs">
                                  {suggestion.badge.text}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{suggestion.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))
            )}
          </div>

          {/* Quick Actions */}
          {showQuickActions && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-700">Quick Actions</span>
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/deploy')}
                        className="h-6 text-xs"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Deploy
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Quick access to agent deployment</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/governance-overview')}
                        className="h-6 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Monitor
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Quick access to governance monitoring</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default SmartNavigationWidget;

