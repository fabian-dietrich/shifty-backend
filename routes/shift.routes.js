const router = require("express").Router();
const Shift = require("../models/Shift.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");
const { isAdmin } = require("../middlewares/isAdmin.middleware");

// get - open to all user groups
router.get("/", isAuthenticated, async (req, res) => {
  try {
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

// get - specific shift
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

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

// post new shift - admin only
router.post("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;

    if (!dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({
        errorMessage: "Day, start time, and end time are required",
      });
    }

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

// put / edit shift - admin only
router.put("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime } = req.body;

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

//delete shift - admin only
router.delete("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedShift = await Shift.findByIdAndDelete(id);

    if (!deletedShift) {
      return res.status(404).json({ errorMessage: "Shift not found" });
    }

    console.log("✅ Shift deleted:", deletedShift._id);
    res.status(200).json({ message: "Shift deleted successfully" });
  } catch (error) {
    console.log("❌ Error deleting shift:", error);
    res.status(500).json({ errorMessage: "Failed to delete shift" });
  }
});

// put / assign user to shift - admin only
router.put("/:id/assign", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ errorMessage: "User ID is required" });
    }

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

    // assign the worker
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

// put UNassign user from shift
router.put("/:id/unassign", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

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
