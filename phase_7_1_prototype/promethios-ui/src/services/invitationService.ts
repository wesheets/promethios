// Invitation Service for Promethios
import { supabase, WaitlistEntry } from '../supabase/config';
import { sendInvitationEmail } from './emailService';
import { getInvitationHTML, getInvitationText } from '../templates/emailTemplates';

/**
 * Generate an invitation URL for a user
 * @param email User's email address
 * @returns Invitation URL with pre-filled email
 */
export const generateInvitationUrl = (email: string): string => {
  const baseUrl = window.location.origin || 'https://app.promethios.ai';
  return `${baseUrl}/register?email=${encodeURIComponent(email)}`;
};

/**
 * Approve a waitlist entry and send invitation
 * @param entry Waitlist entry to approve
 * @returns Promise with result
 */
export const approveAndInviteUser = async (entry: WaitlistEntry): Promise<{ success: boolean; message?: string; error?: any }> => {
  try {
    if (!entry.id) {
      throw new Error('Entry ID is required');
    }

    // Update the waitlist entry to mark as approved
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({ 
        approved: true,
        invited: true 
      })
      .eq('id', entry.id);
    
    if (updateError) {
      throw updateError;
    }

    // Generate invitation URL
    const inviteUrl = generateInvitationUrl(entry.email);
    
    // Send invitation email
    const emailResult = await sendInvitationEmail({
      ...entry,
      inviteUrl
    });

    if (!emailResult.success) {
      // If email fails, still return success for the approval but with a warning
      return { 
        success: true, 
        message: `User approved but there was an issue sending the invitation email: ${emailResult.error}` 
      };
    }

    return { 
      success: true, 
      message: `User ${entry.email} approved and invitation sent successfully` 
    };
  } catch (error) {
    console.error('Error approving and inviting user:', error);
    return { 
      success: false, 
      error 
    };
  }
};

/**
 * Check if an email is on the approved waitlist
 * @param email Email to check
 * @returns Promise with result
 */
export const checkWaitlistApproval = async (email: string): Promise<{ approved: boolean; invited: boolean; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('approved, invited')
      .eq('email', email)
      .single();
    
    if (error) {
      throw error;
    }

    return { 
      approved: data?.approved || false, 
      invited: data?.invited || false 
    };
  } catch (error) {
    console.error('Error checking waitlist approval:', error);
    return { 
      approved: false, 
      invited: false, 
      error 
    };
  }
};

/**
 * Register a user from an invitation
 * @param email User's email
 * @param password User's password
 * @returns Promise with result
 */
export const registerFromInvitation = async (email: string, password: string): Promise<{ success: boolean; message?: string; error?: any }> => {
  try {
    // First check if the email is in the waitlist and has been invited
    const waitlistStatus = await checkWaitlistApproval(email);
    
    if (!waitlistStatus.approved || !waitlistStatus.invited) {
      return { 
        success: false, 
        message: 'You need an invitation to register. Please join our waitlist.' 
      };
    }
    
    // If the user has been invited, allow registration
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }

    return { 
      success: true, 
      message: 'Registration successful! Please check your email to verify your account.' 
    };
  } catch (error) {
    console.error('Error registering from invitation:', error);
    return { 
      success: false, 
      error 
    };
  }
};

/**
 * Get all waitlist entries (admin only)
 * @returns Promise with waitlist entries
 */
export const getWaitlistEntries = async (): Promise<{ success: boolean; data?: WaitlistEntry[]; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }

    return { 
      success: true, 
      data: data as WaitlistEntry[] 
    };
  } catch (error) {
    console.error('Error fetching waitlist entries:', error);
    return { 
      success: false, 
      error 
    };
  }
};
