import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Promethios</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          The next generation AI governance platform for responsible and transparent AI systems
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-3">Governance</h2>
          <p className="text-gray-600">
            Implement robust governance frameworks for your AI systems with comprehensive policies and controls.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-3">Transparency</h2>
          <p className="text-gray-600">
            Ensure transparency in AI operations with detailed documentation and explainable processes.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-3">Monitoring</h2>
          <p className="text-gray-600">
            Continuously monitor AI systems for compliance, performance, and ethical considerations.
          </p>
        </div>
      </section>

      <section className="py-8">
        <h2 className="text-3xl font-bold mb-6 text-center">Get Started Today</h2>
        <div className="flex justify-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
            Request Access
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
