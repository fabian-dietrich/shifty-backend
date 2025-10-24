// Middleware to check if authenticated user has admin role
// This should be used AFTER isAuthenticated middleware
// Usage: router.post("/route", isAuthenticated, isAdmin, async (req, res) => {...})

const isAdmin = (req, res, next) => {
  // Check if user has admin role
  // req.payload comes from the isAuthenticated middleware (JWT token payload)
  if (req.payload.role !== 'admin') {
    console.log("❌ Access denied: User is not an admin");
    return res.status(403).json({ 
      errorMessage: "Access denied. Admin privileges required." 
    });
  }

  // User is admin, continue to the route
  console.log("✅ Admin access granted");
  next();
};

module.exports = { isAdmin };