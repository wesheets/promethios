# Promethios Phase 7.1 Deployment and Compatibility Testing Guide

## Overview

This guide provides detailed instructions for testing compatibility and deploying the Phase 7.1 implementation of Promethios. It covers both local testing procedures and cloud deployment options using Render.

## Table of Contents

1. [Local Compatibility Testing](#local-compatibility-testing)
2. [Automated Test Suite](#automated-test-suite)
3. [Deployment Options](#deployment-options)
4. [New Render Deployment Setup](#new-render-deployment-setup)
5. [Existing Render Deployment Update](#existing-render-deployment-update)
6. [Environment Configuration](#environment-configuration)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedures](#rollback-procedures)

## Local Compatibility Testing

Before creating a PR, thoroughly test the compatibility of the Phase 7.1 implementation with existing Phase 7.0 components:

### Setup Local Environment

```bash
# Clone the repository (if not already done)
git clone https://github.com/wesheets/promethios.git
cd promethios

# Create a new branch for testing
git checkout -b test/phase-7-1-compatibility

# Install dependencies
cd phase_7_1_prototype/promethios-ui
npm install

# Start the development server
npm start
```

### API Integration Testing

1. Configure the UI to connect to your local Phase 7.0 backend:
   - Update `.env` file in `phase_7_1_prototype/promethios-ui` with appropriate API endpoints
   - Ensure CORS is properly configured on your local backend

2. Test the following integration points:
   - Agent wrapping API calls
   - Governance metrics retrieval
   - Authentication flows
   - CMU benchmark data access

### Cross-Browser Testing

Test the UI in multiple browsers to ensure compatibility:
- Chrome
- Firefox
- Safari
- Edge

### Mobile Responsiveness

Test the UI on various device sizes:
- Desktop (1920×1080, 1366×768)
- Tablet (iPad, 768×1024)
- Mobile (iPhone, 375×667)

## Automated Test Suite

Run and extend the automated test suite to verify compatibility:

```bash
# Navigate to the UI directory
cd phase_7_1_prototype/promethios-ui

# Run existing tests
npm test

# Add new tests for Phase 7.1 components
# Create test files in __tests__ directories
```

Key areas to test:
- Authentication flows
- Form validations
- API integrations
- UI component rendering
- State management

## Deployment Options

### Option 1: New Render Deployment (Recommended for Initial Testing)

Pros:
- Isolated environment for testing
- No risk to existing production deployment
- Allows side-by-side comparison

Cons:
- Requires additional configuration
- May need to duplicate some resources

### Option 2: Update Existing Render Deployment

Pros:
- Maintains continuity
- Reuses existing infrastructure
- Simpler long-term maintenance

Cons:
- Higher risk during transition
- Requires careful migration planning
- May cause temporary disruption

## New Render Deployment Setup

Follow these steps to create a new deployment on Render:

1. **Sign in to Render** at https://dashboard.render.com

2. **Create a new Web Service**:
   - Click "New +" and select "Web Service"
   - Connect to your GitHub repository
   - Select the branch with Phase 7.1 implementation

3. **Configure Build Settings**:
   - Name: `promethios-phase-7-1`
   - Root Directory: `phase_7_1_prototype/promethios-ui`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: Recommend at least Standard (512 MB)

4. **Set Environment Variables**:
   - `NODE_ENV`: `production`
   - `REACT_APP_API_URL`: URL of your Phase 7.0 backend API
   - `REACT_APP_AUTH_DOMAIN`: Authentication domain (if applicable)
   - Add any other required environment variables

5. **Configure Auto-Deploy**:
   - Enable automatic deploys for the selected branch

6. **Create the Service**:
   - Click "Create Web Service"
   - Wait for the initial deployment to complete

## Existing Render Deployment Update

To update an existing Render deployment:

1. **Backup Current Deployment**:
   - Create a snapshot or backup of the current deployment
   - Document all environment variables and settings

2. **Update Repository**:
   - Merge the Phase 7.1 implementation into the main branch
   - Ensure all files are properly committed

3. **Update Build Settings**:
   - Navigate to the existing service in Render dashboard
   - Update build command if necessary
   - Update start command if necessary

4. **Update Environment Variables**:
   - Add any new environment variables required by Phase 7.1

5. **Deploy**:
   - Trigger a manual deploy or push changes to trigger auto-deploy
   - Monitor the build and deployment logs

## Environment Configuration

### Required Environment Variables

```
# Core Configuration
NODE_ENV=production
PORT=3000

# API Configuration
REACT_APP_API_URL=https://api.promethios.ai
REACT_APP_API_VERSION=v1

# Authentication
REACT_APP_AUTH_DOMAIN=auth.promethios.ai
REACT_APP_AUTH_CLIENT_ID=your_client_id

# Analytics (if applicable)
REACT_APP_ANALYTICS_ID=your_analytics_id

# Feature Flags
REACT_APP_ENABLE_BETA_FEATURES=true
```

### CORS Configuration

Ensure your backend API has the following CORS headers:

```
Access-Control-Allow-Origin: https://your-ui-domain.onrender.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Post-Deployment Verification

After deployment, verify the following:

1. **Accessibility**:
   - Confirm the deployed UI is accessible at the provided URL
   - Verify SSL/TLS is properly configured

2. **Authentication**:
   - Test signup, waitlist, and login flows
   - Verify email verification process

3. **Core Functionality**:
   - Test CMU benchmark dashboard
   - Verify all interactive elements work
   - Test investor demo mode

4. **Performance**:
   - Check page load times
   - Verify responsiveness under load
   - Test with multiple concurrent users if possible

5. **Integration**:
   - Confirm all API calls are successful
   - Verify data is correctly displayed

## Rollback Procedures

If issues are encountered after deployment:

### For New Deployment:

1. Simply redirect users back to the original deployment
2. Diagnose and fix issues in the new deployment
3. Redeploy when ready

### For Updated Existing Deployment:

1. In Render dashboard, navigate to the deployment
2. Go to "Deploys" tab
3. Find the last successful deploy before the update
4. Click "Rollback to this deploy"
5. Verify the rollback was successful

## Conclusion

By following this guide, you can ensure a smooth testing and deployment process for the Phase 7.1 implementation. The recommended approach is to start with a new deployment for testing, then update the existing deployment once all compatibility issues are resolved.

For any questions or issues, please contact the development team.
