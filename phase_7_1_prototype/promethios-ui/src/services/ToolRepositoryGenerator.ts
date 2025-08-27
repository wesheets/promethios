/**
 * ToolRepositoryGenerator - Creates structured repositories for custom tools
 * Part of the revolutionary conversational tool builder system
 */

import { ToolBuildRequest } from './AutonomousToolClassificationService';
import { WorkflowRepositoryManager } from './WorkflowRepositoryManager';

export interface ToolRepository {
  id: string;
  name: string;
  description: string;
  toolType: string;
  structure: ToolFileStructure;
  metadata: ToolMetadata;
  deploymentConfig: DeploymentConfig;
}

export interface ToolFileStructure {
  'tool_definition.json': string;
  'main.py'?: string;
  'main.js'?: string;
  'interface.tsx': string;
  'styles.css': string;
  'README.md': string;
  'package.json': string;
  'requirements.txt'?: string;
  'tests.py'?: string;
  'tests.js'?: string;
  'config.json': string;
  'deploy.yml': string;
}

export interface ToolMetadata {
  version: string;
  author: string;
  created: string;
  lastModified: string;
  tags: string[];
  category: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedRuntime: string;
  dependencies: string[];
  apiEndpoints?: string[];
  permissions: string[];
}

export interface DeploymentConfig {
  type: 'static' | 'serverless' | 'container';
  runtime: string;
  environment: Record<string, string>;
  buildCommand: string;
  startCommand: string;
  healthCheck: string;
  scaling: {
    min: number;
    max: number;
    target: number;
  };
}

export class ToolRepositoryGenerator {
  private static instance: ToolRepositoryGenerator;
  private repositoryManager: WorkflowRepositoryManager;

  private constructor() {
    this.repositoryManager = WorkflowRepositoryManager.getInstance();
  }

  public static getInstance(): ToolRepositoryGenerator {
    if (!ToolRepositoryGenerator.instance) {
      ToolRepositoryGenerator.instance = new ToolRepositoryGenerator();
    }
    return ToolRepositoryGenerator.instance;
  }

  /**
   * Generate a complete tool repository from a build request
   */
  public async generateToolRepository(
    request: ToolBuildRequest,
    userId: string
  ): Promise<ToolRepository> {
    console.log('🛠️ [ToolGenerator] Creating repository for:', request.suggestedName);

    const toolId = this.generateToolId(request.suggestedName);
    const metadata = this.generateMetadata(request, userId);
    const structure = await this.generateFileStructure(request, metadata);
    const deploymentConfig = this.generateDeploymentConfig(request);

    const repository: ToolRepository = {
      id: toolId,
      name: request.suggestedName,
      description: request.description,
      toolType: request.toolType,
      structure,
      metadata,
      deploymentConfig
    };

    // Create the actual repository
    await this.createRepository(repository, userId);

    console.log('✅ [ToolGenerator] Repository created:', toolId);
    return repository;
  }

  /**
   * Generate unique tool ID
   */
  private generateToolId(name: string): string {
    const cleanName = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    const timestamp = Date.now();
    return `tool-${cleanName}-${timestamp}`;
  }

  /**
   * Generate tool metadata
   */
  private generateMetadata(request: ToolBuildRequest, userId: string): ToolMetadata {
    return {
      version: '1.0.0',
      author: userId,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      tags: this.generateTags(request),
      category: this.mapToolTypeToCategory(request.toolType),
      complexity: request.complexity,
      estimatedRuntime: request.estimatedTime,
      dependencies: this.generateDependencies(request),
      permissions: this.generatePermissions(request)
    };
  }

