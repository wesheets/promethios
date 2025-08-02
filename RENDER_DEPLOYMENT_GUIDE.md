# Promethios Standalone Chatbot - Render Deployment Guide

This guide walks you through deploying the Promethios Standalone Chatbot system on Render.

## 🚀 **System Overview**

The standalone chatbot system consists of:
- **Backend API**: FastAPI application with governance integration
- **Frontend**: React application with demo widget
- **Widget**: Embeddable JavaScript for customer websites

### Required Accounts & Keys
- ✅ Render account (render.com)
- ✅ GitHub repository access (wesheets/promethios)
- ✅ Anthropic API key: `sk-ant-api03-YOUR_ANTHROPIC_API_KEY_HERE`
- ✅ Firebase project credentials
- ✅ Stripe account (for billing)
- ✅ SendGrid account (for emails)

## 📋 **Step 1: Create Backend API Service**

### 1.1 Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"Add new"** → **"Web Service"**
3. Select **wesheets/promethios** repository
4. Configure service:
   - **Name**: `promethios-chatbot-api`
   - **Runtime**: Python 3
   - **Branch**: `feature/enhanced-veritas-2-integration`
   - **Root Directory**: `src/api/standalone_chatbot`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Starter ($7/month)

### 1.2 Environment Variables
Add these environment variables:

```bash
# Application Environment
ENVIRONMENT=production
PORT=10000

# Database (use existing Promethios database)
DATABASE_URL=postgresql://username:password@host:port/database

# Anthropic API (for demo)
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_ANTHROPIC_API_KEY_HERE

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Stripe (for billing)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# SendGrid (for emails)
SENDGRID_API_KEY=SG.your_sendgrid_api_key

# CORS Origins
CORS_ORIGINS=https://chat.promethios.ai,https://promethios.ai
```

### 1.3 Deploy Backend
1. Click **"Deploy Web Service"**
2. Wait for deployment to complete
3. Note the service URL: `https://promethios-chatbot-api.onrender.com`

## 📋 **Step 2: Create Frontend Static Site**

### 2.1 Create Static Site
1. Click **"Add new"** → **"Static Site"**
2. Select **wesheets/promethios** repository
3. Configure site:
   - **Name**: `promethios-chatbot-frontend`
   - **Branch**: `feature/enhanced-veritas-2-integration`
   - **Root Directory**: `ui/standalone-chatbot`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

### 2.2 Environment Variables
Add these environment variables:

```bash
# API Configuration
REACT_APP_API_BASE_URL=https://promethios-chatbot-api.onrender.com/api/v1

# Firebase Configuration (public keys)
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Analytics
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX

# Branding
REACT_APP_COMPANY_NAME=Promethios
REACT_APP_SUPPORT_EMAIL=support@promethios.ai
```

### 2.3 Deploy Frontend
1. Click **"Deploy Static Site"**
2. Wait for deployment to complete
3. Note the service URL: `https://promethios-chatbot-frontend.onrender.com`

## 📋 **Step 3: Configure Custom Domains**

### 3.1 Backend Domain
1. Go to backend service settings
2. Add custom domain: `api.chat.promethios.ai`
3. Configure DNS CNAME record:
   ```
   api.chat.promethios.ai → promethios-chatbot-api.onrender.com
   ```

### 3.2 Frontend Domain
1. Go to frontend service settings
2. Add custom domain: `chat.promethios.ai`
3. Configure DNS CNAME record:
   ```
   chat.promethios.ai → promethios-chatbot-frontend.onrender.com
   ```

## 📋 **Step 4: Update Environment Variables**

After custom domains are configured, update the environment variables:

### Backend API
```bash
CORS_ORIGINS=https://chat.promethios.ai,https://promethios.ai
```

### Frontend
```bash
REACT_APP_API_BASE_URL=https://api.chat.promethios.ai/api/v1
```

## 🧪 **Step 5: Testing**

### 5.1 Test Backend API
```bash
curl https://api.chat.promethios.ai/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "production",
  "api_version": "1.0.0"
}
```

### 5.2 Test Frontend
1. Visit `https://chat.promethios.ai`
2. Click **"Try Live Demo"**
3. Send a test message
4. Verify governance features work

### 5.3 Test Widget
Create a test HTML file:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Widget Test</title>
</head>
<body>
    <h1>Test Page</h1>
    <script>
      (function() {
        var script = document.createElement('script');
        script.src = 'https://chat.promethios.ai/widget.js';
        script.setAttribute('data-chatbot-id', 'demo');
        script.setAttribute('data-theme', 'auto');
        document.head.appendChild(script);
      })();
    </script>
</body>
</html>
```

## 🔧 **Troubleshooting**

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **API Connection Issues**
   - Verify CORS configuration
   - Check environment variables
   - Ensure API service is running

3. **Authentication Issues**
   - Verify Firebase configuration
   - Check API keys and secrets
   - Ensure proper CORS setup

### Logs and Monitoring
- Backend logs: Render service dashboard
- Frontend build logs: Static site dashboard
- Application monitoring: Set up external monitoring

## 🚀 **Production Checklist**

- [ ] Backend API deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Custom domains configured
- [ ] SSL certificates active
- [ ] Environment variables set
- [ ] Database connected
- [ ] Firebase authentication working
- [ ] Stripe billing integration tested
- [ ] Email notifications working
- [ ] Widget embeddable and functional
- [ ] Analytics tracking active
- [ ] Monitoring and alerts configured

## 📞 **Support**

For deployment issues:
- Check Render service logs
- Review environment variables
- Test API endpoints individually
- Contact Promethios support: support@promethios.ai

---

**🎉 Congratulations!** Your Promethios Standalone Chatbot system is now live and ready to serve governed AI to the world!

