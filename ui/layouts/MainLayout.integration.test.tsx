import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MainLayout } from './MainLayout';
import { CollapsibleNavigation } from '../components/navigation/CollapsibleNavigation';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Mock the components and hooks
jest.mock('../components/navigation/CollapsibleNavigation', () => ({
  CollapsibleNavigation: jest.fn(() => <div data-testid="mock-navigation" />)
}));

jest.mock('../hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn()
}));

describe('MainLayout Integration', () => {
  const mockChildren = <div data-testid="mock-children">Test Content</div>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders with CollapsibleNavigation and content area when navigation is collapsed', () => {
    // Mock the navigation as collapsed
    (useLocalStorage as jest.Mock).mockReturnValue([false, jest.fn()]);
    
    render(<MainLayout>{mockChildren}</MainLayout>);
    
    // Check if navigation is rendered
    expect(screen.getByTestId('mock-navigation')).toBeInTheDocument();
    
    // Check if children are rendered
    expect(screen.getByTestId('mock-children')).toBeInTheDocument();
    
    // Check if main content has correct styles for collapsed navigation
    const mainContent = screen.getByTestId('main-content');
    expect(mainContent).toHaveStyle('margin-left: 60px');
    expect(mainContent).toHaveStyle('width: calc(100% - 60px)');
  });
  
  it('renders with CollapsibleNavigation and content area when navigation is expanded', () => {
    // Mock the navigation as expanded
    (useLocalStorage as jest.Mock).mockReturnValue([true, jest.fn()]);
    
    render(<MainLayout>{mockChildren}</MainLayout>);
    
    // Check if navigation is rendered
    expect(screen.getByTestId('mock-navigation')).toBeInTheDocument();
    
    // Check if children are rendered
    expect(screen.getByTestId('mock-children')).toBeInTheDocument();
    
    // Check if main content has correct styles for expanded navigation
    const mainContent = screen.getByTestId('main-content');
    expect(mainContent).toHaveStyle('margin-left: 260px');
    expect(mainContent).toHaveStyle('width: calc(100% - 260px)');
  });
  
  it('passes correct props to CollapsibleNavigation', () => {
    (useLocalStorage as jest.Mock).mockReturnValue([false, jest.fn()]);
    
    render(<MainLayout>{mockChildren}</MainLayout>);
    
    // Check if CollapsibleNavigation was called with correct props
    expect(CollapsibleNavigation).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.any(Array),
        logo: expect.anything(),
        logoText: 'Promethios',
        onNavItemClick: expect.any(Function)
      }),
      expect.anything()
    );
  });
});
