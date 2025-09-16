/**
 * Organizational Chart RAG Service
 * 
 * Provides organizational context intelligence to agents, enabling them to understand
 * company structure, user relationships, and provide contextually appropriate responses.
 */

import { unifiedStorage } from './UnifiedStorageService';

export interface OrgChartUser {
  id: string;
  userId: string; // Links to actual user account
  name: string;
  email: string;
  title: string;
  department: string;
  level: number; // 1=CEO, 2=VP, 3=Director, 4=Manager, 5=Individual Contributor
  reportsTo?: string; // Manager's user ID
  directReports: string[]; // Array of user IDs
  skills: string[];
  projects: string[];
  location: string;
  timezone: string;
  startDate: string;
  profileImage?: string;
  phoneNumber?: string;
  slackId?: string;
  teamsId?: string;
  status: 'active' | 'inactive' | 'on_leave';
  clearanceLevel: number; // 1-5, for security/access control
  costCenter?: string;
  employeeType: 'full_time' | 'part_time' | 'contractor' | 'intern';
  tags: string[];
  lastUpdated: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  headOfDepartment: string; // User ID
  parentDepartment?: string;
  subDepartments: string[];
  budget?: number;
  headcount: number;
  location: string;
  costCenter: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  projectManager: string; // User ID
  teamMembers: string[]; // Array of user IDs
  departments: string[]; // Involved departments
  priority: 'low' | 'medium' | 'high' | 'critical';
  budget?: number;
  tags: string[];
}

export interface UserContext {
  user: OrgChartUser;
  manager?: OrgChartUser;
  directReports: OrgChartUser[];
  peers: OrgChartUser[]; // Same level, same department
  department: Department;
  projects: Project[];
  relationshipToAgent?: 'owner' | 'teammate' | 'manager' | 'report' | 'peer' | 'external';
  accessLevel: 'full' | 'limited' | 'restricted';
  contextualInfo: {
    canApprove: string[]; // What this user can approve
    needsApprovalFrom: string[]; // Who can approve for this user
    collaboratesWith: string[]; // Frequent collaborators
    expertise: string[]; // Areas of expertise
    currentWorkload: 'light' | 'normal' | 'heavy' | 'overloaded';
  };
}

export interface OrgChartImport {
  users: Omit<OrgChartUser, 'id' | 'lastUpdated'>[];
  departments: Omit<Department, 'id'>[];
  projects?: Omit<Project, 'id'>[];
  importSettings: {
    overwriteExisting: boolean;
    validateHierarchy: boolean;
    createMissingDepartments: boolean;
  };
}

class OrgChartRAGService {
  private readonly ORG_USERS_PREFIX = 'org_chart_users';
  private readonly DEPARTMENTS_PREFIX = 'org_departments';
  private readonly PROJECTS_PREFIX = 'org_projects';
  private readonly ORG_SETTINGS_PREFIX = 'org_settings';

