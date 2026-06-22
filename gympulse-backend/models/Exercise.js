const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  category: {
    type: String,
    enum: [
      'Chest', 'Back', 'Shoulders', 
      'Biceps', 'Triceps', 'Forearms', 
      'Quads', 'Hamstrings', 'Glutes', 'Calves', 
      'Core', 'Cardio', 'Full Body'
    ],
    required: true
  }
});

module.exports = mongoose.model('Exercise', ExerciseSchema);