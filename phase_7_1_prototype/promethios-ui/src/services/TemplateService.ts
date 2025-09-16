/**
 * Template Service
 * 
 * Manages downloadable templates for policies, documents, and org charts.
 * Allows users to customize templates and save them for reuse.
 */

import { unifiedStorage } from './UnifiedStorageService';
import { customPolicyService, type CustomPolicy, type PolicyRule } from './CustomPolicyService';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'policy' | 'document' | 'orgchart' | 'knowledge_base' | 'compliance';
  type: 'csv' | 'json' | 'markdown' | 'pdf' | 'docx' | 'txt';
  content: string;
  fields: TemplateField[];
  tags: string[];
  isPublic: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  downloadCount: number;
  version: string;
  instructions: string;
  examples?: string[];
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  placeholder?: string;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface CustomizedTemplate {
  id: string;
  templateId: string;
  userId: string;
  agentId?: string;
  name: string;
  customizations: Record<string, any>;
  generatedContent: string;
  createdAt: string;
  lastUsed: string;
  useCount: number;
}

class TemplateService {
  private readonly TEMPLATES_PREFIX = 'templates';
  private readonly CUSTOM_TEMPLATES_PREFIX = 'custom_templates';

  /**
   * Get all available templates
   */
  async getTemplates(category?: string): Promise<Template[]> {
    try {
      const templates = this.getBuiltInTemplates();
      
      // Filter by category if specified
      if (category) {
        return templates.filter(template => template.category === category);
      }
      
      return templates;
    } catch (error) {
      console.error('❌ Failed to get templates:', error);
      return [];
    }
  }

