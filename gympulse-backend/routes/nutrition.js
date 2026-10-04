const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const cloudinary = require('cloudinary').v2;
const { GoogleGenAI } = require('@google/genai');
const Nutrition = require('../models/Nutrition');
const authMiddleware = require('../middleware/auth');

// Multer: 5MB max, memory storage only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Gemini AI scan limiter — 5 calls per 15 minutes per user
const aiScanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip || 'anonymous',
  handler: (req, res) => {
    res.status(429).json({
      message: 'AI scan limit reached. You can analyze up to 5 meals every 15 minutes. Please try again later.',
    });
  },
});

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
// @desc    Multimodal AI meal analysis (Image, Text Description, or Both)
// @access  Private
router.post(
  '/analyze',
  authMiddleware,
  aiScanLimiter,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          message: 'GEMINI_API_KEY is missing from environment variables',
        });
      }

      const description = req.body.description ? req.body.description.trim() : '';

      // Guardrail: Require AT LEAST an image OR a text description
      if (!req.file && !description) {
        return res.status(400).json({
          message: 'Please provide an image, a meal description, or both.',
        });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let contents = [];

      if (req.file && description) {
        // Mode 1: Image + Text Description
        const prompt = `You are an objective, scientific nutrition analyzer. Analyze the provided image and text description ("${description}").
First, determine if the image or description represents food or drink.
If it DOES NOT represent food/drink, return exactly this JSON:
{
  "isFood": false,
  "message": "Please provide a valid image or description of a meal."
}
If it DOES represent food, estimate the macronutrients strictly based on the image and provided context. Return exactly this JSON:
{
  "isFood": true,
  "name": "Short 3-5 word summary of meal",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number
}`;
        contents = [
          prompt,
          {
            inlineData: {
              data: req.file.buffer.toString('base64'),
              mimeType: req.file.mimetype,
            },
          },
        ];
      } else if (req.file) {
        // Mode 2: Image Only
        const prompt = `You are an objective, scientific nutrition analyzer. Analyze the provided image.
First, determine if the image contains food or drink.
If the image DOES NOT contain food/drink, return exactly this JSON:
{
  "isFood": false,
  "message": "Please upload an image of a meal or food item."
}
If the image DOES contain food, estimate the macronutrients strictly based on the image. Return exactly this JSON:
{
  "isFood": true,
  "name": "Short 3-5 word summary of meal",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number
}`;
        contents = [
          prompt,
          {
            inlineData: {
              data: req.file.buffer.toString('base64'),
              mimeType: req.file.mimetype,
            },
          },
        ];
      } else {
        // Mode 3: Text Description Only
        const prompt = `You are an objective, scientific nutrition analyzer. Estimate the macronutrients strictly based on this text description: "${description}".
First, determine if the description represents food or drink.
If the description DOES NOT represent food/drink (e.g., "a red car", "laptop", "random gibberish"), return exactly this JSON:
{
  "isFood": false,
  "message": "Please describe a valid meal or food item."
}
If the description DOES represent food, estimate the macronutrients accurately based on standard nutritional data. Return exactly this JSON:
{
  "isFood": true,
  "name": "Short 3-5 word summary of meal",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number
}`;
        contents = [prompt];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const jsonString = response.text.trim();
      const result = JSON.parse(jsonString);

      if (result.isFood === false) {
        return res.status(400).json({ message: result.message });
      }

      // Upload to Cloudinary ONLY if an image file was provided
      let imageUrl = '';
      if (req.file) {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        imageUrl = uploadResult.secure_url;
      }

      res.json({
        estimatedMacros: {
          name: result.name,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fats: result.fats,
        },
        imageUrl,
      });
    } catch (err) {
      console.error('AI Analysis Error:', err);
      res.status(500).json({ message: 'Failed to analyze meal. Please try again.' });
    }
  }
);

// @route   GET /api/nutrition/week/:date
// @desc    7-day nutrition summary ending on :date
// @access  Private
router.get('/week/:date', authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    const anchorDate = new Date(date + 'T00:00:00Z');
    const dates = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchorDate);
      d.setUTCDate(d.getUTCDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const logs = await Nutrition.find({
      userId: req.user.userId,
      date: { $in: dates },
    });

    const logMap = {};
    logs.forEach((log) => {
      const totals = log.meals.reduce(
        (acc, m) => ({
          calories: acc.calories + (m.calories || 0),
          protein: acc.protein + (m.protein || 0),
          carbs: acc.carbs + (m.carbs || 0),
          fats: acc.fats + (m.fats || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );
      logMap[log.date] = totals;
    });

    const weeklySummary = dates.map((dStr) => {
      const totals = logMap[dStr] || { calories: 0, protein: 0, carbs: 0, fats: 0 };
      const dayName = new Date(dStr + 'T00:00:00Z').toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: 'UTC',
      });
      return { date: dStr, day: dayName, ...totals };
    });

    res.json(weeklySummary);
  } catch (err) {
    console.error('Weekly summary fetch error:', err);
    res.status(500).json({ message: 'Server Error: Could not fetch weekly summary' });
  }
});

// @route   GET /api/nutrition/:date
router.get('/:date', authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    let log = await Nutrition.findOne({ userId: req.user.userId, date });
    if (!log) log = { date, meals: [] };
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not fetch nutrition data' });
  }
});

// @route   POST /api/nutrition
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, name, description, imageUrl, calories, protein, carbs, fats } = req.body;

    let log = await Nutrition.findOne({ userId: req.user.userId, date });
    const newMeal = { name, description, imageUrl, calories, protein, carbs, fats };

    if (!log) {
      log = new Nutrition({
        userId: req.user.userId,
        date,
        meals: [newMeal],
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
router.delete('/:date/:mealId', authMiddleware, async (req, res) => {
  try {
    const { date, mealId } = req.params;
    const log = await Nutrition.findOne({ userId: req.user.userId, date });

    if (!log) {
      return res.status(404).json({ message: 'Nutrition log not found' });
    }

    log.meals = log.meals.filter((meal) => meal._id.toString() !== mealId);
    await log.save();

    res.json({ message: 'Meal deleted successfully', log });
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not delete meal' });
  }
});

module.exports = router;