import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useOptimizedGovernanceDashboard } from '../hooks/useOptimizedGovernanceDashboard';

// Step-by-step test to find the navigation blocker
const StepByStepGovernancePage: React.FC = () => {
  console.log('🧪 StepByStepGovernancePage rendering');
  
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  
  // Step 2: Add the suspected problematic hook
  const { metrics, loading, error } = step >= 2 ? useOptimizedGovernanceDashboard() : { metrics: null, loading: false, error: null };
  
  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
        Step-by-Step Governance Test (Step {step})
      </Typography>
      
      <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
        Testing navigation with hooks added step by step. Current user: {currentUser?.email || 'None'}
      </Alert>
      
      {step >= 2 && (
        <Alert severity={loading ? "warning" : error ? "error" : "success"} sx={{ mt: 1 }}>
          useOptimizedGovernanceDashboard: {loading ? "Loading..." : error ? `Error: ${error}` : "Loaded"}
          {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
        </Alert>
      )}
      
      <Typography variant="body1" sx={{ mt: 2 }}>
        This page tests each hook individually to find the navigation blocker.
        Try navigating to other pages after each step.
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={() => setStep(step + 1)}
        sx={{ mt: 2 }}
        disabled={step >= 3}
      >
        {step >= 3 ? "All Steps Complete" : "Next Step (Add More Hooks)"}
      </Button>
      
      <Typography variant="body2" sx={{ mt: 2, color: '#a0aec0' }}>
        {step === 1 && "Step 1: Basic component with useAuth only"}
        {step === 2 && "Step 2: Added useOptimizedGovernanceDashboard hook"}
        {step >= 3 && "Step 3: All hooks added - test navigation now!"}
      </Typography>
      
      {step >= 2 && metrics && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#2d3748', borderRadius: 1 }}>
          <Typography variant="h6">Metrics Preview:</Typography>
          <Typography variant="body2">Agents: {metrics.agents?.total || 0}</Typography>
          <Typography variant="body2">Governance Score: {metrics.governance?.score || 0}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default StepByStepGovernancePage;
