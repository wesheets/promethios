import React from 'react';
import { useUserPreferences } from '../../context/UserPreferencesContext';

/**
 * Settings Panel
 * 
 * Allows users to customize their Promethios experience,
 * including disabling gamification, observer, and other features.
 */
const SettingsPanel: React.FC = () => {
  const { preferences, updatePreference, enableMinimalMode, enableFullExperience, resetToDefaults } = useUserPreferences();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Customize your Promethios experience</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Experience Level */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Experience Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={enableFullExperience}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferences.experienceLevel === 'beginner'
                    ? 'border-green-500 bg-green-500/20'
                    : 'border-gray-600 hover:border-green-400'
                }`}
              >
                <div className="text-2xl mb-2">🌱</div>
                <div className="text-white font-semibold">Beginner</div>
                <div className="text-gray-400 text-sm">Full guidance and tips</div>
              </button>
              
              <button
                onClick={() => updatePreference('experienceLevel', 'intermediate')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferences.experienceLevel === 'intermediate'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-600 hover:border-blue-400'
                }`}
              >
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-white font-semibold">Intermediate</div>
                <div className="text-gray-400 text-sm">Some guidance, faster pace</div>
              </button>
              
              <button
                onClick={enableMinimalMode}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferences.experienceLevel === 'expert'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-600 hover:border-purple-400'
                }`}
              >
                <div className="text-2xl mb-2">🚀</div>
                <div className="text-white font-semibold">Expert</div>
                <div className="text-gray-400 text-sm">Minimal interface</div>
              </button>
            </div>
          </div>

          {/* Feature Toggles */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Features</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <div className="text-white font-medium">🦉 AI Companion (Hovering Observer)</div>
                  <div className="text-gray-400 text-sm">Intelligent assistant that helps throughout the app</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.enableHoveringObserver}
                    onChange={(e) => updatePreference('enableHoveringObserver', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <div className="text-white font-medium">🎮 Gamification & Rewards</div>
                  <div className="text-gray-400 text-sm">Trust points, achievements, and progress tracking</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.enableGamification}
                    onChange={(e) => updatePreference('enableGamification', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <div className="text-white font-medium">📊 Progress Indicator</div>
                  <div className="text-gray-400 text-sm">Show trust points and next unlockables</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.showProgressIndicator}
                    onChange={(e) => updatePreference('showProgressIndicator', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <div className="text-white font-medium">💡 Tooltips & Hints</div>
                  <div className="text-gray-400 text-sm">Show helpful tips and explanations</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.showTooltips}
                    onChange={(e) => updatePreference('showTooltips', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Reset to Defaults
              </button>
              <button
                onClick={() => updatePreference('hasCompletedOnboarding', false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Restart Onboarding
              </button>
            </div>
          </div>

          {/* Current Status */}
          <div className="p-4 bg-gray-700 rounded-lg">
            <h3 className="text-white font-medium mb-2">Current Configuration</h3>
            <div className="text-sm text-gray-400 space-y-1">
              <div>Experience Level: <span className="text-white">{preferences.experienceLevel}</span></div>
              <div>Onboarding: <span className="text-white">{preferences.hasCompletedOnboarding ? 'Completed' : 'Not completed'}</span></div>
              <div>Features Enabled: <span className="text-white">
                {[
                  preferences.enableGamification && 'Gamification',
                  preferences.enableHoveringObserver && 'AI Companion',
                  preferences.showProgressIndicator && 'Progress',
                  preferences.showTooltips && 'Tooltips'
                ].filter(Boolean).join(', ') || 'None'}
              </span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;

