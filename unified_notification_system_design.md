# Unified Notification System Design

## 1. Overview

This document outlines the design for a unified notification system in the Promethios platform. The system provides consistent, context-aware alerts across all modules, ensuring users receive timely and relevant information about governance violations, trust boundary breaches, observer suggestions, and system events.

## 2. Core Components

### 2.1 NotificationService

The central service managing notification creation, delivery, and lifecycle:

```typescript
class NotificationService {
  // Initialize the notification service
  initialize(config: NotificationConfig): Promise<boolean>;
  
  // Create a notification
  createNotification(notification: Notification): Promise<string>;
  
  // Update a notification
  updateNotification(notificationId: string, updates: Partial<Notification>): Promise<boolean>;
  
  // Delete a notification
  deleteNotification(notificationId: string): Promise<boolean>;
  
  // Mark a notification as read
  markAsRead(notificationId: string): Promise<boolean>;
  
  // Mark all notifications as read
  markAllAsRead(filter?: NotificationFilter): Promise<boolean>;
  
  // Get notifications
  getNotifications(filter?: NotificationFilter): Promise<Notification[]>;
  
  // Get notification count
  getNotificationCount(filter?: NotificationFilter): Promise<number>;
  
  // Subscribe to notifications
  subscribeToNotifications(callback: NotificationCallback): string;
  
  // Unsubscribe from notifications
  unsubscribeFromNotifications(subscriptionId: string): boolean;
}

interface NotificationConfig {
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

interface Notification {
  // Notification ID (auto-generated if not provided)
  id?: string;
  
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

type NotificationType = 
  'info' | 
  'success' | 
  'warning' | 
  'error' | 
  'governance_violation' | 
  'trust_boundary_breach' | 
  'observer_suggestion' | 
  'system_event';

type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

type NotificationSource = 
  'system' | 
  'governance' | 
  'trust_metrics' | 
  'observer' | 
  'agent' | 
  'user' | 
  'extension';

interface NotificationAction {
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

interface NotificationContext {
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

interface NotificationFilter {
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

type NotificationCallback = (notifications: Notification[]) => void;
```

### 2.2 NotificationRegistry

Manages notification providers and handlers:

```typescript
class NotificationRegistry {
  // Register a notification provider
  registerProvider(provider: NotificationProvider): string;
  
  // Deregister a notification provider
  deregisterProvider(providerId: string): boolean;
  
  // Get all registered providers
  getProviders(): NotificationProvider[];
  
  // Register a notification handler
  registerHandler(handler: NotificationHandler): string;
  
  // Deregister a notification handler
  deregisterHandler(handlerId: string): boolean;
  
  // Get all registered handlers
  getHandlers(): NotificationHandler[];
}

interface NotificationProvider {
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

interface NotificationHandler {
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
```

### 2.3 NotificationHub

Orchestrates notification flow between providers and handlers:

```typescript
class NotificationHub {
  // Initialize the notification hub
  initialize(): Promise<boolean>;
  
  // Process a notification
  processNotification(notification: Notification): Promise<boolean>;
  
  // Register a notification processor
  registerProcessor(processor: NotificationProcessor): string;
  
  // Deregister a notification processor
  deregisterProcessor(processorId: string): boolean;
}

interface NotificationProcessor {
  // Processor ID
  id: string;
  
  // Process a notification
  process(notification: Notification): Promise<Notification>;
  
  // Check if this processor should process a notification
  shouldProcess(notification: Notification): boolean;
}
```

## 3. UI Components

### 3.1 NotificationCenter

The main UI component for displaying and managing notifications:

