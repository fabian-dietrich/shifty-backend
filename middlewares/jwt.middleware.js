const jwt = require("jsonwebtoken");

function isAuthenticated(req, res, next) {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer" &&
    req.headers.authorization.split(" ")[1]
  ) {
    try {
      const theTokenInTheHeaders = req.headers.authorization.split(" ")[1];
      const theDataInTheToken = jwt.verify(
        theTokenInTheHeaders,
        process.env.TOKEN_SECRET
      );

      // console.log("Token in headers:", theTokenInTheHeaders);
      // console.log("Data decoded from token:", theDataInTheToken);

      req.payload = theDataInTheToken;
      next();
    } catch (error) {
      console.log("Token verification error:", error.message);
      res.status(403).json({ errorMessage: "Invalid Token" });
    }
  } else {
    res.status(403).json({ errorMessage: "No token found" });
  }
}

module.exports = { isAuthenticated };
