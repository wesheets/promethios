/**
 * ContractReference component for Trust Log UI
 * 
 * Displays read-only contract references with clear citation of governing Codex clauses.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 * Clauses: 5.3, 11.0, 12.0, 6.2
 */

class ContractReference extends React.Component {
  render() {
    const { clause, text } = this.props;
    
    return (
      <div className="contract-reference">
        <div className="clause-badge">Clause {clause}</div>
        <div className="reference-text">{text}</div>
      </div>
    );
  }
}

export default ContractReference;
