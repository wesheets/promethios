# Promethios Phase 7.1 Dual Deployment Guide: UI + API Setup

This guide provides comprehensive instructions for setting up both the UI and API components for Phase 7.1 on Render, creating a complete, self-contained deployment.

## Part 1: Setting Up the Backend API Service

### 1. Create a New Web Service in Render

1. Log in to your Render dashboard at https://dashboard.render.com
2. Click "New" and select "Web Service"
3. Connect to your GitHub repository
4. Configure the service with these settings:
   - **Name**: promethios-phase-7-1-api
   - **Environment**: Node.js
   - **Branch**: feature/phase-7-1-iphone-inspired-ui
   - **Root Directory**: phase_7_1_prototype/promethios-api (create this directory if it doesn't exist)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Starter (512 MB, 0.5 CPU)

### 2. Create the API Directory Structure

If the API directory doesn't exist yet, create it with the following structure:

```
phase_7_1_prototype/promethios-api/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── index.js
├── package.json
└── .env
```

### 3. Set Up the API Code

#### package.json
```json
{
  "name": "promethios-phase-7-1-api",
  "version": "1.0.0",
  "description": "Backend API for Promethios Phase 7.1",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "mongoose": "^7.5.0"
  },
  "devDependencies": {
    "jest": "^29.6.4",
    "nodemon": "^3.0.1"
  }
}
```

#### src/index.js
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/benchmark', require('./routes/benchmark'));
app.use('/api/feedback', require('./routes/feedback'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Promethios Phase 7.1 API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

#### src/routes/auth.js
```javascript
const express = require('express');
const router = express.Router();

// Mock user database
const users = [];

// Register endpoint
router.post('/register', (req, res) => {
  const { email, password } = req.body;
  
  // Check if user already exists
  if (users.find(user => user.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  // Create new user
  const newUser = { id: Date.now().toString(), email, password };
  users.push(newUser);
  
  res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
});

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Find user
  const user = users.find(user => user.email === email && user.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // In a real app, you would generate a JWT token here
  res.status(200).json({ 
    message: 'Login successful',
    userId: user.id,
    token: `mock-jwt-token-${user.id}`
  });
});

// Waitlist endpoint
router.post('/waitlist', (req, res) => {
  const { email, name, company } = req.body;
  
  // In a real app, you would save this to a database
  console.log(`Waitlist request: ${name} (${email}) from ${company || 'N/A'}`);
  
  res.status(200).json({ message: 'Added to waitlist successfully' });
});

module.exports = router;
```

#### src/routes/benchmark.js
```javascript
const express = require('express');
const router = express.Router();

// Get benchmark metrics
router.get('/metrics', (req, res) => {
  // Mock data for CMU benchmark metrics
  const metrics = {
    trustScore: {
      withGovernance: 92,
      withoutGovernance: 67,
      improvement: 37
    },
    complianceRate: {
      withGovernance: 98,
      withoutGovernance: 72,
      improvement: 36
    },
    errorReduction: {
      withGovernance: 89,
      withoutGovernance: 45,
      improvement: 98
    },
    integrationTime: {
      withGovernance: 2.5, // hours
      withoutGovernance: 8.2, // hours
      improvement: 70
    }
  };
  
  res.status(200).json(metrics);
});

// Get benchmark comparison data
router.get('/comparison', (req, res) => {
  // Mock data for before/after comparison
  const comparisonData = {
    categories: ['Trust', 'Compliance', 'Error Rate', 'Integration Time'],
    beforeGovernance: [67, 72, 55, 100],
    afterGovernance: [92, 98, 11, 30]
  };
  
  res.status(200).json(comparisonData);
});

// Get benchmark trends data
router.post('/simulate', (req, res) => {
  const { governanceStrictness, verificationDepth } = req.body;
  
  // Calculate simulated metrics based on parameters
  const strictnessFactor = governanceStrictness / 100;
  const depthFactor = verificationDepth / 100;
  
  const simulatedMetrics = {
    trustScore: Math.round(70 + (strictnessFactor * 25) + (depthFactor * 5)),
    complianceRate: Math.round(75 + (strictnessFactor * 20) + (depthFactor * 5)),
    errorReduction: Math.round(50 + (strictnessFactor * 30) + (depthFactor * 20)),
    integrationTime: Math.round(30 + (strictnessFactor * 10) + (depthFactor * 15))
  };
  
  res.status(200).json(simulatedMetrics);
});

module.exports = router;
```

#### src/routes/feedback.js
```javascript
const express = require('express');
const router = express.Router();

// Submit feedback
router.post('/submit', (req, res) => {
  const { userId, rating, comments, category } = req.body;
  
  // In a real app, you would save this to a database
  console.log(`Feedback received: Rating ${rating}/5, Category: ${category}, Comments: ${comments}`);
  
  res.status(200).json({ message: 'Feedback submitted successfully' });
});

module.exports = router;
```

### 4. Configure Environment Variables

In your Render dashboard, add these environment variables to your API service:
- `PORT`: 3000
- `NODE_ENV`: production
- `CORS_ORIGIN`: (This will be your UI URL, which we'll set up next)

## Part 2: Setting Up the Frontend UI Service

### 1. Create a New Web Service in Render

1. Log in to your Render dashboard
2. Click "New" and select "Web Service"
3. Connect to your GitHub repository
4. Configure the service with these settings:
   - **Name**: promethios-phase-7-1-ui
   - **Environment**: Node.js
   - **Branch**: feature/phase-7-1-iphone-inspired-ui
   - **Root Directory**: phase_7_1_prototype/promethios-ui
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Starter (512 MB, 0.5 CPU)

### 2. Configure Environment Variables

In your Render dashboard, add these environment variables to your UI service:
- `NODE_ENV`: production
- `REACT_APP_API_URL`: (This will be your API URL from Part 1)

### 3. Update API Integration in UI Code

Ensure your UI code is configured to use the environment variable for API calls:

#### src/services/api.js
```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authentication interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (email, password) => api.post('/api/auth/register', { email, password }),
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  joinWaitlist: (email, name, company) => api.post('/api/auth/waitlist', { email, name, company })
};

export const benchmarkService = {
  getMetrics: () => api.get('/api/benchmark/metrics'),
  getComparison: () => api.get('/api/benchmark/comparison'),
  simulateParameters: (governanceStrictness, verificationDepth) => 
    api.post('/api/benchmark/simulate', { governanceStrictness, verificationDepth })
};

export const feedbackService = {
  submitFeedback: (userId, rating, comments, category) => 
    api.post('/api/feedback/submit', { userId, rating, comments, category })
};

export default api;
```

## Part 3: Connecting the Services

### 1. Update CORS Configuration

After both services are deployed, you'll need to update the CORS configuration in your API service:

1. Get the URL of your deployed UI service (e.g., https://promethios-phase-7-1-ui.onrender.com)
2. Go to your API service in the Render dashboard
3. Update the `CORS_ORIGIN` environment variable with your UI URL
4. Restart the API service

### 2. Update API URL in UI Service

1. Get the URL of your deployed API service (e.g., https://promethios-phase-7-1-api.onrender.com)
2. Go to your UI service in the Render dashboard
3. Update the `REACT_APP_API_URL` environment variable with your API URL
4. Restart the UI service

## Part 4: Setting Up Custom Domain

### 1. Add Custom Domain in Render

1. Go to your UI service in the Render dashboard
2. Click on the "Settings" tab
3. Scroll down to "Custom Domains"
4. Click "Add Custom Domain"
5. Enter your domain: `promethios.ai` (or `beta.promethios.ai` for a subdomain)
6. Click "Save"
7. Render will provide you with DNS records to add to your domain registrar

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

## Part 5: Testing Your Deployment

### 1. Test API Endpoints

1. Use a tool like Postman or curl to test your API endpoints
2. Test the health check endpoint: `GET /health`
3. Test authentication endpoints: `POST /api/auth/register` and `POST /api/auth/login`
4. Test benchmark endpoints: `GET /api/benchmark/metrics` and `POST /api/benchmark/simulate`

### 2. Test UI Integration

1. Open your deployed UI in a browser
2. Test the signup and waitlist forms
3. Verify the CMU benchmark dashboard loads data correctly
4. Test parameter adjustments in the interactive playground
5. Submit feedback through the feedback widget

## Troubleshooting

### API Connection Issues
- Check that CORS is properly configured with the correct origin
- Verify API URL is correctly set in UI environment variables
- Check browser console for any API-related errors

### Deployment Issues
- Check build logs for any errors during npm install or build
- Verify start commands are correct for both services
- Ensure all required environment variables are set

### Domain Configuration Issues
- DNS propagation can take up to 24 hours
- Verify DNS records match exactly what Render provided
- Check for any conflicting DNS records
