const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const mongoUrl = "mongodb://localhost:27017";
const port = process.env.PORT || 8080;
const allowedBusIds = ["1", "2", "3"]; // Replace with actual allowed IDs
let mongoClient;
let liveLocationData = {}; // In-memory store for live locations

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
// app.use(express.static("public"));

// Initialize MongoDB connection
MongoClient.connect(mongoUrl)
  .then(client => {
    console.log("Connected to MongoDB");
    mongoClient = client;
  })
  .catch(err => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });

// Configure multer for image storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir); // Create directory if it doesn't exist
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}_${file.originalname}`); // Timestamped filenames
  }
});
const upload = multer({ storage: storage });



// Unified POST endpoint for image and coordinates
app.post("/upload/:busId", upload.single("image"), async (req, res) => {
  const { busId } = req.params;
  const coordinates = req.body.coordinates; // Coordinates are sent as part of the form-data

  // Validate bus ID
  if (!allowedBusIds.includes(busId)) {
    return res.status(400).send("Bus ID not allowed.");
  }

  // Validate uploaded image
  if (!req.file) {
    return res.status(400).send("No image uploaded.");
  }

  // Validate coordinates
  if (!coordinates) {
    return res.status(400).send("Coordinates are required.");
  }

  let lat, lon;
  try {
    const [latitude, longitude] = coordinates.split("/");
    lat = parseFloat(latitude);
    lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error("Invalid latitude or longitude.");
    }
  } catch (err) {
    return res.status(400).send("Invalid coordinates format.");
  }

  try {
    // MongoDB handling for GPS data
    const today = new Date().toISOString().split("T")[0];
    const db = mongoClient.db(`bus_${busId}`);
    const collection = db.collection(today);

    const gpsData = {
      lat,
      lon,
      time: Date.now() // Epoch time
    };

    await collection.insertOne(gpsData);
    liveLocationData[busId] = { lat, lon };

    console.log(`Received image and GPS data for bus: ${busId}`);
    console.log(`File details:`, req.file);

    // Send response
    res.status(200).send({
      message: "Image and GPS data uploaded successfully.",
      filename: req.file.filename,
      coordinates: { lat, lon }
    });
  } catch (err) {
    console.error("Error processing the request:", err);
    res.status(500).send("Internal Server Error.");
  }
});

// Additional routes for fetching GPS data
app.get("/locations/:busId/", (req, res) => {
  const { busId } = req.params;

  if (!allowedBusIds.includes(busId)) {
    return res.status(400).send("Bus ID not allowed.");
  }

  const location = liveLocationData[busId];

  if (location) {
    res.status(200).json(location);
  } else {
    res.status(404).send("Location data not found.");
  }
});

app.get("/locations/:busId/:date", async (req, res) => {
  const { busId, date } = req.params;

  if (!allowedBusIds.includes(busId)) {
    return res.status(400).send("Bus ID not allowed.");
  }

  try {
    const db = mongoClient.db(`bus_${busId}`);
    const collection = db.collection(date);

    const data = await collection.find().toArray();
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching GPS data", err);
    res.status(500).send("Internal Server Error.");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
