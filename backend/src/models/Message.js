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

    // Identifies which kind of message this is.
    type: {
      type: String,
      enum: ["text", "image", "voice", "sticker", "share"],
      default: "text",
      required: true,
    },

    // Used by ordinary text messages.
    message: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // Structured metadata for shared posts/content.
    sharedContent: {
      url: {
        type: String,
        trim: true,
      },
      domain: {
        type: String,
        trim: true,
      },
      caption: {
        type: String,
        trim: true,
        default: "",
      },
      postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
      message: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Metadata for image messages.
    image: {
      url: {
        type: String,
        trim: true,
      },
      publicId: {
        type: String,
        trim: true,
      },
    },

    // Metadata for playable voice messages.
    audio: {
      url: {
        type: String,
        trim: true,
      },
      publicId: {
        type: String,
        trim: true,
      },
      duration: {
        type: Number,
        min: 0,
      },
    },

    // Identifies a sticker from the built-in sticker picker.
    sticker: {
      id: {
        type: String,
        trim: true,
      },
      emoji: {
        type: String,
        trim: true,
      },
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Validate the content appropriate for each message type.
messageSchema.pre("validate", function () {
  if (this.type === "text" && !this.message?.trim()) {
    this.invalidate("message", "Text message is required.");
  }

  if (this.type === "share" && !this.sharedContent?.url) {
    this.invalidate("sharedContent.url", "Shared content URL is required.");
  }

  if (this.type === "image" && !this.image?.url) {
    this.invalidate("image.url", "Image URL is required.");
  }

  if (this.type === "voice" && !this.audio?.url) {
    this.invalidate("audio.url", "Audio URL is required.");
  }

  if (
    this.type === "sticker" &&
    (!this.sticker?.id || !this.sticker?.emoji)
  ) {
    this.invalidate("sticker", "Valid sticker information is required.");
  }
});

messageSchema.index({
  conversation: 1,
  createdAt: 1,
});

const Message = mongoose.model("Message", messageSchema);

export default Message;