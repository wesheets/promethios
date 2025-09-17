import { CollaborationState } from '../hooks/useUrlState';

export interface NavigationOptions {
  replace?: boolean;
  openInNewTab?: boolean;
  forcePublic?: boolean;
}

/**
 * Service for handling smart navigation between embedded and public views
 * Automatically determines the best navigation method based on context
 */
export class NavigationService {
  private static instance: NavigationService;
  private updateStateCallback?: (state: Partial<CollaborationState>, replace?: boolean) => void;
  private getShareableUrlCallback?: (view: string, params?: Record<string, string>) => string;

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  /**
   * Register the state update callback from useUrlState hook
   */
  setUpdateStateCallback(callback: (state: Partial<CollaborationState>, replace?: boolean) => void) {
    this.updateStateCallback = callback;
  }

  /**
   * Register the getShareableUrl callback from useUrlState hook
   */
  setGetShareableUrlCallback(callback: (view: string, params?: Record<string, string>) => string) {
    this.getShareableUrlCallback = callback;
  }

  /**
   * Navigate to a user profile
   */
  navigateToProfile(userId: string, options: NavigationOptions = {}) {
    if (options.forcePublic || options.openInNewTab) {
      const url = `/ui/social/profile/${userId}`;
      if (options.openInNewTab) {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
      return;
    }

    // Navigate within embedded panel
    if (this.updateStateCallback) {
      this.updateStateCallback({
        view: 'social',
        profile: userId,
        // Clear other entity states
        agent: undefined,
        channel: undefined,
        post: undefined,
        discovery: undefined
      }, options.replace);
    }
  }

  /**
   * Navigate to an agent profile
   */
  navigateToAgent(agentId: string, options: NavigationOptions = {}) {
    if (options.forcePublic || options.openInNewTab) {
      const url = `/ui/social/agent/${agentId}`;
      if (options.openInNewTab) {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
      return;
    }

    if (this.updateStateCallback) {
      this.updateStateCallback({
        view: 'social',
        agent: agentId,
        profile: undefined,
        channel: undefined,
        post: undefined,
        discovery: undefined
      }, options.replace);
    }
  }

  /**
   * Navigate to agent command center
   */
  navigateToAgentCommandCenter(agentId: string, options: NavigationOptions = {}) {
    if (this.updateStateCallback) {
      this.updateStateCallback({
        view: 'agent-command-center',
        agent: agentId,
        profile: undefined,
        channel: undefined,
        post: undefined
      }, options.replace);
    }
  }

  /**
   * Navigate to a channel
   */
  navigateToChannel(channelId: string, threadId?: string, options: NavigationOptions = {}) {
    if (options.forcePublic || options.openInNewTab) {
      const url = threadId 
        ? `/ui/channels/${channelId}/thread/${threadId}`
        : `/ui/channels/${channelId}`;
      if (options.openInNewTab) {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
      return;
    }

    if (this.updateStateCallback) {
      this.updateStateCallback({
        view: 'channels',
        channel: channelId,
        thread: threadId,
        profile: undefined,
        agent: undefined,
        post: undefined
      }, options.replace);
    }
  }

  /**
   * Navigate to social feed
   */
  navigateToSocialFeed(feedType?: string, options: NavigationOptions = {}) {
    if (this.updateStateCallback) {
      this.updateStateCallback({
        view: 'social',
        feed: feedType || 'home',
        profile: undefined,
        agent: undefined,
        channel: undefined,
        post: undefined,
        discovery: undefined
      }, options.replace);
    }
  }

  /**
   * Navigate to discovery page
   */
  navigateToDiscovery(options: NavigationOptions = {}) {
    if (this.updateStateCallback) {
      this.updateStateCallback({
        view: 'social',
        discovery: true,
        profile: undefined,
        agent: undefined,
        channel: undefined,
        post: undefined,
        feed: undefined
      }, options.replace);
    }
  }

  /**
   * Navigate to marketplace
   */
  navigateToMarketplace(itemType?: string, itemId?: string, options: NavigationOptions = {}) {
    if (this.updateStateCallback) {
      const state: Partial<CollaborationState> = {
        view: 'marketplace',
        profile: undefined,
        agent: undefined,
        channel: undefined,
        post: undefined
      };

      if (itemType && itemId) {
        state[itemType] = itemId;
      }

      this.updateStateCallback(state, options.replace);
    }
  }

  /**
   * Navigate to talent hub
   */
  navigateToTalentHub(itemType?: string, itemId?: string, options: NavigationOptions = {}) {
    if (this.updateStateCallback) {
      const state: Partial<CollaborationState> = {
        view: 'talent-hub',
        profile: undefined,
        agent: undefined,
        channel: undefined,
        post: undefined
      };

      if (itemType && itemId) {
        state[itemType] = itemId;
      }

      this.updateStateCallback(state, options.replace);
    }
  }

  /**
   * Navigate to workflows
   */
  navigateToWorkflows(workflowId?: string, options: NavigationOptions = {}) {
    if (this.updateStateCallback) {
      this.updateStateCallback({
        view: 'workflows',
        workflow: workflowId,
        profile: undefined,
        agent: undefined,
        channel: undefined,
        post: undefined
      }, options.replace);
    }
  }

  /**
   * Generate shareable URLs
   */
  generateUrls(entityType: string, entityId: string, view?: string) {
    const baseUrl = window.location.origin;
    const publicUrl = `${baseUrl}/ui/${view || 'social'}/${entityType}/${entityId}`;
    const embeddedUrl = `${baseUrl}/ui/collaborations?view=${view || 'social'}&${entityType}=${entityId}`;
    
    return { publicUrl, embeddedUrl };
  }

  /**
   * Get shareable URL for a specific view and parameters
   */
  getShareableUrl(view: string, params: Record<string, string> = {}): string {
    // Use the callback from useUrlState if available for consistency
    if (this.getShareableUrlCallback) {
      return this.getShareableUrlCallback(view, params);
    }
    
    // Fallback to manual URL construction
    const baseUrl = window.location.origin;
    const searchParams = new URLSearchParams();
    
    searchParams.set('view', view);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });
    
    return `${baseUrl}/ui/collaborations?${searchParams.toString()}`;
  }
}

