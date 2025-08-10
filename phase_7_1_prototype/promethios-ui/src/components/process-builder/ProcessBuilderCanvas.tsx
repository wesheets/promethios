import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  Play, 
  Save, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Eye, 
  EyeOff,
  Zap,
  Brain,
  Target,
  Shield,
  BarChart3,
  GitBranch,
  Cloud,
  Link,
  Github,
  ExternalLink,
  Database,
  Code,
  Palette,
  TestTube,
  Layers,
  Network,
  Workflow,
  RefreshCw,
  User,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

// Firebase and storage imports
import { AgentManagementServiceUnified } from '../../services/agentManagementServiceUnified';
import { FirebaseMASPersistenceService } from '../../services/persistence/FirebaseMASPersistenceService';
import { auth } from '../../firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// Types for the process builder
interface AgentNode {
  id: string;
  type: 'agent';
  name: string;
  role: string;
  expertise: string[];
  governanceProfile: {
    trustScore: number;
    complianceLevel: string;
    specializations: string[];
  };
  position: { x: number; y: number };
  connections: string[];
}

interface OrchestratorNode {
  id: string;
  type: 'orchestrator';
  personality: string;
  description: string;
  position: { x: number; y: number };
  managedAgents: string[];
}

interface ProcessNode {
  id: string;
  type: 'process';
  name: string;
  description: string;
  category: string;
  position: { x: number; y: number };
  inputs: string[];
  outputs: string[];
}

interface Connection {
  id: string;
  from: string;
  to: string;
  type: 'collaboration' | 'data' | 'governance';
  label?: string;
}

interface ProcessDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: (AgentNode | OrchestratorNode | ProcessNode)[];
  connections: Connection[];
  governanceRequirements: string[];
  qualityThresholds: {
    minimum: number;
    target: number;
  };
  adaptiveBehaviors: string[];
  metadata: {
    created: Date;
    modified: Date;
    version: string;
    author: string;
    tags: string[];
  };
}

// Available agent types for the palette
const AGENT_TYPES = [
  {
    id: 'market-researcher',
    name: 'Market Researcher',
    role: 'Research Specialist',
    expertise: ['Market Analysis', 'Competitive Intelligence', 'Trend Analysis'],
    icon: '🔍',
    color: '#3B82F6'
  },
  {
    id: 'business-strategist',
    name: 'Business Strategist',
    role: 'Strategy Expert',
    expertise: ['Business Planning', 'Strategic Analysis', 'Growth Strategy'],
    icon: '📊',
    color: '#8B5CF6'
  },
  {
    id: 'technical-architect',
    name: 'Technical Architect',
    role: 'Technology Expert',
    expertise: ['System Design', 'Architecture', 'Technical Planning'],
    icon: '⚙️',
    color: '#10B981'
  },
  {
    id: 'financial-analyst',
    name: 'Financial Analyst',
    role: 'Finance Expert',
    expertise: ['Financial Modeling', 'Investment Analysis', 'Risk Assessment'],
    icon: '💰',
    color: '#F59E0B'
  },
  {
    id: 'marketing-specialist',
    name: 'Marketing Specialist',
    role: 'Marketing Expert',
    expertise: ['Brand Strategy', 'Digital Marketing', 'Customer Acquisition'],
    icon: '📢',
    color: '#EF4444'
  },
  {
    id: 'devils-advocate',
    name: 'Devil\'s Advocate',
    role: 'Critical Thinker',
    expertise: ['Risk Analysis', 'Critical Evaluation', 'Challenge Assumptions'],
    icon: '😈',
    color: '#DC2626'
  },
  {
    id: 'skeptical-examiner',
    name: 'Skeptical Examiner',
    role: 'Quality Assurance',
    expertise: ['Evidence Validation', 'Compliance Checking', 'Quality Control'],
    icon: '🔍',
    color: '#7C2D12'
  },
  {
    id: 'github-integration-agent',
    name: 'GitHub Integration Agent',
    role: 'Repository Manager',
    expertise: ['Repository Management', 'Code Synchronization', 'CI/CD Integration'],
    icon: '🐙',
    color: '#24292E'
  },
  {
    id: 'cloud-deployment-agent',
    name: 'Cloud Deployment Agent',
    role: 'Deployment Specialist',
    expertise: ['Multi-Platform Deployment', 'Infrastructure Management', 'Scaling Optimization'],
    icon: '☁️',
    color: '#0EA5E9'
  },
  {
    id: 'external-integration-agent',
    name: 'External Integration Agent',
    role: 'API Specialist',
    expertise: ['API Management', 'Service Integration', 'Webhook Configuration'],
    icon: '🔗',
    color: '#8B5CF6'
  },
  {
    id: 'design-intelligence-agent',
    name: 'Design Intelligence Agent',
    role: 'Design Specialist',
    expertise: ['Visual Design', 'UX Optimization', 'Design System Generation'],
    icon: '🎨',
    color: '#EC4899'
  },
  {
    id: 'testing-framework-agent',
    name: 'Testing Framework Agent',
    role: 'Quality Engineer',
    expertise: ['Automated Testing', 'Quality Gates', 'Test Generation'],
    icon: '🧪',
    color: '#10B981'
  }
];

