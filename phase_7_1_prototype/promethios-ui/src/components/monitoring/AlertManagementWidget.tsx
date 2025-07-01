import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Bell,
  BellOff,
  X,
  Eye,
  EyeOff,
  Filter,
  Download,
  Settings,
  Info,
  Zap,
  Shield,
  Activity,
  Server,
  Users,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { MonitoringExtension, MonitoringAlert } from '@/extensions/MonitoringExtension';

interface AlertManagementWidgetProps {
  agentIds?: string[];
  maxAlerts?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showFilters?: boolean;
  className?: string;
}

interface AlertFilter {
  severity: string[];
  type: string[];
  acknowledged: boolean | null;
  timeRange: string;
}

export const AlertManagementWidget: React.FC<AlertManagementWidgetProps> = ({
  agentIds = [],
  maxAlerts = 10,
  autoRefresh = true,
  refreshInterval = 30000,
  showFilters = true,
  className = ''
}) => {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<MonitoringAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AlertFilter>({
    severity: [],
    type: [],
    acknowledged: null,
    timeRange: '24h'
  });
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  
  const monitoringExtension = new MonitoringExtension();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      
      let allAlerts: MonitoringAlert[] = [];
      
      if (agentIds.length > 0) {
        // Get alerts for specific agents
        for (const agentId of agentIds) {
          const agentAlerts = monitoringExtension.getActiveAlerts(agentId);
          allAlerts.push(...agentAlerts);
        }
      } else {
        // Get all alerts
        allAlerts = monitoringExtension.getActiveAlerts();
      }
      
      // Sort by timestamp (newest first)
      allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setAlerts(allAlerts);
      
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to alerts
  useEffect(() => {
    let filtered = [...alerts];
    
    // Filter by severity
    if (filter.severity.length > 0) {
      filtered = filtered.filter(alert => filter.severity.includes(alert.severity));
    }
    
    // Filter by type
    if (filter.type.length > 0) {
      filtered = filtered.filter(alert => filter.type.includes(alert.type));
    }
    
    // Filter by acknowledged status
    if (filter.acknowledged !== null) {
      filtered = filtered.filter(alert => alert.acknowledged === filter.acknowledged);
    }
    
    // Filter by time range
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }[filter.timeRange] || 24 * 60 * 60 * 1000;
    
    filtered = filtered.filter(alert => 
      now.getTime() - new Date(alert.timestamp).getTime() <= timeRangeMs
    );
    
    // Show/hide acknowledged alerts
    if (!showAcknowledged) {
      filtered = filtered.filter(alert => !alert.acknowledged);
    }
    
    // Limit number of alerts
    filtered = filtered.slice(0, maxAlerts);
    
    setFilteredAlerts(filtered);
  }, [alerts, filter, showAcknowledged, maxAlerts]);

  useEffect(() => {
    fetchAlerts();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [agentIds, autoRefresh, refreshInterval]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const success = monitoringExtension.acknowledgeAlert(alertId);
      if (success) {
        await fetchAlerts(); // Refresh alerts
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const success = monitoringExtension.resolveAlert(alertId);
      if (success) {
        await fetchAlerts(); // Refresh alerts
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trust_score': return <Shield className="h-4 w-4" />;
      case 'error_rate': return <AlertTriangle className="h-4 w-4" />;
      case 'response_time': return <Zap className="h-4 w-4" />;
      case 'violation': return <X className="h-4 w-4" />;
      case 'system': return <Server className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getAlertStats = () => {
    const total = alerts.length;
    const critical = alerts.filter(a => a.severity === 'critical').length;
    const unacknowledged = alerts.filter(a => !a.acknowledged).length;
    const recent = alerts.filter(a => 
      new Date().getTime() - new Date(a.timestamp).getTime() <= 60 * 60 * 1000
    ).length;
    
    return { total, critical, unacknowledged, recent };
  };

  const stats = getAlertStats();

  return (
    <TooltipProvider>
      <Card className={`${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              Alert Management
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manage and monitor alerts from deployed agents with governance violations and performance issues</p>
                </TooltipContent>
              </Tooltip>
              {stats.unacknowledged > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.unacknowledged} new
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAcknowledged(!showAcknowledged)}
                    className="h-8 w-8 p-0"
                  >
                    {showAcknowledged ? (
                      <Eye className="h-4 w-4 text-blue-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showAcknowledged ? 'Hide acknowledged alerts' : 'Show acknowledged alerts'}</p>
                </TooltipContent>
              </Tooltip>
              
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
                    onClick={fetchAlerts}
                    disabled={loading}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh alerts</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Alert Statistics */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-700">{stats.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600">{stats.critical}</div>
              <div className="text-xs text-red-700">Critical</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{stats.unacknowledged}</div>
              <div className="text-xs text-orange-700">Unread</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{stats.recent}</div>
              <div className="text-xs text-blue-700">Recent</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    Filters
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configure alert filters by severity, type, and time range</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Severity filters */}
              {['critical', 'high', 'medium', 'low'].map(severity => (
                <Button
                  key={severity}
                  variant={filter.severity.includes(severity) ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const newSeverity = filter.severity.includes(severity)
                      ? filter.severity.filter(s => s !== severity)
                      : [...filter.severity, severity];
                    setFilter({ ...filter, severity: newSeverity });
                  }}
                >
                  {severity}
                </Button>
              ))}
            </div>
          )}

          {/* Alerts List */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Loading alerts...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-600">No alerts to display</p>
              <p className="text-sm text-gray-500 mt-2">
                {alerts.length === 0 ? 'All systems are running smoothly' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Alert key={alert.id} className={`${getSeverityColor(alert.severity)} ${alert.acknowledged ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getTypeIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{alert.agentId}</span>
                          <Badge variant="outline" className="text-xs">
                            {alert.type.replace('_', ' ')}
                          </Badge>
                          <Badge className={`text-xs ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <AlertDescription className="text-sm">
                          {alert.message}
                        </AlertDescription>
                        <div className="text-xs text-gray-600 mt-2 flex items-center gap-4">
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                          {alert.acknowledged && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Acknowledged
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      {!alert.acknowledged && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              className="h-6 w-6 p-0"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Acknowledge alert</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolveAlert(alert.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Resolve and dismiss alert</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </Alert>
              ))}
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
                    <p>Export alert history and reports</p>
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
                    <p>Configure alert thresholds and notification settings</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default AlertManagementWidget;

