/**
 * Connection Test Button
 * 
 * Test button for connection requests and chat invitations
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  PersonAdd,
  Message,
  Science
} from '@mui/icons-material';
import UserConnectionHandler from '../social/UserConnectionHandler';

const ConnectionTestButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Test user ID (using the same one from our notification tests)
  const TEST_RECIPIENT_ID = 'XyKZE2QUPKgIEwK8ddqAJrBs67B3'; // ted@majestickgoods.com

  return (
    <UserConnectionHandler>
      {({ sendConnectionRequest, sendChatInvitation }) => {
        const testConnectionRequest = async () => {
          setLoading(true);
          setResult(null);
          
          try {
            const success = await sendConnectionRequest(
              TEST_RECIPIENT_ID,
              'This is a test connection request to verify the connection system is working.'
            );
            
            if (success) {
              setResult({
                type: 'success',
                message: 'Connection request sent successfully! Check the recipient\'s notifications.'
              });
            } else {
              setResult({
                type: 'error',
                message: 'Failed to send connection request.'
              });
            }
          } catch (error) {
            setResult({
              type: 'error',
              message: `Error: ${error}`
            });
          } finally {
            setLoading(false);
          }
        };

        const testChatInvitation = async () => {
          setLoading(true);
          setResult(null);
          
          try {
            const success = await sendChatInvitation(
              TEST_RECIPIENT_ID,
              'This is a test chat invitation to verify the chat system is working.'
            );
            
            if (success) {
              setResult({
                type: 'success',
                message: 'Chat invitation sent successfully! Check the recipient\'s notifications.'
              });
            } else {
              setResult({
                type: 'error',
                message: 'Failed to send chat invitation.'
              });
            }
          } catch (error) {
            setResult({
              type: 'error',
              message: `Error: ${error}`
            });
          } finally {
            setLoading(false);
          }
        };

        return (
          <Card sx={{ maxWidth: 500, m: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Science sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Connection & Chat Test
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Test connection requests and chat invitations with real user accounts.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} /> : <PersonAdd />}
                  onClick={testConnectionRequest}
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  Test Connection Request
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={loading ? <CircularProgress size={16} /> : <Message />}
                  onClick={testChatInvitation}
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  Test Chat Invitation
                </Button>
              </Box>

              {result && (
                <Alert severity={result.type} sx={{ mt: 2 }}>
                  {result.message}
                </Alert>
              )}
            </CardContent>
          </Card>
        );
      }}
    </UserConnectionHandler>
  );
};

export default ConnectionTestButton;

