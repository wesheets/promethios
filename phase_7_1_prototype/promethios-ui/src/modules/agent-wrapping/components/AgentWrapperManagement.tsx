import React from 'react';
import { AgentWrapper } from '../types';
import { useAgentWrappers } from '../hooks/useAgentWrappers';

interface AgentWrapperManagementProps {
  className?: string;
}

/**
 * Component for managing agent wrappers
 */
const AgentWrapperManagement: React.FC<AgentWrapperManagementProps> = ({ className }) => {
  const { 
    wrappers, 
    loading, 
    error, 
    enableWrapper, 
    disableWrapper,
    isWrapperEnabled,
    getWrapperMetrics
  } = useAgentWrappers();

  if (loading) {
    return <div className="p-4">Loading agent wrappers...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  if (wrappers.length === 0) {
    return (
      <div className="p-4">
        <p>No agent wrappers found.</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => console.log('Create new wrapper')}
        >
          Create New Wrapper
        </button>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Agent Wrappers</h2>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => console.log('Create new wrapper')}
        >
          Create New Wrapper
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wrappers.map((wrapper) => {
          const metrics = getWrapperMetrics(wrapper.id);
          const isEnabled = isWrapperEnabled(wrapper.id);
          
          return (
            <div 
              key={wrapper.id} 
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{wrapper.name}</h3>
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isEnabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span>{isEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
              
              <p className="text-gray-600 mt-2">{wrapper.description}</p>
              
              <div className="mt-4 text-sm text-gray-500">
                <div>Version: {wrapper.version}</div>
                <div>Providers: {wrapper.supportedProviders.join(', ')}</div>
              </div>
              
              {metrics && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-100 p-2 rounded">
                    <div className="font-medium">Requests</div>
                    <div>{metrics.requestCount}</div>
                  </div>
                  <div className="bg-gray-100 p-2 rounded">
                    <div className="font-medium">Success Rate</div>
                    <div>
                      {metrics.requestCount > 0
                        ? `${Math.round((metrics.successCount / metrics.requestCount) * 100)}%`
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-between">
                <button 
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  onClick={() => console.log('View details', wrapper.id)}
                >
                  Details
                </button>
                
                {isEnabled ? (
                  <button 
                    className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                    onClick={() => disableWrapper(wrapper.id)}
                  >
                    Disable
                  </button>
                ) : (
                  <button 
                    className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                    onClick={() => enableWrapper(wrapper.id)}
                  >
                    Enable
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentWrapperManagement;
