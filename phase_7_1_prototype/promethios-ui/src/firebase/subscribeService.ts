import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './config';

/**
 * Adds an email to the newsletter subscription list
 * @param email The email address to subscribe
 * @returns A promise that resolves to true if successful, or an error message if failed
 */
export const subscribeToNewsletter = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if email already exists
    const subscribersRef = collection(db, 'subscribers');
    const q = query(subscribersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { 
        success: true, 
        message: 'You are already subscribed to our newsletter!' 
      };
    }
    
    // Add new subscriber
    await addDoc(collection(db, 'subscribers'), {
      email,
      subscribed_at: new Date(),
      source: 'website_footer'
    });
    
    return { 
      success: true, 
      message: 'Successfully subscribed to the newsletter!' 
    };
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return { 
      success: false, 
      message: 'Failed to subscribe. Please try again later.' 
    };
  }
};

