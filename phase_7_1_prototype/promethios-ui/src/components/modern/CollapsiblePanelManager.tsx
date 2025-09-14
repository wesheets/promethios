/**
 * Collapsible Panel Manager
 * Manages collapsible panel states and transitions for the adaptive chat interface
 * Provides smooth animations and intelligent panel behavior
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Box, IconButton, Tooltip, Fade } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

// Panel configuration interface
interface PanelConfig {
  id: string;
  position: 'left' | 'right';
  defaultWidth: string;
  collapsedWidth: string;
  minWidth?: string;
  maxWidth?: string;
  title: string;
  icon?: React.ReactNode;
  canCollapse: boolean;
  autoCollapse?: boolean;
  priority: number; // Higher priority panels stay open longer
}

// Panel state interface
interface PanelState {
  isCollapsed: boolean;
  width: string;
  isVisible: boolean;
  isAnimating: boolean;
}

// Context interface
interface CollapsiblePanelContextValue {
  panels: Map<string, PanelState>;
  registerPanel: (config: PanelConfig) => void;
  unregisterPanel: (panelId: string) => void;
  togglePanel: (panelId: string) => void;
  collapsePanel: (panelId: string) => void;
  expandPanel: (panelId: string) => void;
  collapseAllPanels: () => void;
  expandAllPanels: () => void;
  getPanelState: (panelId: string) => PanelState | undefined;
  getLayoutConfig: () => LayoutConfig;
}

// Layout configuration
interface LayoutConfig {
  leftPanelWidth: string;
  rightPanelWidth: string;
  mainContentWidth: string;
  hasLeftPanel: boolean;
  hasRightPanel: boolean;
  totalPanels: number;
  activePanels: number;
}

// Create context
const CollapsiblePanelContext = createContext<CollapsiblePanelContextValue | null>(null);

// Provider props
interface CollapsiblePanelManagerProps {
  children: React.ReactNode;
  maxPanels?: number;
  autoCollapseThreshold?: number; // Screen width threshold for auto-collapse
  animationDuration?: number;
  onLayoutChange?: (config: LayoutConfig) => void;
}

// Provider component
export const CollapsiblePanelManager: React.FC<CollapsiblePanelManagerProps> = ({
  children,
  maxPanels = 2,
  autoCollapseThreshold = 768,
  animationDuration = 300,
  onLayoutChange
}) => {
  const [panelConfigs, setPanelConfigs] = useState<Map<string, PanelConfig>>(new Map());
  const [panelStates, setPanelStates] = useState<Map<string, PanelState>>(new Map());
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setScreenWidth(newWidth);
      
      // Auto-collapse panels on small screens
      if (newWidth < autoCollapseThreshold) {
        handleAutoCollapse();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [autoCollapseThreshold]);

  // Auto-collapse logic
  const handleAutoCollapse = useCallback(() => {
    setPanelStates(prev => {
      const newStates = new Map(prev);
      const configs = Array.from(panelConfigs.values());
      
      // Sort by priority (lower priority panels collapse first)
      const sortedConfigs = configs.sort((a, b) => a.priority - b.priority);
      
      let activePanels = 0;
      sortedConfigs.forEach(config => {
        if (config.autoCollapse && activePanels >= maxPanels) {
          const currentState = newStates.get(config.id);
          if (currentState && !currentState.isCollapsed) {
            newStates.set(config.id, {
              ...currentState,
              isCollapsed: true,
              width: config.collapsedWidth,
              isAnimating: true
            });
          }
        } else {
          activePanels++;
        }
      });
      
      return newStates;
    });
  }, [panelConfigs, maxPanels]);

  // Register a panel
  const registerPanel = useCallback((config: PanelConfig) => {
    setPanelConfigs(prev => new Map(prev.set(config.id, config)));
    setPanelStates(prev => new Map(prev.set(config.id, {
      isCollapsed: false,
      width: config.defaultWidth,
      isVisible: true,
      isAnimating: false
    })));
  }, []);

  // Unregister a panel
  const unregisterPanel = useCallback((panelId: string) => {
    setPanelConfigs(prev => {
      const newConfigs = new Map(prev);
      newConfigs.delete(panelId);
      return newConfigs;
    });
    setPanelStates(prev => {
      const newStates = new Map(prev);
      newStates.delete(panelId);
      return newStates;
    });
  }, []);

  // Toggle panel state
  const togglePanel = useCallback((panelId: string) => {
    const config = panelConfigs.get(panelId);
    const currentState = panelStates.get(panelId);
    
    if (!config || !currentState) return;

    setPanelStates(prev => {
      const newStates = new Map(prev);
      const newCollapsed = !currentState.isCollapsed;
      
      newStates.set(panelId, {
        ...currentState,
        isCollapsed: newCollapsed,
        width: newCollapsed ? config.collapsedWidth : config.defaultWidth,
        isAnimating: true
      });
      
      // Clear animation state after duration
      setTimeout(() => {
        setPanelStates(current => {
          const updatedStates = new Map(current);
          const state = updatedStates.get(panelId);
          if (state) {
            updatedStates.set(panelId, { ...state, isAnimating: false });
          }
          return updatedStates;
        });
      }, animationDuration);
      
      return newStates;
    });
  }, [panelConfigs, panelStates, animationDuration]);

  // Collapse specific panel
  const collapsePanel = useCallback((panelId: string) => {
    const currentState = panelStates.get(panelId);
    if (currentState && !currentState.isCollapsed) {
      togglePanel(panelId);
    }
  }, [panelStates, togglePanel]);

  // Expand specific panel
  const expandPanel = useCallback((panelId: string) => {
    const currentState = panelStates.get(panelId);
    if (currentState && currentState.isCollapsed) {
      togglePanel(panelId);
    }
  }, [panelStates, togglePanel]);

  // Collapse all panels
  const collapseAllPanels = useCallback(() => {
    panelStates.forEach((state, panelId) => {
      if (!state.isCollapsed) {
        collapsePanel(panelId);
      }
    });
  }, [panelStates, collapsePanel]);

  // Expand all panels
  const expandAllPanels = useCallback(() => {
    panelStates.forEach((state, panelId) => {
      if (state.isCollapsed) {
        expandPanel(panelId);
      }
    });
  }, [panelStates, expandPanel]);

  // Get panel state
  const getPanelState = useCallback((panelId: string) => {
    return panelStates.get(panelId);
  }, [panelStates]);

  // Calculate layout configuration
  const getLayoutConfig = useCallback((): LayoutConfig => {
    const leftPanels = Array.from(panelConfigs.values()).filter(p => p.position === 'left');
    const rightPanels = Array.from(panelConfigs.values()).filter(p => p.position === 'right');
    
    let leftPanelWidth = '0%';
    let rightPanelWidth = '0%';
    let activePanels = 0;
    
    // Calculate left panel width
    leftPanels.forEach(config => {
      const state = panelStates.get(config.id);
      if (state && state.isVisible && !state.isCollapsed) {
        leftPanelWidth = state.width;
        activePanels++;
      }
    });
    
    // Calculate right panel width
    rightPanels.forEach(config => {
      const state = panelStates.get(config.id);
      if (state && state.isVisible && !state.isCollapsed) {
        rightPanelWidth = state.width;
        activePanels++;
      }
    });
    
    // Calculate main content width
    const leftPercent = parseFloat(leftPanelWidth.replace('%', '')) || 0;
    const rightPercent = parseFloat(rightPanelWidth.replace('%', '')) || 0;
    const mainContentWidth = `${100 - leftPercent - rightPercent}%`;
    
    const config: LayoutConfig = {
      leftPanelWidth,
      rightPanelWidth,
      mainContentWidth,
      hasLeftPanel: leftPercent > 0,
      hasRightPanel: rightPercent > 0,
      totalPanels: panelConfigs.size,
      activePanels
    };
    
    return config;
  }, [panelConfigs, panelStates]);

  // Notify layout changes
  useEffect(() => {
    if (onLayoutChange) {
      const config = getLayoutConfig();
      onLayoutChange(config);
    }
  }, [panelStates, onLayoutChange, getLayoutConfig]);

  // Context value
  const contextValue: CollapsiblePanelContextValue = {
    panels: panelStates,
    registerPanel,
    unregisterPanel,
    togglePanel,
    collapsePanel,
    expandPanel,
    collapseAllPanels,
    expandAllPanels,
    getPanelState,
    getLayoutConfig
  };

  return (
    <CollapsiblePanelContext.Provider value={contextValue}>
      {children}
    </CollapsiblePanelContext.Provider>
  );
};

// Hook to use collapsible panel context
export const useCollapsiblePanels = (): CollapsiblePanelContextValue => {
  const context = useContext(CollapsiblePanelContext);
  if (!context) {
    throw new Error('useCollapsiblePanels must be used within a CollapsiblePanelManager');
  }
  return context;
};

// Collapsible Panel Component
interface CollapsiblePanelProps {
  config: PanelConfig;
  children: React.ReactNode;
  className?: string;
  sx?: any;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  config,
  children,
  className,
  sx
}) => {
  const { registerPanel, unregisterPanel, togglePanel, getPanelState } = useCollapsiblePanels();
  const panelState = getPanelState(config.id);

  // Register panel on mount
  useEffect(() => {
    registerPanel(config);
    return () => unregisterPanel(config.id);
  }, [config, registerPanel, unregisterPanel]);

  if (!panelState || !panelState.isVisible) {
    return null;
  }

  return (
    <Box
      className={className}
      sx={{
        width: panelState.width,
        height: '100%',
        transition: `width ${300}ms ease-in-out`,
        overflow: 'hidden',
        position: 'relative',
        ...sx
      }}
    >
      {/* Panel Header with Collapse Button */}
      {config.canCollapse && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            [config.position]: 8,
            zIndex: 10
          }}
        >
          <Tooltip title={panelState.isCollapsed ? `Expand ${config.title}` : `Collapse ${config.title}`}>
            <IconButton
              size="small"
              onClick={() => togglePanel(config.id)}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)'
                }
              }}
            >
              {config.position === 'left' ? (
                panelState.isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />
              ) : (
                panelState.isCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Panel Content */}
      <Fade in={!panelState.isCollapsed} timeout={300}>
        <Box sx={{ height: '100%', overflow: 'hidden' }}>
          {children}
        </Box>
      </Fade>

      {/* Collapsed State Indicator */}
      {panelState.isCollapsed && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(90deg)',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}
        >
          {config.title}
        </Box>
      )}
    </Box>
  );
};

export default CollapsiblePanelManager;

