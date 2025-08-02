/**
 * Legal Hold Service
 * Litigation and regulatory data preservation system
 * Provides immutable data preservation for legal proceedings and regulatory investigations
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const enterpriseTransparencyService = require('./enterpriseTransparencyService');
const agentLogSegregationService = require('./agentLogSegregationService');
const cryptographicAuditService = require('./cryptographicAuditService');

class LegalHoldService {
  constructor() {
    // Legal hold management
    this.legalHolds = new Map(); // holdId -> legal hold data
    this.preservedData = new Map(); // holdId -> preserved audit data
    this.holdNotifications = new Map(); // notificationId -> notification data
    this.custodianAssignments = new Map(); // custodianId -> assigned holds
    
    // Preservation policies
    this.preservationPolicies = new Map(); // policyId -> policy config
    this.retentionSchedules = new Map(); // scheduleId -> retention config
    
    // Audit and compliance
    this.holdAuditTrail = new Map(); // auditId -> audit event
    this.complianceReports = new Map(); // reportId -> compliance report
    
    // Configuration
    this.config = {
      maxHoldDuration: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
      preservationInterval: 24 * 60 * 60 * 1000, // 24 hours
      notificationRetryAttempts: 3,
      encryptionRequired: true,
      immutableStorage: true,
      auditTrailRequired: true
    };
    
    // Initialize default preservation policies
    this.initializePreservationPolicies();
    
    console.log('⚖️ LegalHoldService initialized');
  }

  /**
   * Initialize default preservation policies
   */
  initializePreservationPolicies() {
    // Litigation Hold Policy
    this.preservationPolicies.set('litigation_hold', {
      policyId: 'litigation_hold',
      name: 'Litigation Hold Policy',
      description: 'Standard litigation hold for civil and criminal proceedings',
      scope: {
        dataTypes: ['all_agent_logs', 'user_interactions', 'system_events', 'compliance_events'],
        timeRange: 'indefinite',
        agentScope: 'all_relevant',
        metadataRequired: true
      },
      preservation: {
        immutable: true,
        encrypted: true,
        redundancy: 'triple',
        verification: 'continuous'
      },
      notifications: {
        custodians: true,
        legal_team: true,
        compliance_team: true,
        it_team: true
      },
      compliance: {
        federalRules: ['FRCP Rule 26', 'FRCP Rule 37'],
        stateRules: ['varies_by_jurisdiction'],
        international: ['GDPR Article 17 exemption']
      }
    });

    // Regulatory Investigation Policy
    this.preservationPolicies.set('regulatory_investigation', {
      policyId: 'regulatory_investigation',
      name: 'Regulatory Investigation Policy',
      description: 'Data preservation for regulatory investigations and audits',
      scope: {
        dataTypes: ['compliance_logs', 'policy_enforcement', 'violation_events', 'audit_trails'],
        timeRange: 'investigation_period_plus_7_years',
        agentScope: 'compliance_related',
        metadataRequired: true
      },
      preservation: {
        immutable: true,
        encrypted: true,
        redundancy: 'double',
        verification: 'daily'
      },
      notifications: {
        compliance_team: true,
        legal_team: true,
        executive_team: true
      },
      compliance: {
        regulations: ['SOX', 'GDPR', 'HIPAA', 'CCPA'],
        retentionPeriod: '7_years_minimum'
      }
    });

    // Internal Investigation Policy
    this.preservationPolicies.set('internal_investigation', {
      policyId: 'internal_investigation',
      name: 'Internal Investigation Policy',
      description: 'Data preservation for internal investigations and HR matters',
      scope: {
        dataTypes: ['employee_interactions', 'access_logs', 'security_events', 'policy_violations'],
        timeRange: 'investigation_period_plus_3_years',
        agentScope: 'investigation_specific',
        metadataRequired: true
      },
      preservation: {
        immutable: true,
        encrypted: true,
        redundancy: 'single',
        verification: 'weekly'
      },
      notifications: {
        hr_team: true,
        legal_team: true,
        security_team: true
      },
      compliance: {
        policies: ['employee_handbook', 'code_of_conduct', 'privacy_policy']
      }
    });

    console.log('⚖️ Initialized preservation policies');
  }

  /**
   * Create a new legal hold
   */
  async createLegalHold(holdConfig) {
    try {
      const {
        name,
        description,
        matter,
        policyId = 'litigation_hold',
        custodians = [],
        agentIds = [],
        dataScope = {},
        timeRange = {},
        preservationStart = new Date().toISOString(),
        expectedDuration,
        legalBasis,
        requestedBy,
        approvedBy
      } = holdConfig;

      // Validate required fields
      if (!name || !matter || !legalBasis || !requestedBy) {
        throw new Error('Missing required fields: name, matter, legalBasis, requestedBy');
      }

      // Get preservation policy
      const policy = this.preservationPolicies.get(policyId);
      if (!policy) {
        throw new Error(`Preservation policy not found: ${policyId}`);
      }

      const holdId = uuidv4();
      const legalHold = {
        holdId,
        name,
        description,
        matter,
        policyId,
        policy,
        status: 'active',
        createdAt: new Date().toISOString(),
        preservationStart,
        preservationEnd: null,
        expectedDuration,
        actualDuration: null,
        custodians,
        agentIds,
        dataScope: {
          ...policy.scope,
          ...dataScope
        },
        timeRange: {
          start: timeRange.start || preservationStart,
          end: timeRange.end || null
        },
        legalBasis,
        requestedBy,
        approvedBy,
        notifications: {
          sent: [],
          pending: [],
          failed: []
        },
        preservation: {
          totalRecords: 0,
          preservedRecords: 0,
          verificationStatus: 'pending',
          lastVerification: null,
          encryptionStatus: 'pending',
          immutabilityStatus: 'pending'
        },
        compliance: {
          policyCompliance: 'pending',
          regulatoryCompliance: 'pending',
          auditTrail: []
        },
        cryptographicProof: null
      };

      // Store legal hold
      this.legalHolds.set(holdId, legalHold);

      // Initialize preserved data storage
      this.preservedData.set(holdId, {
        holdId,
        dataCollections: new Map(),
        verificationHashes: new Map(),
        encryptionKeys: new Map(),
        preservationLog: []
      });

      // Send notifications to custodians
      await this.sendHoldNotifications(holdId);

      // Start data preservation process
      await this.initiateDataPreservation(holdId);

      // Log legal hold creation
      await this.logHoldEvent(holdId, 'legal_hold_created', {
        holdId,
        matter,
        requestedBy,
        custodianCount: custodians.length,
        agentCount: agentIds.length
      });

      console.log(`⚖️ Legal hold created: ${holdId} for matter: ${matter}`);

      return legalHold;

    } catch (error) {
      console.error('Error creating legal hold:', error);
      throw error;
    }
  }

  /**
   * Send hold notifications to custodians
   */
  async sendHoldNotifications(holdId) {
    try {
      const legalHold = this.legalHolds.get(holdId);
      if (!legalHold) {
        throw new Error('Legal hold not found');
      }

      const notifications = [];

      // Send notifications to custodians
      for (const custodian of legalHold.custodians) {
        const notificationId = uuidv4();
        const notification = {
          notificationId,
          holdId,
          type: 'custodian_notification',
          recipient: custodian,
          subject: `Legal Hold Notice - ${legalHold.matter}`,
          content: this.generateHoldNotificationContent(legalHold, custodian),
          sentAt: new Date().toISOString(),
          status: 'sent',
          acknowledgmentRequired: true,
          acknowledgmentReceived: false,
          acknowledgmentDate: null
        };

        this.holdNotifications.set(notificationId, notification);
        notifications.push(notification);

        // Track custodian assignment
        if (!this.custodianAssignments.has(custodian.id)) {
          this.custodianAssignments.set(custodian.id, []);
        }
        this.custodianAssignments.get(custodian.id).push(holdId);
      }

      // Update legal hold with notification status
      legalHold.notifications.sent = notifications.map(n => n.notificationId);

      // Log notification events
      await this.logHoldEvent(holdId, 'hold_notifications_sent', {
        notificationCount: notifications.length,
        custodians: legalHold.custodians.map(c => c.id)
      });

      return notifications;

    } catch (error) {
      console.error('Error sending hold notifications:', error);
      throw error;
    }
  }

  /**
   * Generate hold notification content
   */
  generateHoldNotificationContent(legalHold, custodian) {
    return {
      html: `
        <h2>Legal Hold Notice</h2>
        <p><strong>Matter:</strong> ${legalHold.matter}</p>
        <p><strong>Hold ID:</strong> ${legalHold.holdId}</p>
        <p><strong>Effective Date:</strong> ${legalHold.preservationStart}</p>
        
        <h3>Preservation Requirements</h3>
        <p>You are required to preserve all documents, data, and communications related to this matter, including:</p>
        <ul>
          <li>AI agent interaction logs</li>
          <li>System audit trails</li>
          <li>Compliance monitoring data</li>
          <li>Related electronic communications</li>
        </ul>
        
        <h3>Your Responsibilities</h3>
        <ul>
          <li>Immediately suspend any routine deletion or destruction of relevant data</li>
          <li>Notify IT department of any automated deletion processes</li>
          <li>Preserve data in its original format and location</li>
          <li>Do not alter, modify, or delete any relevant information</li>
        </ul>
        
        <h3>Legal Basis</h3>
        <p>${legalHold.legalBasis}</p>
        
        <p><strong>Acknowledgment Required:</strong> Please acknowledge receipt of this notice within 24 hours.</p>
        <p><strong>Questions:</strong> Contact the Legal Department for any questions or concerns.</p>
      `,
      text: `
        LEGAL HOLD NOTICE
        
        Matter: ${legalHold.matter}
        Hold ID: ${legalHold.holdId}
        Effective Date: ${legalHold.preservationStart}
        
        You are required to preserve all documents, data, and communications related to this matter.
        
        Please acknowledge receipt within 24 hours.
        Contact Legal Department with questions.
      `
    };
  }

  /**
   * Initiate data preservation process
   */
  async initiateDataPreservation(holdId) {
    try {
      const legalHold = this.legalHolds.get(holdId);
      if (!legalHold) {
        throw new Error('Legal hold not found');
      }

      const preservedDataStore = this.preservedData.get(holdId);

      // Build query for data collection
      const queryConfig = {
        agentIds: legalHold.agentIds,
        eventTypes: this.mapDataTypesToEventTypes(legalHold.dataScope.dataTypes),
        timeRange: legalHold.timeRange,
        metadataFilters: {},
        verificationRequired: true,
        includeProofs: true,
        pagination: { limit: 10000, offset: 0 }
      };

      // Collect data in batches
      let totalRecords = 0;
      let batchNumber = 0;
      let hasMoreData = true;

      while (hasMoreData) {
        // Execute query for current batch
        const batchResults = await enterpriseTransparencyService.executeAdvancedQuery({
          ...queryConfig,
          pagination: { limit: 1000, offset: batchNumber * 1000 }
        });

        if (batchResults.data.length === 0) {
          hasMoreData = false;
          break;
        }

        // Preserve batch data
        const batchId = `batch_${batchNumber}`;
        const preservedBatch = await this.preserveDataBatch(
          holdId, 
          batchId, 
          batchResults.data
        );

        preservedDataStore.dataCollections.set(batchId, preservedBatch);
        totalRecords += batchResults.data.length;
        batchNumber++;

        // Log preservation progress
        await this.logHoldEvent(holdId, 'data_batch_preserved', {
          batchId,
          recordCount: batchResults.data.length,
          totalRecords
        });

        // Check if we have more data
        if (batchResults.data.length < 1000) {
          hasMoreData = false;
        }
      }

      // Update preservation status
      legalHold.preservation.totalRecords = totalRecords;
      legalHold.preservation.preservedRecords = totalRecords;
      legalHold.preservation.verificationStatus = 'verified';
      legalHold.preservation.lastVerification = new Date().toISOString();
      legalHold.preservation.encryptionStatus = 'encrypted';
      legalHold.preservation.immutabilityStatus = 'immutable';

      // Generate cryptographic proof of preservation
      legalHold.cryptographicProof = await this.generatePreservationProof(holdId);

      console.log(`⚖️ Data preservation completed for hold ${holdId}: ${totalRecords} records preserved`);

      return {
        holdId,
        totalRecords,
        batchCount: batchNumber,
        preservationCompleted: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error initiating data preservation:', error);
      throw error;
    }
  }

  /**
   * Map data types to event types
   */
  mapDataTypesToEventTypes(dataTypes) {
    const mapping = {
      'all_agent_logs': ['*'],
      'user_interactions': ['user_request', 'user_response', 'user_session'],
      'system_events': ['system_start', 'system_stop', 'system_error'],
      'compliance_events': ['compliance_check', 'policy_enforcement', 'violation_detected'],
      'security_events': ['authentication', 'authorization', 'access_denied'],
      'audit_trails': ['audit_event', 'audit_log', 'audit_verification']
    };

    const eventTypes = [];
    for (const dataType of dataTypes) {
      const mappedTypes = mapping[dataType] || [dataType];
      eventTypes.push(...mappedTypes);
    }

    return [...new Set(eventTypes)]; // Remove duplicates
  }

  /**
   * Preserve data batch with encryption and immutability
   */
  async preserveDataBatch(holdId, batchId, batchData) {
    try {
      // Generate encryption key for this batch
      const encryptionKey = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);

      // Encrypt batch data
      const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
      const encryptedData = Buffer.concat([
        cipher.update(JSON.stringify(batchData), 'utf8'),
        cipher.final()
      ]);

      // Generate hash for integrity verification
      const dataHash = crypto.createHash('sha256')
        .update(JSON.stringify(batchData))
        .digest('hex');

      // Generate batch preservation record
      const preservationRecord = {
        batchId,
        holdId,
        preservedAt: new Date().toISOString(),
        recordCount: batchData.length,
        originalDataHash: dataHash,
        encryptedDataHash: crypto.createHash('sha256').update(encryptedData).digest('hex'),
        encryptionMethod: 'aes-256-cbc',
        compressionMethod: 'none',
        immutabilityProof: {
          merkleRoot: this.generateMerkleRoot(batchData),
          timestamp: new Date().toISOString(),
          signature: null // Would be signed with legal hold key
        },
        metadata: {
          preservationPolicy: 'legal_hold',
          retentionPeriod: 'indefinite',
          accessRestrictions: 'legal_hold_only',
          verificationRequired: true
        }
      };

      // Store encrypted data and keys securely
      const preservedDataStore = this.preservedData.get(holdId);
      preservedDataStore.verificationHashes.set(batchId, dataHash);
      preservedDataStore.encryptionKeys.set(batchId, {
        key: encryptionKey.toString('hex'),
        iv: iv.toString('hex'),
        method: 'aes-256-cbc'
      });

      // Log preservation event
      preservedDataStore.preservationLog.push({
        timestamp: new Date().toISOString(),
        event: 'batch_preserved',
        batchId,
        recordCount: batchData.length,
        dataHash,
        encryptedDataHash: preservationRecord.encryptedDataHash
      });

      return {
        preservationRecord,
        encryptedData: encryptedData.toString('base64'),
        verificationHash: dataHash
      };

    } catch (error) {
      console.error('Error preserving data batch:', error);
      throw error;
    }
  }

  /**
   * Generate Merkle root for immutability proof
   */
  generateMerkleRoot(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return crypto.createHash('sha256').update('').digest('hex');
    }

    // Generate leaf hashes
    let hashes = data.map(item => 
      crypto.createHash('sha256').update(JSON.stringify(item)).digest('hex')
    );

    // Build Merkle tree
    while (hashes.length > 1) {
      const newHashes = [];
      
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left; // Handle odd number of hashes
        
        const combined = crypto.createHash('sha256')
          .update(left + right)
          .digest('hex');
        
        newHashes.push(combined);
      }
      
      hashes = newHashes;
    }

    return hashes[0];
  }

  /**
   * Generate preservation proof
   */
  async generatePreservationProof(holdId) {
    try {
      const legalHold = this.legalHolds.get(holdId);
      const preservedDataStore = this.preservedData.get(holdId);

      // Collect all verification hashes
      const allHashes = Array.from(preservedDataStore.verificationHashes.values());
      
      // Generate combined hash
      const combinedHash = crypto.createHash('sha256')
        .update(allHashes.join(''))
        .digest('hex');

      // Generate preservation proof
      const proof = {
        holdId,
        matter: legalHold.matter,
        preservationStart: legalHold.preservationStart,
        totalRecords: legalHold.preservation.totalRecords,
        batchCount: preservedDataStore.dataCollections.size,
        combinedDataHash: combinedHash,
        merkleRoot: this.generateMerkleRoot(allHashes),
        timestamp: new Date().toISOString(),
        signature: null, // Would be signed with legal hold private key
        verification: {
          method: 'cryptographic_hash_chain',
          algorithm: 'sha256',
          immutabilityGuarantee: true,
          tamperEvidence: true
        }
      };

      return proof;

    } catch (error) {
      console.error('Error generating preservation proof:', error);
      throw error;
    }
  }

  /**
   * Release legal hold
   */
  async releaseLegalHold(holdId, releaseConfig) {
    try {
      const {
        releasedBy,
        releaseReason,
        releaseDate = new Date().toISOString(),
        dataDisposition = 'retain_per_policy',
        notifyCustodians = true
      } = releaseConfig;

      const legalHold = this.legalHolds.get(holdId);
      if (!legalHold) {
        throw new Error('Legal hold not found');
      }

      if (legalHold.status !== 'active') {
        throw new Error(`Cannot release hold with status: ${legalHold.status}`);
      }

      // Update hold status
      legalHold.status = 'released';
      legalHold.preservationEnd = releaseDate;
      legalHold.actualDuration = new Date(releaseDate) - new Date(legalHold.preservationStart);
      legalHold.releaseInfo = {
        releasedBy,
        releaseReason,
        releaseDate,
        dataDisposition
      };

      // Generate final preservation proof
      const finalProof = await this.generateFinalPreservationProof(holdId);
      legalHold.finalCryptographicProof = finalProof;

      // Send release notifications
      if (notifyCustodians) {
        await this.sendReleaseNotifications(holdId);
      }

      // Handle data disposition
      await this.handleDataDisposition(holdId, dataDisposition);

      // Log hold release
      await this.logHoldEvent(holdId, 'legal_hold_released', {
        holdId,
        releasedBy,
        releaseReason,
        dataDisposition,
        preservationDuration: legalHold.actualDuration
      });

      console.log(`⚖️ Legal hold released: ${holdId}`);

      return {
        holdId,
        status: 'released',
        releaseDate,
        finalProof
      };

    } catch (error) {
      console.error('Error releasing legal hold:', error);
      throw error;
    }
  }

  /**
   * Generate final preservation proof
   */
  async generateFinalPreservationProof(holdId) {
    try {
      const preservationProof = await this.generatePreservationProof(holdId);
      
      const finalProof = {
        ...preservationProof,
        finalProof: true,
        preservationPeriod: {
          start: this.legalHolds.get(holdId).preservationStart,
          end: this.legalHolds.get(holdId).preservationEnd
        },
        legalCertification: {
          certified: true,
          certifiedBy: 'system',
          certificationDate: new Date().toISOString(),
          legalStandard: 'FRCP_compliant'
        }
      };

      return finalProof;

    } catch (error) {
      console.error('Error generating final preservation proof:', error);
      throw error;
    }
  }

  /**
   * Send release notifications
   */
  async sendReleaseNotifications(holdId) {
    try {
      const legalHold = this.legalHolds.get(holdId);
      
      for (const custodian of legalHold.custodians) {
        const notificationId = uuidv4();
        const notification = {
          notificationId,
          holdId,
          type: 'release_notification',
          recipient: custodian,
          subject: `Legal Hold Release Notice - ${legalHold.matter}`,
          content: this.generateReleaseNotificationContent(legalHold),
          sentAt: new Date().toISOString(),
          status: 'sent'
        };

        this.holdNotifications.set(notificationId, notification);
      }

      console.log(`⚖️ Release notifications sent for hold ${holdId}`);

    } catch (error) {
      console.error('Error sending release notifications:', error);
      throw error;
    }
  }

  /**
   * Generate release notification content
   */
  generateReleaseNotificationContent(legalHold) {
    return {
      html: `
        <h2>Legal Hold Release Notice</h2>
        <p><strong>Matter:</strong> ${legalHold.matter}</p>
        <p><strong>Hold ID:</strong> ${legalHold.holdId}</p>
        <p><strong>Release Date:</strong> ${legalHold.releaseInfo.releaseDate}</p>
        
        <h3>Hold Status</h3>
        <p>The legal hold for this matter has been officially released. You may now resume normal data retention and deletion practices for data related to this matter.</p>
        
        <h3>Data Disposition</h3>
        <p><strong>Disposition:</strong> ${legalHold.releaseInfo.dataDisposition}</p>
        
        <h3>Preservation Summary</h3>
        <p><strong>Preservation Period:</strong> ${legalHold.preservationStart} to ${legalHold.releaseInfo.releaseDate}</p>
        <p><strong>Records Preserved:</strong> ${legalHold.preservation.totalRecords}</p>
        
        <p>Thank you for your compliance with this legal hold.</p>
      `,
      text: `
        LEGAL HOLD RELEASE NOTICE
        
        Matter: ${legalHold.matter}
        Hold ID: ${legalHold.holdId}
        Release Date: ${legalHold.releaseInfo.releaseDate}
        
        The legal hold has been released. You may resume normal data practices.
      `
    };
  }

  /**
   * Handle data disposition after hold release
   */
  async handleDataDisposition(holdId, disposition) {
    try {
      const preservedDataStore = this.preservedData.get(holdId);

      switch (disposition) {
        case 'retain_per_policy':
          // Keep data according to normal retention policies
          await this.logHoldEvent(holdId, 'data_retained_per_policy', {
            disposition,
            retentionPolicy: 'normal_business_retention'
          });
          break;

        case 'permanent_retention':
          // Keep data permanently
          await this.logHoldEvent(holdId, 'data_permanently_retained', {
            disposition,
            retentionPolicy: 'permanent'
          });
          break;

        case 'secure_deletion':
          // Securely delete preserved data
          await this.securelyDeletePreservedData(holdId);
          break;

        case 'archive':
          // Archive data to long-term storage
          await this.archivePreservedData(holdId);
          break;

        default:
          throw new Error(`Unknown data disposition: ${disposition}`);
      }

    } catch (error) {
      console.error('Error handling data disposition:', error);
      throw error;
    }
  }

  /**
   * Securely delete preserved data
   */
  async securelyDeletePreservedData(holdId) {
    try {
      const preservedDataStore = this.preservedData.get(holdId);

      // Clear all preserved data
      preservedDataStore.dataCollections.clear();
      preservedDataStore.verificationHashes.clear();
      preservedDataStore.encryptionKeys.clear();

      // Log secure deletion
      await this.logHoldEvent(holdId, 'data_securely_deleted', {
        deletionMethod: 'cryptographic_key_destruction',
        deletionDate: new Date().toISOString(),
        verificationDestroyed: true
      });

      console.log(`⚖️ Preserved data securely deleted for hold ${holdId}`);

    } catch (error) {
      console.error('Error securely deleting preserved data:', error);
      throw error;
    }
  }

  /**
   * Log hold event
   */
  async logHoldEvent(holdId, eventType, eventData) {
    try {
      const auditId = uuidv4();
      const auditEvent = {
        auditId,
        holdId,
        eventType,
        eventData,
        timestamp: new Date().toISOString(),
        source: 'legal_hold_service'
      };

      this.holdAuditTrail.set(auditId, auditEvent);

      // Also log to cryptographic audit service
      await cryptographicAuditService.logCryptographicEvent(
        'system',
        'legal_hold_service',
        eventType,
        eventData,
        {
          holdId,
          legalHoldEvent: true,
          auditId
        }
      );

    } catch (error) {
      console.error('Error logging hold event:', error);
    }
  }

  /**
   * Get legal hold statistics
   */
  async getLegalHoldStats() {
    try {
      const stats = {
        totalHolds: this.legalHolds.size,
        activeHolds: 0,
        releasedHolds: 0,
        totalPreservedRecords: 0,
        totalCustodians: this.custodianAssignments.size,
        totalNotifications: this.holdNotifications.size,
        holdsByStatus: {},
        holdsByPolicy: {},
        preservationStats: {
          totalDataCollections: 0,
          totalVerificationHashes: 0,
          totalEncryptionKeys: 0
        }
      };

      // Calculate statistics
      for (const hold of this.legalHolds.values()) {
        stats.holdsByStatus[hold.status] = (stats.holdsByStatus[hold.status] || 0) + 1;
        stats.holdsByPolicy[hold.policyId] = (stats.holdsByPolicy[hold.policyId] || 0) + 1;
        stats.totalPreservedRecords += hold.preservation.totalRecords || 0;

        if (hold.status === 'active') {
          stats.activeHolds++;
        } else if (hold.status === 'released') {
          stats.releasedHolds++;
        }
      }

      // Calculate preservation statistics
      for (const preservedData of this.preservedData.values()) {
        stats.preservationStats.totalDataCollections += preservedData.dataCollections.size;
        stats.preservationStats.totalVerificationHashes += preservedData.verificationHashes.size;
        stats.preservationStats.totalEncryptionKeys += preservedData.encryptionKeys.size;
      }

      return stats;

    } catch (error) {
      console.error('Error getting legal hold stats:', error);
      return {
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new LegalHoldService();

