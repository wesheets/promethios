# Chat Interface Fix Todo

## Issues Identified
- [x] HumanParticipantService using incorrect storage method names (setItem/getItem instead of set/get)
- [x] DirectMessageSidebar trying to call non-existent global openFloatingChat function
- [x] Fix HumanParticipantService storage method calls
- [x] Implement proper floating chat integration in DirectMessageSidebar
- [x] Test the fixes

## Root Causes
1. **Storage Service Method Mismatch**: HumanParticipantService calls `this.storageService.setItem()` and `this.storageService.getItem()` but UnifiedStorageService has `set()` and `get()` methods that require namespace parameters.

2. **Missing Floating Chat Integration**: DirectMessageSidebar expects a global `openFloatingChat` function but should use the ChatIntegrationProvider's `openDirectMessage` function.

## Implementation Plan
1. Fix HumanParticipantService to use correct storage methods with proper namespace
2. Update DirectMessageSidebar to use ChatIntegrationProvider instead of global function
3. Ensure proper integration between connections system and chat functionality

