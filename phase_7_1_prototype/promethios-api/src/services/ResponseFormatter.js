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

