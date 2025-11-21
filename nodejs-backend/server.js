const express = require('express');
const cors = require('cors');
const db = require('./bd'); // reutilizamos tu BD
const app = express();

app.use(cors());
app.use(express.json());

/**
 * GET /api/readings
 * Devuelve las últimas 100 lecturas como ejemplo
 */
app.get('/api/readings', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM readings
      ORDER BY ts DESC
      LIMIT 100
    `).all();

    const parsed = rows.map(r => ({
      id: r.id,
      ts: r.ts,
      topic: r.topic,
      data: JSON.parse(r.payload),
    }));

    res.json(parsed);
  } catch (err) {
    console.error("Error reading DB:", err);
    res.status(500).json({ error: "DB error" });
  }
});

/**
 * Ejemplo: GET /api/last
 * Devuelve la última lectura
 */
app.get('/api/last', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT * FROM readings ORDER BY ts DESC LIMIT 1
    `).get();

    if (!row) return res.json(null);

    res.json({
      id: row.id,
      ts: row.ts,
      topic: row.topic,
      data: JSON.parse(row.payload),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

app.listen(4000, () =>
  console.log("🚀 API backend running at http://localhost:4000")
);
