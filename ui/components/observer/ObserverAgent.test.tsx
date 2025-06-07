import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ObserverAgent, notifyObserver } from './ObserverAgent';

// Mock the useLocalStorage hook
jest.mock('../../hooks/useLocalStorage', () => ({
  __esModule: true,
  default: jest.fn(),
  useLocalStorage: jest.fn()
}));

// Import the mocked hook
import { useLocalStorage } from '../../hooks/useLocalStorage';

describe('ObserverAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation for useLocalStorage
    (useLocalStorage as jest.Mock).mockImplementation((key, initialValue) => {
      if (key === 'observerMinimized') {
        return [false, jest.fn()];
      } else if (key === 'expertiseLevel') {
        return ['novice', jest.fn()];
      } else if (key === 'observerMemory') {
        return [[], jest.fn()];
      }
      return [initialValue, jest.fn()];
    });
  });

  it('renders correctly with default props', () => {
    render(<ObserverAgent />);
    
    // Check if observer container exists
    expect(screen.getByTestId('observer-agent')).toBeInTheDocument();
    
    // Check if avatar is rendered
    expect(screen.getByTestId('observer-avatar')).toBeInTheDocument();
    
    // Check if default message is displayed
    expect(screen.getByTestId('observer-message')).toHaveTextContent('Welcome to Promethios');
    
    // Check if controls are rendered
    expect(screen.getByTestId('memory-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('minimize-toggle')).toBeInTheDocument();
  });

  it('toggles minimized state when avatar is clicked', () => {
    const setMinimizedMock = jest.fn();
    (useLocalStorage as jest.Mock).mockImplementation((key, initialValue) => {
      if (key === 'observerMinimized') {
        return [false, setMinimizedMock];
      }
      return [initialValue, jest.fn()];
    });
    
    render(<ObserverAgent />);
    
    // Click the avatar
    fireEvent.click(screen.getByTestId('observer-avatar'));
    
    // Check if setMinimized was called with the opposite value
    expect(setMinimizedMock).toHaveBeenCalledWith(true);
  });

  it('toggles minimized state when minimize button is clicked', () => {
    const setMinimizedMock = jest.fn();
    (useLocalStorage as jest.Mock).mockImplementation((key, initialValue) => {
      if (key === 'observerMinimized') {
        return [false, setMinimizedMock];
      }
      return [initialValue, jest.fn()];
    });
    
    render(<ObserverAgent />);
    
    // Click the minimize button
    fireEvent.click(screen.getByTestId('minimize-toggle'));
    
    // Check if setMinimized was called with the opposite value
    expect(setMinimizedMock).toHaveBeenCalledWith(true);
  });

  it('toggles memory display when memory button is clicked', () => {
    const memoryItems = [
      { id: 'memory-1', text: 'Test memory item 1', timestamp: Date.now() },
      { id: 'memory-2', text: 'Test memory item 2', timestamp: Date.now() }
    ];
    
    (useLocalStorage as jest.Mock).mockImplementation((key, initialValue) => {
      if (key === 'observerMemory') {
        return [memoryItems, jest.fn()];
      }
      return [initialValue, jest.fn()];
    });
    
    render(<ObserverAgent />);
    
    // Memory items should not be visible initially
    expect(screen.queryByTestId('memory-items')).not.toBeInTheDocument();
    
    // Click the memory toggle button
    fireEvent.click(screen.getByTestId('memory-toggle'));
    
    // Memory items should now be visible
    expect(screen.getByTestId('memory-items')).toBeInTheDocument();
    expect(screen.getByText('Test memory item 1')).toBeInTheDocument();
    expect(screen.getByText('Test memory item 2')).toBeInTheDocument();
  });

  it('calls onMessageClick when message is clicked', () => {
    const onMessageClickMock = jest.fn();
    
    render(<ObserverAgent onMessageClick={onMessageClickMock} />);
    
    // Click the message
    fireEvent.click(screen.getByTestId('observer-message'));
    
    // Check if onMessageClick was called
    expect(onMessageClickMock).toHaveBeenCalled();
  });

  it('responds to navigation state changes', () => {
    jest.useFakeTimers();
    
    render(<ObserverAgent />);
    
    // Simulate navigation collapse event
    act(() => {
      window.dispatchEvent(new CustomEvent('navStateChange', {
        detail: { expanded: false }
      }));
    });
    
    // Check if message was updated
    expect(screen.getByTestId('observer-message')).toHaveTextContent("Hiding the nav? I'll stay with you");
    
    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Check if message was reset to default
    expect(screen.getByTestId('observer-message')).toHaveTextContent('Welcome to Promethios');
    
    jest.useRealTimers();
  });

  it('renders correctly when minimized', () => {
    (useLocalStorage as jest.Mock).mockImplementation((key, initialValue) => {
      if (key === 'observerMinimized') {
        return [true, jest.fn()];
      }
      return [initialValue, jest.fn()];
    });
    
    render(<ObserverAgent />);
    
    // Check if container has minimized style
    expect(screen.getByTestId('observer-agent')).toHaveStyle('transform: translateY(calc(100% - 60px))');
    
    // Check if minimize button shows expand icon
    expect(screen.getByTestId('minimize-toggle')).toHaveTextContent('□');
  });

  it('has proper accessibility attributes', () => {
    render(<ObserverAgent />);
    
    // Check avatar accessibility
    const avatar = screen.getByTestId('observer-avatar');
    expect(avatar).toHaveAttribute('role', 'button');
    expect(avatar).toHaveAttribute('aria-label', 'Minimize Observer');
    expect(avatar).toHaveAttribute('tabIndex', '0');
    
    // Check minimize button accessibility
    const minimizeButton = screen.getByTestId('minimize-toggle');
    expect(minimizeButton).toHaveAttribute('aria-label', 'Minimize');
    
    // Check memory toggle accessibility
    const memoryToggle = screen.getByTestId('memory-toggle');
    expect(memoryToggle).toHaveAttribute('aria-label', 'Show memory');
  });

  it('notifyObserver function dispatches custom event', () => {
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    
    notifyObserver('error', 'Test error message');
    
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'observerNotification',
        detail: { type: 'error', text: 'Test error message' }
      })
    );
    
    dispatchEventSpy.mockRestore();
  });
});
