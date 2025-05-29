/**
 * index.ts
 * 
 * Main export file for ATLAS chat components
 */

// Core components
export { default as AtlasChat } from './AtlasChat';
export { default as AtlasChatPublic } from './AtlasChatPublic';
export { default as AtlasChatSession } from './AtlasChatSession';
export { default as AtlasChatProvider, useAtlasChat } from './AtlasChatProvider';

// Demo component
export { default as AtlasChatDemo } from './AtlasChatDemo';

// Service
export { default as AtlasChatService } from './AtlasChatService';

// Types
export type { ChatMessage } from './AtlasChat';
export type { ChatContext } from './AtlasChatService';
