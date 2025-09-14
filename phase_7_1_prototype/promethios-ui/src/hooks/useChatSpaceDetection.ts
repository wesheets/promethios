/**
 * useChatSpaceDetection - Hook for detecting when chat interface needs more space
 * 
 * Analyzes chat context and determines optimal right panel size:
 * - 'full' (300px): Simple conversations, plenty of space
 * - 'compact' (150px): Complex conversations, need more chat space  
 * - 'minimal' (60px): Maximum space needed, show only icons
 */

import { useState, useEffect, useMemo } from 'react';

export type ChatSpaceMode = 'full' | 'compact' | 'minimal';

interface ChatMessage {
  id: string;
  content: string;
  type?: 'text' | 'image' | 'file' | 'code' | 'table' | 'chart';
  hasAttachments?: boolean;
  isThreaded?: boolean;
  threadCount?: number;
  hasRichContent?: boolean;
}

interface ChatContext {
  messages: ChatMessage[];
  participants: any[];
  aiAgents: any[];
  humanParticipants: any[];
  isMultiAgent?: boolean;
  hasActiveThreads?: boolean;
  screenWidth?: number;
  userPreference?: ChatSpaceMode;
}

interface SpaceDetectionResult {
  recommendedMode: ChatSpaceMode;
  reason: string;
  confidence: number;
  factors: string[];
}

export const useChatSpaceDetection = (context: ChatContext): SpaceDetectionResult => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  // Monitor screen size changes
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const detection = useMemo((): SpaceDetectionResult => {
    const factors: string[] = [];
    let score = 0; // Higher score = more space needed
    
    // Factor 1: Screen size constraints
    if (screenWidth < 1200) {
      score += 30;
      factors.push('Small screen detected');
    } else if (screenWidth < 1600) {
      score += 10;
      factors.push('Medium screen size');
    }

    // Factor 2: Message complexity
    const recentMessages = context.messages.slice(-10); // Last 10 messages
    const complexMessages = recentMessages.filter(msg => 
      msg.type !== 'text' || 
      msg.hasAttachments || 
      msg.hasRichContent ||
      (msg.content && msg.content.length > 500)
    );
    
    if (complexMessages.length > 3) {
      score += 25;
      factors.push('Complex message content detected');
    } else if (complexMessages.length > 1) {
      score += 10;
      factors.push('Some complex content');
    }

    // Factor 3: Threading and conversation structure
    const threadedMessages = recentMessages.filter(msg => msg.isThreaded);
    if (threadedMessages.length > 0) {
      score += 20;
      factors.push('Threaded conversations detected');
    }

    // Factor 4: Multi-participant conversations
    const totalParticipants = (context.aiAgents?.length || 0) + (context.humanParticipants?.length || 0);
    if (totalParticipants > 3) {
      score += 20;
      factors.push('Multiple participants active');
    } else if (totalParticipants > 2) {
      score += 10;
      factors.push('Multi-participant conversation');
    }

    // Factor 5: Multi-agent scenarios
    if (context.isMultiAgent && (context.aiAgents?.length || 0) > 1) {
      score += 15;
      factors.push('Multi-agent conversation');
    }

    // Factor 6: Active threads
    if (context.hasActiveThreads) {
      score += 15;
      factors.push('Active conversation threads');
    }

    // Factor 7: Message frequency (high activity)
    const recentMessageCount = recentMessages.length;
    if (recentMessageCount > 8) {
      score += 10;
      factors.push('High message activity');
    }

    // Determine recommended mode based on score
    let recommendedMode: ChatSpaceMode;
    let reason: string;
    let confidence: number;

    if (score >= 50) {
      recommendedMode = 'minimal';
      reason = 'Maximum chat space needed for complex conversation';
      confidence = Math.min(95, 60 + (score - 50));
    } else if (score >= 25) {
      recommendedMode = 'compact';
      reason = 'Moderate chat space needed for enhanced conversation';
      confidence = Math.min(90, 50 + (score - 25));
    } else {
      recommendedMode = 'full';
      reason = 'Simple conversation, full panel space available';
      confidence = Math.min(85, 70 - score);
    }

    // Override with user preference if strongly set
    if (context.userPreference && confidence < 80) {
      recommendedMode = context.userPreference;
      reason = `User preference override: ${context.userPreference}`;
      confidence = 95;
      factors.push('User preference applied');
    }

    return {
      recommendedMode,
      reason,
      confidence,
      factors
    };
  }, [
    context.messages,
    context.participants,
    context.aiAgents,
    context.humanParticipants,
    context.isMultiAgent,
    context.hasActiveThreads,
    context.userPreference,
    screenWidth
  ]);

  return detection;
};

// Helper hook for getting panel width based on mode
export const usePanelWidth = (mode: ChatSpaceMode, isCollapsed: boolean = false): string => {
  if (isCollapsed) return '60px';
  
  switch (mode) {
    case 'full':
      return '300px';
    case 'compact':
      return '150px';
    case 'minimal':
      return '60px';
    default:
      return '300px';
  }
};

// Helper hook for smooth transitions
export const useAdaptiveTransition = () => {
  return {
    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'width, min-width'
  };
};