const ORCHESTRATOR_TYPES = [
  {
    id: 'collaborative-leader',
    name: 'Collaborative Leader',
    personality: 'Collaborative',
    description: 'Facilitates consensus and team harmony',
    icon: '🤝',
    color: '#059669'
  },
  {
    id: 'innovative-director',
    name: 'Innovative Director',
    personality: 'Innovative',
    description: 'Drives creative solutions and breakthrough thinking',
    icon: '💡',
    color: '#7C3AED'
  },
  {
    id: 'analytical-coordinator',
    name: 'Analytical Coordinator',
    personality: 'Analytical',
    description: 'Ensures systematic analysis and data-driven decisions',
    icon: '📊',
    color: '#2563EB'
  },
  {
    id: 'directive-commander',
    name: 'Directive Commander',
    personality: 'Directive',
    description: 'Provides clear direction and efficient execution',
    icon: '⚡',
    color: '#DC2626'
  }
];

const PROCESS_TEMPLATES = [
  {
    id: 'saas-builder',
    name: 'SaaS Business Builder',
    description: 'Complete SaaS development and launch process',
    category: 'Business Development',
    icon: '🚀',
    color: '#8B5CF6'
  },
  {
    id: 'market-research',
    name: 'Market Research Process',
    description: 'Comprehensive market analysis and validation',
    category: 'Research',
    icon: '🔍',
    color: '#3B82F6'
  },
  {
    id: 'content-creation',
    name: 'Content Creation Pipeline',
    description: 'Multi-agent content development and optimization',
    category: 'Marketing',
    icon: '✍️',
    color: '#10B981'
  },
  {
    id: 'financial-planning',
    name: 'Financial Planning Process',
    description: 'Collaborative financial analysis and planning',
    category: 'Finance',
    icon: '💰',
    color: '#F59E0B'
  },
  {
    id: 'github-deployment-pipeline',
    name: 'GitHub Deployment Pipeline',
    description: 'Automated development workflow with GitHub integration',
    category: 'Development',
    icon: '🐙',
    color: '#24292E'
  },
  {
    id: 'cloud-native-deployment',
    name: 'Cloud-Native Deployment',
    description: 'Multi-platform cloud deployment and scaling',
    category: 'Infrastructure',
    icon: '☁️',
    color: '#0EA5E9'
  },
  {
    id: 'external-api-integration',
    name: 'External API Integration',
    description: 'Comprehensive external service integration workflow',
    category: 'Integration',
    icon: '🔗',
    color: '#8B5CF6'
  },
  {
    id: 'full-stack-development',
    name: 'Full-Stack Development',
    description: 'Complete application development with design, testing, and deployment',
    category: 'Development',
    icon: '🛠️',
    color: '#059669'
  }
];

