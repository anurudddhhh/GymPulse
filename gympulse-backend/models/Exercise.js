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
  description: {
    type: String,
    default: ''
  },
  primaryMuscles: [{
    type: String
  }],
  secondaryMuscles: [{
    type: String
  }],
  formCues: [{
    type: String
  }],
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

// Compound unique index ensuring a user cannot duplicate exercise names in their own custom scope
ExerciseSchema.index({ name: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Exercise', ExerciseSchema);