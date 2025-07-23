/**
 * Create Boundary Wizard Component
 * 
 * A guided, step-by-step wizard for creating trust boundaries that makes
 * AI governance concepts accessible to investors and non-technical users.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  Shield, 
  Users, 
  Settings, 
  CheckCircle,
  Info,
  Lock,
  Handshake,
  Network,
  Building
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: string;
  trust_score?: number;
  capabilities?: string[];
}

interface CreateBoundaryWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (boundaryData: any) => void;
  agents: Agent[];
}

const WIZARD_STEPS = [
  {
    id: 'introduction',
    title: 'What are Trust Boundaries?',
    description: 'Learn how AI agents collaborate safely',
    icon: Info
  },
  {
    id: 'agents',
    title: 'Choose Your Agents',
    description: 'Select which agents will collaborate',
    icon: Users
  },
  {
    id: 'trust-level',
    title: 'Set Trust Level',
    description: 'Define collaboration permissions',
    icon: Shield
  },
  {
    id: 'boundary-type',
    title: 'Select Boundary Type',
    description: 'Choose the right architecture',
    icon: Network
  },
  {
    id: 'policies',
    title: 'Add Policies',
    description: 'Apply compliance and security rules',
    icon: Settings
  },
  {
    id: 'review',
    title: 'Review & Deploy',
    description: 'Confirm your trust boundary',
    icon: CheckCircle
  }
];

const BOUNDARY_TYPES = [
  {
    id: 'direct',
    name: 'Direct',
    description: 'Maximum security, minimal latency',
    security: 'High',
    complexity: 'Low',
    useCase: 'Simple automation, predictive analysis',
    color: 'bg-green-100 border-green-300 text-green-800'
  },
  {
    id: 'delegated',
    name: 'Delegated',
    description: 'Balanced security and flexibility',
    security: 'Medium',
    complexity: 'Medium',
    useCase: 'Collaboration, data sharing',
    color: 'bg-blue-100 border-blue-300 text-blue-800'
  },
  {
    id: 'transitive',
    name: 'Transitive',
    description: 'Extended trust networks',
    security: 'Low',
    complexity: 'Medium',
    useCase: 'Value chain, supply chain',
    color: 'bg-orange-100 border-orange-300 text-orange-800'
  },
  {
    id: 'federated',
    name: 'Federated',
    description: 'Cross-organizational collaboration',
    security: 'Medium',
    complexity: 'High',
    useCase: 'Cross-domain AI, industry consortium',
    color: 'bg-purple-100 border-purple-300 text-purple-800'
  }
];

const TRUST_LEVEL_DESCRIPTIONS = {
  0: { label: 'No Access', description: 'Agent cannot interact', permissions: [] },
  25: { label: 'Basic Access', description: 'Read-only operations', permissions: ['View data', 'Basic queries'] },
  50: { label: 'Standard Access', description: 'Standard operations', permissions: ['Data access', 'Operation execution'] },
  75: { label: 'High Access', description: 'Advanced collaboration', permissions: ['Cross-agent collaboration', 'Data sharing'] },
  100: { label: 'Full Access', description: 'Complete trust', permissions: ['All operations', 'Compliance reporting', 'Administrative access'] }
};

const POLICY_TEMPLATES = [
  {
    id: 'hipaa',
    name: 'HIPAA Compliance',
    description: 'Healthcare data protection',
    icon: '🏥',
    requirements: ['Data encryption', 'Access logging', 'Audit trails']
  },
  {
    id: 'sox',
    name: 'SOX Compliance',
    description: 'Financial reporting controls',
    icon: '💰',
    requirements: ['Financial controls', 'Change management', 'Documentation']
  },
  {
    id: 'gdpr',
    name: 'GDPR Compliance',
    description: 'EU data protection',
    icon: '🇪🇺',
    requirements: ['Data minimization', 'Consent management', 'Right to deletion']
  },
  {
    id: 'custom',
    name: 'Custom Policy',
    description: 'Define your own rules',
    icon: '⚙️',
    requirements: ['Custom rules', 'Flexible configuration']
  }
];

export const CreateBoundaryWizard: React.FC<CreateBoundaryWizardProps> = ({
  open,
  onClose,
  onSubmit,
  agents
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    sourceAgent: '',
    targetAgent: '',
    trustLevel: 80,
    boundaryType: 'direct',
    description: '',
    expiresAt: '',
    policies: [] as string[]
  });

  const currentStepData = WIZARD_STEPS[currentStep];
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Agents step
        return formData.sourceAgent && formData.targetAgent && formData.sourceAgent !== formData.targetAgent;
      case 2: // Trust level step
        return formData.trustLevel > 0;
      case 3: // Boundary type step
        return formData.boundaryType;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Introduction
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Network className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trust Boundaries Enable Safe AI Collaboration</h3>
              <p className="text-gray-600 mb-6">
                Think of trust boundaries as smart contracts for AI agents. They define how agents can safely work together while maintaining security and compliance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">Security</h4>
                  <p className="text-sm text-gray-600">Automatic enforcement of security rules</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Handshake className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium">Collaboration</h4>
                  <p className="text-sm text-gray-600">Enable safe agent-to-agent workflows</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Building className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium">Compliance</h4>
                  <p className="text-sm text-gray-600">Built-in regulatory compliance</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Real-World Example</h4>
              <p className="text-blue-800 text-sm">
                A healthcare AI agent (trust level 95%) can share patient data with a diagnostic AI agent (trust level 90%) 
                through a HIPAA-compliant trust boundary, ensuring secure collaboration while maintaining audit trails.
              </p>
            </div>
          </div>
        );

      case 1: // Choose Agents
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Select Collaboration Partners</h3>
              <p className="text-gray-600">Choose which AI agents will work together through this trust boundary.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="sourceAgent" className="text-base font-medium">Source Agent</Label>
                <p className="text-sm text-gray-600 mb-3">The agent that initiates collaboration</p>
                <Select value={formData.sourceAgent} onValueChange={(value) => setFormData({...formData, sourceAgent: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center space-x-2">
                          <span>{agent.name}</span>
                          {agent.trust_score && (
                            <Badge variant="secondary">{agent.trust_score}% trust</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="targetAgent" className="text-base font-medium">Target Agent</Label>
                <p className="text-sm text-gray-600 mb-3">The agent that receives collaboration requests</p>
                <Select value={formData.targetAgent} onValueChange={(value) => setFormData({...formData, targetAgent: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.filter(agent => agent.id !== formData.sourceAgent).map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center space-x-2">
                          <span>{agent.name}</span>
                          {agent.trust_score && (
                            <Badge variant="secondary">{agent.trust_score}% trust</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.sourceAgent && formData.targetAgent && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Agents Selected</span>
                  </div>
                  <p className="text-green-800 text-sm">
                    {agents.find(a => a.id === formData.sourceAgent)?.name} will collaborate with{' '}
                    {agents.find(a => a.id === formData.targetAgent)?.name} through this trust boundary.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2: // Trust Level
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Set Trust Level</h3>
              <p className="text-gray-600">Define what level of access and permissions these agents will have.</p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-base font-medium">Trust Level: {formData.trustLevel}%</Label>
                  <Badge variant="outline">
                    {TRUST_LEVEL_DESCRIPTIONS[Math.floor(formData.trustLevel / 25) * 25]?.label}
                  </Badge>
                </div>
                <Slider
                  value={[formData.trustLevel]}
                  onValueChange={(value) => setFormData({...formData, trustLevel: value[0]})}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {TRUST_LEVEL_DESCRIPTIONS[Math.floor(formData.trustLevel / 25) * 25]?.label}
                  </CardTitle>
                  <CardDescription>
                    {TRUST_LEVEL_DESCRIPTIONS[Math.floor(formData.trustLevel / 25) * 25]?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="font-medium mb-2">Permissions Granted:</h4>
                  <div className="space-y-1">
                    {TRUST_LEVEL_DESCRIPTIONS[Math.floor(formData.trustLevel / 25) * 25]?.permissions.map((permission, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{permission}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Real-World Analogy</h4>
                <p className="text-blue-800 text-sm">
                  Think of trust levels like security clearances or credit scores. Higher trust levels grant more capabilities and access to sensitive operations.
                </p>
              </div>
            </div>
          </div>
        );

      case 3: // Boundary Type
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Choose Boundary Architecture</h3>
              <p className="text-gray-600">Select the trust boundary type that best fits your use case.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BOUNDARY_TYPES.map((type) => (
                <Card 
                  key={type.id}
                  className={`cursor-pointer transition-all ${
                    formData.boundaryType === type.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setFormData({...formData, boundaryType: type.id})}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <Badge className={type.color}>{type.security} Security</Badge>
                    </div>
                    <CardDescription>{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Complexity:</span>
                        <span className="font-medium">{type.complexity}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Use Cases:</span>
                        <p className="text-gray-600">{type.useCase}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {formData.boundaryType && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">
                      {BOUNDARY_TYPES.find(t => t.id === formData.boundaryType)?.name} Selected
                    </span>
                  </div>
                  <p className="text-green-800 text-sm">
                    {BOUNDARY_TYPES.find(t => t.id === formData.boundaryType)?.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 4: // Policies
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Apply Compliance Policies</h3>
              <p className="text-gray-600">Add industry-specific compliance and security policies.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {POLICY_TEMPLATES.map((policy) => (
                <Card 
                  key={policy.id}
                  className={`cursor-pointer transition-all ${
                    formData.policies.includes(policy.id)
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => {
                    const newPolicies = formData.policies.includes(policy.id)
                      ? formData.policies.filter(p => p !== policy.id)
                      : [...formData.policies, policy.id];
                    setFormData({...formData, policies: newPolicies});
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{policy.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{policy.name}</CardTitle>
                        <CardDescription>{policy.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {policy.requirements.map((req, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          <span className="text-sm text-gray-600">{req}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Label htmlFor="description" className="text-base font-medium">Description (Optional)</Label>
              <p className="text-sm text-gray-600 mb-3">Add a description for this trust boundary</p>
              <Textarea
                id="description"
                placeholder="Describe the purpose and scope of this trust boundary..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="expiresAt" className="text-base font-medium">Expiration Date (Optional)</Label>
              <p className="text-sm text-gray-600 mb-3">Set when this trust boundary should expire</p>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
              />
            </div>
          </div>
        );

      case 5: // Review
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Review Your Trust Boundary</h3>
              <p className="text-gray-600">Confirm all settings before deploying your trust boundary.</p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Agent Collaboration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{agents.find(a => a.id === formData.sourceAgent)?.name}</p>
                      <p className="text-sm text-gray-600">Source Agent</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-0.5 bg-gray-300" />
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <div className="w-8 h-0.5 bg-gray-300" />
                    </div>
                    <div>
                      <p className="font-medium">{agents.find(a => a.id === formData.targetAgent)?.name}</p>
                      <p className="text-sm text-gray-600">Target Agent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Trust Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Trust Level:</span>
                        <Badge>{formData.trustLevel}%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Boundary Type:</span>
                        <Badge variant="outline">
                          {BOUNDARY_TYPES.find(t => t.id === formData.boundaryType)?.name}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Policies Applied</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {formData.policies.length > 0 ? (
                      <div className="space-y-1">
                        {formData.policies.map((policyId) => {
                          const policy = POLICY_TEMPLATES.find(p => p.id === policyId);
                          return (
                            <div key={policyId} className="flex items-center space-x-2">
                              <span>{policy?.icon}</span>
                              <span className="text-sm">{policy?.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No policies selected</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {formData.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{formData.description}</p>
                  </CardContent>
                </Card>
              )}

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Ready to Deploy</span>
                </div>
                <p className="text-green-800 text-sm">
                  Your trust boundary is configured and ready to enable secure collaboration between the selected agents.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <currentStepData.icon className="w-6 h-6 text-blue-600" />
              <div>
                <DialogTitle className="text-xl">{currentStepData.title}</DialogTitle>
                <DialogDescription>{currentStepData.description}</DialogDescription>
              </div>
            </div>
            <div className="flex-1" />
            <div className="text-sm text-gray-600">
              Step {currentStep + 1} of {WIZARD_STEPS.length}
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </DialogHeader>

        <div className="py-6">
          {renderStepContent()}
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            {currentStep === WIZARD_STEPS.length - 1 ? (
              <Button onClick={handleSubmit}>
                Create Boundary
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBoundaryWizard;

