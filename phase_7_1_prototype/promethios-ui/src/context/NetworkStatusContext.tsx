import React, { createContext, useContext, useState, useEffect } from 'react';

interface NetworkStatusContextType {
  isOnline: boolean;
  lastOnline: Date | null;
  showOfflineIndicator: boolean;
}

const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

export const NetworkStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastOnline, setLastOnline] = useState<Date | null>(isOnline ? new Date() : null);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState<boolean>(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
      
      // Show indicator briefly when coming back online
      setShowOfflineIndicator(true);
      setTimeout(() => setShowOfflineIndicator(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineIndicator(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <NetworkStatusContext.Provider value={{ isOnline, lastOnline, showOfflineIndicator }}>
      {children}
      {showOfflineIndicator && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ${
          isOnline 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {isOnline 
            ? '✓ Back online - changes will sync automatically' 
            : '✗ You are offline - changes will sync when reconnected'}
        </div>
      )}
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatus = () => {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  return context;
};

export default NetworkStatusProvider;
