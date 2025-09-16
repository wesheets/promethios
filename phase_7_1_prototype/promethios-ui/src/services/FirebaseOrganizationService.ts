/**
 * FirebaseOrganizationService - Organization management service that integrates with existing Firebase infrastructure
 * 
 * Extends the existing FirebaseProfileService and FirebaseTeamService to provide
 * organization-based collaboration features while maintaining compatibility.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FirebaseProfileService } from './FirebaseProfileService';
import { FirebaseTeamService } from './FirebaseTeamService';

export interface Organization {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  description: string;
  memberCount: number;
  onlineCount: number;
  isVerified: boolean;
  isPublic: boolean;
  industry: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  channels: OrganizationChannel[];
  settings: OrganizationSettings;
}

export interface OrganizationChannel {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  memberIds: string[];
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
}

export interface OrganizationSettings {
  allowPublicJoining: boolean;
  requireApproval: boolean;
  allowGuestAccess: boolean;
  maxMembers: number;
  aiAgentsEnabled: boolean;
  allowedDomains: string[];
}

export interface OrganizationMembership {
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joinedAt: Date;
  permissions: string[];
  isActive: boolean;
}

export class FirebaseOrganizationService {
  private static instance: FirebaseOrganizationService;
  private profileService: FirebaseProfileService;
  private teamService: FirebaseTeamService;

  static getInstance(): FirebaseOrganizationService {
    if (!FirebaseOrganizationService.instance) {
      FirebaseOrganizationService.instance = new FirebaseOrganizationService();
    }
    return FirebaseOrganizationService.instance;
  }

  constructor() {
    this.profileService = new FirebaseProfileService();
    this.teamService = FirebaseTeamService.getInstance();
  }

  /**
   * Create a new organization
   */
  async createOrganization(
    ownerId: string, 
    organizationData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'memberCount' | 'onlineCount' | 'memberIds' | 'adminIds'>
  ): Promise<Organization> {
    try {
      const orgId = doc(collection(db, 'organizations')).id;
      const now = new Date();

      const organization: Organization = {
        ...organizationData,
        id: orgId,
        createdAt: now,
        updatedAt: now,
        memberCount: 1,
        onlineCount: 1,
        ownerId,
        adminIds: [ownerId],
        memberIds: [ownerId],
        channels: [
          {
            id: 'general',
            name: 'general',
            description: 'General discussion',
            isPrivate: false,
            memberIds: [ownerId],
            createdAt: now,
            lastActivity: now,
            messageCount: 0
          }
        ]
      };

      // Save organization to Firebase
      await setDoc(doc(db, 'organizations', orgId), {
        ...organization,
        createdAt: Timestamp.fromDate(organization.createdAt),
        updatedAt: Timestamp.fromDate(organization.updatedAt)
      });

      // Create membership record
      await this.createMembership(orgId, ownerId, 'owner');

      // Update user profile to include organization
      await this.addOrganizationToUserProfile(ownerId, orgId);

      return organization;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganization(organizationId: string): Promise<Organization | null> {
    try {
      const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
      
      if (orgDoc.exists()) {
        const data = orgDoc.data();
        return {
          ...data,
          id: orgDoc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Organization;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting organization:', error);
      throw error;
    }
  }

  /**
   * Get organizations for a user
   */
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      const membershipsQuery = query(
        collection(db, 'organizationMemberships'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );

      const membershipsSnapshot = await getDocs(membershipsQuery);
      const organizations: Organization[] = [];

      for (const membershipDoc of membershipsSnapshot.docs) {
        const membership = membershipDoc.data() as OrganizationMembership;
        const org = await this.getOrganization(membership.organizationId);
        if (org) {
          organizations.push(org);
        }
      }

      return organizations;
    } catch (error) {
      console.error('Error getting user organizations:', error);
      throw error;
    }
  }

  /**
   * Get public organizations
   */
  async getPublicOrganizations(limitCount: number = 20): Promise<Organization[]> {
    try {
      const orgsQuery = query(
        collection(db, 'organizations'),
        where('isPublic', '==', true),
        orderBy('memberCount', 'desc'),
        limit(limitCount)
      );

      const orgsSnapshot = await getDocs(orgsQuery);
      return orgsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Organization[];
    } catch (error) {
      console.error('Error getting public organizations:', error);
      throw error;
    }
  }

  /**
   * Join an organization
   */
  async joinOrganization(organizationId: string, userId: string): Promise<void> {
    try {
      const org = await this.getOrganization(organizationId);
      if (!org) {
        throw new Error('Organization not found');
      }

      if (!org.isPublic && !org.settings.allowPublicJoining) {
        throw new Error('Organization does not allow public joining');
      }

      // Create membership
      await this.createMembership(organizationId, userId, 'member');

      // Update organization member count and member list
      await updateDoc(doc(db, 'organizations', organizationId), {
        memberIds: arrayUnion(userId),
        memberCount: org.memberCount + 1,
        updatedAt: Timestamp.fromDate(new Date())
      });

      // Update user profile
      await this.addOrganizationToUserProfile(userId, organizationId);

      // Add user to general channel
      await this.addUserToChannel(organizationId, 'general', userId);
    } catch (error) {
      console.error('Error joining organization:', error);
      throw error;
    }
  }

  /**
   * Create organization membership
   */
  private async createMembership(
    organizationId: string, 
    userId: string, 
    role: OrganizationMembership['role']
  ): Promise<void> {
    const membershipId = `${organizationId}_${userId}`;
    const membership: OrganizationMembership = {
      organizationId,
      userId,
      role,
      joinedAt: new Date(),
      permissions: this.getDefaultPermissions(role),
      isActive: true
    };

    await setDoc(doc(db, 'organizationMemberships', membershipId), {
      ...membership,
      joinedAt: Timestamp.fromDate(membership.joinedAt)
    });
  }

  /**
   * Add organization to user profile
   */
  private async addOrganizationToUserProfile(userId: string, organizationId: string): Promise<void> {
    try {
      const userProfile = await this.profileService.getUserProfile(userId);
      if (userProfile) {
        const organizations = userProfile.organizations || [];
        if (!organizations.includes(organizationId)) {
          await this.profileService.updateUserProfile(userId, {
            organizations: [...organizations, organizationId]
          });
        }
      }
    } catch (error) {
      console.error('Error adding organization to user profile:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Add user to organization channel
   */
  async addUserToChannel(organizationId: string, channelId: string, userId: string): Promise<void> {
    try {
      const org = await this.getOrganization(organizationId);
      if (!org) return;

      const updatedChannels = org.channels.map(channel => {
        if (channel.id === channelId && !channel.memberIds.includes(userId)) {
          return {
            ...channel,
            memberIds: [...channel.memberIds, userId]
          };
        }
        return channel;
      });

      await updateDoc(doc(db, 'organizations', organizationId), {
        channels: updatedChannels,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error adding user to channel:', error);
      throw error;
    }
  }

  /**
   * Create a new channel in organization
   */
  async createChannel(
    organizationId: string, 
    channelData: Omit<OrganizationChannel, 'id' | 'createdAt' | 'lastActivity' | 'messageCount'>
  ): Promise<OrganizationChannel> {
    try {
      const org = await this.getOrganization(organizationId);
      if (!org) {
        throw new Error('Organization not found');
      }

      const channelId = channelData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const now = new Date();

      const newChannel: OrganizationChannel = {
        ...channelData,
        id: channelId,
        createdAt: now,
        lastActivity: now,
        messageCount: 0
      };

      const updatedChannels = [...org.channels, newChannel];

      await updateDoc(doc(db, 'organizations', organizationId), {
        channels: updatedChannels,
        updatedAt: Timestamp.fromDate(new Date())
      });

      return newChannel;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  }

  /**
   * Get default permissions for role
   */
  private getDefaultPermissions(role: OrganizationMembership['role']): string[] {
    switch (role) {
      case 'owner':
        return ['manage_org', 'manage_members', 'manage_channels', 'send_messages', 'invite_users'];
      case 'admin':
        return ['manage_members', 'manage_channels', 'send_messages', 'invite_users'];
      case 'member':
        return ['send_messages', 'view_channels'];
      case 'guest':
        return ['view_channels'];
      default:
        return [];
    }
  }

  /**
   * Listen to organization changes
   */
  subscribeToOrganization(organizationId: string, callback: (org: Organization | null) => void): () => void {
    return onSnapshot(doc(db, 'organizations', organizationId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Organization);
      } else {
        callback(null);
      }
    });
  }
}

export default FirebaseOrganizationService;

