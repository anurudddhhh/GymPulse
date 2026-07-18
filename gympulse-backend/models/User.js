const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  clerkUserId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number },
  gender: { type: String },
  weight: { type: Number }, // in kg
  height: { type: Number }, // in cm
  fitnessGoal: { 
    type: String, 
    enum: ['Muscle Gain', 'Fat Loss', 'Strength', 'General Fitness'] 
  },
  profilePicture: { type: String, default: '' }, // Cloudinary secure URL
  cloudinaryPublicId: { type: String, default: '' }, // For deletion of old avatars
  targetCalories: { type: Number },
  targetProtein: { type: Number },
  targetCarbs: { type: Number },
  targetFats: { type: Number },
  unitPreference: { 
    type: String, 
    enum: ['kg', 'lbs'], 
    default: 'kg' 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);