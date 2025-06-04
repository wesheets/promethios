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
    
    try {
      // Check if email already exists
      const emailQuery = await db.collection('waitlist')
        .where('email', '==', email)
        .get();
      
      if (!emailQuery.empty) {
        alert('This email is already on our waitlist.');
        return;
      }
      
      // Add to waitlist collection
      await db.collection('waitlist').add({
        name: name,
        email: email,
        role: isEarlyAccessDev ? 'developer' : 'user',
        interest: interest,
        createdAt: firebase.firestore.Timestamp.now(),
        status: 'pending'
      });
      
      // Reset form
      waitlistForm.reset();
      
      // Hide waitlist modal and show success modal
      waitlistModal.classList.add('hidden');
      successModal.classList.remove('hidden');
      
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      alert('There was an error submitting your information. Please try again.');
    }
  });
});
