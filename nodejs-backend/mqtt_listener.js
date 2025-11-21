// mqtt-listener.js
const mqtt = require('mqtt');
const db = require('./bd.js');

const client = mqtt.connect('mqtt://localhost:1883');
const TOPIC = 'greengrid/oficinas/data';

// Máximo de filas que quieres conservar (cache circular)
const MAX_ROWS = 5000;

const insertStmt = db.prepare(`
  INSERT INTO readings (topic, ts, payload)
  VALUES (@topic, @ts, @payload)
`);

const countStmt = db.prepare(`SELECT COUNT(*) as c FROM readings`);
const deleteOldStmt = db.prepare(`
  DELETE FROM readings
  WHERE id IN (
    SELECT id FROM readings
    ORDER BY ts ASC
    LIMIT ?
  );
`);

client.on('connect', () => {
  console.log('✅ MQTT conectado');
  client.subscribe(TOPIC);
});

client.on('message', (topic, message) => {
  const now = Date.now();
  const payloadStr = message.toString();

  insertStmt.run({
    topic,
    ts: now,
    payload: payloadStr,
  });

  // Hacer circular: si hay más de MAX_ROWS, borro los más antiguos
  const { c } = countStmt.get();
  if (c > MAX_ROWS) {
    const toDelete = c - MAX_ROWS;
    deleteOldStmt.run(toDelete);
  }

  console.log('💾 Guardado en cache:', topic, payloadStr);
});
