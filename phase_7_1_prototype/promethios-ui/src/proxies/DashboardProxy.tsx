import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import ObserverAgentProxy from '../proxies/ObserverAgentProxy';

/**
 * DashboardProxy Component
 * 
 * This proxy component serves as a bridge to the Dashboard component in the /ui/ directory.
 * It provides the same dashboard content with metrics, activity feed, and Observer agent.
 */
const DashboardProxy: React.FC = () => {
  const { currentUser, db } = useAuth();
  const [governanceScore, setGovernanceScore] = useState(87);
  const [agentsCount, setAgentsCount] = useState(0);
  const [complianceStatus, setComplianceStatus] = useState('Compliant');
  const [recentActivities, setRecentActivities] = useState([
    { 
      id: 1, 
      message: 'Agent "Assistant" was wrapped with governance', 
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() 
    },
    { 
      id: 2, 
      message: 'Governance policy updated', 
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() 
    },
    { 
      id: 3, 
      message: 'New agent relationship defined', 
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() 
    }
  ]);
  
  // Fetch user data and update dashboard metrics
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          // In a real implementation, this would fetch data from Firestore
          // For now, we'll simulate data based on the user's email
          const emailHash = currentUser.email ? 
            currentUser.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
          
          // Generate somewhat random but consistent values based on email hash
          const score = 75 + (emailHash % 20); // Score between 75-95
          const agents = 1 + (emailHash % 15); // Between 1-15 agents
          
          setGovernanceScore(score);
          setAgentsCount(agents);
          setComplianceStatus(score >= 80 ? 'Compliant' : 'Needs Review');
          
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    
    fetchUserData();
  }, [currentUser]);
  
  // Set up real-time listener for activity feed
  useEffect(() => {
    if (!currentUser) return;
    
    try {
      // Temporarily comment out Firestore interaction to debug 'client is offline' error
      // const activitiesRef = collection(db, 'activities');
      // const activitiesQuery = query(
      //   activitiesRef,
      //   // Filter for this user's activities or global activities
      //   // orderBy('timestamp', 'desc'),
      //   limit(10)
      // );
      
      // This would be the real implementation with Firestore
      // For now, we'll simulate real-time updates with a timer
      const interval = setInterval(() => {
        // Generate a new activity every 30 seconds
        const newActivity = {
          id: Date.now(),
          message: getRandomActivity(),
          timestamp: new Date().toISOString()
        };
        
        setRecentActivities(prev => {
          // Add new activity to the beginning and limit to 10 items
          const updated = [newActivity, ...prev];
          return updated.slice(0, 10);
        });
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error setting up activity listener:', error);
    }
  }, [currentUser]);
  
  // Generate random activity for simulation
  const getRandomActivity = () => {
    const activities = [
      'New governance policy applied',
      'Agent compliance check completed',
      'Trust score updated',
      'Observer agent provided guidance',
      'Security audit completed',
      'New agent relationship mapped',
      'Governance report generated'
    ];
    return activities[Math.floor(Math.random() * activities.length)];
  };
  
  // Format timestamp to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
    } else if (diffHour > 0) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
    }
  };

  // Handle quick action button clicks
  const handleQuickAction = (action: string) => {
    console.log(`Quick action clicked: ${action}`);
    // In a real implementation, this would trigger the appropriate action
    // For now, we'll just add it to the activity feed
    const newActivity = {
      id: Date.now(),
      message: `${action} action initiated`,
      timestamp: new Date().toISOString()
    };
    
    setRecentActivities(prev => {
      const updated = [newActivity, ...prev];
      return updated.slice(0, 10);
    });
  };

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-4 text-white">Dashboard</h1>
      <p className="mb-6 text-gray-300">Welcome to your Promethios governance dashboard!</p>
      
      {/* Dashboard metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition-transform hover:scale-105">
          <h3 className="text-lg font-semibold mb-2 text-gray-200">Governance Score</h3>
          <div className={`text-4xl font-bold ${governanceScore >= 80 ? 'text-green-400' : 'text-yellow-400'} flex items-end`}>
            {governanceScore}%
            <span className="text-sm ml-2 text-gray-400 pb-1">
              {governanceScore >= 90 ? 'Excellent' : governanceScore >= 80 ? 'Good' : 'Needs Improvement'}
            </span>
          </div>
          <div className="mt-3 w-full bg-gray-600 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${governanceScore >= 90 ? 'bg-green-400' : governanceScore >= 80 ? 'bg-blue-400' : 'bg-yellow-400'}`}
              style={{ width: `${governanceScore}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition-transform hover:scale-105">
          <h3 className="text-lg font-semibold mb-2 text-gray-200">Agents Monitored</h3>
          <div className="text-4xl font-bold text-blue-400 flex items-end">
            {agentsCount}
            <span className="text-sm ml-2 text-gray-400 pb-1">
              {agentsCount > 10 ? 'Enterprise' : agentsCount > 5 ? 'Team' : 'Personal'}
            </span>
          </div>
          <div className="mt-3 flex space-x-1">
            {[...Array(Math.min(agentsCount, 5))].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-blue-400"></div>
            ))}
            {agentsCount > 5 && (
              <div className="text-xs text-gray-400 ml-1">+{agentsCount - 5} more</div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition-transform hover:scale-105">
          <h3 className="text-lg font-semibold mb-2 text-gray-200">Compliance Status</h3>
          <div className={`text-4xl font-bold ${complianceStatus === 'Compliant' ? 'text-green-400' : 'text-yellow-400'} flex items-center`}>
            {complianceStatus}
            <span className={`ml-2 w-3 h-3 rounded-full ${complianceStatus === 'Compliant' ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></span>
          </div>
          <div className="mt-3 text-sm text-gray-400">
            Last checked: {formatRelativeTime(new Date(Date.now() - 30 * 60 * 1000).toISOString())}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity with real-time updates */}
        <div className="lg:col-span-2">
          <div className="bg-gray-700 p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Recent Activity
            </h2>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex items-start bg-gray-800 p-3 rounded-lg hover:bg-gray-750 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0"></div>
                  <div className="flex-grow">
                    <p className="font-medium text-gray-200">{activity.message}</p>
                    <p className="text-sm text-gray-400">{formatRelativeTime(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <button 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 px-4 rounded-lg shadow transition-all duration-300 flex items-center justify-center"
                onClick={() => handleQuickAction('Wrap New Agent')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Wrap New Agent
              </button>
              <button 
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white py-3 px-4 rounded-lg shadow transition-all duration-300 flex items-center justify-center"
                onClick={() => handleQuickAction('View Governance Policies')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View Policies
              </button>
              <button 
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white py-3 px-4 rounded-lg shadow transition-all duration-300 flex items-center justify-center"
                onClick={() => handleQuickAction('Configure Observer')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configure Observer
              </button>
            </div>
          </div>
        </div>
        
        {/* Observer Agent */}
        <div className="lg:col-span-1">
          <ObserverAgentProxy />
        </div>
      </div>
    </div>
  );
};

export default DashboardProxy;





