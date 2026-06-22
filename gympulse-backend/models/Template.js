const mongoose = require('mongoose');

const TemplateExerciseSchema = new mongoose.Schema({
  exerciseName: { type: String, required: true },
  defaultSets: { type: Number, default: 3 },
  defaultReps: { type: Number, default: 10 }
});

const TemplateSchema = new mongoose.Schema({
  // If a user creates this, it will have their ID. If it's a System Template, this will be null.
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false 
  },
  isSystemTemplate: { 
    type: Boolean, 
    default: false 
  },
  templateName: { type: String, required: true },
  exercises: [TemplateExerciseSchema]
}, { timestamps: true });

module.exports = mongoose.model('Template', TemplateSchema);