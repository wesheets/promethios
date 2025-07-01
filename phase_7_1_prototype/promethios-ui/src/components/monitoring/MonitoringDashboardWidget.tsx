import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Info,
  Zap,
  Eye,
  Bell,
  BellOff,
  Download,
  Settings,
  BarChart3,
  Users,
  Server,
  Cpu,
  HardDrive,
  Network
} from 'lucide-react';
import { MonitoringExtension, AgentMetrics, MonitoringAlert } from '@/extensions/MonitoringExtension';

interface MonitoringDashboardWidgetProps {
  agentIds: string[];
  refreshInterval?: number;
  showAlerts?: boolean;
  className?: string;
}

interface DashboardSummary {
  totalAgents: number;
  onlineAgents: number;
  averageTrustScore: number;
  totalViolations: number;
  activeAlerts: number;
  averageResponseTime: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

export const MonitoringDashboardWidget: React.FC<MonitoringDashboardWidgetProps> = ({
  agentIds,
  refreshInterval = 30000,
  showAlerts = true,
  className = ''
}) => {
  const [summary, setSummary] = useState<DashboardSummary>({
    totalAgents: 0,
    onlineAgents: 0,
    averageTrustScore: 0,
    totalViolations: 0,
    activeAlerts: 0,
    averageResponseTime: 0,
    systemHealth: 'good'
  });
  
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const monitoringExtension = new MonitoringExtension();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch metrics for all agents
      const allMetrics: AgentMetrics[] = [];
      const agentStatuses: any[] = [];
      
      for (const agentId of agentIds) {
        try {
          const metrics = await monitoringExtension.getAgentMetrics(agentId, '1h');
          const status = await monitoringExtension.getAgentStatus(agentId);
          
          if (metrics.length > 0) {
            allMetrics.push(metrics[metrics.length - 1]); // Latest metrics
          }
          agentStatuses.push(status);
        } catch (error) {
          console.warn(`Failed to fetch data for agent ${agentId}:`, error);
        }
      }
      
      // Calculate summary
      const onlineAgents = agentStatuses.filter(status => status.status === 'online').length;
      const averageTrustScore = allMetrics.length > 0 
        ? allMetrics.reduce((sum, m) => sum + m.trustScore, 0) / allMetrics.length 
        : 0;
      const totalViolations = allMetrics.reduce((sum, m) => sum + m.violationCount, 0);
      const averageResponseTime = allMetrics.length > 0
        ? allMetrics.reduce((sum, m) => sum + m.responseTime, 0) / allMetrics.length
        : 0;
      
      // Get active alerts
      const activeAlerts = monitoringExtension.getActiveAlerts();
      
      // Determine system health
      let systemHealth: DashboardSummary['systemHealth'] = 'excellent';
      if (averageTrustScore < 0.5 || totalViolations > 10 || activeAlerts.length > 5) {
        systemHealth = 'critical';
      } else if (averageTrustScore < 0.7 || totalViolations > 5 || activeAlerts.length > 2) {
        systemHealth = 'warning';
      } else if (averageTrustScore < 0.9 || totalViolations > 0 || activeAlerts.length > 0) {
        systemHealth = 'good';
      }
      
      setSummary({
        totalAgents: agentIds.length,
        onlineAgents,
        averageTrustScore,
        totalViolations,
        activeAlerts: activeAlerts.length,
        averageResponseTime,
        systemHealth
      });
      
      setAlerts(activeAlerts.slice(0, 5)); // Show top 5 alerts
      setLastRefresh(new Date());
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agentIds.length > 0) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [agentIds, refreshInterval]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'good': return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (agentIds.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monitoring Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No agents to monitor</p>
            <p className="text-sm text-gray-500 mt-2">Deploy agents to see monitoring data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={`${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Monitoring Dashboard
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Real-time overview of all deployed agents and their governance status</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAlertsEnabled(!alertsEnabled)}
                    className="h-8 w-8 p-0"
                  >
                    {alertsEnabled ? (
                      <Bell className="h-4 w-4 text-blue-600" />
                    ) : (
                      <BellOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{alertsEnabled ? 'Disable alerts' : 'Enable alerts'}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchDashboardData}
                    disabled={loading}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh dashboard data</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* System Health Status */}
          <div className="flex items-center gap-2 mt-2">
            {getHealthIcon(summary.systemHealth)}
            <span className={`font-medium ${getHealthColor(summary.systemHealth)}`}>
              System Health: {summary.systemHealth.charAt(0).toUpperCase() + summary.systemHealth.slice(1)}
            </span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Overall system health based on trust scores, violations, and alerts</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Agents */}
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total number of deployed agents being monitored</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-2xl font-bold text-blue-600">{summary.totalAgents}</div>
              <div className="text-xs text-blue-700">Total Agents</div>
              <div className="text-xs text-gray-600 mt-1">
                {summary.onlineAgents} online
              </div>
            </div>

            {/* Average Trust Score */}
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-green-600" />
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average trust score across all agents based on compliance and performance</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {(summary.averageTrustScore * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-green-700">Trust Score</div>
              <Progress value={summary.averageTrustScore * 100} className="h-1 mt-1" />
            </div>

            {/* Total Violations */}
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total governance violations detected across all agents in the last 24 hours</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-2xl font-bold text-red-600">{summary.totalViolations}</div>
              <div className="text-xs text-red-700">Violations</div>
              <div className="text-xs text-gray-600 mt-1">Last 24h</div>
            </div>

            {/* Average Response Time */}
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-yellow-600" />
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average response time across all agents</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {summary.averageResponseTime.toFixed(0)}ms
              </div>
              <div className="text-xs text-yellow-700">Response Time</div>
              <div className="text-xs text-gray-600 mt-1">Average</div>
            </div>
          </div>

          {/* Active Alerts */}
          {showAlerts && alertsEnabled && alerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4 text-orange-600" />
                  Active Alerts
                  <Badge variant="destructive" className="text-xs">
                    {summary.activeAlerts}
                  </Badge>
                </h3>
                <Button variant="outline" size="sm" className="text-xs">
                  View All
                </Button>
              </div>
              
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <Alert key={alert.id} className={`${getAlertSeverityColor(alert.severity)}`}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{alert.agentId}:</span> {alert.message}
                        <div className="text-xs text-gray-600 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => monitoringExtension.acknowledgeAlert(alert.id)}
                              className="h-6 w-6 p-0"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Acknowledge alert</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Quick Actions</span>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export monitoring data and reports</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure monitoring settings and thresholds</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mt-2 text-center">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default MonitoringDashboardWidget;

