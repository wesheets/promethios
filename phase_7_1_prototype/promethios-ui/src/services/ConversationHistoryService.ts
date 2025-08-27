/**
 * ConversationHistoryService - Manages conversation history access and controls
 * Handles invitation history settings, privacy-aware history, and granular access controls
 */

export interface HistoryAccessLevel {
  type: 'none' | 'limited' | 'full' | 'custom';
  messageCount?: number; // For limited access
  timeRange?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days';
  }; // For time-based access
  startDate?: Date; // For custom range
  endDate?: Date; // For custom range
}

export interface ConversationHistorySettings {
  conversationId: string;
  defaultAccessLevel: HistoryAccessLevel;
  participantAccess: Map<string, HistoryAccessLevel>; // Per-participant overrides
  respectPrivateSegments: boolean; // Hide private mode segments
  allowHistoryDownload: boolean;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

export interface HistorySegment {
  id: string;
  conversationId: string;
  startTime: Date;
  endTime: Date;
  messageCount: number;
  isPrivate: boolean; // Was this segment in private mode?
  participants: string[];
  aiAgents: string[];
  summary?: string; // Optional summary of the segment
}

export interface FilteredHistory {
  segments: HistorySegment[];
  totalMessages: number;
  accessibleMessages: number;
  hiddenSegments: number; // Private segments hidden
  timeRange: {
    start: Date;
    end: Date;
  };
}

class ConversationHistoryService {
  private static instance: ConversationHistoryService;
  private historySettings: Map<string, ConversationHistorySettings> = new Map();
  private conversationSegments: Map<string, HistorySegment[]> = new Map();

  private constructor() {
    console.log('📚 ConversationHistoryService initialized');
  }

  public static getInstance(): ConversationHistoryService {
    if (!ConversationHistoryService.instance) {
      ConversationHistoryService.instance = new ConversationHistoryService();
    }
    return ConversationHistoryService.instance;
  }

  /**
   * Set history access level for conversation
   */
  async setHistoryAccess(
    conversationId: string,
    accessLevel: HistoryAccessLevel,
    userId: string,
    respectPrivateSegments: boolean = true
  ): Promise<void> {
    const existingSettings = this.historySettings.get(conversationId);
    
    const settings: ConversationHistorySettings = {
      conversationId,
      defaultAccessLevel: accessLevel,
      participantAccess: existingSettings?.participantAccess || new Map(),
      respectPrivateSegments,
      allowHistoryDownload: existingSettings?.allowHistoryDownload || false,
      createdBy: existingSettings?.createdBy || userId,
      createdAt: existingSettings?.createdAt || new Date(),
      lastModified: new Date()
    };

    this.historySettings.set(conversationId, settings);
    console.log('📚 Updated history access for conversation:', conversationId, accessLevel.type);
  }

  /**
   * Set history access for specific participant
   */
  async setParticipantHistoryAccess(
    conversationId: string,
    participantId: string,
    accessLevel: HistoryAccessLevel,
    userId: string
  ): Promise<void> {
    const settings = this.getHistorySettings(conversationId);
    settings.participantAccess.set(participantId, accessLevel);
    settings.lastModified = new Date();

    this.historySettings.set(conversationId, settings);
    console.log('📚 Updated participant history access:', participantId, accessLevel.type);
  }

