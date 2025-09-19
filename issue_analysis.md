# Issue Analysis: Duplicate Host Agents & Real-time Messaging

## Root Cause Analysis

Based on console logs and code examination, I've identified the specific issues:

### Issue 1: Duplicate Host Agent Avatars
**Problem**: Host agent appears twice in the chat input bar avatar selector
**Root Cause**: In `ChatbotProfilesPageEnhanced.tsx`, the host agent is being added to both:
1. `hostAgent` prop (correct)
2. `allAgents` array (incorrect - causing duplicate)

**Evidence from logs**:
```
🔍 [AgentAvatarSelector] allAgents: Array(2)
🎯 [AgentAvatarSelector] Rendering agent: Object
🎯 [AgentAvatarSelector] Rendering agent: Object
```

### Issue 2: Real-time Messaging Not Working
**Problem**: Guest users don't see new messages in real-time
**Root Cause**: `chatHistoryService.subscribeToSession` method doesn't exist

**Evidence from logs**:
```
❌ [UnifiedGuestChat] Error setting up real-time listener: TypeError: chatHistoryService.subscribeToSession is not a function
    at _UnifiedGuestChatService.subscribeToHostConversation (UnifiedGuestChatService.ts:296:46)
```

## Data Flow Understanding

1. **Host User**: Creates conversation with agents
2. **Guest User**: Accesses via invitation through `UnifiedGuestChatService`
3. **Real-time Sync**: Should use Firebase listeners to sync messages
4. **Avatar Display**: Should show host agent once + guest agents

## Fix Strategy

1. **Fix Duplicate Avatars**: Remove host agent from `allAgents` array in `ChatbotProfilesPageEnhanced.tsx`
2. **Fix Real-time Messaging**: Implement proper Firebase listener in `UnifiedGuestChatService.ts`
3. **Test**: Verify both issues are resolved

## Files to Modify

1. `phase_7_1_prototype/promethios-ui/src/pages/ChatbotProfilesPageEnhanced.tsx`
2. `phase_7_1_prototype/promethios-ui/src/services/UnifiedGuestChatService.ts`
