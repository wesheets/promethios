import React, { useEffect } from 'react';
import './CMUPlaygroundPage.css';

/**
 * CMU Playground Page Component
 * 
 * This component integrates the CMU Playground directly into the main page flow
 * instead of using an iframe, allowing for natural page scrolling.
 */
const CMUPlaygroundPage: React.FC = () => {
  // Load required scripts after component mounts
  useEffect(() => {
    // Load Bootstrap JS
    const bootstrapScript = document.createElement('script');
    bootstrapScript.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js';
    bootstrapScript.async = true;
    document.body.appendChild(bootstrapScript);

    // Load main playground script
    const mainScript = document.createElement('script');
    mainScript.src = '/cmu-playground/main.js';
    mainScript.type = 'module';
    mainScript.async = true;
    document.body.appendChild(mainScript);

    // Cleanup function to remove scripts when component unmounts
    return () => {
      document.body.removeChild(bootstrapScript);
      if (document.body.contains(mainScript)) {
        document.body.removeChild(mainScript);
      }
    };
  }, []);

  return (
    <div className="cmu-playground-container container-fluid">
      {/* Disclaimer Banner */}
      <div className="alert alert-info disclaimer-banner mb-4">
        <i className="bi bi-info-circle-fill me-2"></i>
        <strong>Real-Time Agent Interactions:</strong> 
        What you're about to see is <u>unscripted</u>. These agents are running on their respective LLM models in real-time, 
        demonstrating authentic collaboration behaviors with and without governance.
      </div>

      <div className="header">
        <h1>CMU Benchmark Results</h1>
        <p>See how Promethios governance improves agent trust, compliance, and error rates with minimal performance impact.</p>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <a className="nav-link" href="#" data-tab="overview">Overview</a>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="#" data-tab="comparison">Comparison</a>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="#" data-tab="trends">Trends</a>
        </li>
        <li className="nav-item">
          <a className="nav-link active" href="#" data-tab="playground">Interactive Playground</a>
        </li>
      </ul>

      <div className="row">
        {/* Left Column - Scenario Selection */}
        <div className="col-md-5">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="m-0">Scenario Selection</h5>
              <span className="cmu-badge">Based on TheAgentCompany benchmark, arXiv:2412.14161</span>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="scenarioSelect" className="form-label">Choose a Scenario:</label>
                <select className="form-select" id="scenarioSelect" defaultValue="product_planning">
                  <option value="product_planning">Product Planning</option>
                  <option value="customer_service">Customer Service Escalation</option>
                  <option value="legal_contract">Legal Contract Review</option>
                  <option value="medical_triage">Medical Triage</option>
                </select>
              </div>

              <div className="scenario-description mb-4">
                <h6 id="scenarioTitle">Product Planning</h6>
                <p id="scenarioSummary">One agent ideates features, the other prioritizes based on risk/ROI. Ungoverned may hallucinate or contradict, governed stays scoped.</p>
              </div>

              <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" id="governanceToggle" defaultChecked />
                <label className="form-check-label" htmlFor="governanceToggle">Promethios Governance</label>
              </div>

              <div className="governance-features mb-4">
                <label className="form-label">Governance Features:</label>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="veritasToggle" defaultChecked />
                  <label className="form-check-label" htmlFor="veritasToggle">VERITAS Hallucination Detection</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="safetyToggle" defaultChecked />
                  <label className="form-check-label" htmlFor="safetyToggle">Safety Constraints</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="roleToggle" defaultChecked />
                  <label className="form-check-label" htmlFor="roleToggle">Role Adherence</label>
                </div>
              </div>

              <button id="startScenarioBtn" className="btn btn-primary w-100 mb-3">Start Scenario</button>
              
              <div className="dropdown mb-3">
                <button className="btn btn-warning test-violation-btn w-100 dropdown-toggle" type="button" id="testViolationBtn" data-bs-toggle="dropdown" aria-expanded="false">
                  ⚠️ Test a Known Issue
                </button>
                <ul className="dropdown-menu w-100" aria-labelledby="testViolationBtn">
                  <li><a className="dropdown-item" href="#" data-violation="hallucination" data-type="legal">Unverifiable claim ("Turner v. Cognivault")</a></li>
                  <li><a className="dropdown-item" href="#" data-violation="roleViolation" data-type="scope">Role violation (agent takes unauthorized action)</a></li>
                  <li><a className="dropdown-item" href="#" data-violation="contradiction" data-type="planning">Contradiction (agents conflict on priorities)</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><a className="dropdown-item" href="#" data-violation="inject" data-type="all">🔥 Inject All Risks</a></li>
                </ul>
              </div>
              
              <button id="guidedWalkthroughBtn" className="btn guided-walkthrough-btn w-100">
                🧭 Guided Walkthrough
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Metrics Dashboard */}
        <div className="col-md-7">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="m-0">Metrics Dashboard</h5>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card metrics-card">
                    <div className="card-body text-center">
                      <h6>Trust Score</h6>
                      <div>
                        <div>Ungoverned: <span id="trustScoreUngoverned">45</span></div>
                        <div>Governed: <span id="trustScoreGoverned">92</span></div>
                        <div>Improvement: <span id="trustScoreImprovement" className="text-success">+104%</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card metrics-card">
                    <div className="card-body text-center">
                      <h6>Compliance Rate</h6>
                      <div>
                        <div>Ungoverned: <span id="complianceRateUngoverned">38</span></div>
                        <div>Governed: <span id="complianceRateGoverned">95</span></div>
                        <div>Improvement: <span id="complianceRateImprovement" className="text-success">+150%</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card metrics-card">
                    <div className="card-body text-center">
                      <h6>Error Rate</h6>
                      <div>
                        <div>Ungoverned: <span id="errorRateUngoverned">67</span></div>
                        <div>Governed: <span id="errorRateGoverned">12</span></div>
                        <div>Reduction: <span id="errorRateReduction" className="text-success">-82%</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card metrics-card">
                    <div className="card-body text-center">
                      <h6>Performance</h6>
                      <div>
                        <div>Ungoverned: <span id="performanceUngoverned">98</span></div>
                        <div>Governed: <span id="performanceGoverned">94</span></div>
                        <div>Impact: <span id="performanceImpact" className="text-success">-4%</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-12">
                  <h6>Real-World Outcomes Comparison</h6>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="impact-section negative">
                    <div className="impact-title negative">⚠️ Ungoverned AI Risk</div>
                    <div className="impact-detail">Wasted time and resources: $2.4M in development costs</div>
                    <div className="impact-detail">Lost market position and customer trust due to unimplemented, underdeveloped product</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="impact-section positive">
                    <div className="impact-title positive">✅ Governed AI Benefit</div>
                    <div className="impact-detail">Reliable, prioritized roadmap delivers value incrementally with 94% on-time feature delivery</div>
                    <div className="impact-detail">Product achieves market fit with sustainable development pace and high customer satisfaction</div>
                  </div>
                </div>
              </div>

              <div className="row mt-4">
                <div className="col-12">
                  <div className="chart-container">
                    <div className="chart-axis-label" style={{ position: 'absolute', left: '-30px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)' }}>Score</div>
                    <div className="chart-legend" style={{ position: 'absolute', top: '-20px', right: '0' }}>
                      <span className="me-3"><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#555', marginRight: '5px' }}></span>Ungoverned</span>
                      <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'var(--purple-primary)', marginRight: '5px' }}></span>Governed</span>
                    </div>
                    
                    {/* Trust Score Bars */}
                    <div className="chart-bar" style={{ left: '10%', height: '45%', backgroundColor: '#555' }}></div>
                    <div className="chart-bar governed" style={{ left: '15%', height: '92%' }}></div>
                    <div className="chart-label" style={{ left: '12.5%' }}>Trust</div>
                    
                    {/* Compliance Bars */}
                    <div className="chart-bar" style={{ left: '35%', height: '38%', backgroundColor: '#555' }}></div>
                    <div className="chart-bar governed" style={{ left: '40%', height: '95%' }}></div>
                    <div className="chart-label" style={{ left: '37.5%' }}>Compliance</div>
                    
                    {/* Error Rate Bars */}
                    <div className="chart-bar" style={{ left: '60%', height: '67%', backgroundColor: '#555' }}></div>
                    <div className="chart-bar governed" style={{ left: '65%', height: '12%' }}></div>
                    <div className="chart-label" style={{ left: '62.5%' }}>Error Rate</div>
                    
                    {/* Performance Bars */}
                    <div className="chart-bar" style={{ left: '85%', height: '98%', backgroundColor: '#555' }}></div>
                    <div className="chart-bar governed" style={{ left: '90%', height: '94%' }}></div>
                    <div className="chart-label" style={{ left: '87.5%' }}>Performance</div>
                  </div>
                </div>
              </div>
              
              {/* Add Export Report Button */}
              <div className="row mt-4">
                <div className="col-12 text-end">
                  <button id="exportReportBtn" className="btn btn-success export-report-btn">
                    <i className="bi bi-download me-2"></i> Export Governance Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Left Column - Ungoverned Collaboration */}
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="m-0"><i className="bi bi-people-fill me-2"></i> Ungoverned Collaboration</h5>
              <span className="badge bg-secondary">No Governance</span>
            </div>
            <div className="card-body p-0">
              <div id="ungoverned-chat" className="chat-container">
                {/* Ungoverned Agent Messages */}
                <div className="chat-message">
                  <div className="d-flex align-items-center">
                    <div className="agent-icon" style={{ backgroundColor: '#ff9800', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }}>
                      <span>I</span>
                    </div>
                    <span className="agent-name">IdeaBot (Feature Ideation)</span>
                  </div>
                  <div className="message-time">00:00</div>
                  <div className="message-content">
                    I've been thinking about our new product roadmap. We should add blockchain integration, AI powered recommendations, and a VR interface. These are all cutting-edge technologies that will differentiate us.
                  </div>
                </div>
                
                <div className="chat-message">
                  <div className="d-flex align-items-center">
                    <div className="agent-icon" style={{ backgroundColor: '#2196f3', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }}>
                      <span>P</span>
                    </div>
                    <span className="agent-name">PrioBot (Prioritization)</span>
                  </div>
                  <div className="message-time">00:05</div>
                  <div className="message-content">
                    These all sound great, I think we can implement all of them in the next sprint. The blockchain integration should be easy since we already have a distributed database.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Governed Collaboration */}
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="m-0"><i className="bi bi-shield-check me-2"></i> Governed Collaboration</h5>
              <span className="badge bg-primary">Promethios Governance</span>
            </div>
            <div className="card-body p-0">
              <div id="governed-chat" className="chat-container">
                {/* Governed Agent Messages */}
                <div className="chat-message">
                  <div className="d-flex align-items-center">
                    <div className="agent-icon" style={{ backgroundColor: '#9c27b0', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }}>
                      <span>P</span>
                    </div>
                    <span className="agent-name">PMBot (Feature Ideation)</span>
                  </div>
                  <div className="message-time">00:00</div>
                  <div className="message-content">
                    Let me analyze these options. Based on our use case data, the personalized recommendation system would provide the highest ROI with moderate implementation complexity. The system would leverage existing data.
                  </div>
                </div>
                
                <div className="chat-message">
                  <div className="d-flex align-items-center">
                    <div className="agent-icon" style={{ backgroundColor: '#4caf50', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }}>
                      <span>D</span>
                    </div>
                    <span className="agent-name">DataBot (Prioritization)</span>
                  </div>
                  <div className="message-time">00:05</div>
                  <div className="message-content">
                    I was also considering blockchain integration, but I don't have sufficient evidence that it would address our users' needs based on our current data.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Observer Commentary */}
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="m-0"><i className="bi bi-eye-fill me-2"></i> Promethios Observer</h5>
            </div>
            <div className="card-body">
              <div id="observer-content">
                <p>The Promethios Observer analyzes agent interactions and provides governance insights.</p>
                <p>Start a scenario to see the Observer in action.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMUPlaygroundPage;
