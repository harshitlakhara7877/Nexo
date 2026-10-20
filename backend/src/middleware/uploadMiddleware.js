import multer from "multer";

const storage = multer.memoryStorage();

const imageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];
const audioTypes = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
];

const fileFilter = (req, file, cb) => {
  

  if (["image", "profilePicture"].includes(file.fieldname) && imageTypes.includes(file.mimetype)) {
    return cb(null, true);
  } 

  if(file.fieldname === "audio" && audioTypes.includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new Error("Only JPEG, PNG, JPG, and WebP images are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files:1
  },
});

export default upload;