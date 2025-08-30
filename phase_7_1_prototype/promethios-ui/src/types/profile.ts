/**
 * UserProfile - Unified profile type for all profile pages
 */
export interface UserProfile {
  id: string;
  name?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  coverPhoto?: string;
  headerPhoto?: string; // Added for header/cover photo
  title?: string;
  company?: string;
  location?: string;
  bio?: string;
  headline?: string;
  summary?: string;
  skills?: string[];
  aiAgents?: AIAgent[];
  aiSkills?: string[];
  experience?: Experience[];
  education?: Education[];
  languages?: string[];
  connections?: number;
  profileViews?: number;
  postImpressions?: number;
  searchAppearances?: number;
  rating?: number;
  isOnline?: boolean;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
  isPublic?: boolean;
  connectionStatus?: 'none' | 'pending' | 'connected' | 'blocked';
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  loginNotifications?: boolean;
  website?: string;
  linkedIn?: string;
  twitter?: string;
  github?: string;
  timezone?: string;
  industry?: string;
  experienceLevel?: string;
  responseTime?: number;
  collaborations?: number;
  profileURL?: string; // Auto-generated unique URL for public profile
  
  // Beta Signup & Approval System
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  signupSource?: 'waitlist' | 'invitation' | 'direct';
  signupAt?: string;
  invitedBy?: string; // User ID who invited this user
  
  // Beta Signup Form Data
  role?: string; // From "I am a..." dropdown
  whyAccess?: string; // Why they want Spark access
  organization?: string; // Their organization
  currentAiTools?: string; // Current AI tools they use
  onboardingCall?: boolean; // Whether they want an onboarding call
  socialProfile?: string; // LinkedIn or other social profile
  
  // Admin Approval Fields
  approvedBy?: string; // Admin user ID who approved
  approvedAt?: string; // Timestamp of approval
  rejectedBy?: string; // Admin user ID who rejected
  rejectedAt?: string; // Timestamp of rejection
  adminNotes?: string; // Admin notes about the user
  
  // Email Notifications
  approvalEmailSent?: boolean;
  welcomeEmailSent?: boolean;
  rejectionEmailSent?: boolean;
}

/**
 * AIAgent - Represents an AI agent associated with a user
 */
export interface AIAgent {
  id: string;
  name: string;
  type: string;
  specialization: string[];
  description?: string;
  avatar?: string;
}

/**
 * Experience - Represents a work experience entry
 */
export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

/**
 * Education - Represents an education entry
 */
export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

/**
 * Skill - Represents a skill with endorsements
 */
export interface Skill {
  id: string;
  name: string;
  endorsements: number;
}

