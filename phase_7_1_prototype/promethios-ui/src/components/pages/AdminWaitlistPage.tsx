import React from 'react';
import { getWaitlistEntries, approveAndInviteUser } from '../../services/invitationService';
import { WaitlistEntry } from '../../supabase/config';

const AdminWaitlistPage: React.FC = () => {
  const [entries, setEntries] = React.useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionStatus, setActionStatus] = React.useState<{id: string, message: string, isError: boolean} | null>(null);

  // Fetch waitlist entries on component mount
  React.useEffect(() => {
    fetchWaitlistEntries();
  }, []);

  // Fetch all waitlist entries
  const fetchWaitlistEntries = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getWaitlistEntries();
      
      if (result.success && result.data) {
        setEntries(result.data);
      } else {
        throw new Error('Failed to fetch waitlist entries');
      }
    } catch (err: any) {
      console.error('Error fetching waitlist entries:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Approve and invite a user
  const handleApproveAndInvite = async (entry: WaitlistEntry) => {
    try {
      setActionStatus({
        id: entry.id || '',
        message: `Approving and inviting ${entry.email}...`,
        isError: false
      });
      
      const result = await approveAndInviteUser(entry);
      
      if (result.success) {
        setActionStatus({
          id: entry.id || '',
          message: result.message || 'User approved and invited successfully',
          isError: false
        });
        
        // Refresh the list
        fetchWaitlistEntries();
      } else {
        throw new Error(result.error || 'Failed to approve and invite user');
      }
    } catch (err: any) {
      console.error('Error approving and inviting user:', err);
      setActionStatus({
        id: entry.id || '',
        message: err.message || 'An unexpected error occurred',
        isError: true
      });
    }
    
    // Clear status after 5 seconds
    setTimeout(() => {
      setActionStatus(null);
    }, 5000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Waitlist Management</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Waitlist Entries</h2>
        <button
          onClick={fetchWaitlistEntries}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
        >
          Refresh
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading waitlist entries...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No waitlist entries found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Email</th>
                <th className="py-2 px-4 border-b text-left">Company</th>
                <th className="py-2 px-4 border-b text-left">Reason</th>
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{entry.name}</td>
                  <td className="py-2 px-4 border-b">{entry.email}</td>
                  <td className="py-2 px-4 border-b">{entry.company || '-'}</td>
                  <td className="py-2 px-4 border-b">
                    <div className="max-w-xs truncate" title={entry.reason}>
                      {entry.reason || '-'}
                    </div>
                  </td>
                  <td className="py-2 px-4 border-b">
                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {entry.approved && entry.invited ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Invited
                      </span>
                    ) : entry.approved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {!entry.approved || !entry.invited ? (
                      <button
                        onClick={() => handleApproveAndInvite(entry)}
                        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                        disabled={actionStatus?.id === entry.id}
                      >
                        {actionStatus?.id === entry.id ? 'Processing...' : 'Approve & Invite'}
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">Already invited</span>
                    )}
                    
                    {actionStatus?.id === entry.id && (
                      <div className={`mt-1 text-xs ${actionStatus.isError ? 'text-red-600' : 'text-green-600'}`}>
                        {actionStatus.message}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminWaitlistPage;
