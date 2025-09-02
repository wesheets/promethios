# Promethios Hybrid Chat System - Todo List

## Phase 1: Analyze current notification and collaboration invitation system ✅
- [x] Examine UserInteractionRegistry service
- [x] Identify test data usage in NotificationTestButton
- [x] Review LightweightFloatingChat component
- [x] Understand current notification flow

## Phase 2: Fix collaboration invitation system to use real user IDs
- [x] Fix NotificationTestButton to use real user IDs instead of 'test-sender-id'
- [x] Create test utilities for proper mock user creation and cleanup
- [x] Update test system to use real Firebase user documents
- [x] **CRITICAL BUG FIX**: Fixed ConnectionService sending notifications to sender instead of recipient
- [x] Update acceptance/rejection notifications to use UserInteractionRegistry
- [x] **UNIFIED SYSTEM**: Created UnifiedNotificationService for standardized notifications
- [x] **STANDARDIZATION**: Updated ConnectionService to use unified pattern
- [x] **STANDARDIZATION**: Updated CollaborationInviteButton to use unified pattern
- [x] Create proper collaboration invitation flow with real user data
- [x] Test collaboration invitations between real users

## Key Achievement: All notifications now follow the same unified pattern! 🎉

## Phase 3: Complete lightweight floating chat integration in team panel
- [x] **CRITICAL FIX**: Fixed LightweightFloatingChat isMinimized error causing blank page
- [x] Implement minimize/restore functionality for floating chat
- [x] Add conditional rendering for minimized state
- [x] Fix Quick Chat button functionality in team panel
- [x] **CRITICAL FIX**: Added ChatIntegrationProvider to App.tsx to enable chat context
- [x] **CRITICAL FIX**: Fixed floating chat positioning (absolute vs fixed) for Draggable compatibility
- [x] **VISIBILITY FIX**: Resolved floating chat not appearing when Quick Chat button clicked
- [x] **POSITIONING FIX**: Fixed position calculation with proper viewport bounds checking
- [x] **DRAGGABLE FIX**: Changed from position to defaultPosition prop for proper rendering
- [x] **Z-INDEX FIX**: Enhanced z-index and styling for better visibility
- [x] Integrate LightweightFloatingChat with TeamPanel
- [ ] Test floating chat positioning and dragging
- [ ] Ensure chat history persistence between minimize/restore
- [ ] Ensure proper message persistence and real-time updates
- [ ] Connect to shared conversation system
- [ ] Test floating chat functionality

## Phase 3.5: Fix collaboration invitation modal triggering
- [x] **MODAL TYPE FIX**: Added support for both 'collaboration_request' and 'collaboration_invitation' types
- [x] **VISIBILITY FIX**: Enhanced modal z-index (10000) and backdrop styling
- [x] **DEBUG ENHANCEMENT**: Added comprehensive debugging logs for modal state
- [x] **STYLING FIX**: Added bright border and glowing effects for debugging visibility
- [x] **NOTIFICATION HANDLING**: Fixed UnifiedNotificationCenter to properly trigger modal
- [ ] Test collaboration invitation modal appearance
- [ ] Test modal accept/decline functionality
- [ ] Verify navigation to command center after acceptance
- [ ] Test shared conversation tab creation

## Phase 4: Test notification delivery and chat functionality with real data
- [x] **CRITICAL FIX**: Identified Firebase Firestore index requirements for UserInteractionRegistry
- [x] **COMPREHENSIVE SOLUTION**: Created complete Firebase indexes configuration
- [x] **DEPLOYMENT READY**: Updated firestore.indexes.json with all 6 required compound indexes
- [x] **AUTOMATION**: Created deployment script and validation tools
- [x] **DOCUMENTATION**: Comprehensive fix guide and monitoring instructions
- [x] **REPOSITORY**: Committed complete solution to version control
- [ ] **DEPLOY INDEXES**: Run Firebase indexes deployment (requires Firebase CLI access)
- [ ] **VALIDATE**: Test collaboration invitations after index deployment
- [ ] **VERIFY**: Confirm real-time notifications work end-to-end
- [ ] Test notification delivery with real user IDs
- [ ] Verify chat functionality in both full-screen and floating modes
- [ ] Test message synchronization between chat modes
- [ ] Verify notification persistence in Firebase

## Phase 5: Verify and finalize hybrid chat system integration
- [x] **POSITIONING FIX**: Fixed floating chat positioning to appear in upper-right area
- [x] **UX IMPROVEMENTS**: Added drag indicator and "Drag to move" text for better usability
- [x] **VIEWPORT AWARENESS**: Made positioning responsive to window size
- [x] **TRUE FLOATING**: Changed to fixed positioning for proper floating behavior
- [x] **VISUAL CLARITY**: Added visual indicators that chat is draggable and moveable
- [ ] Test dragging functionality across different screen sizes
- [ ] Verify chat doesn't interfere with AI collaboration workflow
- [ ] Test multiple floating chats cascading behavior
- [ ] Confirm chat persistence when switching between pages
- [ ] Test complete workflow from invitation to chat
- [ ] Verify seamless switching between chat modes
- [ ] Test during AI collaboration sessions
- [ ] Final integration testing

## Key Issues Identified:
1. **NotificationTestButton using placeholder data**: Line 31 uses 'test-sender-id' instead of real user ID
2. **Need real user lookup system**: Collaboration invitations need to work with actual user accounts
3. **Message persistence**: LightweightFloatingChat needs connection to real message storage
4. **Integration gaps**: Need to connect floating chat to existing conversation system

