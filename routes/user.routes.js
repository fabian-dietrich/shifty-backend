const router = require("express").Router();
const User = require("../models/User.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

// ========================================
// GET /api/users - Get all users
// ========================================
// All authenticated users can view the user list
// (needed for admins to assign workers to shifts)
router.get("/", isAuthenticated, async (req, res) => {
  try {
    // Fetch all users, excluding password field
    const users = await User.find()
      .select('-password')  // Exclude password from results
      .sort({ username: 1 }); // Sort alphabetically by username

    res.status(200).json(users);
  } catch (error) {
    console.log("❌ Error fetching users:", error);
    res.status(500).json({ errorMessage: "Failed to fetch users" });
  }
});

module.exports = router;