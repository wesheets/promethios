import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield, 
  TrendingUp,
  RefreshCw,
  Info,
  Zap,
  Eye
} from 'lucide-react';
import { DeployedAgentDataService } from '@/services/DeployedAgentDataService';

interface AgentStatus {
  agent_id: string;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  last_heartbeat: string;
  last_metrics_update: string;
  governance_metrics: {
    trust_score: number;
    compliance_rate: number;
    recent_violations: number;
  };
  version: string;
  deployment_id?: string;
  environment?: string;
}

interface LiveAgentStatusWidgetProps {
  agentId: string;
  refreshInterval?: number;
  showDetails?: boolean;
  className?: string;
}

export const LiveAgentStatusWidget: React.FC<LiveAgentStatusWidgetProps> = ({
  agentId,
  refreshInterval = 30000,
  showDetails = true,
  className = ''
}) => {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const dataService = new DeployedAgentDataService();

  const fetchAgentStatus = async () => {
    try {
      setLoading(true);
      const status = await dataService.getAgentStatus(agentId);
      setAgentStatus(status);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [agentId, refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'offline': return <Activity className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading && !agentStatus) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Agent Status Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAgentStatus}
            className="w-full"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!agentStatus) {
    return (
      <Card className={`border-gray-200 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">
            No Agent Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Agent status not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(agentStatus.status)}`}></div>
              Agent {agentStatus.agent_id}
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Live agent status with real-time governance monitoring</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={agentStatus.status === 'online' ? 'default' : 'secondary'}>
                {getStatusIcon(agentStatus.status)}
                <span className="ml-1 capitalize">{agentStatus.status}</span>
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={fetchAgentStatus}
                    disabled={loading}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh agent status</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Trust Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Trust Score</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dynamic trust rating based on compliance and performance</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className={`text-sm font-bold ${getTrustScoreColor(agentStatus.governance_metrics.trust_score)}`}>
                {(agentStatus.governance_metrics.trust_score * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={agentStatus.governance_metrics.trust_score * 100} 
              className="h-2"
            />
          </div>

          {/* Compliance Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Compliance</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Percentage of requests that comply with governance policies</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-sm font-bold text-green-600">
                {(agentStatus.governance_metrics.compliance_rate * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={agentStatus.governance_metrics.compliance_rate * 100} 
              className="h-2"
            />
          </div>

          {/* Recent Violations */}
          {agentStatus.governance_metrics.recent_violations > 0 && (
            <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Recent Violations</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-red-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Policy violations detected in the last 24 hours</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="destructive">
                {agentStatus.governance_metrics.recent_violations}
              </Badge>
            </div>
          )}

          {showDetails && (
            <>
              {/* Last Activity */}
              <div className="pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    <span>Heartbeat:</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="font-medium">
                          {formatTimeAgo(agentStatus.last_heartbeat)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Last heartbeat: {new Date(agentStatus.last_heartbeat).toLocaleString()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    <span>Metrics:</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="font-medium">
                          {formatTimeAgo(agentStatus.last_metrics_update)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Last metrics update: {new Date(agentStatus.last_metrics_update).toLocaleString()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Version and Environment */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  <span>v{agentStatus.version}</span>
                </div>
                {agentStatus.environment && (
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3" />
                    <span className="capitalize">{agentStatus.environment}</span>
                  </div>
                )}
              </div>

              {/* Last Refresh */}
              <div className="text-xs text-gray-400 text-center">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default LiveAgentStatusWidget;

