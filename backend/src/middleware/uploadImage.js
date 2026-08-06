const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `profile-${uniqueSuffix}-${cleanFilename}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Check mime type to restrict to images only
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG and WEBP image files are allowed!'), false);
  }
};

const uploadImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = uploadImage;
