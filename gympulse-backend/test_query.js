const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://rathoreaps27104_db_user:ysvKbGGamDV755bF@cluster0.xkekgx1.mongodb.net').then(async () => {
  const Exercise = require('./models/Exercise');
  try {
    const exercises = await Exercise.find({
      $or: [
        { isCustom: false },
        { userId: '6a32da45826cd29ab24e56c0' }
      ]
    }).sort({ name: 1 });
    console.log('Query result count:', exercises.length);
  } catch (err) {
    console.error('Query Error:', err);
  }
  process.exit(0);
});
