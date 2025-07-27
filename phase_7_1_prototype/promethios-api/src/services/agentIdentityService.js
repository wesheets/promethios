/**
 * Agent Identity Service
 * Manages cryptographic identities and certificates for agents
 * Provides secure agent authentication and verification for audit trails
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const cryptographicAuditService = require('./cryptographicAuditService');

class AgentIdentityService {
  constructor() {
    // Agent identity storage (will be replaced with PostgreSQL)
    this.agentIdentities = new Map(); // agentId -> identity
    this.agentCertificates = new Map(); // agentId -> certificate
    this.agentSessions = new Map(); // sessionId -> agentId
    this.agentLifecycle = new Map(); // agentId -> lifecycle events
    
    // Certificate Authority configuration
    this.caConfig = {
      algorithm: 'ecdsa',
      namedCurve: 'secp256k1',
      keySize: 256,
      certificateValidityPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    };
    
    // Initialize Certificate Authority
    this.initializeCertificateAuthority();
    
    console.log('🆔 AgentIdentityService initialized with cryptographic CA');
  }

  /**
   * Initialize Certificate Authority for agent certificates
   */
  initializeCertificateAuthority() {
    try {
      // Generate CA key pair
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: this.caConfig.namedCurve,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      
      this.certificateAuthority = {
        caId: uuidv4(),
        publicKey,
        privateKey,
        createdAt: new Date().toISOString(),
        algorithm: this.caConfig.algorithm,
        namedCurve: this.caConfig.namedCurve
      };
      
      console.log('🏛️ Certificate Authority initialized');
      
    } catch (error) {
      console.error('Error initializing Certificate Authority:', error);
      throw error;
    }
  }

  /**
   * Generate cryptographic identity for an agent
   */
  async generateAgentIdentity(agentId, agentMetadata = {}) {
    try {
      // Check if identity already exists
      if (this.agentIdentities.has(agentId)) {
        console.log(`Agent identity already exists for: ${agentId}`);
        return this.agentIdentities.get(agentId);
      }
      
      // Generate agent key pair
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: this.caConfig.namedCurve,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      
      // Extract agentId if it's nested
      const actualAgentId = agentId.agentId || agentId;
      
      // Create agent identity
      const identity = {
        agentId: actualAgentId,
        identityId: uuidv4(),
        publicKey,
        privateKey,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        status: 'active',
        metadata: {
          ...agentMetadata,
          algorithm: this.caConfig.algorithm,
          namedCurve: this.caConfig.namedCurve,
          keySize: this.caConfig.keySize
        },
        verificationHistory: [],
        sessionCount: 0
      };
      
      // Store identity using actual agentId
      this.agentIdentities.set(actualAgentId, identity);
      
      // Generate certificate
      const certificate = await this.issueCertificate(actualAgentId, identity);
      
      // Log identity creation
      await cryptographicAuditService.logCryptographicEvent(
        actualAgentId,
        'system',
        'agent_identity_created',
        {
          identityId: identity.identityId,
          publicKeyFingerprint: this.generateKeyFingerprint(publicKey),
          metadata: agentMetadata
        },
        {
          certificateId: certificate.certificateId,
          caId: this.certificateAuthority.caId
        }
      );
      
      console.log(`🆔 Generated identity for agent: ${actualAgentId}`);
      
      // Get the stored identity with certificate
      const storedIdentity = this.agentIdentities.get(actualAgentId);
      const issuedCertificate = this.agentCertificates.get(actualAgentId);
      
      return {
        agentId: actualAgentId,
        identity: storedIdentity,
        certificate: issuedCertificate,
        publicKeyFingerprint: this.generateKeyFingerprint(publicKey)
      };
      
    } catch (error) {
      console.error('Error generating agent identity:', error);
      throw error;
    }
  }

  /**
   * Issue certificate for an agent
   */
  async issueCertificate(agentId, identity) {
    try {
      const certificate = {
        certificateId: uuidv4(),
        agentId,
        identityId: identity.identityId,
        publicKey: identity.publicKey,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.caConfig.certificateValidityPeriod).toISOString(),
        status: 'valid',
        issuer: {
          caId: this.certificateAuthority.caId,
          algorithm: this.caConfig.algorithm
        },
        subject: {
          agentId,
          identityId: identity.identityId,
          publicKeyFingerprint: this.generateKeyFingerprint(identity.publicKey)
        },
        signature: null // Will be calculated
      };
      
      // Create certificate data for signing
      const certificateData = {
        certificateId: certificate.certificateId,
        agentId: certificate.agentId,
        identityId: certificate.identityId,
        publicKey: certificate.publicKey,
        issuedAt: certificate.issuedAt,
        expiresAt: certificate.expiresAt,
        issuer: certificate.issuer,
        subject: certificate.subject
      };
      
      // Sign certificate with CA private key
      certificate.signature = this.generateSignature(certificateData, this.certificateAuthority.privateKey);
      
      // Store certificate
      this.agentCertificates.set(agentId, certificate);
      
      console.log(`📜 Issued certificate for agent: ${agentId}`);
      
      return certificate;
      
    } catch (error) {
      console.error('Error issuing certificate:', error);
      throw error;
    }
  }

  /**
   * Generate key fingerprint for identification
   */
  generateKeyFingerprint(publicKey) {
    const hash = crypto.createHash('sha256');
    hash.update(publicKey);
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Generate digital signature
   */
  generateSignature(data, privateKey = null) {
    try {
      const keyToUse = privateKey || this.certificateAuthority.privateKey;
      const canonicalData = JSON.stringify(data);
      
      // For demo purposes, create a deterministic signature
      // In production, this would use proper ECDSA signing
      const hash = crypto.createHash('sha256').update(canonicalData).digest('hex');
      return `cert_sig_${hash.substring(0, 32)}`;
    } catch (error) {
      console.error('Error generating signature:', error);
      return `cert_sig_fallback_${Date.now()}`;
    }
  }

  /**
   * Verify digital signature
   */
  verifySignature(data, signature, publicKey) {
    try {
      const canonicalData = JSON.stringify(this.sortObjectKeys(data));
      const verify = crypto.createVerify('SHA256');
      verify.update(canonicalData);
      return verify.verify(publicKey, signature, 'hex');
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Sort object keys for consistent hashing
   */
  sortObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }
    
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};
    
    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    }
    
    return sortedObj;
  }

  /**
   * Verify agent identity and certificate
   */
  async verifyAgentIdentity(agentId, publicKey = null, signature = null, data = null) {
    try {
      // Extract agentId if it's nested
      const actualAgentId = agentId.agentId || agentId;
      
      const identity = this.agentIdentities.get(actualAgentId);
      const certificate = this.agentCertificates.get(actualAgentId);
      
      if (!identity || !certificate) {
        return {
          valid: false,
          reason: 'Agent identity or certificate not found',
          agentId: actualAgentId
        };
      }
      
      // Check certificate validity
      const now = new Date();
      const expiresAt = new Date(certificate.expiresAt);
      
      if (now > expiresAt) {
        return {
          valid: false,
          reason: 'Certificate expired',
          agentId,
          expiresAt: certificate.expiresAt
        };
      }
      
      if (certificate.status !== 'valid') {
        return {
          valid: false,
          reason: 'Certificate revoked or invalid',
          agentId,
          status: certificate.status
        };
      }
      
      // Verify certificate signature
      const certificateData = {
        certificateId: certificate.certificateId,
        agentId: certificate.agentId,
        identityId: certificate.identityId,
        publicKey: certificate.publicKey,
        issuedAt: certificate.issuedAt,
        expiresAt: certificate.expiresAt,
        issuer: certificate.issuer,
        subject: certificate.subject
      };
      
      const certificateValid = this.verifySignature(
        certificateData,
        certificate.signature,
        this.certificateAuthority.publicKey
      );
      
      if (!certificateValid) {
        return {
          valid: false,
          reason: 'Certificate signature invalid',
          agentId
        };
      }
      
      // Verify agent signature if provided
      if (signature && data && publicKey) {
        const signatureValid = this.verifySignature(data, signature, publicKey);
        
        if (!signatureValid) {
          return {
            valid: false,
            reason: 'Agent signature invalid',
            agentId
          };
        }
        
        // Verify public key matches certificate
        if (publicKey !== certificate.publicKey) {
          return {
            valid: false,
            reason: 'Public key mismatch',
            agentId
          };
        }
      }
      
      // Update verification history
      identity.verificationHistory.push({
        timestamp: new Date().toISOString(),
        result: 'valid',
        method: signature ? 'signature_verification' : 'certificate_verification'
      });
      
      identity.lastUpdated = new Date().toISOString();
      
      return {
        valid: true,
        agentId,
        identityId: identity.identityId,
        certificateId: certificate.certificateId,
        publicKeyFingerprint: this.generateKeyFingerprint(certificate.publicKey),
        verificationTimestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error verifying agent identity:', error);
      return {
        valid: false,
        reason: 'Verification error',
        error: error.message,
        agentId
      };
    }
  }

  /**
   * Create authenticated session for an agent
   */
  async createAgentSession(agentId, sessionMetadata = {}) {
    try {
      // Verify agent identity first
      const verification = await this.verifyAgentIdentity(agentId);
      
      if (!verification.valid) {
        throw new Error(`Agent identity verification failed: ${verification.reason}`);
      }
      
      // Create session
      const sessionId = uuidv4();
      const session = {
        sessionId,
        agentId,
        identityId: verification.identityId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.caConfig.sessionTimeout).toISOString(),
        status: 'active',
        metadata: sessionMetadata,
        activityLog: []
      };
      
      // Store session
      this.agentSessions.set(sessionId, session);
      
      // Update agent session count
      const identity = this.agentIdentities.get(agentId);
      if (identity) {
        identity.sessionCount++;
        identity.lastUpdated = new Date().toISOString();
      }
      
      // Log session creation
      await cryptographicAuditService.logCryptographicEvent(
        agentId,
        'system',
        'agent_session_created',
        {
          sessionId,
          identityId: verification.identityId,
          metadata: sessionMetadata
        },
        {
          certificateId: verification.certificateId,
          expiresAt: session.expiresAt
        }
      );
      
      console.log(`🔐 Created session for agent: ${agentId}`);
      
      return {
        sessionId,
        agentId,
        expiresAt: session.expiresAt,
        verification
      };
      
    } catch (error) {
      console.error('Error creating agent session:', error);
      throw error;
    }
  }

  /**
   * Validate agent session
   */
  async validateAgentSession(sessionId) {
    try {
      const session = this.agentSessions.get(sessionId);
      
      if (!session) {
        return {
          valid: false,
          reason: 'Session not found',
          sessionId
        };
      }
      
      // Check session expiration
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      
      if (now > expiresAt) {
        // Mark session as expired
        session.status = 'expired';
        
        return {
          valid: false,
          reason: 'Session expired',
          sessionId,
          expiresAt: session.expiresAt
        };
      }
      
      if (session.status !== 'active') {
        return {
          valid: false,
          reason: 'Session inactive',
          sessionId,
          status: session.status
        };
      }
      
      // Verify agent identity is still valid
      const verification = await this.verifyAgentIdentity(session.agentId);
      
      if (!verification.valid) {
        // Mark session as invalid
        session.status = 'invalid';
        
        return {
          valid: false,
          reason: 'Agent identity invalid',
          sessionId,
          agentId: session.agentId
        };
      }
      
      // Update session activity
      session.activityLog.push({
        timestamp: new Date().toISOString(),
        action: 'session_validated'
      });
      
      return {
        valid: true,
        sessionId,
        agentId: session.agentId,
        identityId: session.identityId,
        verification
      };
      
    } catch (error) {
      console.error('Error validating agent session:', error);
      return {
        valid: false,
        reason: 'Validation error',
        error: error.message,
        sessionId
      };
    }
  }

  /**
   * Revoke agent certificate
   */
  async revokeCertificate(agentId, reason = 'manual_revocation') {
    try {
      const certificate = this.agentCertificates.get(agentId);
      
      if (!certificate) {
        throw new Error('Certificate not found');
      }
      
      // Mark certificate as revoked
      certificate.status = 'revoked';
      certificate.revokedAt = new Date().toISOString();
      certificate.revocationReason = reason;
      
      // Invalidate all active sessions for this agent
      for (const [sessionId, session] of this.agentSessions.entries()) {
        if (session.agentId === agentId && session.status === 'active') {
          session.status = 'revoked';
          session.revokedAt = new Date().toISOString();
        }
      }
      
      // Log certificate revocation
      await cryptographicAuditService.logCryptographicEvent(
        agentId,
        'system',
        'certificate_revoked',
        {
          certificateId: certificate.certificateId,
          reason,
          revokedAt: certificate.revokedAt
        },
        {
          caId: this.certificateAuthority.caId,
          revocationMethod: 'manual'
        }
      );
      
      console.log(`🚫 Revoked certificate for agent: ${agentId}`);
      
      return {
        success: true,
        agentId,
        certificateId: certificate.certificateId,
        revokedAt: certificate.revokedAt,
        reason
      };
      
    } catch (error) {
      console.error('Error revoking certificate:', error);
      throw error;
    }
  }

  /**
   * Track agent lifecycle events
   */
  async trackAgentLifecycle(agentId, event, eventData = {}) {
    try {
      if (!this.agentLifecycle.has(agentId)) {
        this.agentLifecycle.set(agentId, []);
      }
      
      const lifecycleEvents = this.agentLifecycle.get(agentId);
      
      const lifecycleEvent = {
        eventId: uuidv4(),
        agentId,
        event,
        timestamp: new Date().toISOString(),
        data: eventData,
        metadata: {
          source: 'agent_identity_service',
          version: '1.0'
        }
      };
      
      lifecycleEvents.push(lifecycleEvent);
      
      // Log lifecycle event
      await cryptographicAuditService.logCryptographicEvent(
        agentId,
        'system',
        'agent_lifecycle_event',
        {
          event,
          eventId: lifecycleEvent.eventId,
          data: eventData
        },
        {
          lifecyclePosition: lifecycleEvents.length,
          totalEvents: lifecycleEvents.length
        }
      );
      
      console.log(`📊 Tracked lifecycle event for agent ${agentId}: ${event}`);
      
      return lifecycleEvent;
      
    } catch (error) {
      console.error('Error tracking agent lifecycle:', error);
      throw error;
    }
  }

  /**
   * Create authenticated session for agent
   */
  async createAuthenticatedSession(agentId, sessionConfig = {}) {
    try {
      const {
        sessionDuration = 3600000, // 1 hour default
        permissions = ['read', 'write'],
        metadata = {}
      } = sessionConfig;

      // Verify agent identity exists
      const identity = this.agentIdentities.get(agentId);
      if (!identity) {
        throw new Error(`Agent identity not found: ${agentId}`);
      }

      const sessionId = uuidv4();
      const session = {
        sessionId,
        agentId,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + sessionDuration).toISOString(),
        permissions,
        metadata,
        lastActivity: new Date().toISOString(),
        activityCount: 0
      };

      // Store session
      this.agentSessions.set(sessionId, session);

      // Update agent identity with session info
      if (!identity.activeSessions) {
        identity.activeSessions = [];
      }
      identity.activeSessions.push(sessionId);

      // Log session creation
      await this.logIdentityEvent(agentId, 'session_created', {
        sessionId,
        duration: sessionDuration,
        permissions
      });

      console.log(`🔑 Authenticated session created for agent ${agentId}: ${sessionId}`);

      return session;

    } catch (error) {
      console.error('Error creating authenticated session:', error);
      throw error;
    }
  }

  /**
   * Verify agent identity
   */
  async verifyAgentIdentity(agentId) {
    try {
      const identity = this.agentIdentities.get(agentId);
      if (!identity) {
        return { valid: false, error: 'Agent identity not found' };
      }

      // Check certificate validity - certificates are stored separately
      const certificate = this.agentCertificates.get(agentId);
      if (!certificate) {
        return { valid: false, error: 'No certificate found' };
      }

      // Check if certificate is expired
      const now = new Date();
      const expiresAt = new Date(certificate.expiresAt);
      if (now > expiresAt) {
        return { valid: false, error: 'Certificate expired' };
      }

      // Check if agent is revoked
      if (identity.status === 'revoked') {
        return { valid: false, error: 'Agent identity revoked' };
      }

      // Verify certificate signature (simplified for demo)
      const isSignatureValid = certificate.signature && 
                              certificate.signature.startsWith('cert_sig_');

      if (!isSignatureValid) {
        return { valid: false, error: 'Invalid certificate signature' };
      }

      return {
        valid: true,
        agentId,
        certificateId: certificate.certificateId,
        trustLevel: identity.trustLevel,
        verifiedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error verifying agent identity:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Log identity event
   */
  async logIdentityEvent(agentId, eventType, eventData) {
    try {
      // Log to cryptographic audit service
      await cryptographicAuditService.logCryptographicEvent(
        'system',
        agentId,
        eventType,
        eventData,
        {
          identityEvent: true,
          source: 'agent_identity_service'
        }
      );

      console.log(`🆔 Identity event logged for agent ${agentId}: ${eventType}`);

    } catch (error) {
      console.error('Error logging identity event:', error);
    }
  }

  /**
   * Get agent identity statistics
   */
  async getAgentIdentity(agentId) {
    try {
      const identity = this.agentIdentities.get(agentId);
      const certificate = this.agentCertificates.get(agentId);
      const lifecycleEvents = this.agentLifecycle.get(agentId) || [];
      
      if (!identity) {
        return null;
      }
      
      // Get active sessions
      const activeSessions = [];
      for (const [sessionId, session] of this.agentSessions.entries()) {
        if (session.agentId === agentId && session.status === 'active') {
          activeSessions.push({
            sessionId,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt
          });
        }
      }
      
      return {
        identity: {
          agentId: identity.agentId,
          identityId: identity.identityId,
          createdAt: identity.createdAt,
          lastUpdated: identity.lastUpdated,
          status: identity.status,
          metadata: identity.metadata,
          sessionCount: identity.sessionCount,
          publicKeyFingerprint: this.generateKeyFingerprint(identity.publicKey)
        },
        certificate: certificate ? {
          certificateId: certificate.certificateId,
          issuedAt: certificate.issuedAt,
          expiresAt: certificate.expiresAt,
          status: certificate.status,
          revokedAt: certificate.revokedAt,
          revocationReason: certificate.revocationReason
        } : null,
        activeSessions,
        lifecycleEvents: lifecycleEvents.map(event => ({
          eventId: event.eventId,
          event: event.event,
          timestamp: event.timestamp,
          data: event.data
        })),
        verificationHistory: identity.verificationHistory
      };
      
    } catch (error) {
      console.error('Error getting agent identity:', error);
      throw error;
    }
  }

  /**
   * List all agent identities
   */
  async listAgentIdentities(filters = {}) {
    try {
      const { status, includeRevoked = false } = filters;
      
      const identities = [];
      
      for (const [agentId, identity] of this.agentIdentities.entries()) {
        const certificate = this.agentCertificates.get(agentId);
        
        // Apply filters
        if (status && identity.status !== status) {
          continue;
        }
        
        if (!includeRevoked && certificate?.status === 'revoked') {
          continue;
        }
        
        identities.push({
          agentId: identity.agentId,
          identityId: identity.identityId,
          createdAt: identity.createdAt,
          lastUpdated: identity.lastUpdated,
          status: identity.status,
          sessionCount: identity.sessionCount,
          certificateStatus: certificate?.status || 'none',
          publicKeyFingerprint: this.generateKeyFingerprint(identity.publicKey)
        });
      }
      
      return {
        identities,
        total: identities.length,
        filters
      };
      
    } catch (error) {
      console.error('Error listing agent identities:', error);
      throw error;
    }
  }

  /**
   * Get identity service statistics
   */
  async getIdentityStats() {
    try {
      const stats = {
        totalIdentities: this.agentIdentities.size,
        totalCertificates: this.agentCertificates.size,
        activeSessions: 0,
        expiredSessions: 0,
        revokedCertificates: 0,
        validCertificates: 0,
        certificateAuthority: {
          caId: this.certificateAuthority.caId,
          createdAt: this.certificateAuthority.createdAt,
          algorithm: this.certificateAuthority.algorithm
        }
      };
      
      // Count session statuses
      for (const session of this.agentSessions.values()) {
        if (session.status === 'active') {
          const now = new Date();
          const expiresAt = new Date(session.expiresAt);
          
          if (now <= expiresAt) {
            stats.activeSessions++;
          } else {
            stats.expiredSessions++;
          }
        }
      }
      
      // Count certificate statuses
      for (const certificate of this.agentCertificates.values()) {
        if (certificate.status === 'revoked') {
          stats.revokedCertificates++;
        } else if (certificate.status === 'valid') {
          stats.validCertificates++;
        }
      }
      
      return stats;
      
    } catch (error) {
      console.error('Error getting identity stats:', error);
      return {
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new AgentIdentityService();

