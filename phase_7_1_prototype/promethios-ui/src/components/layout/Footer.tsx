import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const Footer: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <footer className={`${isDarkMode ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'} py-12`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top section with logo and tagline */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-12">
          <div className="mb-8 md:mb-0">
            <Link to="/" className="flex items-center">
              <img 
                src="/images/promethioslogonew.png" 
                alt="Promethios Logo" 
                className="h-8" 
              />
            </Link>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Improving AI through Governance
            </p>
          </div>
          
          {/* Navigation sections */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full md:w-auto">
            {/* Company section */}
            <div>
              <h3 className="text-base font-medium mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/about" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Product section */}
            <div>
              <h3 className="text-base font-medium mb-4">Product</h3>
              <ul className="space-y-3">
                {/* Placeholder for future product links */}
              </ul>
            </div>
            
            {/* Support section */}
            <div>
              <h3 className="text-base font-medium mb-4">Support</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/contact" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/request-demo" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
                    Request Demo
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Legal section */}
            <div>
              <h3 className="text-base font-medium mb-4">Legal</h3>
              <ul className="space-y-3">
                {/* Placeholder for future legal links */}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Bottom section with social links */}
        <div className="pt-8 border-t border-gray-700 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Promethios. All rights reserved.
            </p>
          </div>
          
          <div className="flex space-x-6">
            <a href="https://twitter.com/promethios" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-400">
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            
            <a href="https://linkedin.com/company/promethios" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-400">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            
            <a href="https://github.com/promethios" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-400">
              <span className="sr-only">GitHub</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
