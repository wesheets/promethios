/**
 * Schema Validator Utility
 * 
 * Provides schema validation functionality for Promethios components.
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

class SchemaValidator {
  constructor(config = {}) {
    this.config = {
      schemaDir: path.join(process.cwd(), 'schemas'),
      strictMode: true,
      ...config
    };

    this.ajv = new Ajv({
      allErrors: true,
      strict: this.config.strictMode
    });
    
    addFormats(this.ajv);
    
    // Cache for loaded schemas
    this.schemaCache = new Map();
  }

  /**
   * Validate data against a schema
   * @param {Object} data - Data to validate
   * @param {Object|string} schema - Schema object or schema path
   * @returns {Object} - Validation result
   */
  validate(data, schema) {
    try {
      // Load schema if string path is provided
      const schemaObj = typeof schema === 'string' ? this._loadSchema(schema) : schema;
      
      // Validate data
      const validate = this.ajv.compile(schemaObj);
      const valid = validate(data);
      
      return {
        valid,
        errors: valid ? null : validate.errors
      };
    } catch (error) {
      logger.error(`Schema validation error: ${error.message}`, { error });
      return {
        valid: false,
        errors: [{ message: error.message }]
      };
    }
  }

  /**
   * Load schema from file
   * @private
   */
  _loadSchema(schemaPath) {
    // Check cache first
    if (this.schemaCache.has(schemaPath)) {
      return this.schemaCache.get(schemaPath);
    }
    
    // Resolve path if relative
    const resolvedPath = schemaPath.startsWith('/') ? 
      schemaPath : 
      path.join(this.config.schemaDir, schemaPath);
    
    // Load schema
    try {
      const schemaContent = fs.readFileSync(resolvedPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      
      // Cache schema
      this.schemaCache.set(schemaPath, schema);
      
      return schema;
    } catch (error) {
      logger.error(`Failed to load schema: ${resolvedPath}`, { error });
      throw new Error(`Failed to load schema: ${error.message}`);
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config) {
    if (!SchemaValidator.instance) {
      SchemaValidator.instance = new SchemaValidator(config);
    }
    return SchemaValidator.instance;
  }
}

module.exports = {
  SchemaValidator,
  validator: SchemaValidator.getInstance()
};
