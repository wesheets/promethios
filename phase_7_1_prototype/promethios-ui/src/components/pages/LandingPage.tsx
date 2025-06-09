import React from 'react';
import WaitlistFormDark from '../waitlist/WaitlistFormDark';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header/Navigation - Keep existing header */}
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">You've been lied to.</h1>
              <p className="text-xl text-gray-300 mb-8">
                The AI you trust is making things up — and you don't even know it.
                Promethios improves AI accuracy, traceability, and decision quality,
                making your models better by design.
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="/waitlist" 
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
                >
                  Protect My Agent
                </a>
                <a 
                  href="/benchmarks" 
                  className="px-6 py-3 bg-transparent border border-gray-600 hover:border-gray-400 rounded-md font-medium transition-colors"
                >
                  See Benchmarks
                </a>
              </div>
              <p className="text-sm text-gray-400 mt-4">
                Promethios is rolling out in phases, join the waitlist to reserve access to governed agent infrastructure.
              </p>
            </div>
            
            {/* Waitlist Form */}
            <div>
              <WaitlistFormDark />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-800">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">The only way to govern AI agents</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Promethios provides a comprehensive governance framework that makes it easy to
            wrap any agent with trust, compliance, and performance monitoring.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Feature 1 */}
          <div className="bg-gray-900 p-8 rounded-lg">
            <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Wrap Any Agent</h3>
            <p className="text-gray-400">
              Our automated detection system identifies integration points in any agent framework,
              allowing for seamless governance wrapping.
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-gray-900 p-8 rounded-lg">
            <div className="bg-green-600 w-12 h-12 rounded-full flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 100 2h10a1 1 0 100-2H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Monitor Performance</h3>
            <p className="text-gray-400">
              Real-time metrics visualization shows the impact of governance on agent performance,
              trust scores, and compliance rates.
            </p>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-gray-900 p-8 rounded-lg">
            <div className="bg-purple-600 w-12 h-12 rounded-full flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Prove Compliance</h3>
            <p className="text-gray-400">
              Comprehensive trust logs and verification systems provide auditable proof of agent
              compliance with governance parameters.
            </p>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to make your AI more trustworthy?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of developers who are building safer, more reliable AI systems with
            Promethios governance.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="/waitlist" 
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
            >
              Get Started For Free
            </a>
            <a 
              href="/docs" 
              className="px-8 py-3 bg-transparent border border-gray-600 hover:border-gray-400 rounded-md font-medium transition-colors"
            >
              Read the Docs
            </a>
          </div>
        </div>
      </section>
      
      {/* Footer - Keep existing footer */}
    </div>
  );
};

export default LandingPage;