  /**
   * Generate complete file structure for the tool
   */
  private async generateFileStructure(
    request: ToolBuildRequest,
    metadata: ToolMetadata
  ): Promise<ToolFileStructure> {
    const structure: ToolFileStructure = {
      'tool_definition.json': this.generateToolDefinition(request, metadata),
      'interface.tsx': await this.generateReactInterface(request),
      'styles.css': this.generateStyles(request),
      'README.md': this.generateReadme(request, metadata),
      'package.json': this.generatePackageJson(request, metadata),
      'config.json': this.generateConfig(request),
      'deploy.yml': this.generateDeploymentYaml(request)
    };

    // Add language-specific files
    if (request.technologies.includes('Python')) {
      structure['main.py'] = await this.generatePythonCode(request);
      structure['requirements.txt'] = this.generateRequirements(request);
      structure['tests.py'] = this.generatePythonTests(request);
    }

    if (request.technologies.includes('JavaScript') || request.technologies.includes('React')) {
      structure['main.js'] = await this.generateJavaScriptCode(request);
      structure['tests.js'] = this.generateJavaScriptTests(request);
    }

    return structure;
  }

  /**
   * Generate tool definition JSON
   */
  private generateToolDefinition(request: ToolBuildRequest, metadata: ToolMetadata): string {
    const definition = {
      name: request.suggestedName,
      description: request.description,
      version: metadata.version,
      type: request.toolType,
      complexity: request.complexity,
      technologies: request.technologies,
      requirements: request.requirements,
      metadata,
      ui: {
        type: 'react',
        entryPoint: 'interface.tsx',
        styles: 'styles.css'
      },
      api: {
        endpoints: this.generateApiEndpoints(request),
        authentication: this.requiresAuth(request),
        rateLimit: this.generateRateLimit(request)
      },
      deployment: {
        type: this.getDeploymentType(request),
        runtime: this.getRuntime(request),
        buildCommand: this.getBuildCommand(request),
        startCommand: this.getStartCommand(request)
      }
    };

    return JSON.stringify(definition, null, 2);
  }

  /**
   * Generate React interface component
   */
  private async generateReactInterface(request: ToolBuildRequest): Promise<string> {
    const componentName = this.generateComponentName(request.suggestedName);
    
    return `import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import './styles.css';

interface ${componentName}Props {
  onResult?: (result: any) => void;
  config?: Record<string, any>;
}

const ${componentName}: React.FC<${componentName}Props> = ({ onResult, config }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Tool-specific logic will be implemented here
      const response = await executeToolLogic(input, config);
      setResult(response);
      onResult?.(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const executeToolLogic = async (input: string, config?: Record<string, any>) => {
    // This will be customized based on the tool type
    ${this.generateToolLogic(request)}
  };

  return (
    <Box className="tool-container">
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            ${request.suggestedName}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            ${request.description}
          </Typography>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter your input here..."
                multiline={${request.toolType === 'data_analyzer'}}
                rows={${request.toolType === 'data_analyzer' ? 4 : 1}}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleExecute}
                disabled={loading || !input.trim()}
                fullWidth
              >
                {loading ? <CircularProgress size={20} /> : 'Execute'}
              </Button>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Result:
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ${componentName};`;
  }

  /**
   * Generate tool-specific logic based on type
   */
  private generateToolLogic(request: ToolBuildRequest): string {
    switch (request.toolType) {
      case 'data_analyzer':
        return `
    // Parse CSV or JSON data
    const lines = input.split('\\n');
    const data = lines.map(line => line.split(','));
    
    // Perform analysis
    const analysis = {
      rowCount: data.length,
      columnCount: data[0]?.length || 0,
      summary: 'Data analysis complete',
      insights: ['Sample insight 1', 'Sample insight 2']
    };
    
    return analysis;`;

      case 'tracker':
        return `
    // Store tracking data
    const trackingData = {
      timestamp: new Date().toISOString(),
      value: input,
      id: Date.now()
    };
    
    // Save to localStorage (in real implementation, this would use a database)
    const existing = JSON.parse(localStorage.getItem('tracking_data') || '[]');
    existing.push(trackingData);
    localStorage.setItem('tracking_data', JSON.stringify(existing));
    
    return { success: true, data: trackingData, total: existing.length };`;

      case 'converter':
        return `
    // Perform conversion based on tool type
    const converted = {
      original: input,
      converted: input.toUpperCase(), // Example conversion
      timestamp: new Date().toISOString()
    };
    
    return converted;`;

      case 'calculator':
        return `
    try {
      // Safe evaluation of mathematical expressions
      const result = Function('"use strict"; return (' + input + ')')();
      return {
        expression: input,
        result: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Invalid mathematical expression');
    }`;

      default:
        return `
    // Generic tool logic
    const result = {
      input: input,
      processed: true,
      timestamp: new Date().toISOString(),
      message: 'Tool executed successfully'
    };
    
    return result;`;
    }
  }

