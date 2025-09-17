import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Slide,
  Paper,
  Divider,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Schedule as ScheduleIcon,
  AccountTree as WorkflowIcon,
  SmartToy as AgentIcon,
  DataObject as DataIcon,
  Send as SendIcon,
  Transform as TransformIcon,
  Psychology as AIIcon,
  Timeline as TimelineIcon,
  Group as CollaborateIcon,
  Share as ShareIcon,
  Bookmark as TemplateIcon
} from '@mui/icons-material';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

interface WorkflowPanelProps {
  open: boolean;
  onClose: () => void;
  width: string;
}

// Sample workflow nodes for demo
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Schedule Trigger',
      description: 'Every Monday 9 AM',
      icon: <ScheduleIcon sx={{ color: '#10b981' }} />
    },
    style: {
      background: '#1e293b',
      border: '2px solid #10b981',
      borderRadius: '8px',
      color: '#f8fafc',
      width: 180
    }
  },
  {
    id: '2',
    position: { x: 350, y: 100 },
    data: { 
      label: 'Fetch Market Data',
      description: 'API call to get latest trends',
      icon: <DataIcon sx={{ color: '#3b82f6' }} />,
      agent: null
    },
    style: {
      background: '#1e293b',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      color: '#f8fafc',
      width: 180
    }
  },
  {
    id: '3',
    position: { x: 600, y: 100 },
    data: { 
      label: 'AI Analysis',
      description: 'Drop an agent here →',
      icon: <AIIcon sx={{ color: '#8b5cf6' }} />,
      agent: null,
      dropZone: true
    },
    style: {
      background: '#1e293b',
      border: '2px dashed #8b5cf6',
      borderRadius: '8px',
      color: '#f8fafc',
      width: 180
    }
  },
  {
    id: '4',
    position: { x: 850, y: 100 },
    data: { 
      label: 'Send to Slack',
      description: '#market-insights channel',
      icon: <SendIcon sx={{ color: '#f59e0b' }} />
    },
    style: {
      background: '#1e293b',
      border: '2px solid #f59e0b',
      borderRadius: '8px',
      color: '#f8fafc',
      width: 180
    }
  }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', style: { stroke: '#8b5cf6', strokeWidth: 2 } }
];

// Sample workflow templates
const workflowTemplates = [
  {
    id: 'daily-standup',
    name: 'Daily Standup',
    description: 'Automated team status collection',
    nodes: 4,
    collaborators: 3,
    category: 'Team Management'
  },
  {
    id: 'market-research',
    name: 'Market Research Sweep',
    description: 'Comprehensive market analysis pipeline',
    nodes: 7,
    collaborators: 2,
    category: 'Research'
  },
  {
    id: 'content-pipeline',
    name: 'Content Creation Pipeline',
    description: 'From idea to published content',
    nodes: 6,
    collaborators: 5,
    category: 'Marketing'
  }
];

