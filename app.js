const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
require('dotenv').config();

const { connectToMongoDB } = require("./mongoClient");
const { postToPage } = require("./facebookUtils");
const { findNearestStand } = require("./standUtils");
const { gpsRoutes } = require("./gpsRoutes");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT;

connectToMongoDB();

app.use("/locations", gpsRoutes);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});