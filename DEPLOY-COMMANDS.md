# 🚀 Firebase Email Automation - Ready to Deploy!

## ✅ **Your Credentials (Configured)**
- **Firebase Project**: `promethios`
- **Email**: `hello@promethios.ai`
- **App Password**: `pphy pgtm uoan yjgh`

## 📋 **Exact Commands to Run**

### **Step 1: Download the Functions**
If you're on your local machine, download the `/home/ubuntu/promethios/firebase-functions/` folder.

### **Step 2: Navigate to Functions Directory**
```bash
cd firebase-functions
```

### **Step 3: Install Dependencies**
```bash
npm install
```

### **Step 4: Login to Firebase**
```bash
firebase login
```
(This will open your browser to authenticate with Google)

### **Step 5: Set Your Project**
```bash
firebase use promethios
```

### **Step 6: Configure Email Credentials**
```bash
firebase functions:config:set email.service="gmail" email.user="hello@promethios.ai" email.pass="pphy pgtm uoan yjgh"
```

### **Step 7: Build the Functions**
```bash
npm run build
```

### **Step 8: Deploy to Firebase**
```bash
firebase deploy --only functions
```

## 🎉 **After Deployment**

You should see output like:
```
✔  Deploy complete!

Function URL (sendWaitlistEmail): https://us-central1-promethios.cloudfunctions.net/sendWaitlistEmail
Function URL (testEmail): https://us-central1-promethios.cloudfunctions.net/testEmail
```

## 🧪 **Test the System**

### **Test 1: Check Function Status**
Visit: `https://us-central1-promethios.cloudfunctions.net/testEmail`

### **Test 2: Submit Waitlist Entry**
Go to your waitlist page and submit a test entry.

### **Test 3: Check Logs**
```bash
firebase functions:log
```

## 🔍 **Verify Email Delivery**

1. Check your test email inbox
2. Look for email from "Promethios <hello@promethios.ai>"
3. Verify it has professional formatting and personalization

## 🆘 **If You Need Help**

If anything goes wrong:
1. Check Firebase Functions logs: `firebase functions:log`
2. Verify billing is enabled in Firebase Console
3. Make sure the App Password is correct
4. Check that 2-Step Verification is still enabled

---

**Everything is ready!** Just run these commands and your email automation will be live! 🚀

