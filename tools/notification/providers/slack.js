/**
 * Slack Notification Provider for Phase Change Tracker
 * 
 * This module handles sending Slack notifications for phase changes.
 */

const https = require('https');
const url = require('url');

/**
 * Generate Slack message blocks from notification
 */
function generateSlackBlocks(notification) {
  const blocks = [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": notification.title,
        "emoji": true
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": notification.message
      }
    },
    {
      "type": "divider"
    }
  ];

  // Add summary section if available
  if (notification.data && notification.data.summary) {
    const summary = notification.data.summary;
    blocks.push({
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Summary*"
      }
    });
    
    blocks.push({
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": `*Added Directories:* ${summary.addedDirectories}`
        },
        {
          "type": "mrkdwn",
          "text": `*Removed Directories:* ${summary.removedDirectories}`
        },
        {
          "type": "mrkdwn",
          "text": `*Modified Directories:* ${summary.modifiedDirectories}`
        },
        {
          "type": "mrkdwn",
          "text": `*Added Files:* ${summary.addedFiles}`
        },
        {
          "type": "mrkdwn",
          "text": `*Removed Files:* ${summary.removedFiles}`
        },
        {
          "type": "mrkdwn",
          "text": `*Modified Files:* ${summary.modifiedFiles}`
        }
      ]
    });
  }

  // Add report link if available
  if (notification.reportUrl) {
    blocks.push({
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "View the full report for more details:"
      }
    });
    
    blocks.push({
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Full Report",
            "emoji": true
          },
          "url": notification.reportUrl,
          "style": "primary"
        }
      ]
    });
  }

  // Add footer
  blocks.push({
    "type": "context",
    "elements": [
      {
        "type": "mrkdwn",
        "text": `*Promethios Phase Change Tracker* | ${new Date(notification.timestamp).toLocaleString()}`
      }
    ]
  });

  return blocks;
}

/**
 * Send Slack notifications
 */
async function send(notification, subscribers, config) {
  if (!config || !config.webhookUrl) {
    throw new Error('Slack webhook URL is missing');
  }

  // Parse webhook URL
  const webhookUrl = new URL(config.webhookUrl);
  
  // Generate Slack message
  const blocks = generateSlackBlocks(notification);
  const message = {
    text: notification.title, // Fallback text
    blocks
  };
  
  // Add channel if specified
  if (config.channel) {
    message.channel = config.channel;
  }
  
  // Prepare request options
  const requestOptions = {
    hostname: webhookUrl.hostname,
    path: webhookUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Send to Slack
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
            errors: [`Slack API returned status ${res.statusCode}: ${data}`]
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
    
    req.write(JSON.stringify(message));
    req.end();
  });
}

module.exports = {
  send
};
