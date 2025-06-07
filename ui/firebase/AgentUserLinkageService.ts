import React from 'react';
import styled from 'styled-components';
import { useObserver } from '../components/observer/ObserverContext';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Types
interface AgentUserLinkageServiceProps {
  className?: string;
}

// Firebase service for Agent-User linkage
export const AgentUserLinkageService = {
  // Save agent configuration to Firebase
  saveAgentConfiguration: async (
    userId: string,
    agentId: string,
    agentConfig: any
  ) => {
    try {
      const agentDocRef = doc(db, 'users', userId, 'agents', agentId);
      
      // Check if agent already exists
      const agentDoc = await getDoc(agentDocRef);
      
      if (agentDoc.exists()) {
        // Update agent configuration
        await updateDoc(agentDocRef, {
          ...agentConfig,
          updatedAt: new Date()
        });
      } else {
        // Create new agent configuration
        await setDoc(agentDocRef, {
          ...agentConfig,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      return agentId;
    } catch (error) {
      console.error('Error saving agent configuration:', error);
      throw error;
    }
  },
  
  // Get agent configuration from Firebase
  getAgentConfiguration: async (userId: string, agentId: string) => {
    try {
      const agentDocRef = doc(db, 'users', userId, 'agents', agentId);
      const agentDoc = await getDoc(agentDocRef);
      
      if (agentDoc.exists()) {
        return agentDoc.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting agent configuration:', error);
      throw error;
    }
  },
  
  // Get all agent configurations for a user
  getUserAgents: async (userId: string) => {
    try {
      const agentsCollectionRef = doc(db, 'users', userId, 'agents');
      const agentsSnapshot = await getDoc(agentsCollectionRef);
      
      if (agentsSnapshot.exists()) {
        return Object.entries(agentsSnapshot.data()).map(([id, data]) => ({
          id,
          ...data
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error getting user agents:', error);
      throw error;
    }
  },
  
  // Save multi-agent configuration to Firebase
  saveMultiAgentConfiguration: async (
    userId: string,
    configId: string,
    agentIds: string[],
    relationships: any[]
  ) => {
    try {
      const configDocRef = doc(db, 'users', userId, 'multiAgentConfigs', configId);
      
      // Check if configuration already exists
      const configDoc = await getDoc(configDocRef);
      
      const configData = {
        agentIds,
        relationships,
        updatedAt: new Date()
      };
      
      if (configDoc.exists()) {
        // Update configuration
        await updateDoc(configDocRef, configData);
      } else {
        // Create new configuration
        await setDoc(configDocRef, {
          ...configData,
          createdAt: new Date()
        });
      }
      
      return configId;
    } catch (error) {
      console.error('Error saving multi-agent configuration:', error);
      throw error;
    }
  },
  
  // Get multi-agent configuration from Firebase
  getMultiAgentConfiguration: async (userId: string, configId: string) => {
    try {
      const configDocRef = doc(db, 'users', userId, 'multiAgentConfigs', configId);
      const configDoc = await getDoc(configDocRef);
      
      if (configDoc.exists()) {
        return configDoc.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting multi-agent configuration:', error);
      throw error;
    }
  },
  
  // Get all multi-agent configurations for a user
  getUserMultiAgentConfigs: async (userId: string) => {
    try {
      const configsCollectionRef = doc(db, 'users', userId, 'multiAgentConfigs');
      const configsSnapshot = await getDoc(configsCollectionRef);
      
      if (configsSnapshot.exists()) {
        return Object.entries(configsSnapshot.data()).map(([id, data]) => ({
          id,
          ...data
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error getting user multi-agent configurations:', error);
      throw error;
    }
  }
};

export default AgentUserLinkageService;
