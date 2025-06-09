import React, { useState } from 'react';
import { addToWaitlist } from '../../supabase/config';
import { sendWaitlistConfirmation } from '../../services/emailService';

const WaitlistFormDark: React.FC = () => {
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

  return (
    <div className="max-w-md mx-auto bg-gray-900 p-8 rounded-lg shadow-md border border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Join the Promethios Waitlist</h2>
      
      <p className="text-gray-400 mb-6 text-center">
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
              className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white sm:text-sm"
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
              className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white sm:text-sm"
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
              className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white sm:text-sm"
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
              className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white sm:text-sm"
              required
            ></textarea>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading
                ? 'bg-blue-700 opacity-70 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {loading ? 'Processing...' : 'Join Waitlist'}
          </button>
        </form>
      )}
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <a href="/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default WaitlistFormDark;
