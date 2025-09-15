import React from 'react';
import { Box, Typography } from '@mui/material';

// Import existing UI pages
import UserProfilePage from '../../pages/UserProfilePage';
import PreferencesSettingsPage from '../../pages/PreferencesSettingsPage';
import OrganizationSettingsPage from '../../pages/OrganizationSettingsPage';
import IntegrationsSettingsPage from '../../pages/IntegrationsSettingsPage';
import DataManagementSettingsPage from '../../pages/DataManagementSettingsPage';
import ApiKeysSettingsPage from '../../pages/ApiKeysSettingsPage';
import SupportPage from '../../pages/SupportPage';
import GuidedToursPage from '../../pages/GuidedToursPage';
import DocumentationPage from '../../pages/DocumentationPage';
import ApiDocsPage from '../../pages/ApiDocsPage';

interface RightPanelContentProps {
  panelType: string;
  chatMessages?: any[];
  humanParticipants?: any[];
  sharedConversations?: any[];
  selectedChatbot?: any;
  currentBotState?: any;
  // Add other props as needed for existing content
}

const RightPanelContent: React.FC<RightPanelContentProps> = ({
  panelType,
  chatMessages = [],
  humanParticipants = [],
  sharedConversations = [],
  selectedChatbot,
  currentBotState
}) => {
  
  const renderContent = () => {
    switch (panelType) {
      // User Section
      case 'profile':
        return <UserProfilePage />;

      // Settings Section  
      case 'preferences':
        return <PreferencesSettingsPage />;
      
      case 'organization':
        return <OrganizationSettingsPage />;
      
      case 'integrations':
        return <IntegrationsSettingsPage />;
      
      case 'data_management':
        return <DataManagementSettingsPage />;
      
      case 'api_keys':
        return <ApiKeysSettingsPage />;

      // Help Section
      case 'support':
        return <SupportPage />;
      
      case 'guided_tours':
        return <GuidedToursPage />;
      
      case 'documentation':
        return <DocumentationPage />;
      
      case 'api_docs':
        return <ApiDocsPage />;

      // Keep existing custom content for other panels
      case 'team':
        return (
          <Box>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Team Members
            </Typography>
            {humanParticipants.map((participant, index) => (
              <Box key={index} sx={{ 
                p: 2, 
                mb: 1, 
                bgcolor: 'rgba(59, 130, 246, 0.1)', 
                borderRadius: 1,
                border: '1px solid #334155'
              }}>
                <Typography sx={{ color: 'white', fontWeight: 600 }}>
                  {participant.name || participant.email}
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  {participant.role || 'Member'}
                </Typography>
              </Box>
            ))}
            {humanParticipants.length === 0 && (
              <Typography sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                No team members found
              </Typography>
            )}
          </Box>
        );

      case 'chats':
        return (
          <Box>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Chat History
            </Typography>
            
            {/* Host Chats Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ color: '#3b82f6', mb: 1, fontSize: '0.9rem' }}>
                Host Chats
              </Typography>
              {chatMessages.slice(0, 5).map((message, index) => (
                <Box key={index} sx={{ 
                  p: 1.5, 
                  mb: 1, 
                  bgcolor: 'rgba(148, 163, 184, 0.1)', 
                  borderRadius: 1,
                  borderLeft: '3px solid #3b82f6'
                }}>
                  <Typography sx={{ color: 'white', fontSize: '0.8rem' }}>
                    {message.content?.substring(0, 100)}...
                  </Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', mt: 0.5 }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Guest Chats Section */}
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#10b981', mb: 1, fontSize: '0.9rem' }}>
                Guest Chats
              </Typography>
              {sharedConversations.slice(0, 3).map((conversation, index) => (
                <Box key={index} sx={{ 
                  p: 1.5, 
                  mb: 1, 
                  bgcolor: 'rgba(148, 163, 184, 0.1)', 
                  borderRadius: 1,
                  borderLeft: '3px solid #10b981'
                }}>
                  <Typography sx={{ color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>
                    {conversation.name || 'Unnamed Conversation'}
                  </Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                    {conversation.participants?.length || 0} participants
                  </Typography>
                </Box>
              ))}
            </Box>

            {chatMessages.length === 0 && sharedConversations.length === 0 && (
              <Typography sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                No chat history found
              </Typography>
            )}
          </Box>
        );

      case 'analytics':
        return (
          <Box>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Analytics Dashboard
            </Typography>
            
            {/* Quick Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 1 }}>
                <Typography sx={{ color: '#3b82f6', fontSize: '0.8rem' }}>Messages</Typography>
                <Typography sx={{ color: 'white', fontSize: '1.5rem', fontWeight: 600 }}>
                  {chatMessages.length}
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: 1 }}>
                <Typography sx={{ color: '#10b981', fontSize: '0.8rem' }}>Participants</Typography>
                <Typography sx={{ color: 'white', fontSize: '1.5rem', fontWeight: 600 }}>
                  {humanParticipants.length}
                </Typography>
              </Box>
            </Box>

            <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
              Detailed analytics charts and metrics would be rendered here
            </Typography>
          </Box>
        );

      case 'tools':
        return (
          <Box>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Available Tools
            </Typography>
            
            {['Code Interpreter', 'Web Search', 'File Upload', 'Image Generation', 'Data Analysis'].map((tool, index) => (
              <Box key={index} sx={{ 
                p: 2, 
                mb: 1, 
                bgcolor: 'rgba(148, 163, 184, 0.1)', 
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.2)' }
              }}>
                <Typography sx={{ color: 'white', fontWeight: 600 }}>
                  {tool}
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  Click to activate tool
                </Typography>
              </Box>
            ))}
          </Box>
        );

      case 'memory':
        return (
          <Box>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Memory Management
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 1, mb: 2 }}>
              <Typography sx={{ color: '#3b82f6', fontSize: '0.8rem', mb: 1 }}>
                Current Session Memory
              </Typography>
              <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                {chatMessages.length} messages stored
              </Typography>
            </Box>

            <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
              Long-term memory and context management controls would be here
            </Typography>
          </Box>
        );

      case 'integrations':
        return (
          <Box>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Integrations
            </Typography>
            
            {['Slack', 'Discord', 'Microsoft Teams', 'Zapier', 'GitHub'].map((integration, index) => (
              <Box key={index} sx={{ 
                p: 2, 
                mb: 1, 
                bgcolor: 'rgba(148, 163, 184, 0.1)', 
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Box>
                  <Typography sx={{ color: 'white', fontWeight: 600 }}>
                    {integration}
                  </Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    Not connected
                  </Typography>
                </Box>
                <Box sx={{ 
                  px: 2, 
                  py: 0.5, 
                  bgcolor: '#3b82f6', 
                  borderRadius: 1,
                  cursor: 'pointer'
                }}>
                  <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>
                    Connect
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        );

      default:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              {panelType.charAt(0).toUpperCase() + panelType.slice(1).replace('_', ' ')}
            </Typography>
            <Typography sx={{ color: '#94a3b8' }}>
              Content for {panelType} panel will be implemented here.
              This will use the existing content from the current right panel tabs.
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {renderContent()}
    </Box>
  );
};

export default RightPanelContent;

