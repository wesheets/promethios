import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  eventTypes: string[];
  verificationStatus: string[];
  agentTypes: string[];
}

interface AuditFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export const AuditFilters: React.FC<AuditFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const { isDarkMode } = useTheme();

  const eventTypes = [
    { value: 'agent_created', label: 'Agent Created' },
    { value: 'agent_updated', label: 'Agent Updated' },
    { value: 'agent_deleted', label: 'Agent Deleted' },
    { value: 'policy_violation', label: 'Policy Violation' },
    { value: 'compliance_check', label: 'Compliance Check' },
    { value: 'data_access', label: 'Data Access' },
    { value: 'user_interaction', label: 'User Interaction' },
    { value: 'system_event', label: 'System Event' }
  ];

  const verificationStatuses = [
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' }
  ];

  const agentTypes = [
    { value: 'financial_agent', label: 'Financial Agent' },
    { value: 'general_agent', label: 'General Agent' },
    { value: 'healthcare_agent', label: 'Healthcare Agent' },
    { value: 'compliance_agent', label: 'Compliance Agent' },
    { value: 'test_agent', label: 'Test Agent' }
  ];

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    });
  };

  const handleMultiSelectChange = (
    field: 'eventTypes' | 'verificationStatus' | 'agentTypes',
    value: string,
    checked: boolean
  ) => {
    const currentValues = filters[field];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);

    onFiltersChange({
      ...filters,
      [field]: newValues
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      eventTypes: [],
      verificationStatus: [],
      agentTypes: []
    });
  };

  const getActiveFilterCount = () => {
    return filters.eventTypes.length + 
           filters.verificationStatus.length + 
           filters.agentTypes.length;
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Filter Audit Logs</h2>
        <div className="flex items-center space-x-3">
          {getActiveFilterCount() > 0 && (
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {getActiveFilterCount()} filter(s) active
            </span>
          )}
          <button
            onClick={clearFilters}
            className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors`}
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Date Range
          </label>
          <div className="space-y-2">
            <div>
              <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                From
              </label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
            <div>
              <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                To
              </label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>
        </div>

        {/* Event Types */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Event Types
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {eventTypes.map((eventType) => (
              <label key={eventType.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.eventTypes.includes(eventType.value)}
                  onChange={(e) => handleMultiSelectChange('eventTypes', eventType.value, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">
                  {eventType.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Verification Status */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Verification Status
          </label>
          <div className="space-y-2">
            {verificationStatuses.map((status) => (
              <label key={status.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.verificationStatus.includes(status.value)}
                  onChange={(e) => handleMultiSelectChange('verificationStatus', status.value, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm flex items-center">
                  {status.label}
                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    status.value === 'verified' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : status.value === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {status.value === 'verified' ? '✓' : status.value === 'pending' ? '⏳' : '✗'}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Agent Types */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Agent Types
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {agentTypes.map((agentType) => (
              <label key={agentType.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.agentTypes.includes(agentType.value)}
                  onChange={(e) => handleMultiSelectChange('agentTypes', agentType.value, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">
                  {agentType.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Filter Presets */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium mb-3">
          Quick Filters
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { 
              label: 'Policy Violations', 
              filters: { eventTypes: ['policy_violation'], verificationStatus: [], agentTypes: [] }
            },
            { 
              label: 'Failed Verifications', 
              filters: { eventTypes: [], verificationStatus: ['failed'], agentTypes: [] }
            },
            { 
              label: 'Financial Agents', 
              filters: { eventTypes: [], verificationStatus: [], agentTypes: ['financial_agent'] }
            },
            { 
              label: 'Recent Activity', 
              filters: { 
                eventTypes: ['user_interaction', 'data_access'], 
                verificationStatus: [], 
                agentTypes: [] 
              }
            }
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => onFiltersChange({
                ...filters,
                ...preset.filters
              })}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

