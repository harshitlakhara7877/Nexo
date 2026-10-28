import express, { urlencoded } from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js"
import userRoutes from "./src/routes/userRoutes.js"
import messageRoutes from "./src/routes/messageRoutes.js";
import postRoutes from "./src/routes/postRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import storyRoutes from "./src/routes/storyRoutes.js";
import { getPostPreview } from "./src/controllers/postController.js";
import { initializeSocket } from "./src/socket/socket.js";
import http from "http"
dotenv.config();

const app = express();

// Create one HTTP server for Express and Socket.IO.
const server = http.createServer(app);

// Attach Socket.IO to that SAME server.
const io = initializeSocket(server);

// Make io available to controllers later.
app.set("io", io);


app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({extended: true}));
app.use(cors({
  origin:process.env.CLIENT_ORIGIN,
  credentials: true
}))


app.get("/", (req, res)=>{
  return res.status(200).json({
    message: "Hello ji",
    success: true
  })
});

// Open Graph link preview for WhatsApp and other social crawlers
app.get(["/p/:id", "/post/:id"], (req, res, next) => {
  const userAgent = req.headers["user-agent"] || "";
  const isCrawler = /whatsapp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|redditbot|Applebot|Discordbot/i.test(
    userAgent
  );
  if (isCrawler || req.path.startsWith("/p/")) {
    return getPostPreview(req, res);
  }
  next();
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/message", messageRoutes);
app.use("/post", postRoutes);
app.use("/story", storyRoutes);
app.use("/notifications", notificationRoutes);


const PORT = process.env.PORT || 5000;

// console.log("mongo start")

await connectDB();

server.listen(PORT, ()=>{
  console.log(`server is running on https://localhost:${PORT}`)
});