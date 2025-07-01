/**
 * Integrations API Service
 * Production-ready API service for managing integrations, API keys, and webhooks
 */

export interface Integration {
  id: string;
  name: string;
  type: 'communication' | 'productivity' | 'development' | 'analytics' | 'storage' | 'security' | 'monitoring';
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  provider: string;
  connectedAt?: string;
  lastSync?: string;
  config: Record<string, any>;
  permissions: string[];
  webhookUrl?: string;
  apiKey?: string;
  features: string[];
  metadata?: Record<string, any>;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
  status: 'active' | 'revoked' | 'expired';
  usageCount?: number;
  rateLimit?: {
    requests: number;
    window: string;
  };
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'error';
  createdAt: string;
  lastTriggered?: string;
  secret: string;
  retryCount: number;
  headers: Record<string, string>;
  failureCount?: number;
  successCount?: number;
}

export interface MonitoringConfig {
  alertThresholds: {
    trustScore: number;
    errorRate: number;
    responseTime: number;
    violationCount: number;
  };
  refreshIntervals: {
    dashboard: number;
    metrics: number;
    alerts: number;
  };
  dataRetention: {
    metrics: number; // days
    logs: number; // days
    violations: number; // days
  };
  notifications: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
    inApp: boolean;
  };
  features: {
    realTimeUpdates: boolean;
    autoAcknowledgeAlerts: boolean;
    exportMetrics: boolean;
    customDashboards: boolean;
  };
}