```typescript
interface NotificationCenterProps {
  // Maximum number of notifications to display
  maxNotifications?: number;
  
  // Whether to show notification count badge
  showBadge?: boolean;
  
  // Whether to auto-dismiss notifications after viewing
  autoDismiss?: boolean;
  
  // Custom notification filter
  filter?: NotificationFilter;
}

class NotificationCenter extends React.Component<NotificationCenterProps, NotificationCenterState> {
  componentDidMount() {
    // Register with extension system
    ExtensionRegistry.registerUIComponent({
      id: 'notification-center',
      component: this,
      extensionPoints: ['global-ui']
    });
    
    // Initialize notification service
    this.initializeNotificationService();
  }
  
  componentWillUnmount() {
    // Unregister from extension system
    ExtensionRegistry.unregisterUIComponent('notification-center');
    
    // Unsubscribe from notifications
    if (this.state.subscriptionId) {
      NotificationService.unsubscribeFromNotifications(this.state.subscriptionId);
    }
  }
  
  initializeNotificationService = async () => {
    try {
      const notificationService = new NotificationService();
      await notificationService.initialize({
        maxNotifications: 100,
        defaultExpiryTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        defaultPriority: 'medium',
        autoMarkAsRead: true,
        storage: {
          type: 'localStorage'
        }
      });
      
      const subscriptionId = notificationService.subscribeToNotifications(this.handleNotificationsUpdate);
      
      const notifications = await notificationService.getNotifications(this.props.filter);
      const unreadCount = await notificationService.getNotificationCount({
        ...this.props.filter,
        read: false
      });
      
      this.setState({
        notificationService,
        notifications,
        unreadCount,
        subscriptionId,
        loading: false
      });
    } catch (error) {
      this.setState({
        error: error.message,
        loading: false
      });
    }
  };
  
  handleNotificationsUpdate = (notifications: Notification[]) => {
    this.setState({
      notifications,
      unreadCount: notifications.filter(n => !n.read).length
    });
  };
  
  handleToggleCenter = () => {
    this.setState(prevState => ({
      isOpen: !prevState.isOpen
    }));
    
    // Mark notifications as read when opening
    if (!this.state.isOpen && this.state.notificationService) {
      this.state.notificationService.markAllAsRead(this.props.filter);
    }
  };
  
  handleClearAll = async () => {
    const { notificationService } = this.state;
    
    if (!notificationService) {
      return;
    }
    
    // Delete all notifications
    const notifications = await notificationService.getNotifications(this.props.filter);
    
    for (const notification of notifications) {
      await notificationService.deleteNotification(notification.id);
    }
  };
  
  handleNotificationAction = async (notification: Notification, action: NotificationAction) => {
    const { notificationService } = this.state;
    
    if (!notificationService) {
      return;
    }
    
    if (action.type === 'dismiss') {
      await notificationService.deleteNotification(notification.id);
    } else if (action.type === 'button' && action.handler) {
      action.handler(notification);
    }
    // Link actions are handled by the NotificationItem component
  };
  
  render() {
    const { showBadge = true, maxNotifications = 5 } = this.props;
    const { notifications, unreadCount, isOpen, loading, error } = this.state;
    
    if (loading) {
      return <div className="notification-center-loading" />;
    }
    
    if (error) {
      return <div className="notification-center-error">{error}</div>;
    }
    
    return (
      <div className={`notification-center ${isOpen ? 'open' : 'closed'}`}>
        <div className="notification-center-toggle" onClick={this.handleToggleCenter}>
          <span className="notification-icon">🔔</span>
          {showBadge && unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </div>
        
        {isOpen && (
          <div className="notification-center-dropdown">
            <div className="notification-center-header">
              <h3>Notifications</h3>
              {notifications.length > 0 && (
                <button className="clear-all-button" onClick={this.handleClearAll}>
                  Clear All
                </button>
              )}
            </div>
            
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">No notifications</div>
              ) : (
                notifications
                  .slice(0, maxNotifications)
                  .map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onAction={action => this.handleNotificationAction(notification, action)}
                    />
                  ))
              )}
              
              {notifications.length > maxNotifications && (
                <div className="more-notifications">
                  <a href="/notifications">View all notifications</a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}
```

### 3.2 NotificationItem

A component for displaying a single notification:

```typescript
interface NotificationItemProps {
  // Notification to display
  notification: Notification;
  
  // Action handler
  onAction: (action: NotificationAction) => void;
}

class NotificationItem extends React.Component<NotificationItemProps> {
  handleActionClick = (action: NotificationAction, e: React.MouseEvent) => {
    if (action.type === 'link') {
      // Let the link handle navigation
      return;
    }
    
    e.preventDefault();
    this.props.onAction(action);
  };
  
  render() {
    const { notification } = this.props;
    
    return (
      <div className={`notification-item ${notification.type} ${notification.priority} ${notification.read ? 'read' : 'unread'}`}>
        <div className="notification-icon">
          {this.getIconForType(notification.type)}
        </div>
        <div className="notification-content">
          <div className="notification-title">{notification.title}</div>
          <div className="notification-message">{notification.message}</div>
          <div className="notification-meta">
            <span className="notification-time">
              {this.formatTime(notification.createdAt)}
            </span>
            <span className="notification-source">{notification.source}</span>
          </div>
          {notification.actions && notification.actions.length > 0 && (
            <div className="notification-actions">
              {notification.actions.map(action => (
                <div
                  key={action.id}
                  className={`notification-action ${action.type}`}
                  onClick={e => this.handleActionClick(action, e)}
                >
                  {action.type === 'link' ? (
                    <a href={action.url}>{action.label}</a>
                  ) : (
                    action.label
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {notification.dismissible && (
          <div
            className="notification-dismiss"
            onClick={() => this.props.onAction({
              id: 'dismiss',
              label: 'Dismiss',
              type: 'dismiss'
            })}
          >
            ×
          </div>
        )}
      </div>
    );
  }
  
  getIconForType(type: NotificationType): React.ReactNode {
    switch (type) {
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'governance_violation':
        return '🚫';
      case 'trust_boundary_breach':
        return '🔒';
      case 'observer_suggestion':
        return '👁️';
      case 'system_event':
        return '🔧';
      default:
        return '🔔';
    }
  }
  
  formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60 * 1000) {
      return 'Just now';
    }
    
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    
    return new Date(timestamp).toLocaleDateString();
  }
}
```

