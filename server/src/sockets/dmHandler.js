import DirectMessage from "../models/DirectMessage.js";
import User from "../models/User.js";
import { createNotification } from "../services/notifications.js";

/**
 * Registers Socket.io event handlers for real-time direct messages.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerDmHandlers(io, socket) {
  /**
   * Join a DM room between two users.
   * Room name is always sorted so both users join the same room.
   */
  socket.on("dm:join", (otherUserId) => {
    const roomId = [socket.data.userId, otherUserId].sort().join(":");
    socket.join(`dm:${roomId}`);
  });

  /**
   * Leave a DM room.
   */
  socket.on("dm:leave", (otherUserId) => {
    const roomId = [socket.data.userId, otherUserId].sort().join(":");
    socket.leave(`dm:${roomId}`);
  });

  /**
   * Send a direct message to another user.
   * Saves to DB and broadcasts to the DM room.
   */
  socket.on("dm:send", async (data) => {
    try {
      const { recipientId, content, isCode, codeLanguage } = data;
      const userId = socket.data.userId;

      if (!content || content.trim().length === 0) {
        return socket.emit("error", {
          message: "Message content cannot be empty",
        });
      }

      if (content.length > 4000) {
        return socket.emit("error", { message: "Message is too long" });
      }

      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return socket.emit("error", { message: "Recipient not found" });
      }

      const message = await DirectMessage.create({
        content: content.trim(),
        sender: userId,
        recipient: recipientId,
        isCode: isCode || false,
        codeLanguage: codeLanguage || null,
      });

      const populated = await DirectMessage.findById(message._id)
        .populate("sender", "username displayName avatar")
        .populate("recipient", "username displayName avatar");

      // Notify the recipient of the new DM
      await createNotification({
        recipient: recipientId,
        type: "direct_message",
        sender: userId,
        preview: content.trim().slice(0, 128),
      });

      const roomId = [userId, recipientId].sort().join(":");
      io.to(`dm:${roomId}`).emit("dm:new", { message: populated });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  /**
   * Broadcast a DM edit to both users.
   */
  socket.on("dm:edit", async (data) => {
    try {
      const { messageId, content } = data;
      const userId = socket.data.userId;

      const message = await DirectMessage.findById(messageId);
      if (!message) {
        return socket.emit("error", { message: "Message not found" });
      }

      if (message.sender.toString() !== userId) {
        return socket.emit("error", {
          message: "You can only edit your own messages",
        });
      }

      const updated = await DirectMessage.findByIdAndUpdate(
        messageId,
        { content, isEdited: true },
        { new: true },
      )
        .populate("sender", "username displayName avatar")
        .populate("recipient", "username displayName avatar");

      const roomId = [message.sender.toString(), message.recipient.toString()]
        .sort()
        .join(":");
      io.to(`dm:${roomId}`).emit("dm:updated", { message: updated });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  /**
   * Broadcast a DM deletion to both users.
   */
  socket.on("dm:delete", async (data) => {
    try {
      const { messageId } = data;
      const userId = socket.data.userId;

      const message = await DirectMessage.findById(messageId);
      if (!message) {
        return socket.emit("error", { message: "Message not found" });
      }

      if (message.sender.toString() !== userId) {
        return socket.emit("error", {
          message: "You can only delete your own messages",
        });
      }

      await DirectMessage.findByIdAndUpdate(messageId, {
        isDeleted: true,
        content: "This message was deleted",
      });

      const roomId = [message.sender.toString(), message.recipient.toString()]
        .sort()
        .join(":");
      io.to(`dm:${roomId}`).emit("dm:deleted", { messageId });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  /**
   * Mark a DM as read.
   */
  socket.on("dm:read", async (data) => {
    try {
      const { messageId } = data;

      await DirectMessage.findByIdAndUpdate(messageId, { readAt: new Date() });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });
}
