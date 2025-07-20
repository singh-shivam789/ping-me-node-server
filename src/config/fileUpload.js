import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.resolve("public", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const getFormattedFileName = (fileName) => {
  return fileName.split(" ").join("-");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + getFormattedFileName(file.originalname);
    cb(null, unique);
  }
});

function fileFilter(req, file, cb) {
  if (/^image\/(jpeg|png|jpg)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG & PNG images allowed"), false);
  }
}

const limits = { fileSize: 5 * 1024 * 1024 };

export default multer({ storage, fileFilter, limits });
