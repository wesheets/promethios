/**
 * Wrapper Step component for the Agent Wizard
 * 
 * Third step in the agent wrapping wizard for reviewing generated wrapper code.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';

interface WrapperStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const WrapperStep: React.FC<WrapperStepProps> = ({ onNext, onBack }) => {
  const { wrapperFiles } = useDashboard();
  const [selectedFile, setSelectedFile] = useState<number>(0);
  
  return (
    <div className="wrapper-step">
      <h3>Generated Wrapper Code</h3>
      
      <div className="file-tabs">
        {wrapperFiles.map((file, index) => (
          <button
            key={file.name}
            className={selectedFile === index ? 'active' : ''}
            onClick={() => setSelectedFile(index)}
          >
            {file.name}
          </button>
        ))}
      </div>
      
      <div className="code-preview">
        {wrapperFiles.length > 0 ? (
          <pre>{wrapperFiles[selectedFile]?.content || ''}</pre>
        ) : (
          <div className="empty-state">No wrapper files generated</div>
        )}
      </div>
      
      <div className="form-actions">
        <button onClick={onBack}>Back</button>
        <button onClick={onNext}>Next</button>
      </div>
    </div>
  );
};
