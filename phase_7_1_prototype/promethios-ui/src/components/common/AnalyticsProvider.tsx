import React from 'react';
import { useTheme } from '../../context/ThemeContext';

// Simple analytics wrapper - in a real implementation, this would connect to a service like PostHog or Plausible
const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDarkMode } = useTheme();
  
  // Initialize analytics on mount
  React.useEffect(() => {
    console.log('Analytics initialized');
    
    // Track page view
    trackPageView(window.location.pathname);
    
    // Listen for route changes
    const handleRouteChange = () => {
      trackPageView(window.location.pathname);
    };
    
    // Clean up
    return () => {
      console.log('Analytics cleanup');
    };
  }, []);
  
  // Analytics tracking functions
  const trackPageView = (path: string) => {
    console.log(`Analytics: Page view - ${path}`);
    // In a real implementation, this would send data to an analytics service
  };
  
  // Expose tracking functions globally
  React.useEffect(() => {
    // Create global analytics object
    (window as any).promethiosAnalytics = {
      trackEvent: (eventName: string, properties?: Record<string, any>) => {
        console.log(`Analytics: Event - ${eventName}`, properties);
        // In a real implementation, this would send data to an analytics service
      },
      trackFeatureUsage: (featureName: string, properties?: Record<string, any>) => {
        console.log(`Analytics: Feature usage - ${featureName}`, properties);
        // In a real implementation, this would send data to an analytics service
      }
    };
    
    return () => {
      // Clean up global object on unmount
      delete (window as any).promethiosAnalytics;
    };
  }, []);
  
  return (
    <>
      {children}
      
      {/* Privacy-conscious analytics notice */}
      <div className={`fixed bottom-5 left-5 z-30 max-w-xs p-3 rounded-lg shadow-lg text-xs ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-gray-300' : 'bg-white text-gray-600'}`}>
        <p>
          <span className="font-medium">Privacy-focused analytics active.</span> We collect minimal usage data to improve your experience.
        </p>
        <button className="mt-1 text-purple-500 hover:text-purple-600 font-medium">
          Learn more
        </button>
      </div>
    </>
  );
};

export default AnalyticsProvider;
