// Validation script for Promethios landing page
// This script checks all elements and interactions to ensure they work correctly

document.addEventListener('DOMContentLoaded', function() {
  console.log('Validation script loaded');
  
  // Check if all required elements exist
  const requiredElements = [
    'waitlistButton',
    'waitlistModal',
    'closeModal',
    'waitlistForm',
    'successModal',
    'closeSuccessModal',
    'closeSuccessButton',
    'name',
    'email',
    'earlyAccess',
    'interest'
  ];
  
  let allElementsExist = true;
  
  requiredElements.forEach(elementId => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Missing required element: ${elementId}`);
      allElementsExist = false;
    }
  });
  
  if (allElementsExist) {
    console.log('✅ All required elements exist');
  }
  
  // Check if Firebase is initialized
  if (typeof firebase !== 'undefined' && firebase.app()) {
    console.log('✅ Firebase is initialized');
  } else {
    console.error('Firebase is not initialized');
  }
  
  // Check if Firestore is accessible
  if (typeof db !== 'undefined') {
    console.log('✅ Firestore is accessible');
  } else {
    console.error('Firestore is not accessible');
  }
  
  // Test modal open/close functionality
  const waitlistButton = document.getElementById('waitlistButton');
  const waitlistModal = document.getElementById('waitlistModal');
  const closeModal = document.getElementById('closeModal');
  
  if (waitlistButton && waitlistModal) {
    console.log('Testing modal open functionality...');
    waitlistButton.click();
    setTimeout(() => {
      if (!waitlistModal.classList.contains('hidden')) {
        console.log('✅ Modal opens correctly');
        
        if (closeModal) {
          console.log('Testing modal close functionality...');
          closeModal.click();
          setTimeout(() => {
            if (waitlistModal.classList.contains('hidden')) {
              console.log('✅ Modal closes correctly');
            } else {
              console.error('Modal does not close correctly');
            }
          }, 100);
        }
      } else {
        console.error('Modal does not open correctly');
      }
    }, 100);
  }
  
  // Log validation complete
  console.log('Validation checks complete. Check console for any errors.');
});
