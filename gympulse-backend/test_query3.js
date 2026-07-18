const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://rathoreaps27104_db_user:ysvKbGGamDV755bF@cluster0.xkekgx1.mongodb.net').then(async () => {
  const Workout = require('./models/Workout');
  const count = await Workout.countDocuments({ userId: '6a32da45826cd29ab24e56c0' });
  console.log('Workouts for old email:', count);
  process.exit(0);
});
