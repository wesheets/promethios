import React from 'react';
import { useGamification } from '../../context/GamificationContext';

/**
 * Trust Rewards Notification
 * 
 * Shows floating notifications when users earn trust points or unlock achievements.
 */
interface TrustRewardsNotificationProps {
  isVisible: boolean;
  type: 'achievement' | 'trust_points' | 'feature_unlock';
  title: string;
  description: string;
  icon: string;
  points?: number;
  onClose: () => void;
}

const TrustRewardsNotification: React.FC<TrustRewardsNotificationProps> = ({
  isVisible,
  type,
  title,
  description,
  icon,
  points,
  onClose
}) => {
  if (!isVisible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'achievement':
        return 'from-yellow-600 to-orange-600';
      case 'trust_points':
        return 'from-blue-600 to-purple-600';
      case 'feature_unlock':
        return 'from-green-600 to-emerald-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
      <div className={`bg-gradient-to-r ${getBackgroundColor()} rounded-xl shadow-2xl border border-white/20 p-4 max-w-sm`}>
        <div className="flex items-start">
          <div className="text-3xl mr-3">{icon}</div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm mb-1">
              {title}
              {points && (
                <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                  +{points} Trust Points
                </span>
              )}
            </h3>
            <p className="text-white/90 text-xs leading-relaxed">
              {description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors ml-2"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Progress Indicator
 * 
 * Shows user's current trust points and next unlockable feature.
 */
const ProgressIndicator: React.FC = () => {
  const { totalTrustPoints, getNextUnlockable } = useGamification();
  const nextUnlockable = getNextUnlockable();

  return (
    <div className="fixed top-6 left-6 z-40">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-700 p-4 min-w-[200px]">
        {/* Trust Points */}
        <div className="flex items-center mb-3">
          <div className="text-2xl mr-2">🪙</div>
          <div>
            <div className="text-white font-semibold text-sm">Trust Points</div>
            <div className="text-blue-400 font-bold text-lg">{totalTrustPoints}</div>
          </div>
        </div>

        {/* Next Unlockable */}
        {nextUnlockable && (
          <div className="border-t border-gray-700 pt-3">
            <div className="text-gray-400 text-xs mb-1">Next Unlock:</div>
            <div className="flex items-center">
              <div className="text-lg mr-2">{nextUnlockable.icon}</div>
              <div>
                <div className="text-white text-xs font-medium">{nextUnlockable.name}</div>
                <div className="text-gray-400 text-xs">{nextUnlockable.requirement}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Achievement Celebration
 * 
 * Full-screen celebration animation for major achievements.
 */
interface AchievementCelebrationProps {
  isVisible: boolean;
  achievement: {
    title: string;
    description: string;
    icon: string;
    trustPoints: number;
  } | null;
  onClose: () => void;
}

const AchievementCelebration: React.FC<AchievementCelebrationProps> = ({
  isVisible,
  achievement,
  onClose
}) => {
  if (!isVisible || !achievement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center animate-bounce-in">
        <div className="text-8xl mb-4 animate-pulse">{achievement.icon}</div>
        <h2 className="text-3xl font-bold text-white mb-2">Achievement Unlocked!</h2>
        <h3 className="text-xl font-semibold text-yellow-100 mb-3">{achievement.title}</h3>
        <p className="text-white/90 mb-4">{achievement.description}</p>
        
        <div className="bg-white/20 rounded-lg p-3 mb-6">
          <div className="text-yellow-100 text-sm">Trust Points Earned</div>
          <div className="text-white text-2xl font-bold">+{achievement.trustPoints}</div>
        </div>

        <button
          onClick={onClose}
          className="px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export { TrustRewardsNotification, ProgressIndicator, AchievementCelebration };