  /**
   * Get filtered history for participant
   */
  async getFilteredHistory(
    conversationId: string,
    participantId: string
  ): Promise<FilteredHistory> {
    const settings = this.getHistorySettings(conversationId);
    const segments = this.getConversationSegments(conversationId);
    
    // Get access level for this participant
    const accessLevel = settings.participantAccess.get(participantId) || settings.defaultAccessLevel;
    
    // Filter segments based on access level
    const filteredSegments = this.filterSegmentsByAccess(segments, accessLevel, settings.respectPrivateSegments);
    
    // Calculate totals
    const totalMessages = segments.reduce((sum, segment) => sum + segment.messageCount, 0);
    const accessibleMessages = filteredSegments.reduce((sum, segment) => sum + segment.messageCount, 0);
    const hiddenSegments = segments.filter(segment => 
      settings.respectPrivateSegments && segment.isPrivate
    ).length;

    const timeRange = {
      start: filteredSegments.length > 0 ? filteredSegments[0].startTime : new Date(),
      end: filteredSegments.length > 0 ? filteredSegments[filteredSegments.length - 1].endTime : new Date()
    };

    return {
      segments: filteredSegments,
      totalMessages,
      accessibleMessages,
      hiddenSegments,
      timeRange
    };
  }

  /**
   * Create invitation with history settings
   */
  async createInvitationWithHistory(
    conversationId: string,
    inviteeId: string,
    historyAccess: HistoryAccessLevel,
    inviterId: string,
    customMessage?: string
  ): Promise<{
    invitationId: string;
    historyPreview: FilteredHistory;
  }> {
    // Set history access for the invitee
    await this.setParticipantHistoryAccess(conversationId, inviteeId, historyAccess, inviterId);
    
    // Generate preview of what they'll see
    const historyPreview = await this.getFilteredHistory(conversationId, inviteeId);
    
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('📧 Created invitation with history access:', {
      invitationId,
      conversationId,
      inviteeId,
      accessLevel: historyAccess.type,
      accessibleMessages: historyPreview.accessibleMessages
    });

    return {
      invitationId,
      historyPreview
    };
  }

  /**
   * Get history access options for invitation
   */
  getHistoryAccessOptions(): Array<{
    type: HistoryAccessLevel['type'];
    label: string;
    description: string;
    icon: string;
  }> {
    return [
      {
        type: 'none',
        label: 'No History',
        description: 'Start fresh - no previous messages visible',
        icon: '🚫'
      },
      {
        type: 'limited',
        label: 'Recent Messages',
        description: 'Show last 50 messages or 2 hours of conversation',
        icon: '📝'
      },
      {
        type: 'full',
        label: 'Full History',
        description: 'Complete conversation history (respects private segments)',
        icon: '📚'
      },
      {
        type: 'custom',
        label: 'Custom Range',
        description: 'Choose specific date range or message count',
        icon: '⚙️'
      }
    ];
  }

  /**
   * Create default history access levels
   */
  createDefaultHistoryAccess(): {
    none: HistoryAccessLevel;
    recent: HistoryAccessLevel;
    full: HistoryAccessLevel;
  } {
    return {
      none: { type: 'none' },
      recent: { 
        type: 'limited', 
        messageCount: 50,
        timeRange: { value: 2, unit: 'hours' }
      },
      full: { type: 'full' }
    };
  }

  /**
   * Get conversation segments (mock implementation)
   */
  private getConversationSegments(conversationId: string): HistorySegment[] {
    // Mock data - in real implementation, this would fetch from database
    const existingSegments = this.conversationSegments.get(conversationId);
    if (existingSegments) return existingSegments;

    // Create mock segments
    const now = new Date();
    const segments: HistorySegment[] = [
      {
        id: 'seg_1',
        conversationId,
        startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        endTime: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        messageCount: 25,
        isPrivate: false,
        participants: ['user1', 'user2'],
        aiAgents: ['claude'],
        summary: 'Initial project discussion'
      },
      {
        id: 'seg_2',
        conversationId,
        startTime: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        endTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        messageCount: 15,
        isPrivate: true, // Private segment
        participants: ['user1', 'user2'],
        aiAgents: [],
        summary: 'Private strategy discussion'
      },
      {
        id: 'seg_3',
        conversationId,
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        messageCount: 30,
        isPrivate: false,
        participants: ['user1', 'user2'],
        aiAgents: ['claude', 'openai'],
        summary: 'Technical implementation planning'
      },
      {
        id: 'seg_4',
        conversationId,
        startTime: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        endTime: now,
        messageCount: 20,
        isPrivate: false,
        participants: ['user1', 'user2'],
        aiAgents: ['claude'],
        summary: 'Current discussion'
      }
    ];

    this.conversationSegments.set(conversationId, segments);
    return segments;
  }

