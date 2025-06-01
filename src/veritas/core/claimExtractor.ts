/**
 * Claim Extractor Module
 * 
 * This module is responsible for extracting claims from text for verification.
 * It implements natural language processing techniques to identify statements
 * that can be verified against evidence.
 */

import { VeritasOptions } from '../types';
import { DEFAULT_OPTIONS } from '../constants';

/**
 * Normalize a claim by removing trailing punctuation and quotes
 * @param claim The claim to normalize
 * @returns Normalized claim
 */
export function normalizeClaim(claim: string): string {
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
 * Split text into sentences
 * @param text The text to split into sentences
 * @returns Array of sentences
 */
export function splitIntoSentences(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  // Match sentence boundaries:
  // - End with period, exclamation, or question mark
  // - Followed by space or end of string
  // - Handle common abbreviations to avoid false splits
  const sentenceRegex = /[^.!?]*(?:[.!?](?:[ \t\n]|$))/g;
  
  // Extract sentences using regex
  const matches = text.match(sentenceRegex);
  
  // If no matches, return the whole text as one sentence
  if (!matches) {
    return [text.trim()];
  }
  
  // Filter out empty sentences and trim whitespace
  return matches
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);
}

/**
 * Check if a word is likely a noun
 * @param word The word to check
 * @returns Whether the word is likely a noun
 */
function isNoun(word: string): boolean {
  // This is a simplified check - in production, this would use POS tagging
  // Common noun suffixes
  const nounSuffixes = ['tion', 'ment', 'ence', 'ance', 'ity', 'ness', 'ship', 'age', 'ery', 'ism'];
  const commonNouns = ['time', 'year', 'people', 'way', 'day', 'man', 'thing', 'woman', 'life', 'child', 
                      'world', 'school', 'state', 'family', 'student', 'group', 'country', 'problem', 
                      'hand', 'part', 'place', 'case', 'week', 'company', 'system', 'program', 'question',
                      'work', 'government', 'number', 'night', 'point', 'home', 'water', 'room', 'mother',
                      'area', 'money', 'story', 'fact', 'month', 'lot', 'right', 'study', 'book', 'eye',
                      'job', 'word', 'business', 'issue', 'side', 'kind', 'head', 'house', 'service',
                      'friend', 'father', 'power', 'hour', 'game', 'line', 'end', 'member', 'law', 'car',
                      'city', 'community', 'name', 'president', 'team', 'minute', 'idea', 'kid', 'body',
                      'information', 'back', 'parent', 'face', 'others', 'level', 'office', 'door',
                      'health', 'person', 'art', 'war', 'history', 'party', 'result', 'change', 'morning',
                      'reason', 'research', 'girl', 'guy', 'moment', 'air', 'teacher', 'force', 'education'];
  
  const lower = word.toLowerCase();
  
  // Check if the word ends with a common noun suffix
  const hasSuffix = nounSuffixes.some(suffix => lower.endsWith(suffix));
  
  // Check if the word is a common noun
  const isCommonNoun = commonNouns.includes(lower);
  
  // Check if the word starts with a capital letter (proper noun)
  const isProperNoun = word.length > 0 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
  
  return hasSuffix || isCommonNoun || isProperNoun;
}

/**
 * Check if a word is likely an adjective
 * @param word The word to check
 * @returns Whether the word is likely an adjective
 */
function isAdjective(word: string): boolean {
  // This is a simplified check - in production, this would use POS tagging
  const adjectiveSuffixes = ['able', 'ible', 'al', 'ful', 'ic', 'ive', 'less', 'ous', 'ish', 'like'];
  const commonAdjectives = ['good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other',
                          'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early',
                          'young', 'important', 'few', 'public', 'bad', 'same', 'able', 'best', 'better',
                          'sure', 'free', 'military', 'low', 'late', 'major', 'beautiful', 'main', 'happy',
                          'serious', 'ready', 'simple', 'necessary', 'strong', 'true', 'clear', 'hard',
                          'poor', 'political', 'full', 'close', 'easy', 'cold', 'final', 'common', 'hot',
                          'entire', 'nice', 'short', 'medical', 'current', 'wrong', 'private', 'past',
                          'foreign', 'fine', 'natural', 'significant', 'similar', 'difficult', 'effective',
                          'interesting', 'available', 'economic', 'afraid', 'latest', 'official', 'basic',
                          'popular', 'traditional', 'cultural', 'modern', 'recent', 'wonderful', 'nice',
                          'huge', 'rare', 'technical', 'typical', 'competitive', 'critical', 'electronic',
                          'immediate', 'aware', 'educational', 'environmental', 'global', 'legal', 'relevant',
                          'accurate', 'capable', 'dangerous', 'dramatic', 'efficient', 'powerful', 'quick',
                          'scientific', 'useful', 'weird', 'amazing', 'awesome', 'brilliant', 'excellent'];
  
  const lower = word.toLowerCase();
  
  return adjectiveSuffixes.some(suffix => lower.endsWith(suffix)) || commonAdjectives.includes(lower);
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
                      'say', 'use', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call',
                      'know', 'want', 'need', 'mean', 'put', 'keep', 'let', 'begin', 'help', 'talk',
                      'turn', 'start', 'show', 'hear', 'play', 'run', 'move', 'like', 'live', 'believe',
                      'hold', 'bring', 'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay',
                      'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand',
                      'watch', 'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend',
                      'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love', 'consider', 'appear',
                      'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build', 'stay', 'fall', 'cut',
                      'reach', 'kill', 'remain', 'suggest', 'raise', 'pass', 'sell', 'require', 'report',
                      'decide', 'pull', 'develop', 'explain', 'hope', 'carry', 'receive', 'agree', 'support',
                      'hit', 'produce', 'eat', 'cover', 'catch', 'draw', 'choose', 'wish', 'drop', 'pick',
                      'drive', 'wear', 'break', 'describe', 'fill', 'face', 'forget', 'join', 'save'];
  
  const lower = word.toLowerCase();
  
  return verbSuffixes.some(suffix => lower.endsWith(suffix)) || commonVerbs.includes(lower);
}