  /**
   * Import organizational data from CSV/JSON
   */
  async importOrgChart(
    organizationId: string,
    importData: OrgChartImport
  ): Promise<{
    usersImported: number;
    departmentsImported: number;
    projectsImported: number;
    errors: string[];
  }> {
    try {
      console.log('📊 Starting org chart import...');
      
      const errors: string[] = [];
      let usersImported = 0;
      let departmentsImported = 0;
      let projectsImported = 0;

      // Import departments first
      for (const deptData of importData.departments) {
        try {
          const department: Department = {
            ...deptData,
            id: `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
          
          const storageKey = `${organizationId}_${department.id}`;
          await unifiedStorage.setItem(this.DEPARTMENTS_PREFIX, storageKey, department);
          departmentsImported++;
        } catch (error) {
          errors.push(`Department import failed: ${deptData.name} - ${error}`);
        }
      }

      // Import users
      for (const userData of importData.users) {
        try {
          const user: OrgChartUser = {
            ...userData,
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            lastUpdated: new Date().toISOString()
          };
          
          const storageKey = `${organizationId}_${user.id}`;
          await unifiedStorage.setItem(this.ORG_USERS_PREFIX, storageKey, user);
          usersImported++;
        } catch (error) {
          errors.push(`User import failed: ${userData.name} - ${error}`);
        }
      }

      // Import projects if provided
      if (importData.projects) {
        for (const projectData of importData.projects) {
          try {
            const project: Project = {
              ...projectData,
              id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            const storageKey = `${organizationId}_${project.id}`;
            await unifiedStorage.setItem(this.PROJECTS_PREFIX, storageKey, project);
            projectsImported++;
          } catch (error) {
            errors.push(`Project import failed: ${projectData.name} - ${error}`);
          }
        }
      }

      console.log('✅ Org chart import completed:', {
        usersImported,
        departmentsImported,
        projectsImported,
        errors: errors.length
      });

      return {
        usersImported,
        departmentsImported,
        projectsImported,
        errors
      };

    } catch (error) {
      console.error('❌ Org chart import failed:', error);
      throw error;
    }
  }

  /**
   * Get user context for agent interaction
   */
  async getUserContext(
    organizationId: string,
    userId: string,
    agentId?: string
  ): Promise<UserContext | null> {
    try {
      console.log('👤 Getting user context for:', userId);

      // Find user in org chart
      const allUsers = await unifiedStorage.getAllItems(this.ORG_USERS_PREFIX);
      const orgUsers = Object.entries(allUsers)
        .filter(([key, _]) => key.startsWith(`${organizationId}_`))
        .map(([_, user]) => user as OrgChartUser);

      const user = orgUsers.find(u => u.userId === userId || u.id === userId);
      if (!user) {
        console.log('⚠️ User not found in org chart:', userId);
        return null;
      }

      // Get manager
      const manager = user.reportsTo ? 
        orgUsers.find(u => u.id === user.reportsTo) : undefined;

      // Get direct reports
      const directReports = orgUsers.filter(u => u.reportsTo === user.id);

      // Get peers (same level, same department)
      const peers = orgUsers.filter(u => 
        u.department === user.department && 
        u.level === user.level && 
        u.id !== user.id
      );

      // Get department info
      const allDepartments = await unifiedStorage.getAllItems(this.DEPARTMENTS_PREFIX);
      const departments = Object.entries(allDepartments)
        .filter(([key, _]) => key.startsWith(`${organizationId}_`))
        .map(([_, dept]) => dept as Department);
      
      const department = departments.find(d => d.name === user.department);

      // Get projects
      const allProjects = await unifiedStorage.getAllItems(this.PROJECTS_PREFIX);
      const projects = Object.entries(allProjects)
        .filter(([key, _]) => key.startsWith(`${organizationId}_`))
        .map(([_, proj]) => proj as Project)
        .filter(p => 
          p.teamMembers.includes(user.id) || 
          p.projectManager === user.id
        );

      // Determine relationship to agent (if agent context provided)
      let relationshipToAgent: UserContext['relationshipToAgent'] = 'external';
      if (agentId) {
        // This would be determined by agent ownership/assignment logic
        relationshipToAgent = 'teammate'; // Default for now
      }

      // Determine access level based on clearance and relationship
      let accessLevel: UserContext['accessLevel'] = 'limited';
      if (user.clearanceLevel >= 4) {
        accessLevel = 'full';
      } else if (user.clearanceLevel <= 2) {
        accessLevel = 'restricted';
      }

      // Build contextual information
      const contextualInfo = {
        canApprove: this.getApprovalCapabilities(user, orgUsers),
        needsApprovalFrom: this.getApprovalRequirements(user, orgUsers),
        collaboratesWith: this.getFrequentCollaborators(user, projects, orgUsers),
        expertise: user.skills,
        currentWorkload: this.assessWorkload(user, projects)
      };

      const context: UserContext = {
        user,
        manager,
        directReports,
        peers,
        department: department || {
          id: 'unknown',
          name: user.department,
          description: 'Department information not available',
          headOfDepartment: '',
          subDepartments: [],
          headcount: 0,
          location: user.location,
          costCenter: ''
        },
        projects,
        relationshipToAgent,
        accessLevel,
        contextualInfo
      };

      console.log('✅ User context retrieved:', {
        user: user.name,
        department: user.department,
        level: user.level,
        projectCount: projects.length,
        directReports: directReports.length
      });

      return context;

    } catch (error) {
      console.error('❌ Failed to get user context:', error);
      return null;
    }
  }

  /**
   * Generate contextual prompt for agent
   */
  async generateContextualPrompt(
    organizationId: string,
    userId: string,
    agentId: string,
    basePrompt: string
  ): Promise<string> {
    try {
      const userContext = await this.getUserContext(organizationId, userId, agentId);
      
      if (!userContext) {
        return basePrompt + '\n\n[Note: User organizational context not available]';
      }

      const contextPrompt = `

=== ORGANIZATIONAL CONTEXT ===
You are speaking with: ${userContext.user.name}
Title: ${userContext.user.title}
Department: ${userContext.user.department}
Level: ${this.getLevelDescription(userContext.user.level)}
Location: ${userContext.user.location}

REPORTING STRUCTURE:
${userContext.manager ? `Reports to: ${userContext.manager.name} (${userContext.manager.title})` : 'No direct manager (likely senior leadership)'}
${userContext.directReports.length > 0 ? `Manages: ${userContext.directReports.map(r => r.name).join(', ')}` : 'No direct reports'}

CURRENT PROJECTS:
${userContext.projects.length > 0 ? 
  userContext.projects.map(p => `- ${p.name} (${p.status})`).join('\n') : 
  'No active projects visible'
}

EXPERTISE & SKILLS:
${userContext.user.skills.join(', ')}

CONTEXTUAL GUIDANCE:
- Adjust technical depth based on their role and expertise
- Consider their approval authority: ${userContext.contextualInfo.canApprove.join(', ') || 'Limited approval authority'}
- Be aware of their workload: ${userContext.contextualInfo.currentWorkload}
- Frequent collaborators: ${userContext.contextualInfo.collaboratesWith.join(', ') || 'None identified'}

ACCESS LEVEL: ${userContext.accessLevel.toUpperCase()}
${userContext.accessLevel === 'restricted' ? '⚠️ Provide only general information - user has restricted access' : ''}
${userContext.accessLevel === 'full' ? '✅ User has full access - can discuss sensitive topics' : ''}

=== END ORGANIZATIONAL CONTEXT ===

`;

      return basePrompt + contextPrompt;

    } catch (error) {
      console.error('❌ Failed to generate contextual prompt:', error);
      return basePrompt + '\n\n[Note: Error retrieving organizational context]';
    }
  }

  /**
   * Search org chart
   */
  async searchOrgChart(
    organizationId: string,
    query: string,
    filters: {
      departments?: string[];
      levels?: number[];
      skills?: string[];
      projects?: string[];
      status?: string[];
    } = {}
  ): Promise<OrgChartUser[]> {
    try {
      const allUsers = await unifiedStorage.getAllItems(this.ORG_USERS_PREFIX);
      let orgUsers = Object.entries(allUsers)
        .filter(([key, _]) => key.startsWith(`${organizationId}_`))
        .map(([_, user]) => user as OrgChartUser);

      // Apply filters
      if (filters.departments?.length) {
        orgUsers = orgUsers.filter(user => 
          filters.departments!.includes(user.department)
        );
      }

      if (filters.levels?.length) {
        orgUsers = orgUsers.filter(user => 
          filters.levels!.includes(user.level)
        );
      }

      if (filters.skills?.length) {
        orgUsers = orgUsers.filter(user => 
          filters.skills!.some(skill => 
            user.skills.some(userSkill => 
              userSkill.toLowerCase().includes(skill.toLowerCase())
            )
          )
        );
      }

      if (filters.status?.length) {
        orgUsers = orgUsers.filter(user => 
          filters.status!.includes(user.status)
        );
      }

      // Apply text search
      if (query.trim()) {
        const queryLower = query.toLowerCase();
        orgUsers = orgUsers.filter(user => 
          user.name.toLowerCase().includes(queryLower) ||
          user.title.toLowerCase().includes(queryLower) ||
          user.department.toLowerCase().includes(queryLower) ||
          user.skills.some(skill => skill.toLowerCase().includes(queryLower)) ||
          user.email.toLowerCase().includes(queryLower)
        );
      }

      return orgUsers.slice(0, 50); // Limit results

    } catch (error) {
      console.error('❌ Org chart search failed:', error);
      return [];
    }
  }

  /**
   * Get approval capabilities for a user
   */
  private getApprovalCapabilities(user: OrgChartUser, allUsers: OrgChartUser[]): string[] {
    const capabilities: string[] = [];

    // Based on level and role
    if (user.level <= 2) {
      capabilities.push('Budget approvals', 'Strategic decisions', 'Hiring decisions');
    } else if (user.level <= 3) {
      capabilities.push('Department budget', 'Team hiring', 'Project approvals');
    } else if (user.level <= 4) {
      capabilities.push('Team expenses', 'Time off', 'Small purchases');
    }

    // Based on title keywords
    const titleLower = user.title.toLowerCase();
    if (titleLower.includes('finance') || titleLower.includes('accounting')) {
      capabilities.push('Financial approvals', 'Expense reports');
    }
    if (titleLower.includes('hr') || titleLower.includes('people')) {
      capabilities.push('HR policies', 'Employee issues');
    }
    if (titleLower.includes('legal')) {
      capabilities.push('Legal reviews', 'Contract approvals');
    }

    return capabilities;
  }

  /**
   * Get approval requirements for a user
   */
  private getApprovalRequirements(user: OrgChartUser, allUsers: OrgChartUser[]): string[] {
    const requirements: string[] = [];

    if (user.reportsTo) {
      const manager = allUsers.find(u => u.id === user.reportsTo);
      if (manager) {
        requirements.push(`Manager: ${manager.name}`);
      }
    }

    // Based on level
    if (user.level >= 4) {
      requirements.push('Department head approval for budget items');
    }
    if (user.level >= 5) {
      requirements.push('Manager approval for most decisions');
    }

    return requirements;
  }

  /**
   * Get frequent collaborators
   */
  private getFrequentCollaborators(
    user: OrgChartUser, 
    projects: Project[], 
    allUsers: OrgChartUser[]
  ): string[] {
    const collaboratorIds = new Set<string>();

    // From projects
    projects.forEach(project => {
      project.teamMembers.forEach(memberId => {
        if (memberId !== user.id) {
          collaboratorIds.add(memberId);
        }
      });
    });

    // Convert IDs to names
    return Array.from(collaboratorIds)
      .map(id => allUsers.find(u => u.id === id)?.name)
      .filter(Boolean) as string[];
  }

  /**
   * Assess current workload
   */
  private assessWorkload(user: OrgChartUser, projects: Project[]): 'light' | 'normal' | 'heavy' | 'overloaded' {
    const activeProjects = projects.filter(p => p.status === 'active').length;
    
    if (activeProjects === 0) return 'light';
    if (activeProjects <= 2) return 'normal';
    if (activeProjects <= 4) return 'heavy';
    return 'overloaded';
  }

  /**
   * Get level description
   */
  private getLevelDescription(level: number): string {
    const descriptions = {
      1: 'Executive Leadership (CEO/President)',
      2: 'Senior Leadership (VP/SVP)',
      3: 'Director Level',
      4: 'Manager Level',
      5: 'Individual Contributor'
    };
    return descriptions[level as keyof typeof descriptions] || `Level ${level}`;
  }

  /**
   * Get organizational statistics
   */
  async getOrgStats(organizationId: string): Promise<{
    totalEmployees: number;
    departmentCount: number;
    activeProjects: number;
    averageTeamSize: number;
    levelDistribution: Record<number, number>;
    departmentSizes: Record<string, number>;
  }> {
    try {
      const allUsers = await unifiedStorage.getAllItems(this.ORG_USERS_PREFIX);
      const orgUsers = Object.entries(allUsers)
        .filter(([key, _]) => key.startsWith(`${organizationId}_`))
        .map(([_, user]) => user as OrgChartUser)
        .filter(user => user.status === 'active');

      const allProjects = await unifiedStorage.getAllItems(this.PROJECTS_PREFIX);
      const activeProjects = Object.entries(allProjects)
        .filter(([key, _]) => key.startsWith(`${organizationId}_`))
        .map(([_, project]) => project as Project)
        .filter(project => project.status === 'active').length;

      const levelDistribution = orgUsers.reduce((acc, user) => {
        acc[user.level] = (acc[user.level] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const departmentSizes = orgUsers.reduce((acc, user) => {
        acc[user.department] = (acc[user.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const managersWithReports = orgUsers.filter(user => user.directReports.length > 0);
      const totalReports = managersWithReports.reduce((sum, manager) => sum + manager.directReports.length, 0);
      const averageTeamSize = managersWithReports.length > 0 ? totalReports / managersWithReports.length : 0;

      return {
        totalEmployees: orgUsers.length,
        departmentCount: Object.keys(departmentSizes).length,
        activeProjects,
        averageTeamSize: Math.round(averageTeamSize * 10) / 10,
        levelDistribution,
        departmentSizes
      };

    } catch (error) {
      console.error('❌ Failed to get org stats:', error);
      return {
        totalEmployees: 0,
        departmentCount: 0,
        activeProjects: 0,
        averageTeamSize: 0,
        levelDistribution: {},
        departmentSizes: {}
      };
    }
  }
}

export const orgChartRAGService = new OrgChartRAGService();
export default orgChartRAGService;

