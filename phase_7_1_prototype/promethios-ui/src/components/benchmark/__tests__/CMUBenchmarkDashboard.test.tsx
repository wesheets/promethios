import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import CMUBenchmarkDashboard from '../CMUBenchmarkDashboard';

// Mock components and hooks
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: true, toggleTheme: jest.fn() }),
  ThemeProvider: ({ children }) => <div data-testid="theme-provider">{children}</div>
}));

// Mock chart components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Helper function to render components with providers
const renderWithProviders = (component) => {
  return render(
    <ThemeProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('CMU Benchmark Dashboard', () => {
  test('renders dashboard with title and description', () => {
    renderWithProviders(<CMUBenchmarkDashboard />);
    
    expect(screen.getByText(/CMU Benchmark Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Compare agent performance with and without Promethios governance/i)).toBeInTheDocument();
  });

  test('renders metrics overview section', () => {
    renderWithProviders(<CMUBenchmarkDashboard />);
    
    expect(screen.getByText(/Metrics Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Trust Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Compliance Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Error Reduction/i)).toBeInTheDocument();
  });

  test('renders parameter controls', () => {
    renderWithProviders(<CMUBenchmarkDashboard />);
    
    expect(screen.getByText(/Parameter Controls/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Governance Strictness/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Verification Depth/i)).toBeInTheDocument();
  });

  test('updates charts when parameters change', async () => {
    renderWithProviders(<CMUBenchmarkDashboard />);
    
    const strictnessSlider = screen.getByLabelText(/Governance Strictness/i);
    
    fireEvent.change(strictnessSlider, { target: { value: 80 } });
    
    await waitFor(() => {
      expect(screen.getByText(/80%/i)).toBeInTheDocument();
    });
  });

  test('toggles between chart views', async () => {
    renderWithProviders(<CMUBenchmarkDashboard />);
    
    const comparisonTab = screen.getByText(/Comparison/i);
    const trendsTab = screen.getByText(/Trends/i);
    
    // Default view is Overview
    expect(screen.getByText(/Metrics Overview/i)).toBeInTheDocument();
    
    // Switch to Comparison view
    fireEvent.click(comparisonTab);
    await waitFor(() => {
      expect(screen.getByText(/Before\/After Comparison/i)).toBeInTheDocument();
    });
    
    // Switch to Trends view
    fireEvent.click(trendsTab);
    await waitFor(() => {
      expect(screen.getByText(/Performance Trends/i)).toBeInTheDocument();
    });
  });

  test('renders investor demo mode toggle', () => {
    renderWithProviders(<CMUBenchmarkDashboard />);
    
    expect(screen.getByText(/Investor Demo/i)).toBeInTheDocument();
  });
});
