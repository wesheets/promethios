/**
 * FirebaseTeamService - Integration between Firebase connections and team panel
 * 
 * Provides real-time team member data from Firebase connections
 * to replace the mock team members in the team panel.
 */

import { firebaseConnectionService, Connection } from './FirebaseConnectionService';
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

  static getInstance(): FirebaseTeamService {
    if (!FirebaseTeamService.instance) {
      FirebaseTeamService.instance = new FirebaseTeamService();
    }
    return FirebaseTeamService.instance;
  }

  /**
   * Initialize the service with current user
   */
  initialize(userId: string): void {
    this.currentUserId = userId;
    this.setupConnectionListeners();
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
    
    // Listen for connections where user is userId1
    const connections1Listener = onSnapshot(
      query(
        collection(db, 'connections'),
        where('userId1', '==', this.currentUserId)
      ),
      (snapshot) => {
        snapshot.docChanges().forEach(change => {
          const connection = { id: change.doc.id, ...change.doc.data() } as Connection;
          
          if (change.type === 'added' || change.type === 'modified') {
            this.addTeamMemberFromConnection(connection, 'userId2');
          } else if (change.type === 'removed') {
            this.removeTeamMember(connection.userId2);
          }
        });
        
        console.log('🔄 [FirebaseTeam] Updated connections (as userId1)');
      },
      (error) => {
        console.error('🔄 [FirebaseTeam] Error in connections1 listener:', error);
      }
    );
    
    // Listen for connections where user is userId2
    const connections2Listener = onSnapshot(
      query(
        collection(db, 'connections'),
        where('userId2', '==', this.currentUserId)
      ),
      (snapshot) => {
        snapshot.docChanges().forEach(change => {
          const connection = { id: change.doc.id, ...change.doc.data() } as Connection;
          
          if (change.type === 'added' || change.type === 'modified') {
            this.addTeamMemberFromConnection(connection, 'userId1');
          } else if (change.type === 'removed') {
            this.removeTeamMember(connection.userId1);
          }
        });
        
        console.log('🔄 [FirebaseTeam] Updated connections (as userId2)');
      },
      (error) => {
        console.error('🔄 [FirebaseTeam] Error in connections2 listener:', error);
      }
    );
    
    // Store listeners for cleanup
    this.connectionListeners.push(connections1Listener, connections2Listener);
  }

  /**
   * Add a team member from a connection
   */
  private async addTeamMemberFromConnection(connection: Connection, userIdField: 'userId1' | 'userId2'): Promise<void> {
    const userId = connection[userIdField];
    const userName = userIdField === 'userId1' ? connection.user1Name : connection.user2Name;
    const userPhoto = userIdField === 'userId1' ? connection.user1Photo : connection.user2Photo;
    
    try {
      // Get additional user data from Firestore if available
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Create team member object
      const teamMember: FirebaseTeamMember = {
        id: userId,
        name: userName || 'Unknown User',
        email: userData?.email || `${userId}@example.com`,
        avatar: userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=6366f1&color=fff`,
        status: userData?.isOnline ? 'online' : 'offline',
        lastSeen: userData?.lastSeen ? (userData.lastSeen as Timestamp).toDate() : new Date(),
        role: userData?.profile?.title || 'Team Member',
        isConnected: true
      };
      
      // Add to team members map
      this.teamMembers.set(userId, teamMember);
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

