/**
 * Observer Agent Settings Component
 * 
 * Provides user interface for controlling Observer Agent preferences
 */

import React from 'react';
import { 
  CogIcon, 
  XMarkIcon,
  BellIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useObserverPreferences } from '../hooks/useObserverPreferences';

interface ObserverSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ObserverSettings: React.FC<ObserverSettingsProps> = ({ isOpen, onClose }) => {
  const { preferences, updatePreference, resetPreferences } = useObserverPreferences();

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CogIcon className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-medium">Observer Settings</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        
        {/* Pulsing Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-5 h-5 text-blue-400" />
            <h4 className="text-white font-medium">Pulsing Notifications</h4>
          </div>
          
          <div className="space-y-3 ml-7">
            {/* Enable Pulsing */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Enable Pulsing</p>
                <p className="text-xs text-gray-400">Gentle pulse when navigating to new pages</p>
              </div>
              <button
                onClick={() => updatePreference('pulsingEnabled', !preferences.pulsingEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  preferences.pulsingEnabled ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  preferences.pulsingEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Pulse Intensity */}
            <div className="space-y-2">
              <p className="text-sm text-white">Pulse Intensity</p>
              <div className="flex space-x-2">
                {(['subtle', 'normal', 'strong'] as const).map((intensity) => (
                  <button
                    key={intensity}
                    onClick={() => updatePreference('pulseIntensity', intensity)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      preferences.pulseIntensity === intensity
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Pulse Frequency */}
            <div className="space-y-2">
              <p className="text-sm text-white">Pulse Frequency</p>
              <div className="flex space-x-2">
                {(['low', 'normal', 'high'] as const).map((frequency) => (
                  <button
                    key={frequency}
                    onClick={() => updatePreference('pulseFrequency', frequency)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      preferences.pulseFrequency === frequency
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Behavior Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <EyeIcon className="w-5 h-5 text-blue-400" />
            <h4 className="text-white font-medium">Behavior</h4>
          </div>
          
          <div className="space-y-3 ml-7">
            {/* Auto Expand */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Auto Expand</p>
                <p className="text-xs text-gray-400">Automatically expand when suggestions are available</p>
              </div>
              <button
                onClick={() => updatePreference('autoExpand', !preferences.autoExpand)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  preferences.autoExpand ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  preferences.autoExpand ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Contextual Suggestions */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Contextual Suggestions</p>
                <p className="text-xs text-gray-400">Show page-specific recommendations</p>
              </div>
              <button
                onClick={() => updatePreference('contextualSuggestions', !preferences.contextualSuggestions)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  preferences.contextualSuggestions ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  preferences.contextualSuggestions ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Reset Settings */}
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={resetPreferences}
            className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObserverSettings;

