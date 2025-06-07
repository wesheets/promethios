import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useLocalStorage } from './useLocalStorage';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Test component using the hook
const TestComponent = ({ initialValue }: { initialValue: string }) => {
  const [value, setValue] = useLocalStorage('testKey', initialValue);
  return (
    <div>
      <div data-testid="value">{value}</div>
      <button onClick={() => setValue('updated')} data-testid="update-button">
        Update
      </button>
      <button onClick={() => setValue(prev => `${prev}-appended`)} data-testid="update-function-button">
        Update with function
      </button>
    </div>
  );
};

describe('useLocalStorage', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  it('should use the initial value when localStorage is empty', () => {
    render(<TestComponent initialValue="initial" />);
    expect(screen.getByTestId('value')).toHaveTextContent('initial');
  });

  it('should use the value from localStorage if it exists', () => {
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify('stored'));
    render(<TestComponent initialValue="initial" />);
    expect(screen.getByTestId('value')).toHaveTextContent('stored');
  });

  it('should update localStorage when the value changes', () => {
    render(<TestComponent initialValue="initial" />);
    fireEvent.click(screen.getByTestId('update-button'));
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify('updated'));
    expect(screen.getByTestId('value')).toHaveTextContent('updated');
  });

  it('should handle functional updates', () => {
    render(<TestComponent initialValue="initial" />);
    fireEvent.click(screen.getByTestId('update-function-button'));
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify('initial-appended'));
    expect(screen.getByTestId('value')).toHaveTextContent('initial-appended');
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockLocalStorage.getItem.mockImplementationOnce(() => {
      throw new Error('localStorage error');
    });
    
    render(<TestComponent initialValue="initial" />);
    
    expect(consoleSpy).toHaveBeenCalled();
    expect(screen.getByTestId('value')).toHaveTextContent('initial');
    
    consoleSpy.mockRestore();
  });

  it('should handle localStorage setItem errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockLocalStorage.setItem.mockImplementationOnce(() => {
      throw new Error('localStorage error');
    });
    
    render(<TestComponent initialValue="initial" />);
    fireEvent.click(screen.getByTestId('update-button'));
    
    expect(consoleSpy).toHaveBeenCalled();
    expect(screen.getByTestId('value')).toHaveTextContent('updated');
    
    consoleSpy.mockRestore();
  });
});
