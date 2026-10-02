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

    Message: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    }],
  },
  {
    timestamps: true,
  }
);

// export const Conversation = mongoose.model("Conversation",conversationSchema);

const Conversation = mongoose.model(
  "Conversation",
  conversationSchema
);

export default Conversation;