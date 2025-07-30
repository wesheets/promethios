/**
 * Agent Lifecycle Migration Utility
 * 
 * Provides utilities to backfill lifecycle events for existing agents.
 * This ensures that agents created before lifecycle tracking was implemented
 * have proper lifecycle history.
 */

import { unifiedStorage } from '../services/UnifiedStorageService';
import { UserAgentStorageService, AgentProfile } from '../services/UserAgentStorageService';
import { agentLifecycleService, AgentLifecycleEvent } from '../services/AgentLifecycleService';
import { metricsCollectionExtension } from '../extensions/MetricsCollectionExtension';

export interface MigrationReport {
  userId: string;
  totalAgents: number;
  migratedAgents: number;
  skippedAgents: number;
  failedAgents: number;
  eventsCreated: number;
  errors: string[];
  details: AgentMigrationDetail[];
  executionTime: number;
}

export interface AgentMigrationDetail {
  agentId: string;
  agentName: string;
  status: 'migrated' | 'skipped' | 'failed';
  eventsCreated: string[];
  error?: string;
}

export interface ValidationReport {
  userId: string;
  totalAgents: number;
  agentsWithLifecycleEvents: number;
  agentsWithoutLifecycleEvents: number;
  inconsistencies: ValidationInconsistency[];
  isValid: boolean;
}

export interface ValidationInconsistency {
  agentId: string;
  agentName: string;
  issue: string;
  expectedEvents: string[];
  actualEvents: string[];
}

/**
 * Utility class for migrating existing agents to have lifecycle events
 */
export class AgentLifecycleMigration {
  private userAgentService: UserAgentStorageService;

  constructor() {
    this.userAgentService = new UserAgentStorageService();
  }

