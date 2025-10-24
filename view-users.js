// Script to view all users in the database
// Run with: node view-users.js

require("dotenv").config();
require("./db"); // Connect to database

const User = require("./models/User.model");

async function viewUsers() {
  try {
    const users = await User.find();
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 DATABASE: shifty");
    console.log("📋 COLLECTION: users");
    console.log("=".repeat(60));
    
    if (users.length === 0) {
      console.log("\n❌ No users found in database");
      console.log("\n💡 Run 'node test-user.js' to create a test user");
    } else {
      console.log(`\n✅ Found ${users.length} user(s):\n`);
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. USER`);
        console.log("   ├─ ID:", user._id);
        console.log("   ├─ Username:", user.username);
        console.log("   ├─ Email:", user.email);
        console.log("   ├─ Password (hashed):", user.password.substring(0, 30) + "...");
        console.log("   ├─ Created:", user.createdAt);
        console.log("   └─ Updated:", user.updatedAt);
        console.log("");
      });
    }
    
    console.log("=".repeat(60) + "\n");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the function
viewUsers();