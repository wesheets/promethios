import React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Chip,
  Avatar,
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import SecurityIcon from '@mui/icons-material/Security';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const ScoreCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
}));

const ActivityItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  textTransform: 'none',
}));

const Dashboard: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to your Promethios governance dashboard!
      </Typography>
      
      <Grid container spacing={3}>
        {/* Governance Score */}
        <Grid item xs={12} md={4}>
          <ScoreCard>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Governance Score
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                78%
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              Needs Improvement
            </Typography>
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={78} 
                sx={{ 
                  height: 8, 
                  borderRadius: 5,
                  backgroundColor: 'rgba(255, 193, 7, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#FFC107',
                  }
                }} 
              />
            </Box>
          </ScoreCard>
        </Grid>
        
        {/* Agents Monitored */}
        <Grid item xs={12} md={4}>
          <ScoreCard>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Agents Monitored
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                9
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              Team
            </Typography>
            <Box sx={{ display: 'flex', mt: 1 }}>
              {[1, 2, 3, 4, 5].map((_, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    backgroundColor: '#3f51b5', 
                    mx: 0.5 
                  }} 
                />
              ))}
              <Typography variant="caption" sx={{ ml: 1 }}>
                +4 more
              </Typography>
            </Box>
          </ScoreCard>
        </Grid>
        
        {/* Compliance Status */}
        <Grid item xs={12} md={4}>
          <ScoreCard>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Compliance Status
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
              <Chip 
                icon={<WarningIcon />} 
                label="Needs Review" 
                color="warning" 
                sx={{ fontSize: '1.25rem', py: 3, px: 2 }} 
              />
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Last checked: 30 minutes ago
            </Typography>
          </ScoreCard>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <StyledPaper>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Recent Activity</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
              <ActivityItem>
                <ListItemIcon>
                  <SecurityIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Security audit completed" 
                  secondary="Just now" 
                />
              </ActivityItem>
              <ActivityItem>
                <ListItemIcon>
                  <SmartToyIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="New agent relationship mapped" 
                  secondary="Just now" 
                />
              </ActivityItem>
              <ActivityItem>
                <ListItemIcon>
                  <SecurityIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Agent compliance check completed" 
                  secondary="Just now" 
                />
              </ActivityItem>
              <ActivityItem>
                <ListItemIcon>
                  <SecurityIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Governance report generated" 
                  secondary="1 minute ago" 
                />
              </ActivityItem>
            </List>
          </StyledPaper>
        </Grid>
        
        {/* Observer Agent */}
        <Grid item xs={12} md={4}>
          <StyledPaper>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SmartToyIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Observer Agent</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" paragraph>
              Welcome to your Promethios dashboard!
            </Typography>
            <Typography variant="body2" paragraph>
              I'm here to help you manage AI governance and provide guidance.
            </Typography>
            
            <Box sx={{ bgcolor: 'primary.light', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'primary.contrastText', mb: 1 }}>
                Governance Tip
              </Typography>
              <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
                Regular compliance checks help maintain high governance scores.
              </Typography>
            </Box>
            
            <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Suggested Action
              </Typography>
              <Typography variant="body2">
                Review your agent policies to ensure they meet current standards.
              </Typography>
            </Box>
            
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                Ask Observer a question...
              </Typography>
              <ArrowForwardIcon fontSize="small" color="action" />
            </Box>
          </StyledPaper>
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12}>
          <StyledPaper>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Quick Actions</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <ActionButton 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  startIcon={<SmartToyIcon />}
                >
                  Wrap New Agent
                </ActionButton>
              </Grid>
              <Grid item xs={12} sm={4}>
                <ActionButton 
                  variant="outlined" 
                  color="primary" 
                  fullWidth
                  startIcon={<SecurityIcon />}
                >
                  View Policies
                </ActionButton>
              </Grid>
              <Grid item xs={12} sm={4}>
                <ActionButton 
                  variant="contained" 
                  color="secondary" 
                  fullWidth
                  startIcon={<SmartToyIcon />}
                >
                  Configure Observer
                </ActionButton>
              </Grid>
            </Grid>
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