  /**
   * Filter segments based on access level
   */
  private filterSegmentsByAccess(
    segments: HistorySegment[],
    accessLevel: HistoryAccessLevel,
    respectPrivateSegments: boolean
  ): HistorySegment[] {
    let filteredSegments = [...segments];

    // Filter out private segments if required
    if (respectPrivateSegments) {
      filteredSegments = filteredSegments.filter(segment => !segment.isPrivate);
    }

    // Apply access level filtering
    switch (accessLevel.type) {
      case 'none':
        return [];
      
      case 'limited':
        if (accessLevel.messageCount) {
          // Limit by message count
          let messageCount = 0;
          const limitedSegments: HistorySegment[] = [];
          
          for (let i = filteredSegments.length - 1; i >= 0; i--) {
            const segment = filteredSegments[i];
            if (messageCount + segment.messageCount <= accessLevel.messageCount) {
              limitedSegments.unshift(segment);
              messageCount += segment.messageCount;
            } else {
              break;
            }
          }
          
          filteredSegments = limitedSegments;
        }
        
        if (accessLevel.timeRange) {
          // Limit by time range
          const cutoffTime = new Date();
          const { value, unit } = accessLevel.timeRange;
          
          switch (unit) {
            case 'minutes':
              cutoffTime.setMinutes(cutoffTime.getMinutes() - value);
              break;
            case 'hours':
              cutoffTime.setHours(cutoffTime.getHours() - value);
              break;
            case 'days':
              cutoffTime.setDate(cutoffTime.getDate() - value);
              break;
          }
          
          filteredSegments = filteredSegments.filter(segment => 
            segment.endTime >= cutoffTime
          );
        }
        break;
      
      case 'custom':
        if (accessLevel.startDate && accessLevel.endDate) {
          filteredSegments = filteredSegments.filter(segment =>
            segment.startTime >= accessLevel.startDate! &&
            segment.endTime <= accessLevel.endDate!
          );
        }
        break;
      
      case 'full':
      default:
        // Return all non-private segments
        break;
    }

    return filteredSegments;
  }

  /**
   * Get history settings for conversation
   */
  private getHistorySettings(conversationId: string): ConversationHistorySettings {
    return this.historySettings.get(conversationId) || {
      conversationId,
      defaultAccessLevel: { type: 'full' },
      participantAccess: new Map(),
      respectPrivateSegments: true,
      allowHistoryDownload: false,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date()
    };
  }

  /**
   * Get history summary for conversation
   */
  getHistorySummary(conversationId: string): {
    totalSegments: number;
    totalMessages: number;
    privateSegments: number;
    timeSpan: string;
    participants: string[];
    aiAgents: string[];
  } {
    const segments = this.getConversationSegments(conversationId);
    
    const totalMessages = segments.reduce((sum, segment) => sum + segment.messageCount, 0);
    const privateSegments = segments.filter(segment => segment.isPrivate).length;
    
    const allParticipants = new Set<string>();
    const allAiAgents = new Set<string>();
    
    segments.forEach(segment => {
      segment.participants.forEach(p => allParticipants.add(p));
      segment.aiAgents.forEach(a => allAiAgents.add(a));
    });

    const timeSpan = segments.length > 0 
      ? `${segments[0].startTime.toLocaleDateString()} - ${segments[segments.length - 1].endTime.toLocaleDateString()}`
      : 'No history';

    return {
      totalSegments: segments.length,
      totalMessages,
      privateSegments,
      timeSpan,
      participants: Array.from(allParticipants),
      aiAgents: Array.from(allAiAgents)
    };
  }
}

export default ConversationHistoryService;

