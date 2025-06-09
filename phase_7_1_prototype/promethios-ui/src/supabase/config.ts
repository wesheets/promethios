// Supabase Configuration
import { createClient } from '@supabase/supabase-js';

// Supabase configuration with environment variables and actual credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hohrmazqbfcpiosptmgq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvaHJtYXpxYmZjcGlvc3B0bWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzI1ODcsImV4cCI6MjAzMzAwODU4N30.eyJpc3M3MiOiJzd';

// Log configuration for debugging (without sensitive values)
console.log('Supabase Configuration Debug:');
console.log('SUPABASE_URL:', supabaseUrl.replace(/^(https:\/\/[^.]+).*$/, '$1...'));
console.log('Current domain:', window.location.hostname);
console.log('Environment mode:', import.meta.env.MODE);

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for waitlist entries
export interface WaitlistEntry {
  id?: string;
  email: string;
  name: string;
  company?: string;
  reason?: string;
  created_at?: string;
  approved?: boolean;
  invited?: boolean;
}

// Add user to waitlist
export const addToWaitlist = async (entry: WaitlistEntry) => {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .insert([
        { 
          email: entry.email,
          name: entry.name,
          company: entry.company || null,
          reason: entry.reason || null,
          approved: false,
          invited: false
        }
      ]);
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return { success: false, error };
  }
};

// Get waitlist entries (admin only)
export const getWaitlistEntries = async () => {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching waitlist entries:', error);
    return { success: false, error };
  }
};

// Approve waitlist entry (admin only)
export const approveWaitlistEntry = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .update({ approved: true })
      .eq('id', id);
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error approving waitlist entry:', error);
    return { success: false, error };
  }
};

// Send invitation (admin only)
export const sendInvitation = async (email: string) => {
  try {
    // This would typically call a server function to send the actual email
    // For now, we'll just mark the user as invited in the database
    const { data, error } = await supabase
      .from('waitlist')
      .update({ invited: true })
      .eq('email', email);
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error sending invitation:', error);
    return { success: false, error };
  }
};

// Authentication functions
export const signUp = async (email: string, password: string) => {
  try {
    // First check if the email is in the waitlist and has been invited
    const { data: waitlistData, error: waitlistError } = await supabase
      .from('waitlist')
      .select('*')
      .eq('email', email)
      .eq('invited', true)
      .single();
    
    if (waitlistError || !waitlistData) {
      return { 
        success: false, 
        error: { message: 'You need an invitation to sign up. Please join our waitlist.' } 
      };
    }
    
    // If the user has been invited, allow sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error signing up:', error);
    return { success: false, error };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error signing in:', error);
    return { success: false, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error };
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { success: false, error };
  }
};

export const onAuthStateChange = (callback: (event: any, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Export the supabase client for direct access if needed
export { supabase };
