import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Server,
  Globe,
  Monitor,
  Settings,
  Zap,
  Shield,
  TrendingUp,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Eye,
  Refresh,
  Play,
  Pause,
  BarChart3,
  Activity,
  Database,
  Cpu,
  HardDrive,
  Network,
  Lock,
  Key,
  Timer,
  MapPin
} from 'lucide-react';

interface CloudPlatform {
  id: string;
  name: string;
  provider: string;
  icon: string;
  description: string;
  features: string[];
  pricing: {
    free: boolean;
    startingPrice: string;
    unit: string;
  };
  regions: string[];
  supportedFrameworks: string[];
  deploymentTime: string;
  scalingOptions: string[];
}

interface DeploymentConfig {
  platform: CloudPlatform | null;
  region: string;
  environment: 'development' | 'staging' | 'production';
  domain: string;
  customDomain: string;
  ssl: boolean;
  environmentVariables: Record<string, string>;
  scaling: {
    auto: boolean;
    minInstances: number;
    maxInstances: number;
    targetCPU: number;
  };
  monitoring: {
    enabled: boolean;
    alerts: boolean;
    logRetention: number;
  };
  security: {
    authentication: boolean;
    rateLimiting: boolean;
    cors: boolean;
  };
}

interface CloudDeploymentPanelProps {
  onConfigChange: (config: DeploymentConfig) => void;
  initialConfig?: Partial<DeploymentConfig>;
}

