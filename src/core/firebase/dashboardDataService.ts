/**
 * Firebase Data Service for Promethios Admin Dashboard
 * 
 * DISABLED: This Firebase data service has been disabled to prevent conflicts
 * with the main application Firebase instance in /phase_7_1_prototype/
 * 
 * This service provides data management functionality for the admin dashboard,
 * including metrics storage, agent data, and dashboard configuration.
 */

// FIREBASE DISABLED - Preventing conflicts with main app
console.warn('Firebase dashboardDataService in /src/ directory has been disabled to prevent conflicts with main app');

// Commented out to prevent Firebase initialization conflicts
/*
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { firestore } from './firebaseConfig';

// ... rest of the original service code would be here but is commented out
*/

// Provide mock exports to prevent import errors
export const dashboardDataService = {
  saveMetrics: () => Promise.reject(new Error('Firebase dashboardDataService disabled')),
  getMetrics: () => Promise.reject(new Error('Firebase dashboardDataService disabled')),
  saveAgentData: () => Promise.reject(new Error('Firebase dashboardDataService disabled')),
  getAgentData: () => Promise.reject(new Error('Firebase dashboardDataService disabled'))
};

