import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ConnectionService } from '../services/ConnectionService';

export interface PinnedCollaborator {
  id: string;
  name: string;
  avatar?: string;
  status: 'active' | 'inactive';
}

export const usePinnedCollaborators = () => {
  const { currentUser } = useAuth();
  const [collaborators, setCollaborators] = useState<PinnedCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConnections = async () => {
      if (!currentUser?.uid) {
        console.log('🤝 [usePinnedCollaborators] No current user, showing demo collaborators');
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

      setLoading(true);
      try {
        console.log('🤝 [usePinnedCollaborators] Loading connections for user:', currentUser.uid);
        const connectionService = ConnectionService.getInstance();
        const userConnections = await connectionService.getUserConnections(currentUser.uid);
        
        console.log('🤝 [usePinnedCollaborators] Loaded connections:', userConnections.length, userConnections);

        if (userConnections.length === 0) {
          console.log('🤝 [usePinnedCollaborators] No connections found, showing demo collaborators');
          const demoCollaborators: PinnedCollaborator[] = [
            {
              id: 'demo-ted',
              name: 'Ted Sheets',
              avatar: 'https://i.pravatar.cc/150?u=ted.sheets',
              status: 'active',
            },
            {
              id: 'demo-alice',
              name: 'Alice Johnson',
              avatar: 'https://i.pravatar.cc/150?u=alice.johnson',
              status: 'active',
            },
          ];
          setCollaborators(demoCollaborators);
          setLoading(false);
          return;
        }

        // Convert Firebase connections to collaborators
        const realCollaborators: PinnedCollaborator[] = userConnections.map(connection => {
          // Determine which user is the collaborator (not the current user)
          const isUser1 = connection.userId1 === currentUser.uid;
          const collaboratorId = isUser1 ? connection.userId2 : connection.userId1;
          const collaboratorName = isUser1 ? connection.user2Name : connection.user1Name;
          const collaboratorAvatar = isUser1 ? connection.user2Avatar : connection.user1Avatar;

          console.log('🤝 [usePinnedCollaborators] Processing connection:', {
            connectionId: connection.id,
            isUser1,
            collaboratorId,
            collaboratorName,
            collaboratorAvatar
          });

          return {
            id: collaboratorId,
            name: collaboratorName || 'Unknown User',
            avatar: collaboratorAvatar || collaboratorName?.charAt(0) || 'U',
            status: 'active' as const,
          };
        });

        console.log('🤝 [usePinnedCollaborators] Final collaborators:', realCollaborators);
        setCollaborators(realCollaborators);
        setError(null);
      } catch (err) {
        console.error('❌ [usePinnedCollaborators] Failed to load connections:', err);
        setError(err instanceof Error ? err.message : 'Failed to load connections');
        
        // Show demo collaborators on error
        const demoCollaborators: PinnedCollaborator[] = [
          {
            id: 'demo-ted',
            name: 'Ted Sheets',
            avatar: 'https://i.pravatar.cc/150?u=ted.sheets',
            status: 'active',
          },
          {
            id: 'demo-alice',
            name: 'Alice Johnson',
            avatar: 'https://i.pravatar.cc/150?u=alice.johnson',
            status: 'active',
          },
        ];
        setCollaborators(demoCollaborators);
      } finally {
        setLoading(false);
      }
    };

    loadConnections();
  }, [currentUser?.uid]);

  return { collaborators, loading, error };
};
