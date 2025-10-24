const jwt = require("jsonwebtoken");

// Middleware function to check if a user is authenticated
// This acts as a "security guard" for protected routes
function isAuthenticated(req, res, next) {
  // Step 1: Check if the Authorization header exists and is properly formatted
  // Expected format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  if (
    req.headers.authorization &&                        // Header exists?
    req.headers.authorization.split(" ")[0] === "Bearer" && // Starts with "Bearer"?
    req.headers.authorization.split(" ")[1]             // Token exists after "Bearer"?
  ) {
    try {
      // Step 2: Extract the token from the header
      // "Bearer xyz123..." → "xyz123..."
      const theTokenInTheHeaders = req.headers.authorization.split(" ")[1];
      
      // Step 3: Verify the token using our secret key
      // This checks:
      // - Is the signature valid?
      // - Has the token expired?
      // - Was it created with our TOKEN_SECRET?
      const theDataInTheToken = jwt.verify(
        theTokenInTheHeaders,
        process.env.TOKEN_SECRET
      );
      
      // For debugging (uncomment if needed):
      // console.log("Token in headers:", theTokenInTheHeaders);
      // console.log("Data decoded from token:", theDataInTheToken);
      
      // Step 4: Attach the decoded data to the request object
      // This makes the user's _id available to the next route handler
      // Example: theDataInTheToken = { _id: "abc123", iat: 1234567890, exp: 1234589490 }
      req.payload = theDataInTheToken;
      
      // Step 5: Token is valid! Allow the request to continue
      next();
      
    } catch (error) {
      // Token verification failed (invalid signature, expired, etc.)
      console.log("Token verification error:", error.message);
      res.status(403).json({ errorMessage: "Invalid Token" });
    }
  } else {
    // No Authorization header or improperly formatted
    res.status(403).json({ errorMessage: "No token found" });
  }
}

// Export the middleware so we can use it in our routes
module.exports = { isAuthenticated };