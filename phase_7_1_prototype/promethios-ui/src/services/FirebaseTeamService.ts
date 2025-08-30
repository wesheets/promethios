/**
 * FirebaseTeamService - Integration between Firebase connections and team panel
 * 
 * Provides real-time team member data from Firebase connections
 * to replace the mock team members in the team panel.
 */

import { ConnectionService, Connection } from './ConnectionService';
import { db, auth } from '../firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';

export interface FirebaseTeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  role: string;
  isConnected: boolean;
}

class FirebaseTeamService {
  private static instance: FirebaseTeamService;
  private teamMembers: Map<string, FirebaseTeamMember> = new Map();
  private currentUserId: string | null = null;
  private connectionListeners: (() => void)[] = [];
  private connectionService: ConnectionService;

  static getInstance(): FirebaseTeamService {
    if (!FirebaseTeamService.instance) {
      FirebaseTeamService.instance = new FirebaseTeamService();
    }
    return FirebaseTeamService.instance;
  }

  constructor() {
    this.connectionService = ConnectionService.getInstance();
  }

  /**
   * Initialize the service with current user
   */
  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;
    
    // Load initial connections
    await this.loadInitialConnections();
    
    // Setup real-time listeners
    this.setupConnectionListeners();
  }

  /**
   * Load initial connections from ConnectionService
   */
  private async loadInitialConnections(): Promise<void> {
    if (!this.currentUserId) return;
    
    try {
      console.log('🔄 [FirebaseTeam] Loading initial connections for user:', this.currentUserId);
      
      const connections = await this.connectionService.getUserConnections(this.currentUserId);
      console.log('🔄 [FirebaseTeam] Found', connections.length, 'connections');
      
      // Clear existing team members
      this.teamMembers.clear();
      
      // Add each connection as a team member
      for (const connection of connections) {
        await this.addTeamMemberFromConnection(connection);
      }
      
      console.log('✅ [FirebaseTeam] Loaded', this.teamMembers.size, 'team members');
      
    } catch (error) {
      console.error('❌ [FirebaseTeam] Error loading initial connections:', error);
    }
  }

  /**
   * Get all team members (connected users)
   */
  getTeamMembers(): FirebaseTeamMember[] {
    return Array.from(this.teamMembers.values());
  }

  /**
   * Get online team members
   */
  getOnlineMembers(): FirebaseTeamMember[] {
    return this.getTeamMembers().filter(member => member.status === 'online');
  }

  /**
   * Setup real-time listeners for connections
   */
  private setupConnectionListeners(): void {
    if (!this.currentUserId) return;
    
    // Clean up any existing listeners
    this.cleanupListeners();
    
    console.log('🔄 [FirebaseTeam] Setting up connection listeners for user:', this.currentUserId);
    
    // Use ConnectionService's real-time listener
    const unsubscribe = this.connectionService.onConnectionsChange(this.currentUserId, async (connections) => {
      console.log('🔄 [FirebaseTeam] Connections changed, updating team members');
      
      // Clear existing team members
      this.teamMembers.clear();
      
      // Add each connection as a team member
      for (const connection of connections) {
        await this.addTeamMemberFromConnection(connection);
      }
      
      console.log('✅ [FirebaseTeam] Updated team members:', this.teamMembers.size);
    });
    
    // Store listener for cleanup
    this.connectionListeners.push(unsubscribe);
  }

  /**
   * Add a team member from a connection
   */
  private async addTeamMemberFromConnection(connection: Connection): Promise<void> {
    if (!this.currentUserId) return;
    
    // Determine which user is the connected user (not the current user)
    const isCurrentUserUserId1 = connection.userId1 === this.currentUserId;
    const connectedUserId = isCurrentUserUserId1 ? connection.userId2 : connection.userId1;
    const connectedUserName = isCurrentUserUserId1 ? connection.user2Name : connection.user1Name;
    const connectedUserAvatar = isCurrentUserUserId1 ? connection.user2Avatar : connection.user1Avatar;
    
    try {
      // Get additional user data from Firestore if available
      const userDoc = await getDoc(doc(db, 'users', connectedUserId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Create team member object
      const teamMember: FirebaseTeamMember = {
        id: connectedUserId,
        name: connectedUserName || 'Unknown User',
        email: userData?.email || `${connectedUserId}@example.com`,
        avatar: connectedUserAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(connectedUserName || 'User')}&background=6366f1&color=fff`,
        status: userData?.isOnline ? 'online' : 'offline',
        lastSeen: userData?.lastSeen ? (userData.lastSeen as Timestamp).toDate() : new Date(),
        role: userData?.profile?.title || 'Team Member',
        isConnected: true
      };
      
      // Add to team members map
      this.teamMembers.set(connectedUserId, teamMember);
      console.log('👤 [FirebaseTeam] Added team member:', teamMember.name);
      
    } catch (error) {
      console.error('👤 [FirebaseTeam] Error adding team member:', error);
    }
  }

  /**
   * Remove a team member
   */
  private removeTeamMember(userId: string): void {
    if (this.teamMembers.has(userId)) {
      const name = this.teamMembers.get(userId)?.name;
      this.teamMembers.delete(userId);
      console.log('👤 [FirebaseTeam] Removed team member:', name);
    }
  }

  /**
   * Clean up listeners
   */
  cleanupListeners(): void {
    this.connectionListeners.forEach(unsubscribe => unsubscribe());
    this.connectionListeners = [];
    console.log('🧹 [FirebaseTeam] Cleaned up listeners');
  }
}

export default FirebaseTeamService;

