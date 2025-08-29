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

