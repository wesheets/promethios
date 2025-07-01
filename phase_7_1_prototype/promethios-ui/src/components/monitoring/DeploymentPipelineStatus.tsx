import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Package, 
  Rocket, 
  Shield, 
  Activity,
  RefreshCw,
  Info,
  ExternalLink,
  Download
} from 'lucide-react';

interface DeploymentStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  duration?: number;
  logs?: string[];
  artifacts?: string[];
}

interface DeploymentPipelineStatusProps {
  deploymentId: string;
  agentId: string;
  onStageClick?: (stage: DeploymentStage) => void;
  className?: string;
}

export const DeploymentPipelineStatus: React.FC<DeploymentPipelineStatusProps> = ({
  deploymentId,
  agentId,
  onStageClick,
  className = ''
}) => {
  const [stages, setStages] = useState<DeploymentStage[]>([
    {
      id: 'package',
      name: 'Package Creation',
      status: 'completed',
      startTime: new Date(Date.now() - 300000).toISOString(),
      endTime: new Date(Date.now() - 240000).toISOString(),
      duration: 60,
      artifacts: ['@promethios/agent-reporter']
    },
    {
      id: 'governance',
      name: 'Governance Setup',
      status: 'completed',
      startTime: new Date(Date.now() - 240000).toISOString(),
      endTime: new Date(Date.now() - 180000).toISOString(),
      duration: 60,
      artifacts: ['governance-config.json', 'policy-definitions.json']
    },
    {
      id: 'deployment',
      name: 'Agent Deployment',
      status: 'completed',
      startTime: new Date(Date.now() - 180000).toISOString(),
      endTime: new Date(Date.now() - 120000).toISOString(),
      duration: 60,
      artifacts: ['deployment-manifest.yaml']
    },
    {
      id: 'monitoring',
      name: 'Monitoring Setup',
      status: 'running',
      startTime: new Date(Date.now() - 120000).toISOString(),
      duration: 45
    },
    {
      id: 'validation',
      name: 'End-to-End Validation',
      status: 'pending'
    }
  ]);

  const [overallProgress, setOverallProgress] = useState(60);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-200 bg-green-50';
      case 'running': return 'border-blue-200 bg-blue-50';
      case 'failed': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const refreshPipelineStatus = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update progress for running stage
    setStages(prev => prev.map(stage => {
      if (stage.status === 'running' && stage.id === 'monitoring') {
        const newDuration = (stage.duration || 0) + 5;
        if (newDuration >= 60) {
          return {
            ...stage,
            status: 'completed',
            endTime: new Date().toISOString(),
            duration: 60
          };
        }
        return { ...stage, duration: newDuration };
      }
      return stage;
    }));

    // Update overall progress
    const completedStages = stages.filter(s => s.status === 'completed').length;
    const runningStages = stages.filter(s => s.status === 'running').length;
    const progress = (completedStages / stages.length) * 100 + (runningStages * 10);
    setOverallProgress(Math.min(progress, 100));

    setIsRefreshing(false);
  };

  useEffect(() => {
    const interval = setInterval(refreshPipelineStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const completedStages = stages.filter(s => s.status === 'completed').length;
  const totalStages = stages.length;

  return (
    <TooltipProvider>
      <Card className={`${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-600" />
              Deployment Pipeline
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Real-time deployment pipeline status with governance integration</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {completedStages}/{totalStages} Complete
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={refreshPipelineStatus}
                    disabled={isRefreshing}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh pipeline status</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-medium">{overallProgress.toFixed(0)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Pipeline Stages */}
          <div className="space-y-3">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-3">
                {/* Stage Icon */}
                <div className="flex-shrink-0">
                  {getStageIcon(stage.status)}
                </div>

                {/* Stage Details */}
                <div 
                  className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${getStageColor(stage.status)}`}
                  onClick={() => onStageClick?.(stage)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{stage.name}</span>
                      {stage.status === 'running' && (
                        <Badge variant="secondary" className="text-xs">
                          Running
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {stage.duration && (
                        <span>{formatDuration(stage.duration)}</span>
                      )}
                      {stage.artifacts && stage.artifacts.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Package className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-medium">Artifacts:</p>
                              {stage.artifacts.map(artifact => (
                                <p key={artifact} className="text-xs">{artifact}</p>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  {/* Stage Progress for Running */}
                  {stage.status === 'running' && stage.duration && (
                    <div className="mt-2">
                      <Progress 
                        value={(stage.duration / 60) * 100} 
                        className="h-1"
                      />
                    </div>
                  )}
                </div>

                {/* Arrow to Next Stage */}
                {index < stages.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Deployment Info */}
          <div className="pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Agent ID:</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-gray-600 font-mono text-xs">{agentId}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unique identifier for this deployed agent</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Deployment ID:</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-gray-600 font-mono text-xs">{deploymentId}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unique identifier for this deployment instance</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => window.open(`/monitoring/${agentId}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Live Monitoring
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                >
                  <Download className="h-3 w-3 mr-2" />
                  Download Logs
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Quick Actions</span>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Package className="h-3 w-3 mr-1" />
                      Export Config
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export deployment configuration for reuse</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Test Governance
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Run governance validation tests</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default DeploymentPipelineStatus;

