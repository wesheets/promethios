// Enhanced main.js with better error handling and debugging
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const waitlistButton = document.getElementById('waitlistButton');
  const waitlistModal = document.getElementById('waitlistModal');
  const closeModal = document.getElementById('closeModal');
  const waitlistForm = document.getElementById('waitlistForm');
  const successModal = document.getElementById('successModal');
  const closeSuccessModal = document.getElementById('closeSuccessModal');
  const closeSuccessButton = document.getElementById('closeSuccessButton');

  // Verify Firebase and Firestore are initialized correctly
  console.log("Firebase initialized:", typeof firebase !== 'undefined');
  console.log("Firestore initialized:", typeof db !== 'undefined');
  console.log("Firebase app:", firebase.app());
  console.log("Firestore instance:", db);
  
  // Test Firestore connection with better error handling
  function testFirestoreConnection() {
    console.log("Testing Firestore connection...");
    try {
      const testDoc = db.collection('_test_connection').doc('test');
      console.log("Test document reference created:", testDoc);
      
      testDoc.set({
        timestamp: firebase.firestore.Timestamp.now(),
        test: true
      })
      .then((result) => {
        console.log("Firestore connection successful! Write result:", result);
        // Clean up test document
        return testDoc.delete();
      })
      .then(() => {
        console.log("Test document cleaned up successfully");
      })
      .catch(error => {
        console.error("Firestore connection test failed:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Full error object:", error);
      });
    } catch (error) {
      console.error("Error testing Firestore connection:", error);
    }
  }
  
  // Run connection test after a short delay
  setTimeout(testFirestoreConnection, 2000);

  // Open waitlist modal
  if (waitlistButton) {
    waitlistButton.addEventListener('click', function() {
      waitlistModal.classList.remove('hidden');
    });
  }

  // Close waitlist modal
  if (closeModal) {
    closeModal.addEventListener('click', function() {
      waitlistModal.classList.add('hidden');
    });
  }

  // Close success modal
  if (closeSuccessModal) {
    closeSuccessModal.addEventListener('click', function() {
      successModal.classList.add('hidden');
    });
  }

  if (closeSuccessButton) {
    closeSuccessButton.addEventListener('click', function() {
      successModal.classList.add('hidden');
    });
  }

  // Close modals when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === waitlistModal) {
      waitlistModal.classList.add('hidden');
    }
    if (event.target === successModal) {
      successModal.classList.add('hidden');
    }
  });

  // Handle form submission with enhanced debugging
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      console.log("=== FORM SUBMISSION STARTED ===");
      
      // Get form values
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim().toLowerCase();
      const isEarlyAccessDev = document.getElementById('earlyAccess').checked;
      const interest = document.getElementById('interest').value.trim();
      
      console.log("Form data:", { name, email, isEarlyAccessDev, interest });
      
      // Validate form data
      if (!name || !email || !interest) {
        console.error("Form validation failed - missing required fields");
        alert('Please fill in all required fields.');
        return;
      }
      
      try {
        console.log("=== CHECKING FOR DUPLICATE EMAIL ===");
        
        // Check if email already exists
        const waitlistRef = db.collection('waitlist');
        console.log("Waitlist collection reference:", waitlistRef);
        
        const emailQuery = waitlistRef.where('email', '==', email);
        console.log("Email query created:", emailQuery);
        
        const querySnapshot = await emailQuery.get();
        console.log("Query executed. Snapshot:", querySnapshot);
        console.log("Query empty?", querySnapshot.empty);
        console.log("Query size:", querySnapshot.size);
        
        if (!querySnapshot.empty) {
          console.log("Duplicate email found, stopping submission");
          alert('This email is already on our waitlist.');
          return;
        }
        
        console.log("=== ADDING TO WAITLIST ===");
        
        // Prepare document data
        const docData = {
          name: name,
          email: email,
          role: isEarlyAccessDev ? 'developer' : 'user',
          interest: interest,
          createdAt: firebase.firestore.Timestamp.now(),
          status: 'pending',
          source: 'landing_page',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        };
        
        console.log("Document data prepared:", docData);
        
        // Add to waitlist collection
        console.log("Attempting to add document to waitlist collection...");
        const docRef = await waitlistRef.add(docData);
        
        console.log("=== SUCCESS! ===");
        console.log("Document added with ID:", docRef.id);
        console.log("Document reference:", docRef);
        
        // Reset form
        waitlistForm.reset();
        
        // Hide waitlist modal and show success modal
        waitlistModal.classList.add('hidden');
        successModal.classList.remove('hidden');
        
        console.log("=== FORM SUBMISSION COMPLETED SUCCESSFULLY ===");
        
      } catch (error) {
        console.log("=== ERROR OCCURRED ===");
        console.error('Detailed error information:');
        console.error('Error object:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);
        
        // More specific error handling
        let userMessage = 'There was an error submitting your information. Please try again.';
        
        if (error.code === 'permission-denied') {
          userMessage = 'Permission denied. Please check your internet connection and try again.';
        } else if (error.code === 'unavailable') {
          userMessage = 'Service temporarily unavailable. Please try again in a few moments.';
        } else if (error.code === 'unauthenticated') {
          userMessage = 'Authentication error. Please refresh the page and try again.';
        }
        
        alert(userMessage);
        console.log("=== ERROR HANDLING COMPLETED ===");
      }
    });
  } else {
    console.error("Waitlist form not found!");
  }
});

// Global error handler
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', function(event) {
  console.error('Global error:', event.error);
});

