const express = require('express');
const router = express.Router();

// Submit feedback
router.post('/submit', (req, res) => {
  const { userId, rating, comments, category } = req.body;
  
  // In a real app, you would save this to a database
  console.log(`Feedback received: Rating ${rating}/5, Category: ${category}, Comments: ${comments}`);
  
  res.status(200).json({ message: 'Feedback submitted successfully' });
});

module.exports = router;
