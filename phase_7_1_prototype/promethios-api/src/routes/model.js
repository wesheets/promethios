const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// Cache for model service to avoid reloading
let modelServiceCache = null;
let modelLoadPromise = null;

class PrometheosModelAPI {
    constructor() {
        this.pythonPath = 'python3';
        this.servicePath = path.join(__dirname, '../services/prometheosModelService.py');
        this.isLoaded = false;
        this.loadingPromise = null;
    }

    async ensureModelLoaded() {
        if (this.isLoaded) {
            return true;
        }

        if (this.loadingPromise) {
            return await this.loadingPromise;
        }

        this.loadingPromise = this.loadModel();
        return await this.loadingPromise;
    }

    async loadModel() {
        return new Promise((resolve, reject) => {
            console.log('🔄 Loading Promethios model...');
            
            const python = spawn(this.pythonPath, [this.servicePath, '--info']);
            
            let output = '';
            let error = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.stderr.on('data', (data) => {
                error += data.toString();
            });

            python.on('close', (code) => {
                if (code === 0) {
                    try {
                        const info = JSON.parse(output.trim());
                        if (info.loaded) {
                            console.log('✅ Promethios model loaded successfully');
                            this.isLoaded = true;
                            resolve(true);
                        } else {
                            console.error('❌ Model failed to load:', info);
                            resolve(false);
                        }
                    } catch (parseError) {
                        console.error('❌ Error parsing model info:', parseError);
                        console.error('Output:', output);
                        console.error('Error:', error);
                        resolve(false);
                    }
                } else {
                    console.error('❌ Model loading failed with code:', code);
                    console.error('Error:', error);
                    resolve(false);
                }
            });
        });
    }

    async generateResponse(prompt, options = {}) {
        const {
            max_length = 512,
            temperature = 0.7,
            top_p = 0.9
        } = options;

        return new Promise((resolve, reject) => {
            const args = [
                this.servicePath,
                '--prompt', prompt,
                '--max-length', max_length.toString(),
                '--temperature', temperature.toString()
            ];

            const python = spawn(this.pythonPath, args);
            
            let output = '';
            let error = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.stderr.on('data', (data) => {
                error += data.toString();
            });

            python.on('close', (code) => {
                if (code === 0) {
                    const response = output.trim();
                    resolve(response || "I'm here to help! How can I assist you today?");
                } else {
                    console.error('❌ Model inference failed:', error);
                    reject(new Error(`Model inference failed: ${error}`));
                }
            });
        });
    }
}

// Initialize model API
const modelAPI = new PrometheosModelAPI();

// POST /api/model/generate - Generate response using Promethios model
router.post('/generate', async (req, res) => {
    try {
        const { prompt, agent_id, max_length, temperature } = req.body;

        if (!prompt) {
            return res.status(400).json({
                error: 'Prompt is required',
                agent_id: agent_id || 'unknown'
            });
        }

        // Ensure model is loaded
        const isLoaded = await modelAPI.ensureModelLoaded();
        if (!isLoaded) {
            return res.status(503).json({
                error: 'Promethios model is not available. Please try again later.',
                agent_id: agent_id || 'unknown',
                fallback: true
            });
        }

        // Generate response
        const response = await modelAPI.generateResponse(prompt, {
            max_length: max_length || 512,
            temperature: temperature || 0.7
        });

        res.status(200).json({
            agent_id: agent_id || 'promethios-ai-assistant',
            prompt: prompt,
            response: response,
            model: 'promethios-codellama-7b',
            timestamp: new Date().toISOString(),
            generated_by: 'promethios_local_model'
        });

    } catch (error) {
        console.error('❌ Model generation error:', error);
        
        // Provide fallback response
        const fallbackResponse = `Hello! I'm Promethios AI Assistant. I'm currently experiencing some technical difficulties, but I'm here to help you with information, analysis, and guidance on a wide range of topics. How can I assist you today?`;
        
        res.status(200).json({
            agent_id: req.body.agent_id || 'promethios-ai-assistant',
            prompt: req.body.prompt,
            response: fallbackResponse,
            model: 'promethios-fallback',
            timestamp: new Date().toISOString(),
            generated_by: 'promethios_fallback',
            error: 'Model temporarily unavailable'
        });
    }
});

// GET /api/model/status - Check model status
router.get('/status', async (req, res) => {
    try {
        const isLoaded = await modelAPI.ensureModelLoaded();
        
        res.status(200).json({
            model_name: 'Promethios AI Assistant',
            base_model: 'codellama/CodeLlama-7b-Instruct-hf',
            status: isLoaded ? 'loaded' : 'not_loaded',
            available: isLoaded,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to check model status',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/model/info - Get detailed model information
router.get('/info', async (req, res) => {
    try {
        const python = spawn(modelAPI.pythonPath, [modelAPI.servicePath, '--info']);
        
        let output = '';
        let error = '';

        python.stdout.on('data', (data) => {
            output += data.toString();
        });

        python.stderr.on('data', (data) => {
            error += data.toString();
        });

        python.on('close', (code) => {
            if (code === 0) {
                try {
                    const info = JSON.parse(output.trim());
                    res.status(200).json(info);
                } catch (parseError) {
                    res.status(500).json({
                        error: 'Failed to parse model info',
                        details: parseError.message
                    });
                }
            } else {
                res.status(500).json({
                    error: 'Failed to get model info',
                    details: error
                });
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get model info',
            details: error.message
        });
    }
});

module.exports = router;

