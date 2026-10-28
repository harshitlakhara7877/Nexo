import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import User from "../models/User.js";


const MAX_LIMIT = 30;
const DEFAULT_LIMIT = 20;

const parsePositiveInteger = (value, fallback) => {
    if (typeof value !== "string" || value.trim() === "") {
        return fallback;
    }

    const parsed = Number(value);

    return Number.isSafeInteger(parsed) && parsed > 0
        ? parsed
        : fallback;
};

const getPagination = (query) => {
    const page = parsePositiveInteger(query.page, 1);
    const limit = Math.min(
        MAX_LIMIT,
        parsePositiveInteger(query.limit, DEFAULT_LIMIT),
    );

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};



// GET /notifications?page=1&limit=20
export const getNotifications = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);

        const filterName =
            typeof req.query.filter === "string"
                ? req.query.filter
                : "all";

        const allowedFilters = [
            "all",
            "following",
            "comments",
            "follows",
        ];

        if (!allowedFilters.includes(filterName)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification filter.",
            });
        }

        const filter = {
            recipient: req.id,
        };

        if (filterName === "comments") {
            filter.type = "comment";
        } else if (filterName === "follows") {
            filter.type = "follow";
        } else if (filterName === "following") {
            const user = await User.findById(req.id)
                .select("following")
                .lean();

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found.",
                });
            }

            filter.sender = {
                $in: user.following || [],
            };
        }

        const [notifications, unreadCount] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit + 1)
                .populate("sender", "username name profilePicture")
                .populate("post", "caption image")
                .populate("comment", "text")
                .populate(
                    "relatedMessage",
                    "type message image audio sticker sharedContent",
                )
                .lean()
            ,

            // Always count all unread notifications, regardless of tab.
            Notification.countDocuments({
                recipient: req.id,
                isRead: false,
            }),
        ]);

        return res.status(200).json({
            success: true,
            notifications: notifications.slice(0, limit),
            unreadCount,
            page,
            limit,
            hasMore: notifications.length > limit,
        });
    } catch (error) {
        console.error("Get notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load notifications.",
        });
    }
};

// GET /notifications/unread-count
export const getUnreadNotificationCount = async (req, res,) => {
    try {
        const unreadCount = await Notification.countDocuments({ recipient: req.id, isRead: false });

        return res.status(200).json({
            success: true,
            unreadCount,
        });
    } catch (error) {
        console.error(
            "Get unread notification count error:",
            error,
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load unread notification count.",
        });
    }
};

// PATCH /notifications/:id/read
export const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID.",
            });
        }

        // Only the recipient can mark this notification as read.
        let notification = await Notification.findOneAndUpdate(
            {
                _id: id,
                recipient: req.id,
                isRead: false,
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                },
            },
            {
                new: true,
            },
        );

        // If it was already read, return success without changing it.
        if (!notification) {
            notification = await Notification.findOne({
                _id: id,
                recipient: req.id,
            });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: "Notification not found.",
                });
            }
        }

        const unreadCount = await Notification.countDocuments({
            recipient: req.id,
            isRead: false,
        });

        req.app.get("io")?.to(`user:${String(req.id)}`).emit(
            "notification:read",
            {notificationId: String(req.params.id),unreadCount},
        );

        return res.status(200).json({
            success: true,
            unreadCount,
            notification: {
                _id: notification._id,
                isRead: notification.isRead,
                readAt: notification.readAt,
            },
        });
    } catch (error) {
        console.error("Mark notification read error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to mark notification as read.",
        });
    }
};

// PATCH /notifications/read-all
export const markAllNotificationsRead = async (
    req,
    res,
) => {
    try {
        const result = await Notification.updateMany(
            {
                recipient: req.id,
                isRead: false,
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                },
            },
        );

        return res.status(200).json({
            success: true,
            modifiedCount: result.modifiedCount,
            unreadCount: 0,
        });
    } catch (error) {
        console.error(
            "Mark all notifications read error:",
            error,
        );

        return res.status(500).json({
            success: false,
            message: "Unable to mark all notifications as read.",
        });
    }
};