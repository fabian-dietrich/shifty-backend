const router = require("express").Router();
const User = require("../models/User.model");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

// Color palette for user avatars (20 distinct colors)
const COLOR_PALETTE = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
  '#FF5722', '#795548', '#607D8B', '#9E9E9E', '#00E676'
];

// Helper function to get random color
const getRandomColor = () => {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
};

// ========================================
// POST /auth/signup - Register a new user
// ========================================
router.post("/signup", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Step 1: Check if email already exists in database
    // We use .findOne() to search for a user with this email
    const foundUser = await User.findOne({ email });
    console.log("Checking if user exists:", foundUser ? "Yes" : "No");

    if (foundUser) {
      // User with this email already exists - don't create duplicate
      // We use a generic error message for security (don't reveal if email exists)
      return res.status(403).json({ errorMessage: "Invalid Credentials" });
    }

    // Step 2: Hash the password before storing it
    // Generate a salt (random string) - 12 rounds is a good balance of security vs speed
    const salt = bcryptjs.genSaltSync(12);
    
    // Hash the password using the salt
    // Original: "MyPassword123" → Hashed: "$2a$12$kQ8X.H5rqvZ..."
    const hashedPassword = bcryptjs.hashSync(password, salt);

    // Step 3: Create new user object with hashed password
    const newUser = {
      email,
      username,
      password: hashedPassword,  // Store hashed password, NEVER plain text!
      color: getRandomColor()     // Assign random color from palette
    };

    // Step 4: Save the user to the database
    const createdUser = await User.create(newUser);
    console.log("✅ New user created:", createdUser.email);

    // Step 5: Send back the user data (without password!)
    // Status 201 = "Created"
    res.status(201).json({
      email: createdUser.email,
      username: createdUser.username,
      _id: createdUser._id
    });

  } catch (error) {
    console.log("❌ Signup error:", error);
    res.status(500).json({ errorMessage: "Server error during signup" });
  }
});

// ========================================
// POST /auth/login - Authenticate user and issue JWT token
// ========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1: Find user by email
    const foundUser = await User.findOne({ email });

    if (!foundUser) {
      // No user with this email exists
      // Use generic error message (don't reveal if email exists for security)
      return res.status(403).json({ errorMessage: "Invalid Credentials" });
    }

    // Step 2: Compare the provided password with the hashed password in database
    // bcryptjs.compareSync() hashes the input and compares with stored hash
    const doesPasswordMatch = bcryptjs.compareSync(
      password,           // Plain text password from request
      foundUser.password  // Hashed password from database
    );

    console.log("Password match:", doesPasswordMatch);

    if (!doesPasswordMatch) {
      // Password is incorrect
      return res.status(403).json({ errorMessage: "Invalid Credentials" });
    }

    // Step 3: Password is correct! Create a JWT token
    // The token will contain the user's ID
const payload = { 
  _id: foundUser._id,
  role: foundUser.role  // Add role to token payload
};

    // Sign the token with our secret key
    const authToken = jwt.sign(
      payload,                      // Data to encode in the token
      process.env.TOKEN_SECRET,     // Secret key to sign with
      { 
        algorithm: "HS256",         // Signing algorithm
        expiresIn: "6h"             // Token expires in 6 hours
      }
    );

    // Step 4: Send back the token
    // Status 200 = "OK"
    res.status(200).json({
      authToken: authToken,
      message: "Login successful! Token valid for 6 hours"
    });

  } catch (error) {
    console.log("❌ Login error:", error);
    res.status(500).json({ errorMessage: "Server error during login" });
  }
});

// ========================================
// GET /auth/verify - Verify if the JWT token is valid
// ========================================
// This route is protected by the isAuthenticated middleware
// The middleware runs FIRST and checks the token
router.get("/verify", isAuthenticated, async (req, res) => {
  try {
    // Fetch the full user data from database
    const user = await User.findById(req.payload._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ errorMessage: "User not found" });
    }

    console.log("✅ Token verified for user:", user.username);

    res.status(200).json({
      message: "Token is valid!",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        color: user.color,
        iat: req.payload.iat,
        exp: req.payload.exp
      }
    });
  } catch (error) {
    console.log("❌ Verify error:", error);
    res.status(500).json({ errorMessage: "Server error during verification" });
  }
});

module.exports = router;