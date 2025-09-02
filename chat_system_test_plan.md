# Chat System Test Plan

## Overview
Testing the hybrid chat and notification system fixes for floating chat windows and collaboration invitation modals.

## Test Cases

### 1. Floating Chat Window Tests

#### Test 1.1: Basic Floating Chat Visibility
- **Action**: Click "Quick Chat" button on team member in TeamPanel
- **Expected**: Floating chat window appears in upper-right area of screen
- **Debug**: Check console for position calculations and rendering logs
- **Status**: 🔄 Testing

#### Test 1.2: Floating Chat Positioning
- **Action**: Open multiple floating chats
- **Expected**: Chats cascade properly without overlapping
- **Expected**: All chats remain within viewport bounds
- **Status**: 🔄 Testing

#### Test 1.3: Floating Chat Dragging
- **Action**: Drag floating chat by header
- **Expected**: Chat moves smoothly and position updates
- **Status**: 🔄 Testing

#### Test 1.4: Floating Chat Minimize/Restore
- **Action**: Click minimize button, then click header to restore
- **Expected**: Chat minimizes to header only, then restores to full size
- **Status**: 🔄 Testing

### 2. Collaboration Invitation Modal Tests

#### Test 2.1: Modal Trigger from Notification
- **Action**: Click "View Invitation" button on collaboration notification
- **Expected**: CollaborationInvitationModal appears with proper styling
- **Debug**: Check console for modal state changes
- **Status**: 🔄 Testing

#### Test 2.2: Modal Content Display
- **Action**: Open collaboration invitation modal
- **Expected**: Shows inviter info, conversation name, agent name
- **Expected**: Shows accept/decline buttons
- **Status**: 🔄 Testing

#### Test 2.3: Modal Accept Flow
- **Action**: Click "Accept & Join" in modal
- **Expected**: Modal closes, navigates to command center
- **Expected**: Shared conversation tab appears
- **Status**: 🔄 Testing

#### Test 2.4: Modal Decline Flow
- **Action**: Click "Decline" in modal
- **Expected**: Modal closes, notification is removed
- **Status**: 🔄 Testing

### 3. Cross-Command Center Tests

#### Test 3.1: Shared Chat Tab Persistence
- **Action**: Accept collaboration invitation
- **Expected**: Shared chat tab appears in all command centers
- **Status**: 🔄 Testing

#### Test 3.2: Multi-User Collaboration
- **Action**: Multiple users join same collaboration
- **Expected**: All users see shared conversation
- **Status**: 🔄 Testing

## Debug Information to Check

### Floating Chat Debug Points
1. `ChatIntegrationProvider` position calculation logs
2. `LightweightFloatingChat` rendering logs
3. Draggable component position updates
4. Z-index and CSS positioning

### Modal Debug Points
1. `UnifiedNotificationCenter` click handling
2. `CollaborationInvitationModal` open state
3. Modal z-index and backdrop visibility
4. Navigation after acceptance

## Known Issues Fixed

### Issue 1: Floating Chat Not Appearing
- **Problem**: Chat was positioned below screen or not visible
- **Fix**: Updated position calculation in `ChatIntegrationProvider`
- **Fix**: Changed Draggable from `position` to `defaultPosition` prop
- **Fix**: Added proper bounds checking for viewport

### Issue 2: Collaboration Modal Not Triggering
- **Problem**: Modal not appearing when notification clicked
- **Fix**: Added support for both `collaboration_request` and `collaboration_invitation` types
- **Fix**: Added high z-index (10000) and debugging styles
- **Fix**: Enhanced modal visibility with glowing border

## Test Environment Setup

### Prerequisites
1. User logged in to Promethios UI
2. TeamPanel visible in command center
3. Test notifications available
4. Multiple browser tabs for cross-center testing

### Test Data Needed
1. Team members for floating chat testing
2. Collaboration invitation notifications
3. Multiple user accounts for collaboration testing

## Success Criteria

### Floating Chat Success
- ✅ Chat window appears on screen when triggered
- ✅ Chat window is draggable and stays within bounds
- ✅ Multiple chats cascade properly
- ✅ Minimize/restore functionality works

### Collaboration Modal Success
- ✅ Modal appears when notification is clicked
- ✅ Modal displays correct invitation information
- ✅ Accept flow navigates to command center
- ✅ Shared conversation tab appears across centers

## Next Steps After Testing
1. Fix any remaining positioning issues
2. Optimize performance for multiple floating chats
3. Add persistence for chat positions
4. Enhance collaboration invitation metadata

