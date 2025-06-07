import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useObserver } from '../../context/ObserverContext';

/**
 * ObserverAgentProxy Component
 * 
 * This proxy component serves as a bridge to the ObserverAgent component in the /ui/ directory.
 * It provides the same Observer agent functionality for governance-relevant screens.
 */
const ObserverAgentProxy: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    addMemoryItem, 
    showNotification, 
    memoryItems, 
    guidanceLevel, 
    setGuidanceLevel 
  } = useObserver();
  
  const [currentMessage, setCurrentMessage] = useState('I\'m monitoring this governance activity to ensure compliance with your defined policies.');
  const [isThinking, setIsThinking] = useState(false);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [notifications, setNotifications] = useState<{id: number, message: string, type: 'info' | 'warning' | 'success'}[]>([]);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  
  // Generate contextual responses based on user actions
  const generateResponse = (action: string) => {
    const lowerAction = action.toLowerCase();
    
    if (lowerAction.includes('dashboard')) {
      setCurrentMessage('I notice you\'re exploring the dashboard. The governance score reflects your agent\'s compliance with defined policies.');
    } else if (lowerAction.includes('agent') || lowerAction.includes('wrap')) {
      setCurrentMessage('Adding a new agent? I\'ll help ensure it adheres to your governance standards and track its compliance over time.');
    } else if (lowerAction.includes('governance') || lowerAction.includes('policy')) {
      setCurrentMessage('Governance policies define the boundaries for your AI agents. I\'ll help you monitor and enforce these policies.');
    } else if (lowerAction.includes('settings')) {
      setCurrentMessage('You can adjust my guidance level in settings. More frequent guidance helps maintain higher compliance scores.');
    } else {
      // Default responses
      const defaultResponses = [
        'I\'m tracking your governance activities to provide personalized guidance.',
        'Your recent actions are being monitored to ensure compliance with your policies.',
        'I can help you understand how your actions impact your governance score.',
        'Let me know if you need guidance on improving your compliance status.'
      ];
      setCurrentMessage(defaultResponses[Math.floor(Math.random() * defaultResponses.length)]);
    }
  };
  
  // Track page views and interactions
  useEffect(() => {
    if (!currentUser) return;
    
    // Add initial memory item for dashboard view
    addMemoryItem('Viewed dashboard');
    generateResponse('dashboard');
    
    // Set up event listeners for tracking clicks on governance-relevant elements
    const trackClicks = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // Check if the clicked element is a button or link
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || 
          target.closest('button') || target.closest('a')) {
        
        // Get the text content of the clicked element or its parent
        const element = target.tagName === 'BUTTON' || target.tagName === 'A' ? 
                        target : (target.closest('button') || target.closest('a'));
        
        if (element && element.textContent) {
          const text = element.textContent.trim();
          if (text && text.length > 0) {
            addMemoryItem(`Clicked on "${text}"`);
            
            // Simulate Observer thinking about the new memory
            setIsThinking(true);
            setTimeout(() => {
              setIsThinking(false);
              // Generate a response based on the action
              generateResponse(text);
              
              // Potentially generate a notification based on the action
              if (Math.random() > 0.7) { // 30% chance of notification
                const notificationTypes = ['info', 'warning', 'success'] as const;
                const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
                showNotification(`Observer noticed your interest in ${text}`, randomType);
                
                // Update local notifications state
                const notification = {
                  id: Date.now(),
                  message: `Observer noticed your interest in ${text}`,
                  type: randomType
                };
                setNotifications(prev => [notification, ...prev].slice(0, 5));
                setShowNotificationBanner(true);
                setTimeout(() => setShowNotificationBanner(false), 5000);
              }
            }, 1500);
          }
        }
      }
    };
    
    document.addEventListener('click', trackClicks);
    
    return () => {
      document.removeEventListener('click', trackClicks);
    };
  }, [currentUser, addMemoryItem, showNotification]);
  
  // Toggle guidance level
  const toggleGuidanceLevel = () => {
    const levels = ['Minimal', 'Standard', 'Detailed'];
    const currentIndex = levels.indexOf(guidanceLevel);
    const nextIndex = (currentIndex + 1) % levels.length;
    setGuidanceLevel(levels[nextIndex]);
    
    addMemoryItem(`Changed guidance level to ${levels[nextIndex]}`);
    showNotification(`Guidance level updated to ${levels[nextIndex]}`, 'info');
  };
  
  // Toggle memory panel
  const toggleMemoryPanel = () => {
    setShowMemoryPanel(!showMemoryPanel);
  };
  
  // Test notification
  const testNotification = () => {
    const types = ['info', 'warning', 'success'] as const;
    const randomType = types[Math.floor(Math.random() * types.length)];
    const messages = [
      'Your governance score has improved by 3% this week!',
      'New agent detected. Would you like to apply standard governance policies?',
      'Policy changes may affect your compliance score. Review impact?',
      'I\'ve noted your interest in this area for future guidance.'
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    showNotification(randomMessage, randomType);
    
    // Update local notifications state
    const notification = {
      id: Date.now(),
      message: randomMessage,
      type: randomType
    };
    setNotifications(prev => [notification, ...prev].slice(0, 5));
    setShowNotificationBanner(true);
    setTimeout(() => setShowNotificationBanner(false), 5000);
  };
  
  // Dismiss a notification
  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  // Format timestamp for memory items
  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString();
  };

  return (
    <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50 shadow-lg relative">
      {/* Notification banner */}
      {showNotificationBanner && notifications.length > 0 && (
        <div className={`absolute top-0 left-0 right-0 transform -translate-y-full p-3 rounded-t-lg shadow-lg transition-all duration-300 ${
          notifications[0].type === 'info' ? 'bg-blue-600' : 
          notifications[0].type === 'warning' ? 'bg-yellow-600' : 
          'bg-green-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {notifications[0].type === 'info' && (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {notifications[0].type === 'warning' && (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {notifications[0].type === 'success' && (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="text-white">{notifications[0].message}</span>
            </div>
            <button 
              onClick={() => dismissNotification(notifications[0].id)}
              className="text-white hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-center mb-3">
        <div className={`w-8 h-8 rounded-full ${isThinking ? 'bg-yellow-600 animate-pulse' : 'bg-purple-600'} flex items-center justify-center mr-3 transition-colors duration-300`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="white"/>
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Observer Agent</h2>
        <div className="ml-auto">
          <span className={`inline-flex h-3 w-3 rounded-full ${isThinking ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></span>
        </div>
      </div>
      
      <div className="mb-4 p-3 bg-gray-700 rounded-lg transition-all duration-300 hover:bg-gray-650">
        <p className="text-white whitespace-pre-line">{currentMessage}</p>
      </div>
      
      {/* Memory Panel */}
      {showMemoryPanel && (
        <div className="mb-4 bg-gray-700/70 rounded-lg p-3 max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-300">Observer Memory</h3>
            <button 
              onClick={toggleMemoryPanel}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {memoryItems.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {memoryItems.slice(0, 10).map((item, index) => (
                <li key={index} className="text-gray-300 border-b border-gray-600/50 pb-1 flex items-start">
                  <span className="text-xs text-gray-500 mr-2 whitespace-nowrap">{formatTimestamp()}</span>
                  <span>{item}</span>
                </li>
              ))}
              {memoryItems.length > 10 && (
                <li className="text-gray-400 text-xs text-center pt-1">
                  + {memoryItems.length - 10} more items
                </li>
              )}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No memory items recorded yet.</p>
          )}
        </div>
      )}
      
      {/* Notification list */}
      {notifications.length > 0 && (
        <div className="mb-4 max-h-40 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Recent Notifications</h3>
          <div className="space-y-2">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-2 rounded-md flex items-start justify-between ${
                  notification.type === 'info' ? 'bg-blue-900/30' : 
                  notification.type === 'warning' ? 'bg-yellow-900/30' : 
                  'bg-green-900/30'
                }`}
              >
                <div className="flex items-start">
                  {notification.type === 'info' && (
                    <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {notification.type === 'warning' && (
                    <svg className="w-4 h-4 mr-2 mt-0.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {notification.type === 'success' && (
                    <svg className="w-4 h-4 mr-2 mt-0.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className="text-sm text-gray-200">{notification.message}</span>
                </div>
                <button 
                  onClick={() => dismissNotification(notification.id)}
                  className="text-gray-400 hover:text-white ml-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="text-sm text-gray-400">
        <p>Observer is tracking your governance preferences and will provide personalized guidance.</p>
        <div className="mt-2 flex items-center flex-wrap gap-2">
          <button 
            onClick={toggleMemoryPanel}
            className="text-xs px-2 py-1 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
          >
            Memory: {memoryItems.length} items
          </button>
          <button 
            onClick={toggleGuidanceLevel}
            className="text-xs px-2 py-1 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
          >
            Guidance: {guidanceLevel}
          </button>
          <button 
            onClick={testNotification}
            className="text-xs px-2 py-1 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
          >
            Test Notification
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObserverAgentProxy;
