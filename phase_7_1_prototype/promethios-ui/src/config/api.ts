/**
 * API Configuration
 * 
 * Configuration settings for API endpoints and services
 */

// API Base URL - now properly configured with environment variables
export const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || 'https://promethios-phase-7-1-api.onrender.com';

// Multi-Agent API endpoints
export const MULTI_AGENT_API = {
  BASE: process.env.REACT_APP_MULTI_AGENT_API_BASE || `${API_BASE_URL}/api/multi_agent_system`,
  CONTEXT: process.env.REACT_APP_MULTI_AGENT_API_BASE ? `${process.env.REACT_APP_MULTI_AGENT_API_BASE}/context` : `${API_BASE_URL}/api/multi_agent_system/context`,
  MESSAGE: process.env.REACT_APP_MULTI_AGENT_API_BASE ? `${process.env.REACT_APP_MULTI_AGENT_API_BASE}/message` : `${API_BASE_URL}/api/multi_agent_system/message`,
  CONTEXTS: process.env.REACT_APP_MULTI_AGENT_API_BASE ? `${process.env.REACT_APP_MULTI_AGENT_API_BASE}/contexts` : `${API_BASE_URL}/api/multi_agent_system/contexts`,
};

// Governance API endpoints
export const GOVERNANCE_API = {
  BASE: process.env.REACT_APP_GOVERNANCE_API_BASE || `${API_BASE_URL}/api/governance`,
  POLICIES: process.env.REACT_APP_GOVERNANCE_API_BASE ? `${process.env.REACT_APP_GOVERNANCE_API_BASE}/policies` : `${API_BASE_URL}/api/governance/policies`,
  METRICS: process.env.REACT_APP_GOVERNANCE_API_BASE ? `${process.env.REACT_APP_GOVERNANCE_API_BASE}/metrics` : `${API_BASE_URL}/api/governance/metrics`,
};

// Chat API endpoints
export const CHAT_API = {
  BASE: process.env.REACT_APP_CHAT_API_BASE || `${API_BASE_URL}/api/chat`,
  SESSIONS: process.env.REACT_APP_CHAT_API_BASE ? `${process.env.REACT_APP_CHAT_API_BASE}/sessions` : `${API_BASE_URL}/api/chat/sessions`,
  MESSAGES: process.env.REACT_APP_CHAT_API_BASE ? `${process.env.REACT_APP_CHAT_API_BASE}/messages` : `${API_BASE_URL}/api/chat/messages`,
};

// Agent API endpoints
export const AGENT_API = {
  BASE: process.env.REACT_APP_AGENT_API_BASE || `${API_BASE_URL}/api/agents`,
  WRAPPERS: process.env.REACT_APP_AGENT_API_BASE ? `${process.env.REACT_APP_AGENT_API_BASE}/wrappers` : `${API_BASE_URL}/api/agents/wrappers`,
  IDENTITIES: process.env.REACT_APP_AGENT_API_BASE ? `${process.env.REACT_APP_AGENT_API_BASE}/identities` : `${API_BASE_URL}/api/agents/identities`,
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
  URL: process.env.REACT_APP_WS_URL || `wss://promethios-phase-7-1-api.onrender.com/ws`,
  RECONNECT_INTERVAL: parseInt(process.env.REACT_APP_WEBSOCKET_RECONNECT_INTERVAL || '3000'),
  MAX_RECONNECT_ATTEMPTS: parseInt(process.env.REACT_APP_WEBSOCKET_MAX_RECONNECT_ATTEMPTS || '5'),
};

// Polling configuration for real-time updates
export const POLLING_CONFIG = {
  MULTI_AGENT_STATUS: parseInt(process.env.REACT_APP_POLLING_MULTI_AGENT_STATUS || '2000'), // 2 seconds
  GOVERNANCE_METRICS: parseInt(process.env.REACT_APP_POLLING_GOVERNANCE_METRICS || '5000'), // 5 seconds
  CONVERSATION_HISTORY: parseInt(process.env.REACT_APP_POLLING_CONVERSATION_HISTORY || '3000'), // 3 seconds
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

