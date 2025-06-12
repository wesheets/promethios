import { Schema, ValidationResult, ValidationError } from '../types';

/**
 * Utility for schema validation
 * 
 * Note: This is a stub implementation. In a real implementation, this would
 * call the backend schema validation service or use a library like Ajv.
 */
class SchemaValidator {
  /**
   * Validate data against a schema
   * @param data The data to validate
   * @param schema The schema to validate against
   * @returns The validation result
   */
  static validate(data: any, schema: Schema): ValidationResult {
    console.log(`Validating data against schema ${schema.id}`);
    
    // This is a stub implementation
    // In a real implementation, this would use a JSON Schema validator
    
    // For now, we'll just do some basic validation
    const errors: ValidationError[] = [];
    
    try {
      // Check if schema definition has required properties
      if (schema.definition.required) {
        for (const requiredProp of schema.definition.required) {
          if (data[requiredProp] === undefined) {
            errors.push({
              path: requiredProp,
              message: `Missing required property: ${requiredProp}`,
              code: 'REQUIRED'
            });
          }
        }
      }
      
      // Check property types if properties are defined
      if (schema.definition.properties) {
        for (const [propName, propSchema] of Object.entries<any>(schema.definition.properties)) {
          if (data[propName] !== undefined) {
            // Type checking
            if (propSchema.type === 'string' && typeof data[propName] !== 'string') {
              errors.push({
                path: propName,
                message: `Expected string, got ${typeof data[propName]}`,
                code: 'TYPE_MISMATCH'
              });
            } else if (propSchema.type === 'number' && typeof data[propName] !== 'number') {
              errors.push({
                path: propName,
                message: `Expected number, got ${typeof data[propName]}`,
                code: 'TYPE_MISMATCH'
              });
            } else if (propSchema.type === 'boolean' && typeof data[propName] !== 'boolean') {
              errors.push({
                path: propName,
                message: `Expected boolean, got ${typeof data[propName]}`,
                code: 'TYPE_MISMATCH'
              });
            } else if (propSchema.type === 'array' && !Array.isArray(data[propName])) {
              errors.push({
                path: propName,
                message: `Expected array, got ${typeof data[propName]}`,
                code: 'TYPE_MISMATCH'
              });
            } else if (propSchema.type === 'object' && (typeof data[propName] !== 'object' || data[propName] === null || Array.isArray(data[propName]))) {
              errors.push({
                path: propName,
                message: `Expected object, got ${Array.isArray(data[propName]) ? 'array' : typeof data[propName]}`,
                code: 'TYPE_MISMATCH'
              });
            }
            
            // Enum validation
            if (propSchema.enum && !propSchema.enum.includes(data[propName])) {
              errors.push({
                path: propName,
                message: `Value must be one of: ${propSchema.enum.join(', ')}`,
                code: 'ENUM_MISMATCH'
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during schema validation:', error);
      errors.push({
        path: '',
        message: 'Internal validation error',
        code: 'INTERNAL_ERROR'
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate data against a schema by ID
   * @param data The data to validate
   * @param schemaId The ID of the schema to validate against
   * @returns The validation result
   */
  static validateById(data: any, schemaId: string): ValidationResult {
    console.log(`Validating data against schema ID ${schemaId}`);
    
    // This is a stub implementation
    // In a real implementation, this would look up the schema by ID
    // and then validate against it
    
    // For now, we'll just return a mock result
    return {
      valid: true,
      errors: []
    };
  }
}

export default SchemaValidator;
