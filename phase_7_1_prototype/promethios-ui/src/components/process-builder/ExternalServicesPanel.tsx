import React, { useState, useEffect } from 'react';
import {
  Link,
  Database,
  Webhook,
  Key,
  Globe,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Refresh,
  Play,
  Pause,
  Activity,
  BarChart3,
  Clock,
  Shield,
  Zap,
  Mail,
  MessageSquare,
  CreditCard,
  FileText,
  Image,
  Video,
  Music,
  Search,
  Map,
  Calendar,
  Users,
  Bell,
  Lock,
  Unlock,
  Star,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface ExternalService {
  id: string;
  name: string;
  category: string;
  provider: string;
  description: string;
  icon: string;
  features: string[];
  pricing: {
    free: boolean;
    startingPrice: string;
    unit: string;
  };
  authType: 'api_key' | 'oauth' | 'basic' | 'bearer';
  endpoints: string[];
  rateLimit: {
    requests: number;
    window: string;
  };
  status: 'available' | 'connected' | 'error';
}

interface ServiceConnection {
  serviceId: string;
  credentials: Record<string, string>;
  config: Record<string, any>;
  webhooks: string[];
  lastSync: string;
  status: 'active' | 'inactive' | 'error';
  usageStats: {
    requests: number;
    errors: number;
    lastRequest: string;
  };
}

interface ExternalServicesPanelProps {
  onConnectionChange: (connections: ServiceConnection[]) => void;
  initialConnections?: ServiceConnection[];
}

export const ExternalServicesPanel: React.FC<ExternalServicesPanelProps> = ({
  onConnectionChange,
  initialConnections = []
}) => {
  const [connections, setConnections] = useState<ServiceConnection[]>(initialConnections);
  const [activeTab, setActiveTab] = useState<'services' | 'connections' | 'webhooks' | 'monitoring'>('services');
  const [selectedService, setSelectedService] = useState<ExternalService | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const externalServices: ExternalService[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      category: 'AI/ML',
      provider: 'OpenAI Inc.',
      description: 'Advanced AI models for text generation, analysis, and completion',
      icon: '🤖',
      features: ['GPT Models', 'Embeddings', 'Fine-tuning', 'Moderation'],
      pricing: { free: false, startingPrice: '$0.002', unit: '/1K tokens' },
      authType: 'api_key',
      endpoints: ['chat/completions', 'embeddings', 'moderations'],
      rateLimit: { requests: 3500, window: 'minute' },
      status: 'available'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      category: 'Payments',
      provider: 'Stripe Inc.',
      description: 'Payment processing and subscription management',
      icon: '💳',
      features: ['Payment Processing', 'Subscriptions', 'Invoicing', 'Analytics'],
      pricing: { free: true, startingPrice: '2.9%', unit: '+ 30¢ per transaction' },
      authType: 'api_key',
      endpoints: ['charges', 'customers', 'subscriptions', 'invoices'],
      rateLimit: { requests: 100, window: 'second' },
      status: 'available'
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      category: 'Communication',
      provider: 'Twilio Inc.',
      description: 'Email delivery and marketing automation platform',
      icon: '📧',
      features: ['Email API', 'Templates', 'Analytics', 'Marketing Campaigns'],
      pricing: { free: true, startingPrice: '$14.95', unit: '/month' },
      authType: 'api_key',
      endpoints: ['mail/send', 'templates', 'stats', 'campaigns'],
      rateLimit: { requests: 600, window: 'minute' },
      status: 'available'
    },
    {
      id: 'slack',
      name: 'Slack',
      category: 'Communication',
      provider: 'Slack Technologies',
      description: 'Team communication and collaboration platform',
      icon: '💬',
      features: ['Messaging', 'Channels', 'Bots', 'Webhooks'],
      pricing: { free: true, startingPrice: '$6.67', unit: '/user/month' },
      authType: 'oauth',
      endpoints: ['chat.postMessage', 'channels.list', 'users.list'],
      rateLimit: { requests: 1, window: 'second' },
      status: 'available'
    },
    {
      id: 'google-maps',
      name: 'Google Maps',
      category: 'Location',
      provider: 'Google LLC',
      description: 'Maps, geocoding, and location services',
      icon: '🗺️',
      features: ['Geocoding', 'Places API', 'Directions', 'Street View'],
      pricing: { free: true, startingPrice: '$5', unit: '/1K requests' },
      authType: 'api_key',
      endpoints: ['geocode', 'places', 'directions', 'streetview'],
      rateLimit: { requests: 50, window: 'second' },
      status: 'available'
    },
    {
      id: 'aws-s3',
      name: 'AWS S3',
      category: 'Storage',
      provider: 'Amazon Web Services',
      description: 'Object storage and content delivery',
      icon: '☁️',
      features: ['Object Storage', 'CDN', 'Backup', 'Static Hosting'],
      pricing: { free: true, startingPrice: '$0.023', unit: '/GB/month' },
      authType: 'api_key',
      endpoints: ['objects', 'buckets', 'presigned-urls'],
      rateLimit: { requests: 3500, window: 'second' },
      status: 'available'
    },
    {
      id: 'twilio',
      name: 'Twilio',
      category: 'Communication',
      provider: 'Twilio Inc.',
      description: 'SMS, voice, and video communication APIs',
      icon: '📱',
      features: ['SMS', 'Voice Calls', 'Video', 'WhatsApp'],
      pricing: { free: true, startingPrice: '$0.0075', unit: '/SMS' },
      authType: 'basic',
      endpoints: ['messages', 'calls', 'video', 'whatsapp'],
      rateLimit: { requests: 1, window: 'second' },
      status: 'available'
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      category: 'CRM',
      provider: 'HubSpot Inc.',
      description: 'Customer relationship management and marketing automation',
      icon: '🎯',
      features: ['CRM', 'Marketing Automation', 'Analytics', 'Lead Scoring'],
      pricing: { free: true, startingPrice: '$45', unit: '/month' },
      authType: 'oauth',
      endpoints: ['contacts', 'companies', 'deals', 'emails'],
      rateLimit: { requests: 100, window: '10 seconds' },
      status: 'available'
    }
  ];

  useEffect(() => {
    onConnectionChange(connections);
  }, [connections, onConnectionChange]);

  const handleConnectService = (service: ExternalService) => {
    setSelectedService(service);
    setShowCredentialsModal(true);
  };

  const handleSaveConnection = async (credentials: Record<string, string>) => {
    if (!selectedService) return;

    setLoading(true);
    try {
      // Simulate API connection test
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newConnection: ServiceConnection = {
        serviceId: selectedService.id,
        credentials,
        config: {},
        webhooks: [],
        lastSync: new Date().toISOString(),
        status: 'active',
        usageStats: {
          requests: 0,
          errors: 0,
          lastRequest: new Date().toISOString()
        }
      };

      setConnections(prev => [...prev, newConnection]);
      setShowCredentialsModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Failed to connect service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectService = (serviceId: string) => {
    setConnections(prev => prev.filter(conn => conn.serviceId !== serviceId));
  };

  const getServiceById = (id: string) => externalServices.find(s => s.id === id);

  const renderServicesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Available Services</h3>
        <p className="text-gray-400 text-sm">Connect external services to enhance your application</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {externalServices.map((service) => {
          const isConnected = connections.some(conn => conn.serviceId === service.id);
          
          return (
            <div
              key={service.id}
              className={`p-4 border rounded-lg transition-all hover:scale-105 ${
                isConnected
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{service.icon}</span>
                  <div>
                    <h4 className="text-white font-medium">{service.name}</h4>
                    <p className="text-gray-400 text-xs">{service.provider}</p>
                  </div>
                </div>
                <div className="text-right">
                  {service.pricing.free && (
                    <span className="px-2 py-1 bg-green-600 text-xs rounded text-white">FREE</span>
                  )}
                  <div className="text-gray-400 text-xs mt-1">
                    from {service.pricing.startingPrice}{service.pricing.unit}
                  </div>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-3">{service.description}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Zap className="w-3 h-3" />
                  {service.rateLimit.requests} req/{service.rateLimit.window}
                </div>
                <div className="flex flex-wrap gap-1">
                  {service.features.slice(0, 3).map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-600 text-xs rounded text-gray-300">
                      {feature}
                    </span>
                  ))}
                  {service.features.length > 3 && (
                    <span className="px-2 py-1 bg-gray-600 text-xs rounded text-gray-300">
                      +{service.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`px-2 py-1 text-xs rounded ${
                  isConnected
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {isConnected ? 'Connected' : 'Available'}
                </span>
                
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnectService(service.id)}
                    className="px-3 py-1 text-red-400 hover:text-red-300 text-sm"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnectService(service)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderConnectionsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Active Connections</h3>
        <p className="text-gray-400 text-sm">Manage your connected external services</p>
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-12">
          <Link className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-white font-medium mb-2">No connections yet</h4>
          <p className="text-gray-400 text-sm mb-4">Connect external services to get started</p>
          <button
            onClick={() => setActiveTab('services')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Browse Services
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => {
            const service = getServiceById(connection.serviceId);
            if (!service) return null;

            return (
              <div key={connection.serviceId} className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{service.icon}</span>
                    <div>
                      <h4 className="text-white font-medium">{service.name}</h4>
                      <p className="text-gray-400 text-sm">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      connection.status === 'active'
                        ? 'bg-green-600 text-white'
                        : connection.status === 'error'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {connection.status}
                    </span>
                    <button
                      onClick={() => handleDisconnectService(connection.serviceId)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-600 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      <span className="text-white text-sm font-medium">Requests</span>
                    </div>
                    <div className="text-gray-300 text-lg font-bold">{connection.usageStats.requests}</div>
                    <div className="text-gray-400 text-xs">Total requests</div>
                  </div>

                  <div className="p-3 bg-gray-600 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-white text-sm font-medium">Errors</span>
                    </div>
                    <div className="text-gray-300 text-lg font-bold">{connection.usageStats.errors}</div>
                    <div className="text-gray-400 text-xs">Error count</div>
                  </div>

                  <div className="p-3 bg-gray-600 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-green-400" />
                      <span className="text-white text-sm font-medium">Last Used</span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      {new Date(connection.usageStats.lastRequest).toLocaleDateString()}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(connection.usageStats.lastRequest).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    Test Connection
                  </button>
                  <button className="px-3 py-1 bg-gray-600 text-gray-300 rounded text-sm hover:bg-gray-500">
                    View Logs
                  </button>
                  <button className="px-3 py-1 bg-gray-600 text-gray-300 rounded text-sm hover:bg-gray-500">
                    Configure
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderWebhooksTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Webhook Management</h3>
          <p className="text-gray-400 text-sm">Configure webhooks for real-time updates</p>
        </div>
        <button
          onClick={() => setShowWebhookModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Payment Events</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-600 text-xs rounded text-white">Active</span>
              <button className="text-gray-400 hover:text-white">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">URL:</span>
              <span className="text-gray-400 font-mono">https://api.myapp.com/webhooks/stripe</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Events:</span>
              <span className="text-gray-400">payment_intent.succeeded, customer.created</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Last Triggered:</span>
              <span className="text-gray-400">2 hours ago</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">Slack Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-600 text-xs rounded text-white">Active</span>
              <button className="text-gray-400 hover:text-white">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">URL:</span>
              <span className="text-gray-400 font-mono">https://hooks.slack.com/services/...</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Events:</span>
              <span className="text-gray-400">deployment.success, error.critical</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Last Triggered:</span>
              <span className="text-gray-400">5 minutes ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonitoringTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Service Monitoring</h3>
        <p className="text-gray-400 text-sm">Monitor external service usage and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-700 rounded-lg text-center">
          <Activity className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-white font-medium">Uptime</div>
          <div className="text-2xl font-bold text-green-400">99.9%</div>
          <div className="text-gray-400 text-sm">Last 30 days</div>
        </div>

        <div className="p-4 bg-gray-700 rounded-lg text-center">
          <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-white font-medium">Requests</div>
          <div className="text-2xl font-bold text-blue-400">12.4K</div>
          <div className="text-gray-400 text-sm">This month</div>
        </div>

        <div className="p-4 bg-gray-700 rounded-lg text-center">
          <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <div className="text-white font-medium">Avg Response</div>
          <div className="text-2xl font-bold text-yellow-400">245ms</div>
          <div className="text-gray-400 text-sm">Response time</div>
        </div>

        <div className="p-4 bg-gray-700 rounded-lg text-center">
          <DollarSign className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <div className="text-white font-medium">Cost</div>
          <div className="text-2xl font-bold text-purple-400">$47.32</div>
          <div className="text-gray-400 text-sm">This month</div>
        </div>
      </div>

      <div className="p-4 bg-gray-700 rounded-lg">
        <h4 className="text-white font-medium mb-4">Service Health Status</h4>
        <div className="space-y-3">
          {connections.map((connection) => {
            const service = getServiceById(connection.serviceId);
            if (!service) return null;

            return (
              <div key={connection.serviceId} className="flex items-center justify-between p-3 bg-gray-600 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{service.icon}</span>
                  <div>
                    <div className="text-white font-medium">{service.name}</div>
                    <div className="text-gray-400 text-sm">Last check: 2 minutes ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-sm">Healthy</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link className="w-6 h-6 text-white" />
        <h2 className="text-xl font-semibold text-white">External Services</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-600 mb-6 overflow-x-auto">
        {[
          { id: 'services', label: 'Services', icon: Globe },
          { id: 'connections', label: 'Connections', icon: Link },
          { id: 'webhooks', label: 'Webhooks', icon: Webhook },
          { id: 'monitoring', label: 'Monitoring', icon: Activity }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'services' && renderServicesTab()}
        {activeTab === 'connections' && renderConnectionsTab()}
        {activeTab === 'webhooks' && renderWebhooksTab()}
        {activeTab === 'monitoring' && renderMonitoringTab()}
      </div>

      {/* Credentials Modal */}
      {showCredentialsModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Connect to {selectedService.name}</h3>
              <button
                onClick={() => setShowCredentialsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  {selectedService.authType === 'api_key' ? 'API Key' : 
                   selectedService.authType === 'oauth' ? 'OAuth Token' : 
                   selectedService.authType === 'basic' ? 'Username' : 'Bearer Token'}
                </label>
                <input
                  type="password"
                  placeholder={`Enter your ${selectedService.name} ${selectedService.authType === 'api_key' ? 'API key' : 'credentials'}`}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {selectedService.authType === 'basic' && (
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCredentialsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveConnection({ api_key: 'test_key' })}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Add Webhook</h3>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://api.myapp.com/webhooks/..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Events</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                  <option>Select events to listen for</option>
                  <option>payment.success</option>
                  <option>user.created</option>
                  <option>deployment.complete</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowWebhookModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowWebhookModal(false)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add Webhook
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalServicesPanel;

