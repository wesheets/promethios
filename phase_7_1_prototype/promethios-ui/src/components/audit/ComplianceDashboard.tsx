import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ComplianceMetrics {
  framework: string;
  score: number;
  status: 'compliant' | 'warning' | 'violation';
  lastAssessment: string;
  violations: number;
  requirements: {
    total: number;
    met: number;
    pending: number;
    failed: number;
  };
}

interface ComplianceViolation {
  id: string;
  framework: string;
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved';
  agentId: string;
}

interface ComplianceDashboardProps {
  agentId: string;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  agentId
}) => {
  const { isDarkMode } = useTheme();
  const [metrics, setMetrics] = useState<ComplianceMetrics[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<string>('all');

  useEffect(() => {
    loadComplianceData();
  }, [agentId]);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      // Load compliance metrics
      const metricsResponse = await fetch(`/api/enterprise-transparency/compliance/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentId,
          frameworks: ['GDPR', 'HIPAA', 'SOX'],
          includeViolations: true
        })
      });

      if (metricsResponse.ok) {
        const data = await metricsResponse.json();
        setMetrics(data.frameworks || []);
        setViolations(data.violations || []);
      }
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'violation':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const filteredViolations = selectedFramework === 'all' 
    ? violations 
    : violations.filter(v => v.framework === selectedFramework);

  const overallScore = metrics.length > 0 
    ? Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length)
    : 0;

  const totalViolations = violations.length;
  const openViolations = violations.filter(v => v.status === 'open').length;

  if (loading) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-8`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading compliance data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Compliance Summary */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
        <h2 className="text-lg font-semibold mb-6">Compliance Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Overall Score
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.length}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Frameworks
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {openViolations}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Open Violations
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
              {totalViolations}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Violations
            </div>
          </div>
        </div>
      </div>

      {/* Framework Details */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
        <h2 className="text-lg font-semibold mb-6">Compliance Frameworks</h2>
        
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div
              key={metric.framework}
              className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium">{metric.framework}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                    {metric.status}
                  </span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                  {metric.score}%
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Requirements Met:
                  </span>
                  <div className="font-medium">
                    {metric.requirements.met} / {metric.requirements.total}
                  </div>
                </div>
                <div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Pending:
                  </span>
                  <div className="font-medium text-yellow-600 dark:text-yellow-400">
                    {metric.requirements.pending}
                  </div>
                </div>
                <div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Failed:
                  </span>
                  <div className="font-medium text-red-600 dark:text-red-400">
                    {metric.requirements.failed}
                  </div>
                </div>
                <div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Last Assessment:
                  </span>
                  <div className="font-medium">
                    {new Date(metric.lastAssessment).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2`}>
                  <div
                    className={`h-2 rounded-full ${
                      metric.score >= 90 ? 'bg-green-500' :
                      metric.score >= 75 ? 'bg-yellow-500' :
                      metric.score >= 60 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${metric.score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Violations */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Compliance Violations</h2>
          
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className={`px-3 py-2 border rounded-md text-sm ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Frameworks</option>
            {metrics.map(metric => (
              <option key={metric.framework} value={metric.framework}>
                {metric.framework}
              </option>
            ))}
          </select>
        </div>

        {filteredViolations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-medium mb-2">No Violations Found</h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {selectedFramework === 'all' 
                ? 'This agent has no compliance violations across all frameworks.'
                : `This agent has no violations for ${selectedFramework}.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredViolations.map((violation) => (
              <div
                key={violation.id}
                className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{violation.rule}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                        {violation.severity}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        violation.status === 'open' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : violation.status === 'investigating'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {violation.status}
                      </span>
                    </div>
                    
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      {violation.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        Framework: <span className="font-medium">{violation.framework}</span>
                      </span>
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        Agent: <span className="font-medium">{violation.agentId}</span>
                      </span>
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {new Date(violation.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

