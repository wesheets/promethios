# 📧 Simple Email Setup Instructions

I've created a **complete Firebase Cloud Function** that will automatically send professional emails when someone joins your waitlist. Here's exactly what you need to do:

## 🎯 What I Built For You

✅ **Complete Firebase Cloud Function** (`/promethios/firebase-functions/`)
✅ **Professional HTML email templates** with Promethios branding
✅ **Automatic triggering** when someone joins the waitlist
✅ **Lead scoring integration** and personalized content
✅ **Error handling** and email delivery tracking

## 📋 Setup Steps (Only 4 steps!)

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Navigate to the functions directory
```bash
cd /home/ubuntu/promethios/firebase-functions
```

### Step 4: Set up your email credentials

**Option A: Using Gmail (Easiest)**
```bash
firebase functions:config:set email.service="gmail" email.user="your-email@gmail.com" email.pass="your-app-password"
```

**Option B: Using SendGrid (More professional)**
```bash
firebase functions:config:set email.service="SendGrid" email.user="apikey" email.pass="your-sendgrid-api-key"
```

### Step 5: Install dependencies and deploy
```bash
npm install
firebase deploy --only functions
```

## 🔑 Email Credentials Setup

### For Gmail:
1. Go to your Google Account settings
2. Enable 2-factor authentication
3. Generate an "App Password" for email
4. Use that app password (not your regular password)

### For SendGrid (Recommended for production):
1. Sign up at sendgrid.com
2. Create an API key
3. Use "apikey" as username and your API key as password

## 🎉 What Happens After Setup

1. **Automatic emails** sent to every new waitlist signup
2. **Professional templates** with their personalized information
3. **Email tracking** - success/failure logged in Firestore
4. **No manual work** required - completely automated

## 🧪 Testing

After deployment, you can test by:
1. Submitting a new waitlist entry on your site
2. Check Firebase Functions logs: `firebase functions:log`
3. Verify email was sent and received

## 🆘 If You Need Help

The functions are ready to deploy. If you run into any issues:
1. Check Firebase Functions logs for errors
2. Verify your email credentials are correct
3. Make sure your Firebase project has billing enabled (required for external API calls)

**That's it!** Once deployed, every waitlist signup will automatically receive a beautiful, personalized thank-you email from Promethios.

## 📁 Files I Created:
- `/promethios/firebase-functions/src/index.ts` - Main email function
- `/promethios/firebase-functions/package.json` - Dependencies
- `/promethios/firebase-functions/firebase.json` - Configuration
- `/promethios/firebase-functions/tsconfig.json` - TypeScript config

Everything is ready for deployment! 🚀

