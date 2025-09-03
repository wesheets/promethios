/**
 * SharedConversationContext - Global context for managing shared conversations
 * Ensures shared chat tabs appear across all command centers for a user
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import SharedConversationService, { SharedConversation } from '../services/SharedConversationService';

interface SharedConversationContextType {
  sharedConversations: SharedConversation[];
  activeSharedConversation: string | null;
  isInSharedMode: boolean;
  setActiveSharedConversation: (conversationId: string | null) => void;
  setIsInSharedMode: (isShared: boolean) => void;
  refreshSharedConversations: () => Promise<void>;
  handleSharedConversationSelect: (conversationId: string) => void;
  handleSharedConversationClose: (conversationId: string) => void;
  handlePrivacyToggle: (conversationId: string, isPrivate: boolean) => Promise<void>;
}

const SharedConversationContext = createContext<SharedConversationContextType | undefined>(undefined);

export const useSharedConversations = () => {
  const context = useContext(SharedConversationContext);
  if (context === undefined) {
    throw new Error('useSharedConversations must be used within a SharedConversationProvider');
  }
  return context;
};

interface SharedConversationProviderProps {
  children: ReactNode;
}

export const SharedConversationProvider: React.FC<SharedConversationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [sharedConversations, setSharedConversations] = useState<SharedConversation[]>([]);
  const [activeSharedConversation, setActiveSharedConversation] = useState<string | null>(null);
  const [isInSharedMode, setIsInSharedMode] = useState(false);
  const sharedConversationService = SharedConversationService.getInstance();

  // Load shared conversations when user changes
  useEffect(() => {
    const loadSharedConversations = async () => {
      try {
        // Try multiple auth sources to ensure we get the correct user
        let currentUser = user;
        
        // Fallback to Firebase auth directly if useAuth doesn't provide user
        if (!currentUser) {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          currentUser = auth.currentUser;
          console.log('🌐 [SharedConversationContext] Using Firebase auth fallback:', currentUser?.uid);
        }
        
        console.log('🌐 [SharedConversationContext] Auth sources check:');
        console.log('🌐 [SharedConversationContext] - useAuth user:', user?.uid);
        console.log('🌐 [SharedConversationContext] - Final user for loading:', currentUser?.uid);
        
        if (currentUser?.uid) {
          console.log('🌐 [SharedConversationContext] Loading conversations for user:', currentUser.uid);
          console.log('🌐 [SharedConversationContext] SharedConversationService instance:', sharedConversationService);
          console.log('🌐 [SharedConversationContext] About to call getUserSharedConversations...');
          
          const conversations = await sharedConversationService.getUserSharedConversations(currentUser.uid);
          
          console.log('🌐 [SharedConversationContext] getUserSharedConversations returned:', conversations);
          console.log('🌐 [SharedConversationContext] Conversations count:', conversations?.length || 0);
          console.log('🌐 [SharedConversationContext] Conversations details:', conversations);
          
          setSharedConversations(conversations);
          console.log('🌐 [SharedConversationContext] setSharedConversations called with', conversations.length, 'conversations');
        } else {
          console.log('🌐 [SharedConversationContext] No user available, clearing conversations');
          setSharedConversations([]);
          setActiveSharedConversation(null);
          setIsInSharedMode(false);
        }
      } catch (error) {
        console.error('🌐 [SharedConversationContext] Error loading conversations:', error);
        console.error('🌐 [SharedConversationContext] Error details:', error);
      }
    };

    loadSharedConversations();
  }, [user?.uid]);

  // Also listen for Firebase auth state changes directly
  useEffect(() => {
    const setupFirebaseAuthListener = async () => {
      const { getAuth, onAuthStateChanged } = await import('firebase/auth');
      const auth = getAuth();
      
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        console.log('🌐 [SharedConversationContext] Firebase auth state changed:', firebaseUser?.uid);
        
        // If Firebase user is different from useAuth user, reload conversations
        if (firebaseUser?.uid && firebaseUser.uid !== user?.uid) {
          console.log('🌐 [SharedConversationContext] Firebase user differs from useAuth user, reloading...');
          sharedConversationService.getUserSharedConversations(firebaseUser.uid).then(conversations => {
            console.log('🌐 [SharedConversationContext] Loaded conversations from Firebase auth:', conversations.length);
            setSharedConversations(conversations);
          });
        }
      });
      
      return unsubscribe;
    };
    
    setupFirebaseAuthListener();
  }, [user?.uid]);

  // Listen for navigation events from invitation acceptance
  useEffect(() => {
    const handleNavigateToSharedConversation = (event: CustomEvent) => {
      const { conversationId } = event.detail;
      console.log('🌐 [Global Shared Conversations] Navigating to conversation:', conversationId);
      
      // Refresh conversations and activate the new one
      refreshSharedConversations().then(() => {
        setActiveSharedConversation(conversationId);
        setIsInSharedMode(true);
      });
    };

    window.addEventListener('navigateToSharedConversation', handleNavigateToSharedConversation as EventListener);
    
    return () => {
      window.removeEventListener('navigateToSharedConversation', handleNavigateToSharedConversation as EventListener);
    };
  }, []);

  const refreshSharedConversations = async () => {
    try {
      // Try multiple auth sources
      let currentUser = user;
      
      if (!currentUser) {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        currentUser = auth.currentUser;
        console.log('🔄 [SharedConversationContext] Using Firebase auth fallback for refresh:', currentUser?.uid);
      }
      
      if (currentUser?.uid) {
        console.log('🔄 [Global Shared Conversations] Refreshing conversations for user:', currentUser.uid);
        const conversations = await sharedConversationService.getUserSharedConversations(currentUser.uid);
        console.log('🔄 [Global Shared Conversations] Refresh loaded:', conversations.length, 'conversations');
        setSharedConversations(conversations);
      }
    } catch (error) {
      console.error('🔄 [Global Shared Conversations] Error refreshing conversations:', error);
    }
  };

  const handleSharedConversationSelect = (conversationId: string) => {
    setActiveSharedConversation(conversationId);
    setIsInSharedMode(true);
    console.log('🔄 [Global Shared Conversations] Switched to shared conversation:', conversationId);
  };

  const handleSharedConversationClose = (conversationId: string) => {
    if (activeSharedConversation === conversationId) {
      setActiveSharedConversation(null);
      setIsInSharedMode(false);
    }
    // Remove from user's conversation list
    setSharedConversations(prev => prev.filter(conv => conv.id !== conversationId));
    console.log('❌ [Global Shared Conversations] Closed shared conversation:', conversationId);
  };

  const handlePrivacyToggle = async (conversationId: string, isPrivate: boolean) => {
    try {
      await sharedConversationService.togglePrivacyMode(conversationId, isPrivate);
      
      // Update local state
      setSharedConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, isPrivateMode: isPrivate }
          : conv
      ));
      
      console.log(`🔒 [Global Shared Conversations] Privacy mode ${isPrivate ? 'enabled' : 'disabled'}:`, conversationId);
    } catch (error) {
      console.error('🔒 [Global Shared Conversations] Error toggling privacy mode:', error);
    }
  };

  const value: SharedConversationContextType = {
    sharedConversations,
    activeSharedConversation,
    isInSharedMode,
    setActiveSharedConversation,
    setIsInSharedMode,
    refreshSharedConversations,
    handleSharedConversationSelect,
    handleSharedConversationClose,
    handlePrivacyToggle
  };

  return (
    <SharedConversationContext.Provider value={value}>
      {children}
    </SharedConversationContext.Provider>
  );
};

export default SharedConversationContext;

