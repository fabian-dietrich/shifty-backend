const router = require("express").Router();
const User = require("../models/User.model");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isAuthenticated } = require("../middlewares/jwt.middleware");
const { attachDemoSession } = require("../middlewares/isDemo.middleware");
const { createSession, getActiveSessionCount } = require("../demoStore");

// Color palette for user avatars
const COLOR_PALETTE = [
  "#F44336",
  "#E91E63",
  "#9C27B0",
  "#673AB7",
  "#3F51B5",
  "#2196F3",
  "#03A9F4",
  "#00BCD4",
  "#009688",
  "#4CAF50",
  "#8BC34A",
  "#CDDC39",
  "#FFEB3B",
  "#FFC107",
  "#FF9800",
  "#FF5722",
  "#795548",
  "#607D8B",
  "#9E9E9E",
  "#00E676",
];

const getRandomColor = () => {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
};

/* ROUTES */

// ── Demo login ───────────────────────────────────────────────

router.post("/demo-login", async (req, res) => {
  try {
    const { sessionId, demoUser } = await createSession();

    if (!demoUser) {
      return res.status(500).json({
        errorMessage: "No admin user found in seed data. Run the seed script first.",
      });
    }

    // Create a JWT that carries the demo session ID
    const payload = {
      _id: demoUser._id,
      role: demoUser.role,
      demoSessionId: sessionId,
    };

    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "1h",
    });

    console.log(`🎭 Demo login issued. Active sessions: ${getActiveSessionCount()}`);

    res.status(200).json({
      authToken,
      message: "Demo session started. Changes are session-only and will not be saved.",
    });
  } catch (error) {
    console.log("Demo login error:", error);
    res.status(500).json({ errorMessage: "Failed to start demo session" });
  }
});

// ── Signup ────────────────────────────────────────────────────

router.post("/signup", async (req, res) => {
  if (process.env.DEMO_ONLY === "true") {
    return res.status(403).json({
      errorMessage: "Signup is disabled. Please use the demo instead.",
    });
  }

  try {
    const { email, username, password } = req.body;

    const foundUser = await User.findOne({ email });
    console.log("Checking if user exists:", foundUser ? "Yes" : "No");

    if (foundUser) {
      return res.status(403).json({ errorMessage: "Invalid Credentials" });
    }
    const salt = bcryptjs.genSaltSync(12);
    const hashedPassword = bcryptjs.hashSync(password, salt);

    const newUser = {
      email,
      username,
      password: hashedPassword,
      color: getRandomColor(), // Assign random color from palette
    };

    const createdUser = await User.create(newUser);
    console.log("✅ New user created:", createdUser.email);

    res.status(201).json({
      email: createdUser.email,
      username: createdUser.username,
      _id: createdUser._id,
    });
  } catch (error) {
    console.log("Signup error:", error);
    res.status(500).json({ errorMessage: "Server error during signup" });
  }
});

// ── Login ─────────────────────────────────────────────────────

router.post("/login", async (req, res) => {
  if (process.env.DEMO_ONLY === "true") {
    return res.status(403).json({
      errorMessage: "Login is disabled. Please use the Try Demo button instead.",
    });
  }

  try {
    const { email, password } = req.body;

    const foundUser = await User.findOne({ email });

    if (!foundUser) {
      return res.status(403).json({ errorMessage: "Invalid Credentials" });
    }

    const doesPasswordMatch = bcryptjs.compareSync(
      password,
      foundUser.password
    );

    console.log("Password match:", doesPasswordMatch);

    if (!doesPasswordMatch) {
      return res.status(403).json({ errorMessage: "Invalid Credentials" });
    }

    const payload = {
      _id: foundUser._id,
      role: foundUser.role,
    };

    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "6h",
    });

    res.status(200).json({
      authToken: authToken,
      message: "Login successful! Token valid for 6 hours",
    });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ errorMessage: "Server error during login" });
  }
});

// ── Verify ────────────────────────────────────────────────────

router.get("/verify", isAuthenticated, attachDemoSession, async (req, res) => {
  try {
    // Demo session: return user from the in-memory store
    if (req.isDemo) {
      const demoUser = req.demoSession.users.find(
        (u) => u._id === req.payload._id
      );

      if (!demoUser) {
        return res.status(404).json({ errorMessage: "Demo user not found" });
      }

      return res.status(200).json({
        message: "Token is valid! (demo session)",
        isDemo: true,
        user: {
          _id: demoUser._id,
          username: demoUser.username,
          email: demoUser.email,
          role: demoUser.role,
          color: demoUser.color,
          iat: req.payload.iat,
          exp: req.payload.exp,
        },
      });
    }

    // Regular session: hit the database
    const user = await User.findById(req.payload._id).select("-password");

    if (!user) {
      return res.status(404).json({ errorMessage: "User not found" });
    }

    console.log("Token verified for user:", user.username);

    res.status(200).json({
      message: "Token is valid!",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        color: user.color,
        iat: req.payload.iat,
        exp: req.payload.exp,
      },
    });
  } catch (error) {
    console.log("Verify error:", error);
    res.status(500).json({ errorMessage: "Server error during verification" });
  }
});

module.exports = router;