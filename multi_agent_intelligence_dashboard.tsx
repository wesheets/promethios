/**
 * Enhanced Veritas 2 - Multi-Agent Coordination & Emergent Intelligence Dashboard
 * 
 * Advanced dashboard for monitoring multi-agent networks, collective intelligence
 * emergence, distributed governance, and agent swarm coordination.
 * 
 * Features:
 * - Real-time agent network topology visualization
 * - Emergent intelligence detection and amplification monitoring
 * - Collective reasoning session tracking
 * - Agent team formation and performance analytics
 * - Distributed uncertainty resolution monitoring
 * - Swarm behavior pattern analysis
 */

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { 
  Network, 
  Brain, 
  Zap, 
  Users, 
  GitBranch,
  Target,
  TrendingUp,
  Activity,
  Layers,
  Shuffle,
  Eye,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Filter,
  Search,
  Download,
  Share2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
`;

const networkPulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(43, 255, 198, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(43, 255, 198, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(43, 255, 198, 0);
  }
`;

const emergentGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(139, 92, 246, 0.6);
  }
`;

const dataFlow = keyframes`
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
`;

// Styled Components
const DashboardContainer = styled.div`
  background: linear-gradient(135deg, #0D1117 0%, #161B22 100%);
  min-height: 100vh;
  padding: 24px;
  color: #FFFFFF;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  animation: ${fadeInUp} 0.6s ease-out;
`;

const HeaderTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #2BFFC6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderControls = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const NetworkStatus = styled.div<{ status: 'optimal' | 'active' | 'degraded' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'optimal': return 'rgba(34, 197, 94, 0.1)';
      case 'active': return 'rgba(59, 130, 246, 0.1)';
      case 'degraded': return 'rgba(239, 68, 68, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'optimal': return '#22C55E';
      case 'active': return '#3B82F6';
      case 'degraded': return '#EF4444';
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'optimal': return 'rgba(34, 197, 94, 0.3)';
      case 'active': return 'rgba(59, 130, 246, 0.3)';
      case 'degraded': return 'rgba(239, 68, 68, 0.3)';
    }
  }};
`;

const StatusDot = styled.div<{ status: 'optimal' | 'active' | 'degraded' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'optimal': return '#22C55E';
      case 'active': return '#3B82F6';
      case 'degraded': return '#EF4444';
    }
  }};
  animation: ${props => props.status === 'optimal' ? css`${pulse} 2s infinite` : 'none'};
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
`;

const NetworkVisualizationPanel = styled.div`
  background: rgba(26, 34, 51, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(43, 255, 198, 0.1);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  animation: ${fadeInUp} 0.6s ease-out 0.1s both;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const PanelTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PanelControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ControlButton = styled.button<{ active?: boolean }>`
  background: ${props => props.active ? 'rgba(43, 255, 198, 0.1)' : 'transparent'};
  color: ${props => props.active ? '#2BFFC6' : '#9CA3AF'};
  border: 1px solid ${props => props.active ? '#2BFFC6' : 'rgba(156, 163, 175, 0.3)'};
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(43, 255, 198, 0.05);
    color: #2BFFC6;
  }
`;

const NetworkCanvas = styled.div`
  height: 400px;
  background: rgba(17, 24, 39, 0.4);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(43, 255, 198, 0.1);
`;

const NetworkPlaceholder = styled.div`
  color: #9CA3AF;
  font-size: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const EmergentIntelligencePanel = styled.div`
  background: rgba(26, 34, 51, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  animation: ${fadeInUp} 0.6s ease-out 0.2s both;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, transparent 50%);
    border-radius: 16px;
    pointer-events: none;
  }
`;

const EmergenceIndicator = styled.div<{ level: 'low' | 'medium' | 'high' | 'breakthrough' }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: ${props => {
    switch (props.level) {
      case 'low': return 'rgba(156, 163, 175, 0.1)';
      case 'medium': return 'rgba(59, 130, 246, 0.1)';
      case 'high': return 'rgba(139, 92, 246, 0.1)';
      case 'breakthrough': return 'rgba(236, 72, 153, 0.1)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.level) {
      case 'low': return 'rgba(156, 163, 175, 0.3)';
      case 'medium': return 'rgba(59, 130, 246, 0.3)';
      case 'high': return 'rgba(139, 92, 246, 0.3)';
      case 'breakthrough': return 'rgba(236, 72, 153, 0.3)';
    }
  }};
  border-radius: 12px;
  margin-bottom: 16px;
  animation: ${props => props.level === 'breakthrough' ? css`${emergentGlow} 2s infinite` : 'none'};
`;

