import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { nodes, edges } from "./data/graph";
import { findShortestPath } from "./lib/dijkstra";
import "./App.css";

const nodesById = new Map(nodes.map((node) => [node.id, node]));
const edgeCount = Math.round(
  Object.values(edges).reduce((total, list) => total + list.length, 0) / 2,
);
const nodesWithCoords = nodes.filter(
  (node) => typeof node.lat === "number" && typeof node.lng === "number",
);
const allCoords = nodesWithCoords.map((node) => [node.lat, node.lng]);

function centerFromCoords(coords) {
  if (!coords.length) {
    return [-15.99, -48.06];
  }

  const { lat, lng } = coords.reduce(
    (acc, [latValue, lngValue]) => ({
      lat: acc.lat + latValue,
      lng: acc.lng + lngValue,
    }),
    { lat: 0, lng: 0 },
  );

  return [lat / coords.length, lng / coords.length];
}

function buildEdgeSegments() {
  const seen = new Set();
  const segments = [];

  Object.entries(edges).forEach(([from, list]) => {
    list.forEach((edge) => {
      const key = [from, edge.to].sort().join("|");
      if (seen.has(key)) return;

      const fromNode = nodesById.get(from);
      const toNode = nodesById.get(edge.to);
      if (!fromNode || !toNode) return;
      if (fromNode.lat == null || toNode.lat == null) return;

      seen.add(key);
      segments.push([
        [fromNode.lat, fromNode.lng],
        [toNode.lat, toNode.lng],
      ]);
    });
  });

  return segments;
}

function MapFitBounds({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (!bounds?.length) return;

    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, bounds]);

  return null;
}

function formatKm(value) {
  return value.toFixed(2);
}

function formatCost(value) {
  return value.toFixed(2);
}

