// Firebase Authentication Test Component
import React, { useState, useEffect } from 'react';
import { auth, firestore } from '../firebase/config';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const FirebaseAuthTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [testEmail, setTestEmail] = useState<string>('test@example.com');
  const [testPassword, setTestPassword] = useState<string>('password123');

  // Collect environment variables on mount
  useEffect(() => {
    const vars: Record<string, string> = {};
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        const value = import.meta.env[key] as string;
        // Mask sensitive values
        if (key.includes('KEY') || key.includes('SECRET') || key.includes('ID')) {
          vars[key] = value ? `${value.substring(0, 5)}...${value.substring(value.length - 3)}` : '(empty)';
        } else {
          vars[key] = value || '(empty)';
        }
      }
    });
    setEnvVars(vars);
    
    // Check if Firebase is initialized
    if (auth) {
      setStatus('Firebase Auth initialized');
    } else {
      setStatus('Firebase Auth not initialized');
      setError('Auth object is undefined');
    }
  }, []);

  // Test email/password login
  const testEmailLogin = async () => {
    try {
      setStatus('Testing email/password login...');
      setError(null);
      
      const result = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      setStatus(`Email login successful: ${result.user.uid}`);
    } catch (err: any) {
      setStatus('Email login failed');
      setError(`${err.code}: ${err.message}`);
      
      // Log detailed error information
      console.error('Email login error details:', {
        code: err.code,
        message: err.message,
        email: testEmail.substring(0, 3) + '...',
        authConfigured: !!auth,
        domain: window.location.hostname
      });
    }
  };

  // Test Google login
  const testGoogleLogin = async () => {
    try {
      setStatus('Testing Google login...');
      setError(null);
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setStatus(`Google login successful: ${result.user.uid}`);
    } catch (err: any) {
      setStatus('Google login failed');
      setError(`${err.code}: ${err.message}`);
      
      // Log detailed error information
      console.error('Google login error details:', {
        code: err.code,
        message: err.message,
        authConfigured: !!auth,
        domain: window.location.hostname
      });
    }
  };

  // Test Firestore connection
  const testFirestore = async () => {
    try {
      setStatus('Testing Firestore connection...');
      setError(null);
      
      // Try to read a test document
      const testDoc = await getDoc(doc(firestore, 'test', 'test-doc'));
      setStatus(`Firestore connection ${testDoc.exists() ? 'successful' : 'successful (document not found)'}`);
    } catch (err: any) {
      setStatus('Firestore connection failed');
      setError(`${err.code}: ${err.message}`);
      
      // Log detailed error information
      console.error('Firestore connection error details:', {
        code: err.code,
        message: err.message,
        firestoreConfigured: !!firestore,
        domain: window.location.hostname
      });
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
            onClick={testEmailLogin}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Test Email Login
          </button>
          <button 
            onClick={testGoogleLogin}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            Test Google Login
          </button>
          <button 
            onClick={testFirestore}
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
      
      <div>
        <div className="font-semibold text-blue-400 mb-2">Environment Variables:</div>
        <div className="bg-gray-700 p-3 rounded overflow-x-auto">
          <pre className="text-xs">
            {JSON.stringify(envVars, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default FirebaseAuthTest;
