/**
 * API Configuration
 * 
 * Configuration settings for API endpoints and services
 */

// API Base URL - adjust based on environment
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Multi-Agent API endpoints
export const MULTI_AGENT_API = {
  BASE: `${API_BASE_URL}/multi_agent`,
  CONTEXT: `${API_BASE_URL}/multi_agent/context`,
  MESSAGE: `${API_BASE_URL}/multi_agent/message`,
};

// Loop API endpoints
export const LOOP_API = {
  BASE: `${API_BASE_URL}/loop`,
  EXECUTE: `${API_BASE_URL}/loop/execute`,
  INITIATE: `${API_BASE_URL}/loop/initiate`,
  ITERATE: `${API_BASE_URL}/loop/iterate`,
};

// WebSocket configuration for real-time updates
export const WEBSOCKET_CONFIG = {
  URL: process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws',
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
};

// Polling configuration for real-time updates
export const POLLING_CONFIG = {
  MULTI_AGENT_STATUS: 2000, // 2 seconds
  GOVERNANCE_METRICS: 5000, // 5 seconds
  CONVERSATION_HISTORY: 3000, // 3 seconds
};

export default {
  API_BASE_URL,
  MULTI_AGENT_API,
  LOOP_API,
  WEBSOCKET_CONFIG,
  POLLING_CONFIG,
};

