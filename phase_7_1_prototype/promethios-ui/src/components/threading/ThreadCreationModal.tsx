/**
 * Thread Creation Modal
 * 
 * Modal component for creating new conversation threads from existing messages.
 * Provides interface for thread title, description, participants, and metadata.
 */

import React, { useState, useEffect } from 'react';
import { X, Users, Tag, AlertCircle, MessageSquare, Sparkles } from 'lucide-react';
import { CreateThreadRequest, ThreadMetadata } from '../../types/threading';
import { Message, Participant } from '../../types/chat';
import { ThreadingService } from '../../services/ThreadingService';
import { useAuth } from '../../hooks/useAuth';

interface ThreadCreationModalProps {
  /** Whether the modal is open */
  open: boolean;
  
  /** Function to close the modal */
  onClose: () => void;
  
  /** Session ID for the thread */
  sessionId: string;
  
  /** Origin message that triggered thread creation */
  originMessage: Message;
  
  /** Available participants */
  participants: Participant[];
  
  /** Parent thread ID (for nested threads) */
  parentThreadId?: string;
  
  /** Callback when thread is created */
  onThreadCreated?: (threadId: string) => void;
}

/**
 * Thread Creation Modal Component
 */
export const ThreadCreationModal: React.FC<ThreadCreationModalProps> = ({
  open,
  onClose,
  sessionId,
  originMessage,
  participants,
  parentThreadId,
  onThreadCreated
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [priority, setPriority] = useState<ThreadMetadata['priority']>('normal');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [category, setCategory] = useState('');

  // Threading service
  const threadingService = ThreadingService.getInstance();

  // Auto-generate thread title from origin message
  useEffect(() => {
    if (originMessage && !title) {
      const messagePreview = originMessage.content.substring(0, 50);
      const autoTitle = `Discussion: ${messagePreview}${messagePreview.length >= 50 ? '...' : ''}`;
      setTitle(autoTitle);
    }
  }, [originMessage, title]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setError(null);
      setSelectedParticipants([]);
      setTags([]);
      setNewTag('');
      setCategory('');
      setPriority('normal');
      setDescription('');
    }
  }, [open]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!title.trim()) {
      setError('Thread title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🧵 [ThreadCreationModal] Creating thread:', {
        sessionId,
        title: title.trim(),
        originMessageId: originMessage.id,
        parentThreadId
      });

      // Prepare thread creation request
      const request: CreateThreadRequest = {
        sessionId,
        parentThreadId,
        title: title.trim(),
        description: description.trim() || undefined,
        originMessageId: originMessage.id,
        participants: selectedParticipants,
        metadata: {
          priority,
          category: category.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined
        }
      };

      // Create thread
      const thread = await threadingService.createThread(request);

      console.log('✅ [ThreadCreationModal] Thread created successfully:', thread.id);

      // Notify parent component
      if (onThreadCreated) {
        onThreadCreated(thread.id);
      }

      // Close modal
      onClose();

    } catch (err) {
      console.error('❌ [ThreadCreationModal] Failed to create thread:', err);
      setError(err instanceof Error ? err.message : 'Failed to create thread');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new tag
   */
  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  /**
   * Remove a tag
   */
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  /**
   * Toggle participant selection
   */
  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Thread
              </h2>
              <p className="text-sm text-gray-500">
                Start a focused discussion from this message
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Origin Message Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Origin Message</span>
            </div>
            <div className="text-sm text-gray-600 line-clamp-3">
              {originMessage.content}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              From: {originMessage.senderName} • {new Date(originMessage.timestamp).toLocaleString()}
            </div>
          </div>

          {/* Thread Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Thread Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter thread title..."
              required
              disabled={loading}
            />
          </div>

          {/* Thread Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what this thread is about..."
              disabled={loading}
            />
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ThreadMetadata['priority'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category (Optional)
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Technical, Planning, Discussion..."
              disabled={loading}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (Optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-blue-600"
                    disabled={loading}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a tag..."
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading || !newTag.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Additional Participants (Optional)
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {participants.map((participant) => (
                <label
                  key={participant.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(participant.id)}
                    onChange={() => toggleParticipant(participant.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700">{participant.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !title.trim()}
            >
              {loading ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