### 3.3 NotificationToast

A component for displaying toast notifications:

```typescript
interface NotificationToastProps {
  // Notification to display
  notification: Notification;
  
  // Auto-hide duration (ms)
  duration?: number;
  
  // Position
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  
  // Close handler
  onClose: () => void;
}

class NotificationToast extends React.Component<NotificationToastProps> {
  componentDidMount() {
    const { duration = 5000 } = this.props;
    
    if (duration > 0) {
      this.timer = setTimeout(() => {
        this.props.onClose();
      }, duration);
    }
  }
  
  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
  
  render() {
    const { notification, position = 'top-right' } = this.props;
    
    return (
      <div className={`notification-toast ${notification.type} ${notification.priority} ${position}`}>
        <div className="notification-toast-content">
          <div className="notification-toast-icon">
            {this.getIconForType(notification.type)}
          </div>
          <div className="notification-toast-text">
            <div className="notification-toast-title">{notification.title}</div>
            <div className="notification-toast-message">{notification.message}</div>
          </div>
          <div className="notification-toast-close" onClick={this.props.onClose}>
            ×
          </div>
        </div>
        {notification.actions && notification.actions.length > 0 && (
          <div className="notification-toast-actions">
            {notification.actions.map(action => (
              <div
                key={action.id}
                className={`notification-toast-action ${action.type}`}
                onClick={() => {
                  if (action.type === 'button' && action.handler) {
                    action.handler(notification);
                  }
                  this.props.onClose();
                }}
              >
                {action.type === 'link' ? (
                  <a href={action.url}>{action.label}</a>
                ) : (
                  action.label
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  getIconForType(type: NotificationType): React.ReactNode {
    // Same as NotificationItem.getIconForType
  }
}
```

### 3.4 NotificationToastContainer

A container for managing toast notifications:

```typescript
interface NotificationToastContainerProps {
  // Maximum number of toasts to display
  maxToasts?: number;
  
  // Default position for toasts
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  
  // Default duration for toasts (ms)
  duration?: number;
}

class NotificationToastContainer extends React.Component<NotificationToastContainerProps, NotificationToastContainerState> {
  componentDidMount() {
    // Register with extension system
    ExtensionRegistry.registerUIComponent({
      id: 'notification-toast-container',
      component: this,
      extensionPoints: ['global-ui']
    });
    
    // Initialize notification service
    this.initializeNotificationService();
  }
  
  componentWillUnmount() {
    // Unregister from extension system
    ExtensionRegistry.unregisterUIComponent('notification-toast-container');
    
    // Unsubscribe from notifications
    if (this.state.subscriptionId) {
      NotificationService.unsubscribeFromNotifications(this.state.subscriptionId);
    }
  }
  
  initializeNotificationService = async () => {
    try {
      const notificationService = new NotificationService();
      await notificationService.initialize({
        maxNotifications: 100,
        defaultExpiryTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        defaultPriority: 'medium',
        autoMarkAsRead: true,
        storage: {
          type: 'localStorage'
        }
      });
      
      const subscriptionId = notificationService.subscribeToNotifications(this.handleNotificationsUpdate);
      
      this.setState({
        notificationService,
        subscriptionId,
        loading: false
      });
    } catch (error) {
      this.setState({
        error: error.message,
        loading: false
      });
    }
  };
  
  handleNotificationsUpdate = (notifications: Notification[]) => {
    // Find new notifications
    const { toasts } = this.state;
    const existingIds = toasts.map(t => t.id);
    const newNotifications = notifications.filter(n => !existingIds.includes(n.id) && this.shouldShowToast(n));
    
    if (newNotifications.length === 0) {
      return;
    }
    
    // Add new toasts
    this.setState(prevState => {
      const newToasts = [
        ...prevState.toasts,
        ...newNotifications.map(notification => ({
          id: notification.id,
          notification
        }))
      ];
      
      // Limit to maxToasts
      const { maxToasts = 3 } = this.props;
      if (newToasts.length > maxToasts) {
        return {
          toasts: newToasts.slice(-maxToasts)
        };
      }
      
      return { toasts: newToasts };
    });
  };
  
  shouldShowToast(notification: Notification): boolean {
    // Show toasts for high and critical priority notifications
    return ['high', 'critical'].includes(notification.priority);
  }
  
  handleCloseToast = (id: string) => {
    this.setState(prevState => ({
      toasts: prevState.toasts.filter(t => t.id !== id)
    }));
  };
  
  render() {
    const { position = 'top-right', duration = 5000 } = this.props;
    const { toasts, loading, error } = this.state;
    
    if (loading || error || toasts.length === 0) {
      return null;
    }
    
    return (
      <div className={`notification-toast-container ${position}`}>
        {toasts.map(toast => (
          <NotificationToast
            key={toast.id}
            notification={toast.notification}
            position={position}
            duration={duration}
            onClose={() => this.handleCloseToast(toast.id)}
          />
        ))}
      </div>
    );
  }
}
```

