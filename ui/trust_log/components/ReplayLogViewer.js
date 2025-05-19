/**
 * ReplayLogViewer component for Trust Log UI
 * 
 * Displays execution replay logs with schema validation and proper clause citations.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 * Clauses: 5.3, 11.0, 12.0, 6.2
 */

import pre_loop_tether_check from '../utils/tetherCheck.js';

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
        <table className="log-table">
          <thead>
            <tr>
              <th>Entry ID</th>
              <th>Timestamp</th>
              <th>Event Type</th>
              <th>Event Data</th>
              <th>Hash</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.entry_id}>
                <td>{log.entry_id}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.event_type}</td>
                <td>
                  <pre>{JSON.stringify(log.event_data, null, 2)}</pre>
                </td>
                <td>
                  <div className="hash" title={log.current_hash}>
                    {log.current_hash.substring(0, 8)}...
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

export default ReplayLogViewer;
