# Phase Change Tracker Integration Guide

## Overview

This document provides detailed instructions for integrating the Phase Change Tracker with other systems in the Promethios ecosystem, particularly the notification system. It outlines both automated and manual processes required for full functionality.

## Integration with Notification System

The Phase Change Tracker can automatically notify developers about new phase change reports through various communication channels. This integration requires some configuration and setup.

### Prerequisites

1. Notification system is properly configured (see `/tools/notification/index.js`)
2. Appropriate notification templates exist (see `/tools/notification/providers/templates/`)
3. Developer contact information is available in a configuration file

### Configuration Steps

1. **Create Notification Configuration File**

   Create a file named `notification-config.json` in the project root with the following structure:

   ```json
   {
     "notificationEnabled": true,
     "channels": ["email", "slack", "teams", "discord"],
     "recipients": {
       "email": ["team@example.com", "managers@example.com"],
       "slack": "#project-updates",
       "teams": "Project Team",
       "discord": "#promethios-updates"
     },
     "settings": {
       "email": {
         "smtpServer": "smtp.example.com",
         "port": 587,
         "username": "notifications@example.com",
         "password": "use-environment-variable",
         "from": "Promethios Notifications <notifications@example.com>"
       },
       "slack": {
         "webhookUrl": "https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX"
       },
       "teams": {
         "webhookUrl": "https://outlook.office.com/webhook/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
       },
       "discord": {
         "webhookUrl": "https://discord.com/api/webhooks/XXXXXXXXXXXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
       }
     }
   }
   ```

2. **Set Environment Variables**

   For security, store sensitive information in environment variables:

   ```bash
   export PROMETHIOS_SMTP_PASSWORD="your-smtp-password"
   export PROMETHIOS_SLACK_TOKEN="your-slack-token"
   export PROMETHIOS_TEAMS_TOKEN="your-teams-token"
   export PROMETHIOS_DISCORD_TOKEN="your-discord-token"
   ```

3. **Link Phase Change Tracker to Notification System**

   Create a script named `track-and-notify.js` in the project root:

   ```javascript
   #!/usr/bin/env node

   const { execSync } = require('child_process');
   const path = require('path');
   const fs = require('fs');
   const notifier = require('./tools/notification');

   // Parse command line arguments
   const args = process.argv.slice(2);
   if (args.length < 2) {
     console.error('Usage: node track-and-notify.js <previous-phase> <current-phase> [options]');
     process.exit(1);
   }

   const previousPhase = args[0];
   const currentPhase = args[1];
   const options = args.slice(2);

   // Add attribution flag if not present
   if (!options.includes('--attribution')) {
     options.push('--attribution');
   }

   // Run the phase change tracker
   try {
     console.log(`Running Phase Change Tracker for phases ${previousPhase} to ${currentPhase}...`);
     execSync(`node tools/phase-change-tracker.js ${previousPhase} ${currentPhase} ${options.join(' ')}`, {
       stdio: 'inherit'
     });

     // Get the report file path
     const outputDir = options.find(opt => opt.startsWith('--output-dir='))
       ? options.find(opt => opt.startsWith('--output-dir=')).split('=')[1]
       : 'phase_changes';
     
     const reportPath = path.join(outputDir, `phase_${previousPhase}_to_${currentPhase}_changes.md`);
     
     if (fs.existsSync(reportPath)) {
       // Read the report content
       const reportContent = fs.readFileSync(reportPath, 'utf8');
       
       // Send notification
       console.log('Sending notifications...');
       notifier.sendPhaseChangeNotification({
         previousPhase,
         currentPhase,
         reportPath,
         reportContent,
         summary: extractSummary(reportContent)
       });
       
       console.log('Process completed successfully!');
     } else {
       console.error(`Report file not found: ${reportPath}`);
       process.exit(1);
     }
   } catch (error) {
     console.error(`Error: ${error.message}`);
     process.exit(1);
   }

   /**
    * Extract a summary from the report content
    */
   function extractSummary(content) {
     // Extract the summary statistics section
     const summaryMatch = content.match(/### Summary Statistics\n\n([\s\S]*?)(?=\n\n)/);
     if (summaryMatch && summaryMatch[1]) {
       return summaryMatch[1];
     }
     
     // Fallback to first 500 characters if summary section not found
     return content.substring(0, 500) + '...';
   }
   ```

4. **Make the script executable**

   ```bash
   chmod +x track-and-notify.js
   ```

## Manual Integration Process

For environments where the automated integration is not possible or when customization is needed, follow these manual steps:

### Step 1: Generate the Phase Change Report

Run the Phase Change Tracker manually:

```bash
node tools/phase-change-tracker.js <previous-phase> <current-phase> --attribution
```

