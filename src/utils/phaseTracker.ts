/**
 * Phase Tracker Module
 * 
 * This module provides a phase tracking system for Promethios.
 * It allows registering, executing, and monitoring phases in the system lifecycle.
 */

export interface Phase {
  id: string;
  name: string;
  description: string;
  dependencies: string[];
  isRequired: boolean;
  timeout: number;
  execute: (context: any) => Promise<PhaseResult>;
}

export interface PhaseResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class PhaseTracker {
  private phases: Map<string, Phase> = new Map();
  private results: Map<string, PhaseResult> = new Map();
  
  /**
   * Register a phase with the tracker
   * @param phase The phase to register
   */
  registerPhase(phase: Phase): void {
    this.phases.set(phase.id, phase);
  }
  
  /**
   * Check if a phase is registered
   * @param phaseId The phase ID to check
   * @returns Whether the phase is registered
   */
  hasPhase(phaseId: string): boolean {
    return this.phases.has(phaseId);
  }
  
  /**
   * Get a registered phase
   * @param phaseId The phase ID to get
   * @returns The phase, or undefined if not found
   */
  getPhase(phaseId: string): Phase | undefined {
    return this.phases.get(phaseId);
  }
  
  /**
   * Execute a phase
   * @param phaseId The phase ID to execute
   * @param context The context to pass to the phase
   * @returns Promise resolving to the phase result
   */
  async executePhase(phaseId: string, context: any): Promise<PhaseResult> {
    const phase = this.phases.get(phaseId);
    
    if (!phase) {
      const result: PhaseResult = {
        success: false,
        error: `Phase ${phaseId} not found`
      };
      this.results.set(phaseId, result);
      return result;
    }
    
    // Check dependencies
    for (const dependencyId of phase.dependencies) {
      const dependencyResult = this.results.get(dependencyId);
      
      if (!dependencyResult) {
        const result: PhaseResult = {
          success: false,
          error: `Dependency ${dependencyId} not executed`
        };
        this.results.set(phaseId, result);
        return result;
      }
      
      if (!dependencyResult.success && this.phases.get(dependencyId)?.isRequired) {
        const result: PhaseResult = {
          success: false,
          error: `Dependency ${dependencyId} failed`
        };
        this.results.set(phaseId, result);
        return result;
      }
    }
    
    try {
      // Create context with phase results
      const phaseContext = {
        ...context,
        phases: Object.fromEntries(this.results.entries())
      };
      
      // Execute phase with timeout
      const result = await Promise.race([
        phase.execute(phaseContext),
        new Promise<PhaseResult>((_, reject) => {
          setTimeout(() => reject(new Error(`Phase ${phaseId} timed out after ${phase.timeout}ms`)), phase.timeout);
        })
      ]);
      
      this.results.set(phaseId, result);
      return result;
    } catch (error) {
      const result: PhaseResult = {
        success: false,
        error: `Phase ${phaseId} failed: ${error instanceof Error ? error.message : String(error)}`
      };
      this.results.set(phaseId, result);
      return result;
    }
  }
  
  /**
   * Get the result of a phase
   * @param phaseId The phase ID to get the result for
   * @returns The phase result, or undefined if not executed
   */
  getPhaseResult(phaseId: string): PhaseResult | undefined {
    return this.results.get(phaseId);
  }
  
  /**
   * Clear all phase results
   */
  clearResults(): void {
    this.results.clear();
  }
  
  /**
   * Get all registered phases
   * @returns Array of all registered phases
   */
  getAllPhases(): Phase[] {
    return Array.from(this.phases.values());
  }
  
  /**
   * Get all phase results
   * @returns Map of phase IDs to results
   */
  getAllResults(): Map<string, PhaseResult> {
    return new Map(this.results);
  }
}

export default PhaseTracker;