class IntegrationsAPIService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5004';
    this.apiKey = localStorage.getItem('promethios_api_key') || '';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-API-Key': this.apiKey
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Integration Management
  async getIntegrations(): Promise<Integration[]> {
    return this.makeRequest<Integration[]>('/api/integrations');
  }

  async getIntegration(id: string): Promise<Integration> {
    return this.makeRequest<Integration>(`/api/integrations/${id}`);
  }

  async connectIntegration(id: string, config: Record<string, any>): Promise<Integration> {
    return this.makeRequest<Integration>(`/api/integrations/${id}/connect`, {
      method: 'POST',
      body: JSON.stringify({ config })
    });
  }

  async disconnectIntegration(id: string): Promise<void> {
    await this.makeRequest(`/api/integrations/${id}/disconnect`, {
      method: 'POST'
    });
  }

  async updateIntegrationConfig(id: string, config: Record<string, any>): Promise<Integration> {
    return this.makeRequest<Integration>(`/api/integrations/${id}/config`, {
      method: 'PUT',
      body: JSON.stringify({ config })
    });
  }

  async testIntegration(id: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/api/integrations/${id}/test`, {
      method: 'POST'
    });
  }

  async syncIntegration(id: string): Promise<void> {
    await this.makeRequest(`/api/integrations/${id}/sync`, {
      method: 'POST'
    });
  }

  // API Key Management
  async getApiKeys(): Promise<ApiKey[]> {
    return this.makeRequest<ApiKey[]>('/api/keys');
  }

  async createApiKey(data: {
    name: string;
    permissions: string[];
    expiresAt?: string;
    rateLimit?: { requests: number; window: string };
  }): Promise<ApiKey> {
    return this.makeRequest<ApiKey>('/api/keys', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateApiKey(id: string, data: {
    name?: string;
    permissions?: string[];
    expiresAt?: string;
  }): Promise<ApiKey> {
    return this.makeRequest<ApiKey>(`/api/keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async revokeApiKey(id: string): Promise<void> {
    await this.makeRequest(`/api/keys/${id}/revoke`, {
      method: 'POST'
    });
  }

  async regenerateApiKey(id: string): Promise<ApiKey> {
    return this.makeRequest<ApiKey>(`/api/keys/${id}/regenerate`, {
      method: 'POST'
    });
  }

  async getApiKeyUsage(id: string): Promise<{
    totalRequests: number;
    requestsToday: number;
    lastUsed: string;
    topEndpoints: Array<{ endpoint: string; count: number }>;
  }> {
    return this.makeRequest(`/api/keys/${id}/usage`);
  }

  // Webhook Management
  async getWebhooks(): Promise<Webhook[]> {
    return this.makeRequest<Webhook[]>('/api/webhooks');
  }

  async createWebhook(data: {
    name: string;
    url: string;
    events: string[];
    secret?: string;
    headers?: Record<string, string>;
  }): Promise<Webhook> {
    return this.makeRequest<Webhook>('/api/webhooks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateWebhook(id: string, data: {
    name?: string;
    url?: string;
    events?: string[];
    secret?: string;
    headers?: Record<string, string>;
    status?: 'active' | 'inactive';
  }): Promise<Webhook> {
    return this.makeRequest<Webhook>(`/api/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.makeRequest(`/api/webhooks/${id}`, {
      method: 'DELETE'
    });
  }

  async testWebhook(id: string): Promise<{ success: boolean; response: any }> {
    return this.makeRequest(`/api/webhooks/${id}/test`, {
      method: 'POST'
    });
  }

  async getWebhookLogs(id: string, limit: number = 50): Promise<Array<{
    id: string;
    timestamp: string;
    event: string;
    status: 'success' | 'failed' | 'retry';
    responseCode?: number;
    responseTime: number;
    error?: string;
  }>> {
    return this.makeRequest(`/api/webhooks/${id}/logs?limit=${limit}`);
  }

  // Monitoring Configuration
  async getMonitoringConfig(): Promise<MonitoringConfig> {
    return this.makeRequest<MonitoringConfig>('/api/monitoring/config');
  }

  async updateMonitoringConfig(config: Partial<MonitoringConfig>): Promise<MonitoringConfig> {
    return this.makeRequest<MonitoringConfig>('/api/monitoring/config', {
      method: 'PUT',
      body: JSON.stringify(config)
    });
  }

  async resetMonitoringConfig(): Promise<MonitoringConfig> {
    return this.makeRequest<MonitoringConfig>('/api/monitoring/config/reset', {
      method: 'POST'
    });
  }

  async getMonitoringStatus(): Promise<{
    isEnabled: boolean;
    connectedAgents: number;
    activeAlerts: number;
    dataRetentionUsage: {
      metrics: { used: number; total: number };
      logs: { used: number; total: number };
      violations: { used: number; total: number };
    };
  }> {
    return this.makeRequest('/api/monitoring/status');
  }

  // Extension Management
  async getExtensions(): Promise<Array<{
    id: string;
    name: string;
    version: string;
    status: 'enabled' | 'disabled' | 'error';
    description: string;
    capabilities: string[];
    config: Record<string, any>;
  }>> {
    return this.makeRequest('/api/extensions');
  }

  async enableExtension(id: string, config?: Record<string, any>): Promise<void> {
    await this.makeRequest(`/api/extensions/${id}/enable`, {
      method: 'POST',
      body: JSON.stringify({ config })
    });
  }

  async disableExtension(id: string): Promise<void> {
    await this.makeRequest(`/api/extensions/${id}/disable`, {
      method: 'POST'
    });
  }

  async updateExtensionConfig(id: string, config: Record<string, any>): Promise<void> {
    await this.makeRequest(`/api/extensions/${id}/config`, {
      method: 'PUT',
      body: JSON.stringify({ config })
    });
  }

  // System Health
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    services: Array<{
      name: string;
      status: 'up' | 'down' | 'degraded';
      responseTime: number;
      lastCheck: string;
    }>;
    uptime: number;
    version: string;
  }> {
    return this.makeRequest('/api/health');
  }

  // Backup and Export
  async exportConfiguration(): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/export/config`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-Key': this.apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to export configuration');
    }
    
    return response.blob();
  }

  async importConfiguration(file: File): Promise<{
    success: boolean;
    imported: {
      integrations: number;
      apiKeys: number;
      webhooks: number;
      monitoringConfig: boolean;
    };
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('config', file);
    
    const response = await fetch(`${this.baseUrl}/api/import/config`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-Key': this.apiKey
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to import configuration');
    }
    
    return response.json();
  }
}

export const integrationsAPI = new IntegrationsAPIService();
export default integrationsAPI;

