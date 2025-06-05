// Enhanced main.js with email notifications and improved contact functionality
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
  
  // Test Firestore connection
  function testFirestoreConnection() {
    console.log("Testing Firestore connection...");
    try {
      db.collection('_test_connection').doc('test').set({
        timestamp: firebase.firestore.Timestamp.now()
      })
      .then(() => {
        console.log("Firestore connection successful!");
        // Clean up test document
        db.collection('_test_connection').doc('test').delete();
      })
      .catch(error => {
        console.error("Firestore connection test failed:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
      });
    } catch (error) {
      console.error("Error testing Firestore connection:", error);
    }
  }
  
  // Run connection test after a short delay
  setTimeout(testFirestoreConnection, 2000);

  // Email notification function using EmailJS (optional enhancement)
  async function sendEmailNotification(contactData) {
    try {
      // This would require EmailJS setup - optional enhancement
      // emailjs.send('service_id', 'template_id', {
      //   to_email: 'admin@promethios.ai',
      //   from_name: contactData.name,
      //   from_email: contactData.email,
      //   message: contactData.interest,
      //   role: contactData.role
      // });
      console.log("Email notification would be sent here");
    } catch (error) {
      console.error("Email notification failed:", error);
      // Don't block form submission if email fails
    }
  }

  // Enhanced form validation
  function validateForm(name, email, interest) {
    const errors = [];
    
    if (!name || name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }
    
    if (!email || !email.includes('@') || !email.includes('.')) {
      errors.push("Please enter a valid email address");
    }
    
    if (!interest || interest.trim().length < 10) {
      errors.push("Please provide more details about your interest (at least 10 characters)");
    }
    
    return errors;
  }

  // Show validation errors
  function showValidationErrors(errors) {
    const errorMessage = "Please fix the following issues:\n\n" + errors.join("\n");
    alert(errorMessage);
  }

  // Open waitlist modal
  waitlistButton.addEventListener('click', function() {
    waitlistModal.classList.remove('hidden');
  });

  // Close waitlist modal
  closeModal.addEventListener('click', function() {
    waitlistModal.classList.add('hidden');
  });

  // Close success modal
  closeSuccessModal.addEventListener('click', function() {
    successModal.classList.add('hidden');
  });

  closeSuccessButton.addEventListener('click', function() {
    successModal.classList.add('hidden');
  });

  // Close modals when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === waitlistModal) {
      waitlistModal.classList.add('hidden');
    }
    if (event.target === successModal) {
      successModal.classList.add('hidden');
    }
  });

  // Enhanced form submission with better error handling and notifications
  waitlistForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const isEarlyAccessDev = document.getElementById('earlyAccess').checked;
    const interest = document.getElementById('interest').value.trim();
    
    console.log("Form submitted with email:", email);
    
    // Validate form data
    const validationErrors = validateForm(name, email, interest);
    if (validationErrors.length > 0) {
      showValidationErrors(validationErrors);
      return;
    }
    
    // Disable submit button to prevent double submission
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    
    try {
      console.log("Checking if email exists...");
      
      // Check if email already exists
      const emailQuery = await db.collection('waitlist')
        .where('email', '==', email)
        .get();
      
      console.log("Query result:", emailQuery, "Empty?", emailQuery.empty);
      
      if (!emailQuery.empty) {
        alert('This email is already on our waitlist. Thank you for your continued interest!');
        return;
      }
      
      console.log("Adding email to waitlist...");
      
      // Prepare contact data
      const contactData = {
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
      
      // Add to waitlist collection
      const docRef = await db.collection('waitlist').add(contactData);
      
      console.log("Document added with ID:", docRef.id);
      
      // Send email notification (optional enhancement)
      await sendEmailNotification(contactData);
      
      // Reset form
      waitlistForm.reset();
      
      // Hide waitlist modal and show success modal
      waitlistModal.classList.add('hidden');
      successModal.classList.remove('hidden');
      
      // Track successful submission (optional analytics)
      console.log("Contact form submission successful:", docRef.id);
      
    } catch (error) {
      console.error('Error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide user-friendly error messages
      let errorMessage = 'There was an error submitting your information. Please try again.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Unable to save your information due to security settings. Please contact us directly at contact@promethios.ai';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable. Please try again in a few moments.';
      }
      
      alert(errorMessage);
      
    } finally {
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });

  // Add keyboard shortcuts for better UX
  document.addEventListener('keydown', function(event) {
    // Close modals with Escape key
    if (event.key === 'Escape') {
      if (!waitlistModal.classList.contains('hidden')) {
        waitlistModal.classList.add('hidden');
      }
      if (!successModal.classList.contains('hidden')) {
        successModal.classList.add('hidden');
      }
    }
  });

  // Auto-focus first input when modal opens
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        if (!waitlistModal.classList.contains('hidden')) {
          // Modal opened, focus first input
          setTimeout(() => {
            const nameInput = document.getElementById('name');
            if (nameInput) nameInput.focus();
          }, 100);
        }
      }
    });
  });
  
  observer.observe(waitlistModal, { attributes: true });
});

// Global error handler for unhandled Firebase errors
window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && event.reason.code && event.reason.code.includes('firestore')) {
    console.error('Unhandled Firestore error:', event.reason);
    // Prevent the error from appearing in console for users
    event.preventDefault();
  }
});

