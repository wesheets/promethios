/**
 * ResponseFormatter.js
 * 
 * Service for formatting AI responses into structured, readable markdown format
 * similar to modern AI assistants like Claude, ChatGPT, etc.
 */

class ResponseFormatter {
  constructor() {
    this.sectionEmojis = {
      search: '🔍',
      results: '📊',
      summary: '📝',
      analysis: '🧠',
      document: '📄',
      code: '💻',
      data: '📈',
      error: '❌',
      success: '✅',
      warning: '⚠️',
      info: 'ℹ️',
      attachment: '📎',
      download: '⬇️'
    };
  }

  /**
   * Format a response based on tool results and content
   * @param {string} originalResponse - The original AI response
   * @param {Array} toolResults - Results from tool executions
   * @param {Object} options - Formatting options
   * @returns {string} Formatted markdown response
   */
  formatResponse(originalResponse, toolResults = [], options = {}) {
    try {
      console.log('🎨 ResponseFormatter: Formatting response with', toolResults.length, 'tool results');
      
      // If no tool results, just format the original response
      if (!toolResults || toolResults.length === 0) {
        return this.formatBasicResponse(originalResponse);
      }

      let formattedResponse = '';
      const attachments = [];

      // Process each tool result
      toolResults.forEach(result => {
        const toolName = result.name;
        
        try {
          const resultData = JSON.parse(result.content);
          
          switch (toolName) {
            case 'web_search':
              formattedResponse += this.formatSearchResults(resultData);
              break;
            case 'web_scraping':
              formattedResponse += this.formatWebScrapingResults(resultData);
              break;
            case 'article_verification':
              formattedResponse += this.formatVerificationResults(resultData);
              break;
            case 'document_generation':
              formattedResponse += this.formatDocumentGeneration(resultData);
              if (result.attachment) {
                attachments.push(result.attachment);
              }
              break;
            case 'data_visualization':
              formattedResponse += this.formatDataVisualization(resultData);
              if (result.attachment) {
                attachments.push(result.attachment);
              }
              break;
            case 'coding_programming':
              formattedResponse += this.formatCodingResults(resultData);
              break;
            default:
              formattedResponse += this.formatGenericTool(toolName, resultData);
          }
        } catch (parseError) {
          console.warn('⚠️ ResponseFormatter: Could not parse tool result:', parseError);
          formattedResponse += this.formatRawToolResult(toolName, result.content);
        }
      });

      // Add original AI response if it contains additional insights
      if (originalResponse && originalResponse.trim() && !this.isGenericResponse(originalResponse)) {
        formattedResponse += `\n\n## ${this.sectionEmojis.analysis} Analysis\n\n${originalResponse}\n`;
      }

      // Add attachments section if any
      if (attachments.length > 0) {
        formattedResponse += this.formatAttachments(attachments);
      }

      return formattedResponse.trim();
      
    } catch (error) {
      console.error('❌ ResponseFormatter: Error formatting response:', error);
      return originalResponse; // Fallback to original response
    }
  }

  /**
   * Format search results
   */
  formatSearchResults(searchData) {
    if (!searchData || !searchData.results) {
      return `## ${this.sectionEmojis.search} Search Results\n\n${this.sectionEmojis.error} No search results found.\n\n`;
    }

    let formatted = `## ${this.sectionEmojis.search} Search Results\n\n`;
    formatted += `I found ${searchData.results.length} relevant result(s):\n\n`;

    searchData.results.forEach((result, index) => {
      formatted += `### ${index + 1}. ${result.title}\n`;
      if (result.snippet) {
        formatted += `${result.snippet}\n\n`;
      }
      if (result.url) {
        formatted += `**Source**: [${result.url}](${result.url})\n\n`;
      }
    });

    return formatted;
  }

