require('dotenv').config();
const mongoose = require('mongoose');
const Exercise = require('./models/Exercise');
const Template = require('./models/Template');

const exercises = [
  // CHEST
  {
    name: 'Barbell Bench Press',
    category: 'Chest',
    description: 'The primary horizontal push compound movement for developing upper body pushing strength and chest mass.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoids', 'Triceps Brachii'],
    formCues: [
      'Retract and depress shoulder blades into the bench.',
      'Maintain a slight arch in the lower back with feet flat on floor.',
      'Lower the bar with control to mid-sternum.',
      'Press upward and slightly backward toward the shoulders.'
    ]
  },
  {
    name: 'Dumbbell Bench Press',
    category: 'Chest',
    description: 'A dumbbell chest press allowing a greater range of motion and independent unilateral stabilizer work.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoids', 'Triceps Brachii'],
    formCues: [
      'Set dumbbells over chest with palms facing slightly inward.',
      'Lower weights smoothly until stretch is felt in mid-chest.',
      'Press up in a gentle arc without clacking dumbbells together.'
    ]
  },
  {
    name: 'Incline Barbell Bench Press',
    category: 'Chest',
    description: 'An inclined press targeting the clavicular head (upper chest) and front shoulders.',
    primaryMuscles: ['Upper Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoids', 'Triceps Brachii'],
    formCues: [
      'Set bench angle between 30 and 45 degrees.',
      'Lower bar to upper collarbone region under full control.',
      'Drive feet into floor and press straight up.'
    ]
  },
  {
    name: 'Incline Dumbbell Press',
    category: 'Chest',
    description: 'Targeted upper chest press with dumbbells for maximum stretch and contraction.',
    primaryMuscles: ['Upper Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoids', 'Triceps Brachii'],
    formCues: [
      'Keep bench set to 30 degrees to avoid over-engaging shoulders.',
      'Pause briefly at the bottom stretch position.',
      'Squeeze upper chest at top of press.'
    ]
  },
  {
    name: 'Decline Barbell Bench Press',
    category: 'Chest',
    description: 'A declined pressing angle focusing load on the lower sternal head of the pectoralis major.',
    primaryMuscles: ['Lower Pectoralis Major'],
    secondaryMuscles: ['Triceps Brachii', 'Anterior Deltoids'],
    formCues: [
      'Secure legs under decline bench pads.',
      'Lower bar to lower sternum.',
      'Lock out elbows at top with controlled tempo.'
    ]
  },
  {
    name: 'Decline Dumbbell Press',
    category: 'Chest',
    description: 'Decline pressing with dumbbells for deep lower chest stretch and elbow freedom.',
    primaryMuscles: ['Lower Pectoralis Major'],
    secondaryMuscles: ['Triceps Brachii'],
    formCues: [
      'Lower dumbbells slowly to outer lower chest.',
      'Keep elbows at 45-degree angle to torso.',
      'Press up toward center line.'
    ]
  },
  {
    name: 'Pec Deck Fly',
    category: 'Chest',
    description: 'Isolation exercise targeting chest contraction without arm or shoulder fatigue.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoids'],
    formCues: [
      'Set seat so handles align with mid-chest level.',
      'Keep slight bend in elbows throughout movement.',
      'Bring handles together and hold peak contraction for 1 second.'
    ]
  },
  {
    name: 'Cable Crossover',
    category: 'Chest',
    description: 'Continuous cable tension fly focusing on chest isolation across full range of motion.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoids'],
    formCues: [
      'Step forward from cable stack with soft knees.',
      'Cross hands slightly over each other at bottom for extra squeeze.',
      'Control eccentric return without letting shoulders roll forward.'
    ]
  },
  {
    name: 'Push-ups',
    category: 'Chest',
    description: 'Fundamental bodyweight pressing movement for chest, core, and shoulder endurance.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Triceps Brachii', 'Anterior Deltoids', 'Core'],
    formCues: [
      'Place hands slightly wider than shoulder-width.',
      'Keep body in rigid plank line from head to heels.',
      'Lower chest within an inch of floor before pressing up.'
    ]
  },
  {
    name: 'Dips (Chest Focus)',
    category: 'Chest',
    description: 'Bodyweight chest dip utilizing forward torso lean for lower pectoral development.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Triceps Brachii', 'Anterior Deltoids'],
    formCues: [
      'Lean torso forward roughly 30 degrees.',
      'Flare elbows slightly outward during descent.',
      'Lower until shoulders are below elbows, then press up.'
    ]
  },
  {
    name: 'Dumbbell Pullover',
    category: 'Chest',
    description: 'Overhead extension targeting chest stretch and serratus wall.',
    primaryMuscles: ['Pectoralis Major', 'Latissimus Dorsi'],
    secondaryMuscles: ['Serratus Anterior', 'Triceps (Long Head)'],
    formCues: [
      'Rest upper back perpendicular across bench.',
      'Hold single dumbbell overhead with elbows soft.',
      'Lower weight behind head until deep ribcage stretch is felt.'
    ]
  },
  {
    name: 'Machine Chest Press',
    category: 'Chest',
    description: 'Guided machine press ideal for safe hypertrophy and mechanical fatigue.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Triceps Brachii'],
    formCues: [
      'Adjust seat height so handles align with mid-chest.',
      'Keep shoulders pressed back against pad throughout movement.'
    ]
  },

  // BACK
  {
    name: 'Deadlift',
    category: 'Back',
    description: 'Ultimate full-body posterior chain strength exercise lifting dead weight from the floor.',
    primaryMuscles: ['Erector Spinae', 'Gluteus Maximus', 'Hamstrings'],
    secondaryMuscles: ['Latissimus Dorsi', 'Trapezius', 'Forearms'],
    formCues: [
      'Position feet hip-width apart with bar over mid-foot.',
      'Hinge at hips, grip bar, and pull chest up to remove slack.',
      'Drive through floor with legs while keeping bar close to shins.',
      'Lock out hips fully at top without hyperextending lower back.'
    ]
  },
  {
    name: 'Barbell Row',
    category: 'Back',
    description: 'Compound pulling builder for upper back thickness, lats, and posture.',
    primaryMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Trapezius'],
    secondaryMuscles: ['Biceps Brachii', 'Rear Deltoids', 'Erector Spinae'],
    formCues: [
      'Hinge torso over at roughly 45 degrees with flat spine.',
      'Pull barbell toward lower ribcage / navel.',
      'Squeeze shoulder blades together at top of rep.'
    ]
  },
  {
    name: 'Dumbbell Row',
    category: 'Back',
    description: 'Unilateral back rowing exercise allowing deep lat stretch and full elbow drive.',
    primaryMuscles: ['Latissimus Dorsi'],
    secondaryMuscles: ['Rhomboids', 'Biceps Brachii', 'Rear Deltoids'],
    formCues: [
      'Support knee and hand on flat bench.',
      'Pull dumbbell toward hip socket, leading with elbow.',
      'Avoid rotating hips or torso to swing weight up.'
    ]
  },
  {
    name: 'Lat Pulldown',
    category: 'Back',
    description: 'Vertical pulling cable exercise building upper back width and lat muscle mass.',
    primaryMuscles: ['Latissimus Dorsi'],
    secondaryMuscles: ['Biceps Brachii', 'Rear Deltoids', 'Brachialis'],
    formCues: [
      'Grip bar slightly wider than shoulder-width.',
      'Pull bar down toward upper chest while driving elbows down.',
      'Avoid leaning backward excessively.'
    ]
  },
  {
    name: 'Pull-ups',
    category: 'Back',
    description: 'Gold-standard bodyweight vertical pull using overhand grip.',
    primaryMuscles: ['Latissimus Dorsi', 'Upper Back'],
    secondaryMuscles: ['Biceps Brachii', 'Forearms'],
    formCues: [
      'Grip bar with palms facing away from you.',
      'Pull collarbone up to bar level.',
      'Lower fully into dead hang under control.'
    ]
  },
  {
    name: 'Chin-ups',
    category: 'Back',
    description: 'Underhand vertical pull emphasizing lat width and heavy bicep engagement.',
    primaryMuscles: ['Latissimus Dorsi', 'Biceps Brachii'],
    secondaryMuscles: ['Forearms', 'Rhomboids'],
    formCues: [
      'Grip bar shoulder-width apart with palms facing you.',
      'Pull chest up to bar level.',
      'Control lowering phase fully.'
    ]
  },
  {
    name: 'Seated Cable Row',
    category: 'Back',
    description: 'Horizontal cable pull targeting mid-back thickness, lats, and rear shoulders.',
    primaryMuscles: ['Rhomboids', 'Latissimus Dorsi', 'Mid-Trapezius'],
    secondaryMuscles: ['Biceps Brachii', 'Rear Deltoids'],
    formCues: [
      'Sit tall with chest up and slight bend in knees.',
      'Pull handle to stomach while pulling shoulder blades back.',
      'Extend arms fully forward for stretch without slouching.'
    ]
  },
  {
    name: 'T-Bar Row',
    category: 'Back',
    description: 'Heavy landmine or machine row for upper back density and thickness.',
    primaryMuscles: ['Rhomboids', 'Latissimus Dorsi'],
    secondaryMuscles: ['Biceps Brachii', 'Erector Spinae'],
    formCues: [
      'Straddle bar, hinge at hips, and pull handles toward chest.',
      'Maintain tight core and static spinal angle.'
    ]
  },
  {
    name: 'Pendlay Row',
    category: 'Back',
    description: 'Strict horizontal barbell row starting from dead rest on floor for explosive power.',
    primaryMuscles: ['Latissimus Dorsi', 'Rhomboids'],
    secondaryMuscles: ['Erector Spinae', 'Biceps Brachii'],
    formCues: [
      'Torso parallel to floor on every rep.',
      'Explode bar off floor to lower chest, then return to dead stop.'
    ]
  },
  {
    name: 'Straight Arm Pulldown',
    category: 'Back',
    description: 'Isolation cable exercise targeting lats without bicep assistance.',
    primaryMuscles: ['Latissimus Dorsi'],
    secondaryMuscles: ['Teres Major', 'Triceps (Long Head)'],
    formCues: [
      'Soft bend in elbows with wrists firm.',
      'Pull cable bar in arc down to thighs.',
      'Pause and squeeze lats at bottom.'
    ]
  },

  // SHOULDERS
  {
    name: 'Overhead Press (OHP)',
    category: 'Shoulders',
    description: 'Standing barbell press developing overhead shoulder strength and core stability.',
    primaryMuscles: ['Anterior Deltoids', 'Lateral Deltoids'],
    secondaryMuscles: ['Triceps Brachii', 'Upper Pectoralis'],
    formCues: [
      'Rest bar on front deltoids with glutes and core squeezed.',
      'Press straight up, tucking head back slightly as bar passes face.',
      'Lock out overhead over mid-foot.'
    ]
  },
  {
    name: 'Dumbbell Shoulder Press',
    category: 'Shoulders',
    description: 'Seated or standing dumbbell press for balanced anterior and lateral deltoid growth.',
    primaryMuscles: ['Anterior Deltoids', 'Lateral Deltoids'],
    secondaryMuscles: ['Triceps Brachii'],
    formCues: [
      'Set dumbbells at ear level with palms angled slightly in.',
      'Press upward until arms fully extend overhead.',
      'Control weights on descent.'
    ]
  },
  {
    name: 'Arnold Press',
    category: 'Shoulders',
    description: 'Rotational dumbbell press named after Arnold Schwarzenegger for complete deltoid coverage.',
    primaryMuscles: ['Anterior Deltoids', 'Lateral Deltoids'],
    secondaryMuscles: ['Triceps Brachii'],
    formCues: [
      'Start with dumbbells at chest level, palms facing you.',
      'Rotate palms outward as you press upward overhead.',
      'Reverse rotation smoothly on way down.'
    ]
  },
  {
    name: 'Dumbbell Lateral Raise',
    category: 'Shoulders',
    description: 'Key isolation movement for building wide lateral deltoids and shoulder width.',
    primaryMuscles: ['Lateral Deltoids'],
    secondaryMuscles: ['Trapezius'],
    formCues: [
      'Slight forward torso lean with elbows soft.',
      'Raise arms in scaption plane (30 degrees forward).',
      'Lead with elbows and pause briefly at shoulder height.'
    ]
  },
  {
    name: 'Cable Lateral Raise',
    category: 'Shoulders',
    description: 'Lateral raise using cable resistance for continuous tension throughout full range.',
    primaryMuscles: ['Lateral Deltoids'],
    secondaryMuscles: ['Trapezius'],
    formCues: [
      'Set pulley to lowest height.',
      'Raise cable across body to shoulder level.',
      'Lower slowly against cable tension.'
    ]
  },
  {
    name: 'Face Pulls',
    category: 'Shoulders',
    description: 'Essential posture and shoulder health movement hitting rear delts and rotator cuff.',
    primaryMuscles: ['Rear Deltoids', 'Rotator Cuff'],
    secondaryMuscles: ['Rhomboids', 'Mid-Trapezius'],
    formCues: [
      'Set cable to upper chest height with rope attachment.',
      'Pull center of rope toward forehead.',
      'Externally rotate shoulders at end of movement.'
    ]
  },
  {
    name: 'Reverse Pec Deck',
    category: 'Shoulders',
    description: 'Machine rear deltoid fly for isolated posterior shoulder hypertrophy.',
    primaryMuscles: ['Rear Deltoids'],
    secondaryMuscles: ['Rhomboids', 'Trapezius'],
    formCues: [
      'Chest flat against seat pad.',
      'Sweep handles outward backward in wide arc.',
      'Avoid shrugging shoulders up.'
    ]
  },

  // BICEPS
  {
    name: 'Barbell Bicep Curl',
    category: 'Biceps',
    description: 'Classic heavy builder for overall bicep peak and arm mass.',
    primaryMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Brachialis', 'Forearms'],
    formCues: [
      'Stand upright with elbows pinned near ribs.',
      'Curl bar up toward shoulders without swinging hips.',
      'Squeeze biceps at top, lower smoothly.'
    ]
  },
  {
    name: 'Dumbbell Alternate Bicep Curl',
    category: 'Biceps',
    description: 'Alternating dumbbell curl allowing focused unilateral bicep contraction.',
    primaryMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Brachialis', 'Forearms'],
    formCues: [
      'Start with dumbbells at sides in neutral grip.',
      'Supinate wrist (rotate palm up) as dumbbell lifts.',
      'Alternate arms smoothly.'
    ]
  },
  {
    name: 'Hammer Curl',
    category: 'Biceps',
    description: 'Neutral grip curl targeting brachialis and forearms for arm thickness.',
    primaryMuscles: ['Brachialis', 'Brachioradialis'],
    secondaryMuscles: ['Biceps Brachii'],
    formCues: [
      'Palms face each other throughout entire rep.',
      'Keep upper arms stationary.',
      'Control descent without dropping weight.'
    ]
  },
  {
    name: 'Preacher Curl',
    category: 'Biceps',
    description: 'Bench-supported curl eliminating momentum for strict bicep isolation.',
    primaryMuscles: ['Biceps Brachii (Short Head)'],
    secondaryMuscles: ['Brachialis', 'Forearms'],
    formCues: [
      'Upper arms rested firm on preacher pad.',
      'Lower bar fully until arm is nearly extended.',
      'Curl up toward face without lifting elbows off pad.'
    ]
  },

  // TRICEPS
  {
    name: 'Tricep Rope Pushdown',
    category: 'Triceps',
    description: 'High-tension cable exercise isolating tricep lateral and medial heads.',
    primaryMuscles: ['Triceps Brachii (Lateral & Medial Heads)'],
    secondaryMuscles: ['Forearms'],
    formCues: [
      'Lock elbows to sides of torso.',
      'Push rope down and split ends apart at lockout.',
      'Control return to 90-degree elbow bend.'
    ]
  },
  {
    name: 'Skull Crushers',
    category: 'Triceps',
    description: 'Lying tricep extension targeting the long head of the triceps.',
    primaryMuscles: ['Triceps Brachii (Long Head)'],
    secondaryMuscles: ['Forearms'],
    formCues: [
      'Lie on bench with EZ bar overhead.',
      'Hinge at elbows to lower bar toward forehead/behind head.',
      'Extend elbows back up to vertical.'
    ]
  },
  {
    name: 'Overhead Tricep Extension',
    category: 'Triceps',
    description: 'Overhead extension placing tricep long head under maximum deep stretch.',
    primaryMuscles: ['Triceps Brachii (Long Head)'],
    secondaryMuscles: ['Forearms'],
    formCues: [
      'Hold dumbbell or cable overhead with palms under plate.',
      'Lower weight behind head with elbows pointed forward.',
      'Press straight up to lockout.'
    ]
  },

  // QUADS
  {
    name: 'Barbell Squat',
    category: 'Quads',
    description: 'The premier compound lower body exercise for leg mass and general power.',
    primaryMuscles: ['Quadriceps', 'Gluteus Maximus'],
    secondaryMuscles: ['Hamstrings', 'Core', 'Erector Spinae'],
    formCues: [
      'Set feet shoulder-width with toes slightly turned out.',
      'Break simultaneously at hips and knees.',
      'Squat until thighs break parallel with floor.',
      'Drive up through mid-foot keeping knees inline with toes.'
    ]
  },
  {
    name: 'Leg Press',
    category: 'Quads',
    description: 'Heavy machine leg press allowing maximal quad loading with minimal spine strain.',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Gluteus Maximus', 'Hamstrings'],
    formCues: [
      'Place feet mid-platform shoulder-width apart.',
      'Lower sled until knees reach 90 degrees.',
      'Drive platform up without locking knees out aggressively.'
    ]
  },
  {
    name: 'Bulgarian Split Squat',
    category: 'Quads',
    description: 'Single-leg squat targeting quad development and hip stability.',
    primaryMuscles: ['Quadriceps', 'Gluteus Maximus'],
    secondaryMuscles: ['Hamstrings', 'Adductors'],
    formCues: [
      'Rest rear foot on flat bench behind you.',
      'Lower front hip until front thigh is parallel to floor.',
      'Keep front knee tracking over middle toes.'
    ]
  },
  {
    name: 'Leg Extension',
    category: 'Quads',
    description: 'Pure isolation movement targeting all four quad heads, especially rectus femoris.',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: [],
    formCues: [
      'Adjust pad to sit comfortably on lower shins.',
      'Extend legs up until knees lock out fully.',
      'Hold peak contraction for 1 second before lowering.'
    ]
  },

  // HAMSTRINGS
  {
    name: 'Romanian Deadlift (RDL)',
    category: 'Hamstrings',
    description: 'Hip hinge movement maximizing stretch and overload on hamstrings and glutes.',
    primaryMuscles: ['Hamstrings', 'Gluteus Maximus'],
    secondaryMuscles: ['Erector Spinae', 'Forearms'],
    formCues: [
      'Soft bend in knees that remains constant throughout rep.',
      'Push hips backward while keeping bar against thighs.',
      'Lower until deep hamstring stretch is felt below knees.',
      'Drive hips forward to stand up.'
    ]
  },
  {
    name: 'Lying Leg Curl',
    category: 'Hamstrings',
    description: 'Isolated machine curl focusing on knee flexion for hamstrings.',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Gastrocnemius'],
    formCues: [
      'Align knee joint with machine pivot axis.',
      'Curl pad toward glutes.',
      'Control eccentric return without letting weights slam.'
    ]
  },

  // GLUTES
  {
    name: 'Barbell Hip Thrust',
    category: 'Glutes',
    description: 'The gold standard exercise for glute hypertrophy and hip extension power.',
    primaryMuscles: ['Gluteus Maximus'],
    secondaryMuscles: ['Hamstrings', 'Quadriceps'],
    formCues: [
      'Rest upper back against sturdy bench with padded bar over hips.',
      'Drive through heels to lift hips to full parallel extension.',
      'Tuck chin and squeeze glutes hard at top.'
    ]
  },

  // CALVES
  {
    name: 'Standing Calf Raise',
    category: 'Calves',
    description: 'Heavy gastrocnemius exercise emphasizing full ankle plantarflexion.',
    primaryMuscles: ['Gastrocnemius'],
    secondaryMuscles: ['Soleus'],
    formCues: [
      'Lower heels as far as possible for deep bottom stretch.',
      'Explode up onto toes and squeeze calves at top.'
    ]
  },

  // CORE
  {
    name: 'Cable Crunches',
    category: 'Core',
    description: 'High-tension progressive overload exercise for upper and lower abs.',
    primaryMuscles: ['Rectus Abdominis'],
    secondaryMuscles: ['Obliques'],
    formCues: [
      'Kneel below high cable pulley holding rope at head level.',
      'Flex spine to pull elbows down toward knees.',
      'Avoid pulling weight down with arms.'
    ]
  },
  {
    name: 'Hanging Leg Raise',
    category: 'Core',
    description: 'Bodyweight core exercise hitting lower abs and hip flexors.',
    primaryMuscles: ['Rectus Abdominis', 'Hip Flexors'],
    secondaryMuscles: ['Forearms', 'Obliques'],
    formCues: [
      'Hang from pull-up bar with still torso.',
      'Raise legs up to 90 degrees without swinging.',
      'Lower under control.'
    ]
  }
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
      { exerciseName: 'Barbell Squat', defaultSets: 3, defaultReps: 10 },
      { exerciseName: 'Barbell Hip Thrust', defaultSets: 3, defaultReps: 12 },
      { exerciseName: 'Bulgarian Split Squat', defaultSets: 3, defaultReps: 12 },
      { exerciseName: 'Lying Leg Curl', defaultSets: 3, defaultReps: 15 },
      { exerciseName: 'Standing Calf Raise', defaultSets: 4, defaultReps: 20 }
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

    console.log('Clearing old system exercises & templates...');
    await Exercise.deleteMany({ isCustom: false });
    await Template.deleteMany({ isSystemTemplate: true });

    console.log(`Injecting ${exercises.length} rich exercise guides...`);
    await Exercise.insertMany(exercises);

    console.log('Injecting System Templates...');
    await Template.insertMany(systemTemplates);

    console.log('✅ Database Seeded Successfully with Rich Guides!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder Error:', err);
    process.exit(1);
  }
};

runSeeder();