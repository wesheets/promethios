import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Mock data for now
const mockCollaborators = [
  {
    id: 'human-1',
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?u=john.doe',
    status: 'active' as const,
  },
  {
    id: 'human-2',
    name: 'Jane Smith',
    avatar: 'https://i.pravatar.cc/150?u=jane.smith',
    status: 'inactive' as const,
  },
];

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
    if (!currentUser) {
      setCollaborators(mockCollaborators);
      setLoading(false);
      return;
    }

    const fetchCollaborators = async () => {
      try {
        // In a real implementation, you would fetch this data from a service
        setCollaborators(mockCollaborators);
      } catch (err) {
        setError('Failed to load collaborators.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborators();
  }, [currentUser]);

  return { collaborators, loading, error };
};

