import React from 'react';
import { useTheme } from "../../context/ThemeContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrustScoreDivergenceProps {
  ungovernedHistory: { time: number; score: number }[];
  governedHistory: { time: number; score: number }[];
  className?: string;
}

/**
 * TrustScoreDivergence Component
 * 
 * Visualizes how trust scores diverge over time between governed and ungoverned agents.
 * Shows a clear comparison of how governance impacts trust over the course of interaction.
 */
const TrustScoreDivergence: React.FC<TrustScoreDivergenceProps> = ({
  ungovernedHistory,
  governedHistory,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  // Format data for the chart
  const formatChartData = () => {
    // Get all unique timestamps from both histories
    const allTimestamps = [...new Set([
      ...ungovernedHistory.map(item => item.time),
      ...governedHistory.map(item => item.time)
    ])].sort((a, b) => a - b);
    
    // Create data points for each timestamp
    return allTimestamps.map((time, index) => {
      // Find the closest data points for each agent
      const ungovernedPoint = ungovernedHistory.find(item => item.time === time) || 
        ungovernedHistory.reduce((prev, curr) => 
          Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev, 
          ungovernedHistory[0]
        );
      
      const governedPoint = governedHistory.find(item => item.time === time) || 
        governedHistory.reduce((prev, curr) => 
          Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev, 
          governedHistory[0]
        );
      
      return {
        name: index, // Use index as name for simplicity
        ungoverned: Math.round(ungovernedPoint.score),
        governed: Math.round(governedPoint.score),
        time
      };
    });
  };
  
  const chartData = formatChartData();
  
  return (
    <div className={`rounded-lg overflow-hidden shadow-md p-4 ${
      isDarkMode ? 'bg-navy-800' : 'bg-white'
    } ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Trust Score Divergence</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="name" 
              label={{ value: 'Interactions', position: 'insideBottomRight', offset: -5 }}
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
            />
            <YAxis 
              domain={[0, 100]} 
              label={{ value: 'Trust Score', angle: -90, position: 'insideLeft' }}
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                color: isDarkMode ? '#f3f4f6' : '#111827'
              }}
              formatter={(value: number, name: string) => [
                `${value}`, 
                name === 'ungoverned' ? 'Ungoverned Agent' : 'Governed Agent'
              ]}
              labelFormatter={(value) => `Interaction ${value + 1}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="ungoverned" 
              stroke="#ef4444" 
              strokeWidth={2}
              activeDot={{ r: 8 }}
              name="Ungoverned Agent"
            />
            <Line 
              type="monotone" 
              dataKey="governed" 
              stroke="#10b981" 
              strokeWidth={2}
              activeDot={{ r: 8 }}
              name="Governed Agent"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
        Watch how trust scores diverge as you interact with both agents. Governance leads to consistent improvement, while ungoverned agents accumulate risk over time.
      </p>
    </div>
  );
};

export default TrustScoreDivergence;
