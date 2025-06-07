/**
 * Main TrustLogUI component for Trust Log UI Viewer
 * 
 * Integrates all sub-components with proper tether checks, schema validation,
 * and clause citations as required by Phase 12.20.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 * Clauses: 5.3, 11.0, 12.0, 6.2
 */
import * as React from 'react';
import pre_loop_tether_check from '../utils/tetherCheck.js';
import ReplayLogViewer from './ReplayLogViewer.js';
import MerkleChainVisualizer from './MerkleChainVisualizer.js';
import TrustSurfaceDisplay from './TrustSurfaceDisplay.js';
import ContractReference from './ContractReference.js';

class TrustLogUI extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'logs',
      tetherVerified: false
    };
    
    // Component metadata for tether check
    this.component_id = "trust_log_ui";
    this.contract_version = "v2025.05.18";
    this.schema_version = "v1";
    this.clauses = ["5.3", "11.0", "12.0", "6.2"];
  }
  
  componentDidMount() {
    // Perform tether check before rendering
    pre_loop_tether_check(this.component_id, this.contract_version, this.schema_version, this.clauses)
      .then(tetherVerified => {
        this.setState({ tetherVerified });
      });
  }
  
  setActiveTab = (tab) => {
    this.setState({ activeTab: tab });
  }
  
  render() {
    const { activeTab, tetherVerified } = this.state;
    
    if (!tetherVerified) {
      return (
        <div className="tether-error">
          <h2>Tether Verification Failed</h2>
          <p>This component cannot be rendered because it is not properly tethered to the Codex contract.</p>
          <p>Please check the console for more details.</p>
        </div>
      );
    }
    
    return (
      <div className="trust-log-ui">
        <header className="ui-header">
          <h1>Trust Log UI Viewer</h1>
          <div className="contract-info">
            <span className="contract-version">Contract: v2025.05.18</span>
            <span className="phase-id">Phase: 12.20</span>
          </div>
        </header>
        
        <nav className="tab-navigation">
          <button 
            className={activeTab === 'logs' ? 'active' : ''} 
            onClick={() => this.setActiveTab('logs')}
          >
            Replay Logs
          </button>
          <button 
            className={activeTab === 'merkle' ? 'active' : ''} 
            onClick={() => this.setActiveTab('merkle')}
          >
            Merkle Chain
          </button>
          <button 
            className={activeTab === 'trust' ? 'active' : ''} 
            onClick={() => this.setActiveTab('trust')}
          >
            Trust Surface
          </button>
        </nav>
        
        <main className="tab-content">
          {activeTab === 'logs' && <ReplayLogViewer />}
          {activeTab === 'merkle' && <MerkleChainVisualizer />}
          {activeTab === 'trust' && <TrustSurfaceDisplay />}
        </main>
        
        <footer className="ui-footer">
          <div className="clause-citations">
            <ContractReference clause="5.3" text="Execution Replay Logging" />
            <ContractReference clause="11.0" text="Cryptographic Verification Protocol" />
            <ContractReference clause="12.0" text="Agent UI Integration" />
            <ContractReference clause="6.2" text="Trust Surface Visualization" />
          </div>
        </footer>
      </div>
    );
  }
}
export default TrustLogUI;
