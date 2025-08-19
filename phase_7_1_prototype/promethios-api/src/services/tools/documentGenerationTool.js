/**
 * Document Generation Tool
 * 
 * Generates documents in various formats (PDF, DOCX, TXT)
 */

const fs = require('fs');
const path = require('path');

class DocumentGenerationTool {
  constructor() {
    this.name = 'Document Generation';
    this.description = 'Generate PDF, Word, and other document formats';
    this.category = 'content';
    this.schema = {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content to include in the document'
        },
        format: {
          type: 'string',
          enum: ['pdf', 'docx', 'txt', 'html'],
          description: 'The document format to generate',
          default: 'txt'
        },
        title: {
          type: 'string',
          description: 'The document title'
        },
        filename: {
          type: 'string',
          description: 'Custom filename (optional)'
        }
      },
      required: ['content']
    };
  }

  async execute(parameters, context = {}) {
    try {
      const { content, format = 'txt', title = 'Generated Document', filename } = parameters;
      
      if (!content || typeof content !== 'string') {
        throw new Error('Content parameter is required and must be a string');
      }

      console.log(`📄 [DocumentGen] Generating ${format.toUpperCase()} document: "${title}"`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultFilename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
      const finalFilename = filename || defaultFilename;

      let documentData;
      let mimeType;

      switch (format.toLowerCase()) {
        case 'pdf':
          documentData = await this.generatePDF(content, title);
          mimeType = 'application/pdf';
          break;
        case 'docx':
          documentData = await this.generateDOCX(content, title);
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'html':
          documentData = this.generateHTML(content, title);
          mimeType = 'text/html';
          break;
        case 'txt':
        default:
          documentData = this.generateTXT(content, title);
          mimeType = 'text/plain';
          break;
      }

      console.log(`✅ [DocumentGen] Document generated successfully: ${finalFilename}.${format}`);

      return {
        title,
        format,
        filename: `${finalFilename}.${format}`,
        content_length: content.length,
        document_size: documentData.length,
        mime_type: mimeType,
        document_data: documentData, // In production, you might save to file system and return URL
        timestamp: new Date().toISOString(),
        note: 'Document generated successfully. In production, this would be saved to file system.'
      };

    } catch (error) {
      console.error('❌ [DocumentGen] Document generation failed:', error);
      throw new Error(`Document generation failed: ${error.message}`);
    }
  }

  generateTXT(content, title) {
    const header = `${title}\n${'='.repeat(title.length)}\n\n`;
    const footer = `\n\nGenerated on: ${new Date().toLocaleString()}`;
    return header + content + footer;
  }

  generateHTML(content, title) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .content {
            margin: 20px 0;
            white-space: pre-wrap;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="content">${content}</div>
    <div class="footer">Generated on: ${new Date().toLocaleString()}</div>
</body>
</html>`;
    return html;
  }

  async generatePDF(content, title) {
    // For a real implementation, you would use a library like puppeteer, jsPDF, or PDFKit
    // This is a mock implementation
    console.log('📄 [DocumentGen] PDF generation is mocked - would use puppeteer/PDFKit in production');
    
    const mockPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length ${content.length + title.length + 100}
>>
stream
BT
/F1 12 Tf
72 720 Td
(${title}) Tj
0 -24 Td
(${content.substring(0, 100)}...) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000185 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${300 + content.length}
%%EOF`;

    return mockPDFContent;
  }

  async generateDOCX(content, title) {
    // For a real implementation, you would use a library like docx or officegen
    // This is a mock implementation
    console.log('📄 [DocumentGen] DOCX generation is mocked - would use docx library in production');
    
    const mockDOCXContent = `Mock DOCX Content:
Title: ${title}
Content: ${content}
Generated: ${new Date().toISOString()}

Note: This is a mock DOCX. In production, use the 'docx' npm package to generate real DOCX files.`;

    return mockDOCXContent;
  }
}

module.exports = new DocumentGenerationTool();

