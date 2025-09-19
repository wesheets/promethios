# Agent Name Population Issue Analysis

## Problem
Agent names in guest chat are showing as generic IDs like "Agent chatbot-1756857540077" instead of proper names like "Claude Assistant".

## Root Cause Analysis

From the console logs, I can see:
1. `✅ [UnifiedGuestChat] Loaded host chat session: test` - Session loads successfully
2. `🔍 [UnifiedGuestChat] Session participants: Object` - Participants data exists
3. `🔗 [UnifiedGuestChat] Host agent already in participants or missing agent info` - Host agent handling

## Current Flow Issues

### 1. Data Structure Problem
The `getSenderInfo()` function in UnifiedSharedMessages is looking for:
- `chatSession?.agentName` - This might be generic
- `chatSession.participants?.guests` - This might not have proper names
- `message.metadata?.agentName` - This might be missing

### 2. Missing Host Agent Data
The logs show the host agent is being added to participants, but the name might be coming from `chatSession.agentName` which could be generic.

## Solution Strategy

### Immediate Fix:
1. **Add more detailed logging** to see exactly what agent data is available
2. **Improve name detection** by checking multiple data sources in order of preference
3. **Add fallback to chatbot profiles** if available in the guest context

### Implementation:
1. Enhance the `getSenderInfo()` function with better name detection
2. Add logging to trace the exact data flow
3. Check if we can access the original chatbot profile data from the host context
