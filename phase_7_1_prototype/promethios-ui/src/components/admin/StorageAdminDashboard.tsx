import React, { useState, useEffect } from 'react';
import { useStorage } from '../../context/StorageContext';
import { storageManifestService } from '../../services/StorageManifestService';

interface StorageMetrics {
  totalKeys: number;
  totalSize: number;
  providerHealth: Record<string, 'healthy' | 'degraded' | 'failed'>;
  namespaceUsage: Record<string, { keys: number; size: number }>;
  lastSync: Record<string, number>;
  errors: string[];
}

export const StorageAdminDashboard: React.FC = () => {
  const { storage } = useStorage();
  const [metrics, setMetrics] = useState<StorageMetrics>({
    totalKeys: 0,
    totalSize: 0,
    providerHealth: {},
    namespaceUsage: {},
    lastSync: {},
    errors: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');

  // Get manifest data
  const manifest = storageManifestService.getManifest();
  const summary = storageManifestService.getSummary();
  const recommendations = storageManifestService.getRecommendations();
  const namespaces = storageManifestService.getNamespaces();

  useEffect(() => {
    const loadMetrics = async () => {
      if (!storage) return;

      try {
        setLoading(true);
        
        // Simulate metrics collection
        const mockMetrics: StorageMetrics = {
          totalKeys: 156,
          totalSize: 2.4 * 1024 * 1024, // 2.4 MB
          providerHealth: {
            localStorage: 'healthy',
            memory: 'healthy',
            firebase: 'degraded' // Simulating Firebase issues
          },
          namespaceUsage: {
            user: { keys: 12, size: 45000 },
            observer: { keys: 89, size: 1200000 },
            notifications: { keys: 23, size: 67000 },
            preferences: { keys: 8, size: 12000 },
            agents: { keys: 15, size: 890000 },
            governance: { keys: 6, size: 234000 },
            ui: { keys: 3, size: 5000 },
            cache: { keys: 0, size: 0 }
          },
          lastSync: {
            user: Date.now() - 300000, // 5 minutes ago
            observer: Date.now() - 60000, // 1 minute ago
            notifications: Date.now() - 1800000, // 30 minutes ago
            agents: Date.now() - 900000, // 15 minutes ago
            governance: Date.now() - 120000 // 2 minutes ago
          },
          errors: [
            'Firebase connection timeout for user namespace',
            'Sync conflict detected in observer.preferences',
            'Storage quota warning: 85% used'
          ]
        };

        setMetrics(mockMetrics);
      } catch (error) {
        console.error('Failed to load storage metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [storage]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    return `${minutes}m ago`;
  };

  const getHealthColor = (health: string): string => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Storage Admin Dashboard</h1>
        <p className="text-gray-600">Monitor and manage the unified storage system with manifest-driven configuration</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Namespaces</h3>
          <p className="text-3xl font-bold text-gray-900">{summary.totalNamespaces}</p>
          <p className="text-sm text-gray-600 mt-1">
            {summary.migrationProgress.completed} migrated ({summary.migrationProgress.percentage}%)
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Storage Usage</h3>
          <p className="text-3xl font-bold text-gray-900">{formatBytes(metrics.totalSize)}</p>
          <p className="text-sm text-gray-600 mt-1">{metrics.totalKeys} total keys</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Encrypted Namespaces</h3>
          <p className="text-3xl font-bold text-gray-900">{summary.encryptedNamespaces}</p>
          <p className="text-sm text-gray-600 mt-1">
            {Math.round((summary.encryptedNamespaces / summary.totalNamespaces) * 100)}% encrypted
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Compliance</h3>
          <p className="text-3xl font-bold text-gray-900">{summary.complianceNamespaces}</p>
          <p className="text-sm text-gray-600 mt-1">require compliance</p>
        </div>
      </div>

      {/* Provider Health */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Provider Health</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(metrics.providerHealth).map(([provider, health]) => (
              <div key={provider} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 capitalize">{provider}</h3>
                  <p className="text-sm text-gray-600">
                    {summary.providerUsage[provider] || 0} namespaces
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(health)}`}>
                  {health}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Manifest-Based Recommendations</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                    {rec.priority}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{rec.namespace}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.message}</p>
                    <span className="text-xs text-gray-500 capitalize">{rec.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Namespace Details */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Namespace Details</h2>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Namespaces</option>
              {namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Namespace
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Components
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {namespaces
                  .filter(ns => selectedNamespace === 'all' || ns === selectedNamespace)
                  .map(namespace => {
                    const config = storageManifestService.getNamespaceConfig(namespace);
                    const usage = metrics.namespaceUsage[namespace] || { keys: 0, size: 0 };
                    const components = storageManifestService.getComponentsForNamespace(namespace);
                    
                    return (
                      <tr key={namespace}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{namespace}</div>
                            <div className="text-sm text-gray-500">{config?.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{config?.provider}</div>
                          {config?.fallback && (
                            <div className="text-sm text-gray-500">fallback: {config.fallback}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatBytes(usage.size)}</div>
                          <div className="text-sm text-gray-500">{usage.keys} keys</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{components.length} components</div>
                          <div className="text-sm text-gray-500">
                            {components.slice(0, 2).join(', ')}
                            {components.length > 2 && '...'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {config?.encrypted && (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                Encrypted
                              </span>
                            )}
                            {config?.complianceRequired && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                Compliance
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              config?.criticalityLevel === 'critical' ? 'bg-red-100 text-red-800' :
                              config?.criticalityLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                              config?.criticalityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {config?.criticalityLevel}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manifest Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-4">📋 Storage Manifest Registry</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-blue-700"><strong>Version:</strong> {manifest.version}</p>
            <p className="text-blue-700"><strong>Last Updated:</strong> {new Date(manifest.lastUpdated).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-blue-700"><strong>🗂 System of Truth:</strong> All namespace configurations centralized</p>
            <p className="text-blue-700"><strong>🔒 Policy Mapping:</strong> Direct schema-to-policy enforcement</p>
          </div>
          <div>
            <p className="text-blue-700"><strong>📉 Analytics Ready:</strong> Growth and expiration tracking</p>
            <p className="text-blue-700"><strong>🔍 Observability:</strong> Component-to-namespace mapping</p>
          </div>
        </div>
      </div>

      {/* Errors */}
      {metrics.errors.length > 0 && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-4">Recent Errors</h3>
          <ul className="space-y-2">
            {metrics.errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