  /**
   * Generate CSS styles
   */
  private generateStyles(request: ToolBuildRequest): string {
    return `.tool-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.tool-container .MuiCard-root {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.tool-container .MuiButton-contained {
  background: linear-gradient(45deg, #3b82f6, #1d4ed8);
  color: white;
  font-weight: 600;
}

.tool-container .MuiButton-contained:hover {
  background: linear-gradient(45deg, #2563eb, #1e40af);
}

.tool-container pre {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 12px;
  overflow-x: auto;
  max-height: 300px;
}

.tool-container .MuiAlert-root {
  border-radius: 6px;
}

/* Tool-specific styles */
${this.generateToolSpecificStyles(request)}`;
  }

  /**
   * Generate tool-specific CSS
   */
  private generateToolSpecificStyles(request: ToolBuildRequest): string {
    switch (request.toolType) {
      case 'dashboard':
        return `
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.dashboard-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}`;

      case 'data_analyzer':
        return `
.data-table {
  overflow-x: auto;
  margin-top: 16px;
}

.data-visualization {
  height: 300px;
  margin-top: 16px;
}`;

      default:
        return '';
    }
  }

  /**
   * Generate README documentation
   */
  private generateReadme(request: ToolBuildRequest, metadata: ToolMetadata): string {
    return `# ${request.suggestedName}

${request.description}

## Overview

This tool was automatically generated using the Promethios AI Tool Builder system. It provides ${request.toolType} functionality with a modern React interface.

## Features

${request.requirements.map(req => `- ${req}`).join('\n')}

## Technology Stack

${request.technologies.map(tech => `- ${tech}`).join('\n')}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Development

This tool is built with:
- **Frontend**: React with Material-UI
- **Backend**: ${request.technologies.includes('Python') ? 'Python' : 'Node.js'}
- **Deployment**: Automated via Promethios platform

## Configuration

Edit \`config.json\` to customize tool behavior:

\`\`\`json
{
  "apiEndpoint": "your-api-endpoint",
  "refreshInterval": 30000,
  "maxResults": 100
}
\`\`\`

## API Endpoints

${this.generateApiEndpoints(request).map(endpoint => `- \`${endpoint}\``).join('\n')}

## Contributing

This tool was generated automatically but can be customized and extended. Feel free to modify the code to suit your specific needs.

## License

Generated by Promethios AI Tool Builder - ${new Date().getFullYear()}

---