function App() {
  const [startId, setStartId] = useState(nodes[0]?.id ?? "");
  const [endId, setEndId] = useState(nodes[1]?.id ?? "");
  const [useTraffic, setUseTraffic] = useState(true);

  const route = useMemo(() => {
    if (!startId || !endId) {
      return { path: [], segments: [], totalDistance: 0, totalCost: 0 };
    }

    const weightFn = (edge) =>
      edge.distanceKm * (useTraffic ? edge.traffic : 1);
    const result = findShortestPath({ edges, startId, endId, weightFn });

    const segments = [];
    let totalDistance = 0;
    let totalCost = 0;

    for (let i = 0; i < result.path.length - 1; i += 1) {
      const from = result.path[i];
      const to = result.path[i + 1];
      const edge = edges[from]?.find((item) => item.to === to);

      if (!edge) continue;

      const cost = edge.distanceKm * (useTraffic ? edge.traffic : 1);
      totalDistance += edge.distanceKm;
      totalCost += cost;
      segments.push({
        from,
        to,
        distanceKm: edge.distanceKm,
        traffic: edge.traffic,
        cost,
      });
    }

    return {
      path: result.path,
      segments,
      totalDistance,
      totalCost,
    };
  }, [startId, endId, useTraffic]);

  const isSamePoint = startId === endId;
  const hasRoute = route.path.length > 1;
  const edgeSegments = useMemo(() => buildEdgeSegments(), []);
  const mapCenter = useMemo(() => centerFromCoords(allCoords), []);
  const pathCoords = useMemo(
    () =>
      route.path
        .map((nodeId) => {
          const node = nodesById.get(nodeId);
          if (!node || node.lat == null || node.lng == null) return null;
          return [node.lat, node.lng];
        })
        .filter(Boolean),
    [route.path],
  );
  const mapBounds = useMemo(
    () => (pathCoords.length > 1 ? pathCoords : allCoords),
    [pathCoords],
  );

  const handleSwap = () => {
    setStartId(endId);
    setEndId(startId);
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">RoutenPlaner</p>
          <h1>Traço de Rota - Gama</h1>
          <p className="subtitle">
            Escolha dois pontos do grafo e calcule a rota mais rapida. O trafego
            entra como peso opcional.
          </p>
          <div className="chip-row">
            <span className="chip">Dijkstra</span>
            <span className="chip">Grafo</span>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-stat">
            <span className="stat-label">Nós</span>
            <span className="stat-value">{nodes.length}</span>
          </div>
          <div className="hero-stat">
            <span className="stat-label">Arestas</span>
            <span className="stat-value">{edgeCount}</span>
          </div>
          <div className="hero-stat">
            <span className="stat-label">Peso</span>
            <span className="stat-value">
              {useTraffic ? "Distancia x trafego" : "Distancia"}
            </span>
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <div className="panel-head">
            <h2>Defina a rota</h2>
            <p className="panel-hint">Troque os pontos quando quiser.</p>
          </div>

          <div className="field">
            <label htmlFor="start">Origem</label>
            <select
              id="start"
              value={startId}
              onChange={(event) => setStartId(event.target.value)}
            >
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="end">Destino</label>
            <select
              id="end"
              value={endId}
              onChange={(event) => setEndId(event.target.value)}
            >
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </select>
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={useTraffic}
              onChange={(event) => setUseTraffic(event.target.checked)}
            />
            Usar fator de trafego
          </label>

          <button className="swap" type="button" onClick={handleSwap}>
            Inverter origem e destino
          </button>
        </section>

        <section className="panel panel-map">
          <div className="panel-head">
            <h2>Mapa</h2>
            <p className="panel-hint">Clique nos pontos para ver os nomes.</p>
          </div>
          <div className="map-shell">
            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom={false}
              className="map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {edgeSegments.map((segment, index) => (
                <Polyline
                  key={`edge-${index}`}
                  positions={segment}
                  pathOptions={{ color: "#c7c1b6", weight: 2, opacity: 0.75 }}
                />
              ))}
              {pathCoords.length > 1 && (
                <Polyline
                  positions={pathCoords}
                  pathOptions={{ color: "#1e8e7c", weight: 4 }}
                />
              )}
              {nodesWithCoords.map((node) => {
                const isStart = node.id === startId;
                const isEnd = node.id === endId;
                const color = isStart
                  ? "#1e8e7c"
                  : isEnd
                    ? "#f4a259"
                    : "#2f3133";
                const radius = isStart || isEnd ? 8 : 6;

                return (
                  <CircleMarker
                    key={node.id}
                    center={[node.lat, node.lng]}
                    radius={radius}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.9 }}
                  >
                    <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                      {node.label}
                    </Tooltip>
                  </CircleMarker>
                );
              })}
              <MapFitBounds bounds={mapBounds} />
            </MapContainer>
          </div>
        </section>

        <section className="panel panel-accent panel-route">
          <div className="panel-head">
            <h2>Melhor rota</h2>
            <span className="badge">
              {hasRoute ? `${route.path.length - 1} trechos` : "Sem rota"}
            </span>
          </div>

          {isSamePoint ? (
            <p className="empty">Origem e destino iguais.</p>
          ) : !hasRoute ? (
            <p className="empty">Nao foi possivel encontrar rota.</p>
          ) : (
            <>
              <ol className="path">
                {route.path.map((nodeId, index) => (
                  <li key={`${nodeId}-${index}`}>
                    <span className="dot" aria-hidden="true"></span>
                    <span className="path-label">
                      {nodesById.get(nodeId)?.label ?? nodeId}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="stats">
                <div>
                  <span className="stat-label">Distancia total</span>
                  <span className="stat-value">
                    {formatKm(route.totalDistance)} km
                  </span>
                </div>
                <div>
                  <span className="stat-label">Custo ponderado</span>
                  <span className="stat-value">
                    {formatCost(route.totalCost)}
                  </span>
                </div>
              </div>

              <div className="segments">
                {route.segments.map((segment, index) => (
                  <div className="segment" key={`${segment.from}-${index}`}>
                    <div className="segment-title">
                      {nodesById.get(segment.from)?.label ?? segment.from} -{" "}
                      {nodesById.get(segment.to)?.label ?? segment.to}
                    </div>
                    <div className="segment-meta">
                      <span>{formatKm(segment.distanceKm)} km</span>
                      <span>trafego {segment.traffic.toFixed(2)}</span>
                      <span>peso {formatCost(segment.cost)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
