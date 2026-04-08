/**
 * In-memory overlay store for demo sessions.
 *
 * Each demo session gets a deep clone of the seed data from MongoDB.
 * All mutations (create/edit/delete shifts) happen against the clone.
 * Sessions expire after SESSION_TTL_MS of inactivity.
 */

const Shift = require("./models/Shift.model");
const User = require("./models/User.model");
const crypto = require("crypto");

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Map<sessionId, { shifts: Array, users: Array, createdAt: Date, lastAccess: Date }>
const sessions = new Map();

// ── Cleanup expired sessions every 5 minutes ────────────────

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastAccess.getTime() > SESSION_TTL_MS) {
      sessions.delete(id);
      console.log(`🧹 Demo session expired: ${id}`);
    }
  }
}, 5 * 60 * 1000);

// ── Public API ───────────────────────────────────────────────

/**
 * Create a new demo session by cloning current seed data from MongoDB.
 * Returns { sessionId, demoUser } where demoUser is the admin to log in as.
 */
async function createSession() {
  const sessionId = crypto.randomUUID();

  // Clone all shifts and users from the real DB
  const [shifts, users] = await Promise.all([
    Shift.find()
      .populate("assignedWorker", "username email color")
      .populate("createdBy", "username")
      .lean(),
    User.find().select("-password").lean(),
  ]);

  // Convert ObjectIds to strings for clean comparisons in the overlay
  const clonedShifts = shifts.map((s) => ({
    ...s,
    _id: s._id.toString(),
    assignedWorker: s.assignedWorker
      ? {
          ...s.assignedWorker,
          _id: s.assignedWorker._id.toString(),
        }
      : null,
    createdBy: s.createdBy
      ? {
          ...s.createdBy,
          _id: s.createdBy._id.toString(),
        }
      : null,
    status: s.assignedWorker ? "filled" : "open",
  }));

  const clonedUsers = users.map((u) => ({
    ...u,
    _id: u._id.toString(),
  }));

  sessions.set(sessionId, {
    shifts: clonedShifts,
    users: clonedUsers,
    createdAt: new Date(),
    lastAccess: new Date(),
    nextShiftId: 1, // counter for new shift IDs within this session
  });

  console.log(`🎭 Demo session created: ${sessionId} (${clonedShifts.length} shifts, ${clonedUsers.length} users)`);

  // Return the first admin user as the demo identity
  const demoUser = clonedUsers.find((u) => u.role === "admin");
  return { sessionId, demoUser };
}

/**
 * Get a session by ID. Returns null if expired or not found.
 * Touching the session refreshes its TTL.
 */
function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  // Refresh TTL
  session.lastAccess = new Date();
  return session;
}

/**
 * Get the current number of active demo sessions (for monitoring).
 */
function getActiveSessionCount() {
  return sessions.size;
}

module.exports = {
  createSession,
  getSession,
  getActiveSessionCount,
};