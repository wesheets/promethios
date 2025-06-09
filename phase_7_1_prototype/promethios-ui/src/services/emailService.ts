// Email Service for SendGrid integration
import { WaitlistEntry } from '../supabase/config';

// This is a client-side service that will call server endpoints
// In a production environment, these emails should be sent from a secure backend

/**
 * Send waitlist confirmation email
 * @param entry Waitlist entry data
 * @returns Promise with result
 */
export const sendWaitlistConfirmation = async (entry: WaitlistEntry) => {
  try {
    // In production, this would call a server endpoint
    // For now, we'll simulate a successful email send
    console.log('Sending waitlist confirmation email to:', entry.email);
    
    // Simulate API call to server endpoint
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      success: true, 
      message: `Confirmation email sent to ${entry.email}` 
    };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { 
      success: false, 
      error 
    };
  }
};

/**
 * Send invitation email
 * @param entry Waitlist entry data
 * @returns Promise with result
 */
export const sendInvitationEmail = async (entry: WaitlistEntry) => {
  try {
    // In production, this would call a server endpoint
    // For now, we'll simulate a successful email send
    console.log('Sending invitation email to:', entry.email);
    
    // Simulate API call to server endpoint
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      success: true, 
      message: `Invitation email sent to ${entry.email}` 
    };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { 
      success: false, 
      error 
    };
  }
};

// For server-side implementation (to be used in a serverless function or API route)
// This code would be in a separate server-side file
/*
import sgMail from '@sendgrid/mail';

// Set SendGrid API key
const setSendGridApiKey = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SendGrid API key not found');
  }
  sgMail.setApiKey(apiKey);
};

// Send waitlist confirmation email
export const sendWaitlistConfirmationEmail = async (entry: WaitlistEntry) => {
  try {
    setSendGridApiKey();
    
    const msg = {
      to: entry.email,
      from: 'hello@promethios.ai', // Verified sender
      subject: 'Welcome to the Promethios Waitlist',
      text: `Hello ${entry.name},\n\nThank you for joining the Promethios waitlist! We're excited to have you on board.\n\nWe'll notify you as soon as you're approved for access.\n\nBest regards,\nThe Promethios Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Promethios!</h2>
          <p>Hello ${entry.name},</p>
          <p>Thank you for joining the Promethios waitlist! We're excited to have you on board.</p>
          <p>We'll notify you as soon as you're approved for access.</p>
          <p>Best regards,<br>The Promethios Team</p>
        </div>
      `
    };
    
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error };
  }
};

// Send invitation email
export const sendInvitationEmail = async (entry: WaitlistEntry) => {
  try {
    setSendGridApiKey();
    
    const msg = {
      to: entry.email,
      from: 'hello@promethios.ai', // Verified sender
      subject: 'You\'re Invited to Join Promethios!',
      text: `Hello ${entry.name},\n\nGreat news! You've been approved to join Promethios.\n\nClick the link below to create your account and get started:\n\nhttps://app.promethios.ai/register?email=${encodeURIComponent(entry.email)}\n\nThis invitation link will expire in 7 days.\n\nBest regards,\nThe Promethios Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You're Invited to Join Promethios!</h2>
          <p>Hello ${entry.name},</p>
          <p>Great news! You've been approved to join Promethios.</p>
          <p><a href="https://app.promethios.ai/register?email=${encodeURIComponent(entry.email)}" style="display: inline-block; background-color: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Create Your Account</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p>https://app.promethios.ai/register?email=${encodeURIComponent(entry.email)}</p>
          <p>This invitation link will expire in 7 days.</p>
          <p>Best regards,<br>The Promethios Team</p>
        </div>
      `
    };
    
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error };
  }
};
*/
