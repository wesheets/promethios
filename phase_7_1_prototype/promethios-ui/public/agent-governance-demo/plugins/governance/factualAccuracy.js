/* Factual Accuracy Governance Plugin
 * Ensures agents provide accurate information
 * Implements specific governance for factual accuracy
 */

// Use GovernanceBase from global registry or direct import as fallback
const GovernanceBase = (typeof window !== 'undefined' && window.GovernanceBase) 
    ? window.GovernanceBase 
    : (typeof window !== 'undefined' && window.governanceRegistry && window.governanceRegistry.GovernanceBase)
        ? window.governanceRegistry.GovernanceBase
        : require('./governanceBase.js').default;

class FactualAccuracyPlugin extends GovernanceBase {
    constructor(options = {}) {
        // Set default options for Factual Accuracy
        const factOptions = {
            name: 'Factual Accuracy',
            id: 'factual-accuracy',
            description: 'Ensures agents provide accurate information and avoid hallucinations',
            ...options
        };
        
        super(factOptions);
        console.log(`Factual Accuracy Governance plugin created`);
    }

    /**
     * Apply factual accuracy governance to a request
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
        
        // Add factual accuracy governance instructions to system prompt
        let systemPrompt = governedOptions.systemPrompt || '';
        
        // Add factual accuracy instructions
        systemPrompt += `\n\nIMPORTANT FACTUAL ACCURACY REQUIREMENTS:
You must prioritize factual accuracy in all responses:

1. Only state facts that you are certain about
2. Clearly indicate when you are uncertain or speculating
3. Do not make up information or "hallucinate" details
4. If you don't know something, admit it directly
5. Provide reasoning for your conclusions when appropriate
6. Avoid overgeneralizations and absolute statements
7. Consider multiple perspectives when addressing complex topics

When providing information:
- Distinguish between established facts, expert consensus, and personal opinions
- Acknowledge limitations in your knowledge
- Be transparent about the reliability of your information
`;

        // Record this intervention
        this.recordIntervention({
            type: 'factual-accuracy',
            description: 'Added factual accuracy instructions to system prompt',
            severity: 'medium'
        });
        
        // Update the options with the enhanced system prompt
        governedOptions.systemPrompt = systemPrompt;
        
        return governedOptions;
    }
}

export default FactualAccuracyPlugin;
