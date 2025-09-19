/**
 * PanelManagerContext - Smart panel management system
 * 
 * Manages the opening and closing of panels with intelligent width calculation:
 * - 1 panel open = 100% width
 * - 2 panels open = 50/50 split
 * - Max 2 panels at once (closes oldest when opening third)
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

export type PanelType = 'collaboration' | 'social' | 'chat' | 'agent' | 'agent-command-center' | 'messaging' | 'talent-hub' | 'marketplace';

interface PanelState {
  id: string;
  type: PanelType;
  title: string;
  openedAt: number;
}

interface PanelManagerContextType {
  openPanels: PanelState[];
  openPanel: (id: string, type: PanelType, title: string) => void;
  closePanel: (id: string) => void;
  closeAllPanels: () => void;
  isPanelOpen: (id: string) => boolean;
  getPanelWidth: (id: string) => string;
  getAvailableWidth: () => string;
  getPanelPosition: (id: string) => string;
  getDrawerOrder: () => PanelState[];
}

const PanelManagerContext = createContext<PanelManagerContextType | undefined>(undefined);

export const usePanelManager = () => {
  const context = useContext(PanelManagerContext);
  if (!context) {
    throw new Error('usePanelManager must be used within a PanelManagerProvider');
  }
  return context;
};

interface PanelManagerProviderProps {
  children: React.ReactNode;
}

export const PanelManagerProvider: React.FC<PanelManagerProviderProps> = ({ children }) => {
  const [openPanels, setOpenPanels] = useState<PanelState[]>([]);

  const openPanel = useCallback((id: string, type: PanelType, title: string) => {
    setOpenPanels(prev => {
      // Check if panel is already open
      const existingIndex = prev.findIndex(panel => panel.id === id);
      if (existingIndex !== -1) {
        // Panel already open, just update timestamp
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], openedAt: Date.now() };
        return updated;
      }

      // Add new panel
      const newPanel: PanelState = {
        id,
        type,
        title,
        openedAt: Date.now()
      };

      let newPanels = [...prev, newPanel];

      // If we now have more than 2 panels, close the oldest one
      if (newPanels.length > 2) {
        // Sort by openedAt and remove the oldest
        newPanels.sort((a, b) => a.openedAt - b.openedAt);
        newPanels = newPanels.slice(1); // Remove the first (oldest) panel
      }

      return newPanels;
    });
  }, []);

  const closePanel = useCallback((id: string) => {
    setOpenPanels(prev => prev.filter(panel => panel.id !== id));
  }, []);

  const closeAllPanels = useCallback(() => {
    setOpenPanels([]);
  }, []);

  const isPanelOpen = useCallback((id: string) => {
    return openPanels.some(panel => panel.id === id);
  }, [openPanels]);

  const getPanelWidth = useCallback((id: string) => {
    const panel = openPanels.find(p => p.id === id);
    if (!panel) return '0px';
    
    // Collaboration panel always has fixed width
    if (panel.type === 'collaboration') {
      return '320px';
    }
    
    // For stacking drawer system: drawers take full available space
    const collaborationPanelOpen = openPanels.some(p => p.type === 'collaboration');
    const nonCollaborationPanels = openPanels.filter(p => p.type !== 'collaboration');
    const collaborationWidth = collaborationPanelOpen ? 320 : 0;
    
    if (nonCollaborationPanels.length === 0) return '0px';
    if (nonCollaborationPanels.length === 1) {
      // Single drawer takes 100% of available space
      return `calc(100vw - ${collaborationWidth}px)`;
    }
    if (nonCollaborationPanels.length === 2) {
      // Two drawers split available space 50/50
      return `calc((100vw - ${collaborationWidth}px) / 2)`;
    }
    
    return '50%'; // Fallback
  }, [openPanels]);

  const getAvailableWidth = useCallback(() => {
    const collaborationPanelOpen = openPanels.some(p => p.type === 'collaboration');
    const collaborationWidth = collaborationPanelOpen ? 320 : 0;
    return `calc(100vw - ${collaborationWidth}px)`;
  }, [openPanels]);

  // New helper functions for stacking drawer system
  const getPanelPosition = useCallback((id: string) => {
    const panel = openPanels.find(p => p.id === id);
    if (!panel) return '0px';
    
    // Collaboration panel always at left edge
    if (panel.type === 'collaboration') {
      return '0px';
    }
    
    // For drawers, calculate position based on collaboration panel and drawer order
    const collaborationPanelOpen = openPanels.some(p => p.type === 'collaboration');
    const collaborationWidth = collaborationPanelOpen ? 320 : 0;
    const nonCollaborationPanels = openPanels.filter(p => p.type !== 'collaboration');
    
    // Sort by openedAt to determine order (oldest first)
    const sortedDrawers = nonCollaborationPanels.sort((a, b) => a.openedAt - b.openedAt);
    const drawerIndex = sortedDrawers.findIndex(p => p.id === id);
    
    if (drawerIndex === 0) {
      // First drawer starts after collaboration panel
      return `${collaborationWidth}px`;
    } else if (drawerIndex === 1) {
      // Second drawer starts at 50% of available space
      return `calc(${collaborationWidth}px + (100vw - ${collaborationWidth}px) / 2)`;
    }
    
    return `${collaborationWidth}px`; // Fallback
  }, [openPanels]);

  const getDrawerOrder = useCallback(() => {
    const nonCollaborationPanels = openPanels.filter(p => p.type !== 'collaboration');
    return nonCollaborationPanels.sort((a, b) => a.openedAt - b.openedAt);
  }, [openPanels]);

  const value: PanelManagerContextType = {
    openPanels,
    openPanel,
    closePanel,
    closeAllPanels,
    isPanelOpen,
    getPanelWidth,
    getAvailableWidth,
    getPanelPosition,
    getDrawerOrder
  };

  return (
    <PanelManagerContext.Provider value={value}>
      {children}
    </PanelManagerContext.Provider>
  );
};

export default PanelManagerContext;

