import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load backend/.env
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("Cloudinary configuration:", {
  cloudName: cloudName ? "✓ loaded" : "✗ missing",
  apiKey: apiKey ? "✓ loaded" : "✗ missing",
  apiSecret: apiSecret ? "✓ loaded" : "✗ missing",
});

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export default cloudinary;