### 3.5 InlineNotification

A component for displaying inline notifications:

```typescript
interface InlineNotificationProps {
  // Notification to display
  notification: Notification;
  
  // Whether to show dismiss button
  showDismiss?: boolean;
  
  // Whether to show actions
  showActions?: boolean;
  
  // Close handler
  onClose?: () => void;
}

class InlineNotification extends React.Component<InlineNotificationProps> {
  render() {
    const { notification, showDismiss = true, showActions = true, onClose } = this.props;
    
    return (
      <div className={`inline-notification ${notification.type} ${notification.priority}`}>
        <div className="inline-notification-icon">
          {this.getIconForType(notification.type)}
        </div>
        <div className="inline-notification-content">
          <div className="inline-notification-title">{notification.title}</div>
          <div className="inline-notification-message">{notification.message}</div>
        </div>
        {showActions && notification.actions && notification.actions.length > 0 && (
          <div className="inline-notification-actions">
            {notification.actions.map(action => (
              <div
                key={action.id}
                className={`inline-notification-action ${action.type}`}
                onClick={() => {
                  if (action.type === 'button' && action.handler) {
                    action.handler(notification);
                  }
                }}
              >
                {action.type === 'link' ? (
                  <a href={action.url}>{action.label}</a>
                ) : (
                  action.label
                )}
              </div>
            ))}
          </div>
        )}
        {showDismiss && onClose && (
          <div className="inline-notification-dismiss" onClick={onClose}>
            ×
          </div>
        )}
      </div>
    );
  }
  
  getIconForType(type: NotificationType): React.ReactNode {
    // Same as NotificationItem.getIconForType
  }
}
```

## 4. Default Notification Providers

### 4.1 GovernanceNotificationProvider

Provides notifications for governance-related events:

