import React, { useState, useEffect } from 'react';
import {
  Github,
  GitBranch,
  Code,
  Settings,
  Key,
  Users,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Eye,
  EyeOff,
  Refresh,
  Download,
  Upload,
  Lock,
  Unlock,
  Star,
  GitCommit,
  GitPullRequest,
  GitMerge
} from 'lucide-react';

interface GitHubRepository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  private: boolean;
  url: string;
  defaultBranch: string;
  language: string;
  stars: number;
  forks: number;
  lastUpdated: string;
  hasActions: boolean;
  hasWebhooks: boolean;
}

interface GitHubIntegrationConfig {
  connected: boolean;
  username: string;
  accessToken: string;
  selectedRepository: GitHubRepository | null;
  autoSync: boolean;
  branchProtection: boolean;
  cicdEnabled: boolean;
  webhookUrl: string;
  deploymentBranches: string[];
  collaborators: string[];
}

interface GitHubIntegrationPanelProps {
  onConfigChange: (config: GitHubIntegrationConfig) => void;
  initialConfig?: Partial<GitHubIntegrationConfig>;
}

export const GitHubIntegrationPanel: React.FC<GitHubIntegrationPanelProps> = ({
  onConfigChange,
  initialConfig = {}
}) => {
  const [config, setConfig] = useState<GitHubIntegrationConfig>({
    connected: false,
    username: '',
    accessToken: '',
    selectedRepository: null,
    autoSync: true,
    branchProtection: true,
    cicdEnabled: true,
    webhookUrl: '',
    deploymentBranches: ['main', 'production'],
    collaborators: [],
    ...initialConfig
  });

  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'repository' | 'cicd' | 'collaboration'>('setup');

  // Mock repositories for demonstration
  const mockRepositories: GitHubRepository[] = [
    {
      id: 'repo-1',
      name: 'autonomous-saas-builder',
      fullName: 'user/autonomous-saas-builder',
      description: 'AI-powered SaaS application builder with governance',
      private: false,
      url: 'https://github.com/user/autonomous-saas-builder',
      defaultBranch: 'main',
      language: 'TypeScript',
      stars: 127,
      forks: 23,
      lastUpdated: '2024-01-20T14:30:00Z',
      hasActions: true,
      hasWebhooks: false
    },
    {
      id: 'repo-2',
      name: 'ai-governance-framework',
      fullName: 'user/ai-governance-framework',
      description: 'Comprehensive AI governance and compliance framework',
      private: true,
      url: 'https://github.com/user/ai-governance-framework',
      defaultBranch: 'main',
      language: 'Python',
      stars: 89,
      forks: 12,
      lastUpdated: '2024-01-19T16:45:00Z',
      hasActions: true,
      hasWebhooks: true
    }
  ];

  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  const handleConnect = async () => {
    if (!config.accessToken) {
      alert('Please provide a GitHub access token');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to GitHub
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setRepositories(mockRepositories);
      setConfig(prev => ({
        ...prev,
        connected: true,
        username: 'autonomous-dev'
      }));
    } catch (error) {
      console.error('Failed to connect to GitHub:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConfig(prev => ({
      ...prev,
      connected: false,
      username: '',
      selectedRepository: null
    }));
    setRepositories([]);
  };

  const handleRepositorySelect = (repository: GitHubRepository) => {
    setConfig(prev => ({
      ...prev,
      selectedRepository: repository,
      webhookUrl: `https://api.promethios.ai/webhooks/github/${repository.id}`
    }));
  };

  const handleCreateRepository = async () => {
    const repoName = prompt('Enter repository name:');
    if (!repoName) return;

    setLoading(true);
    try {
      // Simulate repository creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newRepo: GitHubRepository = {
        id: `repo-${Date.now()}`,
        name: repoName,
        fullName: `${config.username}/${repoName}`,
        description: 'Created by Autonomous MAS Builder',
        private: false,
        url: `https://github.com/${config.username}/${repoName}`,
        defaultBranch: 'main',
        language: 'TypeScript',
        stars: 0,
        forks: 0,
        lastUpdated: new Date().toISOString(),
        hasActions: false,
        hasWebhooks: false
      };

      setRepositories(prev => [newRepo, ...prev]);
      handleRepositorySelect(newRepo);
    } catch (error) {
      console.error('Failed to create repository:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSetupTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">GitHub Connection</h3>
          <p className="text-gray-400 text-sm">Connect your GitHub account for repository management</p>
        </div>
        <div className="flex items-center gap-2">
          {config.connected ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Connected as @{config.username}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Not connected</span>
            </div>
          )}
        </div>
      </div>

      {!config.connected ? (
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">
              GitHub Personal Access Token
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showTokenInput ? 'text' : 'password'}
                  value={config.accessToken}
                  onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => setShowTokenInput(!showTokenInput)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-white"
                >
                  {showTokenInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleConnect}
                disabled={loading || !config.accessToken}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Github className="w-4 h-4" />
                )}
                Connect
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-1">
              Create a token at{' '}
              <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                GitHub Settings
              </a>{' '}
              with repo, workflow, and webhook permissions
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded">
            <div className="flex items-center gap-3">
              <Github className="w-6 h-6 text-white" />
              <div>
                <div className="text-white font-medium">@{config.username}</div>
                <div className="text-gray-400 text-sm">Connected and authorized</div>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-3 py-1 text-red-400 hover:text-red-300 text-sm"
            >
              Disconnect
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-blue-400" />
                <span className="text-white text-sm font-medium">Auto Sync</span>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.autoSync}
                  onChange={(e) => setConfig(prev => ({ ...prev, autoSync: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-gray-300 text-sm">Automatically sync code changes</span>
              </label>
            </div>

            <div className="p-4 bg-gray-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm font-medium">Branch Protection</span>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.branchProtection}
                  onChange={(e) => setConfig(prev => ({ ...prev, branchProtection: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-gray-300 text-sm">Enable branch protection rules</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRepositoryTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Repository Management</h3>
          <p className="text-gray-400 text-sm">Select or create a repository for your project</p>
        </div>
        <button
          onClick={handleCreateRepository}
          disabled={!config.connected || loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Repository
        </button>
      </div>

      {config.connected && (
        <div className="space-y-4">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              onClick={() => handleRepositorySelect(repo)}
              className={`p-4 border rounded cursor-pointer transition-colors ${
                config.selectedRepository?.id === repo.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-medium">{repo.name}</span>
                    {repo.private && <Lock className="w-4 h-4 text-yellow-400" />}
                    <span className="px-2 py-1 bg-gray-600 text-xs rounded text-gray-300">
                      {repo.language}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{repo.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {repo.stars}
                    </div>
                    <div className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      {repo.forks}
                    </div>
                    <div>Updated {new Date(repo.lastUpdated).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {repo.hasActions && (
                    <div className="w-2 h-2 bg-green-400 rounded-full" title="GitHub Actions enabled" />
                  )}
                  {repo.hasWebhooks && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full" title="Webhooks configured" />
                  )}
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCICDTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">CI/CD Configuration</h3>
        <p className="text-gray-400 text-sm">Configure continuous integration and deployment</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-700 rounded">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">GitHub Actions</span>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.cicdEnabled}
                onChange={(e) => setConfig(prev => ({ ...prev, cicdEnabled: e.target.checked }))}
                className="rounded"
              />
              <span className="text-gray-300 text-sm">Enable CI/CD</span>
            </label>
          </div>

          {config.cicdEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Deployment Branches</label>
                <div className="flex flex-wrap gap-2">
                  {config.deploymentBranches.map((branch, index) => (
                    <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-600 rounded text-sm">
                      <GitBranch className="w-3 h-3" />
                      <span className="text-white">{branch}</span>
                      <button
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          deploymentBranches: prev.deploymentBranches.filter((_, i) => i !== index)
                        }))}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const branch = prompt('Enter branch name:');
                      if (branch && !config.deploymentBranches.includes(branch)) {
                        setConfig(prev => ({
                          ...prev,
                          deploymentBranches: [...prev.deploymentBranches, branch]
                        }));
                      }
                    }}
                    className="px-2 py-1 border border-dashed border-gray-500 rounded text-sm text-gray-400 hover:text-white hover:border-gray-400"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Webhook URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://api.promethios.ai/webhooks/github/..."
                    className="flex-1 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(config.webhookUrl)}
                    className="px-3 py-2 bg-gray-600 text-gray-300 rounded hover:bg-gray-500"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCollaborationTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Team Collaboration</h3>
        <p className="text-gray-400 text-sm">Manage repository access and collaboration</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-700 rounded">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium">Collaborators</span>
          </div>

          <div className="space-y-2">
            {config.collaborators.map((collaborator, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                <span className="text-white">{collaborator}</span>
                <button
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    collaborators: prev.collaborators.filter((_, i) => i !== index)
                  }))}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <button
              onClick={() => {
                const username = prompt('Enter GitHub username:');
                if (username && !config.collaborators.includes(username)) {
                  setConfig(prev => ({
                    ...prev,
                    collaborators: [...prev.collaborators, username]
                  }));
                }
              }}
              className="w-full p-2 border border-dashed border-gray-500 rounded text-gray-400 hover:text-white hover:border-gray-400 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Collaborator
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Github className="w-6 h-6 text-white" />
        <h2 className="text-xl font-semibold text-white">GitHub Integration</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-600 mb-6">
        {[
          { id: 'setup', label: 'Setup', icon: Settings },
          { id: 'repository', label: 'Repository', icon: Code },
          { id: 'cicd', label: 'CI/CD', icon: GitCommit },
          { id: 'collaboration', label: 'Team', icon: Users }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
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
      <div className="min-h-[400px]">
        {activeTab === 'setup' && renderSetupTab()}
        {activeTab === 'repository' && renderRepositoryTab()}
        {activeTab === 'cicd' && renderCICDTab()}
        {activeTab === 'collaboration' && renderCollaborationTab()}
      </div>
    </div>
  );
};

export default GitHubIntegrationPanel;

