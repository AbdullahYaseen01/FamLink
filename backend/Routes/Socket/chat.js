import { Server } from "socket.io";
import Message from "../../Schema/message.js";
import User from "../../Schema/user.js";
import Notification from "../../Schema/notificaion.js";
import Chat from "../../Schema/chat.js";
import mongoose from "mongoose";
import { sendNewMessageEmail } from "../../Services/email/email.js";

const { ObjectId } = mongoose.Types;

const chatSocket = (io) => {
  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`User: ${userId} connected`);

    // Mark online immediately on connection so DB is updated before any
    // getChatsThunk() call on the frontend reads it, and broadcast to all
    // already-connected peers right away — no "userOnline" round-trip needed.
    if (ObjectId.isValid(userId)) {
      socket.join(userId);
      await User.findByIdAndUpdate(userId, { online: true, lastSeen: new Date() });
      socket.broadcast.emit("userStatusChanged", { userId, online: true });
    }

    // Keep the userOnline handler so any explicit frontend emits still work
    // (e.g. after a reconnect where the connection handler already ran).
    socket.on("userOnline", async (uid) => {
      if (ObjectId.isValid(uid)) {
        socket.join(uid);
        socket.broadcast.emit("userStatusChanged", { userId: uid, online: true });
      }
    });

    // Join a chat room
    socket.on("joinChat", async ({ chatId }) => {
      socket.join(chatId);
      // Emit all previous messages in the chat
      const messages = await Message.find({ chatId }).populate(
        "sender",
        "email name imageUrl type _id"
      );
      io.to(chatId).emit("previousMessages", messages);
    });

    socket.on("getNotification", async ({ userId }) => {
      const notifications = await Notification.find({ receiverId: userId })
        .populate("senderId", "email name imageUrl type _id")
        .sort({ createdAt: -1 }); // Sort notifications in descending order (most recent first)

      // Emit previous notifications to the user
      socket.emit("previousNotifications", notifications);
    });

    // Leave a chat room
    socket.on("leaveChat", async ({ chatId }) => {
      socket.leave(chatId);
    });

    socket.on("sendMessage", async ({ content }) => {
      const message = new Message({
        chatId: content.chatId,
        sender: content.senderId,
        content: content.content,
        type: content.type,
      });

      await message.save();

      await Chat.findByIdAndUpdate(content.chatId, {
        lastMessage: content.content,
        type: content.type,
      });

      const populatedMessage = await Message.findById(message._id)
        .populate("sender")
        .exec();

      // ✅ EMIT to user
      io.to(content.chatId).emit("newMessage", populatedMessage);
    });

    // ── Typing indicator ──
    // Broadcast into the chat room (same room joinChat/sendMessage use),
    // so anyone currently viewing that chat sees the typing state. We
    // use socket.to(...) rather than io.to(...) so the typing sender
    // doesn't receive their own typing event back.
    socket.on("typing", ({ chatId, userId }) => {
      if (!chatId || !userId) return;
      socket.to(chatId).emit("userTyping", { chatId, userId });
    });

    socket.on("stopTyping", ({ chatId, userId }) => {
      if (!chatId || !userId) return;
      socket.to(chatId).emit("userStoppedTyping", { chatId, userId });
    });

    // Handle message seen
    socket.on("messagesSeen", async ({ chatId, userId }) => {
      const messages = await Message.aggregate([
        {
          $match: {
            chatId: new ObjectId(chatId),
            sender: {
              $ne: new ObjectId(userId),
            },
            seen: false,
          },
        },
      ]);
      if (messages.length > 0) {
        messages.forEach(async (message) => {
          await Message.findByIdAndUpdate(message._id, { seen: true });
        });
      }
      io.to(userId).emit("messagesSeen", chatId);
    });

    socket.on("sendNotification", async ({ content }) => {
      try {
        // Initialize a base notification object
        const notificationData = {
          senderId: content.senderId,
          receiverId: content.receiverId,
          type: content.type,
        };

        // Add specific fields based on the content type
        if (content.type === "Message") {
          notificationData.chatId = content.chatId;
          notificationData.content = content.content;
        } else if (content.content === "comment") {
          notificationData.postId = content.postId;
          notificationData.content = content.content;

          // Add commentId only if it exists
          if (content.commentId) {
            notificationData.commentId = content.commentId;
          }
        } else if (content.type === "Booking") {
          notificationData.bookingId = content.bookingId;
          notificationData.content = content.content;
        } else {
          notificationData.postId = content.postId;
          notificationData.content = content.content;
        }

        // Create and save the notification
        const notification = new Notification(notificationData);
        await notification.save();

        // Populate senderId with necessary fields
        const populatedNotification = await Notification.findById(
          notification._id
        ).populate("senderId", "email name imageUrl type _id");

        // Emit the populated notification to the receiver's room
        io.to(content.receiverId).emit(
          "newNotification",
          populatedNotification
        );

        // Email the recipient about a new message only if they're offline
        // (online users see it in real time). Fire-and-forget.
        if (content.type === "Message") {
          const receiver = await User.findById(content.receiverId).select(
            "email name online"
          );
          if (receiver?.email && receiver.online === false) {
            const senderName = populatedNotification?.senderId?.name;
            sendNewMessageEmail(
              receiver.email,
              receiver.name,
              senderName,
              content.content,
              { id: populatedNotification?.senderId?._id }
            ).catch(
              (err) => console.error("Failed to send new-message email:", err)
            );
          }
        }
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    });

   socket.on("sendNotificationToAdmin", async ({ content }, callback) => {
  try {
    console.log("Notification content received:", content);
    const adminUser = await User.findOne({ type: "Admin" }).select("_id");

    if (!adminUser) {
      console.error("Admin user not found.");
      return;
    }

    const notificationData = {
      senderId: content.senderId,
      receiverId: adminUser._id,
      type: content.type,
      content: content.content,
    };

    const notification = new Notification(notificationData);
    await notification.save();

    const populatedNotification = await Notification.findById(
      notification._id
    ).populate("senderId", "email name imageUrl type _id");

    console.log("Emitting to admin room:", adminUser._id.toString());
    io.to(adminUser._id.toString()).emit("newNotification", populatedNotification);

    if (callback) callback(); // ✅ Acknowledge the emit
  } catch (error) {
    console.error("Error sending notification:", error);
  }
});


    socket.on("notificationSeen", async ({ notificationId }) => {
      try {
        if (!ObjectId.isValid(notificationId)) {
          throw new Error("Invalid notification ID");
        }

        // Update the notification in the database
        await Notification.findByIdAndUpdate(notificationId, {
          seen: true,
          seenAt: new Date(),
        });

        console.log(`Notification ${notificationId} marked as seen`);
      } catch (error) {
        console.error("Error marking notification as seen:", error);
      }
    });

    socket.on("disconnect", async () => {
      // Update user offline status
      const userId = socket.handshake.query.userId;
      console.log(`User: ${userId} disconnected`);
      if (ObjectId.isValid(userId)) {
        await User.findByIdAndUpdate(userId, {
          online: false,
          lastSeen: new Date(),
        });
        socket.broadcast.emit("userStatusChanged", { userId, online: false });
      }
    });
  });
};

export default chatSocket;