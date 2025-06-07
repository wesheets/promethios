import { useState, useEffect } from 'react';

/**
 * Custom hook for persisting state in localStorage
 * 
 * @param key - The localStorage key to store the value under
 * @param initialValue - The initial value to use if no value is found in localStorage
 * @returns A stateful value and a function to update it, with automatic localStorage persistence
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Get from localStorage on initial render, falling back to initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  // Update localStorage when the state changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  return [storedValue, setStoredValue];
}

export default useLocalStorage;
