const mongoose = require('mongoose');

const MealItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String }, // User's text description of the meal
  imageUrl: { type: String }, // Cloudinary URL of the meal photo
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fats: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const NutritionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: String, // YYYY-MM-DD
    required: true 
  },
  meals: [MealItemSchema]
}, { timestamps: true });

// Ensure we only have one Nutrition log per user per day
NutritionSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Nutrition', NutritionSchema);
