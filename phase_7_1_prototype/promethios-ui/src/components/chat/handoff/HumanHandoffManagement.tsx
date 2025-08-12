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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, UserCheck, MessageSquare, Clock, Phone, Mail, 
  Calendar, Target, TrendingUp, AlertCircle, CheckCircle,
  Star, Award, Briefcase, DollarSign, ArrowRight, Plus,
  Edit, Trash2, Eye, Filter, Search, Download
} from 'lucide-react';

interface HumanHandoffManagementProps {
  className?: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  status: 'available' | 'busy' | 'away' | 'offline';
  specializations: string[];
  currentConversations: number;
  maxConversations: number;
  performanceRating: number;
  totalConversations: number;
  avgResolutionTime: number;
  satisfactionScore: number;
}

interface HandoffRequest {
  id: string;
  conversationId: string;
  userId: string;
  chatbotId: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved';
  createdAt: string;
  assignedAgent?: string;
  waitTime: number;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'new' | 'qualified' | 'contacted' | 'interested' | 'proposal' | 'closed_won' | 'closed_lost';
  score: number;
  source: string;
  priority: 'hot' | 'warm' | 'cold';
  estimatedValue: number;
  assignedSalesRep: string;
  createdAt: string;
  lastContact?: string;
  nextFollowup?: string;
}

interface Opportunity {
  id: string;
  leadId: string;
  name: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate: string;
  assignedTo: string;
}

