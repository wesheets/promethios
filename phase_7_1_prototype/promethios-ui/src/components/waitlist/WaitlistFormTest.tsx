import React from 'react';
import WaitlistForm from './WaitlistForm';

const WaitlistFormTest: React.FC = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Waitlist Form Test Page</h1>
      <WaitlistForm />
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
        <h3>Test Instructions:</h3>
        <ol style={{ paddingLeft: '1.5rem' }}>
          <li>Try submitting the form with all fields filled correctly</li>
          <li>Try submitting without required fields</li>
          <li>Check the browser console for any errors</li>
          <li>Verify data appears in Supabase waitlist table after submission</li>
        </ol>
      </div>
    </div>
  );
};

export default WaitlistFormTest;
