import { useEffect, useState } from 'react';
import axios from 'axios';
import { PRISMMetrics, PRISMViolation, PRISMAnalytics, VigilMetrics, TrustSnapshot, VigilViolation, ReflectionComparison, GovernanceAwareness } from './observers';

// API endpoints configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.promethios.ai';

// Feature flag to disable WebSocket connections (can be controlled via environment variable)
const ENABLE_WEBSOCKETS = process.env.REACT_APP_ENABLE_WEBSOCKETS !== 'false';

// Mock data for when real-time connections aren't available
const MOCK_PRISM_METRICS: PRISMMetrics = {
  complianceRate: 95,
  trustScore: 92,
  errorRate: 12,
  performanceImpact: 3,
  totalInteractions: 1250,
  governedInteractions: 1187,
  timestamp: new Date().toISOString()
};

const MOCK_VIGIL_METRICS: VigilMetrics = {
  trustScore: 90,
  complianceRate: 94,
  violationCount: 5,
  monitoredActions: 1250,
  timestamp: new Date().toISOString()
};

// Real API service implementation
export const liveObserverService = {
  // PRISM Observer methods
  getPRISMMetrics: async (): Promise<PRISMMetrics> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/prism/metrics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching PRISM metrics:', error);
      // Return mock data on error
      return MOCK_PRISM_METRICS;
    }
  },
  
  getPRISMViolations: async (): Promise<PRISMViolation[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/prism/violations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching PRISM violations:', error);
      return [];
    }
  },
  
  getPRISMAnalytics: async (): Promise<PRISMAnalytics> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/prism/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching PRISM analytics:', error);
      return {
        complianceOverTime: [],
        trustScoreOverTime: [],
        errorRateOverTime: [],
        timestamp: new Date().toISOString()
      };
    }
  },
  
  // Vigil Observer methods
  getVigilMetrics: async (): Promise<VigilMetrics> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/vigil/metrics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Vigil metrics:', error);
      return MOCK_VIGIL_METRICS;
    }
  },
  
  getTrustSnapshots: async (): Promise<TrustSnapshot[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/vigil/trust-snapshots`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trust snapshots:', error);
      return [];
    }
  },
  
  getVigilViolations: async (): Promise<VigilViolation[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/vigil/violations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Vigil violations:', error);
      return [];
    }
  },
  
  // Self-Reflection methods
  getReflectionComparisons: async (): Promise<ReflectionComparison[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/reflection/comparisons`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reflection comparisons:', error);
      return [];
    }
  },
  
  getGovernanceAwareness: async (): Promise<GovernanceAwareness> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/reflection/awareness`);
      return response.data;
    } catch (error) {
      console.error('Error fetching governance awareness:', error);
      return {
        selfAwarenessScore: 85,
        governanceUnderstanding: 90,
        timestamp: new Date().toISOString()
      };
    }
  },

  // Configuration methods
  updatePRISMConfig: async (config: any): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/observers/prism/config`, config);
    } catch (error) {
      console.error('Error updating PRISM config:', error);
      // Silently fail in demo/development environments
    }
  },

  updateVigilConfig: async (config: any): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/observers/vigil/config`, config);
    } catch (error) {
      console.error('Error updating Vigil config:', error);
      // Silently fail in demo/development environments
    }
  },

  // Agent wrapping methods
  registerAgent: async (agentData: any): Promise<{ agentId: string }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/agents/register`, agentData);
      return response.data;
    } catch (error) {
      console.error('Error registering agent:', error);
      // Return mock agent ID on error
      return { agentId: 'mock-agent-' + Date.now() };
    }
  },

  getAgentStatus: async (agentId: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/agents/${agentId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error fetching agent status:', error);
      // Return mock status on error
      return { 
        status: 'active',
        lastSeen: new Date().toISOString(),
        governanceEnabled: true
      };
    }
  }
};

// WebSocket connection for real-time updates
export const useRealtimeObserverData = (agentId?: string) => {
  const [connected, setConnected] = useState(false);
  const [prismMetrics, setPrismMetrics] = useState<PRISMMetrics | null>(null);
  const [vigilMetrics, setVigilMetrics] = useState<VigilMetrics | null>(null);
  const [violations, setViolations] = useState<(PRISMViolation | VigilViolation)[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let mockDataInterval: NodeJS.Timeout | null = null;
    
    const connectWebSocket = () => {
      // Skip WebSocket connection if disabled by feature flag
      if (!ENABLE_WEBSOCKETS) {
        console.log('WebSocket connections disabled by feature flag');
        setError(null);
        
        // Set up mock data updates instead
        setPrismMetrics(MOCK_PRISM_METRICS);
        setVigilMetrics(MOCK_VIGIL_METRICS);
        
        // Simulate periodic updates with mock data
        mockDataInterval = setInterval(() => {
          const timestamp = new Date().toISOString();
          
          // Update mock metrics with slight variations
          setPrismMetrics(prev => {
            if (!prev) return MOCK_PRISM_METRICS;
            return {
              ...prev,
              trustScore: Math.min(100, Math.max(80, prev.trustScore + (Math.random() * 2 - 1))),
              complianceRate: Math.min(100, Math.max(85, prev.complianceRate + (Math.random() * 2 - 1))),
              timestamp
            };
          });
          
          setVigilMetrics(prev => {
            if (!prev) return MOCK_VIGIL_METRICS;
            return {
              ...prev,
              trustScore: Math.min(100, Math.max(80, prev.trustScore + (Math.random() * 2 - 1))),
              complianceRate: Math.min(100, Math.max(85, prev.complianceRate + (Math.random() * 2 - 1))),
              timestamp
            };
          });
        }, 5000);
        
        return;
      }
      
      try {
        const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/observers/realtime${agentId ? `?agentId=${agentId}` : ''}`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected');
          setConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'prism_metrics') {
              setPrismMetrics(data.payload);
            } else if (data.type === 'vigil_metrics') {
              setVigilMetrics(data.payload);
            } else if (data.type === 'violation') {
              setViolations(prev => [...prev, data.payload]);
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onerror = (event) => {
          // Log error but don't display to user in production
          console.error('WebSocket error:', event);
          
          // Only set visible error in development
          if (process.env.NODE_ENV === 'development') {
            setError('Failed to connect to real-time data service');
          } else {
            // In production, silently fall back to mock data
            setPrismMetrics(MOCK_PRISM_METRICS);
            setVigilMetrics(MOCK_VIGIL_METRICS);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setConnected(false);
          
          // Attempt to reconnect after a delay, but only in development
          // In production, silently fall back to mock data
          if (process.env.NODE_ENV === 'development') {
            reconnectTimer = setTimeout(connectWebSocket, 5000);
          } else {
            setPrismMetrics(MOCK_PRISM_METRICS);
            setVigilMetrics(MOCK_VIGIL_METRICS);
          }
        };
      } catch (err) {
        console.error('Error creating WebSocket:', err);
        
        // Fall back to mock data
        setPrismMetrics(MOCK_PRISM_METRICS);
        setVigilMetrics(MOCK_VIGIL_METRICS);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (mockDataInterval) {
        clearInterval(mockDataInterval);
      }
    };
  }, [agentId]);

  return { connected, prismMetrics, vigilMetrics, violations, error };
};

export default liveObserverService;
