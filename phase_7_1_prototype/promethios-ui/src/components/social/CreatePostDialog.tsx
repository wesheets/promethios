/**
 * Create Post Dialog
 * 
 * Rich post creation interface for the social feed
 * Supports different post types and AI collaboration sharing
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Autocomplete,
  Stack,
  Card,
  CardContent,
  IconButton,
  Divider,
  Alert
} from '@mui/material';
import {
  Close,
  Public,
  People,
  Lock,
  SmartToy,
  AutoAwesome,
  Psychology,
  TrendingUp,
  Add,
  Image,
  VideoCall,
  AttachFile,
  EmojiEmotions
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

interface CreatePostDialogProps {
  open: boolean;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
  initialPostType?: 'general' | 'ai_collaboration' | 'insight' | 'question';
  collaborationData?: {
    conversationId: string;
    conversationName: string;
    agentName: string;
    duration: number;
    participants: string[];
  };
}

const POST_TYPES = [
  {
    id: 'general',
    label: 'General Post',
    icon: <Public />,
    description: 'Share thoughts, updates, or insights'
  },
  {
    id: 'ai_collaboration',
    label: 'AI Collaboration',
    icon: <AutoAwesome />,
    description: 'Share results from AI collaboration sessions'
  },
  {
    id: 'insight',
    label: 'Professional Insight',
    icon: <Psychology />,
    description: 'Share professional insights and learnings'
  },
  {
    id: 'question',
    label: 'Question',
    icon: <TrendingUp />,
    description: 'Ask the community for advice or input'
  }
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', icon: <Public />, description: 'Everyone can see this post' },
  { value: 'connections', label: 'Connections', icon: <People />, description: 'Only your connections can see this' },
  { value: 'private', label: 'Private', icon: <Lock />, description: 'Only you can see this post' }
];

const AI_AGENTS = [
  { id: 'claude', name: 'Claude', type: 'Anthropic', color: '#FF6B35' },
  { id: 'gpt4', name: 'GPT-4', type: 'OpenAI', color: '#00A67E' },
  { id: 'gemini', name: 'Gemini', type: 'Google', color: '#4285F4' },
  { id: 'custom', name: 'Custom Agent', type: 'Custom', color: '#9C27B0' }
];

export const CreatePostDialog: React.FC<CreatePostDialogProps> = ({
  open,
  onClose,
  onPostCreated,
  initialPostType = 'general',
  collaborationData
}) => {
  const { currentUser } = useAuth();
  
  // Form state
  const [postType, setPostType] = useState(initialPostType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with collaboration data if provided
  React.useEffect(() => {
    if (collaborationData && postType === 'ai_collaboration') {
      setTitle(`${collaborationData.conversationName} - AI Collaboration Session`);
      setContent(`Just completed an incredible ${Math.round(collaborationData.duration / 60)}-minute strategy session with ${collaborationData.agentName}!\n\n`);
      setSelectedAgents([collaborationData.agentName.toLowerCase()]);
      setTags(['ai-collaboration', 'strategy', 'productivity']);
    }
  }, [collaborationData, postType]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Map post type to Firebase format
      const mapPostType = (type: string) => {
        switch (type) {
          case 'ai_collaboration': return 'collaboration_highlight';
          case 'insight': return 'industry_insight';
          case 'question': return 'professional_update';
          default: return 'professional_update';
        }
      };

      const postData = {
        type: mapPostType(postType),
        title: title.trim(),
        content: content.trim(),
        visibility,
        tags,
        aiAgentsUsed: selectedAgents,
        collaborationDuration: collaborationData?.duration,
        collaborationParticipants: collaborationData?.participants,
        attachments: collaborationData ? [{
          type: 'conversation' as const,
          url: collaborationData.conversationId,
          title: collaborationData.conversationName,
          thumbnail: ''
        }] : []
      };

      console.log('🎯 [CreatePostDialog] Creating post via Firebase:', postData);

      // Import and use the social feed service
      const { socialFeedService } = await import('../../services/SocialFeedService');
      const createdPost = await socialFeedService.createPost(postData);

      console.log('✅ [CreatePostDialog] Post created successfully:', createdPost.id);

      if (onPostCreated) {
        onPostCreated(createdPost);
      }

      // Reset form
      setTitle('');
      setContent('');
      setTags([]);
      setSelectedAgents([]);
      setVisibility('public');
      setEnableNotifications(true);
      
      onClose();
    } catch (err) {
      console.error('❌ [CreatePostDialog] Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const selectedPostType = POST_TYPES.find(type => type.id === postType);
  const selectedVisibility = VISIBILITY_OPTIONS.find(opt => opt.value === visibility);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar src={currentUser?.photoURL || ''} sx={{ width: 40, height: 40 }}>
              {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">Create Post</Typography>
              <Typography variant="body2" color="text.secondary">
                Share with the AI collaboration community
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Post Type Selection */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Post Type
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {POST_TYPES.map((type) => (
                <Chip
                  key={type.id}
                  icon={type.icon}
                  label={type.label}
                  onClick={() => setPostType(type.id)}
                  color={postType === type.id ? 'primary' : 'default'}
                  variant={postType === type.id ? 'filled' : 'outlined'}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
            {selectedPostType && (
              <Typography variant="caption" color="text.secondary">
                {selectedPostType.description}
              </Typography>
            )}
          </Box>

          {/* Title */}
          <TextField
            label="Post Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            placeholder="What's the main topic of your post?"
            required
          />

          {/* Content */}
          <TextField
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            multiline
            rows={6}
            placeholder="Share your thoughts, insights, or ask a question..."
            required
          />

          {/* AI Agents (for AI collaboration posts) */}
          {postType === 'ai_collaboration' && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                AI Agents Used
              </Typography>
              <Autocomplete
                multiple
                options={AI_AGENTS}
                getOptionLabel={(option) => `${option.name} (${option.type})`}
                value={AI_AGENTS.filter(agent => selectedAgents.includes(agent.id))}
                onChange={(_, newValue) => setSelectedAgents(newValue.map(agent => agent.id))}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      icon={<SmartToy />}
                      label={option.name}
                      sx={{ bgcolor: option.color, color: 'white' }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select AI agents you collaborated with"
                  />
                )}
              />
            </Box>
          )}

          {/* Tags */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Tags
            </Typography>
            <Autocomplete
              multiple
              freeSolo
              options={['ai-collaboration', 'strategy', 'productivity', 'innovation', 'insights', 'question', 'help-needed']}
              value={tags}
              onChange={(_, newValue) => setTags(newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    onDelete={() => handleTagRemove(option)}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Add tags to help others discover your post"
                />
              )}
            />
          </Box>

          {/* Visibility */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Visibility
            </Typography>
            <FormControl fullWidth>
              <Select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                displayEmpty
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {option.icon}
                      <Box>
                        <Typography variant="body2">{option.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Options */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={enableNotifications}
                  onChange={(e) => setEnableNotifications(e.target.checked)}
                />
              }
              label="Notify connections about this post"
            />
          </Box>

          {/* Collaboration Data Preview */}
          {postType === 'ai_collaboration' && collaborationData && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Collaboration Session Details
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Session:</strong> {collaborationData.conversationName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>AI Agent:</strong> {collaborationData.agentName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {Math.round(collaborationData.duration / 60)} minutes
                  </Typography>
                  <Typography variant="body2">
                    <strong>Participants:</strong> {collaborationData.participants.length}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim() || !content.trim()}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <Add />}
        >
          {isSubmitting ? 'Creating...' : 'Create Post'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePostDialog;