  /**
   * Format web scraping results with clean summary and verification option
   */
  formatWebScrapingResults(scrapingData) {
    if (!scrapingData || !scrapingData.success) {
      return `## ${this.sectionEmojis.error} Web Scraping Failed\n\n${scrapingData?.error || 'Unable to scrape the requested URL.'}\n\n`;
    }

    const result = scrapingData.result;
    let formatted = `## 📰 Article Summary\n\n`;

    // Article title and source
    if (result.title) {
      formatted += `**${result.title}**\n\n`;
    }
    
    if (result.url) {
      const domain = new URL(result.url).hostname.replace('www.', '');
      formatted += `**Source**: ${domain}\n`;
    }

    if (result.scraped_at) {
      const scrapedDate = new Date(result.scraped_at).toLocaleDateString();
      formatted += `**Scraped**: ${scrapedDate}\n\n`;
    }

    // Clean content summary
    if (result.data?.text_content?.content) {
      const content = result.data.text_content.content;
      // Create a clean summary (first 500 characters)
      const summary = content.length > 500 
        ? content.substring(0, 500) + '...' 
        : content;
      
      formatted += `### Summary\n${summary}\n\n`;
    }

    // Article metrics
    if (result.data?.text_content?.length) {
      const wordCount = Math.round(result.data.text_content.length / 5); // Rough word count
      formatted += `**Length**: ~${wordCount} words\n`;
    }

    if (result.data?.links?.total_count) {
      formatted += `**Links**: ${result.data.links.total_count} found\n`;
    }

    if (result.data?.images?.images?.length) {
      formatted += `**Images**: ${result.data.images.images.length} found\n`;
    }

    // Verification button with data attributes for frontend handling
    formatted += `\n---\n\n`;
    formatted += `🔍 **Want to verify this article's credibility?**\n\n`;
    formatted += `Click below to get a comprehensive fact-check with multiple sources:\n\n`;
    
    // Create a verification button with embedded data
    const verificationData = {
      article_url: result.url,
      article_title: result.title,
      article_content: result.data?.text_content?.content || '',
      verification_id: `verify_${Date.now()}`
    };
    
    formatted += `<div class="verification-section" data-verification='${JSON.stringify(verificationData)}'>\n`;
    formatted += `<button class="verify-credibility-btn" onclick="startVerification(this)">\n`;
    formatted += `🛡️ Verify Article Credibility\n`;
    formatted += `</button>\n`;
    formatted += `<div class="verification-results" style="display: none;"></div>\n`;
    formatted += `</div>\n\n`;
    
    formatted += `*This will research claims across authoritative sources and provide a governance-backed analysis.*\n\n`;

    return formatted;
  }

