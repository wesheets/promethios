/**
 * File Upload Service for handling various file types
 */

export interface FileUploadResult {
  success: boolean;
  fileName: string;
  fileType: string;
  fileSize: number;
  content?: string;
  error?: string;
}

export class FileUploadService {
  private maxFileSize = 10 * 1024 * 1024; // 10MB
  private allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  async uploadFile(file: File): Promise<FileUploadResult> {
    try {
      // Validate file size
      if (file.size > this.maxFileSize) {
        return {
          success: false,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          error: 'File size exceeds 10MB limit'
        };
      }

      // Validate file type
      if (!this.allowedTypes.includes(file.type)) {
        return {
          success: false,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          error: 'File type not supported'
        };
      }

      // Process file based on type
      let content = '';
      
      if (file.type.startsWith('text/')) {
        content = await this.readTextFile(file);
      } else if (file.type.startsWith('image/')) {
        content = `[Image file: ${file.name}]`;
      } else {
        content = `[Document file: ${file.name}]`;
      }

      return {
        success: true,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        content
      };

    } catch (error) {
      return {
        success: false,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const text = event.target?.result as string;
        // Simple text processing - avoid complex line operations for now
        resolve(text || '');
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  isFileTypeSupported(fileType: string): boolean {
    return this.allowedTypes.includes(fileType);
  }

  getMaxFileSize(): number {
    return this.maxFileSize;
  }

  getSupportedTypes(): string[] {
    return [...this.allowedTypes];
  }
}

export const fileUploadService = new FileUploadService();

