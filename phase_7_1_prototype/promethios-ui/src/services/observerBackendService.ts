/**
 * Observer Backend Service
 * 
 * Service layer for integrating Observer Agent UI components with the real backend API.
 * Handles observer registration, AI suggestions, trust metrics, and context awareness.
 */

import { API_BASE_URL as CONFIG_API_BASE_URL } from '../config/api';

// API Configuration - now uses environment variables
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || CONFIG_API_BASE_URL;

// Types for Observer Backend Integration
export interface ObserverRegistration {
  observer_id: string;
  name: string;
  capabilities: string[];
  context_scope: 'page' | 'session' | 'global';
  ai_model: string;
  trust_threshold: number;
  metadata?: Record<string, any>;
}

export interface ObserverSuggestion {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'action_recommendation' | 'governance_alert';
  action?: {
    type: string;
    params: Record<string, any>;
  };
  source: string;
  relevance: number;
  timestamp: string;
  context_data?: Record<string, any>;
}

export interface TrustMetrics {
  observer_id: string;
  overall_trust_score: number;
  governance_compliance: number;
  suggestion_accuracy: number;
  context_awareness: number;
  user_feedback_score: number;
  last_updated: string;
  metrics_history: Array<Record<string, any>>;
}

export interface ContextAwareness {
  observer_id: string;
  current_page: string;
  user_actions: Array<Record<string, any>>;
  session_context: Record<string, any>;
  governance_context: Record<string, any>;
  insights: string[];
  last_updated: string;
}

export interface ObserverConfiguration {
  observer_id: string;
  is_active: boolean;
  suggestion_frequency: 'low' | 'moderate' | 'high';
  notification_types: string[];
  ai_model: string;
  trust_threshold: number;
  context_scope: 'page' | 'session' | 'global';
  preferences: Record<string, any>;
}

export interface SuggestionsResponse {
  observer_id: string;
  suggestions: ObserverSuggestion[];
  generated_at: string;
}

export interface RegistrationResponse {
  observer_id: string;
  status: string;
  capabilities: string[];
  trust_score: number;
  registered_at: string;
}

/**
 * Observer Backend Service Class
 */
export class ObserverBackendService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Register a new observer agent
   */
  async registerObserver(registration: ObserverRegistration): Promise<RegistrationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/observers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registration),
      });

      if (!response.ok) {
        throw new Error(`Failed to register observer: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error registering observer:', error);
      throw error;
    }
  }

  /**
   * Generate AI suggestions based on context
   */
  async generateSuggestions(
    observerId: string,
    contextData: Record<string, any>
  ): Promise<SuggestionsResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/observers/${observerId}/suggestions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contextData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate suggestions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating suggestions:', error);
      throw error;
    }
  }

  /**
   * Get recent suggestions for an observer
   */
  async getSuggestions(
    observerId: string,
    limit: number = 10,
    suggestionType?: string
  ): Promise<{ observer_id: string; suggestions: ObserverSuggestion[]; total_count: number }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      if (suggestionType) {
        params.append('suggestion_type', suggestionType);
      }

      const response = await fetch(
        `${this.baseUrl}/api/observers/${observerId}/suggestions?${params}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get suggestions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  }

  /**
   * Get trust metrics for an observer
   */
  async getTrustMetrics(observerId: string): Promise<TrustMetrics> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/observers/${observerId}/metrics`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get trust metrics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting trust metrics:', error);
      throw error;
    }
  }

  /**
   * Get context awareness data for an observer
   */
  async getContextAwareness(observerId: string): Promise<ContextAwareness> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/observers/${observerId}/context`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get context awareness: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting context awareness:', error);
      throw error;
    }
  }

  /**
   * Update context data for an observer
   */
  async updateContext(
    observerId: string,
    contextUpdate: Record<string, any>
  ): Promise<{ observer_id: string; status: string; updated_at: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/observers/${observerId}/context`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contextUpdate),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update context: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating context:', error);
      throw error;
    }
  }

  /**
   * Get observer configuration
   */
  async getObserverConfig(observerId: string): Promise<ObserverConfiguration> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/observers/${observerId}/config`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get observer config: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting observer config:', error);
      throw error;
    }
  }

  /**
   * Update observer configuration
   */
  async updateObserverConfig(
    observerId: string,
    config: ObserverConfiguration
  ): Promise<{ observer_id: string; status: string; updated_at: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/observers/${observerId}/config`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update observer config: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating observer config:', error);
      throw error;
    }
  }

  /**
   * List all observers
   */
  async listObservers(
    userId?: string,
    isActive?: boolean,
    limit: number = 50
  ): Promise<Array<Record<string, any>>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      if (userId) {
        params.append('user_id', userId);
      }

      if (isActive !== undefined) {
        params.append('is_active', isActive.toString());
      }

      const response = await fetch(
        `${this.baseUrl}/api/observers?${params}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list observers: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing observers:', error);
      throw error;
    }
  }

  /**
   * Delete an observer
   */
  async deleteObserver(observerId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/observers/${observerId}`,
        {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete observer: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting observer:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const observerBackendService = new ObserverBackendService();

