import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import UserReport from "../models/UserReport.js";
import { deleteAudioFromCloudinary, deleteFromCloudinary, uploadAudioToCloudinary, uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import { createNotification } from "../utils/createNotification.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

const getConversationQuery = (userId, otherUserId) => ({
  participants: {
    $all: [userId, otherUserId],
  },
  $expr: {
    $eq: [{ $size: "$participants" }, 2],
  },
});

// Find the current user's deletion record.
// Keep deletedAt even after isDeleted becomes false.
const getDeletionEntry = (conversation, userId) => {
  return (conversation?.deletedChatFor || []).find(
    (entry) =>
      String(entry.deletedFor?._id ?? entry.deletedFor) ===
      String(userId)
  );
};

// Create a message query that respects this user's deletion cutoff.
const getVisibleMessageFilter = (conversation, userId) => {
  const filter = {
    conversation: conversation._id,
  };

  const deletion = getDeletionEntry(conversation, userId);

  if (deletion?.deletedAt) {
    filter.createdAt = {
      $gt: deletion.deletedAt,
    };
  }

  return filter;
};

// Escape regex characters so searches treat input as literal text.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.id;

    const conversations = await Conversation.find({
      participants: currentUserId,
      $nor: [
        {
          deletedChatFor: {
            $elemMatch: {
              deletedFor: currentUserId,
              isDeleted: true,
            },
          },
        },
      ],
    })
      .populate({
        path: "participants",
        select: "username name profilePicture",
      })
      .sort({ updatedAt: -1 })
      .lean();

    if (conversations.length === 0) {
      return res.status(200).json({
        success: true,
        conversations: [],
        total: 0,
      });
    }

    const conversationIds = conversations.map(
      (conversation) => conversation._id
    );

    /*
     * Each conversation can have a different history cutoff
     * for the current user.
     *
     * Build a query that only retrieves messages newer than
     * that user's deletedAt timestamp.
     */
    const visibleMessageFilters = conversations.map(
      (conversation) => getVisibleMessageFilter(conversation, currentUserId)
    );

    // Retrieve the latest visible messages.
    const recentMessages = await Message.find({
      $or: visibleMessageFilters,
    })
      .populate({
        path: "sender",
        select: "username name profilePicture",
      })
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    const latestMessageByConversation = new Map();

    for (const message of recentMessages) {
      const conversationId = String(message.conversation);

      if (!latestMessageByConversation.has(conversationId)) {
        latestMessageByConversation.set(conversationId, message);
      }
    }

    // Count unread messages only if they are newer than the user's
    // history cutoff. Older hidden messages must not affect the badge.
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversation: {
            $in: conversationIds,
          },
          sender: {
            $ne: new mongoose.Types.ObjectId(currentUserId),
          },
          isRead: {
            $ne: true,
          },
          $or: visibleMessageFilters,
        },
      },
      {
        $group: {
          _id: "$conversation",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const unreadByConversation = new Map(
      unreadCounts.map((item) => [
        String(item._id),
        item.count,
      ])
    );

    const result = conversations
      .map((conversation) => {
        const participant = conversation.participants.find(
          (person) =>
            String(person?._id) !== String(currentUserId)
        );

        if (!participant) {
          return null;
        }

        const conversationId = String(conversation._id);

        return {
          _id: conversation._id,
          participant,
          lastMessage:
            latestMessageByConversation.get(conversationId) || null,
          unreadCount:
            unreadByConversation.get(conversationId) || 0,
          isMuted: (conversation.mutedBy || []).some(
            (id) => String(id) === String(currentUserId)
          ),
          updatedAt: conversation.updatedAt,
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(
            b.lastMessage?.createdAt || b.updatedAt
          ).getTime() -
          new Date(
            a.lastMessage?.createdAt || a.updatedAt
          ).getTime()
      );

    return res.status(200).json({
      success: true,
      conversations: result,
      total: result.length,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load conversations.",
    });
  }
};

// ============================================================
// GET /message/all/:id
// :id is the other participant's User ID.
// Fetch only messages visible to the logged-in user.
// ============================================================

export const getMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;

    if (!isValidId(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "You can't message yourself.",
      });
    }

    const receiver = await User.findById(receiverId)
      .select("username name profilePicture")
      .lean();

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const currentUser = await User.findById(senderId)
      .select("blocked")
      .lean();

    const conversation = await Conversation.findOne(
      getConversationQuery(senderId, receiverId)
    );

    if (!conversation) {
      return res.status(200).json({
        success: true,
        conversation: null,
        participant: receiver,
        messages: [],
        isMuted: false,
        isBlocked: (currentUser?.blocked || []).some(
          (id) => String(id) === String(receiverId)
        ),
      });
    }

    // Apply this user's history cutoff to all message operations.
    const messageFilter = getVisibleMessageFilter(
      conversation,
      senderId
    );

    // Mark only visible received messages as read.
    await Message.updateMany(
      {
        ...messageFilter,
        sender: {
          $ne: senderId,
        },
        isRead: {
          $ne: true,
        },
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    // Return only messages after this user's deletion timestamp.
    const messages = await Message.find(messageFilter)
      .populate({
        path: "sender",
        select: "username name profilePicture",
      })
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    const isMuted = (conversation.mutedBy || []).some(
      (id) => String(id) === String(senderId)
    );
    const isBlocked = (currentUser?.blocked || []).some(
      (id) => String(id) === String(receiverId)
    );

    return res.status(200).json({
      success: true,
      conversation: {
        _id: conversation._id,
        isMuted,
      },
      participant: receiver,
      messages,
      isMuted,
      isBlocked,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load messages.",
    });
  }
};

// ============================================================
// POST /message/send/:id
// :id is the recipient's User ID.
// ============================================================

export const sendMessage = async (req, res) => {
  let uploadedImage = null;
  let uploadedAudio = null;
  let createdMessageId = null;
  let conversationSaved = false;

  try {
    const senderId = req.id;
    const receiverId = req.params.id;

    const imageFile = req.files?.image?.[0] || null;
    const audioFile = req.files?.audio?.[0] || null;

    const messageText =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    // Parse and validate sharedContent if provided.
    let sharedContentData = null;
    let rawSharedContent = req.body?.sharedContent;

    if (typeof rawSharedContent === "string") {
      try {
        rawSharedContent = JSON.parse(rawSharedContent);
      } catch {
        // Not a JSON string
      }
    }

    if (rawSharedContent && typeof rawSharedContent === "object") {
      const rawUrl =
        typeof rawSharedContent.url === "string"
          ? rawSharedContent.url.trim()
          : "";

      if (!rawUrl) {
        return res.status(400).json({
          success: false,
          message: "A valid URL is required for shared content.",
        });
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(rawUrl);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Invalid URL protocol");
        }
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid URL provided for shared content.",
        });
      }

      const domain = parsedUrl.hostname || parsedUrl.host;
      const caption =
        typeof rawSharedContent.caption === "string"
          ? rawSharedContent.caption.trim().slice(0, 2000)
          : "";

      let postId = null;
      if (rawSharedContent.postId && isValidId(rawSharedContent.postId)) {
        postId = rawSharedContent.postId;
      } else {
        const match = parsedUrl.pathname.match(/\/post\/([a-fA-F0-9]{24})/);
        if (match && isValidId(match[1])) {
          postId = match[1];
        }
      }

      const sharedNote =
        typeof rawSharedContent.message === "string"
          ? rawSharedContent.message.trim()
          : "";

      sharedContentData = {
        url: rawUrl,
        domain,
        caption,
        ...(sharedNote && { message: sharedNote }),
        ...(postId && { postId }),
      };
    }

    // Validate recipient.
    if (!isValidId(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipient ID.",
      });
    }

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "You can't message yourself.",
      });
    }

    // Exactly one attachment at a time; text may accompany it.
    if (imageFile && audioFile) {
      return res.status(400).json({
        success: false,
        message: "Send one attachment at a time.",
      });
    }

    if (!imageFile && !audioFile && !messageText && !sharedContentData) {
      return res.status(400).json({
        success: false,
        message: "A message, attachment, or shared content is required.",
      });
    }

    if (messageText.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 2000 characters.",
      });
    }

    // Enforce the existing 5 MB image limit explicitly.
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Image must be 5 MB or smaller.",
      });
    }

    const receiverExists = await User.exists({
      _id: receiverId,
    });

    if (!receiverExists) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found.",
      });
    }

    // Check block status
    const [senderUser, receiverUser] = await Promise.all([
      User.findById(senderId).select("blocked").lean(),
      User.findById(receiverId).select("blocked").lean(),
    ]);

    const isBlocked =
      (senderUser?.blocked || []).some(
        (id) => String(id) === String(receiverId)
      ) ||
      (receiverUser?.blocked || []).some(
        (id) => String(id) === String(senderId)
      );

    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Unable to send message. User is blocked.",
      });
    }

    // Upload image or audio before creating the Message document.
    if (imageFile) {
      uploadedImage = await uploadToCloudinary(
        imageFile.buffer,
        "nexo/messages/images"
      );

      if (!uploadedImage?.secure_url || !uploadedImage?.public_id) {
        throw new Error("Image upload did not return valid metadata.");
      }
    }

    if (audioFile) {
      uploadedAudio = await uploadAudioToCloudinary(
        audioFile.buffer,
        "nexo/messages/audio"
      );

      if (!uploadedAudio?.secure_url || !uploadedAudio?.public_id) {
        throw new Error("Audio upload did not return valid metadata.");
      }
    }

    let conversation = await Conversation.findOne(
      getConversationQuery(senderId, receiverId)
    );

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        message: [],
        deletedChatFor: [],
      });
    }

    const type = audioFile
      ? "voice"
      : imageFile
        ? "image"
        : sharedContentData
          ? "share"
          : "text";

    const newMessage = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      type,
      message: messageText || (sharedContentData ? sharedContentData.url : ""),

      ...(sharedContentData && {
        sharedContent: sharedContentData,
      }),

      ...(uploadedImage && {
        image: {
          url: uploadedImage.secure_url,
          publicId: uploadedImage.public_id,
        },
      }),

      ...(uploadedAudio && {
        audio: {
          url: uploadedAudio.secure_url,
          publicId: uploadedAudio.public_id,
          ...(Number.isFinite(Number(req.body?.duration)) &&
            Number(req.body.duration) >= 0 && {
            duration: Number(req.body.duration),
          }),
        },
      }),
    });

    createdMessageId = newMessage._id;

    conversation.message.push(newMessage._id);

    // Preserve each user's deletedAt history cutoff.
    for (const entry of conversation.deletedChatFor || []) {
      entry.isDeleted = false;
    }

    await conversation.save();
    conversationSaved = true;

    await newMessage.populate({
      path: "sender",
      select: "username name profilePicture",
    });

    // Reuse the existing app-wide real-time delivery.
    const io = req.app.get("io");

    io?.to(`user:${receiverId}`).emit("message:new", {
      conversationId: String(conversation._id),
      message: newMessage,
    });

    const isRecipientMuted = (conversation.mutedBy || []).some(
      (id) => String(id) === String(receiverId)
    );

    if (!isRecipientMuted) {
      await createNotification({
        recipient: receiverId,
        sender: senderId,
        type: "message",
        conversation: conversation._id,
        relatedMessage: newMessage._id,
        io,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    // Clean up incomplete message/media saves when possible.
    if (!conversationSaved) {
      if (createdMessageId) {
        await Message.findByIdAndDelete(createdMessageId).catch(
          (cleanupError) => {
            console.error("Message cleanup error:", cleanupError);
          }
        );
      }

      if (uploadedImage?.public_id) {
        await deleteFromCloudinary(uploadedImage.public_id).catch(
          (cleanupError) => {
            console.error("Image cleanup error:", cleanupError);
          }
        );
      }

      if (uploadedAudio?.public_id) {
        await deleteAudioFromCloudinary(uploadedAudio.public_id).catch(
          (cleanupError) => {
            console.error("Audio cleanup error:", cleanupError);
          }
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to send message.",
    });
  }
};

// ============================================================
// GET /message/people?q=harshit
// Search for people to start a new conversation with.
// ============================================================

export const searchMessagePeople = async (req, res) => {
  try {
    const query =
      typeof req.query.q === "string"
        ? req.query.q.trim().slice(0, 80)
        : "";

    if (query.length < 2) {
      return res.status(200).json({
        success: true,
        users: [],
      });
    }

    const matcher = new RegExp(escapeRegex(query), "i");

    const users = await User.find({
      _id: {
        $ne: req.id,
      },
      $or: [
        { username: matcher },
        { name: matcher },
      ],
    })
      .select("username name profilePicture")
      .sort({ username: 1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Search message people error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search people.",
    });
  }
};

// ============================================================
// PATCH /message/read/:id
// :id is the other participant's User ID.
// ============================================================

export const markConversationRead = async (req, res) => {
  try {
    // The URL contains the other participant's ID.
    const otherUserId = req.params.id;
    const currentUserId = req.id;

    if (!isValidId(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (String(currentUserId) === String(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation.",
      });
    }

    // Only find a conversation that belongs to these two users.
    const conversation = await Conversation.findOne(
      getConversationQuery(currentUserId, otherUserId)
    );

    if (!conversation) {
      return res.status(200).json({
        success: true,
        modifiedCount: 0,
      });
    }

    // Respect the current user's deleted-message history cutoff.
    const messageFilter = getVisibleMessageFilter(
      conversation,
      currentUserId
    );

    // First identify the unread messages sent by the other user.
    const unreadMessages = await Message.find({
      ...messageFilter,
      sender: otherUserId,
      isRead: { $ne: true },
    })
      .select("_id")
      .lean();

    // No unread messages means no database update or socket event.
    if (unreadMessages.length === 0) {
      return res.status(200).json({
        success: true,
        modifiedCount: 0,
      });
    }

    const messageIds = unreadMessages.map(
      (message) => message._id
    );


    // Update only the messages we just identified.
    const result = await Message.updateMany(
      {
        ...messageFilter,
        _id: { $in: messageIds },
        sender: otherUserId,
        isRead: { $ne: true },
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    // Notify the original sender only after MongoDB is updated.
    if (result.modifiedCount > 0) {
      const io = req.app.get("io");

      io?.to(`user:${otherUserId}`).emit("message:read", {
        conversationId: String(conversation._id),
        messageIds: messageIds.map((id) => String(id)),
        readAt: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark conversation read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as read.",
    });
  }
};

// ============================================================
// DELETE /message/conversations/with/:id
// Hide the conversation and set the user's message-history cutoff.
// ============================================================

export const deleteConversationForMe = async (req, res) => {
  try {
    const currentUserId = req.id;
    const otherUserId = req.params.id;

    if (!isValidId(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (String(currentUserId) === String(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation.",
      });
    }

    const conversation = await Conversation.findOne(
      getConversationQuery(currentUserId, otherUserId)
    );

    // Nothing to remove if the conversation doesn't exist.
    if (!conversation) {
      return res.status(200).json({
        success: true,
        message: "Conversation removed from your inbox.",
      });
    }

    if (!conversation.deletedChatFor) {
      conversation.deletedChatFor = [];
    }

    let deletion = getDeletionEntry(
      conversation,
      currentUserId
    );

    if (deletion) {
      // Deleting again establishes a new history cutoff.
      deletion.deletedAt = new Date();
      deletion.isDeleted = true;
    } else {
      // First deletion by this participant.
      conversation.deletedChatFor.push({
        deletedFor: currentUserId,
        deletedAt: new Date(),
        isDeleted: true,
      });
    }

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "Conversation removed from your inbox.",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete conversation.",
    });
  }
};

// ============================================================
// POST /message/report/:id
// Report another user.
// ============================================================

export const reportUser = async (req, res) => {
  try {
    const reportedUserId = req.params.id;
    const { reason, details = "" } = req.body ?? {};

    const allowedReasons = [
      "spam",
      "harassment",
      "inappropriate",
      "impersonation",
      "other",
    ];

    if (!isValidId(reportedUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (String(req.id) === String(reportedUserId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot report yourself.",
      });
    }

    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid report reason.",
      });
    }

    if (
      typeof details !== "string" ||
      details.length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Details must be at most 1000 characters.",
      });
    }

    const reportedUserExists = await User.exists({
      _id: reportedUserId,
    });

    if (!reportedUserExists) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    await UserReport.create({
      reporter: req.id,
      reportedUser: reportedUserId,
      reason,
      details: details.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully.",
    });
  } catch (error) {
    console.error("Report user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit report.",
    });
  }
};

