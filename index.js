const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Configuration
const mongoUrl = "mongodb://localhost:27017";
let mongoClient;

// Array to store allowed bus IDs
const allowedBusIds = ["1", "2", "3"];

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

// Route to append GPS data
app.patch("/locations/:busId/:lat/:lon", async (req, res) => {
  const { busId, lat, lon } = req.params;

  if (!allowedBusIds.includes(busId)) {
    res.status(403).send("Bus ID is not allowed.");
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

    res.status(201).send("Data appended successfully.");
  } catch (err) {
    console.error("Error appending GPS data", err);
    res.status(500).send("Internal Server Error.");
  }
});

// Route to get all GPS data for a specific day
app.get("/locations/:busId/:date", async (req, res) => {
  const { busId, date } = req.params;

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

// Route to get the current location of a specific bus
app.get("/locations/:busId/", async (req, res) => {
  const { busId } = req.params;

  if (!allowedBusIds.includes(busId)) {
    res.status(403).send("Bus ID is not allowed.");
    return;
  }

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Use the bus ID as the database name
    const db = mongoClient.db(`bus_${busId}`);

    // Use today's date as the collection name
    const collection = db.collection(today);

    // Fetch the most recent record
    const latestRecord = await collection.find().sort({ time: -1 }).limit(1).toArray();

    if (latestRecord.length === 0) {
      res.status(404).send("No location data available for today.");
    } else {
      res.status(200).json(latestRecord[0]);
    }
  } catch (err) {
    console.error("Error fetching current location", err);
    res.status(500).send("Internal Server Error.");
  }
});

app.listen(port, () => {
  console.log(`GPS Tracker API listening on port ${port}`);
});
