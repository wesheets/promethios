import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const FeedbackWidget: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Feedback submitted:', { feedbackType, feedbackText, email });
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFeedbackText('');
        setIsOpen(false);
      }, 3000);
    }, 1000);
  };

  return (
    <>
      {/* Feedback button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          aria-label="Open feedback form"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </button>
      </div>

      {/* Feedback modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              className={`fixed bottom-20 right-5 w-80 rounded-lg shadow-xl z-50 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    {isSubmitted ? 'Thank you!' : 'Send Feedback'}
                  </h3>
                  <button
                    onClick={() => !isSubmitting && setIsOpen(false)}
                    className={`rounded-full p-1 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} focus:outline-none`}
                    disabled={isSubmitting}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {isSubmitted ? (
                  <div className="text-center py-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
                      <svg className="h-6 w-6 text-green-600 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="mt-2">Your feedback has been submitted. We appreciate your input!</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Feedback type</label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setFeedbackType('bug')}
                          className={`px-3 py-1 text-sm rounded-full ${
                            feedbackType === 'bug'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : `${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`
                          }`}
                        >
                          Bug
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedbackType('feature')}
                          className={`px-3 py-1 text-sm rounded-full ${
                            feedbackType === 'feature'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : `${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`
                          }`}
                        >
                          Feature request
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedbackType('general')}
                          className={`px-3 py-1 text-sm rounded-full ${
                            feedbackType === 'general'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : `${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`
                          }`}
                        >
                          General
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="feedback-text" className="block text-sm font-medium mb-1">
                        Your feedback
                      </label>
                      <textarea
                        id="feedback-text"
                        rows={4}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        required
                        placeholder="Tell us what you think..."
                        className={`w-full px-3 py-2 border rounded-md ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="feedback-email" className="block text-sm font-medium mb-1">
                        Email (optional)
                      </label>
                      <input
                        id="feedback-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className={`w-full px-3 py-2 border rounded-md ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        We'll email you when we address your feedback
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || !feedbackText}
                        className={`px-4 py-2 rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                          (isSubmitting || !feedbackText) && 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </>
                        ) : (
                          'Send feedback'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackWidget;
