/**
 * CI/CD Integration Module for Phase Change Tracker
 * 
 * This module provides integration with CI/CD pipelines and communication tools
 * for automated report generation and delivery.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const notificationManager = require('../notification');

/**
 * CI/CD Integration Manager class
 */
class CICDIntegrationManager {
  /**
   * Generate GitHub Actions workflow file
   */
  generateGitHubWorkflow() {
    const workflow = {
      name: 'Phase Change Tracker',
      on: {
        push: {
          branches: ['main', 'develop'],
          tags: ['phase-*']
        },
        workflow_dispatch: {
          inputs: {
            previousPhase: {
              description: 'Previous phase number (e.g., 6.5)',
              required: true,
              type: 'string'
            },
            currentPhase: {
              description: 'Current phase number (e.g., 7.0)',
              required: true,
              type: 'string'
            }
          }
        }
      },
      jobs: {
        track_changes: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              name: 'Checkout code',
              uses: 'actions/checkout@v3',
              with: {
                'fetch-depth': 0
              }
            },
            {
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v3',
              with: {
                'node-version': '16'
              }
            },
            {
              name: 'Install dependencies',
              run: 'npm install'
            },
            {
              name: 'Run Phase Change Tracker',
              run: 'node tools/phase-change-tracker.js ${{ github.event.inputs.previousPhase || \'auto\' }} ${{ github.event.inputs.currentPhase || \'auto\' }} --notify --ci'
            },
            {
              name: 'Upload report artifact',
              uses: 'actions/upload-artifact@v3',
              with: {
                name: 'phase-change-report',
                path: 'phase_changes/*.md'
              }
            },
            {
              name: 'Upload visualizations artifact',
              uses: 'actions/upload-artifact@v3',
              with: {
                name: 'phase-change-visualizations',
                path: 'phase_changes/visualizations/*.html'
              }
            }
          ]
        }
      }
    };
    
    // Create .github/workflows directory if it doesn't exist
    const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
    if (!fs.existsSync(workflowsDir)) {
      fs.mkdirSync(workflowsDir, { recursive: true });
    }
    
    // Write workflow file
    const workflowPath = path.join(workflowsDir, 'phase-change-tracker.yml');
    fs.writeFileSync(workflowPath, yaml.dump(workflow));
    
    return workflowPath;
  }
  
  /**
   * Generate GitLab CI configuration
   */
  generateGitLabCI() {
    const config = {
      'phase-change-tracker': {
        image: 'node:16',
        script: [
          'npm install',
          'node tools/phase-change-tracker.js auto auto --notify --ci'
        ],
        artifacts: {
          paths: [
            'phase_changes/*.md',
            'phase_changes/visualizations/*.html'
          ],
          expire_in: '1 week'
        },
        only: {
          refs: ['main', 'develop', '/^phase-.*$/']
        }
      }
    };
    
    // Write GitLab CI configuration file
    const configPath = path.join(process.cwd(), '.gitlab-ci.yml');
    fs.writeFileSync(configPath, yaml.dump(config));
    
    return configPath;
  }
  
  /**
   * Generate Jenkins pipeline
   */
  generateJenkinsPipeline() {
    const pipeline = `
pipeline {
    agent {
        docker {
            image 'node:16'
        }
    }
    
    triggers {
        cron('0 0 * * *') // Daily at midnight
    }
    
    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Run Phase Change Tracker') {
            steps {
                sh 'node tools/phase-change-tracker.js auto auto --notify --ci'
            }
        }
        
        stage('Archive Reports') {
            steps {
                archiveArtifacts artifacts: 'phase_changes/*.md, phase_changes/visualizations/*.html', fingerprint: true
            }
        }
    }
    
    post {
        success {
            echo 'Phase Change Tracker completed successfully'
        }
        failure {
            echo 'Phase Change Tracker failed'
        }
    }
}
    `;
    
    // Write Jenkinsfile
    const jenkinsfilePath = path.join(process.cwd(), 'Jenkinsfile.phase-tracker');
    fs.writeFileSync(jenkinsfilePath, pipeline);
    
    return jenkinsfilePath;
  }
  
  /**
   * Add CI/CD arguments to Phase Change Tracker
   */
  addCICDArgumentsToTracker(trackerPath) {
    try {
      let content = fs.readFileSync(trackerPath, 'utf8');
      
      // Check if CI/CD arguments are already added
      if (content.includes('--notify') && content.includes('--ci')) {
        return false;
      }
      
      // Find the argument parsing section
      const argParsingRegex = /const args = process\.argv\.slice\(2\);/;
      if (!argParsingRegex.test(content)) {
        return false;
      }
      
      // Add CI/CD argument handling
      const ciArgHandling = `
// Parse command line arguments
const args = process.argv.slice(2);
let previousPhase = args[0];
let currentPhase = args[1];
let shouldNotify = args.includes('--notify');
let isCIMode = args.includes('--ci');

// Auto-detect phases if 'auto' is specified
if (previousPhase === 'auto' || currentPhase === 'auto') {
  try {
    // Get the last two tags that match phase-* pattern
    const tags = execSync('git tag --sort=-v:refname | grep "^phase-" | head -n 2', { encoding: 'utf8' })
      .trim()
      .split('\\n');
    
    if (tags.length >= 2) {
      if (currentPhase === 'auto') {
        currentPhase = tags[0].replace('phase-', '');
      }
      
      if (previousPhase === 'auto') {
        previousPhase = tags[1].replace('phase-', '');
      }
      
      console.log(\`Auto-detected phases: \${previousPhase} -> \${currentPhase}\`);
    } else {
      console.error('Could not auto-detect phases. Please specify them manually.');
      process.exit(1);
    }
  } catch (error) {
    console.error(\`Error auto-detecting phases: \${error.message}\`);
    process.exit(1);
  }
}
`;
      
      // Replace the original argument parsing with the enhanced version
      content = content.replace(argParsingRegex, ciArgHandling);
      
      // Find the report generation section
      const reportGenRegex = /console\.log\(`Phase change report generated: \${reportPath}`\);/;
      if (reportGenRegex.test(content)) {
        // Add notification sending after report generation
        const notificationCode = `
console.log(\`Phase change report generated: \${reportPath}\`);

// Send notifications if requested
if (shouldNotify) {
  try {
    const notificationManager = require('./notification');
    console.log('Sending notifications...');
    notificationManager.sendPhaseChangeNotification(report)
      .then(result => {
        console.log(\`Notifications sent: \${result.sent} successful, \${result.failed} failed\`);
        if (result.errors && result.errors.length > 0) {
          console.error('Notification errors:', result.errors);
        }
      })
      .catch(error => {
        console.error(\`Error sending notifications: \${error.message}\`);
      });
  } catch (error) {
    console.error(\`Error loading notification manager: \${error.message}\`);
  }
}
`;
        content = content.replace(reportGenRegex, notificationCode);
      }
      
      // Write the updated content back to the file
      fs.writeFileSync(trackerPath, content);
      
      return true;
    } catch (error) {
      console.error(`Error adding CI/CD arguments to tracker: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Setup CI/CD integration
   */
  setupCICDIntegration() {
    const results = {
      github: null,
      gitlab: null,
      jenkins: null,
      tracker: false
    };
    
    // Generate GitHub Actions workflow
    try {
      results.github = this.generateGitHubWorkflow();
      console.log(`GitHub Actions workflow generated: ${results.github}`);
    } catch (error) {
      console.error(`Error generating GitHub Actions workflow: ${error.message}`);
    }
    
    // Generate GitLab CI configuration
    try {
      results.gitlab = this.generateGitLabCI();
      console.log(`GitLab CI configuration generated: ${results.gitlab}`);
    } catch (error) {
      console.error(`Error generating GitLab CI configuration: ${error.message}`);
    }
    
    // Generate Jenkins pipeline
    try {
      results.jenkins = this.generateJenkinsPipeline();
      console.log(`Jenkins pipeline generated: ${results.jenkins}`);
    } catch (error) {
      console.error(`Error generating Jenkins pipeline: ${error.message}`);
    }
    
    // Add CI/CD arguments to Phase Change Tracker
    try {
      const trackerPath = path.join(process.cwd(), 'tools', 'phase-change-tracker.js');
      results.tracker = this.addCICDArgumentsToTracker(trackerPath);
      if (results.tracker) {
        console.log('CI/CD arguments added to Phase Change Tracker');
      } else {
        console.log('CI/CD arguments already present or could not be added to Phase Change Tracker');
      }
    } catch (error) {
      console.error(`Error adding CI/CD arguments to tracker: ${error.message}`);
    }
    
    return results;
  }
}

module.exports = new CICDIntegrationManager();