```typescript
class GovernanceNotificationProvider implements NotificationProvider {
  id = 'governance-notification-provider';
  name = 'Governance Notification Provider';
  description = 'Provides notifications for governance-related events';
  supportedTypes = ['governance_violation', 'warning', 'info'];
  
  private governanceService: GovernanceService;
  private notificationService: NotificationService;
  private isRunning = false;
  
  async initialize(): Promise<boolean> {
    this.governanceService = new GovernanceService();
    this.notificationService = new NotificationService();
    
    await this.governanceService.initialize();
    await this.notificationService.initialize({
      defaultPriority: 'high',
      defaultExpiryTime: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return true;
  }
  
  async start(): Promise<boolean> {
    if (this.isRunning) {
      return true;
    }
    
    this.isRunning = true;
    
    // Subscribe to governance events
    this.governanceService.subscribeToEvents(this.handleGovernanceEvent);
    
    return true;
  }
  
  async stop(): Promise<boolean> {
    if (!this.isRunning) {
      return true;
    }
    
    this.isRunning = false;
    
    // Unsubscribe from governance events
    this.governanceService.unsubscribeFromEvents(this.handleGovernanceEvent);
    
    return true;
  }
  
  private handleGovernanceEvent = async (event: GovernanceEvent) => {
    if (event.type === 'violation') {
      await this.notificationService.createNotification({
        title: 'Governance Violation',
        message: event.message,
        type: 'governance_violation',
        priority: this.getPriorityForSeverity(event.severity),
        source: 'governance',
        createdAt: Date.now(),
        read: false,
        dismissible: true,
        actions: [
          {
            id: 'view-details',
            label: 'View Details',
            type: 'link',
            url: `/governance/violations/${event.id}`
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss'
          }
        ],
        data: {
          violationId: event.id,
          ruleId: event.ruleId,
          severity: event.severity
        },
        context: {
          userId: event.userId,
          agentId: event.agentId,
          module: 'governance'
        }
      });
    } else if (event.type === 'warning') {
      await this.notificationService.createNotification({
        title: 'Governance Warning',
        message: event.message,
        type: 'warning',
        priority: 'medium',
        source: 'governance',
        createdAt: Date.now(),
        read: false,
        dismissible: true,
        actions: [
          {
            id: 'view-details',
            label: 'View Details',
            type: 'link',
            url: `/governance/warnings/${event.id}`
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss'
          }
        ],
        data: {
          warningId: event.id,
          ruleId: event.ruleId
        },
        context: {
          userId: event.userId,
          agentId: event.agentId,
          module: 'governance'
        }
      });
    }
  };
  
  private getPriorityForSeverity(severity: GovernanceSeverity): NotificationPriority {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }
}
```

### 4.2 TrustBoundaryNotificationProvider

Provides notifications for trust boundary breaches:

```typescript
class TrustBoundaryNotificationProvider implements NotificationProvider {
  id = 'trust-boundary-notification-provider';
  name = 'Trust Boundary Notification Provider';
  description = 'Provides notifications for trust boundary breaches';
  supportedTypes = ['trust_boundary_breach', 'warning'];
  
  private trustBoundaryService: TrustBoundaryService;
  private notificationService: NotificationService;
  private isRunning = false;
  
  async initialize(): Promise<boolean> {
    this.trustBoundaryService = new TrustBoundaryService();
    this.notificationService = new NotificationService();
    
    await this.trustBoundaryService.initialize();
    await this.notificationService.initialize({
      defaultPriority: 'high',
      defaultExpiryTime: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return true;
  }
  
  async start(): Promise<boolean> {
    if (this.isRunning) {
      return true;
    }
    
    this.isRunning = true;
    
    // Subscribe to trust boundary events
    this.trustBoundaryService.subscribeToEvents(this.handleTrustBoundaryEvent);
    
    return true;
  }
  
  async stop(): Promise<boolean> {
    if (!this.isRunning) {
      return true;
    }
    
    this.isRunning = false;
    
    // Unsubscribe from trust boundary events
    this.trustBoundaryService.unsubscribeFromEvents(this.handleTrustBoundaryEvent);
    
    return true;
  }
  
  private handleTrustBoundaryEvent = async (event: TrustBoundaryEvent) => {
    if (event.type === 'breach') {
      await this.notificationService.createNotification({
        title: 'Trust Boundary Breach',
        message: event.message,
        type: 'trust_boundary_breach',
        priority: this.getPriorityForSeverity(event.severity),
        source: 'trust_metrics',
        createdAt: Date.now(),
        read: false,
        dismissible: true,
        actions: [
          {
            id: 'view-details',
            label: 'View Details',
            type: 'link',
            url: `/trust/breaches/${event.id}`
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss'
          }
        ],
        data: {
          breachId: event.id,
          boundaryId: event.boundaryId,
          severity: event.severity
        },
        context: {
          userId: event.userId,
          agentId: event.agentId,
          module: 'trust'
        }
      });
    } else if (event.type === 'warning') {
      await this.notificationService.createNotification({
        title: 'Trust Boundary Warning',
        message: event.message,
        type: 'warning',
        priority: 'medium',
        source: 'trust_metrics',
        createdAt: Date.now(),
        read: false,
        dismissible: true,
        actions: [
          {
            id: 'view-details',
            label: 'View Details',
            type: 'link',
            url: `/trust/warnings/${event.id}`
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss'
          }
        ],
        data: {
          warningId: event.id,
          boundaryId: event.boundaryId
        },
        context: {
          userId: event.userId,
          agentId: event.agentId,
          module: 'trust'
        }
      });
    }
  };
  
  private getPriorityForSeverity(severity: TrustBoundarySeverity): NotificationPriority {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }
}
```

