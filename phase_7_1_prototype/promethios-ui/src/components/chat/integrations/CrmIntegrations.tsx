/**
 * CRM Integrations Component
 * 
 * Specialized integration management for Customer Relationship Management systems
 * including Salesforce, HubSpot, Pipedrive, and other CRM platforms.
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
  Target,
  TrendingUp,
  Activity,
  Shield,
  Database,
  UserPlus,
  DollarSign,
  BarChart3,
  Contact,
  Building,
  Phone,
  Mail,
  Calendar,
  FileText
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CrmIntegration {
  id: string;
  name: string;
  type: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'dynamics' | 'custom';
  status: 'active' | 'inactive' | 'error' | 'pending';
  config: {
    instanceUrl?: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    apiKey?: string;
    autoCreateLeads?: boolean;
    autoCreateContacts?: boolean;
    leadScoring?: boolean;
    opportunityTracking?: boolean;
    fieldMapping?: Record<string, string>;
  };
  metrics: {
    leadsCreated: number;
    contactsCreated: number;
    opportunitiesCreated: number;
    conversionRate: number;
    avgDealSize: number;
    pipelineValue: number;
  };
  lastSync: string;
  createdAt: string;
}

interface LeadMapping {
  id: string;
  name: string;
  description: string;
  chatbotField: string;
  crmField: string;
  required: boolean;
  dataType: 'text' | 'email' | 'phone' | 'number' | 'date' | 'boolean';
}

const CrmIntegrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<CrmIntegration[]>([]);
  const [leadMappings, setLeadMappings] = useState<LeadMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<CrmIntegration | null>(null);
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    type: 'salesforce' as const,
    config: {
      instanceUrl: '',
      clientId: '',
      clientSecret: '',
      autoCreateLeads: true,
      autoCreateContacts: true,
      leadScoring: false,
      opportunityTracking: true,
    },
    enabled: true
  });

  const crmProviders = [
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'World\'s #1 CRM platform for sales, service, and marketing',
      icon: <Building className="h-5 w-5 text-blue-600" />,
      features: ['Lead Management', 'Opportunity Tracking', 'Contact Management', 'Sales Analytics'],
      setupFields: ['instanceUrl', 'clientId', 'clientSecret']
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Inbound marketing, sales, and service software',
      icon: <TrendingUp className="h-5 w-5 text-orange-600" />,
      features: ['Marketing Automation', 'Lead Nurturing', 'Deal Pipeline', 'Contact Insights'],
      setupFields: ['apiKey', 'portalId']
    },
    {
      id: 'pipedrive',
      name: 'Pipedrive',
      description: 'Sales CRM and pipeline management tool',
      icon: <Target className="h-5 w-5 text-green-600" />,
      features: ['Pipeline Management', 'Activity Tracking', 'Deal Forecasting', 'Sales Reporting'],
      setupFields: ['apiToken', 'companyDomain']
    },
    {
      id: 'zoho',
      name: 'Zoho CRM',
      description: 'Comprehensive CRM solution for businesses',
      icon: <Contact className="h-5 w-5 text-red-600" />,
      features: ['Lead Management', 'Sales Automation', 'Analytics', 'Workflow Rules'],
      setupFields: ['clientId', 'clientSecret', 'refreshToken']
    },
    {
      id: 'dynamics',
      name: 'Microsoft Dynamics 365',
      description: 'Enterprise CRM and ERP solution',
      icon: <Users className="h-5 w-5 text-blue-500" />,
      features: ['Customer Insights', 'Sales Acceleration', 'Marketing Automation', 'Service Management'],
      setupFields: ['instanceUrl', 'clientId', 'clientSecret']
    }
  ];

  const mockIntegrations: CrmIntegration[] = [
    {
      id: 'salesforce-1',
      name: 'Main Sales CRM',
      type: 'salesforce',
      status: 'active',
      config: {
        instanceUrl: 'https://company.salesforce.com',
        clientId: 'sf_***************',
        clientSecret: 'sf_***************',
        autoCreateLeads: true,
        autoCreateContacts: true,
        leadScoring: true,
        opportunityTracking: true,
        fieldMapping: {
          'name': 'Name',
          'email': 'Email',
          'company': 'Company',
          'phone': 'Phone'
        }
      },
      metrics: {
        leadsCreated: 2847,
        contactsCreated: 1923,
        opportunitiesCreated: 456,
        conversionRate: 24.5,
        avgDealSize: 15750,
        pipelineValue: 2450000
      },
      lastSync: '2024-01-20T11:15:00Z',
      createdAt: '2024-01-10T09:00:00Z'
    },
    {
      id: 'hubspot-1',
      name: 'Marketing CRM',
      type: 'hubspot',
      status: 'active',
      config: {
        apiKey: 'hs_***************',
        autoCreateLeads: true,
        autoCreateContacts: true,
        leadScoring: true,
        opportunityTracking: false
      },
      metrics: {
        leadsCreated: 1654,
        contactsCreated: 1234,
        opportunitiesCreated: 234,
        conversionRate: 18.7,
        avgDealSize: 8950,
        pipelineValue: 890000
      },
      lastSync: '2024-01-20T11:10:00Z',
      createdAt: '2024-01-12T14:30:00Z'
    }
  ];

  const mockLeadMappings: LeadMapping[] = [
    {
      id: 'mapping-1',
      name: 'Contact Name',
      description: 'Customer full name from chat',
      chatbotField: 'user.name',
      crmField: 'Name',
      required: true,
      dataType: 'text'
    },
    {
      id: 'mapping-2',
      name: 'Email Address',
      description: 'Customer email address',
      chatbotField: 'user.email',
      crmField: 'Email',
      required: true,
      dataType: 'email'
    },
    {
      id: 'mapping-3',
      name: 'Company Name',
      description: 'Customer company or organization',
      chatbotField: 'user.company',
      crmField: 'Company',
      required: false,
      dataType: 'text'
    },
    {
      id: 'mapping-4',
      name: 'Phone Number',
      description: 'Customer phone number',
      chatbotField: 'user.phone',
      crmField: 'Phone',
      required: false,
      dataType: 'phone'
    },
    {
      id: 'mapping-5',
      name: 'Lead Source',
      description: 'Source of the lead (chatbot)',
      chatbotField: 'conversation.source',
      crmField: 'LeadSource',
      required: true,
      dataType: 'text'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIntegrations(mockIntegrations);
      setLeadMappings(mockLeadMappings);
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
    const provider = crmProviders.find(p => p.id === type);
    return provider?.icon || <ExternalLink className="h-5 w-5 text-gray-600" />;
  };

  const registerIntegration = () => {
    const integration: CrmIntegration = {
      id: `${newIntegration.type}-${Date.now()}`,
      name: newIntegration.name,
      type: newIntegration.type,
      status: 'pending',
      config: newIntegration.config,
      metrics: {
        leadsCreated: 0,
        contactsCreated: 0,
        opportunitiesCreated: 0,
        conversionRate: 0,
        avgDealSize: 0,
        pipelineValue: 0
      },
      lastSync: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    setIntegrations([...integrations, integration]);
    setShowAddDialog(false);
    setNewIntegration({
      name: '',
      type: 'salesforce',
      config: {
        instanceUrl: '',
        clientId: '',
        clientSecret: '',
        autoCreateLeads: true,
        autoCreateContacts: true,
        leadScoring: false,
        opportunityTracking: true,
      },
      enabled: true
    });
  };

  const testIntegration = (integration: CrmIntegration) => {
    setSelectedIntegration(integration);
    setShowTestDialog(true);
  };

  const runHealthCheck = () => {
    // Simulate health check
    console.log('Running CRM integrations health check...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-white">Loading CRM integrations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">CRM Integrations</h1>
          <p className="text-gray-300 mt-2">
            Connect your chatbots to CRM systems for automated lead capture and customer management.
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
                <DialogTitle>Add CRM Integration</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Connect a new CRM system to your chat platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="integration-name" className="text-white">Integration Name</Label>
                  <Input
                    id="integration-name"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({...newIntegration, name: e.target.value})}
                    placeholder="Sales CRM"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="integration-type" className="text-white">CRM Platform</Label>
                  <Select 
                    value={newIntegration.type} 
                    onValueChange={(value) => setNewIntegration({...newIntegration, type: value as any})}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {crmProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id} className="text-white">
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="instance-url" className="text-white">Instance URL</Label>
                  <Input
                    id="instance-url"
                    value={newIntegration.config.instanceUrl}
                    onChange={(e) => setNewIntegration({
                      ...newIntegration, 
                      config: {...newIntegration.config, instanceUrl: e.target.value}
                    })}
                    placeholder="https://your-company.salesforce.com"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client-id" className="text-white">Client ID</Label>
                    <Input
                      id="client-id"
                      value={newIntegration.config.clientId}
                      onChange={(e) => setNewIntegration({
                        ...newIntegration, 
                        config: {...newIntegration.config, clientId: e.target.value}
                      })}
                      placeholder="Your client ID"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-secret" className="text-white">Client Secret</Label>
                    <Input
                      id="client-secret"
                      type="password"
                      value={newIntegration.config.clientSecret}
                      onChange={(e) => setNewIntegration({
                        ...newIntegration, 
                        config: {...newIntegration.config, clientSecret: e.target.value}
                      })}
                      placeholder="Your client secret"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newIntegration.config.autoCreateLeads}
                      onCheckedChange={(checked) => setNewIntegration({
                        ...newIntegration, 
                        config: {...newIntegration.config, autoCreateLeads: checked}
                      })}
                    />
                    <Label className="text-white">Auto-create leads from chat conversations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newIntegration.config.autoCreateContacts}
                      onCheckedChange={(checked) => setNewIntegration({
                        ...newIntegration, 
                        config: {...newIntegration.config, autoCreateContacts: checked}
                      })}
                    />
                    <Label className="text-white">Auto-create contacts for new users</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newIntegration.config.opportunityTracking}
                      onCheckedChange={(checked) => setNewIntegration({
                        ...newIntegration, 
                        config: {...newIntegration.config, opportunityTracking: checked}
                      })}
                    />
                    <Label className="text-white">Enable opportunity tracking</Label>
                  </div>
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
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Leads</p>
                <p className="text-2xl font-bold text-white">
                  {integrations.reduce((acc, i) => acc + i.metrics.leadsCreated, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Conversion Rate</p>
                <p className="text-2xl font-bold text-white">
                  {(integrations.reduce((acc, i) => acc + i.metrics.conversionRate, 0) / integrations.length || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Avg Deal Size</p>
                <p className="text-2xl font-bold text-white">
                  ${(integrations.reduce((acc, i) => acc + i.metrics.avgDealSize, 0) / integrations.length || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Pipeline Value</p>
                <p className="text-2xl font-bold text-white">
                  ${integrations.reduce((acc, i) => acc + i.metrics.pipelineValue, 0).toLocaleString()}
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
          <TabsTrigger value="mappings" className="text-white data-[state=active]:bg-gray-700">
            Field Mappings
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
                          {crmProviders.find(p => p.id === integration.type)?.name} Integration
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
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Leads Created</p>
                      <p className="text-2xl font-bold text-white">{integration.metrics.leadsCreated}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Opportunities</p>
                      <p className="text-2xl font-bold text-white">{integration.metrics.opportunitiesCreated}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Pipeline Value</p>
                      <p className="text-2xl font-bold text-white">${integration.metrics.pipelineValue.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-300">
                      Last sync: {new Date(integration.lastSync).toLocaleString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="text-white border-gray-600">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" className="text-white border-gray-600">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Field Mappings Tab */}
        <TabsContent value="mappings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Field Mappings</h3>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Mapping
            </Button>
          </div>
          <div className="grid gap-4">
            {leadMappings.map((mapping) => (
              <Card key={mapping.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{mapping.name}</CardTitle>
                      <CardDescription className="text-gray-300">{mapping.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {mapping.required && (
                        <Badge variant="destructive">Required</Badge>
                      )}
                      <Badge variant="outline" className="text-white border-gray-600">
                        {mapping.dataType}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Chatbot Field</p>
                      <p className="text-white font-mono">{mapping.chatbotField}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">CRM Field</p>
                      <p className="text-white font-mono">{mapping.crmField}</p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm" className="text-white border-gray-600">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-white border-gray-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Available Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {crmProviders.map((provider) => (
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
                Test your CRM integration with sample lead data.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="bg-gray-700 border-gray-600">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-white">
                  Integration test completed successfully. Sample lead created in CRM.
                </AlertDescription>
              </Alert>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CrmIntegrations;

