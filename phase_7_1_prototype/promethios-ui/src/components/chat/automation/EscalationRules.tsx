/**
 * Escalation Rules Component
 * 
 * Comprehensive escalation rule management for automated escalation
 * based on conditions, priorities, and business logic.
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
  ArrowUp, 
  Clock, 
  AlertTriangle, 
  Users, 
  Settings, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Copy, 
  Target, 
  Zap, 
  Bell, 
  Mail, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Download,
  Filter,
  TrendingUp,
  Activity,
  Timer,
  UserCheck
} from 'lucide-react';

interface EscalationRule {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'critical';
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  triggers: number;
  successRate: number;
  createdAt: string;
  lastModified: string;
}

interface EscalationCondition {
  id: string;
  type: 'time' | 'sentiment' | 'keywords' | 'attempts' | 'category' | 'custom';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: string | number;
  description: string;
}

interface EscalationAction {
  id: string;
  type: 'assign_agent' | 'notify_manager' | 'send_email' | 'create_ticket' | 'escalate_priority' | 'custom';
  config: Record<string, any>;
  description: string;
}

interface EscalationEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  conversationId: string;
  triggeredAt: string;
  status: 'pending' | 'completed' | 'failed';
  actions: string[];
  resolution: string;
}

const EscalationRules: React.FC = () => {
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [events, setEvents] = useState<EscalationEvent[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState<EscalationRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    priority: 'medium' as const,
    conditions: [] as EscalationCondition[],
    actions: [] as EscalationAction[]
  });

  const mockRules: EscalationRule[] = [
    {
      id: 'rule-1',
      name: 'High Priority Customer Escalation',
      description: 'Escalate conversations from VIP customers or high-value accounts',
      status: 'active',
      priority: 'high',
      conditions: [
        {
          id: 'cond-1',
          type: 'category',
          operator: 'equals',
          value: 'vip_customer',
          description: 'Customer is marked as VIP'
        },
        {
          id: 'cond-2',
          type: 'time',
          operator: 'greater_than',
          value: 300,
          description: 'Conversation duration > 5 minutes'
        }
      ],
      actions: [
        {
          id: 'action-1',
          type: 'assign_agent',
          config: { agentId: 'senior-agent-1', department: 'vip-support' },
          description: 'Assign to senior VIP support agent'
        },
        {
          id: 'action-2',
          type: 'notify_manager',
          config: { managerId: 'manager-1', method: 'email' },
          description: 'Notify VIP support manager'
        }
      ],
      triggers: 47,
      successRate: 94.7,
      createdAt: '2024-01-15T10:00:00Z',
      lastModified: '2024-01-20T14:30:00Z'
    },
    {
      id: 'rule-2',
      name: 'Negative Sentiment Detection',
      description: 'Escalate conversations with negative sentiment or frustration',
      status: 'active',
      priority: 'medium',
      conditions: [
        {
          id: 'cond-3',
          type: 'sentiment',
          operator: 'less_than',
          value: -0.5,
          description: 'Sentiment score below -0.5'
        },
        {
          id: 'cond-4',
          type: 'keywords',
          operator: 'contains',
          value: 'frustrated,angry,disappointed',
          description: 'Contains negative keywords'
        }
      ],
      actions: [
        {
          id: 'action-3',
          type: 'assign_agent',
          config: { department: 'customer-success', skillLevel: 'experienced' },
          description: 'Assign to experienced customer success agent'
        }
      ],
      triggers: 123,
      successRate: 87.2,
      createdAt: '2024-01-18T09:15:00Z',
      lastModified: '2024-01-19T16:45:00Z'
    },
    {
      id: 'rule-3',
      name: 'Technical Issue Escalation',
      description: 'Escalate complex technical issues to specialized support',
      status: 'active',
      priority: 'medium',
      conditions: [
        {
          id: 'cond-5',
          type: 'category',
          operator: 'equals',
          value: 'technical_support',
          description: 'Issue category is technical support'
        },
        {
          id: 'cond-6',
          type: 'attempts',
          operator: 'greater_than',
          value: 3,
          description: 'More than 3 resolution attempts'
        }
      ],
      actions: [
        {
          id: 'action-4',
          type: 'create_ticket',
          config: { system: 'jira', project: 'TECH', priority: 'high' },
          description: 'Create high-priority technical ticket'
        },
        {
          id: 'action-5',
          type: 'assign_agent',
          config: { department: 'technical-support', specialization: 'advanced' },
          description: 'Assign to advanced technical support'
        }
      ],
      triggers: 89,
      successRate: 91.0,
      createdAt: '2024-01-20T11:30:00Z',
      lastModified: '2024-01-20T11:30:00Z'
    }
  ];

  const mockEvents: EscalationEvent[] = [
    {
      id: 'event-1',
      ruleId: 'rule-1',
      ruleName: 'High Priority Customer Escalation',
      conversationId: 'conv-1247',
      triggeredAt: '2024-01-20T15:30:00Z',
      status: 'completed',
      actions: ['Assigned to senior agent', 'Manager notified'],
      resolution: 'Successfully escalated to VIP support team'
    },
    {
      id: 'event-2',
      ruleId: 'rule-2',
      ruleName: 'Negative Sentiment Detection',
      conversationId: 'conv-1248',
      triggeredAt: '2024-01-20T14:45:00Z',
      status: 'completed',
      actions: ['Assigned to customer success'],
      resolution: 'Customer satisfaction improved'
    },
    {
      id: 'event-3',
      ruleId: 'rule-3',
      ruleName: 'Technical Issue Escalation',
      conversationId: 'conv-1249',
      triggeredAt: '2024-01-20T13:20:00Z',
      status: 'pending',
      actions: ['Ticket created', 'Technical team assigned'],
      resolution: 'Awaiting technical resolution'
    }
  ];

  const conditionTypes = [
    { value: 'time', label: 'Time-based', description: 'Based on conversation duration or wait time' },
    { value: 'sentiment', label: 'Sentiment', description: 'Based on customer sentiment analysis' },
    { value: 'keywords', label: 'Keywords', description: 'Based on specific words or phrases' },
    { value: 'attempts', label: 'Attempts', description: 'Based on number of resolution attempts' },
    { value: 'category', label: 'Category', description: 'Based on conversation category or type' },
    { value: 'custom', label: 'Custom', description: 'Custom condition logic' }
  ];

  const actionTypes = [
    { value: 'assign_agent', label: 'Assign Agent', description: 'Assign to specific agent or department' },
    { value: 'notify_manager', label: 'Notify Manager', description: 'Send notification to manager' },
    { value: 'send_email', label: 'Send Email', description: 'Send email notification' },
    { value: 'create_ticket', label: 'Create Ticket', description: 'Create support ticket in external system' },
    { value: 'escalate_priority', label: 'Escalate Priority', description: 'Increase conversation priority' },
    { value: 'custom', label: 'Custom Action', description: 'Custom escalation action' }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setRules(mockRules);
      setEvents(mockEvents);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-600';
      case 'medium':
        return 'bg-yellow-600';
      case 'low':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const createRule = () => {
    const rule: EscalationRule = {
      id: `rule-${Date.now()}`,
      name: newRule.name,
      description: newRule.description,
      status: 'draft',
      priority: newRule.priority,
      conditions: newRule.conditions,
      actions: newRule.actions,
      triggers: 0,
      successRate: 0,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    setRules([...rules, rule]);
    setShowCreateDialog(false);
    setNewRule({
      name: '',
      description: '',
      priority: 'medium',
      conditions: [],
      actions: []
    });
  };

  const toggleRuleStatus = (ruleId: string) => {
    setRules(rules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active' }
        : rule
    ));
  };

  const duplicateRule = (rule: EscalationRule) => {
    const duplicated: EscalationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (Copy)`,
      status: 'draft',
      triggers: 0,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    setRules([...rules, duplicated]);
  };

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(rule => rule.id !== ruleId));
  };

  const exportRules = () => {
    console.log('Exporting escalation rules...');
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
        <span className="ml-2 text-lg text-white">Loading escalation rules...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Escalation Rules</h1>
          <p className="text-gray-300 mt-2">
            Configure automated escalation rules based on conditions and business logic.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={refreshData} variant="outline" className="text-white border-gray-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportRules} variant="outline" className="text-white border-gray-600">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Create Escalation Rule</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Set up a new automated escalation rule for your chat system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rule-name" className="text-white">Rule Name</Label>
                  <Input
                    id="rule-name"
                    value={newRule.name}
                    onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                    placeholder="VIP Customer Escalation"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="rule-description" className="text-white">Description</Label>
                  <Textarea
                    id="rule-description"
                    value={newRule.description}
                    onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                    placeholder="Describe when this rule should trigger..."
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="rule-priority" className="text-white">Priority Level</Label>
                  <Select 
                    value={newRule.priority} 
                    onValueChange={(value) => setNewRule({...newRule, priority: value as any})}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="low" className="text-white">Low Priority</SelectItem>
                      <SelectItem value="medium" className="text-white">Medium Priority</SelectItem>
                      <SelectItem value="high" className="text-white">High Priority</SelectItem>
                      <SelectItem value="critical" className="text-white">Critical Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createRule} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
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
                <ArrowUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Active Rules</p>
                <p className="text-2xl font-bold text-white">
                  {rules.filter(r => r.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Triggers</p>
                <p className="text-2xl font-bold text-white">
                  {rules.reduce((acc, rule) => acc + rule.triggers, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Success Rate</p>
                <p className="text-2xl font-bold text-white">
                  {(rules.reduce((acc, rule) => acc + rule.successRate, 0) / rules.length || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Recent Events</p>
                <p className="text-2xl font-bold text-white">
                  {events.filter(e => new Date(e.triggeredAt) > new Date(Date.now() - 24*60*60*1000)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="rules" className="text-white data-[state=active]:bg-gray-700">
            Escalation Rules
          </TabsTrigger>
          <TabsTrigger value="events" className="text-white data-[state=active]:bg-gray-700">
            Recent Events
          </TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(rule.priority)}`}></div>
                      <div>
                        <CardTitle className="text-white">{rule.name}</CardTitle>
                        <CardDescription className="text-gray-300">{rule.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(rule.status)}>
                        {rule.status}
                      </Badge>
                      <Badge className={getPriorityColor(rule.priority)}>
                        {rule.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Conditions</p>
                      <p className="text-2xl font-bold text-white">{rule.conditions.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Actions</p>
                      <p className="text-2xl font-bold text-white">{rule.actions.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Triggers</p>
                      <p className="text-2xl font-bold text-white">{rule.triggers}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Success Rate</p>
                      <p className="text-2xl font-bold text-white">{rule.successRate}%</p>
                    </div>
                  </div>
                  
                  {/* Conditions */}
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2">Conditions:</h4>
                    <div className="space-y-1">
                      {rule.conditions.map((condition) => (
                        <div key={condition.id} className="text-sm text-gray-300 bg-gray-700 p-2 rounded">
                          {condition.description}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2">Actions:</h4>
                    <div className="space-y-1">
                      {rule.actions.map((action) => (
                        <div key={action.id} className="text-sm text-gray-300 bg-gray-700 p-2 rounded">
                          {action.description}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-300">
                      Last modified: {new Date(rule.lastModified).toLocaleString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRuleStatus(rule.id)}
                        className="text-white border-gray-600"
                      >
                        {rule.status === 'active' ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                        {rule.status === 'active' ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRule(rule);
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
                        onClick={() => duplicateRule(rule)}
                        className="text-white border-gray-600"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                        className="text-white border-gray-600"
                      >
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

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="grid gap-4">
            {events.map((event) => (
              <Card key={event.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{event.ruleName}</CardTitle>
                      <CardDescription className="text-gray-300">
                        Conversation ID: {event.conversationId}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getEventStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                      <span className="text-gray-400 text-sm">
                        {new Date(event.triggeredAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-white font-medium mb-1">Actions Taken:</h4>
                      <div className="space-y-1">
                        {event.actions.map((action, index) => (
                          <div key={index} className="text-sm text-gray-300 bg-gray-700 p-2 rounded flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            {action}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Resolution:</h4>
                      <p className="text-sm text-gray-300">{event.resolution}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Rule Dialog */}
      {selectedRule && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl bg-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Edit Escalation Rule: {selectedRule.name}</DialogTitle>
              <DialogDescription className="text-gray-300">
                Modify the conditions and actions for this escalation rule.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-rule-name" className="text-white">Rule Name</Label>
                  <Input
                    id="edit-rule-name"
                    value={selectedRule.name}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rule-priority" className="text-white">Priority</Label>
                  <Select value={selectedRule.priority}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="low" className="text-white">Low Priority</SelectItem>
                      <SelectItem value="medium" className="text-white">Medium Priority</SelectItem>
                      <SelectItem value="high" className="text-white">High Priority</SelectItem>
                      <SelectItem value="critical" className="text-white">Critical Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-rule-description" className="text-white">Description</Label>
                <Textarea
                  id="edit-rule-description"
                  value={selectedRule.description}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="flex space-x-2">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Settings className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="text-white border-gray-600">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EscalationRules;

