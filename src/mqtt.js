const mqtt = require("mqtt");

const mqttOptions = {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
};

const mqttClient = mqtt.connect(process.env.MQTT_URL, mqttOptions);

mqttClient.on("connect", () => {
  console.log("✅ MQTT connected:", process.env.MQTT_URL);
});

mqttClient.on("error", (err) => {
  console.error("❌ MQTT error:", err.message);
});

function sendMqttEvent(data) {
  mqttClient.publish(process.env.MQTT_PUBLISH_TOPIC, JSON.stringify(data), () => {
    console.log("📤 Event published to MQTT:", process.env.MQTT_PUBLISH_TOPIC, data);
  });
}

module.exports = { mqttClient, sendMqttEvent };
