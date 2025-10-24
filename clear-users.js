// Script to delete all users from database
// Run with: node clear-users.js

require("dotenv").config();
require("./db"); // Connect to database

const User = require("./models/User.model");

async function clearUsers() {
  try {
    // Show current users
    const existingUsers = await User.find();
    console.log("\n📊 Current users in database:", existingUsers.length);
    
    if (existingUsers.length > 0) {
      console.log("\n👥 Users to be deleted:");
      existingUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} - ${user.email}`);
      });

      // Delete all users
      const result = await User.deleteMany({});
      console.log(`\n🗑️  Deleted ${result.deletedCount} user(s)`);
      console.log("✅ Database cleared!");
    } else {
      console.log("\n✅ Database is already empty - no users to delete");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the function
clearUsers();