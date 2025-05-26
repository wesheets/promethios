import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const benchmarkData = [
  {
    name: 'Trust Score',
    ungoverned: 45,
    governed: 92,
  },
  {
    name: 'Compliance',
    ungoverned: 38,
    governed: 95,
  },
  {
    name: 'Error Rate',
    ungoverned: 65,
    governed: 12,
  },
  {
    name: 'Performance',
    ungoverned: 88,
    governed: 85,
  },
];

const BenchmarkPreview: React.FC = () => {
  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">CMU Benchmark</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            See the difference Promethios makes
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Our CMU benchmark results show dramatic improvements in trust, compliance, and error reduction with minimal performance impact.
          </p>
        </div>

        <motion.div 
          className="mt-10 bg-white p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={benchmarkData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ungoverned" name="Ungoverned Agent" fill="#9CA3AF" />
                <Bar dataKey="governed" name="Promethios Governed" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 text-center">
            <a
              href="/benchmark"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Explore Interactive Benchmark
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BenchmarkPreview;
