/**
 * Agent Compliance Card Component
 * 
 * This component displays a summary card of an agent's compliance status,
 * including compliance score, violation counts, and key metrics.
 */

import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ShieldExclamationIcon,
  ClockIcon
} from '@heroicons/react/outline';

// Agent interface
interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  complianceScore?: number;
  violationCount?: number;
  enforcementCount?: number;
}

// Component props
interface AgentComplianceCardProps {
  agent: Agent;
  onClick?: () => void;
  className?: string;
}

const AgentComplianceCard: React.FC<AgentComplianceCardProps> = ({ 
  agent, 
  onClick,
  className = ''
}) => {
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-yellow-500';
      case 'suspended':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Get compliance score color
  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Get compliance icon
  const ComplianceIcon = () => {
    const score = agent.complianceScore || 0;
    if (score >= 90) {
      return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
    } else if (score >= 70) {
      return <ShieldExclamationIcon className="h-8 w-8 text-yellow-500" />;
    } else {
      return <ExclamationCircleIcon className="h-8 w-8 text-red-500" />;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Calculate time since last active
  const getTimeSinceLastActive = (dateString: string) => {
    const lastActive = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };
  
  return (
    <div 
      className={`bg-navy-800 rounded-lg p-5 hover:bg-navy-700 transition-colors cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Header with name and status */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium truncate" title={agent.name}>
          {agent.name}
        </h3>
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(agent.status)}`}></div>
          <span className="text-sm capitalize">{agent.status}</span>
        </div>
      </div>
      
      {/* Compliance score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <ComplianceIcon />
          <div className="ml-3">
            <div className="text-sm text-gray-400">Compliance Score</div>
            <div className={`text-2xl font-bold ${getComplianceColor(agent.complianceScore || 0)}`}>
              {agent.complianceScore}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-navy-700 rounded-full h-2 mb-4">
        <div 
          className={`h-2 rounded-full ${getComplianceColor(agent.complianceScore || 0)}`}
          style={{ width: `${agent.complianceScore}%` }}
        ></div>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-navy-700 p-3 rounded">
          <div className="text-xs text-gray-400">Violations</div>
          <div className="text-lg font-bold text-red-400">{agent.violationCount || 0}</div>
        </div>
        <div className="bg-navy-700 p-3 rounded">
          <div className="text-xs text-gray-400">Enforcements</div>
          <div className="text-lg font-bold text-yellow-400">{agent.enforcementCount || 0}</div>
        </div>
      </div>
      
      {/* Last active */}
      <div className="flex items-center text-xs text-gray-400">
        <ClockIcon className="h-3 w-3 mr-1" />
        <span>Last active {getTimeSinceLastActive(agent.lastActive)}</span>
      </div>
    </div>
  );
};

export default AgentComplianceCard;
