/**
 * Agent Log Segregation Service
 * Manages isolated cryptographic audit trails per agent
 * Provides cross-agent correlation while maintaining segregation
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const cryptographicAuditService = require('./cryptographicAuditService');
const agentIdentityService = require('./agentIdentityService');

class AgentLogSegregationService {
  constructor() {
    // Isolated log chains per agent
    this.agentLogChains = new Map(); // agentId -> isolated chain
    this.agentChainMetadata = new Map(); // agentId -> chain metadata
    this.crossAgentCorrelations = new Map(); // correlationId -> correlation data
    this.agentInteractions = new Map(); // interactionId -> interaction data
    
    // Segregation configuration
    this.config = {
      maxChainLength: 50000, // Maximum entries per agent chain
      correlationTimeout: 24 * 60 * 60 * 1000, // 24 hours
      archivalThreshold: 10000, // Archive when chain exceeds this
      verificationBatchSize: 100, // Entries to verify in batch
      enableCrossAgentCorrelation: true,
      enableParallelVerification: true
    };
    
    console.log('🔗 AgentLogSegregationService initialized');
  }

  /**
   * Initialize isolated log chain for an agent
   */
  async initializeAgentChain(agentId, agentMetadata = {}) {
    try {
      // Check if chain already exists
      if (this.agentLogChains.has(agentId)) {
        console.log(`Agent chain already exists for: ${agentId}`);
        return this.agentChainMetadata.get(agentId);
      }
      
      // Ensure agent has identity
      let agentIdentity = await agentIdentityService.getAgentIdentity(agentId);
      if (!agentIdentity) {
        agentIdentity = await agentIdentityService.generateAgentIdentity(agentId, agentMetadata);
      }
      
      // Create isolated chain
      const chainMetadata = {
        agentId,
        chainId: uuidv4(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        entryCount: 0,
        lastHash: null,
        genesisHash: null,
        status: 'active',
        metadata: {
          ...agentMetadata,
          identityId: agentIdentity.identity?.identityId,
          certificateId: agentIdentity.certificate?.certificateId
        },
        verificationStatus: {
          lastVerified: new Date().toISOString(),
          integrityPercentage: 100,
          verifiedEntries: 0,
          totalEntries: 0
        },
        archivalInfo: {
          archivedEntries: 0,
          lastArchival: null,
          archivalStatus: 'none'
        }
      };
      
      // Generate genesis hash
      const genesisData = {
        agentId,
        chainId: chainMetadata.chainId,
        timestamp: chainMetadata.createdAt,
        identityId: agentIdentity.identity?.identityId
      };
      
      chainMetadata.genesisHash = this.generateHash(genesisData);
      chainMetadata.lastHash = chainMetadata.genesisHash;
      
      // Initialize empty chain
      this.agentLogChains.set(agentId, []);
      this.agentChainMetadata.set(agentId, chainMetadata);
      
      // Log chain initialization
      await cryptographicAuditService.logCryptographicEvent(
        agentId,
        'system',
        'agent_chain_initialized',
        {
          chainId: chainMetadata.chainId,
          genesisHash: chainMetadata.genesisHash,
          identityId: agentIdentity.identity?.identityId
        },
        {
          certificateId: agentIdentity.certificate?.certificateId,
          segregationEnabled: true
        }
      );
      
      // Track lifecycle event
      await agentIdentityService.trackAgentLifecycle(agentId, 'chain_initialized', {
        chainId: chainMetadata.chainId,
        genesisHash: chainMetadata.genesisHash
      });
      
      console.log(`🔗 Initialized isolated chain for agent: ${agentId}`);
      
      return chainMetadata;
      
    } catch (error) {
      console.error('Error initializing agent chain:', error);
      throw error;
    }
  }

  /**
   * Generate cryptographic hash
   */
  generateHash(data) {
    const hash = crypto.createHash('sha256');
    
    if (typeof data === 'object') {
      hash.update(JSON.stringify(this.sortObjectKeys(data)));
    } else {
      hash.update(String(data));
    }
    
    return hash.digest('hex');
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
   * Log event to isolated agent chain
   */
  async logToAgentChain(agentId, userId, eventType, eventData, metadata = {}) {
    try {
      // Ensure agent chain exists
      if (!this.agentLogChains.has(agentId)) {
        await this.initializeAgentChain(agentId);
      }
      
      // Verify agent identity
      const verification = await agentIdentityService.verifyAgentIdentity(agentId);
      if (!verification.valid) {
        throw new Error(`Agent identity verification failed: ${verification.reason}`);
      }
      
      const agentChain = this.agentLogChains.get(agentId);
      const chainMetadata = this.agentChainMetadata.get(agentId);
      
      // Create isolated log entry
      const logEntry = {
        id: uuidv4(),
        agentId,
        chainId: chainMetadata.chainId,
        userId,
        eventType,
        eventData: this.sanitizeEventData(eventData),
        timestamp: new Date().toISOString(),
        chainPosition: agentChain.length,
        previousHash: chainMetadata.lastHash,
        currentHash: null, // Will be calculated
        signature: null, // Will be calculated
        metadata: {
          ...metadata,
          segregationVersion: '1.0',
          identityId: verification.identityId,
          certificateId: verification.certificateId,
          verificationTimestamp: verification.verificationTimestamp
        },
        verificationStatus: 'pending',
        correlationIds: [] // For cross-agent correlation
      };
      
      // Calculate current hash
      const hashData = {
        id: logEntry.id,
        agentId: logEntry.agentId,
        chainId: logEntry.chainId,
        userId: logEntry.userId,
        eventType: logEntry.eventType,
        eventData: logEntry.eventData,
        timestamp: logEntry.timestamp,
        chainPosition: logEntry.chainPosition,
        previousHash: logEntry.previousHash,
        metadata: logEntry.metadata
      };
      
      logEntry.currentHash = this.generateHash(hashData);
      
      // Generate signature using agent's private key
      const agentIdentity = await agentIdentityService.getAgentIdentity(agentId);
      if (agentIdentity?.identity) {
        logEntry.signature = this.generateSignature(hashData, agentIdentity.identity.privateKey);
      }
      
      // Verify the entry
      const isValid = await this.verifyIsolatedEntry(logEntry);
      logEntry.verificationStatus = isValid ? 'verified' : 'invalid';
      
      // Add to isolated chain
      agentChain.push(logEntry);
      
      // Update chain metadata
      chainMetadata.entryCount++;
      chainMetadata.lastHash = logEntry.currentHash;
      chainMetadata.lastUpdated = logEntry.timestamp;
      chainMetadata.verificationStatus.totalEntries++;
      
      if (isValid) {
        chainMetadata.verificationStatus.verifiedEntries++;
      }
      
      chainMetadata.verificationStatus.integrityPercentage = 
        (chainMetadata.verificationStatus.verifiedEntries / chainMetadata.verificationStatus.totalEntries) * 100;
      
      // Check for archival if chain is getting large
      if (agentChain.length > this.config.archivalThreshold) {
        await this.scheduleChainArchival(agentId);
      }
      
      // Also log to main cryptographic audit service for backup
      await cryptographicAuditService.logCryptographicEvent(
        agentId,
        userId,
        eventType,
        eventData,
        {
          ...metadata,
          isolatedChainId: chainMetadata.chainId,
          isolatedEntryId: logEntry.id,
          chainPosition: logEntry.chainPosition,
          segregated: true
        }
      );
      
      console.log(`🔗 Logged to isolated chain for agent ${agentId}: ${eventType}`);
      
      return {
        logEntry,
        chainMetadata: {
          chainId: chainMetadata.chainId,
          entryCount: chainMetadata.entryCount,
          lastHash: chainMetadata.lastHash,
          integrityPercentage: chainMetadata.verificationStatus.integrityPercentage
        },
        verification
      };
      
    } catch (error) {
      console.error('Error logging to agent chain:', error);
      throw error;
    }
  }

  /**
   * Generate digital signature
   */
  generateSignature(data, privateKey) {
    try {
      const canonicalData = JSON.stringify(this.sortObjectKeys(data));
      const sign = crypto.createSign('SHA256');
      sign.update(canonicalData);
      return sign.sign(privateKey, 'hex');
    } catch (error) {
      console.error('Error generating signature:', error);
      return null;
    }
  }

  /**
   * Sanitize event data
   */
  sanitizeEventData(eventData) {
    if (!eventData || typeof eventData !== 'object') {
      return eventData;
    }
    
    const sanitized = { ...eventData };
    
    // Remove or hash sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'privateKey'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = this.generateHash(sanitized[field]).substring(0, 16) + '...';
      }
    }
    
    return sanitized;
  }

  /**
   * Verify isolated log entry
   */
  async verifyIsolatedEntry(logEntry) {
    try {
      // Verify hash integrity
      const hashData = {
        id: logEntry.id,
        agentId: logEntry.agentId,
        chainId: logEntry.chainId,
        userId: logEntry.userId,
        eventType: logEntry.eventType,
        eventData: logEntry.eventData,
        timestamp: logEntry.timestamp,
        chainPosition: logEntry.chainPosition,
        previousHash: logEntry.previousHash,
        metadata: logEntry.metadata
      };
      
      const calculatedHash = this.generateHash(hashData);
      if (calculatedHash !== logEntry.currentHash) {
        console.error('Hash verification failed for isolated entry:', logEntry.id);
        return false;
      }
      
      // Verify signature if present
      if (logEntry.signature) {
        const agentIdentity = await agentIdentityService.getAgentIdentity(logEntry.agentId);
        if (agentIdentity?.identity) {
          const signatureValid = this.verifySignature(hashData, logEntry.signature, agentIdentity.identity.publicKey);
          if (!signatureValid) {
            console.error('Signature verification failed for isolated entry:', logEntry.id);
            return false;
          }
        }
      }
      
      // Verify chain linkage
      if (logEntry.chainPosition > 0) {
        const agentChain = this.agentLogChains.get(logEntry.agentId);
        if (agentChain && agentChain.length > logEntry.chainPosition) {
          const previousEntry = agentChain[logEntry.chainPosition - 1];
          if (previousEntry && previousEntry.currentHash !== logEntry.previousHash) {
            console.error('Chain linkage verification failed for isolated entry:', logEntry.id);
            return false;
          }
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('Error verifying isolated entry:', error);
      return false;
    }
  }

  /**
   * Verify signature
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
   * Create cross-agent correlation
   */
  async createCrossAgentCorrelation(agentIds, correlationType, correlationData, metadata = {}) {
    try {
      if (!this.config.enableCrossAgentCorrelation) {
        throw new Error('Cross-agent correlation is disabled');
      }
      
      if (!Array.isArray(agentIds) || agentIds.length < 2) {
        throw new Error('At least two agents required for correlation');
      }
      
      // Verify all agents exist and have valid identities
      const agentVerifications = {};
      for (const agentId of agentIds) {
        const verification = await agentIdentityService.verifyAgentIdentity(agentId);
        if (!verification.valid) {
          throw new Error(`Agent ${agentId} identity verification failed: ${verification.reason}`);
        }
        agentVerifications[agentId] = verification;
      }
      
      // Create correlation
      const correlationId = uuidv4();
      const correlation = {
        correlationId,
        agentIds,
        correlationType,
        correlationData: this.sanitizeEventData(correlationData),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.config.correlationTimeout).toISOString(),
        status: 'active',
        metadata: {
          ...metadata,
          agentVerifications,
          correlationVersion: '1.0'
        },
        cryptographicProof: null // Will be calculated
      };
      
      // Generate cryptographic proof of correlation
      const proofData = {
        correlationId: correlation.correlationId,
        agentIds: correlation.agentIds,
        correlationType: correlation.correlationType,
        correlationData: correlation.correlationData,
        createdAt: correlation.createdAt,
        agentVerifications: Object.keys(agentVerifications).reduce((acc, agentId) => {
          acc[agentId] = {
            identityId: agentVerifications[agentId].identityId,
            certificateId: agentVerifications[agentId].certificateId,
            verificationTimestamp: agentVerifications[agentId].verificationTimestamp
          };
          return acc;
        }, {})
      };
      
      correlation.cryptographicProof = {
        proofHash: this.generateHash(proofData),
        timestamp: new Date().toISOString()
      };
      
      // Store correlation
      this.crossAgentCorrelations.set(correlationId, correlation);
      
      // Log correlation creation for each agent
      for (const agentId of agentIds) {
        await this.logToAgentChain(
          agentId,
          'system',
          'cross_agent_correlation_created',
          {
            correlationId,
            correlationType,
            relatedAgents: agentIds.filter(id => id !== agentId),
            correlationData
          },
          {
            correlationProof: correlation.cryptographicProof,
            expiresAt: correlation.expiresAt
          }
        );
      }
      
      console.log(`🔗 Created cross-agent correlation: ${correlationId}`);
      
      return correlation;
      
    } catch (error) {
      console.error('Error creating cross-agent correlation:', error);
      throw error;
    }
  }

  /**
   * Query isolated agent logs
   */
  async queryAgentLogs(agentId, filters = {}) {
    try {
      const {
        eventType,
        userId,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
        includeVerification = false
      } = filters;
      
      const agentChain = this.agentLogChains.get(agentId);
      
      if (!agentChain) {
        return {
          agentId,
          logs: [],
          total: 0,
          chainMetadata: null
        };
      }
      
      // Apply filters
      let filteredLogs = [...agentChain];
      
      if (eventType) {
        filteredLogs = filteredLogs.filter(log => log.eventType === eventType);
      }
      
      if (userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === userId);
      }
      
      if (startDate) {
        const start = new Date(startDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
      }
      
      if (endDate) {
        const end = new Date(endDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
      }
      
      // Sort by chain position (chronological order)
      filteredLogs.sort((a, b) => b.chainPosition - a.chainPosition);
      
      // Apply pagination
      const paginatedLogs = filteredLogs.slice(offset, offset + limit);
      
      // Include verification if requested
      if (includeVerification) {
        for (const log of paginatedLogs) {
          log.verificationResult = await this.verifyIsolatedEntry(log);
        }
      }
      
      const chainMetadata = this.agentChainMetadata.get(agentId);
      
      return {
        agentId,
        logs: paginatedLogs,
        total: filteredLogs.length,
        limit,
        offset,
        hasMore: offset + limit < filteredLogs.length,
        chainMetadata: {
          chainId: chainMetadata.chainId,
          entryCount: chainMetadata.entryCount,
          lastHash: chainMetadata.lastHash,
          verificationStatus: chainMetadata.verificationStatus
        },
        cryptographicProof: {
          queryHash: this.generateHash(JSON.stringify(filters)),
          timestamp: new Date().toISOString(),
          resultCount: paginatedLogs.length
        }
      };
      
    } catch (error) {
      console.error('Error querying agent logs:', error);
      throw error;
    }
  }

  /**
   * Verify isolated chain integrity
   */
  async verifyAgentChainIntegrity(agentId, maxEntries = null) {
    try {
      const agentChain = this.agentLogChains.get(agentId);
      const chainMetadata = this.agentChainMetadata.get(agentId);
      
      if (!agentChain || !chainMetadata) {
        return {
          agentId,
          valid: false,
          reason: 'Agent chain not found'
        };
      }
      
      const entriesToVerify = maxEntries 
        ? agentChain.slice(-maxEntries) 
        : agentChain;
      
      const errors = [];
      let verifiedEntries = 0;
      
      // Verify each entry
      for (const entry of entriesToVerify) {
        const isValid = await this.verifyIsolatedEntry(entry);
        
        if (isValid) {
          verifiedEntries++;
        } else {
          errors.push({
            entryId: entry.id,
            chainPosition: entry.chainPosition,
            error: 'Verification failed'
          });
        }
      }
      
      // Verify chain metadata consistency
      if (chainMetadata.entryCount !== agentChain.length) {
        errors.push({
          error: 'Chain metadata inconsistency',
          expected: chainMetadata.entryCount,
          actual: agentChain.length
        });
      }
      
      // Verify last hash
      if (agentChain.length > 0) {
        const lastEntry = agentChain[agentChain.length - 1];
        if (chainMetadata.lastHash !== lastEntry.currentHash) {
          errors.push({
            error: 'Last hash mismatch',
            expected: chainMetadata.lastHash,
            actual: lastEntry.currentHash
          });
        }
      }
      
      return {
        agentId,
        valid: errors.length === 0,
        entryCount: entriesToVerify.length,
        verifiedEntries,
        errors,
        integrityPercentage: (verifiedEntries / entriesToVerify.length) * 100,
        chainMetadata: {
          chainId: chainMetadata.chainId,
          entryCount: chainMetadata.entryCount,
          lastHash: chainMetadata.lastHash,
          verificationStatus: chainMetadata.verificationStatus
        }
      };
      
    } catch (error) {
      console.error('Error verifying agent chain integrity:', error);
      return {
        agentId,
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Schedule chain archival
   */
  async scheduleChainArchival(agentId) {
    try {
      const chainMetadata = this.agentChainMetadata.get(agentId);
      
      if (!chainMetadata) {
        throw new Error('Chain metadata not found');
      }
      
      // Mark for archival
      chainMetadata.archivalInfo.archivalStatus = 'scheduled';
      chainMetadata.archivalInfo.scheduledAt = new Date().toISOString();
      
      // Log archival scheduling
      await this.logToAgentChain(
        agentId,
        'system',
        'chain_archival_scheduled',
        {
          chainId: chainMetadata.chainId,
          currentEntryCount: chainMetadata.entryCount,
          threshold: this.config.archivalThreshold
        },
        {
          archivalStatus: 'scheduled',
          scheduledAt: chainMetadata.archivalInfo.scheduledAt
        }
      );
      
      console.log(`📦 Scheduled archival for agent chain: ${agentId}`);
      
      return {
        agentId,
        chainId: chainMetadata.chainId,
        archivalStatus: 'scheduled',
        scheduledAt: chainMetadata.archivalInfo.scheduledAt
      };
      
    } catch (error) {
      console.error('Error scheduling chain archival:', error);
      throw error;
    }
  }

  /**
   * Get segregation service statistics
   */
  async getSegregationStats() {
    try {
      const stats = {
        totalAgentChains: this.agentLogChains.size,
        totalEntries: 0,
        totalCorrelations: this.crossAgentCorrelations.size,
        activeCorrelations: 0,
        chainIntegrityStats: {},
        archivalStats: {
          scheduled: 0,
          inProgress: 0,
          completed: 0
        }
      };
      
      // Calculate chain statistics
      for (const [agentId, chain] of this.agentLogChains.entries()) {
        stats.totalEntries += chain.length;
        
        const chainMetadata = this.agentChainMetadata.get(agentId);
        if (chainMetadata) {
          stats.chainIntegrityStats[agentId] = {
            entryCount: chainMetadata.entryCount,
            integrityPercentage: chainMetadata.verificationStatus.integrityPercentage,
            lastUpdated: chainMetadata.lastUpdated
          };
          
          // Count archival statuses
          const archivalStatus = chainMetadata.archivalInfo.archivalStatus;
          if (archivalStatus in stats.archivalStats) {
            stats.archivalStats[archivalStatus]++;
          }
        }
      }
      
      // Count active correlations
      const now = new Date();
      for (const correlation of this.crossAgentCorrelations.values()) {
        const expiresAt = new Date(correlation.expiresAt);
        if (correlation.status === 'active' && now <= expiresAt) {
          stats.activeCorrelations++;
        }
      }
      
      return stats;
      
    } catch (error) {
      console.error('Error getting segregation stats:', error);
      return {
        error: error.message
      };
    }
  }

  /**
   * List all agent chains
   */
  async listAgentChains(filters = {}) {
    try {
      const { status, includeArchived = false } = filters;
      
      const chains = [];
      
      for (const [agentId, chainMetadata] of this.agentChainMetadata.entries()) {
        // Apply filters
        if (status && chainMetadata.status !== status) {
          continue;
        }
        
        if (!includeArchived && chainMetadata.archivalInfo.archivalStatus !== 'none') {
          continue;
        }
        
        chains.push({
          agentId,
          chainId: chainMetadata.chainId,
          createdAt: chainMetadata.createdAt,
          lastUpdated: chainMetadata.lastUpdated,
          entryCount: chainMetadata.entryCount,
          status: chainMetadata.status,
          integrityPercentage: chainMetadata.verificationStatus.integrityPercentage,
          archivalStatus: chainMetadata.archivalInfo.archivalStatus
        });
      }
      
      return {
        chains,
        total: chains.length,
        filters
      };
      
    } catch (error) {
      console.error('Error listing agent chains:', error);
      throw error;
    }
  }

  /**
   * Log event to isolated agent chain
   */
  async logToIsolatedChain(agentId, userId, eventType, eventData, metadata = {}) {
    try {
      // Ensure agent chain exists
      if (!this.agentLogChains.has(agentId)) {
        await this.initializeAgentChain(agentId);
      }

      const agentChain = this.agentLogChains.get(agentId);
      const chainMetadata = this.agentChainMetadata.get(agentId);

      // Create log entry
      const logEntry = {
        id: uuidv4(),
        agentId,
        chainId: chainMetadata.chainId,
        userId,
        eventType,
        eventData,
        timestamp: new Date().toISOString(),
        chainPosition: agentChain.length,
        previousHash: agentChain.length > 0 ? agentChain[agentChain.length - 1].currentHash : chainMetadata.genesisHash,
        currentHash: null, // Will be calculated
        signature: null, // Will be calculated
        metadata: {
          ...metadata,
          isolatedChain: true,
          chainPosition: agentChain.length
        },
        verificationStatus: 'pending',
        correlationIds: []
      };

      // Calculate current hash
      const hashData = {
        id: logEntry.id,
        agentId: logEntry.agentId,
        chainId: logEntry.chainId,
        userId: logEntry.userId,
        eventType: logEntry.eventType,
        eventData: logEntry.eventData,
        timestamp: logEntry.timestamp,
        chainPosition: logEntry.chainPosition,
        previousHash: logEntry.previousHash,
        metadata: logEntry.metadata
      };

      logEntry.currentHash = this.generateHash(hashData);

      // Generate signature using agent's private key
      const agentIdentity = await agentIdentityService.getAgentIdentity(agentId);
      if (agentIdentity?.identity) {
        logEntry.signature = this.generateSignature(hashData, agentIdentity.identity.privateKey);
      }

      // Verify the entry
      const isValid = await this.verifyIsolatedEntry(logEntry);
      logEntry.verificationStatus = isValid ? 'verified' : 'invalid';

      // Add to isolated chain
      agentChain.push(logEntry);

      // Update chain metadata
      chainMetadata.entryCount++;
      chainMetadata.lastHash = logEntry.currentHash;
      chainMetadata.lastUpdated = logEntry.timestamp;
      chainMetadata.verificationStatus.totalEntries++;

      if (isValid) {
        chainMetadata.verificationStatus.verifiedEntries++;
      }

      chainMetadata.verificationStatus.integrityPercentage = 
        (chainMetadata.verificationStatus.verifiedEntries / chainMetadata.verificationStatus.totalEntries) * 100;

      // Also log to cryptographic audit service for cross-reference
      await cryptographicAuditService.logCryptographicEvent(
        userId,
        agentId,
        eventType,
        eventData,
        {
          ...metadata,
          isolatedChainEntry: logEntry.id,
          chainPosition: logEntry.chainPosition
        }
      );

      console.log(`🔗 Logged to isolated chain for agent ${agentId}: ${eventType}`);

      return {
        entryId: logEntry.id,
        agentId,
        chainPosition: logEntry.chainPosition,
        hash: logEntry.currentHash,
        timestamp: logEntry.timestamp,
        verificationStatus: logEntry.verificationStatus
      };

    } catch (error) {
      console.error('Error logging to isolated chain:', error);
      throw error;
    }
  }

  /**
   * Verify isolated entry
   */
  async verifyIsolatedEntry(logEntry) {
    try {
      // Verify hash integrity
      const hashData = {
        id: logEntry.id,
        agentId: logEntry.agentId,
        chainId: logEntry.chainId,
        userId: logEntry.userId,
        eventType: logEntry.eventType,
        eventData: logEntry.eventData,
        timestamp: logEntry.timestamp,
        chainPosition: logEntry.chainPosition,
        previousHash: logEntry.previousHash,
        metadata: logEntry.metadata
      };

      const calculatedHash = this.generateHash(hashData);
      return calculatedHash === logEntry.currentHash;

    } catch (error) {
      console.error('Error verifying isolated entry:', error);
      return false;
    }
  }

  /**
   * Generate signature for log entry
   */
  generateSignature(data, privateKey = null) {
    // For demo purposes, generate a simple signature
    // In production, this would use proper cryptographic signing with the private key
    const hash = this.generateHash(data);
    return `sig_${hash.substring(0, 16)}`;
  }
}

// Export singleton instance
module.exports = new AgentLogSegregationService();

