# Guest Agent Persistence Design

This document outlines the design for persisting guest agents in chat sessions.

## 1. Current Data Structures

- **`ChatSession` in `ChatHistoryService.ts`**: This interface represents a chat session and its metadata. It currently has a `participants` field with `host` and `guests` properties. However, the `guests` property is not being fully utilized for guest agent persistence.
- **`ChatContext` in `ChatbotProfilesPageEnhanced.tsx`**: This interface represents the context of a single chat, including the active agent and any guest agents. Guest agents are stored in the `guestAgents` array within this interface, but this is only in-memory and not persisted.

## 2. Proposed Data Structure

To persist guest agents, we will add a new field to the `ChatSession` interface in `ChatHistoryService.ts`. This field will store an array of guest agent objects, each containing the agent's ID, name, and other relevant information.

### 2.1. `ChatSession` Interface Update

We will add a `guestAgents` field to the `ChatSession` interface:

```typescript
export interface ChatSession {
  // ... existing fields
  guestAgents?: Array<{
    agentId: string;
    name: string;
    avatar?: string;
    // Add any other relevant guest agent properties here
  }>;
}
```

This new field will be an optional array of objects, where each object represents a guest agent that was part of the chat session.

## 3. Implementation Plan

1.  **Update `ChatHistoryService.ts`**: Add the `guestAgents` field to the `ChatSession` interface.
2.  **Update `saveChatSession`**: Modify the `saveChatSession` function in `ChatHistoryService.ts` to include the `guestAgents` data when saving a chat session.
3.  **Update `getChatSession`**: Modify the `getChatSession` function in `ChatHistoryService.ts` to retrieve the `guestAgents` data when loading a chat session.
4.  **Update `ChatbotProfilesPageEnhanced.tsx`**: 
    - When loading a chat session, populate the `guestAgents` in the `multiChatState` from the `guestAgents` field of the loaded `ChatSession`.
    - When adding a guest agent, update both the `multiChatState` and the `guestAgents` field of the current `ChatSession` before saving.

This approach will ensure that guest agents are persisted along with the chat session and are correctly restored when a session is loaded.


