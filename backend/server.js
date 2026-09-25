import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js"
import userRoutes from "./src/routes/userRoutes.js"

dotenv.config();


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({extended: true}));
app.use(cors({
  origin:'https://localhost:5173',
  credentials: true
}))


app.get("/", (req, res)=>{
  return res.status(200).json({
    message: "Hello ji",
    success: true
  })
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);


const PORT = process.env.PORT || 5000;

// console.log("mongo start")

await connectDB();

app.listen(PORT, ()=>{
  console.log(`server is running on https://localhost:${PORT}`)
});