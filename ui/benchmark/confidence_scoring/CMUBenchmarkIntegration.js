/**
 * CMU Benchmark Integration for Confidence Scoring Module
 * 
 * This component integrates the Confidence Scoring module with the CMU benchmark
 * dashboard, allowing real-time visualization and demonstration of confidence
 * scores and evidence maps during benchmark tests.
 * 
 * @module ui/benchmark/confidence_scoring/CMUBenchmarkIntegration
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import ConfidenceVisualization from './ConfidenceVisualization';

/**
 * CMU Benchmark Integration component for Confidence Scoring
 */
const CMUBenchmarkIntegration = ({ benchmarkState, onToggleFeature }) => {
  const [confidenceData, setConfidenceData] = useState(null);
  const [enabled, setEnabled] = useState(true);
  const [decisionId, setDecisionId] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Effect to fetch confidence data when benchmark state changes
  useEffect(() => {
    if (!enabled || !benchmarkState || !benchmarkState.currentDecision) return;
    
    const fetchConfidenceData = async () => {
      try {
        // In a real implementation, this would call the API
        // For now, we'll simulate the data
        const decision = benchmarkState.currentDecision;
        setDecisionId(decision.id);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simulate confidence data
        const simulatedData = generateSimulatedConfidenceData(decision);
        setConfidenceData(simulatedData);
        
        // Show notification if confidence is low
        if (simulatedData.confidenceScore.value < 0.6) {
          setNotification({
            open: true,
            message: 'Low confidence detected in current decision',
            severity: 'warning'
          });
        }
      } catch (error) {
        console.error('Error fetching confidence data:', error);
        setNotification({
          open: true,
          message: 'Failed to fetch confidence data',
          severity: 'error'
        });
      }
    };
    
    fetchConfidenceData();
  }, [benchmarkState, enabled]);
  
  // Handle toggle for enabling/disabling confidence scoring
  const handleToggleEnabled = (event) => {
    const newEnabled = event.target.checked;
    setEnabled(newEnabled);
    
    if (onToggleFeature) {
      onToggleFeature('confidenceScoring', newEnabled);
    }
    
    // Show notification
    setNotification({
      open: true,
      message: newEnabled ? 'Confidence Scoring enabled' : 'Confidence Scoring disabled',
      severity: 'info'
    });
    
    // Clear data if disabled
    if (!newEnabled) {
      setConfidenceData(null);
    }
  };
  
  // Handle refresh button click
  const handleRefresh = async () => {
    if (!enabled || !benchmarkState || !benchmarkState.currentDecision) return;
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate updated confidence data
      const simulatedData = generateSimulatedConfidenceData(benchmarkState.currentDecision, true);
      setConfidenceData(simulatedData);
      
      setNotification({
        open: true,
        message: 'Confidence data refreshed',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error refreshing confidence data:', error);
      setNotification({
        open: true,
        message: 'Failed to refresh confidence data',
        severity: 'error'
      });
    }
  };
  
  // Handle notification close
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Generate simulated confidence data for demonstration
  const generateSimulatedConfidenceData = (decision, isRefresh = false) => {
    // Base confidence value - either random or slightly improved if refreshing
    const baseConfidence = isRefresh 
      ? Math.min(0.95, (confidenceData?.confidenceScore?.value || 0.5) + 0.1)
      : 0.3 + Math.random() * 0.6;
    
    // Determine threshold status
    let thresholdStatus;
    if (baseConfidence >= 0.8) {
      thresholdStatus = 'above';
    } else if (baseConfidence >= 0.6) {
      thresholdStatus = 'within';
    } else {
      thresholdStatus = 'below';
    }
    
    // Create confidence score
    const confidenceScore = {
      value: baseConfidence,
      algorithm: 'weighted',
      timestamp: Date.now(),
      evidenceCount: Math.floor(3 + Math.random() * 5),
      thresholdStatus
    };
    
    // Create evidence items
    const evidenceTypes = ['source', 'reasoning', 'belief', 'constraint'];
    const rootEvidence = Array.from({ length: confidenceScore.evidenceCount }, (_, i) => ({
      id: `evidence-${decision.id}-${i}`,
      type: evidenceTypes[Math.floor(Math.random() * evidenceTypes.length)],
      content: { 
        text: `Evidence ${i + 1} for decision ${decision.id}${isRefresh ? ' (updated)' : ''}`
      },
      weight: 0.5 + Math.random() * 0.5,
      quality: 0.3 + Math.random() * 0.7,
      timestamp: Date.now() - Math.floor(Math.random() * 3600000),
      metadata: {
        decisionId: decision.id
      }
    }));
    
    // Add trace ID to some evidence
    rootEvidence.forEach((evidence, index) => {
      if (index % 3 === 0) {
        evidence.traceId = `trace-${decision.id}-${index}`;
      }
    });
    
    // Create relationships between evidence items
    const relationships = [];
    if (rootEvidence.length > 2) {
      // Add some parent-child relationships
      for (let i = 1; i < rootEvidence.length; i += 2) {
        relationships.push({
          parentId: rootEvidence[0].id,
          childId: rootEvidence[i].id,
          relationshipType: 'supports'
        });
      }
    }
    
    // Create evidence map
    const evidenceMap = {
      id: `map-${decision.id}`,
      decisionId: decision.id,
      rootEvidence,
      relationships,
      confidenceScore,
      timestamp: Date.now(),
      metadata: {
        benchmarkId: benchmarkState.id,
        refreshCount: isRefresh ? (confidenceData?.evidenceMap?.metadata?.refreshCount || 0) + 1 : 0
      }
    };
    
    return {
      confidenceScore,
      evidenceMap
    };
  };
  
  return (
    <Box sx={{ mb: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="div">
              Confidence Scoring Integration
            </Typography>
            <FormControlLabel
              control={<Switch checked={enabled} onChange={handleToggleEnabled} />}
              label="Enable Confidence Scoring"
            />
          </Box>
          
          {enabled ? (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Confidence Scoring is actively monitoring benchmark decisions. 
                This module provides transparency into agent decision-making by calculating 
                confidence levels and creating evidence maps.
              </Alert>
              
              {decisionId && confidenceData ? (
                <ConfidenceVisualization 
                  decisionId={decisionId}
                  confidenceData={confidenceData}
                  onRefresh={handleRefresh}
                />
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Waiting for benchmark decisions...
                  </Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Integration Status: Active
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleRefresh}
                  disabled={!decisionId}
                >
                  Refresh Data
                </Button>
              </Box>
            </>
          ) : (
            <Alert severity="warning">
              Confidence Scoring is disabled. Enable it to see real-time confidence 
              analysis during benchmark tests.
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CMUBenchmarkIntegration;
