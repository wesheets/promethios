/**
 * TalentHubPanel - Hire talent for agent and workflow development
 * 
 * This panel allows users to:
 * - Post jobs for agent development
 * - Browse available developers
 * - Manage hiring projects
 * - Connect with freelancers in the Promethios ecosystem
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Avatar,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Rating,
  TextField,
  InputAdornment,
  Tab,
  Tabs
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Star as StarIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon
} from '@mui/icons-material';

interface TalentHubPanelProps {
  open: boolean;
  onClose: () => void;
  width: string;
}

interface Developer {
  id: string;
  name: string;
  avatar?: string;
  title: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  skills: string[];
  completedJobs: number;
  responseTime: string;
  availability: 'available' | 'busy' | 'unavailable';
}

interface Job {
  id: string;
  title: string;
  description: string;
  budget: {
    type: 'hourly' | 'fixed';
    amount: number;
  };
  skills: string[];
  postedDate: string;
  proposals: number;
  status: 'open' | 'in_progress' | 'completed';
}

const TalentHubPanel: React.FC<TalentHubPanelProps> = ({ open, onClose, width }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample developers data
  const [developers] = useState<Developer[]>([
    {
      id: 'dev-1',
      name: 'Sarah Chen',
      avatar: 'SC',
      title: 'AI Agent Developer & ML Engineer',
      rating: 4.9,
      reviewCount: 127,
      hourlyRate: 85,
      skills: ['Python', 'TensorFlow', 'Agent Development', 'NLP', 'API Integration'],
      completedJobs: 89,
      responseTime: '< 1 hour',
      availability: 'available'
    },
    {
      id: 'dev-2',
      name: 'Marcus Rodriguez',
      avatar: 'MR',
      title: 'Workflow Automation Specialist',
      rating: 4.8,
      reviewCount: 93,
      hourlyRate: 75,
      skills: ['Workflow Design', 'Process Automation', 'JavaScript', 'Node.js', 'Zapier'],
      completedJobs: 156,
      responseTime: '< 2 hours',
      availability: 'available'
    },
    {
      id: 'dev-3',
      name: 'Elena Kowalski',
      avatar: 'EK',
      title: 'Conversational AI Designer',
      rating: 5.0,
      reviewCount: 45,
      hourlyRate: 95,
      skills: ['Conversational Design', 'UX/UI', 'Chatbot Development', 'Voice AI', 'Prompt Engineering'],
      completedJobs: 67,
      responseTime: '< 30 min',
      availability: 'busy'
    }
  ]);

  // Sample jobs data
  const [jobs] = useState<Job[]>([
    {
      id: 'job-1',
      title: 'Build Customer Service AI Agent',
      description: 'Need an experienced developer to create a customer service agent that can handle common inquiries and escalate complex issues.',
      budget: { type: 'fixed', amount: 2500 },
      skills: ['AI Development', 'Customer Service', 'NLP', 'Integration'],
      postedDate: '2 days ago',
      proposals: 12,
      status: 'open'
    },
    {
      id: 'job-2',
      title: 'Workflow Automation for Sales Process',
      description: 'Looking for someone to automate our sales workflow using AI agents and integrate with our CRM system.',
      budget: { type: 'hourly', amount: 65 },
      skills: ['Workflow Automation', 'CRM Integration', 'Sales Process', 'API Development'],
      postedDate: '5 days ago',
      proposals: 8,
      status: 'open'
    }
  ]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return '#10b981';
      case 'busy': return '#f59e0b';
      case 'unavailable': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'available': return 'Available';
      case 'busy': return 'Busy';
      case 'unavailable': return 'Unavailable';
      default: return 'Unknown';
    }
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        width,
        height: '100vh',
        bgcolor: '#0f172a',
        borderLeft: '1px solid #334155',
        zIndex: 1250,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon sx={{ color: '#f59e0b', fontSize: '2rem' }} />
          <Box>
            <Typography variant="h5" sx={{ color: '#f8fafc', fontWeight: 700 }}>
              Talent Hub
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Hire talent for your AI projects
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #334155' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: '#94a3b8',
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#f59e0b'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#f59e0b'
            }
          }}
        >
          <Tab label="Find Talent" />
          <Tab label="My Jobs" />
          <Tab label="Post Job" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Find Talent Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Search */}
            <TextField
              fullWidth
              placeholder="Search developers by skills, name, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#1e293b',
                  '& fieldset': { borderColor: '#334155' },
                  '&:hover fieldset': { borderColor: '#475569' },
                  '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
                  '& input': { color: '#f8fafc' }
                }
              }}
            />

            {/* Developers List */}
            <List sx={{ p: 0 }}>
              {developers.map((developer) => (
                <Paper
                  key={developer.id}
                  sx={{
                    mb: 2,
                    p: 3,
                    bgcolor: '#1e293b',
                    border: '1px solid #334155'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: '#f59e0b',
                        fontSize: '1.5rem',
                        fontWeight: 700
                      }}
                    >
                      {developer.avatar}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                          {developer.name}
                        </Typography>
                        <Chip
                          label={getAvailabilityText(developer.availability)}
                          size="small"
                          sx={{
                            bgcolor: getAvailabilityColor(developer.availability),
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>
                      
                      <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2 }}>
                        {developer.title}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={developer.rating} readOnly size="small" />
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            {developer.rating} ({developer.reviewCount} reviews)
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                          ${developer.hourlyRate}/hr
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {developer.skills.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            size="small"
                            sx={{
                              bgcolor: '#334155',
                              color: '#cbd5e1',
                              fontSize: '0.75rem'
                            }}
                          />
                        ))}
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          {developer.completedJobs} jobs completed
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          Responds in {developer.responseTime}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="contained"
                          sx={{
                            bgcolor: '#f59e0b',
                            '&:hover': { bgcolor: '#d97706' }
                          }}
                        >
                          Hire Now
                        </Button>
                        <Button
                          variant="outlined"
                          sx={{
                            borderColor: '#334155',
                            color: '#cbd5e1',
                            '&:hover': { borderColor: '#475569', bgcolor: '#1e293b' }
                          }}
                        >
                          View Profile
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </List>
          </Box>
        )}

        {/* My Jobs Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#f8fafc' }}>
                Your Posted Jobs
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  bgcolor: '#f59e0b',
                  '&:hover': { bgcolor: '#d97706' }
                }}
              >
                Post New Job
              </Button>
            </Box>

            <List sx={{ p: 0 }}>
              {jobs.map((job) => (
                <Paper
                  key={job.id}
                  sx={{
                    mb: 2,
                    p: 3,
                    bgcolor: '#1e293b',
                    border: '1px solid #334155'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                      {job.title}
                    </Typography>
                    <Chip
                      label={job.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      sx={{
                        bgcolor: job.status === 'open' ? '#10b981' : '#6b7280',
                        color: 'white'
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2 }}>
                    {job.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                      {job.budget.type === 'fixed' ? `$${job.budget.amount} fixed` : `$${job.budget.amount}/hr`}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      {job.proposals} proposals
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Posted {job.postedDate}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {job.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        sx={{
                          bgcolor: '#334155',
                          color: '#cbd5e1',
                          fontSize: '0.75rem'
                        }}
                      />
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      sx={{
                        borderColor: '#334155',
                        color: '#cbd5e1',
                        '&:hover': { borderColor: '#475569', bgcolor: '#1e293b' }
                      }}
                    >
                      View Proposals
                    </Button>
                    <Button
                      variant="outlined"
                      sx={{
                        borderColor: '#334155',
                        color: '#cbd5e1',
                        '&:hover': { borderColor: '#475569', bgcolor: '#1e293b' }
                      }}
                    >
                      Edit Job
                    </Button>
                  </Box>
                </Paper>
              ))}
            </List>
          </Box>
        )}

        {/* Post Job Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: '#f8fafc', mb: 3 }}>
              Post a New Job
            </Typography>
            
            <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
              <Typography variant="body1" sx={{ color: '#cbd5e1', textAlign: 'center' }}>
                Job posting form will be implemented here
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TalentHubPanel;