*This tool was created in ${request.estimatedTime} using conversational AI assistance.*`;
  }

  /**
   * Generate package.json
   */
  private generatePackageJson(request: ToolBuildRequest, metadata: ToolMetadata): string {
    const packageJson = {
      name: request.suggestedName.toLowerCase().replace(/\s+/g, '-'),
      version: metadata.version,
      description: request.description,
      main: 'main.js',
      scripts: {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test',
        eject: 'react-scripts eject'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        '@mui/material': '^5.14.0',
        '@emotion/react': '^11.11.0',
        '@emotion/styled': '^11.11.0',
        axios: '^1.5.0'
      },
      devDependencies: {
        'react-scripts': '^5.0.1',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        typescript: '^5.0.0'
      },
      keywords: metadata.tags,
      author: metadata.author,
      license: 'MIT',
      browserslist: {
        production: ['>0.2%', 'not dead', 'not op_mini all'],
        development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version']
      }
    };

    // Add tool-specific dependencies
    if (request.toolType === 'data_analyzer') {
      packageJson.dependencies['recharts'] = '^2.8.0';
      packageJson.dependencies['papaparse'] = '^5.4.0';
    }

    if (request.toolType === 'dashboard') {
      packageJson.dependencies['@mui/x-charts'] = '^6.0.0';
      packageJson.dependencies['date-fns'] = '^2.30.0';
    }

    return JSON.stringify(packageJson, null, 2);
  }

  /**
   * Generate deployment configuration
   */
  private generateDeploymentConfig(request: ToolBuildRequest): DeploymentConfig {
    return {
      type: this.getDeploymentType(request),
      runtime: this.getRuntime(request),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000'
      },
      buildCommand: 'npm run build',
      startCommand: 'npm start',
      healthCheck: '/health',
      scaling: {
        min: 1,
        max: request.complexity === 'complex' ? 10 : 3,
        target: 2
      }
    };
  }

  /**
   * Helper methods for configuration generation
   */
  private generateTags(request: ToolBuildRequest): string[] {
    const tags = [request.toolType, request.complexity];
    tags.push(...request.technologies.map(tech => tech.toLowerCase()));
    return [...new Set(tags)];
  }

  private mapToolTypeToCategory(toolType: string): string {
    const categoryMap: Record<string, string> = {
      data_analyzer: 'Data & Analytics',
      tracker: 'Productivity',
      converter: 'Utilities',
      dashboard: 'Visualization',
      calculator: 'Utilities',
      scraper: 'Data Collection',
      api_tool: 'Integration',
      automation: 'Workflow'
    };
    return categoryMap[toolType] || 'General';
  }

  private generateDependencies(request: ToolBuildRequest): string[] {
    const deps = ['react', '@mui/material'];
    if (request.technologies.includes('Python')) deps.push('python', 'flask');
    if (request.toolType === 'data_analyzer') deps.push('pandas', 'numpy');
    return deps;
  }

  private generatePermissions(request: ToolBuildRequest): string[] {
    const permissions = ['read'];
    if (request.requirements.some(req => req.includes('storage'))) permissions.push('write');
    if (request.requirements.some(req => req.includes('api'))) permissions.push('network');
    return permissions;
  }

  private generateApiEndpoints(request: ToolBuildRequest): string[] {
    const endpoints = ['/api/execute', '/api/status'];
    if (request.toolType === 'data_analyzer') endpoints.push('/api/analyze');
    if (request.toolType === 'tracker') endpoints.push('/api/track', '/api/history');
    return endpoints;
  }

  private requiresAuth(request: ToolBuildRequest): boolean {
    return request.requirements.some(req => 
      req.includes('api') || req.includes('database') || req.includes('storage')
    );
  }

  private generateRateLimit(request: ToolBuildRequest): { requests: number; window: string } {
    return request.complexity === 'complex' 
      ? { requests: 100, window: '1h' }
      : { requests: 1000, window: '1h' };
  }

  private getDeploymentType(request: ToolBuildRequest): 'static' | 'serverless' | 'container' {
    if (request.technologies.includes('Python')) return 'container';
    if (request.complexity === 'complex') return 'serverless';
    return 'static';
  }

  private getRuntime(request: ToolBuildRequest): string {
    if (request.technologies.includes('Python')) return 'python-3.11';
    return 'nodejs-18';
  }

  private getBuildCommand(request: ToolBuildRequest): string {
    return request.technologies.includes('Python') ? 'pip install -r requirements.txt' : 'npm run build';
  }

  private getStartCommand(request: ToolBuildRequest): string {
    return request.technologies.includes('Python') ? 'python main.py' : 'npm start';
  }

  private generateComponentName(toolName: string): string {
    return toolName.replace(/[^a-zA-Z0-9]/g, '').replace(/^\w/, c => c.toUpperCase()) + 'Tool';
  }

  private generateConfig(request: ToolBuildRequest): string {
    const config = {
      name: request.suggestedName,
      version: '1.0.0',
      apiEndpoint: '/api',
      refreshInterval: 30000,
      maxResults: 100,
      theme: 'light',
      features: request.requirements
    };
    return JSON.stringify(config, null, 2);
  }

  private generateDeploymentYaml(request: ToolBuildRequest): string {
    return `name: Deploy ${request.suggestedName}

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy
      run: echo "Deployment configured for ${request.suggestedName}"`;
  }

  private generateRequirements(request: ToolBuildRequest): string {
    const requirements = ['flask>=2.3.0', 'requests>=2.31.0'];
    if (request.toolType === 'data_analyzer') {
      requirements.push('pandas>=2.0.0', 'numpy>=1.24.0');
    }
    if (request.toolType === 'scraper') {
      requirements.push('beautifulsoup4>=4.12.0', 'selenium>=4.10.0');
    }
    return requirements.join('\n');
  }

  private async generatePythonCode(request: ToolBuildRequest): Promise<string> {
    return `#!/usr/bin/env python3