  /**
   * Get built-in templates
   */
  private getBuiltInTemplates(): Template[] {
    return [
      // Policy Templates
      {
        id: 'policy_pii_protection',
        name: 'PII Protection Policy Template',
        description: 'Enhanced personally identifiable information protection policy beyond HIPAA requirements',
        category: 'policy',
        type: 'json',
        content: JSON.stringify({
          name: '{{policy_name}}',
          description: '{{policy_description}}',
          category: 'data_handling',
          rules: [
            {
              condition: 'content.contains_ssn || content.contains_credit_card',
              action: 'deny',
              message: '{{ssn_message}}',
              severity: 'critical'
            },
            {
              condition: 'content.contains_email_addresses && !user.has_permission("email_access")',
              action: 'warn',
              message: '{{email_message}}',
              severity: 'medium'
            }
          ],
          enforcementLevel: '{{enforcement_level}}',
          tags: ['pii', 'privacy', 'data-protection']
        }, null, 2),
        fields: [
          {
            id: 'policy_name',
            name: 'policy_name',
            label: 'Policy Name',
            type: 'text',
            required: true,
            defaultValue: 'Enhanced PII Protection Policy',
            placeholder: 'Enter policy name'
          },
          {
            id: 'policy_description',
            name: 'policy_description',
            label: 'Policy Description',
            type: 'textarea',
            required: true,
            defaultValue: 'Enhanced personally identifiable information protection beyond HIPAA requirements',
            placeholder: 'Describe the policy purpose and scope'
          },
          {
            id: 'enforcement_level',
            name: 'enforcement_level',
            label: 'Enforcement Level',
            type: 'select',
            required: true,
            defaultValue: 'high',
            options: ['low', 'medium', 'high', 'critical']
          },
          {
            id: 'ssn_message',
            name: 'ssn_message',
            label: 'SSN Violation Message',
            type: 'text',
            required: true,
            defaultValue: 'SSN and credit card numbers are strictly prohibited'
          },
          {
            id: 'email_message',
            name: 'email_message',
            label: 'Email Warning Message',
            type: 'text',
            required: true,
            defaultValue: 'Email addresses detected - ensure proper authorization'
          }
        ],
        tags: ['pii', 'privacy', 'data-protection', 'policy'],
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        downloadCount: 0,
        version: '1.0',
        instructions: 'This template creates a comprehensive PII protection policy. Customize the enforcement level and violation messages to match your organization\'s requirements.',
        examples: [
          'Healthcare organizations requiring HIPAA+ compliance',
          'Financial services with strict data protection needs',
          'Government agencies handling sensitive citizen data'
        ]
      },
      
      // Document Templates
      {
        id: 'doc_employee_handbook',
        name: 'Employee Handbook Upload Template',
        description: 'Structured template for uploading and organizing employee handbook content',
        category: 'document',
        type: 'markdown',
        content: `# {{company_name}} Employee Handbook

## Table of Contents
1. [Company Overview](#company-overview)
2. [Employment Policies](#employment-policies)
3. [Code of Conduct](#code-of-conduct)
4. [Benefits and Compensation](#benefits-and-compensation)
5. [IT and Security Policies](#it-and-security-policies)

## Company Overview
{{company_overview}}

## Employment Policies

### Equal Opportunity Employment
{{equal_opportunity_policy}}

### Work Schedule and Attendance
{{attendance_policy}}

### Performance Management
{{performance_policy}}

## Code of Conduct

### Professional Behavior
{{professional_behavior}}

### Confidentiality and Data Protection
{{confidentiality_policy}}

### Social Media Policy
{{social_media_policy}}

## Benefits and Compensation

### Health Insurance
{{health_insurance}}

### Paid Time Off
{{pto_policy}}

### Professional Development
{{professional_development}}

## IT and Security Policies

### Acceptable Use Policy
{{acceptable_use}}

### Data Security Requirements
{{data_security}}

### Remote Work Guidelines
{{remote_work}}

---
*Last Updated: {{last_updated}}*
*Version: {{version}}*`,
        fields: [
          {
            id: 'company_name',
            name: 'company_name',
            label: 'Company Name',
            type: 'text',
            required: true,
            placeholder: 'Enter your company name'
          },
          {
            id: 'company_overview',
            name: 'company_overview',
            label: 'Company Overview',
            type: 'textarea',
            required: true,
            placeholder: 'Brief description of your company, mission, and values'
          },
          {
            id: 'equal_opportunity_policy',
            name: 'equal_opportunity_policy',
            label: 'Equal Opportunity Policy',
            type: 'textarea',
            required: true,
            placeholder: 'Your equal opportunity employment policy'
          },
          {
            id: 'attendance_policy',
            name: 'attendance_policy',
            label: 'Attendance Policy',
            type: 'textarea',
            required: true,
            placeholder: 'Work schedule and attendance requirements'
          },
          {
            id: 'last_updated',
            name: 'last_updated',
            label: 'Last Updated',
            type: 'date',
            required: true,
            defaultValue: new Date().toISOString().split('T')[0]
          },
          {
            id: 'version',
            name: 'version',
            label: 'Version',
            type: 'text',
            required: true,
            defaultValue: '1.0'
          }
        ],
        tags: ['hr', 'employee', 'handbook', 'policies'],
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        downloadCount: 0,
        version: '1.0',
        instructions: 'Use this template to create a comprehensive employee handbook. Fill in each section with your organization\'s specific policies and procedures.',
        examples: [
          'Startup companies creating their first handbook',
          'Established companies updating existing policies',
          'Remote-first organizations with distributed teams'
        ]
      },

      // Org Chart Templates
      {
        id: 'orgchart_csv_import',
        name: 'Organization Chart CSV Import Template',
        description: 'CSV template for importing organizational structure and employee data',
        category: 'orgchart',
        type: 'csv',
        content: `userId,name,email,title,department,level,reportsTo,location,timezone,startDate,skills,status
{{sample_data}}`,
        fields: [
          {
            id: 'sample_data',
            name: 'sample_data',
            label: 'Include Sample Data',
            type: 'boolean',
            required: false,
            defaultValue: true,
            description: 'Include sample employee data to help you understand the format'
          }
        ],
        tags: ['orgchart', 'csv', 'import', 'hr'],
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        downloadCount: 0,
        version: '1.0',
        instructions: 'Download this CSV template and fill in your organization\'s employee data. Each row represents one employee. Use the reportsTo field to establish reporting relationships.',
        examples: [
          'HR departments importing employee data',
          'New organizations setting up their first org chart',
          'Companies migrating from other HR systems'
        ]
      },

      // Knowledge Base Templates
      {
        id: 'kb_technical_docs',
        name: 'Technical Documentation Knowledge Base',
        description: 'Template for organizing technical documentation and API references',
        category: 'knowledge_base',
        type: 'json',
        content: JSON.stringify({
          name: '{{kb_name}}',
          description: '{{kb_description}}',
          categories: [
            'API Documentation',
            'System Architecture',
            'Deployment Guides',
            'Troubleshooting',
            'Best Practices'
          ],
          structure: {
            'API Documentation': {
              'Authentication': '{{auth_docs}}',
              'Endpoints': '{{endpoint_docs}}',
              'Examples': '{{api_examples}}'
            },
            'System Architecture': {
              'Overview': '{{architecture_overview}}',
              'Components': '{{system_components}}',
              'Data Flow': '{{data_flow}}'
            },
            'Deployment Guides': {
              'Development': '{{dev_deployment}}',
              'Staging': '{{staging_deployment}}',
              'Production': '{{prod_deployment}}'
            }
          },
          accessLevel: '{{access_level}}',
          tags: ['technical', 'documentation', 'api', 'system']
        }, null, 2),
        fields: [
          {
            id: 'kb_name',
            name: 'kb_name',
            label: 'Knowledge Base Name',
            type: 'text',
            required: true,
            defaultValue: 'Technical Documentation',
            placeholder: 'Enter knowledge base name'
          },
          {
            id: 'kb_description',
            name: 'kb_description',
            label: 'Description',
            type: 'textarea',
            required: true,
            defaultValue: 'Comprehensive technical documentation and API references',
            placeholder: 'Describe the knowledge base purpose'
          },
          {
            id: 'access_level',
            name: 'access_level',
            label: 'Access Level',
            type: 'select',
            required: true,
            defaultValue: 'internal',
            options: ['public', 'internal', 'confidential', 'restricted']
          }
        ],
        tags: ['technical', 'documentation', 'api', 'knowledge-base'],
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        downloadCount: 0,
        version: '1.0',
        instructions: 'Use this template to create a structured technical documentation knowledge base. Organize your API docs, system architecture, and deployment guides.',
        examples: [
          'Software development teams documenting APIs',
          'DevOps teams creating deployment guides',
          'Technical writers organizing system documentation'
        ]
      },

      // Compliance Templates
      {
        id: 'compliance_audit_checklist',
        name: 'Compliance Audit Checklist Template',
        description: 'Comprehensive checklist for compliance audits and assessments',
        category: 'compliance',
        type: 'markdown',
        content: `# {{audit_type}} Compliance Audit Checklist

**Organization:** {{organization_name}}  
**Audit Date:** {{audit_date}}  
**Auditor:** {{auditor_name}}  
**Scope:** {{audit_scope}}

## Pre-Audit Preparation

### Documentation Review
- [ ] Policy documents current and accessible
- [ ] Employee training records up to date
- [ ] Previous audit findings addressed
- [ ] Compliance metrics available

### System Access
- [ ] Audit trail systems accessible
- [ ] Log retention policies verified
- [ ] Access control systems reviewed
- [ ] Data backup procedures confirmed

## {{compliance_framework}} Requirements

### Data Protection
- [ ] {{data_protection_item_1}}
- [ ] {{data_protection_item_2}}
- [ ] {{data_protection_item_3}}

### Access Controls
- [ ] {{access_control_item_1}}
- [ ] {{access_control_item_2}}
- [ ] {{access_control_item_3}}

### Monitoring and Logging
- [ ] {{monitoring_item_1}}
- [ ] {{monitoring_item_2}}
- [ ] {{monitoring_item_3}}

## Risk Assessment

### High Risk Areas
{{high_risk_areas}}

### Medium Risk Areas
{{medium_risk_areas}}

### Low Risk Areas
{{low_risk_areas}}

## Findings and Recommendations

### Critical Issues
{{critical_issues}}

### Recommendations
{{recommendations}}

### Action Items
{{action_items}}

---
**Audit Completed:** {{completion_date}}  
**Next Review:** {{next_review_date}}`,
        fields: [
          {
            id: 'audit_type',
            name: 'audit_type',
            label: 'Audit Type',
            type: 'select',
            required: true,
            options: ['HIPAA', 'SOC2', 'GDPR', 'ISO 27001', 'PCI DSS', 'Custom'],
            placeholder: 'Select audit type'
          },
          {
            id: 'organization_name',
            name: 'organization_name',
            label: 'Organization Name',
            type: 'text',
            required: true,
            placeholder: 'Enter organization name'
          },
          {
            id: 'compliance_framework',
            name: 'compliance_framework',
            label: 'Compliance Framework',
            type: 'text',
            required: true,
            placeholder: 'e.g., HIPAA, SOC2, GDPR'
          },
          {
            id: 'audit_date',
            name: 'audit_date',
            label: 'Audit Date',
            type: 'date',
            required: true,
            defaultValue: new Date().toISOString().split('T')[0]
          }
        ],
        tags: ['compliance', 'audit', 'checklist', 'assessment'],
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        downloadCount: 0,
        version: '1.0',
        instructions: 'Use this template to conduct comprehensive compliance audits. Customize the checklist items based on your specific compliance requirements.',
        examples: [
          'Healthcare organizations conducting HIPAA audits',
          'SaaS companies preparing for SOC2 certification',
          'European companies ensuring GDPR compliance'
        ]
      }
    ];
  }

