/**
 * ApprovalGateScreen
 * 
 * Screen shown to users who have signed up for Spark access but are awaiting admin approval.
 * Provides status information and next steps.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Avatar,
  Chip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  HourglassEmpty as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Email as EmailIcon,
  ExitToApp as SignOutIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { betaSignupService } from '../../services/BetaSignupService';
import { UserProfile } from '../../types/profile';

interface ApprovalGateScreenProps {
  user: any; // Firebase User
  onSignOut: () => void;
  onApproved: () => void; // Callback when user gets approved
}

const ApprovalGateScreen: React.FC<ApprovalGateScreenProps> = ({
  user,
  onSignOut,
  onApproved
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | 'loading'>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  // Load user profile and approval status
  useEffect(() => {
    loadUserStatus();
  }, [user]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadUserStatus(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadUserStatus = async (isAutoRefresh = false) => {
    if (!isAutoRefresh) {
      setIsRefreshing(true);
    }

    try {
      const userProfile = await betaSignupService.getUserProfile(user.uid);
      const status = await betaSignupService.checkApprovalStatus(user.uid);
      
      setProfile(userProfile);
      setApprovalStatus(status === 'not_found' ? 'pending' : status);
      setLastChecked(new Date());
      
      // If approved, trigger callback to redirect to main app
      if (status === 'approved') {
        onApproved();
      }
      
    } catch (error) {
      console.error('Error loading user status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadUserStatus();
  };

  const getStatusIcon = () => {
    switch (approvalStatus) {
      case 'pending':
        return <PendingIcon sx={{ fontSize: 48, color: '#f59e0b' }} />;
      case 'approved':
        return <ApprovedIcon sx={{ fontSize: 48, color: '#10b981' }} />;
      case 'rejected':
        return <RejectedIcon sx={{ fontSize: 48, color: '#ef4444' }} />;
      default:
        return <PendingIcon sx={{ fontSize: 48, color: '#6b7280' }} />;
    }
  };

  const getStatusColor = () => {
    switch (approvalStatus) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (approvalStatus) {
      case 'pending': return 'Awaiting Approval';
      case 'approved': return 'Approved - Redirecting...';
      case 'rejected': return 'Access Denied';
      default: return 'Checking Status...';
    }
  };

  const getStatusMessage = () => {
    switch (approvalStatus) {
      case 'pending':
        return 'Your Spark beta access request is being reviewed by our team. We\'ll notify you via email once a decision has been made. This typically takes 1-2 business days.';
      case 'approved':
        return 'Congratulations! Your Spark beta access has been approved. You\'ll be redirected to the platform momentarily.';
      case 'rejected':
        return 'Unfortunately, we\'re unable to approve your Spark beta access request at this time. If you believe this is an error, please contact our support team.';
      default:
        return 'Loading your approval status...';
    }
  };

  if (approvalStatus === 'loading') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#0f172a',
          color: 'white'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <LinearProgress sx={{ mb: 2, width: 300 }} />
          <Typography variant="h6">Loading your status...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0f172a',
        color: 'white',
        p: 2
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          sx={{
            maxWidth: 600,
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 3
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            {/* User Avatar */}
            <Avatar
              src={user.photoURL || profile?.avatar}
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                bgcolor: '#3b82f6'
              }}
            >
              {(user.displayName || profile?.name || user.email)?.charAt(0).toUpperCase()}
            </Avatar>

            {/* User Info */}
            <Typography variant="h5" sx={{ color: 'white', mb: 1 }}>
              {user.displayName || profile?.name || 'Welcome'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
              {user.email}
            </Typography>

            {/* Status Icon */}
            <Box sx={{ mb: 3 }}>
              {getStatusIcon()}
            </Box>

            {/* Status Chip */}
            <Chip
              label={getStatusText()}
              sx={{
                bgcolor: getStatusColor(),
                color: 'white',
                fontWeight: 'bold',
                mb: 3,
                px: 2
              }}
            />

            {/* Status Message */}
            <Typography
              variant="body1"
              sx={{
                color: '#e2e8f0',
                mb: 4,
                lineHeight: 1.6
              }}
            >
              {getStatusMessage()}
            </Typography>

            {/* Profile Info */}
            {profile && (
              <>
                <Divider sx={{ my: 3, borderColor: '#334155' }} />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Your Application Details
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      <strong>Role:</strong> {profile.role}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      <strong>Organization:</strong> {profile.organization}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      <strong>Primary AI Concern:</strong> {profile.aiConcern}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      <strong>Applied:</strong> {profile.signupAt ? new Date(profile.signupAt).toLocaleDateString() : 'Recently'}
                    </Typography>
                  </Box>
                </Box>
              </>
            )}

            {/* Actions */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                  '&:hover': {
                    borderColor: '#2563eb',
                    bgcolor: 'rgba(59, 130, 246, 0.1)'
                  }
                }}
              >
                {isRefreshing ? 'Checking...' : 'Refresh Status'}
              </Button>

              <Button
                variant="outlined"
                startIcon={<SignOutIcon />}
                onClick={onSignOut}
                sx={{
                  borderColor: '#6b7280',
                  color: '#6b7280',
                  '&:hover': {
                    borderColor: '#9ca3af',
                    bgcolor: 'rgba(107, 114, 128, 0.1)'
                  }
                }}
              >
                Sign Out
              </Button>
            </Box>

            {/* Last Checked */}
            <Typography
              variant="caption"
              sx={{
                color: '#6b7280',
                mt: 3,
                display: 'block'
              }}
            >
              Last checked: {lastChecked.toLocaleTimeString()}
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default ApprovalGateScreen;

