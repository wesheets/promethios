/**
 * Enhanced Veritas 2 - Collaborative Reflection Monitoring Dashboard
 * 
 * Comprehensive dashboard for monitoring human-in-the-loop collaborative reflection
 * sessions, uncertainty resolution, and collaborative intelligence metrics.
 * 
 * Features:
 * - Real-time collaboration session monitoring
 * - Uncertainty resolution tracking
 * - Human-AI collaboration effectiveness metrics
 * - Progressive clarification analytics
 * - Context-aware engagement monitoring
 */

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { 
  Brain, 
  Users, 
  MessageCircle, 
  TrendingUp, 
  Clock, 
  Target,
  Zap,
  Eye,
  CheckCircle,
  AlertTriangle,
  Activity,
  BarChart3,
  PieChart,
  LineChart
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
  }
  50% {
    opacity: 0.7;
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
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
  background: linear-gradient(135deg, #2BFFC6 0%, #00D4AA 100%);
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

const StatusIndicator = styled.div<{ status: 'active' | 'monitoring' | 'idle' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'active': return 'rgba(34, 197, 94, 0.1)';
      case 'monitoring': return 'rgba(59, 130, 246, 0.1)';
      case 'idle': return 'rgba(156, 163, 175, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active': return '#22C55E';
      case 'monitoring': return '#3B82F6';
      case 'idle': return '#9CA3AF';
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'active': return 'rgba(34, 197, 94, 0.3)';
      case 'monitoring': return 'rgba(59, 130, 246, 0.3)';
      case 'idle': return 'rgba(156, 163, 175, 0.3)';
    }
  }};
`;

const StatusDot = styled.div<{ status: 'active' | 'monitoring' | 'idle' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'active': return '#22C55E';
      case 'monitoring': return '#3B82F6';
      case 'idle': return '#9CA3AF';
    }
  }};
  animation: ${props => props.status === 'active' ? css`${pulse} 2s infinite` : 'none'};
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const MetricCard = styled.div<{ delay?: number }>`
  background: rgba(26, 34, 51, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(43, 255, 198, 0.1);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: ${fadeInUp} 0.6s ease-out ${props => props.delay || 0}s both;
  
  &:hover {
    transform: translateY(-4px);
    border-color: rgba(43, 255, 198, 0.3);
    box-shadow: 0 20px 40px rgba(43, 255, 198, 0.1);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -200px;
    width: 200px;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(43, 255, 198, 0.1),
      transparent
    );
    animation: ${shimmer} 3s infinite;
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

const MetricDescription = styled.p`
  font-size: 14px;
  color: #9CA3AF;
  margin: 0;
  line-height: 1.5;
`;

const CollaborationSessionsPanel = styled.div`
  background: rgba(26, 34, 51, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(43, 255, 198, 0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  animation: ${fadeInUp} 0.6s ease-out 0.3s both;
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

const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SessionItem = styled.div<{ status: 'active' | 'completed' | 'pending' }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(17, 24, 39, 0.6);
  border: 1px solid ${props => {
    switch (props.status) {
      case 'active': return 'rgba(34, 197, 94, 0.3)';
      case 'completed': return 'rgba(59, 130, 246, 0.3)';
      case 'pending': return 'rgba(251, 191, 36, 0.3)';
    }
  }};
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(17, 24, 39, 0.8);
    transform: translateX(4px);
  }
`;

const SessionStatus = styled.div<{ status: 'active' | 'completed' | 'pending' }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'active': return '#22C55E';
      case 'completed': return '#3B82F6';
      case 'pending': return '#FBB936';
    }
  }};
  animation: ${props => props.status === 'active' ? css`${pulse} 2s infinite` : 'none'};
`;

const SessionInfo = styled.div`
  flex: 1;
`;

const SessionTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #FFFFFF;
  margin-bottom: 4px;
`;

const SessionDetails = styled.div`
  font-size: 14px;
  color: #9CA3AF;
  display: flex;
  gap: 16px;
`;

const SessionMetrics = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
`;

const SessionMetric = styled.div`
  text-align: center;
`;

const SessionMetricValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #2BFFC6;
`;

const SessionMetricLabel = styled.div`
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 2px;
`;

