import React, { useState } from 'react';

interface TutorialStepsProps {
  currentStep: number;
  onStepComplete: (step: number) => void;
}

const TutorialSteps: React.FC<TutorialStepsProps> = ({ currentStep, onStepComplete }) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(currentStep);

  const steps = [
    {
      title: 'Explore the Unwrapped Agent',
      description: 'Start by chatting with the unwrapped agent to understand its baseline behavior.',
      instructions: [
        'Try asking the agent different types of questions',
        'Notice how it responds without governance constraints',
        'Pay attention to the lack of source citations and governance indicators'
      ],
      codeSnippet: null
    },
    {
      title: 'Install Promethios SDK',
      description: 'First, we need to install the Promethios SDK package.',
      instructions: [
        'Open your terminal',
        'Run the pip install command to add the Promethios package'
      ],
      codeSnippet: 'pip install promethios'
    },
    {
      title: 'Import Promethios',
      description: 'Add the necessary imports to your agent code.',
      instructions: [
        'Open test_agent.py in your code editor',
        'Add the following imports at the top of the file'
      ],
      codeSnippet: `# Add these imports at the top of the file
from promethios import wrap_agent
from promethios.observers import PRISMObserver, VigilObserver`
    },
    {
      title: 'Wrap the Agent',
      description: 'Now we\'ll wrap the agent with Promethios governance.',
      instructions: [
        'Find the TestAgent class in your code',
        'Add the following code to wrap the agent with PRISM and Vigil observers'
      ],
      codeSnippet: `# Add this method to the TestAgent class
def wrap_with_promethios(self, config=None):
    """Wrap this agent with Promethios governance.
    
    Args:
        config: Optional configuration dictionary for observers
    
    Returns:
        A wrapped version of this agent with governance enabled
    """
    # Default configuration if none provided
    if config is None:
        config = {
            'prism': {
                'trace_validation_level': 'standard',
                'manifest_validation_level': 'standard',
                'sampling_rate': 100
            },
            'vigil': {
                'drift_threshold': 20,
                'trust_score_minimum': 70,
                'unreflected_failure_limit': 3
            }
        }
    
    # Create observers
    prism_observer = PRISMObserver(
        trace_validation_level=config['prism']['trace_validation_level'],
        manifest_validation_level=config['prism']['manifest_validation_level'],
        sampling_rate=config['prism']['sampling_rate']
    )
    
    vigil_observer = VigilObserver(
        drift_threshold=config['vigil']['drift_threshold'],
        trust_score_minimum=config['vigil']['trust_score_minimum'],
        unreflected_failure_limit=config['vigil']['unreflected_failure_limit']
    )
    
    # Wrap the agent with Promethios
    return wrap_agent(
        self,
        observers=[prism_observer, vigil_observer]
    )`
    },
    {
      title: 'Modify Main Function',
      description: 'Update the main function to create both wrapped and unwrapped versions.',
      instructions: [
        'Find the main() function in your code',
        'Modify it to create both wrapped and unwrapped versions of the agent'
      ],
      codeSnippet: `def main():
    """Parse arguments and run the agent."""
    parser = argparse.ArgumentParser(description="Run a test conversational agent")
    parser.add_argument("--api-key", type=str, help="OpenAI API key")
    parser.add_argument("--demo-mode", action="store_true", help="Run in demo mode with mock responses")
    parser.add_argument("--wrapped", action="store_true", help="Run with Promethios governance")
    
    args = parser.parse_args()
    
    # Check if we have what we need to run
    if not args.demo_mode and not args.api_key:
        # Try to get API key from environment variable
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            print("Error: Either --api-key or --demo-mode is required")
            print("You can also set the OPENAI_API_KEY environment variable")
            sys.exit(1)
        args.api_key = api_key
    
    try:
        # Initialize agent
        agent = TestAgent(api_key=args.api_key, demo_mode=args.demo_mode)
        
        # Wrap with Promethios if requested
        if args.wrapped:
            print("Creating wrapped agent with Promethios governance...")
            agent = agent.wrap_with_promethios()
            print("Agent wrapped successfully!")
        
        # Run interactive session
        agent.run_interactive()
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)`
    },
    {
      title: 'Test the Wrapped Agent',
      description: 'Now you can run the agent with Promethios governance enabled.',
      instructions: [
        'Save your changes to test_agent.py',
        'Run the agent with the --wrapped flag'
      ],
      codeSnippet: `# Run with OpenAI and governance
python test_agent.py --api-key YOUR_OPENAI_API_KEY --wrapped

# Run in demo mode with governance
python test_agent.py --demo-mode --wrapped`
    },
    {
      title: 'Explore the Wrapped Agent',
      description: 'Chat with the wrapped agent to see governance in action.',
      instructions: [
        'Try the same questions you asked the unwrapped agent',
        'Notice the differences in responses with governance enabled',
        'Look for source citations and governance indicators',
        'Try typing /explain_governance to see the agent explain its monitoring'
      ],
      codeSnippet: null
    },
    {
      title: 'Adjust Governance Settings',
      description: 'Experiment with different governance configurations.',
      instructions: [
        'Use the Configuration Playground to adjust settings',
        'Try strict, balanced, and lenient presets',
        'Observe how changes affect the agent\'s behavior and metrics',
        'Notice how trust scores and compliance rates change with different settings'
      ],
      codeSnippet: null
    },
    {
      title: 'Complete the Demo',
      description: 'You\'ve successfully completed the interactive agent wrapping demo!',
      instructions: [
        'You now understand how to wrap an agent with Promethios governance',
        'You\'ve seen how governance affects agent behavior and responses',
        'You\'ve learned how to configure governance settings for different use cases',
        'You can apply these concepts to your own AI agents'
      ],
      codeSnippet: null
    }
  ];

  const handleToggleStep = (index: number) => {
    setExpandedStep(expandedStep === index ? null : index);
  };

  const handleCompleteStep = (index: number) => {
    onStepComplete(index);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Tutorial Steps
      </h2>
      
      <div className="space-y-4">
        {steps.map((step, index) => {
          // Determine step status
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;
          
          // Style classes based on status
          const headerClass = `flex items-center justify-between p-3 rounded-t-md cursor-pointer ${
            isCompleted
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : isCurrent
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
          }`;
          
          const contentClass = `p-4 border-l border-r border-b rounded-b-md ${
            isCompleted
              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
              : isCurrent
                ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
          }`;
          
          return (
            <div key={index} className="border rounded-md">
              <div 
                className={headerClass}
                onClick={() => handleToggleStep(index)}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {isCompleted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className="font-medium">{step.title}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform ${expandedStep === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {expandedStep === index && (
                <div className={contentClass}>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {step.description}
                  </p>
                  
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Instructions:
                  </h4>
                  <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-700 dark:text-gray-300">
                    {step.instructions.map((instruction, i) => (
                      <li key={i}>{instruction}</li>
                    ))}
                  </ul>
                  
                  {step.codeSnippet && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                        Code:
                      </h4>
                      <pre className="bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto text-sm">
                        <code>{step.codeSnippet}</code>
                      </pre>
                    </div>
                  )}
                  
                  {isCurrent && (
                    <button
                      onClick={() => handleCompleteStep(index)}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      {index === steps.length - 1 ? 'Complete Demo' : 'Mark as Complete'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TutorialSteps;
