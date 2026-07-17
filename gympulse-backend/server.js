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

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully');
    
    // DB Migration: Drop old unique index on exercises if it exists
    try {
      const db = mongoose.connection.db;
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
  })
  .catch((err) => console.log('MongoDB Connection Error: ', err));

// Route Middleware
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/users', require('./routes/users'));
app.use('/api/nutrition', require('./routes/nutrition'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));