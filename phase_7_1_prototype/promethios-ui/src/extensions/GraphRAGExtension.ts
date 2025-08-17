/**
 * Graph RAG Extension for Promethios
 * 
 * Provides relationship-aware knowledge retrieval that understands connections
 * between agents, policies, users, and governance entities. Designed for
 * standard operators with intuitive interfaces and practical functionality.
 */

import { Extension } from './Extension';
import { PolicyExtension } from './PolicyExtension';
import { UniversalGovernanceAdapter } from '../services/UniversalGovernanceAdapter';
import { authApiService } from '../services/authApiService';

// User-friendly interfaces for standard operators
export interface GraphEntity {
  id: string;
  type: 'agent' | 'user' | 'policy' | 'receipt' | 'organization' | 'document' | 'conversation';
  name: string;
  description?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface GraphRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'governed_by' | 'interacts_with' | 'depends_on' | 'similar_to' | 'contains' | 'created_by' | 'affects';
  strength: number; // 0-1 indicating relationship strength
  metadata: Record<string, any>;
  createdAt: string;
}

export interface GraphQuery {
  // Simple query types for standard operators
  type: 'find_related' | 'trace_impact' | 'find_similar' | 'explore_connections';
  
  // User-friendly parameters
  startEntity: string; // Entity ID to start from
  maxDepth?: number; // How many relationship hops (default: 2)
  relationshipTypes?: string[]; // Which types of relationships to follow
  entityTypes?: string[]; // Which types of entities to include
  
  // Practical filters
  timeRange?: {
    start?: string;
    end?: string;
  };
  organizationScope?: string;
  confidenceThreshold?: number; // Minimum relationship strength (0-1)
}

export interface GraphResult {
  entities: GraphEntity[];
  relationships: GraphRelationship[];
  paths: GraphPath[];
  insights: GraphInsight[];
  summary: {
    totalEntities: number;
    totalRelationships: number;
    queryTime: number;
    confidence: number;
  };
}

export interface GraphPath {
  id: string;
  entities: GraphEntity[];
  relationships: GraphRelationship[];
  pathType: 'direct' | 'indirect' | 'circular';
  strength: number;
  description: string; // Human-readable path description
}

export interface GraphInsight {
  type: 'pattern' | 'anomaly' | 'recommendation' | 'risk';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedActions?: string[];
  relatedEntities: string[];
}

export interface GraphRAGConfig {
  // User-friendly settings
  enableAutoDiscovery: boolean; // Automatically discover new relationships
  enableSmartSuggestions: boolean; // Suggest related queries
  enableRealTimeUpdates: boolean; // Update graph as new data comes in
  
  // Performance settings
  maxEntitiesPerQuery: number;
  maxRelationshipsPerQuery: number;
  cacheResults: boolean;
  cacheDuration: number; // minutes
  
  // Privacy and governance
  respectPolicyBoundaries: boolean; // Don't cross policy-restricted relationships
  enableAuditLogging: boolean;
  requireApprovalForSensitiveQueries: boolean;
  
  // Integration settings
  syncWithRAG: boolean; // Integrate with traditional RAG
  syncWithPolicies: boolean; // Integrate with policy system
  enableGovernanceAware: boolean; // Apply governance to graph queries
}

/**
 * User-friendly Graph RAG Extension
 * Designed for standard operators to easily explore relationships and connections
 */
export class GraphRAGExtension extends Extension {
  private config: GraphRAGConfig;
  private entities: Map<string, GraphEntity> = new Map();
  private relationships: Map<string, GraphRelationship> = new Map();
  private queryCache: Map<string, { result: GraphResult; timestamp: number }> = new Map();
  private policyExtension?: PolicyExtension;
  private governanceAdapter?: UniversalGovernanceAdapter;

  constructor(config: Partial<GraphRAGConfig> = {}) {
    super('GraphRAG', '1.0.0');
    
    this.config = {
      enableAutoDiscovery: true,
      enableSmartSuggestions: true,
      enableRealTimeUpdates: true,
      maxEntitiesPerQuery: 50,
      maxRelationshipsPerQuery: 100,
      cacheResults: true,
      cacheDuration: 15, // 15 minutes
      respectPolicyBoundaries: true,
      enableAuditLogging: true,
      requireApprovalForSensitiveQueries: false,
      syncWithRAG: true,
      syncWithPolicies: true,
      enableGovernanceAware: true,
      ...config
    };

    console.log('🕸️ Graph RAG Extension initialized with user-friendly configuration');
  }