const EmergenceIcon = styled.div<{ level: 'low' | 'medium' | 'high' | 'breakthrough' }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => {
    switch (props.level) {
      case 'low': return 'linear-gradient(135deg, #9CA3AF20, #9CA3AF10)';
      case 'medium': return 'linear-gradient(135deg, #3B82F620, #3B82F610)';
      case 'high': return 'linear-gradient(135deg, #8B5CF620, #8B5CF610)';
      case 'breakthrough': return 'linear-gradient(135deg, #EC489320, #EC489310)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => {
    switch (props.level) {
      case 'low': return '#9CA3AF';
      case 'medium': return '#3B82F6';
      case 'high': return '#8B5CF6';
      case 'breakthrough': return '#EC4899';
    }
  }};
`;

const EmergenceInfo = styled.div`
  flex: 1;
`;

const EmergenceTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  margin-bottom: 4px;
`;

const EmergenceDescription = styled.div`
  font-size: 14px;
  color: #9CA3AF;
  line-height: 1.4;
`;

const EmergenceMetric = styled.div`
  text-align: right;
`;

const EmergenceValue = styled.div<{ level: 'low' | 'medium' | 'high' | 'breakthrough' }>`
  font-size: 20px;
  font-weight: 700;
  color: ${props => {
    switch (props.level) {
      case 'low': return '#9CA3AF';
      case 'medium': return '#3B82F6';
      case 'high': return '#8B5CF6';
      case 'breakthrough': return '#EC4899';
    }
  }};
`;

const EmergenceLabel = styled.div`
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 2px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const MetricCard = styled.div<{ delay?: number; accent?: string }>`
  background: rgba(26, 34, 51, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.accent ? `${props.accent}20` : 'rgba(43, 255, 198, 0.1)'};
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: ${fadeInUp} 0.6s ease-out ${props => props.delay || 0}s both;
  
  &:hover {
    transform: translateY(-4px);
    border-color: ${props => props.accent ? `${props.accent}40` : 'rgba(43, 255, 198, 0.3)'};
    box-shadow: 0 20px 40px ${props => props.accent ? `${props.accent}10` : 'rgba(43, 255, 198, 0.1)'};
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const MetricIcon = styled.div<{ color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => `linear-gradient(135deg, ${props.color}20, ${props.color}10)`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
`;

const MetricTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #E5E7EB;
  margin: 0;
  flex: 1;
  margin-left: 16px;
`;

const MetricValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 8px;
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const MetricUnit = styled.span`
  font-size: 16px;
  font-weight: 400;
  color: #9CA3AF;
`;

const MetricTrend = styled.div<{ trend: 'up' | 'down' | 'stable' }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: ${props => {
    switch (props.trend) {
      case 'up': return '#22C55E';
      case 'down': return '#EF4444';
      case 'stable': return '#9CA3AF';
    }
  }};
`;

const AgentTeamsPanel = styled.div`
  background: rgba(26, 34, 51, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(43, 255, 198, 0.1);
  border-radius: 16px;
  padding: 24px;
  animation: ${fadeInUp} 0.6s ease-out 0.4s both;
`;

const TeamsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TeamItem = styled.div<{ status: 'active' | 'forming' | 'completed' }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(17, 24, 39, 0.6);
  border: 1px solid ${props => {
    switch (props.status) {
      case 'active': return 'rgba(34, 197, 94, 0.3)';
      case 'forming': return 'rgba(251, 191, 36, 0.3)';
      case 'completed': return 'rgba(59, 130, 246, 0.3)';
    }
  }};
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(17, 24, 39, 0.8);
    transform: translateX(4px);
  }
`;

const TeamStatus = styled.div<{ status: 'active' | 'forming' | 'completed' }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'active': return '#22C55E';
      case 'forming': return '#FBB936';
      case 'completed': return '#3B82F6';
    }
  }};
  animation: ${props => props.status === 'active' ? css`${networkPulse} 2s infinite` : 'none'};
`;

const TeamInfo = styled.div`
  flex: 1;
`;

const TeamTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #FFFFFF;
  margin-bottom: 4px;
`;

const TeamDetails = styled.div`
  font-size: 14px;
  color: #9CA3AF;
  display: flex;
  gap: 16px;
`;

const TeamMetrics = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
`;

const TeamMetric = styled.div`
  text-align: center;
`;

const TeamMetricValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #2BFFC6;
`;

const TeamMetricLabel = styled.div`
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 2px;
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #2BFFC6 0%, #00D4AA 100%);
  color: #0D1117;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(43, 255, 198, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// Types
interface AgentTeam {
  id: string;
  name: string;
  status: 'active' | 'forming' | 'completed';
  agents: number;
  specialization: string;
  performance: number;
  emergenceLevel: number;
  duration: string;
}

interface EmergentBehavior {
  id: string;
  title: string;
  description: string;
  level: 'low' | 'medium' | 'high' | 'breakthrough';
  confidence: number;
  impact: string;
}

// Component
export const MultiAgentIntelligenceDashboard: React.FC = () => {
  const [networkStatus, setNetworkStatus] = useState<'optimal' | 'active' | 'degraded'>('optimal');
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedView, setSelectedView] = useState<'topology' | 'flow' | 'clusters'>('topology');

  const [teams] = useState<AgentTeam[]>([
    {
      id: '1',
      name: 'Technical Architecture Team',
      status: 'active',
      agents: 5,
      specialization: 'System Design',
      performance: 94,
      emergenceLevel: 87,
      duration: '23m'
    },
    {
      id: '2',
      name: 'Compliance Analysis Swarm',
      status: 'active',
      agents: 3,
      specialization: 'Regulatory',
      performance: 91,
      emergenceLevel: 76,
      duration: '18m'
    },
    {
      id: '3',
      name: 'Creative Innovation Cluster',
      status: 'forming',
      agents: 4,
      specialization: 'Innovation',
      performance: 0,
      emergenceLevel: 0,
      duration: '2m'
    }
  ]);

  const [emergentBehaviors] = useState<EmergentBehavior[]>([
    {
      id: '1',
      title: 'Novel Solution Synthesis',
      description: 'Agents discovered unexpected connection between compliance and performance optimization',
      level: 'breakthrough',
      confidence: 96,
      impact: 'High'
    },
    {
      id: '2',
      title: 'Collaborative Pattern Recognition',
      description: 'Emergent pattern detection across multiple problem domains',
      level: 'high',
      confidence: 84,
      impact: 'Medium'
    },
    {
      id: '3',
      title: 'Distributed Reasoning Chain',
      description: 'Self-organizing reasoning chains for complex problem solving',
      level: 'medium',
      confidence: 72,
      impact: 'Medium'
    }
  ]);

  return (
    <DashboardContainer>
      <DashboardHeader>
        <HeaderTitle>
          <Network size={32} />
          Multi-Agent Intelligence Monitor
        </HeaderTitle>
        <HeaderControls>
          <NetworkStatus status={networkStatus}>
            <StatusDot status={networkStatus} />
            Network {networkStatus === 'optimal' ? 'Optimal' : 
                    networkStatus === 'active' ? 'Active' : 'Degraded'}
          </NetworkStatus>
          <ActionButton>
            <Eye size={16} />
            Deep Analysis
          </ActionButton>
        </HeaderControls>
      </DashboardHeader>

      <MainGrid>
        <NetworkVisualizationPanel>
          <PanelHeader>
            <PanelTitle>
              <GitBranch size={20} />
              Agent Network Topology
            </PanelTitle>
            <PanelControls>
              <ControlButton 
                active={selectedView === 'topology'} 
                onClick={() => setSelectedView('topology')}
                title="Network Topology"
              >
                <Network size={16} />
              </ControlButton>
              <ControlButton 
                active={selectedView === 'flow'} 
                onClick={() => setSelectedView('flow')}
                title="Data Flow"
              >
                <Activity size={16} />
              </ControlButton>
              <ControlButton 
                active={selectedView === 'clusters'} 
                onClick={() => setSelectedView('clusters')}
                title="Agent Clusters"
              >
                <Layers size={16} />
              </ControlButton>
              <ControlButton 
                active={isPlaying} 
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </ControlButton>
              <ControlButton title="Reset View">
                <RotateCcw size={16} />
              </ControlButton>
              <ControlButton title="Fullscreen">
                <Maximize2 size={16} />
              </ControlButton>
            </PanelControls>
          </PanelHeader>
          <NetworkCanvas>
            <NetworkPlaceholder>
              <Network size={48} color="#9CA3AF" />
              <div>Interactive Network Visualization</div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>
                Real-time agent topology, connections, and data flow
              </div>
            </NetworkPlaceholder>
          </NetworkCanvas>
        </NetworkVisualizationPanel>

        <EmergentIntelligencePanel>
          <PanelHeader>
            <PanelTitle>
              <Sparkles size={20} />
              Emergent Intelligence
            </PanelTitle>
          </PanelHeader>
          
          {emergentBehaviors.map(behavior => (
            <EmergenceIndicator key={behavior.id} level={behavior.level}>
              <EmergenceIcon level={behavior.level}>
                <Brain size={20} />
              </EmergenceIcon>
              <EmergenceInfo>
                <EmergenceTitle>{behavior.title}</EmergenceTitle>
                <EmergenceDescription>{behavior.description}</EmergenceDescription>
              </EmergenceInfo>
              <EmergenceMetric>
                <EmergenceValue level={behavior.level}>{behavior.confidence}%</EmergenceValue>
                <EmergenceLabel>Confidence</EmergenceLabel>
              </EmergenceMetric>
            </EmergenceIndicator>
          ))}
        </EmergentIntelligencePanel>
      </MainGrid>

      <MetricsGrid>
        <MetricCard delay={0.1} accent="#2BFFC6">
          <MetricHeader>
            <MetricIcon color="#2BFFC6">
              <Users size={24} />
            </MetricIcon>
            <MetricTitle>Active Agent Teams</MetricTitle>
          </MetricHeader>
          <MetricValue>
            12
            <MetricUnit>teams</MetricUnit>
          </MetricValue>
          <MetricTrend trend="up">
            <TrendingUp size={16} />
            +3 from last hour
          </MetricTrend>
        </MetricCard>

        <MetricCard delay={0.2} accent="#8B5CF6">
          <MetricHeader>
            <MetricIcon color="#8B5CF6">
              <Zap size={24} />
            </MetricIcon>
            <MetricTitle>Collective Intelligence Score</MetricTitle>
          </MetricHeader>
          <MetricValue>
            87.3
            <MetricUnit>%</MetricUnit>
          </MetricValue>
          <MetricTrend trend="up">
            <TrendingUp size={16} />
            +5.2% from yesterday
          </MetricTrend>
        </MetricCard>

        <MetricCard delay={0.3} accent="#3B82F6">
          <MetricHeader>
            <MetricIcon color="#3B82F6">
              <Target size={24} />
            </MetricIcon>
            <MetricTitle>Emergence Detection Rate</MetricTitle>
          </MetricHeader>
          <MetricValue>
            94.7
            <MetricUnit>%</MetricUnit>
          </MetricValue>
          <MetricTrend trend="up">
            <TrendingUp size={16} />
            +2.1% from last week
          </MetricTrend>
        </MetricCard>

        <MetricCard delay={0.4} accent="#F59E0B">
          <MetricHeader>
            <MetricIcon color="#F59E0B">
              <Clock size={24} />
            </MetricIcon>
            <MetricTitle>Average Team Formation</MetricTitle>
          </MetricHeader>
          <MetricValue>
            2.4
            <MetricUnit>min</MetricUnit>
          </MetricValue>
          <MetricTrend trend="down">
            <TrendingUp size={16} style={{ transform: 'rotate(180deg)' }} />
            -0.8min from last week
          </MetricTrend>
        </MetricCard>
      </MetricsGrid>

      <AgentTeamsPanel>
        <PanelHeader>
          <PanelTitle>
            <Shuffle size={20} />
            Active Agent Teams
          </PanelTitle>
          <PanelControls>
            <ControlButton title="Filter Teams">
              <Filter size={16} />
            </ControlButton>
            <ControlButton title="Search Teams">
              <Search size={16} />
            </ControlButton>
            <ControlButton title="Export Data">
              <Download size={16} />
            </ControlButton>
          </PanelControls>
        </PanelHeader>

        <TeamsList>
          {teams.map(team => (
            <TeamItem key={team.id} status={team.status}>
              <TeamStatus status={team.status} />
              <TeamInfo>
                <TeamTitle>{team.name}</TeamTitle>
                <TeamDetails>
                  <span>{team.agents} agents</span>
                  <span>{team.specialization}</span>
                  <span>Duration: {team.duration}</span>
                </TeamDetails>
              </TeamInfo>
              <TeamMetrics>
                <TeamMetric>
                  <TeamMetricValue>{team.performance}%</TeamMetricValue>
                  <TeamMetricLabel>Performance</TeamMetricLabel>
                </TeamMetric>
                <TeamMetric>
                  <TeamMetricValue>{team.emergenceLevel}%</TeamMetricValue>
                  <TeamMetricLabel>Emergence</TeamMetricLabel>
                </TeamMetric>
              </TeamMetrics>
            </TeamItem>
          ))}
        </TeamsList>
      </AgentTeamsPanel>
    </DashboardContainer>
  );
};

export default MultiAgentIntelligenceDashboard;

