import Notification from "../models/Notification.js";

const getId = (value) => String(value?._id ?? value ?? "");

export const createNotification = async ({
  recipient,
  sender,
  type,
  post = null,
  comment = null,
  conversation = null,
  relatedMessage = null,
  io = null,
}) => {
  const recipientId = getId(recipient);
  const senderId = getId(sender);
  const postId = post ? getId(post) : null;

  // Don't notify users about their own actions.
  if (
    !recipientId ||
    !senderId ||
    recipientId === senderId
  ) {
    return null;
  }

  try {
    let createdNotification;

    // Reuse the existing notification for the same like.
    if (type === "like" && postId) {
      createdNotification = await Notification.findOne({
        recipient: recipientId,
        sender: senderId,
        type: "like",
        post: postId,
      }).sort({ createdAt: -1 });

      if (createdNotification) {
        // Make the existing notification unread again.
        createdNotification.isRead = false;
        createdNotification.readAt = null;

        await createdNotification.save();
      }
    }

    // Create a record if no matching like notification exists,
    // or if this is a comment, follow, or message.
    if (!createdNotification) {
      createdNotification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type,
        post,
        comment,
        conversation,
        relatedMessage,
      });
    }

    // Fetch the populated notification for the frontend.
    const notification = await Notification.findById(
      createdNotification._id,
    )
      .populate("sender", "username name profilePicture")
      .populate("post", "caption image")
      .populate("comment", "text")
      .populate(
        "relatedMessage",
        "type message image audio sticker sharedContent",
      )
      .lean();

    // Get the current unread count from MongoDB.
    const unreadCount = await Notification.countDocuments({
      recipient: recipientId,
      isRead: false,
    }).catch((error) => {
      console.error("Unread notification count error:", error);
      return null;
    });

    const payload = {
      notification: notification || createdNotification,
    };

    if (unreadCount !== null) {
      payload.unreadCount = unreadCount;
    }

    // Notify the recipient through Socket.IO.
    io?.to(`user:${recipientId}`).emit(
      "notification:new",
      payload,
    );

    return notification || createdNotification;
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
};