/**
 * Think Tank Platform Components
 * 
 * Export all think tank related components for easy importing
 */

export { default as ThinkTankPlatform } from './ThinkTankPlatform';
export { default as ThinkTankConversationInterface } from './ThinkTankConversationInterface';

// Re-export types for convenience
export type {
  ThinkTankSession,
  SelectedAgent,
  SessionMetrics,
  OrchestratorPersonality
} from './ThinkTankPlatform';

export type {
  ThinkTankConversationProps,
  DisplayMessage,
  GovernanceInsight,
  AgentActivity
} from './ThinkTankConversationInterface';