### 4.3 ObserverNotificationProvider

Provides notifications for observer suggestions:

```typescript
class ObserverNotificationProvider implements NotificationProvider {
  id = 'observer-notification-provider';
  name = 'Observer Notification Provider';
  description = 'Provides notifications for observer suggestions';
  supportedTypes = ['observer_suggestion', 'info'];
  
  private observerService: ObserverService;
  private notificationService: NotificationService;
  private isRunning = false;
  
  async initialize(): Promise<boolean> {
    this.observerService = new ObserverService();
    this.notificationService = new NotificationService();
    
    await this.observerService.initialize({
      openaiApiKey: 'your-api-key',
      llmModelId: 'gpt-3.5-turbo',
      llmInitialPrompt: 'You are an AI assistant embedded in Promethios, an AI governance platform.'
    });
    await this.notificationService.initialize({
      defaultPriority: 'medium',
      defaultExpiryTime: 24 * 60 * 60 * 1000 // 1 day
    });
    
    return true;
  }
  
  async start(): Promise<boolean> {
    if (this.isRunning) {
      return true;
    }
    
    this.isRunning = true;
    
    // Subscribe to observer suggestions
    this.observerService.registerSuggestionHandler({
      id: 'notification-handler',
      handle: this.handleObserverSuggestion
    });
    
    await this.observerService.startObserving();
    
    return true;
  }
  
  async stop(): Promise<boolean> {
    if (!this.isRunning) {
      return true;
    }
    
    this.isRunning = false;
    
    // Unsubscribe from observer suggestions
    this.observerService.deregisterSuggestionHandler('notification-handler');
    
    await this.observerService.stopObserving();
    
    return true;
  }
  
  private handleObserverSuggestion = async (suggestion: ObserverSuggestion) => {
    await this.notificationService.createNotification({
      title: 'Observer Suggestion',
      message: suggestion.text,
      type: 'observer_suggestion',
      priority: this.getPriorityForSuggestionType(suggestion.type),
      source: 'observer',
      createdAt: Date.now(),
      read: false,
      dismissible: true,
      actions: suggestion.action ? [
        {
          id: 'take-action',
          label: 'Take Action',
          type: 'button',
          handler: () => {
            // Execute the suggestion action
            if (suggestion.action) {
              // ActionExecutor.execute(suggestion.action);
            }
          }
        },
        {
          id: 'dismiss',
          label: 'Dismiss',
          type: 'dismiss'
        }
      ] : [
        {
          id: 'dismiss',
          label: 'Dismiss',
          type: 'dismiss'
        }
      ],
      data: {
        suggestionId: suggestion.id,
        suggestionType: suggestion.type,
        suggestionSource: suggestion.source
      },
      context: {
        userId: suggestion.context?.userId,
        module: 'observer'
      }
    });
    
    return true;
  };
  
  private getPriorityForSuggestionType(type: string): NotificationPriority {
    switch (type) {
      case 'governance_alert':
        return 'high';
      case 'warning':
        return 'medium';
      case 'action_recommendation':
        return 'medium';
      case 'info':
        return 'low';
      default:
        return 'medium';
    }
  }
}
```

### 4.4 SystemNotificationProvider

Provides notifications for system events:

