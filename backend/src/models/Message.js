import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 2000,
      required:true,
    },
    
    isRead: {
      type:Boolean,
      default:false,
    },

    readAt: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

messageSchema.index({
  conversation: 1,
  createdAt: 1,
})

const Message = mongoose.model("Message", messageSchema);

export default Message;