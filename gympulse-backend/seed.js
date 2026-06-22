require('dotenv').config();
const mongoose = require('mongoose');
const Exercise = require('./models/Exercise');
const Template = require('./models/Template');

const exercises = [
  // CHEST
  { name: 'Barbell Bench Press', category: 'Chest' },
  { name: 'Dumbbell Bench Press', category: 'Chest' },
  { name: 'Incline Barbell Bench Press', category: 'Chest' },
  { name: 'Incline Dumbbell Press', category: 'Chest' },
  { name: 'Decline Barbell Bench Press', category: 'Chest' },
  { name: 'Decline Dumbbell Press', category: 'Chest' },
  { name: 'Pec Deck Fly', category: 'Chest' },
  { name: 'Cable Crossover', category: 'Chest' },
  { name: 'Push-ups', category: 'Chest' },
  { name: 'Dips (Chest Focus)', category: 'Chest' },
  { name: 'Dumbbell Pullover', category: 'Chest' },
  { name: 'Machine Chest Press', category: 'Chest' },

  // BACK
  { name: 'Deadlift', category: 'Back' },
  { name: 'Barbell Row', category: 'Back' },
  { name: 'Dumbbell Row', category: 'Back' },
  { name: 'Lat Pulldown', category: 'Back' },
  { name: 'Pull-ups', category: 'Back' },
  { name: 'Chin-ups', category: 'Back' },
  { name: 'Seated Cable Row', category: 'Back' },
  { name: 'T-Bar Row', category: 'Back' },
  { name: 'Pendlay Row', category: 'Back' },
  { name: 'Meadows Row', category: 'Back' },
  { name: 'Straight Arm Pulldown', category: 'Back' },
  { name: 'Good Mornings', category: 'Back' },

  // SHOULDERS
  { name: 'Overhead Press (OHP)', category: 'Shoulders' },
  { name: 'Dumbbell Shoulder Press', category: 'Shoulders' },
  { name: 'Arnold Press', category: 'Shoulders' },
  { name: 'Dumbbell Lateral Raise', category: 'Shoulders' },
  { name: 'Cable Lateral Raise', category: 'Shoulders' },
  { name: 'Front Raise', category: 'Shoulders' },
  { name: 'Reverse Pec Deck', category: 'Shoulders' },
  { name: 'Face Pulls', category: 'Shoulders' },
  { name: 'Upright Row', category: 'Shoulders' },
  { name: 'Barbell Shrugs', category: 'Shoulders' },
  { name: 'Dumbbell Shrugs', category: 'Shoulders' },

  // BICEPS
  { name: 'Barbell Bicep Curl', category: 'Biceps' },
  { name: 'Dumbbell Alternate Bicep Curl', category: 'Biceps' },
  { name: 'Hammer Curl', category: 'Biceps' },
  { name: 'EZ Bar Curl', category: 'Biceps' },
  { name: 'Preacher Curl', category: 'Biceps' },
  { name: 'Cable Bicep Curl', category: 'Biceps' },
  { name: 'Concentration Curl', category: 'Biceps' },
  { name: 'Spider Curl', category: 'Biceps' },

  // TRICEPS
  { name: 'Tricep Rope Pushdown', category: 'Triceps' },
  { name: 'Straight Bar Pushdown', category: 'Triceps' },
  { name: 'Overhead Tricep Extension', category: 'Triceps' },
  { name: 'Skull Crushers', category: 'Triceps' },
  { name: 'Close Grip Bench Press', category: 'Triceps' },
  { name: 'Tricep Dips', category: 'Triceps' },
  { name: 'Dumbbell Kickbacks', category: 'Triceps' },
  { name: 'JM Press', category: 'Triceps' },

  // FOREARMS
  { name: 'Barbell Wrist Curl', category: 'Forearms' },
  { name: 'Reverse Barbell Wrist Curl', category: 'Forearms' },
  { name: 'Reverse Barbell Curl', category: 'Forearms' },
  { name: 'Farmers Walk', category: 'Forearms' },

  // QUADS
  { name: 'Barbell Squat', category: 'Quads' },
  { name: 'Front Squat', category: 'Quads' },
  { name: 'Leg Press', category: 'Quads' },
  { name: 'Hack Squat', category: 'Quads' },
  { name: 'Leg Extension', category: 'Quads' },
  { name: 'Bulgarian Split Squat', category: 'Quads' },
  { name: 'Goblet Squat', category: 'Quads' },
  { name: 'Walking Lunges', category: 'Quads' },
  { name: 'Sissy Squat', category: 'Quads' },

  // HAMSTRINGS
  { name: 'Romanian Deadlift (RDL)', category: 'Hamstrings' },
  { name: 'Stiff-Legged Deadlift', category: 'Hamstrings' },
  { name: 'Lying Leg Curl', category: 'Hamstrings' },
  { name: 'Seated Leg Curl', category: 'Hamstrings' },
  { name: 'Glute-Ham Raise (GHR)', category: 'Hamstrings' },
  { name: 'Nordic Hamstring Curl', category: 'Hamstrings' },

  // GLUTES
  { name: 'Barbell Hip Thrust', category: 'Glutes' },
  { name: 'Glute Bridge', category: 'Glutes' },
  { name: 'Cable Pull-Through', category: 'Glutes' },
  { name: 'Cable Glute Kickbacks', category: 'Glutes' },
  { name: 'Hip Abductor Machine', category: 'Glutes' },

  // CALVES
  { name: 'Standing Calf Raise', category: 'Calves' },
  { name: 'Seated Calf Raise', category: 'Calves' },
  { name: 'Leg Press Calf Raise', category: 'Calves' },
  { name: 'Donkey Calf Raise', category: 'Calves' },

  // CORE
  { name: 'Cable Crunches', category: 'Core' },
  { name: 'Hanging Leg Raise', category: 'Core' },
  { name: 'Plank', category: 'Core' },
  { name: 'Russian Twists', category: 'Core' },
  { name: 'Ab Wheel Rollout', category: 'Core' },
  { name: 'Decline Sit-ups', category: 'Core' },
  { name: 'Bicycle Crunches', category: 'Core' }
];

