import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  ReferenceLine,
  Tooltip as RechartsTooltip
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  Zap, 
  AlertTriangle,
  Info,
  RefreshCw,
  Pause,
  Play
} from 'lucide-react';

interface MetricDataPoint {
  timestamp: string;
  trustScore: number;
  complianceRate: number;
  responseTime: number;
  errorRate: number;
  violationCount: number;
}

interface RealTimeMetricsChartProps {
  agentId: string;
  timeRange?: '1h' | '6h' | '24h' | '7d';
  refreshInterval?: number;
  className?: string;
}

export const RealTimeMetricsChart: React.FC<RealTimeMetricsChartProps> = ({
  agentId,
  timeRange = '1h',
  refreshInterval = 30000,
  className = ''
}) => {
  const [data, setData] = useState<MetricDataPoint[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'trustScore' | 'complianceRate' | 'responseTime' | 'errorRate'>('trustScore');
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate sample data for demonstration
  const generateSampleData = (): MetricDataPoint[] => {
    const now = new Date();
    const points: MetricDataPoint[] = [];
    const intervals = timeRange === '1h' ? 60 : timeRange === '6h' ? 72 : timeRange === '24h' ? 144 : 168;
    const stepMs = timeRange === '1h' ? 60000 : timeRange === '6h' ? 300000 : timeRange === '24h' ? 600000 : 3600000;

    for (let i = intervals; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * stepMs));
      points.push({
        timestamp: timestamp.toISOString(),
        trustScore: 0.7 + Math.random() * 0.3,
        complianceRate: 0.85 + Math.random() * 0.15,
        responseTime: 200 + Math.random() * 300,
        errorRate: Math.random() * 0.05,
        violationCount: Math.floor(Math.random() * 3)
      });
    }
    return points;
  };

  const fetchMetricsData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const newData = generateSampleData();
      setData(newData);
    } catch (error) {
      console.error('Failed to fetch metrics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetricsData();
  }, [agentId, timeRange]);

  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(() => {
        // Add new data point
        const now = new Date();
        const newPoint: MetricDataPoint = {
          timestamp: now.toISOString(),
          trustScore: 0.7 + Math.random() * 0.3,
          complianceRate: 0.85 + Math.random() * 0.15,
          responseTime: 200 + Math.random() * 300,
          errorRate: Math.random() * 0.05,
          violationCount: Math.floor(Math.random() * 3)
        };

        setData(prev => {
          const updated = [...prev, newPoint];
          // Keep only last 100 points for performance
          return updated.slice(-100);
        });
      }, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLive, refreshInterval]);

  const getMetricConfig = (metric: string) => {
    switch (metric) {
      case 'trustScore':
        return {
          name: 'Trust Score',
          color: '#3b82f6',
          icon: <Shield className="h-4 w-4" />,
          format: (value: number) => `${(value * 100).toFixed(1)}%`,
          threshold: 0.7,
          unit: '%'
        };
      case 'complianceRate':
        return {
          name: 'Compliance Rate',
          color: '#10b981',
          icon: <Activity className="h-4 w-4" />,
          format: (value: number) => `${(value * 100).toFixed(1)}%`,
          threshold: 0.9,
          unit: '%'
        };
      case 'responseTime':
        return {
          name: 'Response Time',
          color: '#f59e0b',
          icon: <Zap className="h-4 w-4" />,
          format: (value: number) => `${value.toFixed(0)}ms`,
          threshold: 500,
          unit: 'ms'
        };
      case 'errorRate':
        return {
          name: 'Error Rate',
          color: '#ef4444',
          icon: <AlertTriangle className="h-4 w-4" />,
          format: (value: number) => `${(value * 100).toFixed(2)}%`,
          threshold: 0.05,
          unit: '%'
        };
      default:
        return {
          name: 'Unknown',
          color: '#6b7280',
          icon: <Activity className="h-4 w-4" />,
          format: (value: number) => value.toString(),
          threshold: 0,
          unit: ''
        };
    }
  };

  const config = getMetricConfig(selectedMetric);
  const latestValue = data.length > 0 ? data[data.length - 1][selectedMetric] : 0;
  const previousValue = data.length > 1 ? data[data.length - 2][selectedMetric] : latestValue;
  const trend = latestValue > previousValue ? 'up' : latestValue < previousValue ? 'down' : 'stable';

  const formatXAxisTick = (tickItem: string) => {
    const date = new Date(tickItem);
    if (timeRange === '1h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === '6h' || timeRange === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            {new Date(label).toLocaleString()}
          </p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: config.color }}></div>
              <span className="text-sm text-gray-600">{config.name}:</span>
              <span className="text-sm font-medium">{config.format(payload[0].value)}</span>
            </div>
            {data.violationCount > 0 && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-sm text-red-600">
                  {data.violationCount} violation{data.violationCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <TooltipProvider>
      <Card className={`${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {config.icon}
              Real-Time Metrics
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Live metrics from deployed agent with governance monitoring</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLive(!isLive)}
                    className="h-8 w-8 p-0"
                  >
                    {isLive ? (
                      <Pause className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Play className="h-4 w-4 text-gray-600" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isLive ? 'Pause live updates' : 'Resume live updates'}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchMetricsData}
                    disabled={loading}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh metrics data</p>
                </TooltipContent>
              </Tooltip>
              
              {isLive && (
                <Badge variant="secondary" className="text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  Live
                </Badge>
              )}
            </div>
          </div>

          {/* Metric Selector */}
          <div className="flex gap-2 flex-wrap">
            {(['trustScore', 'complianceRate', 'responseTime', 'errorRate'] as const).map((metric) => {
              const metricConfig = getMetricConfig(metric);
              const isSelected = selectedMetric === metric;
              return (
                <Button
                  key={metric}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMetric(metric)}
                  className="text-xs"
                >
                  {metricConfig.icon}
                  <span className="ml-1">{metricConfig.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Current Value Display */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold" style={{ color: config.color }}>
                {config.format(latestValue)}
              </span>
              {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
            </div>
            
            {selectedMetric === 'trustScore' && latestValue < config.threshold && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Below Threshold
              </Badge>
            )}
            
            {selectedMetric === 'errorRate' && latestValue > config.threshold && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                High Error Rate
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatXAxisTick}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => {
                    if (selectedMetric === 'trustScore' || selectedMetric === 'complianceRate') {
                      return `${(value * 100).toFixed(0)}%`;
                    } else if (selectedMetric === 'responseTime') {
                      return `${value.toFixed(0)}ms`;
                    } else {
                      return `${(value * 100).toFixed(1)}%`;
                    }
                  }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                
                {/* Threshold line */}
                <ReferenceLine 
                  y={config.threshold} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />
                
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={config.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: config.color, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              {(['1h', '6h', '24h', '7d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    // In real implementation, this would trigger a re-fetch
                    console.log(`Switching to ${range} time range`);
                  }}
                  className="text-xs"
                >
                  {range}
                </Button>
              ))}
            </div>
            
            <div className="text-xs text-gray-500">
              Last updated: {data.length > 0 ? new Date(data[data.length - 1].timestamp).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default RealTimeMetricsChart;

