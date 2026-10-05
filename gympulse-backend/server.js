const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load env variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Global connection state for serverless execution (Vercel)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Prevents 10-second query buffering timeouts during cold starts
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then(async (m) => {
      console.log('MongoDB Connected successfully');

      // DB Migration: Run migration without blocking DB connection
      try {
        const db = m.connection.db;
        const collections = await db.listCollections({ name: 'exercises' }).toArray();
        if (collections.length > 0) {
          const indexes = await db.collection('exercises').indexes();
          const hasOldIndex = indexes.some(idx => idx.name === 'name_1' && idx.unique);
          if (hasOldIndex) {
            await db.collection('exercises').dropIndex('name_1');
            console.log('DB Migration: Dropped legacy unique index on exercises.name');
          }
        }
      } catch (err) {
        console.error('DB Migration Error:', err);
      }

      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

// Database Readiness Middleware - Guarantees DB is fully connected BEFORE routes process requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in middleware:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Route Middleware
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/users', require('./routes/users'));
app.use('/api/nutrition', require('./routes/nutrition'));

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;