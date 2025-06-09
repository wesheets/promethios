import React, { useState, useEffect } from 'react';
import { testEmailAuth, testGoogleAuth, testAnonymousAuth, testFirestoreConnection, getFirebaseEnvVars } from '../../firebase/testUtils';

const FirebaseAuthTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [testEmail, setTestEmail] = useState<string>('test@example.com');
  const [testPassword, setTestPassword] = useState<string>('password123');
  const [testResults, setTestResults] = useState<any[]>([]);

  // Collect environment variables on mount
  useEffect(() => {
    try {
      const info = getFirebaseEnvVars();
      setEnvInfo(info);
      setStatus('Ready to test Firebase authentication');
    } catch (err: any) {
      setStatus('Error initializing test component');
      setError(err.message || 'Unknown error');
    }
  }, []);

  // Add a test result to the list
  const addTestResult = (name: string, result: any) => {
    setTestResults(prev => [
      { name, result, timestamp: new Date().toISOString() },
      ...prev
    ]);
  };

  // Test email/password login
  const handleEmailLogin = async () => {
    try {
      setStatus('Testing email/password login...');
      setError(null);
      
      const result = await testEmailAuth(testEmail, testPassword);
      setStatus(`Email login ${result.success ? 'successful' : 'failed'}`);
      if (!result.success) {
        setError(result.error.message || 'Unknown error');
      }
      
      addTestResult('Email Login', result);
    } catch (err: any) {
      setStatus('Email login test error');
      setError(err.message || 'Unknown error');
      addTestResult('Email Login', { success: false, error: err.message });
    }
  };

  // Test Google login
  const handleGoogleLogin = async () => {
    try {
      setStatus('Testing Google login...');
      setError(null);
      
      const result = await testGoogleAuth();
      setStatus(`Google login ${result.success ? 'successful' : 'failed'}`);
      if (!result.success) {
        setError(result.error.message || 'Unknown error');
      }
      
      addTestResult('Google Login', result);
    } catch (err: any) {
      setStatus('Google login test error');
      setError(err.message || 'Unknown error');
      addTestResult('Google Login', { success: false, error: err.message });
    }
  };

  // Test anonymous login
  const handleAnonymousLogin = async () => {
    try {
      setStatus('Testing anonymous login...');
      setError(null);
      
      const result = await testAnonymousAuth();
      setStatus(`Anonymous login ${result.success ? 'successful' : 'failed'}`);
      if (!result.success) {
        setError(result.error.message || 'Unknown error');
      }
      
      addTestResult('Anonymous Login', result);
    } catch (err: any) {
      setStatus('Anonymous login test error');
      setError(err.message || 'Unknown error');
      addTestResult('Anonymous Login', { success: false, error: err.message });
    }
  };

  // Test Firestore connection
  const handleFirestoreTest = async () => {
    try {
      setStatus('Testing Firestore connection...');
      setError(null);
      
      const result = await testFirestoreConnection();
      setStatus(`Firestore connection ${result.success ? 'successful' : 'failed'}`);
      if (!result.success) {
        setError(result.error.message || 'Unknown error');
      }
      
      addTestResult('Firestore Connection', result);
    } catch (err: any) {
      setStatus('Firestore test error');
      setError(err.message || 'Unknown error');
      addTestResult('Firestore Connection', { success: false, error: err.message });
    }
  };

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg shadow-lg max-w-3xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4">Firebase Authentication Test</h2>
      
      <div className="mb-6">
        <div className="font-semibold text-blue-400">Status:</div>
        <div className="bg-gray-700 p-3 rounded">{status}</div>
        
        {error && (
          <div className="mt-2">
            <div className="font-semibold text-red-400">Error:</div>
            <div className="bg-red-900/30 p-3 rounded border border-red-500 text-red-200">{error}</div>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <div className="font-semibold text-blue-400 mb-2">Test Authentication:</div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <button 
            onClick={handleEmailLogin}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Test Email Login
          </button>
          <button 
            onClick={handleGoogleLogin}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            Test Google Login
          </button>
          <button 
            onClick={handleAnonymousLogin}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
          >
            Test Anonymous Login
          </button>
          <button 
            onClick={handleFirestoreTest}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
          >
            Test Firestore
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="font-semibold text-blue-400 mb-2">Test Credentials:</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-400">Email</label>
            <input 
              type="email" 
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400">Password</label>
            <input 
              type="password" 
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        </div>
      </div>
      
      {envInfo && (
        <div className="mb-6">
          <div className="font-semibold text-blue-400 mb-2">Environment Information:</div>
          <div className="bg-gray-700 p-3 rounded overflow-x-auto">
            <pre className="text-xs">
              {JSON.stringify(envInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {testResults.length > 0 && (
        <div>
          <div className="font-semibold text-blue-400 mb-2">Test Results:</div>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className={`p-3 rounded ${result.result.success ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'}`}>
                <div className="font-semibold">{result.name} - {result.result.success ? 'Success' : 'Failed'}</div>
                <div className="text-xs opacity-70">{result.timestamp}</div>
                <pre className="text-xs mt-2 overflow-x-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FirebaseAuthTest;
