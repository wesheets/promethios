import React from 'react';
import { render, screen } from '@testing-library/react';
import { GovernanceProfileProvider } from '../governance/context';
import { GovernanceDomain } from '../governance/types';
import { MetricsVisualization } from '../governance/MetricsVisualization';

describe('MetricsVisualization Component', () => {
  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <GovernanceProfileProvider initialDomain={GovernanceDomain.SOFTWARE_ENGINEERING}>
        {ui}
      </GovernanceProfileProvider>
    );
  };

  test('renders metrics visualization with profile data', () => {
    renderWithProvider(<MetricsVisualization />);
    
    expect(screen.getByText(/governance metrics/i)).toBeInTheDocument();
    expect(screen.getByText(/trust decay rate/i)).toBeInTheDocument();
    expect(screen.getByText(/trust recovery rate/i)).toBeInTheDocument();
    expect(screen.getByText(/event granularity/i)).toBeInTheDocument();
    expect(screen.getByText(/state preservation/i)).toBeInTheDocument();
  });

  test('displays empty state when no profile is selected', () => {
    // Create a custom provider that doesn't set an initial profile
    render(
      <GovernanceProfileProvider initialDomain={null as unknown as GovernanceDomain}>
        <MetricsVisualization />
      </GovernanceProfileProvider>
    );
    
    expect(screen.getByText(/no profile selected/i)).toBeInTheDocument();
  });

  test('shows comparison section when showComparison is true', () => {
    renderWithProvider(
      <MetricsVisualization 
        showComparison={true} 
        comparisonDomains={[GovernanceDomain.PRODUCT_MANAGEMENT]} 
      />
    );
    
    expect(screen.getByText(/domain comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/software_engineering/i)).toBeInTheDocument();
    expect(screen.getByText(/product_management/i)).toBeInTheDocument();
  });

  test('hides comparison section when showComparison is false', () => {
    renderWithProvider(<MetricsVisualization showComparison={false} />);
    
    expect(screen.queryByText(/domain comparison/i)).not.toBeInTheDocument();
  });
});
