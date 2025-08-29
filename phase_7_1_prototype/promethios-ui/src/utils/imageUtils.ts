/**
 * Image utility functions for compression and Firebase Storage upload
 */

export class ImageUtils {
  
  /**
   * Compress an image file to reduce size
   */
  static async compressImage(file: File, maxSizeKB: number = 500, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions to keep aspect ratio
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              
              console.log(`📸 Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload image to Firebase Storage and return download URL
   */
  static async uploadToFirebaseStorage(file: File, userId: string, type: 'avatar' | 'header'): Promise<string> {
    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../firebase/config');
      
      // Compress image first
      const compressedFile = await this.compressImage(file);
      
      // Create storage reference
      const fileName = `${type}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `users/${userId}/${fileName}`);
      
      // Upload file
      console.log(`📤 Uploading ${type} image to Firebase Storage...`);
      const snapshot = await uploadBytes(storageRef, compressedFile);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log(`✅ ${type} image uploaded successfully:`, downloadURL);
      
      return downloadURL;
      
    } catch (error) {
      console.error(`❌ Failed to upload ${type} image to Firebase Storage:`, error);
      throw error;
    }
  }

  /**
   * Create a compressed data URL for immediate preview (under 100KB)
   */
  static async createPreviewDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Small preview size
        const maxSize = 200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress heavily for preview
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.6);
        console.log(`🖼️ Preview data URL created: ${(dataURL.length / 1024).toFixed(1)}KB`);
        resolve(dataURL);
      };
      
      img.onerror = () => reject(new Error('Failed to create preview'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Validate image file size and type
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Please select an image file' };
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'Image must be smaller than 10MB' };
    }
    
    return { valid: true };
  }
}

