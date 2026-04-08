const router = require("express").Router();
const User = require("../models/User.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");
const { attachDemoSession } = require("../middlewares/isDemo.middleware");

router.get("/", isAuthenticated, attachDemoSession, async (req, res) => {
  try {
    // Demo: return from overlay
    if (req.isDemo) {
      const users = [...req.demoSession.users].sort((a, b) =>
        a.username.localeCompare(b.username)
      );
      return res.status(200).json(users);
    }

    // Real: hit MongoDB
    const users = await User.find().select("-password").sort({ username: 1 });

    res.status(200).json(users);
  } catch (error) {
    console.log("Error fetching users:", error);
    res.status(500).json({ errorMessage: "Failed to fetch users" });
  }
});

module.exports = router;