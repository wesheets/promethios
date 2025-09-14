/**
 * WorkspaceLayoutManager - Manages panel states, responsive calculations, and layout persistence
 * Handles dynamic width calculations and smart layout suggestions
 */

export interface LayoutState {
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  leftPanelWidth: number;
  rightPanelWidth: number;
  mainChatWidth: number;
  screenWidth: number;
  layoutMode: 'standard' | 'left-collapsed' | 'right-collapsed' | 'focus-mode' | 'multi-agent' | 'multi-human' | 'multi-party';
}

export interface ParticipantCounts {
  agents: number;
  humans: number;
  total: number;
}

export class WorkspaceLayoutManager {
  private static instance: WorkspaceLayoutManager;
  private layoutState: LayoutState;
  private listeners: ((state: LayoutState) => void)[] = [];

  // Layout constants
  private readonly EXPANDED_PANEL_WIDTH = 15; // percentage
  private readonly COLLAPSED_PANEL_WIDTH = 3; // percentage
  private readonly MIN_CHAT_WIDTH = 50; // percentage
  private readonly MOBILE_BREAKPOINT = 768; // pixels
  private readonly TABLET_BREAKPOINT = 1024; // pixels

  private constructor() {
    this.layoutState = this.getInitialState();
    this.loadPersistedState();
    this.setupResizeListener();
  }

  public static getInstance(): WorkspaceLayoutManager {
    if (!WorkspaceLayoutManager.instance) {
      WorkspaceLayoutManager.instance = new WorkspaceLayoutManager();
    }
    return WorkspaceLayoutManager.instance;
  }

  private getInitialState(): LayoutState {
    return {
      leftPanelCollapsed: false,
      rightPanelCollapsed: false,
      leftPanelWidth: this.EXPANDED_PANEL_WIDTH,
      rightPanelWidth: this.EXPANDED_PANEL_WIDTH,
      mainChatWidth: 70,
      screenWidth: window.innerWidth,
      layoutMode: 'standard'
    };
  }

  private setupResizeListener(): void {
    window.addEventListener('resize', () => {
      this.updateScreenWidth(window.innerWidth);
    });
  }

  private updateScreenWidth(width: number): void {
    this.layoutState.screenWidth = width;
    this.recalculateLayout();
    this.notifyListeners();
  }

  public calculateOptimalLayout(participantCounts: ParticipantCounts): LayoutState {
    const { agents, humans } = participantCounts;
    const isMobile = this.layoutState.screenWidth < this.MOBILE_BREAKPOINT;
    const isTablet = this.layoutState.screenWidth < this.TABLET_BREAKPOINT;

    // Mobile: Always collapsed panels
    if (isMobile) {
      return {
        ...this.layoutState,
        leftPanelCollapsed: true,
        rightPanelCollapsed: true,
        leftPanelWidth: this.COLLAPSED_PANEL_WIDTH,
        rightPanelWidth: this.COLLAPSED_PANEL_WIDTH,
        mainChatWidth: 94,
        layoutMode: 'focus-mode'
      };
    }

    // Tablet: Selective panel display
    if (isTablet) {
      if (agents >= 2 && humans >= 2) {
        // Multi-party: Show both but smaller
        return {
          ...this.layoutState,
          leftPanelCollapsed: false,
          rightPanelCollapsed: false,
          leftPanelWidth: 12,
          rightPanelWidth: 12,
          mainChatWidth: 76,
          layoutMode: 'multi-party'
        };
      } else if (agents >= 2) {
        // Multi-agent: Show left only
        return {
          ...this.layoutState,
          leftPanelCollapsed: false,
          rightPanelCollapsed: true,
          leftPanelWidth: this.EXPANDED_PANEL_WIDTH,
          rightPanelWidth: this.COLLAPSED_PANEL_WIDTH,
          mainChatWidth: 82,
          layoutMode: 'multi-agent'
        };
      } else if (humans >= 2) {
        // Multi-human: Show right only
        return {
          ...this.layoutState,
          leftPanelCollapsed: true,
          rightPanelCollapsed: false,
          leftPanelWidth: this.COLLAPSED_PANEL_WIDTH,
          rightPanelWidth: this.EXPANDED_PANEL_WIDTH,
          mainChatWidth: 82,
          layoutMode: 'multi-human'
        };
      }
    }

    // Desktop: Full layout options
    if (agents < 2 && humans < 2) {
      // 1:1 Chat: Hide both panels
      return {
        ...this.layoutState,
        leftPanelCollapsed: true,
        rightPanelCollapsed: true,
        leftPanelWidth: this.COLLAPSED_PANEL_WIDTH,
        rightPanelWidth: this.COLLAPSED_PANEL_WIDTH,
        mainChatWidth: 94,
        layoutMode: 'standard'
      };
    } else if (agents >= 2 && humans >= 2) {
      // Multi-party: Show both panels
      return {
        ...this.layoutState,
        leftPanelCollapsed: false,
        rightPanelCollapsed: false,
        leftPanelWidth: this.EXPANDED_PANEL_WIDTH,
        rightPanelWidth: this.EXPANDED_PANEL_WIDTH,
        mainChatWidth: 70,
        layoutMode: 'multi-party'
      };
    } else if (agents >= 2) {
      // Multi-agent: Show left panel
      return {
        ...this.layoutState,
        leftPanelCollapsed: false,
        rightPanelCollapsed: true,
        leftPanelWidth: this.EXPANDED_PANEL_WIDTH,
        rightPanelWidth: this.COLLAPSED_PANEL_WIDTH,
        mainChatWidth: 82,
        layoutMode: 'multi-agent'
      };
    } else if (humans >= 2) {
      // Multi-human: Show right panel
      return {
        ...this.layoutState,
        leftPanelCollapsed: true,
        rightPanelCollapsed: false,
        leftPanelWidth: this.COLLAPSED_PANEL_WIDTH,
        rightPanelWidth: this.EXPANDED_PANEL_WIDTH,
        mainChatWidth: 82,
        layoutMode: 'multi-human'
      };
    }

    return this.layoutState;
  }

