/**
 * Document Generation Tool
 * 
 * Generates documents in various formats (PDF, DOCX, TXT, XLSX)
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const { Document, Paragraph, TextRun, Packer } = require('docx');
const XLSX = require('xlsx');

class DocumentGenerationTool {
  constructor() {
    this.name = 'Document Generation';
    this.description = 'Generate and create documents in PDF, DOCX, XLSX, HTML, and TXT formats. Use this tool when the user asks to create, generate, or produce a document, report, or file. This tool creates the actual document content and file.';
    this.category = 'content';
    
    // Setup file storage directory
    this.storageDir = path.join(process.cwd(), 'temp_files');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    this.schema = {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The main content/text to include in the document. For topics you are familiar with, provide comprehensive content directly. For current events or specific research, you may search first then generate the document.'
        },
        format: {
          type: 'string',
          enum: ['pdf', 'docx', 'txt', 'html', 'xlsx'],
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
      const { content, format = 'pdf', title = 'Generated Document', filename } = parameters;
      
      if (!content || typeof content !== 'string') {
        throw new Error('Content parameter is required and must be a string');
      }

      console.log(`📄 [DocumentGen] Generating ${format.toUpperCase()} document: "${title}"`);

      // Generate unique file ID and filename
      const fileId = uuidv4();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultFilename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
      const finalFilename = filename || defaultFilename;
      const fullFilename = `${finalFilename}.${format}`;
      const filePath = path.join(this.storageDir, `${fileId}_${fullFilename}`);

      let mimeType;
      let documentData;

      // Generate document based on format
      switch (format.toLowerCase()) {
        case 'pdf':
          documentData = await this.generatePDF(content, title);
          mimeType = 'application/pdf';
          break;
        case 'docx':
          documentData = await this.generateDOCX(content, title);
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'xlsx':
          documentData = await this.generateXLSX(content, title);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
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

      // Save file to disk
      if (format === 'pdf' || format === 'docx' || format === 'xlsx') {
        // Binary data - write as buffer
        fs.writeFileSync(filePath, documentData);
      } else {
        // Text data - write as string
        fs.writeFileSync(filePath, documentData, 'utf8');
      }

      // Get file stats
      const stats = fs.statSync(filePath);

      console.log(`✅ [DocumentGen] Document saved successfully: ${fullFilename} (${stats.size} bytes)`);

      // Return attachment object for frontend
      return {
        success: true,
        title,
        format,
        filename: fullFilename,
        file_id: fileId,
        file_size: stats.size,
        mime_type: mimeType,
        download_url: `/api/files/download/${fileId}`,
        timestamp: new Date().toISOString(),
        note: `${format.toUpperCase()} document generated successfully and ready for download.`,
        attachment: {
          id: fileId,
          name: fullFilename,
          type: mimeType,
          url: `/api/files/download/${fileId}`,
          size: stats.size
        }
      };

    } catch (error) {
      console.error('❌ [DocumentGen] Document generation failed:', error);
      return {
        success: false,
        error: error.message,
        note: 'Document generation failed. Please try again or contact support.'
      };
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
    return new Promise((resolve, reject) => {
      try {
        console.log('📄 [DocumentGen] Generating real PDF using PDFKit');
        
        // Create a new PDF document
        const doc = new PDFDocument();
        const chunks = [];
        
        // Collect the PDF data
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
        
        // Add title
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text(title, 50, 50);
        
        // Add a line under the title
        doc.moveTo(50, 80)
           .lineTo(550, 80)
           .stroke();
        
        // Add content
        doc.fontSize(12)
           .font('Helvetica')
           .text(content, 50, 100, {
             width: 500,
             align: 'left'
           });
        
        // Add footer
        const now = new Date();
        doc.fontSize(10)
           .text(`Generated on: ${now.toLocaleString()}`, 50, doc.page.height - 50);
        
        // Finalize the PDF
        doc.end();
        
      } catch (error) {
        console.error('❌ [DocumentGen] PDF generation failed:', error);
        reject(error);
      }
    });
  }

  async generateDOCX(content, title) {
    try {
      console.log('📄 [DocumentGen] Generating real DOCX using docx library');
      
      // Create a new document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  bold: true,
                  size: 32, // 16pt
                }),
              ],
              heading: HeadingLevel.TITLE,
            }),
            
            // Empty line
            new Paragraph({
              children: [new TextRun({ text: "" })],
            }),
            
            // Content paragraphs
            ...content.split('\n').map(paragraph => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: paragraph,
                    size: 24, // 12pt
                  }),
                ],
              })
            ),
            
            // Empty line
            new Paragraph({
              children: [new TextRun({ text: "" })],
            }),
            
            // Footer
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on: ${new Date().toLocaleString()}`,
                  size: 20, // 10pt
                  italics: true,
                }),
              ],
            }),
          ],
        }],
      });
      
      // Generate the document buffer
      const buffer = await Packer.toBuffer(doc);
      return buffer;
      
    } catch (error) {
      console.error('❌ [DocumentGen] DOCX generation failed:', error);
      throw error;
    }
  }

  async generateXLSX(content, title) {
    try {
      console.log('📄 [DocumentGen] Generating real XLSX using xlsx library');
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Parse content into rows (assuming CSV-like or line-separated data)
      const lines = content.split('\n').filter(line => line.trim());
      
      // If content looks like tabular data, parse it
      let worksheetData;
      if (lines.some(line => line.includes('\t') || line.includes(','))) {
        // Parse as CSV/TSV
        worksheetData = lines.map(line => {
          // Try tab-separated first, then comma-separated
          const separator = line.includes('\t') ? '\t' : ',';
          return line.split(separator).map(cell => cell.trim());
        });
      } else {
        // Create a simple two-column layout
        worksheetData = [
          ['Item', 'Description'],
          ...lines.map((line, index) => [`Item ${index + 1}`, line])
        ];
      }
      
      // Add title row if provided
      if (title && title !== 'Generated Document') {
        worksheetData.unshift([title]);
        worksheetData.unshift([]); // Empty row for spacing
      }
      
      // Add metadata
      worksheetData.push([]);
      worksheetData.push(['Generated on:', new Date().toLocaleString()]);
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Add some basic styling (column widths)
      const columnWidths = worksheetData[0]?.map(() => ({ wch: 20 })) || [{ wch: 20 }];
      worksheet['!cols'] = columnWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      
      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return buffer;
      
    } catch (error) {
      console.error('❌ [DocumentGen] XLSX generation failed:', error);
      throw error;
    }
  }
}

module.exports = new DocumentGenerationTool();

