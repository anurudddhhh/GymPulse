const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { GoogleGenAI } = require('@google/genai');
const Nutrition = require('../models/Nutrition');
const authMiddleware = require('../middleware/auth');

// Multer config for image upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Helper to wrap cloudinary upload stream
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'gympulse/meals', resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// @route   POST /api/nutrition/analyze
// @desc    Analyze meal image using Gemini AI and return estimated macros
// @access  Private
router.post('/analyze', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'GEMINI_API_KEY is missing from environment variables' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const { description } = req.body;

    // 1. Upload to Cloudinary to get persistent URL for the feed
    const uploadResult = await uploadToCloudinary(req.file.buffer);
    const imageUrl = uploadResult.secure_url;

    // 2. Call Gemini API
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `You are an objective, scientific nutrition analyzer. Analyze the provided image and text description ("${description || 'None provided'}").
First, determine if the image contains food or drink. 
If the image DOES NOT contain food/drink (e.g., it is a laptop, a dog, a car, or an empty plate), you must return exactly this JSON:
{
  "isFood": false,
  "message": "Please upload a relevant image of a meal or food item."
}
If the image DOES contain food, estimate the macronutrients strictly based on the image and provided description. Do not apply any dietary biases. Return exactly this JSON:
{
  "isFood": true,
  "name": "Short 3-5 word summary of meal",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: req.file.buffer.toString('base64'),
            mimeType: req.file.mimetype
          }
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (result.isFood === false) {
      return res.status(400).json({ message: result.message });
    }

    res.json({
      estimatedMacros: {
        name: result.name,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fats: result.fats
      },
      imageUrl
    });

  } catch (err) {
    console.error('AI Analysis Error:', err);
    res.status(500).json({ message: 'Failed to analyze meal. Please try again.' });
  }
});

// @route   GET /api/nutrition/:date
// @desc    Get nutrition log for a specific date (YYYY-MM-DD)
// @access  Private
router.get('/:date', authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    let log = await Nutrition.findOne({ userId: req.user.userId, date });
    
    if (!log) {
      log = { date, meals: [] };
    }
    
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not fetch nutrition data' });
  }
});

// @route   POST /api/nutrition
// @desc    Add a meal item to a specific date's log
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, name, description, imageUrl, calories, protein, carbs, fats } = req.body;
    
    let log = await Nutrition.findOne({ userId: req.user.userId, date });

    const newMeal = { name, description, imageUrl, calories, protein, carbs, fats };

    if (!log) {
      log = new Nutrition({
        userId: req.user.userId,
        date,
        meals: [newMeal]
      });
    } else {
      log.meals.push(newMeal);
    }

    const savedLog = await log.save();
    res.status(201).json(savedLog);
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not log meal' });
  }
});

// @route   DELETE /api/nutrition/:date/:mealId
// @desc    Delete a specific meal item
// @access  Private
router.delete('/:date/:mealId', authMiddleware, async (req, res) => {
  try {
    const { date, mealId } = req.params;
    const log = await Nutrition.findOne({ userId: req.user.userId, date });

    if (!log) {
      return res.status(404).json({ message: 'Nutrition log not found' });
    }

    log.meals = log.meals.filter(meal => meal._id.toString() !== mealId);
    await log.save();

    res.json({ message: 'Meal deleted successfully', log });
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not delete meal' });
  }
});

module.exports = router;
