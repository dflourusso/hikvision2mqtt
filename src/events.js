require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { sendMqttEvent } = require("./mqtt");
const { EventParser } = require("./eventParser");

const app = express();

// Multer setup (memory storage since we don't need files)
const upload = multer({ storage: multer.memoryStorage() });

app.use((req, res, next) => {
  if (req.query?.token !== process.env.API_TOKEN) {
    console.log("❌ Invalid token");
    return res.status(401).send("Invalid token");
  }
  next();
});

// Middleware to parse multipart/form-data
app.post("/hikvision/events", upload.any(), (req, res) => {
  const rawJson = req.body.event_log;
  let parsedJson;

  try {
    parsedJson = JSON.parse(rawJson);
    const parsedEvent = EventParser(parsedJson);

    if (
      process.env.ONLY_KNOWN_EVENTS !== "true" ||
      parsedEvent.eventName !== "unknown"
    ) {
      sendMqttEvent(parsedEvent);
    }
  } catch (error) {
    console.error("❌ JSON Parse Error:", error);
    return res.status(400).send("Invalid JSON format");
  }

  res.status(200).send("Event Received");
});

module.exports = app;