  /**
   * Format article verification results with trust score and detailed analysis
   */
  formatVerificationResults(verificationData) {
    if (!verificationData || !verificationData.success) {
      return `## ${this.sectionEmojis.error} Verification Failed\n\n${verificationData?.error || 'Unable to verify the article.'}\n\n`;
    }

    const result = verificationData;
    let formatted = `## 🛡️ CREDIBILITY ANALYSIS COMPLETE\n\n`;

    // Trust Score Header
    const trustScore = result.trust_score.overall;
    const trustLevel = trustScore >= 8 ? 'HIGHLY CREDIBLE' : 
                      trustScore >= 6 ? 'MOSTLY CREDIBLE' : 
                      trustScore >= 4 ? 'QUESTIONABLE' : 'NOT CREDIBLE';
    
    const trustEmoji = trustScore >= 8 ? '✅' : 
                      trustScore >= 6 ? '⚠️' : 
                      trustScore >= 4 ? '🔶' : '❌';

    formatted += `### ${trustEmoji} TRUST SCORE: ${trustScore}/10 - ${trustLevel}\n\n`;

    // Claims Analysis
    const claims = result.claims_analysis;
    formatted += `### 📊 CLAIMS VERIFICATION\n\n`;
    formatted += `**Total Claims Analyzed**: ${claims.total_claims}\n`;
    formatted += `**✅ Verified Claims**: ${claims.verified_claims}\n`;
    formatted += `**⚠️ Unverified Claims**: ${claims.unverified_claims}\n`;
    if (claims.disputed_claims > 0) {
      formatted += `**❌ Disputed Claims**: ${claims.disputed_claims}\n`;
    }
    formatted += `\n`;

    // Detailed Claims
    if (claims.details && claims.details.length > 0) {
      formatted += `#### Claim Details:\n`;
      claims.details.forEach((claim, index) => {
        const statusEmoji = claim.status === 'verified' ? '✅' : 
                           claim.status === 'partially_verified' ? '⚠️' : '❌';
        formatted += `${index + 1}. ${statusEmoji} **${claim.status.toUpperCase()}**: ${claim.claim_text.substring(0, 100)}...\n`;
        if (claim.supporting_sources && claim.supporting_sources.length > 0) {
          formatted += `   *Sources: ${claim.supporting_sources.join(', ')}*\n`;
        }
      });
      formatted += `\n`;
    }

    // Sources Analysis
    const sources = result.sources;
    formatted += `### 📋 SOURCES CHECKED (${sources.total_checked})\n\n`;
    formatted += `**Authoritative Sources**: ${sources.authoritative_sources}\n`;
    formatted += `**Government Sources**: ${sources.government_sources}\n`;
    formatted += `**Academic Sources**: ${sources.academic_sources}\n\n`;

    // Top Sources
    if (sources.details && sources.details.length > 0) {
      formatted += `#### Key Sources:\n`;
      sources.details.slice(0, 5).forEach((source, index) => {
        const statusEmoji = source.verification_status === 'verified' ? '✅' : '⚠️';
        formatted += `${index + 1}. ${statusEmoji} **${source.name}** (Authority: ${source.authority_score}/10)\n`;
        formatted += `   ${source.url}\n`;
      });
      if (sources.details.length > 5) {
        formatted += `   *... and ${sources.details.length - 5} more sources*\n`;
      }
      formatted += `\n`;
    }

    // Bias Analysis
    const bias = result.bias_analysis;
    formatted += `### 🎯 BIAS ANALYSIS\n\n`;
    formatted += `**Bias Level**: ${bias.bias_level.charAt(0).toUpperCase() + bias.bias_level.slice(1)}\n`;
    formatted += `**Language Tone**: ${bias.language_tone.charAt(0).toUpperCase() + bias.language_tone.slice(1)}\n`;
    formatted += `**Source Bias Average**: ${bias.source_bias_average}/1.0\n\n`;

    // Trust Score Breakdown
    formatted += `### 📈 TRUST SCORE BREAKDOWN\n\n`;
    const breakdown = result.trust_score.breakdown;
    formatted += `- **Claim Verification**: ${breakdown.claim_verification}/40\n`;
    formatted += `- **Source Authority**: ${breakdown.source_authority}/30\n`;
    formatted += `- **Consistency**: ${breakdown.consistency}/20\n`;
    formatted += `- **Bias Adjustment**: ${breakdown.bias_adjustment}/10\n\n`;

    // Governance Assessment
    const governance = result.governance_assessment;
    formatted += `### 🏛️ GOVERNANCE ASSESSMENT\n\n`;
    formatted += `**${governance.recommendation}**\n\n`;
    formatted += `${governance.assessment}\n\n`;
    formatted += `**Compliance Score**: ${governance.compliance_score}/10\n`;
    formatted += `**Verification Rate**: ${governance.verification_rate}\n\n`;

    if (governance.governance_notes && governance.governance_notes.length > 0) {
      formatted += `**Additional Notes**:\n`;
      governance.governance_notes.forEach(note => {
        formatted += `- ${note}\n`;
      });
      formatted += `\n`;
    }

    // Metadata
    const metadata = result.verification_metadata;
    formatted += `### 📝 VERIFICATION METADATA\n\n`;
    formatted += `**Verification ID**: ${result.verification_id}\n`;
    formatted += `**Timestamp**: ${new Date(metadata.timestamp).toLocaleString()}\n`;
    formatted += `**Methodology**: ${metadata.methodology}\n`;
    formatted += `**Depth**: ${metadata.depth.charAt(0).toUpperCase() + metadata.depth.slice(1)}\n\n`;

    return formatted;
  }

  /**
   * Format document generation results
   */
  formatDocumentGeneration(docData) {
    let formatted = `## ${this.sectionEmojis.document} Document Generated\n\n`;
    
    if (docData.success) {
      formatted += `${this.sectionEmojis.success} Successfully created your document!\n\n`;
      
      formatted += `### Document Details\n`;
      formatted += `- **Title**: ${docData.title || 'Generated Document'}\n`;
      formatted += `- **Format**: ${(docData.format || 'PDF').toUpperCase()}\n`;
      formatted += `- **Filename**: ${docData.filename || 'document'}\n`;
      
      if (docData.file_size) {
        const sizeKB = Math.round(docData.file_size / 1024);
        formatted += `- **Size**: ${sizeKB} KB\n`;
      }
      
      formatted += `\n${docData.note || 'Document is ready for download.'}\n\n`;
    } else {
      formatted += `${this.sectionEmojis.error} Document generation failed: ${docData.error || 'Unknown error'}\n\n`;
    }

    return formatted;
  }

