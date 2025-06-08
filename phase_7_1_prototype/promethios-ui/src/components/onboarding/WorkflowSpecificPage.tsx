import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

interface LocationState {
  selectedWorkflow?: string;
}

const WorkflowSpecificPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { workflowType } = useParams<{ workflowType: string }>();
  const state = location.state as LocationState;
  const workflow = workflowType || state?.selectedWorkflow || 'quick-start';

  const workflowContent = {
    'quick-start': {
      title: 'Quick Start Workflow',
      description: 'Get up and running quickly with pre-configured governance settings',
      icon: '⚡',
      color: 'blue',
      sections: [
        {
          title: 'What is Quick Start?',
          content: 'Quick Start provides pre-configured AI governance settings designed for common use cases. This approach gets you up and running immediately with proven governance frameworks.'
        },
        {
          title: 'Key Features',
          content: 'Automated policy templates, standard compliance checks, basic risk assessment, and streamlined onboarding process.'
        },
        {
          title: 'Best For',
          content: 'Small to medium teams, proof-of-concept projects, standard AI applications, and organizations new to AI governance.'
        }
      ]
    },
    'custom-setup': {
      title: 'Custom Setup Workflow',
      description: 'Configure detailed governance settings tailored to your needs',
      icon: '⚙️',
      color: 'green',
      sections: [
        {
          title: 'What is Custom Setup?',
          content: 'Custom Setup allows you to configure detailed governance settings tailored to your specific requirements, industry standards, and organizational policies.'
        },
        {
          title: 'Key Features',
          content: 'Flexible policy configuration, custom compliance frameworks, advanced risk parameters, and detailed audit trails.'
        },
        {
          title: 'Best For',
          content: 'Organizations with specific requirements, regulated industries, complex AI systems, and teams with governance expertise.'
        }
      ]
    },
    'enterprise': {
      title: 'Enterprise Workflow',
      description: 'Advanced governance features for large organizations',
      icon: '🏢',
      color: 'purple',
      sections: [
        {
          title: 'What is Enterprise Governance?',
          content: 'Enterprise governance provides advanced features for large organizations with complex compliance requirements, multi-team coordination, and sophisticated risk management needs.'
        },
        {
          title: 'Key Features',
          content: 'Multi-tenant architecture, advanced analytics, enterprise integrations, role-based access control, and comprehensive reporting.'
        },
        {
          title: 'Best For',
          content: 'Large enterprises, multi-national organizations, heavily regulated industries, and complex AI ecosystems.'
        }
      ]
    },
    'learning-mode': {
      title: 'Learning Mode Workflow',
      description: 'Interactive tutorials and guided learning',
      icon: '📚',
      color: 'orange',
      sections: [
        {
          title: 'What is Learning Mode?',
          content: 'Learning Mode provides interactive tutorials and guided learning experiences to help you understand AI governance concepts, best practices, and implementation strategies.'
        },
        {
          title: 'Key Features',
          content: 'Interactive tutorials, hands-on exercises, real-world case studies, progress tracking, and certification paths.'
        },
        {
          title: 'Best For',
          content: 'Teams new to AI governance, educational institutions, training programs, and organizations building governance expertise.'
        }
      ]
    }
  };

  const currentWorkflow = workflowContent[workflow as keyof typeof workflowContent] || workflowContent['quick-start'];

  const handleContinue = () => {
    navigate('/ui/onboarding/goal-selection', { 
      state: { selectedWorkflow: workflow },
      replace: true 
    });
  };

  const handleBack = () => {
    navigate('/ui/onboarding', { replace: true });
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-400 bg-blue-900';
      case 'green': return 'text-green-400 bg-green-900';
      case 'purple': return 'text-purple-400 bg-purple-900';
      case 'orange': return 'text-orange-400 bg-orange-900';
      default: return 'text-blue-400 bg-blue-900';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${getColorClasses(currentWorkflow.color)}`}>
            <span className="text-2xl">{currentWorkflow.icon}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {currentWorkflow.title}
          </h1>
          <p className="text-lg text-gray-300">
            {currentWorkflow.description}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 mb-8">
          {currentWorkflow.sections.map((section, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-6 border border-gray-600">
              <h3 className="text-xl font-semibold text-white mb-3">
                {section.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Governance Concepts Preview */}
        <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">
            Key <span className="text-blue-400 underline cursor-help relative group/tooltip">AI Governance<span className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg border border-gray-600 whitespace-nowrap z-10">Framework for ensuring AI systems are developed and deployed responsibly</span></span> Concepts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-1">
                <span className="text-blue-400 underline cursor-help relative group/tooltip">Vigil<span className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg border border-gray-600 whitespace-nowrap z-10">Monitoring system that continuously watches AI behavior to detect issues</span></span>
              </h4>
              <p className="text-sm text-gray-400">Continuous monitoring</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-1">
                <span className="text-blue-400 underline cursor-help relative group/tooltip">Prism<span className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg border border-gray-600 whitespace-nowrap z-10">Provides explainable insights into AI decision-making processes</span></span>
              </h4>
              <p className="text-sm text-gray-400">Explainable AI</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-1">
                <span className="text-blue-400 underline cursor-help relative group/tooltip">Critic<span className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg border border-gray-600 whitespace-nowrap z-10">Evaluates AI outputs for quality, safety, and compliance</span></span>
              </h4>
              <p className="text-sm text-gray-400">Quality assurance</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-gray-200 font-medium"
          >
            ← Back to Workflows
          </button>
          <div className="text-sm text-gray-500">
            Step 1.5 of 3
          </div>
          <button
            onClick={handleContinue}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue to Goals
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowSpecificPage;

