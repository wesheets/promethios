/**
 * VERITAS React Hooks
 * 
 * This module provides React hooks for using VERITAS verification in UI components.
 * It implements hooks for text verification and claim validation.
 */

import { useState, useEffect } from 'react';
import { VeritasOptions, VerificationResult, ClaimValidation } from '../types';
import veritasService from '../services/veritasService';

/**
 * Hook for verifying text with VERITAS
 * @param text The text to verify
 * @param options Verification options
 * @returns Verification state and controls
 */
export function useVeritas(
  text: string | null | undefined,
  options: VeritasOptions = {}
) {
  const [results, setResults] = useState<VerificationResult | null>(null);
  const [claims, setClaims] = useState<ClaimValidation[]>([]);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Verify text when it changes
  useEffect(() => {
    // Reset state when text changes
    setResults(null);
    setClaims([]);
    setError(null);
    
    // Skip verification if text is empty
    if (!text) {
      return;
    }
    
    // Start verification
    setIsVerifying(true);
    
    // Verify text
    veritasService.verifyText(text, options)
      .then(result => {
        setResults(result);
        setClaims(result.claims);
        setIsVerifying(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsVerifying(false);
      });
  }, [text, JSON.stringify(options)]);
  
  // Function to manually trigger verification
  const verify = async (newText?: string) => {
    try {
      setIsVerifying(true);
      setError(null);
      
      const textToVerify = newText || text;
      
      if (!textToVerify) {
        throw new Error('No text provided for verification');
      }
      
      const result = await veritasService.verifyText(textToVerify, options);
      setResults(result);
      setClaims(result.claims);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsVerifying(false);
    }
  };
  
  return {
    results,
    claims,
    isVerifying,
    error,
    verify
  };
}

/**
 * Hook for validating individual claims
 * @param claim The claim to validate
 * @param options Verification options
 * @returns Claim validation state and controls
 */
export function useClaimValidation(
  claim: string | null | undefined,
  options: VeritasOptions = {}
) {
  const [validation, setValidation] = useState<ClaimValidation | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Validate claim when it changes
  useEffect(() => {
    // Reset state when claim changes
    setValidation(null);
    setError(null);
    
    // Skip validation if claim is empty
    if (!claim) {
      return;
    }
    
    // Start validation
    setIsValidating(true);
    
    // Verify text (which will extract and validate the claim)
    veritasService.verifyText(claim, options)
      .then(result => {
        // Get the first claim from the result
        if (result.claims.length > 0) {
          setValidation(result.claims[0]);
        } else {
          setValidation(null);
        }
        setIsValidating(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsValidating(false);
      });
  }, [claim, JSON.stringify(options)]);
  
  // Function to manually trigger validation
  const validate = async (newClaim?: string) => {
    try {
      setIsValidating(true);
      setError(null);
      
      const claimToValidate = newClaim || claim;
      
      if (!claimToValidate) {
        throw new Error('No claim provided for validation');
      }
      
      const result = await veritasService.verifyText(claimToValidate, options);
      
      // Get the first claim from the result
      if (result.claims.length > 0) {
        setValidation(result.claims[0]);
        return result.claims[0];
      } else {
        setValidation(null);
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsValidating(false);
    }
  };
  
  return {
    validation,
    isValidating,
    error,
    validate
  };
}
