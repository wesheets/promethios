import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  HardDrive, 
  Cloud, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Settings,
  BarChart3,
  Shield,
  Clock,
  Users,
  Activity
} from 'lucide-react';
import { useStorageHealth, useStorageNamespace } from '../../hooks/useStorageHooks';
import { useStorage } from '../../context/StorageContext';

interface StorageMetrics {
  totalKeys: number;
  totalSize: number;
  namespaceBreakdown: Record<string, { keys: number; size: number }>;
  providerUsage: Record<string, { usage: number; quota?: number }>;
}

interface ComponentIntegrationStatus {
  component: string;
  namespace: string;
  integrated: boolean;
  lastAccess?: string;
  errorCount: number;
}

export const StorageAdminDashboard: React.FC = () => {
  const { storage, isHydrated } = useStorage();
  const { health, info, refresh, isRefreshing } = useStorageHealth();
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<ComponentIntegrationStatus[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('user');
  const [showPolicyDetails, setShowPolicyDetails] = useState(false);

  // Mock component integration data (in real implementation, this would come from the storage system)
  const mockIntegrationStatus: ComponentIntegrationStatus[] = [
    { component: 'AuthContext', namespace: 'user', integrated: true, lastAccess: '2 minutes ago', errorCount: 0 },
    { component: 'NotificationService', namespace: 'notifications', integrated: true, lastAccess: '30 seconds ago', errorCount: 0 },
    { component: 'ObserverAgent', namespace: 'observer', integrated: false, lastAccess: 'Never', errorCount: 3 },
    { component: 'ThemeProvider', namespace: 'preferences', integrated: true, lastAccess: '5 minutes ago', errorCount: 0 },
    { component: 'AgentManager', namespace: 'agents', integrated: false, lastAccess: 'Never', errorCount: 0 },
    { component: 'GovernanceEngine', namespace: 'governance', integrated: false, lastAccess: 'Never', errorCount: 0 },
    { component: 'DashboardState', namespace: 'ui', integrated: true, lastAccess: '1 minute ago', errorCount: 1 },
  ];

  useEffect(() => {
    setIntegrationStatus(mockIntegrationStatus);
    calculateMetrics();
  }, [info]);

  const calculateMetrics = () => {
    if (!info) return;

    const totalUsage = Object.values(info).reduce((sum, provider: any) => {
      return sum + (provider.usage || 0);
    }, 0);

    // Mock namespace breakdown (in real implementation, this would be calculated from actual data)
    const namespaceBreakdown = {
      user: { keys: 15, size: 2048 },
      notifications: { keys: 42, size: 8192 },
      preferences: { keys: 8, size: 512 },
      observer: { keys: 0, size: 0 },
      agents: { keys: 0, size: 0 },
      governance: { keys: 0, size: 0 },
      ui: { keys: 23, size: 1024 },
      cache: { keys: 156, size: 16384 }
    };

    const totalKeys = Object.values(namespaceBreakdown).reduce((sum, ns) => sum + ns.keys, 0);

    const providerUsage = Object.entries(info).reduce((acc, [name, provider]: [string, any]) => {
      acc[name] = {
        usage: provider.usage || 0,
        quota: provider.quota
      };
      return acc;
    }, {} as Record<string, { usage: number; quota?: number }>);

    setMetrics({
      totalKeys,
      totalSize: totalUsage,
      namespaceBreakdown,
      providerUsage
    });
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'firebase': return <Cloud className="w-4 h-4" />;
      case 'localStorage': return <HardDrive className="w-4 h-4" />;
      case 'memory': return <Server className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getHealthIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIntegrationProgress = () => {
    const integrated = integrationStatus.filter(s => s.integrated).length;
    const total = integrationStatus.length;
    return { integrated, total, percentage: Math.round((integrated / total) * 100) };
  };

  const progress = getIntegrationProgress();

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading storage system...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Storage Administration</h1>
          <p className="text-gray-600">Monitor and manage the unified storage system</p>
        </div>
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Storage Keys</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalKeys || 0}</p>
            </div>
            <Database className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Storage Usage</p>
              <p className="text-2xl font-bold text-gray-900">{formatBytes(metrics?.totalSize || 0)}</p>
            </div>
            <HardDrive className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Integration Progress</p>
              <p className="text-2xl font-bold text-gray-900">{progress.percentage}%</p>
              <p className="text-xs text-gray-500">{progress.integrated}/{progress.total} components</p>
            </div>
            <Activity className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Provider Health</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(health).filter(Boolean).length}/{Object.keys(health).length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Provider Status */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Storage Provider Status</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(health).map(([provider, isHealthy]) => {
              const providerInfo = info[provider];
              return (
                <div key={provider} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getProviderIcon(provider)}
                      <span className="font-medium capitalize">{provider}</span>
                    </div>
                    {getHealthIcon(isHealthy)}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Status: {isHealthy ? 'Online' : 'Offline'}</div>
                    {providerInfo?.usage && (
                      <div>Usage: {formatBytes(providerInfo.usage)}</div>
                    )}
                    {providerInfo?.quota && (
                      <div>Quota: {formatBytes(providerInfo.quota)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Component Integration Status */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Component Integration Status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Component
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Namespace
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Access
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Errors
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {integrationStatus.map((status, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {status.component}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {status.namespace}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {status.integrated ? (
                      <span className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Integrated</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Not Integrated</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{status.lastAccess}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {status.errorCount > 0 ? (
                      <span className="flex items-center space-x-1 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{status.errorCount}</span>
                      </span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Namespace Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Storage by Namespace</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics?.namespaceBreakdown && Object.entries(metrics.namespaceBreakdown).map(([namespace, data]) => (
              <div key={namespace} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{namespace}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {data.keys} keys
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Size: {formatBytes(data.size)}
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((data.size / (metrics.totalSize || 1)) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Storage Policies */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Storage Policies</h2>
          <button
            onClick={() => setShowPolicyDetails(!showPolicyDetails)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showPolicyDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        {showPolicyDetails && (
          <div className="p-6">
            <div className="space-y-4">
              {['user', 'observer', 'notifications', 'governance'].map(namespace => (
                <div key={namespace} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2 capitalize">{namespace} Namespace</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Provider:</span>
                      <span className="ml-2 text-gray-600">
                        {namespace === 'user' || namespace === 'observer' || namespace === 'governance' ? 'Firebase' : 'localStorage'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Encryption:</span>
                      <span className="ml-2 text-gray-600">
                        {namespace === 'governance' ? 'Both' : 'At-rest'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Sync:</span>
                      <span className="ml-2 text-gray-600">
                        {namespace === 'notifications' ? 'Batched' : 'Immediate'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

