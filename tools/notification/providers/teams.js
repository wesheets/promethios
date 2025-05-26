/**
 * Microsoft Teams Notification Provider for Phase Change Tracker
 * 
 * This module handles sending Microsoft Teams notifications for phase changes.
 */

const https = require('https');
const url = require('url');

/**
 * Generate Teams message card from notification
 */
function generateTeamsCard(notification) {
  // Create summary facts
  const facts = [];
  if (notification.data && notification.data.summary) {
    const summary = notification.data.summary;
    facts.push({ name: "Added Directories:", value: summary.addedDirectories.toString() });
    facts.push({ name: "Removed Directories:", value: summary.removedDirectories.toString() });
    facts.push({ name: "Modified Directories:", value: summary.modifiedDirectories.toString() });
    facts.push({ name: "Added Files:", value: summary.addedFiles.toString() });
    facts.push({ name: "Removed Files:", value: summary.removedFiles.toString() });
    facts.push({ name: "Modified Files:", value: summary.modifiedFiles.toString() });
  }

  // Create Teams adaptive card
  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "0076D7",
    "summary": notification.title,
    "sections": [
      {
        "activityTitle": notification.title,
        "activitySubtitle": `Generated on ${new Date(notification.timestamp).toLocaleString()}`,
        "activityImage": "https://raw.githubusercontent.com/wesheets/promethios/main/assets/logo.png",
        "text": notification.message,
        "facts": facts,
        "markdown": true
      }
    ],
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "View Full Report",
        "targets": [
          {
            "os": "default",
            "uri": notification.reportUrl || "#"
          }
        ]
      }
    ]
  };
}

/**
 * Send Teams notifications
 */
async function send(notification, subscribers, config) {
  if (!config || !config.webhookUrl) {
    throw new Error('Teams webhook URL is missing');
  }

  // Parse webhook URL
  const webhookUrl = new URL(config.webhookUrl);
  
  // Generate Teams message
  const card = generateTeamsCard(notification);
  
  // Prepare request options
  const requestOptions = {
    hostname: webhookUrl.hostname,
    path: webhookUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Send to Teams
  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            sent: subscribers.length,
            failed: 0,
            errors: []
          });
        } else {
          resolve({
            sent: 0,
            failed: subscribers.length,
            errors: [`Teams API returned status ${res.statusCode}: ${data}`]
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        sent: 0,
        failed: subscribers.length,
        errors: [error.message]
      });
    });
    
    req.write(JSON.stringify(card));
    req.end();
  });
}

module.exports = {
  send
};
