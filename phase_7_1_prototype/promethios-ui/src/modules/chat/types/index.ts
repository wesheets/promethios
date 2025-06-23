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
  governanceStatus?: 'compliant' | 'warning' | 'violation' | 'monitored' | 'unmonitored';
  governanceData?: {
    trustScore: number;
    violations: string[];
    warnings: string[];
    governanceId?: string;
  };
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }[];
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  type?: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'idle' | 'disabled';
  governanceScore?: number;
  governanceId?: string;
  capabilities?: any;
  lastUsed?: Date;
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

