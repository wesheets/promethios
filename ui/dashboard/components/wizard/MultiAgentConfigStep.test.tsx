import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MultiAgentConfigStep } from './MultiAgentConfigStep';
import { useObserver } from '../../../components/observer/ObserverContext';
import { notifyObserver } from '../../../components/observer/ObserverAgent';

// Mock the hooks and functions
jest.mock('../../../components/observer/ObserverContext', () => ({
  useObserver: jest.fn()
}));

jest.mock('../../../components/observer/ObserverAgent', () => ({
  notifyObserver: jest.fn()
}));

describe('MultiAgentConfigStep', () => {
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();
  const mockAddMemoryItem = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock observer context
    (useObserver as jest.Mock).mockReturnValue({
      addMemoryItem: mockAddMemoryItem
    });
  });

  it('renders correctly with initial relationships', () => {
    render(<MultiAgentConfigStep onNext={mockOnNext} onBack={mockOnBack} />);
    
    // Check if component renders
    expect(screen.getByTestId('multi-agent-config-step')).toBeInTheDocument();
    
    // Check if agent items are rendered
    expect(screen.getByTestId('agent-item-agent1')).toBeInTheDocument();
    expect(screen.getByTestId('agent-item-agent2')).toBeInTheDocument();
    expect(screen.getByTestId('agent-item-agent3')).toBeInTheDocument();
    expect(screen.getByTestId('agent-item-agent4')).toBeInTheDocument();
    
    // Check if agent nodes are rendered
    expect(screen.getByTestId('agent-node-agent1')).toBeInTheDocument();
    expect(screen.getByTestId('agent-node-agent2')).toBeInTheDocument();
    expect(screen.getByTestId('agent-node-agent3')).toBeInTheDocument();
    expect(screen.getByTestId('agent-node-agent4')).toBeInTheDocument();
    
    // Check if initial relationships are rendered
    expect(screen.getByTestId('relationship-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('relationship-item-1')).toBeInTheDocument();
    
    // Check if buttons are rendered
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).not.toBeDisabled();
  });

  it('selects an agent when clicked', () => {
    render(<MultiAgentConfigStep onNext={mockOnNext} onBack={mockOnBack} />);
    
    // Click on an agent
    fireEvent.click(screen.getByTestId('agent-item-agent1'));
    
    // Check if agent is selected
    expect(screen.getByTestId('agent-item-agent1')).toHaveStyle('background-color: rgba(43, 255, 198, 0.1)');
    
    // Check if Observer was notified
    expect(notifyObserver).toHaveBeenCalledWith('info', expect.stringContaining('Selected Customer Service Agent'));
  });

  it('adds a new relationship when source and target are selected', () => {
    render(<MultiAgentConfigStep onNext={mockOnNext} onBack={mockOnBack} />);
    
    // Select source agent
    fireEvent.click(screen.getByTestId('agent-item-agent1'));
    
    // Select target agent
    fireEvent.click(screen.getByTestId('agent-node-agent3'));
    
    // Select relationship type
    fireEvent.change(screen.getByTestId('relationship-type-select'), { target: { value: 'delegates' } });
    
    // Add relationship
    fireEvent.click(screen.getByTestId('add-relationship-button'));
    
    // Check if new relationship is added
    expect(screen.getByTestId('relationship-item-2')).toBeInTheDocument();
    
    // Check if Observer was notified
    expect(notifyObserver).toHaveBeenCalledWith('info', expect.stringContaining('Relationship created'));
    
    // Check if memory item was added
    expect(mockAddMemoryItem).toHaveBeenCalled();
  });

  it('removes a relationship when remove button is clicked', () => {
    render(<MultiAgentConfigStep onNext={mockOnNext} onBack={mockOnBack} />);
    
    // Get initial relationship count
    const initialRelationships = screen.getAllByTestId(/^relationship-item-/);
    
    // Remove a relationship
    fireEvent.click(screen.getByTestId('remove-relationship-0'));
    
    // Check if relationship was removed
    const updatedRelationships = screen.getAllByTestId(/^relationship-item-/);
    expect(updatedRelationships.length).toBe(initialRelationships.length - 1);
    
    // Check if Observer was notified
    expect(notifyObserver).toHaveBeenCalledWith('info', 'Relationship removed.');
  });

  it('calls onNext when next button is clicked', () => {
    render(<MultiAgentConfigStep onNext={mockOnNext} onBack={mockOnBack} />);
    
    // Click next button
    fireEvent.click(screen.getByTestId('next-button'));
    
    // Check if onNext was called
    expect(mockOnNext).toHaveBeenCalled();
    
    // Check if Observer was notified
    expect(notifyObserver).toHaveBeenCalledWith('info', expect.stringContaining('Great! You\'ve configured'));
    
    // Check if memory item was added
    expect(mockAddMemoryItem).toHaveBeenCalled();
  });

  it('calls onBack when back button is clicked', () => {
    render(<MultiAgentConfigStep onNext={mockOnNext} onBack={mockOnBack} />);
    
    // Click back button
    fireEvent.click(screen.getByTestId('back-button'));
    
    // Check if onBack was called
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('disables next button when there are no relationships', () => {
    render(<MultiAgentConfigStep onNext={mockOnNext} onBack={mockOnBack} />);
    
    // Remove all relationships
    fireEvent.click(screen.getByTestId('remove-relationship-0'));
    fireEvent.click(screen.getByTestId('remove-relationship-0'));
    
    // Check if next button is disabled
    expect(screen.getByTestId('next-button')).toBeDisabled();
  });
});
