# Targeted Fix Plan for Threading Issues

## Current State (After Revert)
- Back to commit `86796a35` which has working basic functionality
- Thread view opens inline (working but not ideal)
- Agent names show as IDs (needs improvement)
- Colors may not be consistent (needs improvement)
- Host agent avatars fixed (working)
- Real-time messaging working

## Issues to Fix (Targeted Approach)

### 1. Agent Names in Thread Headers
**Problem**: Thread headers show agent IDs instead of proper names
**Targeted Fix**: 
- Update only the agent name detection logic in UnifiedSharedMessages
- Use the same logic as host chat for name resolution
- Don't touch the layout or threading mechanism

### 2. Agent Color Consistency  
**Problem**: Colors may not match between host and guest chat
**Targeted Fix**:
- Update only the color palette in UnifiedSharedMessages
- Copy the exact color system from host chat
- Don't change any layout or structure

### 3. Thread Opening to Right Side (Optional)
**Problem**: Threads open inline instead of to the right
**Approach**: 
- This is a major layout change that caused the regression
- Keep inline threading working for now
- Consider this a future enhancement, not a critical fix

## What NOT to Touch
- Don't modify the overall layout structure in ChatbotProfilesPageEnhanced
- Don't remove ThreadView from UnifiedSharedMessages
- Don't change the thread state management
- Don't modify the thread handlers significantly

## Implementation Strategy
1. **Minimal Changes**: Only update the specific functions that handle names and colors
2. **Copy Working Code**: Take exact implementations from host chat
3. **Test Incrementally**: Make one change at a time and verify it works
4. **Preserve Functionality**: Ensure threading still works inline before attempting layout changes

## Files to Modify (Minimally)
1. `UnifiedSharedMessages.tsx` - Only the color and name detection functions
2. No changes to `ChatbotProfilesPageEnhanced.tsx` for now

This approach prioritizes stability over perfect feature parity.
