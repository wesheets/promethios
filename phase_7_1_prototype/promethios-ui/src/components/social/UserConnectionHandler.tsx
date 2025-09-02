/**
 * User Connection Handler
 * 
 * Handles sending connection requests and chat invitations between users
 */

import React from 'react';
import { useUserInteractions } from '../../hooks/useUserInteractions';
import { useAuth } from '../../context/AuthContext';

interface UserConnectionHandlerProps {
  children: (handlers: {
    sendConnectionRequest: (userId: string, message?: string) => Promise<boolean>;
    sendChatInvitation: (userId: string, message?: string) => Promise<boolean>;
    isConnected: (userId: string) => boolean;
    hasPendingRequest: (userId: string) => boolean;
  }) => React.ReactNode;
}

export const UserConnectionHandler: React.FC<UserConnectionHandlerProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const { 
    sendInteraction, 
    relationships, 
    sentInteractions,
    hasSentInteractionTo,
    hasRelationshipWith 
  } = useUserInteractions();

  const sendConnectionRequest = async (userId: string, message?: string): Promise<boolean> => {
    if (!currentUser?.uid || userId === currentUser.uid) return false;

    try {
      console.log(`🤝 [UserConnectionHandler] Sending connection request to ${userId}`);
      
      const success = await sendInteraction('connection_request', userId, {
        message: message || "Hi! I'd like to connect and explore collaboration opportunities.",
        priority: 'medium'
      });

      if (success) {
        console.log(`✅ [UserConnectionHandler] Connection request sent successfully to ${userId}`);
      } else {
        console.log(`❌ [UserConnectionHandler] Failed to send connection request to ${userId}`);
      }

      return success;
    } catch (error) {
      console.error(`❌ [UserConnectionHandler] Error sending connection request:`, error);
      return false;
    }
  };

  const sendChatInvitation = async (userId: string, message?: string): Promise<boolean> => {
    if (!currentUser?.uid || userId === currentUser.uid) return false;

    try {
      console.log(`💬 [UserConnectionHandler] Sending chat invitation to ${userId}`);
      
      const success = await sendInteraction('chat_invitation', userId, {
        message: message || "Hi! Would you like to start a conversation?",
        priority: 'medium',
        conversationName: `Chat with ${currentUser.displayName || 'User'}`,
        conversationId: `chat_${currentUser.uid}_${userId}_${Date.now()}`
      });

      if (success) {
        console.log(`✅ [UserConnectionHandler] Chat invitation sent successfully to ${userId}`);
      } else {
        console.log(`❌ [UserConnectionHandler] Failed to send chat invitation to ${userId}`);
      }

      return success;
    } catch (error) {
      console.error(`❌ [UserConnectionHandler] Error sending chat invitation:`, error);
      return false;
    }
  };

  const isConnected = (userId: string): boolean => {
    return hasRelationshipWith(userId, 'connection') || hasRelationshipWith(userId, 'friend');
  };

  const hasPendingRequest = (userId: string): boolean => {
    return hasSentInteractionTo(userId, 'connection_request') || hasSentInteractionTo(userId, 'chat_invitation');
  };

  return (
    <>
      {children({
        sendConnectionRequest,
        sendChatInvitation,
        isConnected,
        hasPendingRequest
      })}
    </>
  );
};

export default UserConnectionHandler;