const UncertaintyAnalysisPanel = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
`;

const UncertaintyChart = styled.div`
  background: rgba(26, 34, 51, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(43, 255, 198, 0.1);
  border-radius: 16px;
  padding: 24px;
  animation: ${fadeInUp} 0.6s ease-out 0.4s both;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0;
`;

const ChartContainer = styled.div`
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.4);
  border-radius: 8px;
  color: #9CA3AF;
  font-size: 14px;
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

const FilterButton = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'rgba(43, 255, 198, 0.1)' : 'transparent'};
  color: ${props => props.active ? '#2BFFC6' : '#9CA3AF'};
  border: 1px solid ${props => props.active ? '#2BFFC6' : 'rgba(156, 163, 175, 0.3)'};
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(43, 255, 198, 0.05);
    color: #2BFFC6;
  }
`;

// Types
interface CollaborationSession {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'pending';
  participants: number;
  duration: string;
  uncertaintyResolved: number;
  confidenceImprovement: number;
  startTime: string;
}

interface UncertaintyMetrics {
  totalUncertainties: number;
  resolvedUncertainties: number;
  averageResolutionTime: number;
  collaborationSuccessRate: number;
  humanEngagementRate: number;
  confidenceImprovement: number;
}

// Component
export const CollaborativeReflectionDashboard: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [systemStatus, setSystemStatus] = useState<'active' | 'monitoring' | 'idle'>('active');
  const [metrics, setMetrics] = useState<UncertaintyMetrics>({
    totalUncertainties: 247,
    resolvedUncertainties: 231,
    averageResolutionTime: 4.2,
    collaborationSuccessRate: 94.3,
    humanEngagementRate: 87.6,
    confidenceImprovement: 42.8
  });

  const [sessions] = useState<CollaborationSession[]>([
    {
      id: '1',
      title: 'Policy Interpretation Clarification',
      status: 'active',
      participants: 3,
      duration: '12m',
      uncertaintyResolved: 85,
      confidenceImprovement: 38,
      startTime: '2 minutes ago'
    },
    {
      id: '2',
      title: 'Technical Architecture Decision',
      status: 'active',
      participants: 5,
      duration: '8m',
      uncertaintyResolved: 72,
      confidenceImprovement: 45,
      startTime: '5 minutes ago'
    },
    {
      id: '3',
      title: 'Compliance Framework Analysis',
      status: 'completed',
      participants: 2,
      duration: '15m',
      uncertaintyResolved: 94,
      confidenceImprovement: 52,
      startTime: '1 hour ago'
    }
  ]);

  const filteredSessions = sessions.filter(session => 
    activeFilter === 'all' || session.status === activeFilter
  );

  return (
    <DashboardContainer>
      <DashboardHeader>
        <HeaderTitle>
          <Brain size={32} />
          Collaborative Reflection Monitor
        </HeaderTitle>
        <HeaderControls>
          <StatusIndicator status={systemStatus}>
            <StatusDot status={systemStatus} />
            {systemStatus === 'active' ? 'Active Collaborations' : 
             systemStatus === 'monitoring' ? 'Monitoring' : 'Idle'}
          </StatusIndicator>
          <ActionButton>
            <Eye size={16} />
            View Details
          </ActionButton>
        </HeaderControls>
      </DashboardHeader>

      <MetricsGrid>
        <MetricCard delay={0.1}>
          <MetricHeader>
            <MetricIcon color="#2BFFC6">
              <Target size={24} />
            </MetricIcon>
            <MetricTitle>Uncertainty Resolution Rate</MetricTitle>
          </MetricHeader>
          <MetricValue>
            {metrics.collaborationSuccessRate}
            <MetricUnit>%</MetricUnit>
          </MetricValue>
          <MetricTrend trend="up">
            <TrendingUp size={16} />
            +5.2% from last week
          </MetricTrend>
          <MetricDescription>
            Percentage of uncertainties successfully resolved through collaboration
          </MetricDescription>
        </MetricCard>

        <MetricCard delay={0.2}>
          <MetricHeader>
            <MetricIcon color="#3B82F6">
              <Users size={24} />
            </MetricIcon>
            <MetricTitle>Human Engagement Rate</MetricTitle>
          </MetricHeader>
          <MetricValue>
            {metrics.humanEngagementRate}
            <MetricUnit>%</MetricUnit>
          </MetricValue>
          <MetricTrend trend="up">
            <TrendingUp size={16} />
            +3.1% from last week
          </MetricTrend>
          <MetricDescription>
            Rate of human participation in collaborative reflection sessions
          </MetricDescription>
        </MetricCard>

        <MetricCard delay={0.3}>
          <MetricHeader>
            <MetricIcon color="#F59E0B">
              <Clock size={24} />
            </MetricIcon>
            <MetricTitle>Average Resolution Time</MetricTitle>
          </MetricHeader>
          <MetricValue>
            {metrics.averageResolutionTime}
            <MetricUnit>min</MetricUnit>
          </MetricValue>
          <MetricTrend trend="down">
            <TrendingUp size={16} style={{ transform: 'rotate(180deg)' }} />
            -1.3min from last week
          </MetricTrend>
          <MetricDescription>
            Average time to resolve uncertainties through collaboration
          </MetricDescription>
        </MetricCard>

        <MetricCard delay={0.4}>
          <MetricHeader>
            <MetricIcon color="#8B5CF6">
              <Zap size={24} />
            </MetricIcon>
            <MetricTitle>Confidence Improvement</MetricTitle>
          </MetricHeader>
          <MetricValue>
            +{metrics.confidenceImprovement}
            <MetricUnit>%</MetricUnit>
          </MetricValue>
          <MetricTrend trend="up">
            <TrendingUp size={16} />
            +2.8% from last week
          </MetricTrend>
          <MetricDescription>
            Average confidence boost from collaborative reflection
          </MetricDescription>
        </MetricCard>
      </MetricsGrid>

      <CollaborationSessionsPanel>
        <PanelHeader>
          <PanelTitle>
            <MessageCircle size={20} />
            Active Collaboration Sessions
          </PanelTitle>
          <div style={{ display: 'flex', gap: '8px' }}>
            <FilterButton 
              active={activeFilter === 'all'} 
              onClick={() => setActiveFilter('all')}
            >
              All
            </FilterButton>
            <FilterButton 
              active={activeFilter === 'active'} 
              onClick={() => setActiveFilter('active')}
            >
              Active
            </FilterButton>
            <FilterButton 
              active={activeFilter === 'completed'} 
              onClick={() => setActiveFilter('completed')}
            >
              Completed
            </FilterButton>
          </div>
        </PanelHeader>

        <SessionsList>
          {filteredSessions.map(session => (
            <SessionItem key={session.id} status={session.status}>
              <SessionStatus status={session.status} />
              <SessionInfo>
                <SessionTitle>{session.title}</SessionTitle>
                <SessionDetails>
                  <span>{session.participants} participants</span>
                  <span>Duration: {session.duration}</span>
                  <span>{session.startTime}</span>
                </SessionDetails>
              </SessionInfo>
              <SessionMetrics>
                <SessionMetric>
                  <SessionMetricValue>{session.uncertaintyResolved}%</SessionMetricValue>
                  <SessionMetricLabel>Resolved</SessionMetricLabel>
                </SessionMetric>
                <SessionMetric>
                  <SessionMetricValue>+{session.confidenceImprovement}%</SessionMetricValue>
                  <SessionMetricLabel>Confidence</SessionMetricLabel>
                </SessionMetric>
              </SessionMetrics>
            </SessionItem>
          ))}
        </SessionsList>
      </CollaborationSessionsPanel>

      <UncertaintyAnalysisPanel>
        <UncertaintyChart>
          <ChartHeader>
            <ChartTitle>Uncertainty Resolution Trends</ChartTitle>
            <BarChart3 size={20} color="#2BFFC6" />
          </ChartHeader>
          <ChartContainer>
            [Interactive Chart: Uncertainty resolution over time]
          </ChartContainer>
        </UncertaintyChart>

        <UncertaintyChart>
          <ChartHeader>
            <ChartTitle>Collaboration Effectiveness</ChartTitle>
            <PieChart size={20} color="#3B82F6" />
          </ChartHeader>
          <ChartContainer>
            [Interactive Chart: Collaboration success rates by type]
          </ChartContainer>
        </UncertaintyChart>
      </UncertaintyAnalysisPanel>
    </DashboardContainer>
  );
};

export default CollaborativeReflectionDashboard;

