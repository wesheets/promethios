/**
 * PanelManagerContext - Smart panel management system
 * 
 * Manages the opening and closing of panels with intelligent width calculation:
 * - 1 panel open = 100% width
 * - 2 panels open = 50/50 split
 * - Max 2 panels at once (closes oldest when opening third)
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

export type PanelType = 'collaboration' | 'social' | 'chat' | 'agent' | 'agent-command-center' | 'messaging';

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
    
    // For other panels, calculate based on available space
    const collaborationPanelOpen = openPanels.some(p => p.type === 'collaboration');
    const nonCollaborationPanels = openPanels.filter(p => p.type !== 'collaboration');
    
    if (nonCollaborationPanels.length === 0) return '0px';
    if (nonCollaborationPanels.length === 1) {
      // Single non-collaboration panel takes remaining space
      return collaborationPanelOpen ? 'calc(100vw - 384px)' : 'calc(100vw - 64px)'; // 320px + 64px nav
    }
    if (nonCollaborationPanels.length === 2) {
      // Two non-collaboration panels split remaining space 50/50
      const availableWidth = collaborationPanelOpen ? 'calc((100vw - 384px) / 2)' : 'calc((100vw - 64px) / 2)';
      return availableWidth;
    }
    
    return '50%'; // Fallback
  }, [openPanels]);

  const getAvailableWidth = useCallback(() => {
    const collaborationPanelOpen = openPanels.some(p => p.type === 'collaboration');
    const nonCollaborationPanels = openPanels.filter(p => p.type !== 'collaboration');
    
    let usedWidth = 64; // Left navigation width
    
    if (collaborationPanelOpen) {
      usedWidth += 320; // Fixed collaboration panel width
    }
    
    if (nonCollaborationPanels.length === 1) {
      usedWidth += 320; // Assume standard panel width for calculation
    } else if (nonCollaborationPanels.length === 2) {
      usedWidth += 640; // Two panels at 320px each
    }
    
    return `calc(100vw - ${usedWidth}px)`;
  }, [openPanels]);

  const value: PanelManagerContextType = {
    openPanels,
    openPanel,
    closePanel,
    closeAllPanels,
    isPanelOpen,
    getPanelWidth,
    getAvailableWidth
  };

  return (
    <PanelManagerContext.Provider value={value}>
      {children}
    </PanelManagerContext.Provider>
  );
};

export default PanelManagerContext;

