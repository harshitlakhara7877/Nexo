import multer from "multer";

const storage = multer.memoryStorage();

const imageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];
const videoTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
  "video/x-matroska",
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
  if (
    ["image", "profilePicture", "media"].includes(file.fieldname) &&
    (imageTypes.includes(file.mimetype) || videoTypes.includes(file.mimetype))
  ) {
    return cb(null, true);
  }

  if (file.fieldname === "video" && videoTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  if (file.fieldname === "audio" && audioTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only supported images (JPEG, PNG, JPG, WebP), audio, or video files are allowed."
    ),
    false
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
    files: 1,
  },
});

export default upload;