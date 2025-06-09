import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Gamification Context
 * 
 * Manages unlockables, trust rewards, milestones, and user progression
 * throughout the Promethios experience.
 * 
 * BACKWARD COMPATIBLE: Gracefully handles missing dependencies.
 */
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  trustPoints: number;
  unlockedAt?: Date;
}

interface UnlockableFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  isUnlocked: boolean;
}

interface GamificationContextType {
  // User progress
  totalTrustPoints: number;
  achievements: Achievement[];
  unlockedFeatures: UnlockableFeature[];
  
  // Actions
  awardAchievement: (achievementId: string) => void;
  unlockFeature: (featureId: string) => void;
  addTrustPoints: (points: number, reason: string) => void;
  
  // Getters
  getRecentAchievements: () => Achievement[];
  getNextUnlockable: () => UnlockableFeature | null;
  
  // Backward compatibility
  isAvailable: boolean;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    // Backward compatible fallback
    return {
      totalTrustPoints: 0,
      achievements: [],
      unlockedFeatures: [],
      awardAchievement: () => {},
      unlockFeature: () => {},
      addTrustPoints: () => {},
      getRecentAchievements: () => [],
      getNextUnlockable: () => null,
      isAvailable: false,
    };
  }
  return context;
};

interface GamificationProviderProps {
  children: React.ReactNode;
}

export const GamificationProvider: React.FC<GamificationProviderProps> = ({ children }) => {
  const [totalTrustPoints, setTotalTrustPoints] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first_governance_toggle',
      title: 'Governance Explorer',
      description: 'Experienced the difference between governed and ungoverned AI',
      icon: '🔄',
      trustPoints: 5,
    },
    {
      id: 'first_agent_created',
      title: 'Agent Creator',
      description: 'Successfully wrapped your first AI agent with governance',
      icon: '🤖',
      trustPoints: 10,
    },
    {
      id: 'first_team_created',
      title: 'Team Builder',
      description: 'Created your first multi-agent team',
      icon: '👥',
      trustPoints: 15,
    },
    {
      id: 'governance_expert',
      title: 'Governance Expert',
      description: 'Tested governance across multiple scenarios',
      icon: '🛡️',
      trustPoints: 20,
    },
    {
      id: 'deployment_master',
      title: 'Deployment Master',
      description: 'Generated your first production deployment package',
      icon: '🚀',
      trustPoints: 25,
    },
  ]);

  const [unlockedFeatures, setUnlockedFeatures] = useState<UnlockableFeature[]>([
    {
      id: 'agent_creation',
      name: 'Agent Creation',
      description: 'Wrap individual AI agents with governance',
      icon: '🤖',
      requirement: 'Complete onboarding',
      isUnlocked: false,
    },
    {
      id: 'team_management',
      name: 'Team Management',
      description: 'Create and manage multi-agent teams',
      icon: '👥',
      requirement: 'Create your first agent',
      isUnlocked: false,
    },
    {
      id: 'governance_testing',
      name: 'Governance Testing',
      description: 'Compare governed vs ungoverned responses',
      icon: '🔄',
      requirement: 'Create your first agent',
      isUnlocked: false,
    },
    {
      id: 'deployment_system',
      name: 'Deployment System',
      description: 'Export agents for production use',
      icon: '🚀',
      requirement: 'Create a team or test governance',
      isUnlocked: false,
    },
    {
      id: 'advanced_analytics',
      name: 'Advanced Analytics',
      description: 'Deep insights into governance metrics',
      icon: '📊',
      requirement: 'Generate your first deployment',
      isUnlocked: false,
    },
  ]);

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('promethios_gamification');
    if (savedProgress) {
      try {
        const data = JSON.parse(savedProgress);
        setTotalTrustPoints(data.totalTrustPoints || 0);
        setAchievements(prev => prev.map(achievement => ({
          ...achievement,
          unlockedAt: data.achievements?.[achievement.id] ? new Date(data.achievements[achievement.id]) : undefined
        })));
        setUnlockedFeatures(prev => prev.map(feature => ({
          ...feature,
          isUnlocked: data.unlockedFeatures?.[feature.id] || false
        })));
      } catch (error) {
        console.error('Failed to load gamification progress:', error);
      }
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (newTrustPoints: number, newAchievements: Achievement[], newFeatures: UnlockableFeature[]) => {
    const progressData = {
      totalTrustPoints: newTrustPoints,
      achievements: Object.fromEntries(
        newAchievements.filter(a => a.unlockedAt).map(a => [a.id, a.unlockedAt!.toISOString()])
      ),
      unlockedFeatures: Object.fromEntries(
        newFeatures.map(f => [f.id, f.isUnlocked])
      ),
    };
    localStorage.setItem('promethios_gamification', JSON.stringify(progressData));
  };

  const awardAchievement = (achievementId: string) => {
    setAchievements(prev => {
      const updated = prev.map(achievement => 
        achievement.id === achievementId && !achievement.unlockedAt
          ? { ...achievement, unlockedAt: new Date() }
          : achievement
      );
      
      const achievement = updated.find(a => a.id === achievementId);
      if (achievement && achievement.unlockedAt) {
        const newTrustPoints = totalTrustPoints + achievement.trustPoints;
        setTotalTrustPoints(newTrustPoints);
        saveProgress(newTrustPoints, updated, unlockedFeatures);
        
        // Show celebration notification
        console.log(`🎉 Achievement unlocked: ${achievement.title} (+${achievement.trustPoints} Trust Points)`);
      }
      
      return updated;
    });
  };

  const unlockFeature = (featureId: string) => {
    setUnlockedFeatures(prev => {
      const updated = prev.map(feature =>
        feature.id === featureId ? { ...feature, isUnlocked: true } : feature
      );
      saveProgress(totalTrustPoints, achievements, updated);
      
      const feature = updated.find(f => f.id === featureId);
      if (feature) {
        console.log(`🔓 Feature unlocked: ${feature.name}`);
      }
      
      return updated;
    });
  };

  const addTrustPoints = (points: number, reason: string) => {
    const newTotal = totalTrustPoints + points;
    setTotalTrustPoints(newTotal);
    saveProgress(newTotal, achievements, unlockedFeatures);
    console.log(`🪙 +${points} Trust Points: ${reason}`);
  };

  const getRecentAchievements = (): Achievement[] => {
    return achievements
      .filter(a => a.unlockedAt)
      .sort((a, b) => (b.unlockedAt!.getTime() - a.unlockedAt!.getTime()))
      .slice(0, 3);
  };

  const getNextUnlockable = (): UnlockableFeature | null => {
    return unlockedFeatures.find(f => !f.isUnlocked) || null;
  };

  const value = {
    totalTrustPoints,
    achievements,
    unlockedFeatures,
    awardAchievement,
    unlockFeature,
    addTrustPoints,
    getRecentAchievements,
    getNextUnlockable,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export default GamificationProvider;

