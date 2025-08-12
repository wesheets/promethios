/**
 * Workflow Builder Component
 * 
 * Visual workflow builder for creating automated conversation flows,
 * decision trees, and business process automation.
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
  Play, 
  Pause, 
  Save, 
  Copy, 
  Trash2, 
  Settings, 
  GitBranch, 
  MessageSquare, 
  Clock, 
  Zap, 
  Target, 
  Users, 
  Database, 
  Mail, 
  Phone, 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowDown, 
  MoreVertical,
  Edit,
  Eye,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'response' | 'integration' | 'delay';
  title: string;
  description: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  trigger: string;
  nodes: WorkflowNode[];
  createdAt: string;
  lastModified: string;
  executions: number;
  successRate: number;
}

const WorkflowBuilder: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger: 'user_message'
  });

  const mockWorkflows: Workflow[] = [
    {
      id: 'workflow-1',
      name: 'Customer Support Triage',
      description: 'Automatically categorize and route customer support requests',
      status: 'active',
      trigger: 'user_message',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          title: 'User Message Received',
          description: 'Triggered when a user sends a message',
          config: { event: 'message_received' },
          position: { x: 100, y: 50 },
          connections: ['condition-1']
        },
        {
          id: 'condition-1',
          type: 'condition',
          title: 'Check Message Intent',
          description: 'Analyze message intent using NLP',
          config: { 
            conditions: [
              { field: 'intent', operator: 'equals', value: 'support' },
              { field: 'intent', operator: 'equals', value: 'billing' },
              { field: 'intent', operator: 'equals', value: 'technical' }
            ]
          },
          position: { x: 100, y: 150 },
          connections: ['action-1', 'action-2', 'action-3']
        }
      ],
      createdAt: '2024-01-15T10:00:00Z',
      lastModified: '2024-01-20T14:30:00Z',
      executions: 1247,
      successRate: 94.2
    },
    {
      id: 'workflow-2',
      name: 'Lead Qualification',
      description: 'Qualify and score incoming leads automatically',
      status: 'active',
      trigger: 'form_submission',
      nodes: [],
      createdAt: '2024-01-18T09:15:00Z',
      lastModified: '2024-01-19T16:45:00Z',
      executions: 456,
      successRate: 87.8
    },
    {
      id: 'workflow-3',
      name: 'Onboarding Sequence',
      description: 'Guide new users through the onboarding process',
      status: 'draft',
      trigger: 'user_signup',
      nodes: [],
      createdAt: '2024-01-20T11:30:00Z',
      lastModified: '2024-01-20T11:30:00Z',
      executions: 0,
      successRate: 0
    }
  ];

  const nodeTypes = [
    {
      type: 'trigger',
      name: 'Trigger',
      description: 'Start point for the workflow',
      icon: <Zap className="h-5 w-5 text-yellow-600" />,
      color: 'bg-yellow-100'
    },
    {
      type: 'condition',
      name: 'Condition',
      description: 'Decision point based on data or logic',
      icon: <GitBranch className="h-5 w-5 text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      type: 'action',
      name: 'Action',
      description: 'Perform an operation or task',
      icon: <Target className="h-5 w-5 text-green-600" />,
      color: 'bg-green-100'
    },
    {
      type: 'response',
      name: 'Response',
      description: 'Send a message or response to user',
      icon: <MessageSquare className="h-5 w-5 text-purple-600" />,
      color: 'bg-purple-100'
    },
    {
      type: 'integration',
      name: 'Integration',
      description: 'Connect to external systems or APIs',
      icon: <Globe className="h-5 w-5 text-orange-600" />,
      color: 'bg-orange-100'
    },
    {
      type: 'delay',
      name: 'Delay',
      description: 'Wait for a specified amount of time',
      icon: <Clock className="h-5 w-5 text-gray-600" />,
      color: 'bg-gray-100'
    }
  ];

  const triggerTypes = [
    { value: 'user_message', label: 'User Message' },
    { value: 'form_submission', label: 'Form Submission' },
    { value: 'user_signup', label: 'User Signup' },
    { value: 'scheduled', label: 'Scheduled Event' },
    { value: 'webhook', label: 'Webhook' },
    { value: 'api_call', label: 'API Call' }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setWorkflows(mockWorkflows);
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

  const createWorkflow = () => {
    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: newWorkflow.name,
      description: newWorkflow.description,
      status: 'draft',
      trigger: newWorkflow.trigger,
      nodes: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      executions: 0,
      successRate: 0
    };

    setWorkflows([...workflows, workflow]);
    setSelectedWorkflow(workflow);
    setShowCreateDialog(false);
    setNewWorkflow({ name: '', description: '', trigger: 'user_message' });
  };

  const duplicateWorkflow = (workflow: Workflow) => {
    const duplicated: Workflow = {
      ...workflow,
      id: `workflow-${Date.now()}`,
      name: `${workflow.name} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      executions: 0
    };

    setWorkflows([...workflows, duplicated]);
  };

  const deleteWorkflow = (workflowId: string) => {
    setWorkflows(workflows.filter(w => w.id !== workflowId));
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(null);
    }
  };

  const toggleWorkflowStatus = (workflowId: string) => {
    setWorkflows(workflows.map(w => 
      w.id === workflowId 
        ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' }
        : w
    ));
  };

  const addNode = (type: string) => {
    if (!selectedWorkflow) return;

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: type as any,
      title: `New ${type}`,
      description: `Configure this ${type} node`,
      config: {},
      position: { x: 200, y: 200 },
      connections: []
    };

    const updatedWorkflow = {
      ...selectedWorkflow,
      nodes: [...selectedWorkflow.nodes, newNode],
      lastModified: new Date().toISOString()
    };

    setSelectedWorkflow(updatedWorkflow);
    setWorkflows(workflows.map(w => w.id === selectedWorkflow.id ? updatedWorkflow : w));
  };

  const exportWorkflow = (workflow: Workflow) => {
    console.log('Exporting workflow:', workflow.name);
  };

  const importWorkflow = () => {
    console.log('Importing workflow...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-white">Loading workflow builder...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Workflow Builder</h1>
          <p className="text-gray-300 mt-2">
            Create and manage automated conversation flows and business processes.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={importWorkflow} variant="outline" className="text-white border-gray-600">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Set up a new automated workflow for your chatbot.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workflow-name" className="text-white">Workflow Name</Label>
                  <Input
                    id="workflow-name"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({...newWorkflow, name: e.target.value})}
                    placeholder="Customer Support Workflow"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="workflow-description" className="text-white">Description</Label>
                  <Textarea
                    id="workflow-description"
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({...newWorkflow, description: e.target.value})}
                    placeholder="Describe what this workflow does..."
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="workflow-trigger" className="text-white">Trigger Type</Label>
                  <Select 
                    value={newWorkflow.trigger} 
                    onValueChange={(value) => setNewWorkflow({...newWorkflow, trigger: value})}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {triggerTypes.map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value} className="text-white">
                          {trigger.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createWorkflow} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Workflow List */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Workflows</CardTitle>
              <CardDescription className="text-gray-300">
                Manage your automated workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedWorkflow?.id === workflow.id 
                        ? 'bg-blue-600' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium text-sm">{workflow.name}</h4>
                      <Badge variant={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-xs mb-2">{workflow.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{workflow.executions} runs</span>
                      <span className="text-gray-400">{workflow.successRate}% success</span>
                    </div>
                    <div className="flex space-x-1 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWorkflowStatus(workflow.id);
                        }}
                        className="text-white border-gray-600 h-6 px-2"
                      >
                        {workflow.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateWorkflow(workflow);
                        }}
                        className="text-white border-gray-600 h-6 px-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportWorkflow(workflow);
                        }}
                        className="text-white border-gray-600 h-6 px-2"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWorkflow(workflow.id);
                        }}
                        className="text-white border-gray-600 h-6 px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Editor */}
        <div className="lg:col-span-3">
          {selectedWorkflow ? (
            <Tabs defaultValue="editor" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger value="editor" className="text-white data-[state=active]:bg-gray-700">
                  Visual Editor
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-white data-[state=active]:bg-gray-700">
                  Settings
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-gray-700">
                  Analytics
                </TabsTrigger>
              </TabsList>

              {/* Visual Editor Tab */}
              <TabsContent value="editor" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">{selectedWorkflow.name}</CardTitle>
                        <CardDescription className="text-gray-300">
                          {selectedWorkflow.description}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="text-white border-gray-600">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button variant="outline" size="sm" className="text-white border-gray-600">
                          <Play className="h-4 w-4 mr-2" />
                          Test
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      {/* Node Palette */}
                      <div className="col-span-1">
                        <h4 className="text-white font-medium mb-3">Add Nodes</h4>
                        <div className="space-y-2">
                          {nodeTypes.map((nodeType) => (
                            <Button
                              key={nodeType.type}
                              variant="outline"
                              size="sm"
                              onClick={() => addNode(nodeType.type)}
                              className="w-full justify-start text-white border-gray-600"
                            >
                              <div className={`p-1 rounded mr-2 ${nodeType.color}`}>
                                {nodeType.icon}
                              </div>
                              {nodeType.name}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Canvas */}
                      <div className="col-span-3">
                        <div className="bg-gray-700 rounded-lg p-4 min-h-96 relative">
                          <div className="text-center text-gray-400 mt-20">
                            <GitBranch className="h-12 w-12 mx-auto mb-4" />
                            <p className="text-lg font-medium">Visual Workflow Canvas</p>
                            <p className="text-sm">Drag and drop nodes to build your workflow</p>
                            {selectedWorkflow.nodes.length === 0 && (
                              <p className="text-xs mt-2">Start by adding a trigger node from the palette</p>
                            )}
                          </div>
                          
                          {/* Render existing nodes */}
                          {selectedWorkflow.nodes.map((node) => (
                            <div
                              key={node.id}
                              className="absolute bg-gray-600 border border-gray-500 rounded-lg p-3 cursor-pointer hover:bg-gray-500"
                              style={{ 
                                left: node.position.x, 
                                top: node.position.y,
                                width: '150px'
                              }}
                              onClick={() => {
                                setSelectedNode(node);
                                setShowNodeDialog(true);
                              }}
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <div className={`p-1 rounded ${nodeTypes.find(nt => nt.type === node.type)?.color}`}>
                                  {nodeTypes.find(nt => nt.type === node.type)?.icon}
                                </div>
                                <span className="text-white text-sm font-medium">{node.title}</span>
                              </div>
                              <p className="text-gray-300 text-xs">{node.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Workflow Settings</CardTitle>
                    <CardDescription className="text-gray-300">
                      Configure workflow properties and behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="workflow-name-edit" className="text-white">Name</Label>
                        <Input
                          id="workflow-name-edit"
                          value={selectedWorkflow.name}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="workflow-description-edit" className="text-white">Description</Label>
                        <Textarea
                          id="workflow-description-edit"
                          value={selectedWorkflow.description}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={selectedWorkflow.status === 'active'} />
                        <Label className="text-white">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch />
                        <Label className="text-white">Enable logging</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch />
                        <Label className="text-white">Send notifications on failure</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Play className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-300">Total Executions</p>
                          <p className="text-2xl font-bold text-white">{selectedWorkflow.executions}</p>
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
                          <p className="text-sm font-medium text-gray-300">Success Rate</p>
                          <p className="text-2xl font-bold text-white">{selectedWorkflow.successRate}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-300">Avg Duration</p>
                          <p className="text-2xl font-bold text-white">2.3s</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-12 text-center">
                <GitBranch className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No Workflow Selected</h3>
                <p className="text-gray-300 mb-4">
                  Select a workflow from the list or create a new one to get started.
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Workflow
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Node Configuration Dialog */}
      {selectedNode && (
        <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
          <DialogContent className="bg-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Configure {selectedNode.title}</DialogTitle>
              <DialogDescription className="text-gray-300">
                Set up the properties and behavior for this node.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="node-title" className="text-white">Title</Label>
                <Input
                  id="node-title"
                  value={selectedNode.title}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="node-description" className="text-white">Description</Label>
                <Textarea
                  id="node-description"
                  value={selectedNode.description}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WorkflowBuilder;

