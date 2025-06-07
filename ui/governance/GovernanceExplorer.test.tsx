import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GovernanceExplorer } from './GovernanceExplorer';
import { useObserver } from '../components/observer/ObserverContext';
import { notifyObserver } from '../components/observer/ObserverAgent';

// Mock the hooks and functions
jest.mock('../components/observer/ObserverContext', () => ({
  useObserver: jest.fn()
}));

jest.mock('../components/observer/ObserverAgent', () => ({
  notifyObserver: jest.fn()
}));

describe('GovernanceExplorer', () => {
  const mockAddMemoryItem = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock observer context
    (useObserver as jest.Mock).mockReturnValue({
      addMemoryItem: mockAddMemoryItem
    });
  });

  it('renders correctly with metrics view by default', () => {
    render(<GovernanceExplorer />);
    
    // Check if component renders
    expect(screen.getByTestId('governance-explorer')).toBeInTheDocument();
    
    // Check if title is rendered
    expect(screen.getByText('Governance Explorer')).toBeInTheDocument();
    
    // Check if view toggles are rendered
    expect(screen.getByTestId('metrics-view-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('components-view-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('visualization-view-toggle')).toBeInTheDocument();
    
    // Check if metrics view is active by default
    expect(screen.getByTestId('metrics-view-toggle')).toHaveStyle('background-color: rgba(43, 255, 198, 0.1)');
    
    // Check if metrics grid is rendered
    expect(screen.getByTestId('metrics-grid')).toBeInTheDocument();
    
    // Check if metrics are rendered
    expect(screen.getByTestId('metric-trust-score')).toBeInTheDocument();
    expect(screen.getByTestId('metric-compliance-rate')).toBeInTheDocument();
    expect(screen.getByTestId('metric-response-time')).toBeInTheDocument();
    expect(screen.getByTestId('metric-explanation-quality')).toBeInTheDocument();
    expect(screen.getByTestId('metric-policy-adherence')).toBeInTheDocument();
    expect(screen.getByTestId('metric-intervention-rate')).toBeInTheDocument();
  });

  it('switches to components view when toggle is clicked', () => {
    render(<GovernanceExplorer />);
    
    // Click components view toggle
    fireEvent.click(screen.getByTestId('components-view-toggle'));
    
    // Check if components view is active
    expect(screen.getByTestId('components-view-toggle')).toHaveStyle('background-color: rgba(43, 255, 198, 0.1)');
    
    // Check if components table is rendered
    expect(screen.getByTestId('components-table')).toBeInTheDocument();
    
    // Check if components are rendered
    expect(screen.getByTestId('component-trust-monitor')).toBeInTheDocument();
    expect(screen.getByTestId('component-compliance-validator')).toBeInTheDocument();
    expect(screen.getByTestId('component-action-logger')).toBeInTheDocument();
    expect(screen.getByTestId('component-decision-explainer')).toBeInTheDocument();
    expect(screen.getByTestId('component-performance-monitor')).toBeInTheDocument();
    
    // Check if Observer was notified
    expect(notifyObserver).toHaveBeenCalledWith('info', expect.stringContaining('Exploring governance components'));
    
    // Check if memory item was added
    expect(mockAddMemoryItem).toHaveBeenCalledWith('Viewed components in Governance Explorer');
  });

  it('switches to visualization view when toggle is clicked', () => {
    render(<GovernanceExplorer />);
    
    // Click visualization view toggle
    fireEvent.click(screen.getByTestId('visualization-view-toggle'));
    
    // Check if visualization view is active
    expect(screen.getByTestId('visualization-view-toggle')).toHaveStyle('background-color: rgba(43, 255, 198, 0.1)');
    
    // Check if visualization container is rendered
    expect(screen.getByTestId('visualization-container')).toBeInTheDocument();
    
    // Check if placeholder content is rendered
    expect(screen.getByText('Governance Visualization')).toBeInTheDocument();
    
    // Check if Observer was notified
    expect(notifyObserver).toHaveBeenCalledWith('info', expect.stringContaining('Exploring governance visualization'));
    
    // Check if memory item was added
    expect(mockAddMemoryItem).toHaveBeenCalledWith('Viewed visualization in Governance Explorer');
  });

  it('displays correct metric information', () => {
    render(<GovernanceExplorer />);
    
    // Check trust score metric
    const trustScoreMetric = screen.getByTestId('metric-trust-score');
    expect(trustScoreMetric).toHaveTextContent('Trust Score');
    expect(trustScoreMetric).toHaveTextContent('92%');
    expect(trustScoreMetric).toHaveTextContent('Improving');
    
    // Check response time metric (should show ms and "Improving" for downward trend)
    const responseTimeMetric = screen.getByTestId('metric-response-time');
    expect(responseTimeMetric).toHaveTextContent('Response Time');
    expect(responseTimeMetric).toHaveTextContent('245ms');
    expect(responseTimeMetric).toHaveTextContent('Improving');
  });

  it('displays correct component information', () => {
    render(<GovernanceExplorer />);
    
    // Switch to components view
    fireEvent.click(screen.getByTestId('components-view-toggle'));
    
    // Check trust monitor component
    const trustMonitorComponent = screen.getByTestId('component-trust-monitor');
    expect(trustMonitorComponent).toHaveTextContent('Trust Monitor');
    expect(trustMonitorComponent).toHaveTextContent('Monitor');
    expect(trustMonitorComponent).toHaveTextContent('Active');
    
    // Check decision explainer component (should have warning status)
    const decisionExplainerComponent = screen.getByTestId('component-decision-explainer');
    expect(decisionExplainerComponent).toHaveTextContent('Decision Explainer');
    expect(decisionExplainerComponent).toHaveTextContent('Explainer');
    expect(decisionExplainerComponent).toHaveTextContent('Warning');
  });
});
