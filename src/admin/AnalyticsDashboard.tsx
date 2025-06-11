/**
 * Analytics Dashboard Component
 * 
 * This component displays analytics data for the admin dashboard,
 * including governance metrics, compliance status, and violation trends.
 * Enhanced with VigilObserver integration for real-time governance data.
 */

import React, { useState, useEffect } from 'react';
import { useAdminDashboard } from './AdminDashboardContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsDashboard: React.FC = () => {
  const {
    vigilMetrics,
    vigilViolations,
    vigilEnforcements,
    vigilComplianceStatus,
    vigilObservations,
    refreshVigilData,
    isLoading
  } = useAdminDashboard();

  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

  // Prepare chart data based on VigilObserver metrics
  const prepareViolationsByRuleChart = () => {
    if (!vigilMetrics || !vigilMetrics.violations || !vigilMetrics.violations.byRule) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Violations by Rule',
            data: [],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
          },
        ],
      };
    }

    const byRule = vigilMetrics.violations.byRule;
    const labels = Object.keys(byRule);
    const data = labels.map(rule => byRule[rule]);

    return {
      labels,
      datasets: [
        {
          label: 'Violations by Rule',
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
        },
      ],
    };
  };

  const prepareViolationsBySeverityChart = () => {
    if (!vigilMetrics || !vigilMetrics.violations || !vigilMetrics.violations.bySeverity) {
      return {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
          },
        ],
      };
    }

    const bySeverity = vigilMetrics.violations.bySeverity;
    const labels = Object.keys(bySeverity);
    const data = labels.map(severity => bySeverity[severity]);

    // Color mapping for severity levels
    const backgroundColors = labels.map(severity => {
      switch (severity.toLowerCase()) {
        case 'critical':
          return 'rgba(255, 99, 132, 0.8)';
        case 'high':
          return 'rgba(255, 159, 64, 0.8)';
        case 'medium':
          return 'rgba(255, 205, 86, 0.8)';
        case 'low':
          return 'rgba(75, 192, 192, 0.8)';
        default:
          return 'rgba(201, 203, 207, 0.8)';
      }
    });

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareComplianceTrendChart = () => {
    // For a real implementation, this would use historical data
    // Here we'll simulate some data based on the current compliance score
    const score = vigilComplianceStatus?.complianceScore || 0;
    
    // Generate some fake historical data around the current score
    const days = timeRange === 'day' ? 7 : timeRange === 'week' ? 12 : 30;
    const labels = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Generate data with some random variation but trending toward current score
    const data = labels.map((_, i) => {
      const progress = i / (days - 1); // 0 to 1
      const baseScore = 70 + Math.random() * 10; // Start around 70-80
      const targetScore = score;
      const currentScore = baseScore + (targetScore - baseScore) * progress;
      // Add some noise
      return Math.max(0, Math.min(100, currentScore + (Math.random() * 10 - 5)));
    });

    return {
      labels,
      datasets: [
        {
          label: 'Compliance Score Trend',
          data,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const prepareEnforcementsByActionChart = () => {
    if (!vigilMetrics || !vigilMetrics.enforcements || !vigilMetrics.enforcements.byAction) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Enforcements by Action',
            data: [],
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
          },
        ],
      };
    }

    const byAction = vigilMetrics.enforcements.byAction;
    const labels = Object.keys(byAction);
    const data = labels.map(action => byAction[action]);

    // Color mapping for action types
    const backgroundColors = labels.map(action => {
      switch (action.toLowerCase()) {
        case 'blocked':
          return 'rgba(255, 99, 132, 0.5)';
        case 'warned':
          return 'rgba(255, 205, 86, 0.5)';
        case 'logged':
          return 'rgba(75, 192, 192, 0.5)';
        default:
          return 'rgba(153, 102, 255, 0.5)';
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Enforcements by Action',
          data,
          backgroundColor: backgroundColors,
        },
      ],
    };
  };

  // Chart options
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
    },
  };

  // Refresh data when time range changes
  useEffect(() => {
    refreshVigilData();
  }, [timeRange, refreshVigilData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Governance Analytics</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-3 py-1 rounded ${
              timeRange === 'day'
                ? 'bg-blue-600 text-white'
                : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1 rounded ${
              timeRange === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1 rounded ${
              timeRange === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Compliance Status Summary */}
      <div className="bg-navy-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Compliance Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-navy-700 p-4 rounded-lg">
            <h3 className="text-sm text-gray-400">Compliance Score</h3>
            <div className="flex items-end mt-2">
              <span className="text-3xl font-bold">
                {vigilComplianceStatus?.complianceScore || 0}%
              </span>
            </div>
          </div>
          <div className="bg-navy-700 p-4 rounded-lg">
            <h3 className="text-sm text-gray-400">Total Violations</h3>
            <div className="flex items-end mt-2">
              <span className="text-3xl font-bold">
                {vigilComplianceStatus?.violationCount || 0}
              </span>
            </div>
          </div>
          <div className="bg-navy-700 p-4 rounded-lg">
            <h3 className="text-sm text-gray-400">Total Enforcements</h3>
            <div className="flex items-end mt-2">
              <span className="text-3xl font-bold">
                {vigilComplianceStatus?.enforcementCount || 0}
              </span>
            </div>
          </div>
          <div className="bg-navy-700 p-4 rounded-lg">
            <h3 className="text-sm text-gray-400">Status</h3>
            <div className="flex items-center mt-2">
              <div
                className={`h-3 w-3 rounded-full mr-2 ${
                  vigilComplianceStatus?.compliant
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              ></div>
              <span className="text-lg font-medium">
                {vigilComplianceStatus?.compliant
                  ? 'Compliant'
                  : 'Non-Compliant'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Violations by Rule */}
        <div className="bg-navy-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Violations by Rule</h2>
          <div className="h-64">
            <Bar data={prepareViolationsByRuleChart()} options={barOptions} />
          </div>
        </div>

        {/* Violations by Severity */}
        <div className="bg-navy-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Violations by Severity</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={prepareViolationsBySeverityChart()}
              options={doughnutOptions}
            />
          </div>
        </div>

        {/* Compliance Trend */}
        <div className="bg-navy-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Compliance Score Trend</h2>
          <div className="h-64">
            <Line data={prepareComplianceTrendChart()} options={lineOptions} />
          </div>
        </div>

        {/* Enforcements by Action */}
        <div className="bg-navy-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Enforcements by Action</h2>
          <div className="h-64">
            <Bar
              data={prepareEnforcementsByActionChart()}
              options={barOptions}
            />
          </div>
        </div>
      </div>

      {/* Recent Violations Table */}
      <div className="bg-navy-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Violations</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-navy-600">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rule ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {vigilViolations.slice(0, 5).map((violation, index) => (
                <tr key={index} className="hover:bg-navy-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {violation.ruleId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        violation.severity === 'critical'
                          ? 'bg-red-900 text-red-200'
                          : violation.severity === 'high'
                          ? 'bg-orange-900 text-orange-200'
                          : violation.severity === 'medium'
                          ? 'bg-yellow-900 text-yellow-200'
                          : 'bg-blue-900 text-blue-200'
                      }`}
                    >
                      {violation.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {violation.agentId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(violation.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
              {vigilViolations.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-gray-400"
                  >
                    No violations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
