const router = require("express").Router();
const Shift = require("../models/Shift.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");
const { isAdmin } = require("../middlewares/isAdmin.middleware");
const { attachDemoSession } = require("../middlewares/isDemo.middleware");

// Apply demo detection to all shift routes
router.use(isAuthenticated, attachDemoSession);

// ── Helpers for demo overlay ─────────────────────────────────

function sortShifts(shifts) {
  const dayOrder = {
    Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4,
    Friday: 5, Saturday: 6, Sunday: 7,
  };
  return shifts.sort((a, b) => {
    const dayDiff = (dayOrder[a.dayOfWeek] || 0) - (dayOrder[b.dayOfWeek] || 0);
    if (dayDiff !== 0) return dayDiff;
    return (a.startTime || "").localeCompare(b.startTime || "");
  });
}

// ── GET all shifts ───────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    // Demo: return from overlay
    if (req.isDemo) {
      return res.status(200).json(sortShifts([...req.demoSession.shifts]));
    }

    // Real: hit MongoDB
    const shifts = await Shift.find()
      .populate("assignedWorker", "username email color")
      .populate("createdBy", "username")
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json(shifts);
  } catch (error) {
    console.log("Error fetching shifts:", error);
    res.status(500).json({ errorMessage: "Failed to fetch shifts" });
  }
});

// ── GET specific shift ───────────────────────────────────────

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (req.isDemo) {
      const shift = req.demoSession.shifts.find((s) => s._id === id);
      if (!shift) {
        return res.status(404).json({ errorMessage: "Shift not found" });
      }
      return res.status(200).json(shift);
    }

    const shift = await Shift.findById(id)
      .populate("assignedWorker", "username email color")
      .populate("createdBy", "username");

    if (!shift) {
      return res.status(404).json({ errorMessage: "Shift not found" });
    }

    res.status(200).json(shift);
  } catch (error) {
    console.log("Error fetching shift:", error);
    res.status(500).json({ errorMessage: "Failed to fetch shift" });
  }
});

// ── POST new shift (admin only) ──────────────────────────────

router.post("/", isAdmin, async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;

    if (!dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({
        errorMessage: "Day, start time, and end time are required",
      });
    }

    if (req.isDemo) {
      const session = req.demoSession;
      const demoUser = session.users.find((u) => u._id === req.payload._id);
      const newId = `demo-shift-${session.nextShiftId++}`;

      const newShift = {
        _id: newId,
        dayOfWeek,
        startTime,
        endTime,
        assignedWorker: null,
        createdBy: demoUser
          ? { _id: demoUser._id, username: demoUser.username }
          : null,
        status: "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      session.shifts.push(newShift);
      console.log(`🎭 Demo shift created: ${newId}`);
      return res.status(201).json(newShift);
    }

    // Real: write to MongoDB
    const newShift = {
      dayOfWeek,
      startTime,
      endTime,
      createdBy: req.payload._id,
    };

    const createdShift = await Shift.create(newShift);
    console.log("New shift created:", createdShift._id);

    const populatedShift = await Shift.findById(createdShift._id).populate(
      "createdBy",
      "username"
    );

    res.status(201).json(populatedShift);
  } catch (error) {
    console.log("Error creating shift:", error);
    res.status(500).json({ errorMessage: "Failed to create shift" });
  }
});

// ── PUT edit shift (admin only) ──────────────────────────────

router.put("/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime } = req.body;

    if (req.isDemo) {
      const shift = req.demoSession.shifts.find((s) => s._id === id);
      if (!shift) {
        return res.status(404).json({ errorMessage: "Shift not found" });
      }

      if (dayOfWeek) shift.dayOfWeek = dayOfWeek;
      if (startTime) shift.startTime = startTime;
      if (endTime) shift.endTime = endTime;
      shift.updatedAt = new Date().toISOString();

      console.log(`🎭 Demo shift updated: ${id}`);
      return res.status(200).json(shift);
    }

    // Real: write to MongoDB
    const updateData = {};
    if (dayOfWeek) updateData.dayOfWeek = dayOfWeek;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;

    const updatedShift = await Shift.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("assignedWorker", "username email color")
      .populate("createdBy", "username");

    if (!updatedShift) {
      return res.status(404).json({ errorMessage: "Shift not found" });
    }

    console.log("Shift updated:", updatedShift._id);
    res.status(200).json(updatedShift);
  } catch (error) {
    console.log("Error updating shift:", error);
    res.status(500).json({ errorMessage: "Failed to update shift" });
  }
});