  public toggleLeftPanel(): void {
    this.layoutState.leftPanelCollapsed = !this.layoutState.leftPanelCollapsed;
    this.recalculateLayout();
    this.persistState();
    this.notifyListeners();
  }

  public toggleRightPanel(): void {
    this.layoutState.rightPanelCollapsed = !this.layoutState.rightPanelCollapsed;
    this.recalculateLayout();
    this.persistState();
    this.notifyListeners();
  }

  public setLayoutMode(mode: LayoutState['layoutMode']): void {
    this.layoutState.layoutMode = mode;
    this.applyLayoutMode(mode);
    this.persistState();
    this.notifyListeners();
  }

  private applyLayoutMode(mode: LayoutState['layoutMode']): void {
    switch (mode) {
      case 'focus-mode':
        this.layoutState.leftPanelCollapsed = true;
        this.layoutState.rightPanelCollapsed = true;
        break;
      case 'left-collapsed':
        this.layoutState.leftPanelCollapsed = true;
        this.layoutState.rightPanelCollapsed = false;
        break;
      case 'right-collapsed':
        this.layoutState.leftPanelCollapsed = false;
        this.layoutState.rightPanelCollapsed = true;
        break;
      case 'multi-party':
        this.layoutState.leftPanelCollapsed = false;
        this.layoutState.rightPanelCollapsed = false;
        break;
      default:
        // Keep current state
        break;
    }
    this.recalculateLayout();
  }

  private recalculateLayout(): void {
    const leftWidth = this.layoutState.leftPanelCollapsed 
      ? this.COLLAPSED_PANEL_WIDTH 
      : this.EXPANDED_PANEL_WIDTH;
    
    const rightWidth = this.layoutState.rightPanelCollapsed 
      ? this.COLLAPSED_PANEL_WIDTH 
      : this.EXPANDED_PANEL_WIDTH;

    this.layoutState.leftPanelWidth = leftWidth;
    this.layoutState.rightPanelWidth = rightWidth;
    this.layoutState.mainChatWidth = Math.max(
      100 - leftWidth - rightWidth,
      this.MIN_CHAT_WIDTH
    );
  }

  public getLayoutSuggestions(participantCounts: ParticipantCounts): string[] {
    const suggestions: string[] = [];
    const { agents, humans } = participantCounts;

    if (agents >= 3 && !this.layoutState.leftPanelCollapsed) {
      suggestions.push('Consider collapsing the AI panel to focus on conversation');
    }

    if (humans >= 3 && !this.layoutState.rightPanelCollapsed) {
      suggestions.push('Collapse the participants panel for more chat space');
    }

    if (this.layoutState.screenWidth < this.TABLET_BREAKPOINT && 
        (!this.layoutState.leftPanelCollapsed || !this.layoutState.rightPanelCollapsed)) {
      suggestions.push('Switch to focus mode for better mobile experience');
    }

    if (agents < 2 && humans < 2 && 
        (!this.layoutState.leftPanelCollapsed || !this.layoutState.rightPanelCollapsed)) {
      suggestions.push('Hide panels for clean 1:1 chat experience');
    }

    return suggestions;
  }

  public subscribe(listener: (state: LayoutState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.layoutState }));
  }

  private persistState(): void {
    try {
      localStorage.setItem('promethios-layout-state', JSON.stringify({
        leftPanelCollapsed: this.layoutState.leftPanelCollapsed,
        rightPanelCollapsed: this.layoutState.rightPanelCollapsed,
        layoutMode: this.layoutState.layoutMode
      }));
    } catch (error) {
      console.warn('Failed to persist layout state:', error);
    }
  }

  private loadPersistedState(): void {
    try {
      const saved = localStorage.getItem('promethios-layout-state');
      if (saved) {
        const state = JSON.parse(saved);
        this.layoutState.leftPanelCollapsed = state.leftPanelCollapsed ?? false;
        this.layoutState.rightPanelCollapsed = state.rightPanelCollapsed ?? false;
        this.layoutState.layoutMode = state.layoutMode ?? 'standard';
        this.recalculateLayout();
      }
    } catch (error) {
      console.warn('Failed to load persisted layout state:', error);
    }
  }

  public getLayoutState(): LayoutState {
    return { ...this.layoutState };
  }

  public updateParticipants(participantCounts: ParticipantCounts): void {
    const optimalLayout = this.calculateOptimalLayout(participantCounts);
    
    // Only auto-adjust if user hasn't manually set preferences
    const hasManualPreferences = this.hasManualLayoutPreferences();
    if (!hasManualPreferences) {
      this.layoutState = optimalLayout;
      this.persistState();
      this.notifyListeners();
    }
  }

  private hasManualLayoutPreferences(): boolean {
    // Check if user has manually toggled panels recently
    const lastInteraction = localStorage.getItem('promethios-last-manual-layout');
    if (!lastInteraction) return false;
    
    const timeSinceLastInteraction = Date.now() - parseInt(lastInteraction);
    return timeSinceLastInteraction < 5 * 60 * 1000; // 5 minutes
  }

  public recordManualInteraction(): void {
    localStorage.setItem('promethios-last-manual-layout', Date.now().toString());
  }
}

export default WorkspaceLayoutManager;

