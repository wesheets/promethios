import { doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs } from 'firebase/firestore';

// Add user to waitlist
export const addToWaitlist = async (email: string, role: string, db: any) => {
  try {
    // Check if email already exists in waitlist
    const waitlistRef = collection(db, 'waitlist');
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
export const exportWaitlistAsCSV = async (db: any) => {
  try {
    const waitlistRef = collection(db, 'waitlist');
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


