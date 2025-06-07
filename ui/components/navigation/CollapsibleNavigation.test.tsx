import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CollapsibleNavigation, NavItem } from './CollapsibleNavigation';

// Mock the useLocalStorage hook
jest.mock('../../hooks/useLocalStorage', () => ({
  __esModule: true,
  default: jest.fn(),
  useLocalStorage: jest.fn()
}));

// Import the mocked hook
import { useLocalStorage } from '../../hooks/useLocalStorage';

describe('CollapsibleNavigation', () => {
  // Sample navigation items for testing
  const mockItems: NavItem[] = [
    { id: 'dashboard', icon: <span>📊</span>, label: 'Dashboard', path: '/dashboard', active: true },
    { id: 'agents', icon: <span>👤</span>, label: 'Agents', path: '/agents' },
    { id: 'multi-agent', icon: <span>🔄</span>, label: 'Multi-Agent', path: '/multi-agent' },
    { id: 'governance', icon: <span>📈</span>, label: 'Governance Explorer', path: '/governance' },
    { id: 'settings', icon: <span>⚙️</span>, label: 'Settings', path: '/settings', disabled: true }
  ];

  // Mock logo components
  const mockLogo = <span>P</span>;
  const mockLogoText = 'Promethios';

  // Mock click handler
  const mockOnNavItemClick = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementation for useLocalStorage
    (useLocalStorage as jest.Mock).mockReturnValue([false, jest.fn()]);
  });

  it('renders correctly in collapsed state', () => {
    (useLocalStorage as jest.Mock).mockReturnValue([false, jest.fn()]);
    
    render(
      <CollapsibleNavigation 
        items={mockItems} 
        logo={mockLogo} 
        logoText={mockLogoText} 
        onNavItemClick={mockOnNavItemClick}
      />
    );
    
    // Check if navigation container exists
    expect(screen.getByTestId('collapsible-navigation')).toBeInTheDocument();
    
    // Check if toggle button shows the expand icon
    expect(screen.getByTestId('nav-toggle')).toHaveTextContent('≡');
    
    // Check if all navigation items are rendered
    mockItems.forEach(item => {
      expect(screen.getByTestId(`nav-item-${item.id}`)).toBeInTheDocument();
    });
    
    // Logo text should not be visible in collapsed state
    expect(screen.getByText(mockLogoText)).toHaveStyle('opacity: 0');
  });

  it('renders correctly in expanded state', () => {
    (useLocalStorage as jest.Mock).mockReturnValue([true, jest.fn()]);
    
    render(
      <CollapsibleNavigation 
        items={mockItems} 
        logo={mockLogo} 
        logoText={mockLogoText} 
        onNavItemClick={mockOnNavItemClick}
      />
    );
    
    // Check if toggle button shows the collapse icon
    expect(screen.getByTestId('nav-toggle')).toHaveTextContent('◀');
    
    // Logo text should be visible in expanded state
    expect(screen.getByText(mockLogoText)).toHaveStyle('opacity: 1');
  });

  it('toggles navigation state when toggle button is clicked', () => {
    const setExpandedMock = jest.fn();
    (useLocalStorage as jest.Mock).mockReturnValue([false, setExpandedMock]);
    
    render(
      <CollapsibleNavigation 
        items={mockItems} 
        logo={mockLogo} 
        logoText={mockLogoText} 
        onNavItemClick={mockOnNavItemClick}
      />
    );
    
    // Click the toggle button
    fireEvent.click(screen.getByTestId('nav-toggle'));
    
    // Check if setExpanded was called with the opposite value
    expect(setExpandedMock).toHaveBeenCalledWith(true);
  });

  it('calls onNavItemClick when a navigation item is clicked', () => {
    render(
      <CollapsibleNavigation 
        items={mockItems} 
        logo={mockLogo} 
        logoText={mockLogoText} 
        onNavItemClick={mockOnNavItemClick}
      />
    );
    
    // Click a navigation item
    fireEvent.click(screen.getByTestId('nav-item-agents'));
    
    // Check if onNavItemClick was called with the correct item
    expect(mockOnNavItemClick).toHaveBeenCalledWith(mockItems[1]);
  });

  it('does not call onNavItemClick when a disabled navigation item is clicked', () => {
    render(
      <CollapsibleNavigation 
        items={mockItems} 
        logo={mockLogo} 
        logoText={mockLogoText} 
        onNavItemClick={mockOnNavItemClick}
      />
    );
    
    // Click a disabled navigation item
    fireEvent.click(screen.getByTestId('nav-item-settings'));
    
    // Check if onNavItemClick was not called
    expect(mockOnNavItemClick).not.toHaveBeenCalled();
  });

  it('supports keyboard navigation with Enter key', () => {
    render(
      <CollapsibleNavigation 
        items={mockItems} 
        logo={mockLogo} 
        logoText={mockLogoText} 
        onNavItemClick={mockOnNavItemClick}
      />
    );
    
    // Press Enter key on a navigation item
    fireEvent.keyDown(screen.getByTestId('nav-item-agents'), { key: 'Enter' });
    
    // Check if onNavItemClick was called with the correct item
    expect(mockOnNavItemClick).toHaveBeenCalledWith(mockItems[1]);
  });

  it('supports keyboard navigation with Space key', () => {
    render(
      <CollapsibleNavigation 
        items={mockItems} 
        logo={mockLogo} 
        logoText={mockLogoText} 
        onNavItemClick={mockOnNavItemClick}
      />
    );
    
    // Press Space key on a navigation item
    fireEvent.keyDown(screen.getByTestId('nav-item-agents'), { key: ' ' });
    
    // Check if onNavItemClick was called with the correct item
    expect(mockOnNavItemClick).toHaveBeenCalledWith(mockItems[1]);
  });

  it('has proper accessibility attributes', () => {
    render(
      <CollapsibleNavigation 
        items={mockItems} 
        logo={mockLogo} 
        logoText={mockLogoText} 
        onNavItemClick={mockOnNavItemClick}
      />
    );
    
    // Check toggle button accessibility
    const toggleButton = screen.getByTestId('nav-toggle');
    expect(toggleButton).toHaveAttribute('aria-label', 'Expand navigation');
    
    // Check navigation items accessibility
    expect(screen.getByTestId('nav-item-dashboard')).toHaveAttribute('role', 'button');
    expect(screen.getByTestId('nav-item-dashboard')).toHaveAttribute('aria-label', 'Dashboard');
    
    // Check disabled item accessibility
    expect(screen.getByTestId('nav-item-settings')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('nav-item-settings')).toHaveAttribute('tabIndex', '-1');
  });
});
