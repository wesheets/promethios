/**
 * Firebase Data Service for Promethios Admin Dashboard
 * 
 * This service provides data management functionality for the admin dashboard,
 * including metrics storage, agent data, and dashboard configuration.
 */

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

// Metric types
export type MetricType = 'emotional' | 'trust' | 'compliance' | 'performance';

// Metric data interface
export interface MetricData {
  id: string;
  type: MetricType;
  value: number;
  timestamp: Date;
  agentId?: string;
  userId?: string;
  systemId?: string;
  metadata?: Record<string, any>;
}

// Agent data interface
export interface AgentData {
  id: string;
  name: string;
  description?: string;
  userId: string;
  systemId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
  configuration?: Record<string, any>;
  metrics?: Record<string, number>;
}

// Agent system interface
export interface AgentSystem {
  id: string;
  name: string;
  description?: string;
  userId: string;
  agents: string[]; // Agent IDs
  createdAt: Date;
  updatedAt: Date;
  configuration?: Record<string, any>;
  metrics?: Record<string, number>;
}

// Dashboard configuration interface
export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Store metric data
 * @param metricData Metric data to store
 * @returns Promise<string> Metric ID
 */
export const storeMetricData = async (metricData: Omit<MetricData, 'id'>): Promise<string> => {
  const metricsCollection = collection(firestore, 'metrics');
  const metricDoc = doc(metricsCollection);
  const id = metricDoc.id;
  
  await setDoc(metricDoc, {
    ...metricData,
    id,
    timestamp: Timestamp.fromDate(metricData.timestamp)
  });
  
  return id;
};

/**
 * Get metrics by type
 * @param type Metric type
 * @param limit Maximum number of metrics to retrieve
 * @returns Promise<MetricData[]>
 */
export const getMetricsByType = async (type: MetricType, limitCount = 100): Promise<MetricData[]> => {
  const metricsQuery = query(
    collection(firestore, 'metrics'),
    where('type', '==', type),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  const metricsSnapshot = await getDocs(metricsQuery);
  
  return metricsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      timestamp: (data.timestamp as Timestamp).toDate()
    } as MetricData;
  });
};

/**
 * Get metrics for a specific agent
 * @param agentId Agent ID
 * @param type Optional metric type filter
 * @param limitCount Maximum number of metrics to retrieve
 * @returns Promise<MetricData[]>
 */
export const getAgentMetrics = async (
  agentId: string, 
  type?: MetricType, 
  limitCount = 100
): Promise<MetricData[]> => {
  let metricsQuery;
  
  if (type) {
    metricsQuery = query(
      collection(firestore, 'metrics'),
      where('agentId', '==', agentId),
      where('type', '==', type),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
  } else {
    metricsQuery = query(
      collection(firestore, 'metrics'),
      where('agentId', '==', agentId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
  }
  
  const metricsSnapshot = await getDocs(metricsQuery);
  
  return metricsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      timestamp: (data.timestamp as Timestamp).toDate()
    } as MetricData;
  });
};

/**
 * Get metrics for a specific user's agents
 * @param userId User ID
 * @param type Optional metric type filter
 * @param limitCount Maximum number of metrics to retrieve
 * @returns Promise<MetricData[]>
 */
export const getUserAgentMetrics = async (
  userId: string, 
  type?: MetricType, 
  limitCount = 100
): Promise<MetricData[]> => {
  let metricsQuery;
  
  if (type) {
    metricsQuery = query(
      collection(firestore, 'metrics'),
      where('userId', '==', userId),
      where('type', '==', type),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
  } else {
    metricsQuery = query(
      collection(firestore, 'metrics'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
  }
  
  const metricsSnapshot = await getDocs(metricsQuery);
  
  return metricsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      timestamp: (data.timestamp as Timestamp).toDate()
    } as MetricData;
  });
};

/**
 * Store or update agent data
 * @param agentData Agent data
 * @returns Promise<void>
 */
export const storeAgentData = async (agentData: AgentData): Promise<void> => {
  const agentRef = doc(firestore, `users/${agentData.userId}/agents/${agentData.id}`);
  
  // Convert Date objects to Firestore Timestamps
  const firestoreData = {
    ...agentData,
    createdAt: Timestamp.fromDate(agentData.createdAt),
    updatedAt: Timestamp.fromDate(new Date()),
    lastActive: agentData.lastActive ? Timestamp.fromDate(agentData.lastActive) : null
  };
  
  await setDoc(agentRef, firestoreData);
};

