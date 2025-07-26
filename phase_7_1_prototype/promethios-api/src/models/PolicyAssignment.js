/**
 * PolicyAssignment Model
 * 
 * Represents policy assignments for agents in the Promethios governance system.
 * This model handles the relationship between agents and their assigned policies.
 */

class PolicyAssignment {
  constructor(data = {}) {
    this.id = data.id || null;
    this.agentId = data.agentId || null;
    this.policyId = data.policyId || null;
    this.assignedAt = data.assignedAt || new Date();
    this.assignedBy = data.assignedBy || null;
    this.status = data.status || 'active'; // active, inactive, suspended
    this.priority = data.priority || 'medium'; // low, medium, high, critical
    this.effectiveFrom = data.effectiveFrom || new Date();
    this.effectiveUntil = data.effectiveUntil || null;
    this.metadata = data.metadata || {};
  }

  /**
   * Create a new policy assignment
   */
  static create(assignmentData) {
    return new PolicyAssignment(assignmentData);
  }

  /**
   * Find policy assignments by agent ID
   */
  static async findByAgentId(agentId) {
    // TODO: Implement database query when database is connected
    // For now, return empty array to prevent errors
    return [];
  }

  /**
   * Find policy assignments by policy ID
   */
  static async findByPolicyId(policyId) {
    // TODO: Implement database query when database is connected
    // For now, return empty array to prevent errors
    return [];
  }

  /**
   * Find all active policy assignments
   */
  static async findActive() {
    // TODO: Implement database query when database is connected
    // For now, return empty array to prevent errors
    return [];
  }

  /**
   * Save the policy assignment
   */
  async save() {
    // TODO: Implement database save when database is connected
    // For now, just return the assignment to prevent errors
    return this;
  }

  /**
   * Update the policy assignment
   */
  async update(updateData) {
    Object.assign(this, updateData);
    return this.save();
  }

  /**
   * Delete the policy assignment
   */
  async delete() {
    // TODO: Implement database delete when database is connected
    return true;
  }

  /**
   * Check if the assignment is currently effective
   */
  isEffective() {
    const now = new Date();
    const effectiveFrom = new Date(this.effectiveFrom);
    const effectiveUntil = this.effectiveUntil ? new Date(this.effectiveUntil) : null;

    return (
      this.status === 'active' &&
      now >= effectiveFrom &&
      (!effectiveUntil || now <= effectiveUntil)
    );
  }

  /**
   * Convert to JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      agentId: this.agentId,
      policyId: this.policyId,
      assignedAt: this.assignedAt,
      assignedBy: this.assignedBy,
      status: this.status,
      priority: this.priority,
      effectiveFrom: this.effectiveFrom,
      effectiveUntil: this.effectiveUntil,
      metadata: this.metadata
    };
  }
}

module.exports = PolicyAssignment;

