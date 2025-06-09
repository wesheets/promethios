import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { useAuth } from './AuthContext';

interface SessionState {
  currentPath: string;
  scrollPosition: number;
  lastUpdated: Date;
  additionalState?: Record<string, any>;
}

interface SessionContextType {
  saveState: (additionalState?: Record<string, any>) => Promise<void>;
  clearState: () => Promise<void>;
  isRestoring: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Save current session state
  const saveState = async (additionalState?: Record<string, any>) => {
    if (!user?.uid) return;
    
    try {
      const sessionState: SessionState = {
        currentPath: location.pathname,
        scrollPosition: window.scrollY,
        lastUpdated: new Date(),
        additionalState
      };
      
      await setDoc(doc(firestore, 'userSessions', user.uid), sessionState);
      console.log('Session state saved successfully');
    } catch (error) {
      console.error('Error saving session state:', error);
    }
  };
  
  // Clear session state
  const clearState = async () => {
    if (!user?.uid) return;
    
    try {
      await setDoc(doc(firestore, 'userSessions', user.uid), {
        currentPath: '/',
        scrollPosition: 0,
        lastUpdated: new Date()
      });
      console.log('Session state cleared successfully');
    } catch (error) {
      console.error('Error clearing session state:', error);
    }
  };
  
  // Auto-save session state periodically and on page unload
  useEffect(() => {
    if (!user?.uid) return;
    
    // Save state every 30 seconds
    const intervalId = setInterval(() => {
      saveState();
    }, 30000);
    
    // Save state on page unload
    const handleUnload = () => {
      saveState();
    };
    
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user, location.pathname]);
  
  // Restore session on initial load
  useEffect(() => {
    const restoreSession = async () => {
      if (!user?.uid) return;
      
      try {
        setIsRestoring(true);
        const sessionDoc = await getDoc(doc(firestore, 'userSessions', user.uid));
        
        if (sessionDoc.exists()) {
          const sessionState = sessionDoc.data() as SessionState;
          
          // Only restore if the session is less than 24 hours old
          const sessionAge = new Date().getTime() - new Date(sessionState.lastUpdated).getTime();
          const isSessionRecent = sessionAge < 24 * 60 * 60 * 1000;
          const isDifferentPath = sessionState.currentPath !== location.pathname;
          const isValidPath = sessionState.currentPath && sessionState.currentPath !== '/';
          
          if (isSessionRecent && isDifferentPath && isValidPath) {
            console.log('Restoring session to:', sessionState.currentPath);
            navigate(sessionState.currentPath);
            
            // Restore scroll position after navigation completes
            setTimeout(() => {
              window.scrollTo(0, sessionState.scrollPosition || 0);
              setIsRestoring(false);
            }, 300);
          } else {
            setIsRestoring(false);
          }
        } else {
          setIsRestoring(false);
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        setIsRestoring(false);
      }
    };
    
    if (user?.uid) {
      restoreSession();
    }
  }, [user?.uid]);
  
  return (
    <SessionContext.Provider value={{ saveState, clearState, isRestoring }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export default SessionProvider;
