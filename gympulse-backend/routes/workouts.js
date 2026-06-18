const express = require('express');
const router = express.Router();
const Workout = require('../models/Workout');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/workouts
// @desc    Log a new workout
// @access  Private (Requires Token)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, workoutName, duration, notes, exercises } = req.body;

    const newWorkout = new Workout({
      userId: req.user.userId, // Extracted from the JWT token
      date: date || Date.now(),
      workoutName,
      duration,
      notes,
      exercises
    });

    const savedWorkout = await newWorkout.save();
    res.status(201).json(savedWorkout);

  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not save workout' });
  }
});

// @route   GET /api/workouts
// @desc    Get all workouts for the logged-in user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Find all workouts where the userId matches the logged-in user's token
    const workouts = await Workout.find({ userId: req.user.userId }).sort({ date: -1 });
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not fetch workouts' });
  }
});

// @route   DELETE /api/workouts/:id
// @desc    Delete a workout
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    // Security Check: Ensure the logged-in user actually owns this workout
    if (workout.userId.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'Not authorized to delete this workout' });
    }

    await workout.deleteOne();
    res.json({ message: 'Workout securely deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not delete workout' });
  }
});

module.exports = router;