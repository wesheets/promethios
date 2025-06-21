import React from 'react';
import { Notification, NotificationType } from '../../types/notification';

interface NotificationItemProps {
  // Notification to display
  notification: Notification;
  
  // Action handler
  onAction: (actionId: string) => void;
  
  // Mark as read handler
  onMarkAsRead: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onAction,
  onMarkAsRead
}) => {
  const handleActionClick = (actionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAction(actionId);
  };

  const handleNotificationClick = () => {
    if (!notification.read) {
      onMarkAsRead();
    }
  };

  const getIconForType = (type: NotificationType): React.ReactNode => {
    const iconClasses = "w-5 h-5 flex-shrink-0";
    
    switch (type) {
      case 'info':
        return (
          <svg className={`${iconClasses} text-blue-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg className={`${iconClasses} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`${iconClasses} text-yellow-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`${iconClasses} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'governance_violation':
        return (
          <svg className={`${iconClasses} text-red-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
        );
      case 'trust_boundary_breach':
        return (
          <svg className={`${iconClasses} text-orange-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        );
      case 'observer_suggestion':
        return (
          <svg className={`${iconClasses} text-purple-500`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        );
      case 'system_event':
        return (
          <svg className={`${iconClasses} text-gray-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className={`${iconClasses} text-gray-500`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        );
    }
  };

  const formatTime = (timestamp: number): string => {
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
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-600';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-400';
    }
  };

  return (
    <div
      className={`notification-item px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} ${
        notification.read ? 'opacity-75' : ''
      }`}
      onClick={handleNotificationClick}
    >
      <div className="flex items-start space-x-3">
        {/* Notification Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIconForType(notification.type)}
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                {notification.title}
              </p>
              <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'} mt-1`}>
                {notification.message}
              </p>
            </div>

            {/* Unread Indicator */}
            {!notification.read && (
              <div className="flex-shrink-0 ml-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
            )}
          </div>

          {/* Notification Meta */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{formatTime(notification.createdAt)}</span>
              <span>•</span>
              <span className="capitalize">{notification.source}</span>
            </div>

            {/* Priority Badge */}
            {notification.priority === 'critical' || notification.priority === 'high' ? (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                notification.priority === 'critical' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {notification.priority}
              </span>
            ) : null}
          </div>

          {/* Notification Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex items-center space-x-2 mt-3">
              {notification.actions.map(action => (
                <button
                  key={action.id}
                  onClick={(e) => handleActionClick(action.id, e)}
                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md ${
                    action.type === 'dismiss'
                      ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                      : action.type === 'link'
                      ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                      : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                  }`}
                >
                  {action.type === 'link' && action.url ? (
                    <a href={action.url} className="flex items-center">
                      {action.label}
                    </a>
                  ) : (
                    action.label
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {notification.dismissible && (
          <div className="flex-shrink-0">
            <button
              onClick={(e) => handleActionClick('dismiss', e)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Dismiss notification"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;