const systemTemplates = [
  {
    templateName: 'Push Day (Chest, Shoulders, Triceps)',
    isSystemTemplate: true,
    exercises: [
      { exerciseName: 'Barbell Bench Press', defaultSets: 3, defaultReps: 8 },
      { exerciseName: 'Overhead Press (OHP)', defaultSets: 3, defaultReps: 10 },
      { exerciseName: 'Incline Dumbbell Press', defaultSets: 3, defaultReps: 10 },
      { exerciseName: 'Dumbbell Lateral Raise', defaultSets: 3, defaultReps: 15 },
      { exerciseName: 'Tricep Rope Pushdown', defaultSets: 3, defaultReps: 12 }
    ]
  },
  {
    templateName: 'Pull Day (Back, Biceps)',
    isSystemTemplate: true,
    exercises: [
      { exerciseName: 'Deadlift', defaultSets: 3, defaultReps: 5 },
      { exerciseName: 'Lat Pulldown', defaultSets: 3, defaultReps: 10 },
      { exerciseName: 'Barbell Row', defaultSets: 3, defaultReps: 10 },
      { exerciseName: 'Face Pulls', defaultSets: 3, defaultReps: 15 },
      { exerciseName: 'Barbell Bicep Curl', defaultSets: 3, defaultReps: 12 }
    ]
  },
  {
    templateName: 'Leg Day (Quads, Hams, Calves)',
    isSystemTemplate: true,
    exercises: [
      { exerciseName: 'Barbell Squat', defaultSets: 3, defaultReps: 8 },
      { exerciseName: 'Leg Press', defaultSets: 3, defaultReps: 10 },
      { exerciseName: 'Romanian Deadlift (RDL)', defaultSets: 3, defaultReps: 10 },
      { exerciseName: 'Leg Extension', defaultSets: 3, defaultReps: 15 },
      { exerciseName: 'Standing Calf Raise', defaultSets: 4, defaultReps: 15 }
    ]
  },
  {
    templateName: 'Upper Body Power',
    isSystemTemplate: true,
    exercises: [
      { exerciseName: 'Barbell Bench Press', defaultSets: 4, defaultReps: 5 },
      { exerciseName: 'Barbell Row', defaultSets: 4, defaultReps: 5 },
      { exerciseName: 'Overhead Press (OHP)', defaultSets: 3, defaultReps: 8 },
      { exerciseName: 'Pull-ups', defaultSets: 3, defaultReps: 8 },
      { exerciseName: 'Barbell Bicep Curl', defaultSets: 3, defaultReps: 10 },
      { exerciseName: 'Skull Crushers', defaultSets: 3, defaultReps: 10 }
    ]
  },
  {
    templateName: 'Lower Body Hypertrophy',
    isSystemTemplate: true,
    exercises: [
      { exerciseName: 'Hack Squat', defaultSets: 3, defaultReps: 10 },
      { exerciseName: 'Barbell Hip Thrust', defaultSets: 3, defaultReps: 12 },
      { exerciseName: 'Walking Lunges', defaultSets: 3, defaultReps: 20 },
      { exerciseName: 'Lying Leg Curl', defaultSets: 3, defaultReps: 15 },
      { exerciseName: 'Seated Calf Raise', defaultSets: 4, defaultReps: 20 }
    ]
  },
  {
    templateName: 'Full Body Circuit',
    isSystemTemplate: true,
    exercises: [
      { exerciseName: 'Barbell Squat', defaultSets: 3, defaultReps: 10 },
      { exerciseName: 'Barbell Bench Press', defaultSets: 3, defaultReps: 10 },
      { exerciseName: 'Barbell Row', defaultSets: 3, defaultReps: 10 },
      { exerciseName: 'Overhead Press (OHP)', defaultSets: 3, defaultReps: 10 },
      { exerciseName: 'Cable Crunches', defaultSets: 3, defaultReps: 15 }
    ]
  }
];

const runSeeder = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    console.log('Clearing old data...');
    await Exercise.deleteMany();
    await Template.deleteMany({ isSystemTemplate: true }); 

    console.log('Injecting 80+ Exercises...');
    await Exercise.insertMany(exercises);

    console.log('Injecting System Templates...');
    await Template.insertMany(systemTemplates);

    console.log('✅ Database Seeded Successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeder Error:', err);
    process.exit(1);
  }
};

runSeeder();