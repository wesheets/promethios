# Chat Window Positioning Fix

## Issue
The floating chat windows were being created successfully but were not visible because they were positioned behind the navigation bar and had insufficient z-index values.

## Root Cause
1. **Position**: Chat windows were positioned at `x: 100` which placed them behind the left navigation bar
2. **Z-Index**: Default z-index of 1000 was too low compared to navigation elements

## Fix Applied

### File: ChatWindowManager.tsx

**Changes Made**:
1. **Increased X Position**: Changed from `x: 100` to `x: 300` to move windows right of navigation
2. **Higher Z-Index**: Changed from `zIndex: nextZIndex` to `zIndex: 2000 + nextZIndex`
3. **Initial Z-Index**: Increased starting value from 1000 to 2000

**Before**:
```typescript
position: { 
  x: 100 + (windowCount * 50), // Behind navigation
  y: 100 + (windowCount * 50) 
},
zIndex: nextZIndex, // Too low (1000+)
```

**After**:
```typescript
position: { 
  x: 300 + (windowCount * 50), // Clear of navigation
  y: 100 + (windowCount * 50) 
},
zIndex: 2000 + nextZIndex, // High enough (2000+)
```

## Expected Result
- Floating chat windows should now appear in the main content area
- Windows should be visible above all other UI elements
- Multiple windows will cascade properly without overlapping navigation

## Test Instructions
1. Refresh the browser page
2. Click Messages → + → Select a user
3. Chat window should appear at x: 300, y: 100 (right of navigation)
4. Window should be draggable and fully visible

