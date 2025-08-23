/**
 * File Download Routes
 * 
 * Handles downloading of generated documents and files
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// File storage directory
const STORAGE_DIR = path.join(process.cwd(), 'temp_files');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Download a generated file
 * GET /api/files/download/:fileId
 */
router.get('/download/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    
    console.log(`📥 [Files] Download request for file: ${fileId}`);
    
    // Find file with this ID (files are stored as {fileId}_{filename})
    const files = fs.readdirSync(STORAGE_DIR);
    const targetFile = files.find(file => file.startsWith(fileId + '_'));
    
    if (!targetFile) {
      console.log(`❌ [Files] File not found: ${fileId}`);
      return res.status(404).json({ 
        error: 'File not found',
        message: 'The requested file does not exist or has expired.'
      });
    }
    
    const filePath = path.join(STORAGE_DIR, targetFile);
    const originalFilename = targetFile.substring(fileId.length + 1); // Remove fileId_ prefix
    
    console.log(`✅ [Files] Serving file: ${originalFilename}`);
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}"`);
    
    // Send the file
    res.download(filePath, originalFilename, (err) => {
      if (err) {
        console.error('❌ [Files] Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' });
        }
      } else {
        console.log(`✅ [Files] Download completed: ${originalFilename}`);
      }
    });
    
  } catch (error) {
    console.error('❌ [Files] Download route error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process download request.'
    });
  }
});

/**
 * Get file info
 * GET /api/files/info/:fileId
 */
router.get('/info/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Find file with this ID
    const files = fs.readdirSync(STORAGE_DIR);
    const targetFile = files.find(file => file.startsWith(fileId + '_'));
    
    if (!targetFile) {
      return res.status(404).json({ 
        error: 'File not found'
      });
    }
    
    const filePath = path.join(STORAGE_DIR, targetFile);
    const stats = fs.statSync(filePath);
    const originalFilename = targetFile.substring(fileId.length + 1);
    
    res.json({
      id: fileId,
      filename: originalFilename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      download_url: `/api/files/download/${fileId}`
    });
    
  } catch (error) {
    console.error('❌ [Files] Info route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Clean up old files (optional maintenance endpoint)
 * DELETE /api/files/cleanup
 */
router.delete('/cleanup', (req, res) => {
  try {
    const files = fs.readdirSync(STORAGE_DIR);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    let deletedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(STORAGE_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.birthtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
    
    console.log(`🧹 [Files] Cleanup completed: ${deletedCount} files deleted`);
    res.json({ 
      message: 'Cleanup completed',
      deleted_files: deletedCount
    });
    
  } catch (error) {
    console.error('❌ [Files] Cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

module.exports = router;

