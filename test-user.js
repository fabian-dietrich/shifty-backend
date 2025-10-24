// Test script to manually create a user in the database
// Run with: node test-user.js

require("dotenv").config();
require("./db"); // Connect to database

const User = require("./models/User.model");
const bcryptjs = require("bcryptjs");

async function createTestUser() {
  try {
    // First, let's see if any users exist
    const existingUsers = await User.find();
    console.log("\n📊 Current users in database:", existingUsers.length);

    if (existingUsers.length > 0) {
      console.log("\n👥 Existing users:");
      existingUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} - ${user.email}`);
      });
    }

    // Create a test user
    console.log("\n🔨 Creating a test user...");

    // Hash the password (this is what we'll do in our auth routes)
    const salt = bcryptjs.genSaltSync(12);
    const hashedPassword = bcryptjs.hashSync("Test123!", salt);

    const testUser = {
      email: "john@example.com", // ← Change this
      username: "johndoe", // ← Change this
      password: hashedPassword,
    };

    // Check if this user already exists
    const userExists = await User.findOne({ email: testUser.email });

    if (userExists) {
      console.log("❌ User already exists with this email!");
      console.log("User details:", {
        id: userExists._id,
        email: userExists.email,
        username: userExists.username,
        createdAt: userExists.createdAt,
      });
    } else {
      // Create the user
      const newUser = await User.create(testUser);
      console.log("✅ User created successfully!");
      console.log("User details:", {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        createdAt: newUser.createdAt,
      });
      console.log("\n🔒 Password was hashed - original password was: Test123!");
    }

    // Show all users again
    const allUsers = await User.find();
    console.log("\n📊 Total users in database now:", allUsers.length);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the function
createTestUser();