  /**
   * Format data visualization results
   */
  formatDataVisualization(vizData) {
    let formatted = `## ${this.sectionEmojis.data} Data Visualization\n\n`;
    
    if (vizData.success) {
      formatted += `${this.sectionEmojis.success} Created your visualization!\n\n`;
      formatted += `### Chart Details\n`;
      formatted += `- **Type**: ${vizData.chart_type || 'Chart'}\n`;
      formatted += `- **Data Points**: ${vizData.data_points || 'Multiple'}\n`;
      formatted += `\n${vizData.description || 'Visualization generated successfully.'}\n\n`;
    } else {
      formatted += `${this.sectionEmojis.error} Visualization failed: ${vizData.error || 'Unknown error'}\n\n`;
    }

    return formatted;
  }

  /**
   * Format coding results
   */
  formatCodingResults(codeData) {
    let formatted = `## ${this.sectionEmojis.code} Code Generated\n\n`;
    
    if (codeData.code) {
      formatted += `### Generated Code\n\n`;
      formatted += `\`\`\`${codeData.language || 'text'}\n${codeData.code}\n\`\`\`\n\n`;
    }
    
    if (codeData.explanation) {
      formatted += `### Explanation\n\n${codeData.explanation}\n\n`;
    }

    return formatted;
  }

  /**
   * Format generic tool results
   */
  formatGenericTool(toolName, data) {
    const emoji = this.sectionEmojis[toolName] || this.sectionEmojis.info;
    let formatted = `## ${emoji} ${this.capitalizeFirst(toolName.replace('_', ' '))} Results\n\n`;
    
    if (typeof data === 'object') {
      Object.keys(data).forEach(key => {
        if (key !== 'attachment') {
          formatted += `- **${this.capitalizeFirst(key)}**: ${data[key]}\n`;
        }
      });
    } else {
      formatted += `${data}\n`;
    }
    
    return formatted + '\n';
  }

  /**
   * Format raw tool result when parsing fails
   */
  formatRawToolResult(toolName, content) {
    const emoji = this.sectionEmojis[toolName] || this.sectionEmojis.info;
    return `## ${emoji} ${this.capitalizeFirst(toolName.replace('_', ' '))} Results\n\n${content}\n\n`;
  }

  /**
   * Format attachments section
   */
  formatAttachments(attachments) {
    let formatted = `## ${this.sectionEmojis.attachment} Attachments\n\n`;
    
    attachments.forEach((attachment, index) => {
      formatted += `${index + 1}. **${attachment.name}**\n`;
      formatted += `   - Type: ${attachment.type}\n`;
      if (attachment.size) {
        const sizeKB = Math.round(attachment.size / 1024);
        formatted += `   - Size: ${sizeKB} KB\n`;
      }
      formatted += `   - ${this.sectionEmojis.download} [Download](${attachment.url})\n\n`;
    });

    return formatted;
  }

  /**
   * Format basic response without tool results
   */
  formatBasicResponse(response) {
    if (!response || response.trim() === '') {
      return '';
    }

    // Add some basic structure to plain responses
    let formatted = response;

    // Add emoji to common patterns
    formatted = formatted.replace(/^(Error|Failed|Problem)/gm, `${this.sectionEmojis.error} $1`);
    formatted = formatted.replace(/^(Success|Complete|Done)/gm, `${this.sectionEmojis.success} $1`);
    formatted = formatted.replace(/^(Note|Important|Warning)/gm, `${this.sectionEmojis.warning} $1`);

    return formatted;
  }

  /**
   * Check if response is generic/template response
   */
  isGenericResponse(response) {
    const genericPatterns = [
      /I'll do another search/i,
      /Let me search for/i,
      /I'll help you with/i,
      /Here are the results/i
    ];
    
    return genericPatterns.some(pattern => pattern.test(response));
  }

  /**
   * Capitalize first letter of a string
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = ResponseFormatter;

