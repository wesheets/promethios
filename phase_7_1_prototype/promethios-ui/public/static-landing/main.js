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

  // Firebase removed to prevent conflicts with main app
  console.log("Landing page initialized - Firebase integration removed");

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
      // Simple form submission - Firebase removed to prevent conflicts
      // TODO: Implement proper waitlist submission via main app API
      console.log('Waitlist submission:', {
        name: name,
        email: email,
        role: isEarlyAccessDev ? 'developer' : 'user',
        interest: interest,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });
      
      // Reset form
      waitlistForm.reset();
      
      // Hide waitlist modal and show success modal
      waitlistModal.classList.add('hidden');
      successModal.classList.remove('hidden');
      
    } catch (error) {
      console.error('Error submitting waitlist form:', error);
      alert('There was an error submitting your information. Please try again.');
    }
  });
});