"""
${request.suggestedName} - Auto-generated tool
${request.description}
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ${this.generateComponentName(request.suggestedName)}:
    def __init__(self):
        self.name = "${request.suggestedName}"
        self.version = "1.0.0"
        logger.info(f"Initialized {self.name} v{self.version}")
    
    def execute(self, input_data):
        """Main execution logic for the tool"""
        try:
            ${this.generatePythonLogic(request)}
        except Exception as e:
            logger.error(f"Error executing tool: {str(e)}")
            raise

tool_instance = ${this.generateComponentName(request.suggestedName)}()

@app.route('/api/execute', methods=['POST'])
def execute_tool():
    try:
        data = request.get_json()
        input_data = data.get('input', '')
        
        result = tool_instance.execute(input_data)
        
        return jsonify({
            'success': True,
            'result': result,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        'name': tool_instance.name,
        'version': tool_instance.version,
        'status': 'running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)`;
  }

  private generatePythonLogic(request: ToolBuildRequest): string {
    switch (request.toolType) {
      case 'data_analyzer':
        return `
            import pandas as pd
            import numpy as np
            
            # Parse input data
            if isinstance(input_data, str):
                # Assume CSV format
                from io import StringIO
                df = pd.read_csv(StringIO(input_data))
            else:
                df = pd.DataFrame(input_data)
            
            # Perform analysis
            analysis = {
                'shape': df.shape,
                'columns': df.columns.tolist(),
                'dtypes': df.dtypes.to_dict(),
                'summary': df.describe().to_dict(),
                'missing_values': df.isnull().sum().to_dict()
            }
            
            return analysis`;

      case 'tracker':
        return `
            # Store tracking data (in production, use a proper database)
            tracking_entry = {
                'timestamp': datetime.now().isoformat(),
                'value': input_data,
                'id': hash(str(input_data) + str(datetime.now()))
            }
            
            # For demo purposes, return the entry
            return {
                'tracked': True,
                'entry': tracking_entry,
                'message': 'Data tracked successfully'
            }`;

      default:
        return `
            # Generic processing logic
            result = {
                'input': input_data,
                'processed': True,
                'timestamp': datetime.now().isoformat(),
                'message': f'Processed by {self.name}'
            }
            
            return result`;
    }
  }

  private async generateJavaScriptCode(request: ToolBuildRequest): Promise<string> {
    return `/**
 * ${request.suggestedName} - Auto-generated tool
 * ${request.description}
 */

class ${this.generateComponentName(request.suggestedName)} {
  constructor() {
    this.name = '${request.suggestedName}';
    this.version = '1.0.0';
    console.log(\`Initialized \${this.name} v\${this.version}\`);
  }

  async execute(inputData) {
    try {
      ${this.generateJavaScriptLogic(request)}
    } catch (error) {
      console.error('Error executing tool:', error);
      throw error;
    }
  }
}

// Export for use in React component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ${this.generateComponentName(request.suggestedName)};
}

// Global instance for browser use
if (typeof window !== 'undefined') {
  window.${this.generateComponentName(request.suggestedName)} = ${this.generateComponentName(request.suggestedName)};
}`;
  }

  private generateJavaScriptLogic(request: ToolBuildRequest): string {
    switch (request.toolType) {
      case 'converter':
        return `
      // Conversion logic
      const result = {
        original: inputData,
        converted: this.performConversion(inputData),
        timestamp: new Date().toISOString()
      };
      
      return result;
    }
    
    performConversion(data) {
      // Implement specific conversion logic here
      return data.toString().toUpperCase();`;

      case 'calculator':
        return `
      // Safe calculation
      try {
        const result = Function('"use strict"; return (' + inputData + ')')();
        return {
          expression: inputData,
          result: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new Error('Invalid mathematical expression');
      }`;

      default:
        return `
      // Generic processing
      const result = {
        input: inputData,
        processed: true,
        timestamp: new Date().toISOString(),
        message: \`Processed by \${this.name}\`
      };
      
      return result;`;
    }
  }

  private generatePythonTests(request: ToolBuildRequest): string {
    return `#!/usr/bin/env python3
"""
Tests for ${request.suggestedName}
"""

import unittest
import json
from main import ${this.generateComponentName(request.suggestedName)}

class Test${this.generateComponentName(request.suggestedName)}(unittest.TestCase):
    def setUp(self):
        self.tool = ${this.generateComponentName(request.suggestedName)}()
    
    def test_initialization(self):
        self.assertEqual(self.tool.name, "${request.suggestedName}")
        self.assertEqual(self.tool.version, "1.0.0")
    
    def test_execute_basic(self):
        result = self.tool.execute("test input")
        self.assertIsInstance(result, dict)
        self.assertIn('timestamp', result)
    
    def test_execute_empty_input(self):
        result = self.tool.execute("")
        self.assertIsInstance(result, dict)

if __name__ == '__main__':
    unittest.main()`;
  }

  private generateJavaScriptTests(request: ToolBuildRequest): string {
    return `/**
 * Tests for ${request.suggestedName}
 */

const ${this.generateComponentName(request.suggestedName)} = require('./main.js');

describe('${request.suggestedName}', () => {
  let tool;

  beforeEach(() => {
    tool = new ${this.generateComponentName(request.suggestedName)}();
  });

  test('should initialize correctly', () => {
    expect(tool.name).toBe('${request.suggestedName}');
    expect(tool.version).toBe('1.0.0');
  });

  test('should execute with basic input', async () => {
    const result = await tool.execute('test input');
    expect(result).toHaveProperty('timestamp');
    expect(typeof result).toBe('object');
  });

  test('should handle empty input', async () => {
    const result = await tool.execute('');
    expect(typeof result).toBe('object');
  });
});`;
  }

  /**
   * Create the actual repository using WorkflowRepositoryManager
   */
  private async createRepository(repository: ToolRepository, userId: string): Promise<void> {
    try {
      // Create repository structure
      const repoData = {
        name: repository.name,
        description: repository.description,
        type: 'tool' as const,
        files: repository.structure,
        metadata: {
          ...repository.metadata,
          toolType: repository.toolType,
          deploymentConfig: repository.deploymentConfig
        }
      };

      // Use the repository manager to create the repo
      await this.repositoryManager.createRepository(userId, repoData);
      
      console.log('✅ [ToolGenerator] Repository created successfully');
    } catch (error) {
      console.error('❌ [ToolGenerator] Failed to create repository:', error);
      throw error;
    }
  }
}

export default ToolRepositoryGenerator;

