# Firebase Console Deployment Guide

## 🎯 **Step-by-Step Instructions**

### **Step 1: Navigate to Functions**
1. In Firebase Console, click **"Functions"** in the left sidebar
2. Or go directly to: https://console.firebase.google.com/project/promethios-oregon/functions

### **Step 2: Create Function**
- If you see **"Get Started"** → Click it
- If you see **"Create Function"** → Click it
- Choose **"1st gen"** functions

### **Step 3: Upload Code**
**Option A: ZIP Upload (Easiest)**
1. Choose **"Upload ZIP file"**
2. Upload `firebase-functions-deploy.zip` (attached)
3. Click **"Deploy"**

**Option B: Copy/Paste Code**
1. Choose **"Source code editor"**
2. Copy the JavaScript code from `functions/lib/index.js`
3. Paste into editor
4. Click **"Deploy"**

### **Step 4: Set Environment Variables**
After deployment, go to **Configuration** tab and add:

```
resend.api_key = re_52g5Mzoi_DQuVj5HDi5uYCgynwcWRYogB
email.from = hello@promethios.ai
email.admin = wesheets@gmail.com
app.url = https://spark.promethios.ai
```

## ✅ **What Gets Deployed**

**Three Functions:**
1. **onUserApprovalStatusChange** - Sends welcome/rejection emails
2. **onNewUserSignup** - Sends confirmation + admin notification
3. **testEmail** - For testing email delivery

## 🧪 **Testing After Deployment**

1. Test signup at your app's `/signup` page
2. Check emails (should receive confirmation)
3. Check admin panel at `/ui/admin/beta-signups`
4. Test approval flow

The system will be fully live once deployed! 🚀

