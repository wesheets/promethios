# Firebase Trigger Email Extension Installation

## 🚀 Quick Installation Commands

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Navigate to your Firebase project directory
```bash
cd /path/to/your/firebase/project
```

### 4. Install the Trigger Email Extension
```bash
firebase ext:install firebase/firestore-send-email
```

## ⚙️ Configuration Parameters

When prompted during installation, use these settings:

### Required Parameters:
- **Collection Path**: `waitlist`
- **Email Field Path**: `email` 
- **Template Field Paths**: `to,subject,html,text`

### Email Provider Settings:
- **Default From**: `noreply@promethios.com`
- **Default Reply To**: `support@promethios.com`

### SMTP Configuration Options:

#### Option 1: Gmail SMTP
```
SMTP_CONNECTION_URI: smtps://your-email@gmail.com:your-app-password@smtp.gmail.com:465
```

#### Option 2: SendGrid
```
SMTP_CONNECTION_URI: smtps://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:465
```

#### Option 3: Mailgun
```
SMTP_CONNECTION_URI: smtps://postmaster@your-domain.com:YOUR_MAILGUN_PASSWORD@smtp.mailgun.org:465
```

## 🎯 What This Does

1. **Monitors** the `waitlist` collection for new documents
2. **Automatically sends** personalized emails when users join
3. **Uses** the email template fields we've added to each waitlist entry
4. **Delivers** professional emails from your domain

## 📧 Email Template Fields (Already Implemented)

Your waitlist service now automatically includes:
- `to`: Recipient email address
- `subject`: Personalized subject line
- `html`: Rich HTML email template
- `text`: Plain text fallback
- `from`: Your sender address
- `replyTo`: Support email address

## 🔧 Next Steps

1. Run the installation command above
2. Configure your email provider credentials
3. Test with a new waitlist submission
4. Monitor Firebase Functions logs for email delivery status

The system is ready to automatically send professional thank-you emails to every new waitlist signup!