```typescript
class SystemNotificationProvider implements NotificationProvider {
  id = 'system-notification-provider';
  name = 'System Notification Provider';
  description = 'Provides notifications for system events';
  supportedTypes = ['system_event', 'info', 'warning', 'error'];
  
  private systemEventService: SystemEventService;
  private notificationService: NotificationService;
  private isRunning = false;
  
  async initialize(): Promise<boolean> {
    this.systemEventService = new SystemEventService();
    this.notificationService = new NotificationService();
    
    await this.systemEventService.initialize();
    await this.notificationService.initialize({
      defaultPriority: 'medium',
      defaultExpiryTime: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return true;
  }
  
  async start(): Promise<boolean> {
    if (this.isRunning) {
      return true;
    }
    
    this.isRunning = true;
    
    // Subscribe to system events
    this.systemEventService.subscribeToEvents(this.handleSystemEvent);
    
    return true;
  }
  
  async stop(): Promise<boolean> {
    if (!this.isRunning) {
      return true;
    }
    
    this.isRunning = false;
    
    // Unsubscribe from system events
    this.systemEventService.unsubscribeFromEvents(this.handleSystemEvent);
    
    return true;
  }
  
  private handleSystemEvent = async (event: SystemEvent) => {
    await this.notificationService.createNotification({
      title: this.getTitleForEventType(event.type),
      message: event.message,
      type: this.getNotificationTypeForEventType(event.type),
      priority: this.getPriorityForEventType(event.type),
      source: 'system',
      createdAt: Date.now(),
      read: false,
      dismissible: true,
      actions: event.actionUrl ? [
        {
          id: 'view-details',
          label: 'View Details',
          type: 'link',
          url: event.actionUrl
        },
        {
          id: 'dismiss',
          label: 'Dismiss',
          type: 'dismiss'
        }
      ] : [
        {
          id: 'dismiss',
          label: 'Dismiss',
          type: 'dismiss'
        }
      ],
      data: {
        eventId: event.id,
        eventType: event.type
      },
      context: {
        module: event.module
      }
    });
  };
  
  private getTitleForEventType(type: SystemEventType): string {
    switch (type) {
      case 'error':
        return 'System Error';
      case 'warning':
        return 'System Warning';
      case 'info':
        return 'System Information';
      case 'success':
        return 'System Success';
      default:
        return 'System Event';
    }
  }
  
  private getNotificationTypeForEventType(type: SystemEventType): NotificationType {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'system_event';
    }
  }
  
  private getPriorityForEventType(type: SystemEventType): NotificationPriority {
    switch (type) {
      case 'error':
        return 'high';
      case 'warning':
        return 'medium';
      case 'info':
        return 'low';
      case 'success':
        return 'low';
      default:
        return 'medium';
    }
  }
}
```

## 5. Extension Points

### 5.1 Notification Extension Points

```typescript
// Register a notification provider
ExtensionRegistry.registerExtensionPoint('notification:provider', {
  register: (provider: NotificationProvider) => NotificationRegistry.registerProvider(provider),
  deregister: (providerId: string) => NotificationRegistry.deregisterProvider(providerId)
});

// Register a notification handler
ExtensionRegistry.registerExtensionPoint('notification:handler', {
  register: (handler: NotificationHandler) => NotificationRegistry.registerHandler(handler),
  deregister: (handlerId: string) => NotificationRegistry.deregisterHandler(handlerId)
});

// Register a notification processor
ExtensionRegistry.registerExtensionPoint('notification:processor', {
  register: (processor: NotificationProcessor) => NotificationHub.registerProcessor(processor),
  deregister: (processorId: string) => NotificationHub.deregisterProcessor(processorId)
});
```

### 5.2 UI Extension Points

```typescript
// Register a notification renderer
ExtensionRegistry.registerExtensionPoint('notification:renderer', {
  register: (renderer: NotificationRenderer) => NotificationRendererRegistry.registerRenderer(renderer),
  deregister: (rendererId: string) => NotificationRendererRegistry.deregisterRenderer(rendererId)
});

// Register a notification action handler
ExtensionRegistry.registerExtensionPoint('notification:actionHandler', {
  register: (handler: NotificationActionHandler) => NotificationActionHandlerRegistry.registerHandler(handler),
  deregister: (handlerId: string) => NotificationActionHandlerRegistry.deregisterHandler(handlerId)
});
```

## 6. Integration with Other Systems

### 6.1 Chat Interface Integration

The notification system will integrate with the chat interface to display governance violations and observer suggestions:

```typescript
// Register chat notification handler
function registerChatNotificationHandler() {
  const handler: NotificationHandler = {
    id: 'chat-notification-handler',
    name: 'Chat Notification Handler',
    description: 'Handles notifications in the chat interface',
    supportedTypes: ['governance_violation', 'observer_suggestion'],
    
    async handle(notification: Notification): Promise<boolean> {
      // Get the chat service
      const chatService = ChatServiceRegistry.getService();
      
      if (!chatService) {
        return false;
      }
      
      // Create a system message in the chat
      await chatService.sendSystemMessage({
        content: `${notification.title}: ${notification.message}`,
        metadata: {
          notificationId: notification.id,
          notificationType: notification.type,
          notificationPriority: notification.priority
        }
      });
      
      return true;
    },
    
    canHandle(notification: Notification): boolean {
      return ['governance_violation', 'observer_suggestion'].includes(notification.type);
    }
  };
  
  NotificationRegistry.registerHandler(handler);
}
```

### 6.2 Observer Integration

The notification system will integrate with the observer agent to provide suggestions:

