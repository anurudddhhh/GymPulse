const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number },
  gender: { type: String },
  weight: { type: Number }, // in kg
  height: { type: Number }, // in cm
  fitnessGoal: { 
    type: String, 
    enum: ['Muscle Gain', 'Fat Loss', 'Strength', 'General Fitness'] 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);