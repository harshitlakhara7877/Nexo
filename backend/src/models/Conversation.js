import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    message: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],

    deletedChatFor: [
      {
        deletedFor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        deletedAt: {
          type: Date,
          required: true,
        },
        isDeleted: {
          type: Boolean,
          default: true,
        },
      },
    ],

    mutedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({
  participants: 1,
  updatedAt: -1,
});

const Conversation = mongoose.model(
  "Conversation",
  conversationSchema
);

export default Conversation;