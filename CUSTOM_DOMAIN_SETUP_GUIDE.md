# Custom Domain Setup Guide for Promethios

This guide provides step-by-step instructions for configuring your custom domain (promethios.ai) with your Render deployments.

## Prerequisites

- Access to your domain registrar account for promethios.ai
- Admin access to your Render account
- Both UI and API services deployed on Render

## Step 1: Add Custom Domain in Render

### For the UI Service

1. Log in to your Render dashboard
2. Navigate to your UI service (promethios-ui)
3. Click on the "Settings" tab
4. Scroll down to the "Custom Domain" section
5. Click "Add Custom Domain"
6. Enter your domain: `promethios.ai`
7. Click "Save"

### For the API Service

1. Navigate to your API service (promethios-api)
2. Click on the "Settings" tab
3. Scroll down to the "Custom Domain" section
4. Click "Add Custom Domain"
5. Enter your API subdomain: `api.promethios.ai`
6. Click "Save"

## Step 2: Configure DNS Records

Log in to your domain registrar account and add the following DNS records:

### For the UI (promethios.ai)

```
Type: CNAME
Name: @
Value: [Your Render UI service URL without https://] (e.g., promethios-ui.onrender.com)
TTL: 3600 (or automatic)
```

### For the API (api.promethios.ai)

```
Type: CNAME
Name: api
Value: [Your Render API service URL without https://] (e.g., promethios-api.onrender.com)
TTL: 3600 (or automatic)
```

### For www subdomain (optional)

```
Type: CNAME
Name: www
Value: [Your Render UI service URL without https://] (e.g., promethios-ui.onrender.com)
TTL: 3600 (or automatic)
```

## Step 3: Verify Domain and SSL Setup

1. After adding the DNS records, return to Render
2. In each service's Custom Domain section, you'll see verification status
3. DNS propagation may take up to 48 hours, but typically completes within a few hours
4. Render will automatically provision SSL certificates for your domains

## Step 4: Update Environment Variables

### In the API Service

1. Navigate to your API service in Render
2. Go to the "Environment" tab
3. Update the `CORS_ORIGIN` variable to `https://promethios.ai`
4. Click "Save Changes"
5. Trigger a manual deploy to apply the changes

### In the UI Service

1. Navigate to your UI service in Render
2. Go to the "Environment" tab
3. Update the `REACT_APP_API_URL` variable to `https://api.promethios.ai`
4. Click "Save Changes"
5. Trigger a manual deploy to apply the changes

## Step 5: Testing

1. Wait for both services to redeploy
2. Test the UI by visiting `https://promethios.ai`
3. Verify API connectivity by checking network requests in browser developer tools
4. Test key functionality like authentication and the CMU benchmark dashboard

## Troubleshooting

### DNS Issues

- Use [dnschecker.org](https://dnschecker.org) to verify your DNS records have propagated
- Ensure you've entered the correct Render URLs in your DNS records

### CORS Issues

- Check browser console for CORS errors
- Verify the `CORS_ORIGIN` environment variable is correctly set in your API service
- Ensure protocols match (https to https)

### SSL Certificate Issues

- Render automatically provisions SSL certificates via Let's Encrypt
- If you see certificate warnings, wait a few hours as certificate propagation can take time
- If issues persist after 24 hours, contact Render support

## Next Steps

After successful domain setup:
1. Update any documentation references to point to the new domain
2. Update any hardcoded URLs in your codebase
3. Set up monitoring for your new domain endpoints