const HumanHandoffManagement: React.FC<HumanHandoffManagementProps> = ({ className = '' }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [handoffRequests, setHandoffRequests] = useState<HandoffRequest[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - in real implementation, this would come from the services
  const mockAgents: Agent[] = [
    {
      id: 'agent_001',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      status: 'available',
      specializations: ['customer_support', 'technical_issues'],
      currentConversations: 3,
      maxConversations: 5,
      performanceRating: 4.5,
      totalConversations: 234,
      avgResolutionTime: 12.5,
      satisfactionScore: 4.3
    },
    {
      id: 'agent_002',
      name: 'Mike Chen',
      email: 'mike.chen@company.com',
      status: 'busy',
      specializations: ['sales', 'product_demo'],
      currentConversations: 5,
      maxConversations: 5,
      performanceRating: 4.3,
      totalConversations: 189,
      avgResolutionTime: 18.2,
      satisfactionScore: 4.1
    },
    {
      id: 'agent_003',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@company.com',
      status: 'away',
      specializations: ['billing', 'account_management'],
      currentConversations: 0,
      maxConversations: 4,
      performanceRating: 4.7,
      totalConversations: 156,
      avgResolutionTime: 15.8,
      satisfactionScore: 4.6
    }
  ];

  const mockHandoffRequests: HandoffRequest[] = [
    {
      id: 'req_001',
      conversationId: 'conv_001',
      userId: 'user_001',
      chatbotId: 'bot_001',
      reason: 'complex_query',
      priority: 'high',
      status: 'pending',
      createdAt: '2024-01-20T14:30:00Z',
      waitTime: 5.5
    },
    {
      id: 'req_002',
      conversationId: 'conv_002',
      userId: 'user_002',
      chatbotId: 'bot_001',
      reason: 'negative_sentiment',
      priority: 'urgent',
      status: 'assigned',
      createdAt: '2024-01-20T14:25:00Z',
      assignedAgent: 'agent_001',
      waitTime: 2.3
    },
    {
      id: 'req_003',
      conversationId: 'conv_003',
      userId: 'user_003',
      chatbotId: 'bot_002',
      reason: 'user_request',
      priority: 'medium',
      status: 'in_progress',
      createdAt: '2024-01-20T14:20:00Z',
      assignedAgent: 'agent_002',
      waitTime: 0
    }
  ];

  const mockLeads: Lead[] = [
    {
      id: 'lead_001',
      name: 'John Smith',
      email: 'john.smith@techcorp.com',
      company: 'TechCorp Inc.',
      status: 'qualified',
      score: 85,
      source: 'chat',
      priority: 'hot',
      estimatedValue: 50000,
      assignedSalesRep: 'agent_002',
      createdAt: '2024-01-20T10:00:00Z',
      lastContact: '2024-01-20T14:00:00Z',
      nextFollowup: '2024-01-21T09:00:00Z'
    },
    {
      id: 'lead_002',
      name: 'Lisa Wang',
      email: 'lisa.wang@startup.io',
      company: 'Startup.io',
      status: 'interested',
      score: 72,
      source: 'chat',
      priority: 'warm',
      estimatedValue: 25000,
      assignedSalesRep: 'agent_002',
      createdAt: '2024-01-20T11:30:00Z',
      lastContact: '2024-01-20T13:45:00Z',
      nextFollowup: '2024-01-22T10:00:00Z'
    },
    {
      id: 'lead_003',
      name: 'Robert Davis',
      email: 'robert.davis@enterprise.com',
      company: 'Enterprise Solutions',
      status: 'proposal',
      score: 92,
      source: 'chat',
      priority: 'hot',
      estimatedValue: 150000,
      assignedSalesRep: 'agent_002',
      createdAt: '2024-01-19T15:00:00Z',
      lastContact: '2024-01-20T12:00:00Z',
      nextFollowup: '2024-01-21T14:00:00Z'
    }
  ];

  const mockOpportunities: Opportunity[] = [
    {
      id: 'opp_001',
      leadId: 'lead_001',
      name: 'TechCorp Enterprise License',
      value: 50000,
      stage: 'qualification',
      probability: 60,
      expectedCloseDate: '2024-02-15',
      assignedTo: 'agent_002'
    },
    {
      id: 'opp_002',
      leadId: 'lead_003',
      name: 'Enterprise Solutions Implementation',
      value: 150000,
      stage: 'proposal',
      probability: 80,
      expectedCloseDate: '2024-02-28',
      assignedTo: 'agent_002'
    }
  ];

  useEffect(() => {
    // Load data
    setAgents(mockAgents);
    setHandoffRequests(mockHandoffRequests);
    setLeads(mockLeads);
    setOpportunities(mockOpportunities);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
      case 'qualified':
      case 'resolved':
        return 'default';
      case 'busy':
      case 'in_progress':
      case 'interested':
        return 'secondary';
      case 'away':
      case 'pending':
      case 'new':
        return 'outline';
      case 'offline':
      case 'closed_lost':
        return 'destructive';
      case 'urgent':
      case 'hot':
      case 'closed_won':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'hot':
        return 'destructive';
      case 'high':
      case 'warm':
        return 'secondary';
      case 'medium':
      case 'cold':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const assignConversation = (requestId: string, agentId: string) => {
    setHandoffRequests(requests =>
      requests.map(req =>
        req.id === requestId
          ? { ...req, status: 'assigned' as const, assignedAgent: agentId }
          : req
      )
    );
  };

  const updateLeadStatus = (leadId: string, newStatus: string) => {
    setLeads(leads =>
      leads.map(lead =>
        lead.id === leadId
          ? { ...lead, status: newStatus as any }
          : lead
      )
    );
  };

  const filteredHandoffRequests = handoffRequests.filter(req => {
    if (filterStatus !== 'all' && req.status !== filterStatus) return false;
    if (searchTerm && !req.conversationId.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredLeads = leads.filter(lead => {
    if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
    if (searchTerm && !lead.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !lead.company.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Human Handoff & Lead Management</h2>
          <p className="text-muted-foreground">
            Manage agent assignments, conversation handoffs, and sales pipeline
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter(a => a.status === 'available').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {agents.length} total agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Handoffs</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {handoffRequests.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg wait: {handoffRequests.filter(r => r.status === 'pending').reduce((acc, r) => acc + r.waitTime, 0) / handoffRequests.filter(r => r.status === 'pending').length || 0}m
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter(l => l.status === 'qualified').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {leads.length} total leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${opportunities.reduce((acc, opp) => acc + opp.value, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {opportunities.length} opportunities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="handoffs">Handoffs</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Agent Management</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </div>

          <div className="grid gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        <CardDescription>{agent.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{agent.performanceRating}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Workload</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress value={(agent.currentConversations / agent.maxConversations) * 100} className="flex-1" />
                        <span className="text-sm text-muted-foreground">
                          {agent.currentConversations}/{agent.maxConversations}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Specializations</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.specializations.slice(0, 2).map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {spec.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Avg Resolution</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {agent.avgResolutionTime}m
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Satisfaction</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {agent.satisfactionScore}/5
                      </p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {agent.totalConversations} total conversations
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Handoffs Tab */}
        <TabsContent value="handoffs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Conversation Handoffs</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredHandoffRequests.map((request) => (
              <Card key={request.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Conversation {request.conversationId}</CardTitle>
                        <CardDescription>
                          Reason: {request.reason.replace('_', ' ')} • User: {request.userId}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                      <Badge variant={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Wait Time</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.waitTime > 0 ? `${request.waitTime}m` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(request.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Assigned Agent</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.assignedAgent ? 
                          agents.find(a => a.id === request.assignedAgent)?.name || 'Unknown' : 
                          'Unassigned'
                        }
                      </p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Chatbot: {request.chatbotId}
                    </div>
                    <div className="flex items-center space-x-2">
                      {request.status === 'pending' && (
                        <Select onValueChange={(agentId) => assignConversation(request.id, agentId)}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Assign agent" />
                          </SelectTrigger>
                          <SelectContent>
                            {agents.filter(a => a.status === 'available').map(agent => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Conversation
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Lead Management</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{lead.name}</CardTitle>
                        <CardDescription>{lead.company} • {lead.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityColor(lead.priority)}>
                        {lead.priority}
                      </Badge>
                      <Badge variant={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm font-medium">Score: {lead.score}</div>
                        <div className="text-xs text-muted-foreground">
                          ${lead.estimatedValue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Source</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lead.source}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Assigned To</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {agents.find(a => a.id === lead.assignedSalesRep)?.name || 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Contact</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lead.lastContact ? new Date(lead.lastContact).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Next Follow-up</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lead.nextFollowup ? new Date(lead.nextFollowup).toLocaleDateString() : 'Not scheduled'}
                      </p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Lead Score Progress</p>
                    <Progress value={lead.score} className="h-2" />
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Created {new Date(lead.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select onValueChange={(status) => updateLeadStatus(lead.id, status)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="interested">Interested</SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                          <SelectItem value="closed_won">Closed Won</SelectItem>
                          <SelectItem value="closed_lost">Closed Lost</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Sales Opportunities</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Opportunity
            </Button>
          </div>

          <div className="grid gap-4">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{opportunity.name}</CardTitle>
                        <CardDescription>
                          Lead: {leads.find(l => l.id === opportunity.leadId)?.name || 'Unknown'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${opportunity.value.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{opportunity.probability}% probability</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Stage</p>
                      <Badge variant="outline" className="mt-1">
                        {opportunity.stage}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Expected Close</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Assigned To</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {agents.find(a => a.id === opportunity.assignedTo)?.name || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Probability</p>
                    <Progress value={opportunity.probability} className="h-2" />
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Stage: {opportunity.stage}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Meeting
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Update Stage
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
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

export default HumanHandoffManagement;

