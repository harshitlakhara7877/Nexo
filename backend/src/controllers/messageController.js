import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import UserReport from "../models/UserReport.js";

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

    // Exclude conversations hidden by this specific user.
    // A deletion record for the other participant does not hide it
    // from the current user.
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

    const conversation = await Conversation.findOne(
      getConversationQuery(senderId, receiverId)
    );

    if (!conversation) {
      return res.status(200).json({
        success: true,
        conversation: null,
        participant: receiver,
        messages: [],
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

    return res.status(200).json({
      success: true,
      conversation: {
        _id: conversation._id,
      },
      participant: receiver,
      messages,
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
  try {
    const senderId = req.id;
    const receiverId = req.params.id;

    const messageText =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!isValidId(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipient ID.",
      });
    }

    if (!messageText) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    if (messageText.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 2000 characters.",
      });
    }

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "You can't message yourself.",
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

    // Create the message.
    const newMessage = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      message: messageText,
    });

    // Maintain the message references in the conversation.
    conversation.message.push(newMessage._id);

    /*
     * A new message makes the conversation visible again
     * to both participants.
     *
     * IMPORTANT:
     * Do not clear deletedAt. It must remain as the user's
     * history cutoff, so old messages stay hidden.
     */
    for (const entry of conversation.deletedChatFor || []) {
      entry.isDeleted = false;
    }

    await conversation.save();

    await newMessage.populate({
      path: "sender",
      select: "username name profilePicture",
    });

    // Notify the recipient after the message has been saved.
    const io = req.app.get("io");

    io?.to(`user:${receiverId}`).emit("message:new", {
      conversationId: String(conversation._id),
      message: newMessage,
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

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
    const receiverId = req.params.id;
    const currentUserId = req.id;

    if (!isValidId(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (String(currentUserId) === String(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation.",
      });
    }

    const conversation = await Conversation.findOne(
      getConversationQuery(currentUserId, receiverId)
    );

    if (!conversation) {
      return res.status(200).json({
        success: true,
        modifiedCount: 0,
      });
    }

    // Respect the current user's history cutoff.
    const messageFilter = getVisibleMessageFilter(
      conversation,
      currentUserId
    );

    const result = await Message.updateMany(
      {
        ...messageFilter,
        sender: {
          $ne: currentUserId,
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

    if(result.modifiedCount > 0){
      const io = req.app.get("io");

      io?.to(`user:${receiverId}`).emit("message:read", {
        conversationId: String(conversation._id),
        messageIds: messageIds.map(String),
        readAt,
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