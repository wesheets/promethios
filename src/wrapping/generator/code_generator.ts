/**
 * Code Generator for Promethios Agent Wrapping
 * 
 * This module generates wrapper code for agents based on templates
 * and adaptation strategies.
 */

import { Schema } from '../../schemas/types';
import { GovernanceHook } from '../detection/schema_analyzer';
import { WrapperTemplate, WrapperGenerationConfig, getWrapperTemplate, getBestTemplateForFramework } from './wrapper_templates';
import { createAdaptationLayer } from './adaptation_layer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Result of code generation
 */
export interface CodeGenerationResult {
  files: GeneratedFile[];
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Represents a generated file
 */
export interface GeneratedFile {
  path: string;
  content: string;
  isExecutable: boolean;
  description: string;
}

/**
 * Generates wrapper code for an agent
 * 
 * @param config - Configuration for wrapper generation
 * @returns Result of code generation
 */
export async function generateWrapperCode(
  config: WrapperGenerationConfig
): Promise<CodeGenerationResult> {
  const result: CodeGenerationResult = {
    files: [],
    success: true,
    errors: [],
    warnings: []
  };
  
  try {
    // Get the template
    const template = config.templateId
      ? getWrapperTemplate(config.templateId)
      : getBestTemplateForFramework(config.framework);
    
    if (!template) {
      result.success = false;
      result.errors.push(`Template not found: ${config.templateId || config.framework}`);
      return result;
    }
    
    // Create adaptation layer
    const adaptationLayer = createAdaptationLayer({
      framework: config.framework,
      inputSchema: config.inputSchema,
      outputSchema: config.outputSchema,
      memorySchema: config.memorySchema,
      governanceHooks: config.governanceHooks,
      agentCode: config.agentCode,
      options: config.configOptions
    });
    
    // Generate files from template
    for (const templateFile of template.templateFiles) {
      // Skip optional files if not needed
      if (templateFile.isOptional && shouldSkipOptionalFile(templateFile, config)) {
        continue;
      }
      
      // Process template content
      const processedContent = processTemplateContent(
        templateFile.content,
        config,
        adaptationLayer,
        template
      );
      
      // Add to result
      result.files.push({
        path: path.join(config.outputDir, templateFile.path),
        content: processedContent,
        isExecutable: templateFile.isExecutable,
        description: templateFile.description
      });
    }
    
    // Add additional files if needed
    const additionalFiles = generateAdditionalFiles(config, template);
    result.files.push(...additionalFiles);
    
    // Add warnings for potential issues
    const warnings = validateGeneratedCode(result.files, config);
    result.warnings.push(...warnings);
    
  } catch (error) {
    result.success = false;
    result.errors.push(`Error generating wrapper code: ${error.message}`);
  }
  
  return result;
}

/**
 * Writes generated files to disk
 * 
 * @param generationResult - Result of code generation
 * @returns Result of file writing
 */
export async function writeGeneratedFiles(
  generationResult: CodeGenerationResult
): Promise<{ success: boolean; errors: string[] }> {
  const result = {
    success: true,
    errors: [] as string[]
  };
  
  try {
    // Create directories if they don't exist
    const directories = new Set<string>();
    generationResult.files.forEach(file => {
      directories.add(path.dirname(file.path));
    });
    
    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    // Write files
    for (const file of generationResult.files) {
      fs.writeFileSync(file.path, file.content);
      
      // Set executable permissions if needed
      if (file.isExecutable) {
        fs.chmodSync(file.path, 0o755);
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(`Error writing generated files: ${error.message}`);
  }
  
  return result;
}

/**
 * Determines if an optional file should be skipped
 */
function shouldSkipOptionalFile(
  templateFile: { path: string; description: string },
  config: WrapperGenerationConfig
): boolean {
  // Skip README if not requested
  if (templateFile.path === 'README.md' && config.configOptions.skipReadme) {
    return true;
  }
  
  // Skip test files if not requested
  if (templateFile.path.includes('test') && config.configOptions.skipTests) {
    return true;
  }
  
  return false;
}

/**
 * Processes template content with configuration values
 */
function processTemplateContent(
  content: string,
  config: WrapperGenerationConfig,
  adaptationLayer: {
    adaptedInputSchema: Schema;
    adaptedOutputSchema: Schema;
    adaptedMemorySchema?: Schema;
    governanceHookSnippets: string[];
  },
  template: WrapperTemplate
): string {
  let processedContent = content;
  
  // Replace template variables
  processedContent = processedContent.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    switch (variable) {
      case 'inputSchema':
        return JSON.stringify(adaptationLayer.adaptedInputSchema, null, 2);
      case 'outputSchema':
        return JSON.stringify(adaptationLayer.adaptedOutputSchema, null, 2);
      case 'memorySchema':
        return adaptationLayer.adaptedMemorySchema
          ? JSON.stringify(adaptationLayer.adaptedMemorySchema, null, 2)
          : 'undefined';
      case 'framework':
        return config.framework;
      case 'governanceHooks':
        return adaptationLayer.governanceHookSnippets.join('\n\n');
      default:
        // Check if it's a config option
        if (config.configOptions && variable in config.configOptions) {
          return JSON.stringify(config.configOptions[variable]);
        }
        return match; // Keep original if not found
    }
  });
  
  return processedContent;
}

/**
 * Generates additional files not in the template
 */
function generateAdditionalFiles(
  config: WrapperGenerationConfig,
  template: WrapperTemplate
): GeneratedFile[] {
  const additionalFiles: GeneratedFile[] = [];
  
  // Add package.json if not present in template
  if (!template.templateFiles.some(file => file.path === 'package.json') && 
      !config.configOptions.skipPackageJson) {
    additionalFiles.push({
      path: path.join(config.outputDir, 'package.json'),
      content: generatePackageJson(config, template),
      isExecutable: false,
      description: 'NPM package configuration'
    });
  }
  
  // Add tsconfig.json if not present in template
  if (!template.templateFiles.some(file => file.path === 'tsconfig.json') && 
      !config.configOptions.skipTsConfig) {
    additionalFiles.push({
      path: path.join(config.outputDir, 'tsconfig.json'),
      content: generateTsConfig(),
      isExecutable: false,
      description: 'TypeScript configuration'
    });
  }
  
  return additionalFiles;
}

/**
 * Generates package.json content
 */
function generatePackageJson(
  config: WrapperGenerationConfig,
  template: WrapperTemplate
): string {
  return JSON.stringify({
    name: `promethios-${config.framework}-wrapper`,
    version: '0.1.0',
    description: `Promethios governance wrapper for ${config.framework} agents`,
    main: 'dist/wrapper.js',
    types: 'dist/wrapper.d.ts',
    scripts: {
      build: 'tsc',
      test: 'jest',
      lint: 'eslint .'
    },
    dependencies: {
      promethios: '^0.1.0'
    },
    devDependencies: {
      typescript: '^4.9.0',
      '@types/node': '^18.0.0',
      jest: '^29.0.0',
      '@types/jest': '^29.0.0',
      'ts-jest': '^29.0.0',
      eslint: '^8.0.0'
    }
  }, null, 2);
}

/**
 * Generates tsconfig.json content
 */
function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'es2020',
      module: 'commonjs',
      declaration: true,
      outDir: './dist',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true
    },
    include: ['./**/*.ts'],
    exclude: ['node_modules', 'dist', '**/*.test.ts']
  }, null, 2);
}

/**
 * Validates generated code for potential issues
 */
function validateGeneratedCode(
  files: GeneratedFile[],
  config: WrapperGenerationConfig
): string[] {
  const warnings: string[] = [];
  
  // Check for missing schema validation
  const hasSchemaValidation = files.some(file => 
    file.content.includes('validate') && 
    file.content.includes('schema')
  );
  
  if (!hasSchemaValidation && config.configOptions.strictValidation) {
    warnings.push('Generated code may lack schema validation');
  }
  
  // Check for missing governance hooks
  const hasGovernanceHooks = files.some(file => 
    file.content.includes('GovernanceWrapper.beforeExecution') || 
    file.content.includes('GovernanceWrapper.afterExecution')
  );
  
  if (!hasGovernanceHooks) {
    warnings.push('Generated code may lack governance hooks');
  }
  
  // Check for potential memory leaks
  const hasMemoryTracking = files.some(file => 
    file.content.includes('memory') && 
    !file.content.includes('trackMemoryAccess')
  );
  
  if (hasMemoryTracking && config.configOptions.trackMemory) {
    warnings.push('Generated code may have untracked memory access');
  }
  
  return warnings;
}
