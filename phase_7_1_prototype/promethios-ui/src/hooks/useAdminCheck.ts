import { useAuth } from '../context/AuthContext';

// List of admin email addresses
const ADMIN_EMAILS = [
  'wesheets@hotmail.com',
  'admin@promethios.com',
  // Add more admin emails as needed
];

/**
 * Hook to check if the current user has admin privileges
 */
export const useAdminCheck = () => {
  const { currentUser } = useAuth();
  
  const isAdmin = currentUser?.email ? ADMIN_EMAILS.includes(currentUser.email.toLowerCase()) : false;
  
  return {
    isAdmin,
    userEmail: currentUser?.email,
  };
};

/**
 * Utility function to check if an email has admin privileges
 */
export const checkAdminStatus = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

export default useAdminCheck;

