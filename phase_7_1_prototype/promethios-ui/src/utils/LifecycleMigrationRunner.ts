/**
 * Lifecycle Migration Runner
 * 
 * Provides a simple interface to run lifecycle migrations for existing agents.
 * Can be executed from UI components or as a standalone utility.
 */

import { AgentLifecycleMigration, MigrationReport, ValidationReport } from './AgentLifecycleMigration';
import { initializeLifecycleHooks } from '../hooks/LifecycleHooks';
import { auth } from '../firebase/config';

export interface MigrationProgress {
  phase: 'initializing' | 'migrating' | 'validating' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  details?: any;
}

export interface MigrationOptions {
  dryRun?: boolean;
  validateAfter?: boolean;
  batchSize?: number;
  onProgress?: (progress: MigrationProgress) => void;
}

/**
 * Migration runner for lifecycle events
 */
export class LifecycleMigrationRunner {
  private migration: AgentLifecycleMigration;
  private isRunning: boolean = false;

  constructor() {
    this.migration = new AgentLifecycleMigration();
  }

  /**
   * Run complete migration process for current user
   */
  async runMigration(options: MigrationOptions = {}): Promise<{
    success: boolean;
    migrationReport?: MigrationReport;
    validationReport?: ValidationReport;
    error?: string;
  }> {
    if (this.isRunning) {
      throw new Error('Migration is already running');
    }

    this.isRunning = true;
    const { dryRun = false, validateAfter = true, onProgress } = options;

    try {
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userId = user.uid;

      // Phase 1: Initialize
      onProgress?.({
        phase: 'initializing',
        progress: 0,
        message: 'Initializing lifecycle migration system...'
      });

      // Initialize lifecycle hooks system
      const initialized = await initializeLifecycleHooks();
      if (!initialized) {
        throw new Error('Failed to initialize lifecycle hooks system');
      }

      onProgress?.({
        phase: 'initializing',
        progress: 20,
        message: 'Lifecycle hooks system initialized successfully'
      });

      // Phase 2: Migration
      onProgress?.({
        phase: 'migrating',
        progress: 30,
        message: dryRun ? 'Running migration dry run...' : 'Running migration...'
      });

      const migrationReport = await this.migration.migrateUserAgents(userId, dryRun);

      onProgress?.({
        phase: 'migrating',
        progress: 70,
        message: `Migration completed: ${migrationReport.migratedAgents} agents processed`,
        details: migrationReport
      });

      let validationReport: ValidationReport | undefined;

      // Phase 3: Validation (if requested and not dry run)
      if (validateAfter && !dryRun) {
        onProgress?.({
          phase: 'validating',
          progress: 80,
          message: 'Validating migration results...'
        });

        validationReport = await this.migration.validateMigration(userId);

        onProgress?.({
          phase: 'validating',
          progress: 90,
          message: `Validation completed: ${validationReport.isValid ? 'PASSED' : 'FAILED'}`,
          details: validationReport
        });
      }

      // Phase 4: Completed
      onProgress?.({
        phase: 'completed',
        progress: 100,
        message: 'Migration process completed successfully!'
      });

      return {
        success: true,
        migrationReport,
        validationReport
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      onProgress?.({
        phase: 'failed',
        progress: 0,
        message: `Migration failed: ${errorMessage}`
      });

      return {
        success: false,
        error: errorMessage
      };

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run validation only for current user
   */
  async runValidation(): Promise<ValidationReport> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    return await this.migration.validateMigration(user.uid);
  }

  /**
   * Rollback migration for current user
   */
  async rollbackMigration(): Promise<{ success: boolean; eventsRemoved: number; error?: string }> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    return await this.migration.rollbackMigration(user.uid);
  }

  /**
   * Get migration status for current user
   */
  async getMigrationStatus(): Promise<{
    hasMigrationData: boolean;
    totalAgents: number;
    agentsWithLifecycleEvents: number;
    migrationNeeded: boolean;
    lastMigrationDate?: string;
  }> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const validationReport = await this.migration.validateMigration(user.uid);
      
      // Check if there are any migration-generated events
      const hasMigrationData = validationReport.agentsWithLifecycleEvents > 0;
      
      // Migration is needed if there are agents without lifecycle events
      const migrationNeeded = validationReport.agentsWithoutLifecycleEvents > 0;

      return {
        hasMigrationData,
        totalAgents: validationReport.totalAgents,
        agentsWithLifecycleEvents: validationReport.agentsWithLifecycleEvents,
        migrationNeeded,
        // TODO: Add last migration date tracking
        lastMigrationDate: undefined
      };

    } catch (error) {
      console.error('Failed to get migration status:', error);
      return {
        hasMigrationData: false,
        totalAgents: 0,
        agentsWithLifecycleEvents: 0,
        migrationNeeded: true
      };
    }
  }

  /**
   * Check if migration is currently running
   */
  isRunningMigration(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const lifecycleMigrationRunner = new LifecycleMigrationRunner();

/**
 * Utility function to run migration with console logging
 */
export async function runLifecycleMigrationWithLogging(dryRun: boolean = false): Promise<void> {
  console.log('🔄 Starting lifecycle migration...');
  
  const result = await lifecycleMigrationRunner.runMigration({
    dryRun,
    validateAfter: true,
    onProgress: (progress) => {
      console.log(`📊 [${progress.phase.toUpperCase()}] ${progress.progress}% - ${progress.message}`);
      if (progress.details) {
        console.log('📋 Details:', progress.details);
      }
    }
  });

  if (result.success) {
    console.log('✅ Migration completed successfully!');
    if (result.migrationReport) {
      console.log('📊 Migration Report:', result.migrationReport);
    }
    if (result.validationReport) {
      console.log('🔍 Validation Report:', result.validationReport);
    }
  } else {
    console.error('❌ Migration failed:', result.error);
  }
}

/**
 * Utility function to check migration status with console logging
 */
export async function checkMigrationStatusWithLogging(): Promise<void> {
  console.log('🔍 Checking migration status...');
  
  try {
    const status = await lifecycleMigrationRunner.getMigrationStatus();
    console.log('📊 Migration Status:', status);
    
    if (status.migrationNeeded) {
      console.log('⚠️ Migration needed for some agents');
      console.log(`📈 Progress: ${status.agentsWithLifecycleEvents}/${status.totalAgents} agents have lifecycle events`);
    } else {
      console.log('✅ All agents have lifecycle events');
    }
    
  } catch (error) {
    console.error('❌ Failed to check migration status:', error);
  }
}

