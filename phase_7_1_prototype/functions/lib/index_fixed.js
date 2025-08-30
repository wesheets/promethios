"use strict";
/**
 * Firebase Functions for Promethios Spark Platform
 *
 * Handles email notifications for beta signup approvals/rejections
 * using Resend email service.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignupStats = exports.testEmail = exports.onNewUserSignup = exports.onUserApprovalStatusChange = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const resend_1 = require("resend");
// Initialize Firebase Admin
admin.initializeApp();
// Initialize Resend with API key from Firebase config
const resend = new resend_1.Resend(functions.config().resend.api_key);
// Email configuration from Firebase config
const FROM_EMAIL = functions.config().email.from || 'noreply@spark.com';
const ADMIN_EMAIL = functions.config().email.admin || 'wesheets@gmail.com';
const APP_URL = functions.config().app.url || 'https://spark.promethios.ai';
/**
 * Email Templates
 */
const emailTemplates = {
    // Immediate signup confirmation email
    signupConfirmation: {
        subject: 'Welcome to Spark Beta - Application Received! 🚀',
        html: (userData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Spark Beta</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; background: white; min-height: 100vh;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">SPARK</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Governed Multi-Agent Collaboration</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Thanks for joining the Spark Beta! 🎉</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
              Hi <strong>${userData.displayName || userData.name || 'there'}</strong>,
            </p>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
              Your application for <strong>Spark beta access</strong> has been received and is under review. You're applying to join something truly revolutionary.
            </p>
            
            <div style="background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">🚀 What is Spark?</h3>
              <p style="color: #555; line-height: 1.6; margin: 0 0 15px 0;">
                <strong>Spark is a governed multi-agent collaboration platform</strong> where humans and AI agents work together in the same conversations with full transparency and ethical oversight.
              </p>
              
              <ul style="color: #555; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li><strong>Multi-Agent Chats:</strong> Talk to multiple AI agents AND humans simultaneously</li>
                <li><strong>Model Agnostic:</strong> Wrap any LLM (OpenAI, Claude, Gemini) with governance</li>
                <li><strong>Bring Your Own Agents:</strong> Customize existing agents or deploy your own</li>
                <li><strong>Ethical Governance:</strong> Trust metrics, policy enforcement, audit logs</li>
                <li><strong>Full Transparency:</strong> Cryptographic audit trails you can inspect</li>
                <li><strong>Contextual Memory:</strong> Agents remember and learn from interactions</li>
              </ul>
            </div>
            
            <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #ffcc02;">
              <h4 style="color: #f57c00; margin: 0 0 10px 0; font-size: 16px;">⏰ What's Next?</h4>
              <p style="color: #666; line-height: 1.6; margin: 0;">
                Our team will review your application within <strong>2-3 business days</strong>. You'll receive an email once your access is approved, and you can start collaborating with governed AI agents immediately.
              </p>
            </div>
            
            <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #9c27b0;">
              <h4 style="color: #7b1fa2; margin: 0 0 10px 0; font-size: 16px;">🔮 Coming Soon</h4>
              <p style="color: #666; line-height: 1.6; margin: 0;">
                Agent marketplace, Slack-style organizations, advanced governance tools, and much more. You're getting early access to the future of AI collaboration.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin: 25px 0;">
              Questions? Reply to this email or reach out to our team.
            </p>
            
            <p style="color: #666; line-height: 1.6; margin: 0;">
              Best regards,<br>
              <strong>The Spark Team</strong>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; font-size: 14px; margin: 0;">
              © 2025 Promethios AI. Building the future of governed AI collaboration.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
    },
    approval: {
        subject: 'Welcome to Spark Beta! Your access has been approved',
        html: (userName, userEmail) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Spark Beta</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Spark Beta!</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${userName},</h2>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Great news! Your request for Spark beta access has been <strong>approved</strong>. 
            You can now access the full Spark platform and start collaborating with AI.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #28a745;">What's Next?</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Sign in to your Spark account</li>
              <li>Complete your profile setup</li>
              <li>Start your first AI collaboration</li>
              <li>Explore team features and integrations</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/login" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Access Spark Platform
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If you have any questions or need help getting started, feel free to reach out to our support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            This email was sent to ${userEmail} because you requested access to Spark beta.
            <br>© 2025 Promethios. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `
    },
    rejection: {
        subject: 'Update on your Spark Beta access request',
        html: (userName, userEmail, adminNotes) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Spark Beta Access Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Spark Beta Access Update</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${userName},</h2>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Thank you for your interest in Spark beta access. After careful review, 
            we're unable to approve your request at this time.
          </p>
          
          ${adminNotes ? `
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">Additional Information</h3>
            <p style="margin: 0;">${adminNotes}</p>
          </div>
          ` : ''}
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0c5460;">What's Next?</h3>
            <p style="margin: 0;">
              We're continuously expanding access to Spark. You can reapply in the future 
              or reach out to our team if you believe this decision was made in error.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            We appreciate your interest in Spark and apologize for any inconvenience.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            This email was sent to ${userEmail} regarding your Spark beta access request.
            <br>© 2025 Promethios. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `
    },
    adminNotification: {
        subject: 'New Spark Beta Signup Pending Review',
        html: (signupData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Beta Signup</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #343a40; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New Spark Beta Signup</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">New User Awaiting Review</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">User Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;"><strong>Name:</strong> ${signupData.name}</li>
              <li style="margin: 10px 0;"><strong>Email:</strong> ${signupData.email}</li>
              <li style="margin: 10px 0;"><strong>Role:</strong> ${signupData.role}</li>
              <li style="margin: 10px 0;"><strong>Organization:</strong> ${signupData.organization}</li>
              <li style="margin: 10px 0;"><strong>Why Spark:</strong> ${signupData.whyAccess}</li>
              ${signupData.currentAiTools ? `<li style="margin: 10px 0;"><strong>Current AI Tools:</strong> ${signupData.currentAiTools}</li>` : ''}
              ${signupData.socialProfile ? `<li style="margin: 10px 0;"><strong>Profile:</strong> <a href="${signupData.socialProfile}">${signupData.socialProfile}</a></li>` : ''}
              <li style="margin: 10px 0;"><strong>Onboarding Call:</strong> ${signupData.onboardingCall ? 'Yes' : 'No'}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/ui/admin/beta-signups" 
               style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">
              Review in Admin Panel
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            Admin notification for Spark beta signup management.
            <br>© 2025 Promethios. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `
    }
};
/**
 * Send email using Resend
 */
async function sendEmail(to, subject, html) {
    try {
        console.log(`📧 Sending email to: ${to}`);
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [to],
            subject: subject,
            html: html,
        });
        if (error) {
            console.error('❌ Resend error:', error);
            throw new Error(`Email sending failed: ${error.message}`);
        }
        console.log('✅ Email sent successfully:', data === null || data === void 0 ? void 0 : data.id);
    }
    catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
}
/**
 * Firestore trigger: Send email when user approval status changes
 */
exports.onUserApprovalStatusChange = functions.firestore
    .document('userProfiles/{userId}')
    .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = context.params.userId;
    // Check if approval status changed
    const statusChanged = beforeData.approvalStatus !== afterData.approvalStatus;
    if (!statusChanged) {
        console.log('👀 User profile updated but approval status unchanged');
        return;
    }
    console.log(`🔄 Approval status changed for user ${userId}: ${beforeData.approvalStatus} → ${afterData.approvalStatus}`);
    const userName = afterData.name || afterData.displayName || 'User';
    const userEmail = afterData.email;
    if (!userEmail) {
        console.error('❌ No email found for user:', userId);
        return;
    }
    try {
        switch (afterData.approvalStatus) {
            case 'approved':
                await sendEmail(userEmail, emailTemplates.approval.subject, emailTemplates.approval.html(userName, userEmail));
                console.log('✅ Approval email sent to:', userEmail);
                break;
            case 'rejected':
                await sendEmail(userEmail, emailTemplates.rejection.subject, emailTemplates.rejection.html(userName, userEmail, afterData.adminNotes));
                console.log('✅ Rejection email sent to:', userEmail);
                break;
            default:
                console.log('👀 No email action needed for status:', afterData.approvalStatus);
        }
    }
    catch (error) {
        console.error('❌ Error sending status change email:', error);
    }
});
/**
 * Firestore trigger: Send emails when new user signs up
 */
exports.onNewUserSignup = functions.firestore
    .document('userProfiles/{userId}')
    .onCreate(async (snapshot, context) => {
    const userData = snapshot.data();
    // Only send notification for pending signups
    if (userData.approvalStatus !== 'pending') {
        console.log('👀 Skipping email for non-pending signup:', userData.approvalStatus);
        return;
    }
    console.log('🆕 New user signup detected:', userData.email);
    try {
        // Send confirmation email to user
        await sendEmail(userData.email, emailTemplates.signupConfirmation.subject, emailTemplates.signupConfirmation.html(userData));
        console.log('✅ Signup confirmation email sent to:', userData.email);
        // Send notification email to admin
        await sendEmail(ADMIN_EMAIL, emailTemplates.adminNotification.subject, emailTemplates.adminNotification.html(userData));
        console.log('✅ Admin notification email sent to:', ADMIN_EMAIL);
    }
    catch (error) {
        console.error('❌ Error sending signup emails:', error);
    }
});
/**
 * Test email function for debugging
 */
exports.testEmail = functions.https.onRequest(async (req, res) => {
    try {
        const testData = {
            name: 'Test User',
            email: 'test@example.com',
            displayName: 'Test User'
        };
        await sendEmail(ADMIN_EMAIL, 'Test Email from Spark Functions', emailTemplates.signupConfirmation.html(testData));
        res.json({
            success: true,
            message: 'Test email sent successfully',
            config: {
                fromEmail: FROM_EMAIL,
                adminEmail: ADMIN_EMAIL,
                appUrl: APP_URL
            }
        });
    }
    catch (error) {
        console.error('❌ Test email failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Get signup statistics
 */
exports.getSignupStats = functions.https.onRequest(async (req, res) => {
    try {
        const db = admin.firestore();
        const usersRef = db.collection('userProfiles');
        const [pendingSnapshot, approvedSnapshot, rejectedSnapshot] = await Promise.all([
            usersRef.where('approvalStatus', '==', 'pending').get(),
            usersRef.where('approvalStatus', '==', 'approved').get(),
            usersRef.where('approvalStatus', '==', 'rejected').get()
        ]);
        const stats = {
            pending: pendingSnapshot.size,
            approved: approvedSnapshot.size,
            rejected: rejectedSnapshot.size,
            total: pendingSnapshot.size + approvedSnapshot.size + rejectedSnapshot.size
        };
        res.json(stats);
    }
    catch (error) {
        console.error('❌ Error getting signup stats:', error);
        res.status(500).json({ error: error.message });
    }
});
//# sourceMappingURL=index_fixed.js.map