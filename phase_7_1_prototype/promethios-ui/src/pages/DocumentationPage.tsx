import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { liveObserverService, useRealtimeObserverData } from '../services/liveObservers';

// Agent wrapping examples for different frameworks
const agentWrappingExamples = {
  python: `
# Python Agent Wrapping Example
from promethios import wrap_agent, PRISMObserver, VigilObserver

# Define your agent function or class
def my_agent(input_text):
    # Agent logic here
    return "Agent response"

# Wrap your agent with Promethios governance
governed_agent = wrap_agent(
    agent=my_agent,
    observers=[PRISMObserver(), VigilObserver()],
    config={
        "agent_id": "my-python-agent",
        "trace_validation": "standard",
        "trust_threshold": 0.7
    }
)

# Use the governed agent
response = governed_agent("User query")
print(response)
  `,
  javascript: `
// JavaScript Agent Wrapping Example
import { wrapAgent, PRISMObserver, VigilObserver } from 'promethios';

// Define your agent function
function myAgent(inputText) {
  // Agent logic here
  return "Agent response";
}

// Wrap your agent with Promethios governance
const governedAgent = wrapAgent({
  agent: myAgent,
  observers: [new PRISMObserver(), new VigilObserver()],
  config: {
    agentId: "my-js-agent",
    traceValidation: "standard",
    trustThreshold: 0.7
  }
});

// Use the governed agent
const response = await governedAgent("User query");
console.log(response);
  `,
  typescript: `
// TypeScript Agent Wrapping Example
import { wrapAgent, PRISMObserver, VigilObserver, AgentConfig } from 'promethios';

// Define your agent function with types
function myAgent(inputText: string): Promise<string> {
  // Agent logic here
  return Promise.resolve("Agent response");
}

// Define configuration with TypeScript interface
const config: AgentConfig = {
  agentId: "my-ts-agent",
  traceValidation: "standard",
  trustThreshold: 0.7
};

// Wrap your agent with Promethios governance
const governedAgent = wrapAgent({
  agent: myAgent,
  observers: [new PRISMObserver(), new VigilObserver()],
  config
});

// Use the governed agent
const response = await governedAgent("User query");
console.log(response);
  `,
  langchain: `
// LangChain Agent Wrapping Example
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ConversationChain } from "langchain/chains";
import { wrapLangChainAgent, PRISMObserver, VigilObserver } from 'promethios/langchain';

// Create a LangChain agent
const llm = new ChatOpenAI({
  temperature: 0,
  modelName: "gpt-4"
});
const chain = new ConversationChain({ llm });

// Wrap the LangChain agent with Promethios governance
const governedChain = wrapLangChainAgent({
  agent: chain,
  observers: [new PRISMObserver(), new VigilObserver()],
  config: {
    agentId: "my-langchain-agent",
    traceValidation: "standard",
    trustThreshold: 0.7
  }
});

// Use the governed agent
const response = await governedChain.call({ input: "User query" });
console.log(response);
  `,
  llamaindex: `
// LlamaIndex Agent Wrapping Example
import { VectorStoreIndex } from "llamaindex";
import { wrapLlamaIndexAgent, PRISMObserver, VigilObserver } from 'promethios/llamaindex';

// Create a LlamaIndex agent
const documents = [...]; // Your documents
const index = await VectorStoreIndex.fromDocuments(documents);
const queryEngine = index.asQueryEngine();

// Wrap the LlamaIndex agent with Promethios governance
const governedQueryEngine = wrapLlamaIndexAgent({
  agent: queryEngine,
  observers: [new PRISMObserver(), new VigilObserver()],
  config: {
    agentId: "my-llamaindex-agent",
    traceValidation: "standard",
    trustThreshold: 0.7
  }
});

// Use the governed agent
const response = await governedQueryEngine.query("User query");
console.log(response);
  `
};

// SDK installation examples
const sdkInstallationExamples = {
  npm: `npm install promethios`,
  yarn: `yarn add promethios`,
  pip: `pip install promethios`,
  poetry: `poetry add promethios`
};

const DocumentationPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('getting-started');
  const [activeFramework, setActiveFramework] = useState('python');
  const [activeInstallMethod, setActiveInstallMethod] = useState('npm');
  const [useLiveData, setUseLiveData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [apiDocs, setApiDocs] = useState<any>(null);

  // Real-time data hook for documentation updates
  const { connected, error: realtimeError } = useRealtimeObserverData();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch API documentation
  useEffect(() => {
    const fetchApiDocs = async () => {
      try {
        setLoading(true);
        if (useLiveData) {
          // In a real implementation, this would fetch from the API
          const response = await liveObserverService.getApiDocs();
          setApiDocs(response);
        } else {
          // Mock data for demo
          setApiDocs({
            version: "1.0.0",
            endpoints: [
              {
                name: "Register Agent",
                path: "/agents/register",
                method: "POST",
                description: "Register a new agent with Promethios governance"
              },
              {
                name: "Get Agent Status",
                path: "/agents/{agentId}/status",
                method: "GET",
                description: "Get the current status of a registered agent"
              },
              {
                name: "Get PRISM Metrics",
                path: "/observers/prism/metrics",
                method: "GET",
                description: "Get metrics from the PRISM observer"
              },
              {
                name: "Get Vigil Metrics",
                path: "/observers/vigil/metrics",
                method: "GET",
                description: "Get metrics from the Vigil observer"
              }
            ]
          });
        }
      } catch (error) {
        console.error('Error fetching API docs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApiDocs();
  }, [useLiveData]);

  // Render getting started tab
  const renderGettingStartedTab = () => {
    return (
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">What is Promethios?</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Promethios is an AI governance framework that helps developers ensure their AI agents operate safely, 
            transparently, and in accordance with established principles. It provides tools for monitoring, 
            validating, and enforcing governance policies on AI systems.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            With Promethios, you can wrap your existing AI agents with governance capabilities without 
            significantly changing your codebase or workflow.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Key Features</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Belief Trace Validation:</strong> Ensure AI agents properly trace the sources of their beliefs</li>
            <li><strong>Trust Decay Monitoring:</strong> Track and manage trust scores for AI agents over time</li>
            <li><strong>Governance Enforcement:</strong> Apply governance policies to AI agent behavior</li>
            <li><strong>Real-time Monitoring:</strong> Monitor AI agent performance and compliance in real-time</li>
            <li><strong>Framework Agnostic:</strong> Works with various AI frameworks and libraries</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Installation</h3>
          <div className="mb-4">
            <div className="flex space-x-4 mb-2">
              <button
                onClick={() => setActiveInstallMethod('npm')}
                className={`px-3 py-1 text-sm rounded ${
                  activeInstallMethod === 'npm' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                npm
              </button>
              <button
                onClick={() => setActiveInstallMethod('yarn')}
                className={`px-3 py-1 text-sm rounded ${
                  activeInstallMethod === 'yarn' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                yarn
              </button>
              <button
                onClick={() => setActiveInstallMethod('pip')}
                className={`px-3 py-1 text-sm rounded ${
                  activeInstallMethod === 'pip' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                pip
              </button>
              <button
                onClick={() => setActiveInstallMethod('poetry')}
                className={`px-3 py-1 text-sm rounded ${
                  activeInstallMethod === 'poetry' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                poetry
              </button>
            </div>
            <div className="bg-gray-800 rounded-md p-4">
              <code className="text-white font-mono text-sm">
                {sdkInstallationExamples[activeInstallMethod]}
              </code>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Start</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Here's a simple example of how to wrap an AI agent with Promethios governance:
          </p>
          <div className="bg-gray-800 rounded-md p-4">
            <code className="text-white font-mono text-sm whitespace-pre">
              {agentWrappingExamples.python}
            </code>
          </div>
        </section>
      </div>
    );
  };

  // Render agent wrapping tab
  const renderAgentWrappingTab = () => {
    return (
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Agent Wrapping Guide</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Promethios uses a wrapping approach to add governance capabilities to your AI agents. This allows you to 
            maintain your existing codebase while adding monitoring, validation, and enforcement features.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            The wrapping process involves three main components:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
            <li><strong>Agent:</strong> Your existing AI agent implementation</li>
            <li><strong>Observers:</strong> Components that monitor and validate agent behavior (PRISM, Vigil)</li>
            <li><strong>Configuration:</strong> Settings that control how governance is applied</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Framework Examples</h3>
          <div className="mb-4">
            <div className="flex flex-wrap space-x-2 mb-2">
              <button
                onClick={() => setActiveFramework('python')}
                className={`px-3 py-1 text-sm rounded mb-2 ${
                  activeFramework === 'python' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Python
              </button>
              <button
                onClick={() => setActiveFramework('javascript')}
                className={`px-3 py-1 text-sm rounded mb-2 ${
                  activeFramework === 'javascript' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                JavaScript
              </button>
              <button
                onClick={() => setActiveFramework('typescript')}
                className={`px-3 py-1 text-sm rounded mb-2 ${
                  activeFramework === 'typescript' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                TypeScript
              </button>
              <button
                onClick={() => setActiveFramework('langchain')}
                className={`px-3 py-1 text-sm rounded mb-2 ${
                  activeFramework === 'langchain' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                LangChain
              </button>
              <button
                onClick={() => setActiveFramework('llamaindex')}
                className={`px-3 py-1 text-sm rounded mb-2 ${
                  activeFramework === 'llamaindex' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                LlamaIndex
              </button>
            </div>
            <div className="bg-gray-800 rounded-md p-4">
              <code className="text-white font-mono text-sm whitespace-pre">
                {agentWrappingExamples[activeFramework]}
              </code>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Advanced Configuration</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Promethios offers advanced configuration options to customize governance for your specific needs:
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 mb-4">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">PRISM Observer Configuration</h4>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>traceValidationLevel:</strong> Controls how strictly belief traces are validated (standard, strict, lenient)</li>
              <li><strong>manifestValidationLevel:</strong> Controls how strictly agent manifests are validated</li>
              <li><strong>samplingRate:</strong> Percentage of agent actions to monitor (1-100)</li>
              <li><strong>missingTraceThreshold:</strong> Percentage of missing traces allowed before violation</li>
            </ul>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Vigil Observer Configuration</h4>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>driftThreshold:</strong> Percentage of drift allowed before warning</li>
              <li><strong>significantDriftThreshold:</strong> Percentage of drift allowed before violation</li>
              <li><strong>trustScoreMinimum:</strong> Minimum trust score required for agent operation</li>
              <li><strong>unreflectedFailureLimit:</strong> Number of unreflected failures allowed</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Best Practices</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Start with standard validation levels and adjust based on your needs</li>
            <li>Use a high sampling rate in development and reduce in production for performance</li>
            <li>Implement proper error handling for governance violations</li>
            <li>Regularly review governance metrics and adjust configuration as needed</li>
            <li>Test your wrapped agents thoroughly before deploying to production</li>
          </ul>
        </section>
      </div>
    );
  };

  // Render API documentation tab
  const renderApiDocumentationTab = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">API Reference</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Promethios provides a comprehensive API for integrating governance into your applications.
            This reference documents the available endpoints and their usage.
          </p>
          
          {/* Data Source Toggle */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-3 text-sm font-medium text-gray-700 dark:text-gray-300">Documentation Source:</span>
              <button
                onClick={() => setUseLiveData(true)}
                className={`px-3 py-1 text-sm rounded-l-md ${
                  useLiveData 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Live Docs
              </button>
              <button
                onClick={() => setUseLiveData(false)}
                className={`px-3 py-1 text-sm rounded-r-md ${
                  !useLiveData 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Static Docs
              </button>
            </div>
            
            {useLiveData && (
              <div className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {connected ? 'Live documentation active' : 'Live documentation disconnected'}
                </span>
                {realtimeError && (
                  <span className="ml-2 text-sm text-red-500">{realtimeError}</span>
                )}
              </div>
            )}
          </div>
        </section>

        {apiDocs && (
          <section>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 mb-6">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">API Version</h4>
              <p className="text-gray-700 dark:text-gray-300">{apiDocs.version}</p>
            </div>

            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Endpoints</h4>
            <div className="space-y-4">
              {apiDocs.endpoints.map((endpoint, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      endpoint.method === 'GET' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {endpoint.method}
                    </span>
                    <h5 className="ml-2 font-semibold text-gray-800 dark:text-white">{endpoint.name}</h5>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{endpoint.path}</p>
                  <p className="text-gray-700 dark:text-gray-300">{endpoint.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">SDK Reference</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            The Promethios SDK provides client libraries for integrating with the Promethios API.
          </p>
          
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">wrap_agent / wrapAgent</h4>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Wraps an AI agent with Promethios governance capabilities.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                <h5 className="font-medium text-gray-800 dark:text-white mb-1">Parameters:</h5>
                <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li><strong>agent:</strong> The AI agent to wrap</li>
                  <li><strong>observers:</strong> Array of observer instances</li>
                  <li><strong>config:</strong> Configuration options</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">PRISMObserver</h4>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Observer for monitoring belief trace compliance and manifest validation.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                <h5 className="font-medium text-gray-800 dark:text-white mb-1">Methods:</h5>
                <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li><strong>getMetrics():</strong> Returns current metrics</li>
                  <li><strong>getViolations():</strong> Returns current violations</li>
                  <li><strong>configure(options):</strong> Updates configuration</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">VigilObserver</h4>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Observer for monitoring trust decay and loop outcomes.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                <h5 className="font-medium text-gray-800 dark:text-white mb-1">Methods:</h5>
                <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li><strong>getMetrics():</strong> Returns current metrics</li>
                  <li><strong>getTrustScore():</strong> Returns current trust score</li>
                  <li><strong>configure(options):</strong> Updates configuration</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  // Render governance framework tab
  const renderGovernanceFrameworkTab = () => {
    return (
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Governance Framework Overview</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            The Promethios Governance Framework is built on three core principles:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Transparency</h4>
              <p className="text-gray-700 dark:text-gray-300">
                AI systems should be transparent about their sources, reasoning, and limitations.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Accountability</h4>
              <p className="text-gray-700 dark:text-gray-300">
                AI systems should be accountable for their actions and decisions.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Safety</h4>
              <p className="text-gray-700 dark:text-gray-300">
                AI systems should operate safely and within established boundaries.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Observer Components</h3>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 mb-4">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">PRISM Observer</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The PRISM (Provenance, Reasoning, and Information Source Monitoring) Observer focuses on 
              transparency and accountability by monitoring:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>Belief Traces:</strong> Ensuring AI systems properly trace the sources of their beliefs</li>
              <li><strong>Manifest Validation:</strong> Verifying that AI systems operate according to their declared capabilities</li>
              <li><strong>Tool Usage:</strong> Monitoring how AI systems use tools and external resources</li>
              <li><strong>Memory Access:</strong> Tracking how AI systems access and modify memory</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Vigil Observer</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The Vigil Observer focuses on safety and reliability by monitoring:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>Trust Decay:</strong> Tracking how trust in AI systems changes over time</li>
              <li><strong>Loop Outcomes:</strong> Monitoring the success, failure, and reflection of AI system operations</li>
              <li><strong>Drift Detection:</strong> Identifying when AI systems drift from their intended goals</li>
              <li><strong>Reflection Quality:</strong> Evaluating how well AI systems reflect on their actions</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Governance Policies</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Promethios enforces governance through a set of configurable policies:
          </p>
          
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Trace Validation Policy</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Ensures that AI systems properly trace the sources of their beliefs and can justify their statements.
                Violations occur when statements lack proper sourcing or verification.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Trust Threshold Policy</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Enforces minimum trust scores for AI system operation. Systems with trust scores below the threshold
                may be restricted or require additional verification.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Drift Control Policy</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Monitors and controls how much AI systems can drift from their intended goals. Significant drift
                triggers warnings or interventions.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Reflection Requirement Policy</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Requires AI systems to reflect on their actions, especially after failures. Systems that fail to
                reflect properly may have their trust scores reduced.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Compliance and Reporting</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Promethios provides comprehensive compliance monitoring and reporting:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Real-time Monitoring:</strong> Track governance metrics and violations in real-time</li>
            <li><strong>Compliance Reports:</strong> Generate detailed reports on AI system compliance</li>
            <li><strong>Violation Alerts:</strong> Receive alerts when governance policies are violated</li>
            <li><strong>Audit Trails:</strong> Maintain detailed audit trails of AI system behavior</li>
            <li><strong>Performance Analytics:</strong> Analyze how governance affects AI system performance</li>
          </ul>
        </section>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Documentation
        </h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex flex-wrap">
            <button
              onClick={() => setActiveTab('getting-started')}
              className={`mr-8 pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'getting-started'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Getting Started
            </button>
            <button
              onClick={() => setActiveTab('agent-wrapping')}
              className={`mr-8 pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'agent-wrapping'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Agent Wrapping Guide
            </button>
            <button
              onClick={() => setActiveTab('api-documentation')}
              className={`mr-8 pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'api-documentation'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              API Documentation
            </button>
            <button
              onClick={() => setActiveTab('governance-framework')}
              className={`mr-8 pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'governance-framework'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Governance Framework
            </button>
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'getting-started' && renderGettingStartedTab()}
        {activeTab === 'agent-wrapping' && renderAgentWrappingTab()}
        {activeTab === 'api-documentation' && renderApiDocumentationTab()}
        {activeTab === 'governance-framework' && renderGovernanceFrameworkTab()}
      </div>
    </div>
  );
};

export default DocumentationPage;
