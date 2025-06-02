/**
 * VERITAS API Endpoints
 * 
 * This module provides API endpoints for managing VERITAS configuration and toggle state.
 * It integrates with the VERITAS Manager to provide runtime control of verification.
 */

import express from 'express';
import { veritasManager } from './veritasManager';
import { validateConfig, mergeWithDefaults, saveConfig } from './veritasConfig';

/**
 * Create an Express router with VERITAS API endpoints
 * @returns Express router with VERITAS endpoints
 */
export function createVeritasApiRouter(): express.Router {
  const router = express.Router();
  
  // GET current VERITAS status
  router.get('/veritas/status', (req, res) => {
    res.json({
      enabled: veritasManager.isEnabled(),
      config: veritasManager.getConfig()
    });
  });
  
  // POST to enable VERITAS
  router.post('/veritas/enable', (req, res) => {
    veritasManager.enableVeritas();
    saveConfig({
      ...veritasManager.getConfig(),
      enabled: true
    });
    
    res.json({ 
      success: true, 
      message: 'VERITAS enabled',
      status: {
        enabled: veritasManager.isEnabled(),
        config: veritasManager.getConfig()
      }
    });
  });
  
  // POST to disable VERITAS
  router.post('/veritas/disable', (req, res) => {
    veritasManager.disableVeritas();
    saveConfig({
      ...veritasManager.getConfig(),
      enabled: false
    });
    
    res.json({ 
      success: true, 
      message: 'VERITAS disabled',
      status: {
        enabled: veritasManager.isEnabled(),
        config: veritasManager.getConfig()
      }
    });
  });
  
  // POST to update VERITAS configuration
  router.post('/veritas/config', (req, res) => {
    const newConfig = req.body;
    
    // Validate the configuration
    const validation = validateConfig(newConfig);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration',
        errors: validation.errors
      });
    }
    
    // Merge with defaults and update
    const mergedConfig = mergeWithDefaults(newConfig);
    veritasManager.updateConfig(mergedConfig);
    saveConfig(mergedConfig);
    
    res.json({
      success: true,
      message: 'VERITAS configuration updated',
      config: veritasManager.getConfig()
    });
  });
  
  // GET VERITAS metrics
  router.get('/veritas/metrics', (req, res) => {
    res.json({
      metrics: veritasManager.getMetrics()
    });
  });
  
  // POST to reset VERITAS metrics
  router.post('/veritas/metrics/reset', (req, res) => {
    veritasManager.resetMetrics();
    
    res.json({
      success: true,
      message: 'VERITAS metrics reset',
      metrics: veritasManager.getMetrics()
    });
  });
  
  return router;
}

/**
 * Register VERITAS API endpoints with an Express app
 * @param app Express application
 */
export function registerVeritasApi(app: express.Application): void {
  const veritasRouter = createVeritasApiRouter();
  app.use('/api', veritasRouter);
}
