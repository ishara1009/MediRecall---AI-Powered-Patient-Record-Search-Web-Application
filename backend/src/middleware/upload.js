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
    // Escape spaces and add timestamp for unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${uniqueSuffix}-${cleanFilename}`);
  }
});

const fileFilter = (req, file, cb) => {
  const isPdf = ['files', 'pdf'].includes(file.fieldname) && file.mimetype === 'application/pdf';
  const isPatientPhoto = file.fieldname === 'patientPhoto' && ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
  if (isPdf || isPatientPhoto) {
    cb(null, true);
  } else {
    cb(new Error('Records must be PDFs and the patient photo must be JPG, PNG, or WebP.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB file size limit for large research papers
  }
});

module.exports = upload;
