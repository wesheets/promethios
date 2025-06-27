/**
 * Session Manager Service
 * Handles multi-agent chat session lifecycle, safety controls, and emergency stops
 */

const { v4: uuidv4 } = require('uuid');

class SessionManager {
  constructor() {
    // In-memory storage for sessions (in production, use Redis or database)
    this.sessions = new Map();
    this.activeRequests = new Map(); // Track ongoing OpenAI requests
    this.sessionTimeouts = new Map(); // Track session timeout timers
    
    // Configuration
    this.config = {
      defaultSessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxSessionTimeout: 120 * 60 * 1000, // 2 hours
      defaultMessageLimit: 50,
      maxMessageLimit: 200,
      maxConcurrentSessions: 100,
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      loopDetectionThreshold: 3, // Number of similar responses to detect loops
    };
    
    // Start cleanup interval
    this.startCleanupInterval();
    
    console.log('🛡️ SessionManager initialized with safety controls');
  }

  /**
   * Create a new chat session
   */
  createSession(systemId, systemName, userId, options = {}) {
    const sessionId = `session_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    
    const session = {
      id: sessionId,
      systemId,
      systemName,
      userId,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      messageLimit: options.messageLimit || this.config.defaultMessageLimit,
      sessionTimeout: options.sessionTimeout || this.config.defaultSessionTimeout,
      governanceEnabled: options.governanceEnabled !== false,
      messages: [],
      metadata: options.metadata || {},
      
      // Safety tracking
      emergencyStop: false,
      stopReason: null,
      costTracking: {
        estimatedTokens: 0,
        estimatedCost: 0,
        requestCount: 0
      },
      
      // Loop detection
      recentResponses: [],
      loopDetected: false
    };
    
    // Store session
    this.sessions.set(sessionId, session);
    
    // Set session timeout
    this.setSessionTimeout(sessionId, session.sessionTimeout);
    
    console.log(`🛡️ Created session ${sessionId} for system ${systemName} (user: ${userId})`);
    
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Update session activity
   */
  updateSessionActivity(sessionId, messageCount = null) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.lastActivity = new Date().toISOString();
    if (messageCount !== null) {
      session.messageCount = messageCount;
    }
    
    // Check message limit
    if (session.messageCount >= session.messageLimit) {
      this.terminateSession(sessionId, 'message_limit_reached');
      return false;
    }
    
    return true;
  }

  /**
   * Emergency stop a session
   */
  emergencyStop(sessionId, reason = 'user_emergency_stop') {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`🚨 Emergency stop requested for non-existent session: ${sessionId}`);
      return false;
    }
    
    console.log(`🚨 EMERGENCY STOP: Session ${sessionId} - Reason: ${reason}`);
    
    // Mark session as emergency stopped
    session.emergencyStop = true;
    session.stopReason = reason;
    session.status = 'emergency_stopped';
    session.stoppedAt = new Date().toISOString();
    
    // Cancel any ongoing requests for this session
    this.cancelActiveRequests(sessionId);
    
    // Clear session timeout
    this.clearSessionTimeout(sessionId);
    
    console.log(`🚨 Session ${sessionId} emergency stopped successfully`);
    return true;
  }

  /**
   * Terminate a session normally
   */
  terminateSession(sessionId, reason = 'normal_termination') {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    console.log(`🛡️ Terminating session ${sessionId} - Reason: ${reason}`);
    
    session.status = 'terminated';
    session.stopReason = reason;
    session.terminatedAt = new Date().toISOString();
    
    // Cancel any ongoing requests
    this.cancelActiveRequests(sessionId);
    
    // Clear session timeout
    this.clearSessionTimeout(sessionId);
    
    return true;
  }

  /**
   * Track an active OpenAI request
   */
  trackActiveRequest(sessionId, requestId, abortController) {
    if (!this.activeRequests.has(sessionId)) {
      this.activeRequests.set(sessionId, new Map());
    }
    
    this.activeRequests.get(sessionId).set(requestId, {
      id: requestId,
      startTime: Date.now(),
      abortController,
      sessionId
    });
    
    console.log(`🔄 Tracking active request ${requestId} for session ${sessionId}`);
  }

  /**
   * Remove completed request from tracking
   */
  removeActiveRequest(sessionId, requestId) {
    const sessionRequests = this.activeRequests.get(sessionId);
    if (sessionRequests) {
      sessionRequests.delete(requestId);
      if (sessionRequests.size === 0) {
        this.activeRequests.delete(sessionId);
      }
    }
  }

  /**
   * Cancel all active requests for a session
   */
  cancelActiveRequests(sessionId) {
    const sessionRequests = this.activeRequests.get(sessionId);
    if (!sessionRequests) return;
    
    console.log(`🚨 Cancelling ${sessionRequests.size} active requests for session ${sessionId}`);
    
    for (const [requestId, request] of sessionRequests) {
      try {
        request.abortController.abort();
        console.log(`🚨 Cancelled request ${requestId}`);
      } catch (error) {
        console.warn(`🚨 Failed to cancel request ${requestId}:`, error.message);
      }
    }
    
    this.activeRequests.delete(sessionId);
  }

  /**
   * Check if session can accept new requests
   */
  canAcceptRequest(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    // Check if session is stopped
    if (session.emergencyStop || session.status !== 'active') {
      return false;
    }
    
    // Check message limit
    if (session.messageCount >= session.messageLimit) {
      this.terminateSession(sessionId, 'message_limit_reached');
      return false;
    }
    
    // Check for loop detection
    if (session.loopDetected) {
      this.terminateSession(sessionId, 'loop_detected');
      return false;
    }
    
    return true;
  }

  /**
   * Add response for loop detection
   */
  addResponseForLoopDetection(sessionId, response) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    // Keep only recent responses for comparison
    session.recentResponses.push({
      content: response.substring(0, 200), // First 200 chars for comparison
      timestamp: Date.now()
    });
    
    // Keep only last 5 responses
    if (session.recentResponses.length > 5) {
      session.recentResponses.shift();
    }
    
    // Check for loops (similar responses)
    if (session.recentResponses.length >= this.config.loopDetectionThreshold) {
      const recent = session.recentResponses.slice(-this.config.loopDetectionThreshold);
      const similarities = this.calculateSimilarities(recent);
      
      if (similarities > 0.8) { // 80% similarity threshold
        console.warn(`🔄 Loop detected in session ${sessionId}`);
        session.loopDetected = true;
      }
    }
  }

  /**
   * Calculate similarity between recent responses
   */
  calculateSimilarities(responses) {
    if (responses.length < 2) return 0;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < responses.length - 1; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        const similarity = this.stringSimilarity(responses[i].content, responses[j].content);
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  stringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Set session timeout
   */
  setSessionTimeout(sessionId, timeoutMs) {
    // Clear existing timeout
    this.clearSessionTimeout(sessionId);
    
    const timeout = setTimeout(() => {
      console.log(`⏰ Session ${sessionId} timed out after ${timeoutMs}ms`);
      this.terminateSession(sessionId, 'session_timeout');
    }, timeoutMs);
    
    this.sessionTimeouts.set(sessionId, timeout);
  }

  /**
   * Clear session timeout
   */
  clearSessionTimeout(sessionId) {
    const timeout = this.sessionTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.sessionTimeouts.delete(sessionId);
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions() {
    const activeSessions = [];
    for (const [sessionId, session] of this.sessions) {
      if (session.status === 'active') {
        activeSessions.push({
          id: sessionId,
          systemName: session.systemName,
          userId: session.userId,
          messageCount: session.messageCount,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
        });
      }
    }
    return activeSessions;
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const stats = {
      total: this.sessions.size,
      active: 0,
      terminated: 0,
      emergencyStopped: 0,
      activeRequests: 0
    };
    
    for (const session of this.sessions.values()) {
      switch (session.status) {
        case 'active':
          stats.active++;
          break;
        case 'terminated':
          stats.terminated++;
          break;
        case 'emergency_stopped':
          stats.emergencyStopped++;
          break;
      }
    }
    
    // Count active requests
    for (const sessionRequests of this.activeRequests.values()) {
      stats.activeRequests += sessionRequests.size;
    }
    
    return stats;
  }

  /**
   * Cleanup old sessions
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    let cleaned = 0;
    
    for (const [sessionId, session] of this.sessions) {
      const sessionAge = now - new Date(session.createdAt).getTime();
      
      if (sessionAge > maxAge && session.status !== 'active') {
        this.sessions.delete(sessionId);
        this.clearSessionTimeout(sessionId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old sessions`);
    }
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Get session by system ID (for observer endpoints)
   */
  getSessionBySystemId(systemId) {
    for (const session of this.sessions.values()) {
      if (session.systemId === systemId) {
        return session;
      }
    }
    return null;
  }

  /**
   * Force cleanup all sessions (for testing)
   */
  forceCleanup() {
    console.log('🧹 Force cleaning all sessions');
    
    // Cancel all active requests
    for (const sessionId of this.activeRequests.keys()) {
      this.cancelActiveRequests(sessionId);
    }
    
    // Clear all timeouts
    for (const sessionId of this.sessionTimeouts.keys()) {
      this.clearSessionTimeout(sessionId);
    }
    
    // Clear all sessions
    this.sessions.clear();
    this.activeRequests.clear();
    this.sessionTimeouts.clear();
  }
}

// Export singleton instance
module.exports = new SessionManager();

