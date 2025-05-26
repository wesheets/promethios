const express = require('express');
const router = express.Router();

// Mock user database
const users = [];

// Register endpoint
router.post('/register', (req, res) => {
  const { email, password } = req.body;
  
  // Check if user already exists
  if (users.find(user => user.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  // Create new user
  const newUser = { id: Date.now().toString(), email, password };
  users.push(newUser);
  
  res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
});

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Find user
  const user = users.find(user => user.email === email && user.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // In a real app, you would generate a JWT token here
  res.status(200).json({ 
    message: 'Login successful',
    userId: user.id,
    token: `mock-jwt-token-${user.id}`
  });
});

// Waitlist endpoint
router.post('/waitlist', (req, res) => {
  const { email, name, company } = req.body;
  
  // In a real app, you would save this to a database
  console.log(`Waitlist request: ${name} (${email}) from ${company || 'N/A'}`);
  
  res.status(200).json({ message: 'Added to waitlist successfully' });
});

module.exports = router;
