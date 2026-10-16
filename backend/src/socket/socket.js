import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { parse } from "cookie";


export function initializeSocket(server) {

  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Authenticate Socket.IO connections using the existing JWT cookie.
  io.use((socket, next) => {
    try {


      const cookies = parse(socket.handshake.headers.cookie) || ""; //socket.handshake.headers.cookie is a string containing cookies, not an object with .token property.
      const token = cookies.token

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.userId) {
        return next(new Error("Invalid authentication token"));
      }

      // Set the user ID from the verified token, not from the client.
      socket.data.userId = String(decoded.userId);

      next();
    } catch {
      next(new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    socket.join(`user:${userId}`);

    console.log(`Socket connected: user=${userId}, socket=${socket.id}`);

    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: user=${userId}, reason=${reason}`
      );
    });
  });

  return io;
}