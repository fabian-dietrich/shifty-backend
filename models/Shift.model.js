const { Schema, model } = require("mongoose");

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
    },
    startTime: {
      type: String,
      required: [true, "Start time is required."],
    },
    endTime: {
      type: String,
      required: [true, "End time is required."],
    },
    assignedWorker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

shiftSchema.virtual("status").get(function () {
  return this.assignedWorker ? "filled" : "open";
});

shiftSchema.set("toJSON", { virtuals: true });
shiftSchema.set("toObject", { virtuals: true });

const Shift = model("Shift", shiftSchema);

module.exports = Shift;
