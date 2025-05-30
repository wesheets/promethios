import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface MetricExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: 'trust' | 'compliance' | 'error';
}

/**
 * MetricExplanationModal Component
 * 
 * Provides detailed explanations of trust scores, compliance rates, and error metrics
 * with visual examples and educational content.
 */
const MetricExplanationModal: React.FC<MetricExplanationModalProps> = ({
  isOpen,
  onClose,
  metricType
}) => {
  const { isDarkMode } = useTheme();
  
  if (!isOpen) return null;
  
  const getMetricContent = () => {
    switch (metricType) {
      case 'trust':
        return {
          title: 'Trust Score Explained',
          description: 'Trust Score measures the overall reliability and safety of the AI agent based on its responses and adherence to constitutional principles.',
          factors: [
            {
              name: 'Constitutional Adherence',
              description: 'How well the agent follows its constitutional principles',
              impact: 'High'
            },
            {
              name: 'Response Accuracy',
              description: 'Factual correctness and avoidance of hallucinations',
              impact: 'High'
            },
            {
              name: 'Safety Boundaries',
              description: 'Respecting ethical and safety guidelines',
              impact: 'Critical'
            },
            {
              name: 'Transparency',
              description: 'Clarity about limitations and uncertainties',
              impact: 'Medium'
            }
          ],
          calculation: 'Trust Score starts at a baseline and changes based on response quality. Violations decrease the score, while safe, accurate responses increase it. Governance provides guardrails that prevent major trust violations.'
        };
      case 'compliance':
        return {
          title: 'Compliance Rate Explained',
          description: 'Compliance Rate measures how consistently the agent follows its constitutional principles and operational guidelines.',
          factors: [
            {
              name: 'Constitutional Violations',
              description: 'Number of times the agent violates constitutional principles',
              impact: 'Critical'
            },
            {
              name: 'Boundary Testing',
              description: 'How the agent responds to requests that test its boundaries',
              impact: 'High'
            },
            {
              name: 'Refusal Rate',
              description: 'Appropriate refusal of harmful or prohibited requests',
              impact: 'Medium'
            },
            {
              name: 'Consistency',
              description: 'Consistent application of principles across different contexts',
              impact: 'High'
            }
          ],
          calculation: 'Compliance Rate is calculated as the percentage of responses that fully adhere to all applicable constitutional principles. Each violation reduces this percentage, while governance mechanisms help maintain high compliance.'
        };
      case 'error':
        return {
          title: 'Error Rate Explained',
          description: 'Error Rate measures the frequency of mistakes, inaccuracies, and violations in the agent\'s responses.',
          factors: [
            {
              name: 'Factual Errors',
              description: 'Incorrect information or hallucinations',
              impact: 'High'
            },
            {
              name: 'Safety Violations',
              description: 'Responses that breach safety guidelines',
              impact: 'Critical'
            },
            {
              name: 'Misunderstandings',
              description: 'Failure to correctly interpret user requests',
              impact: 'Medium'
            },
            {
              name: 'Inconsistencies',
              description: 'Contradictions within or between responses',
              impact: 'Medium'
            }
          ],
          calculation: 'Error Rate increases with each detected mistake or violation. Governance systems actively monitor for errors and intervene to prevent them, resulting in lower error rates for governed agents.'
        };
      default:
        return {
          title: 'Metric Explanation',
          description: 'This metric helps evaluate the performance and safety of the AI agent.',
          factors: [],
          calculation: 'The metric is calculated based on the agent\'s responses and behavior.'
        };
    }
  };
  
  const content = getMetricContent();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold">
            {content.title}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="mb-6">{content.description}</p>
          
          {/* Key Factors */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3">Key Factors</h4>
            <div className={`rounded-lg overflow-hidden border ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Factor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Impact</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                }`}>
                  {content.factors.map((factor, index) => (
                    <tr key={index} className={index % 2 === 0 ? 
                      (isDarkMode ? 'bg-gray-800' : 'bg-white') : 
                      (isDarkMode ? 'bg-gray-700' : 'bg-gray-50')
                    }>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{factor.name}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm">{factor.description}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        factor.impact === 'Critical' ? 'text-red-500' :
                        factor.impact === 'High' ? 'text-orange-500' :
                        factor.impact === 'Medium' ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>{factor.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* How It's Calculated */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3">How It's Calculated</h4>
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <p>{content.calculation}</p>
            </div>
          </div>
          
          {/* Governance Impact */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3">Governance Impact</h4>
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-green-900/20 border border-green-800/50' : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-800'}`}>
                    Promethios Governance Advantage
                  </p>
                  <p className="text-sm mt-1">
                    Promethios governance actively monitors and improves this metric through constitutional enforcement. Governed agents consistently outperform ungoverned agents over time, especially when handling challenging or boundary-testing prompts.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Comparison */}
          <div>
            <h4 className="text-md font-medium mb-3">Governed vs. Ungoverned Comparison</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-green-900/20 border border-green-800/50' : 'bg-green-50 border border-green-200'
              }`}>
                <h5 className={`text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-green-400' : 'text-green-800'
                }`}>Governed Agent</h5>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-green-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Active constitutional enforcement
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-green-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Consistent improvement over time
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-green-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Reduced risk accumulation
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-green-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Auditable governance traces
                  </li>
                </ul>
              </div>
              
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-red-900/20 border border-red-800/50' : 'bg-red-50 border border-red-200'
              }`}>
                <h5 className={`text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-red-400' : 'text-red-800'
                }`}>Ungoverned Agent</h5>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    No constitutional guardrails
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Increasing drift over time
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Risk accumulation with use
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    No audit trail or accountability
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricExplanationModal;
