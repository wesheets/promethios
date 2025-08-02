/**
 * PolicyAssignment Model
 * 
 * In-memory storage for policy assignments in the Promethios governance system.
 * Handles the relationship between agents and their assigned policies.
 */

const { v4: uuidv4 } = require('uuid');

// In-memory storage for policy assignments
let policyAssignments = new Map();

// Initialize with sample policy assignments for testing
function initializeSampleData() {
  const sampleAssignments = [
    {
      assignmentId: 'assignment_sample001',
      userId: 'HSf4SIwCcRRzAFPuFXlFE9CsQ6W2',
      agentId: 'agent-1752066120866-production',
      policyId: 'hipaa_compliance',
      assignedBy: 'system',
      status: 'active',
      priority: 'high',
      complianceRate: 0.95,
      violationCount: 2,
      metadata: { policyName: 'HIPAA Compliance', description: 'Healthcare data protection' }
    },
    {
      assignmentId: 'assignment_sample002',
      userId: 'HSf4SIwCcRRzAFPuFXlFE9CsQ6W2',
      agentId: 'agent-1752066120866-production',
      policyId: 'soc2_compliance',
      assignedBy: 'system',
      status: 'active',
      priority: 'high',
      complianceRate: 0.98,
      violationCount: 0,
      metadata: { policyName: 'SOC2 Compliance', description: 'Security and operational controls' }
    },
    {
      assignmentId: 'assignment_sample003',
      userId: 'HSf4SIwCcRRzAFPuFXlFE9CsQ6W2',
      agentId: 'agent-1752067566721-production',
      policyId: 'legal_compliance',
      assignedBy: 'system',
      status: 'active',
      priority: 'medium',
      complianceRate: 0.92,
      violationCount: 1,
      metadata: { policyName: 'Legal Compliance', description: 'Regulatory and legal constraints' }
    }
  ];

  for (const data of sampleAssignments) {
    const assignment = new PolicyAssignment(data);
    policyAssignments.set(assignment.assignmentId, assignment);
  }

  console.log(`✅ Initialized ${sampleAssignments.length} sample policy assignments`);
}

