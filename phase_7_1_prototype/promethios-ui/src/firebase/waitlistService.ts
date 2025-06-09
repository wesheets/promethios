import { doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { firestore } from './config';

// Add user to waitlist
export const addToWaitlist = async (email: string, role: string) => {
  try {
    // Check if email already exists in waitlist
    const waitlistRef = collection(firestore, 'waitlist');
    const docRef = await addDoc(waitlistRef, {
      email,
      role,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    throw error;
  }
};

// Export waitlist as CSV
export const exportWaitlistAsCSV = async () => {
  try {
    const waitlistRef = collection(firestore, 'waitlist');
    const snapshot = await getDocs(waitlistRef);
    
    const waitlistData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Create CSV content
    const headers = ['Email', 'Role', 'Timestamp', 'Status'];
    const csvContent = [
      headers.join(','),
      ...waitlistData.map(item => [
        item.email || '',
        item.role || '',
        item.timestamp || '',
        item.status || 'pending'
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
