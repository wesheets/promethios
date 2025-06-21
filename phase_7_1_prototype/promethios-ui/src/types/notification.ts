// Core notification types and interfaces for the unified notification system

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'governance_violation' 
  | 'trust_boundary_breach' 
  | 'observer_suggestion' 
  | 'system_event';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export type NotificationSource = 
  | 'system' 
  | 'governance' 
  | 'trust_metrics' 
  | 'observer' 
  | 'agent' 
  | 'user' 
  | 'extension';

export interface NotificationAction {
  // Action ID
  id: string;
  
  // Action label
  label: string;
  
  // Action type
  type: 'link' | 'button' | 'dismiss';
  
  // Action URL (for link type)
  url?: string;
  
  // Action handler (for button type)
  handler?: (notification: Notification) => void;
  
  // Action icon
  icon?: string;
}

export interface NotificationContext {
  // User ID
  userId?: string;
  
  // Agent ID
  agentId?: string;
  
  // Route
  route?: string;
  
  // Module
  module?: string;
  
  // Feature
  feature?: string;
  
  // Additional context
  [key: string]: any;
}

export interface Notification {
  // Notification ID (auto-generated if not provided)
  id: string;
  
  // Notification title
  title: string;
  
  // Notification message
  message: string;
  
  // Notification type
  type: NotificationType;
  
  // Notification priority
  priority: NotificationPriority;
  
  // Notification source
  source: NotificationSource;
  
  // Creation timestamp
  createdAt: number;
  
  // Expiry timestamp
  expiresAt?: number;
  
  // Whether the notification has been read
  read: boolean;
  
  // Whether the notification is dismissible
  dismissible: boolean;
  
  // Actions that can be taken on the notification
  actions?: NotificationAction[];
  
  // Additional data
  data?: Record<string, any>;
  
  // Context information
  context?: NotificationContext;
}

export interface NotificationFilter {
  // Filter by type
  type?: NotificationType | NotificationType[];
  
  // Filter by priority
  priority?: NotificationPriority | NotificationPriority[];
  
  // Filter by source
  source?: NotificationSource | NotificationSource[];
  
  // Filter by read status
  read?: boolean;
  
  // Filter by creation time range
  createdAt?: {
    from?: number;
    to?: number;
  };
  
  // Filter by context
  context?: Partial<NotificationContext>;
}

export type NotificationCallback = (notifications: Notification[]) => void;

export interface NotificationConfig {
  // Maximum number of notifications to store
  maxNotifications?: number;
  
  // Default notification expiry time (ms)
  defaultExpiryTime?: number;
  
  // Default notification priority
  defaultPriority?: NotificationPriority;
  
  // Whether to automatically mark notifications as read when viewed
  autoMarkAsRead?: boolean;
  
  // Storage configuration
  storage?: {
    type: 'memory' | 'localStorage' | 'indexedDB' | 'server';
    options?: Record<string, any>;
  };
}

// Storage interface for different persistence implementations
export interface NotificationStorage {
  save(notification: Notification): Promise<void>;
  load(filter?: NotificationFilter): Promise<Notification[]>;
  delete(id: string): Promise<void>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(filter?: NotificationFilter): Promise<void>;
  getCount(filter?: NotificationFilter): Promise<number>;
  clear(): Promise<void>;
}

// Provider interface for notification sources
export interface NotificationProvider {
  // Provider ID
  id: string;
  
  // Provider name
  name: string;
  
  // Provider description
  description: string;
  
  // Types of notifications this provider can generate
  supportedTypes: NotificationType[];
  
  // Initialize the provider
  initialize(): Promise<boolean>;
  
  // Start the provider
  start(): Promise<boolean>;
  
  // Stop the provider
  stop(): Promise<boolean>;
}

// Handler interface for notification processing
export interface NotificationHandler {
  // Handler ID
  id: string;
  
  // Handler name
  name: string;
  
  // Handler description
  description: string;
  
  // Types of notifications this handler can handle
  supportedTypes: NotificationType[];
  
  // Handle a notification
  handle(notification: Notification): Promise<boolean>;
  
  // Check if this handler can handle a notification
  canHandle(notification: Notification): boolean;
}

// Processor interface for notification transformation
export interface NotificationProcessor {
  // Processor ID
  id: string;
  
  // Process a notification
  process(notification: Notification): Promise<Notification>;
  
  // Check if this processor should process a notification
  shouldProcess(notification: Notification): boolean;
}

