import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// Types
export interface ObserverMessage {
  id: string;
  text: string;
  type: 'default' | 'nav-collapse' | 'nav-expand' | 'agent-wrap' | 'error' | 'info';
  timestamp: number;
}

export interface MemoryItem {
  id: string;
  text: string;
  timestamp: number;
}

export interface ObserverAgentProps {
  expertiseLevel?: 'novice' | 'intermediate' | 'expert';
  initialMessage?: string;
  onMessageClick?: (message: ObserverMessage) => void;
  className?: string;
}

// Styled Components
const ObserverContainer = styled.div<{ minimized: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #1A2233;
  border: 1px solid #2A3343;
  border-radius: 12px;
  padding: 12px;
  max-width: 300px;
  display: flex;
  align-items: flex-start;
  z-index: 100;
  transform: ${props => props.minimized ? 'translateY(calc(100% - 60px))' : 'translateY(0)'};
  transition: transform 250ms ease, opacity 250ms ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const ObserverAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #0D1117;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
  flex-shrink: 0;
  cursor: pointer;
  color: #2BFFC6;
  font-size: 24px;
  
  &:hover {
    background-color: #2A3343;
  }
  
  &:focus {
    outline: 2px solid #2BFFC6;
    outline-offset: 2px;
  }
`;

const ObserverContent = styled.div`
  flex: 1;
  overflow: hidden;
`;

const ObserverHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ObserverTitle = styled.div`
  font-weight: bold;
  font-size: 16px;
  color: #FFFFFF;
`;

const ObserverControls = styled.div`
  display: flex;
  gap: 8px;
`;

const ObserverControl = styled.button`
  background: none;
  border: none;
  color: #B0B8C4;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  
  &:hover {
    color: #FFFFFF;
  }
  
  &:focus {
    outline: 2px solid #2BFFC6;
    outline-offset: 2px;
  }
`;

const ObserverMessageContainer = styled.div`
  font-size: 14px;
  color: #B0B8C4;
  margin-top: 4px;
  line-height: 1.5;
`;

const MemoryItemContainer = styled.div`
  font-size: 12px;
  color: #B0B8C4;
  background-color: rgba(43, 255, 198, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 8px;
`;

/**
 * ObserverAgent Component
 * 
 * A contextual assistant that provides guidance and responds to UI state changes.
 * Features expertise levels, memory persistence, and minimization.
 * 
 * @param {ObserverAgentProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const ObserverAgent: React.FC<ObserverAgentProps> = ({
  expertiseLevel = 'novice',
  initialMessage = 'Welcome to Promethios! I\'m your Observer agent and I\'ll guide you through the platform.',
  onMessageClick,
  className
}) => {
  // State
  const [minimized, setMinimized] = useLocalStorage('observerMinimized', false);
  const [currentExpertiseLevel, setCurrentExpertiseLevel] = useLocalStorage('expertiseLevel', expertiseLevel);
  const [message, setMessage] = useState<ObserverMessage>({
    id: 'initial',
    text: initialMessage,
    type: 'default',
    timestamp: Date.now()
  });
  const [memoryItems, setMemoryItems] = useLocalStorage<MemoryItem[]>('observerMemory', []);
  const [showMemory, setShowMemory] = useState(false);

  // Toggle minimized state
  const toggleMinimized = () => {
    setMinimized(!minimized);
  };

  // Handle message click
  const handleMessageClick = () => {
    if (onMessageClick) onMessageClick(message);
  };

  // Add memory item
  const addMemoryItem = useCallback((text: string) => {
    const newItem: MemoryItem = {
      id: `memory-${Date.now()}`,
      text,
      timestamp: Date.now()
    };
    
    setMemoryItems(prev => [...prev, newItem]);
  }, [setMemoryItems]);

  // Update message based on type and expertise level
  const updateMessage = useCallback((text: string, type: ObserverMessage['type']) => {
    const newMessage: ObserverMessage = {
      id: `message-${Date.now()}`,
      text,
      type,
      timestamp: Date.now()
    };
    
    setMessage(newMessage);
  }, []);

  // Get message based on type and expertise level
  const getMessageForType = useCallback((type: ObserverMessage['type']): string => {
    const messages = {
      'nav-collapse': {
        novice: "Hiding the nav? I'll stay with you — just click the owl if you need help. I can explain any part of the interface if you get lost.",
        intermediate: "Hiding the nav? I'll stay with you — just click the owl if you need help.",
        expert: "Nav collapsed. Click here if you need assistance."
      },
      'nav-expand': {
        novice: "Welcome back to the full view! Now you can see all the navigation options. Let me know if you need help with any of them.",
        intermediate: "Navigation expanded. All options are now visible.",
        expert: "Nav expanded."
      },
      'agent-wrap': {
        novice: "Let's wrap your first agent! I'll guide you through each step of the process. First, we need to connect to your agent's endpoint. Don't worry, we never access your API keys.",
        intermediate: "Starting the agent wrapping process. Remember to provide your agent's endpoint URL, not the underlying LLM API.",
        expert: "Agent wrapping initiated. Endpoint configuration required."
      },
      'error': {
        novice: "Oops! Something went wrong. Don't worry, this happens sometimes. Let's try again, and I'll help you troubleshoot the issue step by step.",
        intermediate: "Error detected. This might be due to an invalid endpoint or connection issue. Check your agent's URL and try again.",
        expert: "Error: Connection failed. Verify endpoint and retry."
      },
      'info': {
        novice: "Here's something you might find helpful! I'm sharing this information to help you better understand how Promethios works.",
        intermediate: "Information: This might be useful for your current task.",
        expert: "Info: Relevant context provided."
      },
      'default': {
        novice: initialMessage,
        intermediate: initialMessage,
        expert: initialMessage
      }
    };
    
    return messages[type][currentExpertiseLevel as keyof typeof messages[typeof type]];
  }, [currentExpertiseLevel, initialMessage]);

  // Listen for navigation state changes
  useEffect(() => {
    const handleNavStateChange = (e: CustomEvent) => {
      const { expanded } = e.detail;
      updateMessage(
        getMessageForType(expanded ? 'nav-expand' : 'nav-collapse'),
        expanded ? 'nav-expand' : 'nav-collapse'
      );
      
      // Reset to default message after delay
      const timer = setTimeout(() => {
        updateMessage(getMessageForType('default'), 'default');
      }, 5000);
      
      return () => clearTimeout(timer);
    };
    
    window.addEventListener('navStateChange' as any, handleNavStateChange as EventListener);
    return () => {
      window.removeEventListener('navStateChange' as any, handleNavStateChange as EventListener);
    };
  }, [getMessageForType, updateMessage]);

  // Change expertise level
  const changeExpertiseLevel = (level: 'novice' | 'intermediate' | 'expert') => {
    setCurrentExpertiseLevel(level);
    
    const messages = {
      novice: "I'll provide detailed guidance for each step. Don't worry if you're new to governance - I'll explain everything!",
      intermediate: "I'll provide balanced guidance with fewer explanations. Let me know if you need more details on anything.",
      expert: "I'll keep explanations minimal and focus on technical details. You can always ask for more information if needed."
    };
    
    updateMessage(messages[level], 'info');
    
    // Add to memory
    addMemoryItem(`Changed expertise level to ${level}`);
  };

  // Toggle memory display
  const toggleMemory = () => {
    setShowMemory(!showMemory);
  };

  return (
    <ObserverContainer 
      minimized={minimized} 
      className={className}
      data-testid="observer-agent"
    >
      <ObserverAvatar 
        onClick={toggleMinimized}
        tabIndex={0}
        role="button"
        aria-label={minimized ? "Expand Observer" : "Minimize Observer"}
        data-testid="observer-avatar"
      >
        👁️
      </ObserverAvatar>
      
      <ObserverContent>
        <ObserverHeader>
          <ObserverTitle>Observer</ObserverTitle>
          <ObserverControls>
            <ObserverControl 
              onClick={toggleMemory}
              aria-label={showMemory ? "Hide memory" : "Show memory"}
              data-testid="memory-toggle"
            >
              {showMemory ? '📁' : '📂'}
            </ObserverControl>
            <ObserverControl 
              onClick={toggleMinimized}
              aria-label={minimized ? "Expand" : "Minimize"}
              data-testid="minimize-toggle"
            >
              {minimized ? '□' : '_'}
            </ObserverControl>
          </ObserverControls>
        </ObserverHeader>
        
        <ObserverMessageContainer 
          onClick={handleMessageClick}
          data-testid="observer-message"
        >
          {message.text}
        </ObserverMessageContainer>
        
        {showMemory && memoryItems.length > 0 && (
          <div data-testid="memory-items">
            {memoryItems.slice(-3).map(item => (
              <MemoryItemContainer key={item.id}>
                {item.text}
              </MemoryItemContainer>
            ))}
          </div>
        )}
      </ObserverContent>
    </ObserverContainer>
  );
};

// Export a method to trigger Observer messages from other components
export const notifyObserver = (type: ObserverMessage['type'], text?: string) => {
  const event = new CustomEvent('observerNotification', {
    detail: { type, text }
  });
  window.dispatchEvent(event);
};

export default ObserverAgent;
