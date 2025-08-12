import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, Edit, Trash2, Play, Pause, Settings, Zap, 
  AlertTriangle, MessageSquare, Clock, Users, Target,
  ArrowRight, CheckCircle, XCircle, Activity, Brain
} from 'lucide-react';

interface AutomationManagementProps {
  className?: string;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  actionType: string;
  enabled: boolean;
  priority: number;
  conditions: any;
  actions: any;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  steps: WorkflowStep[];
  triggerEvents: string[];
  createdAt: string;
  lastExecuted?: string;
  executionCount: number;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  conditions?: any;
  actions?: any;
  nextSteps?: string[];
}

interface EscalationRule {
  id: string;
  name: string;
  conditions: any;
  target: string;
  priority: string;
  enabled: boolean;
  autoAssign: boolean;
  notificationChannels: string[];
  createdAt: string;
  triggerCount: number;
}

const AutomationManagement: React.FC<AutomationManagementProps> = ({ className = '' }) => {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationRule | null>(null);
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [isCreateWorkflowOpen, setIsCreateWorkflowOpen] = useState(false);
  const [isCreateEscalationOpen, setIsCreateEscalationOpen] = useState(false);

  // Mock data - in real implementation, this would come from the automation service
  const mockAutomationRules: AutomationRule[] = [
    {
      id: 'rule-1',
      name: 'High Response Time Alert',
      description: 'Alert when response time exceeds 5 seconds',
      triggerType: 'response_time',
      actionType: 'send_auto_response',
      enabled: true,
      priority: 2,
      conditions: { threshold: 5.0, operator: 'greater_than' },
      actions: { template: 'apology_slow_response' },
      createdAt: '2024-01-15T10:00:00Z',
      lastTriggered: '2024-01-20T14:30:00Z',
      triggerCount: 23
    },
    {
      id: 'rule-2',
      name: 'Low Trust Score Escalation',
      description: 'Escalate when trust score drops below 0.3',
      triggerType: 'trust_score',
      actionType: 'escalate_to_human',
      enabled: true,
      priority: 1,
      conditions: { threshold: 0.3, operator: 'less_than' },
      actions: { reason: 'low_trust_score' },
      createdAt: '2024-01-10T09:00:00Z',
      lastTriggered: '2024-01-19T16:45:00Z',
      triggerCount: 12
    },
    {
      id: 'rule-3',
      name: 'Negative Sentiment Response',
      description: 'Respond empathetically to negative sentiment',
      triggerType: 'sentiment_score',
      actionType: 'send_auto_response',
      enabled: true,
      priority: 3,
      conditions: { threshold: -0.5, operator: 'less_than' },
      actions: { template: 'empathy_response' },
      createdAt: '2024-01-12T11:00:00Z',
      lastTriggered: '2024-01-20T12:15:00Z',
      triggerCount: 45
    }
  ];

  const mockWorkflows: Workflow[] = [
    {
      id: 'workflow-1',
      name: 'Lead Qualification Workflow',
      description: 'Automatically qualify and route sales leads',
      enabled: true,
      triggerEvents: ['intent_detected:purchase', 'keyword_match:pricing'],
      steps: [
        {
          id: 'step-1',
          name: 'Collect Lead Information',
          type: 'action',
          actions: [
            { type: 'send_message', template: 'lead_qualification_questions' },
            { type: 'set_context', key: 'lead_qualification', value: true }
          ],
          nextSteps: ['step-2']
        },
        {
          id: 'step-2',
          name: 'Evaluate Lead Quality',
          type: 'condition',
          conditions: { lead_score: { operator: 'greater_than', value: 70 } },
          nextSteps: ['step-3', 'step-4']
        },
        {
          id: 'step-3',
          name: 'Route to Sales Team',
          type: 'action',
          actions: [
            { type: 'create_crm_lead' },
            { type: 'notify_sales_team' }
          ]
        }
      ],
      createdAt: '2024-01-08T08:00:00Z',
      lastExecuted: '2024-01-20T15:20:00Z',
      executionCount: 67
    },
    {
      id: 'workflow-2',
      name: 'Customer Support Triage',
      description: 'Automatically categorize and route support requests',
      enabled: true,
      triggerEvents: ['intent_detected:support', 'keyword_match:help'],
      steps: [
        {
          id: 'step-1',
          name: 'Categorize Issue',
          type: 'condition',
          conditions: { intent_confidence: { operator: 'greater_than', value: 0.8 } },
          nextSteps: ['step-2', 'step-3']
        },
        {
          id: 'step-2',
          name: 'Route to Specialist',
          type: 'action',
          actions: [
            { type: 'route_to_specialist' },
            { type: 'create_ticket' }
          ]
        }
      ],
      createdAt: '2024-01-14T13:00:00Z',
      lastExecuted: '2024-01-20T11:45:00Z',
      executionCount: 134
    }
  ];

  const mockEscalationRules: EscalationRule[] = [
    {
      id: 'escalation-1',
      name: 'Frustrated User Escalation',
      conditions: {
        sentiment_score: { operator: 'less_than', value: -0.7 },
        message_count: { operator: 'greater_than', value: 5 }
      },
      target: 'human_agent',
      priority: 'high',
      enabled: true,
      autoAssign: true,
      notificationChannels: ['email', 'slack'],
      createdAt: '2024-01-05T07:00:00Z',
      triggerCount: 18
    },
    {
      id: 'escalation-2',
      name: 'Complex Query Escalation',
      conditions: {
        confidence_score: { operator: 'less_than', value: 0.4 },
        message_count: { operator: 'greater_than', value: 3 }
      },
      target: 'specialist',
      priority: 'medium',
      enabled: true,
      autoAssign: false,
      notificationChannels: ['email'],
      createdAt: '2024-01-07T12:00:00Z',
      triggerCount: 31
    }
  ];

  useEffect(() => {
    // Load automation data
    setAutomationRules(mockAutomationRules);
    setWorkflows(mockWorkflows);
    setEscalationRules(mockEscalationRules);
  }, []);

  const toggleRuleEnabled = (ruleId: string) => {
    setAutomationRules(rules =>
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const toggleWorkflowEnabled = (workflowId: string) => {
    setWorkflows(workflows =>
      workflows.map(workflow =>
        workflow.id === workflowId ? { ...workflow, enabled: !workflow.enabled } : workflow
      )
    );
  };

  const toggleEscalationEnabled = (escalationId: string) => {
    setEscalationRules(rules =>
      rules.map(rule =>
        rule.id === escalationId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const getPriorityColor = (priority: number | string) => {
    if (typeof priority === 'number') {
      return priority === 1 ? 'destructive' : priority === 2 ? 'secondary' : 'outline';
    }
    return priority === 'high' ? 'destructive' : priority === 'medium' ? 'secondary' : 'outline';
  };

  const getTriggerTypeIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'response_time':
        return <Clock className="h-4 w-4" />;
      case 'trust_score':
        return <CheckCircle className="h-4 w-4" />;
      case 'sentiment_score':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_auto_response':
        return <MessageSquare className="h-4 w-4" />;
      case 'escalate_to_human':
        return <Users className="h-4 w-4" />;
      case 'create_ticket':
        return <Target className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Automation Management</h2>
          <p className="text-muted-foreground">
            Configure intelligent automation rules, workflows, and escalation policies
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            View Logs
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationRules.filter(r => r.enabled).length}</div>
            <p className="text-xs text-muted-foreground">
              {automationRules.length} total rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.filter(w => w.enabled).length}</div>
            <p className="text-xs text-muted-foreground">
              {workflows.length} total workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalations Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              3.2% escalation rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Efficiency</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              Success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Automation Tabs */}
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="escalations">Escalation Rules</TabsTrigger>
        </TabsList>

        {/* Automation Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Automation Rules</h3>
            <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Automation Rule</DialogTitle>
                  <DialogDescription>
                    Define conditions and actions for automatic responses
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rule-name">Rule Name</Label>
                      <Input id="rule-name" placeholder="Enter rule name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rule-priority">Priority</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">High (1)</SelectItem>
                          <SelectItem value="2">Medium (2)</SelectItem>
                          <SelectItem value="3">Low (3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rule-description">Description</Label>
                    <Textarea id="rule-description" placeholder="Describe what this rule does" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="trigger-type">Trigger Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="response_time">Response Time</SelectItem>
                          <SelectItem value="trust_score">Trust Score</SelectItem>
                          <SelectItem value="sentiment_score">Sentiment Score</SelectItem>
                          <SelectItem value="keyword_match">Keyword Match</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="action-type">Action Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="send_auto_response">Send Auto Response</SelectItem>
                          <SelectItem value="escalate_to_human">Escalate to Human</SelectItem>
                          <SelectItem value="create_ticket">Create Ticket</SelectItem>
                          <SelectItem value="collect_feedback">Collect Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateRuleOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateRuleOpen(false)}>
                    Create Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {automationRules.map((rule) => (
              <Card key={rule.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        {getTriggerTypeIcon(rule.triggerType)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{rule.name}</CardTitle>
                        <CardDescription>{rule.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityColor(rule.priority)}>
                        Priority {rule.priority}
                      </Badge>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRuleEnabled(rule.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium">Trigger</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getTriggerTypeIcon(rule.triggerType)}
                        <span className="text-sm text-muted-foreground">
                          {rule.triggerType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Action</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getActionTypeIcon(rule.actionType)}
                        <span className="text-sm text-muted-foreground">
                          {rule.actionType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Triggered</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rule.triggerCount} times
                      </p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Created {new Date(rule.createdAt).toLocaleDateString()}
                      {rule.lastTriggered && (
                        <span> • Last triggered {new Date(rule.lastTriggered).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
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

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Workflows</h3>
            <Dialog open={isCreateWorkflowOpen} onOpenChange={setIsCreateWorkflowOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create Workflow</DialogTitle>
                  <DialogDescription>
                    Design a multi-step automation workflow
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="workflow-name">Workflow Name</Label>
                      <Input id="workflow-name" placeholder="Enter workflow name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workflow-trigger">Trigger Events</Label>
                      <Input id="workflow-trigger" placeholder="e.g., intent_detected:purchase" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workflow-description">Description</Label>
                    <Textarea id="workflow-description" placeholder="Describe the workflow purpose" />
                  </div>
                  <div className="space-y-4">
                    <Label>Workflow Steps</Label>
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          1
                        </div>
                        <div className="flex-1">
                          <Input placeholder="Step name" />
                        </div>
                        <Select>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Step type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="action">Action</SelectItem>
                            <SelectItem value="condition">Condition</SelectItem>
                            <SelectItem value="delay">Delay</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateWorkflowOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateWorkflowOpen(false)}>
                    Create Workflow
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{workflow.name}</CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={workflow.enabled ? "default" : "secondary"}>
                        {workflow.enabled ? "Active" : "Inactive"}
                      </Badge>
                      <Switch
                        checked={workflow.enabled}
                        onCheckedChange={() => toggleWorkflowEnabled(workflow.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Steps</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {workflow.steps.length} steps
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Executions</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {workflow.executionCount} times
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Last Executed</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {workflow.lastExecuted ? new Date(workflow.lastExecuted).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Workflow Steps</p>
                      <div className="flex items-center space-x-2 overflow-x-auto">
                        {workflow.steps.map((step, index) => (
                          <React.Fragment key={step.id}>
                            <div className="flex items-center space-x-2 min-w-0">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                {index + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">{step.name}</p>
                                <p className="text-xs text-muted-foreground">{step.type}</p>
                              </div>
                            </div>
                            {index < workflow.steps.length - 1 && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Created {new Date(workflow.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          Test
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
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

        {/* Escalation Rules Tab */}
        <TabsContent value="escalations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Escalation Rules</h3>
            <Dialog open={isCreateEscalationOpen} onOpenChange={setIsCreateEscalationOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Escalation Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Escalation Rule</DialogTitle>
                  <DialogDescription>
                    Define when and how to escalate conversations to human agents
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="escalation-name">Rule Name</Label>
                      <Input id="escalation-name" placeholder="Enter rule name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="escalation-priority">Priority</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="escalation-target">Escalation Target</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="human_agent">Human Agent</SelectItem>
                          <SelectItem value="specialist">Specialist</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notification-channels">Notification Channels</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select channels" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="slack">Slack</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Escalation Conditions</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="auto-assign" />
                        <Label htmlFor="auto-assign">Auto-assign to available agent</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="include-context" />
                        <Label htmlFor="include-context">Include conversation context</Label>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateEscalationOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateEscalationOpen(false)}>
                    Create Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {escalationRules.map((rule) => (
              <Card key={rule.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{rule.name}</CardTitle>
                        <CardDescription>
                          Escalates to {rule.target.replace('_', ' ')} with {rule.priority} priority
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityColor(rule.priority)}>
                        {rule.priority}
                      </Badge>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleEscalationEnabled(rule.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium">Target</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rule.target.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Auto-assign</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rule.autoAssign ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Triggered</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rule.triggerCount} times
                      </p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-muted-foreground">
                        Notifications: {rule.notificationChannels.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
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
      </Tabs>
    </div>
  );
};

export default AutomationManagement;

