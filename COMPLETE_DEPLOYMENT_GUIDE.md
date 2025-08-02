# Promethios Standalone Chatbot System - Complete Deployment Guide

## 🚀 Overview

This guide covers the complete deployment of the Promethios Standalone Chatbot System, a consumer-friendly AI governance platform that leverages existing Promethios infrastructure while providing a simplified user experience.

## 📋 System Architecture

### Backend Components
- **FastAPI Application**: `/src/api/standalone_chatbot/`
- **Database Integration**: PostgreSQL with existing Promethios schema
- **Agent Wrapper Integration**: Uses existing governance infrastructure
- **Authentication**: Firebase Auth with custom user management

### Frontend Components
- **React Application**: `/ui/standalone-chatbot/`
- **Landing Page**: Consumer-focused with live demo
- **User Dashboard**: Chatbot management interface
- **Admin Dashboard**: System administration tools

### Embeddable Widget
- **Vanilla JavaScript**: `/ui/standalone-chatbot/widget/ChatWidget.js`
- **Responsive Design**: Works on all devices
- **Customizable Themes**: Light/dark mode support
- **Governance Display**: Real-time trust scoring

## 🔧 Prerequisites

### Required Software
- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL 13+
- Git

### Required Accounts
- Firebase project (can use existing Promethios project)
- Stripe account for billing
- Anthropic API key for demo
- Render account for deployment

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/promethios
FIREBASE_PROJECT_ID=your-firebase-project
ANTHROPIC_API_KEY=sk-ant-api03-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CORS_ORIGINS=https://chat.promethios.ai,http://localhost:3000

# Frontend (.env)
REACT_APP_API_URL=https://api.chat.promethios.ai
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📦 Installation Steps

### 1. Backend Setup

```bash
# Navigate to project root
cd promethios

# Install Python dependencies
pip install -r requirements.txt

# Set up database
python -m alembic upgrade head

# Run database migrations for standalone chatbot
python src/api/standalone_chatbot/database.py

# Start backend server
uvicorn src.main_standalone_chatbot:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd ui/standalone-chatbot

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### 3. Widget Deployment

```bash
# Copy widget file to public directory
cp widget/ChatWidget.js public/widget.js

# The widget will be available at:
# https://chat.promethios.ai/widget.js
```

## 🌐 Deployment Options

### Option 1: Render Deployment (Recommended)

#### Backend Deployment
1. Create new Render Web Service
2. Connect to GitHub repository
3. Configure build settings:
   ```
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn src.main_standalone_chatbot:app --host 0.0.0.0 --port $PORT
   ```
4. Add environment variables in Render dashboard

#### Frontend Deployment
1. Create new Render Static Site
2. Connect to GitHub repository
3. Configure build settings:
   ```
   Build Command: cd ui/standalone-chatbot && npm install && npm run build
   Publish Directory: ui/standalone-chatbot/build
   ```

### Option 2: Custom Server Deployment

#### Using Docker
```dockerfile
# Backend Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "src.main_standalone_chatbot:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY ui/standalone-chatbot/package*.json ./
RUN npm install
COPY ui/standalone-chatbot/ .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
```

## 🔐 Security Configuration

### SSL/TLS Setup
- Use Let's Encrypt for free SSL certificates
- Configure HTTPS redirects
- Set secure headers

### CORS Configuration
```python
# In main_standalone_chatbot.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://chat.promethios.ai"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting
```python
# Add to routes.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/demo/message")
@limiter.limit("10/minute")
async def demo_message(request: Request):
    # Demo endpoint with rate limiting
    pass
```

## 💳 Billing Integration

### Stripe Setup
1. Create Stripe account
2. Set up products and pricing
3. Configure webhooks
4. Test payment flow

### Subscription Management
```python
# Example subscription creation
import stripe

def create_subscription(customer_id: str, price_id: str):
    return stripe.Subscription.create(
        customer=customer_id,
        items=[{"price": price_id}],
        payment_behavior="default_incomplete",
        expand=["latest_invoice.payment_intent"],
    )
```

## 📧 Email Configuration

### SendGrid Setup
```python
# Email service configuration
import sendgrid
from sendgrid.helpers.mail import Mail

def send_welcome_email(user_email: str, user_name: str):
    message = Mail(
        from_email='noreply@promethios.ai',
        to_emails=user_email,
        subject='Welcome to Promethios Chatbots',
        html_content=f'<h1>Welcome {user_name}!</h1>'
    )
    
    sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
    response = sg.send(message)
```

## 📊 Monitoring & Analytics

### Health Checks
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }
```

### Logging Configuration
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

### Performance Monitoring
- Use Sentry for error tracking
- Implement custom metrics
- Monitor API response times
- Track user engagement

## 🧪 Testing

### Backend Tests
```bash
# Run API tests
pytest src/api/standalone_chatbot/tests/

# Run with coverage
pytest --cov=src/api/standalone_chatbot
```

### Frontend Tests
```bash
# Run React tests
cd ui/standalone-chatbot
npm test

# Run E2E tests
npm run test:e2e
```

### Widget Testing
```html
<!-- Test widget integration -->
<script src="https://chat.promethios.ai/widget.js" 
        data-chatbot-id="test-bot-123"
        data-theme="dark"
        data-position="bottom-right">
</script>
```

## 🚀 Go-Live Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed
- [ ] Payment processing tested
- [ ] Email notifications working
- [ ] Demo chatbot functional
- [ ] Widget embeds properly
- [ ] Mobile responsiveness verified

### Launch Day
- [ ] DNS records updated
- [ ] Monitoring alerts configured
- [ ] Backup procedures in place
- [ ] Support documentation ready
- [ ] Marketing materials prepared

### Post-Launch
- [ ] Monitor error rates
- [ ] Track user signups
- [ ] Analyze conversion metrics
- [ ] Gather user feedback
- [ ] Plan feature iterations

## 🔧 Troubleshooting

### Common Issues

#### Widget Not Loading
```javascript
// Check console for errors
console.log('Widget config:', window.demoConfig);

// Verify script tag
<script src="https://chat.promethios.ai/widget.js" 
        data-chatbot-id="your-bot-id">
</script>
```

#### API Connection Issues
```python
# Check CORS configuration
# Verify environment variables
# Test API endpoints directly
```

#### Database Connection Problems
```bash
# Check connection string
# Verify database permissions
# Test connection manually
```

## 📞 Support

### Documentation
- API Documentation: `/docs` endpoint
- Widget Documentation: `/widget-docs`
- User Guide: `/help`

### Contact
- Technical Support: tech@promethios.ai
- Business Inquiries: sales@promethios.ai
- Emergency: Use Slack #promethios-alerts

## 🔄 Maintenance

### Regular Tasks
- Update dependencies monthly
- Review security logs weekly
- Monitor performance metrics daily
- Backup database daily

### Scaling Considerations
- Horizontal scaling for API servers
- CDN for widget distribution
- Database read replicas
- Caching layer implementation

---

This deployment guide ensures a smooth launch of the Promethios Standalone Chatbot System with enterprise-grade reliability and security.