export const ProcessBuilderCanvas: React.FC = () => {
  // Firebase and agent management state
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [agentManagementService] = useState(() => new AgentManagementServiceUnified());
  const [firebasePersistence] = useState(() => FirebaseMASPersistenceService.getInstance());
  const [existingAgents, setExistingAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [agentLoadError, setAgentLoadError] = useState<string | null>(null);

  const [processDefinition, setProcessDefinition] = useState<ProcessDefinition>({
    id: 'new-process',
    name: 'New AI-Native Process',
    description: 'Custom business process with AI collaboration',
    category: 'Custom',
    nodes: [],
    connections: [],
    governanceRequirements: ['audit_logging', 'policy_compliance'],
    qualityThresholds: {
      minimum: 7.0,
      target: 8.5
    },
    adaptiveBehaviors: ['quality_optimization', 'real_time_adaptation'],
    metadata: {
      created: new Date(),
      modified: new Date(),
      version: '1.0.0',
      author: 'User',
      tags: []
    }
  });

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [showGovernancePanel, setShowGovernancePanel] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Firebase authentication and agent loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Initialize agent management service with user ID
          await agentManagementService.setUserId(user.uid);
          
          // Load existing wrapped agents
          await loadExistingAgents(user.uid);
        } catch (error) {
          console.error('Failed to initialize user session:', error);
          setAgentLoadError('Failed to load user agents');
        }
      } else {
        // User signed out, clear agents
        setExistingAgents([]);
        setLoadingAgents(false);
      }
    });

    return () => unsubscribe();
  }, [agentManagementService]);

  // Load existing wrapped agents from Firebase
  const loadExistingAgents = async (userId: string) => {
    setLoadingAgents(true);
    setAgentLoadError(null);
    
    try {
      // Get stored agent wrappers
      const storedWrappers = await agentManagementService.getStoredAgentWrappers();
      
      // Convert stored wrappers to agent types format
      const wrappedAgents = storedWrappers.map(wrapper => ({
        id: wrapper.id,
        name: wrapper.name || `Agent ${wrapper.id}`,
        description: wrapper.description || 'Custom wrapped agent',
        icon: '🤖',
        color: '#8B5CF6',
        category: 'Wrapped Agents',
        expertise: wrapper.governanceData ? ['Governance', 'Trust'] : ['Custom'],
        trustScore: wrapper.governanceData?.trustScore || 8.0,
        complianceLevel: wrapper.governanceData?.complianceScore > 90 ? 'High' : 'Medium',
        isWrappedAgent: true,
        wrapperId: wrapper.id,
        deploymentStatus: wrapper.deploymentStatus,
        usageMetrics: wrapper.usageMetrics,
        governanceData: wrapper.governanceData
      }));

      setExistingAgents(wrappedAgents);
      console.log(`Loaded ${wrappedAgents.length} existing wrapped agents for user ${userId}`);
    } catch (error) {
      console.error('Failed to load existing agents:', error);
      setAgentLoadError('Failed to load existing agents');
      setExistingAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  };

  // Refresh agents manually
  const refreshAgents = async () => {
    if (currentUser) {
      await loadExistingAgents(currentUser.uid);
    }
  };

  // Combine default agent types with existing wrapped agents
  const getAllAgentTypes = () => {
    return [...AGENT_TYPES, ...existingAgents];
  };

  // Handle drag and drop from palette
  const handleDragStart = useCallback((item: any, type: string) => {
    setDraggedItem({ ...item, type });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
    const y = (e.clientY - rect.top - canvasOffset.y) / zoom;

    const newNode = {
      id: `${draggedItem.type}-${Date.now()}`,
      ...draggedItem,
      position: { x, y }
    };

    if (draggedItem.type === 'agent') {
      const agentNode: AgentNode = {
        ...newNode,
        type: 'agent',
        governanceProfile: {
          trustScore: 8.5,
          complianceLevel: 'High',
          specializations: draggedItem.expertise
        },
        connections: []
      };
      setProcessDefinition(prev => ({
        ...prev,
        nodes: [...prev.nodes, agentNode]
      }));
    } else if (draggedItem.type === 'orchestrator') {
      const orchestratorNode: OrchestratorNode = {
        ...newNode,
        type: 'orchestrator',
        managedAgents: []
      };
      setProcessDefinition(prev => ({
        ...prev,
        nodes: [...prev.nodes, orchestratorNode]
      }));
    } else if (draggedItem.type === 'process') {
      const processNode: ProcessNode = {
        ...newNode,
        type: 'process',
        inputs: [],
        outputs: []
      };
      setProcessDefinition(prev => ({
        ...prev,
        nodes: [...prev.nodes, processNode]
      }));
    }

    setDraggedItem(null);
  }, [draggedItem, canvasOffset, zoom]);

  // Handle node selection and connection
  const handleNodeClick = useCallback((nodeId: string) => {
    if (isConnecting && connectionStart && connectionStart !== nodeId) {
      // Create connection
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        from: connectionStart,
        to: nodeId,
        type: 'collaboration',
        label: 'Collaborates with'
      };
      
      setProcessDefinition(prev => ({
        ...prev,
        connections: [...prev.connections, newConnection]
      }));
      
      setIsConnecting(false);
      setConnectionStart(null);
    } else if (isConnecting) {
      setConnectionStart(nodeId);
    } else {
      setSelectedNode(nodeId);
    }
  }, [isConnecting, connectionStart]);

  // Save process to Firebase
  const handleSave = useCallback(async () => {
    if (!currentUser) {
      alert('Please sign in to save your process');
      return;
    }

    try {
      const updatedProcess = {
        ...processDefinition,
        userId: currentUser.uid,
        metadata: {
          ...processDefinition.metadata,
          modified: new Date()
        }
      };
      
      // Save to Firebase using the persistence service
      await firebasePersistence.saveConversation({
        conversationId: processDefinition.id,
        userId: currentUser.uid,
        title: processDefinition.name,
        description: processDefinition.description,
        messages: [], // Process definitions don't have messages
        participants: processDefinition.nodes.map(node => ({
          id: node.id,
          name: node.name,
          role: node.type === 'agent' ? (node as AgentNode).role : 
                node.type === 'orchestrator' ? 'Orchestrator' : 'Process',
          isActive: true
        })),
        governanceData: {
          auditLogs: [],
          complianceScore: processDefinition.qualityThresholds.target * 10,
          trustMetrics: {
            transparency: 9.0,
            reliability: 8.5,
            accountability: 9.2
          },
          policyViolations: []
        },
        analytics: {
          messageCount: 0,
          participantCount: processDefinition.nodes.length,
          averageResponseTime: 0,
          qualityScore: processDefinition.qualityThresholds.target,
          engagementMetrics: {
            totalInteractions: 0,
            averageSessionLength: 0,
            userSatisfactionScore: 0
          }
        },
        metadata: {
          processDefinition: updatedProcess,
          tags: processDefinition.metadata.tags,
          category: processDefinition.category,
          version: processDefinition.metadata.version
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Also save to localStorage as backup
      localStorage.setItem(`process-${processDefinition.id}`, JSON.stringify(updatedProcess));
      
      // Show success notification
      alert('Process saved successfully to Firebase!');
      console.log('Process saved to Firebase:', processDefinition.id);
    } catch (error) {
      console.error('Failed to save process to Firebase:', error);
      
      // Fallback to localStorage
      const updatedProcess = {
        ...processDefinition,
        metadata: {
          ...processDefinition.metadata,
          modified: new Date()
        }
      };
      localStorage.setItem(`process-${processDefinition.id}`, JSON.stringify(updatedProcess));
      alert('Process saved locally (Firebase save failed)');
    }
  }, [processDefinition, currentUser, firebasePersistence]);

  // Load template
  const handleLoadTemplate = useCallback((template: any) => {
    // This would load a predefined template
    // For now, we'll create a simple SaaS builder template
    if (template.id === 'saas-builder') {
      const templateNodes: (AgentNode | OrchestratorNode)[] = [
        {
          id: 'orchestrator-1',
          type: 'orchestrator',
          personality: 'Collaborative',
          name: 'Collaborative Leader',
          description: 'Facilitates team consensus and coordination',
          position: { x: 400, y: 100 },
          managedAgents: ['agent-1', 'agent-2', 'agent-3', 'agent-4']
        },
        {
          id: 'agent-1',
          type: 'agent',
          name: 'Market Researcher',
          role: 'Research Specialist',
          expertise: ['Market Analysis', 'Competitive Intelligence'],
          position: { x: 200, y: 250 },
          governanceProfile: {
            trustScore: 8.7,
            complianceLevel: 'High',
            specializations: ['Market Analysis']
          },
          connections: ['agent-2']
        },
        {
          id: 'agent-2',
          type: 'agent',
          name: 'Business Strategist',
          role: 'Strategy Expert',
          expertise: ['Business Planning', 'Strategic Analysis'],
          position: { x: 400, y: 250 },
          governanceProfile: {
            trustScore: 9.1,
            complianceLevel: 'High',
            specializations: ['Business Planning']
          },
          connections: ['agent-3']
        },
        {
          id: 'agent-3',
          type: 'agent',
          name: 'Technical Architect',
          role: 'Technology Expert',
          expertise: ['System Design', 'Architecture'],
          position: { x: 600, y: 250 },
          governanceProfile: {
            trustScore: 8.9,
            complianceLevel: 'High',
            specializations: ['System Design']
          },
          connections: ['agent-4']
        },
        {
          id: 'agent-4',
          type: 'agent',
          name: 'Devil\'s Advocate',
          role: 'Critical Thinker',
          expertise: ['Risk Analysis', 'Critical Evaluation'],
          position: { x: 800, y: 250 },
          governanceProfile: {
            trustScore: 8.5,
            complianceLevel: 'High',
            specializations: ['Risk Analysis']
          },
          connections: []
        }
      ];

      const templateConnections: Connection[] = [
        {
          id: 'conn-1',
          from: 'agent-1',
          to: 'agent-2',
          type: 'collaboration',
          label: 'Provides market insights'
        },
        {
          id: 'conn-2',
          from: 'agent-2',
          to: 'agent-3',
          type: 'collaboration',
          label: 'Defines requirements'
        },
        {
          id: 'conn-3',
          from: 'agent-3',
          to: 'agent-4',
          type: 'collaboration',
          label: 'Presents for validation'
        }
      ];

      setProcessDefinition(prev => ({
        ...prev,
        name: template.name,
        description: template.description,
        category: template.category,
        nodes: templateNodes,
        connections: templateConnections
      }));
    }
    
    setShowTemplateLibrary(false);
  }, []);

  // Render node
  const renderNode = useCallback((node: AgentNode | OrchestratorNode | ProcessNode) => {
    const isSelected = selectedNode === node.id;
    let bgColor = '#2D3748';
    let borderColor = '#4A5568';
    let icon = '🤖';

    if (node.type === 'agent') {
      const agentType = AGENT_TYPES.find(t => t.id === (node as AgentNode).role.toLowerCase().replace(' ', '-'));
      bgColor = agentType?.color || '#3B82F6';
      icon = agentType?.icon || '🤖';
    } else if (node.type === 'orchestrator') {
      const orchType = ORCHESTRATOR_TYPES.find(t => t.personality === (node as OrchestratorNode).personality);
      bgColor = orchType?.color || '#8B5CF6';
      icon = orchType?.icon || '🎭';
    } else if (node.type === 'process') {
      bgColor = '#10B981';
      icon = '⚙️';
    }

    if (isSelected) {
      borderColor = '#60A5FA';
    }

    return (
      <div
        key={node.id}
        className="absolute cursor-pointer transform transition-all duration-200 hover:scale-105"
        style={{
          left: node.position.x,
          top: node.position.y,
          transform: `scale(${zoom})`
        }}
        onClick={() => handleNodeClick(node.id)}
      >
        <div
          className="rounded-lg p-4 min-w-[180px] shadow-lg border-2"
          style={{
            backgroundColor: bgColor + '20',
            borderColor: borderColor,
            borderWidth: isSelected ? '3px' : '2px'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{icon}</span>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">{node.name}</h3>
              <p className="text-gray-300 text-xs">
                {node.type === 'agent' ? (node as AgentNode).role :
                 node.type === 'orchestrator' ? (node as OrchestratorNode).personality :
                 (node as ProcessNode).category}
              </p>
            </div>
          </div>
          
          {node.type === 'agent' && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-green-400" />
                <span className="text-xs text-gray-300">
                  Trust: {(node as AgentNode).governanceProfile.trustScore}/10
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(node as AgentNode).expertise.slice(0, 2).map(skill => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-gray-700 text-xs rounded text-gray-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {node.type === 'orchestrator' && (
            <div className="space-y-1">
              <p className="text-xs text-gray-300">{(node as OrchestratorNode).description}</p>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-gray-300">
                  Manages {(node as OrchestratorNode).managedAgents.length} agents
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [selectedNode, zoom, handleNodeClick]);

  // Render connection
  const renderConnection = useCallback((connection: Connection) => {
    const fromNode = processDefinition.nodes.find(n => n.id === connection.from);
    const toNode = processDefinition.nodes.find(n => n.id === connection.to);
    
    if (!fromNode || !toNode) return null;

    const fromX = fromNode.position.x + 90; // Center of node
    const fromY = fromNode.position.y + 50;
    const toX = toNode.position.x + 90;
    const toY = toNode.position.y + 50;

    const color = connection.type === 'collaboration' ? '#60A5FA' :
                  connection.type === 'data' ? '#10B981' : '#F59E0B';

    return (
      <svg
        key={connection.id}
        className="absolute pointer-events-none"
        style={{
          left: Math.min(fromX, toX) - 10,
          top: Math.min(fromY, toY) - 10,
          width: Math.abs(toX - fromX) + 20,
          height: Math.abs(toY - fromY) + 20,
          transform: `scale(${zoom})`
        }}
      >
        <defs>
          <marker
            id={`arrowhead-${connection.id}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={color}
            />
          </marker>
        </defs>
        <line
          x1={fromX - Math.min(fromX, toX) + 10}
          y1={fromY - Math.min(fromY, toY) + 10}
          x2={toX - Math.min(fromX, toX) + 10}
          y2={toY - Math.min(fromY, toY) + 10}
          stroke={color}
          strokeWidth="2"
          markerEnd={`url(#arrowhead-${connection.id})`}
        />
      </svg>
    );
  }, [processDefinition.nodes, zoom]);

  return (
    <div className="h-full bg-gray-900 flex">
      {/* Left Sidebar - Component Palette */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-white font-semibold mb-4">Process Builder</h2>
          
          {/* Process Info */}
          <div className="space-y-2 mb-4">
            <input
              type="text"
              value={processDefinition.name}
              onChange={(e) => setProcessDefinition(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Process Name"
            />
            <textarea
              value={processDefinition.description}
              onChange={(e) => setProcessDefinition(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
              rows={2}
              placeholder="Process Description"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowTemplateLibrary(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              <Download className="w-4 h-4" />
              Templates
            </button>
            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>

        {/* Component Sections */}
        <div className="flex-1 overflow-y-auto">
          {/* Orchestrators */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Orchestrators
            </h3>
            <div className="space-y-2">
              {ORCHESTRATOR_TYPES.map(orchestrator => (
                <div
                  key={orchestrator.id}
                  draggable
                  onDragStart={() => handleDragStart(orchestrator, 'orchestrator')}
                  className="p-3 bg-gray-700 rounded cursor-move hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{orchestrator.icon}</span>
                    <div className="flex-1">
                      <h4 className="text-white text-sm font-medium">{orchestrator.name}</h4>
                      <p className="text-gray-400 text-xs">{orchestrator.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agents */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                AI Agents
              </h3>
              <div className="flex items-center gap-2">
                {currentUser && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <User className="w-3 h-3" />
                    {existingAgents.length} wrapped
                  </div>
                )}
                <button
                  onClick={refreshAgents}
                  disabled={loadingAgents}
                  className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  title="Refresh agents"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingAgents ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Loading state */}
            {loadingAgents && (
              <div className="p-3 bg-gray-700 rounded text-center">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading your agents...</span>
                </div>
              </div>
            )}

            {/* Error state */}
            {agentLoadError && (
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded">
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {agentLoadError}
                </div>
              </div>
            )}

            {/* User not signed in */}
            {!currentUser && !loadingAgents && (
              <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Sign in to load your wrapped agents
                </div>
              </div>
            )}

            <div className="space-y-2">
              {/* Existing wrapped agents section */}
              {existingAgents.length > 0 && (
                <>
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mt-4 mb-2">
                    Your Wrapped Agents
                  </div>
                  {existingAgents.map(agent => (
                    <div
                      key={agent.id}
                      draggable
                      onDragStart={() => handleDragStart(agent, 'agent')}
                      className="p-3 bg-purple-900/20 border border-purple-500/30 rounded cursor-move hover:bg-purple-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{agent.icon}</span>
                        <div className="flex-1">
                          <h4 className="text-white text-sm font-medium">{agent.name}</h4>
                          <p className="text-gray-400 text-xs">{agent.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-1 py-0.5 text-xs rounded ${
                              agent.deploymentStatus === 'deployed' ? 'bg-green-600 text-white' :
                              agent.deploymentStatus === 'draft' ? 'bg-yellow-600 text-white' :
                              'bg-gray-600 text-gray-300'
                            }`}>
                              {agent.deploymentStatus}
                            </span>
                            <span className="text-xs text-gray-400">
                              Trust: {agent.trustScore?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mt-4 mb-2">
                    Default Agent Types
                  </div>
                </>
              )}

              {/* Default agent types */}
              {AGENT_TYPES.map(agent => (
                <div
                  key={agent.id}
                  draggable
                  onDragStart={() => handleDragStart(agent, 'agent')}
                  className="p-3 bg-gray-700 rounded cursor-move hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{agent.icon}</span>
                    <div className="flex-1">
                      <h4 className="text-white text-sm font-medium">{agent.name}</h4>
                      <p className="text-gray-400 text-xs">{agent.role}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.expertise.slice(0, 2).map(skill => (
                          <span
                            key={skill}
                            className="px-1 py-0.5 bg-gray-600 text-xs rounded text-gray-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Process Templates */}
          <div className="p-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Process Templates
            </h3>
            <div className="space-y-2">
              {PROCESS_TEMPLATES.map(template => (
                <div
                  key={template.id}
                  draggable
                  onDragStart={() => handleDragStart(template, 'process')}
                  className="p-3 bg-gray-700 rounded cursor-move hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{template.icon}</span>
                    <div className="flex-1">
                      <h4 className="text-white text-sm font-medium">{template.name}</h4>
                      <p className="text-gray-400 text-xs">{template.description}</p>
                      <span className="inline-block px-2 py-0.5 bg-gray-600 text-xs rounded text-gray-300 mt-1">
                        {template.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsConnecting(!isConnecting)}
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                isConnecting 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
            
            <button
              onClick={() => setShowGovernancePanel(!showGovernancePanel)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors"
            >
              <Shield className="w-4 h-4" />
              Governance
            </button>

            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Zoom:</span>
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="px-2 py-1 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded"
              >
                -
              </button>
              <span className="text-gray-300 text-sm w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="px-2 py-1 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors">
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors">
              <Play className="w-4 h-4" />
              Execute
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className="w-full h-full relative bg-gray-900"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              backgroundImage: `
                radial-gradient(circle, #374151 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`
            }}
          >
            {/* Render connections first (behind nodes) */}
            {processDefinition.connections.map(renderConnection)}
            
            {/* Render nodes */}
            {processDefinition.nodes.map(renderNode)}

            {/* Connection preview */}
            {isConnecting && connectionStart && (
              <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded shadow-lg">
                Click another node to create connection
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties Panel */}
      {selectedNode && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <h3 className="text-white font-semibold mb-4">Node Properties</h3>
          {/* Node properties would go here */}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                defaultValue={processDefinition.nodes.find(n => n.id === selectedNode)?.name}
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-2">Description</label>
              <textarea
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                rows={3}
              />
            </div>

            <button
              onClick={() => {
                setProcessDefinition(prev => ({
                  ...prev,
                  nodes: prev.nodes.filter(n => n.id !== selectedNode)
                }));
                setSelectedNode(null);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Node
            </button>
          </div>
        </div>
      )}

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Process Templates</h3>
              <button
                onClick={() => setShowTemplateLibrary(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              {PROCESS_TEMPLATES.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleLoadTemplate(template)}
                  className="p-4 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{template.name}</h4>
                      <p className="text-gray-400 text-sm">{template.description}</p>
                      <span className="inline-block px-2 py-1 bg-gray-600 text-xs rounded text-gray-300 mt-1">
                        {template.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Governance Panel */}
      {showGovernancePanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Governance Configuration</h3>
              <button
                onClick={() => setShowGovernancePanel(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Quality Threshold</label>
                <input
                  type="range"
                  min="5"
                  max="10"
                  step="0.1"
                  value={processDefinition.qualityThresholds.minimum}
                  onChange={(e) => setProcessDefinition(prev => ({
                    ...prev,
                    qualityThresholds: {
                      ...prev.qualityThresholds,
                      minimum: parseFloat(e.target.value)
                    }
                  }))}
                  className="w-full"
                />
                <span className="text-gray-400 text-sm">
                  Minimum: {processDefinition.qualityThresholds.minimum}/10
                </span>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Governance Requirements</label>
                <div className="space-y-2">
                  {['audit_logging', 'policy_compliance', 'trust_verification', 'quality_assurance'].map(req => (
                    <label key={req} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={processDefinition.governanceRequirements.includes(req)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProcessDefinition(prev => ({
                              ...prev,
                              governanceRequirements: [...prev.governanceRequirements, req]
                            }));
                          } else {
                            setProcessDefinition(prev => ({
                              ...prev,
                              governanceRequirements: prev.governanceRequirements.filter(r => r !== req)
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-gray-300 text-sm capitalize">
                        {req.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessBuilderCanvas;

