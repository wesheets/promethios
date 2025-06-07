import React from 'react';
import styled from 'styled-components';
import { useObserver } from '../components/observer/ObserverContext';
import { notifyObserver } from '../components/observer/ObserverAgent';
import { Tooltip } from '../components/common/Tooltip';

// Types
interface GovernanceExplorerProps {
  className?: string;
}

// Styled Components
const ExplorerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ExplorerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ExplorerTitle = styled.h1`
  font-size: 28px;
  color: #FFFFFF;
  margin: 0;
`;

const ExplorerDescription = styled.p`
  font-size: 16px;
  color: #B0B8C4;
  margin: 8px 0 0 0;
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #2A3343;
  margin-bottom: 24px;
`;

const Tab = styled.div<{ active: boolean }>`
  padding: 12px 24px;
  font-size: 16px;
  color: ${props => props.active ? '#FFFFFF' : '#B0B8C4'};
  border-bottom: 2px solid ${props => props.active ? '#2BFFC6' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #FFFFFF;
  }
`;

const VisualizationContainer = styled.div`
  background-color: #1A2233;
  border: 1px solid #2A3343;
  border-radius: 8px;
  padding: 24px;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const VisualizationPlaceholder = styled.div`
  color: #B0B8C4;
  font-size: 18px;
  text-align: center;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 24px;
`;

const MetricCard = styled.div`
  background-color: #1A2233;
  border: 1px solid #2A3343;
  border-radius: 8px;
  padding: 20px;
`;

const MetricTitle = styled.div`
  font-size: 14px;
  color: #B0B8C4;
  margin-bottom: 8px;
`;

const MetricValue = styled.div`
  font-size: 28px;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 8px;
`;

/**
 * GovernanceExplorer Component
 * 
 * Visualization and exploration of governance metrics and relationships.
 * 
 * @param {GovernanceExplorerProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const GovernanceExplorer: React.FC<GovernanceExplorerProps> = ({
  className
}) => {
  // Hooks
  const { addMemoryItem, logPresence } = useObserver();
  const [activeTab, setActiveTab] = React.useState('hierarchy');
  
  // Effect to notify Observer on explorer load
  React.useEffect(() => {
    // Log Observer presence on this page
    logPresence('GovernanceExplorer', true, 'governance-relevant route');
    
    notifyObserver('info', 'Welcome to the Governance Explorer! Here you can visualize and understand the governance relationships between your agents.');
    addMemoryItem('Viewed governance explorer');
  }, []);
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    addMemoryItem(`Switched to ${tab} view in governance explorer`);
    
    // Notify Observer about tab change
    switch (tab) {
      case 'hierarchy':
        notifyObserver('info', 'The hierarchy view shows the governance relationships between your agents.');
        break;
      case 'metrics':
        notifyObserver('info', 'The metrics view shows detailed governance metrics for each agent.');
        break;
      case 'audit':
        notifyObserver('info', 'The audit view shows a timeline of governance events and interventions.');
        break;
    }
  };
  
  // Mock metrics data
  const metrics = [
    {
      title: 'Governance Coverage',
      value: '87%'
    },
    {
      title: 'Compliance Score',
      value: '92%'
    },
    {
      title: 'Intervention Rate',
      value: '3.2%'
    },
    {
      title: 'Agents Governed',
      value: '5'
    }
  ];
  
  // Render metric card
  const renderMetricCard = (metric: any) => (
    <Tooltip
      content="I'll remember which metrics you focus on to provide better context."
      placement="top"
    >
      <MetricCard key={metric.title} data-testid={`metric-${metric.title.toLowerCase().replace(/\s/g, '-')}`}>
        <MetricTitle>{metric.title}</MetricTitle>
        <MetricValue>{metric.value}</MetricValue>
      </MetricCard>
    </Tooltip>
  );

  return (
    <ExplorerContainer className={className} data-testid="governance-explorer">
      <ExplorerHeader>
        <div>
          <ExplorerTitle>Governance Explorer</ExplorerTitle>
          <ExplorerDescription>Visualize and understand your agent governance structure</ExplorerDescription>
        </div>
      </ExplorerHeader>
      
      <TabsContainer>
        <Tab 
          active={activeTab === 'hierarchy'} 
          onClick={() => handleTabChange('hierarchy')}
          data-testid="tab-hierarchy"
        >
          Hierarchy
        </Tab>
        <Tab 
          active={activeTab === 'metrics'} 
          onClick={() => handleTabChange('metrics')}
          data-testid="tab-metrics"
        >
          Metrics
        </Tab>
        <Tab 
          active={activeTab === 'audit'} 
          onClick={() => handleTabChange('audit')}
          data-testid="tab-audit"
        >
          Audit Trail
        </Tab>
      </TabsContainer>
      
      <VisualizationContainer>
        <VisualizationPlaceholder>
          {activeTab === 'hierarchy' && 'Governance Hierarchy Visualization'}
          {activeTab === 'metrics' && 'Governance Metrics Visualization'}
          {activeTab === 'audit' && 'Governance Audit Trail Visualization'}
        </VisualizationPlaceholder>
      </VisualizationContainer>
      
      <MetricsGrid>
        {metrics.map(renderMetricCard)}
      </MetricsGrid>
    </ExplorerContainer>
  );
};

export default GovernanceExplorer;
