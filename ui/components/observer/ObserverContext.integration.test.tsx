import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ObserverAgentProvider, useObserver } from './ObserverContext';
import { ObserverAgent } from './ObserverAgent';

// Mock the useLocalStorage hook
jest.mock('../../hooks/useLocalStorage', () => ({
  __esModule: true,
  default: jest.fn(),
  useLocalStorage: jest.fn()
}));

// Import the mocked hook
import { useLocalStorage } from '../../hooks/useLocalStorage';

// Test component that uses the context
const TestComponent = () => {
  const { updateMessage, addMemoryItem } = useObserver();
  
  return (
    <div>
      <button 
        onClick={() => updateMessage('Test message', 'info')}
        data-testid="update-message-btn"
      >
        Update Message
      </button>
      <button 
        onClick={() => addMemoryItem('Test memory item')}
        data-testid="add-memory-btn"
      >
        Add Memory Item
      </button>
    </div>
  );
};

describe('ObserverContext Integration', () => {
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

  it('provides context to child components', () => {
    render(
      <ObserverAgentProvider>
        <TestComponent />
        <ObserverAgent />
      </ObserverAgentProvider>
    );
    
    // Check if both components rendered
    expect(screen.getByTestId('update-message-btn')).toBeInTheDocument();
    expect(screen.getByTestId('observer-agent')).toBeInTheDocument();
    
    // Initial message should be the default
    expect(screen.getByTestId('observer-message')).toHaveTextContent('Welcome to Promethios');
    
    // Update message from context
    fireEvent.click(screen.getByTestId('update-message-btn'));
    
    // Check if message was updated
    expect(screen.getByTestId('observer-message')).toHaveTextContent('Test message');
  });

  it('allows adding memory items', () => {
    const setMemoryItemsMock = jest.fn();
    (useLocalStorage as jest.Mock).mockImplementation((key, initialValue) => {
      if (key === 'observerMemory') {
        return [[], setMemoryItemsMock];
      }
      return [initialValue, jest.fn()];
    });
    
    render(
      <ObserverAgentProvider>
        <TestComponent />
        <ObserverAgent />
      </ObserverAgentProvider>
    );
    
    // Add memory item from context
    fireEvent.click(screen.getByTestId('add-memory-btn'));
    
    // Check if memory item was added
    expect(setMemoryItemsMock).toHaveBeenCalled();
  });

  it('shares state between multiple components', () => {
    render(
      <ObserverAgentProvider>
        <TestComponent />
        <div>
          <ObserverAgent />
        </div>
        <div>
          <TestComponent />
        </div>
      </ObserverAgentProvider>
    );
    
    // Get all update buttons
    const updateButtons = screen.getAllByTestId('update-message-btn');
    
    // Click the first button
    fireEvent.click(updateButtons[0]);
    
    // Check if message was updated in the Observer
    expect(screen.getByTestId('observer-message')).toHaveTextContent('Test message');
    
    // Click the second button
    fireEvent.click(updateButtons[1]);
    
    // Check if message was updated again
    expect(screen.getByTestId('observer-message')).toHaveTextContent('Test message');
  });
});