/**
 * Extract named entities from text
 * @param text The text to extract named entities from
 * @returns Map of entity types to arrays of entity values
 */
function extractNamedEntities(text: string): Map<string, string[]> {
  // This is a simplified implementation - in production, this would use NER
  const entities = new Map<string, string[]>();
  
  // Simple regex patterns for common entity types
  const patterns = {
    PERSON: /\b[A-Z][a-z]+ (?:[A-Z][a-z]+\s?)+\b/g,
    ORGANIZATION: /\b[A-Z][a-z]* (?:Corp|Inc|Ltd|LLC|Company|Association|Organization)\b/g,
    LOCATION: /\b(?:North|South|East|West|New|San|Los|Las)+ [A-Z][a-z]+\b/g,
    DATE: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}(?:st|nd|rd|th)?,? \d{4}\b/g,
    MONEY: /\$\d+(?:\.\d+)?(?:\s?(?:million|billion|trillion))?\b/g
  };
  
  // Extract entities using regex patterns
  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern);
    if (matches) {
      entities.set(type, [...new Set(matches)]);
    }
  }
  
  return entities;
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
 * Extract claims from text
 * @param text The text to extract claims from
 * @param options Options for claim extraction
 * @returns Array of claims with their positions in the text
 */
export function extractClaims(
  text: string, 
  options: VeritasOptions = {}
): Array<{ text: string; position: { start: number; end: number } }> {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  // Merge options with defaults
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Split text into sentences
  const sentences = splitIntoSentences(text);
  
  // Track the current position in the text
  let currentPosition = 0;
  
  // Extract claims with their positions
  const claims = sentences.map(sentence => {
    // Find the position of this sentence in the original text
    const start = text.indexOf(sentence, currentPosition);
    const end = start + sentence.length;
    
    // Update the current position for the next search
    currentPosition = end;
    
    // Normalize the claim
    const normalizedClaim = normalizeClaim(sentence);
    
    return {
      text: normalizedClaim,
      position: { start, end }
    };
  });
  
  // Filter out empty claims
  const filteredClaims = claims.filter(claim => claim.text.length > 0);
  
  // Limit claims to maxClaims
  return filteredClaims.slice(0, mergedOptions.maxClaims);
}

/**
 * Identify factual statements in text
 * @param text The text to analyze
 * @returns Array of factual statements
 */
export function identifyFactualStatements(text: string): string[] {
  // Split into sentences
  const sentences = splitIntoSentences(text);
  
  // Filter for sentences that are likely factual statements
  return sentences.filter(sentence => {
    // Exclude questions
    if (sentence.endsWith('?')) {
      return false;
    }
    
    // Exclude commands/imperatives (often start with a verb)
    const words = sentence.trim().split(/\s+/);
    if (words.length > 0 && isVerb(words[0]) && !['is', 'are', 'was', 'were', 'has', 'have', 'had'].includes(words[0].toLowerCase())) {
      return false;
    }
    
    // Exclude opinions/subjective statements
    const opinionIndicators = ['think', 'believe', 'feel', 'opinion', 'seems', 'appears', 'might', 'could', 'may', 'perhaps', 'probably'];
    if (opinionIndicators.some(indicator => sentence.toLowerCase().includes(indicator))) {
      return false;
    }
    
    // Include statements with specific factual indicators
    const factualIndicators = ['is', 'are', 'was', 'were', 'will', 'has', 'have', 'had', 'can', 'cannot', 'did', 'does'];
    if (factualIndicators.some(indicator => {
      const regex = new RegExp(`\\b${indicator}\\b`, 'i');
      return regex.test(sentence);
    })) {
      return true;
    }
    
    // Include statements with numbers, dates, or named entities
    if (/\d+/.test(sentence) || 
        /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/.test(sentence) ||
        /\b[A-Z][a-z]+ (?:[A-Z][a-z]+\s?)+\b/.test(sentence)) {
      return true;
    }
    
    // Default to including the statement if it's not excluded by the above rules
    return true;
  });
}

/**
 * Rank claims by importance
 * @param claims Array of claims
 * @returns Array of claims sorted by importance
 */
export function rankClaimsByImportance(
  claims: Array<{ text: string; position: { start: number; end: number } }>
): Array<{ text: string; position: { start: number; end: number }; importance: number }> {
  return claims.map(claim => {
    let importance = 0;
    
    // Longer claims are often more important (but not too long)
    const wordCount = claim.text.split(/\s+/).length;
    if (wordCount >= 5 && wordCount <= 20) {
      importance += wordCount / 5;
    } else if (wordCount > 20) {
      importance += 4;
    } else {
      importance += wordCount / 10;
    }
    
    // Claims with numbers are often more important
    if (/\d+/.test(claim.text)) {
      importance += 2;
    }
    
    // Claims with named entities are often more important
    const entities = extractNamedEntities(claim.text);
    importance += entities.size;
    
    // Claims earlier in the text are often more important
    importance += Math.max(0, 5 - (claim.position.start / 100));
    
    return {
      ...claim,
      importance
    };
  }).sort((a, b) => b.importance - a.importance);
}
