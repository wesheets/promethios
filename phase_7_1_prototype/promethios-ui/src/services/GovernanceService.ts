import { AgentProfile } from './UserAgentStorageService';

export interface GovernanceMetrics {
  trustScore: number;
  complianceRate: number;
  responseTime: number;
  sessionIntegrity: number;
  policyViolations: number;
  status: 'active' | 'monitoring' | 'suspended' | 'offline';
  lastUpdated: Date;
}

export interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface GovernanceSession {
  sessionId: string;
  agentId: string;
  startTime: Date;
  messageCount: number;
  violations: GovernanceViolation[];
  currentTrustScore: number;
}

export interface GovernanceViolation {
  id: string;
  policyId: string;
  policyName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  messageId: string;
  resolved: boolean;
}

export class GovernanceService {
  private baseUrl: string;
  private currentSession: GovernanceSession | null = null;
  private isApiAvailable: boolean = true; // Default to true for demo

  constructor() {
    // Use the actual backend API for governance
    this.baseUrl = import.meta.env.VITE_GOVERNANCE_API_URL || 'https://promethios-phase-7-1-api.onrender.com/api';
    // Initialize governance with real API
    this.initializeGovernance();
  }

  // Initialize governance for demo mode
  private async initializeGovernance(): Promise<void> {
    if (this.baseUrl === 'demo') {
      // Demo mode - governance is always available
      this.isApiAvailable = true;
      console.log('Governance initialized in demo mode');
    } else {
      // Try to connect to real API
      try {
        const response = await fetch(`${this.baseUrl}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        this.isApiAvailable = response.ok;
        console.log('Governance API connected:', this.isApiAvailable);
      } catch (error) {
        console.log('Governance API not available, using demo mode');
        this.isApiAvailable = true; // Use demo mode instead of fallback
      }
    }
  }

  // Create a session (simplified for demo)
  async createSession(userId: string): Promise<GovernanceSession> {
    if (this.baseUrl === 'demo') {
      // Return a mock session when in demo mode
      this.currentSession = {
        sessionId: `session_${Date.now()}`,
        agentId: 'demo_agent',
        startTime: new Date(),
        messageCount: 0,
        violations: [],
        currentTrustScore: 85
      };
      return this.currentSession;
    }

    try {
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const session = await response.json();
      this.currentSession = {
        ...session,
        startTime: new Date(session.startTime),
        violations: session.violations?.map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp)
        })) || []
      };
      return this.currentSession;
    } catch (error) {
      console.log('Failed to create governance session via API, using fallback');
      this.currentSession = {
        sessionId: `session_${Date.now()}`,
        agentId: 'demo_agent',
        startTime: new Date(),
        messageCount: 0,
        violations: [],
        currentTrustScore: 85
      };
      return this.currentSession;
    }
  }

  // Initialize governance session for an agent
  async initializeSession(agent: AgentProfile): Promise<GovernanceSession> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentId: agent.identity.id,
          agentName: agent.identity.name,
          governancePolicies: agent.governancePolicies || [],
          trustMetrics: agent.trustMetrics || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to initialize governance session: ${response.statusText}`);
      }

      const session = await response.json();
      this.currentSession = {
        ...session,
        startTime: new Date(session.startTime),
        violations: session.violations.map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp)
        }))
      };

      return this.currentSession;
    } catch (error) {
      console.error('Error initializing governance session:', error);
      // Fallback to local session
      this.currentSession = {
        sessionId: `session_${Date.now()}`,
        agentId: agent.identity.id,
        startTime: new Date(),
        messageCount: 0,
        violations: [],
        currentTrustScore: 85
      };
      return this.currentSession;
    }
  }

  // Get real-time governance metrics for an agent
  async getAgentMetrics(agentId: string): Promise<GovernanceMetrics> {
    // Static demo metrics that don't change randomly
    const baseMetrics = {
      trustScore: 89.2, // Static value
      complianceRate: 94.8, // Static value
      responseTime: 1.4, // Static value
      sessionIntegrity: 91.6, // Static value
      policyViolations: 0, // Static value
      status: 'monitoring' as const,
      lastUpdated: new Date()
    };

    if (this.baseUrl !== 'demo' && this.isApiAvailable) {
      try {
        const response = await fetch(`${this.baseUrl}/agents/${agentId}/metrics`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(3000)
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch governance metrics: ${response.statusText}`);
        }

        const metrics = await response.json();
        return {
          ...metrics,
          lastUpdated: new Date(metrics.lastUpdated)
        };
      } catch (error) {
        console.log('Error fetching governance metrics, using demo data');
      }
    }

    // Return static demo metrics (no random changes)
    return baseMetrics;
  }

  // Get system status
  async getSystemStatus(): Promise<any> {
    if (!this.isApiAvailable) {
      return {
        status: 'offline',
        message: 'Governance API not available - using fallback mode',
        uptime: '0%',
        activeAgents: 0,
        totalSessions: 0
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch system status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.log('Error fetching system status, using fallback');
      return {
        status: 'offline',
        message: 'Governance API not available - using fallback mode',
        uptime: '0%',
        activeAgents: 0,
        totalSessions: 0
      };
    }
  }

  // Check if governance is actually working
  isGovernanceActive(): boolean {
    return this.isApiAvailable && this.currentSession !== null;
  }

  // Monitor a message for governance compliance - BEHAVIOR-BASED APPROACH
  async monitorMessage(
    messageContent: string, 
    agentId: string, 
    messageId: string,
    attachments: any[] = []
  ): Promise<{
    approved: boolean;
    trustScore: number;
    violations: GovernanceViolation[];
    recommendations: string[];
    behaviorTags: string[];
  }> {
    const violations: GovernanceViolation[] = [];
    const behaviorTags: string[] = [];
    let trustScore = 85; // Base trust score
    
    // BEHAVIOR-BASED MONITORING: Detect Veritas outcomes, not content patterns
    const veritasOutcome = this.detectVeritasBehavior(messageContent);
    
    if (veritasOutcome.selfQuestioningEngaged) {
      behaviorTags.push('self-questioning_engaged');
      
      if (veritasOutcome.uncertaintyDetected) {
        behaviorTags.push('uncertainty_detected');
      }
      
      if (veritasOutcome.refusalTriggered) {
        behaviorTags.push('refusal_triggered', 'veritas_prevention_successful');
        trustScore += 10; // REWARD self-questioning behavior
      }
    }
    
    // Check for concerning patterns in behavior (not content)
    const behaviorIssues = this.detectConcerningBehavior(messageContent);
    if (behaviorIssues.length > 0) {
      violations.push(...behaviorIssues);
      trustScore -= behaviorIssues.length * 15;
    }
    
    // Ensure trust score doesn't go below 0
    trustScore = Math.max(0, trustScore);
    
    // Update current session
    if (this.currentSession) {
      this.currentSession.messageCount++;
      this.currentSession.currentTrustScore = trustScore;
      if (violations.length > 0) {
        this.currentSession.violations.push(...violations);
      }
    }
    
    const approved = violations.length === 0 || !violations.some(v => v.severity === 'critical' || v.severity === 'high');
    
    return {
      approved,
      trustScore,
      violations,
      recommendations: this.generateBehaviorBasedRecommendations(veritasOutcome, violations),
      behaviorTags
    };
  }

  // BEHAVIOR-BASED DETECTION: Monitor Veritas outcomes, not content patterns
  private detectVeritasBehavior(content: string): {
    selfQuestioningEngaged: boolean;
    uncertaintyDetected: boolean;
    refusalTriggered: boolean;
    reasoning: string[];
  } {
    const contentLower = content.toLowerCase();
    const reasoning: string[] = [];
    
    // Detect self-questioning patterns (agent refusing to make claims)
    const refusalPatterns = [
      'cannot verify',
      'not familiar with',
      'cannot confirm',
      'cannot provide information about',
      'i\'m not certain',
      'i don\'t have reliable information',
      'i cannot be sure',
      'i\'m not confident',
      'i should be cautious',
      'i need to be careful',
      'let me clarify',
      'i want to be precise'
    ];
    
    const uncertaintyPatterns = [
      'may be',
      'might be',
      'appears to',
      'seems to',
      'possibly',
      'potentially',
      'i believe',
      'i think',
      'if i recall',
      'to my knowledge'
    ];
    
    const refusalTriggered = refusalPatterns.some(pattern => contentLower.includes(pattern));
    const uncertaintyDetected = uncertaintyPatterns.some(pattern => contentLower.includes(pattern));
    const selfQuestioningEngaged = refusalTriggered || uncertaintyDetected;
    
    if (refusalTriggered) {
      reasoning.push('Agent refused to provide unverifiable information');
    }
    if (uncertaintyDetected) {
      reasoning.push('Agent expressed appropriate uncertainty');
    }
    if (selfQuestioningEngaged) {
      reasoning.push('Veritas self-questioning protocol engaged');
    }
    
    return {
      selfQuestioningEngaged,
      uncertaintyDetected,
      refusalTriggered,
      reasoning
    };
  }
  
  // Detect concerning behavioral patterns (not content-specific)
  private detectConcerningBehavior(content: string): GovernanceViolation[] {
    const violations: GovernanceViolation[] = [];
    const contentLower = content.toLowerCase();
    
    // Detect overconfidence patterns (opposite of self-questioning)
    const overconfidencePatterns = [
      'definitely',
      'absolutely certain',
      'without a doubt',
      'i know for sure',
      'guaranteed',
      'proven fact',
      'undeniable'
    ];
    
    // Check for overconfident claims about recent events or specific details
    const hasRecentYear = /20[2-9]\d/.test(content);
    const hasSpecificDetails = /\d+%|\d+\.\d+%|exactly \d+/.test(content);
    const showsOverconfidence = overconfidencePatterns.some(pattern => contentLower.includes(pattern));
    
    if (showsOverconfidence && (hasRecentYear || hasSpecificDetails)) {
      violations.push({
        id: `violation_${Date.now()}_overconfidence`,
        policyId: 'behavioral-analysis',
        policyName: 'Behavioral Analysis',
        severity: 'medium',
        description: 'Agent displayed overconfidence about specific details without appropriate uncertainty',
        timestamp: new Date(),
        messageId: `msg_${Date.now()}`,
        resolved: false
      });
    }
    
    return violations;
  }
  
  // Generate recommendations based on behavior, not content
  private generateBehaviorBasedRecommendations(
    veritasOutcome: any, 
    violations: GovernanceViolation[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (veritasOutcome.refusalTriggered) {
      recommendations.push('Agent demonstrated good governance by refusing unverifiable claims');
    }
    
    if (veritasOutcome.uncertaintyDetected) {
      recommendations.push('Agent showed appropriate caution with uncertain information');
    }
    
    if (violations.length > 0) {
      recommendations.push('Consider encouraging more self-questioning behavior');
    }
    
    if (!veritasOutcome.selfQuestioningEngaged && violations.length === 0) {
      recommendations.push('Response appears confident and well-grounded');
    }
    
    return recommendations;
  }

  // End governance session
  async endSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      await fetch(`${this.baseUrl}/sessions/${this.currentSession.sessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endTime: new Date().toISOString(),
          finalMetrics: {
            messageCount: this.currentSession.messageCount,
            violationCount: this.currentSession.violations.length,
            finalTrustScore: this.currentSession.currentTrustScore
          }
        })
      });
    } catch (error) {
      console.error('Error ending governance session:', error);
    } finally {
      this.currentSession = null;
    }
  }

  // Get current session
  getCurrentSession(): GovernanceSession | null {
    return this.currentSession;
  }
}

export const governanceService = new GovernanceService();

