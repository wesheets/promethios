"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testEmail = exports.sendWaitlistEmail = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
// Initialize Firebase Admin
admin.initializeApp();
// Role display mapping
const roleDisplayMap = {
    'enterprise-cto': 'Enterprise CTO',
    'security-engineer': 'Security Engineer',
    'ai-researcher': 'AI Researcher',
    'product-manager': 'Product Manager',
    'data-scientist': 'Data Scientist',
    'compliance-officer': 'Compliance Officer',
    'vc-investor': 'VC/Investor',
    'startup-founder': 'Startup Founder',
    'government-official': 'Government Official',
    'academic-researcher': 'Academic Researcher',
    'journalist': 'Journalist',
    'consultant': 'Consultant',
    'other': 'Other'
};
// AI concern display mapping
const aiConcernDisplayMap = {
    'hallucinations': 'AI Hallucinations & Accuracy',
    'bias-fairness': 'Bias & Fairness Issues',
    'privacy-data': 'Privacy & Data Protection',
    'transparency': 'Lack of Transparency',
    'accountability': 'Accountability Gaps',
    'safety-alignment': 'Safety & Alignment',
    'regulatory-compliance': 'Regulatory Compliance',
    'economic-disruption': 'Economic Disruption',
    'misinformation': 'Misinformation & Deepfakes',
    'job-displacement': 'Job Displacement',
    'other': 'Other Concerns'
};
// Priority display mapping
const priorityDisplayMap = {
    'high': 'High Priority',
    'medium': 'Medium Priority',
    'low': 'Low Priority',
    'very-low': 'Very Low Priority'
};
// Generate personalized name from email or organization
function generatePersonalizedName(data) {
    if (data.organization && data.organization.trim() && data.organization !== 'Not specified') {
        return `${data.organization} Team`;
    }
    const emailName = data.email.split('@')[0];
    const formattedName = emailName
        .replace(/[._]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    return formattedName;
}
// Generate HTML email template
function generateHTMLEmail(data) {
    const name = generatePersonalizedName(data);
    const roleDisplay = roleDisplayMap[data.role] || data.role;
    const aiConcernDisplay = aiConcernDisplayMap[data.aiConcern] || data.aiConcern;
    const priorityDisplay = priorityDisplayMap[data.priority] || data.priority;
    const organization = data.organization || 'Not specified';
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Promethios Private Beta</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8fafc; }
        .email-container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
        .logo { font-size: 28px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.5px; }
        .beta-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .header-subtitle { margin-top: 16px; font-size: 16px; opacity: 0.9; font-weight: 300; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 20px; font-weight: 600; color: #1a202c; margin-bottom: 24px; }
        .message { font-size: 16px; line-height: 1.7; color: #4a5568; margin-bottom: 24px; }
        .highlight-box { background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-left: 4px solid #667eea; padding: 24px; border-radius: 8px; margin: 24px 0; }
        .highlight-title { font-size: 18px; font-weight: 600; color: #2d3748; margin-bottom: 12px; }
        .highlight-text { font-size: 15px; color: #4a5568; line-height: 1.6; }
        .application-summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 24px 0; }
        .summary-title { font-size: 16px; font-weight: 600; color: #2d3748; margin-bottom: 16px; }
        .summary-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .summary-item:last-child { border-bottom: none; }
        .summary-label { font-weight: 500; color: #4a5568; }
        .summary-value { font-weight: 600; color: #2d3748; }
        .priority-high { background: #fed7d7; color: #c53030; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .priority-medium { background: #feebc8; color: #dd6b20; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .priority-low { background: #e6fffa; color: #319795; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .next-steps { margin: 32px 0; }
        .steps-title { font-size: 18px; font-weight: 600; color: #2d3748; margin-bottom: 16px; }
        .step { display: flex; align-items: flex-start; margin-bottom: 16px; }
        .step-number { background: #667eea; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 12px; flex-shrink: 0; }
        .step-text { font-size: 15px; color: #4a5568; line-height: 1.5; }
        .cta-container { text-align: center; margin: 32px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
        .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer-text { font-size: 14px; color: #718096; margin-bottom: 16px; }
        .footer-links { margin-bottom: 16px; }
        .footer-link { color: #667eea; text-decoration: none; margin: 0 12px; font-size: 14px; }
        .unsubscribe { font-size: 12px; color: #a0aec0; }
        .unsubscribe a { color: #a0aec0; }
        @media (max-width: 600px) {
            .email-container { margin: 0; border-radius: 0; }
            .header, .content, .footer { padding: 24px 20px; }
            .greeting { font-size: 18px; }
            .message { font-size: 15px; }
            .summary-item { flex-direction: column; align-items: flex-start; }
            .summary-value { margin-top: 4px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🔥 PROMETHIOS</div>
            <div class="beta-badge">Private Beta</div>
            <div class="header-subtitle">AI Governance & Trust Infrastructure</div>
        </div>
        
        <div class="content">
            <div class="greeting">Hello ${name},</div>
            
            <div class="message">
                Thank you for requesting access to Promethios Private Beta. Your application has been received and is now under review by our team.
            </div>
            
            <div class="highlight-box">
                <div class="highlight-title">🎯 Trust is not public</div>
                <div class="highlight-text">
                    You don't get access just because you want it — you get it because someone trusted you. We're building the infrastructure that makes AI governance accountable, transparent, and trustworthy.
                </div>
            </div>
            
            <div class="application-summary">
                <div class="summary-title">📋 Your Application Summary</div>
                
                <div class="summary-item">
                    <span class="summary-label">Role:</span>
                    <span class="summary-value">${roleDisplay}</span>
                </div>
                
                <div class="summary-item">
                    <span class="summary-label">Organization:</span>
                    <span class="summary-value">${organization}</span>
                </div>
                
                <div class="summary-item">
                    <span class="summary-label">Primary AI Concern:</span>
                    <span class="summary-value">${aiConcernDisplay}</span>
                </div>
                
                <div class="summary-item">
                    <span class="summary-label">Lead Priority:</span>
                    <span class="summary-value">
                        <span class="priority-${data.priority}">${priorityDisplay}</span>
                    </span>
                </div>
                
                <div class="summary-item">
                    <span class="summary-label">Application ID:</span>
                    <span class="summary-value">${data.submissionId}</span>
                </div>
            </div>
            
            <div class="next-steps">
                <div class="steps-title">🚀 What happens next?</div>
                
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-text">
                        <strong>Review Process:</strong> Our team will carefully review your application and assess your fit for the private beta program.
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-text">
                        <strong>Priority Assessment:</strong> Applications are prioritized based on role, organization, and specific AI governance needs.
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-text">
                        <strong>Invitation:</strong> If selected, you'll receive an exclusive invitation with access credentials and onboarding materials.
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-text">
                        <strong>Early Access:</strong> Join a select group of AI leaders shaping the future of governance and accountability.
                    </div>
                </div>
            </div>
            
            <div class="message">
                We're committed to building AI governance infrastructure that actually works. Your insights and feedback will be invaluable in shaping Promethios into the trust layer the AI ecosystem desperately needs.
            </div>
            
            <div class="cta-container">
                <a href="https://promethios.ai/learn" class="cta-button">
                    Learn More About Promethios
                </a>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Questions about your application? We're here to help.
            </div>
            
            <div class="footer-links">
                <a href="https://promethios.ai/support" class="footer-link">Support</a>
                <a href="https://promethios.ai/docs" class="footer-link">Documentation</a>
                <a href="https://promethios.ai/about" class="footer-link">About</a>
            </div>
            
            <div class="footer-text">
                <strong>Promethios</strong><br>
                Building Trust in AI Systems
            </div>
            
            <div class="unsubscribe">
                <a href="#">Unsubscribe</a> | 
                <a href="#">Email Preferences</a>
            </div>
        </div>
    </div>
</body>
</html>`;
}
// Generate plain text email
function generateTextEmail(data) {
    const name = generatePersonalizedName(data);
    const roleDisplay = roleDisplayMap[data.role] || data.role;
    const aiConcernDisplay = aiConcernDisplayMap[data.aiConcern] || data.aiConcern;
    const priorityDisplay = priorityDisplayMap[data.priority] || data.priority;
    const organization = data.organization || 'Not specified';
    return `🔥 PROMETHIOS - Private Beta
AI Governance & Trust Infrastructure

Hello ${name},

Thank you for requesting access to Promethios Private Beta. Your application has been received and is now under review by our team.

🎯 TRUST IS NOT PUBLIC
You don't get access just because you want it — you get it because someone trusted you. We're building the infrastructure that makes AI governance accountable, transparent, and trustworthy.

📋 YOUR APPLICATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Role: ${roleDisplay}
Organization: ${organization}
Primary AI Concern: ${aiConcernDisplay}
Lead Priority: ${priorityDisplay}
Application ID: ${data.submissionId}

🚀 WHAT HAPPENS NEXT?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. REVIEW PROCESS
   Our team will carefully review your application and assess your fit for the private beta program.

2. PRIORITY ASSESSMENT
   Applications are prioritized based on role, organization, and specific AI governance needs.

3. INVITATION
   If selected, you'll receive an exclusive invitation with access credentials and onboarding materials.

4. EARLY ACCESS
   Join a select group of AI leaders shaping the future of governance and accountability.

We're committed to building AI governance infrastructure that actually works. Your insights and feedback will be invaluable in shaping Promethios into the trust layer the AI ecosystem desperately needs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Learn More: https://promethios.ai/learn
Support: https://promethios.ai/support
Documentation: https://promethios.ai/docs

Questions about your application? We're here to help.

PROMETHIOS
Building Trust in AI Systems

Unsubscribe: https://promethios.ai/unsubscribe
Email Preferences: https://promethios.ai/preferences`;
}
// Create email transporter
function createEmailTransporter() {
    var _a, _b, _c;
    // Get email configuration from environment variables
    const emailConfig = {
        service: ((_a = functions.config().email) === null || _a === void 0 ? void 0 : _a.service) || 'gmail',
        user: (_b = functions.config().email) === null || _b === void 0 ? void 0 : _b.user,
        pass: (_c = functions.config().email) === null || _c === void 0 ? void 0 : _c.pass
    };
    if (!emailConfig.user || !emailConfig.pass) {
        throw new Error('Email configuration missing. Please set email.user and email.pass');
    }
    return nodemailer.createTransport({
        service: emailConfig.service,
        auth: {
            user: emailConfig.user,
            pass: emailConfig.pass
        }
    });
}
// Main Cloud Function - triggers when a document is added to the waitlist collection
// Configure to listen to the promethios-oregon database
exports.sendWaitlistEmail = functions
    .region('us-west1') // Match the database region
    .firestore
    .document('waitlist/{docId}')
    .onCreate(async (snap, context) => {
    try {
        const data = snap.data();
        console.log('📧 New waitlist submission received:', data.email);
        console.log('🗄️ Using promethios-oregon database (us-west1 region)');
        // Generate email content
        const htmlContent = generateHTMLEmail(data);
        const textContent = generateTextEmail(data);
        const subject = `Welcome to Promethios Private Beta - Application Received (${priorityDisplayMap[data.priority] || data.priority})`;
        // Create email transporter
        const transporter = createEmailTransporter();
        // Email options
        const mailOptions = {
            from: 'Promethios <hello@promethios.ai>',
            to: data.email,
            subject: subject,
            text: textContent,
            html: htmlContent,
            replyTo: 'hello@promethios.ai'
        };
        // Send email
        console.log('📤 Sending email to:', data.email);
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);
        // Update the document to mark email as sent
        await snap.ref.update({
            emailSent: true,
            emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
            emailMessageId: result.messageId
        });
        return { success: true, messageId: result.messageId };
    }
    catch (error) {
        console.error('❌ Error sending email:', error);
        // Update the document to mark email as failed
        await snap.ref.update({
            emailSent: false,
            emailError: error instanceof Error ? error.message : String(error),
            emailErrorAt: admin.firestore.FieldValue.serverTimestamp()
        });
        throw error;
    }
});
// Test function to manually send an email (for testing purposes)
exports.testEmail = functions.https.onRequest(async (req, res) => {
    try {
        const testData = {
            email: 'test@example.com',
            role: 'enterprise-cto',
            aiConcern: 'accountability',
            whyAccess: 'Testing the email system',
            organization: 'Test Company',
            deploymentUrgency: 'right-away',
            socialProfile: 'https://linkedin.com/in/test',
            onboardingCall: true,
            currentAiTools: 'ChatGPT, Claude',
            biggestAiFailure: 'Hallucination in production',
            additionalConcerns: 'Privacy and security',
            timestamp: new Date().toISOString(),
            leadScore: 150,
            priority: 'high',
            submissionId: 'TEST-' + Date.now()
        };
        const htmlContent = generateHTMLEmail(testData);
        const textContent = generateTextEmail(testData);
        res.status(200).json({
            success: true,
            message: 'Test email templates generated',
            html: htmlContent.substring(0, 500) + '...',
            text: textContent.substring(0, 500) + '...'
        });
    }
    catch (error) {
        console.error('Error in test function:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
});
//# sourceMappingURL=index.js.map