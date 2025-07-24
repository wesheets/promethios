# Gmail + Porkbun Email Integration Guide

## 🎯 Overview

This guide will help you integrate your `hello@promethios.ai` email from Porkbun with Gmail, then configure Firebase to send automatic waitlist emails from your professional domain.

## Part 1: Adding Porkbun Email to Gmail

### Step 1: Access Gmail Settings

1. Open Gmail in your browser
2. Click the **Settings gear icon** (top right)
3. Select **"See all settings"**
4. Navigate to the **"Accounts and Import"** tab

### Step 2: Add Your Porkbun Email Account

1. In the **"Check mail from other accounts"** section, click **"Add a mail account"**
2. Enter your email: `hello@promethios.ai`
3. Click **"Next"**

### Step 3: Configure IMAP Settings (for receiving emails)

Use these settings from your Porkbun configuration:

```
Email address: hello@promethios.ai
Username: hello@promethios.ai
Password: [Your Porkbun email password]
POP Server: pop.porkbun.com
Port: 995
Security: SSL/TLS (Always use SSL)
```

**Note:** If POP doesn't work, try IMAP:
```
IMAP Server: imap.porkbun.com
Port: 993
Security: SSL/TLS
```

### Step 4: Add Send-As Address

1. In the **"Send mail as"** section, click **"Add another email address"**
2. Enter:
   - **Name**: `Promethios`
   - **Email address**: `hello@promethios.ai`
   - **Treat as an alias**: ✅ (checked)
3. Click **"Next Step"**

### Step 5: Configure SMTP Settings (for sending emails)

Use these SMTP settings from your Porkbun configuration:

```
SMTP Server: smtp.porkbun.com
Port: 587 (or 465 for SSL)
Username: hello@promethios.ai
Password: [Your Porkbun email password]
Security: STARTTLS (for port 587) or SSL (for port 465)
```

**Important:** If you encounter issues with port 587, try port 465 with SSL as mentioned in the Microsoft Outlook notice.

### Step 6: Verify Your Email

1. Gmail will send a verification code to `hello@promethios.ai`
2. Check your Porkbun webmail or wait for it to sync to Gmail
3. Enter the verification code
4. Click **"Verify"**

## Part 2: Generate Gmail App Password

Since we'll be using this email with Firebase, you need to create an App Password:

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **"Security"**
3. Enable **"2-Step Verification"** if not already enabled

### Step 2: Generate App Password

1. In Google Account Security settings
2. Click **"App passwords"**
3. Select **"Mail"** as the app
4. Select **"Other (Custom name)"** as the device
5. Enter: `Promethios Firebase Functions`
6. Click **"Generate"**
7. **Save this password** - you'll need it for Firebase configuration

## Part 3: Test Your Setup

### Test Receiving Emails

1. Send a test email to `hello@promethios.ai` from another account
2. Check if it appears in your Gmail inbox
3. Verify the email shows the correct sender address

### Test Sending Emails

1. In Gmail, click **"Compose"**
2. In the **"From"** dropdown, select `hello@promethios.ai`
3. Send a test email to yourself
4. Verify it arrives with the correct sender address

## Troubleshooting Common Issues

### Issue 1: SMTP Connection Fails

**Solution**: Try different port configurations:
- Port 587 with STARTTLS
- Port 465 with SSL
- Port 50587 (alternative STARTTLS port mentioned by Porkbun)

### Issue 2: Authentication Errors

**Solutions**:
- Verify your Porkbun email password is correct
- Try using the full email address as the username
- Check if Porkbun requires specific authentication settings

### Issue 3: Emails Not Syncing

**Solutions**:
- Wait 10-15 minutes for initial sync
- Check Gmail's spam folder
- Verify IMAP/POP settings are correct
- Try refreshing Gmail

## Security Considerations

### App Password Security

- The App Password is specifically for Firebase functions
- It's different from your regular Gmail password
- Store it securely - you'll need it for Firebase configuration
- You can revoke it anytime from Google Account settings

### Email Security

- Always use SSL/TLS encryption
- Keep your Porkbun email password secure
- Consider enabling additional security features in Porkbun

## Next Steps

Once your Gmail + Porkbun integration is working:

1. ✅ You can send/receive emails from `hello@promethios.ai` in Gmail
2. ✅ You have an App Password for Firebase
3. 🎯 Ready to configure Firebase email automation

The next step will be configuring Firebase to use your `hello@promethios.ai` email for automatic waitlist responses.

## Configuration Summary

For Firebase configuration, you'll use:

```bash
firebase functions:config:set email.service="gmail" email.user="hello@promethios.ai" email.pass="[YOUR-APP-PASSWORD]"
```

Where `[YOUR-APP-PASSWORD]` is the 16-character password generated in Step 2 above.

---

**Need help with any of these steps?** Let me know which part you're stuck on and I can provide more detailed guidance!

