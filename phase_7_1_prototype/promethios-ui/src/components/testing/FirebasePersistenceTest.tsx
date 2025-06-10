import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import FirebaseErrorBoundary from '../common/FirebaseErrorBoundary';

/**
 * Firebase Data Persistence Test Component
 * 
 * This component tests Firebase data persistence by writing and reading
 * a test document for the current user.
 */
const FirebasePersistenceTest: React.FC = () => {
  const { currentUser } = useAuth();
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const runTest = async () => {
    if (!currentUser) {
      setError("No authenticated user");
      return;
    }

    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      // Create a test document path
      const testDocRef = doc(db, 'persistence_tests', currentUser.uid);
      
      // Write test data
      const testData = {
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(36).substring(2, 15)
      };
      
      console.log('Writing test data:', testData);
      await setDoc(testDocRef, testData);
      
      // Read back the test data
      const docSnap = await getDoc(testDocRef);
      
      if (docSnap.exists()) {
        const readData = docSnap.data();
        console.log('Read test data:', readData);
        
        // Verify the data matches
        if (readData.testId === testData.testId) {
          setTestResult('SUCCESS: Firebase data persistence is working correctly');
        } else {
          setTestResult('PARTIAL: Firebase read/write works but data mismatch');
        }
      } else {
        setError('Failed to read test document after writing');
      }
    } catch (err: any) {
      console.error('Firebase persistence test error:', err);
      setError(`Firebase persistence test failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run the test when the component mounts and user is available
    if (currentUser) {
      runTest();
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">Please sign in to test Firebase persistence</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border rounded-md shadow-sm">
      <h3 className="text-lg font-medium mb-4">Firebase Persistence Test</h3>
      
      {loading && (
        <div className="flex items-center space-x-2 mb-4">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          <span className="text-gray-600">Testing Firebase persistence...</span>
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {testResult && (
        <div className={`p-3 ${testResult.includes('SUCCESS') ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded mb-4`}>
          <p className={`text-sm ${testResult.includes('SUCCESS') ? 'text-green-700' : 'text-yellow-700'}`}>{testResult}</p>
        </div>
      )}
      
      <button
        onClick={runTest}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run Test Again'}
      </button>
    </div>
  );
};

/**
 * Wrapped Firebase Persistence Test with Error Boundary
 */
const FirebasePersistenceTestWithErrorBoundary: React.FC = () => {
  return (
    <FirebaseErrorBoundary serviceName="Data Persistence Test">
      <FirebasePersistenceTest />
    </FirebaseErrorBoundary>
  );
};

export default FirebasePersistenceTestWithErrorBoundary;
