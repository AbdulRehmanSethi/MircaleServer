const fs = require('fs');
const express = require('express');
const multer = require('multer');
const path = require('path');
const { processImages } = require('../Controllers/imageTransformation/imageController');

const imageRouter = express.Router();

// Define the upload path
const uploadPath = path.resolve(__dirname, '../uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true }); // Create directory if it does not exist
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Set up multer middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Handle POST request and image upload
imageRouter.post('/process-images', upload.array('images', 3), processImages);

module.exports = imageRouter;
