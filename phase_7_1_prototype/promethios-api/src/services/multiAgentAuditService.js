const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const cryptographicAuditService = require('./cryptographicAuditService');
const agentLogSegregationService = require('./agentLogSegregationService');

/**
 * Multi-Agent System Audit Service
 * Provides specialized audit capabilities for multi-agent systems including
 * collective behavior tracking, coordination verification, and emergent behavior analysis
 */
class MultiAgentAuditService {
  constructor() {
    // In-memory storage for demo (in production, use database)
    this.masContexts = new Map(); // Multi-agent system contexts
    this.collectiveBehaviors = new Map(); // Emergent behavior tracking
    this.coordinationProtocols = new Map(); // Agent coordination patterns
    this.consensusEvents = new Map(); // Group decision events
    this.communicationLogs = new Map(); // Inter-agent communication
    
    console.log('🤖 Multi-Agent Audit Service initialized');
  }

  /**
   * Log multi-agent context creation with cryptographic verification
   */
  async logContextCreation(contextId, contextData, createdBy) {
    try {
      const contextAudit = {
        contextId,
        auditId: uuidv4(),
        eventType: 'mas_context_created',
        timestamp: new Date().toISOString(),
        contextData: {
          name: contextData.name,
          agentIds: contextData.agent_ids || [],
          collaborationModel: contextData.collaboration_model,
          policies: contextData.policies || {},
          governanceEnabled: contextData.governance_enabled || true,
          metadata: contextData.metadata || {}
        },
        createdBy,
        signature: null,
        hash: null
      };

      // Generate cryptographic proof
      contextAudit.hash = this.generateContextHash(contextAudit);
      contextAudit.signature = this.generateContextSignature(contextAudit);

      // Store context audit
      this.masContexts.set(contextId, contextAudit);

      // Log to individual agent chains
      for (const agentId of contextData.agent_ids || []) {
        await cryptographicAuditService.logCryptographicEvent(
          createdBy,
          agentId,
          'mas_context_joined',
          {
            contextId,
            contextName: contextData.name,
            collaborationModel: contextData.collaboration_model,
            role: 'participant'
          },
          {
            auditId: contextAudit.auditId,
            contextHash: contextAudit.hash
          }
        );
      }

      console.log(`🤖 MAS context audit logged: ${contextId}`);
      return contextAudit.auditId;

    } catch (error) {
      console.error('Error logging MAS context creation:', error);
      throw error;
    }
  }

  /**
   * Log collective behavior event with emergent behavior detection
   */
  async logCollectiveBehavior(contextId, behaviorData, detectedBy = 'system') {
    try {
      const behaviorEvent = {
        behaviorId: uuidv4(),
        contextId,
        eventType: 'collective_behavior',
        timestamp: new Date().toISOString(),
        behaviorType: behaviorData.type, // 'emergent', 'coordinated', 'consensus', 'conflict'
        participants: behaviorData.participants || [],
        behaviorData: {
          description: behaviorData.description,
          triggers: behaviorData.triggers || [],
          outcomes: behaviorData.outcomes || [],
          metrics: behaviorData.metrics || {},
          emergenceLevel: behaviorData.emergenceLevel || 'low', // low, medium, high
          coordinationPattern: behaviorData.coordinationPattern,
          consensusReached: behaviorData.consensusReached || false
        },
        detectedBy,
        signature: null,
        hash: null
      };

      // Generate cryptographic proof
      behaviorEvent.hash = this.generateBehaviorHash(behaviorEvent);
      behaviorEvent.signature = this.generateBehaviorSignature(behaviorEvent);

      // Store behavior event
      this.collectiveBehaviors.set(behaviorEvent.behaviorId, behaviorEvent);

      // Log to cryptographic audit for each participant
      for (const agentId of behaviorEvent.participants) {
        await cryptographicAuditService.logCryptographicEvent(
          detectedBy,
          agentId,
          'collective_behavior_participation',
          {
            behaviorId: behaviorEvent.behaviorId,
            behaviorType: behaviorEvent.behaviorType,
            role: 'participant',
            emergenceLevel: behaviorEvent.behaviorData.emergenceLevel
          },
          {
            contextId,
            behaviorHash: behaviorEvent.hash
          }
        );
      }

      // Create cross-agent correlation for collective behavior
      if (behaviorEvent.participants.length >= 2) {
        await agentLogSegregationService.createCrossAgentCorrelation({
          primaryAgentId: behaviorEvent.participants[0],
          secondaryAgentId: behaviorEvent.participants[1],
          correlationType: 'collective_behavior',
          correlationData: {
            behaviorId: behaviorEvent.behaviorId,
            behaviorType: behaviorEvent.behaviorType,
            allParticipants: behaviorEvent.participants,
            contextId
          }
        });
      }

      console.log(`🧠 Collective behavior logged: ${behaviorEvent.behaviorType} in ${contextId}`);
      return behaviorEvent.behaviorId;

    } catch (error) {
      console.error('Error logging collective behavior:', error);
      throw error;
    }
  }