// ── DELETE shift (admin only) ────────────────────────────────

router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.isDemo) {
      const idx = req.demoSession.shifts.findIndex((s) => s._id === id);
      if (idx === -1) {
        return res.status(404).json({ errorMessage: "Shift not found" });
      }

      req.demoSession.shifts.splice(idx, 1);
      console.log(`🎭 Demo shift deleted: ${id}`);
      return res.status(200).json({ message: "Shift deleted successfully" });
    }

    // Real: delete from MongoDB
    const deletedShift = await Shift.findByIdAndDelete(id);

    if (!deletedShift) {
      return res.status(404).json({ errorMessage: "Shift not found" });
    }

    console.log("Shift deleted:", deletedShift._id);
    res.status(200).json({ message: "Shift deleted successfully" });
  } catch (error) {
    console.log("Error deleting shift:", error);
    res.status(500).json({ errorMessage: "Failed to delete shift" });
  }
});

// ── PUT assign worker (admin only) ───────────────────────────

router.put("/:id/assign", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ errorMessage: "User ID is required" });
    }

    if (req.isDemo) {
      const shift = req.demoSession.shifts.find((s) => s._id === id);
      if (!shift) {
        return res.status(404).json({ errorMessage: "Shift not found" });
      }

      if (shift.assignedWorker) {
        return res.status(400).json({
          errorMessage:
            "Shift is already filled. Unassign current worker before reassigning.",
        });
      }

      const worker = req.demoSession.users.find((u) => u._id === userId);
      if (!worker) {
        return res.status(404).json({ errorMessage: "User not found" });
      }

      shift.assignedWorker = {
        _id: worker._id,
        username: worker.username,
        email: worker.email,
        color: worker.color,
      };
      shift.status = "filled";
      shift.updatedAt = new Date().toISOString();

      console.log(`🎭 Demo worker assigned to shift: ${id}`);
      return res.status(200).json(shift);
    }

    // Real: write to MongoDB
    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(404).json({ errorMessage: "Shift not found" });
    }

    if (shift.assignedWorker) {
      return res.status(400).json({
        errorMessage:
          "Shift is already filled. Unassign current worker before reassigning.",
      });
    }

    const updatedShift = await Shift.findByIdAndUpdate(
      id,
      { assignedWorker: userId },
      { new: true }
    )
      .populate("assignedWorker", "username email color")
      .populate("createdBy", "username");

    console.log("Worker assigned to shift:", updatedShift._id);
    res.status(200).json(updatedShift);
  } catch (error) {
    console.log("Error assigning worker:", error);
    res.status(500).json({ errorMessage: "Failed to assign worker" });
  }
});

// ── PUT unassign worker (admin only) ─────────────────────────

router.put("/:id/unassign", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.isDemo) {
      const shift = req.demoSession.shifts.find((s) => s._id === id);
      if (!shift) {
        return res.status(404).json({ errorMessage: "Shift not found" });
      }

      shift.assignedWorker = null;
      shift.status = "open";
      shift.updatedAt = new Date().toISOString();

      console.log(`🎭 Demo worker unassigned from shift: ${id}`);
      return res.status(200).json(shift);
    }

    // Real: write to MongoDB
    const updatedShift = await Shift.findByIdAndUpdate(
      id,
      { assignedWorker: null },
      { new: true }
    ).populate("createdBy", "username");

    if (!updatedShift) {
      return res.status(404).json({ errorMessage: "Shift not found" });
    }

    console.log("Worker unassigned from shift:", updatedShift._id);
    res.status(200).json(updatedShift);
  } catch (error) {
    console.log("Error unassigning worker:", error);
    res.status(500).json({ errorMessage: "Failed to unassign worker" });
  }
});

module.exports = router;