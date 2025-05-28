import React, { useState } from 'react';

interface ConfigPlaygroundProps {
  config: {
    prism: {
      traceValidationLevel: string;
      manifestValidationLevel: string;
      samplingRate: number;
    };
    vigil: {
      driftThreshold: number;
      trustScoreMinimum: number;
      unreflectedFailureLimit: number;
    };
  };
  onConfigChange: (newConfig: any) => void;
}

const ConfigPlayground: React.FC<ConfigPlaygroundProps> = ({ config, onConfigChange }) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [activeTab, setActiveTab] = useState<'prism' | 'vigil'>('prism');

  const handleChange = (observer: 'prism' | 'vigil', setting: string, value: any) => {
    const newConfig = {
      ...localConfig,
      [observer]: {
        ...localConfig[observer],
        [setting]: value
      }
    };
    
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handlePresetSelect = (preset: string) => {
    let newConfig;
    
    switch (preset) {
      case 'strict':
        newConfig = {
          prism: {
            traceValidationLevel: 'strict',
            manifestValidationLevel: 'strict',
            samplingRate: 100
          },
          vigil: {
            driftThreshold: 10,
            trustScoreMinimum: 90,
            unreflectedFailureLimit: 1
          }
        };
        break;
      case 'balanced':
        newConfig = {
          prism: {
            traceValidationLevel: 'standard',
            manifestValidationLevel: 'standard',
            samplingRate: 80
          },
          vigil: {
            driftThreshold: 20,
            trustScoreMinimum: 70,
            unreflectedFailureLimit: 3
          }
        };
        break;
      case 'lenient':
        newConfig = {
          prism: {
            traceValidationLevel: 'lenient',
            manifestValidationLevel: 'lenient',
            samplingRate: 50
          },
          vigil: {
            driftThreshold: 30,
            trustScoreMinimum: 50,
            unreflectedFailureLimit: 5
          }
        };
        break;
      default:
        return;
    }
    
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Governance Configuration Playground
      </h2>
      
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        Adjust governance settings to see how they affect the wrapped agent's behavior and metrics.
        Changes take effect immediately and will impact future interactions.
      </p>
      
      {/* Preset Buttons */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Configuration Presets
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handlePresetSelect('strict')}
            className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            Strict Governance
          </button>
          <button
            onClick={() => handlePresetSelect('balanced')}
            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            Balanced Monitoring
          </button>
          <button
            onClick={() => handlePresetSelect('lenient')}
            className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            Lenient Oversight
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('prism')}
            className={`py-2 px-1 text-sm font-medium ${
              activeTab === 'prism'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            PRISM Observer
          </button>
          <button
            onClick={() => setActiveTab('vigil')}
            className={`py-2 px-1 text-sm font-medium ${
              activeTab === 'vigil'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Vigil Observer
          </button>
        </nav>
      </div>
      
      {/* PRISM Configuration */}
      {activeTab === 'prism' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trace Validation Level
            </label>
            <select
              value={localConfig.prism.traceValidationLevel}
              onChange={(e) => handleChange('prism', 'traceValidationLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="strict">Strict - Require detailed source citations</option>
              <option value="standard">Standard - Balanced approach to validation</option>
              <option value="lenient">Lenient - Allow more flexibility in responses</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Controls how strictly the agent's belief traces are validated
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Manifest Validation Level
            </label>
            <select
              value={localConfig.prism.manifestValidationLevel}
              onChange={(e) => handleChange('prism', 'manifestValidationLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="strict">Strict - Require complete manifest compliance</option>
              <option value="standard">Standard - Balanced approach to validation</option>
              <option value="lenient">Lenient - Allow more flexibility in manifests</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Controls how strictly the agent's capability manifests are validated
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sampling Rate: {localConfig.prism.samplingRate}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={localConfig.prism.samplingRate}
              onChange={(e) => handleChange('prism', 'samplingRate', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>10%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Percentage of agent responses that are validated (higher values increase computational cost)
            </p>
          </div>
        </div>
      )}
      
      {/* Vigil Configuration */}
      {activeTab === 'vigil' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Drift Threshold: {localConfig.vigil.driftThreshold}%
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={localConfig.vigil.driftThreshold}
              onChange={(e) => handleChange('vigil', 'driftThreshold', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>5%</span>
              <span>25%</span>
              <span>50%</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Maximum allowed drift before triggering a violation (lower values are more strict)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trust Score Minimum: {localConfig.vigil.trustScoreMinimum}%
            </label>
            <input
              type="range"
              min="30"
              max="95"
              step="5"
              value={localConfig.vigil.trustScoreMinimum}
              onChange={(e) => handleChange('vigil', 'trustScoreMinimum', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>30%</span>
              <span>60%</span>
              <span>95%</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Minimum trust score required before triggering a violation (higher values are more strict)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unreflected Failure Limit
            </label>
            <select
              value={localConfig.vigil.unreflectedFailureLimit}
              onChange={(e) => handleChange('vigil', 'unreflectedFailureLimit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="1">1 - Very strict (any failure triggers violation)</option>
              <option value="3">3 - Balanced approach</option>
              <option value="5">5 - More lenient</option>
              <option value="10">10 - Very lenient</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Number of unreflected failures allowed before triggering a violation
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
          Configuration Impact
        </h3>
        <p className="text-xs text-yellow-700 dark:text-yellow-400">
          Changes to these settings will affect how the wrapped agent behaves in future interactions.
          Try chatting with the agent after changing settings to see the impact on responses and metrics.
        </p>
        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
          Tip: Try typing <code>/explain_governance</code> to have the agent explain how it's being monitored with the current settings.
        </p>
      </div>
    </div>
  );
};

export default ConfigPlayground;
