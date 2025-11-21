import { useState, useEffect } from "react";
import "./App.css";

// Valores iniciales por si el backend no responde
const initialSummaryData = {
  totalConsumption: 1250, // kWh hoy
  solarGeneration: 430,   // kWh hoy
  batteryCharge: 68,      // %
  savingsPercent: 23,     // % vs escenario sin optimización
};

const metersData = [
  { id: 1, name: "Medidor Principal", location: "Edificio A - Subestación", powerKw: 85.2, status: "online" },
  { id: 2, name: "Piso 7 - Oficinas", location: "Edificio A", powerKw: 21.4, status: "online" },
  { id: 3, name: "Piso 3 - Data Center", location: "Edificio A", powerKw: 42.7, status: "alerta" },
  { id: 4, name: "Estacionamiento", location: "Edificio B", powerKw: 12.1, status: "offline" },
];

const recommendationsData = [
  {
    id: 1,
    title: "Desplazar cargas no críticas a horario valle",
    impact: "Ahorro estimado 8%",
    detail: "Mover HVAC de áreas poco ocupadas y bombeo de agua entre 22:00 y 06:00.",
  },
  {
    id: 2,
    title: "Aprovechar mejor la generación solar",
    impact: "Ahorro estimado 5%",
    detail: "Incrementar carga de baterías al 90% durante pico solar (11:00 - 15:00).",
  },
  {
    id: 3,
    title: "Optimizar consumo en data center",
    impact: "Ahorro estimado 3%",
    detail: "Revisar configuración de enfriamiento en el piso 3; medidor en estado de alerta.",
  },
];

const scenariosData = [
  {
    id: "baseline",
    name: "Escenario actual",
    monthlyKwh: 12000,
    monthlyCost: 5400,
    solarUsePercent: 32,
    co2Tons: 4.8,
  },
  {
    id: "eco",
    name: "Modo ahorro agresivo",
    monthlyKwh: 9800,
    monthlyCost: 4350,
    solarUsePercent: 48,
    co2Tons: 3.6,
  },
  {
    id: "backup",
    name: "Operación con baterías (picos)",
    monthlyKwh: 10500,
    monthlyCost: 4650,
    solarUsePercent: 40,
    co2Tons: 4.0,
  },
];

function StatusBadge({ status }) {
  const labelMap = {
    online: "Online",
    offline: "Offline",
    alerta: "Alerta",
  };
  return <span className={`status-badge status-${status}`}>{labelMap[status] || status}</span>;
}

function SummaryCard({ label, value, suffix }) {
  return (
    <div className="card summary-card">
      <p className="summary-label">{label}</p>
      <p className="summary-value">
        {value}
        {suffix && <span className="summary-suffix"> {suffix}</span>}
      </p>
    </div>
  );
}

