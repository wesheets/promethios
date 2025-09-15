/**
 * React hooks for drag & drop functionality
 * Provides easy-to-use hooks for components to integrate with the drag & drop registry
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  dragDropRegistry,
  DragSource,
  DropTarget,
  DropAction,
  DropContext,
  DragSourceType,
  DropTargetType,
  createDragSource,
  createDropTarget
} from '../systems/DragDropRegistry';

// Hook for making an element draggable
export function useDraggable(
  id: string,
  type: DragSourceType,
  data: any,
  metadata?: Record<string, any>
) {
  const dragRef = useRef<HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const source = createDragSource(id, type, data, metadata);
    dragDropRegistry.registerSource(source);

    return () => {
      dragDropRegistry.unregisterSource(id);
    };
  }, [id, type, data, metadata]);

  const dragHandlers = {
    draggable: true,
    onDragStart: useCallback((e: React.DragEvent) => {
      console.log('🚀 Drag started:', { id, type, data });
      setIsDragging(true);
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'copy';
      
      // Add visual feedback
      if (dragRef.current) {
        dragRef.current.style.opacity = '0.5';
      }
    }, [id, type, data]),

    onDragEnd: useCallback((e: React.DragEvent) => {
      console.log('🏁 Drag ended:', { id });
      setIsDragging(false);
      
      // Reset visual feedback
      if (dragRef.current) {
        dragRef.current.style.opacity = '1';
      }
    }, [id]),
  };

  return {
    dragRef,
    isDragging,
    dragHandlers,
  };
}

// Hook for making an element a drop target
export function useDropTarget(
  id: string,
  type: DropTargetType,
  accepts: DragSourceType[],
  onDrop?: (source: DragSource, context: DropContext) => Promise<void> | void,
  metadata?: Record<string, any>
) {
  const dropRef = useRef<HTMLElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [canDrop, setCanDrop] = useState(false);
  const [availableActions, setAvailableActions] = useState<DropAction[]>([]);

  useEffect(() => {
    const target = createDropTarget(
      id,
      type,
      accepts,
      onDrop || (() => {}),
      metadata
    );
    dragDropRegistry.registerTarget(target);

    return () => {
      dragDropRegistry.unregisterTarget(id);
    };
  }, [id, type, accepts, onDrop, metadata]);

  const dropHandlers = {
    onDragOver: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData('text/plain');
      const canDropHere = dragDropRegistry.canDrop(sourceId, id);
      
      console.log('🎯 Drag over:', { sourceId, targetId: id, canDropHere });
      
      setCanDrop(canDropHere);
      if (canDropHere) {
        e.dataTransfer.dropEffect = 'copy';
        setIsOver(true);
        
        // Get available actions for this combination
        const actions = dragDropRegistry.getAvailableActions(sourceId, id);
        setAvailableActions(actions);
      }
    }, [id]),

    onDragEnter: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData('text/plain');
      const canDropHere = dragDropRegistry.canDrop(sourceId, id);
      
      console.log('🚪 Drag enter:', { sourceId, targetId: id, canDropHere });
      
      if (canDropHere) {
        setIsOver(true);
      }
    }, [id]),

    onDragLeave: useCallback((e: React.DragEvent) => {
      // Only set isOver to false if we're actually leaving the element
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsOver(false);
        setCanDrop(false);
        setAvailableActions([]);
      }
    }, []),

    onDrop: useCallback(async (e: React.DragEvent) => {
      e.preventDefault();
      console.log('💧 Drop event triggered:', { targetId: id });
      
      setIsOver(false);
      setCanDrop(false);
      
      const sourceId = e.dataTransfer.getData('text/plain');
      console.log('💧 Drop details:', { sourceId, targetId: id });
      
      const context: DropContext = {
        position: { x: e.clientX, y: e.clientY },
        modifiers: {
          shift: e.shiftKey,
          ctrl: e.ctrlKey,
          alt: e.altKey,
        },
        timestamp: Date.now(),
      };

      // If there are multiple actions available, show action menu
      const actions = dragDropRegistry.getAvailableActions(sourceId, id);
      console.log('💧 Available actions:', actions);
      
      if (actions.length > 1) {
        // Show action selection menu (will be implemented in UI component)
        console.log('Multiple actions available:', actions);
        // For now, just execute the first action
        if (actions[0]) {
          console.log('💧 Executing first action:', actions[0]);
          await dragDropRegistry.executeDrop(sourceId, id, actions[0].id, context);
        }
      } else if (actions.length === 1) {
        // Execute the single available action
        console.log('💧 Executing single action:', actions[0]);
        await dragDropRegistry.executeDrop(sourceId, id, actions[0].id, context);
      } else if (onDrop) {
        // Fallback to custom onDrop handler
        console.log('💧 Using custom onDrop handler');
        const source = dragDropRegistry.getSource(sourceId);
        if (source) {
          await onDrop(source, context);
        }
      } else {
        console.log('💧 No actions or onDrop handler available');
      }

      setAvailableActions([]);
    }, [id, onDrop]),
  };

  return {
    dropRef,
    isOver,
    canDrop,
    availableActions,
    dropHandlers,
  };
}

// Hook for getting available actions between source and target
export function useDropActions(sourceId?: string, targetId?: string) {
  const [actions, setActions] = useState<DropAction[]>([]);

  useEffect(() => {
    if (sourceId && targetId) {
      const availableActions = dragDropRegistry.getAvailableActions(sourceId, targetId);
      setActions(availableActions);
    } else {
      setActions([]);
    }
  }, [sourceId, targetId]);

  return actions;
}

// Hook for executing drop actions
export function useDropExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeDrop = useCallback(async (
    sourceId: string,
    targetId: string,
    actionId: string,
    context: DropContext
  ) => {
    setIsExecuting(true);
    setError(null);

    try {
      await dragDropRegistry.executeDrop(sourceId, targetId, actionId, context);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  return {
    executeDrop,
    isExecuting,
    error,
  };
}

// Hook for listening to drag & drop events
export function useDragDropEvents() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const listener = (event: any) => {
      setEvents(prev => [...prev.slice(-9), event]); // Keep last 10 events
    };

    dragDropRegistry.on('drop_start', listener);
    dragDropRegistry.on('drop_success', listener);
    dragDropRegistry.on('drop_error', listener);

    return () => {
      dragDropRegistry.off(listener);
    };
  }, []);

  return events;
}

// Hook for managing drag & drop state
export function useDragDropState() {
  const [draggedItem, setDraggedItem] = useState<DragSource | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleDragStart = () => setIsDragging(true);
    const handleDragEnd = () => {
      setIsDragging(false);
      setDraggedItem(null);
      setDropTarget(null);
    };

    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  return {
    draggedItem,
    dropTarget,
    isDragging,
    setDraggedItem,
    setDropTarget,
  };
}

// Utility hook for creating agent drag sources
export function useAgentDragSource(
  agentId: string,
  agentData: any,
  isHuman: boolean = false
) {
  return useDraggable(
    `agent-${agentId}`,
    isHuman ? 'human' : 'agent',
    agentData,
    { agentId, isHuman }
  );
}

// Utility hook for creating message drop targets
export function useMessageDropTarget(
  messageId: string,
  messageData: any,
  onDrop?: (source: DragSource, context: DropContext) => Promise<void> | void
) {
  return useDropTarget(
    `message-${messageId}`,
    'message',
    ['agent', 'human', 'behavioral_prompt'],
    onDrop,
    { messageId, messageData }
  );
}

// Utility hook for creating tool drop targets
export function useToolDropTarget(
  toolId: string,
  toolData: any,
  onDrop?: (source: DragSource, context: DropContext) => Promise<void> | void
) {
  return useDropTarget(
    `tool-${toolId}`,
    'tool_panel',
    ['agent', 'message', 'thread', 'content'],
    onDrop,
    { toolId, toolData }
  );
}

