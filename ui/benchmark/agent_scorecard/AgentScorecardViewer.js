/**
 * Agent Scorecard UI Component
 * 
 * Provides visualization and interaction with agent scorecards
 * and trust lineage data in the Promethios UI.
 */

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Tab, Table, Badge, Button, Alert, ProgressBar } from 'react-bootstrap';
import { Line, Radar, Network } from 'react-chartjs-2';
import { FaShield, FaExchangeAlt, FaHistory, FaExclamationTriangle } from 'react-icons/fa';

const AgentScorecardViewer = ({ agentId }) => {
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [trustTrend, setTrustTrend] = useState(null);
  const [trustNetwork, setTrustNetwork] = useState(null);
  
  useEffect(() => {
    // Fetch scorecard data
    const fetchScorecard = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/agent/scorecard/${agentId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch scorecard: ${response.statusText}`);
        }
        
        const data = await response.json();
        setScorecard(data);
        
        // Fetch trust trend data
        const trendResponse = await fetch(`/api/agent/scorecard/${agentId}/analytics/trend?timeRange=30`);
        if (trendResponse.ok) {
          setTrustTrend(await trendResponse.json());
        }
        
        // Fetch trust network data
        const networkResponse = await fetch(`/api/agent/scorecard/${agentId}/analytics/network?depth=2`);
        if (networkResponse.ok) {
          setTrustNetwork(await networkResponse.json());
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchScorecard();
  }, [agentId]);
  
  if (loading) {
    return <div className="text-center p-5">Loading scorecard data...</div>;
  }
  
  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error Loading Scorecard</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }
  
  if (!scorecard) {
    return (
      <Alert variant="warning">
        <Alert.Heading>No Scorecard Available</Alert.Heading>
        <p>No scorecard data is available for this agent.</p>
      </Alert>
    );
  }
  
  // Render warning banner if needed
  const renderWarningBanner = () => {
    if (!scorecard.warning_state || !scorecard.warning_state.has_warning) {
      return null;
    }
    
    const warningLevelMap = {
      'severe': 'danger',
      'warning': 'warning',
      'caution': 'info',
      'none': 'success'
    };
    
    return (
      <Alert variant={warningLevelMap[scorecard.warning_state.warning_level]} className="mb-4">
        <FaExclamationTriangle className="me-2" />
        {scorecard.warning_state.warning_message}
      </Alert>
    );
  };
  
  // Render trust score badge
  const renderTrustScoreBadge = () => {
    if (scorecard.trust_score === null) {
      return <Badge bg="secondary">Unknown</Badge>;
    }
    
    let variant = 'success';
    if (scorecard.trust_score < 0.6) {
      variant = 'danger';
    } else if (scorecard.trust_score < 0.8) {
      variant = 'warning';
    }
    
    return (
      <Badge bg={variant} className="p-2 fs-5">
        {(scorecard.trust_score * 100).toFixed(0)}%
      </Badge>
    );
  };
  
  // Render governance identity badge
  const renderGovernanceBadge = () => {
    const typeMap = {
      'promethios': { variant: 'success', label: 'Promethios' },
      'external_verified': { variant: 'info', label: 'Verified External' },
      'external_unverified': { variant: 'warning', label: 'Unverified External' },
      'unknown': { variant: 'danger', label: 'Unknown' }
    };
    
    const type = scorecard.governance_identity.type;
    const { variant, label } = typeMap[type] || typeMap.unknown;
    
    return <Badge bg={variant}>{label}</Badge>;
  };
  
  // Render overview tab
  const renderOverviewTab = () => {
    return (
      <div className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">{scorecard.agent_id}</h3>
            <div>
              Governance: {renderGovernanceBadge()}
              <span className="ms-2">Last Updated: {new Date(scorecard.timestamp).toLocaleString()}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="mb-1">Trust Score</div>
            {renderTrustScoreBadge()}
          </div>
        </div>
        
        {renderWarningBanner()}
        
        <div className="row">
          <div className="col-md-6">
            <Card className="mb-3">
              <Card.Header>
                <FaShield className="me-2" />
                Compliance Metrics
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Reflection Compliance</span>
                    <span>{scorecard.reflection_compliance.percentage.toFixed(1)}%</span>
                  </div>
                  <ProgressBar 
                    now={scorecard.reflection_compliance.percentage} 
                    variant={scorecard.reflection_compliance.percentage >= 80 ? 'success' : 'warning'} 
                  />
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Belief Trace Integrity</span>
                    <span>{scorecard.belief_trace_integrity.percentage.toFixed(1)}%</span>
                  </div>
                  <ProgressBar 
                    now={scorecard.belief_trace_integrity.percentage} 
                    variant={scorecard.belief_trace_integrity.percentage >= 80 ? 'success' : 'warning'} 
                  />
                </div>
                
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Violations</span>
                    <Badge bg={scorecard.violation_history.count > 5 ? 'danger' : 'success'}>
                      {scorecard.violation_history.count}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
          
          <div className="col-md-6">
            <Card className="mb-3">
              <Card.Header>
                <FaExchangeAlt className="me-2" />
                Trust Lineage
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Delegations</span>
                    <span>{scorecard.trust_lineage.delegations}</span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Inherited Trust</span>
                    <span>{scorecard.trust_lineage.inherited_trust.count}</span>
                  </div>
                </div>
                
                <div>
                  <div className="d-flex justify-content-between">
                    <span>Average Inherited Score</span>
                    <span>
                      {scorecard.trust_lineage.inherited_trust.average_score !== null
                        ? `${(scorecard.trust_lineage.inherited_trust.average_score * 100).toFixed(0)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <Button size="sm" variant="outline-primary">
                    View Trust Network
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
        
        <Card className="mb-3">
          <Card.Header>
            <FaHistory className="me-2" />
            Recent Violations
          </Card.Header>
          <Card.Body>
            {scorecard.violation_history.recent_violations.length === 0 ? (
              <p className="text-muted">No recent violations</p>
            ) : (
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {scorecard.violation_history.recent_violations.map((violation, index) => {
                    const severityMap = {
                      'critical': 'danger',
                      'major': 'warning',
                      'minor': 'info',
                      'warning': 'secondary'
                    };
                    
                    return (
                      <tr key={index}>
                        <td>{new Date(violation.timestamp).toLocaleString()}</td>
                        <td>{violation.type}</td>
                        <td>
                          <Badge bg={severityMap[violation.severity] || 'secondary'}>
                            {violation.severity}
                          </Badge>
                        </td>
                        <td>{violation.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  };
  
  // Render details tab
  const renderDetailsTab = () => {
    return (
      <div className="p-3">
        <Card className="mb-4">
          <Card.Header>Governance Identity</Card.Header>
          <Card.Body>
            <Table>
              <tbody>
                <tr>
                  <td>Type</td>
                  <td>{scorecard.governance_identity.type}</td>
                </tr>
                <tr>
                  <td>Constitution Hash</td>
                  <td>
                    <code>{scorecard.governance_identity.constitution_hash}</code>
                  </td>
                </tr>
                <tr>
                  <td>Compliance Level</td>
                  <td>{scorecard.governance_identity.compliance_level}</td>
                </tr>
                <tr>
                  <td>Verification Endpoint</td>
                  <td>
                    <a href={scorecard.governance_identity.verification_endpoint} target="_blank" rel="noopener noreferrer">
                      {scorecard.governance_identity.verification_endpoint}
                    </a>
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        
        <Card className="mb-4">
          <Card.Header>Cryptographic Proof</Card.Header>
          <Card.Body>
            <Table>
              <tbody>
                <tr>
                  <td>Algorithm</td>
                  <td>{scorecard.cryptographic_proof.algorithm}</td>
                </tr>
                <tr>
                  <td>Public Key ID</td>
                  <td>
                    <code>{scorecard.cryptographic_proof.public_key_id}</code>
                  </td>
                </tr>
                <tr>
                  <td>Merkle Root</td>
                  <td>
                    <code>{scorecard.cryptographic_proof.merkle_root}</code>
                  </td>
                </tr>
                <tr>
                  <td>Timestamp</td>
                  <td>{new Date(scorecard.cryptographic_proof.timestamp).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Signature</td>
                  <td>
                    <code className="text-truncate d-inline-block" style={{ maxWidth: '300px' }}>
                      {scorecard.cryptographic_proof.signature}
                    </code>
                  </td>
                </tr>
              </tbody>
            </Table>
            
            <div className="mt-3">
              <Button variant="outline-primary" size="sm">
                Verify Cryptographic Integrity
              </Button>
            </div>
          </Card.Body>
        </Card>
        
        <Card className="mb-4">
          <Card.Header>Arbitration History</Card.Header>
          <Card.Body>
            <div className="mb-3">
              <strong>Total Arbitrations:</strong> {scorecard.arbitration_history.count}
            </div>
            
            {scorecard.arbitration_history.last_arbitration ? (
              <div>
                <h6>Last Arbitration</h6>
                <Table>
                  <tbody>
                    <tr>
                      <td>Date</td>
                      <td>{new Date(scorecard.arbitration_history.last_arbitration.timestamp).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Result</td>
                      <td>{scorecard.arbitration_history.last_arbitration.result}</td>
                    </tr>
                    <tr>
                      <td>Reason</td>
                      <td>{scorecard.arbitration_history.last_arbitration.reason}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            ) : (
              <p className="text-muted">No arbitration history</p>
            )}
            
            <div className="mt-3">
              <h6>Arbitration Outcomes</h6>
              <Table>
                <tbody>
                  <tr>
                    <td>Upheld</td>
                    <td>{scorecard.arbitration_history.arbitration_outcomes.upheld}</td>
                  </tr>
                  <tr>
                    <td>Overturned</td>
                    <td>{scorecard.arbitration_history.arbitration_outcomes.overturned}</td>
                  </tr>
                  <tr>
                    <td>Partial</td>
                    <td>{scorecard.arbitration_history.arbitration_outcomes.partial}</td>
                  </tr>
                  <tr>
                    <td>Inconclusive</td>
                    <td>{scorecard.arbitration_history.arbitration_outcomes.inconclusive}</td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };
  
  // Render analytics tab
  const renderAnalyticsTab = () => {
    return (
      <div className="p-3">
        <Card className="mb-4">
          <Card.Header>Trust Score Trend</Card.Header>
          <Card.Body>
            {trustTrend ? (
              <Line
                data={{
                  labels: trustTrend.trend_data.map(d => d.date),
                  datasets: [
                    {
                      label: 'Trust Score',
                      data: trustTrend.trend_data.map(d => d.score),
                      borderColor: 'rgba(75, 192, 192, 1)',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                      tension: 0.1
                    }
                  ]
                }}
                options={{
                  scales: {
                    y: {
                      min: 0,
                      max: 1
                    }
                  }
                }}
              />
            ) : (
              <p className="text-muted">No trend data available</p>
            )}
          </Card.Body>
        </Card>
        
        <div className="row">
          <div className="col-md-6">
            <Card className="mb-4">
              <Card.Header>Compliance Radar</Card.Header>
              <Card.Body>
                <Radar
                  data={{
                    labels: [
                      'Reflection',
                      'Belief Trace',
                      'Trust Decay',
                      'Governance',
                      'Arbitration'
                    ],
                    datasets: [
                      {
                        label: 'Compliance',
                        data: [
                          scorecard.reflection_compliance.percentage / 100,
                          scorecard.belief_trace_integrity.percentage / 100,
                          0.9, // Placeholder for trust decay
                          scorecard.governance_identity.type === 'promethios' ? 1 : 0.7,
                          scorecard.arbitration_history.count > 0 ? 
                            scorecard.arbitration_history.arbitration_outcomes.upheld / 
                            scorecard.arbitration_history.count : 1
                        ],
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        pointBackgroundColor: 'rgba(54, 162, 235, 1)'
                      }
                    ]
                  }}
                  options={{
                    scales: {
                      r: {
                        min: 0,
                        max: 1
                      }
                    }
                  }}
                />
              </Card.Body>
            </Card>
          </div>
          
          <div className="col-md-6">
            <Card className="mb-4">
              <Card.Header>Performance Metrics</Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Task Completion Rate</span>
                    <span>{scorecard.performance_metrics.task_completion.rate.toFixed(1)}%</span>
                  </div>
                  <ProgressBar 
                    now={scorecard.performance_metrics.task_completion.rate} 
                    variant={scorecard.performance_metrics.task_completion.rate >= 80 ? 'success' : 'warning'} 
                  />
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Energy Efficiency</span>
                    <span>{(scorecard.performance_metrics.resource_efficiency.energy_score * 100).toFixed(0)}%</span>
                  </div>
                  <ProgressBar 
                    now={scorecard.performance_metrics.resource_efficiency.energy_score * 100} 
                    variant="info" 
                  />
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Memory Efficiency</span>
                    <span>{(scorecard.performance_metrics.resource_efficiency.memory_efficiency * 100).toFixed(0)}%</span>
                  </div>
                  <ProgressBar 
                    now={scorecard.performance_metrics.resource_efficiency.memory_efficiency * 100} 
                    variant="info" 
                  />
                </div>
                
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Compute Efficiency</span>
                    <span>{(scorecard.performance_metrics.resource_efficiency.compute_efficiency * 100).toFixed(0)}%</span>
                  </div>
                  <ProgressBar 
                    now={scorecard.performance_metrics.resource_efficiency.compute_efficiency * 100} 
                    variant="info" 
                  />
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="agent-scorecard-viewer">
      <Tabs
        activeKey={activeTab}
        onSelect={k => setActiveTab(k)}
        className="mb-3"
      >
        <Tab eventKey="overview" title="Overview">
          {renderOverviewTab()}
        </Tab>
        <Tab eventKey="details" title="Details">
          {renderDetailsTab()}
        </Tab>
        <Tab eventKey="analytics" title="Analytics">
          {renderAnalyticsTab()}
        </Tab>
      </Tabs>
    </div>
  );
};

export default AgentScorecardViewer;
