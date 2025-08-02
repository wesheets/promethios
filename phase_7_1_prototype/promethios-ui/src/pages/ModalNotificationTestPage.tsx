import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useOptimizedGovernanceDashboard } from '../hooks/useOptimizedGovernanceDashboard';
import { useNotifications } from '../hooks/useNotifications';
import { GovernanceNotificationExtension } from '../extensions/GovernanceNotificationExtension';
import AgentDetailModal from '../components/AgentDetailModal';

// Test if modal and notification components are causing navigation issues
const ModalNotificationTestPage: React.FC = () => {
  console.log('🧪 ModalNotificationTestPage rendering');
  
  const { currentUser } = useAuth();
  const { metrics, loading, error, refreshMetrics } = useOptimizedGovernanceDashboard();
  
  // Notification system (like SimplifiedGovernanceOverviewPage)
  const { notifications, unreadCount } = useNotifications({ type: 'governance' });
  const [notificationExtension] = useState(() => new GovernanceNotificationExtension());
  
  // Modal state (like SimplifiedGovernanceOverviewPage)
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Initialize notifications (like SimplifiedGovernanceOverviewPage)
  useEffect(() => {
    const initializeNotifications = async () => {
      const initialized = await notificationExtension.initialize();
      if (initialized) {
        console.log('Governance notifications initialized');
      }
    };
    
    initializeNotifications();
  }, []);
  
  const openModal = () => {
    setSelectedAgent({
      id: 'test-agent',
      name: 'Test Agent',
      type: 'single',
      status: 'healthy'
    });
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setSelectedAgent(null);
    setModalOpen(false);
  };
  
  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
        Modal & Notification Test Page
      </Typography>
      
      <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
        Testing if modal and notification components break navigation. Current user: {currentUser?.email || 'None'}
      </Alert>
      
      <Alert severity="warning" sx={{ mt: 1 }}>
        Notifications: {unreadCount} unread | Extension initialized: {notificationExtension ? 'Yes' : 'No'}
      </Alert>
      
      <Typography variant="body1" sx={{ mt: 2 }}>
        This page tests if AgentDetailModal and GovernanceNotificationExtension are causing navigation issues.
        Try opening the modal and then navigating to other pages.
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={openModal}
        sx={{ mt: 2, mr: 2 }}
      >
        Open Agent Modal
      </Button>
      
      <Typography variant="body2" sx={{ mt: 2, color: '#a0aec0' }}>
        If navigation breaks after opening the modal, we found the culprit!
      </Typography>
      
      {metrics && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#2d3748', borderRadius: 1 }}>
          <Typography variant="h6">Metrics Preview:</Typography>
          <Typography variant="body2">Agents: {metrics.agents?.total || 0}</Typography>
          <Typography variant="body2">Governance Score: {metrics.governance?.score || 0}</Typography>
        </Box>
      )}
      
      {/* Agent Detail Modal */}
      <AgentDetailModal
        open={modalOpen}
        onClose={closeModal}
        agent={selectedAgent}
      />
    </Box>
  );
};

export default ModalNotificationTestPage;
