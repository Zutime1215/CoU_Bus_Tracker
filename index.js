const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const cluster = require("cluster");
const os = require("os");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB Configuration
const mongoUrl = "mongodb://localhost:27017";
let mongoClient;
let liveLocationData = {}; // In-memory store for current bus locations

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

const port = process.env.PORT || 8080;

// Array of allowed bus IDs
const allowedBusIds = ["1", "2", "3"];

// Route to append GPS data
app.patch("/locations/:busId/:lat/:lon", async (req, res) => {
  const { busId, lat, lon } = req.params;

  if (!allowedBusIds.includes(busId)) {
    res.status(400).send("Bus ID not allowed.");
    return;
  }

  if (!lat || !lon) {
    res.status(400).send("Latitude and Longitude are required.");
    return;
  }

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Use the bus ID as the database name
    const db = mongoClient.db(`bus_${busId}`);

    // Use today's date as the collection name
    const collection = db.collection(today);

    // Prepare the data to be inserted
    const gpsData = {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      time: Date.now() // Epoch time of the data
    };

    // Insert the data into the collection
    await collection.insertOne(gpsData);

    // Update in-memory store with the latest location
    liveLocationData[busId] = { lat: gpsData.lat, lon: gpsData.lon };

    res.status(200).send("Data appended successfully.");
  } catch (err) {
    console.error("Error appending GPS data", err);
    res.status(500).send("Internal Server Error.");
  }
});

// Route to get the most recent latitude and longitude for a bus
app.get("/locations/:busId/", (req, res) => {
  const { busId } = req.params;

  if (!allowedBusIds.includes(busId)) {
    res.status(400).send("Bus ID not allowed.");
    return;
  }

  const location = liveLocationData[busId];

  if (location) {
    res.status(200).json(location);
  } else {
    res.status(404).send("Location data not found.");
  }
});

// Route to get all GPS data for a specific day
app.get("/locations/:busId/:date", async (req, res) => {
  const { busId, date } = req.params;

  if (!allowedBusIds.includes(busId)) {
    res.status(400).send("Bus ID not allowed.");
    return;
  }

  try {
    // Use the bus ID as the database name
    const db = mongoClient.db(`bus_${busId}`);

    // Use the provided date as the collection name
    const collection = db.collection(date);

    // Fetch all records for the date
    const data = await collection.find().toArray();

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching GPS data", err);
    res.status(500).send("Internal Server Error.");
  }
});

// Cluster the application to utilize all CPU cores
if (cluster.isMaster) {
  const numCPUs = 1;
  console.log(`Master ${process.pid} is running`);

  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died, starting a new one...`);
    cluster.fork();
  });
} else {
  app.listen(port, () => {
    console.log(`Worker ${process.pid} started on port ${port}`);
  });
}
