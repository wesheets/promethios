// Test script to verify VITE environment variables are accessible
console.log('Testing VITE environment variable access...');

// Test import.meta.env access
try {
  if (typeof import !== 'undefined' && import.meta && import.meta.env) {
    console.log('import.meta.env is available');
    console.log('VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY ? 'Found' : 'Not found');
    console.log('VITE_ANTHROPIC_API_KEY:', import.meta.env.VITE_ANTHROPIC_API_KEY ? 'Found' : 'Not found');
  } else {
    console.log('import.meta.env is not available');
  }
} catch (error) {
  console.error('Error accessing import.meta.env:', error);
}

// Test APIClient initialization
try {
  // Import the APIClient module
  import('./public/cmu-playground/modules/apiClient.js').then(module => {
    const apiClient = new module.default();
    console.log('APIClient config.apiKeys:', apiClient.config.apiKeys);
  }).catch(error => {
    console.error('Error importing APIClient:', error);
  });
} catch (error) {
  console.error('Error testing APIClient:', error);
}

