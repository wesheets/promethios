/**
 * VERITAS Fact Trivia Verifier Module
 * 
 * This module provides verification capabilities for common historical facts,
 * pop culture references, and frequently misremembered information (Mandela effects).
 * It complements the legal case verification with domain-specific knowledge.
 */

// Common misquoted phrases and their correct versions
export const MISQUOTED_PHRASES = {
  // Historical quotes
  "that's one small step for man": {
    context: "neil armstrong first words on moon",
    correction: "That's one small step for [a] man, one giant leap for mankind",
    note: "These were not Armstrong's first words upon landing. His first words after landing were: 'Houston, Tranquility Base here. The Eagle has landed.'"
  },
  "houston, we have a problem": {
    context: "apollo 13",
    correction: "Houston, we've had a problem",
    note: "The actual quote from Apollo 13 astronaut Jim Lovell was 'Houston, we've had a problem' (past tense)."
  },
  "luke, i am your father": {
    context: "star wars",
    correction: "No, I am your father",
    note: "The actual quote from Star Wars: The Empire Strikes Back does not include 'Luke' at the beginning."
  },
  "elementary, my dear watson": {
    context: "sherlock holmes",
    correction: "",
    note: "This exact phrase never appears in any of Arthur Conan Doyle's Sherlock Holmes stories."
  },
  "beam me up, scotty": {
    context: "star trek",
    correction: "",
    note: "This exact phrase was never said in the original Star Trek series."
  },
  "play it again, sam": {
    context: "casablanca",
    correction: "Play it, Sam. Play 'As Time Goes By.'",
    note: "The actual quote from Casablanca does not include 'again'."
  },

  // First words on moon
  "neil armstrong first words": {
    context: "moon landing",
    correction: "Houston, Tranquility Base here. The Eagle has landed.",
    note: "These were Armstrong's first words upon landing on the moon. The famous 'one small step' quote came later during the moonwalk."
  }
};

// Mandela effect misconceptions
export const MANDELA_EFFECTS = {
  "monopoly man monocle": {
    reality: "The Monopoly Man (Rich Uncle Pennybags) does not wear a monocle and never has in the official game.",
    confusion: "People often confuse him with Mr. Peanut (Planters mascot) who does wear a monocle."
  },
  "fruit of the loom logo cornucopia": {
    reality: "The Fruit of the Loom logo never contained a cornucopia (horn of plenty).",
    confusion: "Many people incorrectly remember a cornucopia behind the fruit in the logo."
  },
  "berenstain bears spelling": {
    reality: "The children's book series is spelled 'Berenstain Bears' (with 'ain').",
    confusion: "Many people remember it as 'Berenstein Bears' (with 'ein')."
  },
  "curious george tail": {
    reality: "Curious George the monkey does not have a tail in any of the books or shows.",
    confusion: "Many people incorrectly remember Curious George having a tail."
  },
  "pikachu tail black tip": {
    reality: "Pikachu's tail is entirely yellow without a black tip.",
    confusion: "Many people incorrectly remember Pikachu having a black tip on his tail."
  },
  "kit kat dash": {
    reality: "The chocolate brand is spelled 'Kit Kat' without a dash.",
    confusion: "Many people incorrectly remember it as 'Kit-Kat' with a dash."
  }
};

// Historical facts
export const HISTORICAL_FACTS = {
  "moon landing year": "1969",
  "first person on moon": "Neil Armstrong",
  "titanic sinking year": "1912",
  "world war 2 end year": "1945",
  "declaration of independence year": "1776",
  "berlin wall fall year": "1989"
};

/**
 * Check if a claim contains a misquoted phrase
 * @param claim The claim to check
 * @returns Correction information if misquoted, null otherwise
 */
export function checkForMisquotedPhrase(claim: string): { 
  misquote: string, 
  correction: string, 
  note: string 
} | null {
  const lowerClaim = claim.toLowerCase();
  
  // Check for specific Neil Armstrong first words misconception
  if ((lowerClaim.includes("neil armstrong") || lowerClaim.includes("armstrong")) && 
      lowerClaim.includes("first") && 
      (lowerClaim.includes("words") || lowerClaim.includes("said")) && 
      lowerClaim.includes("landing") &&
      lowerClaim.includes("small step")) {
    
    return {
      misquote: "Neil Armstrong's first words upon landing were 'That's one small step for [a] man...'",
      correction: "Houston, Tranquility Base here. The Eagle has landed.",
      note: "The famous 'one small step' quote was said later during the moonwalk, not when first landing on the moon."
    };
  }
  
  // Check for other misquoted phrases
  for (const [misquote, info] of Object.entries(MISQUOTED_PHRASES)) {
    if (lowerClaim.includes(misquote) && lowerClaim.includes(info.context)) {
      return {
        misquote,
        correction: info.correction,
        note: info.note
      };
    }
  }
  
  return null;
}

/**
 * Check if a claim contains a Mandela effect misconception
 * @param claim The claim to check
 * @returns Correction information if a Mandela effect is found, null otherwise
 */
