const { MongoClient } = require("mongodb");
require('dotenv').config();

const mongoUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.v4dkx.mongodb.net/`;
let mongoClient;

async function connectToMongoDB() {
    try {
        const client = await MongoClient.connect(mongoUrl);
        console.log("Connected to MongoDB");
        mongoClient = client;
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1);
    }
}

function getMongoClient() {
    return mongoClient;
}

module.exports = { connectToMongoDB, getMongoClient };