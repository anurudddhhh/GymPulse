const mongoose = require('mongoose');

// We define the Exercise structure first so we can embed it in the Workout
const ExerciseSchema = new mongoose.Schema({
  exerciseName: { type: String, required: true },
  sets: [{
    weight: { type: Number, required: true }, // in kg
    reps: { type: Number, required: true }
  }]
});

const WorkoutSchema = new mongoose.Schema({
  // This links the workout directly to the user who logged in
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { type: Date, default: Date.now },
  workoutName: { type: String, required: true },
  duration: { type: Number }, // in minutes
  notes: { type: String },
  exercises: [ExerciseSchema] // Array of the exercises defined above
}, { timestamps: true });

module.exports = mongoose.model('Workout', WorkoutSchema);