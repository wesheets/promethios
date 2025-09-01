/**
 * Unified Notification System Exports
 * 
 * Centralized exports for all unified notification components
 */

// Main Components
export { default as UnifiedNotificationCenter } from './UnifiedNotificationCenter';
export { default as UnifiedNotificationBell } from './UnifiedNotificationBell';
export { default as InteractionNotificationCard } from './InteractionNotificationCard';

// Context
export { 
  UnifiedNotificationProvider, 
  useUnifiedNotifications,
  default as UnifiedNotificationContext 
} from '../contexts/UnifiedNotificationContext';

// Legacy components (for backward compatibility during migration)
export { default as NotificationCenter } from './NotificationCenter';
export { default as NotificationBell } from './NotificationBell';
export { default as NotificationSidebar } from './NotificationSidebar';

// Types (re-export from registry)
export type {
  UserInteraction,
  InteractionType,
  InteractionMetadata,
  InteractionStatus,
  UserRelationship,
  RelationshipType
} from '../../services/UserInteractionRegistry';

