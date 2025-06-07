import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import OnboardingWelcome from './OnboardingWelcome';
import { useObserver } from '../components/observer/ObserverContext';
import { notifyObserver } from '../components/observer/ObserverAgent';

// Mock the hooks and functions
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

jest.mock('../components/observer/ObserverContext', () => ({
  useObserver: jest.fn()
}));

jest.mock('../components/observer/ObserverAgent', () => ({
  notifyObserver: jest.fn()
}));

describe('OnboardingWelcome', () => {
  const mockAddMemoryItem = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock observer context
    (useObserver as jest.Mock).mockReturnValue({
      addMemoryItem: mockAddMemoryItem
    });
  });

  it('renders correctly with all options', () => {
    render(
      <BrowserRouter>
        <OnboardingWelcome />
      </BrowserRouter>
    );
    
    // Check if component renders
    expect(screen.getByTestId('onboarding-welcome')).toBeInTheDocument();
    
    // Check if title is rendered
    expect(screen.getByText('How would you like to start?')).toBeInTheDocument();
    
    // Check if all options are rendered
    expect(screen.getByTestId('option-wrap-agent')).toBeInTheDocument();
    expect(screen.getByTestId('option-multi-agent')).toBeInTheDocument();
    expect(screen.getByTestId('option-explore-governance')).toBeInTheDocument();
    expect(screen.getByTestId('option-learn-observer')).toBeInTheDocument();
    
    // Check if buttons are rendered
    expect(screen.getByTestId('get-started-button')).toBeInTheDocument();
    expect(screen.getByTestId('skip-button')).toBeInTheDocument();
    
    // Check if Observer was notified
    expect(notifyObserver).toHaveBeenCalledWith('info', expect.stringContaining('Welcome to Promethios'));
    
    // Check if memory item was added
    expect(mockAddMemoryItem).toHaveBeenCalledWith('Started onboarding flow');
  });

  it('handles option selection correctly', () => {
    const { navigate } = require('react-router-dom');
    
    render(
      <BrowserRouter>
        <OnboardingWelcome />
      </BrowserRouter>
    );
    
    // Click on an option
    fireEvent.click(screen.getByTestId('option-wrap-agent'));
    
    // Check if memory item was added
    expect(mockAddMemoryItem).toHaveBeenCalledWith('Selected "wrap-agent" onboarding path');
    
    // Check if Observer was notified
    expect(notifyObserver).toHaveBeenCalledWith('info', expect.stringContaining('Great choice'));
    
    // Check if navigation was called
    expect(navigate).toHaveBeenCalled();
  });

  it('handles skip button correctly', () => {
    const { navigate } = require('react-router-dom');
    
    render(
      <BrowserRouter>
        <OnboardingWelcome />
      </BrowserRouter>
    );
    
    // Click skip button
    fireEvent.click(screen.getByTestId('skip-button'));
    
    // Check if memory item was added
    expect(mockAddMemoryItem).toHaveBeenCalledWith('Skipped onboarding');
    
    // Check if Observer was notified
    expect(notifyObserver).toHaveBeenCalledWith('info', expect.stringContaining('You\'ve skipped the onboarding'));
    
    // Check if navigation was called
    expect(navigate).toHaveBeenCalled();
  });
});
