import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MessageCircle, 
  Settings, 
  BarChart3, 
  Shield, 
  Copy,
  ExternalLink,
  Trash2,
  Edit,
  Play,
  Pause
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Chatbot {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'creating' | 'error';
  trustScore: number;
  messageCount: number;
  createdAt: string;
  embedCode: string;
}

export function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('chatbots');

  useEffect(() => {
    loadChatbots();
  }, []);

  const loadChatbots = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockChatbots: Chatbot[] = [
        {
          id: '1',
          name: 'Customer Support Bot',
          description: 'Helps customers with common questions',
          status: 'active',
          trustScore: 0.92,
          messageCount: 1250,
          createdAt: '2024-01-15',
          embedCode: '<script src="https://chat.promethios.ai/widget.js" data-chatbot-id="1"></script>'
        },
        {
          id: '2', 
          name: 'Sales Assistant',
          description: 'Qualifies leads and schedules demos',
          status: 'active',
          trustScore: 0.88,
          messageCount: 850,
          createdAt: '2024-01-20',
          embedCode: '<script src="https://chat.promethios.ai/widget.js" data-chatbot-id="2"></script>'
        },
        {
          id: '3',
          name: 'Technical Support',
          description: 'Provides technical documentation help',
          status: 'creating',
          trustScore: 0.0,
          messageCount: 0,
          createdAt: '2024-01-25',
          embedCode: ''
        }
      ];
      
      setChatbots(mockChatbots);
    } catch (error) {
      console.error('Failed to load chatbots:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyEmbedCode = (embedCode: string) => {
    navigator.clipboard.writeText(embedCode);
    // Show toast notification
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900';
      case 'paused': return 'text-yellow-400 bg-yellow-900';
      case 'creating': return 'text-blue-400 bg-blue-900';
      case 'error': return 'text-red-400 bg-red-900';
      default: return 'text-gray-400 bg-gray-900';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-400';
    if (score >= 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img className="h-8 w-auto" src="/logo-promethios.png" alt="Promethios" />
                <span className="ml-3 text-xl font-bold text-white">
                  Promethios <span className="text-indigo-400">Chatbots</span>
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">
                {currentUser?.email}
              </span>
              <button 
                onClick={logout}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Manage your governed AI chatbots
            </p>
          </div>
          
          <Link 
            to="/create-chatbot" 
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Chatbot
          </Link>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'chatbots', label: 'Chatbots', icon: MessageCircle },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedTab(id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === id
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {selectedTab === 'chatbots' && (
          <div>
            {chatbots.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">
                  No chatbots yet
                </h3>
                <p className="text-gray-400 mb-6">
                  Create your first governed AI chatbot to get started
                </p>
                <Link to="/create-chatbot" className="btn-primary">
                  Create Your First Chatbot
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chatbots.map((chatbot) => (
                  <div key={chatbot.id} className="card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {chatbot.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {chatbot.description}
                        </p>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chatbot.status)}`}>
                        {chatbot.status}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-400">Trust Score</div>
                        <div className={`text-lg font-semibold ${getTrustScoreColor(chatbot.trustScore)}`}>
                          {chatbot.status === 'creating' ? '-' : `${(chatbot.trustScore * 100).toFixed(0)}%`}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Messages</div>
                        <div className="text-lg font-semibold text-white">
                          {chatbot.messageCount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {chatbot.status === 'active' && (
                        <>
                          <button 
                            onClick={() => copyEmbedCode(chatbot.embedCode)}
                            className="flex-1 btn-outline text-sm py-2 flex items-center justify-center"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy Code
                          </button>
                          <button className="btn-secondary p-2">
                            <Settings className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {chatbot.status === 'creating' && (
                        <div className="flex-1 bg-gray-700 text-gray-400 text-sm py-2 px-3 rounded-lg text-center">
                          Creating...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Chatbots</div>
                  <div className="text-2xl font-bold text-white">{chatbots.length}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Messages</div>
                  <div className="text-2xl font-bold text-white">
                    {chatbots.reduce((sum, bot) => sum + bot.messageCount, 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center mr-3">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Avg Trust Score</div>
                  <div className="text-2xl font-bold text-white">
                    {chatbots.length > 0 
                      ? `${(chatbots.reduce((sum, bot) => sum + bot.trustScore, 0) / chatbots.length * 100).toFixed(0)}%`
                      : '0%'
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Active Bots</div>
                  <div className="text-2xl font-bold text-white">
                    {chatbots.filter(bot => bot.status === 'active').length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'settings' && (
          <div className="max-w-2xl">
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    value={currentUser?.email || ''} 
                    disabled 
                    className="input w-full"
                  />
                </div>
                
                <div>
                  <label className="form-label">Plan</label>
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Free Trial</div>
                      <div className="text-sm text-gray-400">10 days remaining</div>
                    </div>
                    <button className="btn-primary text-sm">
                      Upgrade
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="form-label">Usage</label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Chatbots</span>
                      <span className="text-white">{chatbots.length} / 5</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${(chatbots.length / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

