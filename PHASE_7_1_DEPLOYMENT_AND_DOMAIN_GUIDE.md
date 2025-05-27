# Promethios Phase 7.1 Deployment Guide: API Configuration & Custom Domain Setup

## Finding Your Backend API URL

Since we couldn't locate the API URL in the codebase, you'll need to find it in your Render dashboard:

1. **Log in to your Render dashboard** at https://dashboard.render.com
2. **Navigate to the Phase 7.0 backend service** in your list of services
3. **Copy the URL** displayed in the service overview - it will look something like:
   ```
   https://promethios-api-xxxx.onrender.com
   ```
4. **Use this URL as your `REACT_APP_API_URL` environment variable** in your Phase 7.1 deployment

## Render Deployment Configuration

Based on your screenshots, here are the correct settings for your Phase 7.1 deployment:

1. **Service Type**: Web Service
2. **Name**: promethios-phase-7-1 (looks good)
3. **Region**: Oregon (US West) (matches your existing services)
4. **Branch**: feature/phase-7-1-iphone-inspired-ui
5. **Root Directory**: phase_7_1_prototype/promethios-ui
6. **Runtime Environment**: Node.js (not Python - please change this)
7. **Build Command**: `npm install && npm run build`
8. **Start Command**: `npm start`
9. **Instance Type**: Starter (512 MB, 0.5 CPU) - sufficient for initial testing
10. **Environment Variables**:
    - `NODE_ENV`: production
    - `REACT_APP_API_URL`: [Your Phase 7.0 backend URL from Render dashboard]
    - `REACT_APP_AUTH_DOMAIN`: [Same as API URL if using custom auth, or leave blank]

## Setting Up Custom Domain (promethios.ai)

After your Render deployment is live, follow these steps to point your custom domain to it:

### 1. Add Custom Domain in Render

1. Go to your Phase 7.1 service in the Render dashboard
2. Click on the "Settings" tab
3. Scroll down to "Custom Domains"
4. Click "Add Custom Domain"
5. Enter your domain: `promethios.ai` (or `beta.promethios.ai` if you want a subdomain)
6. Click "Save"
7. Render will provide you with **DNS records** that you need to add to your domain registrar

### 2. Update DNS Records at Your Domain Registrar

1. Log in to your domain registrar (e.g., GoDaddy, Namecheap, Google Domains)
2. Navigate to the DNS settings for promethios.ai
3. Add the DNS records provided by Render:
   - For apex domain (promethios.ai):
     - Add an **A record** pointing to Render's IP address
     - Add the **CNAME record** for verification
   - For subdomain (e.g., beta.promethios.ai):
     - Add a **CNAME record** pointing to your Render URL

### 3. Verify Domain and Enable HTTPS

1. After adding DNS records, return to Render dashboard
2. Render will automatically verify your domain (may take up to 24 hours for DNS propagation)
3. Once verified, Render will automatically provision an SSL certificate for HTTPS

## Testing Your Deployment

1. First test using the Render-provided URL
2. Verify all features work correctly with the backend API
3. Once custom domain is set up, test again using your custom domain
4. Check that all API calls are working properly
5. Verify authentication flows if applicable

## Troubleshooting Common Issues

### API Connection Issues
- Ensure CORS is properly configured on your backend to allow requests from your new domain
- Check browser console for any API-related errors
- Verify the API URL is correctly set in environment variables

### Domain Configuration Issues
- DNS propagation can take up to 24 hours
- Verify DNS records match exactly what Render provided
- Check for any conflicting DNS records

### Render Deployment Issues
- Ensure Node.js is selected as the runtime (not Python)
- Check build logs for any errors during npm install or build
- Verify start command is correct for a React application

If you encounter any specific issues during deployment, please provide the error messages and I can help troubleshoot further.
