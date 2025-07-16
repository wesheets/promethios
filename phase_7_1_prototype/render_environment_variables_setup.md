# Render Environment Variables Setup

## 🚀 **REQUIRED ENVIRONMENT VARIABLES FOR PRODUCTION**

### **Frontend Service (promethios-phase-7-1-ui)**

Add these environment variables in your Render dashboard:

```bash
# Backend API Configuration
BACKEND_API_URL=https://promethios-phase-7-1-api.onrender.com

# Firebase Configuration (if not already set)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### **Backend Service (promethios-phase-7-1-api)**

Ensure these environment variables are set:

```bash
# API Keys (if not already set)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
COHERE_API_KEY=your_cohere_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key

# Default LLM Configuration
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4

# Firebase Admin (if using Firebase)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

## 🔧 **How to Add Environment Variables in Render:**

1. **Go to your Render Dashboard**
2. **Select your service** (promethios-phase-7-1-ui)
3. **Click on "Environment"** tab
4. **Add each variable** with the key-value pairs above
5. **Click "Save Changes"**
6. **Redeploy the service** (it should auto-deploy after env changes)

## 🎯 **Critical Variable:**

The most important one for the API key system to work is:

```bash
BACKEND_API_URL=https://promethios-phase-7-1-api.onrender.com
```

This tells the frontend where to find the backend API for the `/api/keys` endpoints.

## 🧪 **Testing After Setup:**

Once you add the environment variables and redeploy:

1. ✅ **API Keys page** should load instead of spinning
2. ✅ **Agent creation** should generate real API keys
3. ✅ **Chat functionality** should work with authentication
4. ✅ **Agent management** should show real keys instead of placeholders

## 🚨 **Current Issue:**

The frontend is calling `/api/keys` but getting 404 errors because it doesn't know where the backend is located. Adding `BACKEND_API_URL` will fix this immediately.