  /**
   * Customize template with user inputs
   */
  async customizeTemplate(
    templateId: string,
    customizations: Record<string, any>,
    userId: string,
    agentId?: string
  ): Promise<CustomizedTemplate> {
    try {
      console.log('🎨 Customizing template:', templateId);

      const templates = await this.getTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Generate content by replacing placeholders
      let generatedContent = template.content;
      
      // Handle special cases for sample data
      if (templateId === 'orgchart_csv_import' && customizations.sample_data) {
        const sampleData = `user001,John Smith,john.smith@company.com,CEO,Executive,1,,New York,EST,2020-01-15,"leadership,strategy",active
user002,Sarah Johnson,sarah.johnson@company.com,VP Engineering,Engineering,2,user001,San Francisco,PST,2020-03-01,"engineering,management",active
user003,Mike Chen,mike.chen@company.com,Senior Developer,Engineering,4,user002,San Francisco,PST,2021-06-15,"javascript,react,node",active
user004,Lisa Rodriguez,lisa.rodriguez@company.com,Marketing Director,Marketing,3,user001,Austin,CST,2020-08-10,"marketing,analytics",active`;
        generatedContent = generatedContent.replace('{{sample_data}}', sampleData);
      } else {
        // Replace all placeholders with customizations
        Object.entries(customizations).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          generatedContent = generatedContent.replace(new RegExp(placeholder, 'g'), value || '');
        });
      }

