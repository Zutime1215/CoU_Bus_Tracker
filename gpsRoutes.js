const express = require("express");

const { getMongoClient } = require("./mongoClient");
const { postToPage, allowedBusInfos } = require("./facebookUtils");
const { findNearestStand } = require("./standUtils");

const router = express.Router();

router.patch("/:busId/:lat/:lon", async (req, res) => {
    const { busId, lat, lon } = req.params;

    if (!Object.keys(allowedBusInfos).includes(busId)) {
        res.status(400).send("Bus ID not allowed.");
        return;
    }

    if (!lat || !lon) {
        res.status(400).send("Latitude and Longitude are required.");
        return;
    }

    try {
        const toDate = new Date();
        const collection_name = toDate.toISOString().split("T")[0];
        const localTimeNow = toDate.toLocaleString();
        const db = getMongoClient().db(`bus_${busId}`);
        const collection = db.collection(collection_name);

        let gpsData = {
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            time: Date.now()
        };

        await collection.insertOne(gpsData);

        const { nearestStand, shortestDistance } = findNearestStand(gpsData.lat, gpsData.lon);
        let msg = `Current Position: ${gpsData.lat}, ${gpsData.lon}\nBus is ${shortestDistance.toFixed(2)} meters away from ${nearestStand}\nLast Updated: ${localTimeNow}`;
        await postToPage(msg, busId, allowedBusInfos[busId].pagePostId, allowedBusInfos[busId].pageAccessToken, allowedBusInfos[busId].pageId);

        res.status(200).send("Data appended successfully.");

    } catch (err) {
        console.error("Error appending GPS data", err);
        res.status(500).send("Internal Server Error.");
    }
});

router.get("/:busId/:date", async (req, res) => {
    const { busId, date } = req.params;

    if (!allowedBusInfos[busId]) {
        res.status(400).send("Bus ID not allowed.");
        return;
    }

    try {
        const db = getMongoClient().db(`bus_${busId}`);
        const collection = db.collection(date);
        const data = await collection.find().toArray();
        res.status(200).json(data);
    } catch (err) {
        console.error("Error fetching GPS data", err);
        res.status(500).send("Internal Server Error.");
    }
});

module.exports = { gpsRoutes: router };
