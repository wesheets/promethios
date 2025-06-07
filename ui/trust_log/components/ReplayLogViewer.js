/**
 * ReplayLogViewer component for Trust Log UI
 * 
 * Displays trust log data with schema validation and proper clause citations.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 * Clauses: 5.3, 11.0, 12.0, 6.2
 */
import * as React from 'react';
import Ajv from 'ajv';
import pre_loop_tether_check from '../utils/tetherCheck.js';

// Initialize Ajv instance
const ajv = new Ajv();

class ReplayLogViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      logs: [],
      loading: true,
      error: null,
      tetherVerified: false
    };
    
    // Component metadata for tether check
    this.component_id = "trust_log_viewer";
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
        
        // Fetch logs only if tether check passes
        fetch('/api/trust/logs')
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
                  logs: data.trust_data.logs, 
                  loading: false 
                });
              });
          })
          .catch(error => {
            this.setState({ 
              error: "Failed to fetch logs: " + error.message, 
              loading: false 
            });
          });
      });
  }
  
  render() {
    const { logs, loading, error, tetherVerified } = this.state;
    
    if (loading) {
      return <div className="loading">Loading trust logs...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    if (!tetherVerified) {
      return <div className="error">Tether verification failed. Cannot render component.</div>;
    }
    
    return (
      <div className="replay-log-viewer">
        <div className="clause-citation">
          Log sealed under Clause 5.3, rendered via 12.20
        </div>
        <div className="log-entries">
          {logs.map(log => (
            <div key={log.entry_id} className="log-entry">
              <div className="entry-header">
                <span className="entry-id">{log.entry_id}</span>
                <span className="timestamp">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <div className="event-type">{log.event_type}</div>
              <div className="event-data">
                <pre>{JSON.stringify(log.event_data, null, 2)}</pre>
              </div>
              <div className="hash" title={log.current_hash}>
                Hash: {log.current_hash.substring(0, 10)}...
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default ReplayLogViewer;
