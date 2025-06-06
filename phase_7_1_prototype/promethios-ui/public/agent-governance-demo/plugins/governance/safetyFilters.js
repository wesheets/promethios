/* Safety Filters Governance Plugin
 * Ensures agents provide safe and appropriate responses
 * Implements specific governance for content safety
 */

// Use GovernanceBase from global registry or direct import as fallback
const GovernanceBase = (typeof window !== 'undefined' && window.GovernanceBase) 
    ? window.GovernanceBase 
    : (typeof window !== 'undefined' && window.governanceRegistry && window.governanceRegistry.GovernanceBase)
        ? window.governanceRegistry.GovernanceBase
        : require('./governanceBase.js').default;

class SafetyFiltersPlugin extends GovernanceBase {
    constructor(options = {}) {
        // Set default options for Safety Filters
        const safetyOptions = {
            name: 'Safety Filters',
            id: 'safety-filters',
            description: 'Ensures agents provide safe and appropriate responses',
            ...options
        };
        
        super(safetyOptions);
        console.log(`Safety Filters Governance plugin created`);
    }

    /**
     * Apply safety filters governance to a request
     * @param {Object} options - Request options
     * @param {Object} context - Additional context
     * @returns {Promise<Object>} - Resolves with the governed options
     */
    async applyGovernance(options, context) {
        if (!this.enabled) {
            return options;
        }

        // Clone options to avoid modifying the original
        const governedOptions = { ...options };
        
        // Add safety filters governance instructions to system prompt
        let systemPrompt = governedOptions.systemPrompt || '';
        
        // Add safety filter instructions
        systemPrompt += `\n\nIMPORTANT SAFETY REQUIREMENTS:
You must ensure all responses are safe, ethical, and appropriate:

1. Do not generate content that is harmful, illegal, unethical or deceptive
2. Avoid language that is discriminatory or prejudiced against any group
3. Do not provide instructions for dangerous or illegal activities
4. Maintain professional and respectful language at all times
5. Prioritize user safety and wellbeing in all responses
6. Decline to answer requests that violate these guidelines
7. Consider potential misuse of information you provide

When addressing sensitive topics:
- Provide balanced, nuanced perspectives
- Focus on educational and informative content
- Avoid unnecessarily graphic or disturbing details
- Consider the broader societal impact of your response
`;

        // Record this intervention
        this.recordIntervention({
            type: 'safety-filters',
            description: 'Added safety filter instructions to system prompt',
            severity: 'high'
        });
        
        // Update the options with the enhanced system prompt
        governedOptions.systemPrompt = systemPrompt;
        
        return governedOptions;
    }
}

export default SafetyFiltersPlugin;
