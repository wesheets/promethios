/**
 * Auto Responses Component
 * 
 * Comprehensive auto-response management for creating and managing
 * automated responses, templates, and intelligent reply systems.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  Zap, 
  Settings, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Copy, 
  Target, 
  Bot, 
  Users, 
  TrendingUp, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Download,
  Upload,
  Filter,
  Search,
  Star,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Timer,
  Globe
} from 'lucide-react';

interface AutoResponse {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  category: 'greeting' | 'faq' | 'support' | 'sales' | 'closing' | 'custom';
  triggers: string[];
  response: string;
  conditions: ResponseCondition[];
  priority: number;
  language: string;
  usageCount: number;
  successRate: number;
  avgRating: number;
  createdAt: string;
  lastModified: string;
}

interface ResponseCondition {
  id: string;
  type: 'keyword' | 'intent' | 'sentiment' | 'time' | 'user_type' | 'context';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
  description: string;
}

interface ResponseTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  description: string;
  usageCount: number;
}

interface ResponseAnalytics {
  responseId: string;
  responseName: string;
  triggers: number;
  successRate: number;
  avgRating: number;
  lastUsed: string;
  trend: number;
}

const AutoResponses: React.FC = () => {
  const [responses, setResponses] = useState<AutoResponse[]>([]);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [analytics, setAnalytics] = useState<ResponseAnalytics[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<AutoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [newResponse, setNewResponse] = useState({
    name: '',
    description: '',
    category: 'faq' as const,
    triggers: [''],
    response: '',
    language: 'en',
    priority: 1
  });

  const mockResponses: AutoResponse[] = [
    {
      id: 'response-1',
      name: 'Welcome Greeting',
      description: 'Standard welcome message for new visitors',
      status: 'active',
      category: 'greeting',
      triggers: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
      response: 'Hello! Welcome to our support chat. How can I help you today?',
      conditions: [
        {
          id: 'cond-1',
          type: 'intent',
          operator: 'equals',
          value: 'greeting',
          description: 'User intent is greeting'
        }
      ],
      priority: 1,
      language: 'en',
      usageCount: 1247,
      successRate: 94.2,
      avgRating: 4.6,
      createdAt: '2024-01-15T10:00:00Z',
      lastModified: '2024-01-20T14:30:00Z'
    },
    {
      id: 'response-2',
      name: 'Business Hours Info',
      description: 'Information about business hours and availability',
      status: 'active',
      category: 'faq',
      triggers: ['hours', 'open', 'closed', 'when', 'time'],
      response: 'Our business hours are Monday to Friday, 9 AM to 6 PM EST. We\'re currently {{status}}. For urgent matters outside business hours, please email support@company.com.',
      conditions: [
        {
          id: 'cond-2',
          type: 'keyword',
          operator: 'contains',
          value: 'hours|open|closed',
          description: 'Contains business hours keywords'
        }
      ],
      priority: 2,
      language: 'en',
      usageCount: 456,
      successRate: 87.8,
      avgRating: 4.3,
      createdAt: '2024-01-18T09:15:00Z',
      lastModified: '2024-01-19T16:45:00Z'
    },
    {
      id: 'response-3',
      name: 'Pricing Information',
      description: 'General pricing and plan information',
      status: 'active',
      category: 'sales',
      triggers: ['price', 'cost', 'plan', 'pricing', 'how much'],
      response: 'We offer several pricing plans to fit your needs. Our basic plan starts at $29/month, professional at $79/month, and enterprise plans are custom-priced. Would you like me to show you our detailed pricing page?',
      conditions: [
        {
          id: 'cond-3',
          type: 'intent',
          operator: 'equals',
          value: 'pricing_inquiry',
          description: 'User asking about pricing'
        }
      ],
      priority: 3,
      language: 'en',
      usageCount: 789,
      successRate: 91.5,
      avgRating: 4.4,
      createdAt: '2024-01-20T11:30:00Z',
      lastModified: '2024-01-20T11:30:00Z'
    },
    {
      id: 'response-4',
      name: 'Technical Support Escalation',
      description: 'Escalation message for complex technical issues',
      status: 'active',
      category: 'support',
      triggers: ['technical', 'bug', 'error', 'not working', 'broken'],
      response: 'I understand you\'re experiencing a technical issue. Let me connect you with one of our technical specialists who can provide detailed assistance. Please hold on for a moment.',
      conditions: [
        {
          id: 'cond-4',
          type: 'intent',
          operator: 'equals',
          value: 'technical_support',
          description: 'Technical support request'
        }
      ],
      priority: 1,
      language: 'en',
      usageCount: 234,
      successRate: 96.1,
      avgRating: 4.7,
      createdAt: '2024-01-12T14:20:00Z',
      lastModified: '2024-01-18T10:15:00Z'
    }
  ];

  const mockTemplates: ResponseTemplate[] = [
    {
      id: 'template-1',
      name: 'Personalized Greeting',
      category: 'greeting',
      template: 'Hello {{customer_name}}! Welcome back to {{company_name}}. How can I assist you today?',
      variables: ['customer_name', 'company_name'],
      description: 'Personalized greeting with customer name',
      usageCount: 156
    },
    {
      id: 'template-2',
      name: 'Order Status Update',
      category: 'support',
      template: 'Your order #{{order_id}} is currently {{status}}. Expected delivery: {{delivery_date}}. Track your order: {{tracking_link}}',
      variables: ['order_id', 'status', 'delivery_date', 'tracking_link'],
      description: 'Order status information template',
      usageCount: 89
    },
    {
      id: 'template-3',
      name: 'Appointment Confirmation',
      category: 'custom',
      template: 'Your appointment with {{agent_name}} is confirmed for {{date}} at {{time}}. Location: {{location}}. Please arrive 10 minutes early.',
      variables: ['agent_name', 'date', 'time', 'location'],
      description: 'Appointment confirmation template',
      usageCount: 67
    }
  ];

  const categories = [
    { value: 'greeting', label: 'Greeting', icon: <Users className="h-4 w-4" /> },
    { value: 'faq', label: 'FAQ', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'support', label: 'Support', icon: <Settings className="h-4 w-4" /> },
    { value: 'sales', label: 'Sales', icon: <Target className="h-4 w-4" /> },
    { value: 'closing', label: 'Closing', icon: <CheckCircle className="h-4 w-4" /> },
    { value: 'custom', label: 'Custom', icon: <Zap className="h-4 w-4" /> }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setResponses(mockResponses);
      setTemplates(mockTemplates);
      setAnalytics(mockResponses.map(r => ({
        responseId: r.id,
        responseName: r.name,
        triggers: r.usageCount,
        successRate: r.successRate,
        avgRating: r.avgRating,
        lastUsed: r.lastModified,
        trend: Math.random() > 0.5 ? Math.random() * 20 : -Math.random() * 20
      })));
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || <MessageSquare className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'greeting':
        return 'bg-blue-600';
      case 'faq':
        return 'bg-green-600';
      case 'support':
        return 'bg-orange-600';
      case 'sales':
        return 'bg-purple-600';
      case 'closing':
        return 'bg-gray-600';
      case 'custom':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const filteredResponses = responses.filter(response => {
    const matchesSearch = response.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         response.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         response.triggers.some(trigger => trigger.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || response.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const createResponse = () => {
    const response: AutoResponse = {
      id: `response-${Date.now()}`,
      name: newResponse.name,
      description: newResponse.description,
      status: 'draft',
      category: newResponse.category,
      triggers: newResponse.triggers.filter(t => t.trim() !== ''),
      response: newResponse.response,
      conditions: [],
      priority: newResponse.priority,
      language: newResponse.language,
      usageCount: 0,
      successRate: 0,
      avgRating: 0,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    setResponses([...responses, response]);
    setShowCreateDialog(false);
    setNewResponse({
      name: '',
      description: '',
      category: 'faq',
      triggers: [''],
      response: '',
      language: 'en',
      priority: 1
    });
  };

  const toggleResponseStatus = (responseId: string) => {
    setResponses(responses.map(response => 
      response.id === responseId 
        ? { ...response, status: response.status === 'active' ? 'inactive' : 'active' }
        : response
    ));
  };

  const duplicateResponse = (response: AutoResponse) => {
    const duplicated: AutoResponse = {
      ...response,
      id: `response-${Date.now()}`,
      name: `${response.name} (Copy)`,
      status: 'draft',
      usageCount: 0,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    setResponses([...responses, duplicated]);
  };

  const deleteResponse = (responseId: string) => {
    setResponses(responses.filter(response => response.id !== responseId));
  };

  const addTrigger = () => {
    setNewResponse({
      ...newResponse,
      triggers: [...newResponse.triggers, '']
    });
  };

  const updateTrigger = (index: number, value: string) => {
    const updatedTriggers = [...newResponse.triggers];
    updatedTriggers[index] = value;
    setNewResponse({
      ...newResponse,
      triggers: updatedTriggers
    });
  };

  const removeTrigger = (index: number) => {
    setNewResponse({
      ...newResponse,
      triggers: newResponse.triggers.filter((_, i) => i !== index)
    });
  };

  const exportResponses = () => {
    console.log('Exporting auto responses...');
  };

  const importResponses = () => {
    console.log('Importing auto responses...');
  };

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-white">Loading auto responses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Auto Responses</h1>
          <p className="text-gray-300 mt-2">
            Create and manage automated responses for common inquiries and interactions.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={importResponses} variant="outline" className="text-white border-gray-600">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={exportResponses} variant="outline" className="text-white border-gray-600">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={refreshData} variant="outline" className="text-white border-gray-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Response
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Create Auto Response</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Set up a new automated response for your chat system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="response-name" className="text-white">Response Name</Label>
                    <Input
                      id="response-name"
                      value={newResponse.name}
                      onChange={(e) => setNewResponse({...newResponse, name: e.target.value})}
                      placeholder="Welcome Message"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="response-category" className="text-white">Category</Label>
                    <Select 
                      value={newResponse.category} 
                      onValueChange={(value) => setNewResponse({...newResponse, category: value as any})}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value} className="text-white">
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="response-description" className="text-white">Description</Label>
                  <Input
                    id="response-description"
                    value={newResponse.description}
                    onChange={(e) => setNewResponse({...newResponse, description: e.target.value})}
                    placeholder="Brief description of when this response is used"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Trigger Keywords</Label>
                  <div className="space-y-2">
                    {newResponse.triggers.map((trigger, index) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          value={trigger}
                          onChange={(e) => updateTrigger(index, e.target.value)}
                          placeholder="Enter trigger keyword"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        {newResponse.triggers.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTrigger(index)}
                            className="text-white border-gray-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addTrigger}
                      className="text-white border-gray-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Trigger
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="response-text" className="text-white">Response Text</Label>
                  <Textarea
                    id="response-text"
                    value={newResponse.response}
                    onChange={(e) => setNewResponse({...newResponse, response: e.target.value})}
                    placeholder="Enter the automated response text..."
                    className="bg-gray-700 border-gray-600 text-white"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="response-language" className="text-white">Language</Label>
                    <Select 
                      value={newResponse.language} 
                      onValueChange={(value) => setNewResponse({...newResponse, language: value})}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {languages.map((language) => (
                          <SelectItem key={language.value} value={language.value} className="text-white">
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="response-priority" className="text-white">Priority</Label>
                    <Input
                      id="response-priority"
                      type="number"
                      min="1"
                      max="10"
                      value={newResponse.priority}
                      onChange={(e) => setNewResponse({...newResponse, priority: parseInt(e.target.value)})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <Button onClick={createResponse} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Response
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Responses</p>
                <p className="text-2xl font-bold text-white">{responses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Active Responses</p>
                <p className="text-2xl font-bold text-white">
                  {responses.filter(r => r.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Usage</p>
                <p className="text-2xl font-bold text-white">
                  {responses.reduce((acc, r) => acc + r.usageCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Avg Rating</p>
                <p className="text-2xl font-bold text-white">
                  {(responses.reduce((acc, r) => acc + r.avgRating, 0) / responses.length || 0).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search responses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white"
            />
          </div>
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="all" className="text-white">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value} className="text-white">
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="responses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="responses" className="text-white data-[state=active]:bg-gray-700">
            Auto Responses
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-white data-[state=active]:bg-gray-700">
            Templates
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-gray-700">
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Responses Tab */}
        <TabsContent value="responses" className="space-y-4">
          <div className="grid gap-4">
            {filteredResponses.map((response) => (
              <Card key={response.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getCategoryColor(response.category)}`}>
                        {getCategoryIcon(response.category)}
                      </div>
                      <div>
                        <CardTitle className="text-white">{response.name}</CardTitle>
                        <CardDescription className="text-gray-300">{response.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(response.status)}>
                        {response.status}
                      </Badge>
                      <Badge variant="outline" className="text-white border-gray-600">
                        Priority {response.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white font-medium mb-2">Triggers:</h4>
                      <div className="flex flex-wrap gap-1">
                        {response.triggers.map((trigger, index) => (
                          <Badge key={index} variant="outline" className="text-white border-gray-600">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2">Response:</h4>
                      <p className="text-gray-300 bg-gray-700 p-3 rounded">{response.response}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-300">Usage Count</p>
                        <p className="text-2xl font-bold text-white">{response.usageCount}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-300">Success Rate</p>
                        <p className="text-2xl font-bold text-white">{response.successRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-300">Avg Rating</p>
                        <p className="text-2xl font-bold text-white">{response.avgRating}/5</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-300">Language</p>
                        <p className="text-2xl font-bold text-white">{response.language.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-300">
                        Last modified: {new Date(response.lastModified).toLocaleString()}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleResponseStatus(response.id)}
                          className="text-white border-gray-600"
                        >
                          {response.status === 'active' ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                          {response.status === 'active' ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedResponse(response);
                            setShowEditDialog(true);
                          }}
                          className="text-white border-gray-600"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateResponse(response)}
                          className="text-white border-gray-600"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteResponse(response.id)}
                          className="text-white border-gray-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Response Templates</h3>
            <Button 
              onClick={() => setShowTemplateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{template.name}</CardTitle>
                      <CardDescription className="text-gray-300">{template.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-white border-gray-600">
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-white font-medium mb-1">Template:</h4>
                      <p className="text-gray-300 bg-gray-700 p-2 rounded text-sm">{template.template}</p>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Variables:</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable, index) => (
                          <Badge key={index} variant="secondary">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Used {template.usageCount} times</span>
                      <Button variant="outline" size="sm" className="text-white border-gray-600">
                        <Copy className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4">
            {analytics.map((analytic) => (
              <Card key={analytic.responseId} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{analytic.responseName}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {analytic.trend >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ${analytic.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {analytic.trend >= 0 ? '+' : ''}{analytic.trend.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Triggers</p>
                      <p className="text-2xl font-bold text-white">{analytic.triggers}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Success Rate</p>
                      <p className="text-2xl font-bold text-white">{analytic.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Avg Rating</p>
                      <p className="text-2xl font-bold text-white">{analytic.avgRating}/5</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Last Used</p>
                      <p className="text-sm text-gray-300">{new Date(analytic.lastUsed).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoResponses;

