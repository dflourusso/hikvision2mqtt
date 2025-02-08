require("dotenv").config();
const express = require('express');
const multer = require('multer');
const mqtt = require("mqtt");
const eventParser = require('./eventParser').EventParser

const app = express();
const PORT = 3000;

const mqttOptions = {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
};

const mqttClient = mqtt.connect(process.env.MQTT_URL, mqttOptions);

function sendMqttEvent(data) {
  mqttClient.publish(process.env.MQTT_PUBLISH_TOPIC, JSON.stringify(data), () => {
    console.log("Event published to MQTT");
  });
}

// Multer setup (memory storage since we don't need files)
const upload = multer({ storage: multer.memoryStorage() });

app.use((req, res, next) => {
  if (req.query?.token !== process.env.API_TOKEN) {
    return res.status(401).send('Invalid token');
  }
  next()
})

// Middleware to parse multipart/form-data
app.post('/hikvision/events', upload.any(), (req, res) => {
  const rawJson = req.body.event_log;
  let parsedJson;

  try {
    parsedJson = JSON.parse(rawJson);
    const parsedEvent = eventParser(parsedJson)
    if (process.env.ONLY_KNOWN_EVENTS !== 'true' || parsedEvent.eventName !== 'unknown') {
      sendMqttEvent(parsedEvent);
      console.log('🔹 Parsed Event:', parsedEvent);
    }
  } catch (error) {
    console.error('❌ JSON Parse Error:', error);
    return res.status(400).send('Invalid JSON format');
  }

  res.status(200).send('Event Received');
});

// Start the server
app.listen(PORT, () => {
  console.log(`📡 Hikvision Event Listener running on http://localhost:${PORT}`);
});
