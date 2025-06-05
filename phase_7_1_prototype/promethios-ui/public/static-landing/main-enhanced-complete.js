// Enhanced main.js with comprehensive contact functionality
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements - Waitlist
  const waitlistButton = document.getElementById('waitlistButton');
  const waitlistModal = document.getElementById('waitlistModal');
  const closeModal = document.getElementById('closeModal');
  const waitlistForm = document.getElementById('waitlistForm');
  
  // DOM Elements - Contact
  const contactButton = document.getElementById('contactButton');
  const contactButtonHero = document.getElementById('contactButtonHero');
  const demoButton = document.getElementById('demoButton');
  const partnershipButton = document.getElementById('partnershipButton');
  const contactModal = document.getElementById('contactModal');
  const closeContactModal = document.getElementById('closeContactModal');
  const contactForm = document.getElementById('contactForm');
  
  // DOM Elements - Success Modal
  const successModal = document.getElementById('successModal');
  const closeSuccessModal = document.getElementById('closeSuccessModal');
  const closeSuccessButton = document.getElementById('closeSuccessButton');
  const successMessage = document.getElementById('successMessage');
  const successSubMessage = document.getElementById('successSubMessage');

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

  // Enhanced form validation
  function validateForm(name, email, message) {
    const errors = [];
    
    if (!name || name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }
    
    if (!email || !email.includes('@') || !email.includes('.')) {
      errors.push("Please enter a valid email address");
    }
    
    if (!message || message.trim().length < 10) {
      errors.push("Please provide more details in your message (at least 10 characters)");
    }
    
    return errors;
  }

  // Show validation errors
  function showValidationErrors(errors) {
    const errorMessage = "Please fix the following issues:\n\n" + errors.join("\n");
    alert(errorMessage);
  }

  // Open contact modal with specific type
  function openContactModal(contactType = 'general') {
    contactModal.classList.remove('hidden');
    const contactTypeSelect = document.getElementById('contactType');
    if (contactTypeSelect) {
      contactTypeSelect.value = contactType;
    }
    // Focus first input
    setTimeout(() => {
      const nameInput = document.getElementById('contactName');
      if (nameInput) nameInput.focus();
    }, 100);
  }

  // Event Listeners - Waitlist
  if (waitlistButton) {
    waitlistButton.addEventListener('click', function() {
      waitlistModal.classList.remove('hidden');
    });
  }

  if (closeModal) {
    closeModal.addEventListener('click', function() {
      waitlistModal.classList.add('hidden');
    });
  }

  // Event Listeners - Contact
  if (contactButton) {
    contactButton.addEventListener('click', () => openContactModal('general'));
  }
  
  if (contactButtonHero) {
    contactButtonHero.addEventListener('click', () => openContactModal('general'));
  }
  
  if (demoButton) {
    demoButton.addEventListener('click', () => openContactModal('demo'));
  }
  
  if (partnershipButton) {
    partnershipButton.addEventListener('click', () => openContactModal('partnership'));
  }

  if (closeContactModal) {
    closeContactModal.addEventListener('click', function() {
      contactModal.classList.add('hidden');
    });
  }

  // Event Listeners - Success Modal
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
    if (event.target === contactModal) {
      contactModal.classList.add('hidden');
    }
    if (event.target === successModal) {
      successModal.classList.add('hidden');
    }
  });

  // Enhanced contact form submission
  if (contactForm) {
    contactForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Get form values
      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim().toLowerCase();
      const contactType = document.getElementById('contactType').value;
      const message = document.getElementById('contactMessage').value.trim();
      
      console.log("Contact form submitted:", { name, email, contactType });
      
      // Validate form data
      const validationErrors = validateForm(name, email, message);
      if (validationErrors.length > 0) {
        showValidationErrors(validationErrors);
        return;
      }
      
      // Disable submit button to prevent double submission
      const submitButton = event.target.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
      
      try {
        console.log("Saving contact form to Firestore...");
        
        // Prepare contact data
        const contactData = {
          name: name,
          email: email,
          contactType: contactType,
          message: message,
          createdAt: firebase.firestore.Timestamp.now(),
          status: 'new',
          source: 'landing_page_contact',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        };
        
        // Add to contacts collection
        const docRef = await db.collection('contacts').add(contactData);
        
        console.log("Contact document added with ID:", docRef.id);
        
        // Reset form
        contactForm.reset();
        
        // Hide contact modal and show success modal
        contactModal.classList.add('hidden');
        
        // Update success message based on contact type
        let message = "Your message has been sent!";
        let subMessage = "We'll get back to you soon.";
        
        switch (contactType) {
          case 'demo':
            message = "Demo request received!";
            subMessage = "We'll contact you to schedule your demo.";
            break;
          case 'partnership':
            message = "Partnership inquiry received!";
            subMessage = "Our partnerships team will reach out soon.";
            break;
          case 'support':
            message = "Support request submitted!";
            subMessage = "Our technical team will assist you shortly.";
            break;
          case 'sales':
            message = "Sales inquiry received!";
            subMessage = "Our sales team will contact you soon.";
            break;
        }
        
        successMessage.textContent = message;
        successSubMessage.textContent = subMessage;
        successModal.classList.remove('hidden');
        
        // Track successful submission
        console.log("Contact form submission successful:", docRef.id);
        
      } catch (error) {
        console.error('Contact form error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Provide user-friendly error messages
        let errorMessage = 'There was an error sending your message. Please try again.';
        
        if (error.code === 'permission-denied') {
          errorMessage = 'Unable to send your message due to security settings. Please email us directly at contact@promethios.ai';
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
  }

  // Enhanced waitlist form submission (existing functionality)
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Get form values
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim().toLowerCase();
      const isEarlyAccessDev = document.getElementById('earlyAccess').checked;
      const interest = document.getElementById('interest').value.trim();
      
      console.log("Waitlist form submitted with email:", email);
      
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
        
        // Prepare waitlist data
        const waitlistData = {
          name: name,
          email: email,
          role: isEarlyAccessDev ? 'developer' : 'user',
          interest: interest,
          createdAt: firebase.firestore.Timestamp.now(),
          status: 'pending',
          source: 'landing_page_waitlist',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        };
        
        // Add to waitlist collection
        const docRef = await db.collection('waitlist').add(waitlistData);
        
        console.log("Waitlist document added with ID:", docRef.id);
        
        // Reset form
        waitlistForm.reset();
        
        // Hide waitlist modal and show success modal
        waitlistModal.classList.add('hidden');
        
        successMessage.textContent = "You've been added to our waitlist!";
        successSubMessage.textContent = "We'll notify you when you're granted access to Promethios.";
        successModal.classList.remove('hidden');
        
        // Track successful submission
        console.log("Waitlist form submission successful:", docRef.id);
        
      } catch (error) {
        console.error('Waitlist form error:', error);
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
  }

  // Add keyboard shortcuts for better UX
  document.addEventListener('keydown', function(event) {
    // Close modals with Escape key
    if (event.key === 'Escape') {
      if (waitlistModal && !waitlistModal.classList.contains('hidden')) {
        waitlistModal.classList.add('hidden');
      }
      if (contactModal && !contactModal.classList.contains('hidden')) {
        contactModal.classList.add('hidden');
      }
      if (successModal && !successModal.classList.contains('hidden')) {
        successModal.classList.add('hidden');
      }
    }
  });

  // Auto-focus first input when modals open
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        if (waitlistModal && !waitlistModal.classList.contains('hidden')) {
          // Waitlist modal opened, focus first input
          setTimeout(() => {
            const nameInput = document.getElementById('name');
            if (nameInput) nameInput.focus();
          }, 100);
        }
        if (contactModal && !contactModal.classList.contains('hidden')) {
          // Contact modal opened, focus first input
          setTimeout(() => {
            const nameInput = document.getElementById('contactName');
            if (nameInput) nameInput.focus();
          }, 100);
        }
      }
    });
  });
  
  if (waitlistModal) observer.observe(waitlistModal, { attributes: true });
  if (contactModal) observer.observe(contactModal, { attributes: true });
});

// Global error handler for unhandled Firebase errors
window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && event.reason.code && event.reason.code.includes('firestore')) {
    console.error('Unhandled Firestore error:', event.reason);
    // Prevent the error from appearing in console for users
    event.preventDefault();
  }
});