export const CloudDeploymentPanel: React.FC<CloudDeploymentPanelProps> = ({
  onConfigChange,
  initialConfig = {}
}) => {
  const [config, setConfig] = useState<DeploymentConfig>({
    platform: null,
    region: 'us-east-1',
    environment: 'development',
    domain: '',
    customDomain: '',
    ssl: true,
    environmentVariables: {},
    scaling: {
      auto: true,
      minInstances: 1,
      maxInstances: 10,
      targetCPU: 70
    },
    monitoring: {
      enabled: true,
      alerts: true,
      logRetention: 30
    },
    security: {
      authentication: false,
      rateLimiting: true,
      cors: true
    },
    ...initialConfig
  });

  const [activeTab, setActiveTab] = useState<'platform' | 'configuration' | 'scaling' | 'monitoring' | 'security'>('platform');
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'deployed' | 'failed'>('idle');
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);

  const cloudPlatforms: CloudPlatform[] = [
    {
      id: 'vercel',
      name: 'Vercel',
      provider: 'Vercel Inc.',
      icon: '▲',
      description: 'Frontend deployment platform with edge network',
      features: ['Edge Functions', 'Automatic HTTPS', 'Git Integration', 'Preview Deployments'],
      pricing: { free: true, startingPrice: '$20', unit: '/month' },
      regions: ['Global Edge Network', 'US East', 'US West', 'Europe', 'Asia'],
      supportedFrameworks: ['React', 'Next.js', 'Vue.js', 'Svelte', 'Static'],
      deploymentTime: '< 1 minute',
      scalingOptions: ['Automatic', 'Edge Caching', 'CDN Distribution']
    },
    {
      id: 'netlify',
      name: 'Netlify',
      provider: 'Netlify Inc.',
      icon: '🌐',
      description: 'JAMstack deployment platform with serverless functions',
      features: ['Serverless Functions', 'Form Handling', 'Split Testing', 'Analytics'],
      pricing: { free: true, startingPrice: '$19', unit: '/month' },
      regions: ['Global CDN', 'US', 'Europe', 'Asia-Pacific'],
      supportedFrameworks: ['React', 'Vue.js', 'Angular', 'Gatsby', 'Hugo'],
      deploymentTime: '< 2 minutes',
      scalingOptions: ['Global CDN', 'Serverless Functions', 'Edge Processing']
    },
    {
      id: 'aws',
      name: 'AWS',
      provider: 'Amazon Web Services',
      icon: '☁️',
      description: 'Comprehensive cloud platform with full infrastructure control',
      features: ['Lambda Functions', 'S3 Storage', 'CloudFront CDN', 'RDS Database'],
      pricing: { free: false, startingPrice: '$5', unit: '/month' },
      regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'],
      supportedFrameworks: ['Any Framework', 'Docker', 'Serverless', 'Containers'],
      deploymentTime: '3-5 minutes',
      scalingOptions: ['Auto Scaling Groups', 'Load Balancers', 'Container Orchestration']
    },
    {
      id: 'gcp',
      name: 'Google Cloud',
      provider: 'Google LLC',
      icon: '🌤️',
      description: 'Google cloud platform with AI/ML integration',
      features: ['Cloud Functions', 'Cloud Storage', 'Cloud CDN', 'AI Platform'],
      pricing: { free: false, startingPrice: '$8', unit: '/month' },
      regions: ['us-central1', 'us-east1', 'europe-west1', 'asia-east1'],
      supportedFrameworks: ['Any Framework', 'Kubernetes', 'App Engine', 'Cloud Run'],
      deploymentTime: '2-4 minutes',
      scalingOptions: ['Auto Scaling', 'Load Balancing', 'Kubernetes Clusters']
    },
    {
      id: 'azure',
      name: 'Microsoft Azure',
      provider: 'Microsoft Corporation',
      icon: '🔷',
      description: 'Microsoft cloud platform with enterprise integration',
      features: ['Azure Functions', 'Blob Storage', 'Application Gateway', 'Active Directory'],
      pricing: { free: false, startingPrice: '$10', unit: '/month' },
      regions: ['East US', 'West US', 'North Europe', 'Southeast Asia'],
      supportedFrameworks: ['Any Framework', '.NET', 'Node.js', 'Python', 'Java'],
      deploymentTime: '3-6 minutes',
      scalingOptions: ['Virtual Machine Scale Sets', 'App Service Plans', 'Container Instances']
    },
    {
      id: 'railway',
      name: 'Railway',
      provider: 'Railway Corp.',
      icon: '🚂',
      description: 'Simple deployment platform for full-stack applications',
      features: ['Database Hosting', 'Environment Management', 'Automatic Deployments', 'Monitoring'],
      pricing: { free: true, startingPrice: '$5', unit: '/month' },
      regions: ['US West', 'US East', 'Europe'],
      supportedFrameworks: ['Node.js', 'Python', 'Go', 'Ruby', 'PHP'],
      deploymentTime: '1-3 minutes',
      scalingOptions: ['Vertical Scaling', 'Resource Limits', 'Auto Sleep']
    }
  ];

  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  const handlePlatformSelect = (platform: CloudPlatform) => {
    setConfig(prev => ({
      ...prev,
      platform,
      region: platform.regions[0],
      domain: `${prev.domain || 'my-app'}.${platform.id === 'vercel' ? 'vercel.app' : platform.id === 'netlify' ? 'netlify.app' : 'example.com'}`
    }));
  };

  const handleDeploy = async () => {
    if (!config.platform) {
      alert('Please select a deployment platform');
      return;
    }

    setDeploymentStatus('deploying');
    setDeploymentLogs([]);

    const logs = [
      'Initializing deployment...',
      `Connecting to ${config.platform.name}...`,
      'Building application...',
      'Optimizing assets...',
      'Configuring environment variables...',
      'Setting up SSL certificate...',
      'Deploying to edge network...',
      'Running health checks...',
      'Deployment completed successfully!'
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDeploymentLogs(prev => [...prev, logs[i]]);
    }

    setDeploymentStatus('deployed');
    setConfig(prev => ({
      ...prev,
      domain: prev.domain || `my-app-${Date.now()}.${config.platform!.id === 'vercel' ? 'vercel.app' : 'netlify.app'}`
    }));
  };

  const renderPlatformTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Select Deployment Platform</h3>
        <p className="text-gray-400 text-sm">Choose the best platform for your application</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cloudPlatforms.map((platform) => (
          <div
            key={platform.id}
            onClick={() => handlePlatformSelect(platform)}
            className={`p-4 border rounded-lg cursor-pointer transition-all hover:scale-105 ${
              config.platform?.id === platform.id
                ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                : 'border-gray-600 bg-gray-700 hover:border-gray-500'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{platform.icon}</span>
                <div>
                  <h4 className="text-white font-medium">{platform.name}</h4>
                  <p className="text-gray-400 text-xs">{platform.provider}</p>
                </div>
              </div>
              <div className="text-right">
                {platform.pricing.free && (
                  <span className="px-2 py-1 bg-green-600 text-xs rounded text-white">FREE</span>
                )}
                <div className="text-gray-400 text-xs mt-1">
                  from {platform.pricing.startingPrice}{platform.pricing.unit}
                </div>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-3">{platform.description}</p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Timer className="w-3 h-3" />
                Deploy in {platform.deploymentTime}
              </div>
              <div className="flex flex-wrap gap-1">
                {platform.features.slice(0, 3).map((feature, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-600 text-xs rounded text-gray-300">
                    {feature}
                  </span>
                ))}
                {platform.features.length > 3 && (
                  <span className="px-2 py-1 bg-gray-600 text-xs rounded text-gray-300">
                    +{platform.features.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {config.platform && (
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">{config.platform.icon}</span>
            <div>
              <h4 className="text-white font-medium">Selected: {config.platform.name}</h4>
              <p className="text-gray-400 text-sm">{config.platform.description}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Region</label>
              <select
                value={config.region}
                onChange={(e) => setConfig(prev => ({ ...prev, region: e.target.value }))}
                className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {config.platform.regions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-2">Environment</label>
              <select
                value={config.environment}
                onChange={(e) => setConfig(prev => ({ ...prev, environment: e.target.value as any }))}
                className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderConfigurationTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Deployment Configuration</h3>
        <p className="text-gray-400 text-sm">Configure domain, SSL, and environment settings</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Generated Domain</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.domain}
                onChange={(e) => setConfig(prev => ({ ...prev, domain: e.target.value }))}
                className="flex-1 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                placeholder="my-awesome-app"
              />
              <button
                onClick={() => navigator.clipboard.writeText(config.domain)}
                className="px-3 py-2 bg-gray-600 text-gray-300 rounded hover:bg-gray-500"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Custom Domain (Optional)</label>
            <input
              type="text"
              value={config.customDomain}
              onChange={(e) => setConfig(prev => ({ ...prev, customDomain: e.target.value }))}
              className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              placeholder="myapp.com"
            />
          </div>
        </div>

        <div className="p-4 bg-gray-700 rounded">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">SSL Certificate</span>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.ssl}
                onChange={(e) => setConfig(prev => ({ ...prev, ssl: e.target.checked }))}
                className="rounded"
              />
              <span className="text-gray-300 text-sm">Enable HTTPS</span>
            </label>
          </div>
          {config.ssl && (
            <p className="text-gray-400 text-sm">
              Automatic SSL certificate will be provisioned and renewed
            </p>
          )}
        </div>

        <div className="p-4 bg-gray-700 rounded">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Environment Variables</span>
            </div>
            <button
              onClick={() => {
                const key = prompt('Environment variable name:');
                const value = prompt('Environment variable value:');
                if (key && value) {
                  setConfig(prev => ({
                    ...prev,
                    environmentVariables: { ...prev.environmentVariables, [key]: value }
                  }));
                }
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-2">
            {Object.entries(config.environmentVariables).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 p-2 bg-gray-600 rounded">
                <span className="text-white font-mono text-sm">{key}</span>
                <span className="text-gray-400">=</span>
                <span className="text-gray-300 font-mono text-sm flex-1">{value}</span>
                <button
                  onClick={() => setConfig(prev => {
                    const newVars = { ...prev.environmentVariables };
                    delete newVars[key];
                    return { ...prev, environmentVariables: newVars };
                  })}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {Object.keys(config.environmentVariables).length === 0 && (
              <p className="text-gray-400 text-sm">No environment variables configured</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderScalingTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Scaling Configuration</h3>
        <p className="text-gray-400 text-sm">Configure automatic scaling and resource limits</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-700 rounded">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">Auto Scaling</span>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.scaling.auto}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  scaling: { ...prev.scaling, auto: e.target.checked }
                }))}
                className="rounded"
              />
              <span className="text-gray-300 text-sm">Enable auto scaling</span>
            </label>
          </div>

          {config.scaling.auto && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Min Instances</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.scaling.minInstances}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    scaling: { ...prev.scaling, minInstances: parseInt(e.target.value) }
                  }))}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Max Instances</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={config.scaling.maxInstances}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    scaling: { ...prev.scaling, maxInstances: parseInt(e.target.value) }
                  }))}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Target CPU (%)</label>
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={config.scaling.targetCPU}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    scaling: { ...prev.scaling, targetCPU: parseInt(e.target.value) }
                  }))}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-700 rounded text-center">
            <Cpu className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-white font-medium">CPU Usage</div>
            <div className="text-gray-400 text-sm">Target: {config.scaling.targetCPU}%</div>
          </div>

          <div className="p-4 bg-gray-700 rounded text-center">
            <HardDrive className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-white font-medium">Memory</div>
            <div className="text-gray-400 text-sm">Auto-managed</div>
          </div>

          <div className="p-4 bg-gray-700 rounded text-center">
            <Network className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-white font-medium">Bandwidth</div>
            <div className="text-gray-400 text-sm">Unlimited</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonitoringTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Monitoring & Alerts</h3>
        <p className="text-gray-400 text-sm">Configure monitoring, logging, and alerting</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-700 rounded">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Application Monitoring</span>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.monitoring.enabled}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  monitoring: { ...prev.monitoring, enabled: e.target.checked }
                }))}
                className="rounded"
              />
              <span className="text-gray-300 text-sm">Enable monitoring</span>
            </label>
          </div>

          {config.monitoring.enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={config.monitoring.alerts}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        monitoring: { ...prev.monitoring, alerts: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <span className="text-gray-300 text-sm">Enable alerts</span>
                  </label>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Log Retention (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={config.monitoring.logRetention}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      monitoring: { ...prev.monitoring, logRetention: parseInt(e.target.value) }
                    }))}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-600 rounded text-center">
                  <Activity className="w-6 h-6 text-green-400 mx-auto mb-1" />
                  <div className="text-white text-sm font-medium">Uptime</div>
                  <div className="text-gray-300 text-xs">99.9%</div>
                </div>

                <div className="p-3 bg-gray-600 rounded text-center">
                  <BarChart3 className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                  <div className="text-white text-sm font-medium">Response Time</div>
                  <div className="text-gray-300 text-xs">< 200ms</div>
                </div>

                <div className="p-3 bg-gray-600 rounded text-center">
                  <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                  <div className="text-white text-sm font-medium">Requests</div>
                  <div className="text-gray-300 text-xs">1.2K/min</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {deploymentStatus === 'deployed' && (
          <div className="p-4 bg-gray-700 rounded">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">Deployment Status</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Application URL:</span>
                <a
                  href={`https://${config.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                >
                  {config.domain}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Status:</span>
                <span className="text-green-400 text-sm">Live</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Last Deployed:</span>
                <span className="text-gray-400 text-sm">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Security Configuration</h3>
        <p className="text-gray-400 text-sm">Configure security settings and access controls</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-700 rounded">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">Authentication</span>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.security.authentication}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  security: { ...prev.security, authentication: e.target.checked }
                }))}
                className="rounded"
              />
              <span className="text-gray-300 text-sm">Require authentication</span>
            </label>
          </div>

          <div className="p-4 bg-gray-700 rounded">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-medium">Rate Limiting</span>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.security.rateLimiting}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  security: { ...prev.security, rateLimiting: e.target.checked }
                }))}
                className="rounded"
              />
              <span className="text-gray-300 text-sm">Enable rate limiting</span>
            </label>
          </div>

          <div className="p-4 bg-gray-700 rounded">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">CORS</span>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.security.cors}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  security: { ...prev.security, cors: e.target.checked }
                }))}
                className="rounded"
              />
              <span className="text-gray-300 text-sm">Enable CORS</span>
            </label>
          </div>

          <div className="p-4 bg-gray-700 rounded">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-5 h-5 text-red-400" />
              <span className="text-white font-medium">SSL/TLS</span>
            </div>
            <div className="text-green-400 text-sm">
              {config.ssl ? '✓ Enabled' : '✗ Disabled'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Cloud className="w-6 h-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Cloud Deployment</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {deploymentStatus === 'deployed' && (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Deployed</span>
            </div>
          )}
          <button
            onClick={handleDeploy}
            disabled={!config.platform || deploymentStatus === 'deploying'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deploymentStatus === 'deploying' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Deploy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-600 mb-6 overflow-x-auto">
        {[
          { id: 'platform', label: 'Platform', icon: Cloud },
          { id: 'configuration', label: 'Configuration', icon: Settings },
          { id: 'scaling', label: 'Scaling', icon: TrendingUp },
          { id: 'monitoring', label: 'Monitoring', icon: Monitor },
          { id: 'security', label: 'Security', icon: Shield }
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
        {activeTab === 'platform' && renderPlatformTab()}
        {activeTab === 'configuration' && renderConfigurationTab()}
        {activeTab === 'scaling' && renderScalingTab()}
        {activeTab === 'monitoring' && renderMonitoringTab()}
        {activeTab === 'security' && renderSecurityTab()}
      </div>

      {/* Deployment Logs */}
      {deploymentLogs.length > 0 && (
        <div className="mt-6 p-4 bg-gray-900 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-white font-medium">Deployment Logs</span>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {deploymentLogs.map((log, index) => (
              <div key={index} className="text-gray-300 text-sm font-mono">
                <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudDeploymentPanel;

