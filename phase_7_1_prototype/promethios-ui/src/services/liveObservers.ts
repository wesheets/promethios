import { useEffect, useState } from 'react';
import axios from 'axios';
import { PRISMMetrics, PRISMViolation, PRISMAnalytics, VigilMetrics, TrustSnapshot, VigilViolation, ReflectionComparison, GovernanceAwareness } from './observers';

// API endpoints configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.promethios.ai';

// Real API service implementation
export const liveObserverService = {
  // PRISM Observer methods
  getPRISMMetrics: async (): Promise<PRISMMetrics> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/prism/metrics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching PRISM metrics:', error);
      throw error;
    }
  },
  
  getPRISMViolations: async (): Promise<PRISMViolation[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/prism/violations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching PRISM violations:', error);
      throw error;
    }
  },
  
  getPRISMAnalytics: async (): Promise<PRISMAnalytics> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/prism/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching PRISM analytics:', error);
      throw error;
    }
  },
  
  // Vigil Observer methods
  getVigilMetrics: async (): Promise<VigilMetrics> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/vigil/metrics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Vigil metrics:', error);
      throw error;
    }
  },
  
  getTrustSnapshots: async (): Promise<TrustSnapshot[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/vigil/trust-snapshots`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trust snapshots:', error);
      throw error;
    }
  },
  
  getVigilViolations: async (): Promise<VigilViolation[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/vigil/violations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Vigil violations:', error);
      throw error;
    }
  },
  
  // Self-Reflection methods
  getReflectionComparisons: async (): Promise<ReflectionComparison[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/reflection/comparisons`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reflection comparisons:', error);
      throw error;
    }
  },
  
  getGovernanceAwareness: async (): Promise<GovernanceAwareness> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/observers/reflection/awareness`);
      return response.data;
    } catch (error) {
      console.error('Error fetching governance awareness:', error);
      throw error;
    }
  },

  // Configuration methods
  updatePRISMConfig: async (config: any): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/observers/prism/config`, config);
    } catch (error) {
      console.error('Error updating PRISM config:', error);
      throw error;
    }
  },

  updateVigilConfig: async (config: any): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/observers/vigil/config`, config);
    } catch (error) {
      console.error('Error updating Vigil config:', error);
      throw error;
    }
  },

  // Agent wrapping methods
  registerAgent: async (agentData: any): Promise<{ agentId: string }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/agents/register`, agentData);
      return response.data;
    } catch (error) {
      console.error('Error registering agent:', error);
      throw error;
    }
  },

  getAgentStatus: async (agentId: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/agents/${agentId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error fetching agent status:', error);
      throw error;
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
    
    const connectWebSocket = () => {
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
        console.error('WebSocket error:', event);
        setError('Failed to connect to real-time data service');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        // Attempt to reconnect after a delay
        setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [agentId]);

  return { connected, prismMetrics, vigilMetrics, violations, error };
};

export default liveObserverService;
