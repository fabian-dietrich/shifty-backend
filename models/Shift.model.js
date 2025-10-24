const { Schema, model } = require("mongoose");

// Shift model for schedule management
// Represents a single shift that can be assigned to ONE worker
const shiftSchema = new Schema(
  {
    dayOfWeek: {
      type: String,
      required: [true, "Day of week is required."],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      // Ensures only valid days can be stored
    },
    startTime: {
      type: String,
      required: [true, "Start time is required."],
      // Format: "09:00" (24-hour format)
    },
    endTime: {
      type: String,
      required: [true, "End time is required."],
      // Format: "17:00" (24-hour format)
    },
    assignedWorker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // ONE user ID who is assigned to this shift (or null if open)
      // Using 'ref' allows us to populate full user data later
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      // Which admin created this shift
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Virtual property to calculate shift status
// This is computed on-the-fly and not stored in the database
shiftSchema.virtual("status").get(function () {
  return this.assignedWorker ? "filled" : "open";
});

// Ensure virtuals are included when converting to JSON
shiftSchema.set("toJSON", { virtuals: true });
shiftSchema.set("toObject", { virtuals: true });

const Shift = model("Shift", shiftSchema);

module.exports = Shift;
