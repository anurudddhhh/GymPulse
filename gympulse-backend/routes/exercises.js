const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/exercises
// @desc    Get all exercises sorted alphabetically
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const exercises = await Exercise.find().sort({ name: 1 });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not fetch exercises' });
  }
});

module.exports = router;