// ============================================================
// PATCH /message/mute/:id
// Toggle mute conversation for the current user.
// ============================================================

export const toggleMuteConversation = async (req, res) => {
  try {
    const currentUserId = req.id;
    const otherUserId = req.params.id;

    if (!isValidId(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    let conversation = await Conversation.findOne(
      getConversationQuery(currentUserId, otherUserId)
    );

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, otherUserId],
        message: [],
        deletedChatFor: [],
        mutedBy: [currentUserId],
      });
      return res.status(200).json({
        success: true,
        isMuted: true,
        message: "Conversation muted.",
      });
    }

    if (!conversation.mutedBy) {
      conversation.mutedBy = [];
    }

    const alreadyMuted = conversation.mutedBy.some(
      (id) => String(id) === String(currentUserId)
    );

    if (alreadyMuted) {
      conversation.mutedBy = conversation.mutedBy.filter(
        (id) => String(id) !== String(currentUserId)
      );
    } else {
      conversation.mutedBy.push(currentUserId);
    }

    await conversation.save();

    return res.status(200).json({
      success: true,
      isMuted: !alreadyMuted,
      message: !alreadyMuted ? "Conversation muted." : "Conversation unmuted.",
    });
  } catch (error) {
    console.error("Toggle mute conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to toggle mute state.",
    });
  }
};
