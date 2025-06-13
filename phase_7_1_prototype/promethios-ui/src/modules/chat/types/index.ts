/**
 * Core types for the Chat module
 */

export type ChatMode = 'standard' | 'governance' | 'multi-agent';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
  agentId?: string;
  governanceStatus?: 'compliant' | 'warning' | 'violation';
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'online' | 'offline' | 'busy';
  governanceScore?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  mode: ChatMode;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface MultiAgentSystem {
  id: string;
  name: string;
  description: string;
  agents: Agent[];
  coordinationPattern: string;
}

export interface AdHocMultiAgentConfig {
  agents: Agent[];
  coordinationPattern: 'sequential' | 'parallel' | 'hierarchical';
  maxAgents: number;
}