```typescript
// Register observer notification provider
function registerObserverNotificationProvider() {
  const provider = new ObserverNotificationProvider();
  provider.initialize().then(() => {
    NotificationRegistry.registerProvider(provider);
    provider.start();
  });
}
```

### 6.3 Governance Integration

The notification system will integrate with the governance system to display violations:

```typescript
// Register governance notification provider
function registerGovernanceNotificationProvider() {
  const provider = new GovernanceNotificationProvider();
  provider.initialize().then(() => {
    NotificationRegistry.registerProvider(provider);
    provider.start();
  });
}
```

### 6.4 Trust Boundary Integration

The notification system will integrate with the trust boundary system to display breaches:

```typescript
// Register trust boundary notification provider
function registerTrustBoundaryNotificationProvider() {
  const provider = new TrustBoundaryNotificationProvider();
  provider.initialize().then(() => {
    NotificationRegistry.registerProvider(provider);
    provider.start();
  });
}
```

## 7. State Management

### 7.1 Notification State

```typescript
interface NotificationState {
  // All notifications
  notifications: Notification[];
  
  // Unread count
  unreadCount: number;
  
  // Notification center state
  notificationCenter: {
    isOpen: boolean;
  };
  
  // Toast state
  toasts: {
    id: string;
    notification: Notification;
  }[];
}
```

### 7.2 Persistence

- Notifications will be persisted to allow viewing history
- Notification preferences will be stored in user preferences
- Read status will be persisted

## 8. API Integration

### 8.1 Notification API

```typescript
// Get notifications
GET /api/notifications?type=governance_violation&read=false

// Create a notification
POST /api/notifications
{
  "title": "Governance Violation",
  "message": "A governance rule has been violated",
  "type": "governance_violation",
  "priority": "high",
  "source": "governance",
  "dismissible": true,
  "actions": [
    {
      "id": "view-details",
      "label": "View Details",
      "type": "link",
      "url": "/governance/violations/123"
    }
  ],
  "data": {
    "violationId": "123",
    "ruleId": "456"
  },
  "context": {
    "userId": "789",
    "module": "governance"
  }
}

// Mark a notification as read
PUT /api/notifications/:id/read

// Delete a notification
DELETE /api/notifications/:id

// Get notification count
GET /api/notifications/count?read=false
```

### 8.2 Notification Preferences API

```typescript
// Get notification preferences
GET /api/notifications/preferences

// Update notification preferences
PUT /api/notifications/preferences
{
  "enableToasts": true,
  "enableSounds": false,
  "toastPosition": "top-right",
  "toastDuration": 5000,
  "filters": {
    "governance_violation": true,
    "trust_boundary_breach": true,
    "observer_suggestion": true,
    "system_event": false
  }
}
```

## 9. Accessibility and Mobile Responsiveness

### 9.1 Accessibility

- All notification components will be keyboard navigable
- ARIA attributes will be used for screen reader support
- Color contrast will meet WCAG standards
- Focus management will be implemented for notification actions

### 9.2 Mobile Responsiveness

- Notification center will adapt to different screen sizes
- Toast notifications will be positioned appropriately on mobile
- Touch targets will be large enough for mobile interaction
- Inline notifications will use responsive layout

## 10. Implementation Plan

### 10.1 Phase 1: Core Notification Infrastructure

1. Implement `NotificationService` for managing notifications
2. Implement `NotificationRegistry` for managing providers and handlers
3. Implement `NotificationHub` for orchestrating notification flow

### 10.2 Phase 2: UI Components

1. Implement `NotificationCenter` for displaying and managing notifications
2. Implement `NotificationToast` for displaying toast notifications
3. Implement `InlineNotification` for displaying inline notifications

### 10.3 Phase 3: Default Providers

1. Implement `GovernanceNotificationProvider` for governance violations
2. Implement `TrustBoundaryNotificationProvider` for trust boundary breaches
3. Implement `ObserverNotificationProvider` for observer suggestions
4. Implement `SystemNotificationProvider` for system events

### 10.4 Phase 4: Integration

1. Integrate with chat interface
2. Integrate with observer agent
3. Integrate with governance system
4. Integrate with trust boundary system

### 10.5 Phase 5: API and Persistence

1. Implement notification API
2. Implement notification preferences API
3. Implement persistence for notifications and preferences

## 11. Next Steps

1. Begin implementation of `NotificationService` and `NotificationRegistry`
2. Implement basic UI components for notifications
3. Integrate with existing systems
4. Test notification flow and user experience
