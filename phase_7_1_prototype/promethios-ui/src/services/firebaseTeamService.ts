// Fixed Firebase Team Service with all required imports
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { Team, TeamMember, TeamRole } from '../types/teamTypes';

export class FirebaseTeamService {
  private readonly teamsCollection = 'teams';
  private readonly membersCollection = 'teamMembers';

  // Create a new team
  async createTeam(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const teamData = {
        ...team,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(firestore, this.teamsCollection), teamData);
      console.log('Team created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating team:', error);
      throw new Error(`Failed to create team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all teams
  async getTeams(): Promise<Team[]> {
    try {
      const q = query(
        collection(firestore, this.teamsCollection),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      const teams: Team[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        teams.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Team);
      });

      return teams;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw new Error(`Failed to fetch teams: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get team by ID
  async getTeamById(teamId: string): Promise<Team | null> {
    try {
      const docRef = doc(firestore, this.teamsCollection, teamId);
      const docSnap: DocumentSnapshot<DocumentData> = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Team;
      }

      return null;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw new Error(`Failed to fetch team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update team
  async updateTeam(teamId: string, updates: Partial<Omit<Team, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const docRef = doc(firestore, this.teamsCollection, teamId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updateData);
      console.log('Team updated successfully:', teamId);
    } catch (error) {
      console.error('Error updating team:', error);
      throw new Error(`Failed to update team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete team
  async deleteTeam(teamId: string): Promise<void> {
    try {
      // First delete all team members
      await this.deleteAllTeamMembers(teamId);
      
      // Then delete the team
      const docRef = doc(firestore, this.teamsCollection, teamId);
      await deleteDoc(docRef);
      console.log('Team deleted successfully:', teamId);
    } catch (error) {
      console.error('Error deleting team:', error);
      throw new Error(`Failed to delete team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add team member
  async addTeamMember(member: Omit<TeamMember, 'id' | 'joinedAt'>): Promise<string> {
    try {
      const memberData = {
        ...member,
        joinedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(firestore, this.membersCollection), memberData);
      console.log('Team member added successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw new Error(`Failed to add team member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get team members
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const q = query(
        collection(firestore, this.membersCollection),
        where('teamId', '==', teamId),
        orderBy('joinedAt', 'asc')
      );

      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      const members: TeamMember[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        members.push({
          id: doc.id,
          ...data,
          joinedAt: data.joinedAt?.toDate() || new Date()
        } as TeamMember);
      });

      return members;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw new Error(`Failed to fetch team members: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update team member role
  async updateTeamMemberRole(memberId: string, role: TeamRole): Promise<void> {
    try {
      const docRef = doc(firestore, this.membersCollection, memberId);
      await updateDoc(docRef, { role });
      console.log('Team member role updated successfully:', memberId);
    } catch (error) {
      console.error('Error updating team member role:', error);
      throw new Error(`Failed to update team member role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Remove team member
  async removeTeamMember(memberId: string): Promise<void> {
    try {
      const docRef = doc(firestore, this.membersCollection, memberId);
      await deleteDoc(docRef);
      console.log('Team member removed successfully:', memberId);
    } catch (error) {
      console.error('Error removing team member:', error);
      throw new Error(`Failed to remove team member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete all team members (helper method)
  private async deleteAllTeamMembers(teamId: string): Promise<void> {
    try {
      const q = query(
        collection(firestore, this.membersCollection),
        where('teamId', '==', teamId)
      );

      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
      console.log('All team members deleted for team:', teamId);
    } catch (error) {
      console.error('Error deleting team members:', error);
      throw new Error(`Failed to delete team members: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get teams by user ID
  async getTeamsByUserId(userId: string): Promise<Team[]> {
    try {
      // First get team memberships for the user
      const memberQuery = query(
        collection(firestore, this.membersCollection),
        where('userId', '==', userId)
      );

      const memberSnapshot: QuerySnapshot<DocumentData> = await getDocs(memberQuery);
      const teamIds = memberSnapshot.docs.map(doc => doc.data().teamId);

      if (teamIds.length === 0) {
        return [];
      }

      // Then get the teams
      const teams: Team[] = [];
      for (const teamId of teamIds) {
        const team = await this.getTeamById(teamId);
        if (team) {
          teams.push(team);
        }
      }

      return teams;
    } catch (error) {
      console.error('Error fetching teams by user ID:', error);
      throw new Error(`Failed to fetch teams by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const firebaseTeamService = new FirebaseTeamService();
