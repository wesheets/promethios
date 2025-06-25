/**
 * Orchestration Service Extension
 * 
 * Extends the existing multiAgentService with orchestration capabilities.
 * Maintains backward compatibility while adding flow execution features.
 */

import { 
  OrchestrationFlow, 
  OrchestrationContext, 
  OrchestrationResult, 
  OrchestrationEvent, 
  OrchestrationEngine,
  ExecutionStatus,
  ValidationResult,
  LegacyConverter,
  OrchestrationStrategy,
  OrchestrationStrategyRegistry
} from '../types/orchestration';
import { multiAgentService, MultiAgentContext } from '../../../services/multiAgentService';
import { AgentWrapperRegistry } from './AgentWrapperRegistry';

/**
 * Orchestration Engine Implementation
 */
export class PrometheosOrchestrationEngine implements OrchestrationEngine {
  private activeFlows = new Map<string, OrchestrationFlow>();
  private flowResults = new Map<string, OrchestrationResult>();
  private eventListeners: Array<(event: OrchestrationEvent) => void> = [];
  private strategyRegistry: OrchestrationStrategyRegistry;
  private agentRegistry: AgentWrapperRegistry;

  constructor() {
    this.strategyRegistry = new DefaultStrategyRegistry();
    this.agentRegistry = AgentWrapperRegistry.getInstance();
    this.initializeDefaultStrategies();
  }

  /**
   * Execute a flow with full orchestration
   */
  async executeFlow(flow: OrchestrationFlow, context: OrchestrationContext): Promise<OrchestrationResult> {
    const startTime = new Date();
    
    try {
      // Validate flow before execution
      const validation = await this.validateFlow(flow);
      if (!validation.isValid) {
        throw new Error(`Flow validation failed: ${validation.errors.join(', ')}`);
      }

      // Create execution result
      const result: OrchestrationResult = {
        flowId: flow.id,
        status: 'running',
        startTime,
        nodeResults: new Map(),
        errors: [],
        metrics: {
          totalNodes: flow.nodes.length,
          completedNodes: 0,
          failedNodes: 0,
          skippedNodes: 0,
          averageNodeTime: 0,
          totalRetries: 0
        }
      };

      // Store active flow
      this.activeFlows.set(flow.id, flow);
      this.flowResults.set(flow.id, result);

      // Emit flow started event
      this.emitEvent({
        type: 'flow_started',
        flowId: flow.id,
        timestamp: startTime,
        data: { context }
      });

      // Get orchestration strategy
      const strategy = this.strategyRegistry.getStrategy(flow.type, flow.collaborationModel);
      if (!strategy) {
        throw new Error(`No orchestration strategy found for ${flow.type}/${flow.collaborationModel}`);
      }

      // Execute using strategy
      const finalResult = await strategy.execute(flow, context, this);
      
      // Update final result
      finalResult.endTime = new Date();
      finalResult.duration = finalResult.endTime.getTime() - startTime.getTime();
      this.flowResults.set(flow.id, finalResult);

      // Emit completion event
      this.emitEvent({
        type: 'flow_completed',
        flowId: flow.id,
        timestamp: finalResult.endTime,
        data: { result: finalResult }
      });

      return finalResult;

    } catch (error) {
      const errorResult: OrchestrationResult = {
        flowId: flow.id,
        status: 'failed',
        startTime,
        endTime: new Date(),
        nodeResults: new Map(),
        errors: [{
          nodeId: 'flow',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
          retryAttempt: 0
        }],
        metrics: {
          totalNodes: flow.nodes.length,
          completedNodes: 0,
          failedNodes: flow.nodes.length,
          skippedNodes: 0,
          averageNodeTime: 0,
          totalRetries: 0
        }
      };

      this.flowResults.set(flow.id, errorResult);
      
      this.emitEvent({
        type: 'flow_failed',
        flowId: flow.id,
        timestamp: new Date(),
        data: { error: error instanceof Error ? error.message : String(error) },
        severity: 'error'
      });

      throw error;
    } finally {
      this.activeFlows.delete(flow.id);
    }
  }

  /**
   * Pause flow execution
   */
  async pauseFlow(flowId: string): Promise<boolean> {
    const result = this.flowResults.get(flowId);
    if (result && result.status === 'running') {
      result.status = 'paused';
      this.emitEvent({
        type: 'flow_paused',
        flowId,
        timestamp: new Date()
      });
      return true;
    }
    return false;
  }

  /**
   * Resume flow execution
   */
  async resumeFlow(flowId: string): Promise<boolean> {
    const result = this.flowResults.get(flowId);
    if (result && result.status === 'paused') {
      result.status = 'running';
      this.emitEvent({
        type: 'flow_resumed',
        flowId,
        timestamp: new Date()
      });
      return true;
    }
    return false;
  }

  /**
   * Cancel flow execution
   */
  async cancelFlow(flowId: string): Promise<boolean> {
    const result = this.flowResults.get(flowId);
    if (result && (result.status === 'running' || result.status === 'paused')) {
      result.status = 'cancelled';
      result.endTime = new Date();
      this.emitEvent({
        type: 'flow_cancelled',
        flowId,
        timestamp: new Date()
      });
      this.activeFlows.delete(flowId);
      return true;
    }
    return false;
  }

  /**
   * Get flow status
   */
  async getFlowStatus(flowId: string): Promise<ExecutionStatus> {
    const result = this.flowResults.get(flowId);
    return result?.status || 'pending';
  }

  /**
   * Get flow result
   */
  async getFlowResult(flowId: string): Promise<OrchestrationResult | null> {
    return this.flowResults.get(flowId) || null;
  }

  /**
   * Get active flows
   */
  async getActiveFlows(): Promise<string[]> {
    return Array.from(this.activeFlows.keys());
  }

  /**
   * Add event listener
   */
  addEventListener(callback: (event: OrchestrationEvent) => void): void {
    this.eventListeners.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(callback: (event: OrchestrationEvent) => void): void {
    const index = this.eventListeners.indexOf(callback);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Validate flow
   */
  async validateFlow(flow: OrchestrationFlow): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!flow.nodes || flow.nodes.length === 0) {
      errors.push('Flow must have at least one node');
    }

    if (!flow.entryPointId) {
      errors.push('Flow must have an entry point');
    }

    if (!flow.exitPointIds || flow.exitPointIds.length === 0) {
      errors.push('Flow must have at least one exit point');
    }

    // Validate nodes
    for (const node of flow.nodes) {
      if (!node.agentId) {
        errors.push(`Node ${node.id} must have an agent ID`);
      }
      
      // Check if agent exists
      const wrapper = this.agentRegistry.getWrapper(node.agentId);
      if (!wrapper) {
        warnings.push(`Agent ${node.agentId} not found in registry`);
      }
    }

    // Validate connections
    for (const connection of flow.connections) {
      const sourceExists = flow.nodes.some(n => n.id === connection.sourceNodeId);
      const targetExists = flow.nodes.some(n => n.id === connection.targetNodeId);
      
      if (!sourceExists) {
        errors.push(`Connection ${connection.id} references non-existent source node ${connection.sourceNodeId}`);
      }
      
      if (!targetExists) {
        errors.push(`Connection ${connection.id} references non-existent target node ${connection.targetNodeId}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Emit orchestration event
   */
  private emitEvent(event: OrchestrationEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in orchestration event listener:', error);
      }
    });
  }

  /**
   * Initialize default orchestration strategies
   */
  private initializeDefaultStrategies(): void {
    // Sequential strategy
    this.strategyRegistry.registerStrategy(new SequentialOrchestrationStrategy());
    
    // Parallel strategy
    this.strategyRegistry.registerStrategy(new ParallelOrchestrationStrategy());
    
    // Hierarchical strategy
    this.strategyRegistry.registerStrategy(new HierarchicalOrchestrationStrategy());
  }
}

/**
 * Default Strategy Registry Implementation
 */
class DefaultStrategyRegistry implements OrchestrationStrategyRegistry {
  private strategies = new Map<string, OrchestrationStrategy>();

  registerStrategy(strategy: OrchestrationStrategy): void {
    const key = this.getStrategyKey(strategy);
    this.strategies.set(key, strategy);
  }

  getStrategy(flowType: any, collaborationModel: any): OrchestrationStrategy | null {
    // Try exact match first
    let key = `${flowType}:${collaborationModel}`;
    let strategy = this.strategies.get(key);
    
    if (strategy) return strategy;

    // Try flow type match
    for (const [strategyKey, strategyValue] of this.strategies) {
      if (strategyKey.startsWith(`${flowType}:`)) {
        return strategyValue;
      }
    }

    // Default to sequential
    return this.strategies.get('sequential:sequential_handoffs') || null;
  }

  listStrategies(): OrchestrationStrategy[] {
    return Array.from(this.strategies.values());
  }

  private getStrategyKey(strategy: OrchestrationStrategy): string {
    return `${strategy.supportedFlowTypes[0]}:${strategy.supportedCollaborationModels[0]}`;
  }
}

/**
 * Sequential Orchestration Strategy
 */
class SequentialOrchestrationStrategy implements OrchestrationStrategy {
  name = 'Sequential Orchestration';
  description = 'Executes agents in sequential order';
  supportedFlowTypes = ['sequential' as const];
  supportedCollaborationModels = ['sequential_handoffs' as const];

  async execute(
    flow: OrchestrationFlow, 
    context: OrchestrationContext,
    engine: OrchestrationEngine
  ): Promise<OrchestrationResult> {
    const result = await engine.getFlowResult(flow.id);
    if (!result) throw new Error('Flow result not found');

    // Execute nodes sequentially
    let currentOutput: any = null;
    
    for (const node of flow.nodes) {
      try {
        const nodeStartTime = new Date();
        
        // Execute node (simplified - would integrate with actual agent execution)
        const nodeOutput = await this.executeNode(node, currentOutput, context);
        
        const nodeEndTime = new Date();
        const nodeDuration = nodeEndTime.getTime() - nodeStartTime.getTime();
        
        // Update results
        result.nodeResults.set(node.id, nodeOutput);
        result.metrics.completedNodes++;
        
        currentOutput = nodeOutput;
        
      } catch (error) {
        result.errors.push({
          nodeId: node.id,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
          retryAttempt: 0
        });
        result.metrics.failedNodes++;
        
        // Handle error based on governance rules
        if (context.governanceConfig.policyCompliance.violationHandling === 'block') {
          result.status = 'failed';
          break;
        }
      }
    }

    if (result.status !== 'failed') {
      result.status = 'completed';
      result.finalOutput = currentOutput;
    }

    return result;
  }

  private async executeNode(node: any, input: any, context: OrchestrationContext): Promise<any> {
    // Simplified node execution - would integrate with actual agent wrapper
    return { nodeId: node.id, input, timestamp: new Date() };
  }
}

/**
 * Parallel Orchestration Strategy
 */
class ParallelOrchestrationStrategy implements OrchestrationStrategy {
  name = 'Parallel Orchestration';
  description = 'Executes agents in parallel';
  supportedFlowTypes = ['parallel' as const];
  supportedCollaborationModels = ['parallel_processing' as const];

  async execute(
    flow: OrchestrationFlow, 
    context: OrchestrationContext,
    engine: OrchestrationEngine
  ): Promise<OrchestrationResult> {
    const result = await engine.getFlowResult(flow.id);
    if (!result) throw new Error('Flow result not found');

    // Execute all nodes in parallel
    const nodePromises = flow.nodes.map(async (node) => {
      try {
        const nodeOutput = await this.executeNode(node, null, context);
        result.nodeResults.set(node.id, nodeOutput);
        result.metrics.completedNodes++;
        return { nodeId: node.id, success: true, output: nodeOutput };
      } catch (error) {
        result.errors.push({
          nodeId: node.id,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
          retryAttempt: 0
        });
        result.metrics.failedNodes++;
        return { nodeId: node.id, success: false, error };
      }
    });

    const nodeResults = await Promise.allSettled(nodePromises);
    
    // Aggregate results
    const successfulResults = nodeResults
      .filter(r => r.status === 'fulfilled' && r.value.success)
      .map(r => r.status === 'fulfilled' ? r.value.output : null);

    result.status = result.metrics.failedNodes === 0 ? 'completed' : 'failed';
    result.finalOutput = successfulResults;

    return result;
  }

  private async executeNode(node: any, input: any, context: OrchestrationContext): Promise<any> {
    // Simplified node execution
    return { nodeId: node.id, input, timestamp: new Date() };
  }
}

/**
 * Hierarchical Orchestration Strategy
 */
class HierarchicalOrchestrationStrategy implements OrchestrationStrategy {
  name = 'Hierarchical Orchestration';
  description = 'Executes agents in hierarchical order with leader coordination';
  supportedFlowTypes = ['hierarchical' as const];
  supportedCollaborationModels = ['hierarchical_coordination' as const];

  async execute(
    flow: OrchestrationFlow, 
    context: OrchestrationContext,
    engine: OrchestrationEngine
  ): Promise<OrchestrationResult> {
    const result = await engine.getFlowResult(flow.id);
    if (!result) throw new Error('Flow result not found');

    // Find leader node (entry point)
    const leaderNode = flow.nodes.find(n => n.id === flow.entryPointId);
    if (!leaderNode) {
      throw new Error('Leader node not found');
    }

    // Execute leader first
    const leaderOutput = await this.executeNode(leaderNode, null, context);
    result.nodeResults.set(leaderNode.id, leaderOutput);
    result.metrics.completedNodes++;

    // Execute subordinate nodes
    const subordinateNodes = flow.nodes.filter(n => n.id !== flow.entryPointId);
    for (const node of subordinateNodes) {
      try {
        const nodeOutput = await this.executeNode(node, leaderOutput, context);
        result.nodeResults.set(node.id, nodeOutput);
        result.metrics.completedNodes++;
      } catch (error) {
        result.errors.push({
          nodeId: node.id,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
          retryAttempt: 0
        });
        result.metrics.failedNodes++;
      }
    }

    result.status = result.metrics.failedNodes === 0 ? 'completed' : 'failed';
    result.finalOutput = leaderOutput;

    return result;
  }

  private async executeNode(node: any, input: any, context: OrchestrationContext): Promise<any> {
    // Simplified node execution
    return { nodeId: node.id, input, timestamp: new Date() };
  }
}

/**
 * Legacy Converter Implementation
 */
export class PrometheosLegacyConverter implements LegacyConverter {
  convertLegacyMultiAgentSystem(legacy: any): OrchestrationFlow {
    const nodes = (legacy.agents || []).map((agentId: string, index: number) => ({
      id: `node-${index}`,
      agentId,
      position: { x: index * 200, y: 100 },
      status: 'pending' as const,
      retryCount: 0,
      maxRetries: 3
    }));

    const connections = [];
    if (legacy.collaborationModel === 'sequential' && nodes.length > 1) {
      for (let i = 0; i < nodes.length - 1; i++) {
        connections.push({
          id: `conn-${i}`,
          sourceNodeId: nodes[i].id,
          targetNodeId: nodes[i + 1].id
        });
      }
    }

    return {
      id: legacy.id || `flow-${Date.now()}`,
      name: legacy.name || 'Converted Flow',
      description: legacy.description || 'Converted from legacy multi-agent system',
      type: this.mapLegacyFlowType(legacy.collaborationModel),
      collaborationModel: this.mapLegacyCollaborationModel(legacy.collaborationModel),
      nodes,
      connections,
      entryPointId: nodes[0]?.id || '',
      exitPointIds: [nodes[nodes.length - 1]?.id || ''],
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      agents: legacy.agents,
      governanceRules: legacy.governanceRules
    };
  }

  convertToLegacyFormat(flow: OrchestrationFlow): any {
    return {
      id: flow.id,
      name: flow.name,
      description: flow.description,
      agents: flow.nodes.map(n => n.agentId),
      collaborationModel: flow.collaborationModel,
      governanceRules: flow.governanceRules || {}
    };
  }

  private mapLegacyFlowType(collaborationModel: string): any {
    switch (collaborationModel) {
      case 'sequential': return 'sequential';
      case 'parallel': return 'parallel';
      case 'hierarchical': return 'hierarchical';
      default: return 'sequential';
    }
  }

  private mapLegacyCollaborationModel(collaborationModel: string): any {
    switch (collaborationModel) {
      case 'sequential': return 'sequential_handoffs';
      case 'parallel': return 'parallel_processing';
      case 'hierarchical': return 'hierarchical_coordination';
      default: return 'sequential_handoffs';
    }
  }
}

// Export singleton instance
export const orchestrationEngine = new PrometheosOrchestrationEngine();
export const legacyConverter = new PrometheosLegacyConverter();

