import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ObserverContext } from './ObserverContext';

// Mock the useLocalStorage hook
jest.mock('../../hooks/useLocalStorage', () => ({
  __esModule: true,
  default: jest.fn(),
  useLocalStorage: jest.fn()
}));

// Import the mocked hook
import { useLocalStorage } from '../../hooks/useLocalStorage';

describe('ObserverContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation for useLocalStorage
    (useLocalStorage as jest.Mock).mockImplementation((key, initialValue) => {
      return [initialValue, jest.fn()];
    });
  });

  it('exports ObserverContext', () => {
    expect(ObserverContext).toBeDefined();
  });
});
