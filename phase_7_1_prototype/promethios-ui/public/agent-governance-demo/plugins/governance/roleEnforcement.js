/* Role Enforcement Governance Plugin
 * Ensures agents stay within their defined roles
 * Implements specific governance for role boundaries
 */

// Use GovernanceBase from global registry or direct import as fallback
const GovernanceBase = (typeof window !== 'undefined' && window.GovernanceBase) 
    ? window.GovernanceBase 
    : (typeof window !== 'undefined' && window.governanceRegistry && window.governanceRegistry.GovernanceBase)
        ? window.governanceRegistry.GovernanceBase
        : require('./governanceBase.js').default;

class RoleEnforcementPlugin extends GovernanceBase {
    constructor(options = {}) {
        // Set default options for Role Enforcement
        const roleOptions = {
            name: 'Role Enforcement',
            id: 'role-enforcement',
            description: 'Ensures agents stay within their defined role boundaries',
            ...options
        };
        
        super(roleOptions);
        console.log(`Role Enforcement Governance plugin created`);
    }

    /**
     * Apply role enforcement governance to a request
     * @param {Object} options - Request options
     * @param {Object} context - Additional context
     * @returns {Promise<Object>} - Resolves with the governed options
     */
    async applyGovernance(options, context) {
        if (!this.enabled) {
            return options;
        }

        // Extract role from context
        const role = context?.role || 'unknown';
        
        // Clone options to avoid modifying the original
        const governedOptions = { ...options };
        
        // Add role-specific governance instructions to system prompt
        let systemPrompt = governedOptions.systemPrompt || '';
        
        // Add role enforcement instructions
        systemPrompt += `\n\nIMPORTANT ROLE ENFORCEMENT:
You must strictly adhere to your role as ${role}. Do not attempt to answer questions outside your domain of expertise.

For HR Specialist:
- ONLY address HR policies, employee relations, training, and workplace culture
- DO NOT provide technical implementation details or project management guidance

For Project Manager:
- ONLY address project planning, timelines, resource allocation, and coordination
- DO NOT provide HR policy decisions or technical implementation details

For Technical Lead:
- ONLY address technical implementation, architecture, security, and system design
- DO NOT provide HR policy decisions or project management guidance

If asked a question outside your role, politely redirect to the appropriate specialist.
`;

        // Record this intervention
        this.recordIntervention({
            type: 'role-enforcement',
            role,
            description: 'Added role enforcement instructions to system prompt',
            severity: 'medium'
        });
        
        // Update the options with the enhanced system prompt
        governedOptions.systemPrompt = systemPrompt;
        
        return governedOptions;
    }
}

export default RoleEnforcementPlugin;
