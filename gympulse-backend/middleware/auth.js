const { ClerkExpressRequireAuth, clerkClient } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');

// Step 1: Clerk verifies the session token from the Authorization header.
// If invalid or missing, it returns 401 automatically.
const requireClerkAuth = ClerkExpressRequireAuth();

// Step 2: Sync the Clerk user to MongoDB and attach the DB user to the request.
// This runs AFTER Clerk auth succeeds, so req.auth.userId is always available.
async function syncUserToDb(req, res, next) {
  try {
    const clerkUserId = req.auth.userId;

    // Fast path: user already exists in our DB
    let dbUser = await User.findOne({ clerkUserId });

    if (!dbUser) {
      // First-time login -- fetch profile from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';

      // Check if they have an old account under this email
      if (email) {
        dbUser = await User.findOne({ email });
      }

      if (dbUser) {
        // Link the old account to the new Clerk identity
        dbUser.clerkUserId = clerkUserId;
        await dbUser.save();
      } else {
        // Create a totally new user record
        const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'User';
        dbUser = await User.create({
          clerkUserId,
          name,
          email,
          fitnessGoal: 'General Fitness',
          // Neutral nutrition defaults
          targetCalories: 2000,
          targetProtein: 150,
          targetCarbs: 200,
          targetFats: 65,
        });
      }
    }

    // Backward compatibility: all route handlers read req.user.userId as the MongoDB _id
    req.user = { userId: dbUser._id.toString() };
    req.dbUser = dbUser;
    next();
  } catch (err) {
    console.error('User sync error:', err);
    res.status(500).json({ message: 'Failed to synchronize user account' });
  }
}

// Export a combined middleware array so routes can use a single `authMiddleware` reference
// exactly like before: router.get('/', authMiddleware, handler)
module.exports = [requireClerkAuth, syncUserToDb];