/**
 * Agent User Linkage Service
 * 
 * DISABLED: This Firebase service has been disabled to prevent conflicts
 * with the main application Firebase instance in /phase_7_1_prototype/
 */

// FIREBASE DISABLED - Preventing conflicts with main app
console.warn('AgentUserLinkageService in /ui/ directory has been disabled to prevent conflicts with main app');

// Commented out to prevent Firebase initialization conflicts
/*
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
    // ... original implementation
  }
};
*/

// Provide mock exports to prevent import errors
export const AgentUserLinkageService = {
  saveAgentConfiguration: () => Promise.reject(new Error('AgentUserLinkageService disabled')),
  getAgentConfiguration: () => Promise.reject(new Error('AgentUserLinkageService disabled')),
  linkAgentToUser: () => Promise.reject(new Error('AgentUserLinkageService disabled'))
};