      const customizedTemplate: CustomizedTemplate = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateId,
        userId,
        agentId,
        name: `${template.name} - Customized`,
        customizations,
        generatedContent,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        useCount: 1
      };

      // Save customized template
      const storageKey = `${userId}_${customizedTemplate.id}`;
      await unifiedStorage.setItem(this.CUSTOM_TEMPLATES_PREFIX, storageKey, customizedTemplate);

      console.log('✅ Template customized successfully:', customizedTemplate);
      return customizedTemplate;

    } catch (error) {
      console.error('❌ Template customization failed:', error);
      throw error;
    }
  }

  /**
   * Download template as file
   */
  async downloadTemplate(templateId: string, customizations?: Record<string, any>): Promise<{
    filename: string;
    content: string;
    mimeType: string;
  }> {
    try {
      console.log('📥 Preparing template download:', templateId);

      const templates = await this.getTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      let content = template.content;
      
      // Apply customizations if provided
      if (customizations) {
        Object.entries(customizations).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          content = content.replace(new RegExp(placeholder, 'g'), value || '');
        });
      }

      // Determine file extension and MIME type
      const extensions = {
        csv: { ext: 'csv', mime: 'text/csv' },
        json: { ext: 'json', mime: 'application/json' },
        markdown: { ext: 'md', mime: 'text/markdown' },
        txt: { ext: 'txt', mime: 'text/plain' },
        pdf: { ext: 'pdf', mime: 'application/pdf' },
        docx: { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      };

      const fileInfo = extensions[template.type] || { ext: 'txt', mime: 'text/plain' };
      const filename = `${template.name.toLowerCase().replace(/\s+/g, '_')}.${fileInfo.ext}`;

      // Update download count
      template.downloadCount++;

      console.log('✅ Template prepared for download:', filename);
      return {
        filename,
        content,
        mimeType: fileInfo.mime
      };

    } catch (error) {
      console.error('❌ Template download preparation failed:', error);
      throw error;
    }
  }

  /**
   * Get user's customized templates
   */
  async getUserCustomizedTemplates(userId: string, agentId?: string): Promise<CustomizedTemplate[]> {
    try {
      const allCustomTemplates = await unifiedStorage.getAllItems(this.CUSTOM_TEMPLATES_PREFIX);
      
      let userTemplates = Object.entries(allCustomTemplates)
        .filter(([key, _]) => key.startsWith(`${userId}_`))
        .map(([_, template]) => template as CustomizedTemplate);

      // Filter by agent if specified
      if (agentId) {
        userTemplates = userTemplates.filter(template => 
          template.agentId === agentId || !template.agentId
        );
      }

      return userTemplates.sort((a, b) => 
        new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
      );

    } catch (error) {
      console.error('❌ Failed to get user customized templates:', error);
      return [];
    }
  }

  /**
   * Create policy from template
   */
  async createPolicyFromTemplate(
    templateId: string,
    customizations: Record<string, any>,
    userId: string,
    agentId: string
  ): Promise<CustomPolicy> {
    try {
      console.log('📋 Creating policy from template:', templateId);

      const customizedTemplate = await this.customizeTemplate(templateId, customizations, userId, agentId);
      
      // Parse the generated content as policy configuration
      const policyConfig = JSON.parse(customizedTemplate.generatedContent);
      
      // Create policy using custom policy service
      const policy = await customPolicyService.createPolicy(userId, agentId, {
        name: policyConfig.name,
        description: policyConfig.description,
        category: policyConfig.category,
        rules: policyConfig.rules,
        status: 'active',
        enforcementLevel: policyConfig.enforcementLevel,
        createdBy: userId,
        tags: policyConfig.tags || [],
        inheritFromDefaults: true,
        overrideDefaults: false
      });

      console.log('✅ Policy created from template:', policy);
      return policy;

    } catch (error) {
      console.error('❌ Failed to create policy from template:', error);
      throw error;
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(): Promise<{
    totalTemplates: number;
    downloadsByCategory: Record<string, number>;
    mostPopular: Template[];
    recentlyAdded: Template[];
  }> {
    try {
      const templates = await this.getTemplates();
      
      const downloadsByCategory = templates.reduce((acc, template) => {
        acc[template.category] = (acc[template.category] || 0) + template.downloadCount;
        return acc;
      }, {} as Record<string, number>);

      const mostPopular = templates
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 5);

      const recentlyAdded = templates
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      return {
        totalTemplates: templates.length,
        downloadsByCategory,
        mostPopular,
        recentlyAdded
      };

    } catch (error) {
      console.error('❌ Failed to get template stats:', error);
      return {
        totalTemplates: 0,
        downloadsByCategory: {},
        mostPopular: [],
        recentlyAdded: []
      };
    }
  }
}

export const templateService = new TemplateService();
export default templateService;

