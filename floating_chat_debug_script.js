// Floating Chat Debug Script
// Run this in browser console to diagnose why floating chat isn't visible

console.log('🔍 Starting Floating Chat Debug Analysis...');

// 1. Check if floating chat elements exist in DOM
const checkDOMElements = () => {
  console.log('\n📋 DOM Element Analysis:');
  
  // Look for floating chat elements
  const floatingChats = document.querySelectorAll('[class*="floating"], [class*="chat"]');
  console.log(`Found ${floatingChats.length} potential floating chat elements:`, floatingChats);
  
  // Look for Draggable elements
  const draggableElements = document.querySelectorAll('[class*="react-draggable"]');
  console.log(`Found ${draggableElements.length} draggable elements:`, draggableElements);
  
  // Look for MUI Paper elements (our chat container)
  const paperElements = document.querySelectorAll('[class*="MuiPaper"]');
  console.log(`Found ${paperElements.length} MUI Paper elements:`, paperElements);
  
  // Look for elements with high z-index
  const allElements = document.querySelectorAll('*');
  const highZIndexElements = Array.from(allElements).filter(el => {
    const zIndex = window.getComputedStyle(el).zIndex;
    return zIndex && parseInt(zIndex) > 1000;
  });
  console.log(`Found ${highZIndexElements.length} elements with z-index > 1000:`, highZIndexElements);
  
  return { floatingChats, draggableElements, paperElements, highZIndexElements };
};

// 2. Check element positioning and visibility
const checkElementVisibility = (elements) => {
  console.log('\n👁️ Element Visibility Analysis:');
  
  elements.forEach((el, index) => {
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    
    console.log(`Element ${index + 1}:`, {
      element: el,
      position: {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      },
      styles: {
        position: styles.position,
        zIndex: styles.zIndex,
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        transform: styles.transform,
        overflow: styles.overflow
      },
      isVisible: rect.width > 0 && rect.height > 0,
      isInViewport: rect.top >= 0 && rect.left >= 0 && 
                   rect.bottom <= window.innerHeight && 
                   rect.right <= window.innerWidth,
      parentElement: el.parentElement
    });
  });
};

// 3. Check React component state
const checkReactState = () => {
  console.log('\n⚛️ React State Analysis:');
  
  // Try to access React DevTools data
  try {
    const reactRoot = document.querySelector('#root');
    if (reactRoot && reactRoot._reactInternalFiber) {
      console.log('React fiber found:', reactRoot._reactInternalFiber);
    }
    
    // Check if ChatIntegrationProvider context is available
    if (window.chatIntegrationContext) {
      console.log('ChatIntegrationProvider context:', window.chatIntegrationContext);
    } else {
      console.log('❌ ChatIntegrationProvider context not found on window');
    }
    
  } catch (error) {
    console.log('Could not access React internals:', error);
  }
};

// 4. Check for CSS conflicts
const checkCSSConflicts = () => {
  console.log('\n🎨 CSS Conflict Analysis:');
  
  // Check for elements that might be covering the floating chat
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  console.log('Viewport dimensions:', viewport);
  
  // Check for elements in the upper-right area where chat should appear
  const upperRightArea = {
    x: viewport.width - 400,
    y: 0,
    width: 400,
    height: 500
  };
  
  const elementsInUpperRight = document.elementsFromPoint(
    upperRightArea.x + 200, 
    upperRightArea.y + 250
  );
  
  console.log('Elements in upper-right area (where chat should be):', elementsInUpperRight);
  
  // Check for elements with very high z-index that might be covering
  const veryHighZElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const zIndex = window.getComputedStyle(el).zIndex;
    return zIndex && parseInt(zIndex) > 9999;
  });
  
  console.log('Elements with z-index > 9999 (might cover chat):', veryHighZElements);
};

// 5. Create a test floating element
const createTestElement = () => {
  console.log('\n🧪 Creating Test Floating Element:');
  
  const testDiv = document.createElement('div');
  testDiv.id = 'floating-chat-test';
  testDiv.style.cssText = `
    position: fixed;
    top: 100px;
    right: 50px;
    width: 320px;
    height: 400px;
    background: red;
    border: 5px solid yellow;
    z-index: 99999;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
  `;
  testDiv.textContent = 'TEST FLOATING ELEMENT';
  
  document.body.appendChild(testDiv);
  
  console.log('✅ Test element created. If you can see a red box with yellow border, positioning works.');
  console.log('Test element:', testDiv);
  
  // Remove after 5 seconds
  setTimeout(() => {
    testDiv.remove();
    console.log('🗑️ Test element removed');
  }, 5000);
};

// 6. Run all diagnostics
const runFullDiagnostic = () => {
  console.log('🚀 Running Full Floating Chat Diagnostic...');
  
  const elements = checkDOMElements();
  
  if (elements.floatingChats.length > 0) {
    checkElementVisibility(elements.floatingChats);
  }
  
  if (elements.draggableElements.length > 0) {
    checkElementVisibility(elements.draggableElements);
  }
  
  if (elements.paperElements.length > 0) {
    console.log('\n📄 Checking MUI Paper elements for potential floating chats...');
    // Filter Paper elements that might be floating chats
    const potentialChats = Array.from(elements.paperElements).filter(el => {
      const styles = window.getComputedStyle(el);
      return styles.position === 'fixed' && parseInt(styles.zIndex) > 1000;
    });
    
    if (potentialChats.length > 0) {
      console.log(`Found ${potentialChats.length} potential floating chat Paper elements`);
      checkElementVisibility(potentialChats);
    }
  }
  
  checkReactState();
  checkCSSConflicts();
  createTestElement();
  
  console.log('\n📊 Diagnostic Summary:');
  console.log('- DOM Elements Found:', elements.floatingChats.length);
  console.log('- Draggable Elements:', elements.draggableElements.length);
  console.log('- High Z-Index Elements:', elements.highZIndexElements.length);
  console.log('- Viewport Size:', `${window.innerWidth}x${window.innerHeight}`);
  
  console.log('\n💡 Next Steps:');
  console.log('1. Check if test red box appears (tests basic positioning)');
  console.log('2. Look for floating chat elements in the lists above');
  console.log('3. Check if any elements have negative positions or are off-screen');
  console.log('4. Verify z-index conflicts');
};

// Export functions for manual testing
window.floatingChatDebug = {
  runFullDiagnostic,
  checkDOMElements,
  checkElementVisibility,
  checkReactState,
  checkCSSConflicts,
  createTestElement
};

console.log('🔧 Debug functions available on window.floatingChatDebug');
console.log('Run window.floatingChatDebug.runFullDiagnostic() to start');

// Auto-run diagnostic
runFullDiagnostic();

