/**
 * TrustSurfaceDisplay component for Trust Log UI
 * 
 * Displays trust surface data with schema validation and proper clause citations.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 * Clauses: 5.3, 11.0, 12.0, 6.2
 */

import React from 'react';
import Ajv from 'ajv';
import pre_loop_tether_check from '../utils/tetherCheck.js';

// Initialize Ajv instance
const ajv = new Ajv();

class TrustSurfaceDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      trustSurface: null,
      loading: true,
      error: null,
      tetherVerified: false
    };
    
    // Component metadata for tether check
    this.component_id = "trust_surface_display";
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
        
        // Fetch trust surface only if tether check passes
        fetch('/api/trust/surface')
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
                  trustSurface: data.trust_data.trust_surface, 
                  loading: false 
                });
              });
          })
          .catch(error => {
            this.setState({ 
              error: "Failed to fetch trust surface: " + error.message, 
              loading: false 
            });
          });
      });
  }
  
  render() {
    const { trustSurface, loading, error, tetherVerified } = this.state;
    
    if (loading) {
      return <div className="loading">Loading trust surface...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    if (!tetherVerified) {
      return <div className="error">Tether verification failed. Cannot render component.</div>;
    }
    
    return (
      <div className="trust-surface-display">
        <div className="clause-citation">
          Trust surface governed by Clause 6.2, rendered via 12.20
        </div>
        <div className="trust-scores">
          <h3>Trust Scores</h3>
          {Object.entries(trustSurface.trust_scores).map(([component, score]) => (
            <div key={component} className="trust-score-item">
              <span className="component-name">{component}</span>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ width: `${score * 100}%`, backgroundColor: getScoreColor(score) }}
                ></div>
              </div>
              <span className="score-value">{(score * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
        
        <div className="justifications">
          <h3>Justifications</h3>
          {trustSurface.justifications.map((justification, index) => (
            <div key={index} className="justification-item">
              <div className="component-id">{justification.component_id}</div>
              <div className="justification-text">{justification.justification_text}</div>
              <div className="trust-score">Trust Score: {(justification.trust_score * 100).toFixed(1)}%</div>
            </div>
          ))}
        </div>
        
        <div className="override-status">
          <h3>Override Status</h3>
          <div className="active-overrides">
            <h4>Active Overrides</h4>
            {trustSurface.override_status.active_overrides.length === 0 ? (
              <div className="no-overrides">No active overrides</div>
            ) : (
              trustSurface.override_status.active_overrides.map(override => (
                <div key={override.override_id} className="override-item">
                  <div className="override-id">{override.override_id}</div>
                  <div className="component-id">{override.component_id}</div>
                  <div className="reason">{override.reason}</div>
                </div>
              ))
            )}
          </div>
          
          <div className="pending-overrides">
            <h4>Pending Overrides</h4>
            {trustSurface.override_status.pending_overrides.length === 0 ? (
              <div className="no-overrides">No pending overrides</div>
            ) : (
              trustSurface.override_status.pending_overrides.map(override => (
                <div key={override.override_id} className="override-item">
                  <div className="override-id">{override.override_id}</div>
                  <div className="component-id">{override.component_id}</div>
                  <div className="reason">{override.reason}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
}

// Helper function to get color based on trust score
function getScoreColor(score) {
  if (score < 0.5) return '#ff4d4d';
  if (score < 0.8) return '#ffcc00';
  return '#00cc66';
}

export default TrustSurfaceDisplay;
