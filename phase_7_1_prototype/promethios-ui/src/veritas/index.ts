/**
 * VERITAS Module Index
 * 
 * This file exports all VERITAS components for easy access.
 */

// Core exports
export * from './core';

// Enforcement exports
export * from './enforcement/veritasEnforcer';
export * from './enforcement/veritasIntegration';

// Hook to connect VERITAS to the governance pipeline
export { default as useVeritasEnforcement } from './hooks/useVeritasEnforcement';
