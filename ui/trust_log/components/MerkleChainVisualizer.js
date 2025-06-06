/**
 * MerkleChainVisualizer component for Trust Log UI
 * 
 * Displays Merkle chain seals with schema validation and proper clause citations.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 * Clauses: 5.3, 11.0, 12.0, 6.2
 */

import pre_loop_tether_check from '../utils/tetherCheck.js';

class MerkleChainVisualizer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      merkleSeals: [],
      loading: true,
      error: null,
      tetherVerified: false
    };
    
    // Component metadata for tether check
    this.component_id = "merkle_chain_visualizer";
    this.contract_version = "v2025.05.18";
    this.schema_version = "v1";
    this.clauses = ["5.3", "11.0", "12.0", "6.2"];
  }
  
  componentDidMount() {
    // Perform tether check before rendering
    pre_loop_tether_check(this.component_id, this.contract_version, this.schema_version, this.clauses)
      .then(tetherVerified => {
        if (!tetherVerified) {
          this.setState({ 
            error: "Tether check failed. Component cannot render.", 
            loading: false 
          });
          return;
        }
        
        this.setState({ tetherVerified: true });
        
        // Fetch merkle seals only if tether check passes
        fetch('/api/trust/merkle-seals')
          .then(response => response.json())
          .then(data => {
            // Validate against schema
            fetch('/schemas/ui/trust_view.schema.v1.json')
              .then(response => response.json())
              .then(schema => {
                const validate = ajv.compile(schema);
                const valid = validate(data);
                
                if (!valid) {
                  this.setState({ 
                    error: "Schema validation failed: " + JSON.stringify(validate.errors), 
                    loading: false 
                  });
                  return;
                }
                
                this.setState({ 
                  merkleSeals: data.trust_data.merkle_seals, 
                  loading: false 
                });
              });
          })
          .catch(error => {
            this.setState({ 
              error: "Failed to fetch merkle seals: " + error.message, 
              loading: false 
            });
          });
      });
  }
  
  render() {
    const { merkleSeals, loading, error, tetherVerified } = this.state;
    
    if (loading) {
      return <div className="loading">Loading Merkle chain...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    if (!tetherVerified) {
      return <div className="error">Tether verification failed. Cannot render component.</div>;
    }
    
    return (
      <div className="merkle-chain-visualizer">
        <div className="clause-citation">
          Merkle chain sealed under Clause 11.0, rendered via 12.20
        </div>
        <div className="merkle-tree">
          {merkleSeals.map(seal => (
            <div key={seal.seal_id} className="merkle-seal">
              <div className="seal-header">
                <span className="seal-id">{seal.seal_id}</span>
                <span className="seal-timestamp">{new Date(seal.timestamp).toLocaleString()}</span>
              </div>
              <div className="root-hash" title={seal.root_hash}>
                Root Hash: {seal.root_hash.substring(0, 16)}...
              </div>
              <div className="conflict-metadata">
                {seal.conflict_metadata.conflict_type !== "none" && (
                  <div className="conflict-alert">
                    Conflict Type: {seal.conflict_metadata.conflict_type}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default MerkleChainVisualizer;
