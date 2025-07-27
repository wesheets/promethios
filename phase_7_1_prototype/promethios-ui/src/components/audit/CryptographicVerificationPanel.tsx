import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface AuditLog {
  id: string;
  agentId: string;
  userId: string;
  eventType: string;
  eventData: any;
  timestamp: string;
  verificationStatus: 'verified' | 'pending' | 'failed';
  hash: string;
  signature: string;
  chainPosition: number;
}

interface VerificationResult {
  valid: boolean;
  details: {
    hashVerification: boolean;
    signatureVerification: boolean;
    chainIntegrity: boolean;
    timestampVerification: boolean;
  };
  chainStatistics: {
    totalEntries: number;
    verifiedEntries: number;
    integrityPercentage: number;
    lastVerified: string;
  };
  mathematicalProof: {
    algorithm: string;
    keyFingerprint: string;
    merkleRoot: string;
    proofGenerated: string;
  };
}

interface CryptographicVerificationPanelProps {
  agentId: string;
  selectedLog: AuditLog | null;
}

export const CryptographicVerificationPanel: React.FC<CryptographicVerificationPanelProps> = ({
  agentId,
  selectedLog
}) => {
  const { isDarkMode } = useTheme();
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyingLog, setVerifyingLog] = useState(false);

  useEffect(() => {
    if (agentId) {
      loadChainVerification();
    }
  }, [agentId]);

  const loadChainVerification = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/agent-logs/${agentId}/verify`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setVerification(data);
      }
    } catch (error) {
      console.error('Error loading chain verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifySpecificLog = async () => {
    if (!selectedLog) return;

    try {
      setVerifyingLog(true);
      const response = await fetch(`/api/cryptographic-audit/verify-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entryId: selectedLog.id,
          agentId: selectedLog.agentId
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Log Entry Verification:\n${result.valid ? 'VERIFIED ✓' : 'FAILED ✗'}\n\nDetails:\n- Hash: ${result.details.hashVerification ? 'Valid' : 'Invalid'}\n- Signature: ${result.details.signatureVerification ? 'Valid' : 'Invalid'}\n- Chain Position: ${result.details.chainIntegrity ? 'Valid' : 'Invalid'}`);
      }
    } catch (error) {
      console.error('Error verifying log entry:', error);
    } finally {
      setVerifyingLog(false);
    }
  };

  const generateMathematicalProof = async () => {
    try {
      const response = await fetch(`/api/cryptographic-audit/generate-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentId,
          includeChain: true,
          proofType: 'legal'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mathematical-proof-${agentId}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error generating mathematical proof:', error);
    }
  };

  const getVerificationIcon = (verified: boolean) => {
    return verified ? '✅' : '❌';
  };

  const getVerificationColor = (verified: boolean) => {
    return verified 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  const getIntegrityColor = (percentage: number) => {
    if (percentage >= 99) return 'text-green-600 dark:text-green-400';
    if (percentage >= 95) return 'text-yellow-600 dark:text-yellow-400';
    if (percentage >= 90) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-8`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Verifying cryptographic integrity...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chain Verification Overview */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">🔐 Cryptographic Verification</h2>
          <button
            onClick={loadChainVerification}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-50 transition-colors`}
          >
            {loading ? 'Verifying...' : 'Re-verify Chain'}
          </button>
        </div>

        {verification ? (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="text-center">
              <div className={`text-6xl mb-2`}>
                {verification.valid ? '🛡️' : '⚠️'}
              </div>
              <div className={`text-2xl font-bold ${getVerificationColor(verification.valid)}`}>
                {verification.valid ? 'CRYPTOGRAPHICALLY VERIFIED' : 'VERIFICATION FAILED'}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                Mathematical proof of audit trail integrity
              </p>
            </div>

            {/* Verification Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Verification Components</h3>
                <div className="space-y-3">
                  {[
                    { key: 'hashVerification', label: 'Hash Chain Integrity' },
                    { key: 'signatureVerification', label: 'Digital Signatures' },
                    { key: 'chainIntegrity', label: 'Chain Continuity' },
                    { key: 'timestampVerification', label: 'Timestamp Validity' }
                  ].map((component) => (
                    <div key={component.key} className="flex items-center justify-between">
                      <span className="text-sm">{component.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg ${getVerificationColor(verification.details[component.key as keyof typeof verification.details])}`}>
                          {getVerificationIcon(verification.details[component.key as keyof typeof verification.details])}
                        </span>
                        <span className={`text-sm font-medium ${getVerificationColor(verification.details[component.key as keyof typeof verification.details])}`}>
                          {verification.details[component.key as keyof typeof verification.details] ? 'Valid' : 'Invalid'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Chain Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Entries</span>
                    <span className="font-medium">{verification.chainStatistics.totalEntries.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Verified Entries</span>
                    <span className="font-medium">{verification.chainStatistics.verifiedEntries.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Integrity Percentage</span>
                    <span className={`font-bold text-lg ${getIntegrityColor(verification.chainStatistics.integrityPercentage)}`}>
                      {verification.chainStatistics.integrityPercentage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Verified</span>
                    <span className="font-medium text-xs">
                      {new Date(verification.chainStatistics.lastVerified).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mathematical Proof Details */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <h3 className="text-lg font-medium mb-4">Mathematical Proof Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Algorithm:
                  </span>
                  <div className="font-mono">{verification.mathematicalProof.algorithm}</div>
                </div>
                <div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Key Fingerprint:
                  </span>
                  <div className="font-mono break-all">{verification.mathematicalProof.keyFingerprint}</div>
                </div>
                <div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Merkle Root:
                  </span>
                  <div className="font-mono break-all">{verification.mathematicalProof.merkleRoot}</div>
                </div>
                <div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Proof Generated:
                  </span>
                  <div className="font-mono">{new Date(verification.mathematicalProof.proofGenerated).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={generateMathematicalProof}
                className={`px-6 py-3 rounded-md font-medium ${
                  isDarkMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } transition-colors`}
              >
                📄 Generate Legal Proof
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium mb-2">No Verification Data</h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Click "Re-verify Chain" to perform cryptographic verification
            </p>
          </div>
        )}
      </div>

      {/* Selected Log Verification */}
      {selectedLog && (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Selected Log Entry Verification</h2>
            <button
              onClick={verifySpecificLog}
              disabled={verifyingLog}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isDarkMode 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              } disabled:opacity-50 transition-colors`}
            >
              {verifyingLog ? 'Verifying...' : 'Verify This Entry'}
            </button>
          </div>

          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Entry ID:
                </span>
                <div className="font-mono break-all">{selectedLog.id}</div>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Chain Position:
                </span>
                <div className="font-medium">#{selectedLog.chainPosition}</div>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Event Type:
                </span>
                <div className="font-medium">{selectedLog.eventType}</div>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Verification Status:
                </span>
                <div className={`font-medium ${
                  selectedLog.verificationStatus === 'verified' 
                    ? 'text-green-600 dark:text-green-400'
                    : selectedLog.verificationStatus === 'pending'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {selectedLog.verificationStatus.toUpperCase()}
                </div>
              </div>
              <div className="md:col-span-2">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Hash:
                </span>
                <div className="font-mono break-all text-xs mt-1">{selectedLog.hash}</div>
              </div>
              <div className="md:col-span-2">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Digital Signature:
                </span>
                <div className="font-mono break-all text-xs mt-1">{selectedLog.signature}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