### Step 2: Review the Generated Report

Open the generated report in `phase_changes/phase_<previous-phase>_to_<current-phase>_changes.md` and review it for accuracy.

### Step 3: Send Manual Notifications

Use the notification module directly:

```javascript
const notifier = require('./tools/notification');
const fs = require('fs');
const path = require('path');

const reportPath = 'phase_changes/phase_6.5_to_7.0_changes.md';
const reportContent = fs.readFileSync(reportPath, 'utf8');

notifier.sendPhaseChangeNotification({
  previousPhase: '6.5',
  currentPhase: '7.0',
  reportPath,
  reportContent,
  summary: 'Custom summary of changes...'
});
```

## CI/CD Integration

To integrate the Phase Change Tracker into your CI/CD pipeline:

### GitHub Actions Example

Create a file `.github/workflows/phase-change-tracker.yml`:

```yaml
name: Phase Change Tracking

on:
  push:
    tags:
      - 'phase-*'

jobs:
  track-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Fetch all history for all tags and branches
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Extract phase numbers
        id: extract_phases
        run: |
          CURRENT_TAG=${GITHUB_REF#refs/tags/}
          CURRENT_PHASE=${CURRENT_TAG#phase-}
          
          # Find the previous phase tag
          PREVIOUS_TAGS=$(git tag -l "phase-*" | sort -V)
          PREVIOUS_TAG=""
          for tag in $PREVIOUS_TAGS; do
            if [ "$tag" = "$CURRENT_TAG" ]; then
              break
            fi
            PREVIOUS_TAG=$tag
          done
          
          if [ -z "$PREVIOUS_TAG" ]; then
            echo "No previous phase tag found"
            exit 1
          fi
          
          PREVIOUS_PHASE=${PREVIOUS_TAG#phase-}
          
          echo "::set-output name=previous_phase::$PREVIOUS_PHASE"
          echo "::set-output name=current_phase::$CURRENT_PHASE"
      
      - name: Run Phase Change Tracker
        run: node tools/phase-change-tracker.js ${{ steps.extract_phases.outputs.previous_phase }} ${{ steps.extract_phases.outputs.current_phase }} --attribution
      
      - name: Send notifications
        run: node track-and-notify.js ${{ steps.extract_phases.outputs.previous_phase }} ${{ steps.extract_phases.outputs.current_phase }}
        env:
          PROMETHIOS_SMTP_PASSWORD: ${{ secrets.SMTP_PASSWORD }}
          PROMETHIOS_SLACK_TOKEN: ${{ secrets.SLACK_TOKEN }}
          PROMETHIOS_TEAMS_TOKEN: ${{ secrets.TEAMS_TOKEN }}
          PROMETHIOS_DISCORD_TOKEN: ${{ secrets.DISCORD_TOKEN }}
      
      - name: Upload report as artifact
        uses: actions/upload-artifact@v3
        with:
          name: phase-change-report
          path: phase_changes/phase_${{ steps.extract_phases.outputs.previous_phase }}_to_${{ steps.extract_phases.outputs.current_phase }}_changes.md
```

## Troubleshooting Integration Issues

### Notification System Issues

1. **Email Notifications Not Sending**
   - Check SMTP server settings and credentials
   - Verify that the email provider allows programmatic sending
   - Check for firewall or network restrictions

2. **Slack/Teams/Discord Notifications Failing**
   - Verify webhook URLs are correct and active
   - Ensure the webhook has appropriate permissions
   - Check for rate limiting issues

### Phase Change Tracker Issues

1. **Git Reference Errors**
   - Ensure the repository has proper tags or branches for phases
   - Check that the git history is complete (not a shallow clone)
   - Verify that the user running the script has access to the git history

2. **Attribution Information Missing**
   - Check that the `--attribution` flag is being used
   - Verify that git commit history includes author information
   - Ensure the git commands are not being blocked by security policies

## Best Practices for Integration

1. **Automate Where Possible**: Use CI/CD pipelines to automatically run the Phase Change Tracker when new phase tags are created

2. **Customize Notification Templates**: Modify the templates in `/tools/notification/providers/templates/` to match your organization's branding and communication style

3. **Secure Credentials**: Always use environment variables or secure secret storage for sensitive information like API keys and passwords

4. **Regular Testing**: Periodically test the integration to ensure it continues to function as expected

5. **Feedback Loop**: Establish a process for developers to provide feedback on the phase change reports and notification system

## Conclusion

By following this integration guide, you can ensure that the Phase Change Tracker is fully integrated with the notification system and other components of the Promethios ecosystem. This integration enhances the value of the Phase Change Tracker by ensuring that all stakeholders are promptly informed about changes between phases, supporting the Promethios principles of trust and transparency.
