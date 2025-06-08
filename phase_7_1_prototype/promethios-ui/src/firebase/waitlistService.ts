import { doc, setDoc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from './config';

// Add user to waitlist
export const addToWaitlist = async (email: string, role: string) => {
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

