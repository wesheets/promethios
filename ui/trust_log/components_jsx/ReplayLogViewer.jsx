/**
 * ReplayLogViewer component for Trust Log UI
 * 
 * Displays execution replay logs with schema validation and proper clause citations.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 * Clauses: 5.3, 11.0, 12.0, 6.2
 */

import React, { useState, useEffect } from 'react';
import Ajv from 'ajv';
import pre_loop_tether_check from '../utils/tetherCheck.js';

// Initialize Ajv instance
const ajv = new Ajv();

// Component metadata for tether check
const COMPONENT_ID = "trust_log_viewer";
const CONTRACT_VERSION = "v2025.05.18";
const SCHEMA_VERSION = "v1";
const CLAUSES = ["5.3", "11.0", "12.0", "6.2"];

const ReplayLogViewer = (props) => {
  // State hooks
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tetherVerified, setTetherVerified] = useState(false);
  
  // Effect hook for component initialization (replaces componentDidMount)
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        // Perform tether check before rendering
        const tetherResult = await pre_loop_tether_check(
          COMPONENT_ID, 
          CONTRACT_VERSION, 
          SCHEMA_VERSION, 
          CLAUSES
        );
        
        if (!isMounted) return;
        
        if (!tetherResult) {
          setError("Tether check failed. Component cannot render.");
          setLoading(false);
          return;
        }
        
        setTetherVerified(true);
        
        try {
          // Fetch logs only if tether check passes
          const logsResponse = await fetch('/api/trust/logs');
          const logsData = await logsResponse.json();
          
          if (!isMounted) return;
          
          try {
            // Validate against schema
            const schemaResponse = await fetch('/schemas/ui/trust_view.schema.v1.json');
            const schema = await schemaResponse.json();
            
            if (!isMounted) return;
            
            const validate = ajv.compile(schema);
            const valid = validate(logsData);
            
            if (!valid) {
              setError("Schema validation failed: " + JSON.stringify(validate.errors));
              setLoading(false);
              return;
            }
            
            setLogs(logsData.trust_data.logs);
            setLoading(false);
          } catch (schemaError) {
            if (isMounted) {
              setError("Failed to validate schema: " + schemaError.message);
              setLoading(false);
            }
          }
        } catch (fetchError) {
          if (isMounted) {
            setError("Failed to fetch logs: " + fetchError.message);
            setLoading(false);
          }
        }
      } catch (tetherError) {
        if (isMounted) {
          setError("Tether check error: " + tetherError.message);
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array means this effect runs once on mount
  
  // Render loading state
  if (loading) {
    return <div className="loading" data-testid="loading-state">Loading trust logs...</div>;
  }
  
  // Render error state
  if (error) {
    return <div className="error" data-testid="error-state">{error}</div>;
  }
  
  // Render tether verification failed state
  if (!tetherVerified) {
    return <div className="error" data-testid="tether-failed-state">Tether verification failed. Cannot render component.</div>;
  }
  
  // Render logs
  return (
    <div className="replay-log-viewer" data-testid="replay-log-viewer">
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
            <tr key={log.entry_id} data-testid={`log-entry-${log.entry_id}`}>
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
};

export default ReplayLogViewer;
