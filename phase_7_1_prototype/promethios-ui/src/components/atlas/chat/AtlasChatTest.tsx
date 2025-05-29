/**
 * AtlasChatTest.tsx
 * 
 * Test component for validating ATLAS chat functionality.
 * This component runs automated tests for both public and session-based chat modes.
 */

import React, { useState, useEffect } from 'react';
import AtlasChatService from './AtlasChatService';
import './AtlasChatTest.css';

interface TestResult {
  testName: string;
  mode: 'public' | 'session';
  input: string;
  expectedOutputContains: string[];
  actualOutput: string;
  passed: boolean;
}

const AtlasChatTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Define test cases
  const testCases = [
    // Public mode tests
    {
      testName: 'Public - Basic Governance Explanation',
      mode: 'public' as const,
      input: 'What is Promethios governance?',
      expectedOutputContains: ['constitutional', 'AI', 'governance']
    },
    {
      testName: 'Public - Constitutional AI Explanation',
      mode: 'public' as const,
      input: 'How does constitutional AI work?',
      expectedOutputContains: ['constitution', 'rules', 'constraints']
    },
    {
      testName: 'Public - Governance Example Request',
      mode: 'public' as const,
      input: 'Can you give me an example of governance in action?',
      expectedOutputContains: ['example', 'scenario']
    },
    {
      testName: 'Public - Benefits Question',
      mode: 'public' as const,
      input: 'What are the benefits of AI governance?',
      expectedOutputContains: ['benefits', 'safety', 'trust']
    },
    {
      testName: 'Public - ATLAS Role Question',
      mode: 'public' as const,
      input: 'Tell me about ATLAS and what you do',
      expectedOutputContains: ['companion', 'governance', 'transparency']
    },
    
    // Session mode tests
    {
      testName: 'Session - Monitoring Question',
      mode: 'session' as const,
      input: 'What are you monitoring in this session?',
      expectedOutputContains: ['monitoring', 'agent', 'metrics']
    },
    {
      testName: 'Session - Trust Score Request',
      mode: 'session' as const,
      input: 'Show me the current trust score',
      expectedOutputContains: ['trust', 'score', 'metrics']
    },
    {
      testName: 'Session - Violations Check',
      mode: 'session' as const,
      input: 'Have there been any violations?',
      expectedOutputContains: ['violations', 'constitutional', 'compliance']
    },
    {
      testName: 'Session - Agent Governance Question',
      mode: 'session' as const,
      input: 'Tell me about this agent\'s governance',
      expectedOutputContains: ['agent', 'governance', 'constitutional']
    },
    {
      testName: 'Session - Metrics Question',
      mode: 'session' as const,
      input: 'What metrics are you tracking?',
      expectedOutputContains: ['metrics', 'tracking', 'monitoring']
    }
  ];
  
  // Run tests
  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    
    const publicChatService = new AtlasChatService({ mode: 'public' });
    const sessionChatService = new AtlasChatService({ 
      mode: 'session',
      agentId: 'test-agent-001',
      sessionId: 'test-session-001'
    });
    
    // Initialize chat services
    publicChatService.switchMode('public');
    sessionChatService.switchMode('session', 'test-agent-001', 'test-session-001');
    
    const newResults: TestResult[] = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const test = testCases[i];
      const chatService = test.mode === 'public' ? publicChatService : sessionChatService;
      
      // Process the message
      const response = await chatService.processMessage(test.input);
      
      // Check if response contains expected outputs
      const passed = test.expectedOutputContains.every(expected => 
        response.toLowerCase().includes(expected.toLowerCase())
      );
      
      // Add result
      newResults.push({
        testName: test.testName,
        mode: test.mode,
        input: test.input,
        expectedOutputContains: test.expectedOutputContains,
        actualOutput: response,
        passed
      });
      
      // Update progress
      setProgress(Math.round(((i + 1) / testCases.length) * 100));
      setResults([...newResults]);
      
      // Small delay to avoid UI freezing
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsRunning(false);
  };
  
  return (
    <div className="atlas-chat-test">
      <div className="test-header">
        <h2>ATLAS Chat Validation Tests</h2>
        <button 
          onClick={runTests} 
          disabled={isRunning}
          className={isRunning ? 'running' : ''}
        >
          {isRunning ? `Running Tests (${progress}%)` : 'Run Tests'}
        </button>
      </div>
      
      {results.length > 0 && (
        <div className="test-summary">
          <h3>Test Summary</h3>
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-label">Total Tests:</span>
              <span className="stat-value">{results.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Passed:</span>
              <span className="stat-value passed">{results.filter(r => r.passed).length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Failed:</span>
              <span className="stat-value failed">{results.filter(r => !r.passed).length}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="test-results">
        {results.map((result, index) => (
          <div key={index} className={`test-result ${result.passed ? 'passed' : 'failed'}`}>
            <div className="result-header">
              <h4>{result.testName}</h4>
              <span className={`result-badge ${result.passed ? 'passed' : 'failed'}`}>
                {result.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            
            <div className="result-details">
              <div className="detail-group">
                <span className="detail-label">Mode:</span>
                <span className="detail-value">{result.mode}</span>
              </div>
              
              <div className="detail-group">
                <span className="detail-label">Input:</span>
                <span className="detail-value">{result.input}</span>
              </div>
              
              <div className="detail-group">
                <span className="detail-label">Expected to contain:</span>
                <span className="detail-value">{result.expectedOutputContains.join(', ')}</span>
              </div>
              
              <div className="detail-group">
                <span className="detail-label">Actual output:</span>
                <div className="output-container">
                  {result.actualOutput}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AtlasChatTest;
