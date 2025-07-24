# Complete Email Automation Deployment Guide

## 🎯 Overview

This guide provides step-by-step instructions to deploy your complete email automation system. After following this guide, every waitlist signup will automatically receive a professional, personalized email from `hello@promethios.ai`.

## Prerequisites Checklist

Before starting, ensure you have:

- ✅ Gmail account with `hello@promethios.ai` configured (from previous guide)
- ✅ Gmail App Password generated
- ✅ Firebase project with billing enabled
- ✅ Firebase CLI installed (`npm install -g firebase-tools`)
- ✅ Node.js 18+ installed

## Step-by-Step Deployment

### Step 1: Navigate to Functions Directory

```bash
cd /home/ubuntu/promethios/firebase-functions
```

### Step 2: Initialize Firebase Project

If you haven't already connected this directory to your Firebase project:

```bash
firebase login
firebase init
```

When prompted:
- Select **"Functions"** and **"Firestore"**
- Choose your existing Firebase project
- Select **TypeScript** for functions
- Install dependencies: **Yes**

### Step 3: Install Dependencies

```bash
npm install
```

This will install:
- `firebase-admin` - Firebase Admin SDK
- `firebase-functions` - Cloud Functions framework
- `nodemailer` - Email sending library
- TypeScript and type definitions

### Step 4: Configure Email Credentials

Set your Gmail credentials for the Firebase function:

```bash
firebase functions:config:set email.service="gmail" email.user="hello@promethios.ai" email.pass="YOUR-16-CHAR-APP-PASSWORD"
```

**Replace `YOUR-16-CHAR-APP-PASSWORD`** with the App Password you generated in Gmail settings.

### Step 5: Build the Functions

```bash
npm run build
```

This compiles the TypeScript code to JavaScript in the `lib` directory.

### Step 6: Deploy to Firebase

```bash
firebase deploy --only functions
```

This will:
- Upload your functions to Firebase
- Set up the Firestore trigger
- Configure the email service
- Provide you with function URLs

### Step 7: Verify Deployment

After deployment, you should see output like:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
Function URL (sendWaitlistEmail): https://us-central1-your-project.cloudfunctions.net/sendWaitlistEmail
Function URL (testEmail): https://us-central1-your-project.cloudfunctions.net/testEmail
```

## Testing Your Email System

### Test 1: Manual Function Test

Visit the `testEmail` function URL in your browser:
```
https://us-central1-your-project.cloudfunctions.net/testEmail
```

This should return a JSON response showing that email templates are working.

### Test 2: Live Waitlist Test

1. Go to your waitlist signup page
2. Submit a new application with a test email
3. Check Firebase Functions logs: `firebase functions:log`
4. Verify the email was sent and received

### Test 3: Check Firestore

In your Firebase Console:
1. Go to Firestore Database
2. Check the `waitlist` collection
3. Look for new fields in recent documents:
   - `emailSent: true`
   - `emailSentAt: [timestamp]`
   - `emailMessageId: [message-id]`

## Monitoring and Troubleshooting

### View Function Logs

```bash
firebase functions:log
```

Look for:
- ✅ `📧 New waitlist submission received`
- ✅ `📤 Sending email to: [email]`
- ✅ `✅ Email sent successfully`

### Common Issues and Solutions

#### Issue 1: "Email configuration missing"

**Error**: `Email configuration missing. Please set email.user and email.pass`

**Solution**: 
```bash
firebase functions:config:get
firebase functions:config:set email.service="gmail" email.user="hello@promethios.ai" email.pass="YOUR-APP-PASSWORD"
firebase deploy --only functions
```

#### Issue 2: "Invalid login" or "Authentication failed"

**Error**: `Invalid login: 535-5.7.8 Username and Password not accepted`

**Solutions**:
1. Verify your App Password is correct (16 characters, no spaces)
2. Ensure 2-factor authentication is enabled on Gmail
3. Try regenerating the App Password
4. Check if Gmail account is locked or has security restrictions

#### Issue 3: Function timeout

**Error**: `Function execution took longer than 60 seconds`

**Solution**: The function might be working but taking time. Check:
1. Firebase Functions logs for actual status
2. Firestore for `emailSent` field updates
3. Your email inbox for delivered messages

#### Issue 4: Billing required

**Error**: `Billing account not configured`

**Solution**: 
1. Go to Firebase Console → Settings → Usage and billing
2. Set up a billing account (required for external API calls like email)
3. Redeploy functions: `firebase deploy --only functions`

### Email Delivery Monitoring

The system automatically tracks email delivery:

- **Success**: `emailSent: true`, `emailSentAt: timestamp`, `emailMessageId: id`
- **Failure**: `emailSent: false`, `emailError: error message`, `emailErrorAt: timestamp`

You can query Firestore to monitor delivery rates:

```javascript
// Query successful emails
const successfulEmails = await db.collection('waitlist')
  .where('emailSent', '==', true)
  .get();

