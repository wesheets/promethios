import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../../firebase/config';
import { MessageAttachment, AttachmentType } from '../types';

export class FileUploadService {
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly ALLOWED_TYPES = {
    'application/pdf': AttachmentType.PDF,
    'application/msword': AttachmentType.DOCUMENT,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': AttachmentType.DOCUMENT,
    'text/plain': AttachmentType.TEXT,
    'text/csv': AttachmentType.SPREADSHEET,
    'application/vnd.ms-excel': AttachmentType.SPREADSHEET,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': AttachmentType.SPREADSHEET,
    'image/jpeg': AttachmentType.IMAGE,
    'image/jpg': AttachmentType.IMAGE,
    'image/png': AttachmentType.IMAGE,
    'image/gif': AttachmentType.IMAGE,
    'image/webp': AttachmentType.IMAGE,
    'image/svg+xml': AttachmentType.IMAGE
  };

  /**
   * Upload a file to Firebase Storage
   */
  static async uploadFile(
    file: File,
    userId: string,
    sessionId: string
  ): Promise<MessageAttachment> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedName}`;
      const filePath = `chat-attachments/${userId}/${sessionId}/${fileName}`;

      // Upload to Firebase Storage
      const storageRef = ref(storage, filePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Create attachment object
      const attachment: MessageAttachment = {
        id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: this.getAttachmentType(file.type),
        size: file.size,
        url: downloadURL,
        mimeType: file.type,
        uploadedAt: new Date()
      };

      return attachment;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadFiles(
    files: File[],
    userId: string,
    sessionId: string,
    onProgress?: (progress: number, fileName: string) => void
  ): Promise<MessageAttachment[]> {
    const attachments: MessageAttachment[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (onProgress) {
        onProgress((i / totalFiles) * 100, file.name);
      }

      try {
        const attachment = await this.uploadFile(file, userId, sessionId);
        attachments.push(attachment);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Continue with other files, but you might want to collect errors
      }
    }

    if (onProgress) {
      onProgress(100, 'Complete');
    }

    return attachments;
  }

  /**
   * Upload image from clipboard (paste functionality)
   */
  static async uploadImageFromClipboard(
    clipboardData: DataTransfer,
    userId: string,
    sessionId: string
  ): Promise<MessageAttachment | null> {
    try {
      const items = Array.from(clipboardData.items);
      const imageItem = items.find(item => item.type.startsWith('image/'));

      if (!imageItem) {
        return null;
      }

      const file = imageItem.getAsFile();
      if (!file) {
        return null;
      }

      // Create a new file with a proper name
      const timestamp = Date.now();
      const extension = file.type.split('/')[1] || 'png';
      const namedFile = new File([file], `pasted_image_${timestamp}.${extension}`, {
        type: file.type
      });

      return await this.uploadFile(namedFile, userId, sessionId);
    } catch (error) {
      console.error('Error uploading image from clipboard:', error);
      throw error;
    }
  }

  /**
   * Delete an uploaded file
   */
  static async deleteFile(attachment: MessageAttachment): Promise<void> {
    try {
      // Extract file path from URL
      const url = new URL(attachment.url);
      const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
      
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): void {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!this.ALLOWED_TYPES[file.type]) {
      throw new Error(`File type ${file.type} is not supported`);
    }

    // Check for empty files
    if (file.size === 0) {
      throw new Error('Cannot upload empty files');
    }
  }

  /**
   * Get attachment type from MIME type
   */
  private static getAttachmentType(mimeType: string): AttachmentType {
    return this.ALLOWED_TYPES[mimeType] || AttachmentType.OTHER;
  }

  /**
   * Check if file type is supported
   */
  static isFileTypeSupported(mimeType: string): boolean {
    return mimeType in this.ALLOWED_TYPES;
  }

  /**
   * Get supported file extensions
   */
  static getSupportedExtensions(): string[] {
    return [
      '.pdf',
      '.doc', '.docx',
      '.txt',
      '.csv', '.xls', '.xlsx',
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'
    ];
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file icon based on attachment type
   */
  static getFileIcon(attachment: MessageAttachment): string {
    switch (attachment.type) {
      case AttachmentType.PDF:
        return 'picture_as_pdf';
      case AttachmentType.DOCUMENT:
        return 'description';
      case AttachmentType.SPREADSHEET:
        return 'table_chart';
      case AttachmentType.IMAGE:
        return 'image';
      case AttachmentType.TEXT:
        return 'text_snippet';
      case AttachmentType.URL:
        return 'link';
      default:
        return 'attach_file';
    }
  }

  /**
   * Extract text content from URL for preview
   */
  static async extractUrlPreview(url: string): Promise<{
    title?: string;
    description?: string;
    image?: string;
    domain: string;
  }> {
    try {
      // This is a simplified implementation
      // In production, you'd want to use a service like Unfurl or implement server-side scraping
      const urlObj = new URL(url);
      
      return {
        domain: urlObj.hostname,
        title: urlObj.pathname,
        description: `Link to ${urlObj.hostname}`
      };
    } catch (error) {
      console.error('Error extracting URL preview:', error);
      return {
        domain: 'Unknown',
        title: url,
        description: 'Invalid URL'
      };
    }
  }

  /**
   * Create URL attachment
   */
  static createUrlAttachment(url: string): MessageAttachment {
    const urlObj = new URL(url);
    
    return {
      id: `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: urlObj.hostname,
      type: AttachmentType.URL,
      size: 0,
      url: url,
      mimeType: 'text/html',
      uploadedAt: new Date()
    };
  }

  /**
   * Detect URLs in text content
   */
  static detectUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches || [];
  }

  /**
   * Check if attachment is an image that can be displayed inline
   */
  static isDisplayableImage(attachment: MessageAttachment): boolean {
    return attachment.type === AttachmentType.IMAGE && 
           ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(attachment.mimeType);
  }

  /**
   * Get file preview URL for supported types
   */
  static getPreviewUrl(attachment: MessageAttachment): string | null {
    if (this.isDisplayableImage(attachment)) {
      return attachment.url;
    }
    
    // For other file types, you might want to generate thumbnails or use preview services
    return null;
  }
}