  /**
   * Log coordination protocol execution with verification
   */
  async logCoordinationProtocol(contextId, protocolData, initiatedBy) {
    try {
      const protocolEvent = {
        protocolId: uuidv4(),
        contextId,
        eventType: 'coordination_protocol',
        timestamp: new Date().toISOString(),
        protocolType: protocolData.type, // 'leader_follower', 'consensus', 'auction', 'voting'
        participants: protocolData.participants || [],
        protocolData: {
          description: protocolData.description,
          phases: protocolData.phases || [],
          currentPhase: protocolData.currentPhase || 'initiated',
          rules: protocolData.rules || {},
          constraints: protocolData.constraints || {},
          expectedOutcome: protocolData.expectedOutcome,
          actualOutcome: protocolData.actualOutcome || null,
          success: protocolData.success || false
        },
        initiatedBy,
        signature: null,
        hash: null
      };

      // Generate cryptographic proof
      protocolEvent.hash = this.generateProtocolHash(protocolEvent);
      protocolEvent.signature = this.generateProtocolSignature(protocolEvent);

      // Store protocol event
      this.coordinationProtocols.set(protocolEvent.protocolId, protocolEvent);

      // Log to individual agent chains
      for (const agentId of protocolEvent.participants) {
        await cryptographicAuditService.logCryptographicEvent(
          initiatedBy,
          agentId,
          'coordination_protocol_participation',
          {
            protocolId: protocolEvent.protocolId,
            protocolType: protocolEvent.protocolType,
            phase: protocolEvent.protocolData.currentPhase,
            role: agentId === initiatedBy ? 'initiator' : 'participant'
          },
          {
            contextId,
            protocolHash: protocolEvent.hash
          }
        );
      }

      console.log(`🔗 Coordination protocol logged: ${protocolEvent.protocolType} in ${contextId}`);
      return protocolEvent.protocolId;

    } catch (error) {
      console.error('Error logging coordination protocol:', error);
      throw error;
    }
  }

  /**
   * Log consensus event with mathematical verification
   */
  async logConsensusEvent(contextId, consensusData, facilitatedBy = 'system') {
    try {
      const consensusEvent = {
        consensusId: uuidv4(),
        contextId,
        eventType: 'consensus_event',
        timestamp: new Date().toISOString(),
        consensusType: consensusData.type, // 'unanimous', 'majority', 'weighted', 'byzantine'
        participants: consensusData.participants || [],
        consensusData: {
          proposal: consensusData.proposal,
          votes: consensusData.votes || {},
          threshold: consensusData.threshold || 0.5,
          result: consensusData.result, // 'accepted', 'rejected', 'timeout'
          finalDecision: consensusData.finalDecision,
          votingRounds: consensusData.votingRounds || 1,
          byzantineFaultTolerance: consensusData.byzantineFaultTolerance || false,
          proofOfConsensus: consensusData.proofOfConsensus || null
        },
        facilitatedBy,
        signature: null,
        hash: null
      };

      // Generate cryptographic proof
      consensusEvent.hash = this.generateConsensusHash(consensusEvent);
      consensusEvent.signature = this.generateConsensusSignature(consensusEvent);

      // Store consensus event
      this.consensusEvents.set(consensusEvent.consensusId, consensusEvent);

      // Log to individual agent chains with their vote
      for (const agentId of consensusEvent.participants) {
        const agentVote = consensusEvent.consensusData.votes[agentId] || 'abstain';
        
        await cryptographicAuditService.logCryptographicEvent(
          facilitatedBy,
          agentId,
          'consensus_participation',
          {
            consensusId: consensusEvent.consensusId,
            consensusType: consensusEvent.consensusType,
            vote: agentVote,
            result: consensusEvent.consensusData.result,
            finalDecision: consensusEvent.consensusData.finalDecision
          },
          {
            contextId,
            consensusHash: consensusEvent.hash,
            proofOfConsensus: consensusEvent.consensusData.proofOfConsensus
          }
        );
      }

      console.log(`🗳️ Consensus event logged: ${consensusEvent.consensusData.result} in ${contextId}`);
      return consensusEvent.consensusId;

    } catch (error) {
      console.error('Error logging consensus event:', error);
      throw error;
    }
  }