export function checkForMandelaEffect(claim: string): {
  misconception: string,
  reality: string,
  confusion: string
} | null {
  const lowerClaim = claim.toLowerCase();
  
  // Special case for Monopoly Man monocle
  if ((lowerClaim.includes("monopoly man") || lowerClaim.includes("rich uncle pennybags")) && 
      lowerClaim.includes("monocle") && 
      !lowerClaim.includes("does not wear") && 
      !lowerClaim.includes("doesn't wear") && 
      !lowerClaim.includes("never wore") && 
      !lowerClaim.includes("no monocle")) {
    
    return {
      misconception: "Monopoly Man wearing a monocle",
      reality: "The Monopoly Man (Rich Uncle Pennybags) does not wear a monocle and never has in the official game.",
      confusion: "People often confuse him with Mr. Peanut (Planters mascot) who does wear a monocle."
    };
  }
  
  // Check for other Mandela effects
  for (const [key, info] of Object.entries(MANDELA_EFFECTS)) {
    if (lowerClaim.includes(key)) {
      return {
        misconception: key,
        reality: info.reality,
        confusion: info.confusion
      };
    }
  }
  
  return null;
}

/**
 * Check if a claim contradicts a known historical fact
 * @param claim The claim to check
 * @returns Correction information if a contradiction is found, null otherwise
 */
export function checkHistoricalFactAccuracy(claim: string): {
  topic: string,
  correctFact: string
} | null {
  const lowerClaim = claim.toLowerCase();
  
  for (const [topic, fact] of Object.entries(HISTORICAL_FACTS)) {
    if (lowerClaim.includes(topic) && !lowerClaim.includes(fact)) {
      // Check if claim contains a different year or fact that contradicts the correct one
      const words = lowerClaim.split(/\s+/);
      const hasContradiction = words.some(word => {
        // Check for years
        if (/^(19|20)\d{2}$/.test(word) && word !== fact) {
          return true;
        }
        
        // Check for names in "first person on moon" case
        if (topic === "first person on moon" && 
            word.length > 3 && 
            !["neil", "armstrong"].includes(word) && 
            !["first", "person", "moon", "the", "was", "landed", "walked"].includes(word)) {
          return true;
        }
        
        return false;
      });
      
      if (hasContradiction) {
        return {
          topic,
          correctFact: fact
        };
      }
    }
  }
  
  return null;
}

/**
 * Verify a claim against known facts, quotes, and common misconceptions
 * @param claim The claim to verify
 * @returns Verification result with supporting or contradicting evidence
 */
export function verifyFactTrivia(claim: string): {
  isAccurate: boolean,
  confidence: number,
  evidence: {
    type: 'misquote' | 'mandela_effect' | 'historical_fact' | 'accurate',
    details: any
  }
} {
  // Check for misquoted phrases
  const misquoteCheck = checkForMisquotedPhrase(claim);
  if (misquoteCheck) {
    return {
      isAccurate: false,
      confidence: 0.95,
      evidence: {
        type: 'misquote',
        details: misquoteCheck
      }
    };
  }
  
  // Check for Mandela effects
  const mandelaCheck = checkForMandelaEffect(claim);
  if (mandelaCheck) {
    return {
      isAccurate: false,
      confidence: 0.95,
      evidence: {
        type: 'mandela_effect',
        details: mandelaCheck
      }
    };
  }
  
  // Check for historical fact accuracy
  const historicalCheck = checkHistoricalFactAccuracy(claim);
  if (historicalCheck) {
    return {
      isAccurate: false,
      confidence: 0.9,
      evidence: {
        type: 'historical_fact',
        details: historicalCheck
      }
    };
  }
  
  // If no issues found, consider it potentially accurate
  return {
    isAccurate: true,
    confidence: 0.7, // Lower confidence since we only checked against known issues
    evidence: {
      type: 'accurate',
      details: null
    }
  };
}

/**
 * Generate evidence objects from fact trivia verification
 * @param claim The claim that was verified
 * @param verificationResult The verification result
 * @returns Array of evidence objects
 */
export function generateFactTriviaEvidence(claim: string, verificationResult: ReturnType<typeof verifyFactTrivia>): any[] {
  if (verificationResult.isAccurate) {
    return []; // No contradicting evidence for accurate claims
  }
  
  const evidence = [];
  
  switch (verificationResult.evidence.type) {
    case 'misquote':
      evidence.push({
        text: verificationResult.evidence.details.note,
        source: {
          id: "fact-trivia-db",
          name: "Historical Quotes Database",
          reliability: 0.95,
          timestamp: new Date().toISOString()
        },
        relevance: 0.9,
        sentiment: 'contradicting'
      });
      break;
      
    case 'mandela_effect':
      evidence.push({
        text: verificationResult.evidence.details.reality,
        source: {
          id: "mandela-effect-db",
          name: "Common Misconceptions Database",
          reliability: 0.95,
          timestamp: new Date().toISOString()
        },
        relevance: 0.9,
        sentiment: 'contradicting'
      });
      break;
      
    case 'historical_fact':
      evidence.push({
        text: `The correct information about ${verificationResult.evidence.details.topic} is: ${verificationResult.evidence.details.correctFact}`,
        source: {
          id: "historical-facts-db",
          name: "Historical Facts Database",
          reliability: 0.95,
          timestamp: new Date().toISOString()
        },
        relevance: 0.9,
        sentiment: 'contradicting'
      });
      break;
  }
  
  return evidence;
}