  async initialize(): Promise<boolean> {
    try {
      // Initialize integrations
      if (this.config.syncWithPolicies) {
        this.policyExtension = new PolicyExtension({
          enableCustomPolicies: true,
          enablePolicyInheritance: true,
          complianceFrameworks: ['HIPAA', 'SOC2', 'GDPR'],
          strictMode: false,
          allowPolicyOverrides: false,
          requireApprovalForNewPolicies: false,
          syncWithExistingPolicies: true,
          enableRealTimeValidation: true,
          enablePolicyAnalytics: true
        });
        await this.policyExtension.initialize();
      }

      if (this.config.enableGovernanceAware) {
        this.governanceAdapter = new UniversalGovernanceAdapter();
      }

      // Load initial graph data
      await this.loadInitialGraphData();

      // Set up auto-discovery if enabled
      if (this.config.enableAutoDiscovery) {
        this.startAutoDiscovery();
      }

      this.enabled = true;
      console.log('✅ Graph RAG Extension initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Graph RAG Extension:', error);
      return false;
    }
  }

  /**
   * User-friendly graph query method
   * Designed for standard operators with simple, intuitive parameters
   */
  async queryGraph(query: GraphQuery): Promise<GraphResult> {
    try {
      console.log(`🔍 [GraphRAG] Executing ${query.type} query from entity: ${query.startEntity}`);

      // Check cache first
      const cacheKey = this.generateCacheKey(query);
      if (this.config.cacheResults) {
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
          console.log('📋 [GraphRAG] Returning cached result');
          return cached;
        }
      }

      // Validate query and apply governance
      const validationResult = await this.validateQuery(query);
      if (!validationResult.valid) {
        throw new Error(`Query validation failed: ${validationResult.reason}`);
      }

      const startTime = Date.now();
      let result: GraphResult;

      // Execute query based on type
      switch (query.type) {
        case 'find_related':
          result = await this.findRelatedEntities(query);
          break;
        case 'trace_impact':
          result = await this.traceImpactPaths(query);
          break;
        case 'find_similar':
          result = await this.findSimilarEntities(query);
          break;
        case 'explore_connections':
          result = await this.exploreConnections(query);
          break;
        default:
          throw new Error(`Unknown query type: ${query.type}`);
      }

      // Add timing and confidence
      result.summary.queryTime = Date.now() - startTime;
      result.summary.confidence = this.calculateOverallConfidence(result);

      // Generate insights for standard operators
      result.insights = await this.generateUserFriendlyInsights(result, query);

      // Cache result
      if (this.config.cacheResults) {
        this.cacheResult(cacheKey, result);
      }

      // Log for audit
      if (this.config.enableAuditLogging) {
        await this.logGraphQuery(query, result);
      }

      console.log(`✅ [GraphRAG] Query completed: ${result.entities.length} entities, ${result.relationships.length} relationships`);
      return result;

    } catch (error) {
      console.error('❌ [GraphRAG] Query failed:', error);
      
      // Return empty result with error information
      return {
        entities: [],
        relationships: [],
        paths: [],
        insights: [{
          type: 'anomaly',
          title: 'Query Failed',
          description: `Graph query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          confidence: 0,
          actionable: false,
          relatedEntities: []
        }],
        summary: {
          totalEntities: 0,
          totalRelationships: 0,
          queryTime: 0,
          confidence: 0
        }
      };
    }
  }

  /**
   * Get smart suggestions for follow-up queries
   * Helps standard operators discover relevant information
   */
  async getSmartSuggestions(currentQuery: GraphQuery, currentResult: GraphResult): Promise<{
    title: string;
    description: string;
    query: GraphQuery;
    reasoning: string;
  }[]> {
    if (!this.config.enableSmartSuggestions) return [];

    const suggestions: {
      title: string;
      description: string;
      query: GraphQuery;
      reasoning: string;
    }[] = [];

    try {
      // Suggest exploring high-strength relationships
      const strongRelationships = currentResult.relationships
        .filter(r => r.strength > 0.7)
        .slice(0, 3);

      for (const rel of strongRelationships) {
        const targetEntity = currentResult.entities.find(e => e.id === rel.targetId);
        if (targetEntity) {
          suggestions.push({
            title: `Explore ${targetEntity.name}`,
            description: `Discover what's connected to ${targetEntity.name} (${targetEntity.type})`,
            query: {
              type: 'find_related',
              startEntity: targetEntity.id,
              maxDepth: 2,
              relationshipTypes: currentQuery.relationshipTypes,
              entityTypes: currentQuery.entityTypes
            },
            reasoning: `Strong relationship (${(rel.strength * 100).toFixed(0)}% confidence) suggests important connections`
          });
        }
      }

      // Suggest impact analysis for policy entities
      const policyEntities = currentResult.entities.filter(e => e.type === 'policy');
      if (policyEntities.length > 0) {
        suggestions.push({
          title: 'Analyze Policy Impact',
          description: 'See how policy changes would affect connected entities',
          query: {
            type: 'trace_impact',
            startEntity: policyEntities[0].id,
            maxDepth: 3,
            relationshipTypes: ['governed_by', 'affects', 'depends_on']
          },
          reasoning: 'Policy entities found - impact analysis can reveal governance effects'
        });
      }

      // Suggest finding similar patterns
      if (currentResult.entities.length > 5) {
        suggestions.push({
          title: 'Find Similar Patterns',
          description: 'Discover entities with similar relationship patterns',
          query: {
            type: 'find_similar',
            startEntity: currentQuery.startEntity,
            maxDepth: 2,
            confidenceThreshold: 0.6
          },
          reasoning: 'Multiple entities found - pattern analysis can reveal insights'
        });
      }

      return suggestions.slice(0, 5); // Limit to 5 suggestions

    } catch (error) {
      console.error('❌ [GraphRAG] Failed to generate smart suggestions:', error);
      return [];
    }
  }

  /**
   * Add new entity to the graph
   * Automatically discovers relationships if auto-discovery is enabled
   */
  async addEntity(entity: Omit<GraphEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<GraphEntity> {
    const newEntity: GraphEntity = {
      ...entity,
      id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.entities.set(newEntity.id, newEntity);

    // Auto-discover relationships if enabled
    if (this.config.enableAutoDiscovery) {
      await this.discoverRelationshipsForEntity(newEntity);
    }

    console.log(`✅ [GraphRAG] Added entity: ${newEntity.name} (${newEntity.type})`);
    return newEntity;
  }

  /**
   * Add new relationship to the graph
   */
  async addRelationship(relationship: Omit<GraphRelationship, 'id' | 'createdAt'>): Promise<GraphRelationship> {
    // Validate that both entities exist
    if (!this.entities.has(relationship.sourceId) || !this.entities.has(relationship.targetId)) {
      throw new Error('Both source and target entities must exist');
    }

    const newRelationship: GraphRelationship = {
      ...relationship,
      id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    this.relationships.set(newRelationship.id, newRelationship);

    console.log(`✅ [GraphRAG] Added relationship: ${relationship.type} (strength: ${relationship.strength})`);
    return newRelationship;
  }

  /**
   * Get graph statistics for dashboard display
   */
  getGraphStatistics(): {
    totalEntities: number;
    totalRelationships: number;
    entityTypes: Record<string, number>;
    relationshipTypes: Record<string, number>;
    averageConnections: number;
    strongConnections: number;
    lastUpdated: string;
  } {
    const entityTypes: Record<string, number> = {};
    const relationshipTypes: Record<string, number> = {};

    // Count entity types
    for (const entity of this.entities.values()) {
      entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1;
    }

    // Count relationship types and strong connections
    let strongConnections = 0;
    for (const relationship of this.relationships.values()) {
      relationshipTypes[relationship.type] = (relationshipTypes[relationship.type] || 0) + 1;
      if (relationship.strength > 0.7) {
        strongConnections++;
      }
    }

    const averageConnections = this.entities.size > 0 
      ? this.relationships.size / this.entities.size 
      : 0;

    return {
      totalEntities: this.entities.size,
      totalRelationships: this.relationships.size,
      entityTypes,
      relationshipTypes,
      averageConnections: Math.round(averageConnections * 100) / 100,
      strongConnections,
      lastUpdated: new Date().toISOString()
    };
  }

  // Private helper methods

  private async loadInitialGraphData(): Promise<void> {
    try {
      // Load entities from existing data sources
      await this.loadAgentEntities();
      await this.loadPolicyEntities();
      await this.loadUserEntities();
      await this.loadReceiptEntities();

      // Discover initial relationships
      await this.discoverInitialRelationships();

      console.log(`📊 [GraphRAG] Loaded ${this.entities.size} entities and ${this.relationships.size} relationships`);

    } catch (error) {
      console.error('❌ [GraphRAG] Failed to load initial graph data:', error);
    }
  }

  private async loadAgentEntities(): Promise<void> {
    // Mock agent data - in production, this would load from actual agent storage
    const mockAgents = [
      { id: 'agent_1', name: 'Customer Service Agent', description: 'Handles customer inquiries' },
      { id: 'agent_2', name: 'Data Analysis Agent', description: 'Processes and analyzes data' },
      { id: 'agent_3', name: 'Compliance Agent', description: 'Ensures regulatory compliance' }
    ];

    for (const agent of mockAgents) {
      const entity: GraphEntity = {
        id: agent.id,
        type: 'agent',
        name: agent.name,
        description: agent.description,
        metadata: {
          status: 'active',
          capabilities: ['chat', 'analysis'],
          trustScore: 0.85
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.entities.set(entity.id, entity);
    }
  }

  private async loadPolicyEntities(): Promise<void> {
    // Mock policy data - in production, this would load from PolicyExtension
    const mockPolicies = [
      { id: 'policy_hipaa', name: 'HIPAA Compliance', description: 'Healthcare data protection' },
      { id: 'policy_soc2', name: 'SOC2 Controls', description: 'Security and availability controls' },
      { id: 'policy_custom_1', name: 'Company Data Policy', description: 'Internal data handling rules' }
    ];

    for (const policy of mockPolicies) {
      const entity: GraphEntity = {
        id: policy.id,
        type: 'policy',
        name: policy.name,
        description: policy.description,
        metadata: {
          framework: policy.id.includes('hipaa') ? 'HIPAA' : policy.id.includes('soc2') ? 'SOC2' : 'Custom',
          status: 'active',
          complianceRate: 0.92
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.entities.set(entity.id, entity);
    }
  }

  private async loadUserEntities(): Promise<void> {
    // Mock user data - in production, this would load from user management
    const mockUsers = [
      { id: 'user_1', name: 'John Smith', description: 'Operations Manager' },
      { id: 'user_2', name: 'Sarah Johnson', description: 'Compliance Officer' },
      { id: 'user_3', name: 'Mike Chen', description: 'Data Analyst' }
    ];

    for (const user of mockUsers) {
      const entity: GraphEntity = {
        id: user.id,
        type: 'user',
        name: user.name,
        description: user.description,
        metadata: {
          role: user.description,
          department: 'Operations',
          accessLevel: 'standard'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.entities.set(entity.id, entity);
    }
  }

  private async loadReceiptEntities(): Promise<void> {
    // Mock receipt data - in production, this would load from receipt storage
    const mockReceipts = [
      { id: 'receipt_1', name: 'Customer Query #1234', description: 'Successful customer service interaction' },
      { id: 'receipt_2', name: 'Data Analysis #5678', description: 'Quarterly report generation' },
      { id: 'receipt_3', name: 'Compliance Check #9012', description: 'Policy compliance verification' }
    ];

    for (const receipt of mockReceipts) {
      const entity: GraphEntity = {
        id: receipt.id,
        type: 'receipt',
        name: receipt.name,
        description: receipt.description,
        metadata: {
          outcome: 'success',
          trustScore: 0.88,
          complianceStatus: 'compliant'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.entities.set(entity.id, entity);
    }
  }

  private async discoverInitialRelationships(): Promise<void> {
    // Create meaningful relationships between entities
    const relationships = [
      // Agent-Policy relationships
      { sourceId: 'agent_1', targetId: 'policy_hipaa', type: 'governed_by', strength: 0.9 },
      { sourceId: 'agent_2', targetId: 'policy_soc2', type: 'governed_by', strength: 0.85 },
      { sourceId: 'agent_3', targetId: 'policy_custom_1', type: 'governed_by', strength: 0.95 },
      
      // User-Agent relationships
      { sourceId: 'user_1', targetId: 'agent_1', type: 'interacts_with', strength: 0.8 },
      { sourceId: 'user_2', targetId: 'agent_3', type: 'interacts_with', strength: 0.9 },
      { sourceId: 'user_3', targetId: 'agent_2', type: 'interacts_with', strength: 0.85 },
      
      // Receipt-Agent relationships
      { sourceId: 'receipt_1', targetId: 'agent_1', type: 'created_by', strength: 1.0 },
      { sourceId: 'receipt_2', targetId: 'agent_2', type: 'created_by', strength: 1.0 },
      { sourceId: 'receipt_3', targetId: 'agent_3', type: 'created_by', strength: 1.0 },
      
      // Policy dependencies
      { sourceId: 'policy_custom_1', targetId: 'policy_soc2', type: 'depends_on', strength: 0.7 }
    ];

    for (const rel of relationships) {
      const relationship: GraphRelationship = {
        id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceId: rel.sourceId,
        targetId: rel.targetId,
        type: rel.type as any,
        strength: rel.strength,
        metadata: {
          discoveredBy: 'initial_load',
          confidence: rel.strength
        },
        createdAt: new Date().toISOString()
      };
      this.relationships.set(relationship.id, relationship);
    }
  }

  private async findRelatedEntities(query: GraphQuery): Promise<GraphResult> {
    const startEntity = this.entities.get(query.startEntity);
    if (!startEntity) {
      throw new Error('Start entity not found');
    }

    const maxDepth = query.maxDepth || 2;
    const visited = new Set<string>();
    const resultEntities = new Map<string, GraphEntity>();
    const resultRelationships = new Map<string, GraphRelationship>();
    const paths: GraphPath[] = [];

    // Breadth-first search to find related entities
    const queue: { entityId: string; depth: number; path: string[] }[] = [
      { entityId: query.startEntity, depth: 0, path: [query.startEntity] }
    ];

    resultEntities.set(startEntity.id, startEntity);

    while (queue.length > 0) {
      const { entityId, depth, path } = queue.shift()!;
      
      if (depth >= maxDepth) continue;
      if (visited.has(entityId)) continue;
      
      visited.add(entityId);

      // Find all relationships from this entity
      for (const relationship of this.relationships.values()) {
        let nextEntityId: string | null = null;
        
        if (relationship.sourceId === entityId) {
          nextEntityId = relationship.targetId;
        } else if (relationship.targetId === entityId) {
          nextEntityId = relationship.sourceId;
        }

        if (!nextEntityId) continue;

        // Apply filters
        if (query.relationshipTypes && !query.relationshipTypes.includes(relationship.type)) {
          continue;
        }

        if (query.confidenceThreshold && relationship.strength < query.confidenceThreshold) {
          continue;
        }

        const nextEntity = this.entities.get(nextEntityId);
        if (!nextEntity) continue;

        if (query.entityTypes && !query.entityTypes.includes(nextEntity.type)) {
          continue;
        }

        // Add to results
        resultEntities.set(nextEntity.id, nextEntity);
        resultRelationships.set(relationship.id, relationship);

        // Add to queue for further exploration
        if (depth + 1 < maxDepth) {
          queue.push({
            entityId: nextEntityId,
            depth: depth + 1,
            path: [...path, nextEntityId]
          });
        }

        // Create path
        if (path.length > 1) {
          const pathEntities = path.map(id => this.entities.get(id)!).filter(Boolean);
          const pathRelationships = this.getRelationshipsForPath(path);
          
          paths.push({
            id: `path_${paths.length}`,
            entities: pathEntities,
            relationships: pathRelationships,
            pathType: path.includes(nextEntityId) ? 'circular' : 'indirect',
            strength: pathRelationships.reduce((sum, r) => sum + r.strength, 0) / pathRelationships.length,
            description: this.generatePathDescription(pathEntities, pathRelationships)
          });
        }
      }
    }

    return {
      entities: Array.from(resultEntities.values()),
      relationships: Array.from(resultRelationships.values()),
      paths,
      insights: [],
      summary: {
        totalEntities: resultEntities.size,
        totalRelationships: resultRelationships.size,
        queryTime: 0,
        confidence: 0
      }
    };
  }

  private async traceImpactPaths(query: GraphQuery): Promise<GraphResult> {
    // Similar to findRelatedEntities but focuses on impact relationships
    const impactTypes = ['affects', 'depends_on', 'governed_by'];
    const modifiedQuery = {
      ...query,
      relationshipTypes: query.relationshipTypes || impactTypes
    };
    
    return this.findRelatedEntities(modifiedQuery);
  }

  private async findSimilarEntities(query: GraphQuery): Promise<GraphResult> {
    const startEntity = this.entities.get(query.startEntity);
    if (!startEntity) {
      throw new Error('Start entity not found');
    }

    // Find entities with similar relationship patterns
    const startRelationships = Array.from(this.relationships.values())
      .filter(r => r.sourceId === query.startEntity || r.targetId === query.startEntity);

    const similarEntities = new Map<string, { entity: GraphEntity; similarity: number }>();

    for (const entity of this.entities.values()) {
      if (entity.id === query.startEntity) continue;
      if (query.entityTypes && !query.entityTypes.includes(entity.type)) continue;

      const entityRelationships = Array.from(this.relationships.values())
        .filter(r => r.sourceId === entity.id || r.targetId === entity.id);

      const similarity = this.calculateSimilarity(startRelationships, entityRelationships);
      
      if (similarity >= (query.confidenceThreshold || 0.5)) {
        similarEntities.set(entity.id, { entity, similarity });
      }
    }

    // Sort by similarity
    const sortedSimilar = Array.from(similarEntities.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, this.config.maxEntitiesPerQuery);

    return {
      entities: [startEntity, ...sortedSimilar.map(s => s.entity)],
      relationships: [],
      paths: [],
      insights: [],
      summary: {
        totalEntities: sortedSimilar.length + 1,
        totalRelationships: 0,
        queryTime: 0,
        confidence: 0
      }
    };
  }

  private async exploreConnections(query: GraphQuery): Promise<GraphResult> {
    // Comprehensive exploration of all connections
    return this.findRelatedEntities({
      ...query,
      maxDepth: query.maxDepth || 3,
      relationshipTypes: undefined, // Include all relationship types
      entityTypes: undefined // Include all entity types
    });
  }

  private calculateSimilarity(relationships1: GraphRelationship[], relationships2: GraphRelationship[]): number {
    if (relationships1.length === 0 && relationships2.length === 0) return 1;
    if (relationships1.length === 0 || relationships2.length === 0) return 0;

    const types1 = new Set(relationships1.map(r => r.type));
    const types2 = new Set(relationships2.map(r => r.type));
    
    const intersection = new Set([...types1].filter(x => types2.has(x)));
    const union = new Set([...types1, ...types2]);
    
    return intersection.size / union.size;
  }

  private getRelationshipsForPath(path: string[]): GraphRelationship[] {
    const pathRelationships: GraphRelationship[] = [];
    
    for (let i = 0; i < path.length - 1; i++) {
      const sourceId = path[i];
      const targetId = path[i + 1];
      
      const relationship = Array.from(this.relationships.values())
        .find(r => 
          (r.sourceId === sourceId && r.targetId === targetId) ||
          (r.sourceId === targetId && r.targetId === sourceId)
        );
      
      if (relationship) {
        pathRelationships.push(relationship);
      }
    }
    
    return pathRelationships;
  }

  private generatePathDescription(entities: GraphEntity[], relationships: GraphRelationship[]): string {
    if (entities.length < 2) return 'Single entity';
    
    const descriptions: string[] = [];
    for (let i = 0; i < relationships.length; i++) {
      const rel = relationships[i];
      const source = entities[i];
      const target = entities[i + 1];
      
      descriptions.push(`${source.name} ${rel.type.replace(/_/g, ' ')} ${target.name}`);
    }
    
    return descriptions.join(' → ');
  }

  private async generateUserFriendlyInsights(result: GraphResult, query: GraphQuery): Promise<GraphInsight[]> {
    const insights: GraphInsight[] = [];

    // Pattern insights
    const entityTypeCounts = result.entities.reduce((acc, entity) => {
      acc[entity.type] = (acc[entity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (entityTypeCounts.policy && entityTypeCounts.agent) {
      insights.push({
        type: 'pattern',
        title: 'Governance Pattern Detected',
        description: `Found ${entityTypeCounts.policy} policies governing ${entityTypeCounts.agent} agents`,
        confidence: 0.9,
        actionable: true,
        suggestedActions: ['Review policy coverage', 'Check for policy conflicts'],
        relatedEntities: result.entities.filter(e => e.type === 'policy' || e.type === 'agent').map(e => e.id)
      });
    }

    // Strong relationship insights
    const strongRelationships = result.relationships.filter(r => r.strength > 0.8);
    if (strongRelationships.length > 0) {
      insights.push({
        type: 'pattern',
        title: 'Strong Connections Found',
        description: `Discovered ${strongRelationships.length} high-confidence relationships`,
        confidence: 0.85,
        actionable: true,
        suggestedActions: ['Explore these connections further', 'Consider these for optimization'],
        relatedEntities: strongRelationships.flatMap(r => [r.sourceId, r.targetId])
      });
    }

    // Recommendation insights
    if (result.entities.length > 10) {
      insights.push({
        type: 'recommendation',
        title: 'Large Result Set',
        description: 'Consider adding filters to focus your search',
        confidence: 0.7,
        actionable: true,
        suggestedActions: ['Add entity type filters', 'Increase confidence threshold', 'Reduce search depth'],
        relatedEntities: []
      });
    }

    return insights;
  }

  private async validateQuery(query: GraphQuery): Promise<{ valid: boolean; reason?: string }> {
    // Check if start entity exists
    if (!this.entities.has(query.startEntity)) {
      return { valid: false, reason: 'Start entity not found' };
    }

    // Check governance restrictions
    if (this.config.respectPolicyBoundaries && this.governanceAdapter) {
      // Add governance validation here
    }

    // Check if query requires approval
    if (this.config.requireApprovalForSensitiveQueries) {
      const startEntity = this.entities.get(query.startEntity)!;
      if (startEntity.type === 'policy' && query.type === 'trace_impact') {
        return { valid: false, reason: 'Sensitive query requires approval' };
      }
    }

    return { valid: true };
  }

  private generateCacheKey(query: GraphQuery): string {
    return JSON.stringify({
      type: query.type,
      startEntity: query.startEntity,
      maxDepth: query.maxDepth,
      relationshipTypes: query.relationshipTypes?.sort(),
      entityTypes: query.entityTypes?.sort(),
      confidenceThreshold: query.confidenceThreshold
    });
  }

  private getCachedResult(cacheKey: string): GraphResult | null {
    const cached = this.queryCache.get(cacheKey);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.config.cacheDuration * 60 * 1000) {
      this.queryCache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }

  private cacheResult(cacheKey: string, result: GraphResult): void {
    this.queryCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    // Clean old cache entries
    if (this.queryCache.size > 100) {
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
    }
  }

  private calculateOverallConfidence(result: GraphResult): number {
    if (result.relationships.length === 0) return 1;
    
    const avgStrength = result.relationships.reduce((sum, r) => sum + r.strength, 0) / result.relationships.length;
    return Math.round(avgStrength * 100) / 100;
  }

  private async logGraphQuery(query: GraphQuery, result: GraphResult): Promise<void> {
    if (!this.governanceAdapter) return;

    try {
      await this.governanceAdapter.createAuditEntry({
        agentId: 'graph_rag_system',
        action: 'graph_query',
        details: {
          queryType: query.type,
          startEntity: query.startEntity,
          resultCount: result.entities.length,
          confidence: result.summary.confidence,
          queryTime: result.summary.queryTime
        },
        timestamp: new Date().toISOString(),
        userId: 'system'
      });
    } catch (error) {
      console.error('❌ [GraphRAG] Failed to log query:', error);
    }
  }

  private startAutoDiscovery(): void {
    // Set up periodic auto-discovery
    setInterval(() => {
      this.performAutoDiscovery();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async performAutoDiscovery(): Promise<void> {
    try {
      console.log('🔍 [GraphRAG] Performing auto-discovery...');
      
      // Discover new relationships based on patterns
      // This would integrate with actual data sources in production
      
      console.log('✅ [GraphRAG] Auto-discovery completed');
    } catch (error) {
      console.error('❌ [GraphRAG] Auto-discovery failed:', error);
    }
  }

  private async discoverRelationshipsForEntity(entity: GraphEntity): Promise<void> {
    // Auto-discover relationships for new entities
    // This would use ML/pattern matching in production
    console.log(`🔍 [GraphRAG] Discovering relationships for ${entity.name}`);
  }
}

// Export singleton instance
export const graphRAGExtension = new GraphRAGExtension();

