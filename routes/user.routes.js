const router = require("express").Router();
const User = require("../models/User.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ username: 1 });

    res.status(200).json(users);
  } catch (error) {
    console.log("Error fetching users:", error);
    res.status(500).json({ errorMessage: "Failed to fetch users" });
  }
});

module.exports = router;
