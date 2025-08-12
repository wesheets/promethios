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
  Webhook,
  Activity,
  TrendingUp,
  Shield,
  Database
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error' | 'testing';
  enabled: boolean;
  priority: number;
  lastHealthCheck?: string;
  config: Record<string, any>;
  tags: string[];
  metadata: Record<string, any>;
}

interface IntegrationResult {
  integration_id: string;
  integration_type: string;
  success: boolean;
  result_data?: Record<string, any>;
  error_message?: string;
  execution_time: number;
}

const BusinessSystemIntegrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [healthCheckResults, setHealthCheckResults] = useState<Record<string, boolean>>({});
  const [operationResults, setOperationResults] = useState<IntegrationResult[]>([]);
  
  // Form states
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    type: 'salesforce',
    config: {},
    enabled: true,
    priority: 1,
    tags: [] as string[],
    metadata: {}
  });
  
  const [testOperation, setTestOperation] = useState({
    type: 'lead_capture',
    data: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      company: 'Test Company'
    }
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat/integrations/status');
      const result = await response.json();
      
      if (result.success) {
        const integrationsArray = Object.entries(result.data.integrations || {}).map(([id, data]: [string, any]) => ({
          id,
          ...data
        }));
        setIntegrations(integrationsArray);
      }
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const registerIntegration = async () => {
    try {
      const response = await fetch('/api/chat/integrations/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIntegration)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setShowAddDialog(false);
        setNewIntegration({
          name: '',
          type: 'salesforce',
          config: {},
          enabled: true,
          priority: 1,
          tags: [],
          metadata: {}
        });
        await loadIntegrations();
      } else {
        alert('Failed to register integration: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to register integration:', error);
      alert('Failed to register integration');
    }
  };

  const toggleIntegration = async (integrationId: string, activate: boolean) => {
    try {
      const endpoint = activate ? 'activate' : 'deactivate';
      const response = await fetch(`/api/chat/integrations/${endpoint}/${integrationId}`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadIntegrations();
      } else {
        alert(`Failed to ${endpoint} integration: ` + result.error);
      }
    } catch (error) {
      console.error(`Failed to ${activate ? 'activate' : 'deactivate'} integration:`, error);
    }
  };

  const runHealthCheck = async () => {
    try {
      const response = await fetch('/api/chat/integrations/health-check', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setHealthCheckResults(result.results);
        await loadIntegrations();
      }
    } catch (error) {
      console.error('Failed to run health check:', error);
    }
  };

  const testIntegrationOperation = async () => {
    try {
      let endpoint = '';
      let payload = {};
      
      switch (testOperation.type) {
        case 'lead_capture':
          endpoint = '/api/chat/integrations/lead-capture';
          payload = {
            ...testOperation.data,
            chat_context: {
              conversation_id: 'test_conversation',
              user_id: 'test_user',
              agent_id: 'test_agent',
              messages: [
                { sender: 'user', content: 'I would like to learn more about your services', timestamp: new Date().toISOString() }
              ]
            }
          };
          break;
        case 'support_ticket':
          endpoint = '/api/chat/integrations/support-ticket';
          payload = {
            subject: 'Test Support Ticket',
            description: 'This is a test support ticket created from the integration test.',
            requester_email: testOperation.data.email,
            priority: 'normal',
            chat_context: {
              conversation_id: 'test_conversation',
              user_id: 'test_user',
              agent_id: 'test_agent',
              messages: [
                { sender: 'user', content: 'I need help with your product', timestamp: new Date().toISOString() }
              ]
            }
          };
          break;
        case 'webhook_notification':
          endpoint = '/api/chat/integrations/webhook-notification';
          payload = {
            event_type: 'test_event',
            data: testOperation.data,
            chat_context: {
              conversation_id: 'test_conversation',
              user_id: 'test_user',
              agent_id: 'test_agent',
              messages: []
            }
          };
          break;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setOperationResults(result.results);
        setShowTestDialog(false);
      } else {
        alert('Test operation failed: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to test integration operation:', error);
      alert('Test operation failed');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'testing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'salesforce':
        return <Database className="h-5 w-5 text-blue-600" />;
      case 'hubspot':
        return <TrendingUp className="h-5 w-5 text-orange-600" />;
      case 'zendesk':
        return <Ticket className="h-5 w-5 text-green-600" />;
      case 'webhook':
        return <Webhook className="h-5 w-5 text-purple-600" />;
      default:
        return <ExternalLink className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading integrations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Business System Integrations</h1>
          <p className="text-gray-300 mt-2">
            Connect your chatbots to CRM, helpdesk, and other business systems for seamless data flow.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={runHealthCheck} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Health Check
          </Button>
          <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Test Operations
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Test Integration Operations</DialogTitle>
                <DialogDescription>
                  Test your integrations with sample data to ensure they're working correctly.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="operation-type">Operation Type</Label>
                  <Select 
                    value={testOperation.type} 
                    onValueChange={(value) => setTestOperation({...testOperation, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead_capture">Lead Capture</SelectItem>
                      <SelectItem value="support_ticket">Support Ticket</SelectItem>
                      <SelectItem value="webhook_notification">Webhook Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="test-data">Test Data (JSON)</Label>
                  <Textarea
                    value={JSON.stringify(testOperation.data, null, 2)}
                    onChange={(e) => {
                      try {
                        const data = JSON.parse(e.target.value);
                        setTestOperation({...testOperation, data});
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
                <Button onClick={testIntegrationOperation} className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Run Test
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Integration</DialogTitle>
                <DialogDescription>
                  Connect a new business system to your chat platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="integration-name">Integration Name</Label>
                  <Input
                    id="integration-name"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({...newIntegration, name: e.target.value})}
                    placeholder="My Salesforce CRM"
                  />
                </div>
                <div>
                  <Label htmlFor="integration-type">Integration Type</Label>
                  <Select 
                    value={newIntegration.type} 
                    onValueChange={(value) => setNewIntegration({...newIntegration, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salesforce">Salesforce CRM</SelectItem>
                      <SelectItem value="hubspot">HubSpot</SelectItem>
                      <SelectItem value="zendesk">Zendesk</SelectItem>
                      <SelectItem value="webhook">Custom Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="integration-config">Configuration (JSON)</Label>
                  <Textarea
                    id="integration-config"
                    value={JSON.stringify(newIntegration.config, null, 2)}
                    onChange={(e) => {
                      try {
                        const config = JSON.parse(e.target.value);
                        setNewIntegration({...newIntegration, config});
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={6}
                    className="font-mono text-sm"
                    placeholder='{"api_key": "your_api_key", "instance_url": "https://your-instance.salesforce.com"}'
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newIntegration.enabled}
                    onCheckedChange={(checked) => setNewIntegration({...newIntegration, enabled: checked})}
                  />
                  <Label>Enable integration immediately</Label>
                </div>
                <Button onClick={registerIntegration} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Register Integration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Integration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Integrations</p>
                <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {integrations.filter(i => i.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {integrations.filter(i => i.status === 'error').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Governance</p>
                <p className="text-2xl font-bold text-gray-900">100%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {operationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Test Results</CardTitle>
            <CardDescription>
              Results from the most recent integration operation test.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {operationResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getIntegrationIcon(result.integration_type)}
                    <div>
                      <p className="font-medium">{result.integration_id}</p>
                      <p className="text-sm text-gray-600">{result.integration_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {result.execution_time.toFixed(2)}s
                    </span>
                    {result.error_message && (
                      <span className="text-sm text-red-600" title={result.error_message}>
                        Error
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integrations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getIntegrationIcon(integration.type)}
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <CardDescription className="capitalize">
                      {integration.type} Integration
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(integration.status)}
                  <Badge className={getStatusColor(integration.status)}>
                    {integration.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Integration Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Priority</p>
                    <p className="font-medium">{integration.priority}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Enabled</p>
                    <p className="font-medium">{integration.enabled ? 'Yes' : 'No'}</p>
                  </div>
                  {integration.lastHealthCheck && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Last Health Check</p>
                      <p className="font-medium text-sm">
                        {new Date(integration.lastHealthCheck).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {integration.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {integration.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  {integration.status === 'active' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleIntegration(integration.id, false)}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => toggleIntegration(integration.id, true)}
                    >
                      Activate
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {integrations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Integrations Yet</h3>
            <p className="text-gray-600 mb-6">
              Connect your first business system to start capturing leads and managing support tickets.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Integration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Configuration Dialog */}
      {selectedIntegration && (
        <Dialog open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Configure {selectedIntegration.name}</DialogTitle>
              <DialogDescription>
                Manage settings and configuration for this integration.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="logs">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Integration Name</Label>
                    <Input value={selectedIntegration.name} readOnly />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Input value={selectedIntegration.type} readOnly />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Input type="number" value={selectedIntegration.priority} readOnly />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Input value={selectedIntegration.status} readOnly />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="config" className="space-y-4">
                <div>
                  <Label>Configuration (JSON)</Label>
                  <Textarea
                    value={JSON.stringify(selectedIntegration.config, null, 2)}
                    readOnly
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>
              <TabsContent value="logs" className="space-y-4">
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    Integration activity logs and governance audit trail will be displayed here.
                    All operations are monitored and logged for compliance.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BusinessSystemIntegrations;