const WorkflowPanel: React.FC<WorkflowPanelProps> = ({ open, onClose, width }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: width,
          height: '100vh',
          bgcolor: '#000000', // Black background as requested
          borderLeft: '1px solid #334155',
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: '1px solid #334155',
            bgcolor: '#111827'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <WorkflowIcon sx={{ color: '#10b981', fontSize: '1.5rem' }} />
            <Box>
              <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                AI Agent Workflows
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Drag agents into workflow nodes to automate tasks
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Share Workflow">
              <IconButton size="small" sx={{ color: '#94a3b8' }}>
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Collaborate">
              <IconButton size="small" sx={{ color: '#94a3b8' }}>
                <CollaborateIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton 
              onClick={onClose}
              size="small"
              sx={{ color: '#94a3b8' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, display: 'flex' }}>
          {/* Left Sidebar - Templates & Tools */}
          <Box
            sx={{
              width: 280,
              borderRight: '1px solid #334155',
              bgcolor: '#0f172a',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Workflow Templates */}
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#f8fafc', mb: 2, fontWeight: 600 }}>
                Workflow Templates
              </Typography>
              <List dense>
                {workflowTemplates.map((template) => (
                  <ListItem
                    key={template.id}
                    sx={{
                      bgcolor: selectedTemplate === template.id ? '#1e293b' : 'transparent',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#1e293b' }
                    }}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <TemplateIcon sx={{ color: '#10b981', fontSize: '1rem' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={template.name}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={`${template.nodes} nodes`}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.6rem',
                              bgcolor: '#374151',
                              color: '#9ca3af'
                            }}
                          />
                          <Chip
                            label={`${template.collaborators} collaborators`}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.6rem',
                              bgcolor: '#374151',
                              color: '#9ca3af'
                            }}
                          />
                        </Box>
                      }
                      primaryTypographyProps={{
                        fontSize: '0.8rem',
                        color: '#f8fafc',
                        fontWeight: 500
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Divider sx={{ bgcolor: '#334155' }} />

            {/* Node Palette */}
            <Box sx={{ p: 2, flex: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#f8fafc', mb: 2, fontWeight: 600 }}>
                Drag to Canvas
              </Typography>
              <Grid container spacing={1}>
                {[
                  { icon: <ScheduleIcon />, label: 'Trigger', color: '#10b981' },
                  { icon: <DataIcon />, label: 'Data', color: '#3b82f6' },
                  { icon: <AIIcon />, label: 'AI Agent', color: '#8b5cf6' },
                  { icon: <TransformIcon />, label: 'Transform', color: '#f59e0b' },
                  { icon: <SendIcon />, label: 'Send', color: '#ef4444' },
                  { icon: <TimelineIcon />, label: 'Logic', color: '#6b7280' }
                ].map((node, index) => (
                  <Grid item xs={6} key={index}>
                    <Paper
                      sx={{
                        p: 1,
                        bgcolor: '#1e293b',
                        border: `1px solid ${node.color}`,
                        borderRadius: 1,
                        cursor: 'grab',
                        textAlign: 'center',
                        '&:hover': {
                          bgcolor: '#334155',
                          transform: 'scale(1.02)'
                        },
                        transition: 'all 0.2s'
                      }}
                      draggable
                    >
                      <Box sx={{ color: node.color, mb: 0.5 }}>
                        {React.cloneElement(node.icon, { fontSize: 'small' })}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#f8fafc', fontSize: '0.7rem' }}>
                        {node.label}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>

          {/* Main Canvas */}
          <Box sx={{ flex: 1, position: 'relative' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              connectionMode={ConnectionMode.Loose}
              fitView
              style={{
                backgroundColor: '#000000'
              }}
            >
              <Background color="#1f2937" gap={20} />
              <Controls 
                style={{
                  button: {
                    backgroundColor: '#1e293b',
                    border: '1px solid #374151',
                    color: '#f8fafc'
                  }
                }}
              />
              <Panel position="top-right">
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PlayIcon />}
                    sx={{
                      bgcolor: '#10b981',
                      '&:hover': { bgcolor: '#059669' }
                    }}
                  >
                    Run Workflow
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    sx={{
                      borderColor: '#374151',
                      color: '#f8fafc',
                      '&:hover': { borderColor: '#4b5563', bgcolor: '#1e293b' }
                    }}
                  >
                    Add Node
                  </Button>
                </Box>
              </Panel>
            </ReactFlow>

            {/* Agent Drop Zone Overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                bgcolor: 'rgba(0, 0, 0, 0.8)',
                border: '2px dashed #8b5cf6',
                borderRadius: 2,
                p: 2,
                maxWidth: 300
              }}
            >
              <Typography variant="body2" sx={{ color: '#8b5cf6', fontWeight: 600, mb: 1 }}>
                💡 Pro Tip
              </Typography>
              <Typography variant="caption" sx={{ color: '#d1d5db' }}>
                Drag AI agents from the top docker into purple "AI Agent" nodes to give them specialized powers!
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Bottom Status Bar */}
        <Box
          sx={{
            p: 1.5,
            borderTop: '1px solid #334155',
            bgcolor: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label="Draft"
              size="small"
              sx={{
                bgcolor: '#374151',
                color: '#9ca3af',
                fontSize: '0.7rem'
              }}
            />
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              4 nodes • 3 connections • 0 agents assigned
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 20, height: 20, bgcolor: '#10b981', fontSize: '0.7rem' }}>
              T
            </Avatar>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              You
            </Typography>
          </Box>
        </Box>
      </Box>
    </Slide>
  );
};

export default WorkflowPanel;