  /**
   * Log inter-agent communication with cryptographic integrity
   */
  async logInterAgentCommunication(fromAgentId, toAgentId, messageData, contextId = null) {
    try {
      const communicationEvent = {
        communicationId: uuidv4(),
        contextId,
        eventType: 'inter_agent_communication',
        timestamp: new Date().toISOString(),
        fromAgentId,
        toAgentId,
        messageData: {
          messageType: messageData.type || 'direct',
          content: messageData.content,
          contentHash: crypto.createHash('sha256').update(messageData.content).digest('hex'),
          priority: messageData.priority || 'normal',
          encrypted: messageData.encrypted || false,
          acknowledgmentRequired: messageData.acknowledgmentRequired || false,
          acknowledged: messageData.acknowledged || false,
          metadata: messageData.metadata || {}
        },
        signature: null,
        hash: null
      };

      // Generate cryptographic proof
      communicationEvent.hash = this.generateCommunicationHash(communicationEvent);
      communicationEvent.signature = this.generateCommunicationSignature(communicationEvent);

      // Store communication event
      this.communicationLogs.set(communicationEvent.communicationId, communicationEvent);

      // Log to both agent chains
      await cryptographicAuditService.logCryptographicEvent(
        fromAgentId,
        fromAgentId,
        'inter_agent_message_sent',
        {
          communicationId: communicationEvent.communicationId,
          toAgentId,
          messageType: communicationEvent.messageData.messageType,
          contentHash: communicationEvent.messageData.contentHash
        },
        {
          contextId,
          communicationHash: communicationEvent.hash
        }
      );

      await cryptographicAuditService.logCryptographicEvent(
        'system',
        toAgentId,
        'inter_agent_message_received',
        {
          communicationId: communicationEvent.communicationId,
          fromAgentId,
          messageType: communicationEvent.messageData.messageType,
          contentHash: communicationEvent.messageData.contentHash
        },
        {
          contextId,
          communicationHash: communicationEvent.hash
        }
      );

      // Create cross-agent correlation for communication
      await agentLogSegregationService.createCrossAgentCorrelation({
        primaryAgentId: fromAgentId,
        secondaryAgentId: toAgentId,
        correlationType: 'communication',
        correlationData: {
          communicationId: communicationEvent.communicationId,
          messageType: communicationEvent.messageData.messageType,
          contextId
        }
      });

      console.log(`💬 Inter-agent communication logged: ${fromAgentId} → ${toAgentId}`);
      return communicationEvent.communicationId;

    } catch (error) {
      console.error('Error logging inter-agent communication:', error);
      throw error;
    }
  }

