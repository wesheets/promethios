/**
 * Email Notification Provider for Phase Change Tracker
 * 
 * This module handles sending email notifications for phase changes.
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Email templates directory
const TEMPLATES_DIR = path.join(__dirname, 'templates');

/**
 * Load email template
 */
function loadTemplate(templateName) {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
  try {
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf8');
    }
  } catch (error) {
    console.error(`Error loading email template ${templateName}: ${error.message}`);
  }
  
  // Return a simple default template if the requested one doesn't exist
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f5f5f5; padding: 15px; border-bottom: 2px solid #ddd; }
        .content { padding: 20px 0; }
        .footer { font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 15px; }
        h1 { color: #444; }
        a { color: #0366d6; }
        .button { display: inline-block; padding: 10px 20px; background-color: #0366d6; color: white; text-decoration: none; border-radius: 3px; }
        .summary { background: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #0366d6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>{{title}}</h1>
        </div>
        <div class="content">
          {{content}}
          
          <div class="summary">
            <h3>Summary</h3>
            {{summary}}
          </div>
          
          <p>
            <a href="{{reportUrl}}" class="button">View Full Report</a>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated notification from the Promethios Phase Change Tracker.</p>
          <p>To update your notification preferences, please contact your administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Apply template variables
 */
function applyTemplate(template, variables) {
  return Object.entries(variables).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }, template);
}

/**
 * Generate email content from notification
 */
function generateEmailContent(notification, template) {
  // Generate summary HTML
  let summaryHtml = '';
  if (notification.data && notification.data.summary) {
    const summary = notification.data.summary;
    summaryHtml = `
      <ul>
        <li><strong>Added Directories:</strong> ${summary.addedDirectories}</li>
        <li><strong>Removed Directories:</strong> ${summary.removedDirectories}</li>
        <li><strong>Modified Directories:</strong> ${summary.modifiedDirectories}</li>
        <li><strong>Added Files:</strong> ${summary.addedFiles}</li>
        <li><strong>Removed Files:</strong> ${summary.removedFiles}</li>
        <li><strong>Modified Files:</strong> ${summary.modifiedFiles}</li>
      </ul>
    `;
  }
  
  // Apply template variables
  return applyTemplate(template, {
    title: notification.title,
    content: notification.message,
    summary: summaryHtml,
    reportUrl: notification.reportUrl || '#',
    timestamp: new Date(notification.timestamp).toLocaleString()
  });
}

/**
 * Send email notifications
 */
async function send(notification, subscribers, config) {
  if (!config || !config.config) {
    throw new Error('Email provider configuration is missing');
  }
  
  // Create transporter
  const transporter = nodemailer.createTransport(config.config);
  
  // Load template
  const template = loadTemplate(notification.type);
  
  // Results tracking
  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };
  
  // Send to each subscriber
  for (const subscriber of subscribers) {
    if (!subscriber.email) {
      results.failed++;
      results.errors.push(`Subscriber ${subscriber.id} has no email address`);
      continue;
    }
    
    try {
      // Generate personalized email content
      const html = generateEmailContent(notification, template);
      
      // Send email
      await transporter.sendMail({
        from: config.from || '"Promethios Tracker" <tracker@promethios.ai>',
        to: subscriber.email,
        subject: notification.title,
        html,
        text: notification.message // Fallback plain text
      });
      
      results.sent++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to send to ${subscriber.email}: ${error.message}`);
    }
  }
  
  return results;
}

module.exports = {
  send
};
