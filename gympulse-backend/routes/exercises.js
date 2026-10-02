const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/exercises
// @desc    Get all system exercises + user's custom exercises
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const exercises = await Exercise.find({
      $or: [
        { isCustom: false },
        { userId: req.user.userId }
      ]
    }).sort({ name: 1 });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not fetch exercises' });
  }
});

// @route   POST /api/exercises
// @desc    Create a custom exercise for the user (with rich guide fields)
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      name, 
      category, 
      description, 
      primaryMuscles, 
      secondaryMuscles, 
      formCues 
    } = req.body;
    
    const newExercise = new Exercise({
      name,
      category,
      description: description || '',
      primaryMuscles: Array.isArray(primaryMuscles) ? primaryMuscles : [],
      secondaryMuscles: Array.isArray(secondaryMuscles) ? secondaryMuscles : [],
      formCues: Array.isArray(formCues) ? formCues : [],
      isCustom: true,
      userId: req.user.userId
    });

    const savedExercise = await newExercise.save();
    res.status(201).json(savedExercise);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You already have an exercise with this name' });
    }
    res.status(500).json({ message: 'Server Error: Could not create custom exercise' });
  }
});

// @route   DELETE /api/exercises/:id
// @desc    Delete a custom exercise
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    // Security: Only allow deleting if it's a custom exercise owned by this user
    if (!exercise.isCustom || exercise.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this exercise' });
    }

    await exercise.deleteOne();
    res.json({ message: 'Exercise deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not delete exercise' });
  }
});

module.exports = router;