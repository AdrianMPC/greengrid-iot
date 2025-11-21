const mqtt = require('mqtt');

// Configura tu broker
const client = mqtt.connect('mqtt://localhost:1883');

// Topic donde publicaremos
const TOPIC = 'greengrid/oficinas/data';

// Función para generar datos aleatorios estilo oficina
function generateRandomPayload() {
  const consumo = (30 + Math.random() * 40).toFixed(2);      // 30–70 kWh
  const solar = (5 + Math.random() * 15).toFixed(2);         // 5–20 kWh
  const bateria = Math.floor(40 + Math.random() * 40);       // 40–80 %
  const savings = Math.floor(5 + Math.random() * 20);        // 5–25 %

  return {
    edificio: "Oficina Central",
    timestamp: new Date().toISOString(),
    consumo_kwh: Number(consumo),
    solar_kwh: Number(solar),
    bateria_porcentaje: bateria,
    savings_percent: savings
  };
}

client.on('connect', () => {
  console.log("✅ Publisher conectado al broker MQTT");

  setInterval(() => {
    const payload = generateRandomPayload();
    const json = JSON.stringify(payload);

    client.publish(TOPIC, json, { qos: 0 }, (err) => {
      if (err) {
        console.error("❌ Error publicando:", err);
      } else {
        console.log(`📤 Enviado a ${TOPIC}:`, json);
      }
    });
  }, 3000); // envía cada 3 segundos
});

client.on('error', (err) => {
  console.error("❌ Error MQTT:", err);
});
