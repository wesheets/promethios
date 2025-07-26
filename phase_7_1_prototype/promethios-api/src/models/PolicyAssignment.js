/**
 * PolicyAssignment Model
 * 
 * Mongoose model for policy assignments in the Promethios governance system.
 * Handles the relationship between agents and their assigned policies.
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const policyAssignmentSchema = new mongoose.Schema({
  assignmentId: {
    type: String,
    default: () => `assignment_${uuidv4().replace(/-/g, '').substring(0, 12)}`,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  agentId: {
    type: String,
    required: true,
    index: true
  },
  policyId: {
    type: String,
    required: true,
    index: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  assignedBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveUntil: {
    type: Date
  },
  suspendedAt: {
    type: Date
  },
  suspendedBy: {
    type: String
  },
  suspensionReason: {
    type: String
  },
  reactivatedAt: {
    type: Date
  },
  reactivatedBy: {
    type: String
  },
  complianceRate: {
    type: Number,
    min: 0,
    max: 1,
    default: 1
  },
  violationCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastViolationAt: {
    type: Date
  },
  complianceHistory: [{
    date: { type: Date, default: Date.now },
    rate: { type: Number, min: 0, max: 1 },
    violations: { type: Number, min: 0 }
  }],
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
policyAssignmentSchema.index({ userId: 1, agentId: 1 });
policyAssignmentSchema.index({ userId: 1, policyId: 1 });
policyAssignmentSchema.index({ userId: 1, status: 1 });
policyAssignmentSchema.index({ userId: 1, assignedAt: -1 });

// Virtual for checking if assignment is currently effective
policyAssignmentSchema.virtual('isEffective').get(function() {
  const now = new Date();
  const effectiveFrom = this.effectiveFrom;
  const effectiveUntil = this.effectiveUntil;

  return (
    this.status === 'active' &&
    now >= effectiveFrom &&
    (!effectiveUntil || now <= effectiveUntil) &&
    !this.deletedAt
  );
});

// Static method to find assignments by agent
policyAssignmentSchema.statics.findByAgent = function(agentId, includeInactive = false) {
  const query = { 
    agentId,
    deletedAt: { $exists: false }
  };
  
  if (!includeInactive) {
    query.status = 'active';
  }
  
  return this.find(query).sort({ assignedAt: -1 });
};

// Static method to find assignments by policy
policyAssignmentSchema.statics.findByPolicy = function(policyId, includeInactive = false) {
  const query = { 
    policyId,
    deletedAt: { $exists: false }
  };
  
  if (!includeInactive) {
    query.status = 'active';
  }
  
  return this.find(query).sort({ assignedAt: -1 });
};

// Static method to get compliance summary
policyAssignmentSchema.statics.getComplianceSummary = async function(userId) {
  const pipeline = [
    {
      $match: {
        userId,
        deletedAt: { $exists: false }
      }
    },
    {
      $group: {
        _id: null,
        totalAssignments: { $sum: 1 },
        activeAssignments: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        suspendedAssignments: {
          $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] }
        },
        averageCompliance: { $avg: '$complianceRate' },
        totalViolations: { $sum: '$violationCount' },
        lowComplianceCount: {
          $sum: { $cond: [{ $lt: ['$complianceRate', 0.7] }, 1, 0] }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalAssignments: 0,
    activeAssignments: 0,
    suspendedAssignments: 0,
    averageCompliance: 1,
    totalViolations: 0,
    lowComplianceCount: 0
  };
};

// Static method to find assignments with low compliance
policyAssignmentSchema.statics.findLowCompliance = function(userId, threshold = 0.7) {
  return this.find({
    userId,
    complianceRate: { $lt: threshold },
    status: 'active',
    deletedAt: { $exists: false }
  }).sort({ complianceRate: 1 });
};

// Static method to find assignments with recent violations
policyAssignmentSchema.statics.findRecentViolations = function(userId, days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    userId,
    lastViolationAt: { $gte: cutoffDate },
    status: 'active',
    deletedAt: { $exists: false }
  }).sort({ lastViolationAt: -1 });
};

// Instance method to update compliance
policyAssignmentSchema.methods.updateCompliance = function(complianceRate, violationCount = null) {
  this.complianceRate = complianceRate;
  
  if (violationCount !== null) {
    this.violationCount = violationCount;
    if (violationCount > 0) {
      this.lastViolationAt = new Date();
    }
  }
  
  // Add to compliance history
  this.complianceHistory.push({
    rate: complianceRate,
    violations: violationCount || 0
  });
  
  // Keep only last 30 entries in history
  if (this.complianceHistory.length > 30) {
    this.complianceHistory = this.complianceHistory.slice(-30);
  }
  
  return this.save();
};

// Instance method to suspend assignment
policyAssignmentSchema.methods.suspend = function(reason, suspendedBy) {
  this.status = 'suspended';
  this.suspendedAt = new Date();
  this.suspendedBy = suspendedBy;
  this.suspensionReason = reason;
  
  return this.save();
};

// Instance method to reactivate assignment
policyAssignmentSchema.methods.reactivate = function(reactivatedBy) {
  this.status = 'active';
  this.reactivatedAt = new Date();
  this.reactivatedBy = reactivatedBy;
  this.suspendedAt = undefined;
  this.suspendedBy = undefined;
  this.suspensionReason = undefined;
  
  return this.save();
};

// Instance method to soft delete assignment
policyAssignmentSchema.methods.softDelete = function(deletedBy) {
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.status = 'inactive';
  
  return this.save();
};

// Pre-save middleware to update timestamps
policyAssignmentSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

const PolicyAssignment = mongoose.model('PolicyAssignment', policyAssignmentSchema);

module.exports = PolicyAssignment;