function ScenarioComparison({ scenarios }) {
  const [selectedId, setSelectedId] = useState("eco");

  const baseline = scenarios.find((s) => s.id === "baseline");
  const selected = scenarios.find((s) => s.id === selectedId);

  if (!baseline || !selected) return null;

  const deltaKwh = baseline.monthlyKwh - selected.monthlyKwh;
  const deltaCost = baseline.monthlyCost - selected.monthlyCost;
  const deltaCo2 = baseline.co2Tons - selected.co2Tons;

  return (
    <div className="card">
      <h2 className="card-title">Simulador de escenarios</h2>

      <div className="scenario-buttons">
        {scenarios.map((s) => (
          <button
            key={s.id}
            className={`scenario-btn ${s.id === selectedId ? "active" : ""}`}
            onClick={() => setSelectedId(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="scenario-grid">
        <div>
          <h3>Escenario actual</h3>
          <p><strong>{baseline.monthlyKwh.toLocaleString()} kWh/mes</strong></p>
          <p>S/ {baseline.monthlyCost.toLocaleString()}</p>
          <p>Uso solar: {baseline.solarUsePercent}%</p>
          <p>Huella CO₂: {baseline.co2Tons} t/mes</p>
        </div>
        <div>
          <h3>{selected.name}</h3>
          <p><strong>{selected.monthlyKwh.toLocaleString()} kWh/mes</strong></p>
          <p>S/ {selected.monthlyCost.toLocaleString()}</p>
          <p>Uso solar: {selected.solarUsePercent}%</p>
          <p>Huella CO₂: {selected.co2Tons} t/mes</p>
        </div>
        <div>
          <h3>Impacto estimado</h3>
          <p>
            Consumo:{" "}
            <strong className={deltaKwh > 0 ? "text-positive" : ""}>
              -{deltaKwh.toLocaleString()} kWh/mes
            </strong>
          </p>
          <p>
            Costo:{" "}
            <strong className={deltaCost > 0 ? "text-positive" : ""}>
              -S/ {deltaCost.toLocaleString()}
            </strong>
          </p>
          <p>
            CO₂:{" "}
            <strong className={deltaCo2 > 0 ? "text-positive" : ""}>
              -{deltaCo2.toFixed(1)} t/mes
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  // Estado que se alimenta desde el backend (solo oficina)
  const [summary, setSummary] = useState(initialSummaryData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const API_URL = "http://localhost:4000/api/last"; // ajusta si tu backend usa otra ruta

    async function fetchLastOffice() {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const payload = await res.json();
        // Si no hay datos aún, no rompemos la UI
        if (!payload || !payload.data) {
          setLoading(false);
          return;
        }

        const d = payload.data;

        // Mapeo desde tu JSON a los campos del summary
        setSummary((prev) => ({
          totalConsumption: d.consumo_kwh ?? prev.totalConsumption,
          solarGeneration: d.solar_kwh ?? prev.solarGeneration,
          batteryCharge: d.bateria_porcentaje ?? prev.batteryCharge,
          savingsPercent: d.savings_percent ?? prev.savingsPercent,
        }));

        setLoading(false);
        setError("");
      } catch (err) {
        console.error("Error cargando datos de oficina:", err);
        setError("No se pudo cargar datos de la oficina");
        setLoading(false);
      }
    }

    // Primera carga
    fetchLastOffice();
    // Actualización periódica cada 5s (casi tiempo real)
    const intervalId = setInterval(fetchLastOffice, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <h1>GreenGrid</h1>
          <p className="header-subtitle">
            Monitoreo y optimización energética para edificios inteligentes
          </p>
        </div>
        <span className="header-badge">
          {loading ? "Cargando datos de oficina..." : "Datos en vivo (oficina)"}
        </span>
      </header>

      {error && (
        <p style={{ color: "#f97373", fontSize: 12, marginBottom: 8 }}>
          {error}
        </p>
      )}

      <main className="app-main">
        {/* Columna izquierda */}
        <section className="main-column">
          <div className="summary-grid">
            <SummaryCard
              label="Consumo total (oficina - hoy)"
              value={summary.totalConsumption}
              suffix="kWh"
            />
            <SummaryCard
              label="Generación solar (hoy)"
              value={summary.solarGeneration}
              suffix="kWh"
            />
            <SummaryCard
              label="Carga de baterías"
              value={summary.batteryCharge}
              suffix="%"
            />
            <SummaryCard
              label="Ahorro vs. base"
              value={summary.savingsPercent}
              suffix="%"
            />
          </div>

          <div className="card">
            <h2 className="card-title">Medidores inteligentes</h2>
            <p className="card-subtitle">
              Estado en tiempo “casi” real (config demo)
            </p>
            <div className="meters-table">
              {metersData.map((m) => (
                <div key={m.id} className="meter-row">
                  <div className="meter-main">
                    <p className="meter-name">{m.name}</p>
                    <p className="meter-location">{m.location}</p>
                  </div>
                  <div className="meter-info">
                    <p className="meter-power">{m.powerKw.toFixed(1)} kW</p>
                    <StatusBadge status={m.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Columna derecha */}
        <section className="main-column">
          <div className="card">
            <h2 className="card-title">Recomendaciones de ahorro</h2>
            <ul className="reco-list">
              {recommendationsData.map((r) => (
                <li key={r.id} className="reco-item">
                  <div className="reco-header">
                    <p className="reco-title">{r.title}</p>
                    <span className="reco-impact">{r.impact}</span>
                  </div>
                  <p className="reco-detail">{r.detail}</p>
                </li>
              ))}
            </ul>
          </div>

          <ScenarioComparison scenarios={scenariosData} />
        </section>
      </main>
    </div>
  );
}

export default App;
