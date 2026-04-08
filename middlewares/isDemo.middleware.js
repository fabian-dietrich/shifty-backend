/**
 * Demo session middleware.
 *
 * If the JWT payload contains a demoSessionId, this middleware
 * loads the in-memory session and attaches it to req.demoSession.
 * Route handlers check req.isDemo to decide whether to use the
 * overlay or hit MongoDB.
 */

const { getSession } = require("../demoStore");

function attachDemoSession(req, res, next) {
  // Only applies if jwt.middleware already decoded a demo token
  if (req.payload && req.payload.demoSessionId) {
    const session = getSession(req.payload.demoSessionId);

    if (!session) {
      return res.status(401).json({
        errorMessage: "Demo session expired. Please start a new demo.",
      });
    }

    req.isDemo = true;
    req.demoSession = session;
    req.demoSessionId = req.payload.demoSessionId;
  } else {
    req.isDemo = false;
  }

  next();
}

module.exports = { attachDemoSession };