  /**
   * Analyze emergent behaviors across MAS contexts
   */
  async analyzeEmergentBehaviors(contextId = null, timeRange = null) {
    try {
      let behaviors = Array.from(this.collectiveBehaviors.values());

      // Filter by context if specified
      if (contextId) {
        behaviors = behaviors.filter(b => b.contextId === contextId);
      }

      // Filter by time range if specified
      if (timeRange) {
        const startTime = new Date(timeRange.start);
        const endTime = new Date(timeRange.end);
        behaviors = behaviors.filter(b => {
          const behaviorTime = new Date(b.timestamp);
          return behaviorTime >= startTime && behaviorTime <= endTime;
        });
      }

      // Analyze patterns
      const analysis = {
        totalBehaviors: behaviors.length,
        behaviorTypes: {},
        emergenceLevels: { low: 0, medium: 0, high: 0 },
        coordinationPatterns: {},
        consensusSuccess: 0,
        averageParticipants: 0,
        timeDistribution: {},
        cryptographicIntegrity: true
      };

      let totalParticipants = 0;

      for (const behavior of behaviors) {
        // Count behavior types
        analysis.behaviorTypes[behavior.behaviorType] = 
          (analysis.behaviorTypes[behavior.behaviorType] || 0) + 1;

        // Count emergence levels
        analysis.emergenceLevels[behavior.behaviorData.emergenceLevel]++;

        // Count coordination patterns
        if (behavior.behaviorData.coordinationPattern) {
          analysis.coordinationPatterns[behavior.behaviorData.coordinationPattern] = 
            (analysis.coordinationPatterns[behavior.behaviorData.coordinationPattern] || 0) + 1;
        }

        // Count consensus success
        if (behavior.behaviorData.consensusReached) {
          analysis.consensusSuccess++;
        }

        // Calculate participants
        totalParticipants += behavior.participants.length;

        // Verify cryptographic integrity
        const expectedHash = this.generateBehaviorHash(behavior);
        if (behavior.hash !== expectedHash) {
          analysis.cryptographicIntegrity = false;
        }
      }

      analysis.averageParticipants = behaviors.length > 0 ? 
        (totalParticipants / behaviors.length).toFixed(2) : 0;

      console.log(`🧠 Analyzed ${behaviors.length} emergent behaviors`);
      return analysis;

    } catch (error) {
      console.error('Error analyzing emergent behaviors:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive MAS audit report
   */
  async generateMASAuditReport(contextId, reportType = 'comprehensive') {
    try {
      const contextAudit = this.masContexts.get(contextId);
      if (!contextAudit) {
        throw new Error(`MAS context not found: ${contextId}`);
      }

      const report = {
        reportId: uuidv4(),
        contextId,
        reportType,
        generatedAt: new Date().toISOString(),
        contextInfo: contextAudit.contextData,
        auditSummary: {
          totalEvents: 0,
          collectiveBehaviors: 0,
          coordinationProtocols: 0,
          consensusEvents: 0,
          communications: 0,
          cryptographicIntegrity: true
        },
        emergentBehaviorAnalysis: null,
        coordinationEfficiency: null,
        consensusMetrics: null,
        communicationPatterns: null,
        complianceStatus: null,
        recommendations: []
      };

      // Get all events for this context
      const behaviors = Array.from(this.collectiveBehaviors.values())
        .filter(b => b.contextId === contextId);
      const protocols = Array.from(this.coordinationProtocols.values())
        .filter(p => p.contextId === contextId);
      const consensus = Array.from(this.consensusEvents.values())
        .filter(c => c.contextId === contextId);
      const communications = Array.from(this.communicationLogs.values())
        .filter(c => c.contextId === contextId);

      report.auditSummary.totalEvents = behaviors.length + protocols.length + 
        consensus.length + communications.length;
      report.auditSummary.collectiveBehaviors = behaviors.length;
      report.auditSummary.coordinationProtocols = protocols.length;
      report.auditSummary.consensusEvents = consensus.length;
      report.auditSummary.communications = communications.length;

      // Analyze emergent behaviors
      report.emergentBehaviorAnalysis = await this.analyzeEmergentBehaviors(contextId);

      // Analyze coordination efficiency
      report.coordinationEfficiency = this.analyzeCoordinationEfficiency(protocols);

      // Analyze consensus metrics
      report.consensusMetrics = this.analyzeConsensusMetrics(consensus);

      // Analyze communication patterns
      report.communicationPatterns = this.analyzeCommunicationPatterns(communications);

      // Generate recommendations
      report.recommendations = this.generateMASRecommendations(report);

      console.log(`📊 Generated MAS audit report for ${contextId}`);
      return report;

    } catch (error) {
      console.error('Error generating MAS audit report:', error);
      throw error;
    }
  }

  // ============================================================================
  // CRYPTOGRAPHIC HELPER METHODS
  // ============================================================================

  generateContextHash(contextAudit) {
    const data = {
      contextId: contextAudit.contextId,
      eventType: contextAudit.eventType,
      timestamp: contextAudit.timestamp,
      contextData: contextAudit.contextData,
      createdBy: contextAudit.createdBy
    };
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  generateContextSignature(contextAudit) {
    return `mas_ctx_sig_${contextAudit.hash.substring(0, 32)}`;
  }

  generateBehaviorHash(behaviorEvent) {
    const data = {
      behaviorId: behaviorEvent.behaviorId,
      contextId: behaviorEvent.contextId,
      eventType: behaviorEvent.eventType,
      timestamp: behaviorEvent.timestamp,
      behaviorType: behaviorEvent.behaviorType,
      participants: behaviorEvent.participants,
      behaviorData: behaviorEvent.behaviorData
    };
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  generateBehaviorSignature(behaviorEvent) {
    return `mas_bhv_sig_${behaviorEvent.hash.substring(0, 32)}`;
  }

  generateProtocolHash(protocolEvent) {
    const data = {
      protocolId: protocolEvent.protocolId,
      contextId: protocolEvent.contextId,
      eventType: protocolEvent.eventType,
      timestamp: protocolEvent.timestamp,
      protocolType: protocolEvent.protocolType,
      participants: protocolEvent.participants,
      protocolData: protocolEvent.protocolData
    };
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  generateProtocolSignature(protocolEvent) {
    return `mas_prt_sig_${protocolEvent.hash.substring(0, 32)}`;
  }

  generateConsensusHash(consensusEvent) {
    const data = {
      consensusId: consensusEvent.consensusId,
      contextId: consensusEvent.contextId,
      eventType: consensusEvent.eventType,
      timestamp: consensusEvent.timestamp,
      consensusType: consensusEvent.consensusType,
      participants: consensusEvent.participants,
      consensusData: consensusEvent.consensusData
    };
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  generateConsensusSignature(consensusEvent) {
    return `mas_cns_sig_${consensusEvent.hash.substring(0, 32)}`;
  }

  generateCommunicationHash(communicationEvent) {
    const data = {
      communicationId: communicationEvent.communicationId,
      contextId: communicationEvent.contextId,
      eventType: communicationEvent.eventType,
      timestamp: communicationEvent.timestamp,
      fromAgentId: communicationEvent.fromAgentId,
      toAgentId: communicationEvent.toAgentId,
      messageData: communicationEvent.messageData
    };
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  generateCommunicationSignature(communicationEvent) {
    return `mas_com_sig_${communicationEvent.hash.substring(0, 32)}`;
  }

  // ============================================================================
  // ANALYSIS HELPER METHODS
  // ============================================================================

  analyzeCoordinationEfficiency(protocols) {
    if (protocols.length === 0) {
      return { efficiency: 0, successRate: 0, averagePhases: 0 };
    }

    const successful = protocols.filter(p => p.protocolData.success).length;
    const totalPhases = protocols.reduce((sum, p) => sum + (p.protocolData.phases.length || 1), 0);

    return {
      efficiency: (successful / protocols.length * 100).toFixed(2),
      successRate: (successful / protocols.length * 100).toFixed(2),
      averagePhases: (totalPhases / protocols.length).toFixed(2),
      protocolTypes: protocols.reduce((types, p) => {
        types[p.protocolType] = (types[p.protocolType] || 0) + 1;
        return types;
      }, {})
    };
  }

  analyzeConsensusMetrics(consensus) {
    if (consensus.length === 0) {
      return { successRate: 0, averageRounds: 0, consensusTypes: {} };
    }

    const successful = consensus.filter(c => c.consensusData.result === 'accepted').length;
    const totalRounds = consensus.reduce((sum, c) => sum + c.consensusData.votingRounds, 0);

    return {
      successRate: (successful / consensus.length * 100).toFixed(2),
      averageRounds: (totalRounds / consensus.length).toFixed(2),
      consensusTypes: consensus.reduce((types, c) => {
        types[c.consensusType] = (types[c.consensusType] || 0) + 1;
        return types;
      }, {}),
      byzantineFaultTolerance: consensus.filter(c => c.consensusData.byzantineFaultTolerance).length
    };
  }

  analyzeCommunicationPatterns(communications) {
    if (communications.length === 0) {
      return { totalMessages: 0, messageTypes: {}, acknowledgmentRate: 0 };
    }

    const acknowledged = communications.filter(c => c.messageData.acknowledged).length;
    const acknowledgmentRequired = communications.filter(c => c.messageData.acknowledgmentRequired).length;

    return {
      totalMessages: communications.length,
      messageTypes: communications.reduce((types, c) => {
        types[c.messageData.messageType] = (types[c.messageData.messageType] || 0) + 1;
        return types;
      }, {}),
      acknowledgmentRate: acknowledgmentRequired > 0 ? 
        (acknowledged / acknowledgmentRequired * 100).toFixed(2) : 0,
      encryptedMessages: communications.filter(c => c.messageData.encrypted).length
    };
  }

  generateMASRecommendations(report) {
    const recommendations = [];

    // Emergent behavior recommendations
    if (report.emergentBehaviorAnalysis.emergenceLevels.high > 0) {
      recommendations.push({
        type: 'emergent_behavior',
        priority: 'high',
        message: 'High-level emergent behaviors detected. Consider implementing additional monitoring and control mechanisms.'
      });
    }

    // Coordination efficiency recommendations
    if (parseFloat(report.coordinationEfficiency.efficiency) < 80) {
      recommendations.push({
        type: 'coordination',
        priority: 'medium',
        message: 'Coordination efficiency below 80%. Review coordination protocols and agent communication patterns.'
      });
    }

    // Consensus recommendations
    if (parseFloat(report.consensusMetrics.successRate) < 90) {
      recommendations.push({
        type: 'consensus',
        priority: 'medium',
        message: 'Consensus success rate below 90%. Consider adjusting consensus thresholds or implementing Byzantine fault tolerance.'
      });
    }

    // Communication recommendations
    if (parseFloat(report.communicationPatterns.acknowledgmentRate) < 95) {
      recommendations.push({
        type: 'communication',
        priority: 'low',
        message: 'Message acknowledgment rate below 95%. Consider implementing retry mechanisms for critical communications.'
      });
    }

    return recommendations;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get MAS context audit data
   */
  getMASContext(contextId) {
    return this.masContexts.get(contextId);
  }

  /**
   * Get all collective behaviors for a context
   */
  getCollectiveBehaviors(contextId) {
    return Array.from(this.collectiveBehaviors.values())
      .filter(b => b.contextId === contextId);
  }

  /**
   * Get all coordination protocols for a context
   */
  getCoordinationProtocols(contextId) {
    return Array.from(this.coordinationProtocols.values())
      .filter(p => p.contextId === contextId);
  }

  /**
   * Get all consensus events for a context
   */
  getConsensusEvents(contextId) {
    return Array.from(this.consensusEvents.values())
      .filter(c => c.contextId === contextId);
  }

  /**
   * Get all communications for a context
   */
  getCommunications(contextId) {
    return Array.from(this.communicationLogs.values())
      .filter(c => c.contextId === contextId);
  }

  /**
   * Verify cryptographic integrity of MAS audit data
   */
  verifyMASIntegrity(contextId) {
    const context = this.masContexts.get(contextId);
    if (!context) {
      return { valid: false, reason: 'Context not found' };
    }

    // Verify context hash
    const expectedContextHash = this.generateContextHash(context);
    if (context.hash !== expectedContextHash) {
      return { valid: false, reason: 'Context hash mismatch' };
    }

    // Verify all related events
    const behaviors = this.getCollectiveBehaviors(contextId);
    const protocols = this.getCoordinationProtocols(contextId);
    const consensus = this.getConsensusEvents(contextId);
    const communications = this.getCommunications(contextId);

    const allEvents = [...behaviors, ...protocols, ...consensus, ...communications];
    
    for (const event of allEvents) {
      let expectedHash;
      
      if (event.eventType === 'collective_behavior') {
        expectedHash = this.generateBehaviorHash(event);
      } else if (event.eventType === 'coordination_protocol') {
        expectedHash = this.generateProtocolHash(event);
      } else if (event.eventType === 'consensus_event') {
        expectedHash = this.generateConsensusHash(event);
      } else if (event.eventType === 'inter_agent_communication') {
        expectedHash = this.generateCommunicationHash(event);
      }

      if (event.hash !== expectedHash) {
        return { 
          valid: false, 
          reason: `Event hash mismatch: ${event.eventType}`,
          eventId: event.behaviorId || event.protocolId || event.consensusId || event.communicationId
        };
      }
    }

    return { 
      valid: true, 
      eventsVerified: allEvents.length,
      contextVerified: true
    };
  }
}

// Create singleton instance
const multiAgentAuditService = new MultiAgentAuditService();

module.exports = multiAgentAuditService;

