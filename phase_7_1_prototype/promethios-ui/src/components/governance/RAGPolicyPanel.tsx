/**
 * RAG + Policy Panel Component
 * 
 * User-friendly interface for knowledge retrieval and policy management.
 * Combines traditional RAG, Graph RAG, and policy controls in one intuitive panel.
 * Designed for standard operators with practical functionality.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  FileText, 
  Shield, 
  Network, 
  Upload, 
  ToggleLeft, 
  ToggleRight, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Lightbulb,
  TrendingUp,
  Users,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';

// Import existing services
import { PolicyExtension, type EnterprisePolicyConfig } from '../../extensions/PolicyExtension';
import { GraphRAGExtension, type GraphQuery, type GraphResult, type GraphEntity } from '../../extensions/GraphRAGExtension';
import { RAGPolicyIntegrationService } from '../../services/RAGPolicyIntegrationService';
import { UniversalGovernanceAdapter } from '../../services/UniversalGovernanceAdapter';
import { customPolicyService, type CustomPolicy } from '../../services/CustomPolicyService';
import { policyAwareRAGService, type DocumentMetadata, type SearchResult } from '../../services/PolicyAwareRAGService';
import { orgChartRAGService, type OrgChartUser, type UserContext } from '../../services/OrgChartRAGService';
import { documentUploadService, type DocumentUpload, type UploadProgress } from '../../services/DocumentUploadService';

interface RAGPolicyPanelProps {
  agentId: string;
  onClose?: () => void;
}

interface PolicyToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  framework: string;
  complianceRate: number;
  lastUpdated: string;
}

interface KnowledgeSource {
  id: string;
  name: string;
  type: 'document' | 'policy' | 'receipt' | 'conversation';
  size: string;
  lastUpdated: string;
  indexed: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  relevance: number;
  type: 'traditional' | 'graph';
  relatedEntities?: string[];
  policyCompliant: boolean;
}

export const RAGPolicyPanel: React.FC<RAGPolicyPanelProps> = ({ agentId, onClose }) => {
  // State management
  const [activeTab, setActiveTab] = useState<'search' | 'policies' | 'knowledge' | 'graph' | 'orgchart'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [policies, setPolicies] = useState<PolicyToggle[]>([]);
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [graphEntities, setGraphEntities] = useState<GraphEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // New state for enhanced functionality
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [customPolicies, setCustomPolicies] = useState<CustomPolicy[]>([]);
  const [orgChartUsers, setOrgChartUsers] = useState<OrgChartUser[]>([]);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [complianceReport, setComplianceReport] = useState<any>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  
  // Graph RAG
  const [graphQuery, setGraphQuery] = useState<Partial<GraphQuery>>({
    type: 'find_related',
    maxDepth: 2,
    confidenceThreshold: 0.6
  });
  const [graphResult, setGraphResult] = useState<GraphResult | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  
  // Services
  const [policyExtension] = useState(() => new PolicyExtension({
    enableCustomPolicies: true,
    enablePolicyInheritance: true,
    complianceFrameworks: ['HIPAA', 'SOC2', 'GDPR'],
    strictMode: false,
    allowPolicyOverrides: true,
    requireApprovalForNewPolicies: false,
    syncWithExistingPolicies: true,
    enableRealTimeValidation: true,
    enablePolicyAnalytics: true
  }));
  
  const [graphRAG] = useState(() => new GraphRAGExtension({
    enableAutoDiscovery: true,
    enableSmartSuggestions: true,
    enableRealTimeUpdates: true,
    maxEntitiesPerQuery: 50,
    respectPolicyBoundaries: true,
    enableAuditLogging: true,
    syncWithRAG: true,
    syncWithPolicies: true,
    enableGovernanceAware: true
  }));
  
  const [ragPolicyService] = useState(() => new RAGPolicyIntegrationService());

  // Enhanced data loading functions
  const loadEnhancedData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading enhanced RAG & Policy data...');

      // Get current user ID (in production, from auth context)
      const userId = localStorage.getItem('userId') || 'demo_user';
      
      // Load all data in parallel
      await Promise.all([
        loadPolicies(),
        loadDocuments(),
        loadCustomPolicies(userId),
        loadComplianceReport(userId),
        loadOrgChartData(userId)
      ]);

      console.log('✅ Enhanced data loading completed');
    } catch (error) {
      console.error('❌ Enhanced data loading failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  // Load documents for agent
  const loadDocuments = useCallback(async () => {
    try {
      const organizationId = localStorage.getItem('organizationId') || 'demo_org';
      const agentDocuments = await documentUploadService.getDocuments(agentId, organizationId);
      setDocuments(agentDocuments);
      console.log(`✅ Loaded ${agentDocuments.length} documents for agent`);
    } catch (error) {
      console.error('❌ Failed to load documents:', error);
      setDocuments([]);
    }
  }, [agentId]);

  // Load custom policies
  const loadCustomPolicies = useCallback(async (userId: string) => {
    try {
      const policies = await customPolicyService.getPoliciesForAgent(userId, agentId);
      setCustomPolicies(policies);
      console.log(`✅ Loaded ${policies.length} custom policies`);
    } catch (error) {
      console.error('❌ Failed to load custom policies:', error);
      setCustomPolicies([]);
    }
  }, [agentId]);

  // Load compliance report
  const loadComplianceReport = useCallback(async (userId: string) => {
    try {
      const report = await policyAwareRAGService.generateComplianceReport(userId, agentId);
      setComplianceReport(report);
      console.log('✅ Compliance report generated:', report);
    } catch (error) {
      console.error('❌ Failed to generate compliance report:', error);
      setComplianceReport(null);
    }
  }, [agentId]);

  // Load org chart data
  const loadOrgChartData = useCallback(async (userId: string) => {
    try {
      // In production, get organization ID from user context
      const organizationId = localStorage.getItem('organizationId') || 'demo_org';
      
      const users = await orgChartRAGService.searchOrgChart(organizationId, '', {});
      setOrgChartUsers(users);
      
      // Get current user context
      const context = await orgChartRAGService.getUserContext(organizationId, userId, agentId);
      setUserContext(context);
      
      console.log(`✅ Loaded ${users.length} org chart users and user context`);
    } catch (error) {
      console.error('❌ Failed to load org chart data:', error);
      setOrgChartUsers([]);
      setUserContext(null);
    }
  }, [agentId]);

  // Handle file upload with policy validation
  const handleFileUpload = useCallback(async (file: File, options: {
    category?: string;
    accessLevel?: string;
    tags?: string[];
  } = {}) => {
    try {
      setUploadingFile(true);
      setUploadProgress(null);
      console.log('📄 Uploading file with policy validation:', file.name);

      const userId = localStorage.getItem('userId') || 'demo_user';
      const organizationId = localStorage.getItem('organizationId') || 'demo_org';
      
      const document = await documentUploadService.uploadDocument(
        file,
        agentId,
        organizationId,
        userId,
        (progress) => {
          setUploadProgress(progress);
          console.log(`📊 Upload progress: ${progress.progress}% - ${progress.message}`);
        }
      );

      // Refresh documents list
      await loadDocuments();
      
      // Refresh compliance report
      await loadComplianceReport();

      console.log('✅ File uploaded successfully:', document);
      setUploadProgress(null);
      return document;
    } catch (error) {
      console.error('❌ File upload failed:', error);
      setUploadProgress(null);
      throw error;
    } finally {
      setUploadingFile(false);
    }
  }, [agentId, loadDocuments, loadComplianceReport]);

  // Enhanced search with policy filtering
  const handleEnhancedSearch = useCallback(async (query: string, filters: {
    requireCompliance?: boolean;
    categories?: string[];
    accessLevels?: string[];
  } = {}) => {
    try {
      setIsSearching(true);
      console.log('🔍 Enhanced search with policy filtering:', query);

      const organizationId = localStorage.getItem('organizationId') || 'demo_org';
      
      const results = await documentUploadService.searchDocuments(
        agentId,
        organizationId,
        query,
        {
          maxResults: 20,
          requireCompliance: filters.requireCompliance !== false,
          categories: filters.categories,
          accessLevels: filters.accessLevels
        }
      );

      // Transform search results to match expected format
      const transformedResults = results.map(doc => ({
        id: doc.id,
        title: doc.name,
        content: doc.content || doc.summary || 'No content preview available',
        source: doc.source || 'Uploaded Document',
        relevanceScore: doc.relevanceScore || 0.8,
        metadata: {
          category: doc.category,
          accessLevel: doc.accessLevel,
          tags: doc.tags,
          uploadDate: doc.uploadedAt,
          fileType: doc.fileType,
          complianceStatus: doc.complianceStatus
        }
      }));

      setSearchResults(transformedResults);
      console.log(`✅ Found ${transformedResults.length} search results`);
    } catch (error) {
      console.error('❌ Enhanced search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [agentId]);

  // Create custom policy from template
  const createPolicyFromTemplate = useCallback(async (templateId: string, customizations: any = {}) => {
    try {
      console.log('📋 Creating policy from template:', templateId);

      const userId = localStorage.getItem('userId') || 'demo_user';
      
      const policy = await customPolicyService.createPolicyFromTemplate(
        userId,
        agentId,
        templateId,
        customizations
      );

      // Refresh custom policies
      await loadCustomPolicies(userId);
      
      console.log('✅ Policy created from template:', policy);
      return policy;
    } catch (error) {
      console.error('❌ Failed to create policy from template:', error);
      throw error;
    }
  }, [agentId, loadCustomPolicies]);
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🚀 Initializing enhanced RAG & Policy services...');
        
        // Initialize services and load enhanced data
        await loadEnhancedData();
        
        console.log('✅ Enhanced services initialized successfully');
      } catch (error) {
        console.error('❌ Service initialization failed:', error);
      }
    };

    initializeServices();
  }, [loadEnhancedData]);

  // Load policies from real backend API
  const loadPolicies = useCallback(async () => {
    try {
      console.log('🔄 Loading real policies from backend API...');
      
      // Use agentId prop for policy filtering
      const targetAgentId = agentId || 'all-agents';
      
      // Call real policy assignments API
      const response = await fetch(`https://promethios-phase-7-1-api.onrender.com/api/policy-assignments?agentId=${targetAgentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'anonymous'}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Policy API error: ${response.status}`);
      }
      
      const policyData = await response.json();
      console.log('✅ Real policies loaded:', policyData);
      
      // Transform backend policy data to UI format
      const transformedPolicies: PolicyToggle[] = policyData.data.map((policy: any) => ({
        id: policy.id,
        name: policy.policyId || policy.name,
        description: policy.description,
        enabled: policy.status === 'active',
        framework: policy.policyId?.includes('HIPAA') ? 'HIPAA' : 
                  policy.policyId?.includes('SOC2') ? 'SOC2' :
                  policy.policyId?.includes('LEGAL') ? 'Legal' : 'Custom',
        complianceRate: (policy.complianceScore || 0.9) * 100,
        lastUpdated: policy.lastUpdated || policy.assignedAt,
        enforcementLevel: policy.enforcementLevel || 'medium',
        violationCount: policy.violationCount || 0
      }));
      
      setPolicies(transformedPolicies);
      console.log('✅ Policies transformed and set:', transformedPolicies);
      
    } catch (error) {
      console.error('❌ Failed to load real policies:', error);
      
      // Fallback to default policies if API fails
      const fallbackPolicies: PolicyToggle[] = [
        {
          id: 'hipaa-default',
          name: 'HIPAA Compliance',
          description: 'Healthcare data protection and privacy (Default)',
          enabled: true,
          framework: 'HIPAA',
          complianceRate: 96.0,
          lastUpdated: new Date().toISOString(),
          enforcementLevel: 'high',
          violationCount: 0
        },
        {
          id: 'soc2-default',
          name: 'SOC2 Controls',
          description: 'Security, availability, and confidentiality (Default)',
          enabled: true,
          framework: 'SOC2',
          complianceRate: 94.0,
          lastUpdated: new Date().toISOString(),
          enforcementLevel: 'high',
          violationCount: 0
        },
        {
          id: 'legal-default',
          name: 'Legal Compliance',
          description: 'Legal compliance and risk management (Default)',
          enabled: true,
          framework: 'Legal',
          complianceRate: 92.0,
          lastUpdated: new Date().toISOString(),
          enforcementLevel: 'medium',
          violationCount: 0
        },
        {
          id: 'ethical-default',
          name: 'Ethical AI',
          description: 'Responsible AI practices and bias prevention (Default)',
          enabled: true,
          framework: 'Ethical',
          complianceRate: 90.0,
          lastUpdated: new Date().toISOString(),
          enforcementLevel: 'high',
          violationCount: 0
        }
      ];
      
      setPolicies(fallbackPolicies);
      console.log('⚠️ Using fallback default policies');
    }
  }, [agentId]);

  // Load knowledge sources
  const loadKnowledgeSources = useCallback(async () => {
    try {
      // Mock knowledge source data
      const mockSources: KnowledgeSource[] = [
        {
          id: 'docs_1',
          name: 'Company Handbook',
          type: 'document',
          size: '2.4 MB',
          lastUpdated: '2024-08-15',
          indexed: true
        },
        {
          id: 'policies_1',
          name: 'Security Policies',
          type: 'policy',
          size: '1.8 MB',
          lastUpdated: '2024-08-14',
          indexed: true
        },
        {
          id: 'receipts_1',
          name: 'Agent Receipts (Last 30 days)',
          type: 'receipt',
          size: '5.2 MB',
          lastUpdated: '2024-08-17',
          indexed: true
        },
        {
          id: 'conversations_1',
          name: 'Chat History',
          type: 'conversation',
          size: '3.1 MB',
          lastUpdated: '2024-08-17',
          indexed: false
        }
      ];
      
      setKnowledgeSources(mockSources);
    } catch (error) {
      console.error('❌ Failed to load knowledge sources:', error);
    }
  }, []);

  // Perform search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      let results: SearchResult[] = [];
      
      if (searchMode === 'traditional' || searchMode === 'hybrid') {
        // Traditional RAG search
        const traditionalResults = await ragPolicyService.searchKnowledge(searchQuery, {
          maxResults: 10,
          minRelevance: 0.6,
          includeMetadata: true
        });
        
        results = results.concat(traditionalResults.map(r => ({
          id: r.id,
          title: r.title,
          content: r.content,
          source: r.source,
          relevance: r.relevance,
          type: 'traditional' as const,
          policyCompliant: r.policyCompliant
        })));
      }
      
      if (searchMode === 'graph' || searchMode === 'hybrid') {
        // Graph RAG search
        const graphResults = await performGraphSearch(searchQuery);
        results = results.concat(graphResults);
      }
      
      // Sort by relevance
      results.sort((a, b) => b.relevance - a.relevance);
      
      setSearchResults(results);
      
    } catch (error) {
      console.error('❌ Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchMode, ragPolicyService]);

  // Perform graph search
  const performGraphSearch = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      // Find entities related to the search query
      const entities = Array.from(graphRAG['entities'].values())
        .filter(entity => 
          entity.name.toLowerCase().includes(query.toLowerCase()) ||
          entity.description?.toLowerCase().includes(query.toLowerCase())
        );
      
      if (entities.length === 0) return [];
      
      // Use the first matching entity as starting point
      const startEntity = entities[0];
      
      const graphQuery: GraphQuery = {
        type: 'find_related',
        startEntity: startEntity.id,
        maxDepth: 2,
        confidenceThreshold: 0.6
      };
      
      const result = await graphRAG.queryGraph(graphQuery);
      
      return result.entities.map(entity => ({
        id: `graph_${entity.id}`,
        title: entity.name,
        content: entity.description || 'No description available',
        source: `Graph: ${entity.type}`,
        relevance: 0.8, // Graph results are generally high relevance
        type: 'graph' as const,
        relatedEntities: result.relationships
          .filter(r => r.sourceId === entity.id || r.targetId === entity.id)
          .map(r => r.sourceId === entity.id ? r.targetId : r.sourceId),
        policyCompliant: true // Graph results respect policy boundaries
      }));
      
    } catch (error) {
      console.error('❌ Graph search failed:', error);
      return [];
    }
  }, [graphRAG]);

  // Toggle policy
  const togglePolicy = useCallback(async (policyId: string) => {
    try {
      setPolicies(prev => prev.map(policy => 
        policy.id === policyId 
          ? { ...policy, enabled: !policy.enabled }
          : policy
      ));
      
      // In production, this would call the PolicyExtension
      console.log(`🔄 Toggled policy: ${policyId}`);
      
    } catch (error) {
      console.error('❌ Failed to toggle policy:', error);
    }
  }, []);

  // Upload custom policy
  const handlePolicyUpload = useCallback(async (file: File) => {
    setIsUploadingPolicy(true);
    try {
      // In production, this would upload and process the policy file
      console.log(`📄 Uploading policy: ${file.name}`);
      
      // Mock successful upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newPolicy: PolicyToggle = {
        id: `custom_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        description: 'Custom uploaded policy',
        enabled: false,
        framework: 'Custom',
        complianceRate: 0,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      
      setPolicies(prev => [...prev, newPolicy]);
      
    } catch (error) {
      console.error('❌ Policy upload failed:', error);
    } finally {
      setIsUploadingPolicy(false);
    }
  }, []);

  // Perform graph query
  const handleGraphQuery = useCallback(async () => {
    if (!selectedEntity) return;
    
    try {
      const query: GraphQuery = {
        ...graphQuery,
        startEntity: selectedEntity
      } as GraphQuery;
      
      const result = await graphRAG.queryGraph(query);
      setGraphResult(result);
      
    } catch (error) {
      console.error('❌ Graph query failed:', error);
      setGraphResult(null);
    }
  }, [graphQuery, selectedEntity, graphRAG]);

  // Get available entities for graph queries
  const getAvailableEntities = useCallback((): GraphEntity[] => {
    return Array.from(graphRAG['entities'].values());
  }, [graphRAG]);

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-600 bg-slate-800">
        <div className="flex items-center space-x-2">
          <Network className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Knowledge & Policy</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            ×
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-600 bg-slate-800">
        {[
          { key: 'search', label: 'Search', icon: Search },
          { key: 'policies', label: 'Policies', icon: Shield },
          { key: 'knowledge', label: 'Knowledge', icon: FileText },
          { key: 'graph', label: 'Graph', icon: Network }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-400 text-blue-400 bg-slate-700'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="h-full flex flex-col">
            {/* Search Controls */}
            <div className="p-4 bg-slate-800 border-b border-slate-600 space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search knowledge base..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Search</span>
                </button>
              </div>
              
              {/* Search Mode Toggle */}
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-300">Search Mode:</span>
                {['traditional', 'graph', 'hybrid'].map((mode) => (
                  <label key={mode} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="searchMode"
                      value={mode}
                      checked={searchMode === mode}
                      onChange={(e) => setSearchMode(e.target.value as any)}
                      className="text-blue-600"
                    />
                    <span className="text-sm capitalize text-slate-300">{mode}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
              {searchResults.length === 0 && !isSearching && searchQuery && (
                <div className="text-center py-8 text-slate-400">
                  <Search className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p>No results found for "{searchQuery}"</p>
                  <p className="text-sm mt-2">Try different keywords or search mode</p>
                </div>
              )}
              
              {searchResults.map((result) => (
                <div key={result.id} className="bg-slate-800 rounded-lg border border-slate-600 p-4 hover:bg-slate-700 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-white">{result.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        result.type === 'graph' 
                          ? 'bg-purple-900 text-purple-300' 
                          : 'bg-blue-900 text-blue-300'
                      }`}>
                        {result.type}
                      </span>
                      {result.policyCompliant ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-slate-300 text-sm mb-2">{result.content}</p>
                  
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Source: {result.source}</span>
                    <span>Relevance: {(result.relevance * 100).toFixed(0)}%</span>
                  </div>
                  
                  {result.relatedEntities && result.relatedEntities.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-600">
                      <span className="text-xs text-slate-400">Related: </span>
                      <span className="text-xs text-blue-400">
                        {result.relatedEntities.slice(0, 3).join(', ')}
                        {result.relatedEntities.length > 3 && ` +${result.relatedEntities.length - 3} more`}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="h-full flex flex-col">
            {/* Policy Controls */}
            <div className="p-4 bg-slate-800 border-b border-slate-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Policy Management</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => e.target.files?.[0] && handlePolicyUpload(e.target.files[0])}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Upload className="w-4 h-4" />
                    <span>Upload Policy</span>
                  </div>
                </label>
              </div>
              
              {isUploadingPolicy && (
                <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 text-blue-300 animate-spin" />
                    <span className="text-blue-200">Uploading and processing policy...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Policy List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
              {policies.map((policy) => (
                <div key={policy.id} className="bg-slate-800 rounded-lg border border-slate-600 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => togglePolicy(policy.id)}
                        className="flex items-center"
                      >
                        {policy.enabled ? (
                          <ToggleRight className="w-6 h-6 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-500" />
                        )}
                      </button>
                      <div>
                        <h4 className="font-medium text-white">{policy.name}</h4>
                        <p className="text-sm text-slate-300">{policy.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-2 py-1 text-xs rounded-full ${
                        policy.framework === 'HIPAA' ? 'bg-red-900 text-red-300' :
                        policy.framework === 'SOC2' ? 'bg-blue-900 text-blue-300' :
                        policy.framework === 'GDPR' ? 'bg-green-900 text-green-300' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {policy.framework}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-500">Compliance Rate:</span>
                      <span className={`font-medium ${
                        policy.complianceRate >= 90 ? 'text-green-600' :
                        policy.complianceRate >= 80 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {policy.complianceRate.toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-gray-500">Updated: {policy.lastUpdated}</span>
                  </div>
                  
                  {policy.enabled && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Active and enforcing</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Knowledge Tab */}
        {activeTab === 'knowledge' && (
          <div className="h-full flex flex-col">
            {/* Knowledge Controls */}
            <div className="p-4 bg-slate-800 border-b border-slate-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Knowledge Sources</h3>
                <button
                  onClick={() => setIsIndexing(true)}
                  disabled={isIndexing}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isIndexing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Reindex All</span>
                </button>
              </div>
            </div>

            {/* Knowledge Sources List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
              {knowledgeSources.map((source) => (
                <div key={source.id} className="bg-slate-800 rounded-lg border border-slate-600 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        source.type === 'document' ? 'bg-blue-900 text-blue-300' :
                        source.type === 'policy' ? 'bg-red-900 text-red-300' :
                        source.type === 'receipt' ? 'bg-green-900 text-green-300' :
                        'bg-purple-900 text-purple-300'
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{source.name}</h4>
                        <p className="text-sm text-slate-300 capitalize">{source.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center space-x-2 ${
                        source.indexed ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {source.indexed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        <span className="text-sm">
                          {source.indexed ? 'Indexed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Size: {source.size}</span>
                    <span>Updated: {source.lastUpdated}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Graph Tab */}
        {activeTab === 'graph' && (
          <div className="h-full flex flex-col">
            {/* Graph Controls */}
            <div className="p-4 bg-slate-800 border-b border-slate-600 space-y-4">
              <h3 className="text-lg font-medium text-white">Graph Exploration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Start Entity
                  </label>
                  <select
                    value={selectedEntity}
                    onChange={(e) => setSelectedEntity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select entity...</option>
                    {getAvailableEntities().map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name} ({entity.type})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Query Type
                  </label>
                  <select
                    value={graphQuery.type}
                    onChange={(e) => setGraphQuery(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="find_related">Find Related</option>
                    <option value="trace_impact">Trace Impact</option>
                    <option value="find_similar">Find Similar</option>
                    <option value="explore_connections">Explore Connections</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Max Depth: {graphQuery.maxDepth}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={graphQuery.maxDepth}
                    onChange={(e) => setGraphQuery(prev => ({ ...prev, maxDepth: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confidence: {((graphQuery.confidenceThreshold || 0.6) * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={graphQuery.confidenceThreshold}
                    onChange={(e) => setGraphQuery(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
              
              <button
                onClick={handleGraphQuery}
                disabled={!selectedEntity}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Network className="w-4 h-4" />
                <span>Explore Graph</span>
              </button>
            </div>

            {/* Graph Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {graphResult ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-white rounded-lg border p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Query Results</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Entities Found:</span>
                        <span className="ml-2 font-medium">{graphResult.summary.totalEntities}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Relationships:</span>
                        <span className="ml-2 font-medium">{graphResult.summary.totalRelationships}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Query Time:</span>
                        <span className="ml-2 font-medium">{graphResult.summary.queryTime}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Confidence:</span>
                        <span className="ml-2 font-medium">{(graphResult.summary.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Insights */}
                  {graphResult.insights.length > 0 && (
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        <span>Insights</span>
                      </h4>
                      <div className="space-y-2">
                        {graphResult.insights.map((insight, index) => (
                          <div key={index} className={`p-3 rounded-lg border-l-4 ${
                            insight.type === 'pattern' ? 'bg-blue-50 border-blue-400' :
                            insight.type === 'recommendation' ? 'bg-green-50 border-green-400' :
                            insight.type === 'risk' ? 'bg-red-50 border-red-400' :
                            'bg-yellow-50 border-yellow-400'
                          }`}>
                            <h5 className="font-medium text-gray-900">{insight.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                            {insight.actionable && insight.suggestedActions && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500">Suggested actions:</span>
                                <ul className="text-xs text-gray-600 mt-1 ml-4">
                                  {insight.suggestedActions.map((action, i) => (
                                    <li key={i} className="list-disc">{action}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Entities */}
                  <div className="bg-white rounded-lg border p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Connected Entities</h4>
                    <div className="space-y-2">
                      {graphResult.entities.map((entity) => (
                        <div key={entity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium text-gray-900">{entity.name}</span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              entity.type === 'agent' ? 'bg-blue-100 text-blue-800' :
                              entity.type === 'policy' ? 'bg-red-100 text-red-800' :
                              entity.type === 'user' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {entity.type}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedEntity(entity.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Explore
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Network className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select an entity and query type to explore the graph</p>
                  <p className="text-sm mt-2">Discover relationships and connections</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

