/**
 * Article Verification Handler
 * 
 * Handles the frontend verification workflow for article credibility checking.
 * This script manages the expandable verification section and API calls.
 */

class VerificationHandler {
  constructor() {
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    this.activeVerifications = new Map();
  }

  /**
   * Start the verification process for an article
   * @param {HTMLElement} buttonElement - The verification button that was clicked
   */
  async startVerification(buttonElement) {
    try {
      const verificationSection = buttonElement.closest('.verification-section');
      const verificationData = JSON.parse(verificationSection.dataset.verification);
      const resultsContainer = verificationSection.querySelector('.verification-results');
      
      // Prevent multiple clicks
      if (this.activeVerifications.has(verificationData.verification_id)) {
        return;
      }

      // Mark as active
      this.activeVerifications.set(verificationData.verification_id, true);
      
      // Update button state
      buttonElement.disabled = true;
      buttonElement.innerHTML = '🔄 Verifying...';
      
      // Show and populate progress section
      resultsContainer.style.display = 'block';
      resultsContainer.innerHTML = this.createProgressSection();
      
      // Start verification process
      await this.performVerification(verificationData, resultsContainer);
      
    } catch (error) {
      console.error('Verification failed:', error);
      this.showError(buttonElement, error.message);
    }
  }

  /**
   * Create the progress section HTML
   */
  createProgressSection() {
    return `
      <div class="verification-progress" style="
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 16px;
        margin-top: 12px;
        font-family: 'Inter', sans-serif;
      ">
        <div style="color: #3b82f6; font-weight: 600; margin-bottom: 12px;">
          🔄 VERIFICATION IN PROGRESS...
        </div>
        <div class="progress-steps">
          <div class="progress-step" data-step="extracting">
            <span class="step-icon">⏳</span>
            <span class="step-text">Extracting key claims...</span>
          </div>
          <div class="progress-step" data-step="searching">
            <span class="step-icon">⏳</span>
            <span class="step-text">Searching authoritative sources...</span>
          </div>
          <div class="progress-step" data-step="verifying">
            <span class="step-icon">⏳</span>
            <span class="step-text">Cross-referencing claims...</span>
          </div>
          <div class="progress-step" data-step="analyzing">
            <span class="step-icon">⏳</span>
            <span class="step-text">Analyzing bias indicators...</span>
          </div>
          <div class="progress-step" data-step="scoring">
            <span class="step-icon">⏳</span>
            <span class="step-text">Generating trust score...</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Perform the actual verification by calling the API
   */
  async performVerification(verificationData, resultsContainer) {
    try {
      // Simulate progress updates
      await this.updateProgress('extracting', '✅');
      await this.delay(800);
      
      await this.updateProgress('searching', '✅');
      await this.delay(1000);
      
      await this.updateProgress('verifying', '🔄');
      
      // Make API call to verification endpoint
      const response = await fetch(`${this.apiBaseUrl}/api/tools/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'article_verification',
          parameters: {
            article_url: verificationData.article_url,
            article_title: verificationData.article_title,
            article_content: verificationData.article_content,
            verification_depth: 'standard'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Verification API failed: ${response.status}`);
      }

      const result = await response.json();
      
      await this.updateProgress('verifying', '✅');
      await this.delay(500);
      
      await this.updateProgress('analyzing', '✅');
      await this.delay(500);
      
      await this.updateProgress('scoring', '✅');
      await this.delay(500);

      // Show final results
      this.showVerificationResults(result, resultsContainer);
      
    } catch (error) {
      console.error('Verification API error:', error);
      this.showVerificationError(error.message, resultsContainer);
    }
  }

  /**
   * Update progress step status
   */
  async updateProgress(stepName, icon) {
    const step = document.querySelector(`[data-step="${stepName}"] .step-icon`);
    if (step) {
      step.textContent = icon;
    }
  }

  /**
   * Show the verification results
   */
  showVerificationResults(result, resultsContainer) {
    if (!result.success) {
      this.showVerificationError(result.error || 'Verification failed', resultsContainer);
      return;
    }

    const trustScore = result.trust_score.overall;
    const trustLevel = trustScore >= 8 ? 'HIGHLY CREDIBLE' : 
                      trustScore >= 6 ? 'MOSTLY CREDIBLE' : 
                      trustScore >= 4 ? 'QUESTIONABLE' : 'NOT CREDIBLE';
    
    const trustEmoji = trustScore >= 8 ? '✅' : 
                      trustScore >= 6 ? '⚠️' : 
                      trustScore >= 4 ? '🔶' : '❌';

    const trustColor = trustScore >= 8 ? '#10b981' : 
                      trustScore >= 6 ? '#f59e0b' : 
                      trustScore >= 4 ? '#f97316' : '#ef4444';

    resultsContainer.innerHTML = `
      <div class="verification-results-final" style="
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 20px;
        margin-top: 12px;
        font-family: 'Inter', sans-serif;
      ">
        <div style="
          color: ${trustColor};
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 16px;
          text-align: center;
        ">
          ${trustEmoji} TRUST SCORE: ${trustScore}/10 - ${trustLevel}
        </div>
        
        <div class="verification-summary" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        ">
          <div class="summary-card" style="
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 6px;
            padding: 12px;
          ">
            <div style="color: #64748b; font-size: 12px; font-weight: 500;">CLAIMS VERIFIED</div>
            <div style="color: #10b981; font-size: 20px; font-weight: 700;">
              ${result.claims_analysis.verified_claims}/${result.claims_analysis.total_claims}
            </div>
          </div>
          
          <div class="summary-card" style="
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 6px;
            padding: 12px;
          ">
            <div style="color: #64748b; font-size: 12px; font-weight: 500;">SOURCES CHECKED</div>
            <div style="color: #3b82f6; font-size: 20px; font-weight: 700;">
              ${result.sources.total_checked}
            </div>
          </div>
          
          <div class="summary-card" style="
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 6px;
            padding: 12px;
          ">
            <div style="color: #64748b; font-size: 12px; font-weight: 500;">BIAS LEVEL</div>
            <div style="color: #f59e0b; font-size: 16px; font-weight: 700;">
              ${result.bias_analysis.bias_level.toUpperCase()}
            </div>
          </div>
        </div>

        <div class="governance-assessment" style="
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 16px;
        ">
          <div style="color: #3b82f6; font-weight: 600; margin-bottom: 8px;">
            🏛️ GOVERNANCE ASSESSMENT
          </div>
          <div style="color: #e2e8f0; font-weight: 600; margin-bottom: 8px;">
            ${result.governance_assessment.recommendation}
          </div>
          <div style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
            ${result.governance_assessment.assessment}
          </div>
        </div>

        <div class="detailed-sources" style="margin-bottom: 16px;">
          <div style="color: #64748b; font-weight: 600; margin-bottom: 8px;">
            📋 KEY SOURCES (${Math.min(result.sources.details.length, 3)})
          </div>
          ${result.sources.details.slice(0, 3).map(source => `
            <div style="
              background: #0f172a;
              border: 1px solid #1e293b;
              border-radius: 4px;
              padding: 8px;
              margin-bottom: 4px;
              font-size: 13px;
            ">
              <div style="color: #e2e8f0; font-weight: 500;">
                ${source.verification_status === 'verified' ? '✅' : '⚠️'} ${source.name}
              </div>
              <div style="color: #64748b;">
                Authority: ${source.authority_score}/10 | ${source.type}
              </div>
            </div>
          `).join('')}
          ${result.sources.details.length > 3 ? `
            <div style="color: #64748b; font-size: 12px; font-style: italic;">
              ... and ${result.sources.details.length - 3} more sources
            </div>
          ` : ''}
        </div>

        <div class="verification-metadata" style="
          border-top: 1px solid #334155;
          padding-top: 12px;
          font-size: 12px;
          color: #64748b;
        ">
          <div>Verification ID: ${result.verification_id}</div>
          <div>Completed: ${new Date().toLocaleString()}</div>
          <div>Methodology: ${result.verification_metadata.methodology}</div>
        </div>
      </div>
    `;

    // Clean up
    this.activeVerifications.delete(result.verification_id);
  }

  /**
   * Show verification error
   */
  showVerificationError(errorMessage, resultsContainer) {
    resultsContainer.innerHTML = `
      <div class="verification-error" style="
        background: #1e293b;
        border: 1px solid #ef4444;
        border-radius: 8px;
        padding: 16px;
        margin-top: 12px;
        color: #ef4444;
        font-family: 'Inter', sans-serif;
      ">
        <div style="font-weight: 600; margin-bottom: 8px;">
          ❌ Verification Failed
        </div>
        <div style="font-size: 14px;">
          ${errorMessage}
        </div>
      </div>
    `;
  }

  /**
   * Show error on button
   */
  showError(buttonElement, errorMessage) {
    buttonElement.innerHTML = '❌ Failed';
    buttonElement.style.backgroundColor = '#ef4444';
    setTimeout(() => {
      buttonElement.innerHTML = '🛡️ Verify Article Credibility';
      buttonElement.style.backgroundColor = '';
      buttonElement.disabled = false;
    }, 3000);
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create global instance
window.verificationHandler = new VerificationHandler();

// Global function for button onclick
window.startVerification = function(buttonElement) {
  window.verificationHandler.startVerification(buttonElement);
};

export default VerificationHandler;

