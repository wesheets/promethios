import React, { useState } from 'react';
import { AgentWrapperConfig } from '../../types';

interface SchemaStepProps {
  config: AgentWrapperConfig;
  updateConfig: (updates: Partial<AgentWrapperConfig>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const SchemaStep: React.FC<SchemaStepProps> = ({ 
  config, 
  updateConfig, 
  onNext, 
  onPrevious 
}) => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(config.schemaComplexity === 'advanced');
  
  // Sample schemas based on provider
  const sampleInputSchema = {
    OpenAI: `{
  "type": "object",
  "required": ["messages"],
  "properties": {
    "messages": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["role", "content"],
        "properties": {
          "role": {
            "type": "string",
            "enum": ["system", "user", "assistant"]
          },
          "content": {
            "type": "string"
          }
        }
      }
    },
    "temperature": {
      "type": "number",
      "minimum": 0,
      "maximum": 2
    }
  }
}`,
    Anthropic: `{
  "type": "object",
  "required": ["prompt"],
  "properties": {
    "prompt": {
      "type": "string"
    },
    "max_tokens_to_sample": {
      "type": "integer",
      "minimum": 1
    },
    "temperature": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    }
  }
}`,
    Cohere: `{
  "type": "object",
  "required": ["message"],
  "properties": {
    "message": {
      "type": "string"
    },
    "model": {
      "type": "string"
    },
    "temperature": {
      "type": "number",
      "minimum": 0,
      "maximum": 2
    }
  }
}`,
    Custom: `{
  "type": "object",
  "properties": {
    // Define your custom input schema here
  }
}`
  };

  const sampleOutputSchema = {
    OpenAI: `{
  "type": "object",
  "required": ["choices"],
  "properties": {
    "choices": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["message"],
        "properties": {
          "message": {
            "type": "object",
            "required": ["role", "content"],
            "properties": {
              "role": {
                "type": "string",
                "enum": ["assistant"]
              },
              "content": {
                "type": "string"
              }
            }
          }
        }
      }
    }
  }
}`,
    Anthropic: `{
  "type": "object",
  "required": ["completion"],
  "properties": {
    "completion": {
      "type": "string"
    },
    "stop_reason": {
      "type": "string",
      "enum": ["stop_sequence", "max_tokens"]
    }
  }
}`,
    Cohere: `{
  "type": "object",
  "required": ["text"],
  "properties": {
    "text": {
      "type": "string"
    },
    "generation_id": {
      "type": "string"
    }
  }
}`,
    Custom: `{
  "type": "object",
  "properties": {
    // Define your custom output schema here
  }
}`
  };

  const handleToggleMode = () => {
    const newMode = isAdvancedMode ? 'basic' : 'advanced';
    setIsAdvancedMode(!isAdvancedMode);
    updateConfig({ schemaComplexity: newMode });
  };

  const handleEditSchema = (type: 'input' | 'output') => {
    // In a real implementation, this would open a schema editor
    // For now, we'll just show an alert
    alert(`Edit ${type} schema`);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">2. Define Schema</h2>
      
      <div className="flex justify-between items-center mb-4">
        <span className="font-medium">Schema Complexity</span>
        <div className="flex items-center">
          <span className="mr-2 text-sm">Basic</span>
          <label className="relative inline-block w-12 h-6">
            <input 
              type="checkbox" 
              className="opacity-0 w-0 h-0" 
              checked={isAdvancedMode}
              onChange={handleToggleMode}
            />
            <span className={`absolute cursor-pointer inset-0 rounded-full ${
              isAdvancedMode ? 'bg-blue-600' : 'bg-gray-600'
            }`}>
              <span className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                isAdvancedMode ? 'left-7' : 'left-1'
              }`}></span>
            </span>
          </label>
          <span className="ml-2 text-sm">Advanced</span>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Input Schema</h3>
        <div className="bg-gray-700 p-4 rounded-lg mb-2">
          <p className="text-sm text-gray-300">Based on your API provider ({config.provider}), we've detected the following input schema:</p>
          <pre className="bg-gray-900 p-2 rounded mt-2 text-xs overflow-auto h-40">
            {sampleInputSchema[config.provider as keyof typeof sampleInputSchema] || sampleInputSchema.Custom}
          </pre>
        </div>
        <button 
          onClick={() => handleEditSchema('input')}
          className="text-blue-400 text-sm hover:text-blue-300"
        >
          Edit Input Schema
        </button>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">Output Schema</h3>
        <div className="bg-gray-700 p-4 rounded-lg mb-2">
          <p className="text-sm text-gray-300">Based on your API provider ({config.provider}), we've detected the following output schema:</p>
          <pre className="bg-gray-900 p-2 rounded mt-2 text-xs overflow-auto h-40">
            {sampleOutputSchema[config.provider as keyof typeof sampleOutputSchema] || sampleOutputSchema.Custom}
          </pre>
        </div>
        <button 
          onClick={() => handleEditSchema('output')}
          className="text-blue-400 text-sm hover:text-blue-300"
        >
          Edit Output Schema
        </button>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button 
          onClick={onPrevious}
          className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
        >
          Previous
        </button>
        <button 
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          Next: Set Governance
        </button>
      </div>
    </div>
  );
};

export default SchemaStep;
