/**
 * Firebase RBAC (Role-Based Access Control) Service for Promethios
 * 
 * This service provides role-based access control functionality for the Promethios application,
 * including role management, permission checking, and user role assignment.
 */

import { User } from 'firebase/auth';
import { 
  doc, 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { firestore } from './firebaseConfig';
import { UserRole } from './authService';

// Permission interface
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

// Role interface
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all available roles
 * @returns Promise<Role[]>
 */
export const getAllRoles = async (): Promise<Role[]> => {
  const rolesSnapshot = await getDocs(collection(firestore, 'roles'));
  return rolesSnapshot.docs.map(doc => doc.data() as Role);
};

/**
 * Get role by ID
 * @param roleId Role ID
 * @returns Promise<Role | null>
 */
export const getRoleById = async (roleId: string): Promise<Role | null> => {
  const roleDoc = await getDoc(doc(firestore, 'roles', roleId));
  if (roleDoc.exists()) {
    return roleDoc.data() as Role;
  }
  return null;
};

/**
 * Create a new role
 * @param role Role data
 * @returns Promise<string> Role ID
 */
export const createRole = async (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const roleId = role.name.toLowerCase().replace(/\s+/g, '_');
  const timestamp = new Date();
  
  const newRole: Role = {
    ...role,
    id: roleId,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  await setDoc(doc(firestore, 'roles', roleId), newRole);
  return roleId;
};

/**
 * Update an existing role
 * @param roleId Role ID
 * @param roleData Updated role data
 */
export const updateRole = async (
  roleId: string, 
  roleData: Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  const roleRef = doc(firestore, 'roles', roleId);
  await updateDoc(roleRef, {
    ...roleData,
    updatedAt: new Date()
  });
};

/**
 * Delete a role
 * @param roleId Role ID
 */
export const deleteRole = async (roleId: string): Promise<void> => {
  // First, remove this role from all users who have it
  const usersWithRoleQuery = query(
    collection(firestore, 'users'),
    where('roles', 'array-contains', roleId)
  );
  
  const usersWithRole = await getDocs(usersWithRoleQuery);
  
  // Update each user to remove the role
  const userUpdates = usersWithRole.docs.map(userDoc => {
    const userRef = doc(firestore, 'users', userDoc.id);
    return updateDoc(userRef, {
      roles: arrayRemove(roleId)
    });
  });
  
  // Wait for all user updates to complete
  await Promise.all(userUpdates);
  
  // Then delete the role
  await firestore.collection('roles').doc(roleId).delete();
};

/**
 * Assign a role to a user
 * @param userId User ID
 * @param roleId Role ID
 */
export const assignRoleToUser = async (userId: string, roleId: string): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    roles: arrayUnion(roleId)
  });
};

/**
 * Remove a role from a user
 * @param userId User ID
 * @param roleId Role ID
 */
export const removeRoleFromUser = async (userId: string, roleId: string): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    roles: arrayRemove(roleId)
  });
};

/**
 * Check if a user has a specific permission
 * @param user Firebase User
 * @param permissionId Permission ID
 * @returns Promise<boolean>
 */
export const hasPermission = async (user: User, permissionId: string): Promise<boolean> => {
  // Get user roles
  const userDoc = await getDoc(doc(firestore, 'users', user.uid));
  if (!userDoc.exists()) {
    return false;
  }
  
  const userData = userDoc.data();
  const userRoles = userData.roles || [];
  
  // Admin role has all permissions
  if (userRoles.includes('admin')) {
    return true;
  }
  
  // Check each role for the permission
  for (const roleId of userRoles) {
    const roleDoc = await getDoc(doc(firestore, 'roles', roleId));
    if (roleDoc.exists()) {
      const roleData = roleDoc.data() as Role;
      if (roleData.permissions.includes(permissionId)) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Get all permissions for a user
 * @param user Firebase User
 * @returns Promise<string[]> Array of permission IDs
 */
export const getUserPermissions = async (user: User): Promise<string[]> => {
  // Get user roles
  const userDoc = await getDoc(doc(firestore, 'users', user.uid));
  if (!userDoc.exists()) {
    return [];
  }
  
  const userData = userDoc.data();
  const userRoles = userData.roles || [];
  
  // Admin role has all permissions
  if (userRoles.includes('admin')) {
    // Get all available permissions
    const permissionsSnapshot = await getDocs(collection(firestore, 'permissions'));
    return permissionsSnapshot.docs.map(doc => doc.id);
  }
  
  // Collect permissions from all roles
  const permissions = new Set<string>();
  
  for (const roleId of userRoles) {
    const roleDoc = await getDoc(doc(firestore, 'roles', roleId));
    if (roleDoc.exists()) {
      const roleData = roleDoc.data() as Role;
      roleData.permissions.forEach(permissionId => permissions.add(permissionId));
    }
  }
  
  return Array.from(permissions);
};

export default {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignRoleToUser,
  removeRoleFromUser,
  hasPermission,
  getUserPermissions
};
