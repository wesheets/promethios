# Firebase Functions Email Setup

## Overview
Firebase Functions have been configured to automatically send email notifications using Resend when:
- ✅ **User approved**: Welcome email with access instructions
- ❌ **User rejected**: Polite rejection email with next steps  
- 🔔 **New signup**: Admin notification to wesheets@gmail.com

## Environment Variables Setup

### For Production Deployment
Set these environment variables in Firebase Functions:

```bash
# Set Resend API key
firebase functions:config:set resend.api_key="re_52g5Mzoi_DQuVj5HDi5uYCgynwcWRYogB"

# Set from email (update with your verified domain)
firebase functions:config:set email.from="noreply@spark.com"

# Set admin email
firebase functions:config:set email.admin="wesheets@gmail.com"

# Set app URL
firebase functions:config:set app.url="https://promethios-phase-7-1-ui.onrender.com"
```

### For Local Development
The `.env` file is already configured with the provided values.

## Email Domain Setup

**Important**: Update the `FROM_EMAIL` in the functions once you have:
1. **Added your domain** to Resend (e.g., `spark.com`)
2. **Verified the domain** with DNS records
3. **Updated the email address** to use your domain (e.g., `noreply@spark.com`)

## Deployment Commands

```bash
# Deploy functions only
firebase deploy --only functions

# Deploy everything (functions + hosting + firestore rules)
firebase deploy
```

## Testing

Use the test endpoint to verify email sending:
```
GET https://your-project.cloudfunctions.net/testEmail?to=test@example.com&type=approval
GET https://your-project.cloudfunctions.net/testEmail?to=test@example.com&type=rejection
```

## Functions Created

1. **`onUserApprovalStatusChange`**: Firestore trigger that sends emails when approval status changes
2. **`onNewUserSignup`**: Firestore trigger that notifies admin of new signups
3. **`testEmail`**: HTTP function for testing email delivery
4. **`getSignupStats`**: HTTP function for admin dashboard statistics

## Email Templates

Professional HTML email templates included for:
- **Welcome email**: Branded with Spark colors and clear next steps
- **Rejection email**: Polite with optional admin notes
- **Admin notification**: Detailed signup info with direct link to admin panel

## Security Notes

- API keys are stored securely in Firebase Functions environment
- Functions only trigger on legitimate Firestore changes
- Admin emails only sent to configured admin address
- All email sending is logged for debugging

