require("dotenv").config();
const app = require("./events");
require("./sip");
const { mqttClient } = require("./mqtt");

const PORT = 3000;

// 🚀 Inicia o servidor HTTP
app.listen(PORT, () => {
  console.log(`📡 Hikvision Event Listener running on http://localhost:${PORT}`);
});

// ✅ Captura erros globais — garante reinício automático pelo Docker
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Promise Rejection:", reason);
  process.exit(1);
});

// ✅ Monitora MQTT — se perder conexão permanentemente, reinicia
mqttClient.on("error", (err) => {
  console.error("❌ MQTT error:", err.message);
  process.exit(1);
});

mqttClient.on("offline", () => {
  console.error("⚠️ MQTT client offline — restarting...");
  process.exit(1);
});

mqttClient.on("close", () => {
  console.error("⚠️ MQTT connection closed — restarting...");
  process.exit(1);
});
