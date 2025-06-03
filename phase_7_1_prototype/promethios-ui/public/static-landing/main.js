// Main JavaScript for Promethios landing page
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

  // Handle form submission
  waitlistForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const isEarlyAccessDev = document.getElementById('earlyAccess').checked;
    const interest = document.getElementById('interest').value;
    
    console.log("Form submitted with email:", email);
    
    try {
      console.log("Checking if email exists...");
      // Check if email already exists
      const emailQuery = await db.collection('waitlist')
        .where('email', '==', email)
        .get();
      
      console.log("Query result:", emailQuery, "Empty?", emailQuery.empty);
      
      if (!emailQuery.empty) {
        alert('This email is already on our waitlist.');
        return;
      }
      
      console.log("Adding email to waitlist...");
      // Add to waitlist collection
      const docRef = await db.collection('waitlist').add({
        name: name,
        email: email,
        role: isEarlyAccessDev ? 'developer' : 'user',
        interest: interest,
        createdAt: firebase.firestore.Timestamp.now(),
        status: 'pending'
      });
      
      console.log("Document added with ID:", docRef.id);
      
      // Reset form
      waitlistForm.reset();
      
      // Hide waitlist modal and show success modal
      waitlistModal.classList.add('hidden');
      successModal.classList.remove('hidden');
      
    } catch (error) {
      console.error('Error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      alert('There was an error submitting your information. Please try again.');
    }
  });
});
