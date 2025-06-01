/**
 * Enhanced Features Module - Final Polish
 * Adds disclaimer and fixes hallucination text color
 */

// Add disclaimer about unscripted agent interactions
function addUnscriptedDisclaimer() {
  // Create the disclaimer element
  const disclaimer = document.createElement('div');
  disclaimer.className = 'alert alert-info disclaimer-banner mb-4';
  disclaimer.innerHTML = `
    <i class="bi bi-info-circle-fill me-2"></i>
    <strong>Real-Time Agent Interactions:</strong> 
    What you're about to see is <u>unscripted</u>. These agents are running on their respective LLM models in real-time, 
    demonstrating authentic collaboration behaviors with and without governance.
  `;
  
  // Find the container to add the disclaimer to
  const container = document.querySelector('#playground .container-fluid');
  if (container) {
    // Insert at the beginning of the container
    container.insertBefore(disclaimer, container.firstChild);
  }
}

// Fix hallucination text color for better readability
function fixHallucinationTextColor() {
  // Add CSS to fix the hallucination text color
  const style = document.createElement('style');
  style.textContent = `
    .hallucination-text {
      background-color: rgba(255, 0, 0, 0.1);
      border-left: 3px solid #ff4444;
      padding-left: 10px;
      position: relative;
      color: #721c24; /* Dark red text color for better readability */
      font-weight: 500; /* Make it slightly bolder */
    }
    
    .hallucination-text::after {
      content: "Hallucination";
      position: absolute;
      right: 10px;
      top: 5px;
      font-size: 10px;
      background-color: #ff4444;
      color: white;
      padding: 2px 5px;
      border-radius: 3px;
    }
    
    .contradiction-text {
      background-color: rgba(255, 165, 0, 0.1);
      border-left: 3px solid #ffa500;
      padding-left: 10px;
      position: relative;
      color: #663d00; /* Dark orange text color */
      font-weight: 500;
    }
    
    .flagged-behavior-text {
      background-color: rgba(128, 0, 128, 0.1);
      border-left: 3px solid #800080;
      padding-left: 10px;
      position: relative;
      color: #4b0082; /* Dark purple text color */
      font-weight: 500;
    }
    
    .completion-text {
      background-color: rgba(0, 128, 0, 0.1);
      border-left: 3px solid #008000;
      padding-left: 10px;
      position: relative;
      color: #004d00; /* Dark green text color */
      font-weight: 500;
    }
  `;
  document.head.appendChild(style);
}

// Apply final polish
function applyFinalPolish() {
  addUnscriptedDisclaimer();
  fixHallucinationTextColor();
  console.log('Final polish applied: disclaimer added and hallucination text color fixed');
}

// Export the functions
export {
  addUnscriptedDisclaimer,
  fixHallucinationTextColor,
  applyFinalPolish
};
