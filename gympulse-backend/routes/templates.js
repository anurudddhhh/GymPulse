const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/templates
// @desc    Get system templates AND user's custom templates
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const templates = await Template.find({
      $or: [
        { isSystemTemplate: true }, 
        { userId: req.user.userId }
      ]
    }).sort({ isSystemTemplate: -1, templateName: 1 }); // System templates show up first
    
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not fetch templates' });
  }
});

// @route   POST /api/templates
// @desc    Save a custom user template
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { templateName, exercises } = req.body;
    const newTemplate = new Template({
      userId: req.user.userId,
      isSystemTemplate: false,
      templateName,
      exercises
    });
    
    const savedTemplate = await newTemplate.save();
    res.status(201).json(savedTemplate);
  } catch (err) {
    res.status(500).json({ message: 'Server Error: Could not save template' });
  }
});

module.exports = router;