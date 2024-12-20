const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Create an express app
const app = express();
const port = 3000; // You can change this to your desired port

// Configure multer to store images in the 'uploads' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir); // Create the folder if it doesn't exist
    }
    cb(null, uploadDir); // Store files in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}_${file.originalname}`); // Use a timestamp to avoid overwriting files
  }
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

// Endpoint to handle image upload
app.post('/upload/:device_id', upload.single('image'), (req, res) => {
  const deviceId = req.params.device_id;

  if (!req.file) {
    return res.status(400).send('No image uploaded');
  }

  // Log the details of the uploaded file
  console.log(`Received image from device: ${deviceId}`);
  console.log('File details:', req.file);

  // Send a response confirming the upload
  res.status(200).send({
    message: 'Image uploaded successfully',
    filename: req.file.filename
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});