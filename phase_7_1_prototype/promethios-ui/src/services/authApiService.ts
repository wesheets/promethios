/**
 * Authentication API Service
 * 
 * Service for handling authenticated API calls with proper user scoping.
 * Generates API keys and includes authentication headers for all backend requests.
 */

import { User } from 'firebase/auth';

export interface AuthenticatedApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  user?: User | null;
  agentId?: string;
}

class AuthApiService {
  /**
   * Generate API key for authenticated requests
   * Format: promethios_{userId}_{agentId}_{timestamp}
   */
  generateApiKey(user: User | null, agentId: string = 'default'): string {
    if (!user) {
      throw new Error('User authentication required');
    }
    
    const userId = user.uid;
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Clean user ID and agent ID to ensure valid format
    const cleanUserId = userId.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanAgentId = agentId.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `promethios_${cleanUserId}_agent_${cleanAgentId}_${timestamp}`;
  }

  /**
   * Make authenticated API request with proper user scoping
   */
  async authenticatedFetch(url: string, options: AuthenticatedApiOptions = {}): Promise<Response> {
    const {
      method = 'GET',
      headers = {},
      body,
      user,
      agentId = 'default'
    } = options;

    if (!user) {
      throw new Error('User authentication required for API calls');
    }

    // Generate API key for this request
    const apiKey = this.generateApiKey(user, agentId);

    // Prepare headers with authentication
    const authenticatedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...headers
    };

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: authenticatedHeaders,
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return response;
    } catch (error) {
      console.error('Authenticated API request failed:', error);
      throw error;
    }
  }

  /**
   * Make authenticated GET request
   */
  async get(url: string, user: User | null, agentId?: string): Promise<any> {
    const response = await this.authenticatedFetch(url, {
      method: 'GET',
      user,
      agentId
    });
    
    return response.json();
  }

  /**
   * Make authenticated POST request
   */
  async post(url: string, data: any, user: User | null, agentId?: string): Promise<any> {
    const response = await this.authenticatedFetch(url, {
      method: 'POST',
      body: data,
      user,
      agentId
    });
    
    return response.json();
  }

  /**
   * Make authenticated PUT request
   */
  async put(url: string, data: any, user: User | null, agentId?: string): Promise<any> {
    const response = await this.authenticatedFetch(url, {
      method: 'PUT',
      body: data,
      user,
      agentId
    });
    
    return response.json();
  }

  /**
   * Make authenticated DELETE request
   */
  async delete(url: string, user: User | null, agentId?: string): Promise<any> {
    const response = await this.authenticatedFetch(url, {
      method: 'DELETE',
      user,
      agentId
    });
    
    return response.json();
  }

  /**
   * Get user's agent portfolio
   */
  async getUserAgents(user: User | null): Promise<any[]> {
    if (!user) {
      throw new Error('User authentication required');
    }

    try {
      const response = await this.get('/api/agent-metrics/agents', user);
      return response.agents || [];
    } catch (error) {
      console.error('Error fetching user agents:', error);
      return [];
    }
  }

  /**
   * Get user's violations with filtering
   */
  async getUserViolations(
    user: User | null, 
    filters: {
      agent_id?: string;
      severity?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<any> {
    if (!user) {
      throw new Error('User authentication required');
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const url = `/api/agent-metrics/violations${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get(url, user);
  }

  /**
   * Get user's agent metrics
   */
  async getUserMetrics(
    user: User | null,
    filters: {
      agent_id?: string;
      metric_type?: string;
      start_time?: string;
      end_time?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<any> {
    if (!user) {
      throw new Error('User authentication required');
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const url = `/api/agent-metrics/metrics${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get(url, user);
  }

  /**
   * Get user's analytics dashboard
   */
  async getUserAnalytics(
    user: User | null,
    filters: {
      agent_id?: string;
      period?: string;
      include_trends?: boolean;
      include_predictions?: boolean;
    } = {}
  ): Promise<any> {
    if (!user) {
      throw new Error('User authentication required');
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const url = `/api/agent-metrics/analytics${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get(url, user);
  }

  /**
   * Resolve a violation
   */
  async resolveViolation(
    user: User | null,
    violationId: string,
    resolutionData: {
      status: string;
      resolution_notes?: string;
      resolved_by?: string;
    }
  ): Promise<any> {
    if (!user) {
      throw new Error('User authentication required');
    }

    return this.put(`/api/agent-metrics/violations/${violationId}/resolve`, resolutionData, user);
  }

  /**
   * Assign violation to user
   */
  async assignViolation(
    user: User | null,
    violationId: string,
    assignmentData: {
      assigned_to: string;
      priority?: string;
      sla_deadline?: string;
    }
  ): Promise<any> {
    if (!user) {
      throw new Error('User authentication required');
    }

    return this.put(`/api/agent-metrics/violations/${violationId}/assign`, assignmentData, user);
  }
}

export const authApiService = new AuthApiService();
export default authApiService;

