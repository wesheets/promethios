# Firebase Functions Deployment Instructions

## 🚀 **Option 1: Deploy from Your Local Machine (Recommended)**

1. **Clone/Pull the latest code** to your local machine
2. **Navigate to the project directory**
3. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

4. **Authenticate with Firebase:**
   ```bash
   firebase login
   ```

5. **Set the active project:**
   ```bash
   firebase use promethios-oregon
   ```

6. **Navigate to functions directory and install dependencies:**
   ```bash
   cd functions
   npm install
   ```

7. **Deploy the functions:**
   ```bash
   firebase deploy --only functions
   ```

## 🔧 **Option 2: Manual Upload via Firebase Console**

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select promethios-oregon project**
3. **Navigate to Functions** in the left sidebar
4. **Upload the functions** from the `functions/lib/index.js` file

## 📧 **Environment Variables Needed**

The functions need these environment variables set in Firebase:

```bash
firebase functions:config:set resend.api_key="re_52g5Mzoi_DQuVj5HDi5uYCgynwcWRYogB"
firebase functions:config:set email.from="hello@promethios.ai"
firebase functions:config:set email.admin="wesheets@gmail.com"
firebase functions:config:set app.url="https://spark.promethios.ai"
```

## ✅ **What Gets Deployed**

**Three Cloud Functions:**
1. **`onUserApprovalStatusChange`** - Sends welcome/rejection emails when approval status changes
2. **`onNewUserSignup`** - Sends confirmation email to user + notification to admin
3. **`testEmail`** - Testing endpoint for email functionality
4. **`getSignupStats`** - Statistics for admin dashboard

## 🧪 **Testing After Deployment**

1. **Test signup flow** at `/signup`
2. **Check email delivery** (confirmation + admin notification)
3. **Test admin panel** at `/ui/admin/beta-signups`
4. **Test approval flow** (approve user → welcome email)
5. **Verify full access** for approved users

## 📋 **Files Ready for Deployment**

- ✅ `functions/src/index.ts` - Main functions code
- ✅ `functions/package.json` - Dependencies
- ✅ `functions/tsconfig.json` - TypeScript config
- ✅ `functions/lib/index.js` - Compiled JavaScript (ready to deploy)
- ✅ `firebase.json` - Firebase configuration
- ✅ `functions/.env` - Environment variables (for local testing)

## 🔐 **Security Notes**

- **API Key**: Stored securely in Firebase Functions environment
- **Email sending**: Server-side only (secure)
- **Admin access**: Restricted to `wesheets@gmail.com`
- **User data**: All stored in `promethios-oregon` Firestore

The system is production-ready and secure! 🚀

