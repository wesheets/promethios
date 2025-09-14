/**
 * useAdaptiveRightPanel - Hook for dynamic right panel sizing based on chat interface content
 * 
 * Analyzes chat interface state and provides adaptive width recommendations:
 * - Responds to chat complexity, participants, content types
 * - Provides smooth transitions and collapse functionality
 * - Adapts to screen size and user preferences
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

export interface ChatInterfaceState {
  messages: any[];
  participants: any[];
  sharedConversations: any[];
  hasActiveThreads: boolean;
  hasRichContent: boolean;
  hasMultipleParticipants: boolean;
  isMultiAgent: boolean;
  hasAttachments: boolean;
  messageCount: number;
  screenWidth: number;
}

export interface AdaptiveRightPanelState {
  isCollapsed: boolean;
  adaptiveWidth: string;
  adaptiveMinWidth: string;
  adaptiveMaxWidth: string;
  recommendedMode: 'minimal' | 'compact' | 'standard' | 'expanded';
  reason: string;
  canCollapse: boolean;
  shouldAutoCollapse: boolean;
}

export const useAdaptiveRightPanel = (
  chatState: ChatInterfaceState,
  userPreferences?: { rightPanelCollapsed?: boolean }
): AdaptiveRightPanelState & {
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
} => {
  const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(
    userPreferences?.rightPanelCollapsed || false
  );
  const [lastManualAction, setLastManualAction] = useState<number>(0);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  // Monitor screen size changes
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Analyze chat interface complexity
  const chatComplexity = useMemo(() => {
    let score = 0;
    const factors: string[] = [];

    // Screen size factor
    if (screenWidth < 1200) {
      score += 30;
      factors.push('Small screen');
    } else if (screenWidth < 1600) {
      score += 15;
      factors.push('Medium screen');
    }

    // Message complexity
    const recentMessages = chatState.messages.slice(-10);
    const complexMessages = recentMessages.filter(msg => 
      msg.hasAttachments || 
      msg.hasRichContent || 
      (msg.content && msg.content.length > 300) ||
      msg.type !== 'text'
    );

    if (complexMessages.length > 5) {
      score += 25;
      factors.push('High message complexity');
    } else if (complexMessages.length > 2) {
      score += 15;
      factors.push('Moderate message complexity');
    }

    // Participant complexity
    if (chatState.participants.length > 4) {
      score += 20;
      factors.push('Many participants');
    } else if (chatState.participants.length > 2) {
      score += 10;
      factors.push('Multiple participants');
    }

    // Conversation complexity
    if (chatState.sharedConversations.length > 2) {
      score += 15;
      factors.push('Multiple conversations');
    }

    if (chatState.hasActiveThreads) {
      score += 15;
      factors.push('Active threads');
    }

    if (chatState.isMultiAgent) {
      score += 10;
      factors.push('Multi-agent chat');
    }

    // Message volume
    if (chatState.messageCount > 50) {
      score += 10;
      factors.push('High message volume');
    }

    return { score, factors };
  }, [chatState, screenWidth]);

  // Determine recommended mode and sizing
  const adaptiveState = useMemo((): AdaptiveRightPanelState => {
    const { score, factors } = chatComplexity;
    
    let recommendedMode: 'minimal' | 'compact' | 'standard' | 'expanded';
    let adaptiveWidth: string;
    let adaptiveMinWidth: string;
    let adaptiveMaxWidth: string;
    let reason: string;
    let shouldAutoCollapse = false;

    // Determine mode based on complexity score
    if (score >= 60) {
      recommendedMode = 'minimal';
      adaptiveWidth = 'min(20%, 250px)';
      adaptiveMinWidth = '200px';
      adaptiveMaxWidth = '250px';
      reason = 'Maximum chat space needed for complex interface';
      shouldAutoCollapse = screenWidth < 1200;
    } else if (score >= 35) {
      recommendedMode = 'compact';
      adaptiveWidth = 'min(30%, 350px)';
      adaptiveMinWidth = '280px';
      adaptiveMaxWidth = '350px';
      reason = 'Moderate chat space needed for enhanced interface';
    } else if (score >= 15) {
      recommendedMode = 'standard';
      adaptiveWidth = 'min(35%, 400px)';
      adaptiveMinWidth = '320px';
      adaptiveMaxWidth = '400px';
      reason = 'Standard layout with balanced space allocation';
    } else {
      recommendedMode = 'expanded';
      adaptiveWidth = 'min(40%, 450px)';
      adaptiveMinWidth = '350px';
      adaptiveMaxWidth = '450px';
      reason = 'Simple chat, full panel space available';
    }

    // Override for very small screens
    if (screenWidth < 1024) {
      adaptiveWidth = 'min(25%, 300px)';
      adaptiveMinWidth = '250px';
      adaptiveMaxWidth = '300px';
      shouldAutoCollapse = true;
    }

    // Check if manual action was recent (within 30 seconds)
    const timeSinceManual = Date.now() - lastManualAction;
    const respectManualAction = timeSinceManual < 30000;

    return {
      isCollapsed: respectManualAction ? isManuallyCollapsed : (shouldAutoCollapse && !respectManualAction),
      adaptiveWidth: isManuallyCollapsed ? '60px' : adaptiveWidth,
      adaptiveMinWidth: isManuallyCollapsed ? '60px' : adaptiveMinWidth,
      adaptiveMaxWidth: isManuallyCollapsed ? '60px' : adaptiveMaxWidth,
      recommendedMode,
      reason,
      canCollapse: true,
      shouldAutoCollapse
    };
  }, [chatComplexity, screenWidth, isManuallyCollapsed, lastManualAction]);

  // Manual toggle functions
  const toggleCollapse = useCallback(() => {
    setIsManuallyCollapsed(prev => !prev);
    setLastManualAction(Date.now());
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsManuallyCollapsed(collapsed);
    setLastManualAction(Date.now());
  }, []);

  return {
    ...adaptiveState,
    toggleCollapse,
    setCollapsed
  };
};

// Helper hook for smooth transitions
export const useAdaptiveTransitions = () => {
  return {
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'width, min-width, max-width, flex-basis'
  };
};

// Helper hook for responsive breakpoints
export const useResponsiveBreakpoints = () => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: screenWidth < 768,
    isTablet: screenWidth >= 768 && screenWidth < 1024,
    isDesktop: screenWidth >= 1024,
    isLargeDesktop: screenWidth >= 1440,
    screenWidth
  };
};

