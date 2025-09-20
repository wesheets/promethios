import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConnections } from './useConnections';

export interface PinnedCollaborator {
  id: string;
  name: string;
  avatar?: string;
  status: 'active' | 'inactive';
}

export const usePinnedCollaborators = () => {
  const { currentUser } = useAuth();
  const { connections, loading: connectionsLoading, error: connectionsError } = useConnections();
  const [collaborators, setCollaborators] = useState<PinnedCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      // Show demo collaborators for unauthenticated users
      const demoCollaborators: PinnedCollaborator[] = [
        {
          id: 'demo-john',
          name: 'John Doe',
          avatar: 'https://i.pravatar.cc/150?u=john.doe',
          status: 'active',
        },
        {
          id: 'demo-jane',
          name: 'Jane Smith',
          avatar: 'https://i.pravatar.cc/150?u=jane.smith',
          status: 'inactive',
        },
      ];
      setCollaborators(demoCollaborators);
      setLoading(false);
      return;
    }

    if (connectionsLoading) {
      setLoading(true);
      return;
    }

    if (connectionsError) {
      setError(connectionsError);
      setLoading(false);
      return;
    }

    // Convert Firebase connections to collaborators
    const realCollaborators: PinnedCollaborator[] = connections.map(connection => {
      // Determine which user is the collaborator (not the current user)
      const isUser1 = connection.userId1 === currentUser.uid;
      const collaboratorId = isUser1 ? connection.userId2 : connection.userId1;
      const collaboratorName = isUser1 ? connection.user2Name : connection.user1Name;
      const collaboratorPhoto = isUser1 ? connection.user2Photo : connection.user1Photo;

      return {
        id: collaboratorId,
        name: collaboratorName,
        avatar: collaboratorPhoto,
        status: 'active' as const, // Could be enhanced with real-time status
      };
    });

    setCollaborators(realCollaborators);
    setError(null);
    setLoading(false);
  }, [currentUser, connections, connectionsLoading, connectionsError]);

  return { collaborators, loading, error };
};
