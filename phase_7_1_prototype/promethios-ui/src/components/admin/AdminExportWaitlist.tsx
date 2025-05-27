import React, { useState } from 'react';
import { exportWaitlistAsCSV } from '../../firebase/waitlistService';

const AdminExportWaitlist: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportWaitlist = async () => {
    setIsExporting(true);
    setExportError('');
    setExportSuccess(false);
    
    try {
      const csv = await exportWaitlistAsCSV();
      
      // Create a blob and download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `promethios-waitlist-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setExportSuccess(true);
    } catch (error) {
      console.error('Error exporting waitlist:', error);
      setExportError('Failed to export waitlist. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          Export Waitlist
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
          <p>
            Download a CSV file containing all waitlist entries. This includes email addresses, roles, and submission dates.
          </p>
        </div>
        
        {exportError && (
          <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/30 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{exportError}</h3>
              </div>
            </div>
          </div>
        )}
        
        {exportSuccess && (
          <div className="mt-4 rounded-md bg-green-50 dark:bg-green-900/30 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Waitlist exported successfully!
                </h3>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-5">
          <button
            type="button"
            onClick={handleExportWaitlist}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export Waitlist'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminExportWaitlist;