/**
 * Get agent data
 * @param userId User ID
 * @param agentId Agent ID
 * @returns Promise<AgentData | null>
 */
export const getAgentData = async (userId: string, agentId: string): Promise<AgentData | null> => {
  const agentRef = doc(firestore, `users/${userId}/agents/${agentId}`);
  const agentDoc = await getDoc(agentRef);
  
  if (!agentDoc.exists()) {
    return null;
  }
  
  const data = agentDoc.data();
  
  return {
    ...data,
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
    lastActive: data.lastActive ? (data.lastActive as Timestamp).toDate() : undefined
  } as AgentData;
};

/**
 * Get all agents for a user
 * @param userId User ID
 * @returns Promise<AgentData[]>
 */
export const getUserAgents = async (userId: string): Promise<AgentData[]> => {
  const agentsQuery = query(collection(firestore, `users/${userId}/agents`));
  const agentsSnapshot = await getDocs(agentsQuery);
  
  return agentsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      lastActive: data.lastActive ? (data.lastActive as Timestamp).toDate() : undefined
    } as AgentData;
  });
};

/**
 * Store or update agent system
 * @param system Agent system data
 * @returns Promise<void>
 */
export const storeAgentSystem = async (system: AgentSystem): Promise<void> => {
  const systemRef = doc(firestore, `users/${system.userId}/agentSystems/${system.id}`);
  
  // Convert Date objects to Firestore Timestamps
  const firestoreData = {
    ...system,
    createdAt: Timestamp.fromDate(system.createdAt),
    updatedAt: Timestamp.fromDate(new Date())
  };
  
  await setDoc(systemRef, firestoreData);
};

/**
 * Get agent system
 * @param userId User ID
 * @param systemId System ID
 * @returns Promise<AgentSystem | null>
 */
export const getAgentSystem = async (userId: string, systemId: string): Promise<AgentSystem | null> => {
  const systemRef = doc(firestore, `users/${userId}/agentSystems/${systemId}`);
  const systemDoc = await getDoc(systemRef);
  
  if (!systemDoc.exists()) {
    return null;
  }
  
  const data = systemDoc.data();
  
  return {
    ...data,
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate()
  } as AgentSystem;
};

/**
 * Get all agent systems for a user
 * @param userId User ID
 * @returns Promise<AgentSystem[]>
 */
export const getUserAgentSystems = async (userId: string): Promise<AgentSystem[]> => {
  const systemsQuery = query(collection(firestore, `users/${userId}/agentSystems`));
  const systemsSnapshot = await getDocs(systemsQuery);
  
  return systemsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate()
    } as AgentSystem;
  });
};

/**
 * Store dashboard configuration
 * @param config Dashboard configuration
 * @returns Promise<void>
 */
export const storeDashboardConfig = async (config: DashboardConfig): Promise<void> => {
  const configRef = doc(firestore, `dashboardConfig/${config.id}`);
  
  // Convert Date objects to Firestore Timestamps
  const firestoreData = {
    ...config,
    createdAt: Timestamp.fromDate(config.createdAt),
    updatedAt: Timestamp.fromDate(new Date())
  };
  
  await setDoc(configRef, firestoreData);
};

/**
 * Get dashboard configuration
 * @param configId Configuration ID
 * @returns Promise<DashboardConfig | null>
 */
export const getDashboardConfig = async (configId: string): Promise<DashboardConfig | null> => {
  const configRef = doc(firestore, `dashboardConfig/${configId}`);
  const configDoc = await getDoc(configRef);
  
  if (!configDoc.exists()) {
    return null;
  }
  
  const data = configDoc.data();
  
  return {
    ...data,
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate()
  } as DashboardConfig;
};

export default {
  storeMetricData,
  getMetricsByType,
  getAgentMetrics,
  getUserAgentMetrics,
  storeAgentData,
  getAgentData,
  getUserAgents,
  storeAgentSystem,
  getAgentSystem,
  getUserAgentSystems,
  storeDashboardConfig,
  getDashboardConfig
};
