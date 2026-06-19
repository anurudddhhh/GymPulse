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

// @route   GET /api/workouts/activity
// @desc    Get workout activity dates for the consistency heatmap
// @access  Private
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    // Only grab the dates to keep the payload extremely lightweight
    const workouts = await Workout.find({ userId: req.user.userId }).select('date');

    const activityMap = {};
    
    // Group workouts by date and count them
    workouts.forEach(workout => {
      const dateStr = new Date(workout.date).toISOString().split('T')[0];
      activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    });

    // Format for react-activity-calendar
    const activityData = Object.keys(activityMap).map(date => {
      const count = activityMap[date];
      // Max color intensity level is 4. If they log 4+ workouts in a day, it stays at max intensity.
      const level = Math.min(count, 4); 
      return { date, count, level };
    });

    res.json(activityData);
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not fetch activity data' });
  }
});


// @route   GET /api/workouts/history/:exerciseName
// @desc    Get weight history for a specific exercise to plot on a progress chart
// @access  Private
router.get('/history/:exerciseName', authMiddleware, async (req, res) => {
  try {
    const { exerciseName } = req.params;

    // Find all workouts for this user containing the targeted exercise name (case-insensitive)
    const workouts = await Workout.find({
      userId: req.user.userId,
      'exercises.exerciseName': { $regex: new RegExp(`^${exerciseName}$`, 'i') }
    }).sort({ date: 1 }); // Sort ascending by date to generate a proper historical timeline

    // Map through sessions and pull the heaviest set recorded for each individual day
    const chartData = workouts.map(workout => {
      const exercise = workout.exercises.find(
        ex => ex.exerciseName.toLowerCase() === exerciseName.toLowerCase()
      );

      let maxWeight = 0;
      let maxReps = 0;
      
      if (exercise && exercise.sets.length > 0) {
        exercise.sets.forEach(set => {
          if (set.weight > maxWeight) {
            maxWeight = set.weight;
            maxReps = set.reps;
          }
        });
      }

      return {
        date: new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        maxWeight,
        maxReps
      };
    });

    res.json(chartData);
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not fetch exercise history' });
  }
});

module.exports = router;