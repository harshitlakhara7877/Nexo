import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You can't message yourself",
      });
    }

    let conversation = await Conversation.findOne({
      participants: {
        $all: [senderId, receiverId],
      },
      $expr: {
        $eq: [{ $size: "$participants" }, 2],
      },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      message: message.trim(),
    });

    conversation.message.push(newMessage._id);
    await conversation.save();

    await newMessage.populate({
      path: "sender",
      select: "username profilePicture",
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;

    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You can't get a conversation with yourself",
      });
    }

    const conversation = await Conversation.findOne({
      participants: {
        $all: [senderId, receiverId],
      },
      $expr: {
        $eq: [{ $size: "$participants" }, 2],
      },
    }).populate({
      path: "messages",
      options: {
        sort: {
          createdAt: 1,
        },
      },
      populate: {
        path: "sender",
        select: "username profilePicture",
      },
    });

    if (!conversation) {
      return res.status(200).json({
        success: true,
        messages: [],
      });
    }

    return res.status(200).json({
      success: true,
      messages: conversation.message,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};