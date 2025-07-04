/**
 * Enhanced Veritas 2 - Quantum Uncertainty & Temporal Reasoning Dashboard
 * 
 * Advanced dashboard for monitoring quantum-inspired uncertainty modeling,
 * temporal reasoning systems, and multidimensional decision-making processes.
 * 
 * Features:
 * - Quantum uncertainty state visualization
 * - Temporal reasoning timeline analysis
 * - Multidimensional uncertainty mapping
 * - Decision path optimization monitoring
 * - Quantum entanglement correlation tracking
 * - Temporal prediction accuracy metrics
 */

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { 
  Atom, 
  Clock, 
  TrendingUp, 
  Layers, 
  Zap,
  Target,
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  GitBranch,
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
  AlertTriangle,
  CheckCircle2,
  Brain,
  Sparkles,
  Compass,
  Timer,
  Gauge
} from 'lucide-react';

// Animations
const quantumPulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  25% {
    opacity: 0.8;
    transform: scale(1.1) rotate(90deg);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2) rotate(180deg);
  }
  75% {
    opacity: 0.8;
    transform: scale(1.1) rotate(270deg);
  }
`;

const temporalFlow = keyframes`
  0% {
    transform: translateX(-100%) scaleX(0);
    opacity: 0;
  }
  50% {
    opacity: 1;
    transform: translateX(0%) scaleX(1);
  }
  100% {
    transform: translateX(100%) scaleX(0);
    opacity: 0;
  }
`;

const uncertaintyWave = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const entanglementGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(236, 72, 153, 0.3);
    border-color: rgba(236, 72, 153, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(236, 72, 153, 0.6);
    border-color: rgba(236, 72, 153, 0.6);
  }
`;

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

// Styled Components
const DashboardContainer = styled.div`
  background: linear-gradient(135deg, #0D1117 0%, #161B22 100%);
  min-height: 100vh;
  padding: 24px;
  color: #FFFFFF;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
`;

const DashboardContent = styled.div`
  position: relative;
  z-index: 1;
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
  background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 50%, #2BFFC6 100%);
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

const QuantumStatus = styled.div<{ state: 'coherent' | 'superposition' | 'entangled' | 'collapsed' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: ${props => {
    switch (props.state) {
      case 'coherent': return 'rgba(34, 197, 94, 0.1)';
      case 'superposition': return 'rgba(139, 92, 246, 0.1)';
      case 'entangled': return 'rgba(236, 72, 153, 0.1)';
      case 'collapsed': return 'rgba(239, 68, 68, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.state) {
      case 'coherent': return '#22C55E';
      case 'superposition': return '#8B5CF6';
      case 'entangled': return '#EC4899';
      case 'collapsed': return '#EF4444';
    }
  }};
  border: 1px solid ${props => {
    switch (props.state) {
      case 'coherent': return 'rgba(34, 197, 94, 0.3)';
      case 'superposition': return 'rgba(139, 92, 246, 0.3)';
      case 'entangled': return 'rgba(236, 72, 153, 0.3)';
      case 'collapsed': return 'rgba(239, 68, 68, 0.3)';
    }
  }};
  animation: ${props => props.state === 'entangled' ? css`${entanglementGlow} 2s infinite` : 'none'};
`;

const StatusDot = styled.div<{ state: 'coherent' | 'superposition' | 'entangled' | 'collapsed' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.state) {
      case 'coherent': return '#22C55E';
      case 'superposition': return '#8B5CF6';
      case 'entangled': return '#EC4899';
      case 'collapsed': return '#EF4444';
    }
  }};
  animation: ${props => props.state === 'superposition' ? css`${quantumPulse} 3s infinite` : 'none'};
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
`;

const QuantumStatePanel = styled.div`
  background: rgba(26, 34, 51, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(236, 72, 153, 0.2);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  animation: ${fadeInUp} 0.6s ease-out 0.1s both;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, transparent 50%);
    border-radius: 16px;
    pointer-events: none;
  }
`;

const TemporalReasoningPanel = styled.div`
  background: rgba(26, 34, 51, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  animation: ${fadeInUp} 0.6s ease-out 0.2s both;
  
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

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
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

const QuantumVisualization = styled.div`
  height: 300px;
  background: rgba(17, 24, 39, 0.4);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(236, 72, 153, 0.1);
`;

const TemporalTimeline = styled.div`
  height: 300px;
  background: rgba(17, 24, 39, 0.4);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(139, 92, 246, 0.1);
`;

const VisualizationPlaceholder = styled.div`
  color: #9CA3AF;
  font-size: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const UncertaintyMetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: ${props => props.accent ? `radial-gradient(circle, ${props.accent}10, transparent)` : 'none'};
    border-radius: 50%;
    transform: translate(50%, -50%);
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
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
  animation: ${uncertaintyWave} 3s ease-in-out infinite;
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
  position: relative;
  z-index: 1;
`;

const MetricUnit = styled.span`
  font-size: 16px;
  font-weight: 400;
  color: #9CA3AF;
`;

const MetricTrend = styled.div<{ trend: 'up' | 'down' | 'stable' | 'quantum' }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: ${props => {
    switch (props.trend) {
      case 'up': return '#22C55E';
      case 'down': return '#EF4444';
      case 'stable': return '#9CA3AF';
      case 'quantum': return '#EC4899';
    }
  }};
  position: relative;
  z-index: 1;
`;

const MetricDescription = styled.p`
  font-size: 14px;
  color: #9CA3AF;
  margin: 0;
  line-height: 1.5;
  position: relative;
  z-index: 1;
`;

const UncertaintyDimensionsPanel = styled.div`
  background: rgba(26, 34, 51, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(43, 255, 198, 0.1);
  border-radius: 16px;
  padding: 24px;
  animation: ${fadeInUp} 0.6s ease-out 0.4s both;
`;

const DimensionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DimensionItem = styled.div<{ confidence: number }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(17, 24, 39, 0.6);
  border: 1px solid rgba(43, 255, 198, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: rgba(17, 24, 39, 0.8);
    transform: translateX(4px);
    border-color: rgba(43, 255, 198, 0.3);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: ${props => props.confidence}%;
    background: linear-gradient(90deg, rgba(43, 255, 198, 0.1), transparent);
    transition: width 0.3s ease;
  }
`;

const DimensionIcon = styled.div<{ type: 'epistemic' | 'aleatoric' | 'temporal' | 'quantum' }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => {
    switch (props.type) {
      case 'epistemic': return 'linear-gradient(135deg, #3B82F620, #3B82F610)';
      case 'aleatoric': return 'linear-gradient(135deg, #F59E0B20, #F59E0B10)';
      case 'temporal': return 'linear-gradient(135deg, #8B5CF620, #8B5CF610)';
      case 'quantum': return 'linear-gradient(135deg, #EC489320, #EC489310)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => {
    switch (props.type) {
      case 'epistemic': return '#3B82F6';
      case 'aleatoric': return '#F59E0B';
      case 'temporal': return '#8B5CF6';
      case 'quantum': return '#EC4899';
    }
  }};
  position: relative;
  z-index: 1;
`;

const DimensionInfo = styled.div`
  flex: 1;
  position: relative;
  z-index: 1;
`;

const DimensionTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #FFFFFF;
  margin-bottom: 4px;
`;

const DimensionDescription = styled.div`
  font-size: 14px;
  color: #9CA3AF;
`;

const DimensionMetrics = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
  position: relative;
  z-index: 1;
`;

const DimensionMetric = styled.div`
  text-align: center;
`;

const DimensionMetricValue = styled.div<{ type: 'epistemic' | 'aleatoric' | 'temporal' | 'quantum' }>`
  font-size: 18px;
  font-weight: 600;
  color: ${props => {
    switch (props.type) {
      case 'epistemic': return '#3B82F6';
      case 'aleatoric': return '#F59E0B';
      case 'temporal': return '#8B5CF6';
      case 'quantum': return '#EC4899';
    }
  }};
`;

const DimensionMetricLabel = styled.div`
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
interface UncertaintyDimension {
  id: string;
  name: string;
  description: string;
  type: 'epistemic' | 'aleatoric' | 'temporal' | 'quantum';
  confidence: number;
  uncertainty: number;
  impact: string;
}

// Component
export const QuantumUncertaintyDashboard: React.FC = () => {
  const [quantumState, setQuantumState] = useState<'coherent' | 'superposition' | 'entangled' | 'collapsed'>('superposition');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [selectedDimension, setSelectedDimension] = useState<string>('all');

  const [uncertaintyDimensions] = useState<UncertaintyDimension[]>([
    {
      id: '1',
      name: 'Epistemic Uncertainty',
      description: 'Knowledge-based uncertainty from incomplete information',
      type: 'epistemic',
      confidence: 78,
      uncertainty: 22,
      impact: 'High'
    },
    {
      id: '2',
      name: 'Aleatoric Uncertainty',
      description: 'Inherent randomness in the data or process',
      type: 'aleatoric',
      confidence: 85,
      uncertainty: 15,
      impact: 'Medium'
    },
    {
      id: '3',
      name: 'Temporal Uncertainty',
      description: 'Time-dependent uncertainty and prediction decay',
      type: 'temporal',
      confidence: 72,
      uncertainty: 28,
      impact: 'High'
    },
    {
      id: '4',
      name: 'Quantum Uncertainty',
      description: 'Superposition states and measurement uncertainty',
      type: 'quantum',
      confidence: 94,
      uncertainty: 6,
      impact: 'Critical'
    }
  ]);

  return (
    <DashboardContainer>
      <DashboardContent>
        <DashboardHeader>
          <HeaderTitle>
            <Atom size={32} />
            Quantum Uncertainty Monitor
          </HeaderTitle>
          <HeaderControls>
            <QuantumStatus state={quantumState}>
              <StatusDot state={quantumState} />
              {quantumState === 'coherent' ? 'Coherent State' : 
               quantumState === 'superposition' ? 'Superposition' :
               quantumState === 'entangled' ? 'Entangled' : 'Collapsed'}
            </QuantumStatus>
            <ActionButton>
              <Eye size={16} />
              Quantum Analysis
            </ActionButton>
          </HeaderControls>
        </DashboardHeader>

        <MainGrid>
          <QuantumStatePanel>
            <PanelHeader>
              <PanelTitle>
                <Sparkles size={20} />
                Quantum State Visualization
              </PanelTitle>
              <PanelControls>
                <ControlButton title="Real-time Mode">
                  <Activity size={16} />
                </ControlButton>
                <ControlButton title="Pause Monitoring">
                  <Pause size={16} />
                </ControlButton>
                <ControlButton title="Reset State">
                  <RotateCcw size={16} />
                </ControlButton>
              </PanelControls>
            </PanelHeader>
            <QuantumVisualization>
              <VisualizationPlaceholder>
                <Atom size={48} color="#EC4899" />
                <div>Quantum State Visualization</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>
                  Real-time quantum uncertainty states and superposition monitoring
                </div>
              </VisualizationPlaceholder>
            </QuantumVisualization>
          </QuantumStatePanel>

          <TemporalReasoningPanel>
            <PanelHeader>
              <PanelTitle>
                <Clock size={20} />
                Temporal Reasoning Timeline
              </PanelTitle>
              <PanelControls>
                <ControlButton title="Timeline View">
                  <LineChart size={16} />
                </ControlButton>
                <ControlButton title="Prediction Mode">
                  <TrendingUp size={16} />
                </ControlButton>
                <ControlButton title="Export Timeline">
                  <Download size={16} />
                </ControlButton>
              </PanelControls>
            </PanelHeader>
            <TemporalTimeline>
              <VisualizationPlaceholder>
                <Timer size={48} color="#8B5CF6" />
                <div>Temporal Reasoning Analysis</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>
                  Time-based uncertainty evolution and prediction accuracy
                </div>
              </VisualizationPlaceholder>
            </TemporalTimeline>
          </TemporalReasoningPanel>
        </MainGrid>

        <UncertaintyMetricsGrid>
          <MetricCard delay={0.1} accent="#EC4899">
            <MetricHeader>
              <MetricIcon color="#EC4899">
                <Atom size={24} />
              </MetricIcon>
              <MetricTitle>Quantum Coherence</MetricTitle>
            </MetricHeader>
            <MetricValue>
              94.7
              <MetricUnit>%</MetricUnit>
            </MetricValue>
            <MetricTrend trend="quantum">
              <Sparkles size={16} />
              Superposition maintained
            </MetricTrend>
            <MetricDescription>
              Quantum state coherence and superposition stability
            </MetricDescription>
          </MetricCard>

          <MetricCard delay={0.2} accent="#8B5CF6">
            <MetricHeader>
              <MetricIcon color="#8B5CF6">
                <Clock size={24} />
              </MetricIcon>
              <MetricTitle>Temporal Prediction Accuracy</MetricTitle>
            </MetricHeader>
            <MetricValue>
              87.3
              <MetricUnit>%</MetricUnit>
            </MetricValue>
            <MetricTrend trend="up">
              <TrendingUp size={16} />
              +3.2% from last hour
            </MetricTrend>
            <MetricDescription>
              Accuracy of temporal reasoning and future state prediction
            </MetricDescription>
          </MetricCard>

          <MetricCard delay={0.3} accent="#3B82F6">
            <MetricHeader>
              <MetricIcon color="#3B82F6">
                <Layers size={24} />
              </MetricIcon>
              <MetricTitle>Multidimensional Synthesis</MetricTitle>
            </MetricHeader>
            <MetricValue>
              91.8
              <MetricUnit>%</MetricUnit>
            </MetricValue>
            <MetricTrend trend="up">
              <TrendingUp size={16} />
              +2.1% from yesterday
            </MetricTrend>
            <MetricDescription>
              Effectiveness of multidimensional uncertainty integration
            </MetricDescription>
          </MetricCard>

          <MetricCard delay={0.4} accent="#F59E0B">
            <MetricHeader>
              <MetricIcon color="#F59E0B">
                <Target size={24} />
              </MetricIcon>
              <MetricTitle>Decision Optimization</MetricTitle>
            </MetricHeader>
            <MetricValue>
              96.2
              <MetricUnit>%</MetricUnit>
            </MetricValue>
            <MetricTrend trend="up">
              <TrendingUp size={16} />
              +1.8% from last week
            </MetricTrend>
            <MetricDescription>
              Optimal decision timing and path selection accuracy
            </MetricDescription>
          </MetricCard>
        </UncertaintyMetricsGrid>

        <UncertaintyDimensionsPanel>
          <PanelHeader>
            <PanelTitle>
              <Compass size={20} />
              Uncertainty Dimensions Analysis
            </PanelTitle>
            <PanelControls>
              <ControlButton title="Filter Dimensions">
                <Filter size={16} />
              </ControlButton>
              <ControlButton title="Search Dimensions">
                <Search size={16} />
              </ControlButton>
              <ControlButton title="Export Analysis">
                <Download size={16} />
              </ControlButton>
            </PanelControls>
          </PanelHeader>

          <DimensionsList>
            {uncertaintyDimensions.map(dimension => (
              <DimensionItem key={dimension.id} confidence={dimension.confidence}>
                <DimensionIcon type={dimension.type}>
                  {dimension.type === 'epistemic' && <Brain size={20} />}
                  {dimension.type === 'aleatoric' && <Shuffle size={20} />}
                  {dimension.type === 'temporal' && <Clock size={20} />}
                  {dimension.type === 'quantum' && <Atom size={20} />}
                </DimensionIcon>
                <DimensionInfo>
                  <DimensionTitle>{dimension.name}</DimensionTitle>
                  <DimensionDescription>{dimension.description}</DimensionDescription>
                </DimensionInfo>
                <DimensionMetrics>
                  <DimensionMetric>
                    <DimensionMetricValue type={dimension.type}>
                      {dimension.confidence}%
                    </DimensionMetricValue>
                    <DimensionMetricLabel>Confidence</DimensionMetricLabel>
                  </DimensionMetric>
                  <DimensionMetric>
                    <DimensionMetricValue type={dimension.type}>
                      {dimension.uncertainty}%
                    </DimensionMetricValue>
                    <DimensionMetricLabel>Uncertainty</DimensionMetricLabel>
                  </DimensionMetric>
                  <DimensionMetric>
                    <DimensionMetricValue type={dimension.type}>
                      {dimension.impact}
                    </DimensionMetricValue>
                    <DimensionMetricLabel>Impact</DimensionMetricLabel>
                  </DimensionMetric>
                </DimensionMetrics>
              </DimensionItem>
            ))}
          </DimensionsList>
        </UncertaintyDimensionsPanel>
      </DashboardContent>
    </DashboardContainer>
  );
};

export default QuantumUncertaintyDashboard;

