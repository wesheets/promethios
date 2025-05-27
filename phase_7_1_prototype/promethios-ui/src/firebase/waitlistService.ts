// Firestore service for waitlist management
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from './config';

// Interface for waitlist entry
export interface WaitlistEntry {
  email: string;
  role: string;
  createdAt: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

// Collection reference
const waitlistCollection = collection(db, 'waitlist');

// Add a new waitlist entry
export const addToWaitlist = async (email: string, role: string): Promise<string> => {
  try {
    // Check if email already exists in waitlist
    const emailQuery = query(waitlistCollection, where('email', '==', email));
    const querySnapshot = await getDocs(emailQuery);
    
    if (!querySnapshot.empty) {
      // Email already exists in waitlist
      return 'exists';
    }
    
    // Create new waitlist entry
    const docRef = await addDoc(waitlistCollection, {
      email,
      role,
      createdAt: Timestamp.now(),
      status: 'pending'
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    throw error;
  }
};

// Get all waitlist entries (for admin use)
export const getWaitlistEntries = async (): Promise<WaitlistEntry[]> => {
  try {
    const querySnapshot = await getDocs(waitlistCollection);
    const entries: WaitlistEntry[] = [];
    
    querySnapshot.forEach((doc) => {
      entries.push(doc.data() as WaitlistEntry);
    });
    
    return entries;
  } catch (error) {
    console.error('Error getting waitlist entries:', error);
    throw error;
  }
};

// Export waitlist emails as CSV (for admin use)
export const exportWaitlistAsCSV = async (): Promise<string> => {
  try {
    const entries = await getWaitlistEntries();
    
    // Create CSV header
    let csv = 'Email,Role,Date,Status\n';
    
    // Add each entry as a row
    entries.forEach((entry) => {
      const date = entry.createdAt.toDate().toISOString().split('T')[0];
      csv += `${entry.email},${entry.role},${date},${entry.status}\n`;
    });
    
    return csv;
  } catch (error) {
    console.error('Error exporting waitlist:', error);
    throw error;
  }
};