// Query failed emails  
const failedEmails = await db.collection('waitlist')
  .where('emailSent', '==', false)
  .get();
```

## Email Template Customization

### Updating Email Content

To modify email templates:

1. Edit `/home/ubuntu/promethios/firebase-functions/src/index.ts`
2. Modify the `generateHTMLEmail()` or `generateTextEmail()` functions
3. Rebuild and redeploy:
   ```bash
   npm run build
   firebase deploy --only functions
   ```

### Adding New Personalization Fields

To add new personalization:

1. Update the email template functions
2. Ensure the data is available in the `WaitlistData` interface
3. Test with the `testEmail` function
4. Deploy the updated function

## Security Best Practices

### App Password Security

- Store App Passwords securely using Firebase Functions config
- Never commit passwords to version control
- Rotate App Passwords periodically
- Use specific App Passwords for each service

### Email Security

- Always use SSL/TLS for SMTP connections
- Monitor failed login attempts
- Set up email authentication (SPF, DKIM) for your domain
- Consider rate limiting for email sending

## Performance Optimization

### Function Performance

The current function is optimized for:
- **Cold start time**: ~2-3 seconds
- **Execution time**: ~1-2 seconds per email
- **Memory usage**: 256MB (default)
- **Timeout**: 60 seconds

### Scaling Considerations

For high-volume usage:
- Consider using Firebase Functions 2nd gen for better performance
- Implement email queuing for batch processing
- Use dedicated email services (SendGrid, Mailgun) for better deliverability
- Monitor and set appropriate concurrency limits

## Maintenance and Updates

### Regular Maintenance

1. **Monitor logs weekly** for errors or delivery issues
2. **Check email deliverability** monthly
3. **Update dependencies** quarterly
4. **Review and rotate credentials** annually

### Updating the System

To update email templates or functionality:

1. Make changes to `src/index.ts`
2. Test locally if possible
3. Build: `npm run build`
4. Deploy: `firebase deploy --only functions`
5. Test with a live waitlist submission
6. Monitor logs for any issues

## Success Metrics

Your email automation system is working correctly when:

- ✅ **100% trigger rate**: Every waitlist submission triggers the function
- ✅ **95%+ delivery rate**: Most emails are successfully sent
- ✅ **<5 second response time**: Functions execute quickly
- ✅ **Zero manual intervention**: System runs automatically
- ✅ **Professional appearance**: Emails look great on all devices

## Support and Resources

### Firebase Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

### Email Resources

- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Email Deliverability Best Practices](https://sendgrid.com/blog/email-deliverability-best-practices/)

### Getting Help

If you encounter issues:

1. Check Firebase Functions logs: `firebase functions:log`
2. Review this troubleshooting guide
3. Test individual components (Gmail setup, function deployment, etc.)
4. Check Firebase Console for billing and quota issues

---

**Congratulations!** 🎉 Your email automation system is now deployed and ready to send professional, personalized emails to every waitlist signup automatically!

