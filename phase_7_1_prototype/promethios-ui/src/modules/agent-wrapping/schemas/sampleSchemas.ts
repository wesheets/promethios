import { Schema, ValidationResult } from '../types';

/**
 * Sample input schema for a chat completion agent
 */
export const chatCompletionInputSchema: Schema = {
  id: 'chat-completion-input',
  version: '1.0.0',
  definition: {
    type: 'object',
    required: ['messages'],
    properties: {
      messages: {
        type: 'array',
        items: {
          type: 'object',
          required: ['role', 'content'],
          properties: {
            role: {
              type: 'string',
              enum: ['system', 'user', 'assistant']
            },
            content: {
              type: 'string'
            }
          }
        }
      },
      temperature: {
        type: 'number',
        minimum: 0,
        maximum: 2
      },
      max_tokens: {
        type: 'integer',
        minimum: 1
      }
    }
  },
  validate: (data) => {
    // This is a stub - in a real implementation, this would call the SchemaValidator
    console.log('Validating against chat completion input schema', data);
    return { valid: true, errors: [] };
  }
};

/**
 * Sample output schema for a chat completion agent
 */
export const chatCompletionOutputSchema: Schema = {
  id: 'chat-completion-output',
  version: '1.0.0',
  definition: {
    type: 'object',
    required: ['choices'],
    properties: {
      choices: {
        type: 'array',
        items: {
          type: 'object',
          required: ['message'],
          properties: {
            message: {
              type: 'object',
              required: ['role', 'content'],
              properties: {
                role: {
                  type: 'string',
                  enum: ['assistant']
                },
                content: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    }
  },
  validate: (data) => {
    // This is a stub - in a real implementation, this would call the SchemaValidator
    console.log('Validating against chat completion output schema', data);
    return { valid: true, errors: [] };
  }
};

/**
 * Sample input schema for an image generation agent
 */
export const imageGenerationInputSchema: Schema = {
  id: 'image-generation-input',
  version: '1.0.0',
  definition: {
    type: 'object',
    required: ['prompt'],
    properties: {
      prompt: {
        type: 'string'
      },
      n: {
        type: 'integer',
        minimum: 1,
        maximum: 10
      },
      size: {
        type: 'string',
        enum: ['256x256', '512x512', '1024x1024']
      }
    }
  },
  validate: (data) => {
    // This is a stub - in a real implementation, this would call the SchemaValidator
    console.log('Validating against image generation input schema', data);
    return { valid: true, errors: [] };
  }
};

/**
 * Sample output schema for an image generation agent
 */
export const imageGenerationOutputSchema: Schema = {
  id: 'image-generation-output',
  version: '1.0.0',
  definition: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          required: ['url'],
          properties: {
            url: {
              type: 'string'
            }
          }
        }
      }
    }
  },
  validate: (data) => {
    // This is a stub - in a real implementation, this would call the SchemaValidator
    console.log('Validating against image generation output schema', data);
    return { valid: true, errors: [] };
  }
};

/**
 * Sample input schema for a text embedding agent
 */
export const embeddingInputSchema: Schema = {
  id: 'embedding-input',
  version: '1.0.0',
  definition: {
    type: 'object',
    required: ['input'],
    properties: {
      input: {
        type: 'string'
      },
      model: {
        type: 'string'
      }
    }
  },
  validate: (data) => {
    // This is a stub - in a real implementation, this would call the SchemaValidator
    console.log('Validating against embedding input schema', data);
    return { valid: true, errors: [] };
  }
};

/**
 * Sample output schema for a text embedding agent
 */
export const embeddingOutputSchema: Schema = {
  id: 'embedding-output',
  version: '1.0.0',
  definition: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          required: ['embedding'],
          properties: {
            embedding: {
              type: 'array',
              items: {
                type: 'number'
              }
            }
          }
        }
      }
    }
  },
  validate: (data) => {
    // This is a stub - in a real implementation, this would call the SchemaValidator
    console.log('Validating against embedding output schema', data);
    return { valid: true, errors: [] };
  }
};
