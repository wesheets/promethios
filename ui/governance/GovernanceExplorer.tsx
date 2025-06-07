import React from 'react';
import styled from 'styled-components';
import { useObserver } from '../../components/observer/ObserverContext';
import { notifyObserver } from '../../components/observer/ObserverAgent';

// Types
interface GovernanceExplorerProps {
  className?: string;
}

interface GovernanceMetric {
  id: string;
  name: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  category: 'trust' | 'compliance' | 'performance' | 'transparency';
  description: string;
}

interface GovernanceComponent {
  id: string;
  name: string;
  type: 'monitor' | 'validator' | 'logger' | 'explainer';
  status: 'active' | 'inactive' | 'warning' | 'error';
  metrics: string[];
  description: string;
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

const ExplorerTitle = styled.h2`
  font-size: 24px;
  color: #FFFFFF;
  margin: 0;
`;

const ExplorerControls = styled.div`
  display: flex;
  gap: 16px;
`;

const ViewToggle = styled.button<{ active: boolean }>`
  background-color: ${props => props.active ? 'rgba(43, 255, 198, 0.1)' : 'transparent'};
  color: ${props => props.active ? '#2BFFC6' : '#B0B8C4'};
  border: 1px solid ${props => props.active ? '#2BFFC6' : '#2A3343'};
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.active ? 'rgba(43, 255, 198, 0.2)' : 'rgba(43, 255, 198, 0.05)'};
  }
  
  &:focus {
    outline: 2px solid #2BFFC6;
    outline-offset: 2px;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const MetricCard = styled.div<{ category: string }>`
  background-color: #1A2233;
  border: 1px solid #2A3343;
  border-left: 4px solid ${props => {
    switch (props.category) {
      case 'trust': return '#2BFFC6';
      case 'compliance': return '#3B82F6';
      case 'performance': return '#F59E0B';
      case 'transparency': return '#8B5CF6';
      default: return '#2A3343';
    }
  }};
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const MetricName = styled.div`
  font-weight: bold;
  color: #FFFFFF;
`;

const MetricCategory = styled.div<{ category: string }>`
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: ${props => {
    switch (props.category) {
      case 'trust': return 'rgba(43, 255, 198, 0.1)';
      case 'compliance': return 'rgba(59, 130, 246, 0.1)';
      case 'performance': return 'rgba(245, 158, 11, 0.1)';
      case 'transparency': return 'rgba(139, 92, 246, 0.1)';
      default: return 'rgba(42, 51, 67, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.category) {
      case 'trust': return '#2BFFC6';
      case 'compliance': return '#3B82F6';
      case 'performance': return '#F59E0B';
      case 'transparency': return '#8B5CF6';
      default: return '#B0B8C4';
    }
  }};
`;

const MetricValue = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: #FFFFFF;
  margin: 8px 0;
`;

const MetricTrend = styled.div<{ trend: string }>`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: ${props => {
    switch (props.trend) {
      case 'up': return '#2BFFC6';
      case 'down': return '#FF4C4C';
      default: return '#B0B8C4';
    }
  }};
`;

const MetricDescription = styled.div`
  font-size: 14px;
  color: #B0B8C4;
  margin-top: 8px;
  line-height: 1.5;
`;

const ComponentsTable = styled.div`
  background-color: #1A2233;
  border: 1px solid #2A3343;
  border-radius: 4px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr;
  padding: 16px;
  background-color: #0D1117;
  border-bottom: 1px solid #2A3343;
  
  & > div {
    font-weight: bold;
    color: #FFFFFF;
  }
`;

const TableRow = styled.div<{ status: string }>`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr;
  padding: 16px;
  border-bottom: 1px solid #2A3343;
  background-color: ${props => {
    switch (props.status) {
      case 'warning': return 'rgba(245, 158, 11, 0.05)';
      case 'error': return 'rgba(255, 76, 76, 0.05)';
      default: return 'transparent';
    }
  }};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: rgba(43, 255, 198, 0.05);
  }
