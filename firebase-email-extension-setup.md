# Firebase Trigger Email Extension Setup

## 🎯 Overview
This guide sets up automatic thank-you emails for waitlist submissions using Firebase Extensions.

## 📧 Extension Configuration

### 1. Install Firebase Trigger Email Extension

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Navigate to your project directory
cd /path/to/your/firebase/project

# Install the Trigger Email extension
firebase ext:install firebase/firestore-send-email
```

### 2. Extension Configuration Parameters

When prompted during installation, use these settings:

```yaml
# Collection Path
COLLECTION_PATH: waitlist

# Email Field Path  
EMAIL_FIELD_PATH: email

# Template Field Paths
TEMPLATE_FIELD_PATHS: to,subject,html,text

# Default From Email
DEFAULT_FROM: noreply@promethios.com

# Default Reply To
DEFAULT_REPLY_TO: support@promethios.com

# SMTP Configuration (if using custom SMTP)
SMTP_CONNECTION_URI: smtps://username:password@smtp.gmail.com:465
# OR use SendGrid, Mailgun, etc.
```

### 3. Email Template Structure

The extension will look for these fields in each waitlist document:

```javascript
{
  // Required fields (already in your waitlist collection)
  email: "user@example.com",
  name: "User Name", // We'll need to add this
  role: "enterprise-cto",
  organization: "Company Name",
  
  // Email template fields (we'll add these via Cloud Function)
  to: ["user@example.com"],
  subject: "Welcome to Promethios Private Beta - Application Received",
  html: "<html>...</html>", // Rich HTML email
  text: "Plain text version...", // Fallback text
  
  // Optional
  from: "noreply@promethios.com",
  replyTo: "support@promethios.com"
}
```

## 🔧 Implementation Steps

### Step 1: Update Waitlist Service
Add email template fields when creating waitlist entries.

### Step 2: Create Email Templates
Professional HTML and text templates with personalization.

### Step 3: Configure Email Provider
Set up SendGrid, Mailgun, or SMTP for reliable delivery.

### Step 4: Test & Deploy
Test with existing waitlist data and deploy.

## 📋 Next Actions

1. Install the extension in your Firebase project
2. Configure email provider credentials
3. Update waitlist service to include email template fields
4. Create professional email templates
5. Test with existing data

## 🎨 Email Template Preview

**Subject**: Welcome to Promethios Private Beta - Application Received

**Content**:
- Personalized greeting with role/organization
- Thank you message
- Next steps information
- Professional Promethios branding
- Contact information for questions

This setup will automatically send professional emails whenever someone joins your waitlist!

