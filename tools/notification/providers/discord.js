/**
 * Discord Notification Provider for Phase Change Tracker
 * 
 * This module handles sending Discord notifications for phase changes.
 */

const https = require('https');
const url = require('url');

/**
 * Generate Discord embed from notification
 */
function generateDiscordEmbed(notification) {
  // Create fields for summary
  const fields = [];
  if (notification.data && notification.data.summary) {
    const summary = notification.data.summary;
    fields.push({ name: "Added Directories", value: summary.addedDirectories.toString(), inline: true });
    fields.push({ name: "Removed Directories", value: summary.removedDirectories.toString(), inline: true });
    fields.push({ name: "Modified Directories", value: summary.modifiedDirectories.toString(), inline: true });
    fields.push({ name: "Added Files", value: summary.addedFiles.toString(), inline: true });
    fields.push({ name: "Removed Files", value: summary.removedFiles.toString(), inline: true });
    fields.push({ name: "Modified Files", value: summary.modifiedFiles.toString(), inline: true });
  }

  // Create Discord webhook payload
  return {
    username: "Promethios Phase Tracker",
    avatar_url: "https://raw.githubusercontent.com/wesheets/promethios/main/assets/logo.png",
    content: "A new phase change report has been generated",
    embeds: [
      {
        title: notification.title,
        description: notification.message,
        url: notification.reportUrl || "",
        color: 3447003, // Blue color
        fields: fields,
        timestamp: notification.timestamp,
        footer: {
          text: "Promethios Phase Change Tracker"
        }
      }
    ]
  };
}

/**
 * Send Discord notifications
 */
async function send(notification, subscribers, config) {
  if (!config || !config.webhookUrl) {
    throw new Error('Discord webhook URL is missing');
  }

  // Parse webhook URL
  const webhookUrl = new URL(config.webhookUrl);
  
  // Generate Discord message
  const payload = generateDiscordEmbed(notification);
  
  // Prepare request options
  const requestOptions = {
    hostname: webhookUrl.hostname,
    path: webhookUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Send to Discord
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
            errors: [`Discord API returned status ${res.statusCode}: ${data}`]
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
    
    req.write(JSON.stringify(payload));
    req.end();
  });
}

module.exports = {
  send
};
