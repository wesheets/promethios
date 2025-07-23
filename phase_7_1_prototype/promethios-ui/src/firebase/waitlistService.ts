import { doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Enhanced waitlist data interface
interface WaitlistData {
  email: string;
  role: string;
  whyAccess: string;
  organization?: string;
  aiConcern?: string;
  deploymentUrgency?: string;
  socialProfile?: string;
  onboardingCall: boolean;
  currentAiTools?: string;
  biggestAiFailure?: string;
  additionalConcerns?: string;
}

// Add user to waitlist with enhanced data
export const addToWaitlist = async (waitlistData: WaitlistData, db: any) => {
  try {
    // Check if email already exists in waitlist
    const waitlistRef = collection(db, 'waitlist');
    const emailQuery = query(waitlistRef, where('email', '==', waitlistData.email));
    const existingDocs = await getDocs(emailQuery);
    
    if (!existingDocs.empty) {
      return 'exists';
    }
    
    // Add comprehensive waitlist entry
    const docRef = await addDoc(waitlistRef, {
      ...waitlistData,
      timestamp: new Date().toISOString(),
      status: 'pending',
      leadScore: calculateLeadScore(waitlistData),
      priority: calculatePriority(waitlistData)
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    throw error;
  }
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

// Export waitlist as CSV with enhanced fields
export const exportWaitlistAsCSV = async (db: any) => {
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
      'Timestamp', 'Status', 'Lead Score', 'Priority'
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
        item.priority || 'unknown'
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


