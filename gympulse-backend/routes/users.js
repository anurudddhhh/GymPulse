const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Configure Cloudinary (reads from env vars)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer memory storage -- no temp files on disk, 5MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   GET /api/users/me
// @desc    Get the authenticated user's profile
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error: Could not fetch profile' });
  }
});

// @route   PUT /api/users/me
// @desc    Update profile settings (name, age, gender, weight, height, fitnessGoal, unitPreference)
// @access  Private
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const allowedFields = ['name', 'age', 'gender', 'weight', 'height', 'fitnessGoal', 'unitPreference', 'targetCalories', 'targetProtein', 'targetCarbs', 'targetFats'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error: Could not update profile' });
  }
});

// @route   POST /api/users/me/avatar
// @desc    Upload a profile picture to Cloudinary
// @access  Private
router.post('/me/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ message: 'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete old avatar from Cloudinary if one exists
    if (user.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(user.cloudinaryPublicId);
      } catch (deleteErr) {
        console.error('Failed to delete old avatar from Cloudinary:', deleteErr);
      }
    }

    // Upload new avatar using stream (pipe buffer directly, no temp file)
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'gympulse/avatars',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }
          ],
          resource_type: 'image'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    // Save the Cloudinary URL and public_id to the user document
    user.profilePicture = uploadResult.secure_url;
    user.cloudinaryPublicId = uploadResult.public_id;
    await user.save();

    res.json({
      profilePicture: user.profilePicture,
      message: 'Avatar uploaded successfully'
    });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ message: 'Server error: Could not upload avatar' });
  }
});

module.exports = router;
