/**
 * SharedConversationContext - Global context for managing shared conversations
 * Now uses unified approach - guests access host conversations directly via invitations
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import SharedConversationService, { SharedConversation } from '../services/SharedConversationService';
import UnifiedGuestChatService, { GuestConversationAccess } from '../services/UnifiedGuestChatService';

interface SharedConversationContextType {
  sharedConversations: SharedConversation[];
  guestConversationAccess: GuestConversationAccess[]; // New unified approach
  activeSharedConversation: string | null;
  isInSharedMode: boolean;
  setActiveSharedConversation: (conversationId: string | null) => void;
  setIsInSharedMode: (isShared: boolean) => void;
  refreshSharedConversations: () => Promise<void>;
  addSharedConversation: (conversation: SharedConversation) => void;
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
  const [guestConversationAccess, setGuestConversationAccess] = useState<GuestConversationAccess[]>([]);
  const [activeSharedConversation, setActiveSharedConversation] = useState<string | null>(null);
  const [isInSharedMode, setIsInSharedMode] = useState(false);
  const sharedConversationService = SharedConversationService.getInstance();
  const unifiedGuestChatService = UnifiedGuestChatService.getInstance();

  // Helper functions for managing closed conversations
  const getClosedConversationsKey = (userId: string) => `closedSharedConversations_${userId}`;
  
  const getClosedConversations = (userId: string): string[] => {
    try {
      const stored = localStorage.getItem(getClosedConversationsKey(userId));
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading closed conversations:', error);
      return [];
    }
  };
  
  const addClosedConversation = (userId: string, conversationId: string) => {
    try {
      const closed = getClosedConversations(userId);
      if (!closed.includes(conversationId)) {
        closed.push(conversationId);
        localStorage.setItem(getClosedConversationsKey(userId), JSON.stringify(closed));
      }
    } catch (error) {
      console.error('Error storing closed conversation:', error);
    }
  };
  
  const removeClosedConversation = (userId: string, conversationId: string) => {
    try {
      const closed = getClosedConversations(userId);
      const filtered = closed.filter(id => id !== conversationId);
      localStorage.setItem(getClosedConversationsKey(userId), JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing closed conversation:', error);
    }
  };

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
          
          // Load both old shared conversations (for backward compatibility) and new unified guest access
          const [conversations, guestAccess] = await Promise.all([
            sharedConversationService.getUserSharedConversations(currentUser.uid),
            unifiedGuestChatService.getGuestConversationAccess(currentUser.uid)
          ]);
          
          console.log('🌐 [SharedConversationContext] getUserSharedConversations returned:', conversations);
          console.log('🌐 [SharedConversationContext] getGuestConversationAccess returned:', guestAccess);
          console.log('🌐 [SharedConversationContext] Conversations count:', conversations?.length || 0);
          console.log('🌐 [SharedConversationContext] Guest access count:', guestAccess?.length || 0);
          
          // Filter out conversations that the user has closed
          const closedConversationIds = getClosedConversations(currentUser.uid);
          const filteredConversations = conversations.filter(conv => !closedConversationIds.includes(conv.id));
          const filteredGuestAccess = guestAccess.filter(access => !closedConversationIds.includes(access.id));
          
          console.log('🌐 [SharedConversationContext] Closed conversation IDs:', closedConversationIds);
          console.log('🌐 [SharedConversationContext] Filtered conversations count:', filteredConversations.length);
          console.log('🌐 [SharedConversationContext] Filtered guest access count:', filteredGuestAccess.length);
          console.log('🌐 [SharedConversationContext] Conversations details:', filteredConversations);
          console.log('🌐 [SharedConversationContext] Guest access details:', filteredGuestAccess);
          
          setSharedConversations(filteredConversations);
          setGuestConversationAccess(filteredGuestAccess);
          console.log('🌐 [SharedConversationContext] State updated with conversations and guest access');
        } else {
          console.log('🌐 [SharedConversationContext] No user available, clearing conversations');
          setSharedConversations([]);
          setGuestConversationAccess([]);
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
            
            // Filter out closed conversations
            const closedConversationIds = getClosedConversations(firebaseUser.uid);
            const filteredConversations = conversations.filter(conv => !closedConversationIds.includes(conv.id));
            
            console.log('🌐 [SharedConversationContext] Firebase auth - Closed IDs:', closedConversationIds);
            console.log('🌐 [SharedConversationContext] Firebase auth - Filtered count:', filteredConversations.length);
            
            setSharedConversations(filteredConversations);
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
        
        // Filter out closed conversations
        const closedConversationIds = getClosedConversations(currentUser.uid);
        const filteredConversations = conversations.filter(conv => !closedConversationIds.includes(conv.id));
        
        console.log('🔄 [Global Shared Conversations] Refresh - Closed IDs:', closedConversationIds);
        console.log('🔄 [Global Shared Conversations] Refresh - Filtered count:', filteredConversations.length);
        
        setSharedConversations(filteredConversations);
      }
    } catch (error) {
      console.error('🔄 [Global Shared Conversations] Error refreshing conversations:', error);
    }
  };

  const addSharedConversation = (conversation: SharedConversation) => {
    // Get current user
    let currentUser = user;
    if (!currentUser) {
      try {
        const { getAuth } = require('firebase/auth');
        const auth = getAuth();
        currentUser = auth.currentUser;
      } catch (error) {
        console.error('Error getting current user for add operation:', error);
      }
    }
    
    setSharedConversations(prev => {
      // Check if conversation already exists to avoid duplicates
      const exists = prev.some(conv => conv.id === conversation.id);
      if (exists) {
        console.log('🔄 [SharedConversationContext] Conversation already exists:', conversation.id);
        return prev;
      }
      console.log('🔄 [SharedConversationContext] Adding new conversation:', conversation.id);
      
      // Remove from closed list if it was previously closed
      if (currentUser?.uid) {
        removeClosedConversation(currentUser.uid, conversation.id);
      }
      
      return [...prev, conversation];
    });
  };

  const handleSharedConversationSelect = (conversationId: string) => {
    setActiveSharedConversation(conversationId);
    setIsInSharedMode(true);
    console.log('🔄 [Global Shared Conversations] Switched to shared conversation:', conversationId);
  };

  const handleSharedConversationClose = (conversationId: string) => {
    // Get current user
    let currentUser = user;
    if (!currentUser) {
      try {
        const { getAuth } = require('firebase/auth');
        const auth = getAuth();
        currentUser = auth.currentUser;
      } catch (error) {
        console.error('Error getting current user for close operation:', error);
      }
    }
    
    if (activeSharedConversation === conversationId) {
      setActiveSharedConversation(null);
      setIsInSharedMode(false);
    }
    
    // Remove from user's conversation list
    setSharedConversations(prev => prev.filter(conv => conv.id !== conversationId));
    
    // Persist the closed state
    if (currentUser?.uid) {
      addClosedConversation(currentUser.uid, conversationId);
      console.log('❌ [Global Shared Conversations] Closed and persisted shared conversation:', conversationId);
    } else {
      console.log('❌ [Global Shared Conversations] Closed shared conversation (no user for persistence):', conversationId);
    }
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
    guestConversationAccess,
    activeSharedConversation,
    isInSharedMode,
    setActiveSharedConversation,
    setIsInSharedMode,
    refreshSharedConversations,
    addSharedConversation,
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

