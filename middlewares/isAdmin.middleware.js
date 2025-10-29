const isAdmin = (req, res, next) => {

  if (req.payload.role !== 'admin') {
    console.log("Access denied: User is not an admin");
    return res.status(403).json({ 
      errorMessage: "Access denied. Admin privileges required." 
    });
  }


  console.log("Admin access granted");
  next();
};

module.exports = { isAdmin };