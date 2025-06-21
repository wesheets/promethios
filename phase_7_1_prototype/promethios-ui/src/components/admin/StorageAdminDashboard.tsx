import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Server, 
  HardDrive, 
  Cloud, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  Settings,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { unifiedStorage } from '../../services/UnifiedStorageService';

interface ProviderStatus {
  name: string;
  available: boolean;
  healthy: boolean;
  lastError?: string;
  metrics: {
    totalKeys: number;
    storageUsed: number;
    storageAvailable: number;
  };
}

interface NamespaceInfo {
  namespace: string;
  keyCount: number;
  estimatedSize: number;
  lastAccessed?: number;
}

interface ComponentInfo {
  component: string;
  namespace: string;
  status: 'integrated' | 'legacy' | 'migrating';
  provider: string;
  lastAccessed?: number;
}

const StorageAdminDashboard: React.FC = () => {
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [namespaceInfos, setNamespaceInfos] = useState<NamespaceInfo[]>([]);
  const [componentInfos, setComponentInfos] = useState<ComponentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'namespaces' | 'components'>('overview');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [providers, namespaces, components] = await Promise.all([
        unifiedStorage.getProviderStatuses(),
        unifiedStorage.getNamespaceInfos(),
        unifiedStorage.getIntegratedComponents()
      ]);
      
      setProviderStatuses(providers);
      setNamespaceInfos(namespaces);
      setComponentInfos(components);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading storage admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getProviderIcon = (providerName: string) => {
    switch (providerName) {
      case 'firebase': return <Cloud className="w-5 h-5" />;
      case 'localStorage': return <HardDrive className="w-5 h-5" />;
      case 'memory': return <Server className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: 'integrated' | 'legacy' | 'migrating') => {
    switch (status) {
      case 'integrated': return 'text-green-600 bg-green-100';
      case 'legacy': return 'text-red-600 bg-red-100';
      case 'migrating': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const totalKeys = providerStatuses.reduce((sum, p) => sum + p.metrics.totalKeys, 0);
  const totalStorageUsed = providerStatuses.reduce((sum, p) => sum + p.metrics.storageUsed, 0);
  const healthyProviders = providerStatuses.filter(p => p.healthy).length;
  const integratedComponents = componentInfos.filter(c => c.status === 'integrated').length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Storage System Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor unified storage system health and component integration</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Keys</p>
                <p className="text-2xl font-bold text-gray-900">{totalKeys.toLocaleString()}</p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">{formatBytes(totalStorageUsed)}</p>
              </div>
              <HardDrive className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Healthy Providers</p>
                <p className="text-2xl font-bold text-gray-900">{healthyProviders}/{providerStatuses.length}</p>
              </div>
              <Activity className="w-8 h-8 text-emerald-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Integrated Components</p>
                <p className="text-2xl font-bold text-gray-900">{integratedComponents}/{componentInfos.length}</p>
              </div>
              <Settings className="w-8 h-8 text-purple-600" />
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'providers', label: 'Storage Providers', icon: Server },
                { id: 'namespaces', label: 'Namespaces', icon: Database },
                { id: 'components', label: 'Components', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Provider Health */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Provider Status</h4>
                      <div className="space-y-2">
                        {providerStatuses.map(provider => (
                          <div key={provider.name} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getProviderIcon(provider.name)}
                              <span className="font-medium">{provider.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {provider.healthy ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                              )}
                              <span className={`text-sm ${provider.healthy ? 'text-green-600' : 'text-red-600'}`}>
                                {provider.healthy ? 'Healthy' : 'Error'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Component Integration */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Integration Progress</h4>
                      <div className="space-y-2">
                        {['integrated', 'migrating', 'legacy'].map(status => {
                          const count = componentInfos.filter(c => c.status === status).length;
                          const percentage = componentInfos.length > 0 ? (count / componentInfos.length) * 100 : 0;
                          return (
                            <div key={status} className="flex items-center justify-between">
                              <span className="capitalize font-medium">{status}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      status === 'integrated' ? 'bg-green-600' :
                                      status === 'migrating' ? 'bg-yellow-600' : 'bg-red-600'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-600">{count}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'providers' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Storage Providers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {providerStatuses.map(provider => (
                    <motion.div
                      key={provider.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white border rounded-lg p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getProviderIcon(provider.name)}
                          <h4 className="font-semibold text-gray-900 capitalize">{provider.name}</h4>
                        </div>
                        {provider.healthy ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Keys</span>
                          <span className="text-sm font-medium">{provider.metrics.totalKeys.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Used</span>
                          <span className="text-sm font-medium">{formatBytes(provider.metrics.storageUsed)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Available</span>
                          <span className="text-sm font-medium">{formatBytes(provider.metrics.storageAvailable)}</span>
                        </div>
                        
                        {provider.lastError && (
                          <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-600">
                            {provider.lastError}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'namespaces' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Storage Namespaces</h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Namespace
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Keys
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Accessed
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {namespaceInfos.map(namespace => (
                        <tr key={namespace.namespace} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Database className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">{namespace.namespace}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {namespace.keyCount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatBytes(namespace.estimatedSize)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatTimeAgo(namespace.lastAccessed)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'components' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Component Integration Status</h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
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
                          Provider
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Accessed
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {componentInfos.map((component, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Settings className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">{component.component}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {component.namespace}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(component.status)}`}>
                              {component.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getProviderIcon(component.provider)}
                              <span className="ml-2 text-sm text-gray-900">{component.provider}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatTimeAgo(component.lastAccessed)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageAdminDashboard;

