import mongoose from "mongoose";

const userReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "inappropriate",
        "impersonation",
        "other",
      ],
      required: true,
    },

    details: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

userReportSchema.index({
  reportedUser: 1,
  status: 1,
  createdAt: -1,
});

const UserReport = mongoose.model(
  "UserReport",
  userReportSchema
);

export default UserReport;