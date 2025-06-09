// Firebase Authentication Test Component
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';

const FirebaseAuthTest: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');

  const addTestResult = (message: string, isError: boolean = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const result = `[${timestamp}] ${isError ? '❌' : '✅'} ${message}`;
    setTestResults(prev => [...prev, result]);
    console.log(result);
  };

  useEffect(() => {
    addTestResult('🔧 Starting Firebase Auth Test Component');
    
    // Test auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        addTestResult(`Auth state changed: User logged in (${user.email})`);
      } else {
        addTestResult('Auth state changed: No user logged in');
      }
    });

    // Test Firebase Auth object
    try {
      addTestResult(`Firebase Auth object exists: ${!!auth}`);
      addTestResult(`Firebase Auth app: ${auth.app.name}`);
      addTestResult(`Firebase Auth config: ${auth.config?.apiKey ? 'API key present' : 'API key missing'}`);
    } catch (error) {
      addTestResult(`Firebase Auth object error: ${error}`, true);
    }

    return () => unsubscribe();
  }, []);

  const testGoogleSignIn = async () => {
    addTestResult('🔍 Testing Google Sign In...');
    try {
      const provider = new GoogleAuthProvider();
      addTestResult('Google provider created successfully');
      
      const result = await signInWithPopup(auth, provider);
      addTestResult(`Google Sign In successful: ${result.user.email}`);
    } catch (error: any) {
      addTestResult(`Google Sign In failed: ${error.code} - ${error.message}`, true);
      
      // Additional error details
      if (error.code === 'auth/api-key-not-valid') {
        addTestResult('🔍 API Key validation failed - checking configuration...', true);
        addTestResult(`Current API Key: ${import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 20)}...`);
      }
      
      if (error.code === 'auth/unauthorized-domain') {
        addTestResult('🔍 Domain not authorized - check Firebase Console', true);
        addTestResult(`Current domain: ${window.location.hostname}`);
      }
    }
  };

  const testEmailSignIn = async () => {
    addTestResult('🔍 Testing Email/Password Sign In...');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      addTestResult(`Email Sign In successful: ${result.user.email}`);
    } catch (error: any) {
      addTestResult(`Email Sign In failed: ${error.code} - ${error.message}`, true);
    }
  };

  const testEmailSignUp = async () => {
    addTestResult('🔍 Testing Email/Password Sign Up...');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      addTestResult(`Email Sign Up successful: ${result.user.email}`);
    } catch (error: any) {
      addTestResult(`Email Sign Up failed: ${error.code} - ${error.message}`, true);
    }
  };

  const testPasswordReset = async () => {
    addTestResult('🔍 Testing Password Reset...');
    try {
      await sendPasswordResetEmail(auth, email);
      addTestResult(`Password reset email sent to: ${email}`);
    } catch (error: any) {
      addTestResult(`Password reset failed: ${error.code} - ${error.message}`, true);
    }
  };

  const testSignOut = async () => {
    addTestResult('🔍 Testing Sign Out...');
    try {
      await auth.signOut();
      addTestResult('Sign out successful');
    } catch (error: any) {
      addTestResult(`Sign out failed: ${error.code} - ${error.message}`, true);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (loading) {
    return <div className="p-4">Loading Firebase Auth Test...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔥 Firebase Authentication Test</h1>
      
      {/* Current User Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Current User Status</h2>
        {user ? (
          <div>
            <p>✅ Logged in as: {user.email}</p>
            <p>User ID: {user.uid}</p>
            <p>Provider: {user.providerData[0]?.providerId || 'Unknown'}</p>
          </div>
        ) : (
          <p>❌ No user logged in</p>
        )}
      </div>

      {/* Test Controls */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Test Controls</h2>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <input
            type="email"
            placeholder="Test email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Test password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={testGoogleSignIn}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Test Google Sign In
          </button>
          <button
            onClick={testEmailSignIn}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Email Sign In
          </button>
          <button
            onClick={testEmailSignUp}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Email Sign Up
          </button>
          <button
            onClick={testPasswordReset}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Test Password Reset
          </button>
          {user && (
            <button
              onClick={testSignOut}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Test Sign Out
            </button>
          )}
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Test Results</h2>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <p>No test results yet. Click a test button to start.</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="mb-1">
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Environment Info */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Environment Information</h2>
        <div className="bg-gray-100 p-4 rounded text-sm">
          <p><strong>Domain:</strong> {window.location.hostname}</p>
          <p><strong>Origin:</strong> {window.location.origin}</p>
          <p><strong>Mode:</strong> {import.meta.env.MODE}</p>
          <p><strong>API Key Present:</strong> {import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Project ID:</strong> {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Not set'}</p>
          <p><strong>Auth Domain:</strong> {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'Not set'}</p>
        </div>
      </div>
    </div>
  );
};

export default FirebaseAuthTest;

