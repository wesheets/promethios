/**
 * API Configuration
 * 
 * Configuration settings for API endpoints and services
 */

// API Base URL - now properly configured with environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'https://promethios-phase-7-1-api.onrender.com';

// Multi-Agent API endpoints
export const MULTI_AGENT_API = {
  BASE: import.meta.env.VITE_MULTI_AGENT_API_BASE || `${API_BASE_URL}/api/multi_agent_system`,
  CONTEXT: import.meta.env.VITE_MULTI_AGENT_API_BASE ? `${import.meta.env.VITE_MULTI_AGENT_API_BASE}/context` : `${API_BASE_URL}/api/multi_agent_system/context`,
  MESSAGE: import.meta.env.VITE_MULTI_AGENT_API_BASE ? `${import.meta.env.VITE_MULTI_AGENT_API_BASE}/message` : `${API_BASE_URL}/api/multi_agent_system/message`,
  CONTEXTS: import.meta.env.VITE_MULTI_AGENT_API_BASE ? `${import.meta.env.VITE_MULTI_AGENT_API_BASE}/contexts` : `${API_BASE_URL}/api/multi_agent_system/contexts`,
};

// Governance API endpoints
export const GOVERNANCE_API = {
  BASE: import.meta.env.VITE_GOVERNANCE_API_BASE || `${API_BASE_URL}/api/governance`,
  POLICIES: import.meta.env.VITE_GOVERNANCE_API_BASE ? `${import.meta.env.VITE_GOVERNANCE_API_BASE}/policies` : `${API_BASE_URL}/api/governance/policies`,
  METRICS: import.meta.env.VITE_GOVERNANCE_API_BASE ? `${import.meta.env.VITE_GOVERNANCE_API_BASE}/metrics` : `${API_BASE_URL}/api/governance/metrics`,
};

// Chat API endpoints
export const CHAT_API = {
  BASE: import.meta.env.VITE_CHAT_API_BASE || `${API_BASE_URL}/api/chat`,
  SESSIONS: import.meta.env.VITE_CHAT_API_BASE ? `${import.meta.env.VITE_CHAT_API_BASE}/sessions` : `${API_BASE_URL}/api/chat/sessions`,
  MESSAGES: import.meta.env.VITE_CHAT_API_BASE ? `${import.meta.env.VITE_CHAT_API_BASE}/messages` : `${API_BASE_URL}/api/chat/messages`,
};

// Agent API endpoints
export const AGENT_API = {
  BASE: import.meta.env.VITE_AGENT_API_BASE || `${API_BASE_URL}/api/agents`,
  WRAPPERS: import.meta.env.VITE_AGENT_API_BASE ? `${import.meta.env.VITE_AGENT_API_BASE}/wrappers` : `${API_BASE_URL}/api/agents/wrappers`,
  IDENTITIES: import.meta.env.VITE_AGENT_API_BASE ? `${import.meta.env.VITE_AGENT_API_BASE}/identities` : `${API_BASE_URL}/api/agents/identities`,
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
  URL: import.meta.env.VITE_WS_URL || `wss://promethios-phase-7-1-api.onrender.com/ws`,
  RECONNECT_INTERVAL: parseInt(import.meta.env.VITE_WEBSOCKET_RECONNECT_INTERVAL || '3000'),
  MAX_RECONNECT_ATTEMPTS: parseInt(import.meta.env.VITE_WEBSOCKET_MAX_RECONNECT_ATTEMPTS || '5'),
};

// Polling configuration for real-time updates
export const POLLING_CONFIG = {
  MULTI_AGENT_STATUS: parseInt(import.meta.env.VITE_POLLING_MULTI_AGENT_STATUS || '2000'), // 2 seconds
  GOVERNANCE_METRICS: parseInt(import.meta.env.VITE_POLLING_GOVERNANCE_METRICS || '5000'), // 5 seconds
  CONVERSATION_HISTORY: parseInt(import.meta.env.VITE_POLLING_CONVERSATION_HISTORY || '3000'), // 3 seconds
};

export default {
  API_BASE_URL,
  MULTI_AGENT_API,
  GOVERNANCE_API,
  CHAT_API,
  AGENT_API,
  LOOP_API,
  WEBSOCKET_CONFIG,
  POLLING_CONFIG,
};