  /**
   * Migrate all agents for a specific user
   */
  async migrateUserAgents(userId: string, dryRun: boolean = false): Promise<MigrationReport> {
    const startTime = Date.now();
    const report: MigrationReport = {
      userId,
      totalAgents: 0,
      migratedAgents: 0,
      skippedAgents: 0,
      failedAgents: 0,
      eventsCreated: 0,
      errors: [],
      details: [],
      executionTime: 0
    };

    try {
      console.log(`🔄 Starting agent lifecycle migration for user: ${userId} (dry run: ${dryRun})`);

      // Get all user agents
      const agents = await this.userAgentService.getAllUserAgents(userId);
      report.totalAgents = agents.length;

      console.log(`📊 Found ${agents.length} agents to migrate`);

      // Process each agent
      for (const agent of agents) {
        try {
          const migrationDetail = await this.migrateAgent(agent, dryRun);
          report.details.push(migrationDetail);

          switch (migrationDetail.status) {
            case 'migrated':
              report.migratedAgents++;
              report.eventsCreated += migrationDetail.eventsCreated.length;
              break;
            case 'skipped':
              report.skippedAgents++;
              break;
            case 'failed':
              report.failedAgents++;
              if (migrationDetail.error) {
                report.errors.push(`${agent.identity.name}: ${migrationDetail.error}`);
              }
              break;
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          report.failedAgents++;
          report.errors.push(`${agent.identity.name}: ${errorMessage}`);
          report.details.push({
            agentId: agent.identity.id,
            agentName: agent.identity.name,
            status: 'failed',
            eventsCreated: [],
            error: errorMessage
          });
        }
      }

      report.executionTime = Date.now() - startTime;

      console.log(`✅ Migration completed in ${report.executionTime}ms`);
      console.log(`📊 Results: ${report.migratedAgents} migrated, ${report.skippedAgents} skipped, ${report.failedAgents} failed`);

      return report;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.errors.push(`Migration failed: ${errorMessage}`);
      report.executionTime = Date.now() - startTime;
      
      console.error('❌ Migration failed:', error);
      return report;
    }
  }

  /**
   * Migrate a single agent
   */
  private async migrateAgent(agent: AgentProfile, dryRun: boolean): Promise<AgentMigrationDetail> {
    const detail: AgentMigrationDetail = {
      agentId: agent.identity.id,
      agentName: agent.identity.name,
      status: 'skipped',
      eventsCreated: []
    };

    try {
      // Check if agent already has lifecycle events
      const existingEvents = await agentLifecycleService.getAgentLifecycleHistory(agent.identity.id);
      
      if (existingEvents.length > 0) {
        console.log(`⏭️ Skipping ${agent.identity.name} - already has ${existingEvents.length} lifecycle events`);
        return detail;
      }

      // Determine which lifecycle events to create based on agent state
      const eventsToCreate = this.determineLifecycleEvents(agent);
      
      if (eventsToCreate.length === 0) {
        console.log(`⏭️ Skipping ${agent.identity.name} - no lifecycle events needed`);
        return detail;
      }

      if (dryRun) {
        console.log(`🧪 DRY RUN: Would create ${eventsToCreate.length} events for ${agent.identity.name}: ${eventsToCreate.join(', ')}`);
        detail.status = 'migrated';
        detail.eventsCreated = eventsToCreate;
        return detail;
      }

      // Create historical lifecycle events
      for (const eventType of eventsToCreate) {
        await this.createHistoricalLifecycleEvent(agent, eventType);
        detail.eventsCreated.push(eventType);
      }

      detail.status = 'migrated';
      console.log(`✅ Migrated ${agent.identity.name} - created ${eventsToCreate.length} events`);

      return detail;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      detail.status = 'failed';
      detail.error = errorMessage;
      console.error(`❌ Failed to migrate ${agent.identity.name}:`, error);
      return detail;
    }
  }

  /**
   * Determine which lifecycle events should exist for an agent based on its current state
   */
  private determineLifecycleEvents(agent: AgentProfile): string[] {
    const events: string[] = [];

    // All agents should have a 'created' event
    events.push('created');

    // If agent is wrapped, it should have a 'wrapped' event
    if (agent.isWrapped) {
      events.push('wrapped');
    }

    // If agent is deployed, it should have a 'deployed' event
    if (agent.isDeployed) {
      events.push('deployed');
    }

    return events;
  }

  /**
   * Create a historical lifecycle event for an agent
   */
  private async createHistoricalLifecycleEvent(agent: AgentProfile, eventType: string): Promise<void> {
    const timestamp = this.estimateEventTimestamp(agent, eventType);
    
    const event: AgentLifecycleEvent = {
      eventId: `migration_${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId: agent.identity.id,
      eventType: eventType as any,
      timestamp,
      userId: agent.identity.ownerId,
      metadata: {
        agentName: agent.identity.name,
        migrationGenerated: true,
        originalCreationDate: agent.identity.creationDate,
        estimatedTimestamp: true
      }
    };

    // Store the event using the same method as the lifecycle service
    await unifiedStorage.set('agent_lifecycle_events', event.eventId, event);
    
    console.log(`📝 Created historical ${eventType} event for ${agent.identity.name}`);
  }

  /**
   * Estimate when a lifecycle event would have occurred based on agent data
   */
  private estimateEventTimestamp(agent: AgentProfile, eventType: string): Date {
    const creationDate = new Date(agent.identity.creationDate);
    
    switch (eventType) {
      case 'created':
        return creationDate;
      
      case 'wrapped':
        // Estimate wrapping happened some time after creation
        // Use lastModifiedDate if available, otherwise add some time to creation
        if (agent.identity.lastModifiedDate && agent.identity.lastModifiedDate > agent.identity.creationDate) {
          return new Date(agent.identity.lastModifiedDate);
        }
        return new Date(creationDate.getTime() + (24 * 60 * 60 * 1000)); // +1 day
      
      case 'deployed':
        // Estimate deployment happened after wrapping
        if (agent.identity.lastModifiedDate && agent.identity.lastModifiedDate > agent.identity.creationDate) {
          return new Date(agent.identity.lastModifiedDate);
        }
        return new Date(creationDate.getTime() + (2 * 24 * 60 * 60 * 1000)); // +2 days
      
      default:
        return creationDate;
    }
  }

  /**
   * Validate migration results
   */
  async validateMigration(userId: string): Promise<ValidationReport> {
    const report: ValidationReport = {
      userId,
      totalAgents: 0,
      agentsWithLifecycleEvents: 0,
      agentsWithoutLifecycleEvents: 0,
      inconsistencies: [],
      isValid: true
    };

    try {
      console.log(`🔍 Validating migration for user: ${userId}`);

      // Get all user agents
      const agents = await this.userAgentService.getAllUserAgents(userId);
      report.totalAgents = agents.length;

      // Check each agent
      for (const agent of agents) {
        const existingEvents = await agentLifecycleService.getAgentLifecycleHistory(agent.identity.id);
        const expectedEvents = this.determineLifecycleEvents(agent);
        const actualEvents = existingEvents.map(e => e.eventType);

        if (existingEvents.length > 0) {
          report.agentsWithLifecycleEvents++;
        } else {
          report.agentsWithoutLifecycleEvents++;
        }

        // Check for inconsistencies
        const missingEvents = expectedEvents.filter(e => !actualEvents.includes(e));
        const unexpectedEvents = actualEvents.filter(e => !expectedEvents.includes(e));

        if (missingEvents.length > 0 || unexpectedEvents.length > 0) {
          report.inconsistencies.push({
            agentId: agent.identity.id,
            agentName: agent.identity.name,
            issue: `Missing: ${missingEvents.join(', ')} | Unexpected: ${unexpectedEvents.join(', ')}`,
            expectedEvents,
            actualEvents
          });
          report.isValid = false;
        }
      }

      console.log(`✅ Validation completed: ${report.agentsWithLifecycleEvents}/${report.totalAgents} agents have lifecycle events`);
      
      if (report.inconsistencies.length > 0) {
        console.warn(`⚠️ Found ${report.inconsistencies.length} inconsistencies`);
      }

      return report;

    } catch (error) {
      console.error('❌ Validation failed:', error);
      report.isValid = false;
      return report;
    }
  }

  /**
   * Rollback migration (remove all migration-generated events)
   */
  async rollbackMigration(userId: string): Promise<{ success: boolean; eventsRemoved: number; error?: string }> {
    try {
      console.log(`🔄 Rolling back migration for user: ${userId}`);

      // Get all lifecycle events
      const allEvents = await unifiedStorage.getMany<AgentLifecycleEvent>('agent_lifecycle_events', []);
      const userEvents = allEvents.filter(event => 
        event.userId === userId && 
        event.metadata?.migrationGenerated === true
      );

      console.log(`📊 Found ${userEvents.length} migration-generated events to remove`);

      // Remove migration-generated events
      for (const event of userEvents) {
        await unifiedStorage.delete('agent_lifecycle_events', event.eventId);
      }

      console.log(`✅ Rollback completed: removed ${userEvents.length} events`);

      return { success: true, eventsRemoved: userEvents.length };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Rollback failed:', error);
      return { success: false, eventsRemoved: 0, error: errorMessage };
    }
  }
}

