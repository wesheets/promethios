const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../models/promethios/checkpoint-1000');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB limit for large model files
  }
});

/**
 * POST /api/upload/model
 * Upload model files to the server
 */
router.post('/model', upload.array('files'), async (req, res) => {
  try {
    console.log('📁 Model upload request received');
    console.log('📁 Files uploaded:', req.files?.length || 0);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }
    
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      size: file.size,
      path: file.path
    }));
    
    console.log('📁 Uploaded files:', uploadedFiles);
    
    res.json({
      success: true,
      message: 'Model files uploaded successfully',
      files: uploadedFiles
    });
    
  } catch (error) {
    console.error('❌ Error uploading model files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload model files',
      details: error.message
    });
  }
});

/**
 * GET /api/upload/status
 * Check if model files exist on the server
 */
router.get('/status', async (req, res) => {
  try {
    const modelPath = path.join(__dirname, '../../models/promethios/checkpoint-1000');
    const configPath = path.join(modelPath, 'adapter_config.json');
    const modelFilePath = path.join(modelPath, 'adapter_model.safetensors');
    
    const status = {
      modelDirectory: fs.existsSync(modelPath),
      configFile: fs.existsSync(configPath),
      modelFile: fs.existsSync(modelFilePath),
      configSize: fs.existsSync(configPath) ? fs.statSync(configPath).size : 0,
      modelSize: fs.existsSync(modelFilePath) ? fs.statSync(modelFilePath).size : 0
    };
    
    res.json({
      success: true,
      status: status,
      ready: status.configFile && status.modelFile
    });
    
  } catch (error) {
    console.error('❌ Error checking model status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check model status',
      details: error.message
    });
  }
});

module.exports = router;

