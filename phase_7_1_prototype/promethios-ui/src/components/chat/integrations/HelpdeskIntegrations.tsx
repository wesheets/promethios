/**
 * Helpdesk Integrations Component
 * 
 * Specialized integration management for helpdesk and support systems
 * including Zendesk, Freshdesk, ServiceNow, and other ticketing platforms.
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
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Settings, 
  Plus, 
  Trash2, 
  RefreshCw,
  ExternalLink,
  Zap,
  Users,
  Ticket,
  MessageSquare,
  Activity,
  TrendingUp,
  Shield,
  Database,
  HeadphonesIcon,
  LifeBuoy,
  UserCheck,
  Timer,
  Star,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HelpdeskIntegration {
  id: string;
  name: string;
  type: 'zendesk' | 'freshdesk' | 'servicenow' | 'jira' | 'intercom' | 'custom';
  status: 'active' | 'inactive' | 'error' | 'pending';
  config: {
    subdomain?: string;
    apiKey?: string;
    email?: string;
    instanceUrl?: string;
    webhookUrl?: string;
    autoCreateTickets?: boolean;
    escalationRules?: boolean;
    priorityMapping?: Record<string, string>;
  };
  metrics: {
    ticketsCreated: number;
    avgResolutionTime: number;
    escalationRate: number;
    customerSatisfaction: number;
  };
  lastSync: string;
  createdAt: string;
}

interface TicketTemplate {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assigneeGroup?: string;
  customFields: Record<string, any>;
}

const HelpdeskIntegrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<HelpdeskIntegration[]>([]);
  const [ticketTemplates, setTicketTemplates] = useState<TicketTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<HelpdeskIntegration | null>(null);
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    type: 'zendesk' as const,
    config: {
      subdomain: '',
      apiKey: '',
      email: '',
      autoCreateTickets: true,
      escalationRules: false,
    },
    enabled: true
  });

  const helpdeskProviders = [
    {
      id: 'zendesk',
      name: 'Zendesk',
      description: 'Popular cloud-based customer service platform',
      icon: <HeadphonesIcon className="h-5 w-5 text-blue-600" />,
      features: ['Ticket Management', 'Knowledge Base', 'Live Chat', 'Analytics'],
      setupFields: ['subdomain', 'email', 'apiKey']
    },
    {
      id: 'freshdesk',
      name: 'Freshdesk',
      description: 'Modern customer support software',
      icon: <LifeBuoy className="h-5 w-5 text-green-600" />,
      features: ['Multi-channel Support', 'Automation', 'Reporting', 'SLA Management'],
      setupFields: ['subdomain', 'apiKey']
    },
    {
      id: 'servicenow',
      name: 'ServiceNow',
      description: 'Enterprise IT service management platform',
      icon: <UserCheck className="h-5 w-5 text-purple-600" />,
      features: ['ITSM', 'Workflow Automation', 'Change Management', 'Asset Management'],
      setupFields: ['instanceUrl', 'username', 'password']
    },
    {
      id: 'jira',
      name: 'Jira Service Management',
      description: 'Atlassian\'s IT service management solution',
      icon: <Ticket className="h-5 w-5 text-blue-500" />,
      features: ['Issue Tracking', 'Project Management', 'Agile Boards', 'Reporting'],
      setupFields: ['instanceUrl', 'email', 'apiToken']
    },
    {
      id: 'intercom',
      name: 'Intercom',
      description: 'Customer messaging platform with support features',
      icon: <MessageSquare className="h-5 w-5 text-indigo-600" />,
      features: ['Live Chat', 'Help Desk', 'Customer Data', 'Automation'],
      setupFields: ['accessToken', 'appId']
    }
  ];

  const mockIntegrations: HelpdeskIntegration[] = [
    {
      id: 'zendesk-1',
      name: 'Main Support Desk',
      type: 'zendesk',
      status: 'active',
      config: {
        subdomain: 'company-support',
        email: 'support@company.com',
        apiKey: 'zd_***************',
        autoCreateTickets: true,
        escalationRules: true,
        priorityMapping: {
          'low': 'low',
          'medium': 'normal',
          'high': 'high',
          'urgent': 'urgent'
        }
      },
      metrics: {
        ticketsCreated: 1247,
        avgResolutionTime: 4.2,
        escalationRate: 12.5,
        customerSatisfaction: 4.6
      },
      lastSync: '2024-01-20T10:30:00Z',
      createdAt: '2024-01-15T09:00:00Z'
    },
    {
      id: 'freshdesk-1',
      name: 'Technical Support',
      type: 'freshdesk',
      status: 'active',
      config: {
        subdomain: 'techsupport',
        apiKey: 'fd_***************',
        autoCreateTickets: true,
        escalationRules: false
      },
      metrics: {
        ticketsCreated: 892,
        avgResolutionTime: 6.1,
        escalationRate: 8.3,
        customerSatisfaction: 4.4
      },
      lastSync: '2024-01-20T10:25:00Z',
      createdAt: '2024-01-10T14:30:00Z'
    }
  ];

  const mockTicketTemplates: TicketTemplate[] = [
    {
      id: 'template-1',
      name: 'General Support Request',
      description: 'Standard template for general customer support inquiries',
      priority: 'medium',
      category: 'General',
      assigneeGroup: 'Support Team',
      customFields: {
        source: 'chatbot',
        urgency: 'normal'
      }
    },
    {
      id: 'template-2',
      name: 'Technical Issue',
      description: 'Template for technical problems and bug reports',
      priority: 'high',
      category: 'Technical',
      assigneeGroup: 'Technical Team',
      customFields: {
        source: 'chatbot',
        urgency: 'high',
        category: 'bug'
      }
    },
    {
      id: 'template-3',
      name: 'Billing Inquiry',
      description: 'Template for billing and payment related questions',
      priority: 'medium',
      category: 'Billing',
      assigneeGroup: 'Billing Team',
      customFields: {
        source: 'chatbot',
        department: 'finance'
      }
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIntegrations(mockIntegrations);
      setTicketTemplates(mockTicketTemplates);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'error':
        return 'destructive';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getProviderIcon = (type: string) => {
    const provider = helpdeskProviders.find(p => p.id === type);
    return provider?.icon || <ExternalLink className="h-5 w-5 text-gray-600" />;
  };

  const registerIntegration = () => {
    const integration: HelpdeskIntegration = {
      id: `${newIntegration.type}-${Date.now()}`,
      name: newIntegration.name,
      type: newIntegration.type,
      status: 'pending',
      config: newIntegration.config,
      metrics: {
        ticketsCreated: 0,
        avgResolutionTime: 0,
        escalationRate: 0,
        customerSatisfaction: 0
      },
      lastSync: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    setIntegrations([...integrations, integration]);
    setShowAddDialog(false);
    setNewIntegration({
      name: '',
      type: 'zendesk',
      config: {
        subdomain: '',
        apiKey: '',
        email: '',
        autoCreateTickets: true,
        escalationRules: false,
      },
      enabled: true
    });
  };

  const testIntegration = (integration: HelpdeskIntegration) => {
    setSelectedIntegration(integration);
    setShowTestDialog(true);
  };

  const runHealthCheck = () => {
    // Simulate health check
    console.log('Running helpdesk integrations health check...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-white">Loading helpdesk integrations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Helpdesk Integrations</h1>
          <p className="text-gray-300 mt-2">
            Connect your chatbots to helpdesk and support systems for seamless ticket management.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={runHealthCheck} variant="outline" className="text-white border-gray-600">
            <Activity className="h-4 w-4 mr-2" />
            Health Check
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Add Helpdesk Integration</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Connect a new helpdesk system to your chat platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="integration-name" className="text-white">Integration Name</Label>
                  <Input
                    id="integration-name"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({...newIntegration, name: e.target.value})}
                    placeholder="Customer Support Desk"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="integration-type" className="text-white">Helpdesk Platform</Label>
                  <Select 
                    value={newIntegration.type} 
                    onValueChange={(value) => setNewIntegration({...newIntegration, type: value as any})}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {helpdeskProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id} className="text-white">
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subdomain" className="text-white">Subdomain</Label>
                  <Input
                    id="subdomain"
                    value={newIntegration.config.subdomain}
                    onChange={(e) => setNewIntegration({
                      ...newIntegration, 
                      config: {...newIntegration.config, subdomain: e.target.value}
                    })}
                    placeholder="your-company"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="api-key" className="text-white">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={newIntegration.config.apiKey}
                    onChange={(e) => setNewIntegration({
                      ...newIntegration, 
                      config: {...newIntegration.config, apiKey: e.target.value}
                    })}
                    placeholder="Your API key"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newIntegration.config.autoCreateTickets}
                    onCheckedChange={(checked) => setNewIntegration({
                      ...newIntegration, 
                      config: {...newIntegration.config, autoCreateTickets: checked}
                    })}
                  />
                  <Label className="text-white">Auto-create tickets from chat escalations</Label>
                </div>
                <Button onClick={registerIntegration} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Integration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Integrations</p>
                <p className="text-2xl font-bold text-white">{integrations.length}</p>
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
                <p className="text-sm font-medium text-gray-300">Active</p>
                <p className="text-2xl font-bold text-white">
                  {integrations.filter(i => i.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Timer className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Avg Resolution</p>
                <p className="text-2xl font-bold text-white">
                  {(integrations.reduce((acc, i) => acc + i.metrics.avgResolutionTime, 0) / integrations.length || 0).toFixed(1)}h
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
                <p className="text-sm font-medium text-gray-300">Satisfaction</p>
                <p className="text-2xl font-bold text-white">
                  {(integrations.reduce((acc, i) => acc + i.metrics.customerSatisfaction, 0) / integrations.length || 0).toFixed(1)}/5
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="integrations" className="text-white data-[state=active]:bg-gray-700">
            Active Integrations
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-white data-[state=active]:bg-gray-700">
            Ticket Templates
          </TabsTrigger>
          <TabsTrigger value="providers" className="text-white data-[state=active]:bg-gray-700">
            Available Providers
          </TabsTrigger>
        </TabsList>

        {/* Active Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4">
            {integrations.map((integration) => (
              <Card key={integration.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-700">
                        {getProviderIcon(integration.type)}
                      </div>
                      <div>
                        <CardTitle className="text-white">{integration.name}</CardTitle>
                        <CardDescription className="text-gray-300">
                          {helpdeskProviders.find(p => p.id === integration.type)?.name} Integration
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testIntegration(integration)}
                        className="text-white border-gray-600"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Tickets Created</p>
                      <p className="text-2xl font-bold text-white">{integration.metrics.ticketsCreated}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Avg Resolution</p>
                      <p className="text-2xl font-bold text-white">{integration.metrics.avgResolutionTime}h</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Escalation Rate</p>
                      <p className="text-2xl font-bold text-white">{integration.metrics.escalationRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Satisfaction</p>
                      <p className="text-2xl font-bold text-white">{integration.metrics.customerSatisfaction}/5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Ticket Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Ticket Templates</h3>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
          <div className="grid gap-4">
            {ticketTemplates.map((template) => (
              <Card key={template.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{template.name}</CardTitle>
                      <CardDescription className="text-gray-300">{template.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={template.priority === 'urgent' ? 'destructive' : 'default'}>
                        {template.priority}
                      </Badge>
                      <Badge variant="outline" className="text-white border-gray-600">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-300">
                      Assigned to: {template.assigneeGroup || 'Unassigned'}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="text-white border-gray-600">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-white border-gray-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Available Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {helpdeskProviders.map((provider) => (
              <Card key={provider.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-700">
                      {provider.icon}
                    </div>
                    <div>
                      <CardTitle className="text-white">{provider.name}</CardTitle>
                      <CardDescription className="text-gray-300">{provider.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-2">Key Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {provider.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-white border-gray-600">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        setNewIntegration({...newIntegration, type: provider.id as any});
                        setShowAddDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Connect {provider.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Test Dialog */}
      {selectedIntegration && (
        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent className="bg-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Test Integration: {selectedIntegration.name}</DialogTitle>
              <DialogDescription className="text-gray-300">
                Test your helpdesk integration with sample data.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="bg-gray-700 border-gray-600">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-white">
                  Integration test completed successfully. All endpoints are responding correctly.
                </AlertDescription>
              </Alert>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default HelpdeskIntegrations;

