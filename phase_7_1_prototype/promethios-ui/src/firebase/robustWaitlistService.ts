import { collection, addDoc, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { generateWaitlistEmail } from './emailTemplateService';

export interface WaitlistData {
  email: string;
  role: string;
  aiConcern: string;
  whyAccess: string;
  organization: string;
  deploymentUrgency: string;
  socialProfile: string;
  onboardingCall: boolean;
  currentAiTools: string;
  biggestAiFailure: string;
  additionalConcerns: string;
}

// Test Firestore connection
export const testFirestoreConnection = async (): Promise<{ connected: boolean; error?: string }> => {
  try {
    console.log('🔍 Testing Firestore connection...');
    
    // Try to write a test document
    const testRef = doc(db, 'connection-test', 'test-doc');
    await setDoc(testRef, {
      timestamp: new Date().toISOString(),
      test: true
    });
    
    console.log('✅ Firestore connection successful!');
    return { connected: true };
  } catch (error: any) {
    console.error('❌ Firestore connection failed:', error);
    return { 
      connected: false, 
      error: error.message || 'Unknown connection error' 
    };
  }
};

// Add user to waitlist with enhanced error handling
export const addToWaitlistRobust = async (waitlistData: WaitlistData): Promise<{ success: boolean; id?: string; error?: string; exists?: boolean }> => {
  try {
    console.log('📝 Starting waitlist submission for:', waitlistData.email);
    
    // First test the connection
    const connectionTest = await testFirestoreConnection();
    if (!connectionTest.connected) {
      return {
        success: false,
        error: `Database connection failed: ${connectionTest.error}`
      };
    }
    
    // Check if email already exists in waitlist
    console.log('🔍 Checking for existing email...');
    const waitlistRef = collection(db, 'waitlist');
    const emailQuery = query(waitlistRef, where('email', '==', waitlistData.email));
    const existingDocs = await getDocs(emailQuery);
    
    if (!existingDocs.empty) {
      console.log('⚠️ Email already exists in waitlist');
      return {
        success: false,
        exists: true,
        error: 'Email already registered in waitlist'
      };
    }
    
    // Calculate lead scoring
    const leadScore = calculateLeadScore(waitlistData);
    const priority = calculatePriority(waitlistData);
    
    console.log('📊 Lead scoring complete:', { leadScore, priority });
    
    // Generate submission ID
    const submissionId = generateSubmissionId();
    
    // Generate email template for Firebase Trigger Email Extension
    const emailTemplate = generateWaitlistEmail(waitlistData, submissionId, priority, leadScore);
    
    // Add comprehensive waitlist entry with email template fields
    const waitlistEntry = {
      ...waitlistData,
      timestamp: new Date().toISOString(),
      status: 'pending',
      leadScore,
      priority,
      source: 'website-form',
      ipAddress: 'unknown', // Could be enhanced with IP detection
      userAgent: navigator.userAgent || 'unknown',
      submissionId,
      // Email template fields for Firebase Trigger Email Extension
      to: [emailTemplate.to], // Extension expects array format
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
      from: emailTemplate.from,
      replyTo: emailTemplate.replyTo,
      // Additional fields for extension
      delivery: {
        state: 'PENDING',
        attempts: 0,
        leaseExpireTime: null,
        error: null
      }
    };
    
    console.log('💾 Saving to Firestore with email template...');
    const docRef = await addDoc(waitlistRef, waitlistEntry);
    
    console.log('✅ Waitlist submission successful! Document ID:', docRef.id);
    console.log('📧 Email template included for automatic sending');
    
    // Verify the document was actually saved
    const savedDoc = await getDoc(docRef);
    if (!savedDoc.exists()) {
      throw new Error('Document was not saved properly');
    }
    
    console.log('✅ Document verification successful');
    
    return {
      success: true,
      id: docRef.id
    };
    
  } catch (error: any) {
    console.error('❌ Error adding to waitlist:', error);
    
    // Provide specific error messages
    let errorMessage = 'Failed to submit to waitlist';
    
    if (error.code === 'permission-denied') {
      errorMessage = 'Database permission denied. Please check Firestore security rules.';
    } else if (error.code === 'unavailable') {
      errorMessage = 'Database temporarily unavailable. Please try again.';
    } else if (error.code === 'deadline-exceeded') {
      errorMessage = 'Request timed out. Please check your internet connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Generate unique submission ID
const generateSubmissionId = (): string => {
  return 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Calculate lead score based on responses
const calculateLeadScore = (data: WaitlistData): number => {
  let score = 0;
  
  // Role scoring
  const roleScores: { [key: string]: number } = {
    'enterprise-cto': 100,
    'security-engineer': 90,
    'product-founder': 85,
    'ai-researcher': 80,
    'vc-investor': 95,
    'journalist': 70,
    'parent-concerned': 60,
    'student': 40,
    'other': 30
  };
  score += roleScores[data.role] || 30;
  
  // Deployment urgency scoring
  const urgencyScores: { [key: string]: number } = {
    'right-away': 50,
    'within-30-days': 30,
    'just-exploring': 10,
    'not-sure': 5
  };
  score += urgencyScores[data.deploymentUrgency || ''] || 0;
  
  // AI concern scoring (higher concern = higher score)
  const concernScores: { [key: string]: number } = {
    'security-breaches': 40,
    'compliance': 35,
    'hallucinations': 30,
    'misinformation': 25,
    'black-box-decisions': 20,
    'kids-unsupervised': 15,
    'other': 10
  };
  score += concernScores[data.aiConcern || ''] || 0;
  
  // Bonus points
  if (data.whyAccess && data.whyAccess.length > 50) score += 20; // Detailed response
  if (data.organization && data.organization.length > 0) score += 15; // Has organization
  if (data.socialProfile && data.socialProfile.length > 0) score += 10; // Has social presence
  if (data.onboardingCall) score += 25; // Willing to do call
  if (data.biggestAiFailure && data.biggestAiFailure.length > 30) score += 15; // Has real experience
  
  return Math.min(score, 300); // Cap at 300
};

// Calculate priority tier
const calculatePriority = (data: WaitlistData): string => {
  const score = calculateLeadScore(data);
  
  if (score >= 200) return 'high';
  if (score >= 150) return 'medium';
  if (score >= 100) return 'low';
  return 'very-low';
};

// Get waitlist statistics
export const getWaitlistStats = async (): Promise<{ total: number; pending: number; approved: number; error?: string }> => {
  try {
    const waitlistRef = collection(db, 'waitlist');
    const snapshot = await getDocs(waitlistRef);
    
    const docs = snapshot.docs.map(doc => doc.data());
    
    return {
      total: docs.length,
      pending: docs.filter(doc => doc.status === 'pending').length,
      approved: docs.filter(doc => doc.status === 'approved').length
    };
  } catch (error: any) {
    console.error('Error getting waitlist stats:', error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      error: error.message
    };
  }
};

// Export waitlist as CSV with enhanced fields
export const exportWaitlistAsCSV = async () => {
  try {
    const waitlistRef = collection(db, 'waitlist');
    const snapshot = await getDocs(waitlistRef);
    
    const waitlistData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Create CSV content with all fields
    const headers = [
      'Email', 'Role', 'Why Access', 'Organization', 'AI Concern', 
      'Deployment Urgency', 'Social Profile', 'Onboarding Call',
      'Current AI Tools', 'Biggest AI Failure', 'Additional Concerns',
      'Timestamp', 'Status', 'Lead Score', 'Priority', 'Submission ID'
    ];
    
    const csvContent = [
      headers.join(','),
      ...waitlistData.map(item => [
        item.email || '',
        item.role || '',
        `"${(item.whyAccess || '').replace(/"/g, '""')}"`,
        item.organization || '',
        item.aiConcern || '',
        item.deploymentUrgency || '',
        item.socialProfile || '',
        item.onboardingCall ? 'Yes' : 'No',
        item.currentAiTools || '',
        `"${(item.biggestAiFailure || '').replace(/"/g, '""')}"`,
        `"${(item.additionalConcerns || '').replace(/"/g, '""')}"`,
        item.timestamp || '',
        item.status || 'pending',
        item.leadScore || 0,
        item.priority || 'unknown',
        item.submissionId || item.id
      ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `waitlist-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return waitlistData.length;
  } catch (error) {
    console.error('Error exporting waitlist:', error);
    throw error;
  }
};

// Debug function to check Firestore rules and permissions
export const debugFirestoreAccess = async (): Promise<{ canRead: boolean; canWrite: boolean; errors: string[] }> => {
  const errors: string[] = [];
  let canRead = false;
  let canWrite = false;
  
  try {
    // Test read access
    console.log('🔍 Testing read access...');
    const waitlistRef = collection(db, 'waitlist');
    await getDocs(query(waitlistRef));
    canRead = true;
    console.log('✅ Read access successful');
  } catch (error: any) {
    errors.push(`Read error: ${error.message}`);
    console.error('❌ Read access failed:', error);
  }
  
  try {
    // Test write access
    console.log('🔍 Testing write access...');
    const testRef = doc(db, 'debug-test', 'test-' + Date.now());
    await setDoc(testRef, {
      test: true,
      timestamp: new Date().toISOString()
    });
    canWrite = true;
    console.log('✅ Write access successful');
  } catch (error: any) {
    errors.push(`Write error: ${error.message}`);
    console.error('❌ Write access failed:', error);
  }
  
  return { canRead, canWrite, errors };
};

