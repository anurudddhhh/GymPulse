const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://rathoreaps27104_db_user:ysvKbGGamDV755bF@cluster0.xkekgx1.mongodb.net').then(async () => {
  const Exercise = require('./models/Exercise');
  try {
    await Exercise.updateMany({}, { $set: { isCustom: false } });
    console.log('Fixed missing isCustom flag on all exercises!');
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
});
