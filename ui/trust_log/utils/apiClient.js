/**
 * API Integration for Trust Log UI
 * 
 * Provides API client functions for fetching trust log data from backend endpoints.
 * All responses are validated against the trust_view.schema.v1.json schema.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 * Clauses: 5.3, 11.0, 12.0, 6.2
 */

import { validateAgainstSchema } from './schemaValidator.js';

/**
 * Fetches replay logs from the API and validates against schema
 * 
 * @returns {Promise<Object>} - Promise resolving to validated logs data
 */
function fetchReplayLogs() {
  return fetch('/api/trust/logs')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      return validateAgainstSchema(data)
        .then(result => {
          if (!result.valid) {
            throw new Error(`Schema validation failed: ${JSON.stringify(result.errors)}`);
          }
          return data;
        });
    });
}

/**
 * Fetches merkle seals from the API and validates against schema
 * 
 * @returns {Promise<Object>} - Promise resolving to validated merkle seals data
 */
function fetchMerkleSeals() {
  return fetch('/api/trust/merkle-seals')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      return validateAgainstSchema(data)
        .then(result => {
          if (!result.valid) {
            throw new Error(`Schema validation failed: ${JSON.stringify(result.errors)}`);
          }
          return data;
        });
    });
}

/**
 * Fetches trust surface data from the API and validates against schema
 * 
 * @returns {Promise<Object>} - Promise resolving to validated trust surface data
 */
function fetchTrustSurface() {
  return fetch('/api/trust/surface')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      return validateAgainstSchema(data)
        .then(result => {
          if (!result.valid) {
            throw new Error(`Schema validation failed: ${JSON.stringify(result.errors)}`);
          }
          return data;
        });
    });
}

export { fetchReplayLogs, fetchMerkleSeals, fetchTrustSurface };
