const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true
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
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.isCustom;
    }
  }
});

// Ensure a user cannot create multiple custom exercises with the exact same name
// (System exercises will have a null userId)
ExerciseSchema.index({ name: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Exercise', ExerciseSchema);