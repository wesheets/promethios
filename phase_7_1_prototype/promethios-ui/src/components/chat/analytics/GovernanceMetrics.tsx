/**
 * Governance Metrics Component
 * 
 * Comprehensive governance analytics dashboard for compliance monitoring,
 * policy enforcement, audit trails, and regulatory reporting.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Users, 
  Activity, 
  Eye, 
  Lock, 
  Scale, 
  Clock,
  Download,
  RefreshCw,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  UserCheck,
  Database,
  Gavel
} from 'lucide-react';

interface GovernanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'compliant' | 'warning' | 'violation';
  threshold?: number;
}

interface ComplianceData {
  timestamp: string;
  policyCompliance: number;
  auditScore: number;
  violations: number;
  riskScore: number;
  dataPrivacy: number;
}

interface PolicyViolation {
  id: string;
  policy: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  trend: number;
  lastOccurrence: string;
}

const GovernanceMetrics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState<GovernanceMetric[]>([]);
  const [complianceData, setComplianceData] = useState<ComplianceData[]>([]);
  const [policyViolations, setPolicyViolations] = useState<PolicyViolation[]>([]);
  const [loading, setLoading] = useState(true);

  const mockMetrics: GovernanceMetric[] = [
    {
      id: 'overall_compliance',
      name: 'Overall Compliance',
      value: 96.8,
      unit: '%',
      change: 2.3,
      trend: 'up',
      status: 'compliant',
      threshold: 95.0
    },
    {
      id: 'policy_violations',
      name: 'Policy Violations',
      value: 23,
      unit: 'violations',
      change: -18.5,
      trend: 'down',
      status: 'compliant',
      threshold: 50
    },
    {
      id: 'audit_score',
      name: 'Audit Score',
      value: 94.2,
      unit: '/100',
      change: 1.8,
      trend: 'up',
      status: 'compliant',
      threshold: 90.0
    },
    {
      id: 'data_privacy',
      name: 'Data Privacy Score',
      value: 98.5,
      unit: '%',
      change: 0.7,
      trend: 'up',
      status: 'compliant',
      threshold: 95.0
    },
    {
      id: 'risk_score',
      name: 'Risk Score',
      value: 12.3,
      unit: '/100',
      change: -8.2,
      trend: 'down',
      status: 'compliant',
      threshold: 25.0
    },
    {
      id: 'retention_compliance',
      name: 'Data Retention',
      value: 99.1,
      unit: '%',
      change: 0.3,
      trend: 'stable',
      status: 'compliant',
      threshold: 98.0
    }
  ];

  const mockComplianceData: ComplianceData[] = [
    { timestamp: '2024-01-01', policyCompliance: 94.2, auditScore: 91.5, violations: 45, riskScore: 18.7, dataPrivacy: 96.8 },
    { timestamp: '2024-01-05', policyCompliance: 95.1, auditScore: 92.3, violations: 38, riskScore: 16.2, dataPrivacy: 97.2 },
    { timestamp: '2024-01-10', policyCompliance: 95.8, auditScore: 93.1, violations: 32, riskScore: 15.1, dataPrivacy: 97.8 },
    { timestamp: '2024-01-15', policyCompliance: 96.2, auditScore: 93.7, violations: 28, riskScore: 14.3, dataPrivacy: 98.1 },
    { timestamp: '2024-01-20', policyCompliance: 96.8, auditScore: 94.2, violations: 23, riskScore: 12.3, dataPrivacy: 98.5 }
  ];

  const mockPolicyViolations: PolicyViolation[] = [
    {
      id: 'data_retention',
      policy: 'Data Retention Policy',
      severity: 'medium',
      count: 8,
      trend: -25.0,
      lastOccurrence: '2024-01-19T14:30:00Z'
    },
    {
      id: 'access_control',
      policy: 'Access Control Policy',
      severity: 'high',
      count: 5,
      trend: -40.0,
      lastOccurrence: '2024-01-20T09:15:00Z'
    },
    {
      id: 'data_privacy',
      policy: 'Data Privacy Policy',
      severity: 'low',
      count: 12,
      trend: -15.2,
      lastOccurrence: '2024-01-20T11:45:00Z'
    },
    {
      id: 'content_safety',
      policy: 'Content Safety Policy',
      severity: 'medium',
      count: 6,
      trend: -33.3,
      lastOccurrence: '2024-01-18T16:20:00Z'
    },
    {
      id: 'audit_logging',
      policy: 'Audit Logging Policy',
      severity: 'critical',
      count: 2,
      trend: -50.0,
      lastOccurrence: '2024-01-17T13:10:00Z'
    }
  ];

  const complianceFrameworks = [
    { name: 'GDPR', score: 98.2, status: 'compliant', color: '#10B981' },
    { name: 'HIPAA', score: 96.7, status: 'compliant', color: '#3B82F6' },
    { name: 'SOX', score: 94.8, status: 'warning', color: '#F59E0B' },
    { name: 'PCI DSS', score: 97.5, status: 'compliant', color: '#10B981' },
    { name: 'ISO 27001', score: 95.3, status: 'compliant', color: '#10B981' }
  ];

  const auditActivities = [
    { category: 'User Access', events: 1247, percentage: 35.2 },
    { category: 'Data Operations', events: 892, percentage: 25.1 },
    { category: 'Policy Changes', events: 456, percentage: 12.8 },
    { category: 'System Events', events: 634, percentage: 17.9 },
    { category: 'Compliance Checks', events: 321, percentage: 9.0 }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setMetrics(mockMetrics);
      setComplianceData(mockComplianceData);
      setPolicyViolations(mockPolicyViolations);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'violation':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-600';
      case 'medium':
        return 'bg-yellow-600';
      case 'high':
        return 'bg-orange-600';
      case 'critical':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend === 'down') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const exportData = () => {
    console.log('Exporting governance metrics data...');
  };

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-white">Loading governance metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Governance Metrics</h1>
          <p className="text-gray-300 mt-2">
            Monitor compliance, policy enforcement, and regulatory adherence across all systems.
          </p>
        </div>
        <div className="flex space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="7d" className="text-white">Last 7 days</SelectItem>
              <SelectItem value="30d" className="text-white">Last 30 days</SelectItem>
              <SelectItem value="90d" className="text-white">Last 90 days</SelectItem>
              <SelectItem value="1y" className="text-white">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refreshData} variant="outline" className="text-white border-gray-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id} className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${
                  metric.status === 'compliant' ? 'bg-green-100' :
                  metric.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  {metric.id === 'overall_compliance' && <Shield className="h-4 w-4 text-green-600" />}
                  {metric.id === 'policy_violations' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  {metric.id === 'audit_score' && <FileText className="h-4 w-4 text-blue-600" />}
                  {metric.id === 'data_privacy' && <Lock className="h-4 w-4 text-purple-600" />}
                  {metric.id === 'risk_score' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                  {metric.id === 'retention_compliance' && <Database className="h-4 w-4 text-green-600" />}
                </div>
                {getTrendIcon(metric.trend, metric.change)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-300">{metric.name}</p>
                <p className="text-2xl font-bold text-white">
                  {metric.value}{metric.unit}
                </p>
                <div className="flex items-center mt-1">
                  <span className={`text-sm ${metric.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.change >= 0 ? '+' : ''}{metric.change}%
                  </span>
                  {metric.threshold && (
                    <span className="text-xs text-gray-400 ml-2">
                      Target: {metric.threshold}{metric.unit}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="compliance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="compliance" className="text-white data-[state=active]:bg-gray-700">
            Compliance Trends
          </TabsTrigger>
          <TabsTrigger value="violations" className="text-white data-[state=active]:bg-gray-700">
            Policy Violations
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="text-white data-[state=active]:bg-gray-700">
            Frameworks
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-white data-[state=active]:bg-gray-700">
            Audit Activity
          </TabsTrigger>
        </TabsList>

        {/* Compliance Trends Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Compliance Score Trends</CardTitle>
                <CardDescription className="text-gray-300">
                  Overall compliance and audit scores over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="policyCompliance" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Policy Compliance (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="auditScore" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Audit Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Risk & Privacy Metrics</CardTitle>
                <CardDescription className="text-gray-300">
                  Risk score and data privacy compliance trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="riskScore" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Risk Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="dataPrivacy" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      name="Data Privacy (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Policy Violations Over Time</CardTitle>
                <CardDescription className="text-gray-300">
                  Number of policy violations detected per period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="violations" 
                      stroke="#EF4444" 
                      fill="#EF4444" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Policy Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          <div className="grid gap-4">
            {policyViolations.map((violation) => (
              <Card key={violation.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{violation.policy}</CardTitle>
                      <CardDescription className="text-gray-300">
                        Last occurrence: {new Date(violation.lastOccurrence).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(violation.severity)}>
                        {violation.severity.toUpperCase()}
                      </Badge>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{violation.count}</p>
                        <p className="text-sm text-gray-300">violations</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {violation.trend < 0 ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ${violation.trend < 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {violation.trend}% from last period
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="text-white border-gray-600">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Compliance Frameworks Tab */}
        <TabsContent value="frameworks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Framework Compliance Scores</CardTitle>
                <CardDescription className="text-gray-300">
                  Current compliance status for each framework
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceFrameworks.map((framework, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: framework.color }}></div>
                        <span className="text-white font-medium">{framework.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-bold">{framework.score}%</span>
                        <Badge variant={framework.status === 'compliant' ? 'default' : 'secondary'}>
                          {framework.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Framework Compliance Chart</CardTitle>
                <CardDescription className="text-gray-300">
                  Visual representation of compliance scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={complianceFrameworks}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }} 
                    />
                    <Bar dataKey="score" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Activity Tab */}
        <TabsContent value="audit" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Audit Event Distribution</CardTitle>
                <CardDescription className="text-gray-300">
                  Breakdown of audit events by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={auditActivities}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="events"
                    >
                      {auditActivities.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 72}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Audit Events</CardTitle>
                <CardDescription className="text-gray-300">
                  Latest audit trail entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <UserCheck className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-white text-sm">User login attempt</p>
                        <p className="text-gray-400 text-xs">2 minutes ago</p>
                      </div>
                    </div>
                    <Badge variant="default">Success</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Database className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-white text-sm">Data access request</p>
                        <p className="text-gray-400 text-xs">5 minutes ago</p>
                      </div>
                    </div>
                    <Badge variant="default">Approved</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Gavel className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="text-white text-sm">Policy update</p>
                        <p className="text-gray-400 text-xs">1 hour ago</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-white text-sm">Security violation</p>
                        <p className="text-gray-400 text-xs">3 hours ago</p>
                      </div>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GovernanceMetrics;

