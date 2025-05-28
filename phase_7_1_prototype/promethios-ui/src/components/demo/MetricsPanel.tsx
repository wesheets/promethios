import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface MetricsPanelProps {
  metrics: {
    prism: {
      complianceRate: number;
      traceValidation: number;
      manifestValidation: number;
      violations: Array<{
        type: string;
        message: string;
        timestamp: string;
      }>;
    };
    vigil: {
      trustScore: number;
      driftLevel: number;
      reflectionQuality: number;
      violations: Array<{
        type: string;
        message: string;
        timestamp: string;
      }>;
    };
  };
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Prepare data for charts
  const complianceData = [
    { name: 'Compliance', value: metrics.prism.complianceRate },
    { name: 'Non-Compliance', value: 100 - metrics.prism.complianceRate }
  ];

  const validationData = [
    { name: 'Trace', value: metrics.prism.traceValidation },
    { name: 'Manifest', value: metrics.prism.manifestValidation }
  ];

  const trustData = [
    { name: 'Trust', value: metrics.vigil.trustScore },
    { name: 'Drift', value: metrics.vigil.driftLevel }
  ];

  // Colors for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
  const COMPLIANCE_COLORS = ['#4ade80', '#f87171'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Governance Metrics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PRISM Metrics */}
        <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
          <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-200 mb-3">
            PRISM Observer
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Compliance Rate</p>
              <div className="flex items-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                  {metrics.prism.complianceRate}%
                </div>
                <div className="ml-2 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div 
                    className="h-2 bg-indigo-600 rounded-full" 
                    style={{ width: `${metrics.prism.complianceRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Trace Validation</p>
              <div className="flex items-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                  {metrics.prism.traceValidation}%
                </div>
                <div className="ml-2 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div 
                    className="h-2 bg-indigo-600 rounded-full" 
                    style={{ width: `${metrics.prism.traceValidation}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-32 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COMPLIANCE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {metrics.prism.violations.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recent Violations
              </h4>
              <div className="max-h-32 overflow-y-auto">
                {metrics.prism.violations.map((violation, index) => (
                  <div 
                    key={`prism-violation-${index}`}
                    className="text-xs p-2 mb-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-300"
                  >
                    <div className="font-medium">{violation.type}</div>
                    <div>{violation.message}</div>
                    <div className="text-gray-500 dark:text-gray-400 mt-1">
                      {formatTimestamp(violation.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400 italic">
              No violations detected
            </div>
          )}
        </div>
        
        {/* Vigil Metrics */}
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
          <h3 className="text-lg font-medium text-purple-900 dark:text-purple-200 mb-3">
            Vigil Observer
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Trust Score</p>
              <div className="flex items-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                  {metrics.vigil.trustScore}%
                </div>
                <div className="ml-2 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div 
                    className="h-2 bg-purple-600 rounded-full" 
                    style={{ width: `${metrics.vigil.trustScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Drift Level</p>
              <div className="flex items-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                  {metrics.vigil.driftLevel}%
                </div>
                <div className="ml-2 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div 
                    className="h-2 bg-purple-600 rounded-full" 
                    style={{ width: `${metrics.vigil.driftLevel}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-32 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trustData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {metrics.vigil.violations.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recent Violations
              </h4>
              <div className="max-h-32 overflow-y-auto">
                {metrics.vigil.violations.map((violation, index) => (
                  <div 
                    key={`vigil-violation-${index}`}
                    className="text-xs p-2 mb-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-300"
                  >
                    <div className="font-medium">{violation.type}</div>
                    <div>{violation.message}</div>
                    <div className="text-gray-500 dark:text-gray-400 mt-1">
                      {formatTimestamp(violation.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400 italic">
              No violations detected
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>These metrics update in real-time as you interact with the wrapped agent. Try asking questions that might trigger governance checks!</p>
      </div>
    </div>
  );
};

export default MetricsPanel;