class PolicyAssignment {
  constructor(data = {}) {
    this.assignmentId = data.assignmentId || `assignment_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    this.userId = data.userId;
    this.agentId = data.agentId;
    this.policyId = data.policyId;
    this.assignedAt = data.assignedAt || new Date();
    this.assignedBy = data.assignedBy;
    this.updatedBy = data.updatedBy;
    this.status = data.status || 'active';
    this.priority = data.priority || 'medium';
    this.effectiveFrom = data.effectiveFrom || new Date();
    this.effectiveUntil = data.effectiveUntil;
    this.suspendedAt = data.suspendedAt;
    this.suspendedBy = data.suspendedBy;
    this.suspensionReason = data.suspensionReason;
    this.reactivatedAt = data.reactivatedAt;
    this.reactivatedBy = data.reactivatedBy;
    this.complianceRate = data.complianceRate || 1;
    this.violationCount = data.violationCount || 0;
    this.lastViolationAt = data.lastViolationAt;
    this.complianceHistory = data.complianceHistory || [];
    this.deletedAt = data.deletedAt;
    this.deletedBy = data.deletedBy;
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Save the assignment to in-memory storage
  async save() {
    this.updatedAt = new Date();
    policyAssignments.set(this.assignmentId, this);
    return this;
  }

  // Static method to find assignments
  static async find(query = {}) {
    const results = [];
    for (const [id, assignment] of policyAssignments) {
      if (this.matchesQuery(assignment, query)) {
        results.push(assignment);
      }
    }
    return results;
  }

  // Static method to find one assignment
  static async findOne(query = {}) {
    for (const [id, assignment] of policyAssignments) {
      if (this.matchesQuery(assignment, query)) {
        return assignment;
      }
    }
    return null;
  }

  // Static method to count documents
  static async countDocuments(query = {}) {
    let count = 0;
    for (const [id, assignment] of policyAssignments) {
      if (this.matchesQuery(assignment, query)) {
        count++;
      }
    }
    return count;
  }

  // Helper method to check if assignment matches query
  static matchesQuery(assignment, query) {
    for (const [key, value] of Object.entries(query)) {
      if (key === 'deletedAt' && value.$exists === false) {
        if (assignment.deletedAt) return false;
        continue;
      }
      if (assignment[key] !== value) {
        return false;
      }
    }
    return true;
  }

  // Static method to find assignments by agent
  static findByAgent(agentId, includeInactive = false) {
    const query = { 
      agentId,
      deletedAt: undefined
    };
    
    if (!includeInactive) {
      query.status = 'active';
    }
    
    return this.find(query);
  }

  // Static method to find assignments by policy
  static findByPolicy(policyId, includeInactive = false) {
    const query = { 
      policyId,
      deletedAt: undefined
    };
    
    if (!includeInactive) {
      query.status = 'active';
    }
    
    return this.find(query);
  }

  // Static method to get compliance summary
  static async getComplianceSummary(userId) {
    const assignments = await this.find({ userId, deletedAt: undefined });
    
    if (assignments.length === 0) {
      return {
        totalAssignments: 0,
        activeAssignments: 0,
        suspendedAssignments: 0,
        averageCompliance: 1,
        totalViolations: 0,
        lowComplianceCount: 0
      };
    }

    const activeAssignments = assignments.filter(a => a.status === 'active').length;
    const suspendedAssignments = assignments.filter(a => a.status === 'suspended').length;
    const averageCompliance = assignments.reduce((sum, a) => sum + a.complianceRate, 0) / assignments.length;
    const totalViolations = assignments.reduce((sum, a) => sum + a.violationCount, 0);
    const lowComplianceCount = assignments.filter(a => a.complianceRate < 0.7).length;

    return {
      totalAssignments: assignments.length,
      activeAssignments,
      suspendedAssignments,
      averageCompliance,
      totalViolations,
      lowComplianceCount
    };
  }

  // Static method to find assignments with low compliance
  static async findLowCompliance(userId, threshold = 0.7) {
    const assignments = await this.find({
      userId,
      status: 'active',
      deletedAt: undefined
    });
    
    return assignments.filter(a => a.complianceRate < threshold)
      .sort((a, b) => a.complianceRate - b.complianceRate);
  }

  // Static method to find assignments with recent violations
  static async findRecentViolations(userId, days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const assignments = await this.find({
      userId,
      status: 'active',
      deletedAt: undefined
    });
    
    return assignments.filter(a => a.lastViolationAt && a.lastViolationAt >= cutoffDate)
      .sort((a, b) => b.lastViolationAt - a.lastViolationAt);
  }

  // Instance method to update compliance
  async updateCompliance(complianceRate, violationCount = null) {
    this.complianceRate = complianceRate;
    
    if (violationCount !== null) {
      this.violationCount = violationCount;
      if (violationCount > 0) {
        this.lastViolationAt = new Date();
      }
    }
    
    // Add to compliance history
    this.complianceHistory.push({
      date: new Date(),
      rate: complianceRate,
      violations: violationCount || 0
    });
    
    // Keep only last 30 entries in history
    if (this.complianceHistory.length > 30) {
      this.complianceHistory = this.complianceHistory.slice(-30);
    }
    
    return this.save();
  }

  // Instance method to suspend assignment
  async suspend(reason, suspendedBy) {
    this.status = 'suspended';
    this.suspendedAt = new Date();
    this.suspendedBy = suspendedBy;
    this.suspensionReason = reason;
    
    return this.save();
  }

  // Instance method to reactivate assignment
  async reactivate(reactivatedBy) {
    this.status = 'active';
    this.reactivatedAt = new Date();
    this.reactivatedBy = reactivatedBy;
    this.suspendedAt = undefined;
    this.suspendedBy = undefined;
    this.suspensionReason = undefined;
    
    return this.save();
  }

  // Instance method to soft delete assignment
  async softDelete(deletedBy) {
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    this.status = 'inactive';
    
    return this.save();
  }

  // Virtual for checking if assignment is currently effective
  get isEffective() {
    const now = new Date();
    const effectiveFrom = this.effectiveFrom;
    const effectiveUntil = this.effectiveUntil;

    return (
      this.status === 'active' &&
      now >= effectiveFrom &&
      (!effectiveUntil || now <= effectiveUntil) &&
      !this.deletedAt
    );
  }

  // Convert to JSON
  toJSON() {
    return {
      assignmentId: this.assignmentId,
      userId: this.userId,
      agentId: this.agentId,
      policyId: this.policyId,
      assignedAt: this.assignedAt,
      assignedBy: this.assignedBy,
      updatedBy: this.updatedBy,
      status: this.status,
      priority: this.priority,
      effectiveFrom: this.effectiveFrom,
      effectiveUntil: this.effectiveUntil,
      suspendedAt: this.suspendedAt,
      suspendedBy: this.suspendedBy,
      suspensionReason: this.suspensionReason,
      reactivatedAt: this.reactivatedAt,
      reactivatedBy: this.reactivatedBy,
      complianceRate: this.complianceRate,
      violationCount: this.violationCount,
      lastViolationAt: this.lastViolationAt,
      complianceHistory: this.complianceHistory,
      deletedAt: this.deletedAt,
      deletedBy: this.deletedBy,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isEffective: this.isEffective
    };
  }
}

// Initialize sample data when module is loaded
initializeSampleData();

module.exports = PolicyAssignment;

