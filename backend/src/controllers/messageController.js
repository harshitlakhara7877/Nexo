import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

const getConversationQuery = (userId, otherUserId) => ({
  participants: {
    $all: [userId, otherUserId],
  },
  $expr: {
    $eq: [{ $size: "$participants" }, 2],
  },
});

// GET /message/conversations
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.id;

    const conversations = await Conversation.find({
      participants: currentUserId,
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

    // The first message encountered per conversation is the latest.
    const recentMessages = await Message.find({
      conversation: { $in: conversationIds },
    })
      .populate({
        path: "sender",
        select: "username name profilePicture",
      })
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    const latestMessageByConversation = new Map();

    for (const message of recentMessages) {
      const id = String(message.conversation);

      if (!latestMessageByConversation.has(id)) {
        latestMessageByConversation.set(id, message);
      }
    }

    // Missing isRead fields from older records count as unread.
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversationIds },
          sender: {
            $ne: new mongoose.Types.ObjectId(currentUserId),
          },
          isRead: { $ne: true },
        },
      },
      {
        $group: {
          _id: "$conversation",
          count: { $sum: 1 },
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

        if (!participant) return null;

        const conversationId = String(conversation._id);

        return {
          _id: conversation._id,
          participant,
          lastMessage:
            latestMessageByConversation.get(conversationId) ||
            null,
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

// GET /message/all/:id
// :id is the other participant's User ID.
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

    // mark received messages as read.
    await Message.updateMany(
      {
        conversation: conversation._id,
        sender: {$ne : senderId},
        isRead: {$ne: true},
      },
      {
        $set:{
          isRead: true,
          readAt: new Date(),
        }
      }
    );

    const messages = await Message.find({
      conversation: conversation._id,
    })
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

// POST /message/send/:id
// :id is the recipient's User ID.
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;

    const messageText =
      typeof req.body.message === "string"
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
      });
    }

    let newMessage = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      message: messageText,
    });

    conversation.message.push(newMessage._id);
    await conversation.save();

    await newMessage.populate({
      path: "sender",
      select: "username name profilePicture",
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

// GET /message/people?q=harshit
// Search for people to start a new conversation with.
export const searchMessagePeople = async (req, res) => {
  try {
    const query =
      typeof req.query.q === "string"
        ? req.query.q.trim()
        : "";

    if (query.length < 2) {
      return res.status(200).json({
        success: true,
        users: [],
      });
    }

    const escapedQuery = query.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const matcher = new RegExp(escapedQuery, "i");

    const users = await User.find({
      _id: { $ne: req.id },
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

// PATCH /message/read/:id
// Explicit endpoint for marking a conversation's received messages read.
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

    const conversation = await Conversation.findOne(
      getConversationQuery(currentUserId, receiverId)
    ).select("_id");

    if (!conversation) {
      return res.status(200).json({
        success: true,
        modifiedCount: 0,
      });
    }

    const result = await Message.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: currentUserId },
        isRead: { $ne: true },
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

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