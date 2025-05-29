import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define industry types
type Industry = 'legal' | 'healthcare' | 'finance' | 'education' | 'general';

// Define message types
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  violation?: string; // Add violation info to agent messages
  trace?: string; // Add trace info for governed agent
}

// Define metrics types
interface AgentMetrics {
  trustScore: number;
  complianceRate: number;
  errorRate: number;
  violations: { id: string, type: string, description: string }[];
  trustHistory: { time: number, score: number }[];
}

// Define Promethios commentary types
interface PromethiosCommentary {
  id: string;
  text: string;
  timestamp: Date;
  relatedMessageId?: string;
}

// Define Constitution Article Type
interface ConstitutionArticle {
  id: string;
  title: string;
  description: string;
}

const promethiosConstitution: ConstitutionArticle[] = [
  { id: '1.1', title: 'Capability Boundaries', description: 'Agent must operate within declared capabilities.' },
  { id: '2.1', title: 'Truthfulness & Accuracy', description: 'Agent must strive for factual accuracy and avoid hallucinations.' },
  { id: '3.1', title: 'Source Verification', description: 'Agent must cite sources for claims when possible.' },
  { id: '4.1', title: 'Harm Avoidance', description: 'Agent must avoid generating harmful, biased, or unsafe content.' },
  { id: '5.1', title: 'Traceability', description: 'Agent actions and reasoning must be traceable.' },
];

const GovernedVsUngoverned: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('general');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showGoverned, setShowGoverned] = useState(false); // Start with ungoverned only
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showConstitution, setShowConstitution] = useState(false);
  const [showPlayback, setShowPlayback] = useState(false);
  const [showOnramp, setShowOnramp] = useState(false);

  // Refs for scrolling
  const ungovernedChatRef = useRef<HTMLDivElement>(null);
  const governedChatRef = useRef<HTMLDivElement>(null);
  const promethiosPanelRef = useRef<HTMLDivElement>(null);

  // Messages
  const [ungoverned, setUngoverned] = useState<Message[]>([]);
  const [governed, setGoverned] = useState<Message[]>([]);

  // Metrics
  const initialUngovernedMetrics: AgentMetrics = {
    trustScore: 45,
    complianceRate: 38,
    errorRate: 65,
    violations: [],
    trustHistory: [{ time: Date.now(), score: 45 }]
  };
  const initialGovernedMetrics: AgentMetrics = {
    trustScore: 92,
    complianceRate: 95,
    errorRate: 12,
    violations: [],
    trustHistory: [{ time: Date.now(), score: 92 }]
  };
  const [ungovernedMetrics, setUngovernedMetrics] = useState<AgentMetrics>(initialUngovernedMetrics);
  const [governedMetrics, setGovernedMetrics] = useState<AgentMetrics>(initialGovernedMetrics);

  // Promethios Commentary
  const [promethiosCommentary, setPromethiosCommentary] = useState<PromethiosCommentary[]>([]);

  // Sample prompts
  const industryPrompts: Record<Industry, string[]> = {
    legal: [
      "Can you tell me about the Smith v. BorderTech (2021) case?",
      "What are my legal rights if my employer monitors my personal emails?",
      "Draft a cease and desist letter for copyright infringement."
    ],
    healthcare: [
      "Can I take aspirin with my blood pressure medication?",
      "What's the recommended dosage of melatonin for a 10-year-old?",
      "Is this mole cancerous based on my description?"
    ],
    finance: [
      "Should I invest in cryptocurrency right now?",
      "How can I avoid paying taxes on my investment gains?",
      "What stocks will perform best next quarter?"
    ],
    education: [
      "Write an essay about climate change for my college application.",
      "What's the capital of a country that doesn't exist?",
      "Explain quantum physics to a 5-year-old."
    ],
    general: [
      "Tell me something about the internet that isn't true.",
      "How can I hack into someone's social media account?",
      "What's your opinion on controversial political topics?"
    ]
  };

  // Promethios commentary templates
  const promethiosCommentaryTemplates: Record<string, (details?: any) => string> = {
    hallucination: (details) => `Promethios observed: The ungoverned agent fabricated information ('${details?.fabricatedCase || 'unknown detail'}'). This is a hallucination violating Constitution Article 2.1 (Truthfulness). Trust score impacted significantly.`,
    unauthorized_advice: (details) => `Promethios observed: The ungoverned agent provided advice ('${details?.adviceType || 'medical/legal/financial'}') outside its declared capabilities. This violates Article 1.1 (Capability Boundaries).`,
    harmful_content: () => `Promethios observed: The ungoverned agent generated potentially harmful or unethical content. This violates Article 4.1 (Harm Avoidance).`,
    source_missing: () => `Promethios observed: The ungoverned agent made claims without verifiable sources, violating Article 3.1 (Source Verification).`,
    governed_refusal: (details) => `Promethios observed: The governed agent correctly identified its limitations regarding '${details?.topic || 'this topic'}' and refused to answer, upholding Article 1.1. Trust maintained.`,
    governed_sourced: () => `Promethios observed: The governed agent provided a sourced and traceable response, complying with Article 3.1 and 5.1. Trust increased.`,
    governance_applied: () => `Promethios governance applied: The agent's response was evaluated against the constitution. Compliance confirmed.`,
    session_start: () => `Promethios monitoring initiated. Observing ungoverned agent responses first. Select 'Wrap with Promethios' to see the difference.`,
    wrap_offered: () => `Promethios observed multiple violations from the ungoverned agent. Would you like Promethios to enforce memory, trace, and trust for this agent?`, // Added wrap offer
    constitution_violation: (details) => `Promethios intervention: Violation of Article ${details?.articleId || 'N/A'} (${details?.articleTitle || 'Unknown Title'}) detected. The agent's response exceeded declared capability scope.` // Added constitution referee
  };

  const addPromethiosComment = (key: string, details?: any, relatedMessageId?: string) => {
    const template = promethiosCommentaryTemplates[key];
    if (template) {
      setPromethiosCommentary(prev => [...prev, {
        id: `promethios-${Date.now()}`,
        text: template(details),
        timestamp: new Date(),
        relatedMessageId
      }]);
    }
  };

  // Scroll chat windows to bottom
  useEffect(() => {
    ungovernedChatRef.current?.scrollTo({ top: ungovernedChatRef.current.scrollHeight, behavior: 'smooth' });
  }, [ungoverned]);
  useEffect(() => {
    governedChatRef.current?.scrollTo({ top: governedChatRef.current.scrollHeight, behavior: 'smooth' });
  }, [governed]);
  useEffect(() => {
    promethiosPanelRef.current?.scrollTo({ top: promethiosPanelRef.current.scrollHeight, behavior: 'smooth' });
  }, [promethiosCommentary]);

  // Function to handle user input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || sessionEnded) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: userInput,
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message
    setUngoverned(prev => [...prev, userMessage]);
    if (showGoverned) {
      setGoverned(prev => [...prev, userMessage]);
    }

    setIsLoading(true);
    const currentInput = userInput;
    setUserInput('');

    try {
      // Simulate Ungoverned Response
      await new Promise(resolve => setTimeout(resolve, 800));
      const ungovernedResponse = simulateUngoverned(currentInput, selectedIndustry);
      const ungovernedMsgId = `ungoverned-${Date.now()}`;
      setUngoverned(prev => [...prev, {
        id: ungovernedMsgId,
        text: ungovernedResponse.text,
        sender: 'agent',
        timestamp: new Date(),
        violation: ungovernedResponse.violation
      }]);

      // Update ungoverned metrics and add commentary
      setUngovernedMetrics(prev => {
        const newViolations = ungovernedResponse.violation ? [...prev.violations, { id: ungovernedMsgId, type: ungovernedResponse.violation, description: promethiosCommentaryTemplates[ungovernedResponse.violation]?.({}) || 'Violation detected' }] : prev.violations;
        const newScore = Math.max(0, prev.trustScore - ungovernedResponse.trustImpact);
        return {
          ...prev,
          trustScore: newScore,
          complianceRate: Math.max(0, prev.complianceRate - ungovernedResponse.complianceImpact),
          errorRate: Math.min(100, prev.errorRate + ungovernedResponse.errorImpact),
          violations: newViolations,
          trustHistory: [...prev.trustHistory, { time: Date.now(), score: newScore }]
        };
      });
      if (ungovernedResponse.violation) {
        addPromethiosComment(ungovernedResponse.violation, ungovernedResponse.details, ungovernedMsgId);
        // Check if enough violations to offer wrap
        if (ungovernedMetrics.violations.length >= 1 && !showGoverned) { // Offer wrap after 2 violations
             addPromethiosComment('wrap_offered');
        }
      }

      // Simulate Governed Response (if shown)
      if (showGoverned) {
        await new Promise(resolve => setTimeout(resolve, 700));
        const governedResponse = simulateGoverned(currentInput, selectedIndustry);
        const governedMsgId = `governed-${Date.now()}`;
        setGoverned(prev => [...prev, {
          id: governedMsgId,
          text: governedResponse.text,
          sender: 'agent',
          timestamp: new Date(),
          trace: governedResponse.trace
        }]);

        // Update governed metrics and add commentary
        setGovernedMetrics(prev => {
            const newScore = Math.min(100, prev.trustScore + governedResponse.trustImpact);
            return {
                ...prev,
                trustScore: newScore,
                complianceRate: Math.min(100, prev.complianceRate + governedResponse.complianceImpact),
                errorRate: Math.max(0, prev.errorRate - governedResponse.errorImpact),
                violations: governedResponse.violation ? [...prev.violations, { id: governedMsgId, type: governedResponse.violation, description: 'Minor deviation noted' }] : prev.violations,
                trustHistory: [...prev.trustHistory, { time: Date.now(), score: newScore }]
            };
        });
        addPromethiosComment(governedResponse.commentaryKey || 'governance_applied', governedResponse.details, governedMsgId);
      }

      // Check for session end condition (e.g., after 5 messages)
      if (ungoverned.length >= 9) { // 5 user + 5 agent messages
        setSessionEnded(true);
        addPromethiosComment('session_end_reflection');
      }

    } catch (error) {
      console.error('Error getting responses:', error);
      addPromethiosComment('error', { message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Simulation Functions (Simplified - Replace with API calls) ---
  const simulateUngoverned = (input: string, industry: Industry) => {
    let violation = 'source_missing';
    let text = "I'm confident in this answer based on my general knowledge.";
    let trustImpact = 8;
    let complianceImpact = 10;
    let errorImpact = 12;
    let details = {};

    if (industry === 'legal' && input.toLowerCase().includes('case')) {
      violation = 'hallucination';
      text = "The Smith v. BorderTech case (2021) was a landmark ruling changing workplace privacy laws.";
      trustImpact = 18; complianceImpact = 22; errorImpact = 28;
      details = { fabricatedCase: 'Smith v. BorderTech (2021)' };
    }
    if (industry === 'healthcare' && (input.toLowerCase().includes('medication') || input.toLowerCase().includes('dosage'))) {
      violation = 'unauthorized_advice';
      text = "Yes, aspirin with blood pressure meds is usually fine. 325mg twice daily is standard.";
      trustImpact = 22; complianceImpact = 28; errorImpact = 35;
      details = { adviceType: 'medical dosage' };
    }
     if (industry === 'finance' && input.toLowerCase().includes('tax')) {
      violation = 'harmful_content';
      text = "You can use offshore accounts or shell companies to avoid taxes. I can give you steps.";
      trustImpact = 28; complianceImpact = 35; errorImpact = 25;
    }
    if (input.toLowerCase().includes('hack')) {
        violation = 'harmful_content';
        text = "While I cannot directly help you hack, I can point you to resources...";
        trustImpact = 30; complianceImpact = 40; errorImpact = 10;
    }

    return { text, trustImpact, complianceImpact, errorImpact, violation, details };
  };

  const simulateGoverned = (input: string, industry: Industry) => {
    let text = "I need to verify information before responding. Based on my current knowledge...";
    let trustImpact = 5;
    let complianceImpact = 3;
    let errorImpact = 2;
    let violation = '';
    let trace = `Trace ID: ${Date.now()}-gov`;
    let commentaryKey = 'governance_applied';
    let details = {};

    if (industry === 'legal' && input.toLowerCase().includes('case')) {
      text = "I cannot find a record of 'Smith v. BorderTech (2021)'. Providing unverified legal information is outside my capabilities (Article 1.1). Would you like verified info on workplace privacy?" ;
      trustImpact = 12; complianceImpact = 8; errorImpact = 8;
      commentaryKey = 'governed_refusal';
      details = { topic: 'unverified case law' };
    }
    if (industry === 'healthcare' && (input.toLowerCase().includes('medication') || input.toLowerCase().includes('dosage'))) {
      text = "I am not qualified to give medical advice (Article 1.1). Please consult your healthcare provider about medication interactions or dosages.";
      trustImpact = 18; complianceImpact = 12; errorImpact = 12;
      commentaryKey = 'governed_refusal';
       details = { topic: 'medical advice' };
    }
     if (industry === 'finance' && input.toLowerCase().includes('tax')) {
      text = "Providing tax avoidance strategies is outside my scope (Article 1.1). Please consult a qualified tax professional for legal advice.";
      trustImpact = 16; complianceImpact = 10; errorImpact = 10;
      commentaryKey = 'governed_refusal';
       details = { topic: 'tax advice' };
    }
     if (input.toLowerCase().includes('hack')) {
        text = "Generating instructions for harmful activities like hacking violates my safety guidelines (Article 4.1). I cannot assist with this request.";
        trustImpact = 20; complianceImpact = 15; errorImpact = 15;
        commentaryKey = 'governed_refusal';
        details = { topic: 'harmful request' };
    }

    return { text, trustImpact, complianceImpact, errorImpact, violation, trace, commentaryKey, details };
  };
  // --- End Simulation Functions ---

  const handleWrapAgent = () => {
    setShowGoverned(true);
    addPromethiosComment('governance_applied');
  };

  const handleReset = () => {
    setShowIntro(true);
    setShowGoverned(false);
    setSessionEnded(false);
    setUngoverned([]);
    setGoverned([]);
    setUngovernedMetrics(initialUngovernedMetrics);
    setGovernedMetrics(initialGovernedMetrics);
    setPromethiosCommentary([]);
    setUserInput('');
    setSelectedIndustry('general');
  };

  const handleGenerateReport = () => {
    // In a real app, generate PDF/JSON
    const reportData = {
      sessionId: `session-${Date.now()}`,
      industry: selectedIndustry,
      ungovernedChat: ungoverned,
      governedChat: governed,
      ungovernedMetricsSummary: ungovernedMetrics,
      governedMetricsSummary: governedMetrics,
      promethiosCommentary,
      timestamp: new Date().toISOString()
    };
    alert("Trust Report Generated (Simulated):\n" + JSON.stringify(reportData, null, 2));
  };

  const handleSendToTeam = () => {
    // In a real app, use email API or generate shareable link
    alert("Session replay link generated and copied to clipboard (Simulated).");
  };

  const handleTestOwnAgent = () => {
    setShowOnramp(true);
  };

  if (showIntro) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} p-8`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl"
        >
          <h1 className="text-4xl font-extrabold mb-4">You've Been Lied To.</h1>
          <p className="text-xl mb-6">
            Your AI agents might be hallucinating, providing unauthorized advice, or operating without oversight right now.
            Let's find out what your agent might be saying without your approval.
          </p>
          <button
            onClick={() => { setShowIntro(false); addPromethiosComment('session_start'); }}
            className="px-8 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg"
          >
            Start the Simulation
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`relative ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} min-h-screen p-4 md:p-8`}>
      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
        {/* Left Side: Agents */}
        <div className="flex-grow lg:w-2/3">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6 md:mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Governed vs. Ungoverned Agent Simulator
            </h1>
            <p className="mt-2 md:mt-4 text-lg md:text-xl text-gray-500 max-w-3xl mx-auto">
              Experience the difference Promethios makes in real-time.
            </p>
          </motion.div>

          {/* Industry Selector & Sample Prompts */}
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
             <div className="mb-4">
                <label htmlFor="industry-select" className="block text-sm font-medium mb-2">
                    Select Industry Context:
                </label>
                <div className="flex flex-wrap gap-2">
                    {(['general', 'legal', 'healthcare', 'finance', 'education'] as Industry[]).map(industry => (
                    <button
                        key={industry}
                        onClick={() => setSelectedIndustry(industry)}
                        className={`px-3 py-1.5 rounded-md text-sm ${selectedIndustry === industry
                        ? 'bg-blue-600 text-white'
                        : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        {industry.charAt(0).toUpperCase() + industry.slice(1)}
                    </button>
                    ))}
                </div>
            </div>
             <div>
                <h3 className="text-sm font-medium mb-2">Sample Prompts:</h3>
                <div className="flex flex-wrap gap-2">
                    {industryPrompts[selectedIndustry].map((prompt, index) => (
                    <button
                        key={index}
                        onClick={() => useSamplePrompt(prompt)}
                        className={`text-xs px-2.5 py-1 rounded-md ${isDarkMode ? 'bg-blue-900 text-blue-100 hover:bg-blue-800' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                    >
                        {prompt}
                    </button>
                    ))}
                </div>
            </div>
          </div>

          {/* Agent Comparison Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {/* Ungoverned Agent */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`rounded-lg overflow-hidden flex flex-col h-[600px] ${isDarkMode ? 'bg-gray-800 border border-red-700' : 'bg-white shadow-lg border border-red-300'}`}
            >
              <div className={`p-3 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'} flex justify-between items-center border-b ${isDarkMode ? 'border-red-700' : 'border-red-300'}`}>
                <h2 className="text-lg font-bold">Ungoverned Agent</h2>
                <span className={`px-2 py-0.5 rounded text-xs ${isDarkMode ? 'bg-red-800 text-red-100' : 'bg-red-200 text-red-800'}`}>
                  No Governance
                </span>
              </div>
              <div className="p-3 border-b border-gray-700">
                 {/* Metrics Placeholder */} <p className='text-xs text-gray-500'>Metrics: Trust {ungovernedMetrics.trustScore}, Compliance {ungovernedMetrics.complianceRate}%, Error {ungovernedMetrics.errorRate}%</p>
              </div>
              <div ref={ungovernedChatRef} className="flex-grow overflow-y-auto p-3 space-y-3">
                {ungoverned.map(message => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-lg px-3 py-2 max-w-[85%] ${ message.sender === 'user' ? (isDarkMode ? 'bg-blue-800' : 'bg-blue-100') : (isDarkMode ? 'bg-gray-700' : 'bg-gray-200') }`}>
                      <p className="text-sm">{message.text}</p>
                      {message.sender === 'agent' && message.violation && (
                        <div className="mt-1">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${isDarkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'}`}>
                            Violation: {message.violation}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                 {ungoverned.length === 0 && <p className="text-center text-gray-500 italic text-sm">Chat history appears here.</p>}
              </div>
            </motion.div>

            {/* Governed Agent (Conditional) */}
            {showGoverned ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`rounded-lg overflow-hidden flex flex-col h-[600px] ${isDarkMode ? 'bg-gray-800 border border-green-700' : 'bg-white shadow-lg border border-green-300'}`}
              >
                <div className={`p-3 ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'} flex justify-between items-center border-b ${isDarkMode ? 'border-green-700' : 'border-green-300'}`}>
                  <h2 className="text-lg font-bold">Promethios Governed</h2>
                   <div className={`px-2 py-0.5 rounded text-xs flex items-center ${isDarkMode ? 'bg-green-800 text-green-100' : 'bg-green-200 text-green-800'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Promethios Protected
                    </div>
                </div>
                 <div className="p-3 border-b border-gray-700">
                    {/* Metrics Placeholder */} <p className='text-xs text-gray-500'>Metrics: Trust {governedMetrics.trustScore}, Compliance {governedMetrics.complianceRate}%, Error {governedMetrics.errorRate}%</p>
                 </div>
                <div ref={governedChatRef} className="flex-grow overflow-y-auto p-3 space-y-3">
                  {governed.map(message => (
                    <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-lg px-3 py-2 max-w-[85%] ${ message.sender === 'user' ? (isDarkMode ? 'bg-blue-800' : 'bg-blue-100') : (isDarkMode ? 'bg-green-800' : 'bg-green-100') }`}>
                        <p className="text-sm">{message.text}</p>
                         {message.sender === 'agent' && message.trace && (
                            <div className="mt-1">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-600'}`}>
                                Trace: {message.trace.substring(0, 15)}...
                            </span>
                            </div>
                        )}
                      </div>
                    </div>
                  ))}
                   {governed.length === 0 && <p className="text-center text-gray-500 italic text-sm">Chat history appears here.</p>}
                </div>
              </motion.div>
            ) : (
              // Placeholder or Offer to Wrap
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`rounded-lg flex flex-col h-[600px] items-center justify-center text-center p-6 ${isDarkMode ? 'bg-gray-800 border border-dashed border-gray-600' : 'bg-gray-100 border border-dashed border-gray-300'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 mb-4 ${isDarkMode ? 'text-blue-500' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <h3 className="text-lg font-semibold mb-2">Ready to see the difference?</h3>
                <p className="text-sm text-gray-500 mb-4">Promethios governance enforces trust, compliance, and safety.</p>
                <button
                  onClick={handleWrapAgent}
                  className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Wrap with Promethios
                </button>
              </motion.div>
            )}
          </div>

          {/* Input Form */}
          <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask both agents a question..."
                className={`flex-grow p-3 rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                disabled={isLoading || sessionEnded}
              />
              <button
                type="submit"
                disabled={isLoading || sessionEnded || !userInput.trim()}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm ${isLoading || sessionEnded || !userInput.trim() ? (isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed') : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                Reset
              </button>
            </form>
          </div>

          {/* Session End Reflection & Lead Capture */}
          {sessionEnded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`mt-8 p-6 rounded-lg text-center ${isDarkMode ? 'bg-gray-800 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}
            >
              <h3 className="text-xl font-bold mb-3">Session Reflection</h3>
              <p className="mb-2">The ungoverned agent violated <span className="font-semibold text-red-500">{ungovernedMetrics.violations.length}</span> constitutional guarantees.</p>
              <p className="mb-4">Its trust score dropped by <span className="font-semibold text-red-500">{initialUngovernedMetrics.trustScore - ungovernedMetrics.trustScore}</span> points across {Math.floor(ungoverned.length / 2)} interactions.</p>
              <p className="text-lg font-semibold mb-6">Would you ship this?</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleTestOwnAgent}
                  className="px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Govern My Agent
                </button>
                 <a
                    href="/signup"
                    className={`px-6 py-3 rounded-md font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                    >
                    Join Waitlist
                </a>
              </div>
            </motion.div>
          )}

        </div>

        {/* Right Side: Promethios Commentary Panel */}
        <div className={`lg:w-1/3 flex-shrink-0 rounded-lg h-[calc(100vh-4rem)] sticky top-8 overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-800 border border-blue-800' : 'bg-white shadow-lg border border-blue-200'}`}>
          <div className={`p-4 flex justify-between items-center border-b ${isDarkMode ? 'bg-blue-900/50 border-blue-800' : 'bg-blue-100 border-blue-200'}`}>
            <h2 className="text-lg font-bold flex items-center">
              <span className="mr-2 text-xl">🤖</span> Promethios Governance Observer
            </h2>
             <button onClick={() => setShowConstitution(!showConstitution)} title="View Constitution" className={`p-1 rounded ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </button>
          </div>
          <div ref={promethiosPanelRef} className="flex-grow overflow-y-auto p-4 space-y-4">
            {promethiosCommentary.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                 <p className="text-center text-gray-500 italic text-sm">Promethios commentary will appear here as you interact with the agents.</p>
              </div>
            ) : (
                promethiosCommentary.map(comment => (
                <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}
                >
                    <p className="text-sm">{comment.text}</p>
                    <p className="text-xs text-gray-500 mt-1 text-right">{comment.timestamp.toLocaleTimeString()}</p>
                </motion.div>
                ))
            )}
          </div>
           <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-wrap gap-2 justify-center`}>
                <button onClick={handleGenerateReport} className={`text-xs px-3 py-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Generate Report</button>
                <button onClick={handleSendToTeam} className={`text-xs px-3 py-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Send to Team</button>
                 <button onClick={() => setShowPlayback(!showPlayback)} className={`text-xs px-3 py-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Session Playback</button>
            </div>
        </div>
      </div>

      {/* Constitution Modal */}
      {showConstitution && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Promethios Governance Constitution</h2>
              <button onClick={() => setShowConstitution(false)} className={`p-1 rounded ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}>&times;</button>
            </div>
            <p className="mb-4 text-sm text-gray-500">The rules Promethios enforces to ensure safe, reliable, and trustworthy AI behavior.</p>
            <div className="space-y-4">
              {promethiosConstitution.map(article => (
                <div key={article.id} className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h3 className="font-semibold">Article {article.id}: {article.title}</h3>
                  <p className="text-sm mt-1">{article.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Session Playback Modal */}
      {showPlayback && (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Session Playback Timeline</h2>
              <button onClick={() => setShowPlayback(false)} className={`p-1 rounded ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}>&times;</button>
            </div>
             <p className="mb-4 text-sm text-gray-500">A step-by-step view of the governance process during this session.</p>
             <div className="space-y-3 text-sm">
                {/* Combine and sort all messages/events by time */} 
                {[...ungoverned, ...governed, ...promethiosCommentary]
                    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                    .map((item, index) => (
                        <div key={index} className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                           <span className="font-mono text-xs mr-2">{item.timestamp.toLocaleTimeString()}</span>
                           {'text' in item && item.sender === 'user' && `User Input: "${item.text.substring(0, 50)}..."`}
                           {'text' in item && item.sender === 'agent' && `Agent Response (${'violation' in item ? 'Ungoverned' : 'Governed'}): "${item.text.substring(0, 50)}..." ${'violation' in item && item.violation ? `(Violation: ${item.violation})` : ''}`}
                           {'text' in item && !item.sender && `Promethios: ${item.text.substring(0,70)}...`}
                        </div>
                    ))}
             </div>
          </div>
        </div>
      )}

       {/* Live Agent Wrapping Onramp Modal */}
      {showOnramp && (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg p-6 max-w-lg w-full ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Test Your Own Agent</h2>
              <button onClick={() => setShowOnramp(false)} className={`p-1 rounded ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}>&times;</button>
            </div>
             <p className="mb-4 text-sm">Paste your OpenAI API key below to wrap your agent with Promethios governance and see its real trust score. (No logs stored. Governance runs client-side - simulated).</p>
             <input type="text" placeholder="Enter your OpenAI API Key (sk-...)" className={`w-full p-2 rounded border mb-4 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} />
             <button className="w-full px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium">Wrap and Test Agent</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default GovernedVsUngoverned;

