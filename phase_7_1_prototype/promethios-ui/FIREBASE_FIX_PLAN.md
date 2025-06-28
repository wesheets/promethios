# Firebase Multiple Instance Fix Plan

## Problem Identified
Multiple Firebase instances are being initialized across the application, causing transport conflicts and 400 errors:

1. **Main React App**: `/src/firebase/config.ts` (Modern Firebase v9+)
2. **Landing Page**: `/public/landing/firebase-config.js` (Firebase v9.22.0 Compat)
3. **Static Landing**: `/public/static-landing/firebase-config.js` (Firebase v9.23.0 Compat)

## Root Cause
- Different Firebase SDK versions (v9.22.0, v9.23.0, modern v9+)
- Multiple `initializeApp()` calls to the same Firebase project
- Conflicting transport connections causing WebChannelConnection RPC errors

## Solution Strategy

### Phase 1: Consolidate to Single Firebase Instance
1. **Keep only the main React app Firebase config** (`/src/firebase/config.ts`)
2. **Remove conflicting landing page configs**
3. **Update landing pages to use shared Firebase instance**

### Phase 2: Update Landing Pages
1. **Remove Firebase script tags** from HTML files
2. **Remove local firebase-config.js files**
3. **Use Firebase from main app** if needed for waitlist functionality

### Phase 3: Verify Single Instance
1. **Ensure only one `initializeApp()` call** across entire application
2. **Test Firestore operations** to confirm 400 errors are resolved
3. **Verify auth and data operations work** without conflicts

## Implementation Steps

### Step 1: Remove Landing Page Firebase Configs
- Delete `/public/landing/firebase-config.js`
- Delete `/public/static-landing/firebase-config.js`
- Remove Firebase script tags from HTML files

### Step 2: Update HTML Files
- Remove Firebase SDK script tags
- Remove firebase-config.js script tags
- Keep only essential functionality

### Step 3: Test and Validate
- Start application and check console for Firebase errors
- Verify only one Firebase instance is initialized
- Test Firestore operations (user preferences, etc.)

## Expected Results
- ✅ No more 400 transport errors
- ✅ Single Firebase instance across application
- ✅ Firestore operations work properly
- ✅ Firebase auth continues to work
- ✅ Clean console logs without transport errors

## Files to Modify
1. `/public/landing/index.html` - Remove Firebase scripts
2. `/public/static-landing/index.html` - Remove Firebase scripts
3. Delete `/public/landing/firebase-config.js`
4. Delete `/public/static-landing/firebase-config.js`

