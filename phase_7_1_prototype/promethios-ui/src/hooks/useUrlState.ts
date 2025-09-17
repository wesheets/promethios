import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface CollaborationState {
  view?: 'social' | 'channels' | 'marketplace' | 'talent-hub' | 'workflows';
  profile?: string;
  agent?: string;
  channel?: string;
  thread?: string;
  job?: string;
  tool?: string;
  feed?: string;
  discovery?: boolean;
  post?: string;
  [key: string]: string | boolean | undefined;
}

/**
 * Hook for managing URL state in the collaboration panel
 * Automatically syncs panel state with browser URL for shareability and navigation
 */
export const useUrlState = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<CollaborationState>({});

  // Parse URL parameters into state
  const parseUrlState = useCallback((): CollaborationState => {
    const params = new URLSearchParams(location.search);
    const urlState: CollaborationState = {};
    
    // Parse all URL parameters
    params.forEach((value, key) => {
      if (value === 'true') {
        urlState[key] = true;
      } else if (value === 'false') {
        urlState[key] = false;
      } else {
        urlState[key] = value;
      }
    });
    
    return urlState;
  }, [location.search]);

  // Update URL when state changes
  const updateUrl = useCallback((newState: Partial<CollaborationState>, replace = true) => {
    const currentParams = new URLSearchParams(location.search);
    
    // Update parameters
    Object.entries(newState).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        currentParams.delete(key);
      } else {
        currentParams.set(key, String(value));
      }
    });
    
    const newUrl = `${location.pathname}?${currentParams.toString()}`;
    
    if (replace) {
      navigate(newUrl, { replace: true });
    } else {
      navigate(newUrl);
    }
  }, [location.pathname, location.search, navigate]);

  // Initialize state from URL on mount
  useEffect(() => {
    const urlState = parseUrlState();
    setState(urlState);
  }, [parseUrlState]);

  // Update state and URL
  const updateState = useCallback((newState: Partial<CollaborationState>, replace = true) => {
    setState(prev => ({ ...prev, ...newState }));
    updateUrl(newState, replace);
  }, [updateUrl]);

  // Clear specific state keys
  const clearState = useCallback((keys: string[]) => {
    const clearedState: Partial<CollaborationState> = {};
    keys.forEach(key => {
      clearedState[key] = undefined;
    });
    updateState(clearedState);
  }, [updateState]);

  // Generate public URL for sharing
  const generatePublicUrl = useCallback((entityType: string, entityId: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/ui/${state.view || 'social'}/${entityType}/${entityId}`;
  }, [state.view]);

  // Generate embedded URL for internal sharing
  const generateEmbeddedUrl = useCallback((newState: Partial<CollaborationState>): string => {
    const params = new URLSearchParams();
    const fullState = { ...state, ...newState };
    
    Object.entries(fullState).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
    
    const baseUrl = window.location.origin;
    return `${baseUrl}/ui/collaborations?${params.toString()}`;
  }, [state]);

  return {
    state,
    updateState,
    clearState,
    generatePublicUrl,
    generateEmbeddedUrl,
    parseUrlState
  };
};

