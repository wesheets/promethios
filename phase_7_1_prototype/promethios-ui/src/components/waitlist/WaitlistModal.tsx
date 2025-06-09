import React, { useState } from 'react';
import { addToWaitlist } from '../../supabase/config';
import { sendWaitlistConfirmation } from '../../services/emailService';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!name || !email || !reason) {
        throw new Error('Please fill in all required fields');
      }

      // Add to waitlist in Supabase
      const result = await addToWaitlist({
        name,
        email,
        company,
        reason
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to join waitlist');
      }

      // Send confirmation email
      await sendWaitlistConfirmation({
        name,
        email,
        company,
        reason
      });

      // Show success message
      setSuccess(true);
      
      // Reset form
      setName('');
      setEmail('');
      setCompany('');
      setReason('');
    } catch (err: any) {
      console.error('Error submitting waitlist form:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>

        {/* Modal content */}
        <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-2xl leading-6 font-bold text-white mb-6">
                  Join the Promethios Waitlist
                </h3>
                
                <p className="text-gray-300 mb-6">
                  Be among the first to access our platform for wrapping and deploying AI agents with governance.
                </p>
                
                {success ? (
                  <div className="bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-6">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-blue-300">
                          Thank you for joining our waitlist! We'll notify you when you're approved.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {error && (
                      <div className="bg-red-900/30 border-l-4 border-red-500 p-4 mb-6">
                        <div className="flex">
                          <div className="ml-3">
                            <p className="text-sm text-red-300">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="company" className="block text-sm font-medium text-gray-300">
                        Company (Optional)
                      </label>
                      <input
                        type="text"
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Enter your company name (optional)"
                        className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white sm:text-sm"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="reason" className="block text-sm font-medium text-gray-300">
                        Why are you interested in Promethios? *
                      </label>
                      <textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white sm:text-sm"
                        required
                      ></textarea>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={onClose}
                        className="mr-3 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2 text-sm font-medium rounded-md text-white ${
                          loading
                            ? 'bg-blue-700 opacity-70 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        }`}
                      >
                        {loading ? 'Processing...' : 'Join Waitlist'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitlistModal;