`;

const ComponentName = styled.div`
  font-weight: bold;
  color: #FFFFFF;
`;

const ComponentType = styled.div`
  color: #B0B8C4;
`;

const ComponentStatus = styled.div<{ status: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: ${props => {
    switch (props.status) {
      case 'active': return 'rgba(43, 255, 198, 0.1)';
      case 'inactive': return 'rgba(176, 184, 196, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      case 'error': return 'rgba(255, 76, 76, 0.1)';
      default: return 'rgba(42, 51, 67, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active': return '#2BFFC6';
      case 'inactive': return '#B0B8C4';
      case 'warning': return '#F59E0B';
      case 'error': return '#FF4C4C';
      default: return '#B0B8C4';
    }
  }};
`;

const ComponentDescription = styled.div`
  color: #B0B8C4;
`;

const VisualizationContainer = styled.div`
  background-color: #1A2233;
  border: 1px solid #2A3343;
  border-radius: 4px;
  padding: 24px;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const VisualizationPlaceholder = styled.div`
  color: #B0B8C4;
  text-align: center;
  max-width: 400px;
`;

/**
 * GovernanceExplorer Component
 * 
 * Data-dense visualization component for exploring governance metrics and components.
 * Provides multiple views for analyzing governance performance.
 * 
 * @param {GovernanceExplorerProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const GovernanceExplorer: React.FC<GovernanceExplorerProps> = ({
  className
}) => {
  // Observer context
  const { addMemoryItem } = useObserver();
  
  // State
  const [activeView, setActiveView] = React.useState<'metrics' | 'components' | 'visualization'>('metrics');
  
  // Mock data for demonstration
  const metrics: GovernanceMetric[] = [
    {
      id: 'trust-score',
      name: 'Trust Score',
      value: 92,
      trend: 'up',
      category: 'trust',
      description: 'Overall trust score based on agent behavior, transparency, and compliance.'
    },
    {
      id: 'compliance-rate',
      name: 'Compliance Rate',
      value: 98,
      trend: 'up',
      category: 'compliance',
      description: 'Percentage of agent actions that comply with governance policies.'
    },
    {
      id: 'response-time',
      name: 'Response Time',
      value: 245,
      trend: 'down',
      category: 'performance',
      description: 'Average response time in milliseconds for governed agents.'
    },
    {
      id: 'explanation-quality',
      name: 'Explanation Quality',
      value: 87,
      trend: 'up',
      category: 'transparency',
      description: 'Quality score for agent explanations and reasoning transparency.'
    },
    {
      id: 'policy-adherence',
      name: 'Policy Adherence',
      value: 94,
      trend: 'stable',
      category: 'compliance',
      description: 'Percentage of agent actions that adhere to defined policies.'
    },
    {
      id: 'intervention-rate',
      name: 'Intervention Rate',
      value: 3,
      trend: 'down',
      category: 'trust',
      description: 'Percentage of agent actions requiring human intervention.'
    }
  ];
  
  const components: GovernanceComponent[] = [
    {
      id: 'trust-monitor',
      name: 'Trust Monitor',
      type: 'monitor',
      status: 'active',
      metrics: ['trust-score', 'intervention-rate'],
      description: 'Monitors agent behavior for trustworthiness and reliability.'
    },
    {
      id: 'compliance-validator',
      name: 'Compliance Validator',
      type: 'validator',
      status: 'active',
      metrics: ['compliance-rate', 'policy-adherence'],
      description: 'Validates agent actions against governance policies.'
    },
    {
      id: 'action-logger',
      name: 'Action Logger',
      type: 'logger',
      status: 'active',
      metrics: [],
      description: 'Logs all agent actions for audit and transparency.'
    },
    {
      id: 'decision-explainer',
      name: 'Decision Explainer',
      type: 'explainer',
      status: 'warning',
      metrics: ['explanation-quality'],
      description: 'Explains agent decisions and reasoning processes.'
    },
    {
      id: 'performance-monitor',
      name: 'Performance Monitor',
      type: 'monitor',
      status: 'active',
      metrics: ['response-time'],
      description: 'Monitors agent performance metrics.'
    }
  ];
  
  // Change view
  const changeView = (view: 'metrics' | 'components' | 'visualization') => {
    setActiveView(view);
    
    // Add to Observer memory
    addMemoryItem(`Viewed ${view} in Governance Explorer`);
    
    // Notify Observer
    notifyObserver('info', `Exploring governance ${view}. This view helps you understand the ${
      view === 'metrics' ? 'key performance indicators of your governance framework.' :
      view === 'components' ? 'components that make up your governance system.' :
      'relationships between governance components and metrics.'
    }`);
  };
  
  // Render metrics view
  const renderMetricsView = () => (
    <MetricsGrid data-testid="metrics-grid">
      {metrics.map(metric => (
        <MetricCard 
          key={metric.id} 
          category={metric.category}
          data-testid={`metric-${metric.id}`}
        >
          <MetricHeader>
            <MetricName>{metric.name}</MetricName>
            <MetricCategory category={metric.category}>
              {metric.category.charAt(0).toUpperCase() + metric.category.slice(1)}
            </MetricCategory>
          </MetricHeader>
          <MetricValue>
            {metric.value}{metric.id === 'response-time' ? 'ms' : '%'}
          </MetricValue>
          <MetricTrend trend={metric.trend}>
            {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
            {' '}
            {metric.trend === 'up' ? 'Improving' : metric.trend === 'down' ? 
              (metric.id === 'response-time' || metric.id === 'intervention-rate' ? 'Improving' : 'Declining') : 
              'Stable'}
          </MetricTrend>
          <MetricDescription>{metric.description}</MetricDescription>
        </MetricCard>
      ))}
    </MetricsGrid>
  );
  
  // Render components view
  const renderComponentsView = () => (
    <ComponentsTable data-testid="components-table">
      <TableHeader>
        <div>Component</div>
        <div>Type</div>
        <div>Status</div>
        <div>Description</div>
      </TableHeader>
      {components.map(component => (
        <TableRow 
          key={component.id} 
          status={component.status}
          data-testid={`component-${component.id}`}
        >
          <ComponentName>{component.name}</ComponentName>
          <ComponentType>{component.type.charAt(0).toUpperCase() + component.type.slice(1)}</ComponentType>
          <ComponentStatus status={component.status}>
            {component.status.charAt(0).toUpperCase() + component.status.slice(1)}
          </ComponentStatus>
          <ComponentDescription>{component.description}</ComponentDescription>
        </TableRow>
      ))}
    </ComponentsTable>
  );
  
  // Render visualization view
  const renderVisualizationView = () => (
    <VisualizationContainer data-testid="visualization-container">
      <VisualizationPlaceholder>
        <h3>Governance Visualization</h3>
        <p>This view would display an interactive visualization of your governance framework, showing relationships between components, metrics, and agents.</p>
      </VisualizationPlaceholder>
    </VisualizationContainer>
  );

  return (
    <ExplorerContainer className={className} data-testid="governance-explorer">
      <ExplorerHeader>
        <ExplorerTitle>Governance Explorer</ExplorerTitle>
        <ExplorerControls>
          <ViewToggle 
            active={activeView === 'metrics'} 
            onClick={() => changeView('metrics')}
            data-testid="metrics-view-toggle"
          >
            Metrics
          </ViewToggle>
          <ViewToggle 
            active={activeView === 'components'} 
            onClick={() => changeView('components')}
            data-testid="components-view-toggle"
          >
            Components
          </ViewToggle>
          <ViewToggle 
            active={activeView === 'visualization'} 
            onClick={() => changeView('visualization')}
            data-testid="visualization-view-toggle"
          >
            Visualization
          </ViewToggle>
        </ExplorerControls>
      </ExplorerHeader>
      
      {activeView === 'metrics' && renderMetricsView()}
      {activeView === 'components' && renderComponentsView()}
      {activeView === 'visualization' && renderVisualizationView()}
    </ExplorerContainer>
  );
};

export default GovernanceExplorer;
