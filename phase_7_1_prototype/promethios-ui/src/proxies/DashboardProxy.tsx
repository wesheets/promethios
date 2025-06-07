import React from 'react';

/**
 * DashboardProxy Component
 * 
 * This proxy component serves as a bridge to the Dashboard component in the /ui/ directory.
 * It provides the same dashboard content with metrics, activity feed, and Observer agent.
 */
const DashboardProxy: React.FC = () => {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Welcome to the new Promethios UI with collapsible navigation!</p>
      
      {/* Dashboard metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Governance Score</h3>
          <div className="text-3xl font-bold text-blue-400">87%</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Agents Monitored</h3>
          <div className="text-3xl font-bold text-blue-400">12</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Compliance Status</h3>
          <div className="text-3xl font-bold text-green-400">Compliant</div>
        </div>
      </div>
      
      {/* Recent activity */}
      <div className="bg-gray-700 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-2"></div>
            <div>
              <p className="font-medium">Agent "Assistant" was wrapped with governance</p>
              <p className="text-sm text-gray-400">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-2"></div>
            <div>
              <p className="font-medium">Governance policy updated</p>
              <p className="text-sm text-gray-400">Yesterday</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-2"></div>
            <div>
              <p className="font-medium">New agent relationship defined</p>
              <p className="text-sm text-gray-400">3 days ago</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Observer Agent */}
      <div className="mt-8 p-4 border border-gray-700 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Observer Agent</h2>
        <p>The Observer agent would normally appear here on governance-relevant screens.</p>
        <p className="mt-2 text-sm text-gray-400">Observer is tracking your governance preferences and will provide personalized guidance.</p>
      </div>
    </>
  );
};

export default DashboardProxy;
