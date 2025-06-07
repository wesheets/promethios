/**
 * Developer Dashboard component
 * 
 * Main dashboard component for developers to interact with the Promethios system.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React, { useState } from 'react';
import { AgentWizard } from './components/AgentWizard';
import { MetricsDashboard } from './components/MetricsDashboard';
import { ConfigurationPanel } from './components/ConfigurationPanel';

// Tab types
type TabType = 'metrics' | 'wizard' | 'config';

// Props interface
interface DeveloperDashboardProps {
  initialTab?: TabType;
}

// Developer Dashboard component
export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({ 
  initialTab = 'metrics' 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  
  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'metrics':
        return <MetricsDashboard />;
      case 'wizard':
        return <AgentWizard />;
      case 'config':
        return <ConfigurationPanel />;
      default:
        return <MetricsDashboard />;
    }
  };
  
  return (
    <div className="developer-dashboard" data-testid="developer-dashboard">
      <header className="dashboard-header">
        <h1>Promethios Developer Dashboard</h1>
        <nav className="dashboard-tabs">
          <button 
            className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            Metrics
          </button>
          <button 
            className={`tab ${activeTab === 'wizard' ? 'active' : ''}`}
            onClick={() => setActiveTab('wizard')}
          >
            Agent Wizard
          </button>
          <button 
            className={`tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            Configuration
          </button>
        </nav>
      </header>
      
      <main className="dashboard-content">
        {renderTabContent()}
      </main>
    </div>
  );
};
