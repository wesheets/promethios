/**
 * Normalize a claim by removing trailing punctuation and quotes
 * @param claim The claim to normalize
 * @returns Normalized claim
 */
function normalizeClaim(claim: string): string {
  if (!claim) return '';
  
  // Remove trailing punctuation (including multiple punctuation marks)
  let normalized = claim.replace(/[.!?;:,]+$/, '');
  
  // Remove any quotes at the beginning and end
  normalized = normalized.replace(/^["'`"']+|["'`"']+$/g, '');
  
  // Normalize whitespace (including non-breaking spaces and other Unicode whitespace)
  normalized = normalized.trim().replace(/\s+/g, ' ');
  
  return normalized;
}

/**
 * Extract key phrases from text
 * @param text The text to extract key phrases from
 * @returns Array of key phrases
 */
export function extractKeyPhrases(text: string): string[] {
  // Handle empty or invalid input
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  // Split into sentences
  const sentences = splitIntoSentences(text);
  
  // Extract noun phrases (simplified)
  const nounPhrases = sentences.flatMap(sentence => {
    // Clean the sentence
    const cleanSentence = sentence.replace(/[^\w\s]/g, ' ').trim();
    const words = cleanSentence.split(/\s+/).filter(w => w.length > 0);
    const phrases: string[] = [];
    
    // Single word fallback for very short sentences
    if (words.length === 1 && words[0].length > 3) {
      return [words[0]];
    }
    
    for (let i = 0; i < words.length - 1; i++) {
      // Look for adjective + noun patterns
      if (isAdjective(words[i]) && isNoun(words[i + 1])) {
        phrases.push(`${words[i]} ${words[i + 1]}`);
      }
      
      // Look for noun + noun patterns
      if (isNoun(words[i]) && isNoun(words[i + 1])) {
        phrases.push(`${words[i]} ${words[i + 1]}`);
      }
      
      // Look for verb + noun patterns (common in actions)
      if (isVerb(words[i]) && isNoun(words[i + 1])) {
        phrases.push(`${words[i]} ${words[i + 1]}`);
      }
    }
    
    return phrases;
  });
  
  // If no phrases were found using the pattern matching, extract important words as fallback
  if (nounPhrases.length === 0) {
    // Extract entities as potential key phrases
    const entities = extractNamedEntities(text);
    const entityPhrases: string[] = [];
    
    // Collect all entity values
    for (const values of entities.values()) {
      entityPhrases.push(...values);
    }
    
    if (entityPhrases.length > 0) {
      return entityPhrases.slice(0, 5);
    }
    
    // If no entities, fall back to important words
    const words = text.split(/\s+/)
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length > 3);
      
    // If we still have no words, return the original text as a single phrase
    if (words.length === 0 && text.trim().length > 0) {
      return [text.trim()];
    }
    
    // Return the 3 longest words as key phrases
    return words.sort((a, b) => b.length - a.length).slice(0, 3);
  }
  
  // Remove duplicates
  return [...new Set(nounPhrases)];
}

/**
 * Check if a word is likely a verb
 * @param word The word to check
 * @returns Whether the word is likely a verb
 */
function isVerb(word: string): boolean {
  // This is a simplified check - in production, this would use POS tagging
  const verbSuffixes = ['ed', 'ing', 'ize', 'ise', 'ate', 'en', 'ify'];
  const commonVerbs = ['is', 'are', 'was', 'were', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 
                      'go', 'see', 'look', 'make', 'take', 'come', 'get', 'give', 'find', 'think',
                      'say', 'use', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call'];
  const lower = word.toLowerCase();
  
  return verbSuffixes.some(suffix => lower.endsWith(suffix)) || commonVerbs.includes(lower);
}

// Placeholder functions that would be implemented in a real system
function splitIntoSentences(text: string): string[] {
  // Simple implementation - in production, this would use NLP
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
}

function isNoun(word: string): boolean {
  // This is a simplified check - in production, this would use POS tagging
  return true; // Simplified for this example
}

function isAdjective(word: string): boolean {
  // This is a simplified check - in production, this would use POS tagging
  return true; // Simplified for this example
}

function extractNamedEntities(text: string): Map<string, string[]> {
  // This is a simplified implementation - in production, this would use NER
  return new Map(); // Simplified for this example
}

/**
 * Extract claims from text
 * @param text The text to extract claims from
 * @param options Options for claim extraction
 * @returns Array of claims
 */
export function extractClaims(text: string, options: any = {}): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  // Split text into sentences
  const sentences = splitIntoSentences(text);
  
  // Normalize each sentence as a claim
  const claims = sentences.map(sentence => normalizeClaim(sentence));
  
  // Filter out empty claims
  return claims.filter(claim => claim.length > 0);
}

// Export other necessary functions
export { normalizeClaim, splitIntoSentences };
