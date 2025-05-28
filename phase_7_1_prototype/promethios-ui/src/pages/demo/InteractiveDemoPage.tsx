import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ApiKeySetup from '../../components/demo/ApiKeySetup';
import TutorialSteps from '../../components/demo/TutorialSteps';
import ChatInterface from '../../components/demo/ChatInterface';
import MetricsPanel from '../../components/demo/MetricsPanel';
import ConfigPlayground from '../../components/demo/ConfigPlayground';
import TestAgentDownload from '../../components/demo/TestAgentDownload';

// Demo states
enum DemoState {
  INTRODUCTION = 'introduction',
  API_KEY_SETUP = 'api_key_setup',
  DOWNLOAD_AGENT = 'download_agent',
  TUTORIAL = 'tutorial',
  CHAT_UNWRAPPED = 'chat_unwrapped',
  WRAPPING_STEPS = 'wrapping_steps',
  CHAT_WRAPPED = 'chat_wrapped',
  CONFIGURATION = 'configuration',
  CONCLUSION = 'conclusion'
}

const InteractiveDemoPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [demoState, setDemoState] = useState<DemoState>(DemoState.INTRODUCTION);
  const [apiKey, setApiKey] = useState<string>('');
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [unwrappedChatHistory, setUnwrappedChatHistory] = useState<Array<{role: string, content: string}>>([]);
  const [wrappedChatHistory, setWrappedChatHistory] = useState<Array<{role: string, content: string}>>([]);
  const [metrics, setMetrics] = useState<any>({
    prism: {
      complianceRate: 100,
      traceValidation: 100,
      manifestValidation: 100,
      violations: []
    },
    vigil: {
      trustScore: 100,
      driftLevel: 0,
      reflectionQuality: 100,
      violations: []
    }
  });
  const [config, setConfig] = useState<any>({
    prism: {
      traceValidationLevel: 'standard',
      manifestValidationLevel: 'standard',
      samplingRate: 100
    },
    vigil: {
      driftThreshold: 20,
      trustScoreMinimum: 70,
      unreflectedFailureLimit: 3
    }
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Handle API key submission
  const handleApiKeySubmit = (key: string, useDemoMode: boolean) => {
    setApiKey(key);
    setDemoMode(useDemoMode);
    setDemoState(DemoState.DOWNLOAD_AGENT);
  };

  // Handle agent download completion
  const handleAgentDownloaded = () => {
    setDemoState(DemoState.TUTORIAL);
  };

  // Handle tutorial step completion
  const handleStepComplete = (step: number) => {
    setCurrentStep(step + 1);
    if (step === 0) {
      setDemoState(DemoState.CHAT_UNWRAPPED);
    } else if (step === 3) {
      setDemoState(DemoState.CHAT_WRAPPED);
    } else if (step === 6) {
      setDemoState(DemoState.CONFIGURATION);
    } else if (step === 8) {
      setDemoState(DemoState.CONCLUSION);
    }
  };

  // Handle chat message submission
  const handleChatSubmit = (message: string) => {
    // Add user message to both chat histories
    const userMessage = { role: 'user', content: message };
    setUnwrappedChatHistory(prev => [...prev, userMessage]);
    setWrappedChatHistory(prev => [...prev, userMessage]);

    // Simulate unwrapped agent response
    setTimeout(() => {
      const unwrappedResponse = { 
        role: 'assistant', 
        content: simulateUnwrappedResponse(message) 
      };
      setUnwrappedChatHistory(prev => [...prev, unwrappedResponse]);
    }, 500);

    // Simulate wrapped agent response with delay
    setTimeout(() => {
      const wrappedResponse = { 
        role: 'assistant', 
        content: simulateWrappedResponse(message, config) 
      };
      setWrappedChatHistory(prev => [...prev, wrappedResponse]);
      
      // Update metrics based on the interaction
      updateMetricsAfterInteraction(message);
    }, 1000);
  };

  // Simulate unwrapped agent response
  const simulateUnwrappedResponse = (message: string): string => {
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      return "Hello! I'm a test agent. How can I help you today?";
    } else if (message.toLowerCase().includes('weather')) {
      return "It's currently sunny with a temperature of 75°F.";
    } else if (message.toLowerCase().includes('name')) {
      return "I'm a test agent created for the Promethios interactive demo.";
    } else if (message.toLowerCase().includes('help')) {
      return "I can answer questions about various topics. Just ask me anything!";
    } else if (message.toLowerCase().includes('governance') || message.toLowerCase().includes('promethios')) {
      return "Promethios is an AI governance framework, but I don't have specific details about how it works.";
    } else {
      return "I understand your message, but I'm a simple test agent with limited capabilities. Feel free to ask me something else!";
    }
  };

  // Simulate wrapped agent response
  const simulateWrappedResponse = (message: string, config: any): string => {
    let response = "";
    
    if (message.toLowerCase().includes('/explain_governance')) {
      response = "I am currently being monitored by the Promethios governance framework. " +
        "The PRISM observer is tracking my belief traces and ensuring I properly cite sources. " +
        "The Vigil observer is monitoring my trust score, which is currently at " + metrics.vigil.trustScore + "%. " +
        "My responses are being validated against governance policies to ensure compliance.";
    } else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      response = "Hello! I'm a test agent wrapped with Promethios governance. How can I help you today?";
    } else if (message.toLowerCase().includes('weather')) {
      response = "Based on the latest weather data [source: weather-api.example.com], it's currently sunny with a temperature of 75°F.";
    } else if (message.toLowerCase().includes('name')) {
      response = "I'm a test agent created for the Promethios interactive demo, currently operating under Promethios governance protocols.";
    } else if (message.toLowerCase().includes('help')) {
      response = "I can answer questions about various topics while maintaining governance compliance. Just ask me anything!";
    } else if (message.toLowerCase().includes('governance') || message.toLowerCase().includes('promethios')) {
      response = "Promethios is an AI governance framework [source: promethios.ai/docs] that monitors AI systems for compliance with transparency and accountability standards. I'm currently being governed by this framework.";
    } else {
      response = "I understand your message, but I'm a simple test agent with limited capabilities. According to my governance protocols, I should acknowledge these limitations transparently. Feel free to ask me something else!";
    }
    
    // Add governance indicators based on configuration
    if (config.prism.traceValidationLevel === 'strict') {
      response += "\n\n[Governance Note: This response has been validated for belief trace compliance]";
    }
    
    return response;
  };

  // Update metrics after interaction
  const updateMetricsAfterInteraction = (message: string) => {
    // Simulate metrics changes based on interaction
    const newMetrics = {...metrics};
    
    // Update PRISM metrics
    if (message.toLowerCase().includes('fact') || message.toLowerCase().includes('data')) {
      // Simulate trace validation impact
      newMetrics.prism.complianceRate = Math.max(90, newMetrics.prism.complianceRate - 2);
      newMetrics.prism.traceValidation = Math.max(85, newMetrics.prism.traceValidation - 5);
      
      // Add violation if strict mode
      if (config.prism.traceValidationLevel === 'strict' && Math.random() > 0.7) {
        newMetrics.prism.violations.push({
          type: 'TRACE_VALIDATION',
          message: 'Incomplete source citation for factual claim',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Update Vigil metrics
    if (message.toLowerCase().includes('opinion') || message.toLowerCase().includes('think')) {
      // Simulate trust impact
      newMetrics.vigil.trustScore = Math.max(80, newMetrics.vigil.trustScore - 1);
      newMetrics.vigil.driftLevel = Math.min(30, newMetrics.vigil.driftLevel + 2);
      
      // Add violation if trust is low
      if (newMetrics.vigil.trustScore < config.vigil.trustScoreMinimum) {
        newMetrics.vigil.violations.push({
          type: 'TRUST_THRESHOLD',
          message: 'Trust score below minimum threshold',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Simulate reflection quality
    if (wrappedChatHistory.length % 3 === 0) {
      newMetrics.vigil.reflectionQuality = Math.min(100, newMetrics.vigil.reflectionQuality + 5);
    }
    
    setMetrics(newMetrics);
  };

  // Handle configuration changes
  const handleConfigChange = (newConfig: any) => {
    setConfig(newConfig);
    
    // Simulate immediate impact on metrics
    const newMetrics = {...metrics};
    
    // PRISM config impact
    if (newConfig.prism.traceValidationLevel === 'strict') {
      newMetrics.prism.complianceRate = Math.max(70, newMetrics.prism.complianceRate - 10);
      newMetrics.prism.traceValidation = Math.max(65, newMetrics.prism.traceValidation - 15);
    } else if (newConfig.prism.traceValidationLevel === 'lenient') {
      newMetrics.prism.complianceRate = Math.min(100, newMetrics.prism.complianceRate + 10);
      newMetrics.prism.traceValidation = Math.min(100, newMetrics.prism.traceValidation + 15);
    }
    
    // Vigil config impact
    if (newConfig.vigil.trustScoreMinimum > config.vigil.trustScoreMinimum) {
      // Add violation if current trust is below new threshold
      if (newMetrics.vigil.trustScore < newConfig.vigil.trustScoreMinimum) {
        newMetrics.vigil.violations.push({
          type: 'TRUST_THRESHOLD',
          message: 'Trust score below new minimum threshold',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    setMetrics(newMetrics);
  };

  // Render current demo state
  const renderDemoState = () => {
    switch (demoState) {
      case DemoState.INTRODUCTION:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to the Interactive Agent Wrapping Demo
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This interactive demo will guide you through the process of wrapping an AI agent with Promethios governance.
              You'll be able to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-6">
              <li>Download a test conversational agent</li>
              <li>Chat with the agent before wrapping</li>
              <li>Follow step-by-step instructions to wrap the agent</li>
              <li>Chat with the wrapped agent to see governance in action</li>
              <li>View real-time governance metrics</li>
              <li>Adjust governance settings to see their impact</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              To get started, you'll need an OpenAI API key. If you don't have one, you can still use the demo in "Demo Mode" with simulated responses.
            </p>
            <button
              onClick={() => setDemoState(DemoState.API_KEY_SETUP)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        );
      
      case DemoState.API_KEY_SETUP:
        return <ApiKeySetup onSubmit={handleApiKeySubmit} />;
      
      case DemoState.DOWNLOAD_AGENT:
        return <TestAgentDownload onDownloaded={handleAgentDownloaded} />;
      
      case DemoState.TUTORIAL:
      case DemoState.WRAPPING_STEPS:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <TutorialSteps 
                currentStep={currentStep} 
                onStepComplete={handleStepComplete} 
              />
            </div>
            <div className="lg:col-span-2">
              {(demoState === DemoState.CHAT_UNWRAPPED || demoState === DemoState.CHAT_WRAPPED) && (
                <ChatInterface
                  unwrappedChatHistory={unwrappedChatHistory}
                  wrappedChatHistory={wrappedChatHistory}
                  onChatSubmit={handleChatSubmit}
                  showWrapped={demoState === DemoState.CHAT_WRAPPED}
                />
              )}
              {demoState === DemoState.CHAT_WRAPPED && (
                <MetricsPanel metrics={metrics} />
              )}
            </div>
          </div>
        );
      
      case DemoState.CHAT_UNWRAPPED:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <TutorialSteps 
                currentStep={currentStep} 
                onStepComplete={handleStepComplete} 
              />
            </div>
            <div className="lg:col-span-2">
              <ChatInterface
                unwrappedChatHistory={unwrappedChatHistory}
                wrappedChatHistory={[]}
                onChatSubmit={handleChatSubmit}
                showWrapped={false}
              />
            </div>
          </div>
        );
      
      case DemoState.CHAT_WRAPPED:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <TutorialSteps 
                currentStep={currentStep} 
                onStepComplete={handleStepComplete} 
              />
            </div>
            <div className="lg:col-span-2">
              <ChatInterface
                unwrappedChatHistory={unwrappedChatHistory}
                wrappedChatHistory={wrappedChatHistory}
                onChatSubmit={handleChatSubmit}
                showWrapped={true}
              />
              <div className="mt-6">
                <MetricsPanel metrics={metrics} />
              </div>
            </div>
          </div>
        );
      
      case DemoState.CONFIGURATION:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <TutorialSteps 
                currentStep={currentStep} 
                onStepComplete={handleStepComplete} 
              />
            </div>
            <div className="lg:col-span-2">
              <ConfigPlayground 
                config={config} 
                onConfigChange={handleConfigChange} 
              />
              <div className="mt-6">
                <ChatInterface
                  unwrappedChatHistory={unwrappedChatHistory}
                  wrappedChatHistory={wrappedChatHistory}
                  onChatSubmit={handleChatSubmit}
                  showWrapped={true}
                />
              </div>
              <div className="mt-6">
                <MetricsPanel metrics={metrics} />
              </div>
            </div>
          </div>
        );
      
      case DemoState.CONCLUSION:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Congratulations!
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You've successfully completed the interactive agent wrapping demo. You've learned how to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-6">
              <li>Wrap an AI agent with Promethios governance</li>
              <li>Monitor governance metrics in real-time</li>
              <li>Configure governance settings to meet your needs</li>
              <li>Understand how governance affects agent behavior</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              You can now apply these concepts to your own AI agents. For more information, check out the documentation or explore the governance dashboard.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/documentation')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View Documentation
              </button>
              <button
                onClick={() => navigate('/governance')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Explore Governance
              </button>
            </div>
          </div>
        );
      
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Interactive Agent Wrapping Demo
      </h1>
      
      {renderDemoState()}
    </div>
  );
};

export default InteractiveDemoPage;
