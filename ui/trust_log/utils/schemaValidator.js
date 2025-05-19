/**
 * Schema validation utility for Trust Log UI components
 * 
 * This utility ensures that all data rendered in UI components is validated
 * against the trust_view.schema.v1.json schema as required by Phase 12.20.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 * Clauses: 5.3, 11.0, 12.0, 6.2
 */

import Ajv from 'ajv';

// Initialize Ajv instance
const ajv = new Ajv({ allErrors: true });

/**
 * Validates data against the trust_view.schema.v1.json schema
 * 
 * @param {Object} data - Data to validate
 * @param {Object} schema - Schema to validate against
 * @returns {Object} - Object with valid flag and any errors
 */
function validateSchema(data, schema) {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  
  return {
    valid,
    errors: validate.errors || []
  };
}

/**
 * Fetches the schema and validates data against it
 * 
 * @param {Object} data - Data to validate
 * @returns {Promise<Object>} - Promise resolving to validation result
 */
function validateAgainstSchema(data) {
  return fetch('/schemas/ui/trust_view.schema.v1.json')
    .then(response => response.json())
    .then(schema => {
      return validateSchema(data, schema);
    })
    .catch(error => {
      console.error(`[SCHEMA VALIDATION] Error fetching schema: ${error}`);
      return {
        valid: false,
        errors: [{ message: `Error fetching schema: ${error}` }]
      };
    });
}

export { validateSchema, validateAgainstSchema };
