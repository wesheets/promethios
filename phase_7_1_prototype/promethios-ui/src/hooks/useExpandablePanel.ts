/**
 * useExpandablePanel
 * 
 * Hook for managing the expandable left panel state, including
 * panel visibility, target routes, and chat interface responsiveness.
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface ExpandablePanelState {
  isOpen: boolean;
  targetRoute: string | null;
  panelWidth: string;
}

interface UseExpandablePanelReturn {
  // State
  isOpen: boolean;
  route: string | null; // Alias for targetRoute for compatibility
  targetRoute: string | null;
  width: string; // Alias for panelWidth for compatibility
  panelWidth: string;
  isChatActive: boolean;
  
  // Actions
  openPanel: (route: string, width?: string) => void;
  closePanel: () => void;
  togglePanel: (route: string, width?: string) => void;
  
  // Chat interface adjustments
  getChatInterfaceStyle: () => React.CSSProperties;
  shouldShowRightToolbar: boolean;
}

export const useExpandablePanel = (): UseExpandablePanelReturn => {
  const location = useLocation();
  const [panelState, setPanelState] = useState<ExpandablePanelState>({
    isOpen: false,
    targetRoute: null,
    panelWidth: '50%'
  });

  // Detect if chat interface is currently active
  const isChatActive = useCallback(() => {
    const chatRoutes = [
      '/ui/chat',
      '/ui/modern-chat', 
      '/ui/promethios-chat',
      '/chat'
    ];
    return chatRoutes.some(route => location.pathname.includes(route));
  }, [location.pathname]);

  // Calculate optimal panel width based on context
  const getOptimalWidth = useCallback((requestedWidth?: string) => {
    if (requestedWidth) return requestedWidth;
    
    // Context-aware width calculation
    const chatActive = isChatActive();
    const optimalWidth = chatActive ? '50%' : '100%';
    
    console.log(`🧠 Context-aware width: ${optimalWidth} (Chat active: ${chatActive})`);
    return optimalWidth;
  }, [isChatActive]);

  // Open panel with specific route
  const openPanel = useCallback((route: string, width?: string) => {
    const optimalWidth = getOptimalWidth(width);
    
    setPanelState({
      isOpen: true,
      targetRoute: route,
      panelWidth: optimalWidth
    });
    
    console.log(`🎯 Opening expandable panel: ${route} at ${optimalWidth} width`);
  }, [getOptimalWidth]);

  // Close panel
  const closePanel = useCallback(() => {
    setPanelState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  // Toggle panel (open if closed, close if open with same route)
  const togglePanel = useCallback((route: string, width: string = '50%') => {
    setPanelState(prev => {
      if (prev.isOpen && prev.targetRoute === route) {
        // Close if same route is already open
        return { ...prev, isOpen: false };
      } else {
        // Open with new route
        return {
          isOpen: true,
          targetRoute: route,
          panelWidth: width
        };
      }
    });
  }, []);

  // Calculate chat interface styles based on panel state
  const getChatInterfaceStyle = useCallback((): React.CSSProperties => {
    if (!panelState.isOpen) {
      return {
        marginLeft: 0,
        width: '100%'
      };
    }

    // Calculate the panel width in pixels (assuming 50% = half screen)
    const panelWidthValue = panelState.panelWidth.includes('%') 
      ? `calc(${panelState.panelWidth} + 64px)` // Add left nav width
      : `calc(${panelState.panelWidth} + 64px)`;

    return {
      marginLeft: panelWidthValue,
      width: `calc(100% - ${panelWidthValue})`,
      transition: 'margin-left 0.3s ease-in-out, width 0.3s ease-in-out'
    };
  }, [panelState.isOpen, panelState.panelWidth]);

  // Determine if right toolbar should be shown
  // (Only show when chat is the primary focus)
  const shouldShowRightToolbar = !panelState.isOpen;

  // Handle ESC key to close panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && panelState.isOpen) {
        closePanel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [panelState.isOpen, closePanel]);

  return {
    // State
    isOpen: panelState.isOpen,
    route: panelState.targetRoute, // Alias for compatibility
    targetRoute: panelState.targetRoute,
    width: panelState.panelWidth, // Alias for compatibility
    panelWidth: panelState.panelWidth,
    isChatActive: isChatActive(),
    
    // Actions
    openPanel,
    closePanel,
    togglePanel,
    
    // Chat interface adjustments
    getChatInterfaceStyle,
    shouldShowRightToolbar
  };
};

