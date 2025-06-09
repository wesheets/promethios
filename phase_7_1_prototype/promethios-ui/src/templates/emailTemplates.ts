// Email templates for Promethios waitlist and invitation emails
// These templates can be used with SendGrid or any other email service

/**
 * Generate HTML for waitlist confirmation email
 * @param name User's name
 * @param email User's email
 * @returns HTML string for email body
 */
export const getWaitlistConfirmationHTML = (name: string, email: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Welcome to the Promethios Waitlist</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #eaeaea;
        }
        .logo {
          max-width: 180px;
          margin-bottom: 15px;
        }
        h1 {
          color: #2c3e50;
          font-size: 24px;
          margin: 0;
          font-weight: 600;
        }
        .content {
          padding: 30px 20px;
        }
        p {
          margin-bottom: 15px;
          font-size: 16px;
        }
        .highlight {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #4A90E2;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 14px;
          color: #7f8c8d;
          border-top: 1px solid #eaeaea;
        }
        .social {
          margin-top: 15px;
        }
        .social a {
          display: inline-block;
          margin: 0 10px;
          color: #7f8c8d;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <!-- <img src="https://promethios.ai/logo.png" alt="Promethios Logo" class="logo"> -->
          <h1>Promethios</h1>
        </div>
        <div class="content">
          <h2>Thank You for Joining Our Waitlist!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for your interest in Promethios! We're excited to have you on our waitlist.</p>
          
          <div class="highlight">
            <p>We've received your request to join Promethios with the email: <strong>${email}</strong></p>
            <p>Our team will review your application and notify you as soon as you're approved for access.</p>
          </div>
          
          <p>Promethios is a platform for wrapping and deploying AI agents with proper governance, ensuring they operate securely and responsibly.</p>
          
          <p>While you wait, you can learn more about AI governance and why it matters:</p>
          <ul>
            <li>The importance of transparency in AI systems</li>
            <li>How governance frameworks protect users and organizations</li>
            <li>Best practices for deploying AI in production environments</li>
          </ul>
          
          <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
          
          <p>Best regards,<br>The Promethios Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Promethios AI. All rights reserved.</p>
          <p>You're receiving this email because you signed up for the Promethios waitlist.</p>
          <div class="social">
            <a href="https://twitter.com/promethios">Twitter</a> | 
            <a href="https://linkedin.com/company/promethios">LinkedIn</a> | 
            <a href="https://promethios.ai">Website</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate plain text for waitlist confirmation email
 * @param name User's name
 * @param email User's email
 * @returns Plain text string for email body
 */
export const getWaitlistConfirmationText = (name: string, email: string): string => {
  return `
Thank You for Joining Our Waitlist!

Hello ${name},

Thank you for your interest in Promethios! We're excited to have you on our waitlist.

We've received your request to join Promethios with the email: ${email}
Our team will review your application and notify you as soon as you're approved for access.

Promethios is a platform for wrapping and deploying AI agents with proper governance, ensuring they operate securely and responsibly.

While you wait, you can learn more about AI governance and why it matters:
- The importance of transparency in AI systems
- How governance frameworks protect users and organizations
- Best practices for deploying AI in production environments

If you have any questions, feel free to reply to this email or contact our support team.

Best regards,
The Promethios Team

© 2025 Promethios AI. All rights reserved.
You're receiving this email because you signed up for the Promethios waitlist.
  `;
};

/**
 * Generate HTML for invitation email
 * @param name User's name
 * @param email User's email
 * @param inviteUrl URL for registration with pre-filled email
 * @returns HTML string for email body
 */
export const getInvitationHTML = (name: string, email: string, inviteUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>You're Invited to Join Promethios!</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #eaeaea;
        }
        .logo {
          max-width: 180px;
          margin-bottom: 15px;
        }
        h1 {
          color: #2c3e50;
          font-size: 24px;
          margin: 0;
          font-weight: 600;
        }
        .content {
          padding: 30px 20px;
        }
        p {
          margin-bottom: 15px;
          font-size: 16px;
        }
        .button {
          display: inline-block;
          background-color: #4A90E2;
          color: white !important;
          padding: 12px 25px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          margin: 20px 0;
        }
        .highlight {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #4A90E2;
          margin: 20px 0;
          word-break: break-all;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 14px;
          color: #7f8c8d;
          border-top: 1px solid #eaeaea;
        }
        .social {
          margin-top: 15px;
        }
        .social a {
          display: inline-block;
          margin: 0 10px;
          color: #7f8c8d;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <!-- <img src="https://promethios.ai/logo.png" alt="Promethios Logo" class="logo"> -->
          <h1>Promethios</h1>
        </div>
        <div class="content">
          <h2>You're Invited to Join Promethios!</h2>
          <p>Hello ${name},</p>
          <p>Great news! Your application to join Promethios has been approved.</p>
          
          <p>You can now create your account and start using our platform to wrap and deploy AI agents with proper governance.</p>
          
          <div style="text-align: center;">
            <a href="${inviteUrl}" class="button">Create Your Account</a>
          </div>
          
          <div class="highlight">
            <p>Or copy and paste this link into your browser:</p>
            <p>${inviteUrl}</p>
          </div>
          
          <p><strong>This invitation link will expire in 7 days.</strong></p>
          
          <p>With Promethios, you can:</p>
          <ul>
            <li>Apply governance rules to your AI agents</li>
            <li>Deploy agents securely in production environments</li>
            <li>Monitor and audit AI behavior and interactions</li>
            <li>Ensure compliance with organizational policies</li>
          </ul>
          
          <p>If you have any questions or need assistance getting started, our support team is here to help.</p>
          
          <p>We're excited to have you on board!</p>
          
          <p>Best regards,<br>The Promethios Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Promethios AI. All rights reserved.</p>
          <p>You're receiving this email because you signed up for the Promethios waitlist and have been approved for access.</p>
          <div class="social">
            <a href="https://twitter.com/promethios">Twitter</a> | 
            <a href="https://linkedin.com/company/promethios">LinkedIn</a> | 
            <a href="https://promethios.ai">Website</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate plain text for invitation email
 * @param name User's name
 * @param email User's email
 * @param inviteUrl URL for registration with pre-filled email
 * @returns Plain text string for email body
 */
export const getInvitationText = (name: string, email: string, inviteUrl: string): string => {
  return `
You're Invited to Join Promethios!

Hello ${name},

Great news! Your application to join Promethios has been approved.

You can now create your account and start using our platform to wrap and deploy AI agents with proper governance.

Create your account here: ${inviteUrl}

This invitation link will expire in 7 days.

With Promethios, you can:
- Apply governance rules to your AI agents
- Deploy agents securely in production environments
- Monitor and audit AI behavior and interactions
- Ensure compliance with organizational policies

If you have any questions or need assistance getting started, our support team is here to help.

We're excited to have you on board!

Best regards,
The Promethios Team

© 2025 Promethios AI. All rights reserved.
You're receiving this email because you signed up for the Promethios waitlist and have been approved for access.
  `;
};
