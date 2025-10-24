const router = require("express").Router();
const Shift = require("../models/Shift.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");
const { isAdmin } = require("../middlewares/isAdmin.middleware");

// ========================================
// GET /api/shifts - Get all shifts
// ========================================
// All authenticated users can view shifts
router.get("/", isAuthenticated, async (req, res) => {
  try {
    // Fetch all shifts and populate the assigned worker's details
    const shifts = await Shift.find()
      .populate('assignedWorker', 'username email color')  // Get worker info
      .populate('createdBy', 'username')                   // Get admin info
      .sort({ dayOfWeek: 1, startTime: 1 });              // Sort by day then time

    res.status(200).json(shifts);
  } catch (error) {
    console.log("❌ Error fetching shifts:", error);
    res.status(500).json({ errorMessage: "Failed to fetch shifts" });
  }
});

// ========================================
// GET /api/shifts/:id - Get single shift
// ========================================
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    const shift = await Shift.findById(id)
      .populate('assignedWorker', 'username email color')
      .populate('createdBy', 'username');

    if (!shift) {
      return res.status(404).json({ errorMessage: "Shift not found" });
    }

    res.status(200).json(shift);
  } catch (error) {
    console.log("❌ Error fetching shift:", error);
    res.status(500).json({ errorMessage: "Failed to fetch shift" });
  }
});

// ========================================
// POST /api/shifts - Create new shift (ADMIN ONLY)
// ========================================
router.post("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;

    // Validate required fields
    if (!dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ 
        errorMessage: "Day, start time, and end time are required" 
      });
    }

    // Create new shift
    const newShift = {
      dayOfWeek,
      startTime,
      endTime,
      createdBy: req.payload._id  // Store which admin created it
    };

    const createdShift = await Shift.create(newShift);
    console.log("✅ New shift created:", createdShift._id);

    // Populate and return the created shift
    const populatedShift = await Shift.findById(createdShift._id)
      .populate('createdBy', 'username');

    res.status(201).json(populatedShift);
  } catch (error) {
    console.log("❌ Error creating shift:", error);
    res.status(500).json({ errorMessage: "Failed to create shift" });
  }
});

// ========================================
// PUT /api/shifts/:id - Update shift (ADMIN ONLY)
// ========================================
router.put("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime } = req.body;

    // Update only the fields that are provided
    const updateData = {};
    if (dayOfWeek) updateData.dayOfWeek = dayOfWeek;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;

    const updatedShift = await Shift.findByIdAndUpdate(
      id,
      updateData,
      { new: true }  // Return the updated document
    )
      .populate('assignedWorker', 'username email color')
      .populate('createdBy', 'username');

    if (!updatedShift) {
      return res.status(404).json({ errorMessage: "Shift not found" });
    }

    console.log("✅ Shift updated:", updatedShift._id);
    res.status(200).json(updatedShift);
  } catch (error) {
    console.log("❌ Error updating shift:", error);
    res.status(500).json({ errorMessage: "Failed to update shift" });
  }
});

// ========================================
// DELETE /api/shifts/:id - Delete shift (ADMIN ONLY)
// ========================================
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

// ========================================
// PUT /api/shifts/:id/assign - Assign user to shift (ADMIN ONLY)
// ========================================
router.put("/:id/assign", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ errorMessage: "User ID is required" });
    }

    // Check if shift is already filled
    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(404).json({ errorMessage: "Shift not found" });
    }

    if (shift.assignedWorker) {
      return res.status(400).json({ 
        errorMessage: "Shift is already filled. Unassign current worker first." 
      });
    }

    // Assign the worker
    const updatedShift = await Shift.findByIdAndUpdate(
      id,
      { assignedWorker: userId },
      { new: true }
    )
      .populate('assignedWorker', 'username email color')
      .populate('createdBy', 'username');

    console.log("✅ Worker assigned to shift:", updatedShift._id);
    res.status(200).json(updatedShift);
  } catch (error) {
    console.log("❌ Error assigning worker:", error);
    res.status(500).json({ errorMessage: "Failed to assign worker" });
  }
});

// ========================================
// PUT /api/shifts/:id/unassign - Remove user from shift (ADMIN ONLY)
// ========================================
router.put("/:id/unassign", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Remove the assigned worker (set to null)
    const updatedShift = await Shift.findByIdAndUpdate(
      id,
      { assignedWorker: null },
      { new: true }
    )
      .populate('createdBy', 'username');

    if (!updatedShift) {
      return res.status(404).json({ errorMessage: "Shift not found" });
    }

    console.log("✅ Worker unassigned from shift:", updatedShift._id);
    res.status(200).json(updatedShift);
  } catch (error) {
    console.log("❌ Error unassigning worker:", error);
    res.status(500).json({ errorMessage: "Failed to unassign worker" });
  }
});

module.exports = router;