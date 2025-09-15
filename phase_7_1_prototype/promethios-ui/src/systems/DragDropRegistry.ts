/**
 * Unified Drag & Drop Registry System
 * Central system for managing all drag and drop operations across the application
 * Supports agents, messages, tools, content, and future extensibility
 */

// Base interfaces for drag & drop system
export interface DragSource {
  id: string;
  type: DragSourceType;
  data: any;
  metadata?: Record<string, any>;
}

export interface DropTarget {
  id: string;
  type: DropTargetType;
  accepts: DragSourceType[];
  onDrop: (source: DragSource, context: DropContext) => Promise<void> | void;
  metadata?: Record<string, any>;
}

export interface DropContext {
  position: { x: number; y: number };
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
  };
  selection?: any;
  timestamp: number;
}

// Drag source types
export type DragSourceType = 
  | 'agent'           // AI agents from header chips or bottom avatars
  | 'human'           // Human participants
  | 'message'         // Individual chat messages
  | 'thread'          // Message thread/range
  | 'tool'            // Tools from right panel
  | 'content'         // Text selections, files
  | 'behavioral_prompt' // Behavioral prompt templates
  | 'workflow'        // Workflow templates
  | 'knowledge'       // Knowledge base items
  | 'policy';         // Policy/compliance items

// Drop target types
export type DropTargetType =
  | 'message'         // Drop on individual messages
  | 'message_range'   // Drop on message ranges/threads
  | 'input_area'      // Drop on message input area
  | 'tool_panel'      // Drop on tools in right panel
  | 'rag_builder'     // Drop on RAG/knowledge building tools
  | 'policy_builder'  // Drop on policy building tools
  | 'workspace'       // Drop on general workspace areas
  | 'agent_config'    // Drop on agent configuration areas
  | 'workflow_canvas' // Drop on workflow building canvas
  | 'knowledge_base'  // Drop on knowledge base
  | 'chat_header';    // Drop on chat header for participant management

// Action types that can be triggered by drops
export interface DropAction {
  id: string;
  label: string;
  description: string;
  icon?: string;
  category: DropActionCategory;
  handler: (source: DragSource, target: DropTarget, context: DropContext) => Promise<void> | void;
  isAvailable?: (source: DragSource, target: DropTarget) => boolean;
  priority?: number; // For ordering in menus
}

export type DropActionCategory =
  | 'behavioral'      // Behavioral prompting actions
  | 'analytical'      // Analysis and insights
  | 'workflow'        // Workflow and automation
  | 'tool_building'   // RAG, policy, tool creation
  | 'communication'   // Direct messaging, responses
  | 'organization'    // Tagging, categorization
  | 'collaboration'   // Multi-agent coordination
  | 'content'         // Content manipulation
  | 'system';         // System-level actions

// Registry class
export class DragDropRegistry {
  private sources: Map<string, DragSource> = new Map();
  private targets: Map<string, DropTarget> = new Map();
  private actions: Map<string, DropAction> = new Map();
  private listeners: Set<(event: DragDropEvent) => void> = new Set();

  // Register drag sources
  registerSource(source: DragSource): void {
    this.sources.set(source.id, source);
    this.emit('source_registered', { source });
  }

  unregisterSource(id: string): void {
    const source = this.sources.get(id);
    if (source) {
      this.sources.delete(id);
      this.emit('source_unregistered', { source });
    }
  }

  // Register drop targets
  registerTarget(target: DropTarget): void {
    this.targets.set(target.id, target);
    this.emit('target_registered', { target });
  }

  unregisterTarget(id: string): void {
    const target = this.targets.get(id);
    if (target) {
      this.targets.delete(id);
      this.emit('target_unregistered', { target });
    }
  }

  // Register drop actions
  registerAction(action: DropAction): void {
    this.actions.set(action.id, action);
    this.emit('action_registered', { action });
  }

  unregisterAction(id: string): void {
    const action = this.actions.get(id);
    if (action) {
      this.actions.delete(id);
      this.emit('action_unregistered', { action });
    }
  }

  // Get available actions for a source-target combination
  getAvailableActions(sourceId: string, targetId: string): DropAction[] {
    const source = this.sources.get(sourceId);
    const target = this.targets.get(targetId);
    
    if (!source || !target) return [];

    // Check if target accepts this source type
    if (!target.accepts.includes(source.type)) return [];

    // Filter actions that are available for this combination
    const availableActions = Array.from(this.actions.values())
      .filter(action => !action.isAvailable || action.isAvailable(source, target))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return availableActions;
  }

  // Execute a drop action
  async executeDrop(
    sourceId: string, 
    targetId: string, 
    actionId: string, 
    context: DropContext
  ): Promise<void> {
    const source = this.sources.get(sourceId);
    const target = this.targets.get(targetId);
    const action = this.actions.get(actionId);

    if (!source || !target || !action) {
      throw new Error('Invalid source, target, or action');
    }

    this.emit('drop_start', { source, target, action, context });

    try {
      await action.handler(source, target, context);
      this.emit('drop_success', { source, target, action, context });
    } catch (error) {
      this.emit('drop_error', { source, target, action, context, error });
      throw error;
    }
  }

  // Check if a drop is valid
  canDrop(sourceId: string, targetId: string): boolean {
    const source = this.sources.get(sourceId);
    const target = this.targets.get(targetId);
    
    console.log('🔍 canDrop check:', { 
      sourceId, 
      targetId, 
      source: source ? { id: source.id, type: source.type } : null,
      target: target ? { id: target.id, type: target.type, accepts: target.accepts } : null,
      result: source && target ? target.accepts.includes(source.type) : false
    });
    
    if (!source || !target) return false;
    
    return target.accepts.includes(source.type);
  }

  // Event system
  on(event: DragDropEventType, listener: (data: any) => void): void {
    this.listeners.add(listener);
  }

  off(listener: (data: any) => void): void {
    this.listeners.delete(listener);
  }

  private emit(event: DragDropEventType, data: any): void {
    this.listeners.forEach(listener => {
      try {
        listener({ type: event, data, timestamp: Date.now() });
      } catch (error) {
        console.error('Error in drag drop event listener:', error);
      }
    });
  }

  // Utility methods
  getSource(id: string): DragSource | undefined {
    return this.sources.get(id);
  }

  getTarget(id: string): DropTarget | undefined {
    return this.targets.get(id);
  }

  getAction(id: string): DropAction | undefined {
    return this.actions.get(id);
  }

  getAllSources(): DragSource[] {
    return Array.from(this.sources.values());
  }

  getAllTargets(): DropTarget[] {
    return Array.from(this.targets.values());
  }

  getAllActions(): DropAction[] {
    return Array.from(this.actions.values());
  }

  // Get sources by type
  getSourcesByType(type: DragSourceType): DragSource[] {
    return Array.from(this.sources.values()).filter(source => source.type === type);
  }

  // Get targets by type
  getTargetsByType(type: DropTargetType): DropTarget[] {
    return Array.from(this.targets.values()).filter(target => target.type === type);
  }

  // Get actions by category
  getActionsByCategory(category: DropActionCategory): DropAction[] {
    return Array.from(this.actions.values()).filter(action => action.category === category);
  }
}

// Event types
export type DragDropEventType =
  | 'source_registered'
  | 'source_unregistered'
  | 'target_registered'
  | 'target_unregistered'
  | 'action_registered'
  | 'action_unregistered'
  | 'drop_start'
  | 'drop_success'
  | 'drop_error';

export interface DragDropEvent {
  type: DragDropEventType;
  data: any;
  timestamp: number;
}

// Global registry instance
export const dragDropRegistry = new DragDropRegistry();

// Predefined behavioral prompt actions
export const BEHAVIORAL_ACTIONS: DropAction[] = [
  {
    id: 'collaborate',
    label: 'Collaborate',
    description: 'Work together on this topic',
    icon: '🤝',
    category: 'behavioral',
    priority: 100,
    handler: async (source, target, context) => {
      // Implementation will be added when integrating with existing behavioral system
      console.log('Collaborate action:', { source, target, context });
    }
  },
  {
    id: 'question',
    label: 'Question',
    description: 'Ask for clarification or details',
    icon: '❓',
    category: 'behavioral',
    priority: 90,
    handler: async (source, target, context) => {
      console.log('Question action:', { source, target, context });
    }
  },
  {
    id: 'devils_advocate',
    label: "Devil's Advocate",
    description: 'Challenge this perspective',
    icon: '😈',
    category: 'behavioral',
    priority: 80,
    handler: async (source, target, context) => {
      console.log("Devil's Advocate action:", { source, target, context });
    }
  },
  {
    id: 'expert_analysis',
    label: 'Expert Analysis',
    description: 'Provide expert-level insights',
    icon: '🧠',
    category: 'behavioral',
    priority: 70,
    handler: async (source, target, context) => {
      console.log('Expert Analysis action:', { source, target, context });
    }
  },
  {
    id: 'creative_ideas',
    label: 'Creative Ideas',
    description: 'Generate creative solutions',
    icon: '💡',
    category: 'behavioral',
    priority: 60,
    handler: async (source, target, context) => {
      console.log('Creative Ideas action:', { source, target, context });
    }
  },
  {
    id: 'pessimist',
    label: 'Pessimist',
    description: 'Consider potential problems',
    icon: '☁️',
    category: 'behavioral',
    priority: 50,
    handler: async (source, target, context) => {
      console.log('Pessimist action:', { source, target, context });
    }
  }
];

// Predefined analytical actions
export const ANALYTICAL_ACTIONS: DropAction[] = [
  {
    id: 'summarize',
    label: 'Summarize',
    description: 'Create a summary of the content',
    icon: '📝',
    category: 'analytical',
    priority: 100,
    handler: async (source, target, context) => {
      console.log('Summarize action:', { source, target, context });
    }
  },
  {
    id: 'analyze_insights',
    label: 'Extract Insights',
    description: 'Analyze and extract key insights',
    icon: '🔍',
    category: 'analytical',
    priority: 90,
    handler: async (source, target, context) => {
      console.log('Extract Insights action:', { source, target, context });
    }
  },
  {
    id: 'visualize_data',
    label: 'Create Visualization',
    description: 'Generate charts or visualizations from data',
    icon: '📊',
    category: 'analytical',
    priority: 80,
    handler: async (source, target, context) => {
      console.log('Create Visualization action:', { source, target, context });
    }
  }
];

// Predefined tool building actions
export const TOOL_BUILDING_ACTIONS: DropAction[] = [
  {
    id: 'build_rag',
    label: 'Build RAG Knowledge',
    description: 'Add to RAG knowledge base',
    icon: '🧠',
    category: 'tool_building',
    priority: 100,
    handler: async (source, target, context) => {
      console.log('Build RAG Knowledge action:', { source, target, context });
    }
  },
  {
    id: 'create_policy',
    label: 'Create Policy Rule',
    description: 'Generate policy or compliance rule',
    icon: '📋',
    category: 'tool_building',
    priority: 90,
    handler: async (source, target, context) => {
      console.log('Create Policy Rule action:', { source, target, context });
    }
  },
  {
    id: 'train_agent',
    label: 'Train Agent',
    description: 'Use content to train agent behavior',
    icon: '🎓',
    category: 'tool_building',
    priority: 80,
    handler: async (source, target, context) => {
      console.log('Train Agent action:', { source, target, context });
    }
  }
];

// Initialize default actions
export function initializeDefaultActions(): void {
  [...BEHAVIORAL_ACTIONS, ...ANALYTICAL_ACTIONS, ...TOOL_BUILDING_ACTIONS].forEach(action => {
    dragDropRegistry.registerAction(action);
  });
}

// Helper function to create drag source
export function createDragSource(
  id: string,
  type: DragSourceType,
  data: any,
  metadata?: Record<string, any>
): DragSource {
  return { id, type, data, metadata };
}

// Helper function to create drop target
export function createDropTarget(
  id: string,
  type: DropTargetType,
  accepts: DragSourceType[],
  onDrop: (source: DragSource, context: DropContext) => Promise<void> | void,
  metadata?: Record<string, any>
): DropTarget {
  return { id, type, accepts, onDrop, metadata };
}

