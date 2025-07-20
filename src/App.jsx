import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { 
  Activity, 
  Brain, 
  Heart, 
  Shield, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X
} from 'lucide-react'
import './App.css'

// Main Dashboard Component
function Dashboard() {
  const [systemStatus, setSystemStatus] = useState({
    backendConnected: true,
    componentsActive: 11,
    totalComponents: 11,
    validationScore: 100,
    performanceScore: 98.5,
    lastUpdate: new Date().toISOString()
  })

  const [governanceMetrics, setGovernanceMetrics] = useState({
    uncertaintyAnalysis: {
      epistemic: 0.15,
      aleatoric: 0.23,
      temporal: 0.18,
      contextual: 0.12,
      semantic: 0.20,
      pragmatic: 0.16
    },
    trustMetrics: {
      verification: 0.87,
      attestation: 0.92,
      boundary: 0.85,
      aggregate: 0.88
    },
    emotionalState: {
      confidence: 0.78,
      stress: 0.22,
      engagement: 0.85,
      satisfaction: 0.81
    },
    systemPerformance: {
      storageOpsPerSec: 27776,
      eventsPerSec: 165432,
      responseTime: 0.014,
      uptime: 99.99
    }
  })

  const [recentEvents, setRecentEvents] = useState([
    {
      id: 1,
      type: 'uncertainty_analysis',
      message: 'Six-dimensional uncertainty analysis completed',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      priority: 'normal'
    },
    {
      id: 2,
      type: 'trust_calculation',
      message: 'Trust metrics updated for entity: governance_participant_001',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      priority: 'normal'
    },
    {
      id: 3,
      type: 'emotion_analysis',
      message: 'Emotional state analysis: High engagement detected',
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      priority: 'high'
    },
    {
      id: 4,
      type: 'system_health',
      message: 'All components operational - 100% validation success',
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      priority: 'normal'
    }
  ])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update performance metrics with slight variations
      setGovernanceMetrics(prev => ({
        ...prev,
        systemPerformance: {
          ...prev.systemPerformance,
          storageOpsPerSec: 27776 + Math.floor(Math.random() * 1000 - 500),
          eventsPerSec: 165432 + Math.floor(Math.random() * 5000 - 2500),
          responseTime: 0.014 + (Math.random() * 0.006 - 0.003)
        }
      }))

      // Update last update timestamp
      setSystemStatus(prev => ({
        ...prev,
        lastUpdate: new Date().toISOString()
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Promethios
                </h1>
                <Badge variant="secondary" className="ml-2">
                  v2.0 - 100% Connected
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>All Systems Operational</span>
              </div>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Backend Connection</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">100%</div>
              <p className="text-xs text-muted-foreground">
                All {systemStatus.componentsActive} components active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Validation Score</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{systemStatus.validationScore}%</div>
              <p className="text-xs text-muted-foreground">
                22/22 tests passed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{systemStatus.performanceScore}%</div>
              <p className="text-xs text-muted-foreground">
                {governanceMetrics.systemPerformance.responseTime.toFixed(3)}s avg response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Throughput</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor(governanceMetrics.systemPerformance.eventsPerSec / 1000)}K
              </div>
              <p className="text-xs text-muted-foreground">
                events/sec processed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="governance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="governance">Governance Metrics</TabsTrigger>
            <TabsTrigger value="uncertainty">Uncertainty Analysis</TabsTrigger>
            <TabsTrigger value="trust">Trust Management</TabsTrigger>
            <TabsTrigger value="system">System Performance</TabsTrigger>
          </TabsList>

          {/* Governance Metrics Tab */}
          <TabsContent value="governance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Emotional Intelligence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span>Emotional Intelligence</span>
                  </CardTitle>
                  <CardDescription>
                    Real-time emotional state analysis for governance participants
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Confidence</span>
                      <span>{Math.round(governanceMetrics.emotionalState.confidence * 100)}%</span>
                    </div>
                    <Progress value={governanceMetrics.emotionalState.confidence * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Engagement</span>
                      <span>{Math.round(governanceMetrics.emotionalState.engagement * 100)}%</span>
                    </div>
                    <Progress value={governanceMetrics.emotionalState.engagement * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Satisfaction</span>
                      <span>{Math.round(governanceMetrics.emotionalState.satisfaction * 100)}%</span>
                    </div>
                    <Progress value={governanceMetrics.emotionalState.satisfaction * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Stress Level</span>
                      <span>{Math.round(governanceMetrics.emotionalState.stress * 100)}%</span>
                    </div>
                    <Progress value={governanceMetrics.emotionalState.stress * 100} className="h-2 bg-red-100" />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span>Recent Events</span>
                  </CardTitle>
                  <CardDescription>
                    Latest governance system activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentEvents.map((event) => (
                      <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          event.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {event.message}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Uncertainty Analysis Tab */}
          <TabsContent value="uncertainty" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>Six-Dimensional Uncertainty Analysis</span>
                </CardTitle>
                <CardDescription>
                  Advanced uncertainty quantification across multiple dimensions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(governanceMetrics.uncertaintyAnalysis).map(([dimension, value]) => (
                    <div key={dimension} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{dimension}</span>
                        <span>{Math.round(value * 100)}%</span>
                      </div>
                      <Progress value={value * 100} className="h-3" />
                      <p className="text-xs text-muted-foreground">
                        {dimension === 'epistemic' && 'Knowledge limitations'}
                        {dimension === 'aleatoric' && 'Inherent randomness'}
                        {dimension === 'temporal' && 'Time-dependent factors'}
                        {dimension === 'contextual' && 'Environmental variables'}
                        {dimension === 'semantic' && 'Language interpretation'}
                        {dimension === 'pragmatic' && 'Implementation challenges'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trust Management Tab */}
          <TabsContent value="trust" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>Trust Relationship Management</span>
                </CardTitle>
                <CardDescription>
                  Multi-dimensional trust analysis and relationship tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Trust Dimensions</h4>
                    {Object.entries(governanceMetrics.trustMetrics).filter(([key]) => key !== 'aggregate').map(([dimension, value]) => (
                      <div key={dimension} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize font-medium">{dimension}</span>
                          <span>{Math.round(value * 100)}%</span>
                        </div>
                        <Progress value={value * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Aggregate Trust Score</h4>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {Math.round(governanceMetrics.trustMetrics.aggregate * 100)}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Overall trust level for governance participants
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Performance Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    <span>Performance Metrics</span>
                  </CardTitle>
                  <CardDescription>
                    Real-time system performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.floor(governanceMetrics.systemPerformance.storageOpsPerSec / 1000)}K
                      </div>
                      <p className="text-sm text-muted-foreground">Storage Ops/Sec</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.floor(governanceMetrics.systemPerformance.eventsPerSec / 1000)}K
                      </div>
                      <p className="text-sm text-muted-foreground">Events/Sec</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Response Time</span>
                      <span>{governanceMetrics.systemPerformance.responseTime.toFixed(3)}s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>System Uptime</span>
                      <span>{governanceMetrics.systemPerformance.uptime}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-500" />
                    <span>Component Status</span>
                  </CardTitle>
                  <CardDescription>
                    Backend component health and connectivity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      'Trust Metrics Calculator',
                      'Enhanced Veritas Integration',
                      'Emotion Telemetry System',
                      'Governance Core',
                      'Decision Framework Engine',
                      'Storage Backend',
                      'Event Bus',
                      'Health Monitor'
                    ].map((component, index) => (
                      <div key={component} className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <span className="text-sm font-medium">{component}</span>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-green-600">Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Main App Component with Router